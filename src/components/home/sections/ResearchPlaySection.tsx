/**
 * ResearchPlaySection — โซนหน้าแรก: งานวิจัยเกมที่เปิดสาธารณะ
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Gamepad2, ChevronRight, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { gameResearchService, modeLabel } from '@/services/game-research.service';

export default function ResearchPlaySection() {
  const { data: studies, isLoading } = useQuery({
    queryKey: ['research-studies-public'],
    queryFn: async () => {
      const { data, error } = await gameResearchService.listPublic();
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!studies?.length) return null;

  const preview = studies.slice(0, 3);

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="font-semibold text-sm flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          งานวิจัยเกมในชั้นเรียน
        </span>
        <Button asChild variant="secondary" size="sm" className="h-7 text-xs">
          <Link to="/research">ดูทั้งหมด</Link>
        </Button>
      </div>
      <div className="p-4 space-y-2">
        {preview.map((s) => (
          <Link
            key={s.id}
            to={`/research/${s.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors p-3 group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {s.game_title} · {modeLabel(s.game_slug, s.game_mode)} · ชั้น {s.class_name}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {s.max_rounds_per_day} รอบ/วัน
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        ))}
        {studies.length > 3 && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            และอีก {studies.length - 3} โครงการ —{' '}
            <Link to="/research" className="text-primary underline">ดูทั้งหมด</Link>
          </p>
        )}
      </div>
    </div>
  );
}
