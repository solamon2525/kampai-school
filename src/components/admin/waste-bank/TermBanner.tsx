import { useEffect, useState } from 'react';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { termService, type ActiveTerm } from '@/services/waste-bank.service';

/**
 * แสดงเทอมปัจจุบัน + ปุ่ม "ขึ้นเทอมใหม่" (admin เท่านั้น)
 * หลังกด: แต้ม/คะแนน เริ่มนับใหม่ (filter ตาม active term) ข้อมูลเก่ายังอยู่ในประวัติ
 */
export const TermBanner = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [term, setTerm] = useState<ActiveTerm | null>(null);
  const [open, setOpen] = useState(false);
  const [nextYear, setNextYear] = useState('');
  const [nextSem, setNextSem] = useState<'1' | '2'>('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const t = await termService.getActive();
    setTerm(t);
  };

  const openDialog = () => {
    if (!term) return;
    // default: ถ้าเทอมปัจจุบัน 1 → ถัดไป 2 (ปีเดิม); ถ้า 2 → 1 (ปีถัดไป)
    if (term.sem === '1') {
      setNextYear(term.year);
      setNextSem('2');
    } else {
      const next = String(Number(term.year) + 1);
      setNextYear(next);
      setNextSem('1');
    }
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!nextYear.trim() || !nextSem) return;
    setSaving(true);
    const { error } = await termService.advance(nextYear.trim(), nextSem);
    setSaving(false);
    if (error) {
      toast({ title: 'อัพเดตเทอมไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'ขึ้นเทอมใหม่สำเร็จ',
      description: `เทอม ${nextSem}/${nextYear} — แต้มและคะแนนเริ่มนับใหม่`,
    });
    setOpen(false);
    load();
  };

  if (!term) return null;

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm">
              เทอมปัจจุบัน: <strong>เทอม {term.sem}/{term.year}</strong>
              <span className="text-muted-foreground ml-2 text-xs">(แต้ม + คะแนนนับเฉพาะเทอมนี้)</span>
            </span>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={openDialog} className="gap-1">
              ขึ้นเทอมใหม่ <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ขึ้นเทอมใหม่</DialogTitle>
            <DialogDescription>
              เมื่อยืนยัน — แต้มและคะแนนเริ่มนับใหม่จาก 0 สำหรับนักเรียนทุกคน
              <br />
              <strong className="text-amber-700 dark:text-amber-400">
                ข้อมูลเทอมเก่ายังอยู่ในประวัติ ไม่ถูกลบ
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ปีการศึกษา (พ.ศ.)</Label>
              <Input
                type="number"
                min="2560"
                max="2600"
                value={nextYear}
                onChange={(e) => setNextYear(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>เทอม</Label>
              <Select value={nextSem} onValueChange={(v) => setNextSem(v as '1' | '2')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">เทอม 1</SelectItem>
                  <SelectItem value="2">เทอม 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
              จาก เทอม {term.sem}/{term.year} → เทอม {nextSem}/{nextYear}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleConfirm} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'ยืนยันขึ้นเทอมใหม่'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
