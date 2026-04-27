/**
 * Theme defaults — sourced from DESIGN.md (single source of truth).
 * These are the fallback hex values when `school_settings.theme_colors` is empty.
 *
 * Each key maps to a CSS custom property in `src/index.css`:
 *   primary       → --primary
 *   accent        → --accent
 *   background    → --background
 *   foreground    → --foreground
 *   ...
 *
 * Keep in sync with DESIGN.md "Frontend Color Palette" section.
 */

export type ThemeColors = {
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    accent: string;
    'accent-foreground': string;
    background: string;
    foreground: string;
    muted: string;
    'muted-foreground': string;
    border: string;
    destructive: string;
};

export const DEFAULT_THEME: ThemeColors = {
    primary: '#157F3C',              // Forest green — buttons, header, badges
    'primary-foreground': '#FFFFFF', // Text on primary
    secondary: '#E5F0E7',            // Light green tint — secondary button, section bg
    'secondary-foreground': '#0F5C2C', // Text on secondary (deep green)
    accent: '#33AE60',               // Medium green — highlights, icons, links
    'accent-foreground': '#FFFFFF',  // Text on accent
    background: '#FFFFFF',           // Page bg
    foreground: '#14291C',           // Body text
    muted: '#F0F7F1',                // Quiet bg (alt section)
    'muted-foreground': '#568165',   // Secondary text
    border: '#C8DECE',               // Card border, divider
    destructive: '#DC2626',          // Error, delete, warning
};

/** Human-readable labels for the Theme Manager UI (Thai). */
export const THEME_LABELS: Record<keyof ThemeColors, { label: string; desc: string }> = {
    primary: { label: 'สีหลัก (Primary)', desc: 'ปุ่มหลัก, header, navbar, banner' },
    'primary-foreground': { label: 'ตัวอักษรบนสีหลัก', desc: 'สีตัวอักษรเมื่ออยู่บน Primary' },
    secondary: { label: 'สีรอง (Secondary)', desc: 'พื้นรอง, ปุ่มรอง, section bg อ่อน' },
    'secondary-foreground': { label: 'ตัวอักษรบนสีรอง', desc: 'สีตัวอักษรเมื่ออยู่บน Secondary' },
    accent: { label: 'สี Accent', desc: 'ไอคอน, link, highlight, label' },
    'accent-foreground': { label: 'ตัวอักษรบน Accent', desc: 'สีตัวอักษรเมื่ออยู่บน Accent' },
    background: { label: 'พื้นหลัง', desc: 'พื้นหลักของหน้าเว็บ' },
    foreground: { label: 'ตัวอักษรหลัก', desc: 'สีตัวอักษรหลักบนพื้นหลัง' },
    muted: { label: 'สีพื้นเงียบ (Muted)', desc: 'พื้น section อ่อน, alternate row' },
    'muted-foreground': { label: 'ตัวอักษร Muted', desc: 'ข้อความรอง, helper, caption' },
    border: { label: 'สีเส้นขอบ', desc: 'เส้นแบ่ง card, divider, input border' },
    destructive: { label: 'สีอันตราย', desc: 'ปุ่มลบ, error, warning' },
};

/** CSS custom property keys grouped for the UI (order matters for layout). */
export const THEME_GROUPS: Array<{
    title: string;
    keys: Array<keyof ThemeColors>;
}> = [
        {
            title: 'สีหลักของแบรนด์',
            keys: ['primary', 'primary-foreground', 'accent', 'accent-foreground'],
        },
        {
            title: 'พื้นหลัง + ตัวอักษร',
            keys: ['background', 'foreground', 'muted', 'muted-foreground'],
        },
        {
            title: 'สีเสริม + UI',
            keys: ['secondary', 'secondary-foreground', 'border', 'destructive'],
        },
    ];
