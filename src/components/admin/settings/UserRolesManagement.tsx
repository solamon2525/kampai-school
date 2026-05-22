import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, Eye, Users, Heart, ChevronDown, ChevronUp, Lock } from 'lucide-react';
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

interface StaffOpt { id: string; name: string }
interface StudentOpt { id: string; name: string; class?: string }

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

interface MenuConfig {
    id: string;
    label: string;
}

interface MenuGroup {
    category: string;
    items: MenuConfig[];
}

const MENU_GROUPS: MenuGroup[] = [
    {
        category: 'ศูนย์เอกสาร & คุณภาพการศึกษา',
        items: [
            { id: 'docs-hub', label: 'ศูนย์เอกสาร' },
            { id: 'budget', label: 'การเงิน/งบประมาณ' },
            { id: 'sar', label: 'SAR ประกันคุณภาพ' },
            { id: 'ics', label: 'ควบคุมภายใน (ICS)' },
            { id: 'action-plan', label: 'แผนปฏิบัติการ' },
            { id: 'doc-templates', label: 'แบบฟอร์มสำเร็จรูป' },
            { id: 'student-docs', label: 'เอกสารนักเรียน' },
            { id: 'documents', label: 'คลังเอกสารทั่วไป' },
        ],
    },
    {
        category: 'งานสารบรรณ (ระบบสารบรรณอิเล็กทรอนิกส์)',
        items: [
            { id: 'saraban', label: 'ภาพรวมงานสารบรรณ' },
            { id: 'incoming-letters', label: 'หนังสือรับเข้า' },
            { id: 'outgoing-letters', label: 'หนังสือส่งออก' },
            { id: 'orders', label: 'คำสั่ง/ประกาศ' },
            { id: 'meetings', label: 'การประชุมโรงเรียน' },
        ],
    },
    {
        category: 'งานวิชาการ & บุคลากร (HR)',
        items: [
            { id: 'leave', label: 'การอนุมัติการลา' },
            { id: 'training', label: 'บันทึกอบรมสัมมนา' },
            { id: 'pa', label: 'PA Assessment' },
            { id: 'academic', label: 'ฝ่ายวิชาการ' },
            { id: 'administrators', label: 'จัดการผู้บริหาร' },
        ],
    },
    {
        category: 'ข้อมูลโรงเรียน & บริการโรงเรียน',
        items: [
            { id: 'dashboard-school', label: 'แดชบอร์ดข้อมูลโรงเรียน' },
            { id: 'curriculum', label: 'จัดการหลักสูตร' },
            { id: 'activities', label: 'จัดการกิจกรรม' },
            { id: 'milestones', label: 'ประวัติโรงเรียน' },
            { id: 'facilities', label: 'สิ่งอำนวยความสะดวก' },
            { id: 'waste-bank', label: 'ธนาคารขยะ' },
            { id: 'savings-bank', label: 'ธนาคารพอเพียง' },
            { id: 'educational-hub', label: 'คลังสื่อการเรียนการสอน' },
            { id: 'games', label: 'ข้อมูลระบบการเล่นเกม' },
            { id: 'analytics', label: 'ระบบวิเคราะห์สถิติ (Analytics)' },
        ],
    },
    {
        category: 'จัดการเว็บไซต์ (CMS)',
        items: [
            { id: 'homepage-layout', label: 'จัดการหน้าแรก (Drag & Drop)' },
            { id: 'menu', label: 'เมนูเว็บไซต์หลัก' },
            { id: 'hero-slides', label: 'ภาพสไลด์แบนเนอร์' },
            { id: 'testimonials', label: 'คำชื่นชม / Testimonials' },
            { id: 'partners', label: 'องค์กรพันธมิตร' },
            { id: 'gallery', label: 'แกลเลอรี่ภาพโรงเรียน' },
            { id: 'settings', label: 'ตั้งค่าระบบ' },
            { id: 'theme', label: 'ธีมสีระบบ (Theme)' },
            { id: 'faq', label: 'ระบบถาม-ตอบ FAQ' },
            { id: 'system-overview', label: 'ภาพรวมระบบโรงเรียน' },
        ],
    },
];

