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
        external_url: string | null;
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
            .select('id, pack_id, edu_hub_item_id, role, sort_order, educational_hub_items(id, title, external_url, thumbnail_url, subject, grade_levels)')
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
        const byPack = new Map<string, LessonPackItem[]>();
        for (const r of (data as unknown as Row[]) ?? []) {
            const list = byPack.get(r.pack_id) ?? [];
            list.push({
                id: r.id,
                pack_id: r.pack_id,
                edu_hub_item_id: r.edu_hub_item_id,
                role: r.role,
                sort_order: r.sort_order,
                item: r.educational_hub_items,
            });
            byPack.set(r.pack_id, list);
        }
        return packs.map((p) => ({ ...p, items: byPack.get(p.id) ?? [] }));
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
