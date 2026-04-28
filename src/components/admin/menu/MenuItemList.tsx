import { useMemo } from 'react';
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/lib/menuDefaults';
import { resolveMenuIcon } from '@/lib/menuIcons';

interface Props {
    items: MenuItem[];
    onChange: (items: MenuItem[]) => void;
    onEdit: (item: MenuItem) => void;
    onAdd: () => void;
}

interface SortableRowProps {
    item: MenuItem;
    children?: MenuItem[];
    onEdit: (item: MenuItem) => void;
    onDelete: (id: string) => void;
}

const SortableRow = ({ item, children, onEdit, onDelete }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    const Icon = resolveMenuIcon(item.icon);

    return (
        <div ref={setNodeRef} style={style} className="space-y-1.5">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                    aria-label="ลากเพื่อจัดลำดับ"
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                        {item.href || <span className="italic">ไม่มีลิงก์ (เป็น dropdown)</span>}
                    </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
            {children && children.length > 0 && (
                <div className="ml-6 pl-3 border-l-2 border-border space-y-1">
                    {children.map((child) => {
                        const ChildIcon = resolveMenuIcon(child.icon);
                        return (
                            <div key={child.id} className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-md px-3 py-1.5">
                                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <ChildIcon className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{child.label}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{child.href || '—'}</div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => onEdit(child)} className="h-7 w-7 p-0">
                                    <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => onDelete(child.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const MenuItemList = ({ items, onChange, onEdit, onAdd }: Props) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const topLevel = useMemo(
        () => items.filter((i) => i.parent === null).sort((a, b) => a.order - b.order),
        [items]
    );

    const childrenByParent = useMemo(() => {
        const map = new Map<string, MenuItem[]>();
        items.forEach((i) => {
            if (i.parent) {
                const arr = map.get(i.parent) ?? [];
                arr.push(i);
                map.set(i.parent, arr);
            }
        });
        map.forEach((arr) => arr.sort((a, b) => a.order - b.order));
        return map;
    }, [items]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = topLevel.findIndex((i) => i.id === active.id);
        const newIndex = topLevel.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(topLevel, oldIndex, newIndex);
        // assign new orders, then merge children back unchanged
        const newTopLevel = reordered.map((it, idx) => ({ ...it, order: idx }));
        const others = items.filter((i) => i.parent !== null);
        onChange([...newTopLevel, ...others]);
    };

    const handleDelete = (id: string) => {
        if (!confirm('ลบเมนูนี้? (ถ้าเป็น parent จะลบเมนูย่อยทั้งหมดด้วย)')) return;
        const filtered = items.filter((i) => i.id !== id && i.parent !== id);
        onChange(filtered);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">เมนูทั้งหมด</h3>
                <Button size="sm" onClick={onAdd}>
                    <Plus className="w-4 h-4 mr-1" /> เพิ่มเมนู
                </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={topLevel.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {topLevel.map((item) => (
                            <SortableRow
                                key={item.id}
                                item={item}
                                children={childrenByParent.get(item.id) ?? []}
                                onEdit={onEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {topLevel.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                    ยังไม่มีเมนู — กดปุ่ม "เพิ่มเมนู" เพื่อเริ่มต้น
                </p>
            )}
        </div>
    );
};

export default MenuItemList;
