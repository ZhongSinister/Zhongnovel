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
import { chapterHref, formatBytes, getArc, stories, storyHref } from '@/lib/content';

type Params = { story: string; arc: string };

// Every route is known at build time; nothing may be generated on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return stories.flatMap((s) => s.arcs.map((a) => ({ story: s.slug, arc: a.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { story, arc } = await params;
  const found = getArc(story, arc);
  if (!found) return { title: 'ไม่พบภาคนี้' };
  return {
    title: `${found.arc.title} · ${found.story.title}`,
    description: found.arc.description || undefined,
  };
}

export default async function ArcPage({ params }: { params: Promise<Params> }) {
  const { story: storySlug, arc: arcSlug } = await params;
  const found = getArc(storySlug, arcSlug);
  if (!found) notFound();

  const { story, arc } = found;

  return (
    <div className="mx-auto w-full max-w-2xl px-5">
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">สารบัญ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={storyHref(story)}>{story.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ภาคที่ {arc.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold tracking-tight">{arc.title}</h1>
      {arc.description && <p className="mt-2 text-muted-foreground">{arc.description}</p>}

      <Separator className="my-7" />

      {arc.chapters.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          ภาคนี้ยังไม่มีตอน — เพิ่มไฟล์ PDF ลงในโฟลเดอร์ของภาคนี้แล้วบิลด์ใหม่อีกครั้ง
        </p>
      ) : (
        <ul className="border-t border-border">
          {arc.chapters.map((ch, i) => (
            <li key={ch.slug}>
              <Link
                href={chapterHref(story, arc, ch)}
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
