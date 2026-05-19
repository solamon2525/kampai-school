/**
 * SortableCategoriesGrid.tsx
 *
 * Drag-and-drop card grid for educational-hub categories (admin tab).
 * Mirrors SortableItemsTable but uses a responsive grid + card cells so the
 * existing CategoriesTab UI shape stays familiar.
 *
 * On drag end → bulkUpdateSortOrderCategories writes sort_order = (i+1) * 10
 * for affected rows. Invalidates ['edu-hub', 'categories'] so the public
 * teacher page picks up the new order.
 */

import { useState } from 'react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    educationalHubService,
    type EduHubCategory,
} from '@/services/educational-hub.service';

interface Props {
    categories: EduHubCategory[];
    onEdit: (cat: EduHubCategory) => void;
    onDelete: (cat: EduHubCategory) => void;
}

export const SortableCategoriesGrid = ({ categories, onEdit, onDelete }: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [ordered, setOrdered] = useState(categories);
    const [saving, setSaving] = useState(false);

    // Re-sync when parent list changes (add/delete from outside)
    if (
        categories.length !== ordered.length ||
        categories.some((c, i) => c.id !== ordered[i]?.id || c.updated_at !== ordered[i]?.updated_at)
    ) {
        setOrdered(categories);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIdx = ordered.findIndex((c) => c.id === active.id);
        const newIdx = ordered.findIndex((c) => c.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;

        const next = arrayMove(ordered, oldIdx, newIdx);
        setOrdered(next);

        const updates = next.map((c, i) => ({ id: c.id, sort_order: (i + 1) * 10 }));
        setSaving(true);
        const { error } = await educationalHubService.bulkUpdateSortOrderCategories(updates);
        setSaving(false);
        if (error) {
            setOrdered(categories);
            toast({ title: 'จัดลำดับล้มเหลว', description: error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories'] });
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories', 'admin'] });
        toast({ title: 'บันทึกลำดับใหม่' });
    };

    return (
        <div className="relative">
            {saving && (
                <div className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    บันทึกลำดับ...
                </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ordered.map((c) => c.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ordered.map((c) => (
                            <SortableCategoryCard key={c.id} category={c} onEdit={onEdit} onDelete={onDelete} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

// ─── Single sortable card ───────────────────────────────────────────────────

const SortableCategoryCard = ({
    category,
    onEdit,
    onDelete,
}: {
    category: EduHubCategory;
    onEdit: (cat: EduHubCategory) => void;
    onDelete: (cat: EduHubCategory) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                'transition-shadow',
                isDragging && 'shadow-lg ring-2 ring-primary',
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-2">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0 mt-0.5"
                        aria-label="ลากเพื่อจัดลำดับ"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] font-mono">{category.category_key}</Badge>
                            {!category.is_active && (
                                <Badge variant="secondary" className="text-[10px]">ปิด</Badge>
                            )}
                        </div>
                        <p className="font-semibold text-sm">{category.name}</p>
                        {category.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{category.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2">
                            icon: {category.icon_name} · ลำดับ {category.sort_order}
                        </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(category)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
