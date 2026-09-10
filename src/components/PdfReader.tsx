'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Download, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * pdf.js starts this with `new Worker(url, { type: 'module' })`, and a module
 * worker is rejected outright unless the server sends a JavaScript MIME type.
 * Static hosts (GitHub Pages included) are unreliable about .mjs but always
 * correct about .js — and the extension has no bearing on module-ness — so
 * scripts/build-content.mjs copies the worker to public/pdf.worker.min.js,
 * straight from the installed pdfjs-dist so the versions cannot drift.
 */
pdfjs.GlobalWorkerOptions.workerSrc = `${BASE_PATH}/pdf.worker.min.js`;

// Must be a stable reference — a new object each render re-fetches the PDF.
const PDF_OPTIONS = {
  cMapUrl: `${BASE_PATH}/pdfjs/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${BASE_PATH}/pdfjs/standard_fonts/`,
};

const ZOOM_STEPS = [0.75, 0.9, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM = 2; // index of 1.0
const MAX_PAGE_WIDTH = 860;

type Props = {
  /** Already prefixed with basePath by the caller. */
  file: string;
  title: string;
};

export default function PdfReader({ file, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM);
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Track the available width so pages fit the viewport on any screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const zoom = ZOOM_STEPS[zoomIndex];
  const pageWidth = useMemo(() => {
    if (!containerWidth) return undefined;
    return Math.max(220, Math.min(containerWidth, MAX_PAGE_WIDTH) * zoom);
  }, [containerWidth, zoom]);

  const onLoad = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setError(null);
    pageRefs.current = new Array(n).fill(null);
  }, []);

  const onError = useCallback((err: Error) => {
    setError(err?.message || 'Could not open the PDF file');
  }, []);

  // Highlight whichever page is nearest the middle of the viewport.
  useEffect(() => {
    if (!numPages) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const n = Number((visible.target as HTMLElement).dataset.page);
        if (n) setCurrent(n);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    for (const el of pageRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [numPages, pageWidth]);

  const goToPage = useCallback((n: number) => {
    pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard shortcuts, skipped while the reader is typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j') {
        if (current < numPages) { e.preventDefault(); goToPage(current + 1); }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        if (current > 1) { e.preventDefault(); goToPage(current - 1); }
      } else if (e.key === '+' || e.key === '=') {
        setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
      } else if (e.key === '-') {
        setZoomIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === '0') {
        setZoomIndex(DEFAULT_ZOOM);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, numPages, goToPage]);

  if (error) {
    return <Failed message={error} file={file} />;
  }

  return (
    <div>
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-1.5 border-b border-border bg-background py-2.5">
        <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {numPages ? `${current} / ${numPages}` : '—'}
        </span>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
          disabled={zoomIndex === 0}
          aria-label="Zoom out"
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-w-13 tabular-nums text-muted-foreground"
          onClick={() => setZoomIndex(DEFAULT_ZOOM)}
          title="Reset zoom (press 0)"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
          aria-label="Zoom in"
        >
          <Plus />
        </Button>

        <div className="flex-1" />

        <Button asChild variant="outline" size="sm">
          <a href={file} download>
            <Download />
            Download
          </a>
        </Button>
      </div>

      <div ref={containerRef}>
        <Document
          file={file}
          onLoadSuccess={onLoad}
          onLoadError={onError}
          onSourceError={onError}
          options={PDF_OPTIONS}
          loading={
            <div className="flex flex-col items-center gap-3 py-10">
              <Skeleton className="aspect-[1/1.414] w-full max-w-[860px]" />
              <p className="text-sm text-muted-foreground">Loading “{title}”…</p>
            </div>
          }
          error={<Failed message="Could not open the PDF file" file={file} />}
        >
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                data-page={i + 1}
                className="max-w-full"
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderAnnotationLayer
                  renderTextLayer
                  loading={<Skeleton className="aspect-[1/1.414] w-full max-w-[860px]" />}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}

function Failed({ message, file }: { message: string; file: string }) {
  return (
    <div className="py-14 text-center">
      <h2 className="text-lg font-semibold">Failed to open the file</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" size="lg" className="mt-5">
        <a href={file} target="_blank" rel="noopener noreferrer">
          Open the PDF in a new tab
        </a>
      </Button>
    </div>
  );
}
