import csv
from contextlib import closing
import hashlib
import json
import os
import re
import sqlite3
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "excel"
CHUNK_SIZE = 128


def valid_position(fen):
    fields = fen.split()
    if len(fields) != 6 or fields[1] not in ("w", "b"):
        return False
    ranks = fields[0].split("/")
    if len(ranks) != 8:
        return False
    for rank in ranks:
        if not re.fullmatch(r"[1-8prnbqkPRNBQK]+", rank):
            return False
        if sum(int(c) if c.isdigit() else 1 for c in rank) != 8:
            return False
    return (
        fields[0].count("K") == fields[0].count("k") == 1
        and bool(re.fullmatch(r"-|K?Q?k?q?", fields[2]))
        and bool(re.fullmatch(r"-|[a-h][36]", fields[3]))
        and fields[4].isdigit()
        and fields[5].isdigit()
        and int(fields[5]) > 0
    )


def build(source=SOURCE):
    source = Path(source).resolve()
    files = sorted(source.glob("*.csv"))
    if not files:
        raise ValueError(f"No CSV files found in {source}")
    digest = hashlib.sha256()
    digest.update(b"chessanytime-prepared-puzzles-v1")
    sources, rejected = [], 0
    with tempfile.TemporaryDirectory(prefix="chessanytime-puzzles-") as temporary, closing(sqlite3.connect(Path(temporary) / "puzzles.sqlite")) as db:
        db.execute("CREATE TABLE puzzles (id TEXT PRIMARY KEY, fen TEXT, moves TEXT, rating INTEGER, themes TEXT, setup INTEGER)")
        for file in files:
            digest.update(file.name.encode("utf-8"))
            with file.open("rb") as stream:
                while data := stream.read(1024 * 1024):
                    digest.update(data)
            accepted = duplicates = invalid = 0
            with file.open(encoding="utf-8-sig", newline="") as stream:
                reader = csv.DictReader(stream)
                required = {"PuzzleId", "Moves", "Rating", "Themes"}
                if not required.issubset(reader.fieldnames or []) or not {"FEN", "UFEN"}.intersection(reader.fieldnames or []):
                    raise ValueError(f"{file.name}: expected PuzzleId, FEN or UFEN, Moves, Rating and Themes columns")
                for row in reader:
                    puzzle_id = (row.get("PuzzleId") or "").strip()
                    fen = (row.get("UFEN") or row.get("FEN") or "").strip()
                    setup = not bool((row.get("UFEN") or "").strip())
                    moves = (row.get("Moves") or "").split()
                    rating = (row.get("Rating") or "").strip()
                    themes = " ".join((row.get("Themes") or "").split())
                    if (
                        not re.fullmatch(r"[A-Za-z0-9]{5,10}", puzzle_id)
                        or not rating.isdigit()
                        or not 0 <= int(rating) <= 4000
                        or not valid_position(fen)
                        or len(moves) < (2 if setup else 1)
                        or any(not re.fullmatch(r"[a-h][1-8][a-h][1-8][qrbn]?", move) for move in moves)
                        or len(themes) > 1000
                    ):
                        invalid += 1
                        continue
                    inserted = db.execute(
                        "INSERT OR IGNORE INTO puzzles VALUES (?,?,?,?,?,?)",
                        (puzzle_id, fen, " ".join(moves), int(rating), themes, int(setup)),
                    ).rowcount
                    accepted += inserted
                    duplicates += not inserted
            db.commit()
            rejected += invalid
            sources.append({"name": file.name, "puzzles": accepted, "duplicates": duplicates, "invalid": invalid})
        total = db.execute("SELECT COUNT(*) FROM puzzles").fetchone()[0]
        if not total:
            raise ValueError("No valid puzzles found; the previous library has not been changed")
        revision = digest.hexdigest()[:16]
        output = source / "library" / revision
        output.mkdir(parents=True, exist_ok=True)
        chunks, rows, bucket, sequence = [], [], None, 0

        def write_chunk():
            nonlocal rows, sequence
            if not rows:
                return
            name = f"{bucket:04d}-{sequence:04d}.json"
            (output / name).write_text(json.dumps(rows, separators=(",", ":")), encoding="utf-8")
            chunks.append({"file": f"{revision}/{name}", "count": len(rows), "min": rows[0][3], "max": rows[-1][3]})
            rows = []
            sequence += 1

        for row in db.execute("SELECT id,fen,moves,rating,themes,setup FROM puzzles ORDER BY rating,id"):
            row_bucket = row[3] // 100 * 100
            if row_bucket != bucket:
                write_chunk()
                bucket, sequence = row_bucket, 0
            rows.append(row)
            if len(rows) == CHUNK_SIZE:
                write_chunk()
        write_chunk()
    manifest = {"version": 1, "revision": revision, "total": total, "sources": sources, "chunks": chunks}
    temporary_manifest = source / "manifest.json.tmp"
    temporary_manifest.write_text(json.dumps(manifest, separators=(",", ":")), encoding="utf-8")
    os.replace(temporary_manifest, source / "manifest.json")
    print(f"Indexed {total:,} puzzles from {len(files)} CSV file(s) into {len(chunks)} small batches.")
    for item in sources:
        print(f"  {item['name']}: {item['puzzles']:,} new, {item['duplicates']:,} duplicate, {item['invalid']:,} invalid")
    if rejected:
        print(f"WARNING: {rejected:,} invalid rows were excluded. Correct these rows and rebuild to include them.")
    return manifest


if __name__ == "__main__":
    build()
