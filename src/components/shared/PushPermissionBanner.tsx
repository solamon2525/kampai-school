import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushService, type PushPermission } from '@/services/push.service';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

const DISMISS_KEY = 'push-banner-dismissed';

/**
 * Lightweight nudge for parents/teachers to enable push notifications.
 * Shows only when: user is authenticated, browser supports push, permission is 'default',
 * and the user hasn't dismissed within the last 7 days.
 */
export const PushPermissionBanner = () => {
  const { session } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) {
      setHidden(true);
      return;
    }
    if (!pushService.isSupported()) {
      setHidden(true);
      return;
    }
    const perm = pushService.getPermission();
    setPermission(perm);
    if (perm !== 'default') {
      setHidden(true);
      return;
    }
    const ts = localStorage.getItem(DISMISS_KEY);
    if (ts && Date.now() - Number(ts) < 7 * 24 * 3600 * 1000) {
      setHidden(true);
      return;
    }
    setHidden(false);
  }, [session]);

  const enable = async () => {
    setBusy(true);
    const result = await pushService.subscribe();
    setBusy(false);
    if (result.ok) {
      toast.success('เปิดการแจ้งเตือนแล้ว — คุณจะได้รับข่าวสำคัญทันที');
      setHidden(true);
    } else {
      toast.error(`เปิดการแจ้งเตือนไม่สำเร็จ: ${result.reason}`);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] rounded-xl border border-border bg-card shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {permission === 'denied' ? (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Bell className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">เปิดการแจ้งเตือน</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          รับข่าวสารโรงเรียน, การเข้าเรียนของบุตร, ผลคะแนน ทันทีบนอุปกรณ์
        </p>
        <div className="flex gap-2 mt-2.5">
          <Button size="sm" onClick={enable} disabled={busy} className="h-8 text-xs">
            {busy ? 'กำลังเปิด...' : 'เปิดแจ้งเตือน'}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} className="h-8 text-xs">
            ไว้ก่อน
          </Button>
        </div>
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="ปิด">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
