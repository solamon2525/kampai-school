import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { cn } from "@/lib/utils";

export function InstallBanner() {
  const { canInstall, isIos, isStandalone, isMobile, isDismissed, promptInstall, dismiss } = usePwaInstall();

  const shouldShow = isMobile && !isStandalone && !isDismissed && (canInstall || isIos);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
          className={cn(
            "fixed bottom-4 inset-x-4 z-40",
            "bg-card border border-border rounded-2xl shadow-2xl",
            "p-4 md:hidden",
          )}
          role="dialog"
          aria-label="ติดตั้งแอปโรงเรียนคำไผ่"
        >
          <div className="flex items-start gap-3">
            <img
              src="/icons/pwa-192x192.png"
              alt=""
              className="w-12 h-12 rounded-xl flex-shrink-0 border border-border"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    ติดตั้งแอปโรงเรียนคำไผ่
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เปิดเร็วขึ้น ไม่ต้องพิมพ์ URL ใช้งานเหมือนแอปจริง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-muted-foreground hover:text-foreground p-1 -m-1 rounded-md flex-shrink-0"
                  aria-label="ปิด"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {canInstall && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={promptInstall} className="flex-1 gap-1.5">
                    <Download className="w-4 h-4" />
                    ติดตั้ง
                  </Button>
                  <Button size="sm" variant="outline" onClick={dismiss}>
                    ไม่ตอนนี้
                  </Button>
                </div>
              )}

              {isIos && !canInstall && (
                <div className="mt-3 rounded-lg bg-muted/50 border border-border p-2.5">
                  <p className="text-xs text-foreground font-medium mb-1.5">วิธีติดตั้งบน iPhone:</p>
                  <ol className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">1</span>
                      <span>กดปุ่ม</span>
                      <Share className="w-3.5 h-3.5 inline" />
                      <span>(แชร์) ที่ด้านล่าง</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">2</span>
                      <span>เลือก</span>
                      <Plus className="w-3.5 h-3.5 inline" />
                      <span>"เพิ่มที่หน้าจอโฮม"</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">3</span>
                      <span>กด "เพิ่ม" — เสร็จเรียบร้อย</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
