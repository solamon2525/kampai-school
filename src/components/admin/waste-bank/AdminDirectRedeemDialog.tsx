import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Gift, Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  rewardClaimsService,
  rewardsService,
  type Reward,
  type StudentBalanceLookup,
} from '@/services/waste-bank.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { RewardCostDisplay } from '@/components/rewards/RewardCostDisplay';
import { getFirstName, speakThai, thaiNumberToWords } from '@/lib/thaiSpeech';

interface AdminDirectRedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ERROR_MAP: Record<string, string> = {
  STUDENT_NOT_FOUND: 'ไม่พบนักเรียนที่ใช้รหัสนี้',
  REWARD_UNAVAILABLE: 'รางวัลนี้ปิดให้บริการชั่วคราว',
  INSUFFICIENT_POINTS: 'แต้มไม่พอสำหรับจำนวนที่เลือก',
  INSUFFICIENT_WASTE_POINTS: 'แต้มธนาคารขยะไม่พอสำหรับจำนวนที่เลือก',
  INSUFFICIENT_VIRTUE_POINTS: 'คะแนนความดีไม่พอสำหรับจำนวนที่เลือก',
  OUT_OF_STOCK: 'สต็อกของรางวัลไม่พอสำหรับจำนวนที่เลือก',
  INVALID_QUANTITY: 'จำนวนที่ระบุไม่ถูกต้อง',
  NOT_AUTHORIZED: 'ไม่มีสิทธิ์ในการทำรายการนี้',
};

function mapError(message: string | undefined): string {
  if (!message) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  for (const key of Object.keys(ERROR_MAP)) {
    if (message.includes(key)) return ERROR_MAP[key];
  }
  return message;
}

