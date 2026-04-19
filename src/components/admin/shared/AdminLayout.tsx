import { ReactNode, useState } from 'react';
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
    HelpCircle,
    History,
    Building2,
    Recycle,
    ClipboardCheck,
    FolderOpen,
    SlidersHorizontal,
    BarChart2,
    Blocks,
    PenLine,
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
    LayoutTemplate,
    ExternalLink,
    Sparkles,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface AdminLayoutProps {
    children: ReactNode;
}

type MenuItem =
    | { type: 'item'; id: string; label: string; icon: React.ElementType; path: string; adminOnly?: boolean }
    | { type: 'section'; label: string };

const menuItems: MenuItem[] = [
    { type: 'item', id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard' },
    { type: 'section', label: 'เว็บไซต์' },
    { type: 'item', id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/admin/dashboard/settings', adminOnly: true },
    { type: 'item', id: 'hero-slides', label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/dashboard/hero-slides', adminOnly: true },
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
    { type: 'item', id: 'leave', label: 'การลา', icon: UserX, path: '/admin/dashboard/leave', adminOnly: true },
    { type: 'item', id: 'training', label: 'การอบรม', icon: BookMarked, path: '/admin/dashboard/training', adminOnly: true },
    { type: 'item', id: 'pa', label: 'PA Assessment', icon: Award, path: '/admin/dashboard/pa', adminOnly: true },
    { type: 'section', label: 'ฝ่ายวิชาการ' },
    { type: 'item', id: 'academic', label: 'ฝ่ายวิชาการ', icon: BookOpen, path: '/admin/dashboard/academic', adminOnly: true },
    { type: 'section', label: 'ข้อมูลโรงเรียน' },
    { type: 'item', id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard/milestones', adminOnly: true },
    { type: 'item', id: 'facilities', label: 'สิ่งอำนวยความสะดวก', icon: Building2, path: '/admin/dashboard/facilities', adminOnly: true },
    { type: 'item', id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard/staff' },
    { type: 'item', id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard/administrators', adminOnly: true },
    { type: 'item', id: 'students', label: 'นักเรียน', icon: GraduationCap, path: '/admin/dashboard/students' },
    { type: 'item', id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard/curriculum', adminOnly: true },
    { type: 'item', id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard/activities', adminOnly: true },
    { type: 'section', label: 'ระบบบริการ' },
    { type: 'item', id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/admin/dashboard/waste-bank', adminOnly: true },
    { type: 'item', id: 'attendance', label: 'เช็คชื่อนักเรียน', icon: ClipboardCheck, path: '/admin/dashboard/attendance' },
    { type: 'item', id: 'scores', label: 'คะแนนเก็บ', icon: PenLine, path: '/admin/dashboard/scores' },
    { type: 'item', id: 'conduct', label: 'คะแนนความดี', icon: Star, path: '/admin/dashboard/conduct' },
    { type: 'item', id: 'documents', label: 'จัดการเอกสาร', icon: FolderOpen, path: '/admin/dashboard/documents', adminOnly: true },
    { type: 'item', id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/admin/dashboard/analytics', adminOnly: true },
    { type: 'item', id: 'page-builder', label: 'Page Builder', icon: Blocks, path: '/admin/page-builder', adminOnly: true },
    { type: 'section', label: 'อื่นๆ' },
    { type: 'item', id: 'admissions', label: 'ใบสมัคร', icon: FileText, path: '/admin/dashboard/admissions' },
    { type: 'item', id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard/messages' },
    { type: 'item', id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/admin/dashboard/faq', adminOnly: true },
    { type: 'section', label: 'ระบบ' },
    { type: 'item', id: 'system-overview', label: 'ภาพรวมระบบ', icon: Info, path: '/admin/dashboard/system-overview', adminOnly: true },
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
    const isHomepageActive = activeId === 'homepage-layout';

    return (
        <div className="flex flex-col h-full">
            {/* School Header */}
            <div className="p-4 border-b border-border">
                <Link to="/" className="flex items-center gap-3" onClick={() => onNavigate('/')}>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-accent font-bold">คผ</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-primary text-sm">{settings.school_name}</h1>
                        <p className="text-xs text-muted-foreground">ระบบจัดการ</p>
                    </div>
                </Link>
            </div>

            {/* Homepage Manager — Featured Card */}
            {isAdmin && (
                <div className="px-3 pt-3">
                    <button
                        onClick={() => onNavigate('/admin/dashboard/homepage-layout')}
                        className={`w-full group relative overflow-hidden rounded-xl p-3 transition-all duration-200 ${
                            isHomepageActive
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                : 'bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200/60'
                        }`}
                    >
                        {/* Sparkle decoration */}
                        <div className={`absolute top-1 right-1 ${isHomepageActive ? 'text-white/30' : 'text-violet-300'}`}>
                            <Sparkles className="w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isHomepageActive
                                    ? 'bg-white/20'
                                    : 'bg-violet-100 group-hover:bg-violet-200'
                            }`}>
                                <LayoutTemplate className={`w-5 h-5 ${isHomepageActive ? 'text-white' : 'text-violet-600'}`} />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight ${isHomepageActive ? 'text-white' : 'text-violet-900'}`}>
                                    จัดการหน้าแรก
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isHomepageActive ? 'text-white/70' : 'text-violet-500'}`}>
                                    ลาก วาง จัดบล็อค + Live Preview
                                </p>
                            </div>
                            <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isHomepageActive ? 'text-white/50' : 'text-violet-300 group-hover:text-violet-500'
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
                            <p key={`section-${idx}`} className="px-2 pt-4 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                {item.label}
                            </p>
                        );
                    }
                    if (item.adminOnly && !isAdmin) return null;
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{userEmail}</p>
                        <p className="text-[10px] text-muted-foreground">{isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onNavigate('/')}>
                        <Home className="w-3.5 h-3.5 mr-1" />
                        หน้าเว็บ
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={onLogout}>
                        <LogOut className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const { isAdmin, userEmail } = useAuth();
    const { settings } = useSchoolSettings();
    const location = useLocation();
    const activeId = getActiveId(location.pathname);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNavigate = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleLogout = async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.signOut();
        navigate('/admin');
    };

    return (
        <div className="min-h-screen bg-secondary">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg z-40 hidden lg:block">
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
            <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
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
                <h1 className="font-bold text-primary text-sm truncate flex-1">{settings.school_name}</h1>
                <ThemeToggle />
                {isAdmin && <NotificationBell />}
            </div>

            {/* Desktop Top Bar */}
            {isAdmin && (
                <div className="lg:ml-64 hidden lg:flex sticky top-0 z-30 justify-end items-center gap-2 px-6 py-2 bg-card/80 backdrop-blur border-b border-border">
                    <ThemeToggle />
                    <NotificationBell />
                </div>
            )}

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
};
