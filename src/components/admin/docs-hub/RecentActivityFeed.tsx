import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Inbox, Send, Stamp, UserX, BookMarked, Wallet, ClipboardCheck,
    ShieldCheck, Target, FileText, Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    docsHubAggregateService, type RecentDoc, type RecentDocEntityType,
} from '@/services/docs-hub.service';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';

const ENTITY_ICON: Record<RecentDocEntityType, LucideIcon> = {
    incoming: Inbox, outgoing: Send, order: Stamp, leave: UserX,
    training: BookMarked, budget: Wallet, sar: ClipboardCheck,
    ics: ShieldCheck, project: Target, template: FileText,
};

const ENTITY_LABEL: Record<RecentDocEntityType, string> = {
    incoming: 'หนังสือรับ', outgoing: 'หนังสือส่ง', order: 'คำสั่ง/ประกาศ',
    leave: 'การลา', training: 'อบรม', budget: 'การเงิน',
    sar: 'SAR', ics: 'ICS', project: 'แผนปฏิบัติการ', template: 'แบบฟอร์ม',
};

const formatRelative = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.round(ms / 60000);
    if (min < 60) return `${Math.max(1, min)} นาทีที่แล้ว`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr} ชม.ที่แล้ว`;
    const d = Math.round(hr / 24);
    if (d < 30) return `${d} วันที่แล้ว`;
    return formatThaiDateMedium(iso);
};

interface RecentActivityFeedProps { className?: string }

export const RecentActivityFeed = ({ className }: RecentActivityFeedProps) => {
    const [items, setItems] = useState<RecentDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await docsHubAggregateService.listRecentDocuments(20);
            if (res.data) setItems(res.data);
            setLoading(false);
        })();
    }, []);

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-4 h-4 text-primary" /> กิจกรรมล่าสุด (30 วัน)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">กำลังโหลด…</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีกิจกรรม</p>
                ) : (
                    <ol className="space-y-2">
                        {items.map((it) => {
                            const Icon = ENTITY_ICON[it.entity_type] ?? Activity;
                            return (
                                <li
                                    key={`${it.entity_type}-${it.entity_id}`}
                                    className={cn(
                                        'flex items-start gap-3 p-2.5 rounded-lg',
                                        'border border-border hover:bg-secondary transition-colors',
                                    )}
                                >
                                    <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md bg-muted text-muted-foreground">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-[10px]">
                                                {ENTITY_LABEL[it.entity_type]}
                                            </Badge>
                                            {it.status ? (
                                                <Badge variant="secondary" className="text-[10px]">{it.status}</Badge>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-sm text-foreground line-clamp-1">{it.title}</p>
                                        <p className="text-[11px] text-muted-foreground">{formatRelative(it.event_at)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </CardContent>
        </Card>
    );
};
