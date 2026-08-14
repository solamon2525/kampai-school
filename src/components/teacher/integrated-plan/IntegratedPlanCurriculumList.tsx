import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRICULUM_SUBJECTS, subjectLabel } from '@/lib/curriculumSubjects';
import { cn } from '@/lib/utils';
import type { IntegratedPlanTopic, PlanIndicator, TopicStatus } from '@/services/integrated-plan.service';

type TopicActions = {
  topics: IntegratedPlanTopic[];
  onStatusChange: (topic: IntegratedPlanTopic) => void;
  onEdit: (topic: IntegratedPlanTopic) => void;
  onDelete: (topic: IntegratedPlanTopic) => void;
};

const indicatorOf = (topic: IntegratedPlanTopic): PlanIndicator | null =>
  topic.integrated_plan_topic_indicators.find((row) => row.curriculum_indicators)?.curriculum_indicators ?? null;

const statusLabel: Record<TopicStatus, string> = {
  not_started: 'ยังไม่สอน',
  in_progress: 'กำลังสอน',
  taught: 'สอนแล้ว',
};

const TopicRow = ({ topic, onStatusChange, onEdit, onDelete }: Omit<TopicActions, 'topics'> & { topic: IntegratedPlanTopic }) => {
  const indicator = indicatorOf(topic);
  const taught = topic.status === 'taught';
  const inProgress = topic.status === 'in_progress';
  const description = indicator?.description ?? topic.essential_concept;

  return (
    <div className={cn(
      'flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors sm:p-4',
      taught && 'border-primary bg-primary/10',
      inProgress && 'border-primary/40 bg-primary/5',
    )}>
      <button
        type="button"
        aria-label={`เปลี่ยนสถานะ ${description}`}
        onClick={() => onStatusChange(topic)}
        className={cn(
          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background hover:bg-muted',
          taught && 'border-primary bg-primary text-primary-foreground',
          inProgress && 'border-primary text-primary',
        )}
      >
        {taught ? <CheckCircle2 className="h-6 w-6" /> : inProgress ? <BookOpen className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {indicator && <Badge className={cn(taught ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{indicator.indicator_code}</Badge>}
          <Badge variant="outline" className={cn(taught && 'border-primary bg-primary text-primary-foreground', inProgress && 'border-primary text-primary')}>
            {statusLabel[topic.status]}
          </Badge>
          {topic.is_custom && <Badge variant="secondary">เพิ่มเอง</Badge>}
        </div>
        <p className={cn('mt-2 text-sm leading-relaxed', taught ? 'font-semibold text-foreground' : 'text-foreground')}>{description}</p>
        {topic.note && <p className="mt-2 text-xs text-muted-foreground">บันทึก: {topic.note}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="icon" variant="ghost" aria-label="แก้ไขหัวข้อ" onClick={() => onEdit(topic)}><Pencil className="h-4 w-4" /></Button>
        {topic.is_custom && <Button size="icon" variant="ghost" aria-label="ลบหัวข้อ" onClick={() => onDelete(topic)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
      </div>
    </div>
  );
};

export const TaughtTopicsSummary = ({ topics }: { topics: IntegratedPlanTopic[] }) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const taughtBySubject = useMemo(() => new Map(CURRICULUM_SUBJECTS.map((subject) => [
    subject.key,
    topics.filter((topic) => topic.subject_key === subject.key && topic.status === 'taught'),
  ])), [topics]);
  const expanded = expandedSubject ? taughtBySubject.get(expandedSubject) ?? [] : [];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-primary" />สรุปเนื้อหาที่สอนแล้ว</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {CURRICULUM_SUBJECTS.map((subject) => {
            const rows = taughtBySubject.get(subject.key) ?? [];
            const active = expandedSubject === subject.key;
            return (
              <button key={subject.key} type="button" onClick={() => setExpandedSubject(active ? null : subject.key)} className={cn('rounded-lg border border-border bg-card p-3 text-left hover:border-primary', active && 'border-primary ring-2 ring-primary/20')}>
                <p className="line-clamp-2 text-xs font-semibold">{subject.label}</p>
                <p className="mt-2 text-lg font-bold text-primary">{rows.length}</p>
              </button>
            );
          })}
        </div>
        {expandedSubject && (
          <div className="rounded-lg border border-primary/30 bg-card p-3">
            <p className="mb-2 text-sm font-semibold text-primary">{subjectLabel(expandedSubject)} · สอนแล้ว {expanded.length} รายการ</p>
            {expanded.length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มีเนื้อหาที่สอนแล้วในวิชานี้</p> : <div className="flex flex-wrap gap-2">{expanded.map((topic) => { const indicator = indicatorOf(topic); return <Badge key={topic.id} className="max-w-full bg-primary text-primary-foreground" title={indicator?.description ?? topic.title}>{indicator?.indicator_code ?? topic.title}</Badge>; })}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const IntegratedPlanCurriculumList = ({ topics, onStatusChange, onEdit, onDelete }: TopicActions) => {
  const subjectGroups = useMemo(() => CURRICULUM_SUBJECTS.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject_key === subject.key);
    const curriculum = subjectTopics.filter((topic) => !topic.is_custom);
    const custom = subjectTopics.filter((topic) => topic.is_custom);
    const strands = new Map<string, Map<string, IntegratedPlanTopic[]>>();
    curriculum.forEach((topic) => {
      const indicator = indicatorOf(topic);
      const strand = indicator?.strand_title || 'สาระการเรียนรู้';
      const standard = indicator?.standard_code || 'มาตรฐานอื่น';
      if (!strands.has(strand)) strands.set(strand, new Map());
      const standards = strands.get(strand)!;
      if (!standards.has(standard)) standards.set(standard, []);
      standards.get(standard)!.push(topic);
    });
    return { ...subject, curriculum, custom, strands };
  }).filter((subject) => subject.curriculum.length || subject.custom.length), [topics]);

  if (topics.length === 0) return <Card><CardContent className="py-10 text-center text-muted-foreground">ไม่พบหัวข้อที่ตรงกับตัวกรอง</CardContent></Card>;

  return <div className="space-y-5">{subjectGroups.map((subject) => (
    <section key={subject.key} className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{subject.label}</h2><Badge variant="outline">{subject.curriculum.length + subject.custom.length} รายการ</Badge></div>
      <Accordion type="multiple" defaultValue={[...subject.strands.keys()].map((strand) => `${subject.key}-${strand}`)} className="space-y-2">
        {[...subject.strands.entries()].map(([strand, standards]) => (
          <AccordionItem key={strand} value={`${subject.key}-${strand}`} className="rounded-lg border border-border bg-card px-3">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">{strand}</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <Accordion type="multiple" defaultValue={[...standards.keys()].map((standard) => `${subject.key}-${strand}-${standard}`)} className="space-y-2">
                {[...standards.entries()].map(([standard, rows]) => (
                  <AccordionItem key={standard} value={`${subject.key}-${strand}-${standard}`} className="rounded-lg border border-border px-3">
                    <AccordionTrigger className="text-left text-sm font-semibold text-primary hover:no-underline">{standard} · {rows.length} ตัวชี้วัด</AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-3">{rows.sort((a, b) => a.sort_order - b.sort_order).map((topic) => <TopicRow key={topic.id} topic={topic} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {subject.custom.length > 0 && <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3"><h3 className="text-sm font-semibold">หัวข้อส่วนตัว</h3>{subject.custom.map((topic) => <TopicRow key={topic.id} topic={topic} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />)}</div>}
    </section>
  ))}</div>;
};
