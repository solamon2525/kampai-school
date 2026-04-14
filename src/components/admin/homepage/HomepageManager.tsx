import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, ExternalLink, LayoutTemplate, Monitor, Smartphone } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
    BlockPalette,
    MAIN_BLOCKS,
    RIGHT_BLOCKS,
    LEFT_BLOCKS,
    HEADER_BLOCKS,
    FOOTER_BLOCKS,
    ALL_BLOCKS,
    type ZoneKey,
} from './BlockPalette';
import { HomepagePreview } from './HomepagePreview';
import { MobileLayoutManager, DEFAULT_MOBILE_LAYOUT, MOBILE_AVAILABLE_BLOCKS, type MobileLayout } from './MobileLayoutManager';

interface HomepageLayout {
    header: { blocks: string[]; hidden: string[] };
    left: { blocks: string[]; hidden: string[] };
    main: { blocks: string[]; hidden: string[] };
    right: { blocks: string[]; hidden: string[] };
    footer: { blocks: string[]; hidden: string[] };
}

const DEFAULT_LAYOUT: HomepageLayout = {
    header: {
        blocks: HEADER_BLOCKS.map((b) => b.id),
        hidden: [],
    },
    left: {
        blocks: LEFT_BLOCKS.map((b) => b.id),
        hidden: [],
    },
    main: {
        blocks: ['hero', 'news', 'about'],
        hidden: [],
    },
    right: {
        blocks: ['categories', 'gallery', 'services', 'social', 'stats'],
        hidden: [],
    },
    footer: {
        blocks: FOOTER_BLOCKS.map((b) => b.id),
        hidden: [],
    },
};

const ZONE_BLOCK_MAP: Record<ZoneKey, { id: string }[]> = {
    header: HEADER_BLOCKS,
    left: LEFT_BLOCKS,
    main: MAIN_BLOCKS,
    right: RIGHT_BLOCKS,
    footer: FOOTER_BLOCKS,
};

// Backward compat: build from old keys if homepage_layout doesn't exist
const buildFromLegacy = (mainSections?: string, rightWidgets?: string): HomepageLayout => {
    let main = DEFAULT_LAYOUT.main.blocks;
    let right = DEFAULT_LAYOUT.right.blocks;

    try {
        if (mainSections) main = JSON.parse(mainSections);
    } catch { /* use default */ }
    try {
        if (rightWidgets) right = JSON.parse(rightWidgets);
    } catch { /* use default */ }

    return {
        header: { blocks: HEADER_BLOCKS.map((b) => b.id), hidden: [] },
        left: { blocks: LEFT_BLOCKS.map((b) => b.id), hidden: [] },
        main: { blocks: main, hidden: [] },
        right: { blocks: right, hidden: [] },
        footer: { blocks: FOOTER_BLOCKS.map((b) => b.id), hidden: [] },
    };
};

