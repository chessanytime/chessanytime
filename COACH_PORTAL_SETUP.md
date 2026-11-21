# Chess AnyTime Coach Portal - Local Python Service

The Coach Portal is hosted with the website, but puzzle processing happens on your Windows PC. The 62 Lichess CSV files are never uploaded to GitHub or to the website.

## Expected local folders

- CSV source folder: `C:\test\convert\`
- CSV files: `lichess_db_puzzle-1.csv` through `lichess_db_puzzle-62.csv`
- Generated PGN folder: `C:\test\convert\Book\`

The service also accepts `FEN` when a row does not contain `UFEN`.

## One-time setup

Open Command Prompt in the downloaded/cloned Chess AnyTime repository folder and run:

```bat
py -3 -m pip install -r requirements-coach.txt
```

## Start the local service

Run:

```bat
py -3 run_coach_service.py
```

Enter the coach username when prompted (default: `shubham`) and enter the password when prompted. Password input is hidden. The username comparison ignores capitalization; the password remains case-sensitive.

Keep the terminal window open while using the online Coach Portal. If Chrome asks whether Chess AnyTime may access your local network, allow it. The service listens only on `127.0.0.1` and does not expose a general-purpose shell or PowerShell command runner.

## Website connection / allowed origin

The local service allows the current GitHub Pages origin and the Chess AnyTime `.com` / `.io` origins by default. If the live website uses another origin, set `COACH_ALLOWED_ORIGINS` before starting the service to a comma-separated list of exact HTTPS origins, for example:

```bat
set COACH_ALLOWED_ORIGINS=https://your-domain.example
py -3 run_coach_service.py
```

If your site is served from another domain, add that exact origin. Do not use a wildcard for a private local service.

## What Generate PGN does

1. Checks that all 62 CSV files are present.
2. Reads files 1 to 62, preserving the original row order. This assumes the complete source database was sorted by `NbPlays` descending before it was split into the 62 files.
3. Applies the selected theme, rating range, maximum rating deviation, minimum popularity, maximum piece count and maximum FEN fullmove number.
4. Stops as soon as the requested number of valid, legal-solution puzzles has been found.
5. Converts UCI moves to SAN with `python-chess`.
6. Writes the PGN directly to the local Book folder.

Default filters mirror the supplied PowerShell example: rating 2250-2550, rating deviation at most 80, popularity at least 92, no more than 8 pieces, and fullmove number at most 10. Theme defaults to `fork`; count defaults to 10.

## Notes

- No Excel intermediate file is needed; the app writes PGN directly.
- If an individual matching row has an invalid FEN or illegal UCI solution, it is skipped and the search continues until the requested count is reached or the database ends.
- The coach session token is held in browser session storage and in the local service's memory. It expires after eight hours or when the service is restarted.
- The PGN is saved locally; it is not downloaded from the website.
