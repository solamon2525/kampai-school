import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Trash2, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type Props = {
  staffId?: string | null;
  /** admin view lists recent sets across owners */
  mode?: 'mine' | 'recent';
  limit?: number;
};

export function WorksheetSetsPanel({ staffId, mode = 'mine', limit = 20 }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterKey = searchParams.get('key')?.trim() || '';

  const setFilterKey = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!key) next.delete('key');
      else next.set('key', key);
      if (!next.get('tab')) next.set('tab', 'worksheet-sets');
      return next;
    }, { replace: true });
  };

  const queryKey = ['worksheet-sets', mode, staffId ?? 'all', limit, filterKey || 'all'] as const;

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    enabled: mode === 'recent' || Boolean(staffId),
    queryFn: async () => {
      if (mode === 'recent') {
        const { data, error } = await worksheetSetsService.listRecent(Math.max(limit, 80));
        if (error) throw error;
        const all = (data ?? []) as WorksheetSet[];
        const filtered = filterKey
          ? all.filter((r) => r.worksheet_key === filterKey)
          : all;
        return filtered.slice(0, limit);
      }
      const { data, error } = await worksheetSetsService.listMine(
        staffId!,
        filterKey || undefined,
      );
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
          {' · Deep-link: '}
          <code className="rounded bg-muted px-1 text-[10px]">?tab=worksheet-sets&amp;key=…</code>
        </p>
        {filterKey ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="default" className="text-[10px]">
              กรอง: {filterKey}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setFilterKey('')}
            >
              <X className="mr-1 h-3 w-3" />
              ล้างกรอง
            </Button>
          </div>
        ) : null}
        {countsByKey.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {countsByKey.slice(0, 12).map(([key, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterKey(filterKey === key ? '' : key)}
                className="inline-flex"
              >
                <Badge
                  variant={filterKey === key ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-[10px] font-normal',
                    filterKey === key && 'ring-1 ring-ring',
                  )}
                >
                  {key}: {count}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filterKey
              ? `ยังไม่มีชุดสำหรับ «${filterKey}» — เปิดใบงานนั้นแล้วกด «บันทึกชุด»`
              : 'ยังไม่มีชุดที่บันทึก — เปิดใบงาน แล้วกด «บันทึกชุด» ในแถบเครื่องมือ'}
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
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => setFilterKey(row.worksheet_key)}
                    >
                      {row.worksheet_key}
                    </button>
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
