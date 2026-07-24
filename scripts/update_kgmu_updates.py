#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from dataclasses import dataclass, replace
from datetime import date, datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


BASE = "https://www.kgmu.org/"

SOURCES = (
    ("notice", urljoin(BASE, "kgmu_notice_board.php"), 0),
    ("tender", urljoin(BASE, "tenders.php"), 1),
    ("exam", urljoin(BASE, "exam_notice.php"), 2),
)

HOMEPAGE = BASE

START = "<!-- AUTO_KGMU_UPDATES_START -->"
END = "<!-- AUTO_KGMU_UPDATES_END -->"

CATEGORY_ORDER = (
    "tender",
    "notice",
    "exam",
)

CATEGORY_LABELS = {
    "tender": "LATEST TENDERS",
    "notice": "LATEST GENERAL NOTICES",
    "exam": "LATEST EXAMINATION NOTICES",
}

GENERIC_TITLES = {
    "quotation notice",
    "tender notice",
    "notice",
    "download",
    "view",
    "click here",
    "pdf",
    "कोटेशन नोटिस",
    "निविदा सूचना",
    "सूचना",
    "डाउनलोड",
}

USER_AGENT = (
    "KGMU-AI-Chatbot-Notice-Updater/4.0 "
    "(+https://github.com/ProxyAyush/KGMU_AI_Chatbot)"
)

MAX_DOCUMENT_BYTES = 15 * 1024 * 1024
MAX_TITLE_LENGTH = 120
MAX_PDF_PAGES = 2
MAX_OCR_DOCUMENTS = 30

IST = ZoneInfo("Asia/Kolkata")


@dataclass(frozen=True)
class Item:
    title: str
    published: date
    url: str
    source: str
    source_priority: int
    notice_no: str = ""
    extraction: str = "listing"

    @property
    def key(self) -> str:
        title_key = normalize_text(self.title)
        reference_key = normalize_text(self.notice_no)

        generic_keys = {
            normalize_text(value)
            for value in GENERIC_TITLES
        }

        if title_key in generic_keys and reference_key:
            return f"{title_key} {reference_key}"

        return title_key


def clean_text(value: str | None) -> str:
    return re.sub(
        r"\s+",
        " ",
        html.unescape(value or ""),
    ).strip(" \t\r\n-|")


def normalize_text(value: str | None) -> str:
    """
    Unicode-safe normalization.

    This preserves Hindi/Devanagari characters instead of deleting every
    character outside a-z.
    """
    text = unicodedata.normalize(
        "NFKC",
        clean_text(value),
    ).casefold()

    text = "".join(
        character
        if (
            character.isalnum()
            or unicodedata.category(character).startswith("M")
        )
        else " "
        for character in text
    )

    return re.sub(
        r"\s+",
        " ",
        text,
    ).strip()


def canonical_url(
    value: str,
    base_url: str,
) -> str:
    parsed = urlsplit(
        urljoin(base_url, value)
    )

    return urlunsplit(
        (
            "https",
            parsed.netloc.lower(),
            parsed.path,
            parsed.query,
            "",
        )
    )


def extract_dates(text: str) -> list[date]:
    found: list[date] = []

    patterns = (
        r"\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b",
        r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b",
    )

    for pattern_index, pattern in enumerate(patterns):
        for parts in re.findall(pattern, text):
            try:
                if pattern_index == 0:
                    day, month, year = map(int, parts)
                else:
                    year, month, day = map(int, parts)

                parsed = date(
                    year,
                    month,
                    day,
                )
            except ValueError:
                continue

            if parsed != date(1970, 1, 1):
                found.append(parsed)

    return found


def best_date(
    text: str,
    today: date | None = None,
) -> date | None:
    today = today or date.today()

    return next(
        (
            parsed
            for parsed in extract_dates(text)
            if date(2000, 1, 1) <= parsed <= today
        ),
        None,
    )


def build_session() -> requests.Session:
    session = requests.Session()

    retries = Retry(
        total=3,
        connect=3,
        read=2,
        status=2,
        backoff_factor=0.8,
        status_forcelist=(
            429,
            500,
            502,
            503,
            504,
        ),
        allowed_methods=frozenset({"GET"}),
    )

    session.mount(
        "https://",
        HTTPAdapter(max_retries=retries),
    )

    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;"
                "q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
            "Cache-Control": "max-age=0",
            "Referer": "https://www.kgmu.org/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }
    )

    return session


