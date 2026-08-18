import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import { ArrowDown, ArrowUp, Check, ChevronDown, GripVertical, ListOrdered, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { EduHubCategory } from '@/services/educational-hub.service';

interface Props {
    categories: EduHubCategory[];
    counts: Record<string, number>;
    activeKey?: string | null;
    onSelect?: (key: string) => void;
    editable?: boolean;
    onSaveOrder?: (categories: EduHubCategory[]) => Promise<boolean>;
}

const categoryIcon = (category: EduHubCategory) =>
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon_name]
    ?? Icons.Folder;

const SortableCategoryRow = ({ category, index, displayIndex, total, onMove }: {
    category: EduHubCategory;
    index: number;
    total: number;
    displayIndex: number;
    onMove: (from: number, to: number) => void;
}) => {
    const sortable = useSortable({ id: category.id });
    const Icon = categoryIcon(category);

    return (
        <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
            className={cn('flex items-center gap-2 rounded-lg border border-border bg-card p-2', sortable.isDragging && 'z-10 opacity-70 shadow-md')}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{displayIndex + 1}</span>
            <button type="button" {...sortable.attributes} {...sortable.listeners}
                className="cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
                aria-label={`ลากเพื่อจัดลำดับหมวด ${category.name}`}>
                <GripVertical className="h-4 w-4" />
            </button>
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{category.name}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0}
                onClick={() => onMove(index, index - 1)} aria-label={`เลื่อนหมวด ${category.name} ขึ้น`}>
                <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === total - 1}
                onClick={() => onMove(index, index + 1)} aria-label={`เลื่อนหมวด ${category.name} ลง`}>
                <ArrowDown className="h-4 w-4" />
            </Button>
        </div>
    );
};

export const CategoryChipStrip = ({ categories, counts, activeKey, onSelect, editable = false, onSaveOrder }: Props) => {
    const [selectOpen, setSelectOpen] = useState(false);
    const [orderOpen, setOrderOpen] = useState(false);
    const [draftCategories, setDraftCategories] = useState<EduHubCategory[]>([]);
    const [saving, setSaving] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const lessonPacks = categories.find((category) => category.category_key === 'lesson-packs') ?? null;
    const sortableCategories = useMemo(() => categories.filter((category) => category.category_key !== 'lesson-packs'), [categories]);
    const activeCategory = categories.find((category) => category.category_key === activeKey) ?? categories[0];

    useEffect(() => {
        if (orderOpen) setDraftCategories(sortableCategories);
    }, [orderOpen, sortableCategories]);

    if (categories.length === 0 || !activeCategory) return null;

    const ActiveIcon = categoryIcon(activeCategory);
    const offset = lessonPacks ? 1 : 0;
    const moveDraft = (from: number, to: number) => {
        if (to < 0 || to >= draftCategories.length) return;
        setDraftCategories((current) => arrayMove(current, from, to));
    };
    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const oldIndex = draftCategories.findIndex((category) => category.id === active.id);
        const newIndex = draftCategories.findIndex((category) => category.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0) moveDraft(oldIndex, newIndex);
    };
    const handleSave = async () => {
        if (!onSaveOrder) return;
        setSaving(true);
        const saved = await onSaveOrder(draftCategories);
        setSaving(false);
        if (saved) setOrderOpen(false);
    };

    return (
        <>
            <div className="sticky top-16 z-30 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-2">
                    <Button type="button" variant="outline" className="min-w-0 max-w-full justify-between gap-2 bg-card sm:max-w-md" onClick={() => setSelectOpen(true)}>
                        <span className="flex min-w-0 items-center gap-2">
                            <ActiveIcon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate font-medium">{activeCategory.name}</span>
                            {(counts[activeCategory.id] ?? 0) > 0 && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{counts[activeCategory.id]}</span>}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                    {editable && (
                        <Button type="button" variant="outline" onClick={() => setOrderOpen(true)}>
                            <ListOrdered className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">จัดลำดับหมวด</span><span className="sm:hidden">จัดลำดับ</span>
                        </Button>
                    )}
                </div>
            </div>

            <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>เลือกหมวด</DialogTitle><DialogDescription>เลือกคลังที่ต้องการเปิดดู</DialogDescription></DialogHeader>
                    <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                        {categories.map((category) => {
                            const Icon = categoryIcon(category);
                            const active = category.category_key === activeKey;
                            return (
                                <button key={category.id} type="button" onClick={() => { onSelect?.(category.category_key); setSelectOpen(false); }}
                                    className={cn('flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-colors', active ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-foreground hover:bg-accent')}>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4 text-primary" /></span>
                                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{category.name}</span><span className="text-xs text-muted-foreground">{counts[category.id] ?? 0} รายการ</span></span>
                                    {active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={orderOpen} onOpenChange={(open) => !saving && setOrderOpen(open)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>จัดลำดับหมวด</DialogTitle><DialogDescription>ลากขึ้นลงหรือใช้ปุ่มลูกศร แล้วกดบันทึกเมื่อเรียบร้อย</DialogDescription></DialogHeader>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {lessonPacks && (
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">1</span>
                                <Lock className="h-4 w-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{lessonPacks.name}</span>
                                <span className="text-xs text-muted-foreground">ล็อกไว้ด้านบน</span>
                            </div>
                        )}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={draftCategories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {draftCategories.map((category, index) => (
                                        <SortableCategoryRow key={category.id} category={category} index={index}
                                            displayIndex={index + offset} total={draftCategories.length}
                                            onMove={moveDraft} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={saving} onClick={() => setOrderOpen(false)}>ยกเลิก</Button>
                        <Button type="button" disabled={saving} onClick={() => void handleSave()}>{saving ? 'กำลังบันทึก...' : 'บันทึกลำดับ'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
