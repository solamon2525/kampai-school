/**
 * Menu defaults — fallback when school_settings.menu_config is empty.
 * Keep aligned with the original hardcoded mainNav + serviceNav from SiteHeader.tsx.
 *
 * Schema:
 *   - items: flat list with optional `parent` (parent item's id) for dropdown nesting
 *   - top-level items have parent === null and render inline
 *   - children render inside a dropdown menu under their parent
 *   - icon: name of a lucide-react icon (resolved at render time via icon registry)
 */

export type MenuItem = {
    id: string;
    label: string;
    href: string | null;       // null = pure dropdown trigger (no link)
    icon: string;              // lucide-react icon name (e.g. "Home", "Info")
    parent: string | null;     // parent.id for dropdown children, null for top-level
    order: number;             // sort order within siblings
};

export type NavStyle = {
    /** Navbar background (e.g. "#157F3C" or "transparent") */
    navBg: string;
    /** Idle item text color */
    navText: string;
    /** Active item text color */
    navTextActive: string;
    /** Active item background */
    navBgActive: string;
    /** Hover background (rgba allowed) */
    navHoverBg: string;
    /** Hover text color */
    navHoverText: string;
    /** Bottom border color of active item (set 'transparent' to hide) */
    borderActive: string;
    /** Font weight: '400' | '500' | '600' | '700' */
    fontWeight: string;
    /** Font size class — '0.875rem' (sm), '1rem' (base), '1.125rem' (lg) */
    fontSize: string;
};

export type MenuConfig = {
    items: MenuItem[];
    style: NavStyle;
};

export const DEFAULT_NAV_STYLE: NavStyle = {
    navBg: '#157F3C',
    navText: '#FFFFFF',
    navTextActive: '#FDE047',     // yellow-300
    navBgActive: 'rgba(255,255,255,0.1)',
    navHoverBg: 'rgba(255,255,255,0.1)',
    navHoverText: '#FDE047',
    borderActive: '#FACC15',      // yellow-400
    fontWeight: '500',
    fontSize: '0.875rem',
};

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
    // Top-level (parent: null)
    { id: 'home', label: 'หน้าหลัก', href: '/', icon: 'Home', parent: null, order: 0 },
    { id: 'about', label: 'เกี่ยวกับเรา', href: '/about', icon: 'Info', parent: null, order: 1 },
    { id: 'staff', label: 'บุคลากร', href: '/staff', icon: 'Users', parent: null, order: 2 },
    { id: 'students', label: 'นักเรียน', href: '/students', icon: 'GraduationCap', parent: null, order: 3 },
    { id: 'curriculum', label: 'หลักสูตร', href: '/curriculum', icon: 'BookOpen', parent: null, order: 4 },
    { id: 'educational-hub', label: 'คลังสื่อ', href: '/educational-hub', icon: 'Sparkles', parent: null, order: 5 },
    { id: 'gallery', label: 'แกลเลอรี่', href: '/gallery', icon: 'Image', parent: null, order: 6 },
    { id: 'calendar', label: 'ปฏิทิน', href: '/calendar', icon: 'Calendar', parent: null, order: 7 },
    { id: 'news', label: 'ข่าวสาร', href: '/news', icon: 'Newspaper', parent: null, order: 8 },
    { id: 'contact', label: 'ติดต่อเรา', href: '/contact', icon: 'Phone', parent: null, order: 9 },
    // Services dropdown group
    { id: 'services', label: 'บริการ', href: null, icon: 'Layers', parent: null, order: 10 },
    { id: 'waste-bank', label: 'ธนาคารขยะ', href: '/waste-bank', icon: 'Recycle', parent: 'services', order: 0 },
    { id: 'waste-bank-stats', label: 'สถิติธนาคารขยะ', href: '/waste-bank/stats', icon: 'BarChart3', parent: 'services', order: 1 },
    { id: 'savings-bank', label: 'ธนาคารพอเพียง', href: '/savings-bank', icon: 'Wallet', parent: 'services', order: 2 },
    { id: 'documents', label: 'เอกสาร/แบบฟอร์ม', href: '/documents', icon: 'FileText', parent: 'services', order: 3 },
    { id: 'enrollment', label: 'สมัครเรียน', href: '/enrollment', icon: 'UserCog', parent: 'services', order: 4 },
];

export const DEFAULT_MENU_CONFIG: MenuConfig = {
    items: DEFAULT_MENU_ITEMS,
    style: DEFAULT_NAV_STYLE,
};

/**
 * Lucide icon names allowed in menu items. Used by the admin UI to populate
 * a dropdown of icon choices. Add more here as menu needs grow.
 */
export const MENU_ICON_OPTIONS = [
    'Home', 'Info', 'Users', 'GraduationCap', 'BookOpen', 'Image', 'Calendar',
    'Newspaper', 'Phone', 'Mail', 'FileText', 'Recycle', 'UserCog', 'Layers',
    'Download', 'Globe', 'LogIn', 'Award', 'Briefcase', 'Building', 'Bell',
    'Star', 'Heart', 'Settings', 'BarChart3', 'TrendingUp', 'Wallet', 'Sparkles',
] as const;

export type MenuIconName = typeof MENU_ICON_OPTIONS[number];

export const FONT_WEIGHT_OPTIONS = [
    { value: '400', label: 'ปกติ (Regular)' },
    { value: '500', label: 'กลาง (Medium)' },
    { value: '600', label: 'หนา (Semibold)' },
    { value: '700', label: 'หนามาก (Bold)' },
] as const;

export const FONT_SIZE_OPTIONS = [
    { value: '0.75rem', label: 'เล็กมาก (XS)' },
    { value: '0.875rem', label: 'เล็ก (SM)' },
    { value: '1rem', label: 'ปกติ (Base)' },
    { value: '1.125rem', label: 'ใหญ่ (LG)' },
] as const;
