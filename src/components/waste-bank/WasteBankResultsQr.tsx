import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const WASTE_BANK_RESULTS_URL = 'https://kampai-school.vercel.app/waste-bank/results';

export function WasteBankResultsQr({ compact = false }: { compact?: boolean }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadPng = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 80, 80, 1040, 1040);
      const anchor = document.createElement('a');
      anchor.download = 'qr-waste-bank-results.png';
      anchor.href = canvas.toDataURL('image/png');
      anchor.click();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  };

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', !compact && 'rounded-2xl border border-border bg-card p-5 shadow-sm')}>
      {!compact && (
        <div>
          <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-foreground">
            <QrCode className="h-5 w-5 text-primary" /> แชร์ผลการดำเนินงาน
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">สแกนเพื่อเปิดหน้านี้ได้ทันที</p>
        </div>
      )}
      <div ref={qrRef} className="rounded-xl border border-border bg-card p-3">
        <QRCode value={WASTE_BANK_RESULTS_URL} size={compact ? 150 : 180} level="M" />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
        <Download className="mr-2 h-4 w-4" /> ดาวน์โหลด QR Code (PNG)
      </Button>
    </div>
  );
}
