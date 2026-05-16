import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onScanned: (studentId: string) => void;
}

/**
 * StudentQRScanner — สแกน QR ของนักเรียนจาก parent portal หรือบัตร QR แจกห้อง
 *
 * รองรับ 2 payload format:
 *   - `kampai-student:<uuid>` (ใช้ใน Parent Portal + StudentCard + StudentQRSheet)
 *   - `<uuid>` ตรง ๆ (backward compat กับ QR เก่า)
 *
 * ใช้ร่วมโดย WasteBankManagement, SavingsBankManagement (DESIGN.md Rule 14.13 pattern)
 */
export const StudentQRScanner = ({ open, onClose, onScanned }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const elementId = 'qr-scanner-region';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const start = async () => {
      try {
        const html5 = new Html5Qrcode(elementId);
        scannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return;
            const match = decoded.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
            const studentId = match ? match[1] : decoded;
            onScanned(studentId);
          },
          () => {/* ignore decode errors */},
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ไม่สามารถเปิดกล้องได้');
      }
    };
    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.isScanning) {
        s.stop().then(() => s.clear()).catch(() => {/* ignore */});
      }
      scannerRef.current = null;
    };
  }, [open, onScanned]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สแกน QR นักเรียน</DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
            {error}
          </div>
        ) : (
          <div id={elementId} className="w-full rounded-md overflow-hidden bg-black" />
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
