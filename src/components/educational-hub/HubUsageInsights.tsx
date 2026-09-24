/**
 * HubUsageInsights — top viewed media/games for a teacher (usage insights roadmap).
 */
import { useQuery } from '@tanstack/react-query';
import { Eye, BarChart3, Pin, SearchCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { educationalHubService } from '@/services/educational-hub.service';

export function HubUsageInsights({ staffId }: { staffId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['edu-hub', 'top-viewed', staffId],
    queryFn: () => educationalHubService.listTopViewedItems({ ownerStaffId: staffId, limit: 12 }),
  });
  const { data: usage60Day = [], isLoading: loadingUsage } = useQuery({
    queryKey: ['edu-hub', 'usage-60-day', staffId],
    queryFn: () => educationalHubService.listUsage60Day(staffId),
  });

  const totalViews = items.reduce((s, i) => s + (i.view_count ?? 0), 0);
  const reviewCandidates = usage60Day.filter((item) => item.review_candidate);
  const observedItems = usage60Day.filter((item) => {
    const elapsed = Date.now() - new Date(`${item.observation_started_on}T00:00:00`).getTime();
    return elapsed >= 59 * 24 * 60 * 60 * 1000;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          สื่อ/เกมที่ถูกเปิดดูมาก (ของฉัน)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          ใช้ยอดเปิดดูเป็นสัญญาณว่าชิ้นไหนถูกนำไปสอน/ใช้จริง · รวม {totalViews.toLocaleString('th-TH')} ครั้ง
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground py-6 text-center">กำลังโหลด…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีรายการ</p>
        )}
        {items.map((it, idx) => (
          <div
            key={it.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium line-clamp-1">{it.title}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {it.is_published ? (
                  <Badge variant="secondary" className="text-[10px]">เผยแพร่</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">ร่าง</Badge>
                )}
                {it.subject && <Badge variant="outline" className="text-[10px]">{it.subject}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
              <Eye className="h-3.5 w-3.5" />
              {(it.view_count ?? 0).toLocaleString('th-TH')}
            </div>
          </div>
        ))}
      </CardContent>
      <CardContent className="space-y-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SearchCheck className="h-4 w-4 text-primary" />
              คิวตรวจรวมหลังเก็บข้อมูล 60 วัน
            </p>
            <p className="text-xs text-muted-foreground">
              ยอดต่ำเป็นเพียงสัญญาณ ต้องตรวจความซ้ำ ตัวชี้วัด และ Classroom QA ก่อนลบ
            </p>
          </div>
          <Badge variant="outline">พร้อมตรวจ {reviewCandidates.length} รายการ</Badge>
        </div>
        {loadingUsage ? (
          <p className="py-4 text-center text-sm text-muted-foreground">กำลังอ่านข้อมูล 60 วัน...</p>
        ) : observedItems.length === 0 ? (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            กำลังเก็บ baseline ยังไม่มีรายการใดครบ 60 วัน
          </p>
        ) : reviewCandidates.length === 0 ? (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            ยังไม่มีรายการที่เข้าเกณฑ์ตรวจรวม
          </p>
        ) : reviewCandidates.map((item) => (
          <div key={item.item_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                เจ้าของเปิด {item.owner_open_count} · ผู้ใช้อื่นเปิด {item.public_open_count} · รวม {item.total_open_count}
              </p>
            </div>
            {item.library_pinned && <Pin className="h-4 w-4 text-primary" aria-label="ปักหมุด" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
