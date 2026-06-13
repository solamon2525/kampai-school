/**
 * DailyQuestPanel — ภารกิจประจำวัน (เดลี่เควส) ของผู้เล่น
 *
 * โชว์ว่าวันนี้ "เหลือเควสวิชาอะไร" — เล่นเกมแต่ละวิชาให้ได้คะแนนถึงเกณฑ์ = ผ่าน
 * ครบทุกวิชา = คะแนนพิเศษ + streak. ดึง get_daily_quest_status (anon ผ่าน student_code)
 *
 * variant 'full'    — hub/หน้าแรก: การ์ดเต็ม + คำอธิบาย
 * variant 'compact' — pre-game: แถวกระชับ
 */
import { useQuery } from '@tanstack/react-query';
import { Loader2, Flame, Sparkles, Check } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { dailyQuestService, type QuestSubjectStatus } from '@/services/daily-quest.service';

export const dailyQuestQueryKey = (studentCode: string) => ['daily-quest-status', studentCode];

const SubjectChip = ({ s }: { s: QuestSubjectStatus }) => (
  <div
    className={cn(
      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
      s.done
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
        : 'border-border bg-muted/40 text-muted-foreground',
    )}
    title={s.done ? `ผ่านแล้ว · ${s.score ?? 0} คะแนน` : 'ยังไม่ผ่าน'}
  >
    <span className="leading-none">{s.icon ?? '📚'}</span>
    <span>{s.label}</span>
    {s.done ? <Check className="h-3 w-3" /> : <span className="text-[10px] opacity-70">รอ</span>}
  </div>
);

export const DailyQuestPanel = ({
  studentCode,
  variant = 'compact',
  className,
}: {
  studentCode: string;
  variant?: 'full' | 'compact';
  className?: string;
}) => {
  const code = studentCode.trim();
  const { data, isLoading } = useQuery({
    queryKey: dailyQuestQueryKey(code),
    queryFn: () => dailyQuestService.getStatus(code),
    enabled: !!code,
  });

  if (!code) return null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">กำลังโหลดภารกิจ…</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.required_count === 0) return null;

  const { subjects, completed_count, required_count, all_complete, bonus_points, streak_days, total_points, target_points } = data;

  return (
    <Card className={cn('overflow-hidden border-border', className)}>
      <CardContent className={cn('space-y-3', variant === 'compact' ? 'p-3.5' : 'p-4 sm:p-5')}>
        {/* header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight text-foreground">ภารกิจประจำวัน</h3>
              {variant === 'full' && (
                <p className="text-[11px] text-muted-foreground">เล่นครบทุกวิชา รับคะแนนพิเศษ +{(target_points || bonus_points).toLocaleString('th-TH')} แต้ม</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak_days > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-600" title="ทำครบติดต่อกัน">
                <Flame className="h-3.5 w-3.5" />
                {streak_days}
              </div>
            )}
            {total_points > 0 && (
              <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary" title="คะแนนพิเศษสะสม">
                {total_points.toLocaleString('th-TH')} แต้ม
              </div>
            )}
          </div>
        </div>

        {/* subject chips */}
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <SubjectChip key={s.key} s={s} />
          ))}
        </div>

        {/* progress */}
        {all_complete ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">
              ครบทุกวิชาแล้ววันนี้! รับ +{bonus_points.toLocaleString('th-TH')} แต้มพิเศษ 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <Progress value={(completed_count / required_count) * 100} className="h-2" />
            <p className="text-right text-[11px] text-muted-foreground">
              ทำแล้ว {completed_count}/{required_count} วิชา · เหลืออีก {required_count - completed_count} วิชา
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
