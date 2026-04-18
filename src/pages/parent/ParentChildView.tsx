import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { PARENT_MENU } from './ParentDashboard';
import { ClipboardCheck, PenLine, Star, Recycle } from 'lucide-react';

interface Props {
    view: 'attendance' | 'scores' | 'conduct' | 'waste-bank';
}

const CONFIG = {
    'attendance': {
        title: 'การมาเรียน',
        icon: ClipboardCheck,
        table: 'attendance_records',
        select: '*',
        render: (r: any) => (
            <div className="flex items-center justify-between p-3 border rounded">
                <div>
                    <p className="font-medium">{new Date(r.date).toLocaleDateString('th-TH')}</p>
                    <p className="text-xs text-muted-foreground">{r.note || '-'}</p>
                </div>
                <Badge variant={r.status === 'present' ? 'default' : r.status === 'absent' ? 'destructive' : 'secondary'}>
                    {r.status === 'present' ? 'มา' : r.status === 'absent' ? 'ขาด' : r.status === 'late' ? 'สาย' : r.status}
                </Badge>
            </div>
        ),
    },
    'scores': {
        title: 'ผลการเรียน',
        icon: PenLine,
        table: 'score_records',
        select: '*',
        render: (r: any) => (
            <div className="flex items-center justify-between p-3 border rounded">
                <div>
                    <p className="font-medium">{r.subject_name || r.subject || 'รายวิชา'}</p>
                    <p className="text-xs text-muted-foreground">{r.assessment_name || r.category || ''}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-primary">{r.score}/{r.max_score ?? r.full_score ?? '-'}</p>
                </div>
            </div>
        ),
    },
    'conduct': {
        title: 'ความประพฤติ',
        icon: Star,
        table: 'conduct_scores',
        select: '*',
        render: (r: any) => (
            <div className="flex items-center justify-between p-3 border rounded">
                <div>
                    <p className="font-medium">{r.reason || r.note || 'บันทึกความประพฤติ'}</p>
                    <p className="text-xs text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString('th-TH') : ''}</p>
                </div>
                <Badge variant={r.points > 0 ? 'default' : 'destructive'}>
                    {r.points > 0 ? '+' : ''}{r.points}
                </Badge>
            </div>
        ),
    },
    'waste-bank': {
        title: 'ธนาคารขยะ',
        icon: Recycle,
        table: 'waste_transactions',
        select: '*',
        render: (r: any) => (
            <div className="flex items-center justify-between p-3 border rounded">
                <div>
                    <p className="font-medium">{r.category_name || r.waste_type || 'ขยะ'}</p>
                    <p className="text-xs text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : ''}
                        {r.weight_kg ? ` • ${r.weight_kg} กก.` : ''}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-emerald-600">฿{Number(r.amount || 0).toLocaleString()}</p>
                </div>
            </div>
        ),
    },
} as const;

export default function ParentChildView({ view }: Props) {
    const { data: link } = useLinkedRecord();
    const cfg = CONFIG[view];
    const Icon = cfg.icon;

    const { data: records, isLoading } = useQuery({
        queryKey: ['parent-view', view, link?.student_id],
        enabled: !!link?.student_id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from(cfg.table as any)
                .select(cfg.select)
                .eq('student_id', link!.student_id!)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return (data as any[]) || [];
        },
    });

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={PARENT_MENU} accent="parent">
            <div className="p-8 space-y-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Icon className="w-6 h-6" /> {cfg.title}
                </h1>
                <Card>
                    <CardHeader><CardTitle className="text-base">รายการย้อนหลัง 100 รายการ</CardTitle></CardHeader>
                    <CardContent>
                        {!link?.student_id ? (
                            <p className="text-amber-600 text-sm">บัญชียังไม่ได้เชื่อมกับนักเรียน</p>
                        ) : isLoading ? (
                            <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
                        ) : !records || records.length === 0 ? (
                            <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-2">
                                {records.map((r, i) => <div key={r.id || i}>{cfg.render(r)}</div>)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RolePortalLayout>
    );
}
