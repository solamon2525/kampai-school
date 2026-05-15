import { useState } from 'react';
import { Wallet, Search, ArrowDownToLine, ArrowUpFromLine, PiggyBank, History } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  savingsLookupService,
  type StudentSavingsLookup,
  type SavingsHistoryRow,
} from '@/services/savings.service';

const HOW_IT_WORKS = [
  {
    icon: <PiggyBank className="w-8 h-8 text-amber-600" />,
    step: '1',
    title: 'ฝากเงินกับครู',
    desc: 'นำเงินมาฝากที่โรงเรียน — จำนวนใดก็ได้ ครูจะบันทึกธุรกรรมในระบบ',
  },
  {
    icon: <Wallet className="w-8 h-8 text-amber-600" />,
    step: '2',
    title: 'ตรวจสอบยอดได้',
    desc: 'ดูยอดเงินสะสมและประวัติฝาก/ถอน ด้วยรหัสนักเรียน',
  },
  {
    icon: <ArrowUpFromLine className="w-8 h-8 text-amber-600" />,
    step: '3',
    title: 'ถอนเมื่อจำเป็น',
    desc: 'ขอถอนเงินผ่านครู — เพื่อความปลอดภัยและสอนวินัยการออม',
  },
];

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0.00 ฿';
  return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

export default function SavingsBank() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<StudentSavingsLookup | null>(null);
  const [history, setHistory] = useState<SavingsHistoryRow[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = code.trim();
    if (!c) return;
    setSearching(true);
    setStudent(null);
    setHistory([]);

    const { data, error } = await savingsLookupService.lookupStudent(c);
    if (error) {
      toast({ title: 'ค้นหาไม่สำเร็จ', description: error.message, variant: 'destructive' });
      setSearching(false);
      return;
    }
    const row = (data as StudentSavingsLookup[] | null)?.[0];
    if (!row) {
      toast({ title: 'ไม่พบนักเรียน', description: 'กรุณาตรวจสอบรหัสนักเรียน', variant: 'destructive' });
      setSearching(false);
      return;
    }
    setStudent(row);

    const { data: histData } = await savingsLookupService.getStudentHistory(c, 50);
    setHistory(((histData as SavingsHistoryRow[] | null) ?? []));
    setSearching(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="ธนาคารพอเพียง — โรงเรียนคำไผ่"
        description="ระบบฝาก/ถอนเงินสำหรับนักเรียน สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง"
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-amber-50 via-background to-emerald-50/40 dark:from-amber-950/20 dark:to-emerald-950/10 py-12 md:py-16">
          <div className="container max-w-5xl mx-auto px-4 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <PiggyBank className="w-3.5 h-3.5" /> เศรษฐกิจพอเพียง
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">ธนาคารพอเพียง</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              ระบบฝาก/ถอนเงินสำหรับนักเรียน สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
            </p>
          </div>
        </section>

        {/* Lookup */}
        <section className="container max-w-3xl mx-auto px-4 -mt-8 md:-mt-12 mb-12">
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Search className="w-5 h-5" /> ตรวจสอบยอดเงินสะสม
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  กรอกรหัสนักเรียนเพื่อดูยอดเงินและประวัติธุรกรรม
                </p>
              </div>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น 12345"
                  className="flex-1"
                />
                <Button type="submit" disabled={searching || !code.trim()}>
                  {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
                </Button>
              </form>

              {student && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center gap-3">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-amber-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-700">
                        <Wallet className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.class_name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-lg p-4 text-center">
                    <div className="text-xs text-muted-foreground">ยอดเงินคงเหลือ</div>
                    <div className="text-3xl md:text-4xl font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-1">
                      {fmtBaht(Number(student.current_balance ?? 0))}
                    </div>
                  </div>

                  {history.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                        <History className="w-4 h-4" /> ประวัติธุรกรรม
                      </h3>
                      <div className="overflow-x-auto rounded border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                              <th className="text-left p-2">วันที่</th>
                              <th className="text-center p-2">ประเภท</th>
                              <th className="text-right p-2">จำนวน</th>
                              <th className="text-right p-2">คงเหลือ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((h) => (
                              <tr key={h.txn_id} className="border-t border-border">
                                <td className="p-2 text-muted-foreground whitespace-nowrap">
                                  {h.transaction_date}
                                </td>
                                <td className="p-2 text-center">
                                  {h.transaction_type === 'deposit' ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1">
                                      <ArrowDownToLine className="w-3 h-3" /> ฝาก
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 gap-1">
                                      <ArrowUpFromLine className="w-3 h-3" /> ถอน
                                    </Badge>
                                  )}
                                </td>
                                <td
                                  className={`p-2 text-right tabular-nums font-medium ${
                                    h.transaction_type === 'deposit'
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-orange-700 dark:text-orange-400'
                                  }`}
                                >
                                  {h.transaction_type === 'deposit' ? '+' : '−'}
                                  {fmtBaht(Number(h.amount))}
                                </td>
                                <td className="p-2 text-right tabular-nums text-muted-foreground">
                                  {fmtBaht(Number(h.balance_after))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* How it works */}
        <section className="container max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold text-center mb-8">ขั้นตอนการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((s) => (
              <Card key={s.step}>
                <CardContent className="p-6 space-y-3 text-center">
                  <div className="flex justify-center">{s.icon}</div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">ขั้นที่ {s.step}</div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
