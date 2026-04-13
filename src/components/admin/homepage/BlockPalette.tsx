import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronRight, ArrowRightLeft, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

export interface BlockDef {
    id: string;
    label: string;
    icon: string;
    description: string;
    category: string;
}

// ─── Categories ───────────────────────────────────────────
export const BLOCK_CATEGORIES: { id: string; label: string; icon: string }[] = [
    { id: 'basic', label: 'พื้นฐาน', icon: '🏠' },
    { id: 'blog', label: 'บล็อก/เนื้อหา', icon: '📝' },
    { id: 'data', label: 'ข้อมูล/สถิติ', icon: '📊' },
    { id: 'media', label: 'มีเดีย', icon: '🎬' },
    { id: 'service', label: 'บริการ/ลิงก์', icon: '🔗' },
    { id: 'footer', label: 'ส่วนท้าย', icon: '📋' },
];

// ─── Block definitions per zone ───────────────────────────

export const HEADER_BLOCKS: BlockDef[] = [
    { id: 'news_ticker', label: 'ข่าวด่วน (Ticker)', icon: '📰', description: 'แถบข่าววิ่งด้านบน', category: 'basic' },
    { id: 'top_banner', label: 'แบนเนอร์ด้านบน', icon: '🖼️', description: 'รูปภาพ/ข้อความโปรโมท', category: 'basic' },
];

export const MAIN_BLOCKS: BlockDef[] = [
    // พื้นฐาน
    { id: 'hero', label: 'Hero Slideshow', icon: '🖼️', description: 'สไลด์โชว์ภาพหลัก', category: 'basic' },
    { id: 'news', label: 'ข่าวสาร', icon: '📰', description: 'ข่าวล่าสุด 5 รายการ', category: 'basic' },
    { id: 'about', label: 'เกี่ยวกับโรงเรียน', icon: '🏫', description: 'คำอธิบาย + ลิงก์อ่านเพิ่ม', category: 'basic' },
    { id: 'announcement', label: 'ประกาศ', icon: '📢', description: 'แบนเนอร์ประกาศ', category: 'basic' },
    { id: 'quicklinks', label: 'ลิงก์ด่วน', icon: '🔗', description: 'ปุ่ม shortcut 4 ปุ่ม', category: 'basic' },
    // บล็อก/เนื้อหา
    { id: 'blog_grid', label: 'บล็อก (Grid)', icon: '📝', description: 'แสดงบทความเป็นตารางกริด', category: 'blog' },
    { id: 'blog_carousel', label: 'บล็อก (Carousel)', icon: '🎠', description: 'แสดงบทความเลื่อนอัตโนมัติ', category: 'blog' },
    { id: 'blog_list', label: 'บล็อก (List)', icon: '📋', description: 'แสดงบทความเป็นรายการ', category: 'blog' },
    { id: 'testimonials', label: 'รีวิว/คำนิยม', icon: '💬', description: 'ความคิดเห็นจากนักเรียน/ผู้ปกครอง', category: 'blog' },
    { id: 'faq_accordion', label: 'คำถามที่พบบ่อย', icon: '❓', description: 'FAQ แบบ Accordion', category: 'blog' },
    // ข้อมูล/สถิติ
    { id: 'statistics', label: 'ตัวเลขสถิติ', icon: '📊', description: 'สถิติโรงเรียน 4 ตัว', category: 'data' },
    { id: 'calendar', label: 'ปฏิทินกิจกรรม', icon: '📅', description: 'กิจกรรมที่กำลังจะมา', category: 'data' },
    { id: 'countdown', label: 'นับถอยหลัง', icon: '⏳', description: 'นับเวลาถอยหลังสู่เหตุการณ์', category: 'data' },
    { id: 'partner_logos', label: 'พันธมิตร/หน่วยงาน', icon: '🤝', description: 'โลโก้หน่วยงานที่เกี่ยวข้อง', category: 'data' },
    // มีเดีย
    { id: 'video', label: 'วิดีโอแนะนำ', icon: '🎬', description: 'YouTube embed', category: 'media' },
    { id: 'photo_album', label: 'อัลบั้มรูปภาพ', icon: '📸', description: 'แกลเลอรี่รูปภาพขนาดใหญ่', category: 'media' },
    { id: 'map_embed', label: 'แผนที่', icon: '🗺️', description: 'Google Maps แสดงที่ตั้ง', category: 'media' },
    // บริการ
    { id: 'contact_form', label: 'ฟอร์มติดต่อ', icon: '✉️', description: 'ฟอร์มส่งข้อความ', category: 'service' },
];

