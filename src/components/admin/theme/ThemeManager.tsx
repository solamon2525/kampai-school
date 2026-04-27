import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DEFAULT_THEME, THEME_GROUPS, THEME_LABELS, type ThemeColors } from '@/lib/themeDefaults';
import { ColorTokenInput } from './ColorTokenInput';
import { ThemePreview } from './ThemePreview';
import { useToast } from '@/hooks/use-toast';

/**
 * ThemeManager — single page for editing the site's color palette.
 *
 * Layout (desktop): two columns — color inputs on the left, live preview on the right.
 * Mobile: stacked, preview pinned to top so user sees changes while scrolling.
 *
 * State flow:
 *   useThemeColors → loads from school_settings → seeds local `draft` state
 *   ColorTokenInput onChange → updates draft only (preview reflects immediately)
 *   Save → mutation persists to DB → invalidates query → RuntimeThemeStyles re-applies
 */
const PAIR_BG: Partial<Record<keyof ThemeColors, keyof ThemeColors>> = {
    'primary-foreground': 'primary',
    'secondary-foreground': 'secondary',
    'accent-foreground': 'accent',
    'muted-foreground': 'muted',
    foreground: 'background',
    primary: 'primary-foreground',
    secondary: 'secondary-foreground',
    accent: 'accent-foreground',
};

export const ThemeManager = () => {
    const { theme, save, saving, loading } = useThemeColors();
    const { toast } = useToast();
    const [draft, setDraft] = useState<ThemeColors>(theme);
    const [dirty, setDirty] = useState(false);

    // Seed/refresh draft when DB-loaded theme changes (e.g. first fetch, or after Save)
    useEffect(() => {
        setDraft(theme);
        setDirty(false);
    }, [theme]);

    const updateField = (key: keyof ThemeColors, value: string) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const resetAll = () => {
        setDraft({ ...DEFAULT_THEME });
        setDirty(true);
    };

    const handleSave = async () => {
        try {
            await save(draft);
            toast({
                title: 'บันทึกธีมสำเร็จ',
                description: 'สีใหม่จะใช้กับเว็บทั้งหมดทันที',
            });
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                ธีมสีของเว็บไซต์
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                จุดเดียวจัดการสีทั้งเว็บ — เปลี่ยนสีหลัก สีรอง พื้นหลัง ตัวอักษร
                                และสังเกตผลทันทีในตัวอย่างด้านขวา
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetAll}
                                disabled={loading || saving}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                คืนค่าเริ่มต้น
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!dirty || loading || saving}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                บันทึก
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Color inputs */}
                <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
                    {THEME_GROUPS.map((group) => (
                        <Card key={group.title}>
                            <CardHeader>
                                <CardTitle className="text-base">{group.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {group.keys.map((key) => {
                                    const meta = THEME_LABELS[key];
                                    const pair = PAIR_BG[key];
                                    return (
                                        <ColorTokenInput
                                            key={key}
                                            id={`color-${key}`}
                                            label={meta.label}
                                            description={meta.desc}
                                            value={draft[key]}
                                            defaultValue={DEFAULT_THEME[key]}
                                            contrastWith={pair ? draft[pair] : undefined}
                                            onChange={(next) => updateField(key, next)}
                                        />
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}

                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <strong>เคล็ดลับ:</strong> สีหลัก (Primary) ควรเป็นสีเขียวเข้มสะท้อนสีประจำโรงเรียน
                                — ใช้กับ navbar, header, ปุ่มสำคัญ ตัวเลข contrast ที่ขึ้นข้างป้ายชื่อสี
                                บอกความตัดของสีคู่นั้น (≥ 4.5:1 = อ่านสบาย ผ่าน WCAG AA)
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Live preview (sticky on desktop) */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                    <div className="lg:sticky lg:top-20">
                        <Card>
                            <CardContent className="pt-6">
                                <ThemePreview theme={draft} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeManager;
