import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColors } from '@/hooks/useThemeColors';
import { hexToHslString } from '@/lib/colorUtils';
import type { ThemeColors } from '@/lib/themeDefaults';

const STYLE_ELEMENT_ID = 'kampai-runtime-theme';

/**
 * RuntimeThemeStyles — injects user-customized CSS custom properties into <head>.
 *
 * Only applies in light mode. In dark mode the injection is cleared so that the
 * `.dark` overrides in index.css take full effect without interference.
 *
 * Root cause why this matters: this <style> tag is appended after the main CSS
 * bundle, so a bare `:root {}` block has equal specificity to `.dark {}` but wins
 * by cascade order — accidentally overriding dark-mode foreground/background/etc.
 * with light-mode hex values stored in school_settings.
 */
export const RuntimeThemeStyles = () => {
    const { theme } = useThemeColors();
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
        if (!el) {
            el = document.createElement('style');
            el.id = STYLE_ELEMENT_ID;
            document.head.appendChild(el);
        }
        // In dark mode: clear injection entirely — let index.css .dark rules win
        if (resolvedTheme === 'dark') {
            el.textContent = '';
            return;
        }
        el.textContent = buildCss(theme);
    }, [theme, resolvedTheme]);

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
