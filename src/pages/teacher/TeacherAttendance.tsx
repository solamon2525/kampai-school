import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { AttendanceManagement } from '@/components/admin/attendance/AttendanceManagement';
import { TEACHER_MENU } from './TeacherDashboard';

export default function TeacherAttendance() {
    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
            <AttendanceManagement />
        </RolePortalLayout>
    );
}
