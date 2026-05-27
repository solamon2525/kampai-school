import { useState, useEffect, useMemo } from 'react';
import { Loader2, Sparkles, Search, CheckCircle2, AlertTriangle, Gift, Plus, Minus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface RewardClaimDialogProps {
  reward: Reward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** pre-fill รหัสนักเรียน (เมื่อเปิดจาก BalanceCheckDialog ที่ตรวจสอบมาแล้ว) */
  initialCode?: string;
  /** ข้อมูลนักเรียนที่ตรวจสอบไว้แล้ว — ถ้ามี จะข้าม lookup ทันที */
  initialStudent?: StudentBalanceLookup | null;
}

const ERROR_MAP: Record<string, string> = {
  STUDENT_NOT_FOUND: 'ไม่พบนักเรียนที่ใช้รหัสนี้',
  REWARD_UNAVAILABLE: 'รางวัลนี้ปิดให้บริการชั่วคราว',
  INSUFFICIENT_POINTS: 'แต้มไม่พอสำหรับจำนวนที่เลือก',
  OUT_OF_STOCK: 'สต็อกไม่พอสำหรับจำนวนที่เลือก',
  INVALID_QUANTITY: 'จำนวนที่กรอกไม่ถูกต้อง',
};

function mapError(message: string | undefined): string {
  if (!message) return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  for (const key of Object.keys(ERROR_MAP)) {
    if (message.includes(key)) return ERROR_MAP[key];
  }
  return message;
}

export function RewardClaimDialog({
  reward,
  open,
  onOpenChange,
  initialCode,
  initialStudent,
}: RewardClaimDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [looking, setLooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);
  const [successQuantity, setSuccessQuantity] = useState(1);

  // Reset state every time the dialog opens or reward changes — pre-fill ถ้ามี initial
  useEffect(() => {
    if (open) {
      setCode(initialCode ?? '');
      setStudent(initialStudent ?? null);
      setQuantity(1);
      setLooking(false);
      setSubmitting(false);
      setErrorMsg(null);
      setSuccessClaimId(null);
      setSuccessQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reward?.id]);

  // คำนวณ max quantity = min(แต้มเหลือ/ราคา, stock ที่เหลือ)
  const maxQuantity = useMemo(() => {
    if (!reward || !student) return 1;
    const affordable = Math.floor(student.available_points / reward.points_cost);
    const stockCap = reward.stock ?? Infinity;
    return Math.max(1, Math.min(affordable, stockCap));
  }, [reward, student]);

  // Clamp quantity เมื่อ max เปลี่ยน (เช่นโหลด student มาแล้ว)
  useEffect(() => {
    if (quantity > maxQuantity) setQuantity(maxQuantity);
  }, [maxQuantity, quantity]);

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
    const { data, error } = await rewardClaimsService.claimByCode(code.trim(), reward.id, quantity);
    setSubmitting(false);
    if (error) {
      setErrorMsg(mapError(error.message));
      return;
    }
    toast({
      title: 'ส่งคำขอแลกสำเร็จ',
      description: `แลก ${reward.name} จำนวน ${quantity} ชิ้น — รอครูอนุมัติ`,
    });
    setSuccessQuantity(quantity);
    if (data) {
      setSuccessClaimId(data as string);
    } else {
      onOpenChange(false);
    }
  };

  if (!reward) return null;

  const totalCost = reward.points_cost * quantity;
  const insufficient = student !== null && student.available_points < totalCost;
  const remainingAfter = student ? student.available_points - totalCost : 0;

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
              {successQuantity > 1 && (
                <div className="text-xs text-foreground">
                  จำนวน <strong className="text-primary">×{successQuantity}</strong> ชิ้น
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                ผู้ขอแลก: {student?.full_name} ({student?.class_name})
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                ใช้แต้มสะสม: {reward.points_cost * successQuantity} แต้ม
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            แลกรางวัล: {reward.name}
          </DialogTitle>
          <DialogDescription>
            ราคาต่อชิ้น <span className="font-semibold text-amber-600">{reward.points_cost} แต้ม</span>
            {reward.stock !== null && reward.stock !== undefined && (
              <span className="text-muted-foreground"> · เหลือ {reward.stock} ชิ้น</span>
            )}
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
                autoFocus={!initialStudent}
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

              {/* Quantity stepper */}
              <div className="space-y-1.5">
                <Label className="text-xs">จำนวนที่ต้องการแลก</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={quantity <= 1 || submitting}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    disabled={submitting}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (isNaN(v)) {
                        setQuantity(1);
                      } else {
                        setQuantity(Math.max(1, Math.min(maxQuantity, v)));
                      }
                    }}
                    className="w-20 text-center text-lg font-bold tabular-nums"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={quantity >= maxQuantity || submitting}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-1">
                    (สูงสุด {maxQuantity})
                  </span>
                </div>
              </div>

              {/* Total cost breakdown */}
              <div
                className={cn(
                  'p-3 rounded-xl border-2',
                  insufficient
                    ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
                )}
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {reward.points_cost} × {quantity} ชิ้น
                  </span>
                  <span>รวมที่จะหัก</span>
                </div>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span
                    className={cn(
                      'text-2xl font-extrabold tabular-nums',
                      insufficient ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300',
                    )}
                  >
                    −{totalCost}
                  </span>
                  <span className="text-xs text-muted-foreground">แต้ม</span>
                </div>
                <div className="mt-2 pt-2 border-t border-current/20 text-sm flex items-center gap-1.5">
                  {insufficient ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-rose-700 dark:text-rose-300">
                        แต้มไม่พอ — ขาดอีก{' '}
                        <strong>{totalCost - student.available_points}</strong> แต้ม
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        หลังแลก จะเหลือ <strong>{remainingAfter}</strong> แต้ม
                      </span>
                    </>
                  )}
                </div>
              </div>
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
            disabled={!student || insufficient || submitting || quantity < 1}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
            ยืนยันแลก {quantity > 1 ? `×${quantity}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
