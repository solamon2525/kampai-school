/**
 * HubUsageInsights — top viewed media/games for a teacher (usage insights roadmap).
 */
import { useQuery } from '@tanstack/react-query';
import { Eye, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { educationalHubService } from '@/services/educational-hub.service';

export function HubUsageInsights({ staffId }: { staffId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['edu-hub', 'top-viewed', staffId],
    queryFn: () => educationalHubService.listTopViewedItems({ ownerStaffId: staffId, limit: 12 }),
  });

  const totalViews = items.reduce((s, i) => s + (i.view_count ?? 0), 0);

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
    </Card>
  );
}
