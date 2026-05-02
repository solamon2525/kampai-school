import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface TickerRow {
  id: string;
  title: string;
  link: string | null;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyRow: Omit<TickerRow, 'id'> = {
  title: '',
  link: '',
  start_at: null,
  end_at: null,
  sort_order: 0,
  is_active: true,
};

// Format ISO timestamp to value usable by <input type="datetime-local">
const toLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocal = (s: string) => (s ? new Date(s).toISOString() : null);

export const TickerManagement = () => {
  const { toast } = useToast();
  const { settings, refetch: refetchSettings } = useSchoolSettings();

  const [rows, setRows] = useState<TickerRow[]>([]);
  const [editing, setEditing] = useState<TickerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<typeof emptyRow>(emptyRow);

  const [speed, setSpeed] = useState(settings.ticker_speed_seconds || '30');
  const [gap, setGap] = useState(settings.ticker_gap_px || '60');
  const [pauseHover, setPauseHover] = useState(
    (settings.ticker_pause_on_hover ?? 'true') !== 'false'
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSpeed(settings.ticker_speed_seconds || '30');
    setGap(settings.ticker_gap_px || '60');
    setPauseHover((settings.ticker_pause_on_hover ?? 'true') !== 'false');
  }, [settings.ticker_speed_seconds, settings.ticker_gap_px, settings.ticker_pause_on_hover]);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from('ticker_items' as any)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'โหลดข้อมูลล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(((data as any[]) || []) as TickerRow[]);
  };

  useEffect(() => { fetchRows(); }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    const updates = [
      { key: 'ticker_speed_seconds', value: speed },
      { key: 'ticker_gap_px', value: gap },
      { key: 'ticker_pause_on_hover', value: pauseHover ? 'true' : 'false' },
    ];
    const { error } = await supabase
      .from('school_settings')
      .upsert(updates as any, { onConflict: 'key' });
    setSavingSettings(false);
    if (error) {
      toast({ title: 'บันทึกตั้งค่าล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    refetchSettings();
    toast({ title: 'บันทึกการตั้งค่าแล้ว' });
  };

  const createRow = async () => {
    if (!draft.title.trim()) {
      toast({ title: 'กรอกหัวข้อก่อน', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('ticker_items' as any).insert({
      title: draft.title.trim(),
      link: draft.link || null,
      start_at: draft.start_at,
      end_at: draft.end_at,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    } as any);
    if (error) {
      toast({ title: 'เพิ่มล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'เพิ่มสำเร็จ' });
    setCreating(false);
    setDraft(emptyRow);
    fetchRows();
  };

  const updateRow = async (row: TickerRow) => {
    const { error } = await supabase
      .from('ticker_items' as any)
      .update({
        title: row.title.trim(),
        link: row.link || null,
        start_at: row.start_at,
        end_at: row.end_at,
        sort_order: row.sort_order,
        is_active: row.is_active,
      } as any)
      .eq('id', row.id);
    if (error) {
      toast({ title: 'บันทึกล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'บันทึกแล้ว' });
    setEditing(null);
    fetchRows();
  };

  const deleteRow = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return;
    const { error } = await supabase.from('ticker_items' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'ลบล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'ลบแล้ว' });
    fetchRows();
  };

  const toggleActive = async (row: TickerRow) => {
    const { error } = await supabase
      .from('ticker_items' as any)
      .update({ is_active: !row.is_active } as any)
      .eq('id', row.id);
    if (error) {
      toast({ title: 'อัปเดตล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    fetchRows();
  };

  return (
    <div className="space-y-6">
      {/* Settings panel */}
      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่าตัววิ่งข่าว</CardTitle>
          <CardDescription>ความเร็ว ระยะห่าง และพฤติกรรมการ pause</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ความเร็ว (วินาทีต่อรอบ)</Label>
              <Input type="number" min={5} max={300} value={speed} onChange={(e) => setSpeed(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">ค่ามาก = ช้าลง (default: 30)</p>
            </div>
            <div>
              <Label>ระยะห่างระหว่างหัวข้อ (px)</Label>
              <Input type="number" min={8} max={300} value={gap} onChange={(e) => setGap(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">default: 60</p>
            </div>
            <div className="flex flex-col justify-between">
              <Label>หยุดเมื่อ hover</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={pauseHover} onCheckedChange={setPauseHover} />
                <span className="text-sm">{pauseHover ? 'เปิด' : 'ปิด'}</span>
              </div>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            <Save className="w-4 h-4 mr-2" />
            {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </CardContent>
      </Card>

      {/* Items list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการตัววิ่ง (Manual)</CardTitle>
              <CardDescription>
                แสดงผสมกับข่าวที่ติด "แสดงในตัววิ่งข่าว" จากเมนูจัดการข่าว (สูงสุด 5 ข่าว) — ตั้งเวลา start/end เพื่อให้แสดงเฉพาะช่วงที่ต้องการ
              </CardDescription>
            </div>
            <Button onClick={() => setCreating(true)} disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรายการ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {creating && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>หัวข้อ *</Label>
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="เช่น ปิดเรียนวันสำคัญทางศาสนา" />
                </div>
                <div className="md:col-span-2">
                  <Label>ลิงก์ (รับทั้ง /path ภายใน หรือ https://... ภายนอก)</Label>
                  <Input value={draft.link || ''} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="/news/123 หรือ https://..." />
                </div>
                <div>
                  <Label>เริ่มแสดง</Label>
                  <Input type="datetime-local" value={toLocal(draft.start_at)} onChange={(e) => setDraft({ ...draft, start_at: fromLocal(e.target.value) })} />
                </div>
                <div>
                  <Label>สิ้นสุด</Label>
                  <Input type="datetime-local" value={toLocal(draft.end_at)} onChange={(e) => setDraft({ ...draft, end_at: fromLocal(e.target.value) })} />
                </div>
                <div>
                  <Label>ลำดับ</Label>
                  <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                  <span className="text-sm">{draft.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createRow}><Save className="w-4 h-4 mr-2" />บันทึก</Button>
                <Button variant="outline" onClick={() => { setCreating(false); setDraft(emptyRow); }}>
                  <X className="w-4 h-4 mr-2" />ยกเลิก
                </Button>
              </div>
            </div>
          )}

          {rows.length === 0 && !creating ? (
            <p className="text-center text-muted-foreground py-8">ยังไม่มีรายการ — กดเพิ่มรายการเพื่อเริ่ม</p>
          ) : (
            rows.map((row) =>
              editing?.id === row.id ? (
                <div key={row.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label>หัวข้อ</Label>
                      <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>ลิงก์</Label>
                      <Input value={editing.link || ''} onChange={(e) => setEditing({ ...editing, link: e.target.value })} />
                    </div>
                    <div>
                      <Label>เริ่มแสดง</Label>
                      <Input type="datetime-local" value={toLocal(editing.start_at)} onChange={(e) => setEditing({ ...editing, start_at: fromLocal(e.target.value) })} />
                    </div>
                    <div>
                      <Label>สิ้นสุด</Label>
                      <Input type="datetime-local" value={toLocal(editing.end_at)} onChange={(e) => setEditing({ ...editing, end_at: fromLocal(e.target.value) })} />
                    </div>
                    <div>
                      <Label>ลำดับ</Label>
                      <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value, 10) || 0 })} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                      <span className="text-sm">{editing.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateRow(editing)}><Save className="w-4 h-4 mr-2" />บันทึก</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4 mr-2" />ยกเลิก</Button>
                  </div>
                </div>
              ) : (
                <div key={row.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Switch checked={row.is_active} onCheckedChange={() => toggleActive(row)} />
                      <span className="font-medium truncate">{row.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {row.link && <span>🔗 {row.link}</span>}
                      {row.start_at && <span>เริ่ม: {new Date(row.start_at).toLocaleString('th-TH')}</span>}
                      {row.end_at && <span>สิ้นสุด: {new Date(row.end_at).toLocaleString('th-TH')}</span>}
                      <span>ลำดับ: {row.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(row)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRow(row.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TickerManagement;
