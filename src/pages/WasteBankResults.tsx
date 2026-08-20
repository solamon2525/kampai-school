import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Award, CalendarDays, Gift, Image as ImageIcon, PackageCheck, Recycle, Sparkles, Star, Trophy, Users } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WasteBankResultsQr } from '@/components/waste-bank/WasteBankResultsQr';
import { RewardCostDisplay } from '@/components/rewards/RewardCostDisplay';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import { rewardsService, wasteBankShowcaseService, type WasteShowcasePhotoWithUrl } from '@/services';

const DEFAULT_COPY = {
  title: 'ผลการดำเนินงานธนาคารขยะ',
  introduction: 'ร่วมกันคัดแยกขยะ เปลี่ยนวัสดุรีไซเคิลเป็นแต้ม และสร้างนิสัยรับผิดชอบต่อสิ่งแวดล้อม',
  goal_text: 'ปลูกฝังการคัดแยกขยะและการใช้ทรัพยากรอย่างรู้คุณค่า',
  highlight_text: 'ทุกชิ้นที่นำมาฝาก คือการลงมือสร้างโรงเรียนสีเขียวร่วมกัน',
};

const GALLERY_LABELS = {
  waste_delivery: 'ส่งขยะเข้าธนาคาร',
  reward_claim: 'เคลมรางวัล',
  reward_handover: 'มอบรางวัล',
} as const;

const PROCESS = [
  { icon: Recycle, title: 'คัดแยกและนำส่ง', text: 'นักเรียนคัดแยกวัสดุรีไซเคิลและนำมาฝากที่ธนาคารขยะ' },
  { icon: Sparkles, title: 'บันทึกและสะสมแต้ม', text: 'ครูบันทึกจำนวนผ่านระบบ แต้มเข้าสู่บัญชีนักเรียนอย่างโปร่งใส' },
  { icon: Gift, title: 'เคลมรางวัล', text: 'นักเรียนเลือกรางวัลตามแต้มที่สะสมและส่งคำขอผ่านระบบ' },
  { icon: Award, title: 'อนุมัติและมอบรางวัล', text: 'ครูตรวจสอบคำขอและส่งมอบรางวัล พร้อมประวัติการดำเนินงาน' },
];

