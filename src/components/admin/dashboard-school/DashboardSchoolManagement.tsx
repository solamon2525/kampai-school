/**
 * DashboardSchoolManagement.tsx
 * แดชบอร์ดโรงเรียน — เก็บข้อมูล metadata ของโรงเรียนแบบยืดหยุ่น
 * (รหัสโรงเรียน, บัญชีระบบราชการ, เครือข่ายอินเทอร์เน็ต ฯลฯ)
 *
 * Admin-only via RLS. Supports CRUD + dynamic extra_fields.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  X,
  Save,
  Tag as TagIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  schoolDashboardService,
  DASHBOARD_CATEGORY_OPTIONS,
  type SchoolDashboardEntry,
  type DashboardEntryCategory,
  type DashboardExtraField,
  type DashboardExtraFieldType,
} from '@/services';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPE_OPTIONS: Array<{ value: DashboardExtraFieldType; label: string }> = [
  { value: 'text', label: 'ข้อความ' },
  { value: 'password', label: 'รหัสผ่าน' },
  { value: 'url', label: 'ลิงก์ (URL)' },
  { value: 'ip', label: 'IP / Network' },
  { value: 'note', label: 'หมายเหตุ' },
];

const CATEGORY_BADGE_BG: Record<DashboardEntryCategory, string> = {
  codes: 'bg-blue-100 text-blue-700 border-blue-200',
  systems: 'bg-purple-100 text-purple-700 border-purple-200',
  network: 'bg-green-100 text-green-700 border-green-200',
  contacts: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const emptyForm = (): EntryForm => ({
  category: 'other',
  title: '',
  description: '',
  url: '',
  username: '',
  password: '',
  extra_fields: [],
  tags: [],
  is_sensitive: false,
  order_position: 0,
});

type EntryForm = {
  category: DashboardEntryCategory;
  title: string;
  description: string;
  url: string;
  username: string;
  password: string;
  extra_fields: DashboardExtraField[];
  tags: string[];
  is_sensitive: boolean;
  order_position: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DashboardSchoolManagement = () => {
  const { toast } = useToast();

  const [entries, setEntries] = useState<SchoolDashboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<DashboardEntryCategory | 'all'>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm());
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Per-row password visibility
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data, error } = await schoolDashboardService.list();
    if (error) {
      toast({ title: 'โหลดข้อมูลล้มเหลว', description: error.message, variant: 'destructive' });
    } else if (data) {
      setEntries(data);
    }
    setIsLoading(false);
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCategory !== 'all' && e.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [
        e.title,
        e.description ?? '',
        e.username ?? '',
        e.url ?? '',
        ...e.tags,
        ...e.extra_fields.flatMap((f) => [f.label, f.value]),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search, activeCategory]);

  const countByCategory = useMemo(() => {
    const map = new Map<DashboardEntryCategory | 'all', number>();
    map.set('all', entries.length);
    for (const c of DASHBOARD_CATEGORY_OPTIONS) {
      map.set(c.value, entries.filter((e) => e.category === c.value).length);
    }
    return map;
  }, [entries]);

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setTagInput('');
    setDialogOpen(true);
  };

  const openEdit = (entry: SchoolDashboardEntry) => {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      title: entry.title,
      description: entry.description ?? '',
      url: entry.url ?? '',
      username: entry.username ?? '',
      password: entry.password ?? '',
      extra_fields: entry.extra_fields.map((f) => ({ ...f })),
      tags: [...entry.tags],
      is_sensitive: entry.is_sensitive,
      order_position: entry.order_position,
    });
    setTagInput('');
    setDialogOpen(true);
  };

  const setField = <K extends keyof EntryForm>(key: K, value: EntryForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addExtraField = () => {
    setForm((f) => ({
      ...f,
      extra_fields: [...f.extra_fields, { label: '', value: '', type: 'text' }],
    }));
  };

  const updateExtraField = (idx: number, patch: Partial<DashboardExtraField>) => {
    setForm((f) => ({
      ...f,
      extra_fields: f.extra_fields.map((x, i) => (i === idx ? { ...x, ...patch } : x)),
    }));
  };

  const removeExtraField = (idx: number) => {
    setForm((f) => ({ ...f, extra_fields: f.extra_fields.filter((_, i) => i !== idx) }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      setTagInput('');
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (t: string) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'กรุณากรอกชื่อรายการ', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: form.url.trim() || null,
      username: form.username.trim() || null,
      password: form.password.trim() || null,
      extra_fields: form.extra_fields
        .filter((f) => f.label.trim() || f.value.trim())
        .map((f) => ({
          label: f.label.trim(),
          value: f.value.trim(),
          type: f.type ?? 'text',
        })),
      tags: form.tags,
      is_sensitive: form.is_sensitive,
      order_position: Number(form.order_position) || 0,
    };

    const res = editingId
      ? await schoolDashboardService.update(editingId, payload)
      : await schoolDashboardService.insert(payload);

    setSaving(false);

    if (res.error) {
      toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'อัปเดตเรียบร้อย' : 'เพิ่มรายการเรียบร้อย' });
    setDialogOpen(false);
    void loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await schoolDashboardService.delete(deleteId);
    if (res.error) {
      toast({ title: 'ลบไม่สำเร็จ', description: res.error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบรายการแล้ว' });
      setEntries((x) => x.filter((e) => e.id !== deleteId));
    }
    setDeleteId(null);
  };

  // ─── Inline helpers ────────────────────────────────────────────────────────

  const toggleReveal = (key: string) => {
    setRevealed((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `คัดลอก ${label} แล้ว`, duration: 1800 });
    } catch {
      toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
    }
  };

  const categoryMeta = (c: DashboardEntryCategory) =>
    DASHBOARD_CATEGORY_OPTIONS.find((x) => x.value === c)!;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📋 แดชบอร์ดโรงเรียน</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ศูนย์รวมข้อมูลโรงเรียน — รหัส, บัญชีระบบราชการ, เครือข่ายอินเทอร์เน็ต และอื่น ๆ
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          เพิ่มรายการใหม่
        </Button>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, URL, แท็ก, ค่าในรายการ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryPill
              active={activeCategory === 'all'}
              label="ทั้งหมด"
              count={countByCategory.get('all') ?? 0}
              onClick={() => setActiveCategory('all')}
            />
            {DASHBOARD_CATEGORY_OPTIONS.map((c) => (
              <CategoryPill
                key={c.value}
                active={activeCategory === c.value}
                label={`${c.icon} ${c.label}`}
                count={countByCategory.get(c.value) ?? 0}
                onClick={() => setActiveCategory(c.value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-sm">
              {entries.length === 0
                ? 'ยังไม่มีข้อมูล — กดปุ่ม "เพิ่มรายการใหม่" เพื่อเริ่มต้น'
                : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const meta = categoryMeta(entry.category);
            return (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${CATEGORY_BADGE_BG[entry.category]} border`}>
                          {meta.icon} {meta.label}
                        </Badge>
                        {entry.is_sensitive && (
                          <Badge className="bg-red-50 text-red-700 border border-red-200">
                            ข้อมูลละเอียดอ่อน
                          </Badge>
                        )}
                        {entry.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                          >
                            <TagIcon className="w-3 h-3" />
                            {t}
                          </span>
                        ))}
                      </div>
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(entry)}
                        className="gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(entry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบ
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {entry.url && (
                      <FieldRow
                        label="URL"
                        value={entry.url}
                        type="url"
                        onCopy={() => copyToClipboard(entry.url!, 'URL')}
                      />
                    )}
                    {entry.username && (
                      <FieldRow
                        label="Username"
                        value={entry.username}
                        type="text"
                        onCopy={() => copyToClipboard(entry.username!, 'Username')}
                      />
                    )}
                    {entry.password && (
                      <FieldRow
                        label="Password"
                        value={entry.password}
                        type="password"
                        revealed={revealed.has(`${entry.id}:password`)}
                        onToggle={() => toggleReveal(`${entry.id}:password`)}
                        onCopy={() => copyToClipboard(entry.password!, 'Password')}
                      />
                    )}
                    {entry.extra_fields.map((f, i) => (
                      <FieldRow
                        key={`${entry.id}:extra:${i}`}
                        label={f.label}
                        value={f.value}
                        type={f.type ?? 'text'}
                        revealed={revealed.has(`${entry.id}:extra:${i}`)}
                        onToggle={
                          f.type === 'password'
                            ? () => toggleReveal(`${entry.id}:extra:${i}`)
                            : undefined
                        }
                        onCopy={() => copyToClipboard(f.value, f.label)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CRUD dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </DialogTitle>
            <DialogDescription>
              เก็บข้อมูลโรงเรียนแบบยืดหยุ่น — เพิ่มฟิลด์ย่อยได้ตามต้องการ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category + Title row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>หมวด <span className="text-red-500">*</span></Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setField('category', v as DashboardEntryCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DASHBOARD_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>ชื่อรายการ <span className="text-red-500">*</span></Label>
                <Input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="เช่น ระบบ ป.ป.ช., รหัสโรงเรียน, เน็ต ป.4..."
                />
              </div>
            </div>

            <div>
              <Label>คำอธิบาย / หมายเหตุ</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="คำอธิบายเพิ่มเติม (เช่น วัตถุประสงค์, ผู้รับผิดชอบ)..."
                rows={2}
              />
            </div>

            {/* Common typed fields */}
            <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                ฟิลด์มาตรฐาน (ไม่บังคับ)
              </p>
              <div>
                <Label>URL / ลิงก์เว็บ</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setField('url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Username / ผู้ใช้</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Password / รหัสผ่าน</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Extra fields */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  ฟิลด์เพิ่มเติม (ยืดหยุ่น)
                </p>
                <Button size="sm" variant="outline" onClick={addExtraField} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มฟิลด์
                </Button>
              </div>
              {form.extra_fields.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  ยังไม่มีฟิลด์เพิ่มเติม — กดปุ่มด้านบนเพื่อเพิ่ม (เช่น "WAN IP", "เลขครุภัณฑ์", ฯลฯ)
                </p>
              ) : (
                <div className="space-y-2">
                  {form.extra_fields.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={f.label}
                        onChange={(e) => updateExtraField(idx, { label: e.target.value })}
                        placeholder="ป้ายชื่อ"
                        className="w-40 flex-shrink-0"
                      />
                      <Input
                        value={f.value}
                        onChange={(e) => updateExtraField(idx, { value: e.target.value })}
                        placeholder="ค่า"
                        className="flex-1"
                      />
                      <Select
                        value={f.type ?? 'text'}
                        onValueChange={(v) =>
                          updateExtraField(idx, { type: v as DashboardExtraFieldType })
                        }
                      >
                        <SelectTrigger className="w-32 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeExtraField(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>แท็ก (Tags)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="พิมพ์แท็กแล้วกด Enter"
                />
                <Button variant="outline" onClick={addTag}>
                  เพิ่ม
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => removeTag(t)}
                  >
                    {t} <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">ข้อมูลละเอียดอ่อน</Label>
                <p className="text-xs text-muted-foreground">
                  ทำเครื่องหมายเป็นข้อมูลที่ต้องระวังเป็นพิเศษ (จะแสดง badge แดง)
                </p>
              </div>
              <Switch
                checked={form.is_sensitive}
                onCheckedChange={(v) => setField('is_sensitive', v)}
              />
            </div>

            <div>
              <Label>ลำดับการแสดง</Label>
              <Input
                type="number"
                value={form.order_position}
                onChange={(e) => setField('order_position', Number(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบรายการนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:bg-muted'
      }`}
    >
      {label}
      <span className={`ml-1.5 text-xs ${active ? 'opacity-80' : 'text-muted-foreground'}`}>
        ({count})
      </span>
    </button>
  );
}

function FieldRow({
  label,
  value,
  type,
  revealed,
  onToggle,
  onCopy,
}: {
  label: string;
  value: string;
  type: DashboardExtraFieldType;
  revealed?: boolean;
  onToggle?: () => void;
  onCopy?: () => void;
}) {
  const isPassword = type === 'password';
  const display = isPassword && !revealed ? '•'.repeat(Math.min(12, value.length || 8)) : value;

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-b-0 last:pb-0">
      <span className="text-xs font-medium text-muted-foreground min-w-[110px] flex-shrink-0">
        {label}
      </span>
      {type === 'url' && !isPassword ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline truncate flex items-center gap-1 flex-1 min-w-0"
        >
          {display}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ) : (
        <code
          className={`text-sm flex-1 min-w-0 truncate font-mono ${
            type === 'ip' ? 'text-emerald-700' : 'text-foreground'
          }`}
        >
          {display}
        </code>
      )}
      {onToggle && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggle}
          className="h-7 w-7 flex-shrink-0"
          title={revealed ? 'ซ่อน' : 'แสดง'}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
      )}
      {onCopy && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onCopy}
          className="h-7 w-7 flex-shrink-0"
          title="คัดลอก"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export default DashboardSchoolManagement;
