import { useEffect, useState } from 'react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EduHubCategory } from '@/services/educational-hub.service';

interface Props {
    categories: EduHubCategory[];
    counts: Record<string, number>;
    activeKey?: string | null;
    onSelect?: (key: string) => void;
    editable?: boolean;
    onReorder?: (activeId: string, overId: string) => void;
}

interface SortableChipProps {
    category: EduHubCategory;
    count: number;
    active: boolean;
    editable: boolean;
    onClick: () => void;
}

const SortableCategoryChip = ({ category, count, active, editable, onClick }: SortableChipProps) => {
    const sortable = useSortable({ id: category.id, disabled: !editable });
    const Icon =
        (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon_name]
        ?? Icons.Folder;

    return (
        <div
            ref={sortable.setNodeRef}
            style={{
                transform: CSS.Transform.toString(sortable.transform),
                transition: sortable.transition,
            }}
            className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                sortable.isDragging && 'z-10 opacity-70 shadow-md',
                active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-accent',
            )}
        >
            {editable && (
                <button
                    type="button"
                    {...sortable.attributes}
                    {...sortable.listeners}
                    aria-label={`ลากเพื่อจัดลำดับหมวด ${category.name}`}
                    className="-ml-1 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
                >
                    <Icons.GripVertical className="h-3.5 w-3.5" />
                </button>
            )}
            <button type="button" onClick={onClick} className="inline-flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                <span className="font-medium">{category.name}</span>
                {count > 0 && (
                    <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                    )}>
                        {count}
                    </span>
                )}
            </button>
        </div>
    );
};

export const CategoryChipStrip = ({ categories, counts, activeKey, onSelect, editable = false, onReorder }: Props) => {
    const [observedActiveKey, setObservedActiveKey] = useState<string | null>(null);
    const currentActiveKey = activeKey ?? observedActiveKey;
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Highlight the section in view
    useEffect(() => {
        if (onSelect) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) {
                    const key = visible[0].target.id.replace('cat-', '');
                    setObservedActiveKey(key);
                }
            },
            { rootMargin: '-100px 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
        );

        categories.forEach((c) => {
            const el = document.getElementById(`cat-${c.category_key}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [categories, onSelect]);

    const handleClick = (key: string) => {
        if (onSelect) {
            onSelect(key);
            return;
        }
        const el = document.getElementById(`cat-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (categories.length === 0) return null;

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        onReorder?.(String(active.id), String(over.id));
    };

    return (
        <div className="sticky top-16 z-30 px-4 py-2 bg-background/90 backdrop-blur border-b border-border">
            <div className="overflow-x-auto scrollbar-none">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={categories.map((category) => category.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex gap-2 min-w-max">
                            {categories.map((category) => (
                                <SortableCategoryChip
                                    key={category.id}
                                    category={category}
                                    count={counts[category.id] ?? 0}
                                    active={currentActiveKey === category.category_key}
                                    editable={editable && category.category_key !== 'lesson-packs'}
                                    onClick={() => handleClick(category.category_key)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
