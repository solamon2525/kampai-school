import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EqLessonWithWords, EqWord } from '@/services/english-quest.service';
import { speakEn } from './LessonFlashcards';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Q = { word: EqWord; options: string[]; answer: string };

function buildQuestions(words: EqWord[]): Q[] {
  const meanings = words.map((w) => w.meaning_th);
  return shuffle(words).map((word) => {
    const distractors = shuffle(meanings.filter((m) => m !== word.meaning_th)).slice(0, 3);
    return { word, options: shuffle([word.meaning_th, ...distractors]), answer: word.meaning_th };
  });
}

type Props = {
  lesson: EqLessonWithWords;
  onComplete: (correct: number, total: number) => void;
  onAnswer?: (correct: boolean) => void;   // ให้ parent ทำมาสคอตรีแอ็กชัน
  onBack: () => void;
};

/** แบบทดสอบ: เห็นคำอังกฤษ → เลือกคำแปลไทยที่ถูก (4 ตัวเลือก) + เฉลยทันที */
export function LessonQuiz({ lesson, onComplete, onAnswer, onBack }: Props) {
  const questions = useMemo(() => buildQuestions(lesson.words), [lesson.id]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const correctRef = useRef(0);
  const q = questions[qi];
  const last = qi === questions.length - 1;
  const revealed = picked !== null;

  useEffect(() => { if (q) speakEn(q.word.word_en); }, [q]);

  if (!q) return null;

  const pick = (opt: string) => {
    if (revealed) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) correctRef.current += 1;
    onAnswer?.(ok);
  };
  const next = () => {
    if (last) onComplete(correctRef.current, questions.length);
    else { setQi(qi + 1); setPicked(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> ออก
        </Button>
        <div className="text-sm text-muted-foreground">แบบทดสอบ</div>
        <div className="text-sm font-semibold text-foreground">{qi + 1}/{questions.length}</div>
      </div>

      {/* คำถาม */}
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-6xl leading-none">{q.word.emoji}</div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <h2 className="text-3xl font-extrabold text-foreground">{q.word.word_en}</h2>
          <Button variant="ghost" size="icon" aria-label="ฟังเสียง" onClick={() => speakEn(q.word.word_en)}>
            <Volume2 className="h-5 w-5 text-primary" />
          </Button>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">แปลว่าอะไร?</div>
      </div>

      {/* ตัวเลือก */}
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          return (
            <button
              key={opt}
              type="button"
              disabled={revealed}
              onClick={() => pick(opt)}
              className={cn(
                'flex items-center justify-between rounded-xl border p-3.5 text-left text-lg font-medium transition',
                !revealed && 'border-border bg-card hover:bg-muted/40 active:scale-[0.99]',
                revealed && isAnswer && 'border-emerald-300 bg-emerald-50 text-emerald-800',
                revealed && isPicked && !isAnswer && 'border-rose-300 bg-rose-50 text-rose-800',
                revealed && !isAnswer && !isPicked && 'border-border bg-card opacity-60',
              )}
            >
              <span>{opt}</span>
              {revealed && isAnswer && <Check className="h-5 w-5 text-emerald-600" />}
              {revealed && isPicked && !isAnswer && <X className="h-5 w-5 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {revealed && (
        <Button className="w-full" onClick={next}>
          {last ? 'ดูผล' : 'ข้อถัดไป'}
        </Button>
      )}
    </div>
  );
}
