import { levelFromXp } from '@/services/game-play.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Props = {
  studentName: string;
  studentPhotoUrl?: string | null;
  classLabel?: string | null;
  totalXp: number;
  streakDays: number;
  totalStars: number;
  className?: string;
};

const Stat = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
  <div className="rounded-xl bg-muted/50 px-2 py-2">
    <div className="text-lg leading-none">{icon}</div>
    <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

/** แถบหัว: นักเรียน + เลเวล/แถบ XP + ดาว/streak/XP รวม (ดึงจาก engine gamification เดิม) */
export function QuestHeader({
  studentName, studentPhotoUrl, classLabel, totalXp, streakDays, totalStars, className,
}: Props) {
  const lv = levelFromXp(totalXp);
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-center gap-3">
        <PersonAvatar name={studentName} photoUrl={studentPhotoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-foreground">{studentName}</span>
            {classLabel && <span className="shrink-0 text-xs text-muted-foreground">{classLabel}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              Lv.{lv.level}
            </span>
            <Progress value={Math.round(lv.progress * 100)} className="h-2 flex-1" />
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {lv.isMaxLevel ? 'สูงสุด' : `อีก ${lv.xpToNext} XP`}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat icon="⭐" label="ดาวรวม" value={totalStars} />
        <Stat icon="🔥" label="ต่อเนื่อง" value={`${streakDays} วัน`} />
        <Stat icon="✨" label="XP รวม" value={totalXp} />
      </div>
    </div>
  );
}
