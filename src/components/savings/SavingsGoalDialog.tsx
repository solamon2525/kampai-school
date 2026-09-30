import { useState } from 'react';
import {
  PiggyBank,
  BookOpen,
  Palette,
  Heart,
  Bike,
  GraduationCap,
  Gift,
  Sparkles,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { savingsGoalsService } from '@/services/savings.service';

const ICONS = [
  { id: 'piggy-bank', label: 'กระปุก', icon: PiggyBank },
  { id: 'book', label: 'หนังสือ', icon: BookOpen },
  { id: 'palette', label: 'ศิลปะ', icon: Palette },
  { id: 'heart', label: 'ครอบครัว', icon: Heart },
  { id: 'bike', label: 'กีฬา/จักรยาน', icon: Bike },
  { id: 'graduation-cap', label: 'ทุนการศึกษา', icon: GraduationCap },
  { id: 'gift', label: 'ของขวัญ', icon: Gift },
  { id: 'star', label: 'ความฝัน', icon: Sparkles },
] as const;

const PRESET_GOALS = [
  { title: 'ซื้อชุดนักเรียนใหม่', amount: 350, icon: 'graduation-cap' },
  { title: 'ซื้อสีไม้และเครื่องเขียน', amount: 120, icon: 'palette' },
  { title: 'ของขวัญวันแม่', amount: 100, icon: 'heart' },
  { title: 'ทุนการศึกษาต่อ ม.1', amount: 1000, icon: 'book' },
  { title: 'กระปุกออมสำรองฉุกเฉิน', amount: 500, icon: 'piggy-bank' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentCode?: string;
  studentId?: string;
  onGoalCreated: () => void;
}

export const SavingsGoalDialog = ({
  open,
  onOpenChange,
  studentCode,
  studentId,
  onGoalCreated,
}: Props) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('piggy-bank');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyPreset = (preset: (typeof PRESET_GOALS)[number]) => {
    setTitle(preset.title);
    setTargetAmount(String(preset.amount));
    setSelectedIcon(preset.icon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const amt = parseInt(targetAmount.replace(/[^0-9]/g, ''), 10);

    if (!t || t.length < 2) {
      toast({
        title: 'กรุณาระบุชื่อเป้าหมาย',
        description: 'ชื่อเป้าหมายต้องมีความยาวอย่างน้อย 2 ตัวอักษร',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(amt) || amt <= 0 || amt >= 100000000) {
      toast({
        title: 'ยอดเงินเป้าหมายไม่ถูกต้อง',
        description: 'กรุณาระบุจำนวนเต็มบาทที่มากกว่า 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (studentCode) {
        const { error } = await savingsGoalsService.createByCode({
          code: studentCode,
          title: t,
          target_amount: amt,
          icon: selectedIcon,
          target_date: targetDate || null,
        });
        if (error) throw error;
      } else if (studentId) {
        const { error } = await savingsGoalsService.createByStudentId({
          student_id: studentId,
          title: t,
          target_amount: amt,
          icon: selectedIcon,
          target_date: targetDate || null,
        });
        if (error) throw error;
      } else {
        throw new Error('ไม่พบข้อมูลรหัสนักเรียน');
      }

      toast({
        title: 'สร้างกระปุกออมเป้าหมายสำเร็จ! 🎯',
        description: `เป้าหมาย "${t}" จำนวน ${amt.toLocaleString('th-TH')} บาท`,
      });

      setTitle('');
      setTargetAmount('');
      setSelectedIcon('piggy-bank');
      setTargetDate('');
      onGoalCreated();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'สร้างเป้าหมายไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6 bg-card">
        <DialogHeader className="text-left border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-500" />
            <DialogTitle className="text-foreground">
              ตั้งกระปุกออมเป้าหมาย "ฝันที่เป็นจริง"
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            กำหนดเป้าหมายเพื่อสร้างแรงบันดาลใจและวินัยการออมตามหลักเศรษฐกิจพอเพียง
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Presets */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">เป้าหมายยอดนิยม (กดเพื่อเลือก):</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_GOALS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/30 hover:border-amber-400 hover:bg-amber-500/10 text-foreground transition-colors"
                >
                  {p.title} ({p.amount} ฿)
                </button>
              ))}
            </div>
          </div>

          {/* Goal Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">ชื่อเป้าหมาย *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ซื้อรองเท้านักเรียนคู่ใหม่"
              maxLength={60}
              required
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">ยอดเงินเป้าหมาย (บาท) *</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="เช่น 300"
              className="text-lg font-bold tabular-nums"
              required
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">เลือกไอคอนกระปุก</Label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={cn(
                      'p-2 rounded-xl border flex flex-col items-center gap-1 transition-all',
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-700 ring-2 ring-amber-400/40 font-bold'
                        : 'border-border bg-card hover:bg-muted/40 text-muted-foreground',
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">กำหนดวันที่อยากทำให้สำเร็จ (ไม่บังคับ)</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'กำลังสร้าง...' : 'บันทึกเป้าหมาย'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
