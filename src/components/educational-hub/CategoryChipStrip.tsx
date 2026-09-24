import { useEffect, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import { ArrowDown, ArrowUp, GripVertical, ListOrdered } from 'lucide-react';
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
    const [orderOpen, setOrderOpen] = useState(false);
    const [draftCategories, setDraftCategories] = useState<EduHubCategory[]>([]);
    const [saving, setSaving] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        if (orderOpen) setDraftCategories(categories);
    }, [categories, orderOpen]);

    if (categories.length === 0) return null;
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
                <div className="mx-auto flex max-w-7xl items-center gap-2">
                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="เลือกหมวดคลังสื่อ">
                        {categories.map((category) => {
                            const Icon = categoryIcon(category);
                            const active = category.category_key === activeKey;
                            return (
                                <button key={category.id} type="button" role="tab" aria-selected={active}
                                    onClick={() => onSelect?.(category.category_key)}
                                    className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-accent')}>
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{category.name}</span>
                                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground')}>{counts[category.id] ?? 0}</span>
                                </button>
                            );
                        })}
                    </div>
                    {editable && (
                        <Button type="button" variant="outline" onClick={() => setOrderOpen(true)}>
                            <ListOrdered className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">จัดลำดับหมวด</span><span className="sm:hidden">จัดลำดับ</span>
                        </Button>
                    )}
                </div>
            </div>

            <Dialog open={orderOpen} onOpenChange={(open) => !saving && setOrderOpen(open)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>จัดลำดับหมวด</DialogTitle><DialogDescription>ลากขึ้นลงหรือใช้ปุ่มลูกศร แล้วกดบันทึกเมื่อเรียบร้อย</DialogDescription></DialogHeader>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={draftCategories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {draftCategories.map((category, index) => (
                                        <SortableCategoryRow key={category.id} category={category} index={index}
                                            displayIndex={index} total={draftCategories.length}
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