export const HomepageManager = () => {
    const { toast } = useToast();
    const [layout, setLayout] = useState<HomepageLayout>(DEFAULT_LAYOUT);
    const [initialLayout, setInitialLayout] = useState<HomepageLayout>(DEFAULT_LAYOUT);
    const [mobileLayout, setMobileLayout] = useState<MobileLayout>(DEFAULT_MOBILE_LAYOUT);
    const [initialMobileLayout, setInitialMobileLayout] = useState<MobileLayout>(DEFAULT_MOBILE_LAYOUT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeZone, setActiveZone] = useState<ZoneKey>('main');
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
    const [hoverSource, setHoverSource] = useState<'palette' | 'preview' | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        // Dropped on a preview zone
        if (String(over.id).startsWith('preview-zone-')) {
            const targetZone = String(over.id).replace('preview-zone-', '') as ZoneKey;
            const blockId = String(active.id);
            if (activeZone === targetZone) return;

            const sourceZoneData = layout[activeZone];
            const targetZoneData = layout[targetZone];

            setLayout({
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
            setActiveZone(targetZone);
            return;
        }

        // Reordering
        if (active.id !== over.id) {
            const zone = layout[activeZone];
            const oldIndex = zone.blocks.indexOf(String(active.id));
            const newIndex = zone.blocks.indexOf(String(over.id));
            
            if(oldIndex !== -1 && newIndex !== -1) {
                const newBlocks = arrayMove(zone.blocks, oldIndex, newIndex);
                setLayout({
                    ...layout,
                    [activeZone]: { ...zone, blocks: newBlocks },
                });
            }
        }
    };

    // Load layout from DB
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('school_settings')
                .select('key, value')
                .in('key', ['homepage_layout', 'homepage_main_sections', 'homepage_right_widgets', 'homepage_mobile_layout']);

            if (!data) {
                setLoading(false);
                return;
            }

            const map: Record<string, string> = {};
            data.forEach((r: any) => { map[r.key] = r.value; });

            let loaded: HomepageLayout;
            if (map.homepage_layout) {
                try {
                    loaded = JSON.parse(map.homepage_layout);

                    // Ensure all 5 zones exist
                    if (!loaded.header) loaded.header = { blocks: [], hidden: [] };
                    if (!loaded.main) loaded.main = { blocks: [], hidden: [] };
                    if (!loaded.right) loaded.right = { blocks: [], hidden: [] };
                    if (!loaded.left) loaded.left = { blocks: [], hidden: [] };
                    if (!loaded.footer) loaded.footer = { blocks: [], hidden: [] };

                    // Find all blocks currently ANYWHERE in the layout
                    const allCurrentBlocks = new Set([
                        ...loaded.header.blocks,
                        ...loaded.main.blocks,
                        ...loaded.right.blocks,
                        ...loaded.left.blocks,
                        ...loaded.footer.blocks,
                    ]);

                    // Inject legally missing blocks into their default zones
                    HEADER_BLOCKS.forEach(b => { if (!allCurrentBlocks.has(b.id)) loaded.header.blocks.push(b.id); });
                    MAIN_BLOCKS.forEach(b => { if (!allCurrentBlocks.has(b.id)) loaded.main.blocks.push(b.id); });
                    RIGHT_BLOCKS.forEach(b => { if (!allCurrentBlocks.has(b.id)) loaded.right.blocks.push(b.id); });
                    LEFT_BLOCKS.forEach(b => { if (!allCurrentBlocks.has(b.id)) loaded.left.blocks.push(b.id); });
                    FOOTER_BLOCKS.forEach(b => { if (!allCurrentBlocks.has(b.id)) loaded.footer.blocks.push(b.id); });

                    // Remove invalid blocks that don't exist in codebase anymore
                    const validIds = new Set(ALL_BLOCKS.map(b => b.id));
                    (Object.keys(loaded) as ZoneKey[]).forEach(zone => {
                        if (loaded[zone]) {
                            loaded[zone].blocks = loaded[zone].blocks.filter(id => validIds.has(id));
                            loaded[zone].hidden = loaded[zone].hidden.filter(id => validIds.has(id));
                        }
                    });
                } catch {
                    loaded = DEFAULT_LAYOUT;
                }
            } else {
                loaded = buildFromLegacy(map.homepage_main_sections, map.homepage_right_widgets);
            }

            setLayout(loaded);
            setInitialLayout(JSON.parse(JSON.stringify(loaded)));

            // Load mobile layout
            let loadedMobile: MobileLayout = DEFAULT_MOBILE_LAYOUT;
            if (map.homepage_mobile_layout) {
                try {
                    const parsed = JSON.parse(map.homepage_mobile_layout) as MobileLayout;
                    // Ensure all available blocks are present (inject new ones at end)
                    const existingIds = new Set(parsed.blocks);
                    const newBlocks = MOBILE_AVAILABLE_BLOCKS.filter(b => !existingIds.has(b.id)).map(b => b.id);
                    loadedMobile = { ...parsed, blocks: [...parsed.blocks, ...newBlocks] };
                } catch { /* use default */ }
            } else {
                // Auto-build from desktop layout order
                const desktopOrder = [
                    ...loaded.main.blocks,
                    ...loaded.left.blocks,
                    ...loaded.right.blocks,
                ];
                const validIds = new Set(MOBILE_AVAILABLE_BLOCKS.map(b => b.id));
                const ordered = desktopOrder.filter(id => validIds.has(id));
                const rest = MOBILE_AVAILABLE_BLOCKS.filter(b => !ordered.includes(b.id)).map(b => b.id);
                loadedMobile = { blocks: [...ordered, ...rest], hidden: [] };
            }
            setMobileLayout(loadedMobile);
            setInitialMobileLayout(JSON.parse(JSON.stringify(loadedMobile)));

            setLoading(false);
        };
        load();
    }, []);

    const hasChanges =
        JSON.stringify(layout) !== JSON.stringify(initialLayout) ||
        JSON.stringify(mobileLayout) !== JSON.stringify(initialMobileLayout);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save new format
            const { error } = await supabase
                .from('school_settings' as any)
                .upsert(
                    { key: 'homepage_layout', value: JSON.stringify(layout), category: 'display' },
                    { onConflict: 'key' }
                );

            if (error) throw error;

            // Also save legacy keys for backward compat
            await Promise.all([
                supabase.from('school_settings' as any).upsert(
                    { key: 'homepage_main_sections', value: JSON.stringify(layout.main.blocks.filter(id => !layout.main.hidden.includes(id))), category: 'display' },
                    { onConflict: 'key' }
                ),
                supabase.from('school_settings' as any).upsert(
                    { key: 'homepage_right_widgets', value: JSON.stringify(layout.right.blocks.filter(id => !layout.right.hidden.includes(id))), category: 'display' },
                    { onConflict: 'key' }
                ),
            ]);

            // Save mobile layout
            await supabase
                .from('school_settings' as any)
                .upsert(
                    { key: 'homepage_mobile_layout', value: JSON.stringify(mobileLayout), category: 'display' },
                    { onConflict: 'key' }
                );

            setInitialLayout(JSON.parse(JSON.stringify(layout)));
            setInitialMobileLayout(JSON.parse(JSON.stringify(mobileLayout)));
            toast({ title: '✅ บันทึกเรียบร้อย', description: 'หน้าแรกจะอัพเดตทันที' });
        } catch (err: any) {
            toast({ title: 'บันทึกล้มเหลว', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setLayout(JSON.parse(JSON.stringify(initialLayout)));
        setMobileLayout(JSON.parse(JSON.stringify(initialMobileLayout)));
        setSelectedBlock(null);
        toast({ title: 'คืนค่าแล้ว' });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">กำลังโหลด layout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">จัดการหน้าแรก</h1>
                        <p className="text-xs text-muted-foreground">ลากเรียงลำดับ เปิด/ปิด blocks — 5 โซน พร้อม blog components</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ดูหน้าจริง</span>
                    </a>

                    {/* Desktop/Mobile mode toggle */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('desktop')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                viewMode === 'desktop'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Desktop</span>
                        </button>
                        <button
                            onClick={() => setViewMode('mobile')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                viewMode === 'mobile'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mobile</span>
                        </button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className="gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">คืนค่า</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="gap-1.5"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        {hasChanges && (
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content: Desktop or Mobile editor */}
            {viewMode === 'desktop' ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="flex-1 flex overflow-hidden">
                        {/* Block Palette (Left Panel) */}
                        <div className="w-80 flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
                        <BlockPalette
                            layout={layout}
                            onLayoutChange={setLayout as any}
                            activeZone={activeZone}
                            onZoneChange={(zone) => {
                                setActiveZone(zone);
                                setSelectedBlock(null);
                            }}
                            selectedBlock={selectedBlock}
                            onSelectBlock={setSelectedBlock}
                            hoveredBlock={hoveredBlock}
                            hoverSource={hoverSource}
                            onHoverBlock={(id) => {
                                setHoveredBlock(id);
                                setHoverSource('palette');
                            }}
                        />
                    </div>

                    {/* Preview (Right Panel) */}
                    <div className="flex-1 overflow-hidden bg-secondary/30">
                        <HomepagePreview
                            layout={layout}
                            selectedBlock={selectedBlock}
                            onSelectBlock={setSelectedBlock}
                            activeZone={activeZone}
                            hoveredBlock={hoveredBlock}
                            hoverSource={hoverSource}
                            onHoverPreviewBlock={(id, zone) => {
                                setHoveredBlock(id);
                                setHoverSource('preview');
                                if (id && zone && zone !== activeZone) {
                                    setActiveZone(zone);
                                }
                            }}
                        />
                    </div>
                    </div>
                </DndContext>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <MobileLayoutManager
                        mobileLayout={mobileLayout}
                        onMobileLayoutChange={setMobileLayout}
                    />
                </div>
            )}
        </div>
    );
};
