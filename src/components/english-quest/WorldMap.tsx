import { Check, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EqWorldTree, EqLessonWithWords } from '@/services/english-quest.service';
import { eqIsLessonDone } from '@/services/english-quest.service';

type Props = {
  worlds: EqWorldTree[];
  lessonStars: Record<string, number>;
  onPickLesson: (lesson: EqLessonWithWords, world: EqWorldTree) => void;
};

// world.color token → tint (Tailwind semantic, light-mode)
const TINT: Record<string, { card: string; chip: string }> = {
  amber: { card: 'border-amber-200', chip: 'bg-amber-100 text-amber-700' },
  rose:  { card: 'border-rose-200',  chip: 'bg-rose-100 text-rose-700' },
  sky:   { card: 'border-sky-200',   chip: 'bg-sky-100 text-sky-700' },
};

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5" aria-label={`${n} ดาว`}>
    {[1, 2, 3].map((i) => (
      <Star key={i} className={cn('h-3.5 w-3.5', i <= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
    ))}
  </div>
);

/** แผนที่โลก: เลือกโลก → เลือกบท (ปลดล็อกตามลำดับในโลก) */
export function WorldMap({ worlds, lessonStars, onPickLesson }: Props) {
  return (
    <div className="space-y-5">
      {worlds.map((world) => {
        const tint = TINT[world.color ?? ''] ?? { card: 'border-border', chip: 'bg-muted text-muted-foreground' };
        return (
          <section key={world.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{world.icon_emoji}</span>
              <h2 className="text-lg font-bold text-foreground">{world.title_th}</h2>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tint.chip)}>{world.title_en}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {world.lessons.map((lesson, idx) => {
                const done = eqIsLessonDone(lessonStars, lesson.id);
                const prevDone = idx === 0 || eqIsLessonDone(lessonStars, world.lessons[idx - 1].id);
                const locked = !prevDone && !done;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    disabled={locked}
                    onClick={() => onPickLesson(lesson, world)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition',
                      tint.card,
                      locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-muted/40 active:scale-[0.99]',
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      done ? 'bg-emerald-100 text-emerald-700' : tint.chip,
                    )}>
                      {locked ? <Lock className="h-4 w-4" /> : done ? <Check className="h-5 w-5" /> : lesson.lesson_no}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{lesson.title_th}</div>
                      <div className="text-xs text-muted-foreground">{lesson.words.length} คำ</div>
                    </div>
                    {done ? <Stars n={lessonStars[lesson.id] ?? 0} /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
