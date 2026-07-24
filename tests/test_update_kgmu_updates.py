import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from update_kgmu_updates import Item, START, END, dedupe, extract_dates, replace_block, render


class UpdateTests(unittest.TestCase):
    def test_dates_ignore_1970(self):
        values = extract_dates("21-07-2026 To 01-01-1970")
        self.assertEqual(values, [date(2026, 7, 21)])

    def test_exact_and_fuzzy_duplicates(self):
        items = [
            Item("Fee & Form Notice for MBBS", date(2026, 7, 2), "https://x/a", "notice", 0),
            Item("Fee and Form Notice for MBBS", date(2026, 7, 2), "https://x/b", "exam", 2),
            Item("Quotation Notice", date(2026, 7, 21), "https://x/c", "tender", 1),
        ]
        result = dedupe(items)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[1].source, "notice")

    def test_generic_titles_with_different_references_survive(self):
        items = [
            Item("Quotation Notice", date(2026, 7, 21), "https://x/a", "tender", 1, "A/1"),
            Item("Quotation Notice", date(2026, 7, 21), "https://x/b", "tender", 1, "B/2"),
        ]
        self.assertEqual(len(dedupe(items)), 2)

    def test_replace_preserves_outside_bytes(self):
        old = "BEFORE\n" + START + "\nold\n" + END + "\nAFTER\n"
        new = replace_block(old, START + "\nnew\n" + END)
        self.assertEqual(new, "BEFORE\n" + START + "\nnew\n" + END + "\nAFTER\n")

    def test_append_when_markers_absent(self):
        new = replace_block("BASE\n", START + "\nnew\n" + END)
        self.assertTrue(new.startswith("BASE\n"))
        self.assertEqual(new.count(START), 1)
        self.assertEqual(new.count(END), 1)

    def test_render_exactly_three(self):
        items = [
            Item(f"Item {i}", date(2026, 7, 20-i), f"https://x/{i}", "notice", 0)
            for i in range(3)
        ]
        block = render(items, date(2026, 7, 24))
        self.assertEqual(block.count("\n1. ["), 1)
        self.assertEqual(block.count("\n2. ["), 1)
        self.assertEqual(block.count("\n3. ["), 1)


if __name__ == "__main__":
    unittest.main()
