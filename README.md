# Bible Reader · Smart Search

Modern Bible reading & powerful multi‑mode search (All / Any / Phrase) with per‑book & per‑chapter statistics, mobile‑style controls, and verse‑by‑verse read‑aloud.

Includes an experimental Prophecies & Fulfillments explorer (beta) with bilingual summaries.

## Live Demo

https://dawei7.github.io/BibleReader_SmartSearch/

## Stack

- Vite 7 (fast dev + build)
- React 19 (JSX)
- Tailwind CSS 3
- Framer Motion (UI motion)
- Recharts (charts)

No TypeScript yet (pure JSX) – easy to add later.

## Features (User‑facing)

- Read mode: one chapter at a time with sticky header and clean typography.
- Search mode: fast, punctuation‑aware matching with three modes (All, Any, Phrase) and optional case‑sensitive matching.
- Scope: search whole Bible or a single book; optionally narrow to chapter ranges.
- Statistics & Filters: quick visual overview by book and chapter; tap to focus results.
- Jump from search to reading: tap a result to open the chapter and scroll to the exact verse.
- Read aloud (Text‑to‑Speech): verse‑by‑verse playback with Play/Pause and a starting‑verse picker.
- Read for (sleep timer): presets and custom minutes, with a live countdown shown inside the button while playing.
- Inclusive stop‑at: optionally pick a book/chapter where playback stops after finishing that chapter.
- “Whichever comes first”: playback stops when the timer expires or the inclusive stop‑at target is reached.
- Split Clear: one‑tap clear for timer and stop‑at.
- Appearance: font size, serif/sans, line height, width, verse numbers (inline/superscript), theme (System/Light/Dark).
- Save defaults: save current Version/Book/Chapter as your device default.
- Prophecies & Fulfillments (beta):
  - Color‑coded legend (Prophecy = amber · Fulfillment = emerald) shown once globally.
  - Dual summaries (prophecy / fulfillment) with matching colored left borders.
  - Reference line with independently highlighted prophecy vs fulfillment references.
  - Draft search input + Apply button: live preview count (asterisk \* when draft differs) before committing.
  - Regex / token aware highlighting of search terms inside references & summaries.
  - Re‑ordered overlay: prophecy summary → prophecy passages → fulfillment summary → fulfillment passages for clarity.
  - Passage modal uses a React portal to guarantee full overlay (no bleed‑through) and scroll lock.
  - Integrated clear (×) within split search control; single global result badge.
  - Bilingual toggle (EN / DE) for summaries, categories, notes (where provided).
  - Disclaimer panel clarifying dataset is a work in progress (see below).

## Quick start (Users)

1. Choose a Bible version in the bottom controls.
2. In Read mode, use the arrows to navigate chapters; long‑press a verse to copy/share.
3. In Search mode, enter a query, select mode/scope, apply, then tap a verse to jump to reading.
4. Use Read aloud to listen; set “Read for …” or “stop‑at” (inclusive). The first to be reached stops playback.
5. Save (💾) to make your current Version/Book/Chapter the default on this device.

## Structure

```
index.html              # App entry
package.json            # Scripts & deps
vite.config.js          # Vite config
postcss.config.cjs      # PostCSS + Tailwind
tailwind.config.cjs     # Tailwind config
src/
  main.jsx              # Bootstraps React
  index.css             # Tailwind layers + globals
  App.jsx               # Root wrapper
  components/
    BibleApp.jsx        # Main feature component
public/bibles           # Bible JSON assets served statically

## Data format
```

## Bible JSON Format & Placement

Best practice: put large static Bible datasets under `public/bibles/` so they stream without bloating the JS bundle.

Required files:

```
public/
  bibles/
    index.json
    de_schlachter.json
    en_kjv.json
    ...etc
```

`index.json` structure:

```json
[
  {
    "language": "German",
    "versions": [{ "name": "Schlachter", "abbreviation": "de_schlachter" }]
  },
  {
    "language": "English",
    "versions": [{ "name": "King James Version", "abbreviation": "en_kjv" }]
  }
]
```

Version file example (`de_schlachter.json`):

```json
[
  { "name": "Genesis", "chapters": [["Verse 1", "Verse 2"], ["..."]] },
  { "name": "Exodus", "chapters": [["Verse 1"], ["..."]] }
]
```

Notes:

- The app uses the `name` field (full book name). `abbrev` is optional.
- If `public/bibles/index.json` isn’t found, it falls back to a bundled import (if present) then to a tiny sample.
- You may still provide a single `public/bible.json` (array of books) as a legacy fallback.
- Large file hosting: ensure gzip or brotli compression on production server for faster transfer.

## Prophecies Dataset (Beta)

File: `public/prophecies.json`

Each item (example trimmed):

```jsonc
{
  "id": 101,
  "prophecyRef": "Deuteronomy 18:15",
  "summary": {
    "en": {
      "prophecy": "Moses foretells a Prophet like himself…",
      "fulfillment": "Peter applies this to Christ (Acts 3)…"
    },
    "de": {
      "prophecy": "Mose kündigt einen Propheten wie ihn an…",
      "fulfillment": "Petrus bezieht dies auf Christus (Apg 3)…"
    }
  },
  "fulfillment": {
    "biblicalRef": "Acts 3:22; Acts 7:37",
    "externalRef": { "en": "", "de": "" }
  },
  "category": { "en": "Messianic", "de": "Messianisch" },
  "status": "Fulfilled"
}
```

