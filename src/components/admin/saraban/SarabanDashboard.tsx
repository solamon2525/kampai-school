import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { MailOpen, SendHorizontal, Stamp, CalendarCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Stats {
    incoming_total: number;
    incoming_pending: number;
    incoming_done: number;
    outgoing_total: number;
    orders_total: number;
    meetings_total: number;
}

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const SarabanDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({ incoming_total: 0, incoming_pending: 0, incoming_done: 0, outgoing_total: 0, orders_total: 0, meetings_total: 0 });
    const [monthlyData, setMonthlyData] = useState<{ month: string; รับ: number; ส่ง: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const year = new Date().getFullYear();
            const startOfYear = `${year}-01-01`;

            const [inRes, outRes, ordRes, meetRes] = await Promise.all([
                supabase.from('incoming_letters' as any).select('status, received_date').gte('received_date', startOfYear),
                supabase.from('outgoing_letters' as any).select('sent_date').gte('sent_date', startOfYear),
                supabase.from('orders_announcements' as any).select('id'),
                supabase.from('meetings' as any).select('id'),
            ]);

            const incoming = (inRes.data as any[]) || [];
            const outgoing = (outRes.data as any[]) || [];

            setStats({
                incoming_total: incoming.length,
                incoming_pending: incoming.filter(r => r.status === 'รอดำเนินการ').length,
                incoming_done: incoming.filter(r => r.status === 'เสร็จแล้ว').length,
                outgoing_total: outgoing.length,
                orders_total: (ordRes.data as any[])?.length || 0,
                meetings_total: (meetRes.data as any[])?.length || 0,
            });

            // Monthly chart
            const monthMap: Record<number, { รับ: number; ส่ง: number }> = {};
            for (let m = 0; m < 12; m++) monthMap[m] = { รับ: 0, ส่ง: 0 };
            incoming.forEach(r => {
                const m = new Date(r.received_date).getMonth();
                monthMap[m].รับ++;
            });
            outgoing.forEach(r => {
                const m = new Date(r.sent_date).getMonth();
                monthMap[m].ส่ง++;
            });
            setMonthlyData(Object.entries(monthMap).map(([m, v]) => ({ month: MONTHS_TH[+m], ...v })));

            setLoading(false);
        };
        fetchAll();
    }, []);

    const summaryCards = [
        { label: 'หนังสือรับทั้งหมด', value: stats.incoming_total, icon: MailOpen, color: 'text-blue-500', tab: 'incoming-letters' },
        { label: 'รอดำเนินการ', value: stats.incoming_pending, icon: Clock, color: 'text-orange-500', tab: 'incoming-letters' },
        { label: 'เสร็จแล้ว', value: stats.incoming_done, icon: CheckCircle, color: 'text-green-500', tab: 'incoming-letters' },
        { label: 'หนังสือส่ง', value: stats.outgoing_total, icon: SendHorizontal, color: 'text-emerald-500', tab: 'outgoing-letters' },
        { label: 'คำสั่ง/ประกาศ', value: stats.orders_total, icon: Stamp, color: 'text-red-500', tab: 'orders' },
        { label: 'การประชุม', value: stats.meetings_total, icon: CalendarCheck, color: 'text-teal-500', tab: 'meetings' },
    ];

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">งานสารบรรณ</h1>
                <p className="text-muted-foreground">ภาพรวมระบบงานสารบรรณโรงเรียน ปี {new Date().getFullYear() + 543}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {summaryCards.map(c => (
                    <Card
                        key={c.label}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/admin/dashboard/${c.tab}`)}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <c.icon className={`w-8 h-8 flex-shrink-0 ${c.color}`} />
                            <div>
                                <p className="text-2xl font-bold">{loading ? '-' : c.value}</p>
                                <p className="text-xs text-muted-foreground leading-tight">{c.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ปริมาณหนังสือรายเดือน (ปี {new Date().getFullYear() + 543})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="รับ" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="ส่ง" fill="hsl(var(--primary) / 0.5)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'รับหนังสือใหม่', tab: 'incoming-letters', icon: MailOpen, desc: 'ลงทะเบียนหนังสือรับ' },
                    { label: 'ส่งหนังสือใหม่', tab: 'outgoing-letters', icon: SendHorizontal, desc: 'ออกหนังสือส่ง' },
                    { label: 'ออกคำสั่ง/ประกาศ', tab: 'orders', icon: Stamp, desc: 'คำสั่ง ประกาศ บันทึก' },
                    { label: 'นัดประชุม', tab: 'meetings', icon: CalendarCheck, desc: 'บันทึกการประชุม' },
                ].map(item => (
                    <button
                        key={item.tab}
                        onClick={() => navigate(`/admin/dashboard/${item.tab}`)}
                        className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-secondary transition-colors text-center"
                    >
                        <item.icon className="w-8 h-8 text-primary" />
                        <span className="font-medium text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
