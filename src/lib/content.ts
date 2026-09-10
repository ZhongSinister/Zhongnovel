import manifest from '@/content/manifest.json';

export type Chapter = {
  slug: string;
  title: string;
  number: number;
  /** Root-relative path, e.g. "/pdf/zhongnovel/the-quiet-year/the-letter/a-house-of-shut-doors.pdf" */
  file: string;
  bytes: number;
  updated: string;
};

export type Arc = {
  slug: string;
  title: string;
  description: string;
  number: number;
  chapters: Chapter[];
};

/** One character, era or timeline inside a series. */
export type Story = {
  slug: string;
  title: string;
  description: string;
  number: number;
  arcs: Arc[];
};

/** The whole work — "Harry Potter", "Dune". The top level of the site. */
export type Series = {
  slug: string;
  title: string;
  description: string;
  number: number;
  stories: Story[];
};

export type Manifest = {
  generatedAt: string;
  series: Series[];
  totals: { series: number; stories: number; arcs: number; chapters: number };
};

export const content = manifest as Manifest;
export const allSeries = content.series;

/** basePath is stripped by Next for routes but NOT for raw asset URLs. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Turn a manifest path into one that works under a GitHub Pages subpath. */
export function asset(p: string): string {
  return `${BASE_PATH}${p}`;
}

export function getSeries(slug: string): Series | undefined {
  return allSeries.find((s) => s.slug === slug);
}

export function getStory(seriesSlug: string, storySlug: string) {
  const series = getSeries(seriesSlug);
  const story = series?.stories.find((s) => s.slug === storySlug);
  if (!series || !story) return undefined;
  return { series, story };
}

export function getArc(seriesSlug: string, storySlug: string, arcSlug: string) {
  const found = getStory(seriesSlug, storySlug);
  const arc = found?.story.arcs.find((a) => a.slug === arcSlug);
  if (!found || !arc) return undefined;
  return { ...found, arc };
}

export function getChapter(seriesSlug: string, storySlug: string, arcSlug: string, chapterSlug: string) {
  const found = getArc(seriesSlug, storySlug, arcSlug);
  const index = found?.arc.chapters.findIndex((c) => c.slug === chapterSlug) ?? -1;
  if (!found || index < 0) return undefined;
  return { ...found, chapter: found.arc.chapters[index], index };
}

/** Number of chapters across every arc of a story. */
export function chapterCount(story: Story): number {
  return story.arcs.reduce((n, a) => n + a.chapters.length, 0);
}

/** Arc and chapter counts across every story of a series. */
export function seriesCounts(series: Series) {
  return {
    stories: series.stories.length,
    arcs: series.stories.reduce((n, s) => n + s.arcs.length, 0),
    chapters: series.stories.reduce((n, s) => n + chapterCount(s), 0),
  };
}

/**
 * Flat reading order inside one story, used for prev/next navigation.
 * It crosses arc boundaries but never leaves the story — stories may be
 * different characters or eras, so jumping between them would be jarring.
 */
export function readingOrder(series: Series, story: Story) {
  return story.arcs.flatMap((arc) => arc.chapters.map((chapter) => ({ series, story, arc, chapter })));
}

export function neighbours(seriesSlug: string, storySlug: string, arcSlug: string, chapterSlug: string) {
  const found = getStory(seriesSlug, storySlug);
  const flat = found ? readingOrder(found.series, found.story) : [];
  const i = flat.findIndex((e) => e.arc.slug === arcSlug && e.chapter.slug === chapterSlug);
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
    position: i + 1,
    total: flat.length,
  };
}

export function seriesHref(series: Series) {
  return `/series/${series.slug}`;
}

export function storyHref(series: Series, story: Story) {
  return `/series/${series.slug}/${story.slug}`;
}

export function arcHref(series: Series, story: Story, arc: Arc) {
  return `/series/${series.slug}/${story.slug}/${arc.slug}`;
}

export function chapterHref(series: Series, story: Story, arc: Arc, chapter: Chapter) {
  return `/read/${series.slug}/${story.slug}/${arc.slug}/${chapter.slug}`;
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
