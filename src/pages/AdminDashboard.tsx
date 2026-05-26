import { lazy, Suspense, useEffect, ReactNode } from 'react';
import { useNavigate, useSearchParams, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import ProtectedRoute from '@/components/admin/shared/ProtectedRoute';
import { useAuth } from '@/contexts/AuthProvider';
import { DashboardSkeleton } from '@/components/shared/LoadingSkeletons';

// Lazy load ทุก admin page — แยก chunk per feature
const AdminHome = lazy(() => import('./admin/AdminHome'));
const NewsManagement = lazy(() => import('@/components/admin/news/NewsManagement').then(m => ({ default: m.NewsManagement })));
const GalleryManagement = lazy(() => import('@/components/admin/gallery/GalleryManagement').then(m => ({ default: m.GalleryManagement })));
const EventsManagement = lazy(() => import('@/components/admin/events/EventsManagement').then(m => ({ default: m.EventsManagement })));
const SettingsManagement = lazy(() => import('@/components/admin/settings/SettingsManagement').then(m => ({ default: m.SettingsManagement })));
const AdministratorsManagement = lazy(() => import('@/components/admin/administrators/AdministratorsManagement').then(m => ({ default: m.AdministratorsManagement })));
const StaffManagement = lazy(() => import('@/components/admin/staff/StaffManagement').then(m => ({ default: m.StaffManagement })));
const StudentsManagement = lazy(() => import('@/components/admin/students/StudentsManagement').then(m => ({ default: m.StudentsManagement })));
const AdmissionsManagement = lazy(() => import('@/components/admin/admissions/AdmissionsManagement').then(m => ({ default: m.AdmissionsManagement })));
const CurriculumManagement = lazy(() => import('@/components/admin/curriculum/CurriculumManagement').then(m => ({ default: m.CurriculumManagement })));
const ActivitiesManagement = lazy(() => import('@/components/admin/curriculum/ActivitiesManagement').then(m => ({ default: m.ActivitiesManagement })));
const FaqManagement = lazy(() => import('@/components/admin/faq/FaqManagement').then(m => ({ default: m.FaqManagement })));
const MilestonesManagement = lazy(() => import('@/components/admin/about/MilestonesManagement').then(m => ({ default: m.MilestonesManagement })));
const FacilitiesManagement = lazy(() => import('@/components/admin/about/FacilitiesManagement').then(m => ({ default: m.FacilitiesManagement })));
const MessagesManagement = lazy(() => import('@/components/admin/messages/MessagesManagement').then(m => ({ default: m.MessagesManagement })));
const DocumentsManagement = lazy(() => import('@/components/admin/documents/DocumentsManagement').then(m => ({ default: m.DocumentsManagement })));
const WasteBankManagement = lazy(() => import('@/components/admin/waste-bank/WasteBankManagement').then(m => ({ default: m.WasteBankManagement })));
const SavingsBankManagement = lazy(() => import('@/components/admin/savings-bank/SavingsBankManagement').then(m => ({ default: m.SavingsBankManagement })));
const AttendanceManagement = lazy(() => import('@/components/admin/attendance/AttendanceManagement').then(m => ({ default: m.AttendanceManagement })));
const ScoresManagement = lazy(() => import('@/components/admin/scores/ScoresManagement').then(m => ({ default: m.ScoresManagement })));
const ConductManagement = lazy(() => import('@/components/admin/conduct/ConductManagement').then(m => ({ default: m.ConductManagement })));
const HeroSlidesManagement = lazy(() => import('@/components/admin/slides/HeroSlidesManagement').then(m => ({ default: m.HeroSlidesManagement })));
const AnalyticsManagement = lazy(() => import('@/components/admin/analytics/AnalyticsManagement').then(m => ({ default: m.AnalyticsManagement })));
const DocsHubDashboard = lazy(() => import('@/components/admin/docs-hub/DocsHubDashboard').then(m => ({ default: m.DocsHubDashboard })));
const BudgetManagement = lazy(() => import('@/components/admin/budget/BudgetManagement').then(m => ({ default: m.BudgetManagement })));
const SarManagement = lazy(() => import('@/components/admin/sar/SarManagement').then(m => ({ default: m.SarManagement })));
const IcsManagement = lazy(() => import('@/components/admin/ics/IcsManagement').then(m => ({ default: m.IcsManagement })));
const ActionPlanManagement = lazy(() => import('@/components/admin/action-plan/ActionPlanManagement').then(m => ({ default: m.ActionPlanManagement })));
const DocTemplatesManagement = lazy(() => import('@/components/admin/doc-templates/DocTemplatesManagement').then(m => ({ default: m.DocTemplatesManagement })));
const StudentDocsHub = lazy(() => import('@/components/admin/student-docs/StudentDocsHub').then(m => ({ default: m.StudentDocsHub })));
const SarabanDashboard = lazy(() => import('@/components/admin/saraban/SarabanDashboard').then(m => ({ default: m.SarabanDashboard })));
const IncomingLetters = lazy(() => import('@/components/admin/saraban/IncomingLetters').then(m => ({ default: m.IncomingLetters })));
const OutgoingLetters = lazy(() => import('@/components/admin/saraban/OutgoingLetters').then(m => ({ default: m.OutgoingLetters })));
const OrdersManagement = lazy(() => import('@/components/admin/saraban/OrdersManagement'));
const MeetingsManagement = lazy(() => import('@/components/admin/saraban/MeetingsManagement'));
const LeaveManagement = lazy(() => import('@/components/admin/hr/LeaveManagement'));
const TrainingManagement = lazy(() => import('@/components/admin/hr/TrainingManagement'));
const PAManagement = lazy(() => import('@/components/admin/hr/PAManagement'));
const SelfDevelopmentHub = lazy(() => import('@/components/admin/hr/SelfDevelopmentHub').then(m => ({ default: m.SelfDevelopmentHub })));
const AcademicManagement = lazy(() => import('@/components/admin/academic/AcademicManagement').then(m => ({ default: m.AcademicManagement })));
const SystemOverview = lazy(() => import('@/components/admin/system/SystemOverview').then(m => ({ default: m.SystemOverview })));
const DashboardSchoolManagement = lazy(() => import('@/components/admin/dashboard-school/DashboardSchoolManagement').then(m => ({ default: m.DashboardSchoolManagement })));
const HomepageManager = lazy(() => import('@/components/admin/homepage/HomepageManager').then(m => ({ default: m.HomepageManager })));
const TestimonialsManagement = lazy(() => import('@/components/admin/homepage/TestimonialsManagement').then(m => ({ default: m.TestimonialsManagement })));
const PartnersManagement = lazy(() => import('@/components/admin/homepage/PartnersManagement').then(m => ({ default: m.PartnersManagement })));
const NotificationsManagement = lazy(() => import('@/components/admin/notifications/NotificationsManagement').then(m => ({ default: m.NotificationsManagement })));
const ThemeManager = lazy(() => import('@/components/admin/theme/ThemeManager').then(m => ({ default: m.ThemeManager })));
const MenuManager = lazy(() => import('@/components/admin/menu/MenuManager').then(m => ({ default: m.MenuManager })));
const TeacherListManagement = lazy(() => import('@/components/admin/teachers/TeacherListManagement').then(m => ({ default: m.TeacherListManagement })));
const EduHubManagement = lazy(() => import('@/components/admin/educational-hub/EduHubManagement').then(m => ({ default: m.EduHubManagement })));
const GamePlayDashboard = lazy(() => import('@/components/admin/games/GamePlayDashboard').then(m => ({ default: m.GamePlayDashboard })));
const ScanRecorder = lazy(() => import('./admin/ScanRecorder'));
const AiAssistPanel = lazy(() => import('@/components/admin/ai-assist/AiAssistPanel').then(m => ({ default: m.AiAssistPanel })));
const LineFollowersManager = lazy(() => import('@/components/admin/line/LineFollowersManager').then(m => ({ default: m.LineFollowersManager })));
const HealthManagement = lazy(() => import('@/components/admin/health/HealthManagement').then(m => ({ default: m.HealthManagement })));
const DmcExportPanel = lazy(() => import('@/components/admin/dmc/DmcExportPanel').then(m => ({ default: m.DmcExportPanel })));
const PdpaDashboard = lazy(() => import('@/components/admin/pdpa/PdpaDashboard').then(m => ({ default: m.PdpaDashboard })));
const PaporGenerator = lazy(() => import('@/components/admin/papor/PaporGenerator').then(m => ({ default: m.PaporGenerator })));

// Loading spinner สำหรับ lazy-loaded admin pages — เปลี่ยนเป็น DashboardSkeleton ระดับพรีเมียม
const AdminPageLoader = () => (
  <div className="flex-1 p-6">
    <DashboardSkeleton />
  </div>
);

// Redirect component สำหรับ backward compat: ?tab=xxx → /admin/dashboard/xxx
const TabRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  
  if (tab && tab !== 'dashboard') {
    return <Navigate to={`/admin/dashboard/${tab}`} replace />;
  }
  
  return null;
};