export const RIGHT_BLOCKS: BlockDef[] = [
    { id: 'categories', label: 'หมวดหมู่ข่าว', icon: '📂', description: 'รายการหมวดหมู่', category: 'service' },
    { id: 'gallery', label: 'แกลเลอรี่', icon: '🖼️', description: 'รูปภาพล่าสุด 6 รูป', category: 'media' },
    { id: 'services', label: 'บริการออนไลน์', icon: '🎒', description: 'ปุ่ม E-service', category: 'service' },
    { id: 'social', label: 'โซเชียลมีเดีย', icon: '💬', description: 'ลิงก์ Facebook, LINE', category: 'service' },
    { id: 'stats', label: 'สถิติผู้เข้าชม', icon: '📊', description: 'ตัวเลขเยี่ยมชม', category: 'data' },
    { id: 'documents', label: 'เอกสารดาวน์โหลด', icon: '📄', description: 'เอกสารล่าสุด', category: 'service' },
];

export const LEFT_BLOCKS: BlockDef[] = [
    { id: 'principal', label: 'ผู้อำนวยการ', icon: '👤', description: 'รูป + ชื่อ ผอ.', category: 'basic' },
    { id: 'menu', label: 'เมนูทาง', icon: '📋', description: 'เมนูลิงก์ sidebar', category: 'service' },
];

export const FOOTER_BLOCKS: BlockDef[] = [
    { id: 'footer_info', label: 'ข้อมูลโรงเรียน', icon: '🏫', description: 'ชื่อ/คำอธิบาย/โลโก้', category: 'footer' },
    { id: 'footer_links', label: 'ลิงก์ด่วน', icon: '🔗', description: 'เมนูลิงก์ท้ายหน้า', category: 'footer' },
    { id: 'footer_social', label: 'โซเชียลมีเดีย', icon: '💬', description: 'ไอคอน Facebook, LINE', category: 'footer' },
    { id: 'footer_contact', label: 'ข้อมูลติดต่อ', icon: '📞', description: 'ที่อยู่/โทร/อีเมล', category: 'footer' },
    { id: 'footer_services', label: 'บริการออนไลน์', icon: '🎒', description: 'ลิงก์บริการ', category: 'footer' },
];

export const ALL_BLOCKS: BlockDef[] = [
    ...HEADER_BLOCKS,
    ...MAIN_BLOCKS,
    ...RIGHT_BLOCKS,
    ...LEFT_BLOCKS,
    ...FOOTER_BLOCKS,
];

// ─── Sortable Block Item ──────────────────────────────────

