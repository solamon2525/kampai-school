import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

export interface BlockDef {
    id: string;
    label: string;
    icon: string;
    description: string;
}

export const MAIN_BLOCKS: BlockDef[] = [
    { id: 'hero', label: 'Hero Slideshow', icon: '🖼️', description: 'สไลด์โชว์ภาพหลัก' },
    { id: 'news', label: 'ข่าวสาร', icon: '📰', description: 'ข่าวล่าสุด 5 รายการ' },
    { id: 'about', label: 'เกี่ยวกับโรงเรียน', icon: '🏫', description: 'คำอธิบาย + ลิงก์อ่านเพิ่ม' },
    { id: 'calendar', label: 'ปฏิทินกิจกรรม', icon: '📅', description: 'กิจกรรมที่กำลังจะมา' },
    { id: 'video', label: 'วิดีโอแนะนำ', icon: '🎬', description: 'YouTube embed' },
    { id: 'statistics', label: 'ตัวเลขสถิติ', icon: '📊', description: 'สถิติโรงเรียน 4 ตัว' },
    { id: 'quicklinks', label: 'ลิงก์ด่วน', icon: '🔗', description: 'ปุ่ม shortcut 4 ปุ่ม' },
    { id: 'announcement', label: 'ประกาศ', icon: '📢', description: 'แบนเนอร์ประกาศ' },
];

export const RIGHT_BLOCKS: BlockDef[] = [
    { id: 'categories', label: 'หมวดหมู่ข่าว', icon: '📂', description: 'รายการหมวดหมู่' },
    { id: 'gallery', label: 'แกลเลอรี่', icon: '🖼️', description: 'รูปภาพล่าสุด 6 รูป' },
    { id: 'services', label: 'บริการออนไลน์', icon: '🎒', description: 'ปุ่ม E-service' },
    { id: 'social', label: 'โซเชียลมีเดีย', icon: '💬', description: 'ลิงก์ Facebook, LINE' },
    { id: 'stats', label: 'สถิติผู้เข้าชม', icon: '📊', description: 'ตัวเลขเยี่ยมชม' },
    { id: 'documents', label: 'เอกสารดาวน์โหลด', icon: '📄', description: 'เอกสารล่าสุด' },
];

export const LEFT_BLOCKS: BlockDef[] = [
    { id: 'principal', label: 'ผู้อำนวยการ', icon: '👤', description: 'รูป + ชื่อ ผอ.' },
    { id: 'menu', label: 'เมนูทาง', icon: '📋', description: 'เมนูลิงก์ sidebar' },
];

function SortableBlock({
    id,
    block,
    isHidden,
    onToggle,
    isSelected,
    onSelect,
}: {
    id: string;
    block: BlockDef;
    isHidden: boolean;
    onToggle: () => void;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`flex items-center gap-3 p-3 border rounded-xl transition-all cursor-pointer ${
                isDragging ? 'shadow-lg ring-2 ring-primary/50 z-10' : ''
            } ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:bg-secondary/30'} ${
                isHidden ? 'opacity-50' : ''
            }`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <span className="text-lg flex-shrink-0">{block.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${isHidden ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {block.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{block.description}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
                    isHidden
                        ? 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary'
                        : 'text-primary hover:bg-primary/10'
                }`}
                title={isHidden ? 'แสดง' : 'ซ่อน'}
            >
                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

type ZoneKey = 'left' | 'main' | 'right';

interface BlockPaletteProps {
    layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>;
    onLayoutChange: (layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>) => void;
    activeZone: ZoneKey;
    onZoneChange: (zone: ZoneKey) => void;
    selectedBlock: string | null;
    onSelectBlock: (id: string | null) => void;
}

const ZONE_INFO: Record<ZoneKey, { label: string; emoji: string; blockDefs: BlockDef[] }> = {
    left: { label: 'ซ้าย', emoji: '◀️', blockDefs: LEFT_BLOCKS },
    main: { label: 'กลาง', emoji: '⬛', blockDefs: MAIN_BLOCKS },
    right: { label: 'ขวา', emoji: '▶️', blockDefs: RIGHT_BLOCKS },
};

export const BlockPalette = ({
    layout,
    onLayoutChange,
    activeZone,
    onZoneChange,
    selectedBlock,
    onSelectBlock,
}: BlockPaletteProps) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const zone = layout[activeZone];
    const blockDefs = ZONE_INFO[activeZone].blockDefs;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = zone.blocks.indexOf(String(active.id));
        const newIndex = zone.blocks.indexOf(String(over.id));
        const newBlocks = arrayMove(zone.blocks, oldIndex, newIndex);

        onLayoutChange({
            ...layout,
            [activeZone]: { ...zone, blocks: newBlocks },
        });
    };

    const toggleVisibility = (blockId: string) => {
        const isHidden = zone.hidden.includes(blockId);
        const newHidden = isHidden
            ? zone.hidden.filter((id) => id !== blockId)
            : [...zone.hidden, blockId];

        onLayoutChange({
            ...layout,
            [activeZone]: { ...zone, hidden: newHidden },
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Zone Tabs */}
            <div className="flex border-b border-border">
                {(Object.keys(ZONE_INFO) as ZoneKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => onZoneChange(key)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                            activeZone === key
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>{ZONE_INFO[key].emoji} {ZONE_INFO[key].label}</span>
                        {activeZone === key && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Block Count */}
            <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        แสดง {zone.blocks.length - zone.hidden.length} / {zone.blocks.length} blocks
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">แสดง</span>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30 ml-2" />
                        <span className="text-xs text-muted-foreground">ซ่อน</span>
                    </div>
                </div>
            </div>

            {/* Sortable Blocks */}
            <div className="flex-1 overflow-y-auto p-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={zone.blocks} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {zone.blocks.map((id) => {
                                const block = blockDefs.find((b) => b.id === id);
                                if (!block) return null;
                                return (
                                    <SortableBlock
                                        key={id}
                                        id={id}
                                        block={block}
                                        isHidden={zone.hidden.includes(id)}
                                        onToggle={() => toggleVisibility(id)}
                                        isSelected={selectedBlock === id}
                                        onSelect={() => onSelectBlock(selectedBlock === id ? null : id)}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