def fetch_html(
    session: requests.Session,
    url: str,
) -> str:
    import time
    last_response_text = ""
    for attempt in range(3):
        try:
            response = session.get(
                url,
                timeout=(15, 45),
            )
            response.raise_for_status()
            response.encoding = (
                response.apparent_encoding
                or "utf-8"
            )
            last_response_text = response.text
            if len(last_response_text) >= 500:
                return last_response_text
        except Exception:
            if attempt == 2:
                raise
        time.sleep(2)
    return last_response_text


def extract_reference(
    text: str,
    cells: list[str],
    source: str,
) -> str:
    if source == "tender" and len(cells) >= 2:
        candidate = clean_text(cells[1])

        if candidate:
            return candidate

    match = re.search(
        (
            r"(?:Notice\s*No\.?|Reference|Ref\.?|"
            r"Letter\s*No\.?|पत्रांक|पत्र\s*संख्या|"
            r"संदर्भ\s*संख्या|सूचना\s*संख्या)"
            r"\s*[:\-–—]?\s*"
            r"([A-Za-z0-9\u0900-\u097F/()._-]+)"
        ),
        text,
        re.I,
    )

    return (
        clean_text(match.group(1))
        if match
        else ""
    )


def parse_listing(
    page: str,
    source: str,
    source_url: str,
    priority: int,
    today: date | None = None,
) -> list[Item]:
    soup = BeautifulSoup(
        page,
        "html.parser",
    )

    items: list[Item] = []

    selectors = (
        "tr, li, .notice, .news, .news-item"
    )

    for row in soup.select(selectors):
        row_text = clean_text(
            row.get_text(
                " ",
                strip=True,
            )
        )

        published = best_date(
            row_text,
            today=today,
        )

        if not published:
            continue

        links = row.select("a[href]")

        link = next(
            (
                candidate
                for candidate in links
                if clean_text(
                    candidate.get_text(
                        " ",
                        strip=True,
                    )
                )
            ),
            None,
        )

        if not link:
            continue

        title = clean_text(
            link.get_text(
                " ",
                strip=True,
            )
        )

        cells = [
            clean_text(
                cell.get_text(
                    " ",
                    strip=True,
                )
            )
            for cell in row.select("td")
        ]

        reference = extract_reference(
            row_text,
            cells,
            source,
        )

        if len(title) < 4:
            title = row_text

        items.append(
            Item(
                title=title,
                published=published,
                url=canonical_url(
                    link.get("href", ""),
                    source_url,
                ),
                source=source,
                source_priority=priority,
                notice_no=reference,
            )
        )

    return items


def run_command(
    arguments: list[str],
    timeout: int,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        arguments,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout,
        check=False,
    )


def download_document(
    session: requests.Session,
    url: str,
    destination: Path,
) -> None:
    with session.get(
        url,
        timeout=(12, 50),
        stream=True,
        allow_redirects=True,
    ) as response:
        response.raise_for_status()

        content_type = (
            response.headers.get(
                "content-type"
            )
            or ""
        ).lower()

        total = 0

        with destination.open("wb") as handle:
            for chunk in response.iter_content(
                65536
            ):
                if not chunk:
                    continue

                total += len(chunk)

                if total > MAX_DOCUMENT_BYTES:
                    raise ValueError(
                        "document exceeds 15 MB"
                    )

                handle.write(chunk)

    prefix = destination.read_bytes()[:512]

    if prefix.startswith(b"%PDF-"):
        return

    if (
        b"<html" in prefix.lower()
        or "text/html" in content_type
    ):
        raise ValueError(
            "server returned HTML instead of PDF"
        )

    raise ValueError(
        "unsupported or corrupt document "
        f"({content_type or 'unknown MIME'})"
    )


def native_pdf_text(
    pdf_path: Path,
) -> str:
    result = run_command(
        [
            "pdftotext",
            "-f",
            "1",
            "-l",
            str(MAX_PDF_PAGES),
            "-layout",
            str(pdf_path),
            "-",
        ],
        timeout=35,
    )

    if result.returncode != 0:
        return ""

    return clean_text(result.stdout)


