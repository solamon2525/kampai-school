import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWAUpdatePrompt — แถบแจ้ง "มีเวอร์ชันใหม่" เมื่อ service worker ตัวใหม่พร้อมใช้งาน
 *
 * แก้ปัญหา PWA บนมือถือจำ cache โค้ดเก่าค้าง: registerType ใน vite.config = 'prompt'
 * → SW ใหม่จะ "waiting" จนผู้ใช้กด "อัปเดต" → updateServiceWorker(true) post SKIP_WAITING
 * ให้ sw.ts แล้วรีโหลดหน้าเป็นโค้ดล่าสุด (ไม่รีโหลดเองเงียบ ๆ กันงานที่กรอกค้างหาย)
 *
 * Snooze: กดปิด (X) → เงียบ SNOOZE_MS (จำใน localStorage) กันเด้งซ้ำทุกครั้งที่เปิดหน้า
 * เมื่อ SW ใหม่ waiting อยู่ (deploy ถี่ ๆ) — ยังกด "อัปเดต" เองได้ตลอด
 */
const SNOOZE_KEY = 'pwa_update_snooze_until';
const SNOOZE_MS = 6 * 60 * 60 * 1000; // 6 ชั่วโมง

export const PWAUpdatePrompt = () => {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    if (!needRefresh) return null;

    // กดปิดไปแล้ว → เงียบจนครบ 6 ชม. (กันนับเป็น "เวอร์ชันใหม่" ซ้ำทุกครั้งที่โหลดหน้า)
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    if (Date.now() < snoozeUntil) return null;

    const dismiss = () => {
        try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch { /* ignore */ }
        setNeedRefresh(false);
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <RefreshCw className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">มีเวอร์ชันใหม่ของระบบ</div>
                    <div className="text-xs text-muted-foreground">แตะ "อัปเดต" เพื่อโหลดเวอร์ชันล่าสุด</div>
                </div>
                <Button
                    size="sm"
                    onClick={() => {
                        try { localStorage.removeItem(SNOOZE_KEY); } catch { /* ignore */ }
                        updateServiceWorker(true);
                    }}
                    className="flex-shrink-0 gap-1.5"
                >
                    <RefreshCw className="h-3.5 w-3.5" /> อัปเดต
                </Button>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="ภายหลัง"
                    className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
