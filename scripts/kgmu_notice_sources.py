"""KGMU unified notice-board parsing and selection helpers."""

from __future__ import annotations
from dataclasses import dataclass, replace
from datetime import date, datetime
import re
import unicodedata
from typing import Iterable, Sequence
from urllib.parse import urljoin, urlsplit, urlunsplit
from bs4 import BeautifulSoup

NOTICE_BOARD_URL = "https://www.kgmu.org/kgmu_notice_board.php"
FAILURE_MARKERS = (
    "max_user_connections", "connection failed", "access denied",
    "too many requests", "service unavailable", "temporarily unavailable",
    "database error", "captcha",
)
EXAM_KEYWORDS = (
    "examination", "exam notice", "fee & form", "fee and form",
    "regular exam", "supplementary exam", "exam scheme", "admit card",
    "scrutiny", "marksheet", "mbbs 3rd professional", "mbbs 3rd prof",
    "bmls", "b.sc. optometry", "radiotherapy technology", "pbt", "pcpndt",
    "परीक्षा", "परीक्षा शुल्क", "परीक्षा फॉर्म",
)
TENDER_KEYWORDS = (
    "tender", "quotation", "procurement", "proprietary", "single quotation",
    "bid", "supply of", "repairing", "servicing", "annual maintenance",
    "निविदा", "कोटेशन", "खरीद", "आपूर्ति", "मरम्मत",
)
DATE_FORMATS = (
    "%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y",
    "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d",
)
MONTH_DATE_RE = re.compile(
    r"\b(?:January|February|March|April|May|June|July|August|September|"
    r"October|November|December)\s+\d{1,2},\s+\d{4}\b", re.I
)
NUMERIC_DATE_RE = re.compile(r"\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b")
# Important: require "No/Number" or "Ref"; never match bare "Notice".
REF_RE = re.compile(
    r"(?:Notice\s*(?:No|Number)\.?|Ref(?:erence)?\.?\s*(?:No\.?)?)"
    r"\s*[:\-]{0,2}\s*([A-Za-z0-9][A-Za-z0-9 ./()_-]{1,80})",
    re.I,
)
EXAM_REF_RE = re.compile(r"(?:^|[/\s-])exam(?:ination)?(?:[/\s-]|$)", re.I)

@dataclass(frozen=True)
class ListingRecord:
    title: str
    url: str
    listing_date: date
    ref: str | None
    source_url: str
    source_position: int
    category: str = "notice"
    via: str = "listing"
    date_source: str = "listing"

    def to_json(self) -> dict[str, str]:
        out = {
            "date": self.listing_date.isoformat(), "title": self.title,
            "url": self.url, "via": self.via,
            "date_source": self.date_source, "source": self.source_url,
        }
        if self.ref:
            out["ref"] = self.ref
        return out

def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value or "")).strip()

