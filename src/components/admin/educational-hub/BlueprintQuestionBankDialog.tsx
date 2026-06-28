import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { BlueprintQuestionBankEntry } from '@/lib/blueprint-question-banks';

type Props = {
    open: boolean;
    onClose: () => void;
    bank: BlueprintQuestionBankEntry[];
    platformLabel?: string | null;
    onSelect: (entry: BlueprintQuestionBankEntry) => void;
};

export function BlueprintQuestionBankDialog({
    open,
    onClose,
    bank,
    platformLabel,
    onSelect,
}: Props) {
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return bank;
        return bank.filter(
            (e) =>
                e.prompt.toLowerCase().includes(needle)
                || e.word?.toLowerCase().includes(needle)
                || e.answer.includes(needle)
                || e.tags?.some((t) => t.includes(needle)),
        );
    }, [bank, q]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>คลังโจทย์</DialogTitle>
                    <DialogDescription>
                        {platformLabel
                            ? `เลือกโจทย์ใส่ platform "${platformLabel}"`
                            : 'เลือก platform บน canvas ก่อน แล้วเปิดคลังอีกครั้ง'}
                    </DialogDescription>
                </DialogHeader>
                <Input
                    placeholder="ค้นหาโจทย์…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <ScrollArea className="h-[min(50vh,360px)] rounded-md border border-border">
                    <div className="p-2 space-y-1">
                        {filtered.length === 0 && (
                            <p className="text-sm text-muted-foreground p-3 text-center">ไม่พบโจทย์</p>
                        )}
                        {filtered.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                disabled={!platformLabel}
                                className={cn(
                                    'w-full text-left rounded-md border border-border px-3 py-2 text-sm',
                                    'hover:bg-muted/60 transition-colors disabled:opacity-50',
                                )}
                                onClick={() => {
                                    onSelect(entry);
                                    onClose();
                                }}
                            >
                                <div className="font-medium">{entry.prompt}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {entry.word ? `${entry.word} · ` : ''}
                                    ตอบ: {entry.answer} · [{entry.options.join(' · ')}]
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">{filtered.length} / {bank.length} ข้อ</p>
            </DialogContent>
        </Dialog>
    );
}
