import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Search, Scale, Users, Banknote, ChevronDown, Recycle, ClipboardList, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface StudentSummary {
  student_name: string;
  student_class: string;
  total_transactions: number;
  total_weight: number;
  total_amount: number;
}

const HOW_IT_WORKS = [
  {
    icon: <Recycle className="w-8 h-8 text-green-600" />,
    step: '1',
    title: 'คัดแยกขยะ',
    desc: 'นักเรียนคัดแยกขยะรีไซเคิลที่บ้านหรือในโรงเรียน เช่น กระดาษ พลาสติก แก้ว โลหะ',
  },
  {
    icon: <Scale className="w-8 h-8 text-green-600" />,
    step: '2',
    title: 'นำมาชั่งน้ำหนัก',
    desc: 'นำขยะที่คัดแยกแล้วมาชั่งน้ำหนักกับเจ้าหน้าที่ธนาคารขยะของโรงเรียน',
  },
  {
    icon: <Award className="w-8 h-8 text-green-600" />,
    step: '3',
    title: 'รับเงินสะสม',
    desc: 'ได้รับเงินตามน้ำหนักและประเภทขยะ สะสมไว้ในบัญชีธนาคารขยะส่วนตัว',
  },
];

const WasteBank = () => {
  const [searchName, setSearchName] = useState('');
  const [searchClass, setSearchClass] = useState('all');
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [allSummaries, setAllSummaries] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  // Overall stats (always from all data)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalWeight: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllSummaries();
  }, []);

  const fetchAllSummaries = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('waste_student_summary')
      .select('*')
      .order('total_amount', { ascending: false });

    if (!error && data) {
      setAllSummaries(data);
      setStats({
        totalStudents: data.length,
        totalWeight: data.reduce((acc: number, s: StudentSummary) => acc + Number(s.total_weight), 0),
        totalAmount: data.reduce((acc: number, s: StudentSummary) => acc + Number(s.total_amount), 0),
      });
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    setHasSearched(true);
    setIsLoading(true);

    let query = (supabase as any)
      .from('waste_student_summary')
      .select('*')
      .order('total_amount', { ascending: false });

    if (searchName.trim()) {
      query = query.ilike('student_name', `%${searchName.trim()}%`);
    }
    if (searchClass !== 'all') {
      query = query.eq('student_class', searchClass);
    }

    const { data, error } = await query;
    if (!error && data) {
      setResults(data);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayResults = hasSearched ? results : [];
  const resultTotalWeight = displayResults.reduce((a, s) => a + Number(s.total_weight), 0);
  const resultTotalAmount = displayResults.reduce((a, s) => a + Number(s.total_amount), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute bottom-0 right-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Recycle className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            ธนาคารขยะโรงเรียนบ้านคำไผ่
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto">
            ส่งเสริมการคัดแยกขยะและสร้างรายได้ให้นักเรียน ร่วมสร้างโรงเรียนสีเขียวไปด้วยกัน
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">นักเรียนที่ร่วมโครงการ</p>
                <p className="text-2xl font-bold text-green-700">{isLoading ? '...' : stats.totalStudents} <span className="text-sm font-normal">คน</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">น้ำหนักขยะรวม</p>
                <p className="text-2xl font-bold text-blue-700">{isLoading ? '...' : stats.totalWeight.toFixed(1)} <span className="text-sm font-normal">กก.</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ยอดเงินสะสมรวม</p>
                <p className="text-2xl font-bold text-amber-700">{isLoading ? '...' : stats.totalAmount.toFixed(2)} <span className="text-sm font-normal">บาท</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-5xl mx-auto w-full px-4 py-10">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-green-600" />
              ตรวจสอบยอดเงินสะสม
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="ค้นหาชื่อนักเรียน..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select value={searchClass} onValueChange={setSearchClass}>
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
              <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[100px]">
                <Search className="w-4 h-4" />
                ค้นหา
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">กำลังค้นหา...</div>
            ) : displayResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ไม่พบข้อมูลนักเรียน</p>
                <p className="text-sm mt-1">ลองค้นหาด้วยชื่อหรือชั้นอื่น</p>
              </div>
            ) : (
              <Card className="shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-50 border-b border-green-100">
                        <th className="text-left px-4 py-3 font-semibold text-green-800">ชื่อนักเรียน</th>
                        <th className="text-left px-4 py-3 font-semibold text-green-800">ชั้น</th>
                        <th className="text-right px-4 py-3 font-semibold text-green-800">จำนวนครั้ง</th>
                        <th className="text-right px-4 py-3 font-semibold text-green-800">น้ำหนักรวม (กก.)</th>
                        <th className="text-right px-4 py-3 font-semibold text-green-800">ยอดสะสม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((s, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-green-50/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{s.student_name}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                              {s.student_class}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{s.total_transactions}</td>
                          <td className="px-4 py-3 text-right">{Number(s.total_weight).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">
                            {Number(s.total_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {displayResults.length > 1 && (
                      <tfoot>
                        <tr className="bg-green-50 border-t-2 border-green-200 font-semibold">
                          <td className="px-4 py-3" colSpan={3}>รวม ({displayResults.length} คน)</td>
                          <td className="px-4 py-3 text-right">{resultTotalWeight.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-green-700">{resultTotalAmount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-green-50 border-t border-green-100 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">วิธีการเข้าร่วมโครงการ</h2>
          <p className="text-center text-muted-foreground mb-10">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WasteBank;
