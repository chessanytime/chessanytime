import getpass
import os

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
    os.environ["COACH_PASSWORD"] = password
    os.environ.setdefault("PUZZLE_CSV_DIR", r"C:\test\convert")
    os.environ.setdefault("PUZZLE_OUTPUT_DIR", r"C:\test\convert\Book")
    os.environ.setdefault(
        "COACH_ALLOWED_ORIGINS",
        "https://chessanytime.github.io,https://chessanytime.com,https://www.chessanytime.com"
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
