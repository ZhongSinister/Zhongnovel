# zhongnovel

A static website for reading a novel that is written as PDF files. Drop a PDF
into a folder, rebuild, and it shows up in the table of contents with a reader
attached — no CMS, no database, no server.

Built with Next.js (TypeScript, App Router), Tailwind CSS v4 and shadcn/ui,
exported as plain static files so it can be hosted for free on GitHub Pages.

---

## How the content works

Everything the site shows comes from the `pdf/` folder at the repo root:

```
pdf/
└── 01-zhongnovel/                          <- series (the whole work: "Harry Potter", "Dune")
    ├── series.json                         (optional)
    ├── 01-the-quiet-year/                  <- story (a character, era or timeline)
    │   ├── story.json                      (optional)
    │   ├── 01-the-letter/                  <- arc
    │   │   ├── arc.json                    (optional)
    │   │   ├── 01-a-house-of-shut-doors.pdf    <- chapter
    │   │   ├── 02-what-the-rain-carried.pdf
    │   │   └── 03-the-first-lie.pdf
    │   └── 02-salt-and-iron/
    │       ├── arc.json
    │       ├── 01-the-road-south.pdf
    │       └── 02-the-weight-of-names.pdf
    └── 02-the-lantern-coast/
        ├── story.json
        └── 01-low-tide/
            ├── arc.json
            ├── 01-the-bottle.pdf
            └── 02-the-keeper.pdf
```

Four levels: a top-level folder is a **series** (the whole work, the way
"Harry Potter" or "Dune" is one series), a folder inside it is a **story** (a
character, era or timeline within that series), a folder inside a story is an
**arc**, and each PDF inside an arc is a **chapter**. That is the whole content
model.

The home page always lists the series, even when there is only one.

`scripts/build-content.mjs` runs before every `dev` and `build`. It scans that
folder, copies the PDFs into `public/pdf/`, and writes
`src/content/manifest.json`, which the pages render from. You never edit the
manifest by hand.

### Naming rules

| What you write | What it does |
|---|---|
| `01-`, `02_`, `3 ` prefix | Sets the sort order, and is stripped from the displayed title |
| `the-letter.pdf` | Displayed as "The Letter"; dashes and underscores become spaces |
| Thai or other non-Latin names | Kept as the display title; the URL falls back to `series-01` / `story-01` / `arc-01` / `ch-01` so links stay ASCII |
| No number prefix | Sorts last, alphabetically |

### `series.json`, `story.json` and `arc.json` (optional)

Put `series.json` in a series folder, `story.json` in a story folder, or
`arc.json` in an arc folder, to override what is shown:

```json
{
  "title": "The Quiet Year",
  "description": "Where the letter arrives, and nothing is the same after.",
  "slug": "quiet-year"
}
```

All three keys are optional. Without the file, the title comes from the folder
name.

---

## Adding a chapter

1. Export your chapter as a PDF. **Embed the fonts** — especially for Thai text.
   A PDF without embedded fonts can render with missing glyphs in the browser.
2. Save it into the right series, story and arc folder with a number prefix:
   `pdf/01-zhongnovel/01-the-quiet-year/01-the-letter/04-the-long-road.pdf`
   (make a new arc, story or series folder the same way)
3. Run `npm run dev` and check it locally.
4. Commit and push. The GitHub Actions workflow rebuilds and redeploys the site.

Nothing else needs to change — no route, no config, no list to update.

---

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm run dev` | Rebuild content, then start the dev server on http://localhost:3000 |
| `npm run build` | Rebuild content and export the static site into `out/` |
| `npm run preview` | Build without a base path and serve `out/` on http://localhost:4000 |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run samples` | Regenerate the placeholder chapter PDFs (`-- --force` to overwrite) |
| `npm run clean` | Delete all generated output |

---

## Project structure

```
pdf/                        series/stories/arcs/chapters — the only folder you edit day to day
scripts/
  build-content.mjs         pdf/ -> public/pdf/ + manifest.json
  make-sample-pdfs.mjs      generates the placeholder chapters
src/
  app/
    page.tsx                home: list of series
    series/[series]/        story list for one series
    series/[series]/[story]/        arc list for one story
    series/[series]/[story]/[arc]/  chapter list for one arc
    read/[series]/[story]/[arc]/[chapter]/   the reader page
    globals.css             Tailwind entry + shadcn theme tokens (dark only)
  components/
    StoryList.tsx           story cards for the series page
    ui/                     shadcn/ui components — owned by this repo, edit freely
    ChapterView.tsx         client-only boundary for the reader
    PdfReader.tsx           the pdf.js reader itself
  lib/
    content.ts              typed access to the manifest
    utils.ts                the shadcn `cn()` class merger
components.json             shadcn CLI config
.github/workflows/deploy.yml  builds and deploys to GitHub Pages
```

Generated paths — `public/pdf/`, `public/pdfjs/`, `public/pdf.worker.min.js`,
`src/content/manifest.json`, `out/` — are all gitignored. The source PDFs are
committed; the copies are not.

---

## The reader

- Continuous scroll, all pages of the chapter in one column
- Zoom controls and a download button
- Keyboard: `←` / `→` (or `k` / `j`) to change page, `+` / `−` to zoom, `0` to reset
- Selectable text, so browser find-in-page works on the chapter
- Previous / next chapter navigation that continues across arcs, but stays
  inside the current story

The UI text is English only. The `<html>` element is `lang="en"`, and the Noto
Sans Thai font stays loaded so Thai chapter titles taken from file names still
render well.

The UI is a single dark theme. `<html>` carries the `dark` class permanently,
so the light palette in `globals.css` is never used and there is no toggle.

### Adding a shadcn component

```bash
npx shadcn@latest add dialog
```

It lands in `src/components/ui/` as source you own — change it like any other
file in the repo.

---

## Deploying

Static export, so any static host works. `DEPLOYMENT.md` (kept locally, not
committed) has the full GitHub Pages walkthrough.

Two things matter:

- **The repo must be public** for GitHub Pages on a free account. Private Pages
  needs GitHub Pro.
- **`basePath`** must match where the site is served from. A project site lives
  at `https://<user>.github.io/<repo>/`, so the build needs
  `NEXT_PUBLIC_BASE_PATH=/<repo>`. The workflow sets this from the repo name
  automatically. For a `<user>.github.io` repo or a custom domain, set it to an
  empty string.

In GitHub, set **Settings → Pages → Source** to **GitHub Actions** (not "Deploy
from a branch" — Next.js does not commit built HTML to the repo, so serving the
`main` branch root would find no `index.html`).

---

## Notes

- The PDFs currently in `pdf/` are placeholders generated by
  `npm run samples`. Delete them and add your own series.
- pdf.js cMaps and standard fonts are copied into `public/pdfjs/` at build time,
  which is what lets Thai and other non-Latin glyphs render.
