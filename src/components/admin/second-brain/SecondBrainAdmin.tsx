import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Lightbulb, GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { decisions } from '@/data/second-brain/decisions';
import { lessons } from '@/data/second-brain/lessons';

const tagConfig: Record<string, { label: string; cls: string }> = {
  bug:      { label: 'Bug',      cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  ux:       { label: 'UX',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  security: { label: 'Security', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  devops:   { label: 'DevOps',   cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  game:     { label: 'Game',     cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  perf:     { label: 'Perf',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export function SecondBrainAdmin() {
  const [activeTag, setActiveTag] = useState<string>('all');
  const tags = ['all', ...Array.from(new Set(lessons.map((l) => l.tag)))];
  const filtered = activeTag === 'all' ? lessons : lessons.filter((l) => l.tag === activeTag);

  return (
    <div className="flex-1 p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">🧠 Second Brain</h1>
          <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
            v1.209+
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          บันทึก Architecture Decisions + Lessons Learned สำหรับทีม dev
        </p>
        <div className="flex gap-2 pt-1">
          <a
            href="/second-brain"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            ดูหน้า Public (/second-brain)
          </a>
          <span className="text-border">·</span>
          <a
            href="/admin/dashboard/system-overview"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            System Overview เต็ม
          </a>
        </div>
      </div>

      <Tabs defaultValue="decisions">
        <TabsList>
          <TabsTrigger value="decisions" className="gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Architecture Decisions
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Lessons Learned
          </TabsTrigger>
        </TabsList>

        {/* ─── Decisions ─── */}
        <TabsContent value="decisions" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            ทำไมถึงเลือก X แทน Y — บันทึกไว้เพื่อไม่ให้ตัดสินใจซ้ำ
          </p>
          {decisions.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs ml-auto">{d.version}</Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-700">เลือก: {d.chosen}</span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">เหตุผล</p>
                  <ul className="space-y-1">
                    {d.reason.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                {d.tradeoff && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800"><span className="font-medium">Trade-off:</span> {d.tradeoff}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── Lessons Learned ─── */}
        <TabsContent value="lessons" className="space-y-4 pt-4">
          {/* Tag filter */}
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-colors',
                  activeTag === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {t === 'all' ? 'ทั้งหมด' : tagConfig[t]?.label ?? t}
                {t === 'all' && <span className="ml-1 opacity-60">({lessons.length})</span>}
              </button>
            ))}
          </div>

          {filtered.map((l) => {
            const tag = tagConfig[l.tag];
            return (
              <Card key={l.id}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{l.emoji}</span>
                    <CardTitle className="text-base">{l.title}</CardTitle>
                    <Badge className={cn('ml-auto text-xs border', tag.cls)}>{tag.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">อาการ</p>
                    <p className="text-sm text-foreground/80">{l.symptom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">วิธีแก้</p>
                    <p className="text-sm text-foreground/80">{l.fix}</p>
                  </div>
                  {l.code && (
                    <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto font-mono leading-relaxed">
                      {l.code}
                    </pre>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
