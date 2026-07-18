/**
 * GamificationHub — รวม "อันดับ + เหรียญ + ภารกิจ" เป็นการ์ดสรุปย่อแถวเดียว
 *
 * แถบสรุป (เห็นเสมอ): วงแหวน level + ชื่อ + XP bar + chips (เกม/เหรียญ/streak/ภารกิจ)
 * ปุ่มแท็บ 3 อัน collapsed by default — กดเพื่อขยายดูเนื้อหาเต็ม (reuse component เดิม)
 *   เป้าหมาย: เปิดหน้า hub มาเห็นภาพปกเกมทันทีโดยไม่ต้องเลื่อนผ่านบล็อกนี้
 *
 * ใช้ queryKey เดียวกับ HonorWall/DailyQuestPanel → react-query แชร์ cache ไม่ยิงซ้ำ
 */
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { gamificationService, globalLevelFromXp } from '@/services/gamification.service';
import { dailyQuestService } from '@/services/daily-quest.service';
import { DailyQuestPanel, dailyQuestQueryKey } from '@/components/games/DailyQuestPanel';
import { GameRankings } from '@/components/games/GameRankings';
import { HonorWall, LevelRing } from '@/components/games/HonorWall';
import { StudentPetHub } from '@/components/games/StudentPetHub';
import { studentPetQueryKey, studentPetService } from '@/services/student-pet.service';

type Tab = 'rank' | 'medals' | 'quest' | 'pet';

const TabPill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-amber-500 bg-amber-100 text-amber-800'
        : 'border-border bg-muted text-muted-foreground hover:bg-accent',
    )}
  >
    {children}
  </button>
);

export const GamificationHub = ({ studentCode }: { studentCode: string | null }) => {
  const code = studentCode?.trim() || null;
  const [openTab, setOpenTab] = useState<Tab | null>(null);

  const profileQuery = useQuery({
    queryKey: ['honor-profile', code],
    queryFn: () => gamificationService.getHonorProfile(code!),
    enabled: !!code,
  });
  const questQuery = useQuery({
    queryKey: dailyQuestQueryKey(code ?? ''),
    queryFn: () => dailyQuestService.getStatus(code!),
    enabled: !!code,
  });
  const petQuery = useQuery({
    queryKey: studentPetQueryKey(code ?? ''),
    queryFn: () => studentPetService.getState(code!),
    enabled: !!code,
  });

  const profile = profileQuery.data ?? null;
  const quest = questQuery.data ?? null;
  const hasQuest = !!quest && quest.required_count > 0;
  const lvl = profile ? globalLevelFromXp(profile.total_xp) : null;

  const toggle = (t: Tab) => setOpenTab((cur) => (cur === t ? null : t));

  return (
    <div className="space-y-3">
      {/* การ์ดสรุปย่อ + ปุ่มแท็บ */}
      <Card className="bg-card">
        <CardContent className="space-y-3 p-3 sm:p-4">
          {/* แถบสรุป */}
          {profile && lvl ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <LevelRing level={lvl.level} progress={lvl.progress} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <PersonAvatar name={profile.student.name} photoUrl={profile.student.photoUrl} className="h-6 w-6 shrink-0" />
                  <span className="truncate text-sm font-semibold text-foreground">{profile.student.name}</span>
                  {profile.student.classLabel && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">{profile.student.classLabel}</span>
                  )}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {profile.total_xp.toLocaleString()} XP{!lvl.isMaxLevel && ` · อีก ${lvl.xpToNext.toLocaleString()} ถึง LV ${lvl.level + 1}`}
                </div>
              </div>
              {/* chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">🎮 {profile.games_played}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">🏅 {profile.medals.length}</span>
                {profile.streak_days >= 2 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700">🔥 {profile.streak_days}</span>
                )}
                {hasQuest && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">🎯 {quest!.completed_count}/{quest!.required_count}</span>
                )}
                {petQuery.data?.equipped && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">🐾 {petQuery.data.equipped.name_th}</span>
                )}
              </div>
            </div>
          ) : (
            /* ไม่มี student code — โชว์หัวข้อแทนโปรไฟล์ (อันดับยังดูได้) */
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <span className="text-lg">🏆</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground">อันดับ & เหรียญเกียรติยศ</div>
                <div className="text-[11px] text-muted-foreground">เล่นเกมสะสม XP ปลดล็อกเหรียญ — อันดับสัปดาห์รีเซ็ตทุกวันจันทร์</div>
              </div>
            </div>
          )}

          {/* ปุ่มแท็บ — collapsed by default */}
          <div className="flex flex-wrap gap-1.5">
            <TabPill active={openTab === 'rank'} onClick={() => toggle('rank')}>🏆 อันดับ</TabPill>
            {profile && (
              <TabPill active={openTab === 'medals'} onClick={() => toggle('medals')}>
                🎖️ เหรียญ {profile.medals.length}
              </TabPill>
            )}
            {hasQuest && (
              <TabPill active={openTab === 'quest'} onClick={() => toggle('quest')}>
                🎯 ภารกิจ {quest!.completed_count}/{quest!.required_count}
              </TabPill>
            )}
            {code && (
              <TabPill active={openTab === 'pet'} onClick={() => toggle('pet')}>
                🐾 คู่หู · {petQuery.data?.balance?.toLocaleString('th-TH') ?? '—'} ดาว
              </TabPill>
            )}
          </div>
        </CardContent>
      </Card>

      {/* พาเนลที่ขยาย — แต่ละแท็บเป็นการ์ดของตัวเอง (ไม่ซ้อนการ์ด) */}
      {openTab === 'rank' && <GameRankings studentCode={code} />}
      {openTab === 'medals' && code && (
        <Card className="bg-card">
          <CardContent className="p-3 sm:p-4">
            <HonorWall studentCode={code} variant="medals" />
          </CardContent>
        </Card>
      )}
      {openTab === 'quest' && code && <DailyQuestPanel studentCode={code} variant="full" />}
      {openTab === 'pet' && code && <StudentPetHub studentCode={code} />}
    </div>
  );
};
