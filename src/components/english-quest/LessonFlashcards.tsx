import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EqLessonWithWords } from '@/services/english-quest.service';

type Props = {
  lesson: EqLessonWithWords;
  onDone: () => void;   // เรียนครบ → ไปแบบทดสอบ
  onBack: () => void;
};

/** อ่านออกเสียงคำ (Web Speech API — ไม่มี dependency) */
export function speakEn(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch { /* ไม่รองรับ → เงียบ */ }
}

/** เรียนศัพท์ทีละการ์ด: อิโมจิ + คำ + คำแปล + ตัวอย่าง + ปุ่มฟังเสียง */
export function LessonFlashcards({ lesson, onDone, onBack }: Props) {
  const words = lesson.words;
  const [i, setI] = useState(0);
  const word = words[i];
  const last = i === words.length - 1;

  // ออกเสียงคำอัตโนมัติเมื่อเปลี่ยนการ์ด (แอปภาษา — ได้ยินคำคือหัวใจ)
  useEffect(() => {
    if (word) speakEn(word.word_en);
    return () => { try { window.speechSynthesis?.cancel(); } catch { /* */ } };
  }, [word]);

  if (!word) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> กลับ
        </Button>
        <div className="text-sm text-muted-foreground">{lesson.title_th}</div>
        <div className="text-sm font-semibold text-foreground">{i + 1}/{words.length}</div>
      </div>

      {/* การ์ดคำ */}
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="text-7xl leading-none">{word.emoji}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <h2 className="text-4xl font-extrabold text-foreground">{word.word_en}</h2>
          <Button variant="ghost" size="icon" aria-label="ฟังเสียง" onClick={() => speakEn(word.word_en)}>
            <Volume2 className="h-6 w-6 text-primary" />
          </Button>
        </div>
        {word.part_of_speech && (
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {word.part_of_speech}
          </span>
        )}
        <div className="mt-3 text-2xl font-semibold text-foreground">{word.meaning_th}</div>
        {word.example_en && (
          <button
            type="button"
            onClick={() => speakEn(word.example_en!)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          >
            <Volume2 className="h-4 w-4" /> {word.example_en}
          </button>
        )}
      </div>

      {/* จุดบอกความคืบหน้า */}
      <div className="flex justify-center gap-1.5">
        {words.map((w, idx) => (
          <span key={w.id} className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-5 bg-primary' : 'w-1.5 bg-muted')} />
        ))}
      </div>

      {/* ปุ่มเลื่อน */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-1" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>
          <ArrowLeft className="h-4 w-4" /> ก่อนหน้า
        </Button>
        {last ? (
          <Button className="flex-1 gap-1" onClick={onDone}>
            ทำแบบทดสอบ <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex-1 gap-1" onClick={() => setI((v) => Math.min(words.length - 1, v + 1))}>
            ถัดไป <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
