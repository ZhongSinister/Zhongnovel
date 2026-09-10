import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">ไม่พบหน้านี้</h1>
      <p className="mt-2 text-muted-foreground">
        ลิงก์อาจเปลี่ยนไปแล้ว หรือตอนนี้ถูกย้าย/ลบออกจากสารบัญ
      </p>
      <Button asChild variant="outline" size="lg" className="mt-6">
        <Link href="/">
          <ArrowLeft />
          กลับไปที่สารบัญ
        </Link>
      </Button>
    </div>
  );
}
