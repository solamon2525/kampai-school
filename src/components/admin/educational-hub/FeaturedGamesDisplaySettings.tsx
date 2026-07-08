import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, ChevronDown, Loader2, Film } from 'lucide-react';
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

/** ตั้งค่าการแสดงผลโซน "เกมแนะนำ" หน้าแรก + จังหวะพรีวิววิดีโอบนการ์ดเกม */
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
    const [coverSec, setCoverSec] = useState('2');
    const [videoSec, setVideoSec] = useState('5');

    useEffect(() => {
        setRows(settings.featured_games_rows || '1');
        setMode(settings.featured_games_mode || 'scroll');
        setSpeed(settings.featured_games_marquee_speed || '30');
        setFadeDuration(settings.featured_games_fade_duration || '400');
        setFadeStagger(settings.featured_games_fade_stagger || '80');
        setCoverSec(settings.game_preview_cover_seconds || '2');
        setVideoSec(settings.game_preview_video_seconds || '5');
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
                { key: 'game_preview_cover_seconds', value: coverSec },
                { key: 'game_preview_video_seconds', value: videoSec },
            ];
            const { error } = await supabase
                .from('school_settings')
                .upsert(updates as never, { onConflict: 'key' });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['school-settings'] });
            localStorage.removeItem('school_settings_cache');
            toast({
                title: 'บันทึกการแสดงผลแล้ว',
                description: 'จังหวะพรีวิววิดีโอและการ์ดเกมแนะนำจะอัปเดตเมื่อรีเฟรช',
            });
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
                        🎮 การแสดงผลเกมแนะนำ + พรีวิววิดีโอการ์ด
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                    <div className="space-y-4 pt-1">
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                ตั้งค่าโซน "เกมแนะนำ" บนหน้าแรก — จำนวนแถว · รูปแบบเลื่อน · จังหวะเฟดปก
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
                        </div>

                        <div className="border-t border-border pt-3 space-y-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <Film className="h-3.5 w-3.5 text-primary" />
                                พรีวิววิดีโอบนการ์ดเกม (หน้ารวมเกม + เกมแนะนำ)
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                การ์ดที่มีคลิปเดโมจะสลับ <strong className="text-foreground">ปก ↔ วิดีโอ</strong> แบบวนซ้ำ
                                — ใช้กับทุกการ์ดที่มีอัปคลิปพรีวิวแล้ว
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1">
                                    <span className="text-xs font-medium text-foreground">โชว์ปกกี่วินาที</span>
                                    <select className={cn(SELECT_CLASS, 'w-full')} value={coverSec} onChange={(e) => setCoverSec(e.target.value)}>
                                        {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                                            <option key={n} value={String(n)}>{n} วินาที</option>
                                        ))}
                                    </select>
                                    <span className="text-[10px] text-muted-foreground">ก่อนเริ่มคลิป และระหว่างรอบสลับ</span>
                                </label>
                                <label className="space-y-1">
                                    <span className="text-xs font-medium text-foreground">โชว์วิดีโอกี่วินาที</span>
                                    <select className={cn(SELECT_CLASS, 'w-full')} value={videoSec} onChange={(e) => setVideoSec(e.target.value)}>
                                        <option value="0">เล่นค้าง (ไม่สลับกลับปก)</option>
                                        {[3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                                            <option key={n} value={String(n)}>{n} วินาที แล้วกลับปก</option>
                                        ))}
                                    </select>
                                    <span className="text-[10px] text-muted-foreground">
                                        {videoSec === '0'
                                            ? 'พฤติกรรมเดิม: เข้าจอแล้วเล่นวิดีโอลูปค้าง'
                                            : `วงจร ≈ ปก ${coverSec}วิ → วิดีโอ ${videoSec}วิ → วนซ้ำ`}
                                    </span>
                                </label>
                            </div>
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
