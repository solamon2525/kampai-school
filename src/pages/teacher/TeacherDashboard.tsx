import { LayoutDashboard, ClipboardCheck, PenLine, Calendar, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/teacher' },
    { id: 'schedule', label: 'ตารางสอน', icon: Calendar, path: '/teacher/schedule' },
    { id: 'attendance', label: 'เช็คชื่อ', icon: ClipboardCheck, path: '/teacher/attendance' },
    { id: 'scores', label: 'คะแนน', icon: PenLine, path: '/teacher/scores' },
    { id: 'rewards', label: 'อนุมัติรางวัล', icon: Gift, path: '/teacher/rewards-approval' },
];

export default function TeacherDashboard() {
    const { data: link } = useLinkedRecord();

    const { data: staff } = useQuery({
        queryKey: ['staff-self', link?.staff_id],
        enabled: !!link?.staff_id,
        queryFn: async () => {
            const { data } = await supabase.from('staff').select('full_name, position').eq('id', link!.staff_id!).maybeSingle();
            return data;
        },
    });

    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={MENU} accent="teacher">
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">สวัสดี {staff?.full_name || 'คุณครู'}</h1>
                    <p className="text-muted-foreground mt-1">{staff?.position || 'ครู/บุคลากร'}</p>
                </div>

                {!link?.staff_id && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับข้อมูลบุคลากร กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                    {MENU.slice(1).map((item) => (
                        <Link key={item.id} to={item.path}>
                            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">เปิดเพื่อจัดการ</p>
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

export { MENU as TEACHER_MENU };
