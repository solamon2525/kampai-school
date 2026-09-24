import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Trash2, BookOpen, FileText, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  lessonPacksService,
  type LessonPack,
  type LessonPackStep,
} from '@/services/lesson-packs.service';
import { cn } from '@/lib/utils';

type Props = {
  staffId?: string | null;
  mode?: 'mine' | 'recent';
};

function StepIcon({ type }: { type: LessonPackStep['type'] }) {
  if (type === 'media') return <BookOpen className="h-3.5 w-3.5 shrink-0 text-sky-700" />;
  if (type === 'worksheet') return <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-700" />;
  return <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

function PackCard({
  pack,
  canDelete,
  onDelete,
}: {
  pack: LessonPack;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{pack.title}</div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pack.subject ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                {pack.subject}
              </Badge>
            ) : null}
            {pack.grade_label ? (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {pack.grade_label}
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px] font-normal">
              {pack.pack_key}
            </Badge>
          </div>
        </div>
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (window.confirm(`ลบชุดคาบ «${pack.title}» ?`)) onDelete(pack.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <ol className="space-y-1.5">
        {pack.steps.map((step, i) => (
          <li
            key={`${pack.id}-${i}`}
            className={cn(
              'flex flex-wrap items-center gap-2 rounded border border-border/70 bg-background px-2.5 py-1.5 text-xs',
            )}
          >
            <span className="text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
            <StepIcon type={step.type} />
            <span className="font-medium text-foreground min-w-0 flex-1">{step.label}</span>
            {step.hint ? (
              <span className="text-muted-foreground w-full pl-6 sm:w-auto sm:pl-0">{step.hint}</span>
            ) : null}
            {step.url ? (
              <Button variant="outline" size="sm" className="h-7 text-[11px]" asChild>
                <a href={step.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  เปิด
                </a>
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
    </li>
  );
}

export function LessonPacksPanel({ staffId, mode = 'mine' }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['lesson-packs', mode, staffId ?? 'all'] as const;

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    enabled: mode === 'recent' || Boolean(staffId),
    queryFn: async () => {
      if (mode === 'recent') {
        const { data, error } = await lessonPacksService.listRecent(40);
        if (error) throw error;
        return data;
      }
      const { data, error } = await lessonPacksService.listMine(staffId!);
      if (error) throw error;
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await lessonPacksService.remove(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-packs'] });
      toast({ title: 'ลบชุดคาบแล้ว' });
    },
    onError: (error: Error) => {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">
          ชุดคาบพร้อมใช้
          {rows.length > 0 ? (
            <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
              {rows.length} ชุด
            </Badge>
          ) : null}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          เปิดทีละขั้น: สอนบนจอ → พิมพ์ใบงาน → เฉลยโปรเจคเตอร์ (ลิงก์เปิดในแท็บใหม่)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีชุดคาบ — apply migration 430 แล้วรีเฟรช หรือรอ seed จากระบบ
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                canDelete={mode === 'mine' || mode === 'recent'}
                onDelete={(id) => removeMutation.mutate(id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
