import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Loader2, Camera, AlertCircle, Gift } from 'lucide-react';
import { rewardClaimsService, type RewardClaim } from '@/services/waste-bank.service';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';

function describeCameraError(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
  const lower = raw.toLowerCase();
  if (lower.includes('permission') || lower.includes('notallowed') || lower.includes('denied')) {
    return 'เบราว์เซอร์ไม่อนุญาตให้ใช้กล้อง — ตรวจสอบการตั้งค่า permission แล้วลองใหม่';
  }
  if (lower.includes('notfound') || lower.includes('devicesnotfound') || lower.includes('no camera')) {
    return 'ไม่พบกล้องบนอุปกรณ์นี้';
  }
  if (lower.includes('notreadable') || lower.includes('in use') || lower.includes('trackstart')) {
    return 'กล้องถูกใช้งานโดยแอปอื่น — ปิดแอปกล้อง/วิดีโอคอลแล้วลองใหม่';
  }
  return `เปิดกล้องไม่สำเร็จ: ${raw}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAction: () => void; // Triggered when a claim is approved or rejected
}

export const ClaimQRScanner = ({ open, onClose, onAction }: Props) => {
  const { toast } = useToast();
  const { user, staffId, administratorId } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<RewardClaim | null>(null);
  const [fetching, setFetching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const elementId = 'claim-qr-scanner-region';

  const playFeedback = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(50);
      }
      const AudioCtx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => ctx.close().catch(() => {}), 250);
    } catch {}
  }, []);

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    if (s && s.isScanning) {
      try {
        await s.stop();
        await s.clear();
      } catch {}
    }
    scannerRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('เบราว์เซอร์ไม่รองรับการใช้กล้อง — โปรดเปิดผ่าน HTTPS หรือ localhost');
      return;
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      const html5 = new Html5Qrcode(elementId);
      scannerRef.current = html5;
      await html5.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            try {
              await scannerRef.current.stop();
            } catch {}
          }
          
          // Parse claim format: kampai-claim:{uuid}
          const match = decoded.match(/kampai-claim:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          const claimId = match ? match[1] : decoded;

          playFeedback();
          setFetching(true);
          const { data, error: fetchErr } = await rewardClaimsService.getById(claimId);
          setFetching(false);
          if (fetchErr || !data) {
            setError('ไม่พบข้อมูลคำขอแลกรางวัลนี้ในระบบ');
            return;
          }
          if (data.status !== 'pending') {
            setError(`คำขอนี้ถูกดำเนินการไปแล้ว (สถานะปัจจุบัน: ${data.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'})`);
            return;
          }
          setClaim(data as RewardClaim);
        },
        () => {}
      );
    } catch (err) {
      console.error('[ClaimQRScanner] camera error:', err);
      setError(describeCameraError(err));
    }
  }, [playFeedback]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setClaim(null);
    setFetching(false);
    setProcessing(false);
    startCamera();
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleRescan = async () => {
    setClaim(null);
    setError(null);
    setProcessing(false);
    await stopCamera();
    await startCamera();
  };

  const handleApprove = async () => {
    if (!claim || !user?.id) return;
    setProcessing(true);
    const { error: approveErr } = await rewardClaimsService.approve(claim.id, user.id, { staffId, administratorId });
    setProcessing(false);
    if (approveErr) {
      toast({ title: 'อนุมัติไม่สำเร็จ', description: approveErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'อนุมัติสำเร็จ', description: `มอบของรางวัล "${claim.reward_name}" เรียบร้อย` });
      onAction();
      onClose();
    }
  };

  const handleReject = async () => {
    if (!claim || !user?.id) return;
    const reason = prompt('เหตุผลที่ปฏิเสธ (ไม่บังคับ):') ?? undefined;
    setProcessing(true);
    const { error: rejectErr } = await rewardClaimsService.reject(claim.id, user.id, reason, { staffId, administratorId });
    setProcessing(false);
    if (rejectErr) {
      toast({ title: 'ดำเนินการไม่สำเร็จ', description: rejectErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'ปฏิเสธคำขอเรียบร้อย' });
      onAction();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สแกน QR อนุมัติของรางวัล</DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="space-y-3">
            <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onClose}>
                ปิด
              </Button>
              <Button variant="default" onClick={handleRescan} className="gap-2">
                <RotateCcw className="w-4 h-4" /> ลองใหม่
              </Button>
            </div>
          </div>
        ) : claim ? (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
              {/* Student info */}
              <div className="flex items-center gap-3 pb-2 border-b border-emerald-100">
                {claim.students?.photo_url ? (
                  <img src={claim.students.photo_url} alt={claim.students.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-300" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-800">
                    {(claim.students?.name ?? '?').slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-emerald-950">{claim.students?.name}</div>
                  <div className="text-xs text-emerald-800">ชั้น {claim.students?.class}</div>
                </div>
              </div>

              {/* Reward info */}
              <div className="flex items-center gap-3">
                {claim.rewards?.image_url ? (
                  <img src={claim.rewards.image_url} alt={claim.reward_name} className="w-12 h-12 rounded object-cover border border-emerald-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-emerald-200 shrink-0">
                    <Gift className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">ของรางวัลที่ต้องการแลก</div>
                  <div className="font-semibold text-foreground truncate">{claim.reward_name}</div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    ใช้แต้ม: {claim.points_used} แต้ม
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={handleRescan} disabled={processing} className="gap-1 col-span-1">
                สแกนใหม่
              </Button>
              <Button variant="outline" onClick={handleReject} disabled={processing} className="text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive gap-1 col-span-1">
                <X className="w-4 h-4" /> ปฏิเสธ
              </Button>
              <Button onClick={handleApprove} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 gap-1 col-span-1">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                อนุมัติ
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div id={elementId} className="w-full rounded-md overflow-hidden bg-black aspect-square" />
            {fetching && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบคำขอ...
              </div>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              ยกเลิก
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
