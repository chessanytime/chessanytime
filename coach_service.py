from __future__ import annotations

import csv
import hashlib
import hmac
import os
import re
import secrets
import time
from pathlib import Path
from typing import Optional

import chess
import chess.pgn
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CSV_DIR = Path(os.environ.get("PUZZLE_CSV_DIR", r"C:\test\convert")).expanduser()
OUTPUT_DIR = Path(os.environ.get("PUZZLE_OUTPUT_DIR", r"C:\test\convert\Book")).expanduser()
EXPECTED_USERNAME = os.environ.get("COACH_USERNAME", "shubham").casefold()
COACH_PASSWORD_HASH = os.environ.get("COACH_PASSWORD_HASH", "")
COACH_PASSWORD_SALT = os.environ.get("COACH_PASSWORD_SALT", "")
SESSION_SECONDS = 8 * 60 * 60
FILE_COUNT = 62

DEFAULT_ORIGINS = [
    "https://chessanytime.github.io",
    "https://chessanytime.com",
    "https://www.chessanytime.com",
    "https://chessanytime.io",
    "https://www.chessanytime.io",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]
ALLOWED_ORIGINS = [
    item.strip()
    for item in os.environ.get("COACH_ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if item.strip()
]

app = FastAPI(title="Chess AnyTime Local Coach Service", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    allow_private_network=True,
)

# Tokens exist only in memory and expire automatically.
SESSIONS: dict[str, float] = {}


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class GenerateRequest(BaseModel):
    theme: str = Field(default="", max_length=80)
    count: int = Field(default=10, ge=1, le=5000)
    min_rating: int = Field(default=2250, ge=0, le=4000)
    max_rating: int = Field(default=2550, ge=0, le=4000)
    max_rating_deviation: int = Field(default=80, ge=0, le=1000)
    min_popularity: int = Field(default=92, ge=0, le=100)
    max_pieces: int = Field(default=8, ge=2, le=32)
    max_fullmove: int = Field(default=10, ge=1, le=500)
    output_filename: str = Field(default="ChessAnyTime_Puzzles.pgn", min_length=1, max_length=100)


def require_coach(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Please log in again.")
    token = authorization[7:].strip()
    expiry = SESSIONS.get(token)
    if not expiry or expiry < time.time():
        SESSIONS.pop(token, None)
        raise HTTPException(status_code=401, detail="Your coach session has expired. Please log in again.")
    return token


def as_int(value: object) -> Optional[int]:
    try:
        if value is None or str(value).strip() == "":
            return None
        return int(float(str(value).strip()))
    except (TypeError, ValueError, OverflowError):
        return None


def puzzle_fen(row: dict[str, str]) -> str:
    # The working scripts use UFEN. Accept FEN as a fallback for raw Lichess CSVs.
    return (row.get("UFEN") or row.get("FEN") or "").strip()


def count_pieces(fen: str) -> int:
    placement = fen.split()[0]
    return sum(char in "rnbqkpRNBQKP" for char in placement)


def make_pgn_entry(row: dict[str, str], exercise_number: int) -> str:
    fen = puzzle_fen(row)
    board = chess.Board(fen)
    raw_moves = (row.get("Moves") or "").strip().split()
    if not raw_moves:
        raise ValueError("No solution moves")

    game = chess.pgn.Game()
    game.setup(board)
    game.headers.pop("Event", None)
    game.headers["Site"] = (row.get("GameUrl") or "?").strip() or "?"
    game.headers["Tournament"] = (row.get("OpeningTags") or "Unknown").strip() or "Unknown"
    game.headers["Date"] = "2025"
    game.headers["Round"] = "?"
    side_field = "White_to_Play" if board.turn == chess.WHITE else "Black_to_Play"
    game.headers["White"] = f"Exercise {exercise_number} {{{side_field}}}"
    game.headers["Black"] = ""
    game.headers["Result"] = "*"
    game.headers["FEN"] = fen
    game.headers["SetUp"] = "1"
    game.comment = game.headers["Site"]

    node = game
    for uci in raw_moves:
        move = chess.Move.from_uci(uci)
        if move not in board.legal_moves:
            raise ValueError(f"Illegal solution move: {uci}")
        node = node.add_variation(move)
        board.push(move)

    exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=True)
    return game.accept(exporter)


def safe_output_name(name: str) -> str:
    cleaned = Path(name.replace("\\", "/")).name
    cleaned = re.sub(r"[^A-Za-z0-9 _().-]", "_", cleaned).strip(" .")
    if not cleaned:
        cleaned = "ChessAnyTime_Puzzles.pgn"
    if not cleaned.lower().endswith(".pgn"):
        cleaned += ".pgn"
    return cleaned[:100]


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "csv_directory_exists": CSV_DIR.is_dir(),
        "output_directory": str(OUTPUT_DIR),
    }


