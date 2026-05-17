import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PenLine, ShieldCheck, UserCheck } from 'lucide-react';
import { signaturesService, type SignatureRow, type SignatureRole } from '@/services/signatures.service';
import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<SignatureRole, string> = {
    approver: 'ผู้อนุมัติ',
    signer:   'ผู้ลงนาม',
    witness:  'พยาน',
};

const ROLE_ICON: Record<SignatureRole, typeof PenLine> = {
    approver: ShieldCheck,
    signer:   PenLine,
    witness:  UserCheck,
};

const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('th-TH', {
        day: 'numeric', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });

interface SignatureListProps {
    entityType: string;
    entityId: string;
    className?: string;
    emptyText?: string;
}

export const SignatureList = ({
    entityType, entityId, className, emptyText = 'ยังไม่มีการลงนาม',
}: SignatureListProps) => {
    const [rows, setRows] = useState<SignatureRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            const res = await signaturesService.list(entityType, entityId);
            if (!canceled && res.data) setRows(res.data);
            setLoading(false);
        })();
        return () => { canceled = true; };
    }, [entityType, entityId]);

    if (loading) {
        return <p className="text-xs text-muted-foreground py-2 text-center">กำลังโหลด…</p>;
    }
    if (rows.length === 0) {
        return <p className="text-xs text-muted-foreground py-2 text-center">{emptyText}</p>;
    }

    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
            {rows.map((row) => {
                const Icon = ROLE_ICON[row.role];
                return (
                    <div
                        key={row.id}
                        className="border border-border rounded-lg p-3 bg-background space-y-2"
                    >
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                                <Icon className="w-3 h-3 mr-1" />
                                {ROLE_LABEL[row.role]}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                                {formatTime(row.signed_at)}
                            </span>
                        </div>
                        <div className="border border-dashed border-border rounded-md bg-muted/30 p-2 min-h-[80px] flex items-center justify-center">
                            <img
                                src={row.signature_url}
                                alt={`ลายเซ็น ${row.signer_name}`}
                                className="max-h-[80px] object-contain mix-blend-multiply"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{row.signer_name}</p>
                            {row.signer_position ? (
                                <p className="text-xs text-muted-foreground">{row.signer_position}</p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
