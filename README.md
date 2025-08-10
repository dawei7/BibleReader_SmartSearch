# Bible Reader · Smart Search

Modern Bible reading & powerful multi‑mode search (all / any / phrase) with per‑book & per‑chapter statistics.

## Live Demo

https://dawei7.github.io/BibleReader_SmartSearch/


## Stack

- Vite 7 (fast dev + build)
- React 19 (JSX)
- Tailwind CSS 3
- Framer Motion (UI motion)
- Recharts (charts)

No TypeScript yet (pure JSX) – easy to add later.

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

- The app now uses the `name` field (full book name). `abbrev` can be present but is optional.
- If `public/bibles/index.json` isn’t found, it falls back to a bundled import (if present) then to a tiny sample.
- You may still provide a single `public/bible.json` (array of books) as a legacy fallback.
- Large file hosting: ensure gzip or brotli compression on production server for faster transfer.

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
- Persistent last read location & preferences.
- Verse selection + sharing links.
- Import additional translations lazily.

Enjoy & God bless! ✨


