import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { chapterCount, stories, storyHref } from '@/lib/content';

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5">
      <section className="mb-11">
        <h1 className="text-3xl font-semibold tracking-tight">zhongnovel</h1>
        <p className="mt-2.5 max-w-[46ch] text-muted-foreground">
          อ่านได้เลยบนหน้าเว็บ หรือดาวน์โหลดไฟล์ PDF เก็บไว้อ่านทีหลัง
        </p>
      </section>

      <section>
        <h2 className="mb-3.5 text-sm text-muted-foreground">เรื่องทั้งหมด</h2>

        {stories.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>ยังไม่มีเรื่องในระบบ</CardTitle>
              <CardDescription>
                วางไฟล์ PDF ไว้ใน{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  pdf/&lt;เรื่อง&gt;/&lt;ภาค&gt;/&lt;ตอน&gt;.pdf
                </code>{' '}
                แล้วรัน <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev</code> อีกครั้ง
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {stories.map((story) => (
              <li key={story.slug}>
                <Link href={storyHref(story)} className="group block">
                  <Card className="transition-colors group-hover:border-ring/60">
                    <CardHeader>
                      <Badge variant="secondary" className="mb-1.5 w-fit font-normal">
                        เรื่องที่ {story.number}
                      </Badge>
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      {story.description && (
                        <p className="text-sm text-muted-foreground">{story.description}</p>
                      )}
                      <CardDescription className="flex items-center gap-1">
                        {story.arcs.length} ภาค · {chapterCount(story)} ตอน
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
