import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import ChapterView from '@/components/ChapterView';
import {
  allSeries,
  arcHref,
  asset,
  chapterHref,
  getChapter,
  neighbours,
  seriesHref,
  storyHref,
} from '@/lib/content';

type Params = { series: string; story: string; arc: string; chapter: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allSeries.flatMap((se) =>
    se.stories.flatMap((s) =>
      s.arcs.flatMap((a) =>
        a.chapters.map((c) => ({ series: se.slug, story: s.slug, arc: a.slug, chapter: c.slug }))
      )
    )
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { series, story, arc, chapter } = await params;
  const found = getChapter(series, story, arc, chapter);
  if (!found) return { title: 'Chapter not found' };
  return {
    title: found.chapter.title,
    description: `${found.series.title} — ${found.story.title} — ${found.arc.title} — ${found.chapter.title}`,
  };
}

export default async function ReadPage({ params }: { params: Promise<Params> }) {
  const { series: seriesSlug, story: storySlug, arc: arcSlug, chapter: chapterSlug } = await params;
  const found = getChapter(seriesSlug, storySlug, arcSlug, chapterSlug);
  if (!found) notFound();

  const { series, story, arc, chapter } = found;
  const { prev, next } = neighbours(seriesSlug, storySlug, arcSlug, chapterSlug);

  return (
    <div className="mx-auto w-full max-w-4xl px-5">
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Contents</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={seriesHref(series)}>{series.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={storyHref(series, story)}>{story.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={arcHref(series, story, arc)}>{arc.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{chapter.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{chapter.title}</h1>

      <ChapterView file={asset(chapter.file)} title={chapter.title} />

      <nav className="mt-8 grid gap-2.5 sm:grid-cols-2" aria-label="Previous / next chapter">
        <PagerSlot
          href={prev ? chapterHref(prev.series, prev.story, prev.arc, prev.chapter) : undefined}
          label="Previous chapter"
          title={prev?.chapter.title ?? 'This is the first chapter of the story'}
          icon={<ArrowLeft className="size-3.5" />}
        />
        <PagerSlot
          href={next ? chapterHref(next.series, next.story, next.arc, next.chapter) : undefined}
          label="Next chapter"
          title={next?.chapter.title ?? 'You have reached the latest chapter'}
          icon={<ArrowRight className="size-3.5" />}
          align="end"
        />
      </nav>
    </div>
  );
}

/** One half of the prev/next pair — a link when there is a neighbour, an inert card when there isn't. */
function PagerSlot({
  href,
  label,
  title,
  icon,
  align = 'start',
}: {
  href?: string;
  label: string;
  title: string;
  icon: React.ReactNode;
  align?: 'start' | 'end';
}) {
  const body = (
    <Card
      data-disabled={href ? undefined : ''}
      className={`gap-1 p-3.5 transition-colors data-disabled:opacity-50 ${
        href ? 'hover:border-ring/60' : ''
      } ${align === 'end' ? 'sm:items-end sm:text-right' : ''}`}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {align === 'start' && icon}
        {label}
        {align === 'end' && icon}
      </span>
      <span className="text-sm">{title}</span>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
