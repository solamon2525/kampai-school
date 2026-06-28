import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { usePageView } from "@/hooks/usePageView";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortalProtectedRoute } from "./components/portal/PortalProtectedRoute";
import { RuntimeThemeStyles } from "./components/theme/RuntimeThemeStyles";
import DynamicFavicon from "./components/DynamicFavicon";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CommandPaletteProvider } from "./hooks/useCommandPalette";
import { ActiveChildProvider } from "./hooks/useActiveChild";

// หน้าแรกโหลดทันที (Critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Helper for dynamic imports to reload the page when a chunk loading error occurs
// (common in PWAs or when a new version is deployed and client holds old asset cache)
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    const hasRetried = window.sessionStorage.getItem("retry-lazy-load");
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem("retry-lazy-load");
      return component;
    } catch (error) {
      if (!hasRetried) {
        window.sessionStorage.setItem("retry-lazy-load", "true");
        console.error("Dynamic import failed, forcing reload to get latest version...", error);
        window.location.reload();
        return new Promise(() => {}); // Wait for reload
      }
      throw error; // If already retried, let ErrorBoundary catch it
    }
  });
};

// หน้าอื่นๆ โหลดแบบ lazy เพื่อลดขนาด bundle เริ่มต้น
const About = lazyWithRetry(() => import("./pages/About"));
const Administrators = lazyWithRetry(() => import("./pages/Administrators"));
const Staff = lazyWithRetry(() => import("./pages/Staff"));
const StaffDetail = lazyWithRetry(() => import("./pages/StaffDetail"));
const Students = lazyWithRetry(() => import("./pages/Students"));
const Curriculum = lazyWithRetry(() => import("./pages/Curriculum"));
const News = lazyWithRetry(() => import("./pages/News"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Gallery = lazyWithRetry(() => import("./pages/Gallery"));
const Events = lazyWithRetry(() => import("./pages/Events"));
const AcademicCalendar = lazyWithRetry(() => import("./pages/AcademicCalendar"));
const Enrollment = lazyWithRetry(() => import("./pages/Enrollment"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const PageBuilder = lazyWithRetry(() => import("./pages/admin/PageBuilder"));
const Documents = lazyWithRetry(() => import("./pages/Documents"));
const WasteBank = lazyWithRetry(() => import("./pages/WasteBank"));
const WasteBankStats = lazyWithRetry(() => import("./pages/WasteBankStats"));
const RewardsCatalog = lazyWithRetry(() => import("./pages/RewardsCatalog"));
const SavingsBank = lazyWithRetry(() => import("./pages/SavingsBank"));
const HallOfFame = lazyWithRetry(() => import("./pages/HallOfFame"));
const DailyQuestStats = lazyWithRetry(() => import("./pages/DailyQuestStats"));
const OnlineArena = lazyWithRetry(() => import("./pages/OnlineArena"));
const TrainingShowcasePublic = lazyWithRetry(() => import("./pages/TrainingShowcase"));
const EducationalHub = lazyWithRetry(() => import("./pages/EducationalHub"));
const EducationalHubTeacher = lazyWithRetry(() => import("./pages/EducationalHubTeacher"));
const PlayGame = lazyWithRetry(() => import("./pages/PlayGame"));
const GameDashboard = lazyWithRetry(() => import("./pages/GameDashboard"));
const EnglishQuest = lazyWithRetry(() => import("./pages/EnglishQuest"));
const StudentHeroPublic = lazyWithRetry(() => import("./pages/StudentHeroPublic"));

// Portals
const TeacherDashboard = lazyWithRetry(() => import("./pages/teacher/TeacherDashboard"));
const TeacherSchedule = lazyWithRetry(() => import("./pages/teacher/TeacherSchedule"));
const TeacherAttendance = lazyWithRetry(() => import("./pages/teacher/TeacherAttendance"));
const TeacherScores = lazyWithRetry(() => import("./pages/teacher/TeacherScores"));
const TeacherRewardsApproval = lazyWithRetry(() => import("./pages/teacher/TeacherRewardsApproval"));
const TeacherEduHubManager = lazyWithRetry(() => import("./pages/teacher/TeacherEduHubManager"));
const TeacherCctv = lazyWithRetry(() => import("./pages/teacher/TeacherCctv"));
const TeacherMultiplyRaceDashboard = lazyWithRetry(() => import("./pages/teacher/TeacherMultiplyRaceDashboard"));
const TeacherMasteryHeatmap = lazyWithRetry(() => import("./pages/teacher/TeacherMasteryHeatmap"));
const ParentDashboard = lazyWithRetry(() => import("./pages/parent/ParentDashboard"));
const ParentChildView = lazyWithRetry(() => import("./pages/parent/ParentChildView"));
const ParentMastery = lazyWithRetry(() => import("./pages/parent/ParentMastery"));
const MyLearning = lazyWithRetry(() => import("./pages/student/MyLearning"));
const PdpaSelfView = lazyWithRetry(() => import("./components/parent/PdpaSelfView").then(m => ({ default: m.PdpaSelfView })));
const ChatPage = lazyWithRetry(() => import("./components/chat/ChatPage").then(m => ({ default: m.ChatPage })));
const Donate = lazyWithRetry(() => import("./pages/Donate"));
const ParentAssignments = lazyWithRetry(() => import("./components/parent/ParentAssignments").then(m => ({ default: m.ParentAssignments })));
const ConferenceBooking = lazyWithRetry(() => import("./components/parent/ConferenceBooking").then(m => ({ default: m.ConferenceBooking })));
const AssignmentManagement = lazyWithRetry(() => import("./components/teacher/AssignmentManagement").then(m => ({ default: m.AssignmentManagement })));
const ConferenceSlotsManager = lazyWithRetry(() => import("./components/teacher/ConferenceSlotsManager").then(m => ({ default: m.ConferenceSlotsManager })));
const Alumni = lazyWithRetry(() => import("./pages/Alumni"));
const SurveyResponse = lazyWithRetry(() => import("./pages/SurveyResponse"));

// Non-critical UX components — lazy เพื่อลด eager bundle
const InstallBanner = lazyWithRetry(() => import("./components/pwa/InstallBanner").then(m => ({ default: m.InstallBanner })));
const OfflineIndicator = lazyWithRetry(() => import("./components/shared/OfflineIndicator").then(m => ({ default: m.OfflineIndicator })));
const PushPermissionBanner = lazyWithRetry(() => import("./components/shared/PushPermissionBanner").then(m => ({ default: m.PushPermissionBanner })));
const PWAUpdatePrompt = lazyWithRetry(() => import("./components/shared/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const OfflineQueueIndicator = lazyWithRetry(() => import("./components/shared/OfflineQueueIndicator").then(m => ({ default: m.OfflineQueueIndicator })));
const CommandPalette = lazyWithRetry(() => import("./components/shared/CommandPalette").then(m => ({ default: m.CommandPalette })));

// Loading placeholder ขณะรอโหลด page (shimmer + logo placeholder — ดูนุ่มกว่า spinner)
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
      <div className="h-2 w-20 rounded-full bg-muted/60 animate-pulse" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageViewTracker = () => {
  usePageView();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <RuntimeThemeStyles />
      <DynamicFavicon />
      <Toaster />
      <Sonner />
      <Suspense fallback={null}>
        <InstallBanner />
        <OfflineIndicator />
        <PushPermissionBanner />
        <OfflineQueueIndicator />
        <PWAUpdatePrompt />
      </Suspense>
      <ErrorBoundary>
      <BrowserRouter>
        <CommandPaletteProvider>
        <ActiveChildProvider>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
        <PageViewTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/administrators" element={<Administrators />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/:id" element={<StaffDetail />} />
            <Route path="/students" element={<Students />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            {/* Admin dashboard with nested route support */}
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
            <Route path="/admin/page-builder" element={<PageBuilder />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<AcademicCalendar />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/waste-bank" element={<WasteBank />} />
            <Route path="/waste-bank/stats" element={<WasteBankStats />} />
            <Route path="/waste-bank/rewards" element={<RewardsCatalog />} />
            <Route path="/savings-bank" element={<SavingsBank />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/games/daily-quest" element={<DailyQuestStats />} />
            <Route path="/games/arena" element={<OnlineArena />} />
            <Route path="/training-showcase" element={<TrainingShowcasePublic />} />
            <Route path="/educational-hub" element={<EducationalHub />} />
            <Route path="/educational-hub/:staffId" element={<EducationalHubTeacher />} />
            {/* Short URL alias — /h/<username|uuid> */}
            <Route path="/h/:identifier" element={<EducationalHubTeacher />} />
            <Route path="/play/:gameSlug" element={<PlayGame />} />
            <Route path="/play/:gameSlug/dashboard" element={<GameDashboard />} />
            {/* Student Self-Dashboard — เข้าด้วย student_code (public) */}
            <Route path="/my" element={<MyLearning />} />
            <Route path="/english-quest" element={<EnglishQuest />} />
            <Route path="/hero" element={<StudentHeroPublic />} />
            <Route path="/hero/:studentId" element={<StudentHeroPublic />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/surveys/:id" element={<SurveyResponse />} />

            {/* Teacher Portal */}
            <Route path="/teacher" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherDashboard /></PortalProtectedRoute>
            } />
            <Route path="/teacher/schedule" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherSchedule /></PortalProtectedRoute>
            } />
            <Route path="/teacher/attendance" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherAttendance /></PortalProtectedRoute>
            } />
            <Route path="/teacher/scores" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherScores /></PortalProtectedRoute>
            } />
            <Route path="/teacher/rewards-approval" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherRewardsApproval /></PortalProtectedRoute>
            } />
            <Route path="/teacher/edu-hub" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherEduHubManager /></PortalProtectedRoute>
            } />
            <Route path="/teacher/cctv" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherCctv /></PortalProtectedRoute>
            } />
            <Route path="/teacher/games/multiply-race" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherMultiplyRaceDashboard /></PortalProtectedRoute>
            } />
            <Route path="/teacher/mastery" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><TeacherMasteryHeatmap /></PortalProtectedRoute>
            } />
            <Route path="/teacher/chat" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><ChatPage /></PortalProtectedRoute>
            } />
            <Route path="/teacher/assignments" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><AssignmentManagement /></PortalProtectedRoute>
            } />
            <Route path="/teacher/conferences" element={
              <PortalProtectedRoute allow={['teacher', 'admin']}><ConferenceSlotsManager /></PortalProtectedRoute>
            } />

            {/* Parent Portal */}
            <Route path="/parent" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentDashboard /></PortalProtectedRoute>
            } />
            <Route path="/parent/attendance" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentChildView view="attendance" /></PortalProtectedRoute>
            } />
            <Route path="/parent/scores" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentChildView view="scores" /></PortalProtectedRoute>
            } />
            <Route path="/parent/conduct" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentChildView view="conduct" /></PortalProtectedRoute>
            } />
            <Route path="/parent/waste-bank" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentChildView view="waste-bank" /></PortalProtectedRoute>
            } />
            <Route path="/parent/savings-bank" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentChildView view="savings-bank" /></PortalProtectedRoute>
            } />
            <Route path="/parent/mastery" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentMastery /></PortalProtectedRoute>
            } />
            <Route path="/parent/privacy" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><PdpaSelfView /></PortalProtectedRoute>
            } />
            <Route path="/parent/chat" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ChatPage /></PortalProtectedRoute>
            } />
            <Route path="/parent/assignments" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ParentAssignments /></PortalProtectedRoute>
            } />
            <Route path="/parent/conferences" element={
              <PortalProtectedRoute allow={['parent', 'admin']}><ConferenceBooking /></PortalProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ActiveChildProvider>
        </CommandPaletteProvider>
      </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;
