import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, Eye, Users, Heart } from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type UserRole = 'admin' | 'teacher' | 'viewer' | 'parent';

interface UserRoleRow {
    id: string;
    user_id: string;
    role: UserRole;
    staff_id: string | null;
    student_id: string | null;
    email?: string;
}

interface StaffOpt { id: string; full_name: string }
interface StudentOpt { id: string; full_name: string; grade_level?: string }

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'ผู้ดูแลระบบ',
    teacher: 'ครู/บุคลากร',
    viewer: 'ดูอย่างเดียว',
    parent: 'ผู้ปกครอง',
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
    admin: Shield,
    teacher: UserCheck,
    viewer: Eye,
    parent: Heart,
};

export const UserRolesManagement = () => {
    const [rows, setRows] = useState<UserRoleRow[]>([]);
    const [staff, setStaff] = useState<StaffOpt[]>([]);
    const [students, setStudents] = useState<StudentOpt[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, staffRes, studentsRes] = await Promise.all([
                supabase.from('user_roles' as any).select('*').order('created_at', { ascending: true }),
                supabase.from('staff').select('id, full_name').order('full_name'),
                supabase.from('students').select('id, full_name, grade_level').order('full_name'),
            ]);

            if (rolesRes.error) {
                console.warn('user_roles:', rolesRes.error.message);
            } else {
                setRows((rolesRes.data as UserRoleRow[]) || []);
            }
            if (!staffRes.error) setStaff((staffRes.data as StaffOpt[]) || []);
            if (!studentsRes.error) setStudents((studentsRes.data as StudentOpt[]) || []);
        } catch {
            // silent
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const updateRow = async (id: string, patch: Partial<UserRoleRow>) => {
        const { error } = await supabase
            .from('user_roles' as any)
            .update(patch as any)
            .eq('id', id);

        if (error) {
            toast({ title: 'อัปเดตสิทธิ์ล้มเหลว', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'อัปเดตสิทธิ์สำเร็จ' });
            setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    จัดการสิทธิ์ผู้ใช้งาน
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
                ) : rows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">ยังไม่มีผู้ใช้งานในระบบ</p>
                ) : (
                    <div className="space-y-3">
                        {rows.map(row => {
                            const Icon = ROLE_ICONS[row.role] || Eye;
                            return (
                                <div key={row.id} className="p-3 border rounded-lg space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{row.email || row.user_id}</p>
                                            <p className="text-xs text-muted-foreground">{ROLE_LABELS[row.role]}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(['admin', 'teacher', 'parent', 'viewer'] as UserRole[]).map(r => (
                                            <Button
                                                key={r}
                                                size="sm"
                                                variant={row.role === r ? 'default' : 'outline'}
                                                onClick={() => updateRow(row.id, { role: r })}
                                            >
                                                {ROLE_LABELS[r]}
                                            </Button>
                                        ))}
                                    </div>
                                    {row.role === 'teacher' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">เชื่อมกับบุคลากร</label>
                                            <Select
                                                value={row.staff_id ?? 'none'}
                                                onValueChange={(v) => updateRow(row.id, { staff_id: v === 'none' ? null : v })}
                                            >
                                                <SelectTrigger className="h-9"><SelectValue placeholder="เลือกบุคลากร" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">— ไม่เชื่อม —</SelectItem>
                                                    {staff.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {row.role === 'parent' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">เชื่อมกับนักเรียน (บุตร)</label>
                                            <Select
                                                value={row.student_id ?? 'none'}
                                                onValueChange={(v) => updateRow(row.id, { student_id: v === 'none' ? null : v })}
                                            >
                                                <SelectTrigger className="h-9"><SelectValue placeholder="เลือกนักเรียน" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">— ไม่เชื่อม —</SelectItem>
                                                    {students.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.full_name}{s.grade_level ? ` (${s.grade_level})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
