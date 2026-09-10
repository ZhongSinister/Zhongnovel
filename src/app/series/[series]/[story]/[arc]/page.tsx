import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { allSeries, chapterHref, formatBytes, getArc, seriesHref, storyHref } from '@/lib/content';

type Params = { series: string; story: string; arc: string };

// Every route is known at build time; nothing may be generated on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allSeries.flatMap((se) =>
    se.stories.flatMap((s) => s.arcs.map((a) => ({ series: se.slug, story: s.slug, arc: a.slug })))
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { series, story, arc } = await params;
  const found = getArc(series, story, arc);
  if (!found) return { title: 'Arc not found' };
  return {
    title: `${found.arc.title} · ${found.story.title}`,
    description: found.arc.description || undefined,
  };
}

export default async function ArcPage({ params }: { params: Promise<Params> }) {
  const { series: seriesSlug, story: storySlug, arc: arcSlug } = await params;
  const found = getArc(seriesSlug, storySlug, arcSlug);
  if (!found) notFound();

  const { series, story, arc } = found;

  return (
    <div className="mx-auto w-full max-w-2xl px-5">
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
            <BreadcrumbPage>Arc {arc.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold tracking-tight">{arc.title}</h1>
      {arc.description && <p className="mt-2 text-muted-foreground">{arc.description}</p>}

      <Separator className="my-7" />

      {arc.chapters.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          This arc has no chapters yet. Add PDF files to the arc folder and rebuild.
        </p>
      ) : (
        <ul className="border-t border-border">
          {arc.chapters.map((ch, i) => (
            <li key={ch.slug}>
              <Link
                href={chapterHref(series, story, arc, ch)}
                className="flex items-baseline gap-3.5 border-b border-border px-1 py-3.5 text-sm transition-colors hover:text-muted-foreground"
              >
                <span className="min-w-6 tabular-nums text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{ch.title}</span>
                <span className="tabular-nums text-xs text-muted-foreground">
                  {formatBytes(ch.bytes)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
