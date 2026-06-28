/**
 * educational-hub.service.ts
 * Supabase queries สำหรับ Educational Hub — categories, profiles, items + counter RPCs
 */
import { supabase } from '@/integrations/supabase/client';
import { getCharacterAnimPreset, type CharacterAnimationConfig } from '@/lib/character-animation';
import { type CharacterColorConfig } from '@/lib/character-color';

export type EduHubItemType = 'file' | 'link' | 'youtube' | 'text';

export type EduHubCategory = {
    id: string;
    category_key: string;
    name: string;
    description: string | null;
    icon_name: string;
    color_class: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type EduHubProfile = {
    staff_id: string;
    banner_url: string | null;
    hub_bio: string | null;
    accent_color: string | null;
    external_url: string | null;
    is_hub_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export type EduHubItem = {
    id: string;
    owner_staff_id: string;
    category_id: string;
    item_type: EduHubItemType;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    preview_video_url: string | null;  // คลิปเดโมสั้น (mp4/webm) — เล่นอัตโนมัติบนการ์ดหน้ารวมเกม (migration 241)
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    file_mime: string | null;
    external_url: string | null;
    youtube_id: string | null;
    body_html: string | null;
    tags: string[];
    grade_levels: string[];
    subject: string | null;
    sort_order: number;
    view_count: number;
    download_count: number;
    is_published: boolean;
    game_slug: string | null;
    tracked_game: boolean;
    homepage_featured: boolean;  // ปักหมุดขึ้นโซน "เกมแนะนำ" หน้าแรก (migration 213)
    library_pinned?: boolean;     // ปักหมุดในหมวดคลังเกม — มีผลทุกเครื่อง (migration 249)
    library_pin_order?: number;   // ลำดับในกลุ่มปักหมุด (step 10, 20, …)
    bgm_preset: string | null;   // เพลงประกอบรายเกม (preset key สังเคราะห์ใน KAMPAI.sound) — null = ใช้ default ของเกม
    bgm_url: string | null;      // เพลงอัปโหลด (mp3) — ถ้ามี = เล่นแทน synth
    character_sheet_id: string | null;
    character_sheet_url: string | null;
    character_sheet_url_p2: string | null;
    character_frame_w: number | null;
    character_frame_h: number | null;
    character_frame_count: number | null;
    character_animation_config: CharacterAnimationConfig | null;
    character_color_config: CharacterColorConfig | null;
    game_play_style: string | null;
    created_at: string;
    updated_at: string;
};

/** รายละเอียดเกม (game_docs) — สเปกเดียวต่อเกม แก้ทับได้ เห็นเฉพาะเจ้าของ+admin (RLS) */
export type GameDoc = {
    id: string;
    item_id: string;
    owner_staff_id: string;
    game_format: string | null;   // รูปแบบเกม (quiz/จับคู่/platformer/ลากวาง ฯลฯ)
    features: string[];            // ฟีเจอร์ในเกม
    version: string | null;        // เวอร์ชันบิลด์ล่าสุด
    notes: string | null;          // บันทึก/changelog ย่อ
    updated_by: string | null;
    created_at: string;
    updated_at: string;
};

/** เพลงในคลังเพลงกลาง (game_bgm_tracks) — อัปครั้งเดียว เลือกใช้รายเกม */
export type BgmTrack = {
    id: string;
    title: string;
    storage_path: string;
    url: string;
    created_by: string | null;
    created_at: string;
};

/** Sprite sheet ในคลังตัวละคร (game_character_sheets) */
export type CharacterSheet = {
    id: string;
    title: string;
    slug: string | null;
    sheet_url: string;
    sheet_url_p2: string | null;
    storage_path: string;
    storage_path_p2: string | null;
    frame_width: number;
    frame_height: number;
    frame_count: number;
    animation_config: CharacterAnimationConfig | null;
    color_config: CharacterColorConfig | null;
    preview_url: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
};

export type EduHubTeacherCard = {
    staff_id: string;
    name: string;
    position: string;
    subject: string | null;
    department: string | null;
    photo_url: string | null;
    order_position: number;
    banner_url: string | null;
    hub_bio: string | null;
    accent_color: string | null;
    external_url: string | null;
    is_hub_active: boolean;
    total_items: number;
    counts_by_category: Record<string, number>;
    username: string | null;
    /** Most recent published item created_at across all categories (nullable) */
    last_item_at: string | null;
};

const BUCKET = 'educational-hub';
const GAMES_BUCKET = 'edu-hub-games';

export const educationalHubService = {
    // ─── Categories ─────────────────────────────────────────────────────
    listCategories: () =>
        supabase
            .from('educational_hub_categories' as never)
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

    listCategoriesAdmin: () =>
        supabase
            .from('educational_hub_categories' as never)
            .select('*')
            .order('sort_order', { ascending: true }),

    insertCategory: (data: Partial<EduHubCategory>) =>
        supabase.from('educational_hub_categories' as never).insert(data as never).select().single(),

    updateCategory: (id: string, data: Partial<EduHubCategory>) =>
        supabase.from('educational_hub_categories' as never).update(data as never).eq('id', id),

    deleteCategory: (id: string) =>
        supabase.from('educational_hub_categories' as never).delete().eq('id', id),

    /**
     * Batch update sort_order for multiple categories (admin drag-drop).
     * Same shape as bulkUpdateSortOrder for items, but targets categories table.
     */
    bulkUpdateSortOrderCategories: async (
        updates: { id: string; sort_order: number }[],
    ): Promise<{ error: Error | null }> => {
        const results = await Promise.all(
            updates.map((u) =>
                supabase
                    .from('educational_hub_categories' as never)
                    .update({ sort_order: u.sort_order } as never)
                    .eq('id', u.id),
            ),
        );
        const firstErr = results.find((r) => r.error)?.error;
        return { error: (firstErr as Error | undefined) ?? null };
    },

    // ─── Teacher cards (hub home) ───────────────────────────────────────
    listTeacherCards: () =>
        supabase
            .from('v_educational_hub_teachers' as never)
            .select('*')
            .order('order_position', { ascending: true }),

    // For admin "ครูทั้งหมด" tab — includes inactive hubs too
    listAllTeachersForAdmin: () =>
        supabase
            .from('staff')
            .select('id, name, position, subject, department, photo_url, order_position')
            .eq('staff_type', 'teaching')
            .order('order_position', { ascending: true }),

    // ─── Profile ────────────────────────────────────────────────────────
    getProfile: (staffId: string) =>
        supabase
            .from('educational_hub_profiles' as never)
            .select('*')
            .eq('staff_id', staffId)
            .maybeSingle(),

    // NOTE: getProfileByUsername removed — username moved to staff table
    // in migration 067. Use staffService.getByIdentifier(username) instead.

    upsertProfile: (data: EduHubProfile) =>
        supabase
            .from('educational_hub_profiles' as never)
            .upsert(data as never, { onConflict: 'staff_id' }),

    // ─── Items ──────────────────────────────────────────────────────────
    listItemsByTeacher: (
        staffId: string,
        opts?: { categoryId?: string; publishedOnly?: boolean },
    ) => {
        let q = supabase
            .from('educational_hub_items' as never)
            .select('*')
            .eq('owner_staff_id', staffId);
        if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
        if (opts?.publishedOnly !== false) q = q.eq('is_published', true);
        return q
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
    },

    // เกมที่ปักหมุดขึ้นหน้าแรก (โซน "เกมแนะนำ") — published เท่านั้น, anon อ่านได้
    listFeaturedGames: (limit = 12) =>
        supabase
            .from('educational_hub_items' as never)
            .select('*')
            .eq('is_published', true)
            .eq('homepage_featured', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(limit),

    listMyItems: (staffId: string) =>
        supabase
            .from('educational_hub_items' as never)
            .select('*')
            .eq('owner_staff_id', staffId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false }),

    listAllItemsAdmin: (filters?: {
        ownerStaffId?: string;
        categoryId?: string;
        itemType?: EduHubItemType;
        publishedOnly?: boolean;
    }) => {
        let q = supabase
            .from('educational_hub_items' as never)
            .select('*');
        if (filters?.ownerStaffId) q = q.eq('owner_staff_id', filters.ownerStaffId);
        if (filters?.categoryId) q = q.eq('category_id', filters.categoryId);
        if (filters?.itemType) q = q.eq('item_type', filters.itemType);
        if (filters?.publishedOnly !== undefined) q = q.eq('is_published', filters.publishedOnly);
        return q
            .order('created_at', { ascending: false })
            .limit(500);
    },

    getItem: (id: string) =>
        supabase
            .from('educational_hub_items' as never)
            .select('*')
            .eq('id', id)
            .maybeSingle(),

    insertItem: (data: Partial<EduHubItem>) =>
        supabase.from('educational_hub_items' as never).insert(data as never).select().single(),

    updateItem: (id: string, data: Partial<EduHubItem>) =>
        supabase.from('educational_hub_items' as never).update(data as never).eq('id', id),

    deleteItem: (id: string) =>
        supabase.from('educational_hub_items' as never).delete().eq('id', id),

    /**
     * Batch update sort_order for multiple items in one round-trip.
     * Used by admin drag-drop UI in TeacherEduHubManager + EduHubManagement.
     * Each item is UPDATE'd individually but in parallel (Promise.all).
     */
    bulkUpdateSortOrder: async (
        updates: { id: string; sort_order: number }[],
    ): Promise<{ error: Error | null }> => {
        const results = await Promise.all(
            updates.map((u) =>
                supabase
                    .from('educational_hub_items' as never)
                    .update({ sort_order: u.sort_order } as never)
                    .eq('id', u.id),
            ),
        );
        const firstErr = results.find((r) => r.error)?.error;
        return { error: (firstErr as Error | undefined) ?? null };
    },

    /** ปักหมุด/ปลดหมุดเกมในคลัง (global) — ใช้จากหน้า /h/:identifier (admin) */
    toggleLibraryPin: async (
        itemId: string,
        pinned: boolean,
        currentPinned: Pick<EduHubItem, 'library_pin_order'>[],
    ): Promise<{ error: Error | null }> => {
        if (pinned) {
            const maxOrder = currentPinned.reduce(
                (max, i) => Math.max(max, i.library_pin_order ?? 0),
                0,
            );
            const { error } = await supabase
                .from('educational_hub_items' as never)
                .update({ library_pinned: true, library_pin_order: maxOrder + 10 } as never)
                .eq('id', itemId);
            return { error: (error as Error | null) ?? null };
        }
        const { error } = await supabase
            .from('educational_hub_items' as never)
            .update({ library_pinned: false, library_pin_order: 0 } as never)
            .eq('id', itemId);
        return { error: (error as Error | null) ?? null };
    },

    bulkUpdateLibraryPinOrder: async (
        updates: { id: string; library_pin_order: number }[],
    ): Promise<{ error: Error | null }> => {
        const results = await Promise.all(
            updates.map((u) =>
                supabase
                    .from('educational_hub_items' as never)
                    .update({ library_pin_order: u.library_pin_order } as never)
                    .eq('id', u.id),
            ),
        );
        const firstErr = results.find((r) => r.error)?.error;
        return { error: (firstErr as Error | undefined) ?? null };
    },

    // ─── Hub layout default (school_settings key='hub_layout_default') ──
    /**
     * Fetch global default hub layout from school_settings.
     * Returns null if no row exists (caller uses hardcoded fallback).
     */
    getHubLayoutDefault: () =>
        supabase
            .from('school_settings')
            .select('value')
            .eq('key', 'hub_layout_default')
            .maybeSingle(),

    /**
     * Upsert global hub layout (admin-only via RLS in production).
     * Stored as JSON string in school_settings.value.
     */
    saveHubLayoutDefault: (cfg: {
        viewMode: string;
        columns: number;
        sort: string;
        is_locked: boolean;
    }) =>
        supabase
            .from('school_settings')
            .upsert(
                {
                    key: 'hub_layout_default',
                    value: JSON.stringify(cfg),
                    category: 'educational-hub',
                    description: 'Default layout for /educational-hub (optionally locked for all visitors)',
                } as never,
                { onConflict: 'key' },
            ),

    // ─── Counters (anon-safe RPCs) ──────────────────────────────────────
    incrementView: (id: string) =>
        supabase.rpc('increment_ehi_view' as never, { p_id: id } as never),

    incrementDownload: (id: string) =>
        supabase.rpc('increment_ehi_download' as never, { p_id: id } as never),

    // ─── Storage upload helper ──────────────────────────────────────────
    /**
     * Upload to educational-hub bucket. Returns public URL.
     * subPath examples: '<staffId>/files', '<staffId>/thumbs', '<staffId>/banners'
     */
    uploadFile: async (
        subPath: string,
        file: File,
    ): Promise<{ url: string; path: string; error: Error | null }> => {
        const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${subPath.replace(/\/+$/, '')}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${cleanName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
        });
        if (upErr) return { url: '', path: '', error: upErr };
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return { url: data.publicUrl, path, error: null };
    },

    /** Remove a previously uploaded file by its storage path */
    removeFile: async (path: string) =>
        supabase.storage.from(BUCKET).remove([path]),

    /** Remove an HTML game file from the edu-hub-games bucket by storage path (e.g. 'math/math-jumper.html') */
    removeGameHtml: async (storagePath: string) =>
        supabase.storage.from(GAMES_BUCKET).remove([storagePath]),

    // ─── HTML Game upload (admin-only via RLS) ──────────────────────────
    /**
     * Upload an HTML game file to the `edu-hub-games` bucket.
     * Path scheme: `{subject}/{slug}.html` — stable so v.2 overwrites v.1.
     * Caller appends `?v=<version>` to bust browser cache.
     * RLS gates writes to admins only (see migration 063).
     */
    uploadGameHtml: async (
        subject: string,
        slug: string,
        file: File,
    ): Promise<{ publicUrl: string; path: string; version: number; error: Error | null }> => {
        const path = `${subject}/${slug}.html`;
        const { error: upErr } = await supabase.storage
            .from(GAMES_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'text/html',
            });
        if (upErr) return { publicUrl: '', path: '', version: 0, error: upErr };
        const { data } = supabase.storage.from(GAMES_BUCKET).getPublicUrl(path);
        const version = Date.now();
        return {
            publicUrl: `${data.publicUrl}?v=${version}`,
            path,
            version,
            error: null,
        };
    },

    /**
     * Replace an existing game item's HTML — upload new file at same path,
     * bump `?v=<timestamp>` on the item's external_url to invalidate browser cache.
     */
    replaceGameHtml: async (
        itemId: string,
        subject: string,
        slug: string,
        file: File,
    ) => {
        const up = await educationalHubService.uploadGameHtml(subject, slug, file);
        if (up.error) return { data: null, error: up.error };
        return supabase
            .from('educational_hub_items' as never)
            .update({ external_url: up.publicUrl } as never)
            .eq('id', itemId)
            .select()
            .single();
    },
};

