import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, Eye } from 'lucide-react';

type UserRole = 'admin' | 'teacher' | 'viewer';

interface UserRoleRow {
    id: string;
    user_id: string;
    role: UserRole;
    email?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'ผู้ดูแลระบบ',
    teacher: 'ครู/บุคลากร',
    viewer: 'ดูอย่างเดียว',
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
    admin: Shield,
    teacher: UserCheck,
    viewer: Eye,
};

export const UserRolesManagement = () => {
    const [rows, setRows] = useState<UserRoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRoles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_roles' as any)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            toast({ title: 'โหลดข้อมูลล้มเหลว', variant: 'destructive' });
        } else {
            setRows((data as UserRoleRow[]) || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchRoles(); }, []);

    const updateRole = async (id: string, role: UserRole) => {
        const { error } = await supabase
            .from('user_roles' as any)
            .update({ role })
            .eq('id', id);

        if (error) {
            toast({ title: 'อัปเดตสิทธิ์ล้มเหลว', variant: 'destructive' });
        } else {
            toast({ title: 'อัปเดตสิทธิ์สำเร็จ' });
            setRows(prev => prev.map(r => r.id === id ? { ...r, role } : r));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
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
                            const Icon = ROLE_ICONS[row.role];
                            return (
                                <div key={row.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">{row.email || row.user_id}</p>
                                            <p className="text-xs text-muted-foreground">{ROLE_LABELS[row.role]}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['admin', 'teacher', 'viewer'] as UserRole[]).map(r => (
                                            <Button
                                                key={r}
                                                size="sm"
                                                variant={row.role === r ? 'default' : 'outline'}
                                                onClick={() => updateRole(row.id, r)}
                                            >
                                                {ROLE_LABELS[r]}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
