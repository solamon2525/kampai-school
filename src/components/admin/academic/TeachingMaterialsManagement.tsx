import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface TeachingMaterial {
  id: string;
  title: string;
  material_type: string;
  subject: string | null;
  quantity: number;
  storage_location: string | null;
  condition: string;
  notes: string | null;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  'สื่อการสอน': 'bg-blue-100 text-blue-800',
  'อุปกรณ์วิทยาศาสตร์': 'bg-green-100 text-green-800',
  'คอมพิวเตอร์': 'bg-emerald-100 text-emerald-800',
  'หนังสือ': 'bg-orange-100 text-orange-800',
  'อื่นๆ': 'bg-gray-100 text-gray-700',
};

const CONDITION_COLOR: Record<string, string> = {
  'ดี': 'bg-green-100 text-green-800',
  'ชำรุด': 'bg-red-100 text-red-800',
  'จำหน่ายออก': 'bg-gray-100 text-gray-700',
};

const emptyForm = {
  title: '', material_type: 'สื่อการสอน', subject: '', quantity: '1',
  storage_location: '', condition: 'ดี', notes: '',
};

export const TeachingMaterialsManagement = () => {
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [filterCondition, setFilterCondition] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeachingMaterial | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase.from('teaching_materials').select('*').order('title');
    setMaterials((data as TeachingMaterial[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const filtered = materials.filter(m => {
    if (filterType !== 'ทั้งหมด' && m.material_type !== filterType) return false;
    if (filterCondition !== 'ทั้งหมด' && m.condition !== filterCondition) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (m: TeachingMaterial) => {
    setEditing(m);
    setForm({
      title: m.title, material_type: m.material_type, subject: m.subject || '',
      quantity: String(m.quantity), storage_location: m.storage_location || '',
      condition: m.condition, notes: m.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title) { toast({ title: 'กรุณากรอกชื่อสื่อ', variant: 'destructive' }); return; }
    const payload = {
      title: form.title, material_type: form.material_type, subject: form.subject || null,
      quantity: Number(form.quantity), storage_location: form.storage_location || null,
      condition: form.condition, notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from('teaching_materials').update(payload).eq('id', editing.id)
      : await supabase.from('teaching_materials').insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ' });
    setDialogOpen(false); fetchMaterials();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await supabase.from('teaching_materials').delete().eq('id', id);
    toast({ title: 'ลบสำเร็จ' }); fetchMaterials();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="ค้นหาสื่อ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">ประเภท</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ทั้งหมด','สื่อการสอน','อุปกรณ์วิทยาศาสตร์','คอมพิวเตอร์','หนังสือ','อื่นๆ'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">สภาพ</Label>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ทั้งหมด','ดี','ชำรุด','จำหน่ายออก'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />เพิ่มสื่อ</Button>
      </div>

      <div className="text-xs text-muted-foreground">ทั้งหมด {filtered.length} รายการ | รวม {filtered.reduce((a,m)=>a+m.quantity,0)} ชิ้น</div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2 font-medium text-xs">ชื่อสื่อ</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-36">ประเภท</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">วิชา</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-16">จำนวน</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-32">สถานที่เก็บ</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-24">สภาพ</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</td></tr>
              )}
              {filtered.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{m.title}</td>
                  <td className="px-3 py-2">
                    <Badge className={`text-xs ${TYPE_COLOR[m.material_type]}`}>{m.material_type}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{m.subject || '-'}</td>
                  <td className="px-3 py-2 text-center font-medium">{m.quantity}</td>
                  <td className="px-3 py-2 text-xs">{m.storage_location || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={`text-xs ${CONDITION_COLOR[m.condition]}`}>{m.condition}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(m)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(m.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขสื่อการสอน' : 'เพิ่มสื่อการสอน'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">ชื่อสื่อ *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ประเภท</Label>
              <Select value={form.material_type} onValueChange={v => setForm(f => ({ ...f, material_type: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{['สื่อการสอน','อุปกรณ์วิทยาศาสตร์','คอมพิวเตอร์','หนังสือ','อื่นๆ'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">วิชา</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">จำนวน</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">สภาพ</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{['ดี','ชำรุด','จำหน่ายออก'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">สถานที่เก็บ</Label>
              <Input value={form.storage_location} onChange={e => setForm(f => ({ ...f, storage_location: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