/**
 * Extract YouTube video ID from common URL shapes:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 */
export const extractYoutubeId = (raw: string): string | null => {
    if (!raw) return null;
    const m = raw.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    return m?.[1] ?? null;
};

/** Build YouTube thumbnail URL from video ID */
export const youtubeThumbnail = (id: string, quality: 'default' | 'hq' | 'max' = 'hq'): string => {
    const q = quality === 'max' ? 'maxresdefault' : quality === 'hq' ? 'hqdefault' : 'default';
    return `https://i.ytimg.com/vi/${id}/${q}.jpg`;
};

/**
 * เป็น "เกม" หรือไม่ — item_type=link + external_url ชี้ไปไฟล์เกม
 * (Storage `/edu-hub-games/...` หรือ git `/games/...`) — sync กับ filter ใน GamesTab
 */
export const isGameItem = (item: Pick<EduHubItem, 'item_type' | 'external_url'>): boolean =>
    item.item_type === 'link' &&
    !!item.external_url &&
    (item.external_url.includes('/edu-hub-games/') || item.external_url.includes('/games/'));

/** เรียงหมวดคลังเกม: ปักหมุดก่อน (library_pin_order) → ที่เหลือ created_at ใหม่สุดก่อน */
export function sortGamesLibraryItems(items: EduHubItem[]): EduHubItem[] {
    const pinned = items
        .filter((i) => i.library_pinned)
        .sort((a, b) => (a.library_pin_order ?? 0) - (b.library_pin_order ?? 0));
    const unpinned = items
        .filter((i) => !i.library_pinned)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return [...pinned, ...unpinned];
}

