import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Eye, CalendarDays, BarChart2 } from 'lucide-react';

interface DailyView { date: string; views: number }
interface PageCount { page: string; views: number }

const PAGE_LABELS: Record<string, string> = {
    '/': 'หน้าแรก',
    '/about': 'เกี่ยวกับเรา',
    '/news': 'ข่าวสาร',
    '/gallery': 'แกลเลอรี่',
    '/staff': 'บุคลากร',
    '/students': 'นักเรียน',
    '/curriculum': 'หลักสูตร',
    '/events': 'ปฏิทิน',
    '/contact': 'ติดต่อเรา',
    '/documents': 'เอกสาร',
    '/waste-bank': 'ธนาคารขยะ',
};

export const AnalyticsManagement = () => {
    const [daily, setDaily] = useState<DailyView[]>([]);
    const [topPages, setTopPages] = useState<PageCount[]>([]);
    const [todayCount, setTodayCount] = useState(0);
    const [weekCount, setWeekCount] = useState(0);
    const [monthCount, setMonthCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('page_views')
                .select('page_path, visited_at')
                .gte('visited_at', thirtyDaysAgo.toISOString())
                .order('visited_at', { ascending: true });

            if (error || !data) { setLoading(false); return; }

            // Daily views map
            const dailyMap: Record<string, number> = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                dailyMap[d.toISOString().slice(0, 10)] = 0;
            }

            // Page counts
            const pageMap: Record<string, number> = {};

            const todayStr = now.toISOString().slice(0, 10);
            const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

            let today = 0, week = 0, month = 0;

            for (const row of data) {
                const dateStr = row.visited_at.slice(0, 10);
                if (dateStr in dailyMap) dailyMap[dateStr]++;
                pageMap[row.page_path] = (pageMap[row.page_path] || 0) + 1;

                const visitedAt = new Date(row.visited_at);
                if (dateStr === todayStr) today++;
                if (visitedAt >= weekAgo) week++;
                if (visitedAt >= monthAgo) month++;
            }

            setDaily(Object.entries(dailyMap).map(([date, views]) => ({
                date: date.slice(5), // MM-DD
                views,
            })));

            setTopPages(
                Object.entries(pageMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([page, views]) => ({ page: PAGE_LABELS[page] || page, views }))
            );

            setTodayCount(today);
            setWeekCount(week);
            setMonthCount(month);
            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Analytics</h1>
                <p className="text-muted-foreground">สถิติการเข้าชมเว็บไซต์ (30 วันย้อนหลัง)</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'วันนี้', value: todayCount, icon: Eye, color: 'text-blue-500' },
                    { label: '7 วันที่ผ่านมา', value: weekCount, icon: CalendarDays, color: 'text-green-500' },
                    { label: '30 วันที่ผ่านมา', value: monthCount, icon: TrendingUp, color: 'text-purple-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <Icon className={`w-8 h-8 ${color}`} />
                            <div>
                                <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Daily line chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        จำนวนผู้เข้าชมรายวัน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={daily}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top pages bar chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        หน้าที่มีผู้เข้าชมมากที่สุด
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topPages.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topPages} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="page" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
