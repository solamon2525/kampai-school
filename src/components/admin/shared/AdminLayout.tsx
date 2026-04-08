import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/admin/dashboard?tab=settings' },
    { id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard?tab=milestones' },
    { id: 'facilities', label: 'สิ่งอำนวยความสะดวก', icon: Building2, path: '/admin/dashboard?tab=facilities' },
    { id: 'news', label: 'ข่าวสาร', icon: Newspaper, path: '/admin/dashboard?tab=news' },
    { id: 'gallery', label: 'แกลเลอรี่', icon: Image, path: '/admin/dashboard?tab=gallery' },
    { id: 'events', label: 'ปฏิทิน', icon: Calendar, path: '/admin/dashboard?tab=events' },
    { id: 'students', label: 'นักเรียน', icon: GraduationCap, path: '/admin/dashboard?tab=students' },
    { id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard?tab=staff' },
    { id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard?tab=administrators' },
    { id: 'admissions', label: 'ใบสมัคร', icon: FileText, path: '/admin/dashboard?tab=admissions' },
    { id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard?tab=messages' },
    { id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard?tab=curriculum' },
    { id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard?tab=activities' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/admin/dashboard?tab=faq' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const { settings } = useSchoolSettings();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'dashboard';

    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
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

                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-200px)]">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
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
                            <p className="text-xs text-muted-foreground">admin@kkschool.ac.th</p>
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
