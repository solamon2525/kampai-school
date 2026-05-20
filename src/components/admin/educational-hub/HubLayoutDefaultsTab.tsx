/**
 * HubLayoutDefaultsTab.tsx
 *
 * Admin-only form to set the global default layout for /educational-hub.
 * Lives in EduHubManagement under tab "ค่าเริ่มต้นหน้าคลัง".
 *
 * Writes to school_settings.key='hub_layout_default' as JSON:
 *   { viewMode, columns, sort, is_locked }
 *
 * When is_locked=true, all visitors see the same layout (toolbar readonly).
 */

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock, Save, Loader2, Grid3x3, Star, Rows, AlignJustify } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { educationalHubService } from '@/services/educational-hub.service';
import type { HubViewMode, HubColumns, HubSort } from '@/hooks/useHubViewMode';

const VIEW_MODES: { value: HubViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'grid', label: 'ตาราง', icon: Grid3x3 },
    { value: 'featured', label: 'เด่นตัวแรก', icon: Star },
    { value: 'list', label: 'รายการ', icon: Rows },
    { value: 'compact', label: 'กะทัดรัด', icon: AlignJustify },
];

const SORT_LABEL: Record<HubSort, string> = {
    default: 'ลำดับตั้งต้น (admin จัด)',
    popular: 'ยอดนิยม (เรียงตามจำนวนสื่อ)',
    alpha: 'ก-ฮ / A-Z',
    newest: 'อัพเดทล่าสุด',
};

interface DBLayout {
    viewMode: HubViewMode;
    columns: HubColumns;
    sort: HubSort;
    is_locked: boolean;
}

const DEFAULT_LAYOUT: DBLayout = {
    viewMode: 'grid',
    columns: 4,
    sort: 'default',
    is_locked: false,
};

export const HubLayoutDefaultsTab = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<DBLayout>(DEFAULT_LAYOUT);
    const [saving, setSaving] = useState(false);

    // Load current
    const { data: current, isLoading } = useQuery({
        queryKey: ['school-settings', 'hub-layout-default'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.getHubLayoutDefault();
            if (error) throw error;
            const row = data as { value?: string | null } | null;
            if (!row?.value) return null;
            try {
                return JSON.parse(row.value) as DBLayout;
            } catch {
                return null;
            }
        },
    });

    useEffect(() => {
        if (current) {
            setForm({
                viewMode: current.viewMode ?? DEFAULT_LAYOUT.viewMode,
                columns: current.columns ?? DEFAULT_LAYOUT.columns,
                sort: current.sort ?? DEFAULT_LAYOUT.sort,
                is_locked: !!current.is_locked,
            });
        }
    }, [current]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await educationalHubService.saveHubLayoutDefault(form);
        setSaving(false);
        if (error) {
            toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['school-settings', 'hub-layout-default'] });
        toast({
            title: 'บันทึกสำเร็จ',
            description: form.is_locked
                ? 'ล็อกการแสดงผลแล้ว — ผู้ใช้ทุกคนจะเห็นเหมือนกัน'
                : 'บันทึกค่าเริ่มต้น — ผู้ใช้ยังสามารถปรับเองได้',
        });
    };

    const showColumns = form.viewMode === 'grid' || form.viewMode === 'featured';

    if (isLoading) {
        return <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>;
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                    <h3 className="font-bold text-foreground">ค่าเริ่มต้นการแสดงผลหน้า /educational-hub</h3>
                    <p className="text-xs text-muted-foreground">
                        กำหนดรูปแบบการแสดงผลที่ผู้ใช้ทั่วไปจะเห็นเมื่อเข้ามาครั้งแรก
                        เปิด "ล็อก" เพื่อบังคับให้ทุกคนเห็นเหมือนกัน
                    </p>
                </div>

                {/* View mode */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">รูปแบบการแสดง</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {VIEW_MODES.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setForm({ ...form, viewMode: value })}
                                className={cn(
                                    'flex items-center justify-center gap-2 h-12 rounded-md border-2 transition-colors text-sm',
                                    form.viewMode === value
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-foreground border-border hover:bg-accent',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Columns (only for grid/featured) */}
                {showColumns && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">จำนวนคอลัมน์ (desktop)</label>
                        <div className="inline-flex rounded-md border border-border overflow-hidden">
                            {([3, 4, 5, 6] as HubColumns[]).map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setForm({ ...form, columns: c })}
                                    className={cn(
                                        'h-10 px-4 text-sm font-medium transition-colors',
                                        form.columns === c
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-foreground hover:bg-accent',
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sort */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">การจัดเรียง</label>
                    <Select value={form.sort} onValueChange={(v) => setForm({ ...form, sort: v as HubSort })}>
                        <SelectTrigger className="w-full sm:w-80">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(SORT_LABEL) as HubSort[]).map((s) => (
                                <SelectItem key={s} value={s}>{SORT_LABEL[s]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Lock toggle */}
                <div className={cn(
                    'flex items-start justify-between gap-3 p-3 rounded-lg border-2 transition-colors',
                    form.is_locked ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-border',
                )}>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {form.is_locked ? (
                                <Lock className="h-4 w-4 text-amber-600" />
                            ) : (
                                <Unlock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">
                                {form.is_locked ? 'ล็อกการแสดงผล' : 'ไม่ล็อก (เป็นแค่ค่าเริ่มต้น)'}
                            </span>
                            {form.is_locked && (
                                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                                    บังคับใช้กับทุกคน
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {form.is_locked
                                ? '⚠️ ผู้ใช้ทุกคนจะเห็นรูปแบบเดียวกัน ไม่สามารถปรับเองได้ (toolbar จะถูก disable)'
                                : 'ผู้ใช้สามารถเลือกรูปแบบเองได้ — ค่าด้านบนเป็นแค่ค่าเริ่มต้นสำหรับผู้ใช้ใหม่'}
                        </p>
                    </div>
                    <Switch
                        checked={form.is_locked}
                        onCheckedChange={(v) => setForm({ ...form, is_locked: v })}
                    />
                </div>

                {/* Save */}
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    บันทึก
                </Button>
            </CardContent>
        </Card>
    );
};
