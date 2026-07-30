/**
 * GameIndicatorBatchMapper.tsx — จับคู่เกม↔ตัวชี้วัดแบบรวดเร็ว (admin support #1)
 *
 * ปัญหา: indicator_games ต้อง map ทีละเกมผ่าน GameIndicatorsDialog → ช้าถ้ามี 120+ เกม
 * ทางออก: ตารางรวม + ปุ่ม "เติมอัตโนมัติ" (heuristic = pre-select ตาม subject + grade) + save batch
 *
 * RPC: batch_set_game_indicators (migration 269) — transaction เดียว
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Wand2, Save, Search } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
    curriculumService, type CurriculumIndicator,
} from '@/services/curriculum.service';
import {
    CURRICULUM_SUBJECTS as SUBJECT_OPTIONS,
    GRADE_OPTIONS, subjectKeyFromFolder,
} from '@/lib/curriculumSubjects';

type HubMapItem = {
    id: string;
    title: string;
    subject: string | null;
    grade_levels: string[] | null;
    game_slug: string | null;
    tracked_game: boolean | null;
    external_url: string | null;
    item_type: string | null;
};

function itemKind(item: HubMapItem): 'game' | 'media' | 'worksheet' | 'other' {
    const url = item.external_url ?? '';
    if (url.includes('-worksheet.html')) return 'worksheet';
    if (item.tracked_game || item.game_slug) return 'game';
    if (url.includes('/games/') && url.includes('-media')) return 'media';
    if (item.item_type === 'youtube' || item.item_type === 'file' || item.item_type === 'link') return 'media';
    return 'other';
}

export const GameIndicatorBatchMapper = ({
    open, onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [unmappedOnly, setUnmappedOnly] = useState(false);
    const [includeMedia, setIncludeMedia] = useState(true);
    // selections: itemId → Set<indicator_id>
    const [selections, setSelections] = useState<Record<string, Set<string>>>({});
    const [saving, setSaving] = useState(false);

    // 1) published hub items (games + optional media/worksheet)
    const { data: games, isLoading: loadingGames } = useQuery({
        queryKey: ['batch-mapper-items', includeMedia],
        enabled: open,
        queryFn: async () => {
            const page = 1000;
            const out: HubMapItem[] = [];
            for (let from = 0; ; from += page) {
                let q = supabase
                    .from('educational_hub_items' as never)
                    .select('id, title, subject, grade_levels, game_slug, tracked_game, external_url, item_type')
                    .eq('is_published', true)
                    .order('title')
                    .range(from, from + page - 1);
                if (!includeMedia) {
                    q = q.eq('tracked_game', true);
                }
                const { data, error } = await q;
                if (error) throw error;
                const rows = (data as unknown as HubMapItem[]) ?? [];
                out.push(...rows);
                if (rows.length < page) break;
            }
            if (includeMedia) {
                return out.filter((i) => {
                    const k = itemKind(i);
                    return k === 'game' || k === 'media' || k === 'worksheet';
                });
            }
            return out;
        },
    });

    // 2) mapping เดิมทั้งหมด → init selections (count ด้วย)
    const { data: existingMap } = useQuery({
        queryKey: ['batch-mapper-existing'],
        enabled: open,
        queryFn: async () => {
            const page = 1000;
            const rows: { edu_hub_item_id: string; indicator_id: string }[] = [];
            for (let from = 0; ; from += page) {
                const { data, error } = await supabase
                    .from('indicator_games' as never)
                    .select('edu_hub_item_id, indicator_id')
                    .range(from, from + page - 1);
                if (error) throw error;
                const chunk = (data ?? []) as { edu_hub_item_id: string; indicator_id: string }[];
                rows.push(...chunk);
                if (chunk.length < page) break;
            }
            const m = new Map<string, Set<string>>();
            rows.forEach((r) => {
                const arr = m.get(r.edu_hub_item_id) ?? new Set<string>();
                arr.add(r.indicator_id);
                m.set(r.edu_hub_item_id, arr);
            });
            return m;
        },
    });

    useEffect(() => {
        if (existingMap) {
            const s: Record<string, Set<string>> = {};
            existingMap.forEach((set, id) => { s[id] = new Set(set); });
            setSelections(s);
        }
    }, [existingMap]);

    // 3) indicators ทั้งหมด (โหลดครั้งเดียว เก็บใน map สำหรับ lookup)
    const { data: allIndicators } = useQuery({
        queryKey: ['batch-mapper-all-indicators'],
        enabled: open,
        queryFn: async () => {
            const page = 1000;
            const arr: CurriculumIndicator[] = [];
            for (let from = 0; ; from += page) {
                const { data, error } = await supabase
                    .from('curriculum_indicators' as never)
                    .select('*')
                    .eq('is_active', true)
                    .range(from, from + page - 1);
                if (error) throw error;
                const chunk = (data as unknown as CurriculumIndicator[]) ?? [];
                arr.push(...chunk);
                if (chunk.length < page) break;
            }
            const m = new Map<string, CurriculumIndicator>();
            arr.forEach((i) => m.set(i.id, i));
            return { list: arr, map: m };
        },
    });

    // เกมที่เลือกเพื่อแก้ (active editing) — เก็บ itemId
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredGames = useMemo(() => {
        if (!games) return [];
        return games.filter((g) => {
            if (filterSubject !== 'all' && subjectKeyFromFolder(g.subject) !== filterSubject) return false;
            if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (unmappedOnly && (existingMap?.get(g.id)?.size ?? 0) > 0) return false;
            return true;
        });
    }, [games, filterSubject, search, unmappedOnly, existingMap]);

    const stats = useMemo(() => {
        if (!games || !existingMap) return { total: 0, unmapped: 0 };
        const unmapped = games.filter((g) => (existingMap.get(g.id)?.size ?? 0) === 0).length;
        return { total: games.length, unmapped };
    }, [games, existingMap]);

    // เติมอัตโนมัติ: pre-select indicators ที่ตรง subject + grade ของเกม
    const autoFill = (game: HubMapItem) => {
        if (!allIndicators) return;
        const subjKey = subjectKeyFromFolder(game.subject);
        const grade = (game.grade_levels ?? [])[0] ?? GRADE_OPTIONS[0];
        const matches = allIndicators.list.filter(
            (i) => i.subject_key === subjKey && i.grade === grade,
        ).slice(0, 6); // จำกัด 6 ตัว เพื่อให้ครูตรวจ
        setSelections((prev) => ({ ...prev, [game.id]: new Set(matches.map((m) => m.id)) }));
        setEditingId(game.id);
        toast({
            title: `เติมอัตโนมัติแล้ว (${matches.length} ตัว)`,
            description: `โปรดตรวจสอบก่อนบันทึก — ${subjKey} ${grade}`,
        });
    };

    const autoFillAllUnmapped = () => {
        if (!games || !allIndicators || !existingMap) return;
        let n = 0;
        setSelections((prev) => {
            const next = { ...prev };
            for (const g of games) {
                if ((existingMap.get(g.id)?.size ?? 0) > 0) continue;
                if ((next[g.id]?.size ?? 0) > 0) continue;
                const subjKey = subjectKeyFromFolder(g.subject);
                const grade = (g.grade_levels ?? [])[0] ?? GRADE_OPTIONS[0];
                const matches = allIndicators.list
                    .filter((i) => i.subject_key === subjKey && i.grade === grade)
                    .slice(0, 6);
                if (!matches.length) continue;
                next[g.id] = new Set(matches.map((m) => m.id));
                n += 1;
            }
            return next;
        });
        toast({
            title: n ? `เติมอัตโนมัติ ${n} รายการที่ยังว่าง` : 'ไม่มีรายการว่างให้เติม',
            description: 'ตรวจก่อนกดบันทึก',
        });
    };

    const toggle = (itemId: string, indicatorId: string) => {
        setSelections((prev) => {
            const set = new Set(prev[itemId] ?? []);
            set.has(indicatorId) ? set.delete(indicatorId) : set.add(indicatorId);
            return { ...prev, [itemId]: set };
        });
    };

    const clearAll = (itemId: string) => {
        setSelections((prev) => ({ ...prev, [itemId]: new Set() }));
    };

    const handleSave = async () => {
        // เฉพาะเกมที่มีการเปลี่ยนแปลง (มีใน selections) → ส่งทั้งหมดที่ไม่ว่าง + ที่ว่าง (เพื่อ clear)
        const changed = Object.entries(selections).filter(([id]) =>
            games?.some((g) => g.id === id),
        ).map(([edu_hub_item_id, ids]) => ({
            edu_hub_item_id,
            indicator_ids: Array.from(ids),
        }));
        if (changed.length === 0) {
            toast({ title: 'ไม่มีการเปลี่ยนแปลง' });
            return;
        }
        setSaving(true);
        try {
            const { error } = await curriculumService.batchSetGameIndicators(changed);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['batch-mapper-existing'] });
            queryClient.invalidateQueries({ queryKey: ['game-indicators'] });
            toast({ title: `บันทึกแล้ว (${changed.length} รายการ)` });
            onClose();
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
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>จับคู่สื่อ/เกม/ใบงาน ↔ ตัวชี้วัด (แบบรวดเร็ว)</DialogTitle>
                    <DialogDescription>
                        ทั้งหมด {stats.total} รายการ • ยังไม่ได้ map {stats.unmapped} —
                        ใช้ปุ่ม "เติมอัตโนมัติ" เพื่อเร่ง (heuristic จากวิชา+ระดับ) แล้วตรวจทีละรายการ
                    </DialogDescription>
                </DialogHeader>

                {/* Filter bar */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[12rem]">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหา…"
                            className="pl-8"
                        />
                    </div>
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทุกวิชา</SelectItem>
                            {SUBJECT_OPTIONS.map((s) => (
                                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        size="sm"
                        variant={unmappedOnly ? 'default' : 'outline'}
                        className="h-9 text-xs"
                        onClick={() => setUnmappedOnly((v) => !v)}
                    >
                        เฉพาะยังไม่ map
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={includeMedia ? 'default' : 'outline'}
                        className="h-9 text-xs"
                        onClick={() => setIncludeMedia((v) => !v)}
                    >
                        รวมสื่อ/ใบงาน
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-9 text-xs" onClick={autoFillAllUnmapped}>
                        <Wand2 className="w-3.5 h-3.5 mr-1" /> เติมทั้งหมดที่ว่าง
                    </Button>
                </div>

                {/* Game list */}
                <ScrollArea className="flex-1 border rounded-lg">
                    <div className="divide-y">
                        {loadingGames && (
                            <div className="p-8 flex items-center justify-center text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> กำลังโหลด…
                            </div>
                        )}
                        {!loadingGames && filteredGames.map((game) => {
                            const sel = selections[game.id] ?? new Set<string>();
                            const isEditing = editingId === game.id;
                            return (
                                <div key={game.id} className="p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm line-clamp-1">{game.title}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {itemKind(game)} · {game.subject ?? '—'} • {(game.grade_levels ?? []).join(', ') || 'ไม่ระบุชั้น'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0">
                                            {sel.size} ตัวชี้วัด
                                        </Badge>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => autoFill(game)}
                                            title="เติมตัวชี้วัดที่ตรงวิชา+ระดับชั้นอัตโนมัติ"
                                        >
                                            <Wand2 className="w-3.5 h-3.5 mr-1" /> เติมอัตโนมัติ
                                        </Button>
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => setEditingId(isEditing ? null : game.id)}
                                        >
                                            {isEditing ? 'ปิด' : 'แก้'}
                                        </Button>
                                    </div>

                                    {isEditing && allIndicators && (
                                        <GameIndicatorEditor
                                            game={game}
                                            selected={sel}
                                            onToggle={(id) => toggle(game.id, id)}
                                            onClear={() => clearAll(game.id)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {!loadingGames && filteredGames.length === 0 && (
                            <div className="p-8 text-center text-sm text-muted-foreground">ไม่พบรายการตามตัวกรอง</div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        บันทึกทั้งหมด
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Editor ของเกมเดียว — เลือกวิชา+ระดับ แล้ว checkbox ตัวชี้วัด ─────────────────
const GameIndicatorEditor = ({
    game, selected, onToggle, onClear,
}: {
    game: HubMapItem;
    selected: Set<string>;
    onToggle: (id: string) => void;
    onClear: () => void;
}) => {
    const [subjectKey, setSubjectKey] = useState(subjectKeyFromFolder(game.subject));
    const [grade, setGrade] = useState((game.grade_levels ?? [])[0] ?? GRADE_OPTIONS[0]);

    const { data: indicators, isLoading } = useQuery({
        queryKey: ['curriculum-indicators', subjectKey, grade],
        queryFn: async () => {
            const { data, error } = await curriculumService.listIndicators(subjectKey, grade);
            if (error) throw error;
            return (data as unknown as CurriculumIndicator[]) ?? [];
        },
    });

    return (
        <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
            <div className="flex gap-2 items-center">
                <Select value={subjectKey} onValueChange={setSubjectKey}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {SUBJECT_OPTIONS.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-8 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selected.size > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>ล้าง</Button>
                )}
            </div>
            {isLoading ? (
                <p className="text-xs text-muted-foreground py-2"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> กำลังโหลดตัวชี้วัด…</p>
            ) : (indicators ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">ไม่มีตัวชี้วัดสำหรับ {subjectKey} {grade}</p>
            ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                    {(indicators ?? []).map((ind) => {
                        const checked = selected.has(ind.id);
                        return (
                            <label
                                key={ind.id}
                                className={cn(
                                    'flex items-start gap-2 p-1.5 rounded cursor-pointer hover:bg-background',
                                    checked && 'bg-background',
                                )}
                            >
                                <Checkbox checked={checked} onCheckedChange={() => onToggle(ind.id)} className="mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs">{ind.description}</p>
                                    <p className="text-[10px] text-muted-foreground">{ind.indicator_code}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
