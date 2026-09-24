import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownToLine, ArrowRight, RefreshCw, Search, Users, Wallet, Recycle, ChartColumn, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/lib/utils';
import { bankDashboardService, type BankKind, type BankAudience, type BankActivity, type BankDataset, type BankStudent } from '@/services/bank-dashboard.service';
import { bankDate, bankNumber, bankTotals, bankTrend, defaultBankFilter, filterBankActivities, type BankFilter } from '@/lib/bank-dashboard';
import './bank.css';

const COLORS = ['green', 'blue', 'gold', 'purple', 'rose', 'cyan'];
const categoryColor = (color: string | null, index: number) => `hsl(var(--bank-${color === 'emerald' ? 'green' : color === 'amber' ? 'gold' : color === 'violet' ? 'purple' : COLORS.includes(color ?? '') ? color : COLORS[index % COLORS.length]}))`;
const statusLabels: Record<string, string> = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' };

export function BankKpi({ label, value, unit, note, tone = 'normal' }: { label: string; value: number | null; unit: string; note?: string; tone?: 'normal' | 'positive' | 'negative' }) {
  return <div className={cn('bank-card bank-kpi')}>
    <p className={cn('bank-muted text-sm font-semibold')}>{label}</p>
    <p className={cn('mt-1 text-2xl font-extrabold tabular-nums break-words', tone === 'positive' && 'bank-positive', tone === 'negative' && 'bank-negative')}>
      {bankNumber(value)} <span className={cn('text-xs font-semibold bank-muted')}>{unit}</span>
    </p>
    <p className={cn('mt-1 text-xs bank-muted')}>{note ?? 'ในช่วงที่เลือก'}</p>
  </div>;
}

