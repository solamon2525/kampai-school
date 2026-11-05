import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useActiveChild } from '@/hooks/useActiveChild';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { PARENT_MENU } from './ParentDashboard';
import { ClipboardCheck, PenLine, Star, Recycle, Wallet, Trophy } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';
import { WasteBankParentView } from '@/components/parent/WasteBankParentView';
import { SavingsBankParentView } from '@/components/parent/SavingsBankParentView';
import { KampaiHeroDashboard } from '@/components/admin/conduct/KampaiHeroDashboard';

interface Props {
    view: 'attendance' | 'scores' | 'conduct' | 'waste-bank' | 'savings-bank';
}

const CONFIG = {
    'attendance': {
        title: 'การมาเรียน',
        icon: ClipboardCheck,
        table: 'attendance_records',
        select: '*',
        render: (r: any) => (
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div>
                    <p className="font-medium text-foreground">{new Date(r.date).toLocaleDateString('th-TH')}</p>
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
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div>
                    <p className="font-medium text-foreground">{r.subject_name || r.subject || 'รายวิชา'}</p>
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
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div>
                    <p className="font-medium text-foreground">{r.reason || r.note || 'บันทึกความประพฤติ'}</p>
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
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div>
                    <p className="font-medium text-foreground">{r.waste_categories?.name || 'ขยะ'}</p>
                    <p className="text-xs text-muted-foreground">
                        {r.transaction_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : '')}
                        {r.quantity ? ` • ${r.quantity} ชิ้น` : ''}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-primary">+{Number(r.points_earned || 0)} แต้ม</p>
                </div>
            </div>
        ),
    },
    'savings-bank': {
        title: 'ธนาคารพอเพียง',
        icon: Wallet,
        table: 'savings_transactions',
        select: '*',
        render: (_: any) => null,
    },
} as const;

export default function ParentChildView({ view }: Props) {
    const { activeChild, children: kids } = useActiveChild();
    const { data: link } = useLinkedRecord();
    const studentId = activeChild?.id ?? link?.student_id;

    const cfg = CONFIG[view];
    const Icon = cfg.icon;

    const { data: records, isLoading } = useQuery({
        queryKey: ['parent-view', view, studentId],
        enabled: !!studentId && ['attendance', 'scores'].includes(view),
        queryFn: async () => {
            const { data, error } = await supabase
                .from(cfg.table as any)
                .select(cfg.select)
                .eq('student_id', studentId!)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return (data as any[]) || [];
        },
    });

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={PARENT_MENU} accent="parent">
            <div className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Icon className="w-6 h-6 text-primary" /> {cfg.title}
                        </h1>
                        {activeChild && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeChild.name} {activeChild.class ? `(${activeChild.class}${activeChild.room ? `/${activeChild.room}` : ''})` : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {kids.length > 0 && <ChildSwitcher />}
                        {view === 'conduct' && studentId && (
                            <a 
                                href={`/virtue-bank/${studentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] w-fit"
                            >
                                <Trophy className="w-4 h-4" />
                                ดูใบประวัติฮีโร่พรีเมียม & เกียรติบัตรสาธารณะ ✨
                            </a>
                        )}
                    </div>
                </div>

                {view === 'conduct' && studentId ? (
                    <KampaiHeroDashboard studentId={studentId} isParentView={true} />
                ) : view === 'waste-bank' && studentId ? (
                    <WasteBankParentView studentId={studentId} />
                ) : view === 'savings-bank' && studentId ? (
                    <SavingsBankParentView studentId={studentId} />
                ) : (
                <Card>
                    <CardHeader><CardTitle className="text-base">รายการย้อนหลัง 100 รายการ</CardTitle></CardHeader>
                    <CardContent>
                        {!studentId ? (
                            <p className="text-destructive font-medium text-sm">บัญชียังไม่ได้เชื่อมกับนักเรียน กรุณาติดต่อผู้ดูแลระบบ</p>
                        ) : isLoading ? (
                            <ListSkeleton count={4} showAvatar={false} />
                        ) : !records || records.length === 0 ? (
                            <EmptyState
                                variant="inline"
                                illustration={<NoDataIllustration />}
                                title="ยังไม่มีข้อมูล"
                                description={`ยังไม่มีประวัติ${cfg.title}ในช่วงนี้`}
                            />
                        ) : (
                            <div className="space-y-2">
                                {records.map((r, i) => <div key={r.id || i}>{cfg.render(r)}</div>)}
                            </div>
                        )}
                    </CardContent>
                </Card>
                )}
            </div>
        </RolePortalLayout>
    );
}
