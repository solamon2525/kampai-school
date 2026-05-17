import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Clock, MessageSquarePlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    letterTrackingService,
    type TrackingEntityType,
    type TrackingEntry,
} from '@/services/letter-tracking.service';

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('th-TH', {
        day: 'numeric', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
};

interface TrackingTimelineProps {
    entityType: TrackingEntityType;
    entityId: string;
    allowAddNote?: boolean;
    className?: string;
}

export const TrackingTimeline = ({
    entityType, entityId, allowAddNote = true, className,
}: TrackingTimelineProps) => {
    const [entries, setEntries] = useState<TrackingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteOpen, setNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const reload = async () => {
        setLoading(true);
        const res = await letterTrackingService.listTimeline(entityType, entityId);
        if (res.data) setEntries(res.data);
        setLoading(false);
    };

    useEffect(() => {
        if (entityId) reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityType, entityId]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setSaving(true);
        const { error } = await letterTrackingService.addNote(entityType, entityId, noteText.trim());
        setSaving(false);
        if (error) {
            toast({ title: 'เพิ่ม note ไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        setNoteText('');
        setNoteOpen(false);
        toast({ title: 'บันทึก note แล้ว' });
        reload();
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    ติดตามเอกสาร (Timeline)
                </h4>
                {allowAddNote ? (
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => setNoteOpen((v) => !v)}
                        className="h-7 text-xs"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5 mr-1" /> เพิ่มหมายเหตุ
                    </Button>
                ) : null}
            </div>

            {noteOpen ? (
                <div className="flex gap-2">
                    <Input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="พิมพ์หมายเหตุ…"
                        className="h-8 text-sm"
                        autoFocus
                    />
                    <Button size="sm" disabled={saving || !noteText.trim()} onClick={handleAddNote}>
                        {saving ? '…' : 'บันทึก'}
                    </Button>
                </div>
            ) : null}

            {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">กำลังโหลด…</p>
            ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">ยังไม่มี log</p>
            ) : (
                <ol className="relative border-l border-border pl-4 space-y-3">
                    {entries.map((e, idx) => (
                        <li key={e.id} className="relative">
                            <span
                                className={cn(
                                    'absolute -left-[21px] top-1 inline-flex w-3.5 h-3.5 rounded-full border-2 bg-background',
                                    idx === 0 ? 'border-primary' : 'border-border',
                                )}
                            />
                            <div className="flex items-start gap-2">
                                {e.actor_name ? (
                                    <PersonAvatar name={e.actor_name} size="xs" />
                                ) : null}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {formatTime(e.created_at)}
                                        {e.actor_name ? <> • {e.actor_name}</> : null}
                                    </p>
                                    {e.note ? (
                                        <p className="text-sm text-foreground">{e.note}</p>
                                    ) : (
                                        <p className="text-sm text-foreground flex items-center gap-1 flex-wrap">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary inline" />
                                            {e.from_status ? (
                                                <>
                                                    <span className="text-muted-foreground">{e.from_status}</span>
                                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                </>
                                            ) : null}
                                            <span className="font-medium">{e.to_status}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};
