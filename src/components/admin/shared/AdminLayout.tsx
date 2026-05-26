import { ReactNode, useEffect, useState } from 'react';
import SchoolLogoMark from '@/components/SchoolLogoMark';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    LayoutDashboard,
    Newspaper,
    Calendar,
    Users,
    Image,
    FileText,
    Settings,
    LogOut,
    Home,
    UserCheck,
    GraduationCap,
    Briefcase,
    UserCog,
    Mail,
    BookOpen,
    Palette,
    Menu as MenuIcon,
    HelpCircle,
    History,
    Building2,
    Recycle,
    Wallet,
    ClipboardCheck,
    FolderOpen,
    SlidersHorizontal,
    BarChart2,
    PenLine,
    LayoutTemplate,
    Star,
    MailOpen,
    SendHorizontal,
    Stamp,
    CalendarCheck,
    ClipboardList,
    UserX,
    BookMarked,
    Award,
    Info,
    Menu,
    ExternalLink,
    Sparkles,
    Gamepad2,
    MessageCircle,
    Handshake,
    Database,
    QrCode,
    ShieldCheck,
    Target,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { NotificationBell } from './NotificationBell';
import { ScanFAB } from '@/components/shared/ScanFAB';
import { CameraPermissionPrompt } from '@/components/shared/CameraPermissionPrompt';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { Search } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

type MenuItem =
    | { type: 'item'; id: string; label: string; icon: React.ElementType; path: string; adminOnly?: boolean }
    | { type: 'section'; label: string };

