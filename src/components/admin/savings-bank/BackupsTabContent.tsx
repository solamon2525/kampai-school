import { useEffect, useState } from 'react';
import { Database, ShieldAlert, CloudUpload, Mail, Download, History, RefreshCw, Trash2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { staffService } from '@/services/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/export';
import { formatThaiDateFull } from '@/lib/thaiDate';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  summaries: any[];
  fetchSummaries: () => Promise<void>;
}

export const BackupsTabContent = ({ summaries, fetchSummaries }: Props) => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    id_freq: '',
    id_email: '',
    id_id: '',
    id_enabled: '',
    frequency: '7',
    teacherEmail: '',
    teacherId: '',
    enabled: true,
  });

  useEffect(() => {
    fetchTeachers();
    fetchBackupSettings();
    fetchBackupsList();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await staffService.getTeachers();
    setTeachers(data || []);
  };

  const fetchBackupSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .in('key', [
          'savings_backup_frequency',
          'savings_backup_teacher_email',
          'savings_backup_teacher_id',
          'savings_backup_enabled'
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, { id: string; value: string }> = {};
        data.forEach(item => {
          settingsMap[item.key] = { id: item.id, value: item.value || '' };
        });

        setSettings({
          id_freq: settingsMap['savings_backup_frequency']?.id || '',
          id_email: settingsMap['savings_backup_teacher_email']?.id || '',
          id_id: settingsMap['savings_backup_teacher_id']?.id || '',
          id_enabled: settingsMap['savings_backup_enabled']?.id || '',
          frequency: settingsMap['savings_backup_frequency']?.value || '7',
          teacherEmail: settingsMap['savings_backup_teacher_email']?.value || '',
          teacherId: settingsMap['savings_backup_teacher_id']?.value || '',
          enabled: (settingsMap['savings_backup_enabled']?.value || 'true') === 'true',
        });
      }
    } catch (err: any) {
      console.error('Error fetching backup settings:', err);
    }
  };

  const fetchBackupsList = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('savings_backups')
        .select('*')
        .order('backup_date', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (err: any) {
      console.error('Error fetching backups list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const upsertRows = [
        { key: 'savings_backup_frequency', value: settings.frequency, category: 'savings_bank', description: 'ความถี่ในการส่งออกสำรองข้อมูลภายนอก (7, 15, 30 วัน)' },
        { key: 'savings_backup_teacher_email', value: settings.teacherEmail, category: 'savings_bank', description: 'อีเมลคุณครูผู้รับผิดชอบระบบสำรองข้อมูลสำหรับรับรายงาน' },
        { key: 'savings_backup_teacher_id', value: settings.teacherId, category: 'savings_bank', description: 'ID ของครูผู้รับผิดชอบจากตาราง staff' },
        { key: 'savings_backup_enabled', value: String(settings.enabled), category: 'savings_bank', description: 'เปิดใช้งานระบบส่งออกสำรองข้อมูลอัตโนมัติ' }
      ];

      // Use upsert to handle both insert and updates seamlessly
      const { error } = await supabase
        .from('school_settings')
        .upsert(upsertRows, { onConflict: 'key' });

      if (error) throw error;

      toast({ title: 'บันทึกการตั้งค่าสำเร็จ', description: 'ระบบจะนำการตั้งค่าสำรองข้อมูลไปรันตามกำหนดเวลา' });
      fetchBackupSettings();
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      if (summaries.length === 0) {
        toast({ title: 'ไม่มีข้อมูลสำรอง', description: 'ไม่พบยอดบัญชีของนักเรียนที่ต้องทำสารสนเทศสำรอง', variant: 'destructive' });
        setIsCreatingSnapshot(false);
        return;
      }

      const totalBalance = summaries.reduce((sum, s) => sum + Number(s.current_balance ?? 0), 0);
      const totalSavers = summaries.filter(s => Number(s.current_balance ?? 0) > 0).length;

      // Pack active summaries as snapshot raw data
      const packedData = summaries.map(s => ({
        student_id: s.student_id,
        current_balance: Number(s.current_balance ?? 0),
        total_transactions: Number(s.total_transactions ?? 0)
      }));

      // Get current logged-in user if available or default
      const { data: { user } } = await supabase.auth.getUser();
      let recorderName = 'ระบบแอดมิน';
      if (user) {
        // Look up recorder name
        const { data: admin } = await supabase.from('administrators').select('name').eq('id', user.id).maybeSingle();
        if (admin) recorderName = admin.name;
        else {
          const { data: stf } = await supabase.from('staff').select('name').eq('id', user.id).maybeSingle();
          if (stf) recorderName = stf.name;
        }
      }

      const { error } = await supabase
        .from('savings_backups')
        .insert({
          backup_date: new Date().toISOString().split('T')[0],
          total_savers: totalSavers,
          total_balance: totalBalance,
          backup_data: packedData,
          created_by: recorderName
        });

      if (error) throw error;

      toast({ title: 'สำรองข้อมูลภายในสำเร็จ', description: `บันทึกประวัติ Snapshot ยอดฝากรวม ${totalBalance.toLocaleString()} บาท เรียบร้อยแล้ว` });
      fetchBackupsList();
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาดในการสร้าง', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRestore = async (backup: any) => {
    const totalBalance = Number(backup.total_balance).toLocaleString();
    const formattedDate = formatThaiDateFull(backup.backup_date);
    
    const doubleConfirm = confirm(
      `⚠️ คำเตือนวิกฤต: คุณกำลังจะย้อนกลับข้อมูลยอดเงินคงเหลือของนักเรียนทั้งหมดเป็นข้อมูลย้อนหลัง ณ วันที่ ${formattedDate} (ยอดเงินฝากรวม ${totalBalance} บาท, นักออม ${backup.total_savers} คน)\n\nการดำเนินการนี้จะเขียนทับตัวเลขยอดออมสะสมปัจจุบันทันที! ยืนยันที่จะย้อนเวลาระบบหรือไม่?`
    );

    if (!doubleConfirm) return;

    setIsRestoring(true);
    try {
      const dataList = backup.backup_data as any[];
      if (!Array.isArray(dataList)) throw new Error('โครงสร้างข้อมูลในไฟล์สำรองไม่ถูกต้อง');

      // Update current student balances to match the snapshot
      for (const item of dataList) {
        await supabase
          .from('savings_summaries')
          .upsert({
            student_id: item.student_id,
            current_balance: item.current_balance,
            total_transactions: item.total_transactions,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id' });
      }

      toast({ 
        title: 'กู้คืนระบบสำเร็จ! 🎉', 
        description: `ย้อนกลับยอดฝากสะสมของบัญชีนักออมทั้งหมดเป็นข้อมูล ณ วันที่ ${formattedDate} เรียบร้อยแล้ว` 
      });
      await fetchSummaries();
    } catch (err: any) {
      toast({ title: 'กู้คืนไม่สำเร็จ', description: err.message, variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบ Snapshot ประวัติตัวนี้ออกจากประบบฐานข้อมูล?')) return;

    try {
      const { error } = await supabase
        .from('savings_backups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'ลบจุดบันทึกย้อนหลังแล้ว' });
      fetchBackupsList();
    } catch (err: any) {
      toast({ title: 'ลบไม่สำเร็จ', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportData = async () => {
    try {
      // Export summaries
      downloadCSV(
        'สำรองยอดฝากสะสมธนาคารพอเพียง',
        ['รหัสนักเรียน', 'ยอดเงินคงเหลือ', 'จำนวนรายการสะสม'],
        summaries.map(s => [
          s.students?.student_code || s.student_id,
          s.current_balance ?? 0,
          s.total_transactions ?? 0
        ])
      );
      toast({ title: 'ส่งออกข้อมูลเรียบร้อย', description: 'กำลังจัดเตรียมไฟล์ CSV สรุปยอดบัญชีเพื่อดาวน์โหลด...' });
    } catch (err: any) {
      toast({ title: 'ดาวน์โหลดไม่สำเร็จ', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Configure Backups & Settings */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="border-amber-200">
          <CardHeader className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              ตั้งค่าสำรองส่งออกภายนอก
            </CardTitle>
            <CardDescription className="text-xs">
              ระบบส่งรายงานธุรกรรมและไฟล์ ZIP สำรองทางอีเมลอัตโนมัติภายนอก
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">สถานะระบบสำรองอัตโนมัติ</Label>
                <p className="text-xs text-muted-foreground">เปิดหรือปิดการสำรองข้อมูลรายคาบ</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(val) => setSettings(prev => ({ ...prev, enabled: val }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">คุณครูผู้รับผิดชอบระบบ</Label>
              <Select
                value={settings.teacherId}
                onValueChange={(val) => {
                  const selected = teachers.find(t => t.id === val);
                  setSettings(prev => ({
                    ...prev,
                    teacherId: val,
                    teacherEmail: selected ? selected.email || '' : ''
                  }));
                }}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="เลือกคุณครูในระบบ..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name} {t.position ? `(${t.position})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">อีเมลสำหรับส่งไฟล์ ZIP สำรอง</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  disabled
                  placeholder="อีเมลของคุณครูที่เลือกด้านบน"
                  value={settings.teacherEmail}
                  className="pl-9 text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                อีเมลจะถูกดึงตามข้อมูลของครูผู้รับผิดชอบที่บันทึกไว้ในทะเบียนบุคลากรโดยอัตโนมัติ
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">ความถี่ในการสำรองข้อมูล</Label>
              <Select
                value={settings.frequency}
                onValueChange={(val) => setSettings(prev => ({ ...prev, frequency: val }))}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7" className="text-xs">ทุกๆ 7 วัน (รายสัปดาห์)</SelectItem>
                  <SelectItem value="15" className="text-xs">ทุกๆ 15 วัน (กลางเดือน/สิ้นเดือน)</SelectItem>
                  <SelectItem value="30" className="text-xs">ทุกๆ 30 วัน (รายเดือน)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
              บันทึกการตั้งค่า
            </Button>
          </CardContent>
        </Card>

        {/* Manual snapshot triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-slate-700" />
              จัดการข้อมูลด่วนด้วยตนเอง
            </CardTitle>
            <CardDescription className="text-xs">
              คำสั่งรันระบบแบบทันที และการดาวน์โหลดไฟล์สำรองภายนอกเก็บเข้าคอมพิวเตอร์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md shadow-amber-500/10"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isCreatingSnapshot && "animate-spin")} />
              สร้างจุด Snapshot (สำรองข้อมูลภายในทันที)
            </Button>

            <Button
              onClick={handleExportData}
              variant="outline"
              className="w-full border-slate-200 text-slate-700 font-bold text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              ดาวน์โหลดสรุปยอดบัญชี (CSV) ลงเครื่องคอมพิวเตอร์
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Snapshot history timeline & Disaster Recovery */}
      <div className="lg:col-span-7">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-5 h-5 text-slate-800" />
              ประวัติจุดบันทึกย้อนเวลา (Restore Points)
            </CardTitle>
            <CardDescription className="text-xs">
              ภาพรวมสำรองย้อนหลัง 30 วัน แอดมินสามารถย้อนกลับ (Rollback) ข้อมูลยอดคงเหลือได้ในกรณีฉุกเฉิน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isRestoring && (
              <div className="p-6 text-center space-y-3 bg-amber-500/5 border-b border-amber-200">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <h3 className="text-sm font-bold text-amber-950">กำลังย้อนเวลากู้คืนยอดคงเหลือนักเรียน...</h3>
                <p className="text-xs text-amber-700 font-medium">กรุณาห้ามปิดหน้านี้หรือรีเฟรชเบราว์เซอร์เด็ดขาด</p>
              </div>
            )}

            {backups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                ยังไม่มีการบันทึกประวัติจุดคืนค่า (Snapshot) 
                <br />ระบบจะสร้างจุดคืนค่าให้อัตโนมัติทุกคืน หรือคุณสามารถคลิกปุ่มซ้ายล่างเพื่อสร้างได้ทันที
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{formatThaiDateFull(b.backup_date)}</span>
                        <Badge className="bg-slate-100 text-slate-600 border-0 text-[9px] py-0 px-1.5 font-bold uppercase">
                          {b.created_by}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground space-x-3">
                        <span>ผู้ออมที่มียอด: <strong className="text-slate-800 font-extrabold">{b.total_savers} คน</strong></span>
                        <span>ยอดฝากรวม: <strong className="text-amber-600 font-extrabold">{Number(b.total_balance).toLocaleString()} ฿</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleRestore(b)}
                        disabled={isRestoring}
                        className="border-amber-300 text-amber-900 bg-amber-500/5 hover:bg-amber-500 hover:text-amber-950 font-bold text-[10px] h-7 px-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-0.5" />
                        ย้อนข้อมูลกลับจุดนี้
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteBackup(b.id)}
                        disabled={isRestoring}
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
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
    </div>
  );
};