export function splitGamesLibraryItems(items: EduHubItem[]) {
    const sorted = sortGamesLibraryItems(items);
    return {
        pinned: sorted.filter((i) => i.library_pinned),
        unpinned: sorted.filter((i) => !i.library_pinned),
    };
}

/** Format file size for display (e.g., "2.4 MB") */
export const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

// ─── คลังเพลงประกอบกลาง (game_bgm_tracks) ────────────────────────────────────
// อัปไฟล์ mp3 เข้า bucket educational-hub (โฟลเดอร์ bgm/) แล้วเก็บ row ไว้เลือกใช้รายเกม
export const bgmTracksService = {
    list: () =>
        supabase
            .from('game_bgm_tracks' as never)
            .select('*')
            .order('created_at', { ascending: false }),

    /** อัปโหลด mp3 → Storage → insert row คลังเพลง */
    upload: async (title: string, file: File): Promise<{ track: BgmTrack | null; error: Error | null }> => {
        const up = await educationalHubService.uploadFile('bgm', file);
        if (up.error) return { track: null, error: up.error };
        const { data, error } = await supabase
            .from('game_bgm_tracks' as never)
            .insert({ title: title.trim() || file.name, storage_path: up.path, url: up.url } as never)
            .select()
            .single();
        if (error) {
            await educationalHubService.removeFile(up.path);   // rollback ไฟล์ถ้า insert ล้ม
            return { track: null, error: error as Error };
        }
        return { track: data as unknown as BgmTrack, error: null };
    },

    /** ลบเพลงออกจากคลัง (ไฟล์ + row) */
    remove: async (id: string, storagePath: string): Promise<{ error: Error | null }> => {
        await educationalHubService.removeFile(storagePath);
        const { error } = await supabase.from('game_bgm_tracks' as never).delete().eq('id', id);
        return { error: (error as Error | null) ?? null };
    },
};

