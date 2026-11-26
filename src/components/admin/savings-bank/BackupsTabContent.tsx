import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  ShieldAlert,
  CloudUpload,
  Mail,
  Download,
  History,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  savingsBackupsService,
  type SavingsBackupSettings,
  type SavingsStudentSummary,
} from '@/services/savings.service';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/export';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  summaries: SavingsStudentSummary[];
  fetchSummaries?: () => Promise<void>;
}

export const BackupsTabContent = ({ summaries }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsDraft, setSettingsDraft] = useState<Partial<SavingsBackupSettings>>({});
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: teachers = [] } = useQuery({
    queryKey: ['savings-backups', 'teachers'],
    queryFn: () => savingsBackupsService.getTeachers(),
  });

  const { data: loadedSettings } = useQuery({
    queryKey: ['savings-backups', 'settings'],
    queryFn: () => savingsBackupsService.getSettings(),
  });

  const {
    data: backupsResult,
    isLoading: isBackupsLoading,
    isError: isBackupsError,
    error: backupsError,
  } = useQuery({
    queryKey: ['savings-backups', 'list'],
    queryFn: () => savingsBackupsService.listBackups(),
  });

  const settings: SavingsBackupSettings = {
    id_freq: loadedSettings?.id_freq ?? '',
    id_email: loadedSettings?.id_email ?? '',
    id_id: loadedSettings?.id_id ?? '',
    id_enabled: loadedSettings?.id_enabled ?? '',
    frequency: settingsDraft.frequency ?? loadedSettings?.frequency ?? '7',
    teacherEmail: settingsDraft.teacherEmail ?? loadedSettings?.teacherEmail ?? '',
    teacherId: settingsDraft.teacherId ?? loadedSettings?.teacherId ?? '',
    enabled: settingsDraft.enabled ?? loadedSettings?.enabled ?? true,
  };

  const backups = backupsResult?.backups ?? [];
  const dbError = backupsResult?.missingTable ? 'missing_table' : null;

  const saveSettingsMutation = useMutation({
    mutationFn: (payload: Pick<SavingsBackupSettings, 'frequency' | 'teacherEmail' | 'teacherId' | 'enabled'>) =>
      savingsBackupsService.saveSettings(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['savings-backups', 'settings'] }),
        queryClient.invalidateQueries({ queryKey: ['school-settings'] }),
      ]);
      setSettingsDraft({});
      toast({
        title: 'บันทึกการตั้งค่าสำเร็จ',
        description: 'ระบบจะนำการตั้งค่าสำรองข้อมูลไปรันตามกำหนดเวลา',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    },
  });

  const createSnapshotMutation = useMutation({
    mutationFn: () => savingsBackupsService.createSnapshot(summaries),
    onSuccess: async ({ totalBalance }) => {
      await queryClient.invalidateQueries({ queryKey: ['savings-backups', 'list'] });
      toast({
        title: 'สำรองข้อมูลภายในสำเร็จ',
        description: `บันทึกประวัติ Snapshot ยอดฝากรวม ${totalBalance.toLocaleString()} บาท เรียบร้อยแล้ว`,
      });
    },
    onError: (err: Error) => {
      toast({ title: 'เกิดข้อผิดพลาดในการสร้าง', description: err.message, variant: 'destructive' });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => savingsBackupsService.deleteBackup(id),
    onSuccess: async () => {
      setDeleteTargetId(null);
      await queryClient.invalidateQueries({ queryKey: ['savings-backups', 'list'] });
      toast({ title: 'ลบจุดบันทึกย้อนหลังแล้ว' });
    },
    onError: (err: Error) => {
      setDeleteTargetId(null);
      toast({ title: 'ลบไม่สำเร็จ', description: err.message, variant: 'destructive' });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      frequency: settings.frequency,
      teacherEmail: settings.teacherEmail,
      teacherId: settings.teacherId,
      enabled: settings.enabled,
    });
  };

  const handleCreateSnapshot = () => {
    if (summaries.length === 0) {
      toast({
        title: 'ไม่มีข้อมูลสำรอง',
        description: 'ไม่พบยอดบัญชีของนักเรียนที่ต้องทำสารสนเทศสำรอง',
        variant: 'destructive',
      });
      return;
    }
    createSnapshotMutation.mutate();
  };

  const handleExportData = () => {
    try {
      downloadCSV(
        'สำรองยอดเงินฝากสะสมธนาคารพอเพียง',
        ['รหัสประจำตัวนักเรียน', 'ชื่อ-นามสกุล', 'ชั้นเรียน', 'ยอดเงินคงเหลือ (บาท)', 'จำนวนรายการสะสม'],
        summaries.map((s) => [
          s.student_code || '—',
          s.full_name || '—',
          s.class_name || '—',
          String(Math.round(Number(s.current_balance ?? 0))),
          String(s.total_transactions ?? 0),
        ]),
      );
      toast({
        title: 'ส่งออกข้อมูลเรียบร้อย',
        description: 'กำลังจัดเตรียมไฟล์ CSV สรุปยอดบัญชีเพื่อดาวน์โหลด...',
      });
    } catch (err) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {dbError === 'missing_table' && (
        <div
          className={cn(
            'lg:col-span-12 bg-destructive/10 border border-destructive/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm',
          )}
        >
          <ShieldAlert className="w-10 h-10 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-destructive">
              ⚠️ ยังไม่ได้เปิดใช้งานตารางเก็บข้อมูลในฐานข้อมูล Production
            </h3>
            <p className="text-xs text-destructive/90 font-medium leading-relaxed">
              ไม่พบตาราง{' '}
              <code className="bg-destructive/15 px-1.5 py-0.5 rounded font-mono text-[11px] text-destructive">
                savings_backups
              </code>{' '}
              ในฐานข้อมูลระบบโรงเรียนบ้านคำไผ่ กรุณานำเนื้อหาในไฟล์{' '}
              <code className="bg-destructive/15 px-1.5 py-0.5 rounded font-mono text-[11px] text-destructive">
                supabase/migrations/079_savings_backup_system.sql
              </code>{' '}
              ไปรันในช่อง <strong>SQL Editor</strong> บน <strong>Supabase Dashboard</strong>{' '}
              ของโรงเรียนเพื่อสร้างตารางข้อมูลและเปิดใช้งานระบบนี้ครับ
            </p>
          </div>
        </div>
      )}

      {/* LEFT: Configure Backups & Settings */}
      <div className="lg:col-span-5 space-y-4">
        <Card className={cn('border-amber-200 bg-card')}>
          <CardHeader className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-border">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Database className="w-5 h-5 text-amber-600" />
              ตั้งค่าสำรองส่งออกภายนอก
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              ระบบส่งรายงานธุรกรรมและไฟล์ ZIP สำรองทางอีเมลอัตโนมัติภายนอก
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground">สถานะระบบสำรองอัตโนมัติ</Label>
                <p className="text-xs text-muted-foreground">เปิดหรือปิดการสำรองข้อมูลรายคาบ</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(val) => setSettingsDraft((prev) => ({ ...prev, enabled: val }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                คุณครูผู้รับผิดชอบระบบ
              </Label>
              <Select
                value={settings.teacherId || undefined}
                onValueChange={(val) => {
                  const selected = teachers.find((t) => t.id === val);
                  setSettingsDraft((prev) => ({
                    ...prev,
                    teacherId: val,
                    teacherEmail: selected ? selected.email || '' : '',
                  }));
                }}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="เลือกคุณครูในระบบ..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <PersonAvatar name={t.name} photoUrl={t.photo_url} size="xs" />
                        <span>
                          {t.name} {t.position ? `(${t.position})` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                อีเมลสำหรับส่งไฟล์ ZIP สำรอง
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  disabled
                  placeholder="อีเมลของคุณครูที่เลือกด้านบน"
                  value={settings.teacherEmail}
                  className={cn('pl-9 text-xs bg-muted/40 border-border text-foreground')}
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                อีเมลจะถูกดึงตามข้อมูลของครูผู้รับผิดชอบที่บันทึกไว้ในทะเบียนบุคลากรโดยอัตโนมัติ
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ความถี่ในการสำรองข้อมูล
              </Label>
              <Select
                value={settings.frequency}
                onValueChange={(val) => setSettingsDraft((prev) => ({ ...prev, frequency: val }))}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7" className="text-xs">
                    ทุกๆ 7 วัน (รายสัปดาห์)
                  </SelectItem>
                  <SelectItem value="15" className="text-xs">
                    ทุกๆ 15 วัน (กลางเดือน/สิ้นเดือน)
                  </SelectItem>
                  <SelectItem value="30" className="text-xs">
                    ทุกๆ 30 วัน (รายเดือน)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className={cn(
                'w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs',
              )}
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              )}
              บันทึกการตั้งค่า
            </Button>
          </CardContent>
        </Card>

        {/* Manual snapshot triggers */}
        <Card className={cn('bg-card border-border')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <CloudUpload className="w-5 h-5 text-foreground" />
              จัดการข้อมูลด่วนด้วยตนเอง
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              คำสั่งรันระบบแบบทันที และการดาวน์โหลดไฟล์สำรองภายนอกเก็บเข้าคอมพิวเตอร์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button
              onClick={handleCreateSnapshot}
              disabled={createSnapshotMutation.isPending}
              className={cn(
                'w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md shadow-amber-500/10',
              )}
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5 mr-1', createSnapshotMutation.isPending && 'animate-spin')}
              />
              สร้างจุด Snapshot (สำรองข้อมูลภายในทันที)
            </Button>

            <Button
              onClick={handleExportData}
              variant="outline"
              className={cn('w-full border-border text-foreground font-bold text-xs')}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              ดาวน์โหลดสรุปยอดบัญชี (CSV) ลงเครื่องคอมพิวเตอร์
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Snapshot history timeline & Disaster Recovery */}
      <div className="lg:col-span-7">
        <Card className={cn('border-border bg-card')}>
          <CardHeader className={cn('bg-muted/40 border-b border-border')}>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <History className="w-5 h-5 text-foreground" />
              ประวัติภาพรวมยอดบัญชี (Snapshots)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Snapshot เก็บเฉพาะยอดสรุป ไม่ใช่รายการธุรกรรมครบชุด จึงใช้ตรวจสอบย้อนหลังเท่านั้น
              ไม่สามารถเขียนทับหรือกู้คืนยอดบัญชีได้
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isBackupsLoading ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                กำลังโหลดประวัติการสำรองข้อมูล...
              </div>
            ) : isBackupsError ? (
              <div className={cn('m-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-3')}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">โหลดประวัติการสำรองข้อมูลไม่สำเร็จ</p>
                  <p className="mt-1 text-destructive/90">
                    {backupsError instanceof Error ? backupsError.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล'}
                  </p>
                </div>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                ยังไม่มีการบันทึกประวัติจุดคืนค่า (Snapshot)
                <br />
                ระบบจะสร้างจุดคืนค่าให้อัตโนมัติทุกคืน หรือคุณสามารถคลิกปุ่มซ้ายล่างเพื่อสร้างได้ทันที
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[460px] overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition',
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {formatThaiDateFull(b.backup_date)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'bg-muted text-muted-foreground border-0 text-[9px] py-0 px-1.5 font-bold uppercase',
                          )}
                        >
                          {b.created_by}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground space-x-3">
                        <span>
                          ผู้ออมที่มียอด:{' '}
                          <strong className="text-foreground font-extrabold">
                            {b.total_savers} คน
                          </strong>
                        </span>
                        <span>
                          ยอดฝากรวม:{' '}
                          <strong className="text-amber-600 font-extrabold">
                            {Number(b.total_balance).toLocaleString()} ฿
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTargetId(b.id)}
                        disabled={deleteBackupMutation.isPending}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (deleteTargetId) deleteBackupMutation.mutate(deleteTargetId);
        }}
        title="ยืนยันการลบ Snapshot?"
        description="ยืนยันที่จะลบ Snapshot ประวัติตัวนี้ออกจากระบบฐานข้อมูล?"
        confirmText="ลบข้อมูล"
        variant="destructive"
      />
    </div>
  );
};
