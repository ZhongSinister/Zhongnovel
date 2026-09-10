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
import { arcHref, getStory, stories } from '@/lib/content';

type Params = { story: string };

// Every route is known at build time; nothing may be generated on demand.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return stories.map((s) => ({ story: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { story } = await params;
  const found = getStory(story);
  return {
    title: found?.title ?? 'ไม่พบเรื่องนี้',
    description: found?.description || undefined,
  };
}

export default async function StoryPage({ params }: { params: Promise<Params> }) {
  const { story: storySlug } = await params;
  const story = getStory(storySlug);
  if (!story) notFound();

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
            <BreadcrumbPage>เรื่องที่ {story.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold tracking-tight">{story.title}</h1>
      {story.description && <p className="mt-2 text-muted-foreground">{story.description}</p>}

      <Separator className="my-7" />

      {story.arcs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          เรื่องนี้ยังไม่มีภาค — สร้างโฟลเดอร์ภาคไว้ในโฟลเดอร์ของเรื่องนี้ วางไฟล์ PDF แล้วบิลด์ใหม่อีกครั้ง
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {story.arcs.map((arc) => (
            <li key={arc.slug}>
              <Link href={arcHref(story, arc)} className="group block">
                <Card className="transition-colors group-hover:border-ring/60">
                  <CardHeader>
                    <Badge variant="secondary" className="mb-1.5 w-fit font-normal">
                      ภาคที่ {arc.number}
                    </Badge>
                    <CardTitle className="text-lg">{arc.title}</CardTitle>
                    {arc.description && (
                      <p className="text-sm text-muted-foreground">{arc.description}</p>
                    )}
                    <CardDescription className="flex items-center gap-1">
                      {arc.chapters.length} ตอน
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
