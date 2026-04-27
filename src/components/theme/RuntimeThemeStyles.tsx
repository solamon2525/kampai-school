import { useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { hexToHslString } from '@/lib/colorUtils';
import type { ThemeColors } from '@/lib/themeDefaults';

const STYLE_ELEMENT_ID = 'kampai-runtime-theme';

/**
 * RuntimeThemeStyles — injects user-customized CSS custom properties into <head>.
 *
 * Reads theme from `school_settings.theme_colors` (via useThemeColors), converts
 * each hex to HSL space-separated form, then writes a <style> tag at :root scope
 * that overrides the defaults defined in `src/index.css`.
 *
 * Mount once near the app root (e.g. inside <App /> below QueryClientProvider).
 * Renders nothing.
 */
export const RuntimeThemeStyles = () => {
    const { theme } = useThemeColors();

    useEffect(() => {
        const css = buildCss(theme);
        let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
        if (!el) {
            el = document.createElement('style');
            el.id = STYLE_ELEMENT_ID;
            document.head.appendChild(el);
        }
        el.textContent = css;
    }, [theme]);

    return null;
};

const buildCss = (theme: ThemeColors): string => {
    const lines: string[] = [':root {'];
    (Object.keys(theme) as Array<keyof ThemeColors>).forEach((key) => {
        try {
            const hsl = hexToHslString(theme[key]);
            lines.push(`  --${key}: ${hsl};`);
        } catch {
            // skip invalid entries; defaults from index.css remain
        }
    });
    lines.push('}');
    return lines.join('\n');
};

export default RuntimeThemeStyles;
