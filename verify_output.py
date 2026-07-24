#!/usr/bin/env python3
from pathlib import Path
import json, sys
p=Path(sys.argv[1] if len(sys.argv)>1 else "latest_updates.json")
d=json.loads(p.read_text(encoding="utf-8"))
assert len(d["tenders"])==3
assert len(d["notices"])==3
assert len(d["exam_notices"])==3
assert [x.get("ref") for x in d["exam_notices"]]==["385/Exam/General/2026","384 Exam/General/2026","383/Exam/General/2026"]
assert [x["date"] for x in d["exam_notices"]]==["2026-07-02"]*3
assert [x["date"] for x in d["notices"]]==["2026-07-16","2026-07-10","2026-07-06"]
assert all("mit your the following work in" not in x["title"].casefold() for x in d["tenders"])
print("PASS: complete, current and correctly classified")
