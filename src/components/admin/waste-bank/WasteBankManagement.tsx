import { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Edit2, Save, X, Package, Users, List, Download, Gift, ClipboardCheck, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  wasteCategoriesService,
  wasteTransactionsService,
  wasteSummaryService,
  studentsService,
} from '@/services';
import type { WasteCategory, WasteTransaction, WasteStudentSummary } from '@/services/waste-bank.service';
import { RewardsManagement } from './RewardsManagement';
import { ClaimsApproval } from './ClaimsApproval';
import { QRScannerDialog } from './QRScannerDialog';
import { TermBanner } from './TermBanner';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '@/components/admin/shared/RecorderSelect';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

type ActiveTab = 'record' | 'summary' | 'categories' | 'rewards' | 'claims';

export const WasteBankManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const { toast } = useToast();

  // ========== Tab 1: บันทึกรายการ ==========
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [transactions, setTransactions] = useState<WasteTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Student selector
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  type RecordRow = { category_id: string; quantity: string };

  const [form, setForm] = useState({
    student_name: '',
    student_class: '',
    transaction_date: today,
    notes: '',
  });
  const [rows, setRows] = useState<RecordRow[]>([{ category_id: '', quantity: '' }]);
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);

  const addRow = () => setRows((rs) => [...rs, { category_id: '', quantity: '' }]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));
  const updateRow = (i: number, patch: Partial<RecordRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const rowsTotalPoints = useMemo(() => {
    return rows.reduce((sum, r) => {
      const c = categories.find((x) => x.id === r.category_id);
      const q = parseInt(r.quantity, 10);
      if (c && q > 0) return sum + q * c.points_per_item;
      return sum;
    }, 0);
  }, [rows, categories]);

  // ========== Tab 2: สรุปยอดสะสม ==========
  const [summaries, setSummaries] = useState<WasteStudentSummary[]>([]);
  const [summaryClassFilter, setSummaryClassFilter] = useState('all');
  const [summarySearch, setSummarySearch] = useState('');

  // ========== Tab 3: จัดการประเภทขยะ ==========
  const [editingCategory, setEditingCategory] = useState<WasteCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    points_per_item: '',
    icon: '',
    color: '',
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchSummaries();
  }, []);

  // Fetch students when class changes
  useEffect(() => {
    if (form.student_class) {
      (async () => {
        const { data } = await studentsService.getByClass(form.student_class);
        setStudentOptions((data || []).map(s => ({ id: s.id, name: s.name, class: s.class, photo_url: s.photo_url ?? null })));
      })();
    } else {
      setStudentOptions([]);
    }
    setSelectedStudentId('');
    setForm(prev => ({ ...prev, student_name: '' }));
  }, [form.student_class]);

  const fetchCategories = async () => {
    const { data, error } = await wasteCategoriesService.getActive();
    if (!error && data) setCategories(data as WasteCategory[]);
  };

  const fetchTransactions = async () => {
    const { data, error } = await wasteTransactionsService.getRecent(50);
    if (!error && data) setTransactions(data as WasteTransaction[]);
  };

  const fetchSummaries = async () => {
    const { data, error } = await wasteSummaryService.getAll();
    if (!error && data) setSummaries(data as WasteStudentSummary[]);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQRScanned = async (studentId: string) => {
    setShowQRScanner(false);
    // Load student data
    const { data } = await studentsService.getById(studentId);
    if (data) {
      setForm(prev => ({ ...prev, student_class: data.class, student_name: data.name }));
      setSelectedStudentId(data.id);
      toast({ title: 'สแกนสำเร็จ', description: `${data.name} (${data.class})` });
    } else {
      toast({ title: 'ไม่พบนักเรียน', description: 'QR code ไม่ถูกต้อง', variant: 'destructive' });
    }
  };

  const handleSubmitTransaction = async () => {
    if (!form.student_name || !form.student_class || !form.transaction_date) {
      toast({ title: 'กรุณาเลือกนักเรียนและวันที่', variant: 'destructive' });
      return;
    }

    // build valid rows — กรองแถวที่ขาด category หรือ quantity ออก
    const valid = rows
      .map((r) => {
        const cat = categories.find((c) => c.id === r.category_id);
        const qty = parseInt(r.quantity, 10);
        if (!cat || isNaN(qty) || qty <= 0) return null;
        return { cat, qty };
      })
      .filter((x): x is { cat: WasteCategory; qty: number } => x !== null);

    if (valid.length === 0) {
      toast({ title: 'กรอกประเภทและจำนวนอย่างน้อย 1 แถว', variant: 'destructive' });
      return;
    }

    const payload = valid.map(({ cat, qty }) => ({
      student_name: form.student_name.trim(),
      student_class: form.student_class,
      student_id: selectedStudentId || null,
      category_id: cat.id,
      quantity: qty,
      points_earned: qty * cat.points_per_item,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      recorded_by: recorder.name || null,
      recorded_by_staff_id: recorder.staffId,
      recorded_by_administrator_id: recorder.administratorId,
    }));

    setIsSubmitting(true);
    const { error } = await wasteTransactionsService.insertMany(payload);
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
      return;
    }

    const totalPointsSubmitted = payload.reduce((s, p) => s + p.points_earned, 0);
    toast({
      title: 'บันทึกรายการสำเร็จ',
      description: `${form.student_name} — ${valid.length} ประเภท · รวม ${totalPointsSubmitted} แต้ม`,
    });
    setRows([{ category_id: '', quantity: '' }]);
    setForm({ student_name: '', student_class: '', transaction_date: today, notes: '' });
    // recorder ไม่ reset — auto-fill ของ login user คงอยู่ บันทึกรายการต่อๆ ได้เลย
    setSelectedStudentId('');
    setStudentOptions([]);
    fetchTransactions();
    fetchSummaries();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;
    const { error } = await wasteTransactionsService.delete(id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบรายการสำเร็จ' });
      fetchTransactions();
      fetchSummaries();
    }
  };

  const filteredSummaries = summaries.filter((s) => {
    const matchClass = summaryClassFilter === 'all' || s.class_name === summaryClassFilter;
    const matchName = !summarySearch || (s.full_name ?? '').toLowerCase().includes(summarySearch.toLowerCase());
    return matchClass && matchName;
  });

  const totalItems = filteredSummaries.reduce((acc, s) => acc + Number(s.total_items ?? 0), 0);
  const totalPoints = filteredSummaries.reduce((acc, s) => acc + Number(s.total_points_earned ?? 0), 0);

  // Category management
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', points_per_item: '', icon: '', color: '' });
    setShowCategoryForm(true);
  };

  const openEditCategory = (cat: WasteCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      points_per_item: String(cat.points_per_item),
      icon: cat.icon || '',
      color: cat.color || '',
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.points_per_item) {
      toast({ title: 'กรุณากรอกชื่อและจำนวนแต้มต่อชิ้น', variant: 'destructive' });
      return;
    }
    const points = parseInt(categoryForm.points_per_item, 10);
    if (isNaN(points) || points <= 0) {
      toast({ title: 'แต้มต้องเป็นจำนวนเต็มมากกว่า 0', variant: 'destructive' });
      return;
    }
    setIsSavingCategory(true);
    const payload = {
      name: categoryForm.name.trim(),
      points_per_item: points,
      icon: categoryForm.icon.trim() || null,
      color: categoryForm.color.trim() || null,
    };

    let error;
    if (editingCategory) {
      ({ error } = await wasteCategoriesService.update(editingCategory.id, payload));
    } else {
      ({ error } = await wasteCategoriesService.insert({ ...payload, is_active: true, order_position: 99 }));
    }
    setIsSavingCategory(false);

    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingCategory ? 'แก้ไขสำเร็จ' : 'เพิ่มประเภทสำเร็จ' });
      setShowCategoryForm(false);
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('ต้องการลบประเภทขยะนี้?')) return;
    const { error } = await wasteCategoriesService.deactivate(id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบประเภทสำเร็จ' });
      fetchCategories();
    }
  };

  const tabList: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'record', label: 'บันทึกรายการ', icon: <Package className="w-4 h-4" /> },
    { id: 'summary', label: 'สรุปยอดสะสม', icon: <Users className="w-4 h-4" /> },
    { id: 'categories', label: 'ประเภทขยะ', icon: <List className="w-4 h-4" /> },
    { id: 'rewards', label: 'รางวัล', icon: <Gift className="w-4 h-4" /> },
    { id: 'claims', label: 'คำขอแลกรางวัล', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">ธนาคารขยะ</h1>
        <p className="text-muted-foreground mt-1">บันทึก ติดตาม และแลกรางวัลจากการเก็บขยะของนักเรียน</p>
      </div>

      <div className="mb-6">
        <TermBanner />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: บันทึกรายการ ===== */}
      {activeTab === 'record' && (
        <div className="space-y-6">
          {/* Form */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">บันทึกรายการรับขยะ</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowQRScanner(true)} className="gap-2">
                <QrCode className="w-4 h-4" /> สแกน QR นักเรียน
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Class selector first */}
                <div className="space-y-1">
                  <Label>ชั้น <span className="text-destructive">*</span></Label>
                  <Select value={form.student_class} onValueChange={(v) => handleFormChange('student_class', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student selector — loads after class selected */}
                <div className="space-y-1">
                  <Label>นักเรียน <span className="text-destructive">*</span></Label>
                  {form.student_class && studentOptions.length > 0 ? (
                    <Select
                      value={selectedStudentId}
                      onValueChange={(id) => {
                        const s = studentOptions.find(x => x.id === id);
                        if (s) {
                          setSelectedStudentId(s.id);
                          setForm(prev => ({ ...prev, student_name: s.name }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกนักเรียน" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              {s.photo_url ? (
                                <img src={s.photo_url} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {s.name.slice(0, 1)}
                                </div>
                              )}
                              <span>{s.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={form.student_class ? 'ไม่พบนักเรียนในชั้นนี้' : 'เลือกชั้นก่อน'}
                      value={form.student_name}
                      onChange={(e) => handleFormChange('student_name', e.target.value)}
                      disabled={!!form.student_class && studentOptions.length === 0 && !form.student_name}
                    />
                  )}
                </div>

                {/* ─── Multi-row: ประเภทขยะ + จำนวน + แต้ม ─── */}
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>ประเภทขยะ <span className="text-destructive">*</span></Label>
                    <Button type="button" size="sm" variant="outline" onClick={addRow} className="gap-1">
                      <Plus className="w-3.5 h-3.5" /> เพิ่มประเภท
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {rows.map((row, i) => {
                      const cat = categories.find((c) => c.id === row.category_id);
                      const qty = parseInt(row.quantity, 10);
                      const rowPoints = cat && qty > 0 ? qty * cat.points_per_item : null;
                      return (
                        <div
                          key={i}
                          className="flex items-end gap-2 p-2 rounded-md border border-border bg-muted/20"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <Label className="text-xs text-muted-foreground">ประเภท</Label>
                            <Select
                              value={row.category_id}
                              onValueChange={(v) => updateRow(i, { category_id: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกประเภทขยะ" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.icon && <span className="mr-1">{c.icon}</span>}
                                    {c.name} ({c.points_per_item} แต้ม/ชิ้น)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-20 sm:w-24 shrink-0 space-y-1">
                            <Label className="text-xs text-muted-foreground">จำนวน</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="0"
                              value={row.quantity}
                              onChange={(e) => updateRow(i, { quantity: e.target.value })}
                            />
                          </div>
                          <div className="w-20 sm:w-24 shrink-0 space-y-1">
                            <Label className="text-xs text-muted-foreground">แต้ม</Label>
                            <div
                              className={cn(
                                'h-10 flex items-center justify-end px-2 rounded-md border text-sm font-medium tabular-nums',
                                rowPoints !== null
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-muted border-border text-muted-foreground',
                              )}
                            >
                              {rowPoints !== null ? `+${rowPoints}` : '—'}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeRow(i)}
                            disabled={rows.length === 1}
                            className="text-destructive shrink-0"
                            title={rows.length === 1 ? 'อย่างน้อย 1 แถว' : 'ลบแถวนี้'}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end items-center gap-2 pt-1 text-sm">
                    <span className="text-muted-foreground">รวมแต้มทั้งหมด:</span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {rowsTotalPoints} แต้ม
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <Label>วันที่ <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => handleFormChange('transaction_date', e.target.value)}
                  />
                </div>

                {/* Recorded by */}
                <RecorderSelect value={recorder} onChange={setRecorder} />

                {/* Notes */}
                <div className="space-y-1 md:col-span-2">
                  <Label>หมายเหตุ</Label>
                  <Input
                    placeholder="หมายเหตุ (ถ้ามี)"
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleSubmitTransaction} disabled={isSubmitting} className="min-w-[140px]">
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">รายการล่าสุด (50 รายการ)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">นักเรียน</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชั้น</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ประเภทขยะ</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวน (ชิ้น)</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้ม</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">ยังไม่มีรายการ</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{tx.transaction_date}</td>
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {tx.students?.photo_url ? (
                                <img src={tx.students.photo_url} alt={tx.student_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                                  {tx.student_name.slice(0, 1)}
                                </div>
                              )}
                              {tx.student_name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{tx.student_class}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {tx.waste_categories ? (
                              <span>
                                {tx.waste_categories.icon && <span className="mr-1">{tx.waste_categories.icon}</span>}
                                {tx.waste_categories.name}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">{tx.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">+{tx.points_earned}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTransaction(tx.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB 2: สรุปยอดสะสม ===== */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="ค้นหาชื่อนักเรียน..."
                    value={summarySearch}
                    onChange={(e) => setSummarySearch(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={summaryClassFilter} onValueChange={setSummaryClassFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ทุกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกชั้น</SelectItem>
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader className="pb-0 pt-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{filteredSummaries.length} นักเรียน</span>
                {filteredSummaries.length > 0 && (
                  <Button size="sm" variant="outline" className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => downloadCSV('สรุปธนาคารขยะ',
                      ['ชื่อนักเรียน', 'ชั้น', 'จำนวนครั้ง', 'ขยะรวม (ชิ้น)', 'แต้มสะสม', 'แต้มคงเหลือ'],
                      filteredSummaries.map(s => [
                        s.full_name ?? '', s.class_name ?? '',
                        s.total_transactions ?? 0,
                        s.total_items ?? 0,
                        s.total_points_earned ?? 0,
                        s.available_points ?? 0,
                      ])
                    )}>
                    <Download className="w-3.5 h-3.5" /> CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชื่อนักเรียน</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชั้น</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวนครั้ง</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">ขยะรวม (ชิ้น)</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้มสะสม</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้มคงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูล</td>
                      </tr>
                    ) : (
                      filteredSummaries.map((s, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{s.full_name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{s.class_name ?? '—'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{s.total_transactions ?? 0}</td>
                          <td className="px-4 py-3 text-right">{s.total_items ?? 0}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{s.total_points_earned ?? 0}</td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{s.available_points ?? 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredSummaries.length > 0 && (
                    <tfoot>
                      <tr className="bg-muted/60 font-semibold border-t-2 border-border">
                        <td className="px-4 py-3" colSpan={2}>รวมทั้งหมด ({filteredSummaries.length} คน)</td>
                        <td className="px-4 py-3 text-right">
                          {filteredSummaries.reduce((a, s) => a + Number(s.total_transactions ?? 0), 0)}
                        </td>
                        <td className="px-4 py-3 text-right">{totalItems}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{totalPoints}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB 3: จัดการประเภทขยะ ===== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddCategory} className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มประเภทขยะ
            </Button>
          </div>

          {/* Add/Edit Form */}
          {showCategoryForm && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-base">{editingCategory ? 'แก้ไขประเภทขยะ' : 'เพิ่มประเภทขยะใหม่'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label>ชื่อประเภท <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="เช่น ขวดพลาสติกเล็ก"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>แต้มต่อชิ้น <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      value={categoryForm.points_per_item}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, points_per_item: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ไอคอน (Emoji)</Label>
                    <Input
                      placeholder="เช่น 🥤 🧴 🍾 🥫"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, icon: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>สี (hex)</Label>
                    <Input
                      placeholder="เช่น #60a5fa"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, color: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
                    <X className="w-4 h-4 mr-1" /> ยกเลิก
                  </Button>
                  <Button onClick={handleSaveCategory} disabled={isSavingCategory}>
                    <Save className="w-4 h-4 mr-1" />
                    {isSavingCategory ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ไอคอน</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชื่อประเภท</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้ม/ชิ้น</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">สี</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground">ยังไม่มีประเภทขยะ</td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xl">{cat.icon || '—'}</td>
                          <td className="px-4 py-3 font-medium">{cat.name}</td>
                          <td className="px-4 py-3 text-right">{cat.points_per_item}</td>
                          <td className="px-4 py-3">
                            {cat.color ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 rounded-full border border-border" style={{ backgroundColor: cat.color }} />
                                {cat.color}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => openEditCategory(cat)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB 4: รางวัล ===== */}
      {activeTab === 'rewards' && <RewardsManagement />}

      {/* ===== TAB 5: คำขอแลกรางวัล ===== */}
      {activeTab === 'claims' && <ClaimsApproval />}

      {/* QR Scanner Dialog */}
      {showQRScanner && (
        <QRScannerDialog
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScanned={handleQRScanned}
        />
      )}
    </div>
  );
};
