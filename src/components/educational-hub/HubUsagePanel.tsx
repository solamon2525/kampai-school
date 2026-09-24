import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ExternalLink, FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { educationalHubService } from '@/services/educational-hub.service';
import { worksheetSetsService } from '@/services/worksheet-sets.service';

type Props = {
  staffId: string;
};

export function HubUsagePanel({ staffId }: Props) {
  const navigate = useNavigate();

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['hub-usage-items', staffId],
    queryFn: async () => {
      const { data, error } = await educationalHubService.listMyItems(staffId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: setCounts, isLoading: loadingSets } = useQuery({
    queryKey: ['hub-usage-sets', staffId],
    queryFn: async () => {
      const { data, error } = await worksheetSetsService.countByKey(staffId);
      if (error) throw error;
      return data ?? {};
    },
  });

  const topMedia = useMemo(() => {
    return [...items]
      .filter((i) => (i.external_url || '').includes('-media') || (i.external_url || '').includes('thinking-media'))
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, 10);
  }, [items]);

  const topAllViews = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, 10);
  }, [items]);

  const topWorksheetKeys = useMemo(() => {
    const entries = Object.entries(setCounts ?? {});
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [setCounts]);

  const loading = loadingItems || loadingSets;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          การใช้งานสื่อ / ใบงาน
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          จาก view_count ในคลังของคุณ และจำนวนชุดใบงานที่บันทึกไว้
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Top 10 สื่อ (ตามยอดดู)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(topMedia.length ? topMedia : topAllViews).length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
              ) : (
                <ol className="space-y-2">
                  {(topMedia.length ? topMedia : topAllViews).map((item, idx) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.view_count ?? 0} ครั้งดู
                          {item.external_url ? ` · ${item.external_url}` : ''}
                        </div>
                      </div>
                      {item.external_url ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 shrink-0"
                          asChild
                        >
                          <a href={item.external_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Top worksheet_key (ชุดที่บันทึก)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topWorksheetKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีชุดใบงานที่บันทึก</p>
              ) : (
                <ol className="space-y-2">
                  {topWorksheetKeys.map(([key, count], idx) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{key}</div>
                        <div className="text-xs text-muted-foreground">{count} ชุด</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={() =>
                          navigate(`/teacher/edu-hub?tab=worksheet-sets&key=${encodeURIComponent(key)}`)
                        }
                      >
                        เปิดชุด
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
