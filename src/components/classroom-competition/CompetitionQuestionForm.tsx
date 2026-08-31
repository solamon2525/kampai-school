import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CompetitionQuestion } from '@/services/classroom-competition.service';

type MathNode = { type: 'number'; index: number; value: number } | {
  type: 'operation'; op: string; left: MathNode; right: MathNode;
};
type WorkingNode = { id: string; label: string; ast: MathNode };

interface Props {
  question: CompetitionQuestion;
  disabled?: boolean;
  onSubmit: (response: Record<string, unknown>) => void;
}

function FractionInputs({ kind, onSubmit, disabled }: { kind: string; onSubmit: Props['onSubmit']; disabled?: boolean }) {
  const [whole, setWhole] = useState('');
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ whole: whole || 0, numerator, denominator });
    }}>
      <div className="flex items-center justify-center gap-3">
        {kind === 'improper_to_mixed' && (
          <Input aria-label="จำนวนเต็ม" inputMode="numeric" value={whole} onChange={(event) => setWhole(event.target.value)} className="h-16 w-24 text-center text-3xl font-bold" placeholder="เต็ม" required />
        )}
        <div className="grid w-28 gap-2">
          <Input aria-label="ตัวเศษ" inputMode="numeric" value={numerator} onChange={(event) => setNumerator(event.target.value)} className="h-14 text-center text-2xl font-bold" required />
          <div className="h-1 rounded bg-foreground" />
          <Input aria-label="ตัวส่วน" inputMode="numeric" value={denominator} onChange={(event) => setDenominator(event.target.value)} className="h-14 text-center text-2xl font-bold" required />
        </div>
      </div>
      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={disabled}>ส่งคำตอบ</Button>
    </form>
  );
}

function Math24Builder({ numbers, onSubmit, disabled }: { numbers: number[]; onSubmit: Props['onSubmit']; disabled?: boolean }) {
  const initial = () => numbers.map((value, index) => ({ id: `${index}`, label: String(value), ast: { type: 'number', index, value } as MathNode }));
  const numbersKey = numbers.join(',');
  const [nodes, setNodes] = useState<WorkingNode[]>(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [operator, setOperator] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initial());
    setSelected([]);
    setOperator(null);
  // Reset only when the four source cards change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numbersKey]);

  const combine = () => {
    if (selected.length !== 2 || !operator) return;
    const left = nodes.find((node) => node.id === selected[0]);
    const right = nodes.find((node) => node.id === selected[1]);
    if (!left || !right) return;
    const next: WorkingNode = {
      id: crypto.randomUUID(),
      label: `(${left.label} ${operator.replace('*', '×').replace('/', '÷')} ${right.label})`,
      ast: { type: 'operation', op: operator, left: left.ast, right: right.ast },
    };
    setNodes([...nodes.filter((node) => !selected.includes(node.id)), next]);
    setSelected([]);
    setOperator(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {nodes.map((node) => (
          <button key={node.id} type="button" onClick={() => setSelected((current) => current.includes(node.id) ? current.filter((id) => id !== node.id) : current.length < 2 ? [...current, node.id] : [current[1], node.id])}
            className={cn('min-h-20 rounded-2xl border-2 bg-card p-3 text-xl font-bold shadow-sm transition', selected.includes(node.id) ? 'border-primary ring-4 ring-primary/15' : 'border-border')}>
            {node.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[['+', '+'], ['-', '−'], ['*', '×'], ['/', '÷']].map(([value, label]) => (
          <Button key={value} type="button" variant={operator === value ? 'default' : 'outline'} className="h-14 text-2xl" onClick={() => setOperator(value)}>{label}</Button>
        ))}
      </div>
      <Button type="button" variant="secondary" className="h-12 w-full" disabled={selected.length !== 2 || !operator} onClick={combine}>รวมการคำนวณที่เลือก</Button>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => { setNodes(initial()); setSelected([]); setOperator(null); }}>เริ่มจัดใหม่</Button>
        <Button type="button" disabled={disabled || nodes.length !== 1} onClick={() => onSubmit({ ast: nodes[0]?.ast })}>ส่งคำตอบ</Button>
      </div>
    </div>
  );
}

export function CompetitionQuestionForm({ question, disabled, onSubmit }: Props) {
  const prompt = question.prompt;
  if (prompt.kind === 'math24') return <Math24Builder numbers={prompt.numbers as number[]} onSubmit={onSubmit} disabled={disabled} />;
  return <FractionInputs kind={String(prompt.kind)} onSubmit={onSubmit} disabled={disabled} />;
}

export function CompetitionPrompt({ question }: { question: CompetitionQuestion }) {
  const prompt = question.prompt;
  if (prompt.kind === 'math24') return <p className="text-2xl font-bold">ใช้ตัวเลขทุกใบให้ได้ 24</p>;
  if (prompt.kind === 'improper_to_mixed') return <p className="text-4xl font-bold">{String(prompt.numerator)} / {String(prompt.denominator)} = ?</p>;
  if (prompt.kind === 'mixed_to_improper') return <p className="text-4xl font-bold">{String(prompt.whole)} {String(prompt.numerator)} / {String(prompt.denominator)} = ?</p>;
  return <p className="text-4xl font-bold">{String(prompt.left)} / {String(prompt.denominator)} {prompt.operator === '+' ? '+' : '−'} {String(prompt.right)} / {String(prompt.denominator)} = ?</p>;
}
