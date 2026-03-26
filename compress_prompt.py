#!/usr/bin/env python3
"""
compress_prompt.py - Compresses system_prompt1.txt for KGMU AI Chatbot
Reads from the backup file (system_prompt1.txt.bak) and writes compressed
output to system_prompt1.txt.

Key transformations:
1. Keeps identity block (lines 1-34) as-is
2. Adds new OPD section after Key Resources (before Guidelines)
3. Converts faculty entries to table format (lines 140-4221)
4. Removes duplicate identity block at lines 4705-4718
5. Keeps OPD info, ratelist, digital lectures sections
6. Keeps Holiday Calendar
7. Drops all scraped "Content from" web pages after line ~5054
8. Removes image references, EC meeting minutes, RTI legal text
"""

import re
import os

INPUT_FILE = "/home/user/KGMU_AI_Chatbot/system_prompt1.txt.bak"
OUTPUT_FILE = "/home/user/KGMU_AI_Chatbot/system_prompt1.txt"

OPD_SECTION = """\
# OPD Appointment Info

**Timings:** Mon–Fri 9:00 AM–1:00 PM | Sat 9:00 AM–12:00 PM | Closed Sundays
**Fee:** ₹50 flat for OPD slip (all booking methods)
**Outside-city patients:** Must bring a valid referral for their specific department
**Pre-booking strongly recommended** to avoid severe wait times.

## Booking Methods

**A. Online Portal (ORS)**
- Website: https://ors.gov.in
- Flow: Login/Register → Select State (Uttar Pradesh) → Select Hospital (KGMU) → Click 'New Appointment' → Choose Department, Date & Time Slot → Enter patient details → Pay ₹50 online → Download appointment slip

**B. Mobile App (ABHA / Health Care App)**
- Download from Google Play Store
- Register with mobile number + OTP verification
- Follow same State/Hospital selection flow as ORS portal

**C. SMS Booking**
- Number: 1887019134
- Format: Send SMS: "Appointment [Patient Name]" → receive booking confirmation

**D. Walk-in (On-Site Counters)**
- Required: Patient's Aadhaar Number + active Mobile Number
- Flow: Provide details at registration counter → Receive OTP on mobile → Get physical token → Pay ₹50 at counter → Collect physical OPD slip

(Source: https://youtu.be/b3kqTiqTozs)
"""

# Degree patterns to identify qualification lines
DEGREE_PATTERN = re.compile(
    r'\b(MD|MBBS|MS|MCh|DM|DNB|PDCC|PhD|FRCP|MRCP|FRCS|DA|DCH|DGO|'
    r'DTCD|DPM|DLO|DO|DOMS|DOrth|DMRD|DMRT|DMRE|FIAP|FAMS|MNAMS|IDRA|'
    r'MDS|BDS|FICS|FCPS|DMAS|FIACM|FICCM|FIECMO|FICCC|'
    r'MAMC|AIIMS|PGI|SGPGI)\b',
    re.IGNORECASE
)

DESIGNATION_PATTERN = re.compile(
    r'^(Professor\s*[&and]*\s*Head|Head\s*of\s*Department|'
    r'Professor\s*[&and]*\s*Officiating\s*Head|'
    r'Associate\s*Professor\s*[&and]*\s*Head|'
    r'Additional\s*Professor\s*[&and]*\s*Officiating\s*Head|'
    r'Professor|Additional\s*Professor|Associate\s*Professor|'
    r'Assistant\s*Professor|Lecturer|HOD)\s*$',
    re.IGNORECASE
)


def map_designation(desig):
    d = desig.strip().lower()
    if not d:
        return ''
    if 'head of department' in d:
        return 'HOD'
    if ('head' in d and 'professor' in d) or 'officiating head' in d:
        return 'HOD'
    if 'additional professor' in d:
        return 'Addl Prof'
    if 'associate professor' in d:
        return 'Assoc Prof'
    if 'assistant professor' in d:
        return 'Asst Prof'
    if d == 'professor':
        return 'Prof'
    if 'lecturer' in d:
        return 'Lecturer'
    return desig.strip()


