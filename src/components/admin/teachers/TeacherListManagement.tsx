import { useState, useEffect } from 'react';
import { staffService } from '@/services/staff.service';
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
import { Pencil, Users, AlertCircle, UserPlus, KeyRound, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function TeacherListManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherStaffIds, setTeacherStaffIds] = useState<Set<string>>(new Set());
  const [adminStaffIds, setAdminStaffIds] = useState<Set<string>>(new Set());

  // Edit info dialog
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', position: '', subject: '', phone: '' });

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
    const { data, error } = await staffService.getTeachers();
    if (error) {
      toast({ title: 'โหลดข้อมูลไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      setTeachers((data as Teacher[]) || []);
    }
    setLoading(false);
  };

  const fetchAccountStatus = async () => {
    const { data } = await staffService.getTeacherAccountStatus();
    const teachers = new Set<string>();
    const admins = new Set<string>();
    (data || []).forEach((r) => {
      if (r.staff_id) {
        if (r.role === 'admin') admins.add(r.staff_id as string);
        else teachers.add(r.staff_id as string);
      }
    });
    setTeacherStaffIds(teachers);
    setAdminStaffIds(admins);
  };

  useEffect(() => {
    fetchTeachers();
    fetchAccountStatus();
  }, []);

  // ── Edit info ──────────────────────────────────────────────────────────────
  const openEdit = (teacher: Teacher) => {
    setEditTarget(teacher);
    setEditForm({
      email: teacher.email || '',
      position: teacher.position || '',
      subject: teacher.subject || '',
      phone: teacher.phone || '',
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    const { error } = await staffService.update(editTarget.id, {
      email: editForm.email.trim() || null,
      position: editForm.position.trim(),
      subject: editForm.subject.trim() || null,
      phone: editForm.phone.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'บันทึกสำเร็จ' });
      setIsEditOpen(false);
      fetchTeachers();
    }
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
    const { data, error } = await supabase.functions.invoke('create-teacher-account', {
      body: { staffId: createTarget.id, email: createForm.email.trim(), password: createForm.password },
    });
    setActionLoading(false);
    if (error || data?.error) {
      toast({ title: 'สร้าง account ไม่สำเร็จ', description: data?.error ?? error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'สร้าง account สำเร็จ', description: `${createForm.email} เข้าสู่ระบบครูได้แล้ว` });
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
    const { data, error } = await supabase.functions.invoke('reset-teacher-password', {
      body: { staffId: resetTarget.id, newPassword: resetForm.password },
    });
    setActionLoading(false);
    if (error || data?.error) {
      toast({ title: 'รีเซ็ตรหัสผ่านไม่สำเร็จ', description: data?.error ?? error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'รีเซ็ตรหัสผ่านสำเร็จ' });
      setIsResetOpen(false);
    }
  };

  const withAccountCount = teachers.filter((t) => teacherStaffIds.has(t.id) || adminStaffIds.has(t.id)).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">รายชื่อครูผู้สอน</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          ครูทั้งหมด {teachers.length} คน · มี account แล้ว{' '}
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
            <p>ยังไม่มีข้อมูลครูผู้สอน</p>
            <p className="text-xs">เพิ่มครูได้ที่เมนู ครู/บุคลากร</p>
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
                <th className="px-4 py-3 hidden md:table-cell">ตำแหน่ง</th>
                <th className="px-4 py-3 hidden lg:table-cell">วิชาที่สอน</th>
                <th className="px-4 py-3 hidden md:table-cell">อีเมล</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teachers.map((teacher) => {
                const isAdmin = adminStaffIds.has(teacher.id);
                const hasTeacherAccount = teacherStaffIds.has(teacher.id);
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
                      {isAdmin ? (
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
                        {!isAdmin && (
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Info Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลครู</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                {editTarget.photo_url ? (
                  <img
                    src={editTarget.photo_url}
                    alt={editTarget.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">{editTarget.name.charAt(0)}</span>
                  </div>
                )}
                <p className="font-medium text-foreground">{editTarget.name}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email">
                  อีเมล{' '}
                  <span className="text-xs text-muted-foreground">(แสดงในโปรไฟล์ครู)</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-position">ตำแหน่ง</Label>
                <Input
                  id="edit-position"
                  value={editForm.position}
                  onChange={(e) => setEditForm((p) => ({ ...p, position: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-subject">วิชาที่สอน</Label>
                <Input
                  id="edit-subject"
                  value={editForm.subject}
                  onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone">เบอร์โทร</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
