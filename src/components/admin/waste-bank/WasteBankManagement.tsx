import { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Edit2, Save, X, Package, Users, List, Gift, ClipboardCheck, QrCode, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { rewardClaimsService } from '@/services/waste-bank.service';
import type { WasteCategory, WasteTransaction, WasteStudentSummary } from '@/services/waste-bank.service';
import { RewardsManagement } from './RewardsManagement';
import { ClaimsApproval } from './ClaimsApproval';
import { WasteStudentSummaryTab } from './WasteStudentSummaryTab';
import { StudentQRScanner } from '@/components/shared/StudentQRScanner';
import { useAuth } from '@/contexts/AuthProvider';
import { TermBanner } from './TermBanner';
import { QuickStudentPicker } from './QuickStudentPicker';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '@/components/admin/shared/RecorderSelect';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const ROW_COLORS = [
  { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400'    },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  { bg: 'bg-violet-50',  border: 'border-violet-300',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400'  },
  { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400'   },
  { bg: 'bg-rose-50',    border: 'border-rose-300',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-400'    },
  { bg: 'bg-cyan-50',    border: 'border-cyan-300',    text: 'text-cyan-700',    badge: 'bg-cyan-100 text-cyan-700',    dot: 'bg-cyan-400'    },
] as const;

const COLOR_KEY_MAP: Record<string, number> = {
  blue: 0, emerald: 1, violet: 2, amber: 3, rose: 4, cyan: 5,
};

const COLOR_SWATCH: Record<string, string> = {
  blue: 'bg-blue-400', emerald: 'bg-emerald-400', violet: 'bg-violet-400',
  amber: 'bg-amber-400', rose: 'bg-rose-400', cyan: 'bg-cyan-400',
};

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
  const { staffId, administratorId, isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    if (!staffId && !administratorId && !isAdmin) return;
    const { data } = await rewardClaimsService.listPending();
    if (data) {
      setPendingCount(data.length);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, administratorId, isAdmin, activeTab]);

  // ========== Tab 1: บันทึกรายการ ==========
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [transactions, setTransactions] = useState<WasteTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [quickRepeat, setQuickRepeat] = useState(false);

  // Student selector
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Expand/collapse rows
  const [expandedRow, setExpandedRow] = useState<number>(0);

  const getRowColor = (cat: WasteCategory | undefined, i: number) => {
    const idx = cat?.color ? (COLOR_KEY_MAP[cat.color] ?? i) : i;
    return ROW_COLORS[idx % ROW_COLORS.length];
  };

  // Quick mode toggle (persisted in localStorage)
  const [quickMode, setQuickMode] = useState(
    () => localStorage.getItem('waste_quick_mode') === '1'
  );
  const toggleQuickMode = () =>
    setQuickMode((prev) => {
      const next = !prev;
      localStorage.setItem('waste_quick_mode', next ? '1' : '0');
      return next;
    });

  const today = new Date().toISOString().split('T')[0];

  type RecordRow = { category_id: string; quantity: string };

  const [form, setForm] = useState({
    student_name: '',
    student_class: '',
    transaction_date: today,
    notes: '',
  });
  const [rows, setRows] = useState<RecordRow[]>([{ category_id: '', quantity: '1' }]);
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);

  const addRow = () => {
    const defaultCat = categories.find(
      (c) => c.name.includes('ขวดพลาสติกเล็ก') || c.name.includes('ขวดเล็ก')
    );
    setRows((rs) => {
      setExpandedRow(rs.length);
      return [...rs, { category_id: defaultCat?.id || '', quantity: '1' }];
    });
  };
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
      setLoadingStudents(true);
      (async () => {
        const { data } = await studentsService.getByClass(form.student_class);
        setStudentOptions((data || []).map(s => ({ id: s.id, name: s.name, class: s.class, photo_url: s.photo_url ?? null })));
        setLoadingStudents(false);
      })();
    } else {
      setStudentOptions([]);
    }
    setSelectedStudentId('');
    setForm(prev => ({ ...prev, student_name: '' }));
  }, [form.student_class]);

  const fetchCategories = async () => {
    const { data, error } = await wasteCategoriesService.getActive();
    if (!error && data) {
      setCategories(data as WasteCategory[]);
      const defaultCat = (data as WasteCategory[]).find(
        (c) => c.name.includes('ขวดพลาสติกเล็ก') || c.name.includes('ขวดเล็ก')
      );
      if (defaultCat) {
        setRows([{ category_id: defaultCat.id, quantity: '1' }]);
      }
    }
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
    const defaultCat = categories.find(
      (c) => c.name.includes('ขวดพลาสติกเล็ก') || c.name.includes('ขวดเล็ก')
    );
    setRows([{ category_id: defaultCat?.id || '', quantity: '1' }]);
    setExpandedRow(0);
    setForm({ student_name: '', student_class: '', transaction_date: today, notes: '' });
    // recorder ไม่ reset — auto-fill ของ login user คงอยู่ บันทึกรายการต่อๆ ได้เลย
    setSelectedStudentId('');
    setStudentOptions([]);
    fetchTransactions();
    fetchSummaries();
    if (quickRepeat) {
      setShowQRScanner(true);
    }
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
    {
      id: 'claims',
      label: 'คำขอแลกรางวัล',
      icon: (
        <div className="relative">
          <ClipboardCheck className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </div>
      ),
    },
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
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">บันทึกรายการรับขยะ</CardTitle>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickRepeat}
                    onChange={(e) => setQuickRepeat(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span><span className="font-semibold">โหมดต่อเนื่อง</span></span>
                </label>
                <button
                  type="button"
                  onClick={toggleQuickMode}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                    quickMode
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  โหมดเลือกเร็ว
                </button>
                <Button variant="outline" size="sm" onClick={() => setShowQRScanner(true)} className="gap-2">
                  <QrCode className="w-4 h-4" /> สแกน QR นักเรียน
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickMode ? (
                  <div className="md:col-span-2 lg:col-span-3">
                    <QuickStudentPicker
                      classes={CLASSES}
                      selectedClass={form.student_class}
                      onClassChange={(v) => handleFormChange('student_class', v)}
                      students={studentOptions}
                      loadingStudents={loadingStudents}
                      selectedStudentId={selectedStudentId}
                      onStudentSelect={(id, name) => {
                        setSelectedStudentId(id);
                        setForm((prev) => ({ ...prev, student_name: name }));
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {/* Class selector */}
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
                  </>
                )}

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
                      const color = getRowColor(cat, i);
                      const isExpanded = expandedRow === i;

                      if (!isExpanded) {
                        // ─── Collapsed row ───
                        return (
                          <div
                            key={i}
                            className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer hover:opacity-90 transition-opacity', color.border, color.bg)}
                            onClick={() => setExpandedRow(i)}
                          >
                            <span className={cn('w-2 h-5 rounded-full shrink-0', color.dot)} />
                            <span className="text-lg shrink-0 leading-none">{cat?.icon || '♻️'}</span>
                            <span className={cn('text-sm font-semibold flex-1 truncate', color.text)}>
                              {cat?.name || 'ยังไม่ได้เลือกประเภท'}
                            </span>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={row.quantity}
                                onChange={(e) => updateRow(i, { quantity: e.target.value })}
                                className="w-16 h-7 text-center text-sm px-1"
                              />
                              <span className="text-xs text-muted-foreground">ชิ้น</span>
                            </div>
                            {rowPoints !== null && (
                              <span className={cn('text-xs font-bold px-2 py-1 rounded-lg shrink-0 tabular-nums', color.badge)}>
                                +{rowPoints}
                              </span>
                            )}
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeRow(i); }}
                                className="text-destructive hover:bg-destructive/10 rounded p-1 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      }

                      // ─── Expanded row ───
                      return (
                        <div key={i} className={cn('rounded-xl border-2 overflow-hidden', color.border)}>
                          {/* Colored header */}
                          <div className={cn('px-4 py-2 flex items-center justify-between', color.bg)}>
                            <span className={cn('text-xs font-bold', color.text)}>ประเภทที่ {i + 1}</span>
                            <div className="flex items-center gap-2">
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedRow(-1)}
                                  className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md hover:bg-black/10 transition-colors', color.text)}
                                >
                                  <ChevronUp className="w-3 h-3" /> ย่อ
                                </button>
                              )}
                              {rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRow(i)}
                                  className="text-destructive hover:bg-destructive/10 rounded px-2 py-0.5 text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <X className="w-3 h-3" /> ลบ
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-4 bg-card">
                            {/* Category Radio Grid */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold">เลือกประเภทขยะ</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {categories.map((c) => {
                                  const isSelected = row.category_id === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => updateRow(i, { category_id: c.id })}
                                      className={cn(
                                        'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center gap-1.5 cursor-pointer relative',
                                        isSelected
                                          ? cn('shadow-sm scale-102 font-semibold', color.border, color.bg, color.text)
                                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                      )}
                                    >
                                      {isSelected && (
                                        <span className={cn('absolute top-2 right-2 w-2 h-2 rounded-full', color.dot)} />
                                      )}
                                      {!isSelected && c.color && COLOR_SWATCH[c.color] && (
                                        <span className={cn('absolute top-2 right-2 w-2 h-2 rounded-full opacity-40', COLOR_SWATCH[c.color])} />
                                      )}
                                      <span className="text-2xl leading-none">{c.icon || '♻️'}</span>
                                      <div className="space-y-0.5 min-w-0 w-full">
                                        <div className="text-xs font-bold truncate">{c.name}</div>
                                        <div className="text-[10px] opacity-80">{c.points_per_item} แต้ม</div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <div className="w-full sm:w-32 space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">จำนวน (ชิ้น)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="0"
                                  value={row.quantity}
                                  onChange={(e) => updateRow(i, { quantity: e.target.value })}
                                  className="font-semibold text-base"
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">แต้มที่ได้รับ</Label>
                                <div className={cn(
                                  'h-10 flex items-center justify-end px-3 rounded-md border-2 text-sm font-bold tabular-nums',
                                  rowPoints !== null
                                    ? cn(color.bg, color.border, color.text)
                                    : 'bg-muted border-border text-muted-foreground',
                                )}>
                                  {rowPoints !== null ? `+${rowPoints} แต้ม` : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end items-center gap-2 pt-1 text-sm">
                    <span className="text-muted-foreground">รวมแต้มทั้งหมด:</span>
                    <span className="text-lg font-bold text-foreground dark:text-foreground tabular-nums">
                      {rowsTotalPoints} แต้ม
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <Label>วันที่ <span className="text-destructive">*</span></Label>
                  <ThaiDatePicker
                    value={form.transaction_date}
                    onChange={(v) => handleFormChange('transaction_date', v)}
                    dateFormat="full"
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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ผู้บันทึก</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-muted-foreground">ยังไม่มีรายการ</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <div>{formatThaiDateFull(tx.transaction_date)}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }) + ' น.' : '—'}
                            </div>
                          </td>
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
                          <td className="px-4 py-3 text-right font-bold text-foreground">+{tx.points_earned}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{tx.recorded_by || '—'}</td>
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
        <WasteStudentSummaryTab summaries={summaries} />
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
                    <Label>สีประจำประเภท</Label>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {Object.entries(COLOR_SWATCH).map(([key, cls]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategoryForm((p) => ({ ...p, color: key }))}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 transition-all',
                            cls,
                            categoryForm.color === key
                              ? 'border-foreground scale-110 shadow'
                              : 'border-transparent hover:border-foreground/40'
                          )}
                          title={key}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setCategoryForm((p) => ({ ...p, color: '' }))}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 border-dashed border-border text-muted-foreground text-xs flex items-center justify-center hover:bg-muted transition-colors',
                          !categoryForm.color && 'border-foreground/50'
                        )}
                        title="ไม่มีสี"
                      >
                        ✕
                      </button>
                    </div>
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
                            {cat.color && COLOR_SWATCH[cat.color] ? (
                              <span className={cn('inline-block w-5 h-5 rounded-full', COLOR_SWATCH[cat.color])} title={cat.color} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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
      {activeTab === 'claims' && <ClaimsApproval onAction={fetchPendingCount} />}

      {/* QR Scanner Dialog */}
      {showQRScanner && (
        <StudentQRScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScanned={handleQRScanned}
        />
      )}
    </div>
  );
};
