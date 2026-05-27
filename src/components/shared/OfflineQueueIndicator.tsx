import { useEffect, useState } from 'react';
import { CloudOff, CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { attendanceService } from '@/services/attendance.service';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Small floating indicator showing pending offline attendance writes
 * + auto-flush when the browser comes back online.
 * Safe to mount globally in App.tsx — does nothing when queue is empty.
 */
export const OfflineQueueIndicator = ({ className }: { className?: string }) => {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [flushing, setFlushing] = useState(false);

  const refresh = async () => {
    try {
      setPending(await attendanceService.pendingOfflineCount());
    } catch {
      /* IDB unavailable in some environments — silently fail */
    }
  };

  const flush = async () => {
    setFlushing(true);
    try {
      const r = await attendanceService.flushOfflineQueue();
      if (r.flushed > 0) toast.success(`ส่งคิว offline สำเร็จ ${r.flushed} รายการ`);
      await refresh();
    } finally {
      setFlushing(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 30_000);

    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Flush on mount (catches pending from previous session)
    if (navigator.onLine) void flush();

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!pending && online) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-40 rounded-full shadow-lg px-3 py-1.5 text-xs font-medium flex items-center gap-2',
        online ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-red-100 text-red-900 border border-red-300',
        className,
      )}
    >
      {flushing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : online ? (
        <CloudUpload className="w-3.5 h-3.5" />
      ) : (
        <CloudOff className="w-3.5 h-3.5" />
      )}
      {online ? (
        <>
          <span>คิว offline {pending} รายการ</span>
          {pending > 0 && !flushing && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={flush}>
              ส่งเลย
            </Button>
          )}
        </>
      ) : (
        <span>Offline — {pending} รายการรอส่ง</span>
      )}
    </div>
  );
};
