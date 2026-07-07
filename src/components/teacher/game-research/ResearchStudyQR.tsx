import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ResearchStudyQRProps {
  url: string;
  title: string;
  subtitle?: string;
}

export function ResearchStudyQR({ url, title, subtitle }: ResearchStudyQRProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'คัดลอกลิงก์แล้ว' });
    } catch {
      toast({ title: 'คัดลอกไม่สำเร็จ', description: url, variant: 'destructive' });
    }
  };

  const printQr = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=480,height=640');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR งานวิจัย</title>
      <style>
        body{font-family:Sarabun,system-ui,sans-serif;text-align:center;padding:24px;color:#0f172a}
        h1{font-size:16px;margin:0 0 4px} p{font-size:12px;color:#64748b;margin:0 0 16px}
        .url{font-size:10px;word-break:break-all;color:#475569;margin-top:12px}
      </style></head><body>
      ${el.innerHTML}
      <p class="url">${url}</p>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
      <div
        ref={printRef}
        className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 shrink-0"
      >
        <QRCode value={url} size={160} level="M" />
        <p className="text-xs font-medium text-foreground text-center max-w-[180px] leading-snug">{title}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground text-center">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <Button type="button" variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4 mr-1.5" />
          คัดลอกลิงก์
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={printQr}>
          <Printer className="h-4 w-4 mr-1.5" />
          พิมพ์ QR
        </Button>
        <p className="text-xs text-muted-foreground max-w-xs">
          สแกนด้วยมือถือหรือพิมพ์ติดห้องเรียน — นักเรียนกรอกรหัสยืนยันตัวเอง
        </p>
      </div>
    </div>
  );
}
