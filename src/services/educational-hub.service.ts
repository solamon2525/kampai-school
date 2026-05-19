/**
 * educational-hub.service.ts
 * Supabase queries สำหรับ Educational Hub — categories, profiles, items + counter RPCs
 */
import { supabase } from '@/integrations/supabase/client';

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
    created_at: string;
    updated_at: string;
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
