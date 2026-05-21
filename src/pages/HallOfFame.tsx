import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Trophy, Medal, Award, Sparkles, GraduationCap, Calendar } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { conductService, type ConductRecord } from '@/services/conduct.service';
import { cn } from '@/lib/utils';

const CLASS_ORDER = [
  'อ.1', 'อ.2', 'อ.3',
  'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
  'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
];

type LeaderRow = {
  studentId: string;
  name: string;
  class: string;
  photoUrl: string | null;
  total: number;
  count: number;
};

const initials = (name: string) => {
  const cleaned = name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, '');
  return cleaned.slice(0, 2) || '?';
};

const medalColor = (rank: number) => {
  if (rank === 0) return 'bg-yellow-400 text-white';
  if (rank === 1) return 'bg-gray-400 text-white';
  if (rank === 2) return 'bg-amber-600 text-white';
  return 'bg-muted text-muted-foreground';
};

const HallOfFame = () => {
  const currentYear = String(new Date().getFullYear() + 543);
  const [semester, setSemester] = useState<string>('1');
  const [year, setYear] = useState<string>(currentYear);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['hall-of-fame', semester, year],
    queryFn: async () => {
      const { data, error } = await conductService.getPublicPositive(
        semester === 'all' ? undefined : semester,
        year,
      );
      if (error) throw error;
      return (data || []) as ConductRecord[];
    },
  });

  // Aggregate รวมทุกชั้น
  const overall = useMemo<LeaderRow[]>(() => {
    const map = new Map<string, LeaderRow>();
    for (const r of records) {
      if (!r.students) continue;
      const cur = map.get(r.student_id) ?? {
        studentId: r.student_id,
        name: r.students.name,
        class: r.students.class,
        photoUrl: r.students.photo_url ?? null,
        total: 0,
        count: 0,
      };
      cur.total += r.score;
      cur.count += 1;
      map.set(r.student_id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [records]);

  // จัดกลุ่มแยกรายชั้น
  const byClass = useMemo(() => {
    const map = new Map<string, LeaderRow[]>();
    for (const row of overall) {
      const arr = map.get(row.class) ?? [];
      arr.push(row);
      map.set(row.class, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = CLASS_ORDER.indexOf(a);
      const bi = CLASS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [overall]);

  const recentFeed = useMemo(() => records.slice(0, 20), [records]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Kampai Hero System - หอเกียรติยศคนดีคำไผ่" description="เชิดชูนักเรียนที่ทำความดี — Kampai Hero System อันดับ และประวัติ" />
      <SiteHeader />

      {/* Hero band */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/20 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">หอเกียรติยศคนดีคำไผ่</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            เชิดชูนักเรียนที่ทำความดี ด้วยการบันทึกคะแนน Kampai Hero System จากคุณครูทุกท่าน
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8">
        {/* Filter bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> ภาคเรียน
                </Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งปี</SelectItem>
                    <SelectItem value="1">ภาคเรียน 1</SelectItem>
                    <SelectItem value="2">ภาคเรียน 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ปีการศึกษา (พ.ศ.)</Label>
                <Input
                  className="w-28"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={currentYear}
                />
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {isLoading ? 'กำลังโหลด...' : `รวม ${overall.length} คน · ${records.length} เหตุการณ์`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overall" className="gap-1.5">
              <Trophy className="w-4 h-4" /> อันดับรวม
            </TabsTrigger>
            <TabsTrigger value="by-class" className="gap-1.5">
              <GraduationCap className="w-4 h-4" /> แยกรายชั้น
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-1.5">
              <Sparkles className="w-4 h-4" /> ความดีล่าสุด
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: อันดับรวม */}
          <TabsContent value="overall" className="mt-4 space-y-3">
            {overall.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีข้อมูล</CardContent></Card>
            ) : (
              <>
                {/* Top 3 podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {overall.slice(0, 3).map((row, idx) => (
                    <Card
                      key={row.studentId}
                      className={cn(
                        'border-2',
                        idx === 0 && 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/10',
                        idx === 1 && 'border-gray-400 bg-gray-50/50 dark:bg-gray-950/10',
                        idx === 2 && 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/10',
                      )}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 text-lg font-bold', medalColor(idx))}>
                          {idx + 1}
                        </div>
                        <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                          {row.photoUrl ? <AvatarImage src={row.photoUrl} alt={row.name} /> : null}
                          <AvatarFallback className="text-lg">{initials(row.name)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg leading-tight">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.class}</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
                          <Medal className="w-3.5 h-3.5 text-primary" />
                          <span className="font-bold text-primary">+{row.total}</span>
                          <span className="text-xs text-muted-foreground">({row.count} ครั้ง)</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Rest of top 10 */}
                {overall.length > 3 && (
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      {overall.slice(3, 10).map((row, i) => {
                        const rank = i + 3;
                        return (
                          <div key={row.studentId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {rank + 1}
                            </div>
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              {row.photoUrl ? <AvatarImage src={row.photoUrl} alt={row.name} /> : null}
                              <AvatarFallback>{initials(row.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{row.name}</p>
                              <p className="text-xs text-muted-foreground">{row.class}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-primary">+{row.total}</p>
                              <p className="text-xs text-muted-foreground">{row.count} ครั้ง</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab 2: แยกรายชั้น */}
          <TabsContent value="by-class" className="mt-4">
            {byClass.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีข้อมูล</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byClass.map(([cls, rows]) => (
                  <Card key={cls}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        {cls}
                        <Badge variant="outline" className="ml-auto">{rows.length} คน</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {rows.slice(0, 3).map((row, idx) => (
                        <div key={row.studentId} className="flex items-center gap-2">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', medalColor(idx))}>
                            {idx + 1}
                          </div>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            {row.photoUrl ? <AvatarImage src={row.photoUrl} alt={row.name} /> : null}
                            <AvatarFallback className="text-xs">{initials(row.name)}</AvatarFallback>
                          </Avatar>
                          <p className="flex-1 min-w-0 text-sm font-medium truncate">{row.name}</p>
                          <span className="text-sm font-bold text-primary flex-shrink-0">+{row.total}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Feed ล่าสุด */}
          <TabsContent value="recent" className="mt-4">
            {recentFeed.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีข้อมูล</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {recentFeed.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {r.students?.photo_url ? <AvatarImage src={r.students.photo_url} alt={r.students.name} /> : null}
                          <AvatarFallback>{initials(r.students?.name ?? '')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{r.students?.name ?? '—'}</p>
                            <Badge variant="outline" className="text-xs">{r.students?.class ?? '—'}</Badge>
                            <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">{r.category}</Badge>
                            <span className="ml-auto text-sm font-bold text-green-600">+{r.score}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(r.created_at), 'd MMM yyyy', { locale: th })}
                            {r.recorded_by && <span>· บันทึกโดย {r.recorded_by}</span>}
                          </p>
                        </div>
                        <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default HallOfFame;
