import {
  PiggyBank,
  BookOpen,
  Palette,
  Heart,
  Bike,
  GraduationCap,
  Sparkles,
  Trophy,
  CheckCircle2,
  Trash2,
  Calendar,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import type { SavingsGoal } from '@/services/savings.service';

interface Props {
  goal: SavingsGoal;
  currentBalance: number;
  onStatusChange?: (goalId: string, status: 'achieved' | 'cancelled' | 'in_progress') => void;
  onDelete?: (goalId: string) => void;
  readOnly?: boolean;
}

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0 ฿';
  return `${Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿`;
};

const getGoalIcon = (iconName: string) => {
  switch (iconName) {
    case 'book':
      return <BookOpen className="w-5 h-5 text-sky-500" />;
    case 'palette':
      return <Palette className="w-5 h-5 text-purple-500" />;
    case 'heart':
      return <Heart className="w-5 h-5 text-rose-500" />;
    case 'bike':
      return <Bike className="w-5 h-5 text-emerald-500" />;
    case 'graduation-cap':
      return <GraduationCap className="w-5 h-5 text-amber-500" />;
    case 'gift':
      return <Gift className="w-5 h-5 text-indigo-500" />;
    case 'star':
      return <Sparkles className="w-5 h-5 text-amber-400" />;
    case 'piggy-bank':
    default:
      return <PiggyBank className="w-5 h-5 text-pink-500" />;
  }
};

export const SavingsGoalCard = ({
  goal,
  currentBalance,
  onStatusChange,
  onDelete,
  readOnly = false,
}: Props) => {
  const target = Number(goal.target_amount);
  const percent = target > 0 ? Math.min(100, Math.round((currentBalance / target) * 100)) : 0;
  const remaining = Math.max(0, target - currentBalance);
  const isAchieved = goal.status === 'achieved' || percent >= 100;

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-4 transition-all shadow-sm flex flex-col justify-between overflow-hidden',
        isAchieved
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-amber-300 ring-1 ring-amber-400/30'
          : 'bg-card border-border hover:border-amber-400/50',
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'p-2.5 rounded-xl flex items-center justify-center flex-shrink-0',
                isAchieved ? 'bg-amber-500/20' : 'bg-muted/60',
              )}
            >
              {getGoalIcon(goal.icon)}
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm line-clamp-1">{goal.title}</h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                เป้าหมาย: <span className="font-semibold text-foreground">{fmtBaht(target)}</span>
              </p>
            </div>
          </div>

          {isAchieved ? (
            <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[10px] border-0 gap-1">
              <Trophy className="w-3 h-3 text-slate-950" />
              สำเร็จแล้ว!
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
              {percent}%
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 my-3">
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isAchieved
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                  : percent >= 50
                  ? 'bg-amber-500'
                  : 'bg-primary',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>สะสมแล้ว {fmtBaht(currentBalance)}</span>
            {isAchieved ? (
              <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> ครบแล้ว
              </span>
            ) : (
              <span>ขาดอีก <strong className="text-foreground">{fmtBaht(remaining)}</strong></span>
            )}
          </div>
        </div>

        {/* Target Date (if set) */}
        {goal.target_date && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
            <Calendar className="w-3 h-3" />
            <span>กำหนดเป้าหมาย: {formatThaiDateMedium(goal.target_date)}</span>
          </div>
        )}
      </div>

      {/* Action Footer (if editable) */}
      {!readOnly && (
        <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
          {percent >= 100 && goal.status !== 'achieved' ? (
            <Button
              size="sm"
              className="h-7 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 w-full"
              onClick={() => onStatusChange?.(goal.id, 'achieved')}
            >
              <Trophy className="w-3.5 h-3.5 mr-1" />
              กดรับความสำเร็จ
            </Button>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {goal.status === 'achieved' ? 'บรรลุเป้าหมายแล้ว' : 'กำลังดำเนินการ'}
              </span>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(goal.id)}
                  title="ลบเป้าหมายนี้"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
