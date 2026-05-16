import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props {
    byYear: Record<string, number> | null | undefined;
    byType: Record<string, number> | null | undefined;
}

const TYPE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b']; // violet, blue, emerald, amber

const TooltipContent = ({ active, payload, label, suffix = '' }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-card border rounded-md shadow-md px-3 py-2 text-xs">
            <div className="font-semibold text-foreground">{label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="text-muted-foreground">
                    {p.name}: <span className="font-bold text-violet-600">{Number(p.value).toLocaleString('th-TH')}{suffix}</span>
                </div>
            ))}
        </div>
    );
};

export function TrainingCharts({ byYear, byType }: Props) {
    // Bar chart data: sort ascending by year (เก่า → ใหม่)
    const yearData = useMemo(() => {
        if (!byYear) return [];
        return Object.entries(byYear)
            .map(([year, count]) => ({ year, count: Number(count) }))
            .sort((a, b) => a.year.localeCompare(b.year));
    }, [byYear]);

    // Donut data
    const typeData = useMemo(() => {
        if (!byType) return [];
        return Object.entries(byType)
            .map(([type, count]) => ({ name: type, value: Number(count) }))
            .sort((a, b) => b.value - a.value);
    }, [byType]);

    if (yearData.length === 0 && typeData.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-violet-200/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-violet-600" />
                        รายการอบรมแต่ละปี
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={yearData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="year"
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(v) => `${v}`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                                width={36}
                            />
                            <Tooltip content={<TooltipContent suffix=" รายการ" />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                            <Bar dataKey="count" name="รายการ" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-violet-200/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-violet-600" />
                        สัดส่วนประเภทการอบรม
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={typeData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={80}
                                paddingAngle={2}
                                stroke="hsl(var(--card))"
                                strokeWidth={2}
                            >
                                {typeData.map((_, i) => (
                                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<TooltipContent suffix=" รายการ" />} />
                            <Legend
                                verticalAlign="bottom"
                                height={32}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: 8 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
