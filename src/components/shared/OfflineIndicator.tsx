import { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setShowStatus(true);
      
      // Auto-hide the "Back Online" green banner after 3 seconds
      const timer = setTimeout(() => {
        setShowStatus(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if already offline on mount, show the status
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm"
        >
          {!isOnline ? (
            /* --- Offline Mode (Red Warning Banner) --- */
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-destructive/95 dark:bg-red-950/95 text-white shadow-lg border border-destructive/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/10 animate-pulse">
                  <WifiOff className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-75">ขาดการเชื่อมต่อ</p>
                  <p className="text-[13px] font-medium leading-tight">คุณกำลังออฟไลน์ ข้อมูลอาจไม่ถูกบันทึก</p>
                </div>
              </div>
              <button 
                onClick={() => setShowStatus(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/75 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : wasOffline ? (
            /* --- Restored Mode (Green Success Banner) --- */
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-600/95 dark:bg-emerald-900/95 text-white shadow-lg border border-emerald-500/20 backdrop-blur-md">
              <div className="p-1.5 rounded-lg bg-white/10">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider opacity-75">เชื่อมต่อเรียบร้อย</p>
                <p className="text-[13px] font-medium leading-tight">กลับมาออนไลน์แล้ว ระบบกำลังซิงก์ข้อมูล</p>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