@app.post("/api/login")
def login(payload: LoginRequest):
    if not COACH_PASSWORD_HASH or not COACH_PASSWORD_SALT:
        raise HTTPException(status_code=503, detail="Coach password is not configured. Restart the local service and enter it when prompted.")
    username_ok = hmac.compare_digest(payload.username.casefold(), EXPECTED_USERNAME)
    candidate_hash = hashlib.scrypt(payload.password.encode("utf-8"), salt=bytes.fromhex(COACH_PASSWORD_SALT), n=2**14, r=8, p=1).hex()
    password_ok = hmac.compare_digest(candidate_hash, COACH_PASSWORD_HASH)
    if not (username_ok and password_ok):
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = time.time() + SESSION_SECONDS
    return {"token": token, "expires_in": SESSION_SECONDS}


@app.post("/api/logout")
def logout(token: str = Depends(require_coach)):
    SESSIONS.pop(token, None)
    return {"ok": True}


@app.post("/api/generate-pgn")
def generate_pgn(payload: GenerateRequest, token: str = Depends(require_coach)):
    if payload.min_rating > payload.max_rating:
        raise HTTPException(status_code=400, detail="Minimum rating cannot exceed maximum rating.")
    if not CSV_DIR.is_dir():
        raise HTTPException(status_code=400, detail=f"Puzzle CSV folder not found: {CSV_DIR}")

    missing = [f"lichess_db_puzzle-{i}.csv" for i in range(1, FILE_COUNT + 1)
               if not (CSV_DIR / f"lichess_db_puzzle-{i}.csv").is_file()]
    if missing:
        preview = ", ".join(missing[:5])
        suffix = " ..." if len(missing) > 5 else ""
        raise HTTPException(status_code=400, detail=f"Missing {len(missing)} of the 62 CSV files in {CSV_DIR}: {preview}{suffix}")

    theme_pattern = re.compile(re.escape(payload.theme.strip()), re.IGNORECASE) if payload.theme.strip() else None
    selected: list[str] = []
    rows_scanned = 0
    files_scanned = 0
    invalid_solutions = 0
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Files were split after sorting the complete source database by NbPlays descending.
    # Reading files 1..62 and rows top-to-bottom therefore preserves that order.
    for file_number in range(1, FILE_COUNT + 1):
        csv_path = CSV_DIR / f"lichess_db_puzzle-{file_number}.csv"
        files_scanned += 1
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                continue
            for row in reader:
                rows_scanned += 1
                themes = row.get("Themes") or ""
                if theme_pattern and not theme_pattern.search(themes):
                    continue

                rating = as_int(row.get("Rating"))
                deviation = as_int(row.get("RatingDeviation"))
                popularity = as_int(row.get("Popularity"))
                if rating is None or not payload.min_rating <= rating <= payload.max_rating:
                    continue
                if deviation is None or deviation > payload.max_rating_deviation:
                    continue
                if popularity is None or popularity < payload.min_popularity:
                    continue

                fen = puzzle_fen(row)
                parts = fen.split()
                if len(parts) < 6:
                    continue
                try:
                    if count_pieces(fen) > payload.max_pieces:
                        continue
                    if int(parts[-1]) > payload.max_fullmove:
                        continue
                except (ValueError, IndexError):
                    continue

                try:
                    entry = make_pgn_entry(row, len(selected) + 1)
                except (ValueError, TypeError, chess.InvalidMoveError, chess.IllegalMoveError):
                    invalid_solutions += 1
                    continue

                selected.append(entry)
                if len(selected) >= payload.count:
                    break
        if len(selected) >= payload.count:
            break

    if not selected:
        raise HTTPException(
            status_code=404,
            detail=f"No valid puzzles matched these filters. Scanned {rows_scanned:,} rows across {files_scanned} files."
        )

    filename = safe_output_name(payload.output_filename)
    output_path = OUTPUT_DIR / filename
    temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
    try:
        with temporary_path.open("w", encoding="utf-8", newline="\n") as output:
            output.write("\n\n".join(selected))
            output.write("\n\n")
        temporary_path.replace(output_path)
    except OSError as exc:
        temporary_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Could not save PGN: {exc}") from exc

    return {
        "success": True,
        "puzzles_created": len(selected),
        "requested": payload.count,
        "files_scanned": files_scanned,
        "rows_scanned": rows_scanned,
        "invalid_solutions_skipped": invalid_solutions,
        "output_file": str(output_path),
        "filename": filename,
    }
