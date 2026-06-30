/**
 * SortableItemsTable.tsx
 *
 * Drag-and-drop sortable table for a single category's worth of educational-hub
 * items. Used by both teacher self-management (TeacherEduHubManager) and admin
 * drill-in (EduHubManagement.TeacherItemsManager).
 *
 * On drag end, computes new sort_order values (10, 20, 30, ...) for affected
 * items and calls `bulkUpdateSortOrder` once.
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical, Edit, Trash2, Eye, EyeOff, ClipboardList, BookOpen,
    FileText, ExternalLink as LinkIcon, Youtube, Type, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    educationalHubService,
    formatFileSize,
    isGameItem,
    type EduHubItem,
    type EduHubItemType,
} from '@/services/educational-hub.service';
import { isThaiVocabHubGame } from '@/lib/thai-vocab-hub';

const ITEM_TYPE_ICON: Record<EduHubItemType, typeof FileText> = {
    file: FileText,
    link: LinkIcon,
    youtube: Youtube,
    text: Type,
};

const ITEM_TYPE_LABEL: Record<EduHubItemType, string> = {
    file: 'ไฟล์',
    link: 'ลิงก์',
    youtube: 'YouTube',
    text: 'ข้อความ',
};

interface Props {
    items: EduHubItem[];
    /** Query keys to invalidate after publish/delete/reorder */
    invalidateKeys: readonly (readonly unknown[])[];
    onEdit: (item: EduHubItem) => void;
    /** เปิด dialog รายละเอียดเกม — แสดงปุ่มเฉพาะรายการที่เป็นเกม (optional) */
    onDocs?: (item: EduHubItem) => void;
    /** จัดการคำศัพท์ Thai Vocab Hub (optional) */
    onVocabManage?: (item: EduHubItem) => void;
}

export const SortableItemsTable = ({ items, invalidateKeys, onEdit, onDocs, onVocabManage }: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [orderedItems, setOrderedItems] = useState(items);
    const [saving, setSaving] = useState(false);

    // Re-sync when parent items change (e.g. add/delete from outside)
    // We compare ids to avoid clobbering a fresh drag mid-flight
    if (
        items.length !== orderedItems.length ||
        items.some((it, i) => it.id !== orderedItems[i]?.id || it.updated_at !== orderedItems[i]?.updated_at)
    ) {
        setOrderedItems(items);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const invalidateAll = async () => {
        await Promise.all(
            invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: [...key] })),
        );
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIdx = orderedItems.findIndex((it) => it.id === active.id);
        const newIdx = orderedItems.findIndex((it) => it.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;

        const next = arrayMove(orderedItems, oldIdx, newIdx);
        setOrderedItems(next);

        // Compute new sort_order: spaced by 10 so future single-item updates have room
        const updates = next.map((it, i) => ({ id: it.id, sort_order: (i + 1) * 10 }));
        setSaving(true);
        const { error } = await educationalHubService.bulkUpdateSortOrder(updates);
        setSaving(false);
        if (error) {
            // Rollback local order on failure
            setOrderedItems(items);
            toast({ title: 'จัดลำดับล้มเหลว', description: error.message, variant: 'destructive' });
            return;
        }
        await invalidateAll();
        toast({ title: 'บันทึกลำดับใหม่' });
    };

    const togglePublished = async (item: EduHubItem) => {
        const res = await educationalHubService.updateItem(item.id, { is_published: !item.is_published });
        if (res.error) {
            toast({ title: 'บันทึกไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await invalidateAll();
    };

    const handleDelete = async (item: EduHubItem) => {
        if (!confirm(`ลบรายการ "${item.title}"?`)) return;
        const res = await educationalHubService.deleteItem(item.id);
        if (res.error) {
            toast({ title: 'ลบไม่ได้', description: res.error.message, variant: 'destructive' });
            return;
        }
        await invalidateAll();
        toast({ title: 'ลบรายการสำเร็จ' });
    };

    return (
        <Card>
            <CardContent className="p-0 relative">
                {saving && (
                    <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        บันทึกลำดับ...
                    </div>
                )}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={orderedItems.map((it) => it.id)} strategy={verticalListSortingStrategy}>
                        <table className="w-full">
                            <tbody>
                                {orderedItems.map((item) => (
                                    <SortableRow
                                        key={item.id}
                                        item={item}
                                        onTogglePublished={togglePublished}
                                        onEdit={onEdit}
                                        onDocs={onDocs}
                                        onVocabManage={onVocabManage}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </SortableContext>
                </DndContext>
            </CardContent>
        </Card>
    );
};

// ─── Single sortable row ────────────────────────────────────────────────────

const SortableRow = ({
    item,
    onTogglePublished,
    onEdit,
    onDocs,
    onVocabManage,
    onDelete,
}: {
    item: EduHubItem;
    onTogglePublished: (item: EduHubItem) => void;
    onEdit: (item: EduHubItem) => void;
    onDocs?: (item: EduHubItem) => void;
    onVocabManage?: (item: EduHubItem) => void;
    onDelete: (item: EduHubItem) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const Icon = ITEM_TYPE_ICON[item.item_type];

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-b border-border last:border-0 hover:bg-muted/20',
                isDragging && 'bg-accent/40 shadow-md',
            )}
        >
            <td className="w-8 px-2 py-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                    aria-label="ลากเพื่อจัดลำดับ"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </td>
            <td className="px-3 py-2 w-24">
                <Badge variant="outline" className="text-[10px]">
                    <Icon className="h-3 w-3 mr-1" />
                    {ITEM_TYPE_LABEL[item.item_type]}
                </Badge>
            </td>
            <td className="px-3 py-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                )}
                {item.file_size && (
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file_size)}</p>
                )}
            </td>
            <td className="px-3 py-2 w-28">
                <button
                    onClick={() => onTogglePublished(item)}
                    className={cn(
                        'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                        item.is_published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground',
                    )}
                >
                    {item.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {item.is_published ? 'เผยแพร่' : 'ซ่อน'}
                </button>
            </td>
            <td className="px-3 py-2 w-24">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    {onDocs && isGameItem(item) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-violet-600"
                            title="รายละเอียดเกม"
                            onClick={() => onDocs(item)}
                        >
                            <ClipboardList className="h-4 w-4" />
                        </Button>
                    )}
                    {onVocabManage && isThaiVocabHubGame(item) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-700"
                            title="จัดการคำศัพท์"
                            onClick={() => onVocabManage(item)}
                        >
                            <BookOpen className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};
