import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Save,
    RotateCcw,
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronRight,
    LayoutTemplate,
    ExternalLink,
} from 'lucide-react';
import {
    type PageBlock,
    type PageId,
    type BlockType,
    PAGE_KEYS,
    PAGE_LABELS,
    BLOCK_TYPE_LABELS,
    BLOCK_TYPE_ICONS,
} from './types';
import { BlockEditor } from './BlockEditor';

// ─── Sortable block row ────────────────────────────────────────────────────

function SortableBlock({
    block,
    onChange,
    onDelete,
}: {
    block: PageBlock;
    onChange: (b: PageBlock) => void;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const preview =
        block.props.title || block.props.content?.slice(0, 60) || block.props.image_url ? '…' : '';

    return (
        <div ref={setNodeRef} style={style} className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2">
                <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="w-4 h-4" />
                </div>
                <span className="text-base">{BLOCK_TYPE_ICONS[block.type]}</span>
                <span className="text-sm font-medium flex-1">
                    {BLOCK_TYPE_LABELS[block.type]}
                    {block.props.title && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                            — {block.props.title.slice(0, 40)}
                        </span>
                    )}
                    {!block.props.title && preview && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                            — {preview}
                        </span>
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title={expanded ? 'ซ่อน' : 'แก้ไข'}
                >
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1 text-destructive hover:text-destructive/80 transition-colors"
                    title="ลบ"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {expanded && (
                <div className="border-t border-border p-3 bg-secondary/20">
                    <BlockEditor block={block} onChange={onChange} />
                </div>
            )}
        </div>
    );
}

// ─── Main manager ──────────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = ['text', 'image', 'banner', 'stats', 'map'];

function makeBlock(type: BlockType): PageBlock {
    return {
        id: crypto.randomUUID(),
        type,
        props: {},
    };
}

function usePageBlocks(pageId: PageId) {
    const dbKey = PAGE_KEYS[pageId];
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [initial, setInitial] = useState<PageBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('school_settings')
                .select('value')
                .eq('key', dbKey)
                .maybeSingle();

            let loaded: PageBlock[] = [];
            if (data?.value) {
                try {
                    loaded = JSON.parse(data.value);
                } catch { /* use empty */ }
            }
            setBlocks(loaded);
            setInitial(loaded);
            setLoading(false);
        };
        load();
    }, [dbKey]);

    const save = async (newBlocks: PageBlock[]) => {
        const { error } = await supabase
            .from('school_settings')
            .upsert({ key: dbKey, value: JSON.stringify(newBlocks) } as any, { onConflict: 'key' });
        if (error) throw error;
        setInitial(newBlocks);
    };

    const hasChanges = JSON.stringify(blocks) !== JSON.stringify(initial);

    return { blocks, setBlocks, initial, loading, save, hasChanges, toast };
}

export const PageBuilderManager = () => {
    const [activePage, setActivePage] = useState<PageId>('about');
    const { blocks, setBlocks, loading, save, hasChanges, toast } = usePageBlocks(activePage);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = blocks.findIndex((b) => b.id === active.id);
        const newIdx = blocks.findIndex((b) => b.id === over.id);
        setBlocks(arrayMove(blocks, oldIdx, newIdx));
    };

    const addBlock = (type: BlockType) => {
        setBlocks((prev) => [...prev, makeBlock(type)]);
    };

    const updateBlock = (id: string, updated: PageBlock) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    };

    const deleteBlock = (id: string) => {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await save(blocks);
            toast({ title: '✅ บันทึกเรียบร้อย', description: 'เนื้อหาหน้าจะอัพเดตทันที' });
        } catch (err: any) {
            toast({ title: 'บันทึกล้มเหลว', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const pageSlug: Record<PageId, string> = { about: '/about', contact: '/contact' };

    return (
        <div className="flex flex-col h-screen">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Page Builder</h1>
                        <p className="text-xs text-muted-foreground">เพิ่ม Custom Sections ท้ายหน้า</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={pageSlug[activePage]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        ดูหน้าจริง
                    </a>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBlocks(JSON.parse(JSON.stringify(blocks)))}
                        disabled={!hasChanges}
                        className="gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        คืนค่า
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="gap-1.5"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        {hasChanges && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
                    </Button>
                </div>
            </div>

            {/* Page tabs */}
            <div className="flex border-b border-border bg-card px-6">
                {(Object.keys(PAGE_LABELS) as PageId[]).map((id) => (
                    <button
                        key={id}
                        onClick={() => setActivePage(id)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activePage === id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {PAGE_LABELS[id]}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Block list */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-16 text-muted-foreground">กำลังโหลด...</div>
                    ) : blocks.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <p className="mb-4">ยังไม่มี Custom Sections สำหรับหน้านี้</p>
                                <p className="text-sm">เลือก Block ทางขวาเพื่อเริ่มเพิ่มเนื้อหา</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                    {blocks.map((block) => (
                                        <SortableBlock
                                            key={block.id}
                                            block={block}
                                            onChange={(updated) => updateBlock(block.id, updated)}
                                            onDelete={() => deleteBlock(block.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                {/* Block Palette */}
                <div className="w-64 flex-shrink-0 border-l border-border bg-card overflow-y-auto p-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                เพิ่ม Block
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3">
                            {BLOCK_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => addBlock(type)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors text-left"
                                >
                                    <span>{BLOCK_TYPE_ICONS[type]}</span>
                                    <span>{BLOCK_TYPE_LABELS[type]}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">วิธีใช้:</p>
                        <p>• เลือก block ทางขวา → แก้ไขเนื้อหา</p>
                        <p>• ลาก <GripVertical className="w-3 h-3 inline" /> เพื่อเรียงลำดับ</p>
                        <p>• Blocks จะแสดงท้ายหน้าต่อจากเนื้อหาหลัก</p>
                        <p>• กด "บันทึก" เมื่อต้องการ publish</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
