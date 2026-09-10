import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { allSeries, arcHref, getStory, plural, seriesHref } from '@/lib/content';

type Params = { series: string; story: string };

// Every route is known at build time; nothing may be generated on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allSeries.flatMap((se) => se.stories.map((s) => ({ series: se.slug, story: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { series, story } = await params;
  const found = getStory(series, story);
  if (!found) return { title: 'Story not found' };
  return {
    title: `${found.story.title} · ${found.series.title}`,
    description: found.story.description || undefined,
  };
}

export default async function StoryPage({ params }: { params: Promise<Params> }) {
  const { series: seriesSlug, story: storySlug } = await params;
  const found = getStory(seriesSlug, storySlug);
  if (!found) notFound();

  const { series, story } = found;

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
            <BreadcrumbPage>Story {story.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold tracking-tight">{story.title}</h1>
      {story.description && <p className="mt-2 text-muted-foreground">{story.description}</p>}

      <Separator className="my-7" />

      {story.arcs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          This story has no arcs yet. Create an arc folder inside the story folder, add PDFs, and
          rebuild.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {story.arcs.map((arc) => (
            <li key={arc.slug}>
              <Link href={arcHref(series, story, arc)} className="group block">
                <Card className="transition-colors group-hover:border-ring/60">
                  <CardHeader>
                    <Badge variant="secondary" className="mb-1.5 w-fit font-normal">
                      Arc {arc.number}
                    </Badge>
                    <CardTitle className="text-lg">{arc.title}</CardTitle>
                    {arc.description && (
                      <p className="text-sm text-muted-foreground">{arc.description}</p>
                    )}
                    <CardDescription className="flex items-center gap-1">
                      {arc.chapters.length} {plural(arc.chapters.length, 'chapter', 'chapters')}
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
