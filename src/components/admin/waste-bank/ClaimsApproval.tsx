import { useEffect, useState } from 'react';
import { Check, X, ClipboardCheck, Clock, CheckCircle2, XCircle, Globe2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { rewardClaimsService } from '@/services/waste-bank.service';
import type { RewardClaim, RewardClaimStatus } from '@/services/waste-bank.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

const STATUS_LABEL: Record<RewardClaimStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
};

export const ClaimsApproval = () => {
  const { toast } = useToast();
  const { user, staffId, administratorId } = useAuth();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [filter]);

  const fetchAll = async () => {
    const { data, error } = filter === 'pending'
      ? await rewardClaimsService.listPending()
      : await rewardClaimsService.listAll();
    if (!error && data) setClaims(data as RewardClaim[]);
  };

  const handleApprove = async (id: string) => {
    if (!user?.id) return;
    setProcessingId(id);
    const { error } = await rewardClaimsService.approve(id, user.id, { staffId, administratorId });
    setProcessingId(null);
    if (error) {
      toast({ title: 'อนุมัติไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'อนุมัติสำเร็จ' });
      fetchAll();
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;
    const reason = prompt('เหตุผลที่ปฏิเสธ (ไม่บังคับ):') ?? undefined;
    setProcessingId(id);
    const { error } = await rewardClaimsService.reject(id, user.id, reason, { staffId, administratorId });
    setProcessingId(null);
    if (error) {
      toast({ title: 'ปฏิเสธไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ปฏิเสธคำขอสำเร็จ' });
      fetchAll();
    }
  };

  const statusBadge = (s: RewardClaimStatus) => {
    if (s === 'pending') return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 gap-1"><Clock className="w-3 h-3" />{STATUS_LABEL[s]}</Badge>;
    if (s === 'approved') return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" />{STATUS_LABEL[s]}</Badge>;
    return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 gap-1"><XCircle className="w-3 h-3" />{STATUS_LABEL[s]}</Badge>;
  };

  const ownerBadge = (c: RewardClaim) => {
    const ownerStaff = c.rewards?.owner_staff_id ?? null;
    const ownerAdmin = c.rewards?.owner_administrator_id ?? null;
    if (!ownerStaff && !ownerAdmin) {
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-sky-300 text-sky-700 dark:text-sky-300">
          <Globe2 className="w-3 h-3" /> กลาง
        </Badge>
      );
    }
    const mine = (staffId && ownerStaff === staffId) || (administratorId && ownerAdmin === administratorId);
    return (
      <Badge variant="outline" className={`gap-1 text-[10px] ${mine ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : ''}`}>
        <User className="w-3 h-3" /> {mine ? 'ของฉัน' : 'ของครู'}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ClipboardCheck className="w-4 h-4" /> อนุมัติหรือปฏิเสธคำขอแลกรางวัล
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
            รออนุมัติ
          </Button>
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            ทั้งหมด
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">นักเรียน</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">รางวัล</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้ม</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">คงเหลือหลังแลก</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-muted-foreground">
                      {filter === 'pending' ? 'ไม่มีคำขอที่รออนุมัติของฉัน' : 'ยังไม่มีคำขอแลกรางวัล'}
                    </td>
                  </tr>
                ) : (
                  claims.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatThaiDateFull(c.claimed_at)}
                        {c.academic_year && c.semester && (
                          <div className="text-[10px] text-muted-foreground/70">
                            เทอม {c.semester}/{c.academic_year}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.students?.photo_url ? (
                            <img src={c.students.photo_url} alt={c.students?.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
                              {(c.students?.name ?? '?').slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{c.students?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{c.students?.class}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.rewards?.image_url && (
                            <img src={c.rewards.image_url} alt={c.reward_name} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div className="space-y-1">
                            <div>{c.reward_name}</div>
                            {ownerBadge(c)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{c.points_used}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.balance_after !== null ? c.balance_after : '—'}
                      </td>
                      <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3">
                        {c.status === 'pending' ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => handleApprove(c.id)}
                              disabled={processingId === c.id}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30"
                              onClick={() => handleReject(c.id)}
                              disabled={processingId === c.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          c.rejection_reason && (
                            <span className="text-xs text-muted-foreground">{c.rejection_reason}</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
