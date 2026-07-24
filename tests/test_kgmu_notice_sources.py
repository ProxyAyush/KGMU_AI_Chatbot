from datetime import date
from pathlib import Path
import sys, unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.kgmu_notice_sources import *

class Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        html = (ROOT/"tests/fixtures/kgmu_notice_board_2026.html").read_text(encoding="utf-8")
        cls.records = parse_unified_notice_board(html)

    def test_count(self): self.assertEqual(len(self.records), 10)
    def test_visible_date_wins(self):
        r=next(x for x in self.records if "Short Term Recruitment" in x.title)
        self.assertEqual(r.listing_date, date(2026,7,10))
    def test_general(self):
        selected=select_latest(self.records,"notice")
        self.assertEqual([x.listing_date.isoformat() for x in selected],["2026-07-16","2026-07-10","2026-07-06"])
    def test_exam(self):
        selected=select_latest(self.records,"exam")
        self.assertEqual([x.ref for x in selected],["385/Exam/General/2026","384 Exam/General/2026","383/Exam/General/2026"])
    def test_exam_dates(self):
        self.assertEqual([x.listing_date.isoformat() for x in select_latest(self.records,"exam")],["2026-07-02"]*3)
    def test_exam_order(self):
        self.assertEqual([x.ref.split()[0].split("/")[0] for x in select_latest(self.records,"exam")],["385","384","383"])
    def test_admission_general(self):
        self.assertEqual(next(x for x in self.records if "Bachelor" in x.title).category,"notice")
    def test_workshop_general(self):
        self.assertEqual(next(x for x in self.records if "Cochrane" in x.title).category,"notice")
    def test_exam_classification(self):
        self.assertEqual(classify_record("Partial modification","365/Exam/General/2026"),"exam")
    def test_error_page(self):
        with self.assertRaises(ValueError): validate_listing_html("<html>"+"x"*600+" max_user_connections</html>")
    def test_tiny_page(self):
        with self.assertRaises(ValueError): validate_listing_html("<html>blocked</html>")
    def test_ocr_fallback(self):
        r=ListingRecord("mit your the following work in","https://kgmu.org/x.pdf",date(2026,7,22),"653/EE/26","tender-page",0,"tender","ocr")
        self.assertEqual(safe_title(r).title,"Quotation Notice — Ref. 653/EE/26")
    def test_dedupe_prefers_listing(self):
        current=next(x for x in self.records if x.ref=="385/Exam/General/2026")
        old=ListingRecord("Old","https://kgmu.org/old.pdf",date(2025,11,26),current.ref,"exam-page",0,"exam","pdf","pdf")
        result=deduplicate_records([old,current])
        self.assertEqual(result[0].listing_date,date(2026,7,2))

if __name__=="__main__": unittest.main()