def clean_phone(phone):
    phone = phone.replace('Ph:', '').strip()
    phone = re.sub(r'^\+?91\s*', '', phone)
    phone = re.sub(r'^91\s+', '', phone)
    phone = re.sub(r'\s*\(O\)\s*$', '', phone, flags=re.IGNORECASE)
    phone = re.sub(r'\s*\(R\)\s*$', '', phone, flags=re.IGNORECASE)
    return phone.strip()


def clean_email(email):
    email = email.strip()
    email = email.lstrip('*')
    email = email.rstrip('\\')
    email = email.replace('\\_', '_')
    return email.strip()


def is_designation(line):
    return bool(DESIGNATION_PATTERN.match(line.strip()))


def is_qualification(line):
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith('Dr.') or stripped.startswith('Dr '):
        return False
    if is_designation(stripped):
        return False
    if DEGREE_PATTERN.search(stripped):
        # Make sure it's not a long paragraph
        if len(stripped) < 200:
            parts = stripped.split(',')
            degree_count = sum(1 for p in parts if DEGREE_PATTERN.search(p.strip()))
            if degree_count >= 1 and len(parts) <= 12:
                return True
    return False


def is_phone(line):
    stripped = line.strip()
    return ('Ph:' in stripped or
            re.match(r'^Mob:', stripped, re.IGNORECASE) or
            re.match(r'^\+?91\s*\d', stripped))


def is_email(line):
    stripped = line.strip().lstrip('*')
    # Must contain @ and . and be short (not a long sentence)
    return '@' in stripped and '.' in stripped and len(stripped.split()) <= 3 and len(stripped) < 80


def escape_pipe(s):
    """Escape pipe characters inside table cells."""
    return s.replace('|', '&#124;')


def truncate(s, max_len=80):
    """Truncate a string to max_len characters."""
    if len(s) > max_len:
        return s[:max_len-1] + '…'
    return s


def flush_faculty_entry(entry, rows):
    """Convert accumulated faculty entry dict to a table row string."""
    if not entry.get('name'):
        return
    name = escape_pipe(entry.get('name', '').strip())
    quals = escape_pipe(truncate(entry.get('quals', '').strip(), 50))
    desig = escape_pipe(map_designation(entry.get('desig', '')))
    spec = escape_pipe(truncate(entry.get('spec', '').strip(), 40))
    phone = escape_pipe(entry.get('phone', '').strip())
    email = escape_pipe(entry.get('email', '').strip())
    rows.append(f"| {name} | {quals} | {desig} | {spec} | {phone} | {email} |")


def parse_faculty_entry(entry_lines):
    """
    Parse a single faculty entry from a list of lines.
    Returns a dict with keys: name, quals, desig, spec, phone, email
    """
    entry = {}
    for line in entry_lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Name: starts with Dr.
        if re.match(r'^Dr\.?\s+', stripped) and 'name' not in entry:
            entry['name'] = stripped
            continue

        # Phone
        if 'phone' not in entry and is_phone(stripped):
            entry['phone'] = clean_phone(stripped)
            continue

        # Email: contains @ and .  (with or without leading **)
        if 'email' not in entry and is_email(stripped):
            entry['email'] = clean_email(stripped)
            continue

        # Designation
        if 'desig' not in entry and is_designation(stripped):
            entry['desig'] = stripped
            continue

        # Qualifications: must contain at least one degree abbreviation
        if 'quals' not in entry and is_qualification(stripped):
            entry['quals'] = stripped
            continue

        # Specialization: any remaining non-empty line after name is captured
        # (only after we have name already)
        if 'name' in entry and 'spec' not in entry:
            # Make sure it's not a junk line
            if not re.match(r'^https?://', stripped) and \
               not re.match(r'^\d+\s*$', stripped) and \
               stripped not in ('Image', 'Position', 'Field of Work', 'Contact') and \
               not stripped.startswith('URL Source:') and \
               stripped != 'Markdown Content:':
                entry['spec'] = stripped

    return entry