interface PermissionGuardProps {
  menuId: string;
  children: ReactNode;
}

const PermissionGuard = ({ menuId, children }: PermissionGuardProps) => {
  const { isAdmin, allowedMenus, loading } = useAuth();

  if (loading) {
    return <AdminPageLoader />;
  }

  if (isAdmin || allowedMenus.includes(menuId)) {
    return <>{children}</>;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

const AdminDashboard = () => {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Suspense fallback={<AdminPageLoader />}>
          <Routes>
            <Route index element={
              <>
                <TabRedirect />
                <AdminHome />
              </>
            } />
            {/* เว็บไซต์ */}
            <Route path="homepage-layout" element={<PermissionGuard menuId="homepage-layout"><HomepageManager /></PermissionGuard>} />
            <Route path="testimonials" element={<PermissionGuard menuId="testimonials"><TestimonialsManagement /></PermissionGuard>} />
            <Route path="partners" element={<PermissionGuard menuId="partners"><PartnersManagement /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard menuId="settings"><SettingsManagement /></PermissionGuard>} />
            <Route path="theme" element={<PermissionGuard menuId="theme"><ThemeManager /></PermissionGuard>} />
            <Route path="menu" element={<PermissionGuard menuId="menu"><MenuManager /></PermissionGuard>} />
            <Route path="hero-slides" element={<PermissionGuard menuId="hero-slides"><HeroSlidesManagement /></PermissionGuard>} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="gallery" element={<PermissionGuard menuId="gallery"><GalleryManagement /></PermissionGuard>} />
            <Route path="events" element={<EventsManagement />} />
            {/* ศูนย์เอกสารโรงเรียน */}
            <Route path="docs-hub" element={<PermissionGuard menuId="docs-hub"><DocsHubDashboard /></PermissionGuard>} />
            <Route path="budget" element={<PermissionGuard menuId="budget"><BudgetManagement /></PermissionGuard>} />
            <Route path="sar" element={<PermissionGuard menuId="sar"><SarManagement /></PermissionGuard>} />
            <Route path="ics" element={<PermissionGuard menuId="ics"><IcsManagement /></PermissionGuard>} />
            <Route path="action-plan" element={<PermissionGuard menuId="action-plan"><ActionPlanManagement /></PermissionGuard>} />
            <Route path="doc-templates" element={<PermissionGuard menuId="doc-templates"><DocTemplatesManagement /></PermissionGuard>} />
            <Route path="student-docs" element={<PermissionGuard menuId="student-docs"><StudentDocsHub /></PermissionGuard>} />
            {/* งานสารบรรณ */}
            <Route path="saraban" element={<PermissionGuard menuId="saraban"><SarabanDashboard /></PermissionGuard>} />
            <Route path="incoming-letters" element={<PermissionGuard menuId="incoming-letters"><IncomingLetters /></PermissionGuard>} />
            <Route path="outgoing-letters" element={<PermissionGuard menuId="outgoing-letters"><OutgoingLetters /></PermissionGuard>} />
            <Route path="orders" element={<PermissionGuard menuId="orders"><OrdersManagement /></PermissionGuard>} />
            <Route path="meetings" element={<PermissionGuard menuId="meetings"><MeetingsManagement /></PermissionGuard>} />
            {/* HR */}
            <Route path="leave" element={<PermissionGuard menuId="leave"><LeaveManagement /></PermissionGuard>} />
            <Route path="training" element={<PermissionGuard menuId="training"><TrainingManagement /></PermissionGuard>} />
            <Route path="pa" element={<PermissionGuard menuId="pa"><PAManagement /></PermissionGuard>} />
            <Route path="self-development" element={<SelfDevelopmentHub />} />
            {/* ฝ่ายวิชาการ */}
            <Route path="academic" element={<PermissionGuard menuId="academic"><AcademicManagement /></PermissionGuard>} />
            {/* ข้อมูลโรงเรียน */}
            <Route path="milestones" element={<PermissionGuard menuId="milestones"><MilestonesManagement /></PermissionGuard>} />
            <Route path="facilities" element={<PermissionGuard menuId="facilities"><FacilitiesManagement /></PermissionGuard>} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="teachers" element={<TeacherListManagement />} />
            <Route path="administrators" element={<PermissionGuard menuId="administrators"><AdministratorsManagement /></PermissionGuard>} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="curriculum" element={<PermissionGuard menuId="curriculum"><CurriculumManagement /></PermissionGuard>} />
            <Route path="activities" element={<PermissionGuard menuId="activities"><ActivitiesManagement /></PermissionGuard>} />
            {/* ระบบบริการ */}
            <Route path="scan" element={<ScanRecorder />} />
            <Route path="waste-bank" element={<PermissionGuard menuId="waste-bank"><WasteBankManagement /></PermissionGuard>} />
            <Route path="savings-bank" element={<PermissionGuard menuId="savings-bank"><SavingsBankManagement /></PermissionGuard>} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="scores" element={<ScoresManagement />} />
            <Route path="conduct" element={<ConductManagement />} />
            <Route path="documents" element={<PermissionGuard menuId="documents"><DocumentsManagement /></PermissionGuard>} />
            <Route path="educational-hub" element={<PermissionGuard menuId="educational-hub"><EduHubManagement /></PermissionGuard>} />
            <Route path="games" element={<PermissionGuard menuId="games"><GamePlayDashboard /></PermissionGuard>} />
            <Route path="analytics" element={<PermissionGuard menuId="analytics"><AnalyticsManagement /></PermissionGuard>} />
            {/* อื่นๆ */}
            <Route path="admissions" element={<AdmissionsManagement />} />
            <Route path="messages" element={<MessagesManagement />} />
            <Route path="faq" element={<PermissionGuard menuId="faq"><FaqManagement /></PermissionGuard>} />
            {/* ระบบ */}
            <Route path="system-overview" element={<PermissionGuard menuId="system-overview"><SystemOverview /></PermissionGuard>} />
            <Route path="ai-assist" element={<AiAssistPanel />} />
            <Route path="line" element={<PermissionGuard menuId="line"><LineFollowersManager /></PermissionGuard>} />
            <Route path="health" element={<HealthManagement />} />
            <Route path="dmc-export" element={<PermissionGuard menuId="dmc-export"><DmcExportPanel /></PermissionGuard>} />
            <Route path="pdpa" element={<PermissionGuard menuId="pdpa"><PdpaDashboard /></PermissionGuard>} />
            <Route path="papor" element={<PaporGenerator />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="dashboard-school" element={<PermissionGuard menuId="dashboard-school"><DashboardSchoolManagement /></PermissionGuard>} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
