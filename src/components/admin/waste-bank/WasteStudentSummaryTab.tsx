import { useEffect, useMemo, useState } from 'react';
import { Download, LayoutGrid, LayoutList, Layers, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import {
  wasteViewPreferenceService,
  type WasteSummarySortBy,
  type WasteSummaryViewMode,
  type WasteStudentSummary,
} from '@/services/waste-bank.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
const CLASS_ORDER = Object.fromEntries(CLASSES.map((c, i) => [c, i]));

const SORT_LABELS: Record<WasteSummarySortBy, string> = {
  points:       'แต้มคงเหลือ (มาก→น้อย)',
  earned:       'แต้มรวมที่ได้ (มาก→น้อย)',
  items:        'จำนวนชิ้นรวม (มาก→น้อย)',
  transactions: 'จำนวนครั้งส่ง (มาก→น้อย)',
  class:        'รายห้องเรียน + แต้มคงเหลือ',
  name:         'ชื่อ ก–ฮ',
};

interface Props {
  summaries: WasteStudentSummary[];
}

const applySortFn = (
  a: WasteStudentSummary,
  b: WasteStudentSummary,
  sortBy: WasteSummarySortBy,
): number => {
  switch (sortBy) {
    case 'points':
      return Number(b.available_points ?? 0) - Number(a.available_points ?? 0);
    case 'earned':
      return Number(b.total_points_earned ?? 0) - Number(a.total_points_earned ?? 0);
    case 'items':
      return Number(b.total_items ?? 0) - Number(a.total_items ?? 0);
    case 'transactions':
      return Number(b.total_transactions ?? 0) - Number(a.total_transactions ?? 0);
    case 'class': {
      const ca = CLASS_ORDER[a.class_name ?? ''] ?? 99;
      const cb = CLASS_ORDER[b.class_name ?? ''] ?? 99;
      if (ca !== cb) return ca - cb;
      return Number(b.available_points ?? 0) - Number(a.available_points ?? 0);
    }
    case 'name':
      return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'th');
  }
};

