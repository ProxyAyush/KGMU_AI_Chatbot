# KGMU latest-updates patch (document-aware)

The runner reads the four approved KGMU sources, ranks unique dated records, and enriches generic titles by inspecting linked PDFs.

Document handling:
- retries transient HTTP failures with backoff;
- follows redirects and uses realistic request headers;
- limits downloads to 15 MB;
- verifies the `%PDF-` signature;
- rejects HTML error pages disguised as PDFs;
- extracts pages 1-2 with `pdftotext` first;
- uses `pdftoppm` + Tesseract OCR only when native text is insufficient;
- derives conservative titles from Subject, Name of Work, procurement, servicing, recruitment, and similar phrases;
- falls back to `Quotation Notice - Ref. ...` when extraction is unavailable or uncertain.

Safety:
- fewer than three valid records => nonzero exit and no prompt change;
- only the marker-delimited block is replaced;
- tests run before scraping;
- workflow rejects unrelated changed files;
- no commit occurs when output is unchanged.

Validated locally: native-text PDF, scanned-PDF OCR, corrupt PDF, HTML-as-PDF, invalid 1970 dates, deduplication, marker preservation, and fail-closed behavior.

The KGMU listing page was reachable, but linked PDF downloads failed in the available environments (web cache miss and local DNS failure), so this package does not falsely claim the live PDF bodies were read here.
