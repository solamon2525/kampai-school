import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Smartphone, ArrowUp, ArrowDown } from 'lucide-react';
import { ALL_BLOCKS, type BlockDef } from './BlockPalette';

// Blocks that can appear on mobile (exclude header/footer zone blocks)
export const MOBILE_AVAILABLE_BLOCKS: BlockDef[] = ALL_BLOCKS.filter(
    (b) =>
        ![
            'news_ticker', 'top_banner',
            'footer_info', 'footer_links', 'footer_social', 'footer_contact', 'footer_services',
        ].includes(b.id)
);

export interface MobileLayout {
    blocks: string[];
    hidden: string[];
}

export const DEFAULT_MOBILE_LAYOUT: MobileLayout = {
    blocks: MOBILE_AVAILABLE_BLOCKS.map((b) => b.id),
    hidden: [],
};

// ─── Sortable Block Row ────────────────────────────────────
function MobileSortableBlock({
    id, block, isHidden, displayIndex, onToggle, onReorder, isFirst, isLast,
}: {
    id: string;
    block: BlockDef;
    isHidden: boolean;
    displayIndex: number;
    onToggle: () => void;
    onReorder: (dir: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 border rounded-xl transition-all select-none ${
                isDragging
                    ? 'shadow-lg ring-2 ring-primary/50 z-10 bg-background'
                    : isHidden
                    ? 'border-dashed border-gray-200 bg-gray-50/50 opacity-50'
                    : 'border-border bg-background hover:bg-secondary/20'
            }`}
        >
            {/* Order badge */}
            <span
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                    isHidden ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
                }`}
            >
                {isHidden ? '–' : displayIndex + 1}
            </span>

            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
                title="ลากเพื่อจัดเรียง"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Icon */}
            <span className="text-lg flex-shrink-0">{block.icon}</span>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
                <p
                    className={`text-sm font-medium leading-tight ${
                        isHidden ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                >
                    {block.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{block.description}</p>
            </div>

            {/* Up / Down buttons */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                    disabled={isFirst}
                    onClick={() => onReorder('up')}
                    className="p-0.5 rounded text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
                    title="เลื่อนขึ้น"
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                    disabled={isLast}
                    onClick={() => onReorder('down')}
                    className="p-0.5 rounded text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
                    title="เลื่อนลง"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Toggle visibility */}
            <button
                onClick={onToggle}
                className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
                    isHidden
                        ? 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary'
                        : 'text-primary hover:bg-primary/10'
                }`}
                title={isHidden ? 'แสดงบนมือถือ' : 'ซ่อนบนมือถือ'}
            >
                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────
interface MobileLayoutManagerProps {
    mobileLayout: MobileLayout;
    onMobileLayoutChange: (layout: MobileLayout) => void;
}

export const MobileLayoutManager = ({ mobileLayout, onMobileLayoutChange }: MobileLayoutManagerProps) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = mobileLayout.blocks.indexOf(String(active.id));
        const newIdx = mobileLayout.blocks.indexOf(String(over.id));
        if (oldIdx !== -1 && newIdx !== -1) {
            onMobileLayoutChange({ ...mobileLayout, blocks: arrayMove(mobileLayout.blocks, oldIdx, newIdx) });
        }
    };

    const toggleVisibility = (id: string) => {
        const isHidden = mobileLayout.hidden.includes(id);
        onMobileLayoutChange({
            ...mobileLayout,
            hidden: isHidden ? mobileLayout.hidden.filter((h) => h !== id) : [...mobileLayout.hidden, id],
        });
    };

    const handleReorder = (id: string, direction: 'up' | 'down') => {
        const blocks = [...mobileLayout.blocks];
        const index = blocks.indexOf(id);
        if (direction === 'up' && index > 0) {
            [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
        } else if (direction === 'down' && index < blocks.length - 1) {
            [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        }
        onMobileLayoutChange({ ...mobileLayout, blocks });
    };

    const visibleIds = mobileLayout.blocks.filter((id) => !mobileLayout.hidden.includes(id));
    let visibleIndex = -1;

    return (
        <div className="flex h-full overflow-hidden">
            {/* ── Left: Sortable List ── */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">ลำดับ Block บนมือถือ</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        แสดง{' '}
                        <span className="font-bold text-primary">{visibleIds.length}</span>{' '}
                        / {mobileLayout.blocks.length}
                    </span>
                </div>

                {/* Hint */}
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-start gap-2 flex-shrink-0">
                    <span className="flex-shrink-0 mt-0.5">💡</span>
                    <span>
                        ลากหรือกดลูกศรเพื่อจัดลำดับ Block ที่แสดงบนมือถือ กดปุ่ม{' '}
                        <Eye className="inline w-3 h-3" /> เพื่อซ่อน/แสดงแต่ละ Block บนมือถือโดยเฉพาะ
                    </span>
                </div>

                {/* Block list */}
                <div className="flex-1 overflow-y-auto p-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={mobileLayout.blocks} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {mobileLayout.blocks.map((id, idx) => {
                                    const block = MOBILE_AVAILABLE_BLOCKS.find((b) => b.id === id);
                                    if (!block) return null;
                                    const isHidden = mobileLayout.hidden.includes(id);
                                    if (!isHidden) visibleIndex++;
                                    return (
                                        <MobileSortableBlock
                                            key={id}
                                            id={id}
                                            block={block}
                                            isHidden={isHidden}
                                            displayIndex={isHidden ? -1 : visibleIndex}
                                            onToggle={() => toggleVisibility(id)}
                                            onReorder={(dir) => handleReorder(id, dir)}
                                            isFirst={idx === 0}
                                            isLast={idx === mobileLayout.blocks.length - 1}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* ── Right: Phone Mockup Preview ── */}
            <div className="w-64 flex-shrink-0 flex flex-col items-center overflow-y-auto p-5 bg-gray-50">
                <p className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> ตัวอย่างบนมือถือ
                </p>
                {/* Phone frame */}
                <div className="w-48 bg-white rounded-[2rem] shadow-2xl border-[5px] border-gray-800 overflow-hidden">
                    <div className="bg-gray-800 flex items-center justify-center py-1">
                        <div className="w-14 h-1.5 bg-gray-600 rounded-full" />
                    </div>
                    <div className="p-1.5 space-y-1 max-h-[480px] overflow-y-auto scrollbar-hide bg-gray-100">
                        {/* Header mock */}
                        <div className="bg-purple-900 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-[9px] text-white font-semibold">🏫 โรงเรียนบ้านคำไผ่</p>
                        </div>
                        {/* Blocks */}
                        {visibleIds.length === 0 ? (
                            <div className="text-center py-8 text-[10px] text-gray-400">
                                ไม่มี Block ที่แสดง
                            </div>
                        ) : (
                            visibleIds.map((id) => {
                                const block = MOBILE_AVAILABLE_BLOCKS.find((b) => b.id === id);
                                if (!block) return null;
                                return (
                                    <div
                                        key={id}
                                        className="bg-white border border-purple-100 rounded-lg px-2 py-1.5 flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="text-xs flex-shrink-0">{block.icon}</span>
                                        <span className="text-[9px] font-medium text-gray-700 truncate">
                                            {block.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        {/* Footer mock */}
                        <div className="bg-gray-200 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-[9px] text-gray-500">— Footer —</p>
                        </div>
                    </div>
                    <div className="bg-gray-100 h-4 flex items-center justify-center">
                        <div className="w-10 h-1 bg-gray-400 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
