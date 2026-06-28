import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import {
    type PlatformerBlueprintV1,
    type PlatformerQuestion,
    upsertQuestionForPlatform,
} from '@/lib/game-blueprint';

type Props = {
    platformId: string;
    platformLabel: string;
    question?: PlatformerQuestion;
    onChange: (bp: PlatformerBlueprintV1) => void;
    blueprint: PlatformerBlueprintV1;
};

export function BlueprintQuestionPanel({
    platformId,
    platformLabel,
    question,
    onChange,
    blueprint,
}: Props) {
    const setField = (patch: Partial<Omit<PlatformerQuestion, 'id' | 'platformId'>>) => {
        onChange(upsertQuestionForPlatform(blueprint, platformId, patch));
    };

    const setOption = (idx: number, value: string) => {
        const opts = [...(question?.options ?? ['', '', ''])];
        opts[idx] = value;
        setField({ options: opts });
    };

    if (!question) {
        return (
            <div className="rounded-md border border-border p-3 space-y-2">
                <p className="text-sm font-medium">Platform: {platformLabel}</p>
                <p className="text-xs text-muted-foreground">ยังไม่มีคำถามบน platform นี้</p>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        onChange(
                            upsertQuestionForPlatform(blueprint, platformId, {
                                prompt: 'ป _',
                                options: ['ู', 'า', 'ิ'],
                                answer: 'ู',
                            }),
                        )
                    }
                >
                    + เพิ่มคำถาม
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">❓ คำถาม — {platformLabel}</p>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onChange(upsertQuestionForPlatform(blueprint, platformId, null))}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">โจทย์ (แสดงบนจอ)</Label>
                <Input
                    value={question.prompt}
                    onChange={(e) => setField({ prompt: e.target.value })}
                    placeholder="เช่น ป _"
                />
            </div>
            <div className="grid grid-cols-3 gap-2">
                {question.options.map((opt, i) => (
                    <div key={i} className="space-y-1">
                        <Label className="text-xs">ตัวเลือก {i + 1}</Label>
                        <Input value={opt} onChange={(e) => setOption(i, e.target.value)} />
                    </div>
                ))}
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">คำตอบที่ถูก</Label>
                <Input
                    value={question.answer}
                    onChange={(e) => setField({ answer: e.target.value })}
                    list={`bp-answers-${platformId}`}
                />
                <datalist id={`bp-answers-${platformId}`}>
                    {question.options.map((o) => (
                        <option key={o} value={o} />
                    ))}
                </datalist>
            </div>
        </div>
    );
}
