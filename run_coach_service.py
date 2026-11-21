import getpass
import hashlib
import os
import secrets

def main():
    print("\nChess AnyTime - Local Coach Service")
    print("-----------------------------------")
    print("CSV folder:    C:\\test\\convert")
    print("Output folder: C:\\test\\convert\\Book")
    print("The 62 puzzle CSV files stay on this computer.\n")

    username = input("Coach username [shubham]: ").strip() or "shubham"
    password = getpass.getpass("Coach password (input hidden): ")
    if not password:
        print("A password is required. Nothing was started.")
        return

    os.environ["COACH_USERNAME"] = username
    salt = secrets.token_bytes(16)
    password_hash = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1).hex()
    os.environ["COACH_PASSWORD_HASH"] = password_hash
    os.environ["COACH_PASSWORD_SALT"] = salt.hex()
    del password
    os.environ.setdefault("PUZZLE_CSV_DIR", r"C:\test\convert")
    os.environ.setdefault("PUZZLE_OUTPUT_DIR", r"C:\test\convert\Book")
    os.environ.setdefault(
        "COACH_ALLOWED_ORIGINS",
        "https://chessanytime.github.io,https://chessanytime.com,https://www.chessanytime.com,https://chessanytime.io,https://www.chessanytime.io"
    )

    try:
        import uvicorn
    except ImportError:
        print("\nMissing packages. Install them with:")
        print("py -3 -m pip install -r requirements-coach.txt")
        return

    print("\nService ready at http://127.0.0.1:8765")
    print("Keep this window open while using the online Coach Portal.")
    print("Press Ctrl+C to stop the local service.\n")
    uvicorn.run("coach_service:app", host="127.0.0.1", port=8765, reload=False)

if __name__ == "__main__":
    main()
