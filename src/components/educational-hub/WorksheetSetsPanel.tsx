import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  worksheetOpenUrl,
  worksheetSetsService,
  type WorksheetSet,
} from '@/services/worksheet-sets.service';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

type Props = {
  staffId?: string | null;
  /** admin view lists recent sets across owners */
  mode?: 'mine' | 'recent';
  limit?: number;
};

export function WorksheetSetsPanel({ staffId, mode = 'mine', limit = 20 }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['worksheet-sets', mode, staffId ?? 'all', limit] as const;

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    enabled: mode === 'recent' || Boolean(staffId),
    queryFn: async () => {
      if (mode === 'recent') {
        const { data, error } = await worksheetSetsService.listRecent(limit);
        if (error) throw error;
        return (data ?? []) as WorksheetSet[];
      }
      const { data, error } = await worksheetSetsService.listMine(staffId!);
      if (error) throw error;
      return ((data ?? []) as WorksheetSet[]).slice(0, limit);
    },
  });

  const countsQueryKey = ['worksheet-sets-counts', mode, staffId ?? 'all'] as const;
  const { data: countStats } = useQuery({
    queryKey: countsQueryKey,
    enabled: mode === 'recent' || Boolean(staffId),
    queryFn: async () => {
      const { data, error, total } = await worksheetSetsService.countByKey(
        mode === 'mine' ? staffId : null,
      );
      if (error) throw error;
      return { counts: data ?? {}, total };
    },
  });

  const countsByKey = useMemo(() => {
    const entries = Object.entries(countStats?.counts ?? {});
    return entries.sort((a, b) => b[1] - a[1]);
  }, [countStats]);

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await worksheetSetsService.remove(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheet-sets'] });
      queryClient.invalidateQueries({ queryKey: ['worksheet-sets-counts'] });
      toast({ title: 'ลบชุดใบงานแล้ว' });
    },
    onError: (error: Error) => {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">
          ชุดใบงานที่บันทึก {mode === 'mine' ? 'ของฉัน' : 'ล่าสุด'}
          {typeof countStats?.total === 'number' && countStats.total > 0 ? (
            <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
              {countStats.total} ชุดทั้งหมด
            </Badge>
          ) : !isLoading && rows.length > 0 ? (
            <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
              {rows.length} ชุด
            </Badge>
          ) : null}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          เปิดลิงก์เดิมบนจอเพื่อเฉลยโจทย์ชุดเดียวกับที่พิมพ์ให้นักเรียน — บันทึกชุดได้จากตัวใบงานเมื่อล็อกอินพอร์ทัล
          {mode === 'recent' ? ' · สรุปด้านล่างนับจากฐานข้อมูลจริง' : ''}
        </p>
        {countsByKey.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {countsByKey.slice(0, 10).map(([key, count]) => (
              <Badge key={key} variant="outline" className="text-[10px] font-normal">
                {key}: {count}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีชุดที่บันทึก — เปิดใบงาน แล้วกด «บันทึกชุด» ในแถบเครื่องมือ
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{row.title}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{row.worksheet_key}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {row.access}
                    </Badge>
                    <span>
                      {format(new Date(row.created_at), 'd MMM yy HH:mm', { locale: th })}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={worksheetOpenUrl(row)} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    เปิด / เฉลย
                  </a>
                </Button>
                {(mode === 'mine' || mode === 'recent') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`ลบชุด «${row.title}» ?`)) removeMutation.mutate(row.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
