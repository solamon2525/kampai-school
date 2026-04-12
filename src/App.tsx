import { lazy, Suspense } from "react";
import { usePageView } from "@/hooks/usePageView";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
const PageBuilder = lazy(() => import("./pages/admin/PageBuilder"));
const Documents = lazy(() => import("./pages/Documents"));
const WasteBank = lazy(() => import("./pages/WasteBank"));

// Loading spinner ขณะรอโหลด page
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const PageViewTracker = () => {
  usePageView();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/admin/page-builder" element={<PageBuilder />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<AcademicCalendar />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/waste-bank" element={<WasteBank />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