def normalize_ref(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", "", normalize_space(value).casefold().replace("\\", "/")).strip(" ./-")

def normalize_url(value: str) -> str:
    p = urlsplit(value)
    return urlunsplit((p.scheme.casefold(), p.netloc.casefold(), re.sub(r"/+", "/", p.path), p.query, ""))

def normalize_title(value: str) -> str:
    return re.sub(r"[^0-9a-z\u0900-\u097f]+", " ", normalize_space(value).casefold()).strip()

def parse_date(value: str) -> date | None:
    value = normalize_space(value)
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None

def validate_listing_html(html: str, minimum_dates: int = 3) -> None:
    body = normalize_space(html).casefold()
    if len(body) < 500:
        raise ValueError(f"Suspiciously small listing response: {len(body)} chars")
    for marker in FAILURE_MARKERS:
        if marker in body:
            raise ValueError(f"Invalid KGMU response contains marker: {marker}")
    count = len(MONTH_DATE_RE.findall(html)) + len(NUMERIC_DATE_RE.findall(html))
    if count < minimum_dates:
        raise ValueError(f"Only {count} date-like listing records found")

def classify_record(title: str, ref: str | None = None) -> str:
    text = f"{normalize_space(title)} {normalize_space(ref or '')}".casefold()
    if EXAM_REF_RE.search(ref or "") or any(k in text for k in EXAM_KEYWORDS):
        return "exam"
    if any(k in text for k in TENDER_KEYWORDS):
        return "tender"
    return "notice"

def _extract_date(text: str) -> tuple[date | None, str | None]:
    match = MONTH_DATE_RE.search(text)
    if match:
        return parse_date(match.group(0)), match.group(0)
    for raw in NUMERIC_DATE_RE.findall(text):
        parsed = parse_date(raw)
        if parsed:
            return parsed, raw
    return None, None

def _extract_ref(text: str) -> str | None:
    match = REF_RE.search(text)
    if not match:
        return None
    raw = normalize_space(match.group(1))
    raw = re.split(
        r"\s+(?=(?:January|February|March|April|May|June|July|August|"
        r"September|October|November|December)\b)",
        raw,
        maxsplit=1,
        flags=re.I,
    )[0]
    # Stop at common markup-derived separators.
    raw = re.split(r"\s+(?:Date|Dated)\s*:", raw, maxsplit=1, flags=re.I)[0]
    return raw.strip(" :-") or None

def _containers(soup: BeautifulSoup) -> list:
    selectors = (".notice-item", ".notice-row", ".notice-list li", ".news-item", "article", "tr", "li")
    found, seen = [], set()
    for selector in selectors:
        for node in soup.select(selector):
            if id(node) in seen:
                continue
            text = normalize_space(node.get_text(" ", strip=True))
            if not text or not (MONTH_DATE_RE.search(text) or NUMERIC_DATE_RE.search(text)):
                continue
            if not node.find("a", href=True):
                continue
            seen.add(id(node))
            found.append(node)
    return found

def parse_unified_notice_board(html: str, source_url: str = NOTICE_BOARD_URL) -> list[ListingRecord]:
    validate_listing_html(html)
    soup = BeautifulSoup(html, "html.parser")
    records = []
    for position, node in enumerate(_containers(soup)):
        text = normalize_space(node.get_text(" ", strip=True))
        listing_date, raw_date = _extract_date(text)
        link = node.find("a", href=True)
        if not listing_date or not raw_date or not link:
            continue
        url = urljoin(source_url, link.get("href", "").strip())
        if not url.lower().startswith(("http://", "https://")):
            continue
        title = normalize_space(link.get_text(" ", strip=True))
        if title.casefold() in {"view", "view document", "download", "click here", "read more"}:
            title = normalize_space(REF_RE.sub(" ", text.replace(raw_date, " ")))
        ref = _extract_ref(text)
        records.append(ListingRecord(
            title=title, url=url, listing_date=listing_date, ref=ref,
            source_url="notice-board", source_position=position,
            category=classify_record(title, ref),
        ))
    if len(records) < 3:
        raise ValueError(f"Parsed only {len(records)} valid notice-board records")
    return records

def title_is_low_quality(title: str) -> bool:
    text = normalize_space(title)
    words = re.findall(r"[A-Za-z\u0900-\u097F]+", text)
    if len(words) < 4:
        return True
    lowered = text.casefold()
    if any(x in lowered for x in (
        "mit your the following work in", "following work in",
        "the following work", "submit your the following",
    )):
        return True
    return bool(text and text[0].islower())

def safe_title(record: ListingRecord) -> ListingRecord:
    if not title_is_low_quality(record.title):
        return record
    title = f"Quotation Notice — Ref. {record.ref}" if record.ref else "KGMU Tender/Quotation Notice"
    return replace(record, title=title)

def _quality(record: ListingRecord) -> tuple[int, int, int, int, int]:
    return (
        int(record.date_source == "listing"),
        int(not title_is_low_quality(record.title)),
        int(bool(normalize_ref(record.ref))),
        int(record.source_url == "notice-board"),
        int(record.url.startswith("https://") and "kgmu" in record.url.casefold()),
    )

def _key(record: ListingRecord) -> tuple[str, ...]:
    if normalize_ref(record.ref):
        return ("ref", normalize_ref(record.ref))
    if normalize_url(record.url):
        return ("url", normalize_url(record.url))
    return ("title-date", normalize_title(record.title), record.listing_date.isoformat())

def deduplicate_records(records: Iterable[ListingRecord]) -> list[ListingRecord]:
    chosen = {}
    for record in records:
        key = _key(record)
        if key not in chosen or _quality(record) > _quality(chosen[key]):
            chosen[key] = record
    return list(chosen.values())

def select_latest(records: Sequence[ListingRecord], category: str, limit: int = 3) -> list[ListingRecord]:
    candidates = deduplicate_records(r for r in records if r.category == category)
    candidates.sort(key=lambda r: r.source_position)
    candidates.sort(key=lambda r: r.listing_date, reverse=True)
    selected = candidates[:limit]
    if len(selected) != limit:
        raise ValueError(f"Need exactly {limit} {category} records, got {len(selected)}")
    return [safe_title(r) for r in selected] if category == "tender" else selected

def validate_freshness(selected: Sequence[ListingRecord], candidates: Sequence[ListingRecord], category: str) -> None:
    relevant = [r for r in candidates if r.category == category]
    if relevant and max(r.listing_date for r in selected) < max(r.listing_date for r in relevant):
        raise ValueError(f"{category} selection is stale")

def group_unified_records(records: Sequence[ListingRecord]) -> dict[str, list[ListingRecord]]:
    out = {"tender": [], "notice": [], "exam": []}
    for record in records:
        out[record.category].append(record)
    return out