def ocr_pdf_text(
    pdf_path: Path,
    temporary_directory: Path,
) -> str:
    prefix = temporary_directory / "page"

    conversion = run_command(
        [
            "pdftoppm",
            "-f",
            "1",
            "-l",
            str(MAX_PDF_PAGES),
            "-r",
            "200",
            "-png",
            str(pdf_path),
            str(prefix),
        ],
        timeout=50,
    )

    if conversion.returncode != 0:
        return ""

    text_parts: list[str] = []

    for image in sorted(
        temporary_directory.glob(
            "page-*.png"
        )
    )[:MAX_PDF_PAGES]:
        ocr = run_command(
            [
                "tesseract",
                str(image),
                "stdout",
                "-l",
                "eng+hin",
                "--psm",
                "6",
            ],
            timeout=50,
        )

        if ocr.returncode == 0:
            text_parts.append(ocr.stdout)

    return clean_text(
        " ".join(text_parts)
    )


def useful_character_count(
    value: str,
) -> int:
    return sum(
        character.isalnum()
        for character in value
    )


def extract_document_text(
    session: requests.Session,
    url: str,
) -> tuple[str, str]:
    with tempfile.TemporaryDirectory() as directory_name:
        directory = Path(directory_name)
        pdf_path = directory / "notice.pdf"

        download_document(
            session,
            url,
            pdf_path,
        )

        native_text = native_pdf_text(
            pdf_path
        )

        if useful_character_count(native_text) >= 120:
            return native_text, "pdf-text"

        ocr_text = ocr_pdf_text(
            pdf_path,
            directory,
        )

        if useful_character_count(ocr_text) >= 80:
            return ocr_text, "ocr"

        return (
            native_text or ocr_text,
            "unreadable",
        )


def clean_inferred_title(
    value: str,
) -> str:
    title = clean_text(value)

    removal_patterns = (
        r"\bkindly submit\b.*$",
        r"\bsealed envelope\b.*$",
        r"\bto the undersigned\b.*$",
        r"\bin the interest of (?:the )?patient[s]?\b.*$",
        r"\bquotation/?estimate for providing\b",
        r"\bking george'?s? medical university\b.*$",
        r"\bkgmu,\s*lucknow\b.*$",
        r"कृपया\s+(?:अपना|अपनी|उक्त)?\s*"
        r"(?:कोटेशन|निविदा|प्रस्ताव).*?$",
        r"सीलबंद\s+लिफाफे\s+में.*?$",
        r"अधोहस्ताक्षरी\s+को.*?$",
        r"किंग\s+जॉर्ज\s+चिकित्सा\s+विश्वविद्यालय.*?$",
    )

    for pattern in removal_patterns:
        title = re.sub(
            pattern,
            "",
            title,
            flags=re.I,
        )

    replacements = {
        r"\bete\b": "etc.",
        r"\bnew ro\b": "RO",
        r"\bwater cooler[s]?\b": "water coolers",
        r"\biron stand[s]?\b": "iron stands",
    }

    for pattern, replacement in replacements.items():
        title = re.sub(
            pattern,
            replacement,
            title,
            flags=re.I,
        )

    title = re.sub(
        r"\s*[,;:।]\s*$",
        "",
        title,
    )

    title = re.sub(
        r"\s+",
        " ",
        title,
    ).strip(" .;:।,-–—")

    if len(title) > MAX_TITLE_LENGTH:
        shortened = title[
            : MAX_TITLE_LENGTH + 1
        ].rsplit(" ", 1)[0]

        if not shortened:
            shortened = title[:MAX_TITLE_LENGTH]

        title = shortened.rstrip(
            " ,.;:।-–—"
        )

    return title


