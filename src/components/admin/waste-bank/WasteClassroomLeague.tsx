import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Sparkles, RefreshCw, Calendar, Award } from 'lucide-react';
import { wasteClassroomLeagueService, termService, type WasteClassroomRanking } from '@/services/waste-bank.service';
import { cn } from '@/lib/utils';

interface WasteClassroomLeagueProps {
  className?: string;
  showCardWrapper?: boolean;
}

export const WasteClassroomLeague: React.FC<WasteClassroomLeagueProps> = ({
  className,
  showCardWrapper = true,
}) => {
  const [filterMode, setFilterMode] = useState<'month' | 'semester' | 'all'>('month');
  const [rankings, setRankings] = useState<WasteClassroomRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState<{ year: string; sem: string } | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const currentMonthName = monthNamesThai[now.getMonth()];

  const loadRankings = async () => {
    setLoading(true);
    try {
      const term = await termService.getActive();
      setActiveTerm(term);

      let params: {
        academic_year?: string;
        semester?: string;
        month?: number;
        year?: number;
      } = {};

      if (filterMode === 'month') {
        params = { month: currentMonth, year: currentYear };
      } else if (filterMode === 'semester') {
        if (term) {
          params = { academic_year: term.year, semester: term.sem };
        }
      }

      const { data, error } = await wasteClassroomLeagueService.getRankings(params);
      if (!error && data) {
        setRankings(data);
      }
    } catch (err) {
      console.error('Failed to load classroom league rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode]);

  const maxItemsPerStudent = useMemo(() => {
    return Math.max(1, ...rankings.map((r) => Number(r.items_per_student) || 0));
  }, [rankings]);

  const top3 = rankings.slice(0, 3);

  const content = (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              ศึกลีกห้องเรียนรักษ์โลก (Eco-Classroom League)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ชิงถ้วยรางวัลหมุนเวียนยอดนักรีไซเคิล · จัดอันดับแบบเฉลี่ยต่อนักเรียน (Per-Capita)
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          <Button
            size="sm"
            variant={filterMode === 'month' ? 'default' : 'ghost'}
            className={cn(
              "h-8 px-2.5 text-xs font-medium rounded-lg",
              filterMode === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode('month')}
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            <span>เดือน{currentMonthName}</span>
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'semester' ? 'default' : 'ghost'}
            className={cn(
              "h-8 px-2.5 text-xs font-medium rounded-lg",
              filterMode === 'semester' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode('semester')}
          >
            <span>ภาคเรียน {activeTerm ? `${activeTerm.sem}/${activeTerm.year}` : 'ปัจจุบัน'}</span>
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'all' ? 'default' : 'ghost'}
            className={cn(
              "h-8 px-2.5 text-xs font-medium rounded-lg",
              filterMode === 'all' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode('all')}
          >
            <span>สะสมตลอดกาล</span>
          </Button>
        </div>
      </div>

      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="order-2 md:order-1 flex flex-col justify-end p-4 rounded-2xl bg-card border border-border shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs px-2 py-0.5">
                  🥈 อันดับ 2
                </Badge>
              </div>
              <div className="text-3xl my-2">🥈</div>
              <div className="text-xl font-bold text-foreground">{top3[1].class_name}</div>
              <div className="text-sm font-semibold text-primary mt-1">
                เฉลี่ย {Number(top3[1].items_per_student).toFixed(1)} ชิ้น/คน
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                รวม {top3[1].total_items.toLocaleString()} ชิ้น ({top3[1].participating_students}/{top3[1].student_count} คน)
              </div>
            </div>
          )}

          {/* Rank 1 (Gold Cup Leader) */}
          {top3[0] && (
            <div className="order-1 md:order-2 flex flex-col justify-end p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-card border-2 border-amber-400 shadow-md text-center relative overflow-hidden">
              <div className="absolute top-2 left-2">
                <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none text-xs px-2.5 py-0.5 font-bold shadow-sm">
                  🏆 ผู้นำลีก (แชมป์ถ้วยหมุนเวียน)
                </Badge>
              </div>
              <div className="text-4xl my-2 animate-bounce duration-1000">🏆</div>
              <div className="text-2xl font-black text-foreground">{top3[0].class_name}</div>
              <div className="text-base font-bold text-amber-600 mt-1">
                เฉลี่ย {Number(top3[0].items_per_student).toFixed(1)} ชิ้น/คน
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                รวม {top3[0].total_items.toLocaleString()} ชิ้น ({top3[0].participating_students}/{top3[0].student_count} คน)
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="order-3 md:order-3 flex flex-col justify-end p-4 rounded-2xl bg-card border border-border shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-300 text-xs px-2 py-0.5">
                  🥉 อันดับ 3
                </Badge>
              </div>
              <div className="text-3xl my-2">🥉</div>
              <div className="text-xl font-bold text-foreground">{top3[2].class_name}</div>
              <div className="text-sm font-semibold text-primary mt-1">
                เฉลี่ย {Number(top3[2].items_per_student).toFixed(1)} ชิ้น/คน
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                รวม {top3[2].total_items.toLocaleString()} ชิ้น ({top3[2].participating_students}/{top3[2].student_count} คน)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Classroom Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-2">
          <span>ตารางคะแนนสะสมและสัดส่วนห้องเรียน</span>
          <span>เฉลี่ยชิ้น/คน (เป้าหมายสูงสุด)</span>
        </div>

        {rankings.map((row, idx) => {
          const pct = Math.min(100, Math.round((Number(row.items_per_student) / maxItemsPerStudent) * 100));
          const participationPct = row.student_count > 0 ? Math.round((Number(row.participating_students) / Number(row.student_count)) * 100) : 0;

          return (
            <div
              key={row.class_name}
              className={cn(
                "p-3.5 rounded-xl border transition-colors flex flex-col gap-2.5",
                idx === 0 ? "bg-amber-500/5 border-amber-300/80" : "bg-card border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    idx === 0 ? "bg-amber-500 text-white" :
                    idx === 1 ? "bg-slate-300 text-slate-800" :
                    idx === 2 ? "bg-amber-700 text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {row.rank}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-foreground mr-2">{row.class_name}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                      นักเรียน {row.student_count} คน
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">
                    {Number(row.items_per_student).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">ชิ้น/คน</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    รวม {row.total_items.toLocaleString()} ชิ้น · {row.total_points.toLocaleString()} แต้ม
                  </div>
                </div>
              </div>

              {/* Progress Bar & Participation */}
              <div className="space-y-1">
                <Progress value={pct} className="h-2 bg-muted" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-primary/70" />
                    มีส่วนร่วม {row.participating_students}/{row.student_count} คน ({participationPct}%)
                  </span>
                  <span>{pct}% ของผู้นำลีก</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Callout */}
      <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs text-muted-foreground flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">เกณฑ์การตัดสินศึกลีกห้องเรียน: </span>
          อันดับคำนวณจาก <strong>จำนวนชิ้นขยะรวม ÷ จำนวนนักเรียนทั้งหมดในห้อง (Per-Capita Average)</strong> เพื่อความยุติธรรมระหว่างห้องเรียนขนาดเล็กและขนาดใหญ่ ห้องที่ครองอันดับ 1 เมื่อสิ้นสุดเดือนจะได้รับ <em>"ถ้วยรางวัลหมุนเวียนยอดนักรีไซเคิล 🏆"</em> ไปตั้งหน้าห้องเรียนตลอดทั้งเดือนถัดไป
        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn("bg-card text-foreground border border-border shadow-sm", className)}>
      <CardContent className="p-4 sm:p-6">{content}</CardContent>
    </Card>
  );
};
