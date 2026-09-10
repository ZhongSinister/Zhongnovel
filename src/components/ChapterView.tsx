'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * pdf.js touches browser-only globals (DOMMatrix, canvas), which would crash
 * the static export during prerender — so the reader is client-only.
 */
const PdfReader = dynamic(() => import('@/components/PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="aspect-[1/1.414] w-full max-w-[860px]" />
    </div>
  ),
});

export default function ChapterView({ file, title }: { file: string; title: string }) {
  return <PdfReader file={file} title={title} />;
}
