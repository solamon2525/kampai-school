import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    DEFAULT_MENU_CONFIG,
    DEFAULT_NAV_STYLE,
    DEFAULT_MENU_ITEMS,
    type MenuConfig,
    type MenuItem,
    type NavStyle,
} from '@/lib/menuDefaults';

/**
 * useMenuConfig — read/write the public site's navigation menu structure + style.
 *
 * Storage: `school_settings` row with key `menu_config`, value = JSON of MenuConfig.
 * If row missing or invalid, falls back to DEFAULT_MENU_CONFIG (mirrors original
 * hardcoded mainNav/serviceNav from SiteHeader.tsx).
 */

const SETTINGS_KEY = 'menu_config';
const QUERY_KEY = ['school-settings', 'menu'] as const;

/** Normalize a single item — guarantees required fields + correct types. */
const normalizeItem = (raw: any, fallbackId: string): MenuItem => ({
    id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id : fallbackId,
    label: typeof raw?.label === 'string' ? raw.label : '',
    href: typeof raw?.href === 'string' ? raw.href : null,
    icon: typeof raw?.icon === 'string' ? raw.icon : 'FileText',
    parent: typeof raw?.parent === 'string' ? raw.parent : null,
    order: typeof raw?.order === 'number' ? raw.order : 0,
});

const normalizeStyle = (raw: any): NavStyle => ({
    navBg: typeof raw?.navBg === 'string' ? raw.navBg : DEFAULT_NAV_STYLE.navBg,
    navText: typeof raw?.navText === 'string' ? raw.navText : DEFAULT_NAV_STYLE.navText,
    navTextActive: typeof raw?.navTextActive === 'string' ? raw.navTextActive : DEFAULT_NAV_STYLE.navTextActive,
    navBgActive: typeof raw?.navBgActive === 'string' ? raw.navBgActive : DEFAULT_NAV_STYLE.navBgActive,
    navHoverBg: typeof raw?.navHoverBg === 'string' ? raw.navHoverBg : DEFAULT_NAV_STYLE.navHoverBg,
    navHoverText: typeof raw?.navHoverText === 'string' ? raw.navHoverText : DEFAULT_NAV_STYLE.navHoverText,
    borderActive: typeof raw?.borderActive === 'string' ? raw.borderActive : DEFAULT_NAV_STYLE.borderActive,
    fontWeight: typeof raw?.fontWeight === 'string' ? raw.fontWeight : DEFAULT_NAV_STYLE.fontWeight,
    fontSize: typeof raw?.fontSize === 'string' ? raw.fontSize : DEFAULT_NAV_STYLE.fontSize,
});

const sanitize = (raw: any): MenuConfig => {
    if (!raw || typeof raw !== 'object') return DEFAULT_MENU_CONFIG;
    const items = Array.isArray(raw.items) && raw.items.length > 0
        ? raw.items.map((it: any, idx: number) => normalizeItem(it, `item-${idx}`))
        : DEFAULT_MENU_ITEMS;
    return { items, style: normalizeStyle(raw.style) };
};

const fetchMenuConfig = async (): Promise<MenuConfig> => {
    const { data, error } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

    if (error || !data?.value) return DEFAULT_MENU_CONFIG;
    try {
        return sanitize(JSON.parse(data.value));
    } catch {
        return DEFAULT_MENU_CONFIG;
    }
};

const saveMenuConfig = async (cfg: MenuConfig): Promise<void> => {
    const sanitized = sanitize(cfg);
    const { error } = await supabase
        .from('school_settings')
        .upsert(
            { key: SETTINGS_KEY, value: JSON.stringify(sanitized) },
            { onConflict: 'key' }
        );
    if (error) throw error;
};

export const useMenuConfig = () => {
    const queryClient = useQueryClient();

    const { data: config = DEFAULT_MENU_CONFIG, isLoading: loading } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchMenuConfig,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: saveMenuConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    return {
        config,
        loading,
        save: mutation.mutateAsync,
        saving: mutation.isPending,
    };
};
