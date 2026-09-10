import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { allSeries, plural, seriesCounts, seriesHref } from '@/lib/content';

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5">
      <section className="mb-11">
        <h1 className="text-3xl font-semibold tracking-tight">zhongnovel</h1>
        <p className="mt-2.5 max-w-[46ch] text-muted-foreground">
          Read in the browser, or download the PDF to keep for later.
        </p>
      </section>

      <section>
        <h2 className="mb-3.5 text-sm text-muted-foreground">Series</h2>

        {allSeries.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Nothing here yet</CardTitle>
              <CardDescription>
                Put PDF files in{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  pdf/&lt;series&gt;/&lt;story&gt;/&lt;arc&gt;/&lt;chapter&gt;.pdf
                </code>{' '}
                and run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev</code> again.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {allSeries.map((series) => {
              const counts = seriesCounts(series);
              return (
                <li key={series.slug}>
                  <Link href={seriesHref(series)} className="group block">
                    <Card className="transition-colors group-hover:border-ring/60">
                      <CardHeader>
                        <Badge variant="secondary" className="mb-1.5 w-fit font-normal">
                          Series {series.number}
                        </Badge>
                        <CardTitle className="text-lg">{series.title}</CardTitle>
                        {series.description && (
                          <p className="text-sm text-muted-foreground">{series.description}</p>
                        )}
                        <CardDescription className="flex items-center gap-1">
                          {counts.stories} {plural(counts.stories, 'story', 'stories')} · {counts.chapters}{' '}
                          {plural(counts.chapters, 'chapter', 'chapters')}
                          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
