import { useState } from 'react';
import * as Icons from 'lucide-react';
import { GripVertical, Inbox, Loader2, Pin } from 'lucide-react';
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
    splitGamesLibraryItems,
    type EduHubCategory,
    type EduHubItem,
} from '@/services/educational-hub.service';
import type { ViewMode } from '@/hooks/useViewMode';

interface Props {
    category: EduHubCategory;
    items: EduHubItem[];
    viewMode?: ViewMode;
    isFavorite?: (id: string) => boolean;
    onToggleFavorite?: (id: string) => void;
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
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch [&>*]:h-full',
    spotlight: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
};

export const GamesCategorySection = ({
    category,
    items,
    viewMode = 'grid',
    isFavorite,
    onToggleFavorite,
    editable = false,
}: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { pinned, unpinned } = splitGamesLibraryItems(items);
    const itemIds = useMemo(() => items.map((it) => it.id), [items]);
    const { data: indicatorMap } = useGameCardIndicators(itemIds);
    const [orderedPinned, setOrderedPinned] = useState(pinned);
    const [savingOrder, setSavingOrder] = useState(false);
    const [pinningId, setPinningId] = useState<string | null>(null);

    if (
        pinned.length !== orderedPinned.length ||
        pinned.some((it, i) => it.id !== orderedPinned[i]?.id || it.updated_at !== orderedPinned[i]?.updated_at)
    ) {
        setOrderedPinned(pinned);
    }

    const sectionSortable = useSortable({
        id: category.id,
        disabled: !editable,
    });

    const sectionStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(sectionSortable.transform),
        transition: sectionSortable.transition,
    };

    const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon_name]
        ?? Icons.Gamepad2;

    const textColor = COLOR_TO_TEXT[category.color_class] ?? 'text-primary';
    const bgColor = COLOR_TO_BG[category.color_class] ?? 'bg-primary/10';

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const invalidateItems = () =>
        queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items'] });

    const handlePinnedDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIdx = orderedPinned.findIndex((it) => it.id === active.id);
        const newIdx = orderedPinned.findIndex((it) => it.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;

        const next = arrayMove(orderedPinned, oldIdx, newIdx);
        setOrderedPinned(next);

        const updates = next.map((it, i) => ({ id: it.id, library_pin_order: (i + 1) * 10 }));
        setSavingOrder(true);
        const { error } = await educationalHubService.bulkUpdateLibraryPinOrder(updates);
        setSavingOrder(false);
        if (error) {
            setOrderedPinned(pinned);
            toast({ title: 'จัดลำดับล้มเหลว', description: error.message, variant: 'destructive' });
            return;
        }
        await invalidateItems();
        toast({ title: 'บันทึกลำดับเกมปักหมุดแล้ว' });
    };

    const handleToggleLibraryPin = async (item: EduHubItem) => {
        const nextPinned = !item.library_pinned;
        setPinningId(item.id);
        const { error } = await educationalHubService.toggleLibraryPin(
            item.id,
            nextPinned,
            orderedPinned,
        );
        setPinningId(null);
        if (error) {
            toast({ title: 'อัปเดตไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        await invalidateItems();
        toast({
            title: nextPinned ? 'ปักหมุดคลังแล้ว' : 'ปลดหมุดคลังแล้ว',
            description: `"${item.title}" — มีผลทุกเครื่อง`,
        });
    };

    const renderCard = (item: EduHubItem, dragEditable: boolean) => (
        <EduHubItemCard
            key={item.id}
            item={item}
            viewMode={viewMode}
            isFavorite={isFavorite?.(item.id) ?? false}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
            editable={dragEditable}
            libraryPinned={!!item.library_pinned}
            showLibraryPinControl={editable}
            onToggleLibraryPin={editable ? () => handleToggleLibraryPin(item) : undefined}
            libraryPinLoading={pinningId === item.id}
            linkedIndicators={indicatorMap?.get(item.id)}
            reserveLeaderboardSlot={viewMode !== 'compact'}
        />
    );

    const pinnedGrid = (
        <div className={cn(GRID_CLASS[viewMode], 'relative')}>
            {orderedPinned.map((item) => renderCard(item, editable))}
        </div>
    );

    const unpinnedGrid = (
        <div className={GRID_CLASS[viewMode]}>
            {unpinned.map((item) => renderCard(item, false))}
        </div>
    );

    return (
        <section
            ref={sectionSortable.setNodeRef}
            style={sectionStyle}
            id={`cat-${category.category_key}`}
            className={cn('scroll-mt-24 space-y-4', sectionSortable.isDragging && 'opacity-50')}
        >
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
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', bgColor)}>
                    <Icon className={cn('h-5 w-5', textColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">{category.name}</h2>
                    {category.description && (
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                    )}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                    {items.length} รายการ
                </span>
            </header>

            {editable && (
                <p className="text-[11px] text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2 leading-relaxed">
                    <Pin className="inline h-3 w-3 mr-1 text-primary" />
                    กด <strong>📌</strong> บนการ์ดเพื่อปักหมุด — ลากเรียงเฉพาะเกมที่ปักไว้ — มีผล<strong>ทุกเครื่อง</strong>
                    (คนละส่วนกับ ⭐ เกมโปรดที่เก็บบนเครื่องนี้)
                </p>
            )}

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 px-4 flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 opacity-40" />
                    <p className="text-sm">ยังไม่มีในหมวดนี้</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {(orderedPinned.length > 0 || editable) && (
                        <div className="space-y-3">
                            {editable && (
                                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Pin className="h-3.5 w-3.5 text-primary" />
                                    เกมปักหมุด
                                    {orderedPinned.length > 0 && (
                                        <span className="font-normal text-muted-foreground">
                                            ({orderedPinned.length})
                                        </span>
                                    )}
                                </h3>
                            )}
                            {orderedPinned.length === 0 && editable ? (
                                <p className="text-xs text-muted-foreground italic">ยังไม่มีเกมปักหมุด</p>
                            ) : editable ? (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePinnedDragEnd}>
                                    <SortableContext items={orderedPinned.map((it) => it.id)} strategy={rectSortingStrategy}>
                                        <div className="relative">
                                            {savingOrder && (
                                                <div className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    บันทึกลำดับ...
                                                </div>
                                            )}
                                            {pinnedGrid}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                pinnedGrid
                            )}
                        </div>
                    )}

                    {unpinned.length > 0 && (
                        <div className="space-y-3">
                            {editable && orderedPinned.length > 0 && (
                                <h3 className="text-xs font-semibold text-muted-foreground">
                                    เกมล่าสุด ({unpinned.length})
                                </h3>
                            )}
                            {unpinnedGrid}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
