/**
 * Scans the root-level `pdf/` directory and turns it into:
 *   1. public/pdf/...            – the PDFs, served statically
 *   2. src/content/manifest.json – the index the app renders from
 *   3. public/pdf.worker.min.js  – the pdf.js worker, version-matched
 *   4. public/pdfjs/{cmaps,standard_fonts} – glyph data for pdf.js
 *
 * Expected source layout (story -> arc -> chapter):
 *   pdf/<story folder>/story.json                  (optional: { title, description, slug })
 *   pdf/<story folder>/<arc folder>/arc.json       (optional: { title, description, slug })
 *   pdf/<story folder>/<arc folder>/<chapter>.pdf
 *
 * A leading number ("01-", "02_", "3 ") sets the sort order and is
 * stripped from the display title.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_PDF = path.join(ROOT, 'pdf');
const OUT_PDF = path.join(ROOT, 'public', 'pdf');
const OUT_MANIFEST = path.join(ROOT, 'src', 'content', 'manifest.json');
const WORKER_SRC = path.join(ROOT, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
// Deliberately .js, not .mjs: this is an ES module worker, and module-ness
// comes from `new Worker(url, {type:'module'})` rather than the extension.
// Static hosts reliably serve .js as text/javascript; .mjs they often do not,
// and a module worker with a bad Content-Type is refused outright.
const WORKER_OUT = path.join(ROOT, 'public', 'pdf.worker.min.js');

/** "01-the-fall" -> { order: 1, rest: "the-fall" } */
function splitOrder(name) {
  const m = name.match(/^(\d+)\s*[-_.\s]\s*(.*)$/);
  if (m) return { order: Number(m[1]), rest: m[2] };
  return { order: Number.POSITIVE_INFINITY, rest: name };
}

/** Human title: "the-fall_of-rome" -> "The Fall Of Rome". Non-latin text is left alone. */
function toTitle(raw) {
  const spaced = raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return raw;
  return spaced.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * URL-safe slug. Thai/CJK titles collapse to empty, so callers pass a
 * fallback ("story-01") to keep every route ASCII and static-export safe.
 */
function slugify(raw, fallback) {
  const slug = raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Sub-directories of `dir`, in reading order, each with its parsed number prefix. */
async function orderedDirs(dir) {
  const names = (await fs.readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
  return names
    .map((name) => ({ name, ...splitOrder(name) }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'th'));
}

/** PDF files directly inside `dir`, in reading order. */
async function orderedPdfs(dir) {
  const names = (await fs.readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
    .map((e) => e.name);
  return names
    .map((file) => ({ file, ...splitOrder(path.basename(file, path.extname(file))) }))
    .sort((a, b) => a.order - b.order || a.file.localeCompare(b.file, 'th'));
}

/** Hands out slugs that are unique within one parent. */
function slugPool(prefix) {
  const seen = new Set();
  return (raw, index) => {
    let slug = slugify(raw, `${prefix}-${pad(index)}`);
    while (seen.has(slug)) slug = `${slug}-${pad(index)}`;
    seen.add(slug);
    return slug;
  };
}

async function buildChapters(arcDir, storySlug, arcSlug) {
  const chapters = [];
  const nextSlug = slugPool('ch');
  const outDir = path.join(OUT_PDF, storySlug, arcSlug);

  for (const [j, ch] of (await orderedPdfs(arcDir)).entries()) {
    const slug = nextSlug(ch.rest, j + 1);

    // Copy under a fully ASCII path so the deployed URL never needs escaping.
    const destName = `${slug}.pdf`;
    await fs.mkdir(outDir, { recursive: true });
    await fs.copyFile(path.join(arcDir, ch.file), path.join(outDir, destName));

    const { size, mtime } = await fs.stat(path.join(arcDir, ch.file));
    chapters.push({
      slug,
      title: toTitle(ch.rest),
      number: Number.isFinite(ch.order) ? ch.order : j + 1,
      file: `/pdf/${storySlug}/${arcSlug}/${destName}`,
      bytes: size,
      updated: mtime.toISOString(),
    });
  }
  return chapters;
}

async function buildArcs(storyDir, storySlug) {
  const arcs = [];
  const nextSlug = slugPool('arc');

  for (const [i, arc] of (await orderedDirs(storyDir)).entries()) {
    const arcDir = path.join(storyDir, arc.name);
    const meta = (await readJson(path.join(arcDir, 'arc.json'))) ?? {};
    const arcSlug = nextSlug(meta.slug ?? arc.rest, i + 1);

    arcs.push({
      slug: arcSlug,
      title: meta.title ?? toTitle(arc.rest),
      description: meta.description ?? '',
      number: Number.isFinite(arc.order) ? arc.order : i + 1,
      chapters: await buildChapters(arcDir, storySlug, arcSlug),
    });
  }
  return arcs;
}

async function buildStories() {
  const stories = [];
  const nextSlug = slugPool('story');

  for (const [i, story] of (await orderedDirs(SRC_PDF)).entries()) {
    const storyDir = path.join(SRC_PDF, story.name);
    const meta = (await readJson(path.join(storyDir, 'story.json'))) ?? {};
    const storySlug = nextSlug(meta.slug ?? story.rest, i + 1);

    stories.push({
      slug: storySlug,
      title: meta.title ?? toTitle(story.rest),
      description: meta.description ?? '',
      number: Number.isFinite(story.order) ? story.order : i + 1,
      arcs: await buildArcs(storyDir, storySlug),
    });
  }
  return stories;
}

async function main() {
  await fs.mkdir(SRC_PDF, { recursive: true });
  await fs.rm(OUT_PDF, { recursive: true, force: true });
  await fs.mkdir(OUT_PDF, { recursive: true });
  await fs.mkdir(path.dirname(OUT_MANIFEST), { recursive: true });

  const stories = await buildStories();
  const allArcs = stories.flatMap((s) => s.arcs);

  const manifest = {
    generatedAt: new Date().toISOString(),
    stories,
    totals: {
      stories: stories.length,
      arcs: allArcs.length,
      chapters: allArcs.reduce((n, a) => n + a.chapters.length, 0),
    },
  };

  await fs.writeFile(OUT_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  try {
    await fs.copyFile(WORKER_SRC, WORKER_OUT);
  } catch {
    console.warn('! pdf worker not found — run `npm install` first.');
  }

  // cMaps + standard fonts let pdf.js render CJK/Thai and non-embedded fonts.
  // Without them those glyphs silently come out blank.
  for (const dir of ['cmaps', 'standard_fonts']) {
    const from = path.join(ROOT, 'node_modules', 'pdfjs-dist', dir);
    const to = path.join(ROOT, 'public', 'pdfjs', dir);
    try {
      await fs.rm(to, { recursive: true, force: true });
      await fs.cp(from, to, { recursive: true });
    } catch {
      console.warn(`! could not copy pdfjs/${dir}`);
    }
  }

  await fs.writeFile(path.join(ROOT, 'public', '.nojekyll'), '');

  const { totals } = manifest;
  console.log(
    `content: ${totals.stories} story(ies), ${totals.arcs} arc(s), ${totals.chapters} chapter(s)` +
      (totals.chapters === 0 ? '  (drop PDFs into pdf/<story>/<arc>/ to populate)' : '')
  );
  for (const s of stories) {
    console.log(`  ${s.slug}  "${s.title}"`);
    for (const a of s.arcs) {
      console.log(`    ${a.slug}  "${a.title}"  -> ${a.chapters.length} chapter(s)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
