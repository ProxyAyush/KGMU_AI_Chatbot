#!/usr/bin/env python3
import json, sys
from pathlib import Path
from urllib.parse import urlparse

p = Path(sys.argv[1] if len(sys.argv) > 1 else "latest_updates.json")
d = json.loads(p.read_text(encoding="utf-8"))

SECTIONS = {"tenders": True, "notices": False, "exam_notices": True}

for section, require_ref in SECTIONS.items():
    assert section in d, f"Missing section: {section}"
    items = d[section]
    assert len(items) == 3, f"{section} must have exactly 3 items, got {len(items)}"

    seen = set()
    prev_date = None
    for item in items:
        assert item.get("date"), f"Missing date in {section}"
        title = item.get("title")
        assert title, f"Missing title in {section}"
        url = item.get("url", "")
        assert url, f"Missing url in {section}"
        parsed = urlparse(url)
        assert parsed.scheme == "https", f"Bad scheme in {section}: {url}"
        assert parsed.netloc == "www.kgmu.org", f"Bad domain in {section}: {url}"
        if require_ref:
            assert item.get("ref"), f"Missing ref in {section}: {title}"
        key = (item["date"], title, url)
        assert key not in seen, f"Duplicate record in {section}: {key}"
        seen.add(key)
        if prev_date is not None:
            item_date = item["date"]
            assert item_date <= prev_date, f"{section} not sorted newest-first near {item_date}"
        prev_date = item["date"]

print("PASS: complete, current and correctly classified")