export function BankFilters({ value, onChange, classes = [], personal = false }: { value: BankFilter; onChange: (value: BankFilter) => void; classes?: string[]; personal?: boolean }) {
  const update = (patch: Partial<BankFilter>) => onChange({ ...value, ...patch });
  return <div className={cn('bank-card flex flex-wrap items-end gap-3')}>
    <label className={cn('text-xs font-semibold flex flex-col gap-1')}>ช่วงเวลา
      <select className={cn('h-10 rounded-md border px-3 text-sm')} value={value.period} onChange={e => update({ period: e.target.value as BankFilter['period'] })}>
        <option value="today">วันนี้</option><option value="month">เดือนนี้</option><option value="all">ทั้งหมด</option><option value="custom">กำหนดเอง</option>
      </select>
    </label>
    {value.period === 'custom' && <>
      <label className={cn('text-xs font-semibold flex flex-col gap-1')}>ตั้งแต่<Input type="date" value={value.start} onChange={e => update({ start: e.target.value })} /></label>
      <label className={cn('text-xs font-semibold flex flex-col gap-1')}>ถึง<Input type="date" value={value.end} onChange={e => update({ end: e.target.value })} /></label>
    </>}
    {!personal && <>
      <label className={cn('text-xs font-semibold flex flex-col gap-1')}>ชั้นเรียน
        <select className={cn('h-10 rounded-md border px-3 text-sm')} value={value.className} onChange={e => update({ className: e.target.value })}>
          <option value="all">ทุกชั้นเรียน</option>{classes.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className={cn('text-xs font-semibold flex flex-col gap-1 flex-1 min-w-40')}>ค้นหานักเรียน
        <span className={cn('relative')}><Search className={cn('absolute left-3 top-3 h-4 w-4 bank-muted')} /><Input className={cn('pl-9')} placeholder="ชื่อหรือรหัสนักเรียน" value={value.search} onChange={e => update({ search: e.target.value })} /></span>
      </label>
    </>}
    <Button variant="outline" onClick={() => onChange(defaultBankFilter())}>ล้างตัวกรอง</Button>
    {value.period === 'custom' && (!value.start || !value.end || value.start > value.end) && <p role="alert" className={cn('w-full text-sm bank-negative')}>กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดให้ถูกต้อง</p>}
  </div>;
}

function TrendChart({ rows, filter, kind, publicView }: { rows: BankActivity[]; filter: BankFilter; kind: BankKind; publicView: boolean }) {
  const data = useMemo(() => bankTrend(rows, filter), [rows, filter]);
  const unit = kind === 'waste' ? 'ชิ้น' : publicView ? 'ครั้ง' : 'บาท';
  const totals = bankTotals(rows);
  return <section className={cn('bank-card')} aria-label="กราฟแนวโน้มกิจกรรม">
    <h3 className={cn('font-bold flex items-center gap-2')}><ChartColumn className={cn('w-4 h-4')} />{kind === 'savings' ? 'แนวโน้มการออม' : 'แนวโน้มการฝากขยะ'}</h3>
    <p className={cn('text-xs bank-muted mt-1 mb-3')}>รวม {bankNumber(totals.incoming)} {unit}{kind === 'savings' && !publicView ? ` · ถอน ${bankNumber(totals.outgoing)} บาท` : ''} · {data.length > 0 && data[0].date.length === 7 ? 'แสดงรายเดือน' : 'แสดงรายวัน'}</p>
    {rows.length ? <div className={cn('h-56 w-full min-w-0')}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data} accessibilityLayer margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--bank-line))" />
        <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 11 }} /><YAxis width={48} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${bankNumber(v)} ${unit}`} /><Legend />
        <Bar isAnimationActive={false} dataKey="incoming" name={kind === 'savings' ? 'ฝาก' : 'จำนวนชิ้น'} fill="hsl(var(--bank-green))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        {kind === 'savings' && !publicView && <Bar isAnimationActive={false} dataKey="outgoing" name="ถอน" fill="hsl(var(--bank-rose))" radius={[4, 4, 0, 0]} maxBarSize={28} />}
      </BarChart></ResponsiveContainer>
    </div> : <p className={cn('h-56 grid place-items-center text-sm bank-muted')}>ยังไม่มีกิจกรรมในช่วงนี้</p>}
  </section>;
}

function Breakdown({ rows, kind, onSelect }: { rows: BankActivity[]; kind: BankKind; onSelect?: (key: string) => void }) {
  const groups = new Map<string, { id: string; label: string; value: number; color: string | null }>();
  rows.forEach(t => {
    const id = kind === 'savings' ? t.className ?? 'ไม่ระบุชั้น' : t.categoryId;
    const prev = groups.get(id) ?? { id, label: kind === 'savings' ? id : t.category, value: 0, color: t.color };
    prev.value += kind === 'savings' ? t.count : t.incoming; groups.set(id, prev);
  });
  const data = [...groups.values()].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...data.map(d => d.value));
  return <section className={cn('bank-card')}>
    <h3 className={cn('font-bold')}>{kind === 'savings' ? 'จำนวนครั้งฝากแยกชั้นเรียน' : 'สัดส่วนประเภทขยะ'}</h3>
    <p className={cn('text-xs bank-muted mt-1 mb-3')}>{onSelect ? 'เลือกแถบเพื่อกรองข้อมูลด้านล่าง' : 'กิจกรรมในช่วงที่เลือก'}</p>
    <div className={cn('space-y-3 max-h-56 overflow-y-auto')}>
      {data.length === 0 && <p className={cn('text-sm bank-muted py-10 text-center')}>ยังไม่มีข้อมูลในช่วงนี้</p>}
      {data.map((d, i) => <button key={d.id} type="button" disabled={!onSelect} onClick={() => onSelect?.(d.id)} className={cn('block w-full text-left rounded-md disabled:opacity-100')}>
        <span className={cn('flex justify-between gap-3 text-sm mb-1')}><span>{d.label}</span><strong className={cn('tabular-nums')}>{bankNumber(d.value)} {kind === 'savings' ? 'ครั้ง' : 'ชิ้น'}</strong></span>
        <span className={cn('block h-3 rounded-full bg-muted')}><span className={cn('block h-full rounded-full')} style={{ width: `${d.value / max * 100}%`, background: categoryColor(d.color, i) }} /></span>
      </button>)}
    </div>
  </section>;
}

function ActivityList({ rows, kind, students, limit }: { rows: BankActivity[]; kind: BankKind; students: BankStudent[]; limit?: number }) {
  const [page, setPage] = useState(0);
  const sorted = [...rows].reverse();
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / 25) - 1));
  const shown = limit ? sorted.slice(0, limit) : sorted.slice(currentPage * 25, (currentPage + 1) * 25);
  const people = new Map(students.map(s => [s.student_id, s]));
  return <div className={cn('space-y-2')}>
    {shown.length === 0 && <p className={cn('bank-muted py-6 text-center text-sm')}>ไม่พบรายการ</p>}
    {shown.map(t => {
      const person = people.get(t.studentId);
      return <div key={t.id} className={cn('flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm')}>
        <div className={cn('flex items-center gap-2 min-w-0')}>
          <PersonAvatar name={person?.full_name ?? t.name ?? 'ไม่พบข้อมูลนักเรียน'} photoUrl={person?.photo_url} size="xs" />
          <div><p className={cn('font-semibold break-words')}>{person?.full_name ?? t.name ?? 'ไม่พบข้อมูลนักเรียน'}</p><p className={cn('text-xs bank-muted')}>{bankDate(t.date)} · {t.category}</p></div>
        </div>
        <span className={cn('font-bold tabular-nums', t.outgoing ? 'bank-negative' : 'bank-positive')}>
          {t.outgoing ? '−' : '+'}{bankNumber(t.outgoing || t.incoming)} {kind === 'savings' ? 'บาท' : 'ชิ้น'}{kind === 'waste' ? ` · ${bankNumber(t.points)} แต้ม` : ''}
        </span>
      </div>;
    })}
    {!limit && <Pagination page={currentPage} count={rows.length} onChange={setPage} />}
  </div>;
}

function Pagination({ page, count, onChange }: { page: number; count: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / 25));
  return <div className={cn('flex flex-wrap items-center justify-between gap-2 mt-3 text-xs bank-muted')}>
    <span>{bankNumber(count)} รายการ · หน้า {page + 1}/{pages} · หน้าละ 25</span>
    <div className={cn('flex gap-2')}><Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>ก่อนหน้า</Button><Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>ถัดไป</Button></div>
  </div>;
}

export function BankDashboard({ kind, audience = 'public', studentId, initialFilter, onRecord, onScan }: {
  kind: BankKind; audience?: BankAudience; studentId?: string; initialFilter?: BankFilter; onRecord?: () => void; onScan?: () => void;
}) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<BankFilter>(() => initialFilter ?? defaultBankFilter());
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('activity');
  const [allHistory, setAllHistory] = useState(false);
  const [selected, setSelected] = useState<string | null>(() => audience === 'admin' ? params.get('student') : null);
  const publicView = audience === 'public';
  const personal = !!studentId;
  const query = useQuery({ queryKey: ['bank-dashboard', kind, audience, user?.id ?? 'anonymous', studentId ?? 'all'],
    queryFn: () => bankDashboardService.load(kind, audience, studentId), staleTime: 30_000 });
  const changeFilter = (next: BankFilter) => { setFilter(next); setPage(0); };
  const closeDetail = () => { setSelected(null); if (params.has('student')) { const next = new URLSearchParams(params); next.delete('student'); setParams(next, { replace: true }); } };
  return <div className={cn('bank-surface space-y-3')} data-bank={kind}>
    <div className={cn('flex flex-wrap items-center justify-between gap-3')}>
      <div><h2 className={cn('font-bold text-lg flex items-center gap-2')}>{kind === 'savings' ? <Wallet className={cn('w-5 h-5')} /> : <Recycle className={cn('w-5 h-5')} />}{personal ? 'สรุปกิจกรรมรายบุคคล' : 'ภาพรวมกิจกรรม'}</h2><p className={cn('text-xs bank-muted')}>{publicView && kind === 'savings' ? 'ชื่นชมวินัยการออม · ไม่เปิดเผยยอดเงินส่วนบุคคล' : 'ติดตามกิจกรรมและดูรายละเอียดในช่วงที่เลือก'}</p></div>
      <div className={cn('flex flex-wrap gap-2')}>
        {onRecord && <Button onClick={onRecord}><ArrowDownToLine className={cn('w-4 h-4 mr-1')} />บันทึกรายการ</Button>}
        {onScan && <Button variant="outline" onClick={onScan}><QrCode className={cn('w-4 h-4 mr-1')} />สแกน QR</Button>}
        <Button variant="outline" size="icon" aria-label="รีเฟรชข้อมูล" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={cn('w-4 h-4', query.isFetching && 'animate-spin')} /></Button>
      </div>
    </div>
    <BankFilters value={filter} onChange={changeFilter} personal={personal} classes={[...new Set(query.data?.students.map(s => s.class_name).filter((c): c is string => !!c))].sort()} />
    {query.isPending ? <div role="status" className={cn('bank-card py-14 text-center bank-muted')}>กำลังโหลดข้อมูลธนาคาร…</div>
      : query.isError ? <div role="alert" className={cn('bank-card text-center space-y-3')}><p>โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</p><Button variant="outline" onClick={() => void query.refetch()}>ลองใหม่</Button></div>
      : filter.period === 'custom' && (!filter.start || !filter.end || filter.start > filter.end) ? null
      : <BankContents data={query.data} kind={kind} audience={audience} personal={personal} filter={filter} changeFilter={changeFilter} page={page} setPage={setPage} sort={sort} setSort={setSort} allHistory={allHistory} setAllHistory={setAllHistory} onSelect={setSelected} />}
    {audience === 'admin' && !personal && <Sheet open={!!selected} onOpenChange={open => { if (!open) closeDetail(); }}>
      <SheetContent className={cn('w-full sm:max-w-3xl overflow-y-auto p-4')}>
        <SheetHeader><SheetTitle>รายละเอียดนักเรียน</SheetTitle><SheetDescription>ยอดปัจจุบันและกิจกรรมของธนาคารนี้</SheetDescription></SheetHeader>
        {selected && <div className={cn('mt-4')}><BankDashboard key={`${kind}-${selected}`} kind={kind} audience="admin" studentId={selected} initialFilter={{ ...filter, className: 'all', category: 'all', search: '' }} /></div>}
      </SheetContent>
    </Sheet>}
  </div>;
}

function BankContents({ data, kind, audience, personal, filter, changeFilter, page, setPage, sort, setSort, allHistory, setAllHistory, onSelect }: {
  data: BankDataset; kind: BankKind; audience: BankAudience; personal: boolean; filter: BankFilter; changeFilter: (f: BankFilter) => void;
  page: number; setPage: (v: number) => void; sort: string; setSort: (v: string) => void; allHistory: boolean; setAllHistory: (v: boolean) => void; onSelect: (id: string) => void;
}) {
  const publicView = audience === 'public';
  const rows = filterBankActivities(data.activities, data.students, filter);
  const totals = bankTotals(rows);
  const byStudent = new Map<string | null, BankActivity[]>();
  rows.forEach(t => { const list = byStudent.get(t.studentId) ?? []; list.push(t); byStudent.set(t.studentId, list); });
  const search = filter.search.trim().toLocaleLowerCase('th-TH');
  const students = data.students.filter(s => (filter.className === 'all' || s.class_name === filter.className)
    && (!search || `${s.full_name ?? ''} ${s.student_code ?? ''}`.toLocaleLowerCase('th-TH').includes(search))
    && (filter.category === 'all' || byStudent.has(s.student_id)));
  const participants = new Set(rows.filter(t => kind === 'waste' || t.count > 0).map(t => t.studentId).filter(Boolean)).size;
  const balance = (personal && !students.length) || students.some(s => s.balance == null) ? null : students.reduce((sum, s) => sum + (s.balance ?? 0), 0);
  const tableRows = students.map(s => ({ person: s, totals: bankTotals(byStudent.get(s.student_id) ?? []), latest: (byStudent.get(s.student_id) ?? []).at(-1)?.date }));
  tableRows.sort((a, b) => sort === 'name' ? (a.person.full_name ?? '').localeCompare(b.person.full_name ?? '', 'th')
    : sort === 'balance' ? (b.person.balance ?? -Infinity) - (a.person.balance ?? -Infinity)
      : (kind === 'savings' ? b.totals.count - a.totals.count : b.totals.points - a.totals.points) || (a.person.full_name ?? '').localeCompare(b.person.full_name ?? '', 'th'));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(tableRows.length / 25) - 1));
  const visible = tableRows.slice(currentPage * 25, (currentPage + 1) * 25);
  const person = personal ? data.students[0] : undefined;
  return <>
    {personal && person && <div className={cn('bank-card flex flex-wrap items-center justify-between gap-3')}>
      <div className={cn('flex items-center gap-3')}><PersonAvatar name={person.full_name ?? 'นักเรียน'} photoUrl={person.photo_url} size="lg" /><div><h3 className={cn('font-bold')}>{person.full_name}</h3><p className={cn('text-sm bank-muted')}>{person.class_name} · รหัส {person.student_code ?? '—'}</p></div></div>
      <Button asChild size="sm" variant="outline"><Link to={audience === 'parent' ? `/parent/${kind === 'savings' ? 'waste' : 'savings'}-bank` : `/admin/dashboard/${kind === 'savings' ? 'waste' : 'savings'}-bank?student=${person.student_id}`}>ดู{kind === 'savings' ? 'ธนาคารขยะ' : 'ธนาคารพอเพียง'}<ArrowRight className={cn('w-4 h-4 ml-1')} /></Link></Button>
    </div>}
    {personal && !person && <p className={cn('bank-card')} role="status">ไม่พบข้อมูลนักเรียนที่มีสิทธิ์เข้าถึง</p>}
    <div className={cn('grid grid-cols-2 xl:grid-cols-4 gap-3')}>
      {kind === 'savings' ? <>
        {!publicView && <BankKpi label="ยอดคงเหลือปัจจุบัน" value={balance} unit="บาท" note="สะสมทั้งหมด · ไม่จำกัดช่วงเวลา" />}
        <BankKpi label={publicView ? 'จำนวนครั้งฝาก' : 'เงินฝาก'} value={totals.incoming} unit={publicView ? 'ครั้ง' : 'บาท'} tone="positive" />
        {!publicView && <BankKpi label="เงินถอน" value={totals.outgoing} unit="บาท" tone="negative" />}
        <BankKpi label={personal ? 'จำนวนครั้งฝาก' : 'ผู้ฝากไม่ซ้ำ'} value={personal ? totals.count : participants} unit={personal ? 'ครั้ง' : 'คน'} />
      </> : <>
        <BankKpi label="ขยะที่นำมาฝาก" value={totals.incoming} unit="ชิ้น" />
        <BankKpi label="แต้มที่ได้รับ" value={totals.points} unit="แต้ม" tone="positive" />
        <BankKpi label={personal ? 'แต้มคงเหลือปัจจุบัน' : 'ผู้ร่วมกิจกรรมไม่ซ้ำ'} value={personal ? balance : participants} unit={personal ? 'แต้ม' : 'คน'} note={personal ? 'ยอดปัจจุบันตามระบบ' : undefined} />
        {audience === 'admin' && !personal && <BankKpi label="คำขอรออนุมัติ" value={data.pending} unit="รายการ" note="ปัจจุบัน · ไม่จำกัดช่วงเวลา/ชั้น" />}
        {personal && <BankKpi label="แต้มใช้ไปปัจจุบัน" value={person?.spent ?? null} unit="แต้ม" note="ยอดปัจจุบันตามระบบ" />}
      </>}
    </div>
    <div className={cn('grid lg:grid-cols-2 gap-3')}><TrendChart rows={rows} filter={filter} kind={kind} publicView={publicView} /><Breakdown rows={filterBankActivities(data.activities, data.students, { ...filter, category: 'all' })} kind={kind} onSelect={personal ? undefined : key => changeFilter({ ...filter, ...(kind === 'savings' ? { className: key } : { category: key }) })} /></div>
    {filter.category !== 'all' && <Button variant="outline" size="sm" onClick={() => changeFilter({ ...filter, category: 'all' })}>ประเภท: {rows[0]?.category ?? 'ที่เลือก'} × ล้างประเภท</Button>}
    {!personal && <section className={cn('bank-card')}>
      <div className={cn('flex flex-wrap items-center justify-between gap-2 mb-3')}><h3 className={cn('font-bold flex items-center gap-2')}><Users className={cn('w-4 h-4')} />{publicView ? 'อันดับกิจกรรมในช่วงที่เลือก' : 'สรุปรายบุคคล'}</h3>
        <label className={cn('text-xs bank-muted')}>เรียงตาม <select className={cn('rounded border p-2')} value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}><option value="activity">{kind === 'savings' ? 'จำนวนครั้งฝาก' : 'แต้มได้รับ'}</option><option value="name">ชื่อ ก–ฮ</option>{!publicView && <option value="balance">ยอดคงเหลือ</option>}</select></label>
      </div>
      <p className={cn('text-xs bank-muted mb-3')}>รวมผลลัพธ์ทั้งหมด: {kind === 'savings' ? `${bankNumber(totals.count)} ครั้งฝาก` : `${bankNumber(totals.incoming)} ชิ้น · ${bankNumber(totals.points)} แต้ม`}{!publicView && ' · ยอดคงเหลือ/แต้มใช้เป็นยอดปัจจุบัน'}</p>
      {visible.length === 0 && <p className={cn('py-10 text-center bank-muted')}>{data.students.length ? 'ไม่พบผลค้นหาตามตัวกรอง' : 'ยังไม่มีข้อมูลนักเรียน'}</p>}
      <div tabIndex={0} aria-label="ตารางรายบุคคล เลื่อนดูรายการเพิ่มเติม" className={cn('hidden md:block bank-table-wrap')}><table className={cn('bank-table')}><thead><tr><th className={cn('text-left')}>นักเรียน</th><th>กิจกรรม</th>{kind === 'waste' && <th>แต้มได้รับ</th>}{!publicView && <>{kind === 'savings' ? <th>ถอน (บาท)</th> : <th>แต้มใช้ปัจจุบัน</th>}<th>คงเหลือปัจจุบัน</th></>}<th>ล่าสุดในช่วง</th>{!publicView && <th><span className={cn('sr-only')}>รายละเอียด</span></th>}</tr></thead>
        <tbody>{visible.map(({ person: s, totals: t, latest }) => <tr key={s.student_id}>
          <td><div className={cn('flex items-center gap-2')}><PersonAvatar name={s.full_name ?? 'นักเรียน'} photoUrl={s.photo_url} size="sm" /><div><button type="button" disabled={publicView || !s.student_id} onClick={() => s.student_id && onSelect(s.student_id)} className={cn('font-semibold text-left disabled:opacity-100')}>{s.full_name}</button><p className={cn('text-xs bank-muted')}>{s.class_name}{s.student_code ? ` · ${s.student_code}` : ''}</p></div></div></td>
          <td className={cn('bank-numeric bank-positive')}>{bankNumber(kind === 'savings' && publicView ? t.count : t.incoming)} {kind === 'waste' ? 'ชิ้น' : publicView ? 'ครั้ง' : 'บาท'}</td>
          {kind === 'waste' && <td className={cn('bank-numeric')}>{bankNumber(t.points)}</td>}
          {!publicView && <><td className={cn('bank-numeric bank-negative')}>{bankNumber(kind === 'savings' ? t.outgoing : s.spent)}</td><td className={cn('bank-numeric')}>{bankNumber(s.balance)} {kind === 'savings' ? 'บาท' : 'แต้ม'}</td></>}
          <td className={cn('text-center whitespace-nowrap bank-muted text-xs')}>{latest ? bankDate(latest) : '—'}</td>
          {!publicView && <td><Button size="sm" variant="outline" disabled={!s.student_id} onClick={() => s.student_id && onSelect(s.student_id)}>ดูรายละเอียด</Button></td>}
        </tr>)}</tbody></table></div>
      <div tabIndex={0} aria-label="รายการรายบุคคล เลื่อนดูเพิ่มเติม" className={cn('md:hidden space-y-2 max-h-[32rem] overflow-y-auto')}>{visible.map(({ person: s, totals: t }) => <div key={s.student_id} className={cn('rounded-lg border border-border p-3')}>
        <div className={cn('flex gap-2 items-center')}><PersonAvatar name={s.full_name ?? 'นักเรียน'} photoUrl={s.photo_url} size="sm" /><div className={cn('min-w-0 flex-1')}><p className={cn('font-semibold break-words')}>{s.full_name}</p><p className={cn('text-xs bank-muted')}>{s.class_name} {s.student_code}</p></div></div>
        <div className={cn('grid grid-cols-2 gap-2 mt-2 text-sm tabular-nums')}><span className={cn('bank-positive')}>{kind === 'savings' ? 'ฝาก' : 'ขยะ'} {bankNumber(publicView && kind === 'savings' ? t.count : t.incoming)} {kind === 'waste' ? 'ชิ้น' : publicView ? 'ครั้ง' : 'บาท'}</span><span>{publicView ? `${bankNumber(kind === 'waste' ? t.points : t.count)} ${kind === 'waste' ? 'แต้ม' : 'ครั้งฝาก'}` : `คงเหลือ ${bankNumber(s.balance)} ${kind === 'savings' ? 'บาท' : 'แต้ม'}`}</span></div>
        {!publicView && <Button className={cn('mt-2 w-full')} variant="outline" size="sm" disabled={!s.student_id} onClick={() => s.student_id && onSelect(s.student_id)}>ดูรายละเอียด</Button>}
      </div>)}</div>
      <Pagination page={currentPage} count={tableRows.length} onChange={setPage} />
    </section>}
    {!publicView && <section className={cn('bank-card')}><div className={cn('flex justify-between gap-2 mb-3 items-center')}><h3 className={cn('font-bold')}>{allHistory || personal ? 'ประวัติรายการ' : 'รายการล่าสุด'}</h3>{!personal && <Button variant="outline" size="sm" onClick={() => setAllHistory(!allHistory)}>{allHistory ? 'ย่อรายการ' : 'ดูประวัติทั้งหมด'}</Button>}</div><ActivityList rows={rows} kind={kind} students={data.students} limit={allHistory || personal ? undefined : 5} /></section>}
    {personal && kind === 'waste' && <section className={cn('bank-card')}><h3 className={cn('font-bold mb-3')}>ประวัติแลกรางวัลทั้งหมด</h3>{data.claims.length === 0 ? <p className={cn('text-sm bank-muted')}>ยังไม่มีประวัติแลกรางวัลที่เข้าถึงได้</p> : [...data.claims].reverse().map(c => <div key={c.id} className={cn('flex flex-wrap justify-between gap-2 py-3 border-b border-border text-sm')}><div><p className={cn('font-semibold')}>{c.reward_name}</p><p className={cn('text-xs bank-muted')}>{bankDate(c.claimed_at)} · {bankNumber(c.points_used)} แต้ม</p></div><span className={cn('bank-badge self-center', c.status === 'rejected' ? 'bank-negative' : c.status === 'approved' ? 'bank-positive' : 'bank-muted')}>{statusLabels[c.status] ?? c.status}</span></div>)}</section>}
  </>;
}
