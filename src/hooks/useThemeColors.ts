import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_THEME, type ThemeColors } from '@/lib/themeDefaults';
import { normalizeHex } from '@/lib/colorUtils';

/**
 * useThemeColors — read/write the user-customizable theme palette.
 *
 * Storage: `school_settings` row with key `theme_colors`, value = JSON of ThemeColors.
 * If row missing or value invalid, falls back to DEFAULT_THEME (sourced from DESIGN.md).
 *
 * Pair with `<RuntimeThemeStyles />` mounted near the app root to inject the
 * resulting palette into CSS custom properties at runtime.
 */

const SETTINGS_KEY = 'theme_colors';
const QUERY_KEY = ['school-settings', 'theme'] as const;

const sanitize = (raw: Partial<ThemeColors> | null | undefined): ThemeColors => {
    const merged: ThemeColors = { ...DEFAULT_THEME };
    if (!raw) return merged;
    (Object.keys(DEFAULT_THEME) as Array<keyof ThemeColors>).forEach((k) => {
        const candidate = raw[k];
        if (typeof candidate === 'string') {
            const normalized = normalizeHex(candidate);
            if (normalized) merged[k] = normalized;
        }
    });
    return merged;
};

const fetchTheme = async (): Promise<ThemeColors> => {
    const { data, error } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

    if (error) {
        // PGRST116 = no rows; treat any read error as "use defaults"
        return DEFAULT_THEME;
    }
    if (!data?.value) return DEFAULT_THEME;
    try {
        const parsed = JSON.parse(data.value) as Partial<ThemeColors>;
        return sanitize(parsed);
    } catch {
        return DEFAULT_THEME;
    }
};

const saveTheme = async (theme: ThemeColors): Promise<void> => {
    const sanitized = sanitize(theme);
    const { error } = await supabase
        .from('school_settings')
        .upsert(
            { key: SETTINGS_KEY, value: JSON.stringify(sanitized) },
            { onConflict: 'key' }
        );
    if (error) throw error;
};

export const useThemeColors = () => {
    const queryClient = useQueryClient();

    const { data: theme = DEFAULT_THEME, isLoading: loading } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchTheme,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: saveTheme,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    return {
        theme,
        loading,
        save: mutation.mutateAsync,
        saving: mutation.isPending,
    };
};
