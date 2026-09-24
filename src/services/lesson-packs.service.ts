/**
 * lesson-packs.service.ts — ชุดเรียน (media + worksheet bundles)
 * Tables: lesson_packs / lesson_pack_items (migration 435)
 */
import { supabase } from '@/integrations/supabase/client';

export type LessonPackItemRole = 'media' | 'worksheet' | 'game';

export type LessonPackItem = {
    id: string;
    pack_id: string;
    edu_hub_item_id: string;
    role: LessonPackItemRole;
    sort_order: number;
    item?: {
        id: string;
        title: string;
        item_type: string;
        external_url: string | null;
        file_url: string | null;
        game_slug: string | null;
        tracked_game: boolean;
        thumbnail_url: string | null;
        subject: string | null;
        grade_levels: string[] | null;
    } | null;
};

export type LessonPack = {
    id: string;
    pack_key: string;
    title: string;
    description: string | null;
    subject: string | null;
    grade_levels: string[];
    thumbnail_url: string | null;
    sort_order: number;
    is_published: boolean;
    owner_staff_id: string | null;
    phase_tag: string | null;
    items?: LessonPackItem[];
};

export type LessonPackSummary = {
    count: number;
    owner: {
        id: string;
        name: string;
        photo_url: string | null;
        username: string | null;
    } | null;
};

/** One public media card plus every classroom resource linked to it. */
export type TeachingMediaUnit = {
    mediaItemId: string;
    pack: LessonPack;
    worksheets: LessonPackItem[];
    games: LessonPackItem[];
};

export type TeachingMediaUnitInput = {
    packId?: string | null;
    mediaItemId: string;
    ownerStaffId: string;
    title: string;
    description?: string | null;
    subject?: string | null;
    gradeLevels: string[];
    thumbnailUrl?: string | null;
    worksheetItemIds: string[];
    gameItemIds: string[];
    isPublished: boolean;
};

function toPackItems(rows: Array<{
    id: string;
    pack_id: string;
    edu_hub_item_id: string;
    role: LessonPackItemRole;
    sort_order: number;
    educational_hub_items: LessonPackItem['item'];
}>): Map<string, LessonPackItem[]> {
    const byPack = new Map<string, LessonPackItem[]>();
    for (const row of rows) {
        const list = byPack.get(row.pack_id) ?? [];
        list.push({
            id: row.id,
            pack_id: row.pack_id,
            edu_hub_item_id: row.edu_hub_item_id,
            role: row.role,
            sort_order: row.sort_order,
            item: row.educational_hub_items,
        });
        byPack.set(row.pack_id, list);
    }
    return byPack;
}

/** Parse ชั้นจาก class label เช่น "ป.4/1" → "ป.4" */
export function gradeFromClassLabel(cls: string | null | undefined): string | null {
    if (!cls) return null;
    const m = String(cls).match(/ป\.\s*[1-6]/);
    return m ? m[0].replace(/\s+/g, '') : null;
}

