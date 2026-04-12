import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, ExternalLink, LayoutTemplate, Eye } from 'lucide-react';
import { BlockPalette, MAIN_BLOCKS, RIGHT_BLOCKS, LEFT_BLOCKS } from './BlockPalette';
import { HomepagePreview } from './HomepagePreview';

type ZoneKey = 'left' | 'main' | 'right';

interface HomepageLayout {
    left: { blocks: string[]; hidden: string[] };
    main: { blocks: string[]; hidden: string[] };
    right: { blocks: string[]; hidden: string[] };
}

const DEFAULT_LAYOUT: HomepageLayout = {
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
        left: { blocks: LEFT_BLOCKS.map((b) => b.id), hidden: [] },
        main: { blocks: main, hidden: [] },
        right: { blocks: right, hidden: [] },
    };
};

export const HomepageManager = () => {
    const { toast } = useToast();
    const [layout, setLayout] = useState<HomepageLayout>(DEFAULT_LAYOUT);
    const [initialLayout, setInitialLayout] = useState<HomepageLayout>(DEFAULT_LAYOUT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeZone, setActiveZone] = useState<ZoneKey>('main');
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

    // Load layout from DB
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('school_settings')
                .select('key, value')
                .in('key', ['homepage_layout', 'homepage_main_sections', 'homepage_right_widgets']);

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
                    // Ensure all block IDs exist
                    const ensureBlocks = (zone: ZoneKey, defs: { id: string }[]) => {
                        const allIds = defs.map((d) => d.id);
                        allIds.forEach((id) => {
                            if (!loaded[zone].blocks.includes(id)) {
                                loaded[zone].blocks.push(id);
                            }
                        });
                        loaded[zone].blocks = loaded[zone].blocks.filter((id) => allIds.includes(id));
                    };
                    ensureBlocks('main', MAIN_BLOCKS);
                    ensureBlocks('right', RIGHT_BLOCKS);
                    ensureBlocks('left', LEFT_BLOCKS);
                } catch {
                    loaded = DEFAULT_LAYOUT;
                }
            } else {
                loaded = buildFromLegacy(map.homepage_main_sections, map.homepage_right_widgets);
            }

            setLayout(loaded);
            setInitialLayout(JSON.parse(JSON.stringify(loaded)));
            setLoading(false);
        };
        load();
    }, []);

    const hasChanges = JSON.stringify(layout) !== JSON.stringify(initialLayout);

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

            setInitialLayout(JSON.parse(JSON.stringify(layout)));
            toast({ title: '✅ บันทึกเรียบร้อย', description: 'หน้าแรกจะอัพเดตทันที' });
        } catch (err: any) {
            toast({ title: 'บันทึกล้มเหลว', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setLayout(JSON.parse(JSON.stringify(initialLayout)));
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
                        <p className="text-xs text-muted-foreground">ลากเรียงลำดับ เปิด/ปิด blocks ดู preview แบบ real-time</p>
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

            {/* Main Content: Palette + Preview */}
            <div className="flex-1 flex overflow-hidden">
                {/* Block Palette (Left Panel) */}
                <div className="w-80 flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
                    <BlockPalette
                        layout={layout}
                        onLayoutChange={setLayout}
                        activeZone={activeZone}
                        onZoneChange={(zone) => {
                            setActiveZone(zone);
                            setSelectedBlock(null);
                        }}
                        selectedBlock={selectedBlock}
                        onSelectBlock={setSelectedBlock}
                    />
                </div>

                {/* Preview (Right Panel) */}
                <div className="flex-1 overflow-hidden bg-secondary/30">
                    <HomepagePreview
                        layout={layout}
                        selectedBlock={selectedBlock}
                        onSelectBlock={setSelectedBlock}
                        activeZone={activeZone}
                    />
                </div>
            </div>
        </div>
    );
};
