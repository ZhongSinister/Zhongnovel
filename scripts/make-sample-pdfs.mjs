/**
 * Generates placeholder chapter PDFs so the site has something to render
 * before the real novel is dropped in. Writes raw PDF bytes — no dependencies.
 *
 *   npm run samples          # only creates files that don't exist yet
 *   npm run samples -- --force
 *
 * Delete pdf/ and replace it with your own stories when you're ready.
 *
 * Layout written: pdf/<story>/story.json, pdf/<story>/<arc>/arc.json, pdf/<story>/<arc>/<chapter>.pdf
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PDF_DIR = path.join(ROOT, 'pdf');
const FORCE = process.argv.includes('--force');

const PAGE_W = 595.28; // A4 @ 72dpi
const PAGE_H = 841.89;
const MARGIN = 64;

/**
 * Fold typographic characters down to ASCII. The base-14 Helvetica used here
 * is WinAnsi-encoded, and anything outside it silently renders as a blank gap
 * rather than failing loudly.
 */
const asciify = (s) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7e\n]/g, '');

/** Escape the three characters that are special inside a PDF literal string. */
const esc = (s) => asciify(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/** Greedy wrap at an approximate Helvetica advance width (~0.5em average). */
function wrap(text, size, maxWidth) {
  const perChar = size * 0.5;
  const max = Math.max(8, Math.floor(maxWidth / perChar));
  const lines = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (!line.length) line = word;
      else if (line.length + 1 + word.length <= max) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function contentStream({ heading, subheading, body, footer }) {
  const usable = PAGE_W - MARGIN * 2;
  const ops = [];
  let y = PAGE_H - MARGIN - 24;

  ops.push('BT', `/F2 22 Tf`, `1 0 0 1 ${MARGIN} ${y} Tm`, `(${esc(heading)}) Tj`, 'ET');
  y -= 26;
  ops.push('BT', `/F1 11 Tf`, '0.45 0.42 0.38 rg', `1 0 0 1 ${MARGIN} ${y} Tm`, `(${esc(subheading)}) Tj`, 'ET', '0 0 0 rg');
  y -= 18;
  ops.push(`0.8 0.76 0.7 RG`, '0.8 w', `${MARGIN} ${y} m ${PAGE_W - MARGIN} ${y} l S`);
  y -= 30;

  ops.push('BT', '/F1 11.5 Tf', '16 TL', `1 0 0 1 ${MARGIN} ${y} Tm`);
  for (const line of wrap(body, 11.5, usable)) {
    ops.push(line ? `(${esc(line)}) Tj T*` : 'T*');
  }
  ops.push('ET');

  ops.push('BT', '/F1 9 Tf', '0.55 0.52 0.48 rg', `1 0 0 1 ${MARGIN} ${MARGIN - 20} Tm`, `(${esc(footer)}) Tj`, 'ET');
  return ops.join('\n');
}

function buildPdf(pages, title) {
  // Object ids: 1 catalog, 2 pages, 3 F1, 4 F2, then page/content pairs.
  const objects = [];
  const pageIds = pages.map((_, i) => 5 + i * 2);

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pages.forEach((page, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const stream = contentStream(page);
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });

  const count = objects.length;
  let out = `%PDF-1.4\n%\xe2\xe3\xcf\xd3\n`;
  const offsets = [];

  for (let id = 1; id < count; id += 1) {
    offsets[id] = Buffer.byteLength(out, 'latin1');
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefAt = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id += 1) {
    out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  out +=
    `trailer\n<< /Size ${count} /Root 1 0 R /Info << /Title (${esc(title)}) ` +
    `/Producer (zhongnovel sample generator) >> >>\nstartxref\n${xrefAt}\n%%EOF\n`;

  return Buffer.from(out, 'latin1');
}

const LOREM = `The lamp had burned down to its last finger of oil by the time she finished reading, and still she did not move. Outside, the rain had turned the courtyard into a sheet of hammered tin, loud enough that she had not heard the messenger arrive, nor heard him leave.

Placeholder text. Replace this file with a real chapter of your novel — the site reads whatever PDFs it finds, so nothing here needs to change but the file itself.

She folded the letter along its old creases until it was small enough to disappear inside her palm, and then she sat with it there, the way one sits with a bird that has stopped struggling. There would be time to decide in the morning. There is always, she told herself, time to decide in the morning.

That was the first lie of many, and she would remember it later with something close to fondness — the last small untruth she told before the large ones became necessary.`;

const SAMPLE = [
  {
    dir: '01-the-quiet-year',
    story: {
      title: 'The Quiet Year',
      description: 'A single winter in a house at the edge of the marsh, told by the woman who inherited it.',
    },
    arcs: [
      {
        dir: '01-the-letter',
        arc: { title: 'The Letter', description: 'Where the letter arrives, and nothing is the same after.' },
        chapters: ['01-a-house-of-shut-doors', '02-what-the-rain-carried', '03-the-first-lie'],
      },
      {
        dir: '02-salt-and-iron',
        arc: { title: 'Salt and Iron', description: 'The road south, and the debts waiting at the end of it.' },
        chapters: ['01-the-road-south', '02-the-weight-of-names'],
      },
    ],
  },
  {
    dir: '02-the-lantern-coast',
    story: {
      title: 'The Lantern Coast',
      description: 'Two hundred years later, a lighthouse keeper finds the same letter in a bottle.',
    },
    arcs: [
      {
        dir: '01-low-tide',
        arc: { title: 'Low Tide', description: 'What the sea gives back.' },
        chapters: ['01-the-bottle', '02-the-keeper'],
      },
    ],
  },
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const story of SAMPLE) {
    const storyDir = path.join(PDF_DIR, story.dir);
    await fs.mkdir(storyDir, { recursive: true });

    const storyMeta = path.join(storyDir, 'story.json');
    if (FORCE || !(await exists(storyMeta))) {
      await fs.writeFile(storyMeta, `${JSON.stringify(story.story, null, 2)}\n`);
    }

    for (const arc of story.arcs) {
      const dir = path.join(storyDir, arc.dir);
      await fs.mkdir(dir, { recursive: true });

      const metaPath = path.join(dir, 'arc.json');
      if (FORCE || !(await exists(metaPath))) {
        await fs.writeFile(metaPath, `${JSON.stringify(arc.arc, null, 2)}\n`);
      }

      for (const [i, name] of arc.chapters.entries()) {
        const file = path.join(dir, `${name}.pdf`);
        if (!FORCE && (await exists(file))) {
          skipped += 1;
          continue;
        }
        const pretty = name.replace(/^\d+[-_.\s]/, '').replace(/-/g, ' ');
        const title = pretty.replace(/\b[a-z]/g, (c) => c.toUpperCase());
        const subheading = `${story.story.title}  —  ${arc.arc.title}  —  Chapter ${i + 1}`;
        const pages = [
          {
            heading: title,
            subheading,
            body: LOREM,
            footer: `${story.story.title} / ${arc.arc.title} / ${title} / page 1 of 2`,
          },
          {
            heading: 'Continued',
            subheading,
            body: LOREM.split('\n\n').reverse().join('\n\n'),
            footer: `${story.story.title} / ${arc.arc.title} / ${title} / page 2 of 2`,
          },
        ];
        await fs.writeFile(file, buildPdf(pages, `${story.story.title} - ${arc.arc.title} - ${title}`));
        created += 1;
      }
    }
  }

  console.log(`samples: ${created} created, ${skipped} left alone (use --force to overwrite)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
