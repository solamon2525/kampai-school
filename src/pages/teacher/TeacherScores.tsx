import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { ScoresManagement } from '@/components/admin/scores/ScoresManagement';
import { TEACHER_MENU } from './TeacherDashboard';

export default function TeacherScores() {
    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
            <ScoresManagement />
        </RolePortalLayout>
    );
}
