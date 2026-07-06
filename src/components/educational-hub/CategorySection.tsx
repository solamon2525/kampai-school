import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Inbox, GripVertical, Loader2 } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useGameCardIndicators } from '@/hooks/useGameCardIndicators';
import { EduHubItemCard } from './EduHubItemCard';
import {
    educationalHubService,
    type EduHubCategory,
    type EduHubItem,
} from '@/services/educational-hub.service';
import type { ViewMode } from '@/hooks/useViewMode';

interface Props {
    /** Pass null when rendering items outside a category (e.g. Favorites section) */
    category: EduHubCategory | null;
    items: EduHubItem[];
    viewMode?: ViewMode;
    isFavorite?: (id: string) => boolean;
    onToggleFavorite?: (id: string) => void;
    /** Skip rendering the section header (parent supplies its own) */
    hideHeader?: boolean;
    /**
     * Admin-only edit mode: render drag handle on header (handled by parent
     * DndContext) and enable item drag-drop inside the section.
     */
    editable?: boolean;
}

const COLOR_TO_TEXT: Record<string, string> = {
    primary: 'text-primary',
    accent: 'text-accent-foreground',
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    muted: 'text-muted-foreground',
};

const COLOR_TO_BG: Record<string, string> = {
    primary: 'bg-primary/10',
    accent: 'bg-accent/20',
    info: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-amber-100',
    muted: 'bg-muted',
};

const GRID_CLASS: Record<ViewMode, string> = {
    compact: 'grid grid-cols-1 gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    spotlight: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
};

export const CategorySection = ({
    category,
    items,
    viewMode = 'grid',
    isFavorite,
    onToggleFavorite,
    hideHeader = false,
    editable = false,
}: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const itemIds = useMemo(() => items.map((it) => it.id), [items]);
    const { data: indicatorMap } = useGameCardIndicators(itemIds);
    const [orderedItems, setOrderedItems] = useState(items);
    const [savingOrder, setSavingOrder] = useState(false);

    // Re-sync when parent items change (add/delete/external edit)
    if (
        items.length !== orderedItems.length ||
        items.some((it, i) => it.id !== orderedItems[i]?.id || it.updated_at !== orderedItems[i]?.updated_at)
    ) {
        setOrderedItems(items);
    }

    // Sortable for the SECTION itself (controlled by parent DndContext in
    // EducationalHubTeacher when admin). Hook must always run — `disabled`
    // flag noops it for non-admin or favorites section (category null).
    const sectionSortable = useSortable({
        id: category?.id ?? '__noop__',
        disabled: !editable || !category,
    });

    const sectionStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(sectionSortable.transform),
        transition: sectionSortable.transition,
    };

    const Icon = category
        ? ((Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon_name]
            ?? Icons.Folder)
        : Icons.Folder;

    const textColor = category ? (COLOR_TO_TEXT[category.color_class] ?? 'text-primary') : 'text-primary';
    const bgColor = category ? (COLOR_TO_BG[category.color_class] ?? 'bg-primary/10') : 'bg-primary/10';

    // Items DnD (only when editable)
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleItemDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIdx = orderedItems.findIndex((it) => it.id === active.id);
        const newIdx = orderedItems.findIndex((it) => it.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;

        const next = arrayMove(orderedItems, oldIdx, newIdx);
        setOrderedItems(next);

        const updates = next.map((it, i) => ({ id: it.id, sort_order: (i + 1) * 10 }));
        setSavingOrder(true);
        const { error } = await educationalHubService.bulkUpdateSortOrder(updates);
        setSavingOrder(false);
        if (error) {
            setOrderedItems(items);
            toast({ title: 'จัดลำดับล้มเหลว', description: error.message, variant: 'destructive' });
            return;
        }
        // Invalidate any cache that might show these items
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items'] });
        toast({ title: 'บันทึกลำดับใหม่' });
    };

    const sectionClasses = cn(
        'scroll-mt-24 space-y-4',
        sectionSortable.isDragging && 'opacity-50',
    );

    const itemsGrid = (
        <div className={cn(GRID_CLASS[viewMode], 'relative')}>
            {savingOrder && (
                <div className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    บันทึกลำดับ...
                </div>
            )}
            {orderedItems.map((item) => (
                <EduHubItemCard
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    isFavorite={isFavorite?.(item.id) ?? false}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                    editable={editable && !!category}
                    linkedIndicators={indicatorMap?.get(item.id)}
                />
            ))}
        </div>
    );

    return (
        <section
            ref={sectionSortable.setNodeRef}
            style={sectionStyle}
            id={category ? `cat-${category.category_key}` : undefined}
            className={sectionClasses}
        >
            {!hideHeader && category && (
                <header className="flex items-center gap-3">
                    {editable && (
                        <button
                            type="button"
                            {...sectionSortable.attributes}
                            {...sectionSortable.listeners}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1"
                            title="ลากเพื่อจัดลำดับหมวด"
                            aria-label="ลากเพื่อจัดลำดับหมวด"
                        >
                            <GripVertical className="h-5 w-5" />
                        </button>
                    )}
                    <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">{category.name}</h2>
                        {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                        {orderedItems.length} รายการ
                    </span>
                </header>
            )}

            {orderedItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 px-4 flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 opacity-40" />
                    <p className="text-sm">ยังไม่มีในหมวดนี้</p>
                </div>
            ) : editable && category ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                    <SortableContext items={orderedItems.map((it) => it.id)} strategy={rectSortingStrategy}>
                        {itemsGrid}
                    </SortableContext>
                </DndContext>
            ) : (
                itemsGrid
            )}
        </section>
    );
};
