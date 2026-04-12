import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
    MailOpen,
    SendHorizontal,
    Stamp,
    CalendarCheck,
    ClipboardList,
    UserX,
    BookMarked,
    Award,
    Info,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminLayoutProps {
    children: ReactNode;
}

type MenuItem =
    | { type: 'item'; id: string; label: string; icon: React.ElementType; path: string; adminOnly?: boolean }
    | { type: 'section'; label: string };

const menuItems: MenuItem[] = [
    { type: 'item', id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard' },
    { type: 'section', label: 'เว็บไซต์' },
    { type: 'item', id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/admin/dashboard?tab=settings', adminOnly: true },
    { type: 'item', id: 'hero-slides', label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/dashboard?tab=hero-slides', adminOnly: true },
    { type: 'item', id: 'news', label: 'ข่าวสาร', icon: Newspaper, path: '/admin/dashboard?tab=news' },
    { type: 'item', id: 'gallery', label: 'แกลเลอรี่', icon: Image, path: '/admin/dashboard?tab=gallery', adminOnly: true },
    { type: 'item', id: 'events', label: 'ปฏิทิน', icon: Calendar, path: '/admin/dashboard?tab=events' },
    { type: 'section', label: 'งานสารบรรณ' },
    { type: 'item', id: 'saraban', label: 'ภาพรวม', icon: ClipboardList, path: '/admin/dashboard?tab=saraban', adminOnly: true },
    { type: 'item', id: 'incoming-letters', label: 'หนังสือรับ', icon: MailOpen, path: '/admin/dashboard?tab=incoming-letters', adminOnly: true },
    { type: 'item', id: 'outgoing-letters', label: 'หนังสือส่ง', icon: SendHorizontal, path: '/admin/dashboard?tab=outgoing-letters', adminOnly: true },
    { type: 'item', id: 'orders', label: 'คำสั่ง/ประกาศ', icon: Stamp, path: '/admin/dashboard?tab=orders', adminOnly: true },
    { type: 'item', id: 'meetings', label: 'การประชุม', icon: CalendarCheck, path: '/admin/dashboard?tab=meetings', adminOnly: true },
    { type: 'section', label: 'บุคลากร (HR)' },
    { type: 'item', id: 'leave', label: 'การลา', icon: UserX, path: '/admin/dashboard?tab=leave', adminOnly: true },
    { type: 'item', id: 'training', label: 'การอบรม', icon: BookMarked, path: '/admin/dashboard?tab=training', adminOnly: true },
    { type: 'item', id: 'pa', label: 'PA Assessment', icon: Award, path: '/admin/dashboard?tab=pa', adminOnly: true },
    { type: 'section', label: 'ข้อมูลโรงเรียน' },
    { type: 'item', id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard?tab=milestones', adminOnly: true },
    { type: 'item', id: 'facilities', label: 'สิ่งอำนวยความสะดวก', icon: Building2, path: '/admin/dashboard?tab=facilities', adminOnly: true },
    { type: 'item', id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard?tab=staff' },
    { type: 'item', id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard?tab=administrators', adminOnly: true },
    { type: 'item', id: 'students', label: 'นักเรียน', icon: GraduationCap, path: '/admin/dashboard?tab=students' },
    { type: 'item', id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard?tab=curriculum', adminOnly: true },
    { type: 'item', id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard?tab=activities', adminOnly: true },
    { type: 'section', label: 'ระบบบริการ' },
    { type: 'item', id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/admin/dashboard?tab=waste-bank', adminOnly: true },
    { type: 'item', id: 'attendance', label: 'เช็คชื่อนักเรียน', icon: ClipboardCheck, path: '/admin/dashboard?tab=attendance' },
    { type: 'item', id: 'documents', label: 'จัดการเอกสาร', icon: FolderOpen, path: '/admin/dashboard?tab=documents', adminOnly: true },
    { type: 'item', id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/admin/dashboard?tab=analytics', adminOnly: true },
    { type: 'item', id: 'page-builder', label: 'Page Builder', icon: Blocks, path: '/admin/page-builder', adminOnly: true },
    { type: 'section', label: 'อื่นๆ' },
    { type: 'item', id: 'admissions', label: 'ใบสมัคร', icon: FileText, path: '/admin/dashboard?tab=admissions' },
    { type: 'item', id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard?tab=messages' },
    { type: 'item', id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/admin/dashboard?tab=faq', adminOnly: true },
    { type: 'section', label: 'ระบบ' },
    { type: 'item', id: 'system-overview', label: 'ภาพรวมระบบ', icon: Info, path: '/admin/dashboard?tab=system-overview', adminOnly: true },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const { settings } = useSchoolSettings();
    const { isAdmin } = useUserRole();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'dashboard';
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserEmail(session?.user?.email ?? '');
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    return (
        <div className="min-h-screen bg-secondary">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg z-40">
                <div className="p-4 border-b border-border">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-accent font-bold">คผ</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-primary text-sm">{settings.school_name}</h1>
                            <p className="text-xs text-muted-foreground">ระบบจัดการ</p>
                        </div>
                    </Link>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
                    {menuItems.map((item, idx) => {
                        if (item.type === 'section') {
                            return (
                                <p key={`section-${idx}`} className="px-2 pt-3 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                    {item.label}
                                </p>
                            );
                        }
                        if (item.adminOnly && !isAdmin) return null;
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">ผู้ดูแลระบบ</p>
                            <p className="text-xs text-muted-foreground">{userEmail}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/')}>
                            <Home className="w-4 h-4 mr-1" />
                            หน้าเว็บ
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
};
