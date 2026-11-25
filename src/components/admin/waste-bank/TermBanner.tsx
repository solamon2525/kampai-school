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
 * หลังกด: อัปเดตเทอมหลักที่ใช้บันทึกและตัวกรองแดชบอร์ด
 * (ธนาคารขยะและธนาคารพอเพียงยกยอดสะสมต่อเนื่องข้ามภาคเรียน ไม่ล้างเป็น 0;
 * ธนาคารความดี/เกียรติยศแยกนับตามปีการศึกษาและเทอม)
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
    const defaultNextSem: '1' | '2' = term.sem === '1' ? '2' : '1';
    const parsedYear = Number(term.year);
    const defaultNextYear =
      defaultNextSem === '2'
        ? term.year
        : Number.isFinite(parsedYear)
          ? String(parsedYear + 1)
          : term.year;
    setNextSem(defaultNextSem);
    setNextYear(defaultNextYear);
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
      description: `เทอม ${nextSem}/${nextYear.trim()} — อัปเดตเทอมหลักตอนบันทึกและตัวกรองแดชบอร์ดแล้ว (แต้มขยะและเงินออมยกยอดสะสมต่อเนื่อง)`,
    });
    setOpen(false);
    load();
  };

  if (!term) return null;

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm text-foreground">
              เทอมปัจจุบัน: <strong>เทอม {term.sem}/{term.year}</strong>
              <span className="text-muted-foreground ml-2 text-xs">
                (เทอมหลักตอนบันทึก &amp; ตัวกรอง · ธนาคารขยะ/เงินออมยกยอดต่อเนื่องข้ามภาคเรียน · ความดีนับแยกตามปีการศึกษา/เทอม)
              </span>
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
            <DialogDescription className="space-y-1.5 text-sm leading-relaxed">
              <span className="block">
                เมื่อยืนยัน ระบบจะเปลี่ยนเทอมหลักที่ใช้ในการบันทึกข้อมูลและตัวกรองแดชบอร์ดเป็นเทอมใหม่:
              </span>
              <span className="block text-foreground">
                • <strong>ธนาคารขยะและธนาคารพอเพียง:</strong> ยกยอดแต้ม/เงินออมสะสมต่อเนื่องข้ามภาคเรียน (ไม่ล้างเป็น 0)
              </span>
              <span className="block text-foreground">
                • <strong>ธนาคารความดี / เกียรติยศ:</strong> แยกนับสถิติตามปีการศึกษาและเทอม
              </span>
              <strong className="block text-amber-700">
                ข้อมูลประวัติการทำรายการของเทอมเก่ายังอยู่ครบถ้วน ไม่ถูกลบ
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
