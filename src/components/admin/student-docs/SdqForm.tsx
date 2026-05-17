import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Save } from 'lucide-react';
import {
    SDQ_QUESTIONS, computeSdqScores, interpretSdqTotal, interpretDomain,
    DOMAIN_LABEL,
} from '@/lib/sdqScoring';
import { sdqService, type SdqResponse } from '@/services/sdq.service';
import { currentAcademicYearBE } from '@/services/sar.service';
import { cn } from '@/lib/utils';

const LIKERT_OPTIONS = [
    { value: 0, label: 'ไม่จริง', short: '0' },
    { value: 1, label: 'ค่อนข้างจริง', short: '1' },
    { value: 2, label: 'จริง', short: '2' },
];

const DOMAIN_BADGE: Record<'ปกติ' | 'เสี่ยง' | 'มีปัญหา', 'default' | 'secondary' | 'destructive'> = {
    'ปกติ': 'default', 'เสี่ยง': 'secondary', 'มีปัญหา': 'destructive',
};

interface SdqTabProps { studentId: string }

export const SdqTab = ({ studentId }: SdqTabProps) => {
    const [year, setYear] = useState(currentAcademicYearBE());
    const [responses, setResponses] = useState<Record<number, number>>({});
    const [assessor, setAssessor] = useState('');
    const [history, setHistory] = useState<SdqResponse[]>([]);
    const [current, setCurrent] = useState<SdqResponse | null>(null);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const reload = async () => {
        const [hist, cur] = await Promise.all([
            sdqService.listByStudent(studentId),
            sdqService.getCurrent(studentId, year),
        ]);
        if (hist.data) setHistory(hist.data);
        if (cur.data) {
            setCurrent(cur.data);
            const map: Record<number, number> = {};
            Object.entries(cur.data.scores).forEach(([k, v]) => {
                const n = Number(k.replace(/[^0-9]/g, ''));
                if (n) map[n] = Number(v);
            });
            setResponses(map);
            setAssessor(cur.data.assessor_name ?? '');
        } else {
            setCurrent(null);
            setResponses({});
        }
    };

    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [studentId, year]);

    const { domain, totalDifficulty } = useMemo(
        () => computeSdqScores(responses),
        [responses],
    );
    const interpretation = interpretSdqTotal(totalDifficulty);

    const completed = Object.keys(responses).length;
    const progress = Math.round((completed / 25) * 100);

    const handleSave = async () => {
        if (completed < 25) {
            toast({ title: `กรอกครบ 25 ข้อก่อนบันทึก (เหลือ ${25 - completed} ข้อ)`, variant: 'destructive' });
            return;
        }
        setSaving(true);
        const scoresKey: Record<string, number> = {};
        for (const [k, v] of Object.entries(responses)) scoresKey[`q${k}`] = v;
        const res = await sdqService.upsert({
            student_id: studentId,
            academic_year: year,
            scores: scoresKey,
            total_score: totalDifficulty,
            interpretation,
            assessor_name: assessor || null,
        });
        setSaving(false);
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'บันทึก SDQ เรียบร้อย' });
        reload();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-primary" /> แบบประเมิน SDQ
                </h3>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">ปี</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CardTitle className="text-sm">คะแนนรวม (Total Difficulty)</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{totalDifficulty}</span>
                            <span className="text-xs text-muted-foreground">/ 40</span>
                            <Badge variant={
                                interpretation === 'ปกติ' ? 'default'
                                : interpretation === 'เสี่ยงต่อปัญหาพฤติกรรม' ? 'secondary'
                                : 'destructive'
                            }>
                                {interpretation}
                            </Badge>
                        </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">กรอกแล้ว {completed}/25 ข้อ</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['emotional', 'conduct', 'hyperact', 'peer', 'prosocial'] as const).map((d) => {
                        const interp = interpretDomain(d, domain[d]);
                        return (
                            <div key={d} className="border border-border rounded p-2 text-center">
                                <p className="text-[10px] text-muted-foreground">{DOMAIN_LABEL[d]}</p>
                                <p className="text-lg font-bold">{domain[d]}</p>
                                <Badge variant={DOMAIN_BADGE[interp]} className="text-[9px]">{interp}</Badge>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* 25 questions */}
            <Card>
                <CardContent className="p-3 space-y-1">
                    {SDQ_QUESTIONS.map((q) => (
                        <div key={q.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 py-1.5 border-b border-border last:border-0">
                            <span className="text-xs text-muted-foreground font-mono">{q.id}.</span>
                            <span className="text-sm">{q.text}</span>
                            <div className="flex gap-1">
                                {LIKERT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setResponses({ ...responses, [q.id]: opt.value })}
                                        className={cn(
                                            'w-7 h-7 rounded text-xs font-semibold border transition',
                                            responses[q.id] === opt.value
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background text-muted-foreground border-border hover:border-primary',
                                        )}
                                        title={opt.label}
                                    >
                                        {opt.short}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs">ผู้ประเมิน</Label>
                <Input value={assessor} onChange={(e) => setAssessor(e.target.value)} className="max-w-xs h-8 text-sm" placeholder="ชื่อครู" />
                <Button onClick={handleSave} disabled={saving || completed < 25} className="ml-auto">
                    <Save className="w-4 h-4 mr-1" />
                    {current ? 'อัปเดต' : 'บันทึก'} SDQ
                </Button>
            </div>

            {/* History */}
            {history.length > 0 ? (
                <Card>
                    <CardHeader><CardTitle className="text-sm">ประวัติ SDQ ทั้งหมด</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-1.5">
                            {history.map((h) => (
                                <li key={h.id} className="text-sm flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">ปี {h.academic_year}</Badge>
                                    <span className="font-semibold">{h.total_score ?? '-'}/40</span>
                                    <Badge variant={
                                        h.interpretation === 'ปกติ' ? 'default'
                                        : h.interpretation?.includes('เสี่ยง') ? 'secondary'
                                        : 'destructive'
                                    } className="text-[10px]">
                                        {h.interpretation ?? '–'}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
};