const WasteBankResults = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<WasteShowcasePhotoWithUrl | null>(null);
  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['waste-bank-showcase', 'public-results'],
    queryFn: wasteBankShowcaseService.getPublicResults,
    staleTime: 5 * 60 * 1000,
  });
  const { data: report } = useQuery({
    queryKey: ['waste-bank-showcase', 'report', results?.academic_year, results?.semester],
    queryFn: () => wasteBankShowcaseService.getReport(results!.academic_year, results!.semester),
    enabled: !!results,
    staleTime: 5 * 60 * 1000,
  });
  const { data: photos = [] } = useQuery({
    queryKey: ['waste-bank-showcase', 'photos', report?.id],
    queryFn: () => wasteBankShowcaseService.listPhotos(report!.id),
    enabled: !!report,
    staleTime: 5 * 60 * 1000,
  });
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', 'active'],
    queryFn: async () => {
      const { data, error } = await rewardsService.getActive();
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const copy = report ?? DEFAULT_COPY;
  const maxCategoryItems = Math.max(1, ...(results?.categories.map((category) => category.items) ?? [1]));
  const galleryGroups = useMemo(() => Object.entries(GALLERY_LABELS).map(([key, label]) => ({
    key,
    label,
    photos: photos.filter((photo) => photo.category === key && photo.is_published),
  })).filter((group) => group.photos.length > 0), [photos]);

  const stats = results ? [
    { label: 'ขยะที่รับฝาก', value: results.totals.items, unit: 'ชิ้น', icon: Recycle },
    { label: 'รายการรับฝาก', value: results.totals.transactions, unit: 'ครั้ง', icon: PackageCheck },
    { label: 'นักเรียนมีส่วนร่วม', value: results.totals.students, unit: 'คน', icon: Users },
    { label: 'แต้มที่สร้าง', value: results.totals.points, unit: 'แต้ม', icon: Sparkles },
    { label: 'คำขอที่อนุมัติ', value: results.totals.approved_claims, unit: 'คำขอ', icon: Gift },
    { label: 'รางวัลที่มอบ', value: results.totals.awarded_items, unit: 'ชิ้น', icon: Award },
  ] : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="ผลการดำเนินงานธนาคารขยะ" description="ผลการดำเนินงานธนาคารขยะ โรงเรียนบ้านคำไผ่ ข้อมูลการรับฝากขยะ การสะสมแต้ม และการมอบรางวัล" />
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary py-8 text-primary-foreground md:py-12">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <Badge className="mb-3 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">ธนาคารขยะโรงเรียนบ้านคำไผ่</Badge>
            <h1 className="text-2xl font-bold md:text-4xl">{copy.title}</h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">{copy.introduction}</p>
            {results && <p className="mt-3 text-xs text-primary-foreground/70">ปีการศึกษา {results.academic_year} · ภาคเรียนที่ {results.semester}</p>}
            <Button asChild variant="secondary" size="sm" className="mt-5"><Link to="/waste-bank"><ArrowLeft className="mr-2 h-4 w-4" />กลับหน้าธนาคารขยะ</Link></Button>
          </div>
        </section>

        {isLoading ? (
          <div className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">กำลังรวบรวมผลการดำเนินงาน...</div>
        ) : isError || !results ? (
          <div className="mx-auto max-w-5xl px-4 py-20 text-center text-destructive">ไม่สามารถโหลดผลการดำเนินงานได้ กรุณาลองใหม่อีกครั้ง</div>
        ) : (
          <>
            <section className="mx-auto max-w-6xl px-4 py-8">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {stats.map((stat) => (
                  <Card key={stat.label} className="border-border shadow-sm"><CardContent className="p-4 text-center">
                    <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label} · {stat.unit}</p>
                  </CardContent></Card>
                ))}
              </div>
              {results.updated_at && <p className="mt-3 text-center text-xs text-muted-foreground">อัปเดตข้อมูลล่าสุด {formatThaiDateFull(results.updated_at)}</p>}
            </section>

            <section className="border-y border-border bg-muted/30 py-10">
              <div className="mx-auto max-w-5xl px-4">
                <div className="mb-6 text-center"><p className="text-sm font-semibold text-primary">จากขยะสู่คุณค่า</p><h2 className="text-xl font-bold text-foreground md:text-2xl">กระบวนการดำเนินงานที่ตรวจสอบได้</h2></div>
                <div className="grid gap-3 md:grid-cols-4">
                  {PROCESS.map((step, index) => <div key={step.title} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><step.icon className="h-5 w-5 text-primary" /></div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>)}
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-10">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">เปลี่ยนแต้มเป็นความภาคภูมิใจ</p>
                  <h2 className="text-xl font-bold text-foreground md:text-2xl">รางวัลสำหรับนักเรียน</h2>
                  <p className="mt-1 text-sm text-muted-foreground">ตัวอย่างรางวัลที่นักเรียนสามารถใช้แต้มจากธนาคารขยะแลกได้</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link to="/waste-bank/rewards"><Gift className="mr-2 h-4 w-4" />ดูรางวัลทั้งหมด</Link></Button>
              </div>
              {rewardsLoading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : rewards.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {rewards.map((reward) => (
                    <article key={reward.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                      <div className="aspect-square overflow-hidden bg-muted">
                        {reward.image_url ? <img src={reward.image_url} alt={reward.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Gift className="h-10 w-10" /></div>}
                      </div>
                      <div className="space-y-2 p-3">
                        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">{reward.name}</h3>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <RewardCostDisplay waste={reward.waste_points_cost} virtue={reward.virtue_points_cost} className="text-xs" />
                          {reward.stock !== null && <span className="text-xs text-muted-foreground">{reward.stock > 0 ? `เหลือ ${reward.stock}` : 'หมดชั่วคราว'}</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">กำลังเตรียมรายการรางวัลสำหรับนักเรียน</div>
              )}
            </section>

            <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
              <Card><CardContent className="p-5"><h2 className="mb-4 text-lg font-bold text-foreground">ขยะที่รับฝากแยกตามประเภท</h2>
                <div className="space-y-3">{results.categories.map((category) => <div key={category.id}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-foreground">{category.icon ?? '♻️'} {category.name}</span><span className="text-muted-foreground">{category.items.toLocaleString()} ชิ้น</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, category.items / maxCategoryItems * 100)}%` }} /></div>
                </div>)}</div>
              </CardContent></Card>
              <Card><CardContent className="p-5"><h2 className="mb-4 text-lg font-bold text-foreground">แนวโน้มการรับฝากรายเดือน</h2>
                {results.monthly.length > 0 ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={results.monthly} margin={{ left: -18, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={(value: number) => [`${value.toLocaleString()} ชิ้น`, 'ขยะ']} /><Bar dataKey="items" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-20 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลรายเดือน</p>}
              </CardContent></Card>
            </section>

            <section className="bg-muted/30 py-10"><div className="mx-auto max-w-5xl px-4">
              <div className="mb-5 text-center"><Trophy className="mx-auto mb-2 h-7 w-7 text-primary" /><h2 className="text-xl font-bold text-foreground md:text-2xl">นักเรียนต้นแบบ Top 10</h2><p className="text-sm text-muted-foreground">เรียงตามแต้มที่ได้รับในภาคเรียนนี้</p></div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {results.top_students.map((student, index) => <div key={`${student.name}-${student.class_name}`} className={cn('flex items-center gap-3 px-4 py-3', index > 0 && 'border-t border-border')}>
                  <span className="w-7 shrink-0 text-center font-bold text-primary">{index + 1}</span><PersonAvatar name={student.name} photoUrl={student.photo_url} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{student.name}</p><p className="text-xs text-muted-foreground">{student.class_name ?? 'ไม่ระบุชั้น'}</p></div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">{student.items.toLocaleString()} ชิ้น · {student.transactions.toLocaleString()} ครั้ง</div>
                  <Badge variant="secondary">{student.points.toLocaleString()} แต้ม</Badge>
                </div>)}
              </div>
            </div></section>

            <section className="mx-auto grid max-w-5xl gap-4 px-4 py-10 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6"><Star className="mb-3 h-6 w-6 text-primary" /><h2 className="text-lg font-bold text-foreground">เป้าหมายของโครงการ</h2><p className="mt-2 leading-relaxed text-muted-foreground">{copy.goal_text}</p></div>
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6"><Sparkles className="mb-3 h-6 w-6 text-primary" /><h2 className="text-lg font-bold text-foreground">สิ่งที่เราให้ความสำคัญ</h2><p className="mt-2 leading-relaxed text-muted-foreground">{copy.highlight_text}</p></div>
            </section>

            {galleryGroups.length > 0 && <section className="border-y border-border bg-muted/30 py-10"><div className="mx-auto max-w-6xl space-y-8 px-4">
              <div className="text-center"><ImageIcon className="mx-auto mb-2 h-7 w-7 text-primary" /><h2 className="text-xl font-bold text-foreground md:text-2xl">ภาพการดำเนินงานจริง</h2><p className="text-sm text-muted-foreground">บันทึกกิจกรรมจากการรับฝากขยะจนถึงการส่งมอบรางวัล</p></div>
              {galleryGroups.map((group) => <div key={group.key}><h3 className="mb-3 text-base font-bold text-foreground">{group.label}</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {group.photos.map((photo) => <button key={photo.id} type="button" onClick={() => setSelectedPhoto(photo)} className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm">
                  {photo.signed_url ? <img src={photo.signed_url} alt={photo.caption || group.label} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground"><ImageIcon className="h-7 w-7" /></div>}
                  {(photo.caption || photo.activity_date) && <div className="p-3"><p className="line-clamp-2 text-sm font-medium text-foreground">{photo.caption || group.label}</p>{photo.activity_date && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatThaiDateFull(photo.activity_date)}</p>}</div>}
                </button>)}
              </div></div>)}
            </div></section>}

            <section className="mx-auto max-w-md px-4 py-10"><WasteBankResultsQr /></section>
          </>
        )}
      </main>
      <Footer />
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{selectedPhoto?.caption || (selectedPhoto ? GALLERY_LABELS[selectedPhoto.category as keyof typeof GALLERY_LABELS] : '')}</DialogTitle><DialogDescription>{selectedPhoto?.activity_date ? formatThaiDateFull(selectedPhoto.activity_date) : 'ภาพการดำเนินงานธนาคารขยะ'}</DialogDescription></DialogHeader>{selectedPhoto?.signed_url && <img src={selectedPhoto.signed_url} alt={selectedPhoto.caption || 'ภาพกิจกรรมธนาคารขยะ'} className="max-h-[70vh] w-full rounded-lg object-contain" />}</DialogContent></Dialog>
    </div>
  );
};

export default WasteBankResults;
