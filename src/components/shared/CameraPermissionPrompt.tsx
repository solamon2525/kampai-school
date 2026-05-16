import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'camera-permission-asked';

/**
 * CameraPermissionPrompt — ขออนุญาตกล้องล่วงหน้าตั้งแต่ admin/teacher login ครั้งแรก
 *
 * เป้าหมาย: ตอนครูกด FAB/ปุ่มสแกน → กล้องเปิดทันที ไม่ต้องเจอ permission dialog
 * เพราะ user อนุญาตไว้แล้วล่วงหน้า
 *
 * Flow:
 *   1. Mount → เช็ค localStorage flag (ถ้าเคยถามแล้วข้าม)
 *   2. Query navigator.permissions camera state
 *   3. ถ้า "prompt" (ยังไม่ถาม) → แสดง modal
 *   4. ครูกด "อนุญาต" → call getUserMedia() trigger native prompt → stop tracks → set flag
 *   5. ครูกด "ภายหลัง" → set flag (ไม่ถามอีก — ครูจะถูกถามตอนเปิด scanner เอง)
 */
export const CameraPermissionPrompt = () => {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // ถามแล้วครั้งหนึ่ง → ไม่ถามซ้ำ
        if (localStorage.getItem(STORAGE_KEY)) return;
        // เบราว์เซอร์ไม่รองรับ permissions API → ข้าม (Safari iOS เก่า ฯลฯ)
        if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.mediaDevices?.getUserMedia) {
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
                if (cancelled) return;
                if (status.state === 'prompt') {
                    setOpen(true);
                } else {
                    // granted หรือ denied อยู่แล้ว → mark asked เพื่อไม่ poll ซ้ำ
                    localStorage.setItem(STORAGE_KEY, '1');
                }
            } catch {
                // browser อาจ throw ถ้า name='camera' ไม่รู้จัก → ข้าม
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const handleAllow = async () => {
        setBusy(true);
        try {
            // กระตุ้น native browser permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            // ปิด stream ทันที (ไม่ใช้ตอนนี้)
            stream.getTracks().forEach((t) => t.stop());
        } catch {
            // user denied — ก็ไม่เป็นไร mark asked แล้วจบ
        }
        localStorage.setItem(STORAGE_KEY, '1');
        setBusy(false);
        setOpen(false);
    };

    const handleLater = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleLater()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-amber-600" />
                        อนุญาตใช้กล้องสำหรับสแกน QR
                    </DialogTitle>
                    <DialogDescription className="pt-2 leading-relaxed">
                        ระบบนี้มีฟีเจอร์สแกน QR ของนักเรียนเพื่อบันทึกฝากขยะ / ฝากเงิน / ถอนเงิน
                        อย่างรวดเร็ว — อนุญาตล่วงหน้าครั้งเดียว ครั้งต่อไปกล้องจะเปิดได้ทันที
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex gap-2 text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div className="text-emerald-900">
                        <div className="font-semibold">ปลอดภัย</div>
                        <div className="text-xs text-emerald-800/90">
                            ระบบใช้กล้องเฉพาะตอนกดสแกนเท่านั้น ไม่บันทึก ไม่ส่งข้อมูลออกนอกอุปกรณ์
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="outline" onClick={handleLater} disabled={busy}>
                        ภายหลัง
                    </Button>
                    <Button onClick={handleAllow} disabled={busy} className="bg-amber-600 hover:bg-amber-700 gap-2">
                        <Camera className="w-4 h-4" /> อนุญาต
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
