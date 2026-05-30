import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw, Loader2, Camera, AlertCircle } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { describeCameraError, startRearScanner } from '@/lib/qrCamera';

interface Props {
    open: boolean;
    onClose: () => void;
    onScanned: (studentId: string) => void;
}

type Preview = {
    id: string;
    name: string;
    class: string;
    class_number: number | null;
    student_code: string | null;
    photo_url: string | null;
};

/**
 * StudentQRScanner — สแกน QR ของนักเรียน + preview ยืนยันก่อน prefill form
 *
 * Flow:
 *   1. เปิด dialog → กล้องสตาร์ท
 *   2. ตรวจ QR (format `kampai-student:{uuid}` หรือ plain uuid)
 *   3. Beep + haptic vibrate → กล้อง pause
 *   4. Fetch student → แสดง preview card (avatar + ชื่อ + ชั้น)
 *   5. ครูกด "ยืนยัน" → callback onScanned + ปิด / กด "สแกนใหม่" → resume
 *
 * ใช้ร่วม waste-bank + savings-bank admin
 */
export const StudentQRScanner = ({ open, onClose, onScanned }: Props) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [fetching, setFetching] = useState(false);
    const elementId = 'qr-scanner-region';

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
            setTimeout(() => ctx.close().catch(() => {/* ignore */}), 250);
        } catch {/* feedback เป็น nice-to-have ไม่ critical */}
    }, []);

    const stopCamera = useCallback(async () => {
        const s = scannerRef.current;
        if (s && s.isScanning) {
            try {
                await s.stop();
                await s.clear();
            } catch {/* ignore */}
        }
        scannerRef.current = null;
    }, []);

    const startCamera = useCallback(async () => {
        // เช็คก่อนว่ารองรับ getUserMedia (secure context = HTTPS หรือ localhost)
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setError('เบราว์เซอร์ไม่รองรับการใช้กล้อง — โปรดเปิดผ่าน HTTPS ด้วยเบราว์เซอร์ Chrome/Safari/Edge รุ่นใหม่');
            return;
        }
        // รอ frame ถัดไปให้ DOM element id={elementId} mount จริงก่อน
        await new Promise((resolve) => requestAnimationFrame(resolve));
        try {
            const html5 = new Html5Qrcode(elementId);
            scannerRef.current = html5;
            await startRearScanner(html5, async (decoded) => {
                // หยุด scanner ทันทีกัน decode ซ้ำ
                if (scannerRef.current && scannerRef.current.isScanning) {
                    try {
                        await scannerRef.current.stop();
                    } catch {/* ignore */}
                }
                const match = decoded.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                const studentId = match ? match[1] : decoded;
                playFeedback();
                setFetching(true);
                const { data, error: fetchErr } = await studentsService.getById(studentId);
                setFetching(false);
                if (fetchErr || !data) {
                    setError('ไม่พบนักเรียน — QR ไม่ถูกต้องหรือนักเรียนถูกลบ');
                    return;
                }
                setPreview({
                    id: data.id,
                    name: data.name,
                    class: data.class,
                    class_number: data.class_number,
                    student_code: data.student_code,
                    photo_url: data.photo_url,
                });
            });
        } catch (err) {
            console.error('[StudentQRScanner] camera error:', err);
            setError(describeCameraError(err));
        }
    }, [playFeedback]);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setPreview(null);
        setFetching(false);
        startCamera();
        return () => {
            stopCamera();
        };
    }, [open, startCamera, stopCamera]);

    const handleRescan = async () => {
        setPreview(null);
        setError(null);
        await stopCamera();
        await startCamera();
    };

    const handleConfirm = async () => {
        if (!preview) return;
        await stopCamera();
        onScanned(preview.id);
        setPreview(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>สแกน QR นักเรียน</DialogTitle>
                </DialogHeader>

                {error ? (
                    <div className="space-y-3">
                        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md flex gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">{error}</div>
                        </div>
                        {/permission|notallowed|denied|ไม่อนุญาต/i.test(error) && (
                            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md space-y-1.5">
                                <div className="font-semibold text-foreground flex items-center gap-1">
                                    <Camera className="w-3.5 h-3.5" /> วิธีอนุญาตกล้องบนมือถือ
                                </div>
                                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                                    <li>แตะไอคอน 🔒 หรือ ⓘ ข้างที่อยู่เว็บ</li>
                                    <li>เลือก "การตั้งค่าเว็บไซต์" หรือ "Site settings"</li>
                                    <li>เปลี่ยน "กล้อง / Camera" เป็น "อนุญาต / Allow"</li>
                                    <li>โหลดหน้านี้ใหม่แล้วลองสแกนอีกครั้ง</li>
                                </ol>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={onClose}>
                                ปิด
                            </Button>
                            <Button variant="default" onClick={handleRescan} className="gap-2">
                                <RotateCcw className="w-4 h-4" /> ลองใหม่
                            </Button>
                        </div>
                    </div>
                ) : preview ? (
                    <div className="space-y-3">
                        <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
                            <PersonAvatar
                                name={preview.name}
                                photoUrl={preview.photo_url}
                                size="lg"
                                className="ring-2 ring-emerald-400"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-emerald-900 truncate">{preview.name}</div>
                                <div className="text-xs text-emerald-800 mt-0.5">
                                    ชั้น {preview.class}
                                    {preview.class_number ? ` · เลขที่ ${preview.class_number}` : ''}
                                </div>
                                {preview.student_code && (
                                    <div className="text-[10px] text-emerald-700/80 font-mono mt-0.5">
                                        รหัส {preview.student_code}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={handleRescan} className="gap-1">
                                <RotateCcw className="w-4 h-4" /> สแกนใหม่
                            </Button>
                            <Button onClick={handleConfirm} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                                <Check className="w-4 h-4" /> ยืนยัน
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div id={elementId} className="w-full rounded-md overflow-hidden bg-black aspect-square" />
                        {fetching && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดข้อมูลนักเรียน...
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
