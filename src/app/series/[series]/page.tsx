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
import StoryList from '@/components/StoryList';
import { allSeries, getSeries } from '@/lib/content';

type Params = { series: string };

// Every route is known at build time; nothing may be generated on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allSeries.map((s) => ({ series: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { series } = await params;
  const found = getSeries(series);
  return {
    title: found?.title ?? 'Series not found',
    description: found?.description || undefined,
  };
}

export default async function SeriesPage({ params }: { params: Promise<Params> }) {
  const { series: seriesSlug } = await params;
  const series = getSeries(seriesSlug);
  if (!series) notFound();

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
            <BreadcrumbPage>Series {series.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold tracking-tight">{series.title}</h1>
      {series.description && <p className="mt-2 text-muted-foreground">{series.description}</p>}

      <Separator className="my-7" />

      <StoryList series={series} />
    </div>
  );
}
