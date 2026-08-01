import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'kampai-admin-onboarding-v1';

const STEPS = [
  {
    title: 'ยินดีต้อนรับสู่ระบบหลังบ้าน',
    body: 'ทัวร์สั้นสำหรับลดภาระงานครูด้วยดิจิทัล — ชี้ทางระบบงานหลัก 5 ขั้น',
    path: '/admin/dashboard',
  },
  {
    title: 'สารบรรณอิเล็กทรอนิกส์',
    body: 'รับ–ส่งหนังสือราชการออนไลน์ ลดการเดินเอกสารกระดาษ',
    path: '/admin/dashboard/saraban',
  },
  {
    title: 'การลาออนไลน์',
    body: 'อนุมัติการลาของครูได้ทันที ไม่ต้องเก็บใบลากระดาษ',
    path: '/admin/dashboard/leave',
  },
  {
    title: 'พัสดุ / วัสดุ',
    body: 'ทะเบียนวัสดุ อนุมัติเบิก–รับคืน และดูสต็อกต่ำ',
    path: '/admin/dashboard/supplies',
  },
  {
    title: 'ลดภาระครู (Digital Ops)',
    body: 'แดชบอร์ด KPI · Role Model · ส่งออกรายงานนวัตกรรมดิจิทัล',
    path: '/admin/dashboard/digital-ops',
  },
  {
    title: 'คลังสื่อและเกม',
    body: 'มอนิเตอร์สื่อที่ครูอัป และ coverage ตัวชี้วัด',
    path: '/admin/dashboard/educational-hub',
  },
];

export function AdminOnboardingTour({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === 'done') return;
    setOpen(true);
  }, [enabled]);

  if (!open || !enabled) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'done');
    setOpen(false);
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    const next = step + 1;
    setStep(next);
    if (STEPS[next].path !== location.pathname) {
      navigate(STEPS[next].path);
    }
  };

  const goPrev = () => {
    if (step === 0) return;
    const prev = step - 1;
    setStep(prev);
    if (STEPS[prev].path !== location.pathname) {
      navigate(STEPS[prev].path);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-card shadow-lg p-4 space-y-3"
      role="dialog"
      aria-label="ทัวร์เริ่มต้นแอดมิน"
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{current.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{current.body}</p>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label="ข้ามทัวร์"
          onClick={finish}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={step === 0} onClick={goPrev}>
          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> ย้อน
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {step + 1}/{STEPS.length}
        </span>
        <Button size="sm" className="h-8 text-xs" onClick={goNext}>
          {isLast ? 'เริ่มใช้งาน' : 'ถัดไป'}
          {!isLast && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
}