export const WasteStudentSummaryTab = ({ summaries }: Props) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<WasteSummaryViewMode>('table');
  const [sortBy, setSortBy] = useState<WasteSummarySortBy>('points');
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [prefLoading, setPrefLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wasteViewPreferenceService.load().then((pref) => {
      setViewMode(pref.viewMode);
      setSortBy(pref.sortBy);
      setPrefLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return summaries.filter((s) => {
      if (classFilter !== 'all' && s.class_name !== classFilter) return false;
      if (term && !s.full_name?.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [summaries, classFilter, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => applySortFn(a, b, sortBy)),
    [filtered, sortBy],
  );

  const byClass = useMemo(() => {
    const innerSort: WasteSummarySortBy = sortBy === 'class' ? 'points' : sortBy;
    const map = new Map<string, WasteStudentSummary[]>();
    for (const s of sorted) {
      const key = s.class_name ?? 'ไม่ระบุชั้น';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    map.forEach((rows, cls) => {
      map.set(cls, [...rows].sort((a, b) => applySortFn(a, b, innerSort)));
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const oa = CLASS_ORDER[a] ?? 99;
      const ob = CLASS_ORDER[b] ?? 99;
      return oa - ob;
    });
  }, [sorted, sortBy]);

  const handleLock = async () => {
    setSaving(true);
    await wasteViewPreferenceService.save({ viewMode, sortBy });
    setSaving(false);
    toast({
      title: 'บันทึกค่าเริ่มต้นแล้ว',
      description: `วิว: ${viewMode === 'table' ? 'ตาราง' : viewMode === 'grid' ? 'การ์ด' : 'รายห้อง'} · เรียง: ${SORT_LABELS[sortBy]}`,
    });
  };

  const handleExportCSV = () => {
    downloadCSV(
      'waste-summary.csv',
      ['ชื่อ', 'ชั้น', 'รหัส', 'ครั้งส่ง', 'ชิ้นรวม', 'แต้มรวม', 'แต้มคงเหลือ'],
      sorted.map((s) => [
        s.full_name ?? '',
        s.class_name ?? '',
        s.student_code ?? '',
        String(s.total_transactions ?? 0),
        String(s.total_items ?? 0),
        String(s.total_points_earned ?? 0),
        String(s.available_points ?? 0),
      ]),
    );
  };

  if (prefLoading) {
    return <p className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด…</p>;
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm ring-1 ring-border">
      {/* Header */}
      <div className="px-5 md:px-6 py-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="text-base font-extrabold text-foreground">แต้มสะสมรายคน</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View mode toggle */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(
                [
                  { mode: 'table' as const, icon: <LayoutList className="w-3.5 h-3.5" />, label: 'ตาราง' },
                  { mode: 'grid' as const, icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'การ์ด' },
                  { mode: 'by-class' as const, icon: <Layers className="w-3.5 h-3.5" />, label: 'รายห้อง' },
                ] as const
              ).map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    viewMode === mode
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as WasteSummarySortBy)}>
              <SelectTrigger className="h-8 text-xs border-border min-w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SORT_LABELS) as [WasteSummarySortBy, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lock preference */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              disabled={saving}
              className="border-border text-foreground font-bold gap-1 h-8 text-xs"
              title="ล็อกวิวและการเรียงนี้เป็นค่าเริ่มต้น"
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ล็อกค่าเริ่มต้น</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-border text-foreground font-bold gap-1 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mt-4">
          {viewMode !== 'by-class' && (
            <div className="space-y-1 min-w-36">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ชั้น</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="border-border h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้น</SelectItem>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1 flex-1 min-w-40">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ค้นหาชื่อ</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อ..."
              className="border-border h-8 text-xs"
            />
          </div>
          <p className="text-xs text-muted-foreground pb-1">
            {sorted.length.toLocaleString('th-TH')} คน
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {sorted.length === 0 && (
          <p className="text-center py-12 text-muted-foreground font-medium text-sm">ไม่มีข้อมูล</p>
        )}

        {/* ── Table view ── */}
        {viewMode === 'table' && sorted.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">นักเรียน</th>
                  <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">ชั้น</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">ครั้งส่ง</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">ชิ้นรวม</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">แต้มได้</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">แต้มคงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => (
                  <tr
                    key={s.student_id ?? s.full_name}
                    className={cn('border-t border-border', idx % 2 === 1 && 'bg-muted/20')}
                  >
                    <td className="p-3 text-xs text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="sm" />
                        <span className="font-bold text-foreground">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {s.class_name ?? '—'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      {s.total_transactions ?? 0}
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold text-foreground">
                      {s.total_items ?? 0}
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-amber-700">
                      {s.total_points_earned ?? 0}
                    </td>
                    <td
                      className={cn(
                        'p-3 text-right tabular-nums font-extrabold',
                        Number(s.available_points ?? 0) > 0 ? 'text-emerald-700' : 'text-muted-foreground',
                      )}
                    >
                      {s.available_points ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Grid / Card view ── */}
        {viewMode === 'grid' && sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sorted.map((s) => {
              const pts = Number(s.available_points ?? 0);
              const hasPoints = pts > 0;
              return (
                <div
                  key={s.student_id ?? s.full_name}
                  className={cn(
                    'rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-shadow hover:shadow-md',
                    hasPoints
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-muted/30 border-border',
                  )}
                >
                  <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="md" />
                  <div className="w-full">
                    <p className="text-xs font-bold text-foreground truncate">{s.full_name}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-semibold mt-1',
                        hasPoints ? 'border-emerald-300 text-emerald-700' : 'border-border text-muted-foreground',
                      )}
                    >
                      {s.class_name ?? '—'}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      'text-lg font-extrabold tabular-nums leading-none',
                      hasPoints ? 'text-emerald-700' : 'text-muted-foreground',
                    )}
                  >
                    {pts} <span className="text-xs font-medium">แต้ม</span>
                  </p>
                  <div className="w-full flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>{s.total_items ?? 0} ชิ้น</span>
                    <span>{s.total_transactions ?? 0} ครั้ง</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── By-class view ── */}
        {viewMode === 'by-class' && byClass.length > 0 && (
          <div className="space-y-5">
            {byClass.map(([className, students]) => {
              const classPoints = students.reduce((sum, s) => sum + Number(s.available_points ?? 0), 0);
              const classItems = students.reduce((sum, s) => sum + Number(s.total_items ?? 0), 0);
              return (
                <div key={className} className="rounded-xl border border-border overflow-hidden">
                  {/* Section header */}
                  <div className="px-4 py-3 bg-foreground flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-background">{className}</span>
                      <Badge className="bg-background/20 text-background text-xs border-0">
                        {students.length} คน
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-background/80 font-medium">
                      <span>ชิ้นรวม {classItems.toLocaleString('th-TH')}</span>
                      <span className="text-amber-300 font-bold">แต้มคงเหลือ {classPoints.toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                  {/* Students table */}
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2.5 text-left text-xs font-bold text-muted-foreground pl-4">นักเรียน</th>
                        <th className="p-2.5 text-right text-xs font-bold text-muted-foreground">ชิ้น</th>
                        <th className="p-2.5 text-right text-xs font-bold text-muted-foreground">แต้มได้</th>
                        <th className="p-2.5 text-right text-xs font-bold text-muted-foreground pr-4">คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <tr
                          key={s.student_id ?? s.full_name}
                          className={cn('border-t border-border', idx % 2 === 1 && 'bg-muted/20')}
                        >
                          <td className="p-2.5 pl-4">
                            <div className="flex items-center gap-2">
                              <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="xs" />
                              <span className="font-semibold text-foreground text-xs">{s.full_name}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums text-foreground font-semibold">
                            {s.total_items ?? 0}
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums font-bold text-amber-700">
                            {s.total_points_earned ?? 0}
                          </td>
                          <td
                            className={cn(
                              'p-2.5 text-right text-xs tabular-nums font-extrabold pr-4',
                              Number(s.available_points ?? 0) > 0 ? 'text-emerald-700' : 'text-muted-foreground',
                            )}
                          >
                            {s.available_points ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
