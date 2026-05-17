import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AlertOctagon,
    Clock,
    CheckSquare,
    CalendarCheck,
    GraduationCap,
    SendHorizontal,
    Plus,
} from 'lucide-react';
import { docsHubService, type DocCategoryMeta, type HubKpi, type UrgentDoc } from '@/services/docs-hub.service';
import { CategoryGrid } from './CategoryGrid';
import { KpiRibbon, type KpiTile } from './KpiRibbon';
import { UrgentDocumentsList } from './UrgentDocumentsList';

export const DocsHubDashboard = () => {
    const navigate = useNavigate();
    const yearBE = new Date().getFullYear() + 543;

    const [categories, setCategories] = useState<DocCategoryMeta[]>([]);
    const [kpi, setKpi] = useState<HubKpi | null>(null);
    const [urgent, setUrgent] = useState<UrgentDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            const [catRes, kpiRes, urgRes] = await Promise.all([
                docsHubService.listCategories(),
                docsHubService.getKpi(),
                docsHubService.listUrgentDocuments(12),
            ]);
            if (canceled) return;
            if (catRes.data) setCategories(catRes.data);
            if (kpiRes.data) setKpi(kpiRes.data);
            if (urgRes.data) setUrgent(urgRes.data);
            setLoading(false);
        })();
        return () => { canceled = true; };
    }, []);

    const tiles = useMemo<KpiTile[]>(() => [
        {
            key: 'urgent', label: 'งานด่วน',
            value: kpi?.urgent_count ?? 0, icon: AlertOctagon, tone: 'danger',
            onClick: () => navigate('/admin/dashboard/incoming-letters'),
        },
        {
            key: 'pending', label: 'รอดำเนินการ',
            value: kpi?.pending_count ?? 0, icon: Clock, tone: 'warning',
        },
        {
            key: 'active', label: 'เคลื่อนไหวเดือนนี้',
            value: kpi?.active_this_month ?? 0, icon: CheckSquare, tone: 'primary',
        },
        {
            key: 'meetings', label: 'ประชุม 7 วันถัดไป',
            value: kpi?.upcoming_meetings ?? 0, icon: CalendarCheck, tone: 'info',
            onClick: () => navigate('/admin/dashboard/meetings'),
        },
        {
            key: 'training', label: 'อบรมเดือนนี้',
            value: kpi?.training_this_month ?? 0, icon: GraduationCap, tone: 'success',
            onClick: () => navigate('/admin/dashboard/training'),
        },
        {
            key: 'outgoing', label: 'หนังสือส่งเดือนนี้',
            value: kpi?.outgoing_this_month ?? 0, icon: SendHorizontal, tone: 'muted',
            onClick: () => navigate('/admin/dashboard/outgoing-letters'),
        },
    ], [kpi, navigate]);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            {/* Hero */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-primary tracking-wide uppercase">
                        ศูนย์เอกสารโรงเรียน
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">
                        เอกสารโรงเรียนบ้านคำไผ่
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        15 หมวดเอกสาร • ปีงบประมาณ {yearBE}
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/dashboard/incoming-letters')} className="self-start sm:self-auto">
                    <Plus className="w-4 h-4 mr-1" /> ลงทะเบียนเอกสารใหม่
                </Button>
            </div>

            {/* KPI ribbon */}
            <KpiRibbon tiles={tiles} loading={loading} />

            {/* Category grid + Urgent list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">หมวดเอกสาร</h2>
                        <span className="text-xs text-muted-foreground">{categories.length} หมวด</span>
                    </div>
                    {loading && categories.length === 0 ? (
                        <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">กำลังโหลดหมวด…</CardContent></Card>
                    ) : (
                        <CategoryGrid categories={categories} />
                    )}
                </div>
                <div>
                    <UrgentDocumentsList items={urgent} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default DocsHubDashboard;