export const lessonPacksService = {
    listPublished: async (opts?: {
        grade?: string | null;
        limit?: number;
        ownerStaffId?: string | null;
    }): Promise<LessonPack[]> => {
        let q = supabase
            .from('lesson_packs' as never)
            .select('*')
            .eq('is_published', true)
            .order('sort_order', { ascending: true });
        if (opts?.ownerStaffId) q = q.eq('owner_staff_id', opts.ownerStaffId);
        if (opts?.limit) q = q.limit(opts.limit);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data as unknown as LessonPack[]) ?? [];
        if (!opts?.grade) return rows;
        return rows.filter(
            (p) => !p.grade_levels?.length || p.grade_levels.includes(opts.grade!),
        );
    },

    listPublishedWithItems: async (opts?: {
        grade?: string | null;
        limit?: number;
        ownerStaffId?: string | null;
    }): Promise<LessonPack[]> => {
        const packs = await lessonPacksService.listPublished(opts);
        if (packs.length === 0) return [];
        const ids = packs.map((p) => p.id);
        const { data, error } = await supabase
            .from('lesson_pack_items' as never)
            .select('id, pack_id, edu_hub_item_id, role, sort_order, educational_hub_items(id, title, item_type, external_url, file_url, game_slug, tracked_game, thumbnail_url, subject, grade_levels)')
            .in('pack_id', ids)
            .order('sort_order', { ascending: true });
        if (error) throw error;

        type Row = {
            id: string;
            pack_id: string;
            edu_hub_item_id: string;
            role: LessonPackItemRole;
            sort_order: number;
            educational_hub_items: LessonPackItem['item'];
        };
        const byPack = toPackItems((data as unknown as Row[]) ?? []);
        return packs.map((p) => ({ ...p, items: byPack.get(p.id) ?? [] }));
    },

    /** Resolve lesson packs into resources attached to each visible media card. */
    listTeachingUnitsForMediaIds: async (
        mediaItemIds: string[],
        ownerStaffId?: string | null,
    ): Promise<Map<string, TeachingMediaUnit>> => {
        const result = new Map<string, TeachingMediaUnit>();
        if (mediaItemIds.length === 0) return result;

        const packs = await lessonPacksService.listPublishedWithItems({ ownerStaffId });
        const visibleIds = new Set(mediaItemIds);
        for (const pack of packs) {
            const mediaItems = (pack.items ?? []).filter(
                (item) => item.role === 'media' && visibleIds.has(item.edu_hub_item_id),
            );
            for (const media of mediaItems) {
                const previous = result.get(media.edu_hub_item_id);
                const worksheets = (pack.items ?? []).filter((item) => item.role === 'worksheet');
                const games = (pack.items ?? []).filter((item) => item.role === 'game');
                if (previous) {
                    const worksheetIds = new Set(previous.worksheets.map((item) => item.edu_hub_item_id));
                    const gameIds = new Set(previous.games.map((item) => item.edu_hub_item_id));
                    previous.worksheets.push(...worksheets.filter((item) => !worksheetIds.has(item.edu_hub_item_id)));
                    previous.games.push(...games.filter((item) => !gameIds.has(item.edu_hub_item_id)));
                } else {
                    result.set(media.edu_hub_item_id, {
                        mediaItemId: media.edu_hub_item_id,
                        pack,
                        worksheets,
                        games,
                    });
                }
            }
        }
        return result;
    },

    /** Owner/admin editor lookup; includes draft packs. */
    getTeachingUnitForMedia: async (mediaItemId: string): Promise<TeachingMediaUnit | null> => {
        const { data: links, error: linkError } = await supabase
            .from('lesson_pack_items' as never)
            .select('pack_id')
            .eq('edu_hub_item_id', mediaItemId)
            .eq('role', 'media')
            .limit(1);
        if (linkError) throw linkError;
        const packId = ((links ?? []) as Array<{ pack_id: string }>)[0]?.pack_id;
        if (!packId) return null;

        const [{ data: packData, error: packError }, { data: itemData, error: itemError }] = await Promise.all([
            supabase.from('lesson_packs' as never).select('*').eq('id', packId).single(),
            supabase
                .from('lesson_pack_items' as never)
                .select('id, pack_id, edu_hub_item_id, role, sort_order, educational_hub_items(id, title, item_type, external_url, file_url, game_slug, tracked_game, thumbnail_url, subject, grade_levels)')
                .eq('pack_id', packId)
                .order('sort_order', { ascending: true }),
        ]);
        if (packError) throw packError;
        if (itemError) throw itemError;

        type Row = {
            id: string;
            pack_id: string;
            edu_hub_item_id: string;
            role: LessonPackItemRole;
            sort_order: number;
            educational_hub_items: LessonPackItem['item'];
        };
        const items = toPackItems((itemData as unknown as Row[]) ?? []).get(packId) ?? [];
        const pack = { ...(packData as unknown as LessonPack), items };
        return {
            mediaItemId,
            pack,
            worksheets: items.filter((item) => item.role === 'worksheet'),
            games: items.filter((item) => item.role === 'game'),
        };
    },

    /** Save a complete unit in one database transaction (migration 501 RPC). */
    saveTeachingUnit: async (input: TeachingMediaUnitInput): Promise<string> => {
        const { data, error } = await supabase.rpc('save_teaching_media_unit' as never, {
            p_pack_id: input.packId ?? null,
            p_media_item_id: input.mediaItemId,
            p_owner_staff_id: input.ownerStaffId,
            p_title: input.title,
            p_description: input.description ?? null,
            p_subject: input.subject ?? null,
            p_grade_levels: input.gradeLevels,
            p_thumbnail_url: input.thumbnailUrl ?? null,
            p_worksheet_item_ids: input.worksheetItemIds,
            p_game_item_ids: input.gameItemIds,
            p_is_published: input.isPublished,
        } as never);
        if (error) throw error;
        return data as unknown as string;
    },

    /** Published worksheets filtered by grade (for parent home worksheets page) */
    listWorksheetsForGrade: async (grade: string | null): Promise<Array<{
        id: string;
        title: string;
        description: string | null;
        external_url: string | null;
        thumbnail_url: string | null;
        subject: string | null;
        grade_levels: string[] | null;
    }>> => {
        const { data: cat } = await supabase
            .from('educational_hub_categories' as never)
            .select('id')
            .eq('category_key', 'worksheets')
            .eq('is_active', true)
            .maybeSingle();
        const catId = (cat as { id: string } | null)?.id;
        if (!catId) return [];

        const { data, error } = await supabase
            .from('educational_hub_items' as never)
            .select('id, title, description, external_url, thumbnail_url, subject, grade_levels')
            .eq('category_id', catId)
            .eq('is_published', true)
            .order('sort_order', { ascending: true })
            .limit(200);
        if (error) throw error;
        const rows = (data as unknown as Array<{
            id: string;
            title: string;
            description: string | null;
            external_url: string | null;
            thumbnail_url: string | null;
            subject: string | null;
            grade_levels: string[] | null;
        }>) ?? [];
        if (!grade) return rows;
        return rows.filter(
            (r) => !r.grade_levels?.length || r.grade_levels.includes(grade),
        );
    },

    /** Compact public-hub entry point: total packs + creator identity in one request. */
    getPublishedSummary: async (): Promise<LessonPackSummary> => {
        const { data, count, error } = await supabase
            .from('lesson_packs' as never)
            .select('owner_staff_id, staff!lesson_packs_owner_staff_id_fkey(id, name, photo_url, username)', {
                count: 'exact',
            })
            .eq('is_published', true)
            .order('sort_order', { ascending: true })
            .limit(1);
        if (error) throw error;
        type SummaryRow = {
            owner_staff_id: string | null;
            staff: LessonPackSummary['owner'];
        };
        const row = ((data as unknown as SummaryRow[] | null) ?? [])[0];
        return { count: count ?? 0, owner: row?.staff ?? null };
    },

    /** Phase 16 ops + owner-scoped teacher hub count. */
    countPublished: async (ownerStaffId?: string | null): Promise<number> => {
        let q = supabase
            .from('lesson_packs' as never)
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);
        if (ownerStaffId) q = q.eq('owner_staff_id', ownerStaffId);
        const { count, error } = await q;
        if (error) throw error;
        return count ?? 0;
    },
};