function SortableBlock({
    id,
    block,
    isHidden,
    onToggle,
    isSelected,
    onSelect,
    isHovered,
    onHover,
    onMoveZone,
    onReorder,
    isFirst,
    isLast,
    activeZone,
}: {
    id: string;
    block: BlockDef;
    isHidden: boolean;
    onToggle: () => void;
    isSelected: boolean;
    onSelect: () => void;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
    onMoveZone: (zone: ZoneKey) => void;
    onReorder: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
    isFirst: boolean;
    isLast: boolean;
    activeZone: ZoneKey;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const cat = BLOCK_CATEGORIES.find((c) => c.id === block.category);

    return (
        <div
            id={`palette-block-${id}`}
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={`flex items-center gap-3 p-3 border rounded-xl transition-all cursor-pointer ${
                isDragging ? 'shadow-lg ring-2 ring-primary/50 z-10' : ''
            } ${isSelected || isHovered ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:bg-secondary/30'} ${
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
            {cat && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0 hidden sm:inline">
                    {cat.icon}
                </span>
            )}
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary flex-shrink-0"
                        title="ย้ายโซน"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">จัดเรียงลำดับ</DropdownMenuLabel>
                    <DropdownMenuItem disabled={isFirst} onSelect={() => onReorder('top')}>
                        <ArrowUpToLine className="w-4 h-4 mr-2" /> เลื่อนขึ้นบนสุด
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isFirst} onSelect={() => onReorder('up')}>
                        <ArrowUp className="w-4 h-4 mr-2" /> เลื่อนขึ้น 1 ขั้น
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isLast} onSelect={() => onReorder('down')}>
                        <ArrowDown className="w-4 h-4 mr-2" /> เลื่อนลง 1 ขั้น
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isLast} onSelect={() => onReorder('bottom')}>
                        <ArrowDownToLine className="w-4 h-4 mr-2" /> เลื่อนลงล่างสุด
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">ย้ายข้ามโซน</DropdownMenuLabel>
                    {(Object.keys(ZONE_INFO) as ZoneKey[]).map(k => (
                        <DropdownMenuItem disabled={activeZone === k} key={k} onSelect={() => onMoveZone(k)}>
                            ย้ายไป {ZONE_INFO[k].label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Zone types ───────────────────────────────────────────

export type ZoneKey = 'header' | 'left' | 'main' | 'right' | 'footer';

interface BlockPaletteProps {
    layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>;
    onLayoutChange: (layout: Record<ZoneKey, { blocks: string[]; hidden: string[] }>) => void;
    activeZone: ZoneKey;
    onZoneChange: (zone: ZoneKey) => void;
    selectedBlock: string | null;
    onSelectBlock: (id: string | null) => void;
    hoveredBlock: string | null;
    hoverSource?: 'palette' | 'preview' | null;
    onHoverBlock: (id: string | null) => void;
}

export const ZONE_INFO: Record<ZoneKey, { label: string; emoji: string; blockDefs: BlockDef[] }> = {
    header: { label: 'Header', emoji: '⬆️', blockDefs: HEADER_BLOCKS },
    left: { label: 'ซ้าย', emoji: '◀️', blockDefs: LEFT_BLOCKS },
    main: { label: 'กลาง', emoji: '⬛', blockDefs: MAIN_BLOCKS },
    right: { label: 'ขวา', emoji: '▶️', blockDefs: RIGHT_BLOCKS },
    footer: { label: 'Footer', emoji: '⬇️', blockDefs: FOOTER_BLOCKS },
};

// ─── Category filter for long block lists ─────────────────

function CategoryFilter({
    blockDefs,
    filterCategory,
    onFilterChange,
}: {
    blockDefs: BlockDef[];
    filterCategory: string | null;
    onFilterChange: (cat: string | null) => void;
}) {
    // Get unique categories in this block list
    const cats = Array.from(new Set(blockDefs.map((b) => b.category)));
    const relevantCats = BLOCK_CATEGORIES.filter((c) => cats.includes(c.id));

    if (relevantCats.length <= 1) return null;

    return (
        <div className="flex gap-1 flex-wrap">
            <button
                onClick={() => onFilterChange(null)}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                    !filterCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
            >
                ทั้งหมด
            </button>
            {relevantCats.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onFilterChange(filterCategory === cat.id ? null : cat.id)}
                    className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                        filterCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                    {cat.icon} {cat.label}
                </button>
            ))}
        </div>
    );
}

// ─── Main BlockPalette ────────────────────────────────────

export const BlockPalette = ({
    layout,
    onLayoutChange,
    activeZone,
    onZoneChange,
    selectedBlock,
    onSelectBlock,
    hoveredBlock,
    hoverSource,
    onHoverBlock,
}: BlockPaletteProps) => {
    const zone = layout[activeZone];
    const blockDefs = ALL_BLOCKS;
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    useEffect(() => {
        if (hoveredBlock && hoverSource === 'preview') {
            const el = document.getElementById(`palette-block-${hoveredBlock}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [hoveredBlock, hoverSource]);

    const handleReorder = (blockId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
        const blocks = [...zone.blocks];
        const index = blocks.indexOf(blockId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
        } else if (direction === 'down' && index < blocks.length - 1) {
            [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        } else if (direction === 'top' && index > 0) {
            blocks.splice(index, 1);
            blocks.unshift(blockId);
        } else if (direction === 'bottom' && index < blocks.length - 1) {
            blocks.splice(index, 1);
            blocks.push(blockId);
        }

        onLayoutChange({
            ...layout,
            [activeZone]: { ...zone, blocks }
        });
    };

    const handleMoveZone = (blockId: string, targetZone: ZoneKey) => {
        if (targetZone === activeZone) return;

        const sourceZoneData = layout[activeZone];
        const targetZoneData = layout[targetZone];

        onLayoutChange({
            ...layout,
            [activeZone]: {
                ...sourceZoneData,
                blocks: sourceZoneData.blocks.filter(id => id !== blockId),
                hidden: sourceZoneData.hidden.filter(id => id !== blockId)
            },
            [targetZone]: {
                ...targetZoneData,
                blocks: [...targetZoneData.blocks, blockId],
            }
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

    // Filter blocks by category
    const visibleBlockIds = filterCategory
        ? zone.blocks.filter((id) => {
            const block = blockDefs.find((b) => b.id === id);
            return block && block.category === filterCategory;
        })
        : zone.blocks;

    return (
        <div className="flex flex-col h-full">
            {/* Zone Tabs */}
            <div className="flex border-b border-border overflow-x-auto">
                {(Object.keys(ZONE_INFO) as ZoneKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => { onZoneChange(key); setFilterCategory(null); }}
                        className={`flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors relative ${
                            activeZone === key
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span className="flex flex-col items-center gap-0.5">
                            <span>{ZONE_INFO[key].emoji}</span>
                            <span className="truncate">{ZONE_INFO[key].label}</span>
                        </span>
                        {activeZone === key && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Block Count + Category Filter */}
            <div className="px-4 py-3 border-b border-border bg-secondary/30 space-y-2">
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
                <CategoryFilter
                    blockDefs={blockDefs}
                    filterCategory={filterCategory}
                    onFilterChange={setFilterCategory}
                />
            </div>

            {/* Sortable Blocks */}
            <div className="flex-1 overflow-y-auto p-4">
                <SortableContext items={visibleBlockIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                            {visibleBlockIds.map((id, index) => {
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
                                        isHovered={hoveredBlock === id}
                                        onHover={(hovered) => onHoverBlock(hovered ? id : null)}
                                        onMoveZone={(targetZone) => handleMoveZone(id, targetZone)}
                                        onReorder={(direction) => handleReorder(id, direction)}
                                        isFirst={index === 0}
                                        isLast={index === visibleBlockIds.length - 1}
                                        activeZone={activeZone}
                                    />
                                );
                            })}
                        </div>
                </SortableContext>
            </div>
        </div>
    );
};
