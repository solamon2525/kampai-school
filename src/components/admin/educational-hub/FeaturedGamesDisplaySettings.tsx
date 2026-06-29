import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const SELECT_CLASS =
    'flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const MODE_LABELS: Record<string, string> = {
    scroll: 'เลื่อนเอง (snap)',
    marquee: 'เลื่อนอัตโนมัติ ขวา→ซ้าย (โชว์เคส)',
    grid: 'กริดนิ่ง',
};

/** ตั้งค่าการแสดงผลโซน "เกมแนะนำ" หน้าแรก — เก็บใน school_settings (key-value) */
export function FeaturedGamesDisplaySettings() {
    const { settings } = useSchoolSettings();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [rows, setRows] = useState('1');
    const [mode, setMode] = useState('scroll');
    const [speed, setSpeed] = useState('30');
    const [fadeDuration, setFadeDuration] = useState('400');
    const [fadeStagger, setFadeStagger] = useState('80');

    // sync จากค่าที่โหลดมา (settings อาจมาทีหลัง cache/default)
    useEffect(() => {
        setRows(settings.featured_games_rows || '1');
        setMode(settings.featured_games_mode || 'scroll');
        setSpeed(settings.featured_games_marquee_speed || '30');
        setFadeDuration(settings.featured_games_fade_duration || '400');
        setFadeStagger(settings.featured_games_fade_stagger || '80');
    }, [settings]);

    const save = async () => {
        setSaving(true);
        try {
            const updates: { key: string; value: string }[] = [
                { key: 'featured_games_rows', value: rows },
                { key: 'featured_games_mode', value: mode },
                { key: 'featured_games_marquee_speed', value: speed },
                { key: 'featured_games_fade_duration', value: fadeDuration },
                { key: 'featured_games_fade_stagger', value: fadeStagger },
            ];
            const { error } = await supabase
                .from('school_settings')
                .upsert(updates as never, { onConflict: 'key' });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['school-settings'] });
            localStorage.removeItem('school_settings_cache');
            toast({ title: 'บันทึกการแสดงผลเกมแนะนำแล้ว', description: 'หน้าแรกจะอัปเดตเมื่อรีเฟรช' });
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                        🎮 การแสดงผลโซน "เกมแนะนำ" หน้าแรก
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                    <div className="space-y-3 pt-1">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            ตั้งค่าการแสดงผลของเกมที่ปักหมุด "หน้าแรก" — จำนวนแถว, รูปแบบการเลื่อน,
                            และจังหวะการเฟดเข้าของปกเกม
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1">
                                <span className="text-xs font-medium text-foreground">จำนวนแถว</span>
                                <select className={cn(SELECT_CLASS, 'w-full')} value={rows} onChange={(e) => setRows(e.target.value)}>
                                    <option value="1">1 แถว</option>
                                    <option value="2">2 แถว</option>
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-foreground">รูปแบบการแสดง</span>
                                <select className={cn(SELECT_CLASS, 'w-full')} value={mode} onChange={(e) => setMode(e.target.value)}>
                                    {Object.entries(MODE_LABELS).map(([v, label]) => (
                                        <option key={v} value={v}>{label}</option>
                                    ))}
                                </select>
                            </label>

                            {mode === 'marquee' && (
                                <label className="space-y-1">
                                    <span className="text-xs font-medium text-foreground">ความเร็วเลื่อน (วินาที/รอบ)</span>
                                    <select className={cn(SELECT_CLASS, 'w-full')} value={speed} onChange={(e) => setSpeed(e.target.value)}>
                                        {[15, 20, 25, 30, 40, 50, 60].map((n) => (
                                            <option key={n} value={String(n)}>{n} วินาที</option>
                                        ))}
                                    </select>
                                    <span className="text-[10px] text-muted-foreground">ยิ่งน้อย = เลื่อนเร็ว</span>
                                </label>
                            )}

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-foreground">เวลาเฟดปก (ms)</span>
                                <select className={cn(SELECT_CLASS, 'w-full')} value={fadeDuration} onChange={(e) => setFadeDuration(e.target.value)}>
                                    {[200, 300, 400, 500, 700, 1000].map((n) => (
                                        <option key={n} value={String(n)}>{n} ms</option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-foreground">ความหน่วงระหว่างใบ (ms)</span>
                                <select className={cn(SELECT_CLASS, 'w-full')} value={fadeStagger} onChange={(e) => setFadeStagger(e.target.value)}>
                                    {[0, 40, 60, 80, 120, 160, 200].map((n) => (
                                        <option key={n} value={String(n)}>{n} ms</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <Button size="sm" onClick={save} disabled={saving}>
                                {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                                บันทึกการแสดงผล
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
