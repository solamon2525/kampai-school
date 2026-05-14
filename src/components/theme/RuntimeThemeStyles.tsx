import { useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { hexToHslString } from '@/lib/colorUtils';
import type { ThemeColors } from '@/lib/themeDefaults';

const STYLE_ELEMENT_ID = 'kampai-runtime-theme';

/**
 * RuntimeThemeStyles — injects user-customized CSS custom properties into <head>.
 *
 * Applies to BOTH `:root` (light) and `.dark` (dark) so user customizations from
 * the Theme Manager show up regardless of current mode. The selector group has
 * specificity equal to `.dark` from index.css but the style tag is appended after
 * the main bundle — so the cascade order ensures customizations win over both
 * light AND dark mode defaults.
 *
 * Trade-off: user's chosen palette applies in both modes. If they pick a white
 * background, dark mode will look white-bg. That's intentional — user gets what
 * they configured. Future improvement could add a separate dark-mode palette.
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
    const lines: string[] = [':root, .dark {'];
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
