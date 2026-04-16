import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X, Scale, Users, List, Search } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface WasteCategory {
  id: string;
  name: string;
  price_per_kg: number;
  icon: string | null;
  color: string | null;
  is_active: boolean | null;
  order_position: number | null;
}

interface WasteTransaction {
  id: string;
  student_name: string;
  student_class: string;
  student_id: string | null;
  category_id: string;
  weight_kg: number;
  amount: number;
  transaction_date: string;
  notes: string | null;
  recorded_by: string | null;
  waste_categories?: { name: string; icon: string | null; color: string | null } | null;
  students?: { photo_url: string | null } | null;
}

interface StudentSummary {
  student_name: string | null;
  student_class: string | null;
  student_id: string | null;
  photo_url: string | null;
  student_code: string | null;
  total_transactions: number | null;
  total_weight: number | null;
  total_amount: number | null;
  last_transaction_date: string | null;
}

interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

type ActiveTab = 'record' | 'summary' | 'categories';

export const WasteBankManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const { toast } = useToast();

  // ========== Tab 1: บันทึกรายการ ==========
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [transactions, setTransactions] = useState<WasteTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  // Student selector
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    student_name: '',
    student_class: '',
    category_id: '',
    weight_kg: '',
    transaction_date: today,
    notes: '',
    recorded_by: '',
  });

  // ========== Tab 2: สรุปยอดสะสม ==========
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [summaryClassFilter, setSummaryClassFilter] = useState('all');
  const [summarySearch, setSummarySearch] = useState('');

  // ========== Tab 3: จัดการประเภทขยะ ==========
  const [editingCategory, setEditingCategory] = useState<WasteCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    price_per_kg: '',
    icon: '',
    color: '',
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchSummaries();
  }, []);

  // Auto-calculate amount when category or weight changes
  useEffect(() => {
    if (form.category_id && form.weight_kg) {
      const cat = categories.find((c) => c.id === form.category_id);
      if (cat && parseFloat(form.weight_kg) > 0) {
        setCalculatedAmount(parseFloat(form.weight_kg) * cat.price_per_kg);
      } else {
        setCalculatedAmount(null);
      }
    } else {
      setCalculatedAmount(null);
    }
  }, [form.category_id, form.weight_kg, categories]);

  // Fetch students when class changes
  useEffect(() => {
    if (form.student_class) {
      (async () => {
        const { data } = await supabase
          .from('students')
          .select('id, name, class, photo_url')
          .eq('class', form.student_class)
          .eq('is_active', true)
          .order('class_number', { ascending: true });
        setStudentOptions(data || []);
      })();
    } else {
      setStudentOptions([]);
    }
    // Reset selected student when class changes
    setSelectedStudentId('');
    setForm(prev => ({ ...prev, student_name: '' }));
  }, [form.student_class]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('waste_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true });
    if (!error && data) setCategories(data);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('waste_transactions')
      .select('*, waste_categories(name, icon, color), students(photo_url)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setTransactions(data);
  };

  const fetchSummaries = async () => {
    const { data, error } = await supabase
      .from('waste_student_summary')
      .select('student_name, student_class, student_id, photo_url, student_code, total_transactions, total_weight, total_amount, last_transaction_date');
    if (!error && data) setSummaries(data as StudentSummary[]);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitTransaction = async () => {
    if (!form.student_name || !form.student_class || !form.category_id || !form.weight_kg || !form.transaction_date) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบถ้วน', variant: 'destructive' });
      return;
    }
    const weight = parseFloat(form.weight_kg);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'น้ำหนักต้องเป็นตัวเลขมากกว่า 0', variant: 'destructive' });
      return;
    }
    const cat = categories.find((c) => c.id === form.category_id);
    if (!cat) return;
    const amount = weight * cat.price_per_kg;

    setIsSubmitting(true);
    const { error } = await supabase.from('waste_transactions').insert({
      student_name: form.student_name.trim(),
      student_class: form.student_class,
      student_id: selectedStudentId || null,
      category_id: form.category_id,
      weight_kg: weight,
      amount,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      recorded_by: form.recorded_by.trim() || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'บันทึกรายการสำเร็จ', description: `${form.student_name} — ${weight} กก. = ${amount.toFixed(2)} บาท` });
      setForm({ student_name: '', student_class: '', category_id: '', weight_kg: '', transaction_date: today, notes: '', recorded_by: '' });
      setSelectedStudentId('');
      setStudentOptions([]);
      setCalculatedAmount(null);
      fetchTransactions();
      fetchSummaries();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;
    const { error } = await supabase.from('waste_transactions').delete().eq('id', id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบรายการสำเร็จ' });
      fetchTransactions();
      fetchSummaries();
    }
  };

  const filteredSummaries = summaries.filter((s) => {
    const matchClass = summaryClassFilter === 'all' || s.student_class === summaryClassFilter;
    const matchName = !summarySearch || (s.student_name ?? '').toLowerCase().includes(summarySearch.toLowerCase());
    return matchClass && matchName;
  });

  const totalWeight = filteredSummaries.reduce((acc, s) => acc + Number(s.total_weight ?? 0), 0);
  const totalAmount = filteredSummaries.reduce((acc, s) => acc + Number(s.total_amount ?? 0), 0);

  // Category management
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', price_per_kg: '', icon: '', color: '' });
    setShowCategoryForm(true);
  };

  const openEditCategory = (cat: WasteCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      price_per_kg: String(cat.price_per_kg),
      icon: cat.icon || '',
      color: cat.color || '',
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.price_per_kg) {
      toast({ title: 'กรุณากรอกชื่อและราคาต่อกิโลกรัม', variant: 'destructive' });
      return;
    }
    const price = parseFloat(categoryForm.price_per_kg);
    if (isNaN(price) || price < 0) {
      toast({ title: 'ราคาต้องเป็นตัวเลขที่ถูกต้อง', variant: 'destructive' });
      return;
    }
    setIsSavingCategory(true);
    const payload = {
      name: categoryForm.name.trim(),
      price_per_kg: price,
      icon: categoryForm.icon.trim() || null,
      color: categoryForm.color.trim() || null,
    };

    let error;
    if (editingCategory) {
      ({ error } = await supabase.from('waste_categories').update(payload).eq('id', editingCategory.id));
    } else {
      ({ error } = await supabase.from('waste_categories').insert({ ...payload, is_active: true, order_position: 99 }));
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
    const { error } = await supabase.from('waste_categories').update({ is_active: false }).eq('id', id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบประเภทสำเร็จ' });
      fetchCategories();
    }
  };

  const tabList: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'record', label: 'บันทึกรายการ', icon: <Scale className="w-4 h-4" /> },
    { id: 'summary', label: 'สรุปยอดสะสม', icon: <Users className="w-4 h-4" /> },
    { id: 'categories', label: 'จัดการประเภทขยะ', icon: <List className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">ธนาคารขยะ</h1>
        <p className="text-muted-foreground mt-1">บันทึกและติดตามการนำขยะมาขายของนักเรียน</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
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
            <CardHeader>
              <CardTitle className="text-base">บันทึกรายการรับซื้อขยะ</CardTitle>
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

                {/* Category */}
                <div className="space-y-1">
                  <Label>ประเภทขยะ <span className="text-destructive">*</span></Label>
                  <Select value={form.category_id} onValueChange={(v) => handleFormChange('category_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทขยะ" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon && <span className="mr-1">{cat.icon}</span>}
                          {cat.name} ({cat.price_per_kg} บ./กก.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <Label>น้ำหนัก (กก.) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.weight_kg}
                    onChange={(e) => handleFormChange('weight_kg', e.target.value)}
                  />
                </div>

                {/* Amount (auto) */}
                <div className="space-y-1">
                  <Label>จำนวนเงิน (บาท)</Label>
                  <div className={`flex items-center h-10 px-3 rounded-md border text-sm font-medium ${
                    calculatedAmount !== null ? 'bg-green-50 border-green-300 text-green-700' : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    {calculatedAmount !== null ? `${calculatedAmount.toFixed(2)} บาท` : 'คำนวณอัตโนมัติ'}
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
                <div className="space-y-1">
                  <Label>ผู้บันทึก</Label>
                  <Input
                    placeholder="ชื่อครูผู้บันทึก"
                    value={form.recorded_by}
                    onChange={(e) => handleFormChange('recorded_by', e.target.value)}
                  />
                </div>

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
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">น้ำหนัก (กก.)</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวนเงิน (บ.)</th>
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
                          <td className="px-4 py-3 text-right">{Number(tx.weight_kg).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">{Number(tx.amount).toFixed(2)}</td>
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
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชื่อนักเรียน</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ชั้น</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวนครั้ง</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">น้ำหนักรวม (กก.)</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">ยอดสะสม (บาท)</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">ครั้งล่าสุด</th>
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
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {s.photo_url ? (
                                <img src={s.photo_url} alt={s.student_name ?? ''} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                                  {(s.student_name ?? '?').slice(0, 1)}
                                </div>
                              )}
                              <span>{s.student_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{s.student_class ?? '—'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{s.total_transactions ?? 0}</td>
                          <td className="px-4 py-3 text-right">{Number(s.total_weight ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">{Number(s.total_amount ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs">{s.last_transaction_date ?? '—'}</td>
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
                        <td className="px-4 py-3 text-right">{totalWeight.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{totalAmount.toFixed(2)}</td>
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
                      placeholder="เช่น กระดาษ, พลาสติก"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ราคา (บาท/กก.) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={categoryForm.price_per_kg}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, price_per_kg: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ไอคอน (Emoji)</Label>
                    <Input
                      placeholder="เช่น ♻️ 📦 🥤"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm((p) => ({ ...p, icon: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>สี (Tailwind class หรือ hex)</Label>
                    <Input
                      placeholder="เช่น #22c55e หรือ green"
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
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">ราคา (บาท/กก.)</th>
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
                          <td className="px-4 py-3 text-right">{cat.price_per_kg.toFixed(2)}</td>
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
    </div>
  );
};