export const UserRolesManagement = () => {
    const [rows, setRows] = useState<UserRoleRow[]>([]);
    const [staff, setStaff] = useState<StaffOpt[]>([]);
    const [students, setStudents] = useState<StudentOpt[]>([]);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, staffRes, studentsRes, permRes] = await Promise.all([
                supabase.from('user_roles' as any).select('*').order('created_at', { ascending: true }),
                supabase.from('staff').select('id, name').order('name'),
                supabase.from('students').select('id, name, class').order('name'),
                supabase.from('user_menu_permissions' as any).select('user_id, menu_ids'),
            ]);

            if (rolesRes.error) {
                console.warn('user_roles:', rolesRes.error.message);
            } else {
                setRows((rolesRes.data as UserRoleRow[]) || []);
            }
            if (!staffRes.error) setStaff((staffRes.data as StaffOpt[]) || []);
            if (!studentsRes.error) setStudents((studentsRes.data as StudentOpt[]) || []);
            
            if (!permRes.error && permRes.data) {
                const mapping: Record<string, string[]> = {};
                permRes.data.forEach((p: any) => {
                    mapping[p.user_id] = p.menu_ids || [];
                });
                setPermissions(mapping);
            }
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

    const toggleExpand = (rowId: string) => {
        setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const togglePermission = async (userId: string, menuId: string) => {
        const current = permissions[userId] || [];
        const updated = current.includes(menuId)
            ? current.filter(id => id !== menuId)
            : [...current, menuId];

        const { error } = await supabase
            .from('user_menu_permissions' as any)
            .upsert({
                user_id: userId,
                menu_ids: updated,
                updated_at: new Date().toISOString()
            });

        if (error) {
            toast({
                title: 'เกิดข้อผิดพลาดในการบันทึกสิทธิ์',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setPermissions(prev => ({
                ...prev,
                [userId]: updated,
            }));
            toast({
                title: 'อัปเดตสิทธิ์การเข้าถึงเมนูสำเร็จ',
                description: 'ระบบจะนำสิทธิ์ใหม่นี้ไปปรับใช้กับการเข้าสู่ระบบถัดไปทันที',
            });
        }
    };

    const grantAllPermissions = async (userId: string) => {
        const allMenuIds = MENU_GROUPS.flatMap(g => g.items.map(i => i.id));
        const { error } = await supabase
            .from('user_menu_permissions' as any)
            .upsert({
                user_id: userId,
                menu_ids: allMenuIds,
                updated_at: new Date().toISOString()
            });

        if (error) {
            toast({
                title: 'เกิดข้อผิดพลาดในการบันทึกสิทธิ์',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setPermissions(prev => ({
                ...prev,
                [userId]: allMenuIds,
            }));
            toast({
                title: 'มอบสิทธิ์ทั้งหมดสำเร็จ',
                description: 'ครูคนนี้จะสามารถเข้าใช้งานและจัดการระบบได้ทุกเมนูหลังบ้าน',
            });
        }
    };

    const revokeAllPermissions = async (userId: string) => {
        const { error } = await supabase
            .from('user_menu_permissions' as any)
            .upsert({
                user_id: userId,
                menu_ids: [],
                updated_at: new Date().toISOString()
            });

        if (error) {
            toast({
                title: 'เกิดข้อผิดพลาดในการบันทึกสิทธิ์',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setPermissions(prev => ({
                ...prev,
                [userId]: [],
            }));
            toast({
                title: 'ยกเลิกสิทธิ์ทั้งหมดสำเร็จ',
            });
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
                                        <div className="space-y-3">
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
                                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Dynamic Menu Permissions Section */}
                                            <div className="mt-3 pt-3 border-t border-dashed">
                                                <button
                                                    onClick={() => toggleExpand(row.user_id)}
                                                    className="flex items-center justify-between w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <Lock className="w-3.5 h-3.5" />
                                                        กำหนดสิทธิ์การเข้าถึงเมนูหลังบ้าน ({ (permissions[row.user_id] || []).length } เมนู)
                                                    </span>
                                                    {expandedRows[row.user_id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                
                                                {expandedRows[row.user_id] && (
                                                    <div className="mt-3 space-y-4 p-3 bg-muted/30 rounded-lg border animate-in fade-in-50 duration-200">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b gap-2">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                สิทธิ์การทำงาน: สร้าง / แก้ไข / ลบ / ดูข้อมูลเมนูที่เลือก
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 text-[10px] text-primary"
                                                                    onClick={() => grantAllPermissions(row.user_id)}
                                                                >
                                                                    เลือกทั้งหมด
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 text-[10px] text-destructive"
                                                                    onClick={() => revokeAllPermissions(row.user_id)}
                                                                >
                                                                    ล้างทั้งหมด
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {MENU_GROUPS.map((group) => (
                                                                <div key={group.category} className="space-y-1.5 p-2.5 bg-white/40 dark:bg-black/10 rounded-md border border-slate-100 dark:border-white/5">
                                                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-1.5 mb-1">{group.category}</h4>
                                                                    <div className="space-y-1">
                                                                        {group.items.map((item) => {
                                                                            const hasPerm = (permissions[row.user_id] || []).includes(item.id);
                                                                            return (
                                                                                <label
                                                                                    key={item.id}
                                                                                    className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer select-none transition-all duration-150 ${
                                                                                        hasPerm
                                                                                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                                                                            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                                                                                    }`}
                                                                                >
                                                                                    <span className={`font-medium ${hasPerm ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                                        {item.label}
                                                                                    </span>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={hasPerm}
                                                                                        onChange={() => togglePermission(row.user_id, item.id)}
                                                                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700"
                                                                                    />
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
                                                            {s.name}{s.class ? ` (${s.class})` : ''}
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