// ─── คลัง sprite sheet ตัวละคร (game_character_sheets) ───────────────────────

async function syncCharacterSheetToAssignedGames(sheet: CharacterSheet): Promise<{ error: Error | null }> {
    const fields = characterAssignmentFromSheet(sheet);
    const { error } = await supabase
        .from('educational_hub_items')
        .update(fields as never)
        .eq('character_sheet_id', sheet.id);
    return { error: (error as Error | null) ?? null };
}

export const characterSheetsService = {
    list: () =>
        supabase
            .from('game_character_sheets' as never)
            .select('*')
            .order('created_at', { ascending: false }),

    upload: async (params: {
        title: string;
        sheetFile: File;
        sheetFileP2?: File | null;
        frameWidth: number;
        frameHeight: number;
        frameCount: number;
        animationPreset?: string;
        animationConfig?: CharacterAnimationConfig;
        notes?: string;
    }): Promise<{ sheet: CharacterSheet | null; error: Error | null }> => {
        const animationConfig = params.animationConfig
            ?? getCharacterAnimPreset(params.animationPreset ?? 'grid-3x6-18');
        const id = crypto.randomUUID();
        const base = `characters/${id}`;
        const path1 = `${base}/sheet.png`;

        const { error: up1Err } = await supabase.storage.from(BUCKET).upload(path1, params.sheetFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: params.sheetFile.type || 'image/png',
        });
        if (up1Err) return { sheet: null, error: up1Err as Error };

        const url1 = supabase.storage.from(BUCKET).getPublicUrl(path1).data.publicUrl;
        let path2: string | null = null;
        let url2: string | null = null;

        if (params.sheetFileP2) {
            path2 = `${base}/sheet-p2.png`;
            const { error: up2Err } = await supabase.storage.from(BUCKET).upload(path2, params.sheetFileP2, {
                cacheControl: '3600',
                upsert: false,
                contentType: params.sheetFileP2.type || 'image/png',
            });
            if (up2Err) {
                await educationalHubService.removeFile(path1);
                return { sheet: null, error: up2Err as Error };
            }
            url2 = supabase.storage.from(BUCKET).getPublicUrl(path2).data.publicUrl;
        }

        const { data, error } = await supabase
            .from('game_character_sheets' as never)
            .insert({
                id,
                title: params.title.trim() || params.sheetFile.name.replace(/\.[^.]+$/, ''),
                sheet_url: url1,
                sheet_url_p2: url2,
                storage_path: path1,
                storage_path_p2: path2,
                frame_width: params.frameWidth,
                frame_height: params.frameHeight,
                frame_count: params.frameCount,
                animation_config: animationConfig,
                notes: params.notes?.trim() || null,
            } as never)
            .select()
            .single();

        if (error) {
            await educationalHubService.removeFile(path1);
            if (path2) await educationalHubService.removeFile(path2);
            return { sheet: null, error: error as Error };
        }
        return { sheet: data as unknown as CharacterSheet, error: null };
    },

    update: async (
        id: string,
        params: {
            title?: string;
            frameWidth?: number;
            frameHeight?: number;
            frameCount?: number;
            animationConfig?: CharacterAnimationConfig;
            colorConfig?: CharacterColorConfig | null;
            notes?: string | null;
        },
    ): Promise<{ sheet: CharacterSheet | null; error: Error | null }> => {
        const patch: Record<string, unknown> = {};
        if (params.title != null) patch.title = params.title.trim();
        if (params.frameWidth != null) patch.frame_width = params.frameWidth;
        if (params.frameHeight != null) patch.frame_height = params.frameHeight;
        if (params.frameCount != null) patch.frame_count = params.frameCount;
        if (params.animationConfig != null) patch.animation_config = params.animationConfig;
        if (params.colorConfig !== undefined) patch.color_config = params.colorConfig;
        if (params.notes !== undefined) patch.notes = params.notes;

        const { data, error } = await supabase
            .from('game_character_sheets' as never)
            .update(patch as never)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) return { sheet: null, error: (error as Error) ?? new Error('update failed') };

        const sheet = data as unknown as CharacterSheet;
        const syncErr = await syncCharacterSheetToAssignedGames(sheet);
        if (syncErr.error) return { sheet, error: syncErr.error };
        return { sheet, error: null };
    },

    syncAssignedGames: syncCharacterSheetToAssignedGames,

    listAssignedGames: (sheetId: string) =>
        supabase
            .from('educational_hub_items')
            .select('id, title, game_slug, game_play_style')
            .eq('character_sheet_id', sheetId)
            .order('title'),

    remove: async (sheet: CharacterSheet): Promise<{ error: Error | null }> => {
        if (!sheet.storage_path.startsWith('git:')) {
            await educationalHubService.removeFile(sheet.storage_path);
        }
        if (sheet.storage_path_p2 && !sheet.storage_path_p2.startsWith('git:')) {
            await educationalHubService.removeFile(sheet.storage_path_p2);
        }
        const { error } = await supabase.from('game_character_sheets' as never).delete().eq('id', sheet.id);
        return { error: (error as Error | null) ?? null };
    },

    listAssignableGames: () =>
        supabase
            .from('educational_hub_items')
            .select('id, title, game_slug, game_play_style, character_sheet_id')
            .not('game_slug', 'is', null)
            .order('title'),

    syncGameAssignments: async (
        sheetId: string,
        checkedItemIds: string[],
        sheet: CharacterSheet,
    ): Promise<{ error: Error | null }> => {
        const assignFields = characterAssignmentFromSheet(sheet);
        const clearFields = characterAssignmentFromSheet(null);

        const { data: current, error: listErr } = await supabase
            .from('educational_hub_items')
            .select('id')
            .eq('character_sheet_id', sheetId);
        if (listErr) return { error: listErr as Error };

        const currentIds = (current ?? []).map((r) => (r as { id: string }).id);
        const toRemove = currentIds.filter((id) => !checkedItemIds.includes(id));
        const toAdd = checkedItemIds.filter((id) => !currentIds.includes(id));

        if (toRemove.length) {
            const { error } = await supabase
                .from('educational_hub_items')
                .update(clearFields as never)
                .in('id', toRemove);
            if (error) return { error: error as Error };
        }
        if (toAdd.length) {
            const { error } = await supabase
                .from('educational_hub_items')
                .update(assignFields as never)
                .in('id', toAdd);
            if (error) return { error: error as Error };
        }
        return { error: null };
    },

    duplicate: async (
        sourceId: string,
        title?: string,
    ): Promise<{ sheet: CharacterSheet | null; error: Error | null }> => {
        const { data: source, error: fetchErr } = await supabase
            .from('game_character_sheets' as never)
            .select('*')
            .eq('id', sourceId)
            .single();
        if (fetchErr || !source) {
            return { sheet: null, error: (fetchErr as Error) ?? new Error('not found') };
        }
        const src = source as unknown as CharacterSheet;
        const id = crypto.randomUUID();
        const isGit = src.storage_path.startsWith('git:');

        let path1 = src.storage_path;
        let url1 = src.sheet_url;
        let path2 = src.storage_path_p2;
        let url2 = src.sheet_url_p2;

        if (!isGit) {
            try {
                const res = await fetch(src.sheet_url);
                const blob = await res.blob();
                path1 = `characters/${id}/sheet.png`;
                const { error: up1Err } = await supabase.storage.from(BUCKET).upload(path1, blob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: blob.type || 'image/png',
                });
                if (up1Err) return { sheet: null, error: up1Err as Error };
                url1 = supabase.storage.from(BUCKET).getPublicUrl(path1).data.publicUrl;

                if (src.sheet_url_p2 && src.storage_path_p2) {
                    const res2 = await fetch(src.sheet_url_p2);
                    const blob2 = await res2.blob();
                    path2 = `characters/${id}/sheet-p2.png`;
                    const { error: up2Err } = await supabase.storage.from(BUCKET).upload(path2, blob2, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: blob2.type || 'image/png',
                    });
                    if (up2Err) {
                        await educationalHubService.removeFile(path1);
                        return { sheet: null, error: up2Err as Error };
                    }
                    url2 = supabase.storage.from(BUCKET).getPublicUrl(path2).data.publicUrl;
                }
            } catch (e) {
                return { sheet: null, error: e instanceof Error ? e : new Error('duplicate copy failed') };
            }
        }

        const dupTitle = title?.trim() || `${src.title} (สำเนา)`;
        const { data, error } = await supabase
            .from('game_character_sheets' as never)
            .insert({
                id,
                title: dupTitle,
                sheet_url: url1,
                sheet_url_p2: url2,
                storage_path: path1,
                storage_path_p2: path2,
                frame_width: src.frame_width,
                frame_height: src.frame_height,
                frame_count: src.frame_count,
                animation_config: src.animation_config,
                color_config: src.color_config,
                notes: src.notes,
            } as never)
            .select()
            .single();

        if (error) {
            if (!isGit && path1.startsWith(`characters/${id}`)) {
                await educationalHubService.removeFile(path1);
                if (path2?.startsWith(`characters/${id}`)) await educationalHubService.removeFile(path2);
            }
            return { sheet: null, error: error as Error };
        }
        return { sheet: data as unknown as CharacterSheet, error: null };
    },
};

