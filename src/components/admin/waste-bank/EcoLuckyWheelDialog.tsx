import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, RotateCw, CheckCircle2, Gift } from 'lucide-react';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { playConductChime } from '@/lib/conductSound';
import { wasteLuckySpinsService } from '@/services/waste-bank.service';
import { useToast } from '@/hooks/use-toast';

export interface LuckyPrize {
  id: number;
  label: string;
  icon: string;
  points: number;
  color: string;
}

const PRIZES: LuckyPrize[] = [
  { id: 0, label: 'โบนัส +10 แต้ม', icon: '🌟', points: 10, color: '#10b981' },
  { id: 1, label: 'สติกเกอร์รักษ์โลก', icon: '🎁', points: 0, color: '#f59e0b' },
  { id: 2, label: 'โบนัส +20 แต้ม', icon: '🚀', points: 20, color: '#3b82f6' },
  { id: 3, label: 'ดินสอไม้รักษ์โลก', icon: '✏️', points: 0, color: '#8b5cf6' },
  { id: 4, label: 'แจ็กพอต +50 แต้ม', icon: '🏆', points: 50, color: '#ef4444' },
  { id: 5, label: 'นมกล่องพิเศษ', icon: '🧃', points: 0, color: '#06b6d4' },
  { id: 6, label: 'โบนัส +15 แต้ม', icon: '✨', points: 15, color: '#6366f1' },
  { id: 7, label: 'คูปองห้องเรียน', icon: '🎟️', points: 0, color: '#f97316' },
];

interface EcoLuckyWheelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    class: string;
    photo_url: string | null;
  };
  transactionId?: string | null;
  recordedBy?: string | null;
  onSpinComplete?: (prize: LuckyPrize) => void;
}

export const EcoLuckyWheelDialog: React.FC<EcoLuckyWheelDialogProps> = ({
  isOpen,
  onClose,
  student,
  transactionId,
  recordedBy,
  onSpinComplete,
}) => {
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<LuckyPrize | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const rotationRef = useRef(0);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setSelectedPrize(null);
      setHasSpun(false);
    }
  }, [isOpen]);

  const numSlices = PRIZES.length;
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setSelectedPrize(null);

    // Pick random prize index
    const randomIndex = Math.floor(Math.random() * numSlices);
    const targetPrize = PRIZES[randomIndex]!;

    // Calculate rotation: spin at least 5-7 full turns + land in middle of target slice
    // Pointer is at the top (270 deg in standard SVG coord or 0 deg top)
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const targetAngle =
      rotationRef.current +
      extraRounds * 360 +
      (360 - randomIndex * sliceAngle - sliceAngle / 2);

    rotationRef.current = targetAngle;
    setRotation(targetAngle);

    // Duration matches CSS transition (4 seconds)
    setTimeout(async () => {
      setIsSpinning(false);
      setSelectedPrize(targetPrize);
      setHasSpun(true);
      playConductChime('add');

      // Record to database
      try {
        await wasteLuckySpinsService.recordSpin({
          student_id: student.id,
          student_name: student.name,
          student_class: student.class,
          transaction_id: transactionId || null,
          spin_result: `${targetPrize.icon} ${targetPrize.label}`,
          bonus_points_awarded: targetPrize.points,
          recorded_by: recordedBy || null,
        });

        if (targetPrize.points > 0) {
          toast({
            title: '🎉 ได้รับโบนัสพิเศษ!',
            description: `${student.name} ได้รับ ${targetPrize.points} แต้ม`,
          });
        }
      } catch (err) {
        console.error('Failed to record spin:', err);
      }

      onSpinComplete?.(targetPrize);
    }, 4000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSpinning && onClose()}>
      <DialogContent className="max-w-md w-full bg-card text-foreground border border-border p-6 shadow-xl rounded-2xl">
        <DialogHeader className="text-center sm:text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎡</span>
            <DialogTitle className="text-xl font-bold text-foreground">
              วงล้อเสี่ยงโชครักษ์โลก (Eco Lucky Wheel)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            ส่งขยะครบ 20 ชิ้น รับสิทธิ์หมุนวงล้อลุ้นโชคแต้มสะสมและของรางวัลทันที!
          </DialogDescription>
        </DialogHeader>

        {/* Student Profile Info */}
        <div className="flex items-center justify-center gap-3 p-2 bg-muted/40 rounded-xl border border-border/60">
          <PersonAvatar name={student.name} photoUrl={student.photo_url} className="w-10 h-10 border border-primary/20" />
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">{student.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {student.class}
              </Badge>
              <span>ส่งขยะครบตามเกณฑ์ 🌟</span>
            </div>
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center justify-center my-3">
          {/* Wheel Pointer at top */}
          <div className="absolute -top-3 z-20 flex flex-col items-center">
            <div
              className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 drop-shadow-md"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
            />
          </div>

          {/* SVG Wheel */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full drop-shadow-lg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)'
                  : 'none',
              }}
            >
              {PRIZES.map((prize, i) => {
                const startAngle = (i * sliceAngle * Math.PI) / 180;
                const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;
                const x1 = 150 + 140 * Math.sin(startAngle);
                const y1 = 150 - 140 * Math.cos(startAngle);
                const x2 = 150 + 140 * Math.sin(endAngle);
                const y2 = 150 - 140 * Math.cos(endAngle);

                const midAngle = ((i + 0.5) * sliceAngle * Math.PI) / 180;
                const textX = 150 + 95 * Math.sin(midAngle);
                const textY = 150 - 95 * Math.cos(midAngle);
                const textRotate = (i + 0.5) * sliceAngle;

                return (
                  <g key={prize.id}>
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 140 140 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="2"
                    />
                    <g transform={`translate(${textX}, ${textY}) rotate(${textRotate})`}>
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="18"
                        className="select-none"
                      >
                        {prize.icon}
                      </text>
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        className="select-none"
                      >
                        {prize.points > 0 ? `+${prize.points} แต้ม` : prize.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Center Hub */}
              <circle cx="150" cy="150" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="4" />
              <circle cx="150" cy="150" r="20" fill="#f8fafc" />
            </svg>

            {/* Inner Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xl">🌱</span>
            </div>
          </div>
        </div>

        {/* Selected Prize Result Announcement */}
        {selectedPrize && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl text-center animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium mb-1">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>ยินดีด้วย! คุณได้รับ</span>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <span className="text-2xl">{selectedPrize.icon}</span>
              <span>{selectedPrize.label}</span>
            </div>
            {selectedPrize.points > 0 && (
              <Badge className="mt-1.5 bg-amber-500 text-white hover:bg-amber-600 border-none px-2.5 py-0.5 text-xs font-semibold">
                +{selectedPrize.points} แต้มสะสมธนาคารขยะ
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {!hasSpun ? (
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-2"
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'กำลังหมุนวงล้อ...' : 'กดเพื่อหมุนวงล้อเสี่ยงโชค! 🎯'}</span>
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ตกลง / ปิดหน้าต่าง</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
