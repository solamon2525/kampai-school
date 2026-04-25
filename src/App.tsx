import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { usePageView } from "@/hooks/usePageView";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortalProtectedRoute } from "./components/portal/PortalProtectedRoute";

// หน้าแรกโหลดทันที (Critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// หน้าอื่นๆ โหลดแบบ lazy เพื่อลดขนาด bundle เริ่มต้น
const About = lazy(() => import("./pages/About"));
const Administrators = lazy(() => import("./pages/Administrators"));
const Staff = lazy(() => import("./pages/Staff"));
const Students = lazy(() => import("./pages/Students"));
const Curriculum = lazy(() => import("./pages/Curriculum"));
const News = lazy(() => import("./pages/News"));
const Contact = lazy(() => import("./pages/Contact"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Events = lazy(() => import("./pages/Events"));
const AcademicCalendar = lazy(() => import("./pages/AcademicCalendar"));
const Enrollment = lazy(() => import("./pages/Enrollment"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const WasteBank = lazy(() => import("./pages/WasteBank"));

// Portals
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherSchedule = lazy(() => import("./pages/teacher/TeacherSchedule"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherScores = lazy(() => import("./pages/teacher/TeacherScores"));
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentChildView = lazy(() => import("./pages/parent/ParentChildView"));

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

const queryClient = new QueryClient();

const PageViewTracker = () => {
  usePageView();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageViewTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/administrators" element={<Administrators />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/students" element={<Students />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            {/* Admin dashboard with nested route support */}
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<AcademicCalendar />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/waste-bank" element={<WasteBank />} />

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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;
