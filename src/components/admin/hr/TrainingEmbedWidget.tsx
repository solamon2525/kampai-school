import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { trainingPublicService, type TrainingPublicAggregate } from '@/services/training.service';

const fmtNum = (n: number) => Number(n).toLocaleString('th-TH');

/**
 * TrainingEmbedWidget — การ์ดสรุป "พัฒนาบุคลากร" สำหรับฝังในหน้า public
 * (ใช้ใน /staff หลัง hero) → คลิก "ดูทั้งหมด" navigate ไป /training-showcase
 *
 * Data: trainingPublicService.getAggregate() — public-safe (ไม่ระบุตัวบุคคล)
 */
export function TrainingEmbedWidget() {
    const [aggregate, setAggregate] = useState<TrainingPublicAggregate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data } = await trainingPublicService.getAggregate();
            if (data) setAggregate(data);
            setLoading(false);
        })();
    }, []);

    // Sparkline: 5 ปีล่าสุด (เก่า → ใหม่)
    const sparkData = useMemo(() => {
        if (!aggregate?.by_year) return [];
        return Object.entries(aggregate.by_year)
            .map(([year, count]) => ({ year, count: Number(count) }))
            .sort((a, b) => a.year.localeCompare(b.year))
            .slice(-5);
    }, [aggregate]);

    if (loading || !aggregate || aggregate.total_count === 0) {
        return null; // ไม่แสดงถ้าไม่มีข้อมูล (ป้องกัน UI ว่าง)
    }

    return (
        <Link
            to="/training-showcase"
            className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 text-white p-5 md:p-6 shadow-xl ring-1 ring-violet-500/30 hover:ring-violet-400/60 transition-all hover:-translate-y-0.5"
        >
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '18px 18px',
                }}
            />
            <div className="relative">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300 mb-1.5">
                    <Sparkles className="w-3 h-3" /> Faculty Development
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-violet-300" />
                        พัฒนาบุคลากร
                    </h2>
                    <div className="hidden sm:flex items-center gap-1 text-xs text-violet-200 group-hover:text-white group-hover:gap-2 transition-all">
                        ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* KPI inline row */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <KpiInline label="ชั่วโมงรวม" value={fmtNum(aggregate.total_hours)} suffix="ชม." />
                    <KpiInline label="รายการ" value={fmtNum(aggregate.total_count)} suffix="" />
                    <KpiInline label="ครู" value={fmtNum(aggregate.total_staff)} suffix="คน" />
                </div>

                {/* Sparkline */}
                {sparkData.length >= 2 && (
                    <div className="mt-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/80 mb-1">
                            แนวโน้ม {sparkData.length} ปี
                        </div>
                        <ResponsiveContainer width="100%" height={36}>
                            <BarChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                                    {sparkData.map((_, i) => (
                                        <Cell key={i} fill={i === sparkData.length - 1 ? '#fbbf24' : '#a78bfa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between mt-1 text-[9px] text-violet-200/70 font-mono">
                            {sparkData.map((d) => (
                                <span key={d.year}>{d.year.slice(-2)}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="sm:hidden flex items-center justify-center gap-1 text-xs text-violet-200 mt-4 group-hover:text-white transition-colors">
                    ดูเกียรติบัตรทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </Link>
    );
}

function KpiInline({ label, value, suffix }: { label: string; value: string; suffix: string }) {
    return (
        <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-center">
            <div className="text-xl md:text-2xl font-extrabold tabular-nums leading-none">{value}</div>
            <div className="text-[9px] text-violet-200/80 mt-1 font-medium">
                {suffix && <span className="text-violet-300/90 mr-0.5">{suffix}</span>}
                {label}
            </div>
        </div>
    );
}
