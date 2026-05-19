/**
 * TagPicker.tsx
 *
 * Multi-select tag picker สำหรับ EduHubItemForm:
 * - แสดง tag suggestions per-วิชา (จาก SUBJECT_TAGS mapping)
 * - คลิก badge เพื่อ toggle เลือก (เลือกได้หลายอัน)
 * - พิมพ์ custom tag กด Enter เพื่อเพิ่ม tag ใหม่ที่ไม่อยู่ใน list
 * - ถ้ายังไม่เลือก subject → fallback เป็น ALL_TAGS (top 20)
 */

import { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SUBJECT_TAGS, ALL_TAGS } from '@/lib/edu-hub-subjects';

interface Props {
    subject: string | null | undefined;
    value: string[];
    onChange: (next: string[]) => void;
    /** จำนวน suggestion สูงสุดเมื่อไม่มี subject (default 20) */
    fallbackLimit?: number;
}

export const TagPicker = ({ subject, value, onChange, fallbackLimit = 20 }: Props) => {
    const [draft, setDraft] = useState('');

    // Suggestions: ถ้ามี subject → ใช้ tags ของวิชานั้น; ถ้าไม่ → ALL_TAGS (limit)
    const suggestions = useMemo<string[]>(() => {
        if (subject && SUBJECT_TAGS[subject]) return SUBJECT_TAGS[subject];
        return ALL_TAGS.slice(0, fallbackLimit);
    }, [subject, fallbackLimit]);

    const selectedSet = useMemo(() => new Set(value), [value]);

    const toggleTag = (tag: string) => {
        if (selectedSet.has(tag)) {
            onChange(value.filter((v) => v !== tag));
        } else {
            onChange([...value, tag]);
        }
    };

    const removeTag = (tag: string) => onChange(value.filter((v) => v !== tag));

    const addCustom = () => {
        const t = draft.trim();
        if (!t) return;
        if (selectedSet.has(t)) {
            setDraft('');
            return;
        }
        onChange([...value, t]);
        setDraft('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustom();
        }
    };

    return (
        <div className="space-y-2">
            {/* Selected tags */}
            <div
                className={cn(
                    'min-h-9 flex flex-wrap gap-1 rounded-md border border-border bg-card px-2 py-1.5',
                    value.length === 0 && 'items-center text-xs text-muted-foreground',
                )}
            >
                {value.length === 0 ? (
                    <span>ยังไม่มีแท็ก — คลิกด้านล่างเพื่อเลือก หรือพิมพ์เพิ่ม</span>
                ) : (
                    value.map((tag) => (
                        <Badge
                            key={tag}
                            variant="default"
                            className="text-[11px] gap-1 pr-1"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-0.5 rounded-sm hover:bg-primary-foreground/20"
                                aria-label={`ลบแท็ก ${tag}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))
                )}
            </div>

            {/* Suggestions — click to toggle */}
            {suggestions.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">
                        {subject ? `แท็กแนะนำสำหรับ "${subject}"` : 'แท็กแนะนำ (เลือกวิชาเพื่อกรอง)'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {suggestions.map((tag) => {
                            const isSelected = selectedSet.has(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        'px-2 py-0.5 text-[11px] rounded-full border transition-colors',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-border hover:bg-accent',
                                    )}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom tag input */}
            <div className="flex gap-1.5 items-center">
                <Input
                    placeholder="พิมพ์แท็กใหม่ แล้วกด Enter"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-xs"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustom}
                    disabled={!draft.trim()}
                    className="h-8 px-2 shrink-0"
                >
                    <Plus className="h-3 w-3 mr-0.5" /> เพิ่ม
                </Button>
            </div>
        </div>
    );
};