Field notes:

- `prophecyRef`: one or more semicolon‑separated Bible references (first segment used for quick verse extraction).
- `summary.en|de.prophecy|fulfillment`: short overview lines displayed with colored borders.
- `fulfillment.biblicalRef`: verses indicating fulfillment; colored separately.
- `externalRef`: optional external / historical references (per language).
- `category`: free‑text grouping (bilingual object or single string).
- `status`: e.g. `Fulfilled`, `Future`, `Partial`, etc.

### Prophecy Search Modes

Uses the same tokenization logic as Bible search (All / Any / Phrase). While typing in the Prophecies view:

1. The draft query builds a live regex.
2. A dynamic preview count (amber badge with an asterisk) shows how many rows would match.
3. Press Apply to commit; highlighting then renders in references + summaries.
4. Clear (×) resets both draft & applied states.

### Building / Updating prophecies.json

Helper scripts reside in `scripts/`:

- `importProphecies.js` / `normalizePropheciesCsv.js` – transform CSV / Excel exports.
- `prophecies_excel_bridge.py` – bidirectional Excel bridge (see Python section below).
- `stripProphecyMeta.js` / `convertPropheciesToOverview.js` – optional denormalization & summarization helpers.

Typical flow:

1. Maintain a master Excel file (`BibleProphecies.xlsm`).
2. Run the macro buttons to export a normalized CSV/JSON.
3. Run Node scripts to post‑process (normalization / trimming / legend fields).
4. Place final `prophecies.json` under `public/` and commit.

### Disclaimer (Displayed In‑App)

The Prophecies & Fulfillments module is an **experimental prototype**. References, summaries, and linkages are still under manual review; _no guarantee of doctrinal, historical, or factual completeness or accuracy_ is implied. Always verify against Scripture. Corrections and contributions are welcome while this dataset remains a work in progress.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open the printed local URL (default http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

### Python helper scripts (Excel ↔ JSON)

If you plan to use the Excel import/export bridge (`scripts/prophecies_excel_bridge.py`):

```bash
python -m venv venv
venv\Scripts\activate    # Windows PowerShell / CMD
pip install -r requirements-dev.txt
```

Configure in the Excel `settings` sheet:

| Argument        | Value (example)                               |
| --------------- | --------------------------------------------- |
| python_exe      | C:\\path\\to\\repo\\venv\\Scripts\\python.exe |
| prophecies_json | C:\\path\\to\\repo\\public\\prophecies.json   |

Buttons (macros) call the Python script with `--mode import` / `--mode export`.

## Tailwind IntelliSense

If VS Code Tailwind IntelliSense isn't active, ensure the extension is installed and the config filename is `tailwind.config.cjs`.

## Deployment (Free Options)

Pick one of the following. GitHub Pages is fully automated via workflow (already included below once you commit / push).

### 1. GitHub Pages (static hosting)

Zero‑config here: workflow & `vite.config.js` already handle base path.

1. Initialize & push (see "Repo Setup" below).
2. Ensure repository visibility is Public (or have a plan that enables Pages for private repos).
3. First push to `main` triggers the Deploy workflow.
4. After it finishes, visit Settings → Pages: should show the URL.
5. Access at: `https://<your-user>.github.io/<repo-name>/` (replace placeholders).

Custom repo name? Pass it explicitly during local preview if needed:

```bash
VITE_REPO_NAME=my-repo-name npm run build
```

(CI already exports `GHPAGES=1`, using package name for base path.)

### 2. Vercel

1. Import the GitHub repo in Vercel dashboard.
2. Framework preset: Vite.
3. Build command: `npm run build` Output dir: `dist`.
4. Deploy – automatic on each push to main by default.

### 3. Netlify

1. New site from Git -> pick repository.
2. Build command: `npm run build` Publish directory: `dist`.
3. (Optional) Add `_headers` or compression rules later.

### 4. Cloudflare Pages

1. Create project → Connect to Git.
2. Build command: `npm run build` Build output directory: `dist`.
3. Set Framework preset to None (Vite auto works) or choose Vite.

All three (Vercel / Netlify / CF) auto‑detect; no extra config needed.

## Repo Setup (Git)

From project root (once):

```bash
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin git@github.com:<your-user>/<repo-name>.git  # or https url
git push -u origin main
```

Subsequent changes:

```bash
git add -u
git commit -m "feat: <describe>"
git push
```

## Manual Deploy (any static host)

```bash
npm run build
# upload dist/ folder contents to host root
```

## Environment / Caching Tips

- Place large Bible JSON files under `public/bibles` for direct static serving.
- Use gzip / brotli at the host (most hosts auto‑compress).
- Add a `?v=<hash>` query if you later need manual cache busting.

## Planned / Nice-to-Have Enhancements

- Worker offload for search on huge datasets.
- Server‑side and CDN caching for very large datasets.
- Better mobile install banners and offline strategy.
- Additional translations via optional packs.
- Extended in‑text highlighting in prophecy passage modal.
- Offline caching of prophecies dataset & version diffing.
- Worker offload for prophecy filtering on very large sets.

Enjoy & God bless! ✨
