import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { AlertOctagon, Mail, Send, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatThaiDateFull } from '@/lib/thaiDate';
import type { UrgentDoc, UrgentDocEntityType } from '@/services/docs-hub.service';

const ENTITY_ICON: Record<UrgentDocEntityType, typeof Inbox> = {
    incoming: Inbox,
    outgoing: Send,
    leave:    Mail,
};

const ENTITY_LABEL: Record<UrgentDocEntityType, string> = {
    incoming: 'หนังสือรับ',
    outgoing: 'หนังสือส่ง',
    leave:    'ใบลา',
};

const ENTITY_ROUTE: Record<UrgentDocEntityType, string> = {
    incoming: '/admin/dashboard/incoming-letters',
    outgoing: '/admin/dashboard/outgoing-letters',
    leave:    '/admin/dashboard/leave',
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
    'ด่วนที่สุด':  'bg-destructive/15 text-destructive border-destructive/30',
    'ด่วนมาก':    'bg-destructive/10 text-destructive border-destructive/20',
    'ด่วน':       'bg-amber-500/15 text-amber-700 border-amber-500/30',
    'pending':    'bg-amber-500/15 text-amber-700 border-amber-500/30',
    'รอลงนาม':    'bg-sky-500/15 text-sky-700 border-sky-500/30',
};

interface UrgentDocumentsListProps {
    items: UrgentDoc[];
    loading?: boolean;
    className?: string;
}

export const UrgentDocumentsList = ({ items, loading, className }: UrgentDocumentsListProps) => {
    const navigate = useNavigate();

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertOctagon className="w-4 h-4 text-destructive" />
                    รอดำเนินการ / ด่วน
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {loading ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">กำลังโหลด…</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        ไม่มีงานเร่งด่วน ✓
                    </p>
                ) : (
                    items.map((doc) => {
                        const Icon = ENTITY_ICON[doc.entity_type];
                        const badgeClass = doc.badge
                            ? PRIORITY_BADGE_CLASS[doc.badge] ?? 'bg-muted text-muted-foreground'
                            : 'bg-muted text-muted-foreground';
                        return (
                            <button
                                key={`${doc.entity_type}-${doc.entity_id}`}
                                onClick={() => navigate(ENTITY_ROUTE[doc.entity_type])}
                                className={cn(
                                    'w-full text-left flex items-start gap-3 p-3 rounded-lg',
                                    'border border-border hover:bg-secondary transition-colors',
                                )}
                            >
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
                                    <Icon className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            {ENTITY_LABEL[doc.entity_type]}
                                        </span>
                                        {doc.badge ? (
                                            <Badge variant="outline" className={cn('text-[10px] border', badgeClass)}>
                                                {doc.badge}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 text-sm font-medium text-foreground line-clamp-1">
                                        {doc.title}
                                    </p>
                                    {doc.subtitle ? (
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {doc.subtitle}
                                        </p>
                                    ) : null}
                                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                        {doc.doc_date ? <span>📅 {formatThaiDateFull(doc.doc_date)}</span> : null}
                                        {doc.due_date ? <span>⏳ ครบกำหนด {formatThaiDateFull(doc.due_date)}</span> : null}
                                    </div>
                                </div>
                                {doc.staff ? (
                                    <PersonAvatar
                                        name={doc.staff.name}
                                        photoUrl={doc.staff.photo_url}
                                        size="sm"
                                    />
                                ) : null}
                            </button>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};
