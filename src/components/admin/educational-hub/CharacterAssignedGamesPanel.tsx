import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { characterSheetsService } from '@/services/educational-hub.service';
import {
    GAME_PLAY_STYLE_OPTIONS,
    gamePlayStyleLabel,
    type GamePlayStyleKey,
} from '@/lib/game-play-style';
import { cn } from '@/lib/utils';

type AssignedGame = {
    id: string;
    title: string;
    game_slug: string | null;
    game_play_style: string | null;
};

type Props = {
    sheetId: string;
    className?: string;
};

export function CharacterAssignedGamesPanel({ sheetId, className }: Props) {
    const { data: games, isLoading } = useQuery({
        queryKey: ['character-sheet-games', sheetId],
        queryFn: async () => {
            const { data, error } = await characterSheetsService.listAssignedGames(sheetId);
            if (error) throw error;
            return (data ?? []) as AssignedGame[];
        },
    });

    const grouped = useMemo(() => {
        const list = games ?? [];
        const buckets = new Map<string, AssignedGame[]>();
        for (const g of list) {
            const key = g.game_play_style ?? '__unset__';
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(g);
        }
        const order: string[] = [
            ...GAME_PLAY_STYLE_OPTIONS.map((o) => o.key),
            '__unset__',
        ];
        return order
            .filter((k) => (buckets.get(k)?.length ?? 0) > 0)
            .map((k) => ({ key: k, games: buckets.get(k)! }));
    }, [games]);

    if (isLoading) {
        return <p className={cn('text-xs text-muted-foreground', className)}>กำลังโหลดเกมที่ใช้ตัวละครนี้…</p>;
    }

    if (!games?.length) {
        return (
            <div className={cn('rounded-md border border-dashed border-border px-3 py-2', className)}>
                <p className="text-xs text-muted-foreground">
                    ยังไม่มีเกมผูกตัวละครนี้ — ไปที่การ์ดเกม → <strong>ตั้งค่า</strong> → เลือกตัวละครในคลัง
                </p>
            </div>
        );
    }

    return (
        <div className={cn('rounded-md border border-border px-3 py-2 space-y-2', className)}>
            <p className="text-xs font-medium text-muted-foreground">
                🎯 เกมที่ใช้ตัวละครนี้ ({games.length})
            </p>
            {grouped.map(({ key, games: groupGames }) => (
                <div key={key}>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        {key === '__unset__' ? 'ยังไม่ระบุแนว' : gamePlayStyleLabel(key as GamePlayStyleKey)}
                    </p>
                    <ul className="space-y-0.5">
                        {groupGames.map((g) => (
                            <li key={g.id} className="text-xs text-foreground flex items-center gap-2">
                                <span className="truncate">{g.title}</span>
                                {g.game_slug && (
                                    <span className="text-[10px] text-muted-foreground shrink-0">{g.game_slug}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
