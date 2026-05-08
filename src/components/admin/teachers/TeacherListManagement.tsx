import { useState, useEffect } from 'react';
import { staffService, administratorsService } from '@/services/staff.service';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pencil,
  Users,
  AlertCircle,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { deleteStorageImage } from '@/utils/storageUtils';

interface Teacher {
  id: string;
  name: string;
  position: string;
  subject: string | null;
  photo_url: string | null;
  order_position: number;
  email: string | null;
  phone: string | null;
  department: string | null;
  staff_type: 'teaching' | 'support' | 'admin';
  source: 'staff' | 'administrators';
}

type PersonnelKind = 'teaching' | 'support' | 'admin';

const KIND_META: Record<PersonnelKind, { label: string; source: 'staff' | 'administrators'; icon: typeof GraduationCap }> = {
  teaching: { label: 'ครู', source: 'staff', icon: GraduationCap },
  support: { label: 'เจ้าหน้าที่สนับสนุน', source: 'staff', icon: Briefcase },
  admin: { label: 'ผู้บริหาร', source: 'administrators', icon: UserCog },
};

interface FormState {
  name: string;
  position: string;
  photo_url: string;
  email: string;
  order_position: string;
  subject: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  position: '',
  photo_url: '',
  email: '',
  order_position: '99',
  subject: '',
};

