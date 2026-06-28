import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { characterSheetsService, type CharacterSheet } from '@/services/educational-hub.service';
import {
    gamePlayStyleLabel,
    type GamePlayStyleKey,
} from '@/lib/game-play-style';
import { isCharacterSupportedGame } from '@/lib/character-animation';
import { cn } from '@/lib/utils';

type AssignableGame = {
    id: string;
    title: string;
    game_slug: string | null;
    game_play_style: string | null;
    character_sheet_id: string | null;
};

type Props = {
    sheet: CharacterSheet;
    playStyleFilter?: GamePlayStyleKey[];
    className?: string;
    onAssignedSlugsChange?: (slugs: string[]) => void;
};

const DEFAULT_FILTER: GamePlayStyleKey[] = ['platformer-2d', 'top-down', 'jump'];

export function CharacterGameAssignPanel({
    sheet,
    playStyleFilter = DEFAULT_FILTER,
    className,
    onAssignedSlugsChange,
}: Props) {
    const queryClient = useQueryClient();
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);

    const { data: assignable, isLoading: loadingAll } = useQuery({
        queryKey: ['character-assignable-games'],
        queryFn: async () => {
            const { data, error } = await characterSheetsService.listAssignableGames();
            if (error) throw error;
            return (data ?? []) as AssignableGame[];
        },
    });

    const { data: assigned, isLoading: loadingAssigned } = useQuery({
        queryKey: ['character-sheet-games', sheet.id],
        queryFn: async () => {
            const { data, error } = await characterSheetsService.listAssignedGames(sheet.id);
            if (error) throw error;
            return (data ?? []) as AssignableGame[];
        },
    });

    useEffect(() => {
        if (assigned) {
            setChecked(new Set(assigned.map((g) => g.id)));
            setDirty(false);
        }
    }, [assigned, sheet.id]);

    const filtered = useMemo(() => {
        const list = assignable ?? [];
        return list.filter((g) => {
            const style = g.game_play_style as GamePlayStyleKey | null;
            return style && playStyleFilter.includes(style);
        });
    }, [assignable, playStyleFilter]);

    const grouped = useMemo(() => {
        const buckets = new Map<string, AssignableGame[]>();
        for (const g of filtered) {
            const key = g.game_play_style ?? '__unset__';
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(g);
        }
        return playStyleFilter
            .filter((k) => (buckets.get(k)?.length ?? 0) > 0)
            .map((k) => ({ key: k, games: buckets.get(k)! }));
    }, [filtered, playStyleFilter]);

    useEffect(() => {
        if (!onAssignedSlugsChange || !assignable) return;
        const slugs = [...checked]
            .map((id) => assignable.find((g) => g.id === id)?.game_slug)
            .filter((s): s is string => Boolean(s));
        onAssignedSlugsChange(slugs);
    }, [checked, assignable, onAssignedSlugsChange]);

    const toggle = (id: string) => {
        setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setDirty(true);
    };

    const handleSave = async () => {
        setBusy(true);
        try {
            const { error } = await characterSheetsService.syncGameAssignments(
                sheet.id,
                [...checked],
                sheet,
            );
            if (error) throw error;
            setDirty(false);
            queryClient.invalidateQueries({ queryKey: ['character-sheet-games', sheet.id] });
            queryClient.invalidateQueries({ queryKey: ['character-assignable-games'] });
            queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
        } finally {
            setBusy(false);
        }
    };

    const isLoading = loadingAll || loadingAssigned;

    return (
        <div className={cn('rounded-md border border-border px-3 py-2 space-y-2', className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                    🎮 ผูกเกมจากคลัง ({checked.size})
                </p>
                {dirty && (
                    <Button type="button" size="sm" className="h-7 text-xs" disabled={busy} onClick={handleSave}>
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" /> บันทึกการผูก</>}
                    </Button>
                )}
            </div>
            {isLoading ? (
                <p className="text-xs text-muted-foreground">กำลังโหลดรายการเกม…</p>
            ) : grouped.length === 0 ? (
                <p className="text-xs text-muted-foreground">ไม่มีเกมแนวที่เลือกในระบบ</p>
            ) : (
                grouped.map(({ key, games }) => (
                    <div key={key}>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                            {gamePlayStyleLabel(key as GamePlayStyleKey)}
                        </p>
                        <ul className="space-y-1">
                            {games.map((g) => {
                                const live = isCharacterSupportedGame(g.game_slug);
                                const taken = g.character_sheet_id && g.character_sheet_id !== sheet.id;
                                return (
                                    <li key={g.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`assign-${g.id}`}
                                            checked={checked.has(g.id)}
                                            onCheckedChange={() => toggle(g.id)}
                                            disabled={Boolean(taken)}
                                        />
                                        <label
                                            htmlFor={`assign-${g.id}`}
                                            className={cn(
                                                'text-xs flex-1 min-w-0 cursor-pointer',
                                                taken && 'opacity-50',
                                            )}
                                        >
                                            <span className="truncate">{g.title}</span>
                                            {g.game_slug && (
                                                <span className="text-[10px] text-muted-foreground ml-1">
                                                    {g.game_slug}
                                                    {live ? ' · live' : ' · assign-only'}
                                                </span>
                                            )}
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))
            )}
            <p className="text-[10px] text-muted-foreground">
                live = เกมโหลด sprite ได้ · assign-only = ผูกได้แต่ยังไม่ integrate โค้ด
            </p>
        </div>
    );
}
