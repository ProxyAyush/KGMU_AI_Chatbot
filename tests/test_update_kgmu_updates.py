import json
import sys
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(
    0,
    str(
        Path(__file__).resolve().parents[1]
        / "scripts"
    ),
)

from update_kgmu_updates import (
    CATEGORY_ORDER,
    END,
    START,
    Item,
    archive_previous_snapshot,
    clean_inferred_title,
    create_snapshot,
    deduplicate,
    extract_dates,
    infer_title,
    normalize_text,
    render_prompt_block,
    replace_prompt_block,
    select_latest_by_category,
    selection_is_complete,
    useful_character_count,
    write_compact_json,
)


IST = ZoneInfo("Asia/Kolkata")


class UpdateTests(unittest.TestCase):
    def item(
        self,
        category: str,
        number: int,
        published: date | None = None,
        title: str | None = None,
        reference: str | None = None,
    ) -> Item:
        return Item(
            title=(
                title
                or f"{category.title()} item {number}"
            ),
            published=(
                published
                or date(
                    2026,
                    7,
                    24 - number,
                )
            ),
            url=(
                "https://example.test/"
                f"{category}/{number}.pdf"
            ),
            source=category,
            source_priority=(
                CATEGORY_ORDER.index(
                    category
                )
            ),
            notice_no=(
                reference
                or f"{category.upper()}/{number}"
            ),
        )

    def test_dates_ignore_1970(self):
        values = extract_dates(
            "21-07-2026 To 01-01-1970"
        )

        self.assertEqual(
            values,
            [date(2026, 7, 21)],
        )

    def test_hindi_normalization_preserves_devanagari(
        self,
    ):
        normalized = normalize_text(
            "परीक्षा सूचना — जुलाई 2026"
        )

        self.assertIn(
            "परीक्षा सूचना",
            normalized,
        )

        self.assertIn(
            "2026",
            normalized,
        )

    def test_mixed_language_normalization(
        self,
    ):
        normalized = normalize_text(
            "MBBS परीक्षा Notice 2026"
        )

        self.assertIn(
            "mbbs",
            normalized,
        )

        self.assertIn(
            "परीक्षा",
            normalized,
        )

    def test_hindi_characters_count_as_useful(
        self,
    ):
        self.assertGreater(
            useful_character_count(
                "एमबीबीएस परीक्षा कार्यक्रम"
            ),
            10,
        )

    def test_hindi_subject_title_is_extracted(
        self,
    ):
        text = (
            "किंग जॉर्ज चिकित्सा विश्वविद्यालय "
            "विषय: एमबीबीएस परीक्षा कार्यक्रम जुलाई 2026 "
            "दिनांक: 24-07-2026। "
            "सभी विद्यार्थियों को सूचित किया जाता है।"
        )

        title = infer_title(text)

        self.assertIn(
            "एमबीबीएस परीक्षा कार्यक्रम",
            title,
        )

    def test_mixed_hindi_english_title_is_extracted(
        self,
    ):
        text = (
            "विषय: MBBS Supplementary परीक्षा कार्यक्रम 2026 "
            "दिनांक: 24-07-2026।"
        )

        title = infer_title(text)

        self.assertIn(
            "MBBS Supplementary परीक्षा",
            title,
        )

    def test_hindi_action_title_is_extracted(
        self,
    ):
        text = (
            "चिकित्सा उपकरणों की खरीद एवं आपूर्ति हेतु "
            "निविदा आमंत्रित की जाती है।"
        )

        title = infer_title(text)

        self.assertTrue(
            "खरीद" in title
            or "आपूर्ति" in title
            or "निविदा" in title
        )

    def test_generic_titles_with_different_references_survive(
        self,
    ):
        items = [
            self.item(
                "tender",
                1,
                title="Quotation Notice",
                reference="A/1",
            ),
            self.item(
                "tender",
                2,
                title="Quotation Notice",
                reference="B/2",
            ),
        ]

        self.assertEqual(
            len(deduplicate(items)),
            2,
        )

    def test_hindi_generic_titles_with_different_references_survive(
        self,
    ):
        items = [
            self.item(
                "tender",
                1,
                title="निविदा सूचना",
                reference="क/1",
            ),
            self.item(
                "tender",
                2,
                title="निविदा सूचना",
                reference="ख/2",
            ),
        ]

        self.assertEqual(
            len(deduplicate(items)),
            2,
        )

    def test_latest_three_per_category(
        self,
    ):
        items = []

        for category in CATEGORY_ORDER:
            for number in range(1, 6):
                items.append(
                    self.item(
                        category,
                        number,
                    )
                )

        selected = select_latest_by_category(
            items
        )

        self.assertEqual(
            {
                category: len(
                    selected[category]
                )
                for category in CATEGORY_ORDER
            },
            {
                "tender": 3,
                "notice": 3,
                "exam": 3,
            },
        )

    def test_many_new_tenders_do_not_hide_other_categories(
        self,
    ):
        items = [
            self.item(
                "tender",
                number,
                date(2026, 7, 24),
            )
            for number in range(1, 11)
        ]

        items.extend(
            self.item(
                "notice",
                number,
            )
            for number in range(1, 4)
        )

        items.extend(
            self.item(
                "exam",
                number,
            )
            for number in range(1, 4)
        )

        selected = select_latest_by_category(
            items
        )

        self.assertEqual(
            len(selected["tender"]),
            3,
        )

        self.assertEqual(
            len(selected["notice"]),
            3,
        )

        self.assertEqual(
            len(selected["exam"]),
            3,
        )

    def test_incomplete_selection_is_rejected(
        self,
    ):
        selected = {
            "tender": [
                self.item(
                    "tender",
                    index,
                )
                for index in range(1, 4)
            ],
            "notice": [
                self.item(
                    "notice",
                    index,
                )
                for index in range(1, 4)
            ],
            "exam": [
                self.item(
                    "exam",
                    1,
                )
            ],
        }

        self.assertFalse(
            selection_is_complete(
                selected
            )
        )

    def test_render_contains_nine_entries(
        self,
    ):
        selected = {
            category: [
                self.item(
                    category,
                    index,
                )
                for index in range(1, 4)
            ]
            for category in CATEGORY_ORDER
        }

        block = render_prompt_block(
            selected,
            datetime(
                2026,
                7,
                24,
                18,
                0,
                tzinfo=IST,
            ),
        )

        self.assertEqual(
            block.count("\n1. "),
            3,
        )

        self.assertEqual(
            block.count("\n2. "),
            3,
        )

        self.assertEqual(
            block.count("\n3. "),
            3,
        )

        self.assertIn(
            "## LATEST TENDERS",
            block,
        )

        self.assertIn(
            "## LATEST GENERAL NOTICES",
            block,
        )

        self.assertIn(
            "## LATEST EXAMINATION NOTICES",
            block,
        )

    def test_render_preserves_hindi_title(
        self,
    ):
        selected = {
            "tender": [
                self.item(
                    "tender",
                    index,
                )
                for index in range(1, 4)
            ],
            "notice": [
                self.item(
                    "notice",
                    1,
                    title="छात्रवृत्ति आवेदन सूचना",
                ),
                self.item(
                    "notice",
                    2,
                ),
                self.item(
                    "notice",
                    3,
                ),
            ],
            "exam": [
                self.item(
                    "exam",
                    index,
                )
                for index in range(1, 4)
            ],
        }

        block = render_prompt_block(
            selected,
            datetime(
                2026,
                7,
                24,
                18,
                0,
                tzinfo=IST,
            ),
        )

        self.assertIn(
            "छात्रवृत्ति आवेदन सूचना",
            block,
        )

    def test_replace_preserves_outside_content(
        self,
    ):
        old = (
            "BEFORE\n"
            + START
            + "\nold\n"
            + END
            + "\nAFTER\n"
        )

        new = replace_prompt_block(
            old,
            START + "\nnew\n" + END,
        )

        self.assertEqual(
            new,
            (
                "BEFORE\n"
                + START
                + "\nnew\n"
                + END
                + "\nAFTER\n"
            ),
        )

    def test_noisy_english_ocr_title_is_shortened(
        self,
    ):
        noisy = (
            "Installation work of New RO/Water coolers, "
            "Iron Stand ete for various Department, "
            "KGMU, Lucknow, Kindly submit your "
            "Quotation/Estimate for providing the "
            "following work in sealed envelope to the "
            "undersigned in the interest of patient"
        )

        cleaned = clean_inferred_title(
            noisy
        )

        self.assertLessEqual(
            len(cleaned),
            120,
        )

        self.assertNotIn(
            "Kindly submit",
            cleaned,
        )

        self.assertNotIn(
            "sealed envelope",
            cleaned,
        )

    def test_noisy_hindi_ocr_title_is_cleaned(
        self,
    ):
        noisy = (
            "चिकित्सा उपकरणों की खरीद एवं आपूर्ति "
            "कृपया अपना कोटेशन सीलबंद लिफाफे में "
            "अधोहस्ताक्षरी को प्रस्तुत करें"
        )

        cleaned = clean_inferred_title(
            noisy
        )

        self.assertLessEqual(
            len(cleaned),
            120,
        )

        self.assertNotIn(
            "सीलबंद लिफाफे",
            cleaned,
        )

    def test_archive_previous_snapshot_uses_ist_timestamp(
        self,
    ):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            live = (
                root
                / "latest_updates.json"
            )

            live.write_text(
                '{"old":true}\n',
                encoding="utf-8",
            )

            archived = archive_previous_snapshot(
                live,
                root / "archive-live-data",
                datetime(
                    2026,
                    7,
                    24,
                    18,
                    0,
                    5,
                    tzinfo=IST,
                ),
            )

            self.assertIsNotNone(
                archived
            )

            self.assertEqual(
                archived.relative_to(
                    root
                ).as_posix(),
                (
                    "archive-live-data/"
                    "2026/07/24/"
                    "2026-07-24_18-00-05.json"
                ),
            )

            self.assertEqual(
                archived.read_text(
                    encoding="utf-8"
                ),
                '{"old":true}\n',
            )

    def test_first_run_has_no_archive(
        self,
    ):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            archived = archive_previous_snapshot(
                root / "missing.json",
                root / "archive-live-data",
                datetime(
                    2026,
                    7,
                    24,
                    6,
                    0,
                    tzinfo=IST,
                ),
            )

            self.assertIsNone(
                archived
            )

    def test_compact_json_preserves_hindi(
        self,
    ):
        selected = {
            "tender": [
                self.item(
                    "tender",
                    index,
                )
                for index in range(1, 4)
            ],
            "notice": [
                self.item(
                    "notice",
                    1,
                    title="छात्रवृत्ति आवेदन सूचना",
                ),
                self.item(
                    "notice",
                    2,
                ),
                self.item(
                    "notice",
                    3,
                ),
            ],
            "exam": [
                self.item(
                    "exam",
                    index,
                )
                for index in range(1, 4)
            ],
        }

        snapshot = create_snapshot(
            selected,
            datetime(
                2026,
                7,
                24,
                18,
                0,
                tzinfo=IST,
            ),
            [],
        )

        with tempfile.TemporaryDirectory() as directory:
            path = (
                Path(directory)
                / "latest_updates.json"
            )

            write_compact_json(
                path,
                snapshot,
            )

            content = path.read_text(
                encoding="utf-8"
            )

            self.assertEqual(
                len(content.splitlines()),
                1,
            )

            self.assertIn(
                "छात्रवृत्ति आवेदन सूचना",
                content,
            )

            self.assertNotIn(
                "\\u091b",
                content,
            )

            parsed = json.loads(
                content
            )

            self.assertEqual(
                len(parsed["tenders"]),
                3,
            )

            self.assertEqual(
                len(parsed["notices"]),
                3,
            )

            self.assertEqual(
                len(parsed["exam_notices"]),
                3,
            )


if __name__ == "__main__":
    unittest.main()
