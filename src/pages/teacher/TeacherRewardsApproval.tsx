import { Gift } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { ClaimsApproval } from '@/components/admin/waste-bank/ClaimsApproval';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEACHER_MENU } from './TeacherDashboard';

export default function TeacherRewardsApproval() {
  return (
    <RolePortalLayout
      title="Portal ครู"
      subtitle="อนุมัติคำขอแลกรางวัล"
      menu={TEACHER_MENU}
      accent="teacher"
    >
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">อนุมัติคำขอแลกรางวัล</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              ตรวจคำขอจากนักเรียนและกดอนุมัติหรือปฏิเสธ — ระบบจะบันทึกชื่อผู้อนุมัติอัตโนมัติ
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">รายการคำขอ</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimsApproval />
          </CardContent>
        </Card>
      </div>
    </RolePortalLayout>
  );
}