export function AdminDirectRedeemDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdminDirectRedeemDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [looking, setLooking] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // โหลดรายการรางวัลทั้งหมดเมื่อเปิด Modal
  useEffect(() => {
    if (!open) {
      setCode('');
      setStudent(null);
      setSelectedRewardId('');
      setQuantity(1);
      setErrorMsg(null);
      return;
    }

    const loadRewards = async () => {
      setLoadingRewards(true);
      const { data, error } = await rewardsService.getActive();
      setLoadingRewards(false);
      if (!error && data) {
        setRewards(data as Reward[]);
      }
    };

    void loadRewards();
  }, [open]);

  const selectedReward = useMemo(() => {
    return rewards.find((r) => r.id === selectedRewardId) ?? null;
  }, [rewards, selectedRewardId]);

  // คำนวณ max quantity ตามแต้มและสต็อก
  const maxQuantity = useMemo(() => {
    if (!selectedReward || !student) return 1;
    let limit = 999;
    if (selectedReward.stock !== null && selectedReward.stock !== undefined) {
      limit = Math.min(limit, selectedReward.stock);
    }
    if (selectedReward.waste_points_cost > 0) {
      const byWaste = Math.floor(student.waste_points_available / selectedReward.waste_points_cost);
      limit = Math.min(limit, byWaste);
    }
    if (selectedReward.virtue_points_cost > 0) {
      const byVirtue = Math.floor(student.virtue_points_available / selectedReward.virtue_points_cost);
      limit = Math.min(limit, byVirtue);
    }
    return Math.max(1, limit);
  }, [selectedReward, student]);

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

  const wasteTotal = selectedReward ? selectedReward.waste_points_cost * quantity : 0;
  const virtueTotal = selectedReward ? selectedReward.virtue_points_cost * quantity : 0;

  const isWasteAffordable = student ? student.waste_points_available >= wasteTotal : true;
  const isVirtueAffordable = student ? student.virtue_points_available >= virtueTotal : true;
  const isStockAvailable = selectedReward
    ? selectedReward.stock === null || selectedReward.stock === undefined || selectedReward.stock >= quantity
    : true;
  const canAfford = student && selectedReward && isWasteAffordable && isVirtueAffordable && isStockAvailable;

  const handleConfirm = async () => {
    if (!student || !selectedReward || !code.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await rewardClaimsService.adminClaimAndApprove(
      code.trim(),
      selectedReward.id,
      quantity
    );

    setSubmitting(false);

    if (error) {
      setErrorMsg(mapError(error.message));
      return;
    }

    toast({
      title: 'แลกรางวัลและอนุมัติสำเร็จ 🎉',
      description: `มอบ ${selectedReward.name} จำนวน ${quantity} ชิ้น ให้ ${student.full_name} เรียบร้อยแล้ว`,
    });

    void speakThai([
      'อนุมัติมอบรางวัลสำเร็จ',
      `ชื่อ ${getFirstName(student.full_name)}`,
      `ได้รับรางวัล ${selectedReward.name}`,
      `จำนวน ${thaiNumberToWords(quantity)} ชิ้น`,
    ]);

    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Gift className="w-5 h-5" />
            แลกรางวัลให้นักเรียน (ตัดแต้มและอนุมัติทันที)
          </DialogTitle>
          <DialogDescription>
            บันทึกการแลกของรางวัล ณ จุดบริการ ตัดแต้มขยะและหักคะแนนความดีลงประวัติอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. ค้นหารหัสนักเรียน */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-direct-code" className="text-xs font-bold text-muted-foreground uppercase">
              รหัสประจำตัวนักเรียน
            </Label>
            <div className="flex gap-2">
              <Input
                id="admin-direct-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setStudent(null);
                  setErrorMsg(null);
                }}
                placeholder="เช่น 1322"
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                disabled={submitting}
                className="bg-background text-foreground"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={!code.trim() || looking || submitting}
                className="gap-1.5"
              >
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                ตรวจสอบ
              </Button>
            </div>
          </div>

          {/* ข้อมูลนักเรียน */}
          {student && (
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <PersonAvatar
                  name={student.full_name}
                  photoUrl={student.photo_url}
                  size="md"
                  className="ring-2 ring-primary/20 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">{student.full_name}</div>
                  <div className="text-xs text-muted-foreground">{student.class_name ?? '—'}</div>
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 bg-emerald-50 text-[11px] font-bold">
                    ขยะพร้อมแลก {student.waste_points_available} แต้ม
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="border-amber-600/30 text-amber-700 bg-amber-50 text-[11px] font-bold">
                    ความดีพร้อมแลก {student.virtue_points_available} (สะสม {student.virtue_points_earned})
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* 2. เลือกของรางวัล */}
          {student && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                เลือกของรางวัล
              </Label>
              <Select value={selectedRewardId} onValueChange={setSelectedRewardId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingRewards ? 'กำลังโหลดรางวัล...' : 'เลือกของรางวัลที่ต้องการแลก'} />
                </SelectTrigger>
                <SelectContent>
                  {rewards.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (ขยะ {r.waste_points_cost} · ความดี {r.virtue_points_cost}
                        {r.stock !== null ? ` · เหลือ ${r.stock}` : ''})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. จำนวนที่แลก + รายละเอียดแต้ม */}
          {student && selectedReward && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground uppercase">
                    จำนวนที่ต้องการแลก
                  </Label>
                  {selectedReward.stock !== null && (
                    <p className="text-[11px] text-muted-foreground">
                      คงเหลือในคลัง {selectedReward.stock} ชิ้น
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={quantity <= 1 || submitting}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={quantity >= maxQuantity || submitting}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* การ์ดสรุปยอดการหักแต้ม */}
              <div className="p-3 rounded-xl border border-border bg-card space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>ราคาต่อชิ้น:</span>
                  <RewardCostDisplay waste={selectedReward.waste_points_cost} virtue={selectedReward.virtue_points_cost} />
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between items-center font-bold">
                  <span>รวมคะแนนที่จะหัก:</span>
                  <div className="text-right space-x-2">
                    {wasteTotal > 0 && (
                      <span className={isWasteAffordable ? 'text-emerald-700' : 'text-destructive font-black'}>
                        -{wasteTotal} แต้มขยะ
                      </span>
                    )}
                    {virtueTotal > 0 && (
                      <span className={isVirtueAffordable ? 'text-amber-700' : 'text-destructive font-black'}>
                        -{virtueTotal} คะแนนความดี
                      </span>
                    )}
                  </div>
                </div>
                {virtueTotal > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <span className="text-amber-600 font-bold">✨</span>
                    <span>หักเฉพาะคะแนนความดีพร้อมแลก — คะแนนสะสมเกียรติยศและอันดับในหอเกียรติยศจะไม่ถูกลดทอน</span>
                  </p>
                )}
              </div>

              {/* แจ้งเตือนกรณีคะแนนไม่พอ */}
              {!canAfford && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {!isStockAvailable
                      ? 'ของรางวัลในคลังไม่เพียงพอ'
                      : !isWasteAffordable && !isVirtueAffordable
                      ? 'แต้มขยะและคะแนนความดีไม่เพียงพอ'
                      : !isWasteAffordable
                      ? 'แต้มธนาคารขยะไม่เพียงพอ'
                      : 'คะแนนความดีไม่เพียงพอ (ตรวจดูคะแนนสุทธิหลังหักพฤติกรรม)'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ข้อความ Error ทั่วไป */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!student || !selectedReward || !canAfford || submitting}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังทำรายการ...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> แลกและอนุมัติทันที
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
