import { LayoutDashboard, ClipboardCheck, PenLine, Star, Recycle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useActiveChild } from '@/hooks/useActiveChild';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { LineConnectCard } from '@/components/parent/LineConnectCard';

const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/parent' },
    { id: 'attendance', label: 'การมาเรียน', icon: ClipboardCheck, path: '/parent/attendance' },
    { id: 'scores', label: 'ผลการเรียน', icon: PenLine, path: '/parent/scores' },
    { id: 'conduct', label: 'ความประพฤติ', icon: Star, path: '/parent/conduct' },
    { id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/parent/waste-bank' },
    { id: 'savings-bank', label: 'ธนาคารพอเพียง', icon: Wallet, path: '/parent/savings-bank' },
];

export default function ParentDashboard() {
    const { activeChild, children: kids } = useActiveChild();

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={MENU} accent="parent">
            <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">ผู้ปกครองของ {activeChild?.name || 'นักเรียน'}</h1>
                        {activeChild && (
                            <p className="text-muted-foreground mt-1">
                                {activeChild.class ? `${activeChild.class}${activeChild.room ? `/${activeChild.room}` : ''} • ` : ''}
                                {activeChild.student_code ? `รหัส ${activeChild.student_code}` : ''}
                            </p>
                        )}
                    </div>
                    {kids.length > 0 && <ChildSwitcher />}
                </div>

                {!kids.length && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับนักเรียน กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                )}

                <LineConnectCard />

                <div className="grid md:grid-cols-2 gap-4">
                    {MENU.slice(1).map((item) => (
                        <Link key={item.id} to={item.path}>
                            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">ดูรายละเอียด</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </RolePortalLayout>
    );
}

export { MENU as PARENT_MENU };
