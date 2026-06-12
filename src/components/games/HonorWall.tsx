/**
 * HonorWall — ตู้เหรียญเกียรติยศ + โปรไฟล์ XP รวมของนักเรียน
 *
 * variant 'full'    — hub เกม: วงแหวน level + XP bar + streak + เหรียญทั้งหมด + ใกล้ปลดล็อก
 * variant 'compact' — จอ pre-game: level + streak + เหรียญล่าสุด 3 ใบ (แถวเดียว)
 *
 * ข้อมูลจาก get_student_honor_profile (RPC) — mobile-first
 */
import { useQuery } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import { Loader2, Medal } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import {
  gamificationService,
  globalLevelFromXp,
  computeNextMedals,
  TIER_STYLES,
  SUBJECT_LABELS,
  type HonorMedal,
} from '@/services/gamification.service';

const LevelRing = ({ level, progress, size = 72 }: { level: number; progress: number; size?: number }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" strokeLinecap="round"
          className="stroke-amber-500 transition-all duration-700"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] leading-none text-muted-foreground">LV</span>
        <span className="text-xl font-bold leading-none text-foreground">{level}</span>
      </div>
    </div>
  );
};

// icon ใน catalog มี 2 แบบ: emoji (เหรียญใหม่ 156+) กับชื่อ lucide เช่น "Pizza" (เหรียญเก่า)
// → ถ้าขึ้นต้นด้วย A-Z ให้ resolve เป็น lucide component, ไม่งั้น render เป็น emoji
type LucideMap = Record<string, React.ComponentType<{ className?: string }>>;
const Icons = LucideIcons as unknown as LucideMap;

const MedalIcon = ({ icon, small }: { icon: string | null; small?: boolean }) => {
  if (icon && /^[A-Za-z]/.test(icon)) {
    const Icon = Icons[icon] ?? Medal;
    return <Icon className={cn('text-amber-600 shrink-0', small ? 'h-4 w-4' : 'h-6 w-6')} />;
  }
  return <span className={cn('leading-none', small ? 'text-lg' : 'text-2xl')}>{icon ?? '🏅'}</span>;
};

const MedalChip = ({ medal, small }: { medal: HonorMedal; small?: boolean }) => {
  const t = TIER_STYLES[medal.tier] ?? TIER_STYLES.bronze;
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl ring-2 text-center', t.ring, t.bg,
        small ? 'w-12 h-12' : 'w-full aspect-square p-1')}
      title={`${medal.title} (${t.label})`}
    >
      <MedalIcon icon={medal.icon} small={small} />
      {!small && <span className="w-full text-[9px] leading-tight text-foreground/80 line-clamp-2 break-words">{medal.title}</span>}
    </div>
  );
};

export const HonorWall = ({ studentCode, variant = 'full' }: { studentCode: string | null; variant?: 'full' | 'compact' }) => {
  const profileQuery = useQuery({
    queryKey: ['honor-profile', studentCode],
    queryFn: () => gamificationService.getHonorProfile(studentCode!.trim()),
    enabled: !!studentCode,
  });

  if (!studentCode) return null;
  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดโปรไฟล์...
      </div>
    );
  }
  const profile = profileQuery.data;
  if (!profile) return null;

  const lvl = globalLevelFromXp(profile.total_xp);
  const universal = profile.medals.filter((m) => !m.game_slug);
  const perGame = profile.medals.filter((m) => !!m.game_slug);

  if (variant === 'compact') {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center gap-3 p-3">
          <LevelRing level={lvl.level} progress={lvl.progress} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              ⭐ {profile.total_xp.toLocaleString()} XP
              {profile.streak_days >= 2 && (
                <span className="text-orange-500">🔥 {profile.streak_days} วันติด</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              เหรียญ {profile.medals.length} ใบ · เล่นแล้ว {profile.games_played} เกม
            </div>
          </div>
          <div className="flex gap-1.5">
            {profile.medals.slice(0, 3).map((m) => <MedalChip key={m.code + (m.game_slug ?? '')} medal={m} small />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextMedals = computeNextMedals(profile, 3);

  return (
    <Card className="bg-card">
      <CardContent className="space-y-4 p-4">
        {/* header: avatar + level ring + XP bar */}
        <div className="flex items-center gap-3">
          <PersonAvatar name={profile.student.name} photoUrl={profile.student.photoUrl} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-foreground">{profile.student.name}</div>
            <div className="text-xs text-muted-foreground">{profile.student.classLabel ?? ''}</div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {profile.total_xp.toLocaleString()} XP{!lvl.isMaxLevel && ` · อีก ${lvl.xpToNext.toLocaleString()} ถึง LV ${lvl.level + 1}`}
            </div>
          </div>
          <LevelRing level={lvl.level} progress={lvl.progress} />
        </div>

        {/* stat chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">🎮 {profile.games_played} เกม</span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">🏅 {profile.medals.length} เหรียญ</span>
          {profile.streak_days >= 2 && (
            <span className="rounded-full bg-orange-100 px-2.5 py-1 font-medium text-orange-700">🔥 {profile.streak_days} วันติด</span>
          )}
          {(['math', 'thai', 'english'] as const).map((k) =>
            profile.subject_xp[k] ? (
              <span key={k} className="rounded-full bg-muted px-2.5 py-1 text-foreground">
                {SUBJECT_LABELS[k]} {profile.subject_xp[k].toLocaleString()}
              </span>
            ) : null,
          )}
        </div>

        {/* เหรียญสากล */}
        {universal.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">🌐 เหรียญเกียรติยศ</div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {universal.map((m) => <MedalChip key={m.code} medal={m} />)}
            </div>
          </div>
        )}

        {/* เหรียญรายเกม */}
        {perGame.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">🎮 เหรียญประจำเกม</div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {perGame.slice(0, 16).map((m) => <MedalChip key={m.code + m.game_slug} medal={m} />)}
            </div>
            {perGame.length > 16 && (
              <div className="mt-1 text-[10px] text-muted-foreground">และอีก {perGame.length - 16} ใบ</div>
            )}
          </div>
        )}

        {/* ใกล้ปลดล็อก */}
        {nextMedals.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">✨ ใกล้ปลดล็อก</div>
            <div className="space-y-2">
              {nextMedals.map(({ medal, current, target, progress }) => (
                <div key={medal.code} className="flex items-center gap-2">
                  <span className="w-7 text-center text-lg opacity-60">{medal.icon ?? '🏅'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate text-foreground">{medal.title}</span>
                      <span className="shrink-0 text-muted-foreground">{Math.min(current, target).toLocaleString()}/{target.toLocaleString()}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
