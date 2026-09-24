import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, isValid, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { savingsStatementService } from '@/services/savings.service';
import { buildSavingsStatement, safeStatementCell } from '@/lib/savings-statement';
import { downloadCSV } from '@/lib/export';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const dateInput = z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))), 'วันที่ไม่ถูกต้อง');
const schema = z.object({ start: dateInput, end: dateInput }).refine(
  value => !value.start || !value.end || value.start <= value.end,
  { message: 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น', path: ['end'] },
);
const money = (value: number) => value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: string | null, time = false) => {
  if (!value || !isValid(parseISO(value))) return '—';
  return format(parseISO(value), time ? 'd MMM yyyy HH:mm' : 'd MMM yyyy', { locale: th });
};
type Props = { studentId: string; open: boolean; onOpenChange: (open: boolean) => void };

export function StudentStatementDialog({ studentId, open, onOpenChange }: Props) {
  const [range, setRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(0);
  const [printError, setPrintError] = useState('');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { start: '', end: '' } });
  const query = useQuery({ queryKey: ['savings-statement', studentId],
    queryFn: ({ signal }) => savingsStatementService.get(studentId, signal), enabled: open,
    staleTime: 0, gcTime: 0, retry: 1, refetchOnMount: 'always' });
  const statement = useMemo(() => query.data ? buildSavingsStatement(query.data.rows, range.start, range.end) : null, [query.data, range]);
  const ready = !!statement && !!query.data && !query.isFetching && !query.isError;
  const student = query.data?.student;
  const pageCount = Math.max(1, Math.ceil((statement?.rows.length ?? 0) / 50));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = statement?.rows.slice(currentPage * 50, (currentPage + 1) * 50) ?? [];
  const period = `${range.start ? date(range.start) : 'เริ่มบัญชี'} ถึง ${range.end ? date(range.end) : 'ล่าสุด'}`;
  const headers = ['วันที่ทำรายการ', 'เวลาบันทึก', 'ฝาก (บาท)', 'ถอน (บาท)', 'คงเหลือตามบัญชี (บาท)', 'ผู้บันทึก', 'หมายเหตุ', 'ปีการศึกษา', 'ภาคเรียน'];
  const reportRows = () => (statement?.rows ?? []).map(row => [date(row.transaction_date), date(row.created_at, true),
    row.transaction_type === 'deposit' ? row.amount : 0, row.transaction_type === 'withdraw' ? row.amount : 0,
    row.ledgerBalance, row.recorded_by ?? 'ไม่ระบุ', row.notes ?? '', row.academic_year ?? '', row.semester ?? '']);
  const summaryRows = (): (string | number)[][] => student && statement ? [
    ['นักเรียน', student.full_name ?? '', 'รหัส', student.student_code ?? '', 'ชั้น', student.class_name ?? ''],
    ['ช่วงข้อมูล', period], ['ออกรายงาน', date(new Date().toISOString(), true)],
    ['ยอดยกมา', statement.opening], ['ฝากรวม', statement.deposits, 'ครั้ง', statement.depositCount],
    ['ถอนรวม', statement.withdrawals, 'ครั้ง', statement.withdrawCount],
    ['ยอดปลายช่วง', statement.closing], ['ยอดปัจจุบันทั้งบัญชี', statement.current],
  ] : [];
  const exportCSV = () => {
    if (!ready) return;
    downloadCSV(`savings-statement-${studentId}.csv`, ['รายงานฝาก–ถอนรายนักเรียน'],
      [...summaryRows(), [], headers, ...reportRows()].map(row => row.map(safeStatementCell)));
  };
  const print = () => {
    if (!ready) return;
    const popup = window.open('', '_blank', 'width=1100,height=800');
    if (!popup) { setPrintError('เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาตป๊อปอัปแล้วลองใหม่'); return; }
    setPrintError('');
    // Use textContent, not interpolated HTML, for all student/recorder/notes data.
    const doc = popup.document;
    doc.title = 'รายงานฝาก–ถอนรายนักเรียน';
    doc.documentElement.lang = 'th';
    const style = doc.createElement('style');
    style.textContent = ':root{--ink:CanvasText;--paper:Canvas;--line:GrayText}body{font-family:Sarabun,sans-serif;color:var(--ink);background:var(--paper);padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid var(--line);padding:6px;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}h1{font-size:20px}button{padding:12px;margin-bottom:16px}@page{size:A4 landscape;margin:12mm}@media print{button{display:none}body{padding:0}}';
    doc.head.append(style);
    const title = doc.createElement('h1'); title.textContent = 'รายงานฝาก–ถอนรายนักเรียน · ธนาคารพอเพียง'; doc.body.append(title);
    for (const row of summaryRows()) { const p = doc.createElement('p'); p.textContent = row.join('  '); doc.body.append(p); }
    const note = doc.createElement('p'); note.textContent = 'ยอดคงเหลือคำนวณจากประวัติที่มีอยู่ตามวันที่ทำรายการ ไม่ใช่ยอด snapshot เดิม'; doc.body.append(note);
    const button = doc.createElement('button'); button.textContent = 'พิมพ์ / บันทึก PDF'; button.onclick = () => popup.print(); doc.body.append(button);
    const table = doc.createElement('table');
    const head = table.createTHead().insertRow();
    for (const text of headers) { const cell = doc.createElement('th'); cell.textContent = text; head.append(cell); }
    const body = table.createTBody();
    for (const row of reportRows()) { const tr = body.insertRow(); for (const text of row) tr.insertCell().textContent = String(text); }
    doc.body.append(table);
    popup.focus();
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={cn('flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-6xl flex-col overflow-hidden p-3 sm:p-6')}>
      <DialogHeader className={cn('pr-7 text-left')}>
        <DialogTitle>รายละเอียดฝาก–ถอนรายนักเรียน</DialogTitle>
        <DialogDescription>ประวัติสะสมข้ามปีการศึกษา · อ่านอย่างเดียว</DialogDescription>
      </DialogHeader>
      <div className={cn('min-h-0 overflow-y-auto space-y-4 break-words')}>
        {query.isFetching && <p role="status">กำลังโหลดและตรวจสอบยอด…</p>}
        {query.isError && <div role="alert" className={cn('rounded-lg border border-destructive p-3')}>
          <p>โหลดรายงานไม่สำเร็จ: {query.error instanceof Error ? query.error.message : 'กรุณาตรวจสอบสิทธิ์หรือเข้าสู่ระบบใหม่'}</p>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>ลองใหม่</Button>
        </div>}
        {ready && student && statement && <>
          <div className={cn('flex items-center gap-3 rounded-lg border border-border p-3')}>
            <PersonAvatar name={student.full_name ?? 'ไม่ระบุ'} photoUrl={student.photo_url} size="md" />
            <div className={cn('min-w-0')}><p className={cn('font-semibold')}>{student.full_name}</p>
              <p>รหัส {student.student_code ?? '—'} · ชั้น {student.class_name ?? '—'}</p>
              <p className={cn('font-semibold')}>ยอดปัจจุบันทั้งบัญชี {money(statement.current)} บาท</p></div>
          </div>
        </>}
        <Form {...form}><form onSubmit={form.handleSubmit(value => { setRange({ start: value.start ?? '', end: value.end ?? '' }); setPage(0); })} className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end')}>
          {(['start', 'end'] as const).map(name => <FormField key={name} control={form.control} name={name} render={({ field }) =>
            <FormItem className={cn('min-w-0')}><FormLabel>{name === 'start' ? 'วันที่เริ่มต้น' : 'วันที่สิ้นสุด'}</FormLabel><FormControl>
              <Input type="date" {...field} onInput={event => field.onChange(event.currentTarget.value)} className={cn('min-w-0 w-full')} /></FormControl><FormMessage /></FormItem>} />)}
          <Button type="submit" disabled={!ready}>แสดงข้อมูล</Button>
          <Button type="button" variant="outline" disabled={!ready} onClick={() => { form.reset({ start: '', end: '' }); setRange({ start: '', end: '' }); setPage(0); }}>ประวัติทั้งหมด</Button>
        </form></Form>
        <div className={cn('flex flex-wrap gap-2')}>
          <Button variant="outline" disabled={!ready} onClick={print}>พิมพ์ / PDF</Button>
          <Button variant="outline" disabled={!ready} onClick={exportCSV}>ดาวน์โหลด CSV</Button>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>โหลดข้อมูลใหม่</Button>
        </div>
        {printError && <p role="alert">{printError}</p>}
        {ready && statement && <>
          <p className={cn('text-sm text-muted-foreground')}>ช่วงที่แสดง: {period} · ยอดคำนวณตามวันที่ทำรายการจากประวัติที่มีอยู่</p>
          <div className={cn('grid grid-cols-2 gap-2 lg:grid-cols-4')}>
            {[['ยอดยกมา', statement.opening], [`ฝาก ${statement.depositCount} ครั้ง`, statement.deposits], [`ถอน ${statement.withdrawCount} ครั้ง`, statement.withdrawals], ['ยอดปลายช่วง', statement.closing]].map(([label, value]) =>
              <div key={label} className={cn('rounded-lg border border-border p-3')}><p className={cn('text-sm text-muted-foreground')}>{label}</p><p className={cn('font-semibold tabular-nums')}>{money(Number(value))} บาท</p></div>)}
          </div>
          {statement.rows.length === 0 ? <p className={cn('py-6 text-center')}>ไม่มีรายการในช่วงวันที่นี้</p> : <>
            <div className={cn('hidden lg:block')}><table className={cn('w-full table-fixed text-sm')}>
              <thead><tr>{['วันที่ / เวลาบันทึก', 'ฝาก', 'ถอน', 'คงเหลือ', 'ผู้บันทึก', 'หมายเหตุ / ปี / ภาคเรียน'].map(label => <th key={label} className={cn('border-b border-border p-2 text-left')}>{label}</th>)}</tr></thead>
              <tbody>{visible.map(row => <tr key={row.id}>
                <td className={cn('border-b border-border p-2')}>{date(row.transaction_date)}<p className={cn('text-xs text-muted-foreground')}>บันทึก {date(row.created_at, true)}</p></td>
                <td className={cn('border-b border-border p-2 tabular-nums')}>{row.transaction_type === 'deposit' ? money(row.amount) : '—'}</td>
                <td className={cn('border-b border-border p-2 tabular-nums')}>{row.transaction_type === 'withdraw' ? money(row.amount) : '—'}</td>
                <td className={cn('border-b border-border p-2 tabular-nums')}>{money(row.ledgerBalance)}</td>
                <td className={cn('border-b border-border p-2')}><PersonAvatar name={row.recorded_by ?? 'ไม่ระบุ'} photoUrl={row.recorder_staff?.photo_url ?? row.recorder_admin?.photo_url} size="xs" />{row.recorded_by ?? 'ไม่ระบุ'}</td>
                <td className={cn('border-b border-border p-2')}>{row.notes || '—'}<p className={cn('text-xs text-muted-foreground')}>ปี {row.academic_year ?? '—'} / ภาค {row.semester ?? '—'}</p></td>
              </tr>)}</tbody></table></div>
            <div className={cn('space-y-3 lg:hidden')}>{visible.map(row => <article key={row.id} className={cn('rounded-lg border border-border p-3 space-y-2')}>
              <p>{date(row.transaction_date)} · <strong>{row.transaction_type === 'deposit' ? 'ฝาก' : 'ถอน'} {money(row.amount)} บาท</strong></p>
              <p>คงเหลือตามบัญชี {money(row.ledgerBalance)} บาท</p>
              <div className={cn('flex items-center gap-2')}><PersonAvatar name={row.recorded_by ?? 'ไม่ระบุ'} photoUrl={row.recorder_staff?.photo_url ?? row.recorder_admin?.photo_url} size="xs" /><span>{row.recorded_by ?? 'ไม่ระบุ'}</span></div>
              <p className={cn('text-sm text-muted-foreground')}>บันทึก {date(row.created_at, true)} · ปี {row.academic_year ?? '—'} / ภาค {row.semester ?? '—'}</p>
              <p>หมายเหตุ: {row.notes || '—'}</p>
            </article>)}</div>
          </>}
          <nav aria-label="หน้าประวัติฝากถอน" className={cn('flex flex-wrap items-center justify-between gap-2')}>
            <Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</Button>
            <span className={cn('text-sm')} role="status">หน้า {currentPage + 1}/{pageCount} · {statement.rows.length} รายการ</span>
            <Button variant="outline" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>ถัดไป</Button>
          </nav>
        </>}
      </div>
      <DialogClose asChild><Button variant="outline">ปิดรายละเอียด</Button></DialogClose>
    </DialogContent>
  </Dialog>;
}