def infer_title(
    document_text: str,
) -> str:
    text = clean_text(document_text)

    heading_pattern = (
        r"(?:"
        r"Subject|Sub\.?|Name of Work|Work Name|"
        r"Tender for|Quotation for|"
        r"विषय|कार्य का नाम|कार्य\s*विवरण|"
        r"निविदा हेतु|कोटेशन हेतु|"
        r"निविदा का विषय|सूचना का विषय"
        r")"
        r"\s*[:\-–—]?\s*"
        r"(.{10,260}?)"
        r"(?="
        r"\s{2,}|"
        r"\b(?:Sir|Reference|Ref\.|Date)\b|"
        r"(?:महोदय|संदर्भ|दिनांक|पत्रांक)|"
        r"$"
        r")"
    )

    action_pattern = (
        r"("
        r"(?:"
        r"Supply|Purchase|Procurement|Repairing|"
        r"Servicing|Dismantling|Installation|SITC|"
        r"CAMC|Recruitment|Walk-in|Examination|"
        r"आपूर्ति|क्रय|खरीद|मरम्मत|रखरखाव|"
        r"स्थापना|भर्ती|परीक्षा|प्रवेश|नियुक्ति"
        r")"
        r"[^.\n।]{10,260}"
        r")"
    )

    for pattern in (
        heading_pattern,
        action_pattern,
    ):
        match = re.search(
            pattern,
            text,
            re.I,
        )

        if match:
            title = clean_inferred_title(
                match.group(1)
            )

            if 10 <= len(title) <= MAX_TITLE_LENGTH:
                return title

    keyword_pattern = (
        r"quotation|tender|procurement|supply|"
        r"repair|recruitment|examination|admission|"
        r"कोटेशन|निविदा|खरीद|आपूर्ति|मरम्मत|"
        r"भर्ती|परीक्षा|प्रवेश|नियुक्ति|सूचना"
    )

    rejection_pattern = (
        r"phone|email|website|university address|"
        r"दूरभाष|ईमेल|वेबसाइट|पता"
    )

    for sentence in re.split(
        r"(?<=[.;।])\s+",
        text,
    ):
        sentence = clean_inferred_title(
            sentence
        )

        if not (
            20
            <= len(sentence)
            <= MAX_TITLE_LENGTH
        ):
            continue

        if not re.search(
            keyword_pattern,
            sentence,
            re.I,
        ):
            continue

        if re.search(
            rejection_pattern,
            sentence,
            re.I,
        ):
            continue

        return sentence

    return ""


def is_generic(
    item: Item,
) -> bool:
    normalized_generics = {
        normalize_text(value)
        for value in GENERIC_TITLES
    }

    return (
        normalize_text(item.title)
        in normalized_generics
    )


def enrich_items(
    items: list[Item],
    session: requests.Session,
    maximum_documents: int = MAX_OCR_DOCUMENTS,
) -> tuple[list[Item], list[str]]:
    enriched: list[Item] = []
    errors: list[str] = []
    processed_documents = 0

    for item in items:
        document_url = (
            item.url.lower()
            .split("?", 1)[0]
        )

        if (
            not is_generic(item)
            or not document_url.endswith(".pdf")
            or processed_documents
            >= maximum_documents
        ):
            enriched.append(item)
            continue

        processed_documents += 1

        try:
            document_text, method = (
                extract_document_text(
                    session,
                    item.url,
                )
            )

            inferred = infer_title(
                document_text
            )

            if inferred:
                item = replace(
                    item,
                    title=inferred,
                    extraction=method,
                )

            elif item.notice_no:
                item = replace(
                    item,
                    title=(
                        f"{item.title} — "
                        f"Ref. {item.notice_no}"
                    ),
                    extraction=method,
                )

            else:
                item = replace(
                    item,
                    extraction=method,
                )

        except Exception as error:
            errors.append(
                (
                    f"{item.source} document "
                    f"{item.url}: "
                    f"{type(error).__name__}: "
                    f"{error}"
                )
            )

            if item.notice_no:
                item = replace(
                    item,
                    title=(
                        f"{item.title} — "
                        f"Ref. {item.notice_no}"
                    ),
                    extraction="fallback",
                )

        enriched.append(item)

    return enriched, errors


def deduplicate(
    items: Iterable[Item],
) -> list[Item]:
    ordered = sorted(
        items,
        key=lambda item: (
            item.published,
            -item.source_priority,
        ),
        reverse=True,
    )

    kept: list[Item] = []
    urls: set[str] = set()
    keys: set[str] = set()

    for item in ordered:
        if (
            not item.key
            or item.url in urls
            or item.key in keys
        ):
            continue

        duplicate = False

        for existing in kept:
            if (
                item.notice_no
                and existing.notice_no
                and normalize_text(
                    item.notice_no
                )
                != normalize_text(
                    existing.notice_no
                )
            ):
                continue

            left = set(
                item.key.split()
            )

            right = set(
                existing.key.split()
            )

            overlap = (
                len(left & right)
                / max(
                    1,
                    min(
                        len(left),
                        len(right),
                    ),
                )
            )

            if (
                left
                and right
                and overlap >= 0.9
            ):
                duplicate = True
                break

        if duplicate:
            continue

        kept.append(item)
        urls.add(item.url)
        keys.add(item.key)

    return kept


