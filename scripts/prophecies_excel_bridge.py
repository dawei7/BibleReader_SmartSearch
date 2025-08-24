#!/usr/bin/env python3
"""Bridge script to sync Excel <-> prophecies.json without intermediate CSV.

Usage:
  python prophecies_excel_bridge.py --mode transform --json path/to/prophecies.json
  python prophecies_excel_bridge.py --mode import --json path/to/prophecies.json --workbook <ignored>  # import JSON -> active Excel via COM
  python prophecies_excel_bridge.py --mode export --json path/to/prophecies.json --workbook <ignored>  # export sheet -> JSON

Modes:
  transform : Upgrade legacy flat JSON (prophecyText, fulfillmentRef, etc.) to hierarchical schema.
  import    : Ensure JSON upgraded then write rows to sheet 'bible_prophecies'.
  export    : Read rows from sheet and write hierarchical JSON.

Excel Interaction:
  Implemented via COM (win32com). The Excel workbook must already be open (buttons trigger this script).

Schema (Excel columns):
  id | summary_prophecy | summary_fulfillment | category_en | status | category_de | prophecyRef | biblicalFulfillmentRef | externalFulfillmentRef_en | externalFulfillmentRef_de | notes_en | notes_de

Hierarchical JSON shape per entry:
  {
    "id": str,                # duplicate of prophecyRef
    "prophecyRef": str,
    "summary": {"prophecy": str, "fulfillment": str},
    "category": {"en": str, "de": str},
    "status": str,
    "fulfillment": {
        "biblicalRef": str,
        "externalRef": {"en": str, "de": str}
    },
    "notes": {"en": str, "de": str}
  }

Anything unmapped in legacy rows is appended to notes.en.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import os
import textwrap
import time
import shutil
import datetime
from typing import List, Dict, Any

PRIMARY_SHEET = "prophecies"  # preferred / new name
LEGACY_SHEET = "bible_prophecies"  # still accepted for backward compatibility
LOG_SHEET = "Logs"  # sheet for captured run output
# Excel columns retain flat per-language summary columns even though internal JSON now uses nested summary.en / summary.de blocks.
# NOTE: Order must match row_from_entry / entry_from_row. Added 'prophecy_ref' explicit column.
COLUMNS = [
    'id',
    'summary_prophecy_en', 'summary_fulfillment_en', 'summary_prophecy_de', 'summary_fulfillment_de',
    'category_en', 'status', 'category_de',
    'prophecy_ref', 'biblical_ref', 'external_ref_en', 'external_ref_de',
    'notes_en', 'notes_de'
]

SPLIT_PATTERN = re.compile(r"\s+[—\-]\s+", re.UNICODE)

LEGACY_USED_KEYS = {
    "id", "category", "prophecyRef", "fulfillmentRef", "prophecyText", "status", "date", "sources", "notes", "notes_en", "notes_de"
}

# ------------------ Migration Helpers ------------------


def legacy_row_to_new(obj: Dict[str, Any]) -> Dict[str, Any]:
    # Already hierarchical? Detect by presence of 'summary' dict
    if isinstance(obj.get("summary"), dict):
        # Ensure id present
        if not obj.get("id") and obj.get("prophecyRef"):
            obj["id"] = obj["prophecyRef"]
        return obj
    prophecy_ref = obj.get("prophecyRef") or obj.get("id") or ""
    text = obj.get("prophecyText", "").strip()
    summary_prophecy = text
    summary_fulfillment = ""
    if text:
        parts = SPLIT_PATTERN.split(text, maxsplit=1)
        if len(parts) == 2:
            summary_prophecy, summary_fulfillment = parts[0].strip(), parts[1].strip()
    category_en = obj.get("category", "").strip()
    status = obj.get("status", "").strip()
    biblical_ref = obj.get("fulfillmentRef", "").strip()
    external_en = ""
    if isinstance(obj.get("sources"), list):
        external_en = "; ".join(s for s in obj["sources"] if s)
    notes_en = obj.get("notes", "") or obj.get("notes_en", "") or ""
    notes_de = obj.get("notes_de", "") or ""
    # Append date if present
    if obj.get("date"):
        if notes_en:
            notes_en += " | "
        notes_en += f"Date: {obj['date']}"
    # Collect unknown keys
    extras = []
    for k, v in obj.items():
        if k not in LEGACY_USED_KEYS:
            extras.append(f"{k}={v!r}")
    if extras:
        if notes_en:
            notes_en += " | "
        notes_en += "Extras: " + "; ".join(extras)
    new = {
        "id": prophecy_ref,
        "prophecyRef": prophecy_ref,
        "summary": {"prophecy": summary_prophecy, "fulfillment": summary_fulfillment},
        "category": {"en": category_en, "de": obj.get("category_de", "")},
        "status": status,
        "fulfillment": {
            "biblicalRef": biblical_ref,
            "externalRef": {"en": external_en, "de": obj.get("externalFulfillmentRef_de", "")}
        },
        "notes": {"en": notes_en, "de": notes_de}
    }
    return new


def load_and_migrate(json_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(json_path):
        return []
    with open(json_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"ERROR: JSON parse failed: {e}", file=sys.stderr)
            return []
    if not isinstance(data, list):
        print("WARN: JSON root not list; wrapping")
        data = [data]
    migrated = [legacy_row_to_new(o) for o in data if isinstance(o, dict)]
    return migrated

# ------------------ Flatten / Inflate for Excel ------------------


def row_from_entry(e: Dict[str, Any]) -> List[str]:
    summary = e.get('summary') or {}
    category = e.get('category') or {}
    fulfillment = e.get('fulfillment') or {}
    ext_ref = (fulfillment.get('externalRef') or {})
    notes = e.get('notes') or {}
    # Support hierarchical summary: summary.{en:{prophecy,fulfillment},de:{...}} plus legacy underscore fallbacks

    def get_part(lang, part):
        if isinstance(summary.get(lang), dict):
            return summary[lang].get(part, '')
        # underscore legacy
        return summary.get(f"{part}_{lang}", '')
    summ_prop_en = get_part('en', 'prophecy') or summary.get('prophecy', '')
    summ_ful_en = get_part('en', 'fulfillment') or summary.get('fulfillment', '')
    summ_prop_de = get_part('de', 'prophecy')
    summ_ful_de = get_part('de', 'fulfillment')
    return [
        e.get('id', ''),
        summ_prop_en,
        summ_ful_en,
        summ_prop_de,
        summ_ful_de,
        category.get('en', ''),
        e.get('status', ''),
        category.get('de', ''),
        e.get('prophecyRef', ''),
        fulfillment.get('biblicalRef', ''),
        ext_ref.get('en', ''),
        ext_ref.get('de', ''),
        notes.get('en', ''),
        notes.get('de', ''),
    ]


def entry_from_row(values: List[str]) -> Dict[str, Any]:
    # Expect ordering per COLUMNS
    while len(values) < len(COLUMNS):
        values.append('')
    (rid, sp_en, sf_en, sp_de, sf_de, cat_en, status, cat_de, prophecy_ref, biblical_ref,
     ext_en, ext_de, notes_en, notes_de) = values[:len(COLUMNS)]
    # If id column accidentally contains a status (user shifted columns), leave prophecy_ref blank so duplicate detection warns.
    invalid_ids = {"fulfilled", "partial", "partial / ongoing", "fulfilled / partial", "fulfilled / ongoing", "fulfilled (typological)"}
    raw_id_norm = (rid or '').strip().lower()
    if raw_id_norm in invalid_ids:
        # treat as empty id; will be flagged
        rid = ''
    prophecy_ref = prophecy_ref or rid
    summary_obj = {
        "prophecy": sp_en or '',  # keep flat English for quick access
        "fulfillment": sf_en or ''
    }
    # Nested language blocks
    summary_obj['en'] = {"prophecy": sp_en or '', "fulfillment": sf_en or ''}
    if sp_de or sf_de:
        summary_obj['de'] = {"prophecy": sp_de or '', "fulfillment": sf_de or ''}
    return {
        "id": prophecy_ref,
        "prophecyRef": prophecy_ref,
        "summary": summary_obj,
        "category": {"en": cat_en or '', "de": cat_de or ''},
        "status": status or '',
        "fulfillment": {
            "biblicalRef": biblical_ref or '',
            "externalRef": {"en": ext_en or '', "de": ext_de or ''}
        },
        "notes": {"en": notes_en or '', "de": notes_de or ''}
    }

# ------------------ Excel COM helpers ------------------


def connect_excel():
    try:
        import win32com.client  # type: ignore
    except ImportError:
        print("ERROR: pywin32 not installed. Install with: pip install pywin32", file=sys.stderr)
        sys.exit(1)
    try:
        excel = win32com.client.Dispatch("Excel.Application")
    except Exception as e:
        print(f"ERROR: Unable to connect to Excel via COM: {e}", file=sys.stderr)
        sys.exit(1)
    return excel

# ------------------ Operations ------------------


def op_transform(json_path: str):
    migrated = load_and_migrate(json_path)
    # Backups disabled (git provides history)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(migrated, f, ensure_ascii=False, indent=2)
    print(f"Transformed {len(migrated)} entries -> {json_path}")


def _resolve_sheet(wb, create_if_missing: bool):
    """Return worksheet object matching accepted names or header signature.

    Order of resolution:
      1. Exact PRIMARY_SHEET name
      2. Exact LEGACY_SHEET name
      3. Any sheet whose first-row first two headers match 'id' & 'summary_prophecy'
      4. (import only) create PRIMARY_SHEET if allowed
    """
    # 1 & 2: direct name matches
    for name in (PRIMARY_SHEET, LEGACY_SHEET):
        try:
            return wb.Worksheets(name)
        except Exception:
            pass
    # 3: scan for header signature
    try:
        for ws in wb.Worksheets:
            try:
                h1 = str(ws.Cells(1, 1).Value).strip().lower() if ws.Cells(1, 1).Value is not None else ''
                h2 = str(ws.Cells(1, 2).Value).strip().lower() if ws.Cells(1, 2).Value is not None else ''
                if h1 == 'id' and h2 == 'summary_prophecy':
                    return ws
            except Exception:
                pass
    except Exception:
        pass
    # 4: create if permitted
    if create_if_missing:
        ws = wb.Worksheets.Add()
        ws.Name = PRIMARY_SHEET
        return ws
    return None


def op_import(json_path: str):
    migrated = load_and_migrate(json_path)
    # Persist upgraded format if legacy
    # Backups disabled (git provides history)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(migrated, f, ensure_ascii=False, indent=2)
    excel = connect_excel()
    # Assume single open workbook (the caller workbook). Use ActiveWorkbook
    wb = excel.ActiveWorkbook
    if wb is None:
        print("ERROR: No active workbook.", file=sys.stderr)
        sys.exit(1)
    ws = _resolve_sheet(wb, create_if_missing=True)
    if ws is None:
        print("ERROR: Unable to create or access worksheet.", file=sys.stderr)
        sys.exit(1)
    # Write header
    existing_first = str(ws.Cells(1, 1).Value or '').strip().lower()
    second_header = str(ws.Cells(1, 2).Value or '').strip().lower()
    # Detect legacy header form and clear if mismatch count
    legacy_detected = (existing_first == 'id' and second_header == 'summary_prophecy')
    if legacy_detected or ws.Cells(1, len(COLUMNS)).Value is None or ws.Cells(1, 9).Value != 'prophecy_ref':
        for ci, col in enumerate(COLUMNS, start=1):
            ws.Cells(1, ci).Value = col
            ws.Cells(1, ci).Font.Bold = True
    # Always ensure bold
    try:
        ws.Rows(1).Font.Bold = True
    except Exception:
        pass
    # simple autofit
    try:
        ws.Columns.AutoFit()
    except Exception:
        pass
    # Clear existing data below header
    ws.Range(ws.Cells(2, 1), ws.Cells(ws.Rows.Count, len(COLUMNS))).Clear()
    for ri, entry in enumerate(migrated, start=2):
        row = row_from_entry(entry)
        for ci, val in enumerate(row, start=1):
            ws.Cells(ri, ci).Value = val

    # Auto-fit then cap extremely wide columns to keep sheet usable
    try:
        ws.Columns.AutoFit()
        # Cap width for verbose text columns (summaries, notes) to ~80 chars (~120 width units)
        max_width = 120
        cap_cols = [2, 3, 4, 5, 13, 14]  # 1-based indices
        for c in cap_cols:
            try:
                if ws.Columns(c).ColumnWidth > max_width:
                    ws.Columns(c).ColumnWidth = max_width
            except Exception:
                pass
    except Exception:
        pass
    print(f"Imported {len(migrated)} rows into sheet '{ws.Name}'")
    try:
        excel.Application.MsgBox(f"Import complete: {len(migrated)} rows", 64, "Prophecies Import")
    except Exception:
        pass


def op_export(json_path: str):
    excel = connect_excel()
    wb = excel.ActiveWorkbook
    if wb is None:
        print("ERROR: No active workbook.", file=sys.stderr)
        sys.exit(1)
    ws = _resolve_sheet(wb, create_if_missing=False)
    if ws is None:
        print(f"ERROR: Sheet not found. Expected one named '{PRIMARY_SHEET}' or '{LEGACY_SHEET}', or with headers id/summary_prophecy in first row.", file=sys.stderr)
        sys.exit(1)
    # Determine last used row independent of filters (AutoFilter hides rows so End(xlUp) can stop early)
    try:
        last_row = ws.UsedRange.Row + ws.UsedRange.Rows.Count - 1
    except Exception:
        last_row = ws.Cells(ws.Rows.Count, 1).End(-4162).Row  # fallback (xlUp = -4162)
    entries = []
    seen_prophecy_refs = {}
    # Iterate over every physical row index (filtered rows may be Hidden but still processed)
    for ri in range(2, last_row+1):
        values = [str(ws.Cells(ri, ci).Value).strip() if ws.Cells(ri, ci).Value is not None else '' for ci in range(1, len(COLUMNS)+1)]
        # Skip completely blank rows
        if not any(values):
            continue
        entry = entry_from_row(values)
        # Uniqueness requirement: prophecy_ref column (mirrored into id)
        pid = entry.get('prophecyRef', '') or entry.get('id','')
        if pid:
            seen_prophecy_refs.setdefault(pid, []).append(ri)
        entries.append(entry)
    # Duplicate prophecy_ref check (biblical_ref duplicates allowed)
    duplicates = {k: v for k, v in seen_prophecy_refs.items() if len(v) > 1}
    if duplicates:
        msg_lines = ["Duplicate prophecy_ref detected – export aborted:"]
        for k, rows in duplicates.items():
            msg_lines.append(f"  {k} (rows {', '.join(map(str, rows))})")
        full_msg = "\n".join(msg_lines)
        print(full_msg, file=sys.stderr)
        try:
            excel.Application.MsgBox(full_msg, 16, "Prophecies Export Error")
        except Exception:
            pass
        sys.exit(1)
    # Normalize JSON path (strip surrounding quotes / whitespace)
    json_path = normalize_json_path(json_path)
    # Direct overwrite (no backup) per user request
    before_mtime = os.path.getmtime(json_path) if os.path.exists(json_path) else None
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        err = f"ERROR: Failed writing JSON ({e}). Path: {json_path}"
        print(err, file=sys.stderr)
        try:
            excel.Application.MsgBox(err, 16, "Prophecies Export Error")
        except Exception:
            pass
        sys.exit(1)
    after_mtime = os.path.getmtime(json_path) if os.path.exists(json_path) else None
    verification = []
    # Load back & count to confirm (mtime may not change if export happens within same second)
    try:
        with open(json_path, 'r', encoding='utf-8') as vf:
            reloaded = json.load(vf)
        if not isinstance(reloaded, list) or len(reloaded) != len(entries):
            verification.append(f"Reload count mismatch (expected {len(entries)}, got {len(reloaded) if isinstance(reloaded, list) else 'non-list'})")
    except Exception as e:
        verification.append(f"Reload failed: {e}")
    ver_msg = ("\n" + "\n".join(verification)) if verification else ""
    print(f"Exported {len(entries)} rows from sheet '{ws.Name}' -> {json_path}{ver_msg}")
    try:
        extra = ("\n" + "\n".join(verification)) if verification else ""
        icon = 48 if verification else 64  # warning vs info
        excel.Application.MsgBox(f"Export complete: {len(entries)} rows written.{extra}", icon, "Prophecies Export")
    except Exception:
        pass

# ------------------ Main ------------------


def main():
    install_logging_hooks()
    ap = argparse.ArgumentParser(description="Excel / JSON prophecy bridge")
    ap.add_argument('--mode', choices=['transform', 'import', 'export'], default='transform')
    ap.add_argument('--json', required=True, help='Path to prophecies.json')
    ap.add_argument('--workbook', help='(Optional) Workbook path (not strictly needed when called from button)')
    args = ap.parse_args()

    if args.mode == 'transform':
        op_transform(args.json)
    elif args.mode == 'import':
        op_import(args.json)
    elif args.mode == 'export':
        op_export(args.json)
    else:
        ap.error('Unknown mode')

    # Attempt to flush log buffer to Excel (only if Excel accessible)
    flush_logs_to_excel()


# main() invocation moved to end so logging helpers are defined first

# --------------- Utility (placed at end to avoid earlier clutter) ---------------


def backup_json(path: str) -> str:
    """Create timestamped backup next to path; returns backup path.

    Format: <name>.backup-YYYYMMDD-HHMMSS.json
    If original lacks .json, just append .backup-<ts>.
    """
    base_dir, filename = os.path.split(path)
    root, ext = os.path.splitext(filename)
    ts = time.strftime('%Y%m%d-%H%M%S')
    if ext.lower() == '.json':
        backup_name = f"{root}.backup-{ts}{ext}"
    else:
        backup_name = f"{filename}.backup-{ts}"
    backup_path = os.path.join(base_dir, backup_name)
    try:
        shutil.copy2(path, backup_path)
    except Exception as e:
        print(f"WARN: Failed to create backup: {e}", file=sys.stderr)
    return backup_path


def normalize_json_path(path: str) -> str:
    # Strip quotes/whitespace a user might have accidentally included
    p = path.strip().strip('"').strip("'")
    return p

# --------------- Logging capture & Excel log sheet ---------------


LOG_BUFFER: list[str] = []
_ORIG_STDOUT = sys.stdout
_ORIG_STDERR = sys.stderr
_ORIG_EXIT = sys.exit


class _TeeStream:
    def __init__(self, orig, is_err: bool):
        self._orig = orig
        self._is_err = is_err

    def write(self, data):
        try:
            self._orig.write(data)
        except Exception:
            pass
        if data:
            # Split to handle multi-line writes
            for line in data.splitlines():
                if line.strip():
                    prefix = 'ERR ' if self._is_err else 'OUT '
                    LOG_BUFFER.append(prefix + line.rstrip())

    def flush(self):
        try:
            self._orig.flush()
        except Exception:
            pass


def install_logging_hooks():
    # Avoid double installation
    if getattr(sys, '_prophecy_logger_installed', False):
        return
    sys.stdout = _TeeStream(sys.stdout, False)  # type: ignore
    sys.stderr = _TeeStream(sys.stderr, True)   # type: ignore

    def _exit_with_logs(code=0):
        try:
            flush_logs_to_excel()
        except Exception:
            pass
        _ORIG_EXIT(code)

    sys.exit = _exit_with_logs  # type: ignore
    sys._prophecy_logger_installed = True  # type: ignore


def flush_logs_to_excel():
    # Only meaningful if Excel is running and workbook active
    try:
        import win32com.client  # type: ignore
        excel = win32com.client.Dispatch("Excel.Application")
        wb = excel.ActiveWorkbook
        if wb is None:
            return
        # Get or create log sheet
        try:
            ws = wb.Worksheets(LOG_SHEET)
        except Exception:
            ws = wb.Worksheets.Add()
            ws.Name = LOG_SHEET
        # Clear sheet
        ws.Cells.Clear()
        ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ws.Cells(1, 1).Value = f"Bridge Logs - {ts}"
        ws.Cells(1, 1).Font.Bold = True
        # Write each log line starting row 3 for spacing
        for idx, line in enumerate(LOG_BUFFER, start=3):
            ws.Cells(idx, 1).Value = line
    except Exception:
        # Silently ignore; logging is auxiliary
        return


if __name__ == '__main__':
    main()
