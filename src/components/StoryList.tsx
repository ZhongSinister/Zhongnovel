import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { chapterCount, plural, storyHref, type Series } from '@/lib/content';

/** The stories inside one series, as cards. */
export default function StoryList({ series }: { series: Series }) {
  if (series.stories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        This series has no stories yet. Create a story folder inside the series folder, add arc
        folders with PDFs, and rebuild.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {series.stories.map((story) => {
        const chapters = chapterCount(story);
        return (
          <li key={story.slug}>
            <Link href={storyHref(series, story)} className="group block">
              <Card className="transition-colors group-hover:border-ring/60">
                <CardHeader>
                  <Badge variant="secondary" className="mb-1.5 w-fit font-normal">
                    Story {story.number}
                  </Badge>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  {story.description && (
                    <p className="text-sm text-muted-foreground">{story.description}</p>
                  )}
                  <CardDescription className="flex items-center gap-1">
                    {story.arcs.length} {plural(story.arcs.length, 'arc', 'arcs')} · {chapters}{' '}
                    {plural(chapters, 'chapter', 'chapters')}
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
