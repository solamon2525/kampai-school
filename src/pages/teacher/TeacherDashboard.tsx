import { LayoutDashboard, ClipboardCheck, PenLine, Calendar, Gift, FolderOpen } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuickMenu } from '@/components/admin/shared/QuickMenu';

const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/teacher' },
    { id: 'schedule', label: 'ตารางสอน', icon: Calendar, path: '/teacher/schedule' },
    { id: 'attendance', label: 'เช็คชื่อ', icon: ClipboardCheck, path: '/teacher/attendance' },
    { id: 'scores', label: 'คะแนน', icon: PenLine, path: '/teacher/scores' },
    { id: 'rewards', label: 'อนุมัติรางวัล', icon: Gift, path: '/teacher/rewards-approval' },
    { id: 'edu-hub', label: 'คลังสื่อของฉัน', icon: FolderOpen, path: '/teacher/edu-hub' },
];

export default function TeacherDashboard() {
    const { data: link } = useLinkedRecord();

    const { data: staff } = useQuery({
        queryKey: ['staff-self', link?.staff_id],
        enabled: !!link?.staff_id,
        queryFn: async () => {
            const { data } = await supabase.from('staff').select('name, position').eq('id', link!.staff_id!).maybeSingle();
            return data;
        },
    });

    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={MENU} accent="teacher">
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">สวัสดี {staff?.name || 'คุณครู'}</h1>
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

                <QuickMenu context="teacher" />
            </div>
        </RolePortalLayout>
    );
}

export { MENU as TEACHER_MENU };
