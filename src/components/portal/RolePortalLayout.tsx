import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Home, UserCheck } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface PortalMenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
}

interface RolePortalLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    menu: PortalMenuItem[];
    accent: 'teacher' | 'parent';
}

const ACCENT = {
    teacher: 'from-indigo-600 to-blue-600',
    parent: 'from-pink-600 to-rose-600',
};

export const RolePortalLayout = ({ children, title, subtitle, menu, accent }: RolePortalLayoutProps) => {
    const { userEmail, role } = useAuth();
    const { settings } = useSchoolSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const Sidebar = () => (
        <div className="flex flex-col h-full">
            <div className={`p-4 bg-gradient-to-r ${ACCENT[accent]} text-white`}>
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">คผ</div>
                    <div>
                        <h1 className="font-bold text-sm">{settings.school_name}</h1>
                        <p className="text-xs opacity-80">{title}</p>
                    </div>
                </Link>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menu.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <button
                            key={item.id}
                            onClick={() => { navigate(item.path); setMobileOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="p-3 border-t">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{userEmail}</p>
                        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => navigate('/')}>
                        <Home className="w-3.5 h-3.5 mr-1" /> หน้าเว็บ
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={handleLogout}>
                        <LogOut className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary">
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r shadow-lg z-40 hidden lg:block">
                <Sidebar />
            </aside>
            <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button></SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72"><Sidebar /></SheetContent>
                </Sheet>
                <h1 className="font-bold text-primary text-sm truncate flex-1">{title}</h1>
                <ThemeToggle />
            </div>
            <div className="lg:ml-64 hidden lg:flex sticky top-0 z-30 justify-end items-center gap-2 px-6 py-2 bg-card/80 backdrop-blur border-b">
                <ThemeToggle />
            </div>
            <main className="lg:ml-64 min-h-screen">{children}</main>
        </div>
    );
};
