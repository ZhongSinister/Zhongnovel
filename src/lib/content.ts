import manifest from '@/content/manifest.json';

export type Chapter = {
  slug: string;
  title: string;
  number: number;
  /** Root-relative path, e.g. "/pdf/the-quiet-year/the-letter/a-house-of-shut-doors.pdf" */
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

export type Story = {
  slug: string;
  title: string;
  description: string;
  number: number;
  arcs: Arc[];
};

export type Manifest = {
  generatedAt: string;
  stories: Story[];
  totals: { stories: number; arcs: number; chapters: number };
};

export const content = manifest as Manifest;
export const stories = content.stories;

/** basePath is stripped by Next for routes but NOT for raw asset URLs. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Turn a manifest path into one that works under a GitHub Pages subpath. */
export function asset(p: string): string {
  return `${BASE_PATH}${p}`;
}

export function getStory(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}

export function getArc(storySlug: string, arcSlug: string) {
  const story = getStory(storySlug);
  const arc = story?.arcs.find((a) => a.slug === arcSlug);
  if (!story || !arc) return undefined;
  return { story, arc };
}

export function getChapter(storySlug: string, arcSlug: string, chapterSlug: string) {
  const found = getArc(storySlug, arcSlug);
  const index = found?.arc.chapters.findIndex((c) => c.slug === chapterSlug) ?? -1;
  if (!found || index < 0) return undefined;
  return { ...found, chapter: found.arc.chapters[index], index };
}

/** Number of chapters across every arc of a story. */
export function chapterCount(story: Story): number {
  return story.arcs.reduce((n, a) => n + a.chapters.length, 0);
}

/**
 * Flat reading order inside one story, used for prev/next navigation.
 * It crosses arc boundaries but never leaves the story — stories may be
 * different characters or eras, so jumping between them would be jarring.
 */
export function readingOrder(story: Story) {
  return story.arcs.flatMap((arc) => arc.chapters.map((chapter) => ({ story, arc, chapter })));
}

export function neighbours(storySlug: string, arcSlug: string, chapterSlug: string) {
  const story = getStory(storySlug);
  const flat = story ? readingOrder(story) : [];
  const i = flat.findIndex((e) => e.arc.slug === arcSlug && e.chapter.slug === chapterSlug);
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
    position: i + 1,
    total: flat.length,
  };
}

export function storyHref(story: Story) {
  return `/story/${story.slug}`;
}

export function arcHref(story: Story, arc: Arc) {
  return `/story/${story.slug}/${arc.slug}`;
}

export function chapterHref(story: Story, arc: Arc, chapter: Chapter) {
  return `/read/${story.slug}/${arc.slug}/${chapter.slug}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
