import { LayoutDashboard, ClipboardCheck, PenLine, Star, Recycle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/parent' },
    { id: 'attendance', label: 'การมาเรียน', icon: ClipboardCheck, path: '/parent/attendance' },
    { id: 'scores', label: 'ผลการเรียน', icon: PenLine, path: '/parent/scores' },
    { id: 'conduct', label: 'ความประพฤติ', icon: Star, path: '/parent/conduct' },
    { id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/parent/waste-bank' },
    { id: 'savings-bank', label: 'ธนาคารพอเพียง', icon: Wallet, path: '/parent/savings-bank' },
];

export default function ParentDashboard() {
    const { data: link } = useLinkedRecord();

    const { data: student } = useQuery({
        queryKey: ['student-self', link?.student_id],
        enabled: !!link?.student_id,
        queryFn: async () => {
            const { data } = await supabase
                .from('students')
                .select('full_name, grade_level, student_number')
                .eq('id', link!.student_id!)
                .maybeSingle();
            return data;
        },
    });

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={MENU} accent="parent">
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">ผู้ปกครองของ {student?.full_name || 'นักเรียน'}</h1>
                    {student && (
                        <p className="text-muted-foreground mt-1">
                            {student.grade_level ? `${student.grade_level} • ` : ''}
                            {student.student_number ? `รหัส ${student.student_number}` : ''}
                        </p>
                    )}
                </div>

                {!link?.student_id && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับนักเรียน กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                )}

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