/** ค่า denormalize ลง educational_hub_items เมื่อเลือกตัวละคร */
export function characterAssignmentFromSheet(sheet: CharacterSheet | null | undefined) {
    if (!sheet) {
        return {
            character_sheet_id: null,
            character_sheet_url: null,
            character_sheet_url_p2: null,
            character_frame_w: null,
            character_frame_h: null,
            character_frame_count: null,
            character_animation_config: null,
            character_color_config: null,
        };
    }
    return {
        character_sheet_id: sheet.id,
        character_sheet_url: sheet.sheet_url,
        character_sheet_url_p2: sheet.sheet_url_p2,
        character_frame_w: sheet.frame_width,
        character_frame_h: sheet.frame_height,
        character_frame_count: sheet.frame_count,
        character_animation_config: sheet.animation_config,
        character_color_config: sheet.color_config,
    };
}

// ─── รายละเอียดเกม (game_docs) ────────────────────────────────────────────────
// สเปกเดียวต่อเกม (1:1 กับ educational_hub_items, แก้ทับได้) — RLS เห็นเฉพาะเจ้าของ+admin
export const gameDocsService = {
    getByItem: (itemId: string) =>
        supabase
            .from('game_docs' as never)
            .select('*')
            .eq('item_id', itemId)
            .maybeSingle(),

    upsert: (
        data: Partial<GameDoc> & { item_id: string; owner_staff_id: string },
    ) =>
        supabase
            .from('game_docs' as never)
            .upsert({ ...data, updated_at: new Date().toISOString() } as never, {
                onConflict: 'item_id',
            }),
};