def split_into_faculty_entries(lines):
    """
    Split a list of lines into individual faculty entries.
    An entry starts with a 'Dr. ' line and continues until the next 'Dr. ' line.
    Returns list of (dept_name_or_none, entry_lines_list).

    Also yields (dept_name, None) when a department name is detected.
    """
    results = []  # list of ('dept', dept_name) or ('entry', lines_list)
    current_entry = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        i += 1

        # Skip junk lines
        if re.match(r'!\[', stripped):
            continue
        if stripped in ('Image', 'Position', 'Field of Work', 'Contact', 'Name'):
            continue
        if stripped.startswith('URL Source:') or stripped == 'Markdown Content:':
            continue
        if re.match(r'https?://kgmu\.org/upload_file/[^\s]*\.(jpg|jpeg|png|JPG|JPEG|PNG)',
                    stripped, re.IGNORECASE):
            continue
        if re.match(r'^\d+\s*$', stripped):
            continue
        if stripped == '### Quick Navigation':
            while i < len(lines):
                ns = lines[i].strip()
                if re.match(r'^\*\s*\[', ns) or ns == '':
                    i += 1
                else:
                    break
            continue

        # New Dr. entry starts
        if re.match(r'^Dr\.?\s+', stripped):
            # Flush previous entry if any
            if current_entry:
                results.append(('entry', current_entry))
                current_entry = []
            current_entry = [line]
            continue

        # If in an entry, add to it (even blank lines and email lines after blank)
        if current_entry:
            current_entry.append(line)
            continue

        # Not in an entry - check for department name
        # Dept names appear immediately before Image/Dr. lines
        if stripped and not stripped.startswith('*') and not stripped.startswith('[') and \
                not stripped.startswith('#') and not stripped.startswith('!') and \
                not stripped.startswith('>') and '@' not in stripped and \
                not re.match(r'^https?://', stripped) and \
                not re.match(r'^\d+[.\)]\s', stripped) and \
                '|' not in stripped and len(stripped) < 80 and \
                not is_designation(stripped) and not is_qualification(stripped) and \
                re.match(r'^[A-Z]', stripped):
            # Look ahead for Image or Dr.
            lookahead_idx = i
            while lookahead_idx < len(lines) and not lines[lookahead_idx].strip():
                lookahead_idx += 1
            if lookahead_idx < len(lines):
                next_s = lines[lookahead_idx].strip()
                if next_s in ('Image', 'Position', 'Field of Work') or \
                        re.match(r'^Dr\.?\s+', next_s):
                    results.append(('dept', stripped))
                    continue
        # else: skip non-entry, non-dept lines

    # Flush remaining entry
    if current_entry:
        results.append(('entry', current_entry))

    return results


def process_faculty_section(lines):
    """
    Process lines in the faculty section, converting faculty entries to table format.
    Returns a list of output lines.
    """
    output = []
    current_dept = None
    rows = []

    def flush_dept_table():
        nonlocal rows
        if current_dept and rows:
            output.append(f"\n### {current_dept} Faculty")
            output.append("| Name | Qualifications | Position | Specialization | Phone | Email |")
            output.append("|---|---|---|---|---|---|")
            output.extend(rows)
            rows = []

    items = split_into_faculty_entries(lines)

    for item_type, item_data in items:
        if item_type == 'dept':
            flush_dept_table()
            current_dept = item_data
        elif item_type == 'entry':
            e = parse_faculty_entry(item_data)
            if e.get('name'):
                flush_faculty_entry(e, rows)

    # Flush remaining
    flush_dept_table()

    return output