const menuItems: MenuItem[] = [
    { type: 'item', id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard' },
    { type: 'item', id: 'dashboard-school', label: 'แดชบอร์ดโรงเรียน', icon: Database, path: '/admin/dashboard/dashboard-school', adminOnly: true },
    { type: 'item', id: 'docs-hub', label: 'ศูนย์เอกสาร', icon: FolderOpen, path: '/admin/dashboard/docs-hub', adminOnly: true },
    { type: 'item', id: 'budget', label: 'งบประมาณ', icon: Wallet, path: '/admin/dashboard/budget', adminOnly: true },
    { type: 'item', id: 'sar', label: 'SAR ประกันคุณภาพ', icon: ClipboardCheck, path: '/admin/dashboard/sar', adminOnly: true },
    { type: 'item', id: 'ics', label: 'ควบคุมภายใน (ICS)', icon: ShieldCheck, path: '/admin/dashboard/ics', adminOnly: true },
    { type: 'item', id: 'action-plan', label: 'แผนปฏิบัติการ', icon: Target, path: '/admin/dashboard/action-plan', adminOnly: true },
    { type: 'item', id: 'doc-templates', label: 'แบบฟอร์มสำเร็จรูป', icon: FileText, path: '/admin/dashboard/doc-templates', adminOnly: true },
    { type: 'item', id: 'student-docs', label: 'เอกสารนักเรียน', icon: GraduationCap, path: '/admin/dashboard/student-docs', adminOnly: true },
    { type: 'section', label: 'เว็บไซต์' },
    { type: 'item', id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/admin/dashboard/settings', adminOnly: true },
    { type: 'item', id: 'theme', label: 'ธีมสี (Theme)', icon: Palette, path: '/admin/dashboard/theme', adminOnly: true },
    { type: 'item', id: 'menu', label: 'เมนูเว็บไซต์', icon: MenuIcon, path: '/admin/dashboard/menu', adminOnly: true },
    { type: 'item', id: 'hero-slides', label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/dashboard/hero-slides', adminOnly: true },
    { type: 'item', id: 'testimonials', label: 'Testimonials', icon: MessageCircle, path: '/admin/dashboard/testimonials', adminOnly: true },
    { type: 'item', id: 'partners', label: 'พันธมิตร', icon: Handshake, path: '/admin/dashboard/partners', adminOnly: true },
    { type: 'item', id: 'news', label: 'ข่าวสาร', icon: Newspaper, path: '/admin/dashboard/news' },
    { type: 'item', id: 'gallery', label: 'แกลเลอรี่', icon: Image, path: '/admin/dashboard/gallery', adminOnly: true },
    { type: 'item', id: 'events', label: 'ปฏิทิน', icon: Calendar, path: '/admin/dashboard/events' },
    { type: 'section', label: 'งานสารบรรณ' },
    { type: 'item', id: 'saraban', label: 'ภาพรวม', icon: ClipboardList, path: '/admin/dashboard/saraban', adminOnly: true },
    { type: 'item', id: 'incoming-letters', label: 'หนังสือรับ', icon: MailOpen, path: '/admin/dashboard/incoming-letters', adminOnly: true },
    { type: 'item', id: 'outgoing-letters', label: 'หนังสือส่ง', icon: SendHorizontal, path: '/admin/dashboard/outgoing-letters', adminOnly: true },
    { type: 'item', id: 'orders', label: 'คำสั่ง/ประกาศ', icon: Stamp, path: '/admin/dashboard/orders', adminOnly: true },
    { type: 'item', id: 'meetings', label: 'การประชุม', icon: CalendarCheck, path: '/admin/dashboard/meetings', adminOnly: true },
    { type: 'section', label: 'บุคลากร (HR)' },
    { type: 'item', id: 'self-development', label: 'แฟ้มพัฒนาตนเอง', icon: Sparkles, path: '/admin/dashboard/self-development' },
    { type: 'item', id: 'leave', label: 'การลา', icon: UserX, path: '/admin/dashboard/leave', adminOnly: true },
    { type: 'item', id: 'training', label: 'การอบรม', icon: BookMarked, path: '/admin/dashboard/training', adminOnly: true },
    { type: 'item', id: 'pa', label: 'PA Assessment', icon: Award, path: '/admin/dashboard/pa', adminOnly: true },
    { type: 'section', label: 'ฝ่ายวิชาการ' },
    { type: 'item', id: 'academic', label: 'ฝ่ายวิชาการ', icon: BookOpen, path: '/admin/dashboard/academic', adminOnly: true },
    { type: 'section', label: 'ข้อมูลโรงเรียน' },
    { type: 'item', id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard/milestones', adminOnly: true },
    { type: 'item', id: 'facilities', label: 'สิ่งอำนวยความสะดวก', icon: Building2, path: '/admin/dashboard/facilities', adminOnly: true },
    { type: 'item', id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard/staff' },
    { type: 'item', id: 'teachers', label: 'รายชื่อครู', icon: Users, path: '/admin/dashboard/teachers' },
    { type: 'item', id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard/administrators', adminOnly: true },
    { type: 'item', id: 'students', label: 'นักเรียน', icon: GraduationCap, path: '/admin/dashboard/students' },
    { type: 'item', id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard/curriculum', adminOnly: true },
    { type: 'item', id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard/activities', adminOnly: true },
    { type: 'section', label: 'ระบบบริการ' },
    { type: 'item', id: 'scan', label: 'สแกน QR ด่วน', icon: QrCode, path: '/admin/dashboard/scan' },
    { type: 'item', id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/admin/dashboard/waste-bank', adminOnly: true },
    { type: 'item', id: 'savings-bank', label: 'ธนาคารพอเพียง', icon: Wallet, path: '/admin/dashboard/savings-bank', adminOnly: true },
    { type: 'item', id: 'attendance', label: 'เช็คชื่อนักเรียน', icon: ClipboardCheck, path: '/admin/dashboard/attendance' },
    { type: 'item', id: 'scores', label: 'คะแนนเก็บ', icon: PenLine, path: '/admin/dashboard/scores' },
    { type: 'item', id: 'conduct', label: 'Kampai Hero System', icon: Star, path: '/admin/dashboard/conduct' },
    { type: 'item', id: 'documents', label: 'จัดการเอกสาร', icon: FolderOpen, path: '/admin/dashboard/documents', adminOnly: true },
    { type: 'item', id: 'educational-hub', label: 'คลังสื่อ/เกม', icon: Sparkles, path: '/admin/dashboard/educational-hub', adminOnly: true },
    { type: 'item', id: 'games', label: 'การเล่นเกม', icon: Gamepad2, path: '/admin/dashboard/games', adminOnly: true },
    { type: 'item', id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/admin/dashboard/analytics', adminOnly: true },
    { type: 'item', id: 'page-builder', label: 'Page Builder', icon: LayoutTemplate, path: '/admin/page-builder', adminOnly: true },
    { type: 'section', label: 'อื่นๆ' },
    { type: 'item', id: 'admissions', label: 'ใบสมัคร', icon: FileText, path: '/admin/dashboard/admissions' },
    { type: 'item', id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard/messages' },
    { type: 'item', id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/admin/dashboard/faq', adminOnly: true },
    { type: 'section', label: 'ระบบ' },
    { type: 'item', id: 'system-overview', label: 'ภาพรวมระบบ', icon: Info, path: '/admin/dashboard/system-overview', adminOnly: true },
    { type: 'item', id: 'ai-assist', label: 'AI ผู้ช่วยครู', icon: Sparkles, path: '/admin/dashboard/ai-assist' },
    { type: 'item', id: 'papor', label: 'ปพ.5 / ปพ.6 (PDF)', icon: FileText, path: '/admin/dashboard/papor' },
    { type: 'item', id: 'line', label: 'LINE OA', icon: MessageCircle, path: '/admin/dashboard/line', adminOnly: true },
    { type: 'section', label: 'สุขภาพ/Compliance' },
    { type: 'item', id: 'health', label: 'สุขภาพนักเรียน', icon: Award, path: '/admin/dashboard/health' },
    { type: 'item', id: 'dmc-export', label: 'DMC Export', icon: Database, path: '/admin/dashboard/dmc-export', adminOnly: true },
    { type: 'item', id: 'pdpa', label: 'PDPA Dashboard', icon: ShieldCheck, path: '/admin/dashboard/pdpa', adminOnly: true },
];

// Extract active tab from pathname
const getActiveId = (pathname: string): string => {
    // /admin/dashboard/news → news
    const segments = pathname.replace('/admin/dashboard', '').split('/').filter(Boolean);
    return segments[0] || 'dashboard';
};

const SidebarContent = ({
    settings,
    isAdmin,
    userEmail,
    activeId,
    onNavigate,
    onLogout,
}: {
    settings: any;
    isAdmin: boolean;
    userEmail: string;
    activeId: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}) => {
    const { role, allowedMenus } = useAuth();
    const isHomepageActive = activeId === 'homepage-layout';

    return (
        <div className="flex flex-col h-full bg-admin-sidebar text-admin-sidebar-fg">
            {/* School Header */}
            <div className="p-4 border-b border-white/10">
                <Link to="/" className="flex items-center gap-3" onClick={() => onNavigate('/')}>
                    <SchoolLogoMark className="w-10 h-10 bg-admin-accent" fallbackClassName="text-white" />
                    <div>
                        <h1 className="font-bold text-admin-sidebar-fg text-sm">{settings.school_name}</h1>
                        <p className="text-xs text-admin-sidebar-muted">ระบบจัดการ</p>
                    </div>
                </Link>
            </div>

            {/* Homepage Manager — Featured Card (admin palette: green accent on dark sidebar) */}
            {(isAdmin || allowedMenus.includes('homepage-layout')) && (
                <div className="px-3 pt-3">
                    <button
                        onClick={() => onNavigate('/admin/dashboard/homepage-layout')}
                        className={`w-full group relative overflow-hidden rounded-xl p-3 transition-all duration-200 border ${
                            isHomepageActive
                                ? 'bg-admin-accent text-white border-admin-accent shadow-lg shadow-admin-accent/25'
                                : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                    >
                        <div className={`absolute top-1 right-1 ${isHomepageActive ? 'text-white/30' : 'text-admin-sidebar-muted'}`}>
                            <Sparkles className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isHomepageActive
                                    ? 'bg-white/20'
                                    : 'bg-white/10 group-hover:bg-white/15'
                            }`}>
                                <LayoutTemplate className={`w-5 h-5 ${isHomepageActive ? 'text-white' : 'text-admin-accent'}`} />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight ${isHomepageActive ? 'text-white' : 'text-admin-sidebar-fg'}`}>
                                    จัดการหน้าแรก
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isHomepageActive ? 'text-white/70' : 'text-admin-sidebar-muted'}`}>
                                    ลาก วาง จัดบล็อค + Live Preview
                                </p>
                            </div>
                            <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isHomepageActive ? 'text-white/50' : 'text-admin-sidebar-muted group-hover:text-admin-sidebar-fg'
                            }`} />
                        </div>

                        {/* Mini preview strip */}
                        <div className={`mt-2 flex gap-1 ${isHomepageActive ? 'opacity-40' : 'opacity-30 group-hover:opacity-50'}`}>
                            <div className="h-1 flex-[1] rounded-full bg-current" />
                            <div className="h-1 flex-[3] rounded-full bg-current" />
                            <div className="h-1 flex-[1.5] rounded-full bg-current" />
                        </div>
                    </button>
                </div>
            )}

            {/* Regular Menu Items */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item, idx) => {
                    if (item.type === 'section') {
                        return (
                            <p key={`section-${idx}`} className="px-2 pt-4 pb-1 text-[10px] font-semibold text-admin-sidebar-muted/80 uppercase tracking-wider">
                                {item.label}
                            </p>
                        );
                    }
                    if (item.adminOnly && !isAdmin && !allowedMenus.includes(item.id)) return null;
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${isActive
                                ? 'bg-admin-accent text-white shadow-sm'
                                : 'text-admin-sidebar-muted hover:bg-white/10 hover:text-admin-sidebar-fg'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-admin-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate text-admin-sidebar-fg">{userEmail}</p>
                        <p className="text-[10px] text-admin-sidebar-muted">
                            {isAdmin ? 'ผู้ดูแลระบบ' : role === 'teacher' ? 'ครู/บุคลากร' : role === 'parent' ? 'ผู้ปกครอง' : 'ผู้ใช้ทั่วไป'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs bg-transparent border-white/20 text-admin-sidebar-fg hover:bg-white/10 hover:text-admin-sidebar-fg" onClick={() => onNavigate('/')}>
                        <Home className="w-3.5 h-3.5 mr-1" />
                        หน้าเว็บ
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 bg-transparent border-white/20 text-admin-sidebar-fg hover:bg-white/10 hover:text-admin-sidebar-fg" onClick={onLogout}>
                        <LogOut className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const { isAdmin, userEmail, allowedMenus } = useAuth();
    const { settings } = useSchoolSettings();
    const { setOpen: openPalette } = useCommandPalette();
    const location = useLocation();
    const activeId = getActiveId(location.pathname);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

    const handleNavigate = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleLogout = async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.signOut();
        navigate('/admin');
    };

    // Keyboard shortcut: Ctrl/Cmd + Shift + S → เปิดหน้าสแกน
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                navigate('/admin/dashboard/scan');
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-admin-bg">
            {/* Desktop Sidebar — dark slate (always) */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-admin-sidebar shadow-xl z-40 hidden lg:block">
                <SidebarContent
                    settings={settings}
                    isAdmin={isAdmin}
                    userEmail={userEmail}
                    activeId={activeId}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                />
            </aside>

            {/* Mobile Header + Sheet Sidebar */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-admin-surface border-b border-admin-border">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-admin-sidebar border-r-0">
                        <SidebarContent
                            settings={settings}
                            isAdmin={isAdmin}
                            userEmail={userEmail}
                            activeId={activeId}
                            onNavigate={handleNavigate}
                            onLogout={handleLogout}
                        />
                    </SheetContent>
                </Sheet>
                <h1 className="font-bold text-admin-text text-sm truncate flex-1">{settings.school_name}</h1>
                {(isAdmin || allowedMenus.length > 0) && <NotificationBell />}
            </div>

            {/* Desktop Top Bar */}
            {(isAdmin || allowedMenus.length > 0) && (
                <div className="lg:ml-64 hidden lg:flex sticky top-0 z-30 justify-end items-center gap-2 px-6 py-2 bg-admin-surface/95 backdrop-blur border-b border-admin-border">
                    <button
                        onClick={() => openPalette(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-admin-border bg-admin-bg/40 text-xs text-admin-text-muted hover:text-admin-text hover:bg-admin-bg/70 transition-colors min-w-[220px]"
                        aria-label="ค้นหา (Ctrl+K)"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span className="flex-1 text-left">ค้นหานักเรียน, ข่าว, คำสั่ง...</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-admin-border/50 text-[10px] font-mono">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
                    </button>
                    <NotificationBell />
                </div>
            )}

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen">
                {children}
            </main>

            {/* Floating Action Button — สแกน QR ด่วน (mobile only) */}
            <ScanFAB />

            {/* Camera permission pre-request — ขออนุญาตล่วงหน้าตอน login ครั้งแรก */}
            <CameraPermissionPrompt />
        </div>
    );
};