export function TeacherListManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherStaffIds, setTeacherStaffIds] = useState<Set<string>>(new Set());
  const [adminStaffIds, setAdminStaffIds] = useState<Set<string>>(new Set());
  const [adminAccountIds, setAdminAccountIds] = useState<Set<string>>(new Set());

  // Unified form (add + edit)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formKind, setFormKind] = useState<PersonnelKind>('teaching');
  const [formEditingId, setFormEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Type picker (before add)
  const [pickerOpen, setPickerOpen] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  // Create account dialog
  const [createTarget, setCreateTarget] = useState<Teacher | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<Teacher | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await staffService.getAllPersonnel();
    if (error) {
      toast({ title: 'โหลดข้อมูลไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      setTeachers((data as Teacher[]) || []);
    }
    setLoading(false);
  };

  const fetchAccountStatus = async () => {
    const { data } = await staffService.getTeacherAccountStatus();
    const teacherSet = new Set<string>();
    const adminSet = new Set<string>();
    const adminAccountSet = new Set<string>();
    (data || []).forEach((r: any) => {
      if (r.staff_id) {
        if ((r.role as string) === 'admin') adminSet.add(r.staff_id as string);
        else teacherSet.add(r.staff_id as string);
      }
      if (r.administrator_id && (r.role as string) === 'admin') {
        adminAccountSet.add(r.administrator_id as string);
      }
    });
    setTeacherStaffIds(teacherSet);
    setAdminStaffIds(adminSet);
    setAdminAccountIds(adminAccountSet);
  };

  useEffect(() => {
    fetchTeachers();
    fetchAccountStatus();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const hasAccount = (t: Teacher): boolean => {
    if (t.source === 'administrators') return adminAccountIds.has(t.id);
    return teacherStaffIds.has(t.id) || adminStaffIds.has(t.id);
  };

  const kindOf = (t: Teacher): PersonnelKind => {
    if (t.source === 'administrators') return 'admin';
    return t.staff_type === 'support' ? 'support' : 'teaching';
  };

  // ── Add flow ───────────────────────────────────────────────────────────────
  const openAddPicker = () => setPickerOpen(true);

  const startAdd = (kind: PersonnelKind) => {
    setFormMode('add');
    setFormKind(kind);
    setFormEditingId(null);
    setFormData(EMPTY_FORM);
    setPickerOpen(false);
    setFormOpen(true);
  };

  // ── Edit flow ──────────────────────────────────────────────────────────────
  const openEdit = (t: Teacher) => {
    setFormMode('edit');
    setFormKind(kindOf(t));
    setFormEditingId(t.id);
    setFormData({
      name: t.name || '',
      position: t.position || '',
      photo_url: t.photo_url || '',
      email: t.email || '',
      order_position: String(t.order_position ?? 99),
      subject: t.subject || '',
    });
    setFormOpen(true);
  };

  const handleFormSave = async () => {
    if (!formData.name.trim() || !formData.position.trim()) {
      toast({ title: 'กรุณากรอก ชื่อ-สกุล และ ตำแหน่ง', variant: 'destructive' });
      return;
    }
    const order = parseInt(formData.order_position, 10);
    if (isNaN(order)) {
      toast({ title: 'ลำดับต้องเป็นตัวเลข', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const meta = KIND_META[formKind];
    let error: { message: string } | null = null;

    if (meta.source === 'staff') {
      const payload = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        photo_url: formData.photo_url.trim() || null,
        email: formData.email.trim() || null,
        order_position: order,
        subject: formData.subject.trim() || null,
        staff_type: formKind, // 'teaching' | 'support'
      };
      const res = formMode === 'add'
        ? await staffService.insert(payload)
        : await staffService.update(formEditingId!, payload);
      error = res.error;
    } else {
      // administrators — ห้ามแตะ education / quote
      const payload = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        photo_url: formData.photo_url.trim() || null,
        email: formData.email.trim() || null,
        order_position: order,
      };
      const res = formMode === 'add'
        ? await administratorsService.insert(payload)
        : await administratorsService.update(formEditingId!, payload);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: formMode === 'add' ? 'เพิ่มบุคลากรสำเร็จ' : 'บันทึกสำเร็จ' });
    setFormOpen(false);
    fetchTeachers();
  };

  // ── Delete flow ────────────────────────────────────────────────────────────
  const openDelete = (t: Teacher) => setDeleteTarget(t);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (hasAccount(deleteTarget)) {
      toast({ title: 'ลบไม่ได้ — กรุณาลบ Account login ก่อน', variant: 'destructive' });
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.photo_url) {
      await deleteStorageImage(deleteTarget.photo_url, 'school-images');
    }
    const svc = deleteTarget.source === 'staff' ? staffService : administratorsService;
    const { error } = await svc.delete(deleteTarget.id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบบุคลากรสำเร็จ' });
      fetchTeachers();
    }
    setDeleteTarget(null);
  };

  // ── Create account ─────────────────────────────────────────────────────────
  const openCreateAccount = (teacher: Teacher) => {
    setCreateTarget(teacher);
    setCreateForm({ email: teacher.email || '', password: '', confirmPassword: '' });
    setIsCreateOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!createTarget) return;
    if (!createForm.email.trim()) {
      toast({ title: 'กรุณากรอกอีเมล', variant: 'destructive' });
      return;
    }
    if (createForm.password.length < 6) {
      toast({ title: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', variant: 'destructive' });
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast({ title: 'รหัสผ่านไม่ตรงกัน', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    const isAdminSource = createTarget.source === 'administrators';
    const fnName = isAdminSource ? 'create-admin-account' : 'create-teacher-account';
    const body = isAdminSource
      ? { administratorId: createTarget.id, email: createForm.email.trim(), password: createForm.password }
      : { staffId: createTarget.id, email: createForm.email.trim(), password: createForm.password };
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    setActionLoading(false);
    if (error || data?.error) {
      toast({ title: 'สร้าง account ไม่สำเร็จ', description: data?.error ?? error?.message, variant: 'destructive' });
    } else {
      const portalText = isAdminSource ? 'เข้าระบบหลังบ้านได้แล้ว' : 'เข้าสู่ระบบครูได้แล้ว';
      toast({ title: 'สร้าง account สำเร็จ', description: `${createForm.email} ${portalText}` });
      setIsCreateOpen(false);
      fetchTeachers();
      fetchAccountStatus();
    }
  };

  // ── Reset password ─────────────────────────────────────────────────────────
  const openResetPassword = (teacher: Teacher) => {
    setResetTarget(teacher);
    setResetForm({ password: '', confirmPassword: '' });
    setIsResetOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (resetForm.password.length < 6) {
      toast({ title: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', variant: 'destructive' });
      return;
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      toast({ title: 'รหัสผ่านไม่ตรงกัน', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    const isAdminSource = resetTarget.source === 'administrators';
    const fnName = isAdminSource ? 'reset-admin-password' : 'reset-teacher-password';
    const body = isAdminSource
      ? { administratorId: resetTarget.id, newPassword: resetForm.password }
      : { staffId: resetTarget.id, newPassword: resetForm.password };
    const { data, error } = await supabase.functions.invoke(fnName, { body });
    setActionLoading(false);
    if (error || data?.error) {
      toast({ title: 'รีเซ็ตรหัสผ่านไม่สำเร็จ', description: data?.error ?? error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'รีเซ็ตรหัสผ่านสำเร็จ' });
      setIsResetOpen(false);
    }
  };

  const withAccountCount = teachers.filter(hasAccount).length;
  const formMeta = KIND_META[formKind];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">รายชื่อบุคลากร</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            ทั้งหมด {teachers.length} คน · มี account แล้ว{' '}
            <span
              className={cn(
                'font-semibold',
                withAccountCount === teachers.length && teachers.length > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400',
              )}
            >
              {withAccountCount}/{teachers.length}
            </span>{' '}
            คน
          </p>
        </div>
        <Button onClick={openAddPicker} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มบุคลากร
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          กดปุ่ม <strong>สร้าง Account</strong> เพื่อตั้ง email + รหัสผ่านให้ครู —
          ครูจะสามารถเข้าสู่ระบบครู <strong>(/teacher)</strong> ได้ทันที
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <p>ยังไม่มีข้อมูลบุคลากร</p>
            <p className="text-xs">กดปุ่ม "เพิ่มบุคลากร" ด้านบนเพื่อเริ่ม</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 w-14">รูป</th>
                <th className="px-4 py-3">ชื่อ-สกุล</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3 hidden md:table-cell">ตำแหน่ง</th>
                <th className="px-4 py-3 hidden lg:table-cell">วิชาที่สอน</th>
                <th className="px-4 py-3 hidden md:table-cell">อีเมล</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teachers.map((teacher) => {
                const isAdmin = adminStaffIds.has(teacher.id);
                const hasTeacherAccount = teacherStaffIds.has(teacher.id);
                const hasAdminAccount = teacher.source === 'administrators' && adminAccountIds.has(teacher.id);
                const accountLinked = hasAccount(teacher);
                return (
                  <tr key={teacher.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                      {teacher.order_position}
                    </td>
                    <td className="px-4 py-3">
                      {teacher.photo_url ? (
                        <img
                          src={teacher.photo_url}
                          alt={teacher.name}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center ring-1 ring-border">
                          <span className="text-xs text-muted-foreground font-medium">
                            {teacher.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{teacher.name}</td>
                    <td className="px-4 py-3">
                      {teacher.staff_type === 'admin' ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          ผู้บริหาร
                        </Badge>
                      ) : teacher.staff_type === 'support' ? (
                        <Badge variant="outline" className="border-slate-400 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          ธุรการ
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          ครู
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {teacher.position || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {teacher.subject || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {teacher.email ?? <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {teacher.source === 'administrators' ? (
                        hasAdminAccount ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500 text-amber-700 dark:text-amber-400 gap-1 whitespace-nowrap"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-700 dark:text-yellow-400 gap-1 whitespace-nowrap"
                          >
                            <AlertCircle className="h-3 w-3" />
                            ยังไม่มี
                          </Badge>
                        )
                      ) : isAdmin ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-amber-700 dark:text-amber-400 gap-1 whitespace-nowrap"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : hasTeacherAccount ? (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-700 dark:text-green-400 gap-1 whitespace-nowrap"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          มี Account
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-yellow-500 text-yellow-700 dark:text-yellow-400 gap-1 whitespace-nowrap"
                        >
                          <AlertCircle className="h-3 w-3" />
                          ยังไม่มี
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="แก้ไขข้อมูล"
                          onClick={() => openEdit(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {teacher.source === 'administrators' ? (
                          hasAdminAccount ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 dark:text-blue-400"
                              title="รีเซ็ตรหัสผ่าน"
                              onClick={() => openResetPassword(teacher)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 dark:text-green-400"
                              title="สร้าง Account"
                              onClick={() => openCreateAccount(teacher)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )
                        ) : !isAdmin && (
                          hasTeacherAccount ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 dark:text-blue-400"
                              title="รีเซ็ตรหัสผ่าน"
                              onClick={() => openResetPassword(teacher)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 dark:text-green-400"
                              title="สร้าง Account"
                              onClick={() => openCreateAccount(teacher)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive disabled:opacity-30"
                          title={accountLinked ? 'ลบ Account login ก่อน' : 'ลบบุคลากร'}
                          disabled={accountLinked}
                          onClick={() => openDelete(teacher)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Type picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เลือกประเภทบุคลากร</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            {(Object.keys(KIND_META) as PersonnelKind[]).map((k) => {
              const m = KIND_META[k];
              const Icon = m.icon;
              return (
                <Button
                  key={k}
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3"
                  onClick={() => startAdd(k)}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{m.label}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Add/Edit form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'add'
                ? `เพิ่มบุคลากร — ${formMeta.label}`
                : `แก้ไขข้อมูล — ${formMeta.label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <ImageUpload
              currentImage={formData.photo_url}
              onUploadComplete={(url) => setFormData((p) => ({ ...p, photo_url: url }))}
              folder={formMeta.source}
              compressionPreset="profile"
              maxSizeMB={5}
            />

            <div className="space-y-1">
              <Label htmlFor="form-name">ชื่อ-สกุล <span className="text-destructive">*</span></Label>
              <Input
                id="form-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น นางสาวสมหญิง ใจดี"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="form-position">ตำแหน่ง <span className="text-destructive">*</span></Label>
              <Input
                id="form-position"
                value={formData.position}
                onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                placeholder="เช่น ครู ค.ศ.1 / ผู้อำนวยการ"
              />
            </div>

            {formMeta.source === 'staff' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="form-subject">วิชาที่สอน</Label>
                  <Input
                    id="form-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="เช่น คณิตศาสตร์"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ประเภท</Label>
                  <Select
                    value={formKind}
                    onValueChange={(v) => setFormKind(v as PersonnelKind)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">ครู</SelectItem>
                      <SelectItem value="support">เจ้าหน้าที่สนับสนุน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="form-email">อีเมล</Label>
              <Input
                id="form-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="optional@example.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="form-order">ลำดับ</Label>
              <Input
                id="form-order"
                type="number"
                value={formData.order_position}
                onChange={(e) => setFormData((p) => ({ ...p, order_position: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleFormSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : formMode === 'add' ? 'เพิ่ม' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`ลบ ${deleteTarget?.name ?? 'บุคลากร'} ออกจากระบบ?`}
        description="ข้อมูลและรูปโปรไฟล์จะถูกลบถาวร — กู้คืนไม่ได้"
        confirmText="ลบ"
        variant="destructive"
      />

      {/* Create Account Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้าง Account — {createTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="create-email">
                อีเมล{' '}
                <span className="text-xs text-blue-600 dark:text-blue-400">(ใช้สำหรับ login)</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="teacher@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-password">
                รหัสผ่าน{' '}
                <span className="text-xs text-muted-foreground">(อย่างน้อย 6 ตัว)</span>
              </Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-confirm">ยืนยันรหัสผ่าน</Label>
              <Input
                id="create-confirm"
                type="password"
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateAccount} disabled={actionLoading}>
                {actionLoading ? 'กำลังสร้าง...' : 'สร้าง Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่าน — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="reset-password">
                รหัสผ่านใหม่{' '}
                <span className="text-xs text-muted-foreground">(อย่างน้อย 6 ตัว)</span>
              </Label>
              <Input
                id="reset-password"
                type="password"
                value={resetForm.password}
                onChange={(e) => setResetForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reset-confirm">ยืนยันรหัสผ่าน</Label>
              <Input
                id="reset-confirm"
                type="password"
                value={resetForm.confirmPassword}
                onChange={(e) => setResetForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleResetPassword} disabled={actionLoading}>
                {actionLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