def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Strip newlines for easier processing
    lines = [l.rstrip('\n') for l in lines]
    total = len(lines)
    print(f"Input (backup): {total} lines")

    # =========================================================================
    # STRATEGY: Build the output from distinct sections of the backup file
    #
    # KEEP (from backup):
    #   Lines   1-139  (0-indexed: 0-138): Identity, guidelines, department links
    #   Lines 140-4221 (0-indexed: 139-4220): Faculty section -> convert to tables
    #   Lines 4479-4618 (0-indexed: 4478-4617): OPD info
    #   Lines 4619-4699 (0-indexed: 4618-4698): Ratelist + Digital Lectures
    #   Lines 4700-4930 (0-indexed: 4699-4929): Revised Main Data (minus dup identity block)
    #   Lines 4932-5009 (0-indexed: 4931-5008): Holiday Calendar
    #
    # DROP:
    #   Lines 4222-4478 (0-indexed: 4221-4477): Office staff with images (between faculty end and OPD)
    #   Lines 5010+: All scraped "Content from" web pages
    # =========================================================================

    output_lines = []

    # --- SECTION 1: Lines 1-139 (0-indexed 0-138) ---
    # Keep as-is, but insert OPD section before "# Guidelines"
    preamble = lines[0:139]
    guidelines_idx = None
    for i, line in enumerate(preamble):
        if line.strip() == '# Guidelines':
            guidelines_idx = i
            break

    if guidelines_idx is not None:
        print(f"Found '# Guidelines' at preamble line {guidelines_idx+1}")
        output_lines.extend(preamble[:guidelines_idx])
        output_lines.extend(OPD_SECTION.rstrip('\n').split('\n'))
        output_lines.append('')
        output_lines.extend(preamble[guidelines_idx:])
    else:
        print("WARNING: Could not find '# Guidelines' in preamble")
        output_lines.extend(preamble)

    print(f"After preamble: {len(output_lines)} lines")

    # --- SECTION 2: Faculty section (lines 140-4221, 0-indexed 139-4220) ---
    # Find the actual faculty section boundaries
    faculty_start = None
    faculty_end = None

    for i, line in enumerate(lines):
        if line.strip() == '#Important Faculties with Information+Links':
            faculty_start = i
        if faculty_start and i > faculty_start + 100:
            # End markers
            if (line.strip().startswith('#Important Information Regarding OPD') or
                    line.strip().startswith('### Office Staff') or
                    line.strip().startswith('#Digital Lectures') or
                    line.strip().startswith('#Ratelist')):
                faculty_end = i
                break

    if faculty_start is None or faculty_end is None:
        print(f"WARNING: Faculty section not found (start={faculty_start}, end={faculty_end})")
        # Use default line ranges
        faculty_start = 139
        faculty_end = 4221

    print(f"Faculty section: lines {faculty_start+1}-{faculty_end+1}")

    # Add the faculty section header
    output_lines.append('')
    output_lines.append('#Important Faculties with Information+Links')
    output_lines.append('')

    faculty_lines = lines[faculty_start+1:faculty_end]
    processed_faculty = process_faculty_section(faculty_lines)
    output_lines.extend(processed_faculty)

    print(f"After faculty processing: {len(output_lines)} lines")

    # --- SECTION 3: OPD info section ---
    # Find "#Important Information Regarding OPD Services"
    opd_info_start = None
    opd_info_end = None
    for i, line in enumerate(lines):
        if line.strip() == '#Important Information Regarding OPD Services':
            opd_info_start = i
        if opd_info_start and i > opd_info_start + 5:
            if line.strip().startswith('#Ratelist') or line.strip().startswith('#Virtual'):
                opd_info_end = i
                break

    if opd_info_start and opd_info_end:
        print(f"OPD info section: lines {opd_info_start+1}-{opd_info_end+1}")
        output_lines.append('')
        output_lines.extend(lines[opd_info_start:opd_info_end])
    else:
        print(f"WARNING: OPD info section not found (start={opd_info_start}, end={opd_info_end})")

    # --- SECTION 4: Ratelist and Digital Lectures ---
    ratelist_start = None
    ratelist_end = None
    for i, line in enumerate(lines):
        if line.strip() == '#Ratelist of Various Procedures and Tests':
            ratelist_start = i
        if ratelist_start and i > ratelist_start + 5:
            if line.strip() == '#Revised Main Data of KGMU':
                ratelist_end = i
                break

    if ratelist_start and ratelist_end:
        print(f"Ratelist section: lines {ratelist_start+1}-{ratelist_end+1}")
        output_lines.append('')
        output_lines.extend(lines[ratelist_start:ratelist_end])
    else:
        print(f"WARNING: Ratelist not found (start={ratelist_start}, end={ratelist_end})")

    # --- SECTION 5: Revised Main Data (social media links) ---
    # Find "#Revised Main Data of KGMU" - remove duplicate identity block within it
    revised_start = None
    for i, line in enumerate(lines):
        if line.strip() == '#Revised Main Data of KGMU':
            revised_start = i
            break

    # Find the Holiday Calendar start
    holiday_start = None
    for i, line in enumerate(lines):
        if line.strip() == '#KGMU Holiday Calendar 2026':
            holiday_start = i
            break

    if revised_start and holiday_start:
        print(f"Revised main data: lines {revised_start+1}-{holiday_start}")
        revised_lines = lines[revised_start:holiday_start]

        # Remove duplicate identity block within this section
        # Find "If you're asked about your origin or "who made you","
        dup_start = None
        dup_end = None
        for j, line in enumerate(revised_lines):
            if "If you're asked about your origin" in line:
                dup_start = j
            if dup_start is not None and 'linkedin.com/in/ayush-yadav-kgmu' in line:
                dup_end = j
                break

        if dup_start is not None and dup_end is not None:
            print(f"Removing duplicate identity block at revised_lines[{dup_start}:{dup_end+1}]")
            revised_lines = revised_lines[:dup_start] + revised_lines[dup_end+1:]

        # Trim the large navigation tree - keep only up to and including the social media links
        # (up to Instagram link), then skip to "### Digital Lectures" onwards
        # Social media links end after Instagram. Then the big nav tree starts.
        # Find where "### Digital Lectures" or "### Important Links" begins
        trim_end = None
        important_links_start = None
        for j, line in enumerate(revised_lines):
            stripped = line.strip()
            # Find where the navigation tree starts (just after KGMU social media links)
            # The nav tree starts with "* [About KGMU]"
            if stripped == '* [About KGMU](https://kgmu.org/about-us.php)' and trim_end is None:
                trim_end = j
            # Find the "### Important Links" section
            if stripped == '### Important Links':
                important_links_start = j
                break

        if trim_end is not None and important_links_start is not None:
            print(f"Trimming nav tree from revised_lines[{trim_end}:{important_links_start}]")
            # Keep: header + founding info + social media links + important links onwards
            revised_lines = revised_lines[:trim_end] + revised_lines[important_links_start:]
        elif trim_end is not None:
            print(f"WARNING: Could not find '### Important Links', keeping from trim_end={trim_end}")

        output_lines.append('')
        output_lines.extend(revised_lines)
        # Add RTI reference line (the full RTI legal text is in the dropped scraped pages section)
        output_lines.append('For RTI information and the Public Information Officer contact, see: https://kgmu.org/rti.php')
    else:
        print(f"WARNING: Revised main data not found (revised_start={revised_start}, holiday_start={holiday_start})")

    # --- SECTION 6: Holiday Calendar ---
    # Find the end of the holiday calendar (## Key Notes: section)
    holiday_end = None
    if holiday_start:
        for i, line in enumerate(lines[holiday_start:], start=holiday_start):
            if line.strip() == '## Key Notes:':
                # Find end of Key Notes section (next empty line after content)
                for j, line2 in enumerate(lines[i+1:], start=i+1):
                    if line2.strip() == '' and j > i + 3:
                        # Check if next non-empty line is a new major section
                        for k, line3 in enumerate(lines[j:], start=j):
                            if line3.strip():
                                holiday_end = k
                                break
                        break
                break

        if holiday_end is None:
            # Fallback: take until "About us" or "Content from"
            for i, line in enumerate(lines[holiday_start:], start=holiday_start):
                if line.strip() in ('About us', '') and i > holiday_start + 50:
                    if lines[i].strip() == 'About us':
                        holiday_end = i
                        break
                if 'Content from https://' in line and i > holiday_start + 50:
                    holiday_end = i
                    break

    if holiday_start and holiday_end:
        print(f"Holiday Calendar: lines {holiday_start+1}-{holiday_end}")
        output_lines.append('')
        output_lines.extend(lines[holiday_start:holiday_end])
    else:
        print(f"WARNING: Holiday calendar boundaries not found (start={holiday_start}, end={holiday_end})")
        if holiday_start:
            # Just take 100 lines as fallback
            output_lines.extend(lines[holiday_start:holiday_start+100])

    print(f"After all sections: {len(output_lines)} lines")

    # =========================================================================
    # GLOBAL CLEANUP: Remove image refs, fix artifacts, remove huge OPD lines
    # =========================================================================

    cleaned = []
    for line in output_lines:
        stripped = line.strip()

        # Remove local image references
        if re.match(r'!\[.*?\]\(images/', stripped):
            continue

        # Remove remote image URLs (bare URLs ending in image extensions)
        if re.match(r'https?://kgmu\.org/upload_file/[^\s]*\.(jpg|jpeg|png|JPG|JPEG|PNG)\s*$',
                    stripped, re.IGNORECASE):
            continue
        if re.match(r'https?://kgmu\.org/download/[^\s]*\.(jpg|jpeg|png|JPG|JPEG|PNG)\s*$',
                    stripped, re.IGNORECASE):
            continue

        # Remove lines that are just "**" or "**\"
        if stripped in ('**', '**\\', '\\'):
            continue

        # Remove broken markdown with ** only (no content)
        if re.match(r'^\*\*\s*$', stripped):
            continue

        # Remove the giant OPD department list mega-line (starts with "List of OPDs with Links:")
        if stripped.startswith('List of OPDs with Links:'):
            continue

        # Remove the giant single-paragraph OPD info line (starts with "###OPD in KGMU information:")
        if stripped.startswith('###OPD in KGMU information:'):
            continue

        # Remove upload_file image URLs embedded in table cells - handled in table rows
        # Remove bare image URLs that appear in specialization field
        line = re.sub(
            r'www\.kgmu\.org/upload_file/faculty_image/[a-f0-9]+\.(jpg|jpeg|png|JPG)',
            '', line, flags=re.IGNORECASE
        )
        # Clean up any trailing " "NAME") patterns from image URL cleanup
        line = re.sub(r'\s*"[^"]*"\)\s*$', '', line)

        cleaned.append(line)

    output_lines = cleaned

    # =========================================================================
    # CLEANUP: Remove excessive blank lines (max 2 consecutive)
    # =========================================================================
    final = []
    blank_count = 0
    for line in output_lines:
        if line.strip() == '':
            blank_count += 1
            if blank_count <= 2:
                final.append(line)
        else:
            blank_count = 0
            final.append(line)

    lines_out = final
    print(f"After blank line cleanup: {len(lines_out)} lines.")

    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines_out))
        f.write('\n')

    size = os.path.getsize(OUTPUT_FILE)
    print(f"\nOutput written to: {OUTPUT_FILE}")
    print(f"Output size: {size:,} bytes ({size/1024:.1f} KB)")
    print(f"Output lines: {len(lines_out)}")

    if size > 80000:
        print(f"\nWARNING: File is still {size:,} bytes (>{80000} bytes target)!")
        # Analyze what's still large
        section_sizes = {}
        for line in lines_out:
            if line.startswith('#') or line.startswith('Content from'):
                current_section = line[:60]
                section_sizes[current_section] = 0
            if section_sizes:
                last = list(section_sizes.keys())[-1]
                section_sizes[last] = section_sizes.get(last, 0) + len(line)
        print("Top sections by size:")
        for k, v in sorted(section_sizes.items(), key=lambda x: -x[1])[:10]:
            print(f"  {v:,} bytes: {k}")
    else:
        print(f"\nSUCCESS: File is within 80 KB target!")


if __name__ == '__main__':
    main()
