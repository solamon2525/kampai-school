import { SlidersHorizontal } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuickMenu } from '@/components/admin/shared/QuickMenu';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TeacherPendingTasksCard } from '@/components/teacher/TeacherPendingTasksCard';
import { TEACHER_MENU } from './teacher-menu';
// Keep existing teacher pages compatible while the menu source lives in a component-free module.
export { TEACHER_MENU } from './teacher-menu';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { role, allowedMenus = [] } = useAuth();
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
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
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

                <TeacherPendingTasksCard staffId={link?.staff_id ?? null} />

                {(role === 'admin' || allowedMenus.length > 0) && (
                    <Card className="border-emerald-200 bg-emerald-50/50">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5 text-left">
                                    <h4 className="font-bold text-sm text-emerald-950">ระบบบริหารหลังบ้าน</h4>
                                    <p className="text-xs text-emerald-700/80">คุณได้รับสิทธิ์เข้าใช้งานระบบงานเพิ่มเติมจำนวน {allowedMenus.length} ระบบ</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/admin/dashboard')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                                เข้าสู่ระบบหลังบ้าน
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <QuickMenu context="teacher" />
            </div>
        </RolePortalLayout>
    );
}

export { MENU as TEACHER_MENU };
