import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bankDashboardService, type BankKind } from '@/services/bank-dashboard.service';
import { bankNumber } from '@/lib/bank-dashboard';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import './bank.css';

export function BankWidget({ kind }: { kind: BankKind }) {
  const query = useQuery({ queryKey: ['bank-dashboard', kind, 'public', 'anonymous', 'all'], queryFn: () => bankDashboardService.load(kind, 'public'), staleTime: 30_000 });
  const totals = new Map<string, number>();
  query.data?.activities.forEach(t => { if (t.studentId) totals.set(t.studentId, (totals.get(t.studentId) ?? 0) + (kind === 'savings' ? t.count : t.points)); });
  const ranked = (query.data?.students ?? []).filter(s => s.student_id && totals.has(s.student_id)).sort((a, b) => (totals.get(b.student_id!) ?? 0) - (totals.get(a.student_id!) ?? 0));
  return <section className={cn('bank-surface bank-card')} data-bank={kind}>
    <h3 className={cn('font-bold border-b border-border pb-2')}>{kind === 'savings' ? 'ธนาคารพอเพียง' : 'ธนาคารขยะ'} · Top 5</h3>
    <p className={cn('text-xs bank-muted my-2')}>กิจกรรมสะสมทั้งหมด · {bankNumber(ranked.length)} คน</p>
    {query.isPending ? <p role="status" className={cn('text-sm bank-muted')}>กำลังโหลด…</p> : query.isError ? <Button variant="outline" size="sm" onClick={() => void query.refetch()}>ลองโหลดอีกครั้ง</Button> : ranked.length === 0 ? <p className={cn('text-sm bank-muted')}>ยังไม่มีกิจกรรม</p> : ranked.slice(0, 5).map((s, i) => <div key={s.student_id} className={cn('flex items-center gap-2 py-2 border-b border-border')}>
      <strong className={cn('text-xs bank-muted')}>{i + 1}</strong><PersonAvatar name={s.full_name ?? 'นักเรียน'} photoUrl={s.photo_url} size="xs" />
      <div className={cn('flex-1 min-w-0')}><p className={cn('text-xs font-semibold truncate')}>{s.full_name}</p><p className={cn('text-xs bank-muted')}>{s.class_name}</p></div>
      <span className={cn('text-xs font-bold tabular-nums')}>{bankNumber(totals.get(s.student_id!))} {kind === 'savings' ? 'ครั้ง' : 'แต้ม'}</span>
    </div>)}
    <Link className={cn('block mt-3 text-sm font-semibold')} to={`/${kind}-bank`}>ดูภาพรวมและสถิติ →</Link>
  </section>;
}
