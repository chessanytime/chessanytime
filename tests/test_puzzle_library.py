import csv
import json
import tempfile
import unittest
from pathlib import Path

from tools.build_puzzles import build

FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


class PuzzleImportTests(unittest.TestCase):
    def write_csv(self, root, name, position_column, rows):
        with (root / name).open("w", encoding="utf-8", newline="") as stream:
            writer = csv.writer(stream)
            writer.writerow(["PuzzleId", position_column, "Moves", "Rating", "Themes"])
            writer.writerows(rows)

    def test_multiple_files_deduplicate_and_preserve_position_semantics(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write_csv(root, "prepared.csv", "UFEN", [
                ["Test1", FEN, "e2e4", 1500, "opening"],
                ["Bad01", "not a position", "e2e4", 1500, "opening"],
            ])
            self.write_csv(root, "raw.csv", "FEN", [
                ["Test1", FEN, "d2d4 d7d5", 1700, "opening"],
                ["Test2", FEN, "e2e4 e7e5", 1600, "opening"],
            ])
            manifest = build(root)
            self.assertEqual(manifest["total"], 2)
            self.assertEqual(sum(source["invalid"] for source in manifest["sources"]), 1)
            self.assertEqual(sum(source["duplicates"] for source in manifest["sources"]), 1)
            rows = []
            for chunk in manifest["chunks"]:
                rows.extend(json.loads((root / "library" / chunk["file"]).read_text()))
            self.assertEqual({row[0]: row[5] for row in rows}, {"Test1": 0, "Test2": 1})

    def test_batches_are_small_and_failed_rebuild_preserves_manifest(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write_csv(root, "games.csv", "UFEN", [
                [f"P{i:04}", FEN, "e2e4", 1500 + i % 80, "opening"] for i in range(260)
            ])
            manifest = build(root)
            self.assertEqual([chunk["count"] for chunk in manifest["chunks"]], [128, 128, 4])
            previous = (root / "manifest.json").read_bytes()
            (root / "broken.csv").write_text("wrong,columns\n1,2\n")
            with self.assertRaisesRegex(ValueError, "expected"):
                build(root)
            self.assertEqual((root / "manifest.json").read_bytes(), previous)


if __name__ == "__main__":
    unittest.main()
