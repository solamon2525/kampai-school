import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Upload, Paperclip, Trash2, ChevronDown } from 'lucide-react';
import {
    sarService, currentAcademicYearBE,
    type SarStandard, type SarIndicator, type SarAssessment, type SarEvidenceFile,
} from '@/services/sar.service';
import { KpiRibbon, type KpiTile } from '@/components/admin/docs-hub/KpiRibbon';

const LEVEL_LABEL: Record<number, string> = {
    1: 'กำลังพัฒนา', 2: 'ปานกลาง', 3: 'ดี', 4: 'ดีเลิศ', 5: 'ยอดเยี่ยม',
};

const LEVEL_BADGE: Record<number, 'destructive' | 'secondary' | 'default'> = {
    1: 'destructive', 2: 'secondary', 3: 'secondary', 4: 'default', 5: 'default',
};

const SarManagement = () => {
    const [year, setYear] = useState(currentAcademicYearBE());
    const [standards, setStandards] = useState<SarStandard[]>([]);
    const [indicators, setIndicators] = useState<SarIndicator[]>([]);
    const [assessments, setAssessments] = useState<SarAssessment[]>([]);
    const [evidence, setEvidence] = useState<Record<string, SarEvidenceFile[]>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const reload = async () => {
        setLoading(true);
        const [s, i, a] = await Promise.all([
            sarService.listStandards(),
            sarService.listIndicators(),
            sarService.listAssessments(year),
        ]);
        if (s.data) setStandards(s.data);
        if (i.data) setIndicators(i.data);
        if (a.data) {
            setAssessments(a.data);
            // preload evidence
            const evMap: Record<string, SarEvidenceFile[]> = {};
            await Promise.all(
                a.data.map(async (asmt) => {
                    const ev = await sarService.listEvidence(asmt.id);
                    if (ev.data) evMap[asmt.id] = ev.data;
                }),
            );
            setEvidence(evMap);
        }
        setLoading(false);
    };

    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [year]);

    const assessmentByIndicator = useMemo(() => {
        const m = new Map<string, SarAssessment>();
        assessments.forEach((a) => m.set(a.indicator_id, a));
        return m;
    }, [assessments]);

    const indicatorsByStd = useMemo(() => {
        const m = new Map<string, SarIndicator[]>();
        indicators.forEach((ind) => {
            const list = m.get(ind.standard_id) ?? [];
            list.push(ind);
            m.set(ind.standard_id, list);
        });
        return m;
    }, [indicators]);

    const tiles: KpiTile[] = useMemo(() => {
        const levels = assessments.map((a) => a.level ?? 0).filter((l) => l > 0);
        const avg = levels.length ? (levels.reduce((s, n) => s + n, 0) / levels.length).toFixed(2) : '–';
        return [
            { key: 'standards', label: 'มาตรฐาน', value: standards.length, icon: ClipboardCheck, tone: 'primary' },
            { key: 'indicators', label: 'ตัวชี้วัด', value: indicators.length, icon: ClipboardCheck, tone: 'info' },
            { key: 'scored', label: 'ประเมินแล้ว', value: `${levels.length}/${indicators.length}`, icon: ClipboardCheck, tone: 'success' },
            { key: 'avg', label: 'ระดับเฉลี่ย', value: avg, icon: ClipboardCheck, tone: 'warning' },
        ];
    }, [standards, indicators, assessments]);

    const handleLevelChange = async (indicatorId: string, level: number | null) => {
        const res = await sarService.upsertAssessment({
            academic_year: year,
            indicator_id: indicatorId,
            level,
        });
        if (res.error) toast({ title: 'บันทึกระดับล้มเหลว', description: res.error.message, variant: 'destructive' });
        else { toast({ title: 'บันทึกแล้ว' }); reload(); }
    };

    const handleSaveSummary = async (a: SarAssessment, summary: string) => {
        const res = await sarService.upsertAssessment({
            academic_year: year,
            indicator_id: a.indicator_id,
            level: a.level,
            evidence_summary: summary,
        });
        if (res.error) toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' });
        else toast({ title: 'บันทึกหลักฐานสรุปแล้ว' });
    };

    const handleUpload = async (asmt: SarAssessment, file: File) => {
        const res = await sarService.uploadEvidence(asmt.id, file);
        if (res.error) toast({ title: 'อัปโหลดล้มเหลว', description: (res.error as Error).message, variant: 'destructive' });
        else { toast({ title: 'อัปโหลดสำเร็จ' }); reload(); }
    };

    const handleDeleteEvidence = async (id: string) => {
        const res = await sarService.deleteEvidence(id);
        if (res.error) toast({ title: 'ลบล้มเหลว', variant: 'destructive' });
        else { toast({ title: 'ลบแล้ว' }); reload(); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">SAR / ประกันคุณภาพภายใน</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">รายงานประเมินตนเอง</h1>
                    <p className="text-sm text-muted-foreground mt-1">3 มาตรฐาน • ปีการศึกษา {year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">ปีการศึกษา</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[year - 1, year, year + 1].map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <KpiRibbon tiles={tiles} loading={loading} />

            {standards.map((std) => {
                const indList = indicatorsByStd.get(std.id) ?? [];
                return (
                    <Card key={std.id}>
                        <CardHeader>
                            <CardTitle className="text-base">{std.name}</CardTitle>
                            {std.description ? (
                                <p className="text-xs text-muted-foreground">{std.description}</p>
                            ) : null}
                        </CardHeader>
                        <CardContent>
                            {indList.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-3">ยังไม่มีตัวชี้วัด</p>
                            ) : (
                                <div className="space-y-1">
                                    {indList.map((ind) => {
                                        const a = assessmentByIndicator.get(ind.id);
                                        const evList = a ? evidence[a.id] ?? [] : [];
                                        return (
                                            <details key={ind.id} className="group border border-border rounded-md px-3">
                                                <summary className="cursor-pointer list-none py-2 flex items-center gap-3">
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0" />
                                                    <span className="font-mono text-xs text-muted-foreground">{ind.code}</span>
                                                    <span className="flex-1 text-sm">{ind.name}</span>
                                                    {a?.level ? (
                                                        <Badge variant={LEVEL_BADGE[a.level]}>
                                                            ระดับ {a.level} • {LEVEL_LABEL[a.level]}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px]">ยังไม่ประเมิน</Badge>
                                                    )}
                                                </summary>
                                                <div className="pt-2 pb-3 pl-7">
                                                    <IndicatorRow
                                                        indicator={ind}
                                                        assessment={a ?? null}
                                                        evidenceList={evList}
                                                        onChangeLevel={(level) => handleLevelChange(ind.id, level)}
                                                        onSaveSummary={(s) => a && handleSaveSummary(a, s)}
                                                        onUpload={(f) => a && handleUpload(a, f)}
                                                        onDeleteEvidence={handleDeleteEvidence}
                                                    />
                                                </div>
                                            </details>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

interface IndicatorRowProps {
    indicator: SarIndicator;
    assessment: SarAssessment | null;
    evidenceList: SarEvidenceFile[];
    onChangeLevel: (level: number | null) => void;
    onSaveSummary: (s: string) => void;
    onUpload: (f: File) => void;
    onDeleteEvidence: (id: string) => void;
}

const IndicatorRow = ({
    assessment, evidenceList, onChangeLevel, onSaveSummary, onUpload, onDeleteEvidence,
}: IndicatorRowProps) => {
    const [summary, setSummary] = useState(assessment?.evidence_summary ?? '');

    useEffect(() => { setSummary(assessment?.evidence_summary ?? ''); }, [assessment?.id]);

    return (
        <div className="space-y-3 pb-3">
            <div className="flex items-center gap-3">
                <Label className="text-xs">ระดับคุณภาพ</Label>
                <Select
                    value={assessment?.level ? String(assessment.level) : ''}
                    onValueChange={(v) => onChangeLevel(v ? Number(v) : null)}
                >
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="เลือกระดับ" /></SelectTrigger>
                    <SelectContent>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                            <SelectItem key={lvl} value={String(lvl)}>
                                {lvl} — {LEVEL_LABEL[lvl]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="mb-1 block text-xs">สรุปหลักฐาน</Label>
                <Textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    onBlur={() => assessment && onSaveSummary(summary)}
                    placeholder="ระบุหลักฐานเชิงประจักษ์โดยย่อ…"
                    disabled={!assessment}
                />
                {!assessment ? (
                    <p className="text-[11px] text-muted-foreground mt-1">เลือกระดับก่อน เพื่อสร้างประเมิน</p>
                ) : null}
            </div>

            {assessment ? (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">ไฟล์หลักฐาน ({evidenceList.length})</Label>
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                            <label>
                                <Upload className="w-3.5 h-3.5 mr-1" /> อัปโหลด
                                <input
                                    type="file" hidden
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) onUpload(f);
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                        </Button>
                    </div>
                    {evidenceList.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">ยังไม่มีไฟล์</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {evidenceList.map((ev) => (
                                <li key={ev.id} className="flex items-center gap-2 text-sm">
                                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                    <a href={ev.file_url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                                        {ev.file_name ?? ev.file_url}
                                    </a>
                                    <Button size="icon" variant="ghost" className="w-6 h-6 text-destructive"
                                        onClick={() => onDeleteEvidence(ev.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default SarManagement;
export { SarManagement };
