/**
 * GameRankings — อันดับ XP กระตุ้นการแข่งขัน (ทุกเกมรวมกัน)
 *
 * แท็บ: สัปดาห์นี้ (รีเซ็ตทุกจันทร์ — เด็กใหม่มีลุ้น) · รวม · คณิต · ไทย · อังกฤษ
 * ใช้ PersonAvatar คู่ชื่อตามกฎ 14.13 — mobile-first
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { gamificationService } from '@/services/gamification.service';

const MEDALS = ['🥇', '🥈', '🥉'];

type Row = {
  rank: number;
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  xp: number;
  sub: string;
  is_me: boolean;
};

const RankList = ({ rows, loading }: { rows: Row[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...
      </div>
    );
  }
  if (!rows.length) {
    return <div className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล — เป็นคนแรกสิ!</div>;
  }
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div
          key={r.student_id}
          className={cn('flex items-center gap-2.5 rounded-lg px-2 py-1.5', r.is_me && 'bg-amber-50 ring-1 ring-amber-300')}
        >
          <span className="w-7 shrink-0 text-center text-base font-bold text-amber-600">
            {MEDALS[r.rank - 1] ?? r.rank}
          </span>
          <PersonAvatar name={r.display_name} photoUrl={r.photo_url} className="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {r.display_name}{r.is_me && ' (คุณ)'}
            </div>
            <div className="text-[11px] text-muted-foreground">{r.class_label ?? ''} · {r.sub}</div>
          </div>
          <span className="shrink-0 text-sm font-bold text-amber-600">{r.xp.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export const GameRankings = ({ studentCode }: { studentCode: string | null }) => {
  const [tab, setTab] = useState('weekly');
  const code = studentCode?.trim() || null;

  const weeklyQ = useQuery({
    queryKey: ['rank-weekly', code],
    queryFn: () => gamificationService.getWeeklyLeaderboard(10, code),
    enabled: tab === 'weekly',
  });
  const globalQ = useQuery({
    queryKey: ['rank-global', code],
    queryFn: () => gamificationService.getGlobalLeaderboard(10, code),
    enabled: tab === 'global',
  });
  const subjectKey = ['math', 'thai', 'english'].includes(tab) ? tab : null;
  const subjectQ = useQuery({
    queryKey: ['rank-subject', subjectKey, code],
    queryFn: () => gamificationService.getSubjectLeaderboard(subjectKey!, 10, code),
    enabled: !!subjectKey,
  });

  const weeklyRows: Row[] = (weeklyQ.data ?? []).map((r) => ({
    ...r, xp: r.weekly_xp, sub: `${r.weekly_plays} รอบสัปดาห์นี้`,
  }));
  const globalRows: Row[] = (globalQ.data ?? []).map((r) => ({
    ...r, xp: r.total_xp, sub: `${r.games_played} เกม · ${r.medals_count} เหรียญ`,
  }));
  const subjectRows: Row[] = (subjectQ.data ?? []).map((r) => ({
    ...r, xp: r.xp, sub: 'XP สะสมในวิชานี้',
  }));

  return (
    <Card className="bg-card">
      <CardContent className="p-3 sm:p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="weekly" className="text-xs px-1">สัปดาห์นี้</TabsTrigger>
            <TabsTrigger value="global" className="text-xs px-1">รวม</TabsTrigger>
            <TabsTrigger value="math" className="text-xs px-1">คณิต</TabsTrigger>
            <TabsTrigger value="thai" className="text-xs px-1">ไทย</TabsTrigger>
            <TabsTrigger value="english" className="text-xs px-1">อังกฤษ</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-3"><RankList rows={weeklyRows} loading={weeklyQ.isLoading} /></TabsContent>
          <TabsContent value="global" className="mt-3"><RankList rows={globalRows} loading={globalQ.isLoading} /></TabsContent>
          <TabsContent value="math" className="mt-3"><RankList rows={subjectRows} loading={subjectQ.isLoading} /></TabsContent>
          <TabsContent value="thai" className="mt-3"><RankList rows={subjectRows} loading={subjectQ.isLoading} /></TabsContent>
          <TabsContent value="english" className="mt-3"><RankList rows={subjectRows} loading={subjectQ.isLoading} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
