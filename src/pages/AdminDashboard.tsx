import { lazy, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import ProtectedRoute from '@/components/admin/shared/ProtectedRoute';

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

// Loading spinner สำหรับ lazy-loaded admin pages
const AdminPageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
    </div>
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
            <Route path="homepage-layout" element={<HomepageManager />} />
            <Route path="testimonials" element={<TestimonialsManagement />} />
            <Route path="partners" element={<PartnersManagement />} />
            <Route path="settings" element={<SettingsManagement />} />
            <Route path="theme" element={<ThemeManager />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="hero-slides" element={<HeroSlidesManagement />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="gallery" element={<GalleryManagement />} />
            <Route path="events" element={<EventsManagement />} />
            {/* ศูนย์เอกสารโรงเรียน */}
            <Route path="docs-hub" element={<DocsHubDashboard />} />
            <Route path="budget" element={<BudgetManagement />} />
            <Route path="sar" element={<SarManagement />} />
            <Route path="ics" element={<IcsManagement />} />
            <Route path="action-plan" element={<ActionPlanManagement />} />
            <Route path="doc-templates" element={<DocTemplatesManagement />} />
            <Route path="student-docs" element={<StudentDocsHub />} />
            {/* งานสารบรรณ */}
            <Route path="saraban" element={<SarabanDashboard />} />
            <Route path="incoming-letters" element={<IncomingLetters />} />
            <Route path="outgoing-letters" element={<OutgoingLetters />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="meetings" element={<MeetingsManagement />} />
            {/* HR */}
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="training" element={<TrainingManagement />} />
            <Route path="pa" element={<PAManagement />} />
            {/* ฝ่ายวิชาการ */}
            <Route path="academic" element={<AcademicManagement />} />
            {/* ข้อมูลโรงเรียน */}
            <Route path="milestones" element={<MilestonesManagement />} />
            <Route path="facilities" element={<FacilitiesManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="teachers" element={<TeacherListManagement />} />
            <Route path="administrators" element={<AdministratorsManagement />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="curriculum" element={<CurriculumManagement />} />
            <Route path="activities" element={<ActivitiesManagement />} />
            {/* ระบบบริการ */}
            <Route path="scan" element={<ScanRecorder />} />
            <Route path="waste-bank" element={<WasteBankManagement />} />
            <Route path="savings-bank" element={<SavingsBankManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="scores" element={<ScoresManagement />} />
            <Route path="conduct" element={<ConductManagement />} />
            <Route path="documents" element={<DocumentsManagement />} />
            <Route path="educational-hub" element={<EduHubManagement />} />
            <Route path="games" element={<GamePlayDashboard />} />
            <Route path="analytics" element={<AnalyticsManagement />} />
            {/* อื่นๆ */}
            <Route path="admissions" element={<AdmissionsManagement />} />
            <Route path="messages" element={<MessagesManagement />} />
            <Route path="faq" element={<FaqManagement />} />
            {/* ระบบ */}
            <Route path="system-overview" element={<SystemOverview />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="dashboard-school" element={<DashboardSchoolManagement />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
