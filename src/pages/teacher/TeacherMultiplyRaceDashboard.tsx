/**
 * TeacherMultiplyRaceDashboard — Phase 4
 *
 * Dashboard ครู/แอดมินสำหรับเกม multiply-race:
 *   1. Class heatmap — เปอร์เซ็นต์ผิดรายแม่สูตรคูณ (สีตามความผิด)
 *   2. Daily Challenge today — ใครเล่นวันนี้บ้าง คะแนนเท่าไหร่
 *   3. Per-student list — รายชื่อนักเรียนพร้อม badges + วันที่เล่นล่าสุด
 *
 * Route: /teacher/games/multiply-race (allow={['teacher','admin']})
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Medal, Trophy, Calendar, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { multiplyRaceService } from '@/services/multiply-race.service';

const CLASS_OPTIONS = ['ทั้งหมด', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

function heatmapColor(pct: number, attempts: number): string {
  if (attempts === 0) return 'bg-muted text-muted-foreground';
  if (pct < 10) return 'bg-emerald-500/90 text-white';
  if (pct < 25) return 'bg-lime-500/90 text-white';
  if (pct < 40) return 'bg-amber-500/90 text-white';
  if (pct < 60) return 'bg-orange-500/90 text-white';
  return 'bg-red-500/90 text-white';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000 / 60;
  if (diff < 1) return 'เมื่อกี้';
  if (diff < 60) return `${Math.floor(diff)} นาทีที่แล้ว`;
  if (diff < 1440) return `${Math.floor(diff / 60)} ชม.ที่แล้ว`;
  return d.toLocaleDateString('th-TH');
}

const TeacherMultiplyRaceDashboard = () => {
  const [classFilter, setClassFilter] = useState<string>('ทั้งหมด');
  const effectiveFilter = classFilter === 'ทั้งหมด' ? null : classFilter;

  const heatmapQuery = useQuery({
    queryKey: ['mr-heatmap', effectiveFilter],
    queryFn: () => multiplyRaceService.getTableHeatmap(effectiveFilter),
  });

  const overviewQuery = useQuery({
    queryKey: ['mr-class-overview', effectiveFilter],
    queryFn: () => multiplyRaceService.getClassOverview(effectiveFilter),
  });

  const stats = useMemo(() => {
    const rows = overviewQuery.data ?? [];
    return {
      students: rows.length,
      totalCorrect: rows.reduce((sum, r) => sum + r.total_correct, 0),
      totalWrong: rows.reduce((sum, r) => sum + r.total_wrong, 0),
      playedToday: rows.filter((r) => r.daily_played_today).length,
    };
  }, [overviewQuery.data]);

  const isLoading = heatmapQuery.isLoading || overviewQuery.isLoading;

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            ✖️ แข่งสูตรคูณ · Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">ติดตามผลการเรียนสูตรคูณของนักเรียน</p>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CLASS_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="นักเรียนเล่นแล้ว" value={stats.students.toString()} icon={<Trophy className="h-4 w-4" />} />
        <SummaryCard label="ตอบถูกรวม" value={stats.totalCorrect.toLocaleString()} icon={<Medal className="h-4 w-4 text-emerald-500" />} />
        <SummaryCard label="ตอบผิดรวม" value={stats.totalWrong.toLocaleString()} icon={<AlertCircle className="h-4 w-4 text-red-500" />} />
        <SummaryCard label="ชาเลนจ์วันนี้" value={stats.playedToday.toString()} icon={<Calendar className="h-4 w-4 text-blue-500" />} />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔥 เปอร์เซ็นต์ผิดรายแม่ (heatmap)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังโหลด...</div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
              {(heatmapQuery.data ?? []).map((row) => (
                <div key={row.table_num} className={cn('rounded-md p-2 text-center', heatmapColor(Number(row.wrong_pct), row.total_attempts))}>
                  <div className="font-bold text-lg leading-none">{row.table_num}</div>
                  <div className="text-xs mt-1 opacity-90">{row.total_attempts === 0 ? '—' : `${row.wrong_pct}%`}</div>
                  <div className="text-[10px] opacity-75">{row.total_attempts} ครั้ง</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            🟢 ผิดน้อย (&lt;10%) · 🟡 25–40% · 🟠 40–60% · 🔴 ผิดเยอะ (60%+)
          </p>
        </CardContent>
      </Card>

      {/* Per-student list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">👥 รายชื่อนักเรียน</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังโหลด...</div>
          ) : (overviewQuery.data ?? []).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">ยังไม่มีนักเรียนเล่นเกมในกลุ่มนี้</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>นักเรียน</TableHead>
                    <TableHead className="text-center">ตราเก่ง</TableHead>
                    <TableHead className="text-center">ถูก/ผิด</TableHead>
                    <TableHead className="text-center">แม่อ่อนสุด</TableHead>
                    <TableHead className="text-center">ชาเลนจ์วันนี้</TableHead>
                    <TableHead className="text-center">เล่นล่าสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overviewQuery.data ?? []).map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell>
                        <div className="font-medium">{s.display_name}</div>
                        <div className="text-xs text-muted-foreground">{s.class_label || '—'} · {s.student_code}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1 text-sm">
                          {s.badge_gold > 0 && <span title={`${s.badge_gold} แม่`}>🥇{s.badge_gold}</span>}
                          {s.badge_silver - s.badge_gold > 0 && <span title="🥈">🥈{s.badge_silver - s.badge_gold}</span>}
                          {s.badge_bronze - s.badge_silver > 0 && <span title="🥉">🥉{s.badge_bronze - s.badge_silver}</span>}
                          {s.badge_bronze === 0 && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2 text-xs">
                          <span className="text-emerald-600 font-medium">{s.total_correct}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-500 font-medium">{s.total_wrong}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {s.weakest_table ? (
                          <Badge variant="destructive" className="text-xs">แม่ {s.weakest_table}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.daily_played_today ? (
                          <span className="text-blue-600 font-medium">✓ {s.daily_score_today}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {formatDate(s.last_played_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SummaryCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon} {label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default TeacherMultiplyRaceDashboard;
