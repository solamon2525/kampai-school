import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Search, CheckCircle2, AlertTriangle, Gift } from 'lucide-react';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  rewardClaimsService,
  type Reward,
  type StudentBalanceLookup,
} from '@/services/waste-bank.service';

interface RewardClaimDialogProps {
  reward: Reward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_MAP: Record<string, string> = {
  STUDENT_NOT_FOUND: 'ไม่พบนักเรียนที่ใช้รหัสนี้',
  REWARD_UNAVAILABLE: 'รางวัลนี้ปิดให้บริการชั่วคราว',
  INSUFFICIENT_POINTS: 'แต้มไม่พอสำหรับรางวัลนี้',
  OUT_OF_STOCK: 'รางวัลนี้หมดสต็อกแล้ว',
};

function mapError(message: string | undefined): string {
  if (!message) return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  for (const key of Object.keys(ERROR_MAP)) {
    if (message.includes(key)) return ERROR_MAP[key];
  }
  return message;
}

export function RewardClaimDialog({ reward, open, onOpenChange }: RewardClaimDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [looking, setLooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);

  // Reset state every time the dialog opens or reward changes
  useEffect(() => {
    if (open) {
      setCode('');
      setStudent(null);
      setLooking(false);
      setSubmitting(false);
      setErrorMsg(null);
      setSuccessClaimId(null);
    }
  }, [open, reward?.id]);

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLooking(true);
    setErrorMsg(null);
    setStudent(null);
    const { data, error } = await rewardClaimsService.lookupStudent(trimmed);
    setLooking(false);
    if (error) {
      setErrorMsg(mapError(error.message));
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.student_id) {
      setErrorMsg(ERROR_MAP.STUDENT_NOT_FOUND);
      return;
    }
    setStudent(row as StudentBalanceLookup);
  };

  const handleConfirm = async () => {
    if (!reward || !code.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    const { data, error } = await rewardClaimsService.claimByCode(code.trim(), reward.id);
    setSubmitting(false);
    if (error) {
      setErrorMsg(mapError(error.message));
      return;
    }
    toast({
      title: 'ส่งคำขอแลกสำเร็จ',
      description: 'รอครูอนุมัติ — จะประกาศหน้าเช็คแต้มของคุณ',
    });
    if (data) {
      setSuccessClaimId(data as string);
    } else {
      onOpenChange(false);
    }
  };

  if (successClaimId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              ส่งคำขอแลกรางวัลสำเร็จ!
            </DialogTitle>
            <DialogDescription>
              โปรดยื่นหน้าจอนี้ให้คุณครูสแกนเพื่ออนุมัติรับของรางวัล
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-muted/40 rounded-2xl border border-border">
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-border">
              <QRCode value={`kampai-claim:${successClaimId}`} size={160} />
            </div>
            
            <div className="text-center space-y-1">
              <div className="font-semibold text-foreground">{reward.name}</div>
              <div className="text-xs text-muted-foreground">
                ผู้ขอแลก: {student?.full_name} ({student?.class_name})
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                ใช้แต้มสะสม: {reward.points_cost} แต้ม
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenChange(false)}>
              เสร็จสิ้น / ปิดหน้าต่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reward) return null;

  const insufficient = student !== null && student.available_points < reward.points_cost;
  const remainingAfter = student ? student.available_points - reward.points_cost : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            แลกรางวัล: {reward.name}
          </DialogTitle>
          <DialogDescription>
            ใช้ <span className="font-semibold text-amber-600">{reward.points_cost} แต้ม</span> —
            กรอกรหัสนักเรียนเพื่อยืนยันตัวตน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-code">รหัสนักเรียน</Label>
            <div className="flex gap-2">
              <Input
                id="student-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setStudent(null);
                  setErrorMsg(null);
                }}
                placeholder="เช่น 1234"
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                disabled={submitting}
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={!code.trim() || looking || submitting}
              >
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                ตรวจสอบ
              </Button>
            </div>
          </div>

          {student && (
            <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
              <div className="flex items-center gap-3">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.full_name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {student.full_name.slice(0, 1)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{student.full_name}</div>
                  <div className="text-sm text-muted-foreground">{student.class_name ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">แต้มคงเหลือ</div>
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                    {student.available_points}
                  </div>
                </div>
              </div>

              {!insufficient ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>หลังแลก จะเหลือ <strong>{remainingAfter}</strong> แต้ม</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    ขาดอีก <strong>{reward.points_cost - student.available_points}</strong> แต้ม
                    เก็บขยะเพิ่มก่อนนะ!
                  </span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!student || insufficient || submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
            ยืนยันส่งคำขอ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