def select_latest_by_category(
    items: Iterable[Item],
    count_per_category: int = 3,
) -> dict[str, list[Item]]:
    unique = deduplicate(items)

    result: dict[str, list[Item]] = {}

    for category in CATEGORY_ORDER:
        category_items = [
            item
            for item in unique
            if item.source == category
        ]

        result[category] = category_items[
            :count_per_category
        ]

    return result


def selection_is_complete(
    selection: dict[str, list[Item]],
) -> bool:
    return all(
        len(
            selection.get(
                category,
                [],
            )
        )
        == 3
        for category in CATEGORY_ORDER
    )


def render_prompt_block(
    selection: dict[str, list[Item]],
    generated_at: datetime,
) -> str:
    lines = [
        START,
        "# CURRENT KGMU UPDATES",
        (
            "Updated: "
            + generated_at.astimezone(
                IST
            ).strftime(
                "%Y-%m-%d %H:%M IST"
            )
        ),
        (
            "Use these categorized entries when answering "
            "questions about recent KGMU tenders, general "
            "notices, and examinations. Preserve official "
            "Hindi titles when the source is in Hindi."
        ),
    ]

    for category in CATEGORY_ORDER:
        lines.extend(
            [
                "",
                f"## {CATEGORY_LABELS[category]}",
            ]
        )

        for number, item in enumerate(
            selection[category],
            1,
        ):
            title = clean_inferred_title(
                item.title
            )

            lines.append(
                (
                    f"{number}. "
                    f"{item.published.isoformat()} "
                    f"— {title}"
                )
            )

            if item.notice_no:
                lines.append(
                    f"   Ref: {item.notice_no}"
                )

            lines.append(
                f"   URL: {item.url}"
            )

    lines.extend(
        [
            "",
            END,
        ]
    )

    return "\n".join(lines)


def replace_prompt_block(
    original: str,
    block: str,
) -> str:
    pattern = re.compile(
        re.escape(START)
        + r".*?"
        + re.escape(END),
        re.S,
    )

    if pattern.search(original):
        return pattern.sub(
            lambda _: block,
            original,
            count=1,
        )

    return (
        original.rstrip()
        + "\n\n"
        + block
        + "\n"
    )


def item_payload(
    item: Item,
) -> dict[str, str]:
    payload = {
        "date": item.published.isoformat(),
        "title": clean_inferred_title(
            item.title
        ),
        "url": item.url,
        "via": item.extraction,
    }

    if item.notice_no:
        payload["ref"] = item.notice_no

    return payload


def create_snapshot(
    selection: dict[str, list[Item]],
    generated_at: datetime,
    errors: list[str],
) -> dict:
    snapshot = {
        "generated_at": (
            generated_at.astimezone(IST)
            .isoformat(timespec="seconds")
        ),
        "tenders": [
            item_payload(item)
            for item in selection["tender"]
        ],
        "notices": [
            item_payload(item)
            for item in selection["notice"]
        ],
        "exam_notices": [
            item_payload(item)
            for item in selection["exam"]
        ],
    }

    if errors:
        snapshot["errors"] = errors

    return snapshot


def write_compact_json(
    path: Path,
    payload: dict,
) -> None:
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    content = json.dumps(
        payload,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=False,
    )

    path.write_text(
        content + "\n",
        encoding="utf-8",
    )


def archive_previous_snapshot(
    live_data_path: Path,
    archive_root: Path,
    run_time: datetime,
) -> Path | None:
    if not live_data_path.exists():
        return None

    local_time = run_time.astimezone(
        IST
    )

    destination = (
        archive_root
        / local_time.strftime("%Y")
        / local_time.strftime("%m")
        / local_time.strftime("%d")
        / (
            local_time.strftime(
                "%Y-%m-%d_%H-%M-%S"
            )
            + ".json"
        )
    )

    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copy2(
        live_data_path,
        destination,
    )

    return destination


