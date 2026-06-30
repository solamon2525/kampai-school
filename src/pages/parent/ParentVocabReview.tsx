import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { useActiveChild } from '@/hooks/useActiveChild';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { PARENT_MENU } from '@/pages/parent/ParentDashboard';
import { ThaiVocabMissedReportStudent } from '@/components/thai-vocab/ThaiVocabMissedReport';

export default function ParentVocabReview() {
  const { activeChild, children: kids } = useActiveChild();

  return (
    <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={PARENT_MENU} accent="parent">      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">คำศัพท์ที่ควรทบทวน</h1>
            <p className="text-sm text-muted-foreground mt-1">
              จากเกมคลังคำศัพท์ภาษาไทย — คำที่ลูกตอบผิดในโหมดฝึก
            </p>
          </div>
          {kids.length > 0 && <ChildSwitcher />}
        </div>

        {activeChild ? (
          <ThaiVocabMissedReportStudent
            studentId={activeChild.id}
            studentName={activeChild.name}
          />
        ) : (
          <p className="text-sm text-amber-600">ยังไม่ได้เชื่อมบัญชีกับนักเรียน</p>
        )}
      </div>
    </RolePortalLayout>
  );
}
