import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Noto_Sans_Thai } from 'next/font/google';
import { cn } from '@/lib/utils';
import { content, plural } from '@/lib/content';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const thai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-thai', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'zhongnovel', template: '%s · zhongnovel' },
  description: 'A novel, published one chapter at a time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* `dark` is hard-coded: one theme, no toggle, no flash of the wrong palette. */
    <html lang="en" className={cn('dark font-sans', geist.variable, thai.variable)}>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <div className="flex min-h-svh flex-col">
          <header className="border-b border-border">
            <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-5">
              <Link
                href="/"
                className="text-[15px] font-semibold tracking-tight transition-colors hover:text-muted-foreground"
              >
                zhongnovel
              </Link>
            </div>
          </header>

          <main className="flex-1 py-10">{children}</main>

          <footer className="border-t border-border">
            <div className="mx-auto flex h-13 w-full max-w-4xl items-center gap-4 px-5 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} zhongnovel</span>
              <span>
                {content.totals.series} series · {content.totals.stories} {plural(content.totals.stories, 'story', 'stories')} · {content.totals.arcs} {plural(content.totals.arcs, 'arc', 'arcs')} · {content.totals.chapters} {plural(content.totals.chapters, 'chapter', 'chapters')}
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
