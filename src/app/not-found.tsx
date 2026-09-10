import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The link may have changed, or this chapter was moved or removed from the contents.
      </p>
      <Button asChild variant="outline" size="lg" className="mt-6">
        <Link href="/">
          <ArrowLeft />
          Back to contents
        </Link>
      </Button>
    </div>
  );
}