def run(
    prompt_path: Path,
    live_data_path: Path,
    archive_root: Path,
    now: datetime | None = None,
) -> int:
    run_time = (
        now
        or datetime.now(tz=IST)
    )

    session = build_session()

    all_items: list[Item] = []
    errors: list[str] = []

    for source, url, priority in SOURCES:
        try:
            page = fetch_html(
                session,
                url,
            )

            parsed = parse_listing(
                page,
                source,
                url,
                priority,
                today=run_time.astimezone(
                    IST
                ).date(),
            )

            all_items.extend(parsed)

            print(
                f"{source}: "
                f"parsed {len(parsed)} dated items"
            )

        except Exception as error:
            message = (
                f"{source}: "
                f"{type(error).__name__}: "
                f"{error}"
            )

            errors.append(message)
            print(
                message,
                file=sys.stderr,
            )

    missing_sources = {
        category
        for category in CATEGORY_ORDER
        if not any(
            item.source == category
            for item in all_items
        )
    }

    if missing_sources:
        try:
            homepage = fetch_html(
                session,
                HOMEPAGE,
            )

            for category in missing_sources:
                all_items.extend(
                    parse_listing(
                        homepage,
                        category,
                        HOMEPAGE,
                        3,
                        today=run_time.astimezone(
                            IST
                        ).date(),
                    )
                )

        except Exception as error:
            errors.append(
                (
                    "homepage fallback: "
                    f"{type(error).__name__}: "
                    f"{error}"
                )
            )

    candidates = deduplicate(
        all_items
    )

    candidates_for_enrichment: list[Item] = []

    for category in CATEGORY_ORDER:
        category_candidates = [
            item
            for item in candidates
            if item.source == category
        ][:10]

        candidates_for_enrichment.extend(
            category_candidates
        )

    enriched, enrichment_errors = enrich_items(
        candidates_for_enrichment,
        session,
        maximum_documents=MAX_OCR_DOCUMENTS,
    )

    errors.extend(
        enrichment_errors
    )

    selection = select_latest_by_category(
        enriched,
        count_per_category=3,
    )

    if not selection_is_complete(
        selection
    ):
        counts = {
            category: len(
                selection.get(
                    category,
                    [],
                )
            )
            for category in CATEGORY_ORDER
        }

        print(
            (
                "Refusing to modify live data: "
                "fewer than three valid unique "
                "items in one or more categories: "
                f"{counts}"
            ),
            file=sys.stderr,
        )

        for error in errors:
            print(
                error,
                file=sys.stderr,
            )

        return 2

    if not prompt_path.exists():
        print(
            (
                "Prompt does not exist: "
                f"{prompt_path}"
            ),
            file=sys.stderr,
        )

        return 3

    original_prompt = prompt_path.read_text(
        encoding="utf-8"
    )

    prompt_block = render_prompt_block(
        selection,
        run_time,
    )

    updated_prompt = replace_prompt_block(
        original_prompt,
        prompt_block,
    )

    snapshot = create_snapshot(
        selection,
        run_time,
        errors,
    )

    # Archive only after all scraping, extraction, validation, prompt rendering,
    # and snapshot generation have succeeded.
    #
    # The archive must contain the previous latest_updates.json, not the new one.
    archived = archive_previous_snapshot(
        live_data_path,
        archive_root,
        run_time,
    )

    if archived:
        print(
            (
                "Archived previous snapshot: "
                f"{archived}"
            )
        )

    write_compact_json(
        live_data_path,
        snapshot,
    )

    if updated_prompt != original_prompt:
        prompt_path.write_text(
            updated_prompt,
            encoding="utf-8",
            newline="\n",
        )

    for category in CATEGORY_ORDER:
        for item in selection[category]:
            print(
                item.published,
                category,
                item.extraction,
                clean_inferred_title(
                    item.title
                ),
                item.url,
                sep=" | ",
            )

    return 0


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--prompt",
        type=Path,
        default=Path(
            "system_prompt1.txt"
        ),
    )

    parser.add_argument(
        "--live-data",
        type=Path,
        default=Path(
            "latest_updates.json"
        ),
    )

    parser.add_argument(
        "--archive-root",
        type=Path,
        default=Path(
            "archive-live-data"
        ),
    )

    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()

    return run(
        prompt_path=arguments.prompt,
        live_data_path=arguments.live_data,
        archive_root=arguments.archive_root,
    )


if __name__ == "__main__":
    raise SystemExit(main())
