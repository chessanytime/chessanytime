# chessanytime
Official website of Chess AnyTime -

## Puzzle CSV library

Put Lichess puzzle `.csv` files in `excel` (any number of files is supported),
then run `python tools\build_puzzles.py` from the project folder before publishing.
The importer accepts `FEN` or `UFEN`, deduplicates puzzle IDs across files and
reports invalid rows. Required columns: `PuzzleId`, `FEN`/`UFEN`, `Moves`,
`Rating`, `Themes`. Excel can open CSVs, but `.xlsx` files must be exported as CSV.
`UFEN` is an already-prepared player-to-move position; standard Lichess `FEN`
includes the opponent's setup move, which is applied before play.

Publish `excel\manifest.json` and `excel\library` with the website. The browser
never downloads the original CSVs: practice loads small rating-indexed batches
only while the puzzle page is open. The five upcoming puzzles are an unordered
random selection, not a ranking. Wins select a slightly higher-rated puzzle;
the first incorrect legal move or Give up selects a lower-rated puzzle.
At the edge of the available library, the closest available puzzle is identified.

Practice requires Lichess login, starts near the player's puzzle rating and does
not change official Lichess ratings. The login token is held in this tab's
session storage for navigation and refresh, never in local storage or the CSVs;
log out to remove it. Practice-session progress is kept in memory.

## PGN study

Open `pgn.html` or Explore → PGN study. Choose multiple `.pgn` files; games
are parsed in a Web Worker and the left list is virtualised, with no fixed
file/game count limit. Browser memory is the practical limit. Files never
leave the browser. Add more files at any time, search by player/event/file,
and use Clear library to release memory without changing the originals.

Play mode waits for your main-line move and replies automatically for the
other side. Replay provides Previous/Next and clickable notation; Analysis
allows legal moves outside the PGN. Next moves can be revealed with an arrow.
Left/right arrow keys replay one half-move instantly outside text fields,
including during an automatic reply. Choose White
or Black in Play as; your chosen side is placed at the bottom and the other
side replies automatically. Flip board changes the view independently.
Focus board hides both side panels without unloading games. Pin board keeps
the centre visible while scrolling on larger screens; it can be switched off.
Board size adjusts the board from 80% to 200% of its fitted size, constrained
by the panel width. Focus board provides more width. Oversized boards use
page scrolling and automatically disable pinning; Fit screen restores the
viewport-fitted size.
On desktop, the side panels shrink as the board grows and expand as it shrinks.
The workspace uses four-pixel gaps. Once games load, the game list stays above
the import selector, moves stay above play controls, and both panels scroll
within the board's visible height. The PGN page uses a compact one-line footer.
Only the main line is used; variations stay in the source PGN and no chess
engine evaluation is claimed. Imported games are cleared on leaving the page.

## Board interactions

Click or tap a piece to show its legal destinations: dots for quiet moves and
rings for captures. Click the selected piece again to hide them. The Legal
moves checkbox remembers your display choice in this browser; it never changes
which moves are legal.

Right-click a square to mark it, or right-drag between squares to draw an arrow.
Repeat the same gesture to remove that mark, or left-click the board once to
clear all arrows and square marks and select a piece's legal moves.
Clear marks also removes all annotations. Replay and board flips retain manual
marks; a new game or puzzle clears them. Recorded moves highlight their source
and destination squares rather than adding automatic arrows.
