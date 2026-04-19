import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { TEACHER_MENU } from './TeacherDashboard';
import { ListSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

export default function TeacherSchedule() {
    const { data: link } = useLinkedRecord();

    const { data: schedules, isLoading } = useQuery({
        queryKey: ['teacher-schedule', link?.staff_id],
        enabled: !!link?.staff_id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_schedules' as any)
                .select('*')
                .eq('staff_id', link!.staff_id!);
            if (error) throw error;
            return data as any[];
        },
    });

    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
            <div className="p-8 space-y-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6" /> ตารางสอนของฉัน
                </h1>
                <Card>
                    <CardHeader><CardTitle className="text-base">รายการคาบสอน</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <ListSkeleton count={5} showAvatar={false} />
                        ) : !schedules || schedules.length === 0 ? (
                            <EmptyState
                                variant="inline"
                                illustration={<NoDataIllustration />}
                                title="ยังไม่มีตารางสอน"
                                description="ยังไม่ได้กำหนดตารางคาบเรียนให้คุณในภาคการศึกษานี้"
                            />
                        ) : (
                            <div className="space-y-2">
                                {schedules.map((s: any) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                                        <div>
                                            <p className="font-medium">{s.subject_name || 'รายวิชา'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {DAYS[s.day_of_week - 1] || s.day_of_week} • คาบที่ {s.period}
                                                {s.grade_level ? ` • ${s.grade_level}` : ''}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{s.room || ''}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RolePortalLayout>
    );
}
