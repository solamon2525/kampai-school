import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Gift, Upload, ArrowRight, Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { teacherOpsService } from '@/services/teacher-ops.service';
import { cn } from '@/lib/utils';

interface TeacherPendingTasksCardProps {
  staffId: string | null;
}

export function TeacherPendingTasksCard({ staffId }: TeacherPendingTasksCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-pending-ops', staffId],
    queryFn: () => teacherOpsService.pendingSummary(staffId),
    enabled: !!staffId,
  });

  if (!staffId) return null;

  const pendingGrading = data?.pendingGrading ?? 0;
  const pendingRewards = data?.pendingRewards ?? 0;
  const pendingSupplies = data?.pendingSupplies ?? 0;
  const needsUpload = data?.needsFirstUpload ?? false;
  const totalPending = pendingGrading + pendingRewards + pendingSupplies + (needsUpload ? 1 : 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลดงานค้าง...
        </CardContent>
      </Card>
    );
  }

  if (totalPending === 0) {
    return (
      <Card className="border-emerald-200/80 bg-emerald-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-foreground">
            ไม่มีงานค้างตอนนี้ — ขอบคุณที่ดูแลนักเรียนครบถ้วน
          </p>
          <Button variant="outline" size="sm" className="sm:ml-auto h-8 text-xs" asChild>
            <Link to="/teacher/edu-hub">
              จัดการคลังสื่อ
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const gradingHref = data?.firstAssignmentId
    ? `/teacher/assignments?assignment=${data.firstAssignmentId}`
    : '/teacher/assignments';

  return (
    <Card className="border-amber-200/80 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          งานค้าง
          <Badge variant="secondary" className="text-[10px] font-normal">
            {totalPending} รายการ
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendingGrading > 0 && (
          <TaskRow
            icon={ClipboardCheck}
            label={`ตรวจการบ้าน ${pendingGrading} ชิ้น`}
            href={gradingHref}
            accent="text-amber-700"
          />
        )}
        {pendingRewards > 0 && (
          <TaskRow
            icon={Gift}
            label={`อนุมัติของรางวัล ${pendingRewards} คำขอ`}
            href="/teacher/rewards-approval"
            accent="text-rose-700"
          />
        )}
        {pendingSupplies > 0 && (
          <TaskRow
            icon={Package}
            label={`คำขอพัสดุรออนุมัติ ${pendingSupplies} รายการ`}
            href="/teacher/supplies"
            accent="text-slate-700"
          />
        )}
        {needsUpload && (
          <TaskRow
            icon={Upload}
            label="ยังไม่มีสื่อเผยแพร่ในคลัง — อัปครั้งแรก"
            href="/teacher/edu-hub"
            accent="text-primary"
          />
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  icon: Icon,
  label,
  href,
  accent,
}: {
  icon: ElementType;
  label: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
    >
      <Icon className={cn('h-4 w-4 shrink-0', accent)} />
      <span className="flex-1 font-medium text-foreground">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}
