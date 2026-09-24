import QRCode from 'react-qr-code';
import { cn } from '@/lib/utils';
import './bank.css';

export function BankStudentQR({ studentId }: { studentId: string }) {
  return <section className={cn('bank-surface bank-card flex flex-wrap gap-4 items-center')}>
    <div className={cn('bg-[hsl(var(--bank-paper))] p-2 rounded-lg')}><QRCode value={`kampai-student:${studentId}`} size={112} /></div>
    <div><h3 className={cn('font-bold')}>QR นักเรียน</h3><p className={cn('text-sm bank-muted')}>ให้ครูสแกนเพื่อบันทึกรายการ<br />QR ใบเดียวใช้ได้ทั้งธนาคารพอเพียงและธนาคารขยะ</p></div>
  </section>;
}
