import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Info,
    Server,
    Database,
    Cloud,
    Layers,
    CheckCircle2,
    Lightbulb,
    Clock,
    Code2,
    Globe,
    HardDrive,
    Zap,
    GitBranch,
    Package,
    Shield,
    Download,
    FileJson,
    FileText,
    Printer,
    Copy,
    Check,
    Rocket,
} from 'lucide-react';
import { useState } from 'react';

const techStack = {
    frontend: [
        { name: 'React 18', desc: 'UI Framework' },
        { name: 'TypeScript 5.8', desc: 'ภาษาหลัก' },
        { name: 'Vite', desc: 'Build Tool' },
        { name: 'TailwindCSS 3', desc: 'Styling' },
        { name: 'shadcn/ui', desc: 'UI Components (Radix UI)' },
        { name: 'React Router v6', desc: 'Routing + Lazy Loading' },
        { name: 'TanStack Query v5', desc: 'Data Fetching & Cache' },
        { name: 'TanStack Table v8', desc: 'Data Tables' },
        { name: 'React Hook Form + Zod', desc: 'Form & Validation' },
        { name: 'Recharts', desc: 'Charts & Analytics' },
        { name: 'Framer Motion', desc: 'Animations' },
        { name: 'Custom PageBuilder', desc: 'Visual Page Builder (text/image/banner/stats/map blocks)' },
        { name: 'dnd-kit', desc: 'Drag & Drop' },
        { name: 'Uppy', desc: 'File Upload UI' },
        { name: 'React Quill', desc: 'Rich Text Editor' },
        { name: 'react-photo-album', desc: 'Photo Gallery' },
        { name: 'yet-another-react-lightbox', desc: 'Lightbox Viewer' },
        { name: 'Lucide React', desc: 'Icons' },
        { name: 'html5-qrcode', desc: 'QR Code Scanner (Waste Bank — กล้องสแกน)' },
        { name: 'react-qr-code', desc: 'QR Code Generator (Parent Portal — แสดง QR นักเรียน)' },
        { name: 'react-webcam', desc: 'Webcam Access (QR scanning flow)' },
        { name: 'DOMPurify', desc: 'HTML Sanitization (rich text display)' },
        { name: 'date-fns', desc: 'Date Utilities (Thai locale)' },
        { name: 'embla-carousel-react', desc: 'Carousel (Hero Slides)' },
        { name: 'cmdk', desc: 'Command Palette (installed — Sprint 2 roadmap)' },
    ],
    backend: [
        { name: 'Supabase', desc: 'PostgreSQL + Auth + Storage + Edge Functions' },
        { name: 'PostgreSQL', desc: 'Relational Database (via Supabase)' },
        { name: 'Row Level Security', desc: 'Database Access Control' },
        { name: 'Deno (Edge Functions)', desc: 'Serverless Functions Runtime' },
        { name: 'Resend API', desc: 'Email Notification Service' },
    ],
    deployment: [
        { name: 'Vercel', desc: 'Frontend Hosting + Cron Jobs' },
        { name: 'Supabase Free Plan', desc: '500 MB DB / 1 GB Storage' },
        { name: 'GitHub', desc: 'Source Code Repository' },
    ],
};

const featureGroups = [
    {
        label: 'เนื้อหาเว็บไซต์',
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        features: ['จัดการข่าวสาร + ปักหมุด', 'แกลเลอรี่อัลบั้มรูปภาพ', 'ปฏิทินกิจกรรม', 'จัดการเอกสารดาวน์โหลด', 'FAQ', 'Hero Slides หน้าหลัก', 'Countdown เปิดเทอม Real-time', 'จัดการหน้าแรก (Homepage Layout Manager — DnD zones + live preview)'],
    },
    {
        label: 'บุคลากรและนักเรียน',
        color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
        features: ['ข้อมูลผู้บริหาร', 'ครูและบุคลากร', 'ฐานข้อมูลนักเรียน', 'ความสำเร็จนักเรียน', 'กิจกรรมชุมนุม', 'สภานักเรียน'],
    },
    {
        label: 'การศึกษา',
        color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        features: ['หลักสูตรการเรียน (4 สาย)', 'กิจกรรมเสริมหลักสูตร', 'ระบบเช็คชื่อนักเรียน + รายงาน', 'ระบบรับสมัครนักเรียนออนไลน์'],
    },
    {
        label: 'ฝ่ายวิชาการ',
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        features: ['ตารางสอน (Grid 5×8 คาบ)', 'แผนการสอน + Approval', 'ทะเบียนสื่อการสอน', 'ปฏิทินวิชาการ', 'นักเรียนพิเศษ', 'บันทึกการแนะแนว', 'บันทึกการนิเทศ'],
    },
    {
        label: 'งานสารบรรณ',
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        features: ['หนังสือรับ', 'หนังสือส่ง', 'คำสั่ง/ประกาศ', 'บันทึกการประชุม', 'Dashboard ภาพรวม'],
    },
    {
        label: 'งานบุคคล (HR)',
        color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        features: ['ระบบการลา', 'บันทึกการอบรม/พัฒนาตนเอง', 'ประเมินผลงาน PA Assessment'],
    },
    {
        label: 'ระบบบริการ',
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        features: ['ธนาคารขยะ (Waste Bank)', 'กล่องข้อความจากผู้ติดต่อ', 'Email Subscribers', 'แจ้งผู้ปกครองเมื่อนักเรียนขาด (SMS)'],
    },
    {
        label: 'ระบบ/เครื่องมือ',
        color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
        features: ['Custom Page Builder (About/Contact — text/image/banner/stats/map)', 'Analytics ดูสถิติผู้เข้าชม (Device/Peak Hours/Referrer)', 'ตั้งค่าโรงเรียน (100+ fields)', 'User Roles & Permissions (admin/teacher/parent/viewer)', 'จัดการเว็บไซต์ผ่าน Admin', 'Export CSV + Print รายงาน', 'Notification Center (Realtime)', 'RLS Hardened (45 tables)'],
    },
    {
        label: 'Portal ครู/ผู้ปกครอง',
        color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        features: ['Portal ครู: Dashboard, ตารางสอน, เช็คชื่อ, คะแนน', 'Portal ผู้ปกครอง: ดูการมาเรียน/คะแนน/ความประพฤติ/ธนาคารขยะของลูก', 'Protected Routes ตาม role', 'Smart Login Redirect (admin/teacher/parent)'],
    },
];

const dbGroups = [
    { label: 'เนื้อหา', tables: ['news', 'news_categories', 'gallery_albums', 'gallery_photos', 'events', 'documents', 'document_categories'] },
    { label: 'บุคลากร', tables: ['administrators', 'staff', 'students', 'attendance_records', 'student_council', 'student_achievements', 'student_activities', 'student_stats', 'grade_data', 'score_records', 'conduct_scores'] },
    { label: 'บริการ', tables: ['admissions', 'contact_messages', 'waste_categories', 'waste_transactions', 'curriculum_programs', 'curriculum_activities', 'faq', 'email_subscribers'] },
    { label: 'สารบรรณ', tables: ['incoming_letters', 'outgoing_letters', 'orders_announcements', 'meetings'] },
    { label: 'HR', tables: ['leave_requests', 'training_records', 'pa_assessments'] },
    { label: 'วิชาการ', tables: ['class_schedules', 'lesson_plans', 'teaching_materials', 'academic_calendar', 'student_special_needs', 'counseling_records', 'supervision_records'] },
    { label: 'ระบบ', tables: ['school_settings', 'page_views', 'milestones', 'facilities', 'notifications', 'user_roles'] },
];

const roadmap = [
    // 🎨 UX/UI Beautification — เน้นทำให้ระบบสวย น่าใช้
    { icon: '⌘', title: 'Command Palette (Ctrl+K)', desc: 'ค้นหา/นำทาง/สั่งการด้วยคีย์บอร์ด สไตล์ Linear/Notion — เร็วขึ้น 10x' },
    { icon: '🔍', title: 'Global Fuzzy Search', desc: 'ค้นข้ามทั้งระบบแบบ real-time — นักเรียน/ข่าว/เอกสาร/กิจกรรม/คำสั่ง' },
    { icon: '🎨', title: 'Homepage Redesign (Motion + Parallax)', desc: 'หน้าแรกระดับ modern: Video Background, Parallax Scroll, Animated Hero' },
    { icon: '🎯', title: 'Onboarding Tour', desc: 'Intro tour guide ขึ้นอัตโนมัติสำหรับ admin/teacher/parent คนแรก (react-joyride)' },
    { icon: '📊', title: 'Customizable Dashboard Widgets', desc: 'ลาก-วาง widgets เลือกข้อมูลที่อยากเห็นบน Dashboard ตามบทบาท' },
    { icon: '🏆', title: 'Student Gamification + Badges', desc: 'ระบบเหรียญ/ความสำเร็จ: Waste Bank milestones, คะแนนเด่น, ความประพฤติดี' },
    { icon: '📅', title: 'Activity Heatmap (GitHub-style)', desc: 'แสดงการมีส่วนร่วมนักเรียน/ครู รายปีแบบ heatmap calendar' },
    { icon: '🗺️', title: 'Interactive Floor Plan', desc: 'แผนที่โรงเรียน SVG interactive — คลิก hover อาคาร/ห้องดูข้อมูลได้' },
    { icon: '📧', title: 'Visual Newsletter Builder', desc: 'Drag-drop สร้าง email template + ส่งผ่าน Resend อัตโนมัติเมื่อมีข่าวใหม่' },

    // 🔔 Communication & Integration
    { icon: '💬', title: 'In-app Chat (Teacher ↔ Parent)', desc: 'แชทภายในเว็บ realtime + typing indicator + read receipts' },
    { icon: '📲', title: 'PWA + Push Notifications', desc: 'ติดตั้งเป็นแอปบนมือถือ + Browser push notifications เรียบทุกแพลตฟอร์ม' },
    { icon: '📱', title: 'LINE Messaging API Integration', desc: 'แจ้งผ่าน LINE เมื่อมีข่าว/กิจกรรม/ลูกขาดเรียน (LINE Notify ปิดบริการ เม.ย. 2025 แล้ว — ใช้ Messaging API แทน)' },
    { icon: '📨', title: 'SMS Gateway (จริง)', desc: 'ส่ง SMS ผ่าน provider จริง (ThaiBulkSMS/Twilio) — ไม่ต้อง copy template แล้ว' },
    { icon: '🔗', title: 'Parent Multi-child Linking', desc: 'ผู้ปกครอง 1 account รองรับลูกหลายคน พร้อม child switcher ด้านบน' },
    { icon: '🌐', title: 'Multi-language (TH/EN)', desc: 'Toggle ภาษาไทย/อังกฤษ รองรับ i18n ทั้งเว็บ + รองรับผู้ปกครอง expat' },
    { icon: '📆', title: 'Google Calendar 2-way Sync', desc: 'ซิงค์กิจกรรม/ปฏิทินวิชาการกับ Google Calendar ทั้งสองทาง' },
    { icon: '📑', title: 'Reports Builder (Visual)', desc: 'สร้างรายงานด้วย drag chart + field + date filter ส่งออก PDF/CSV' },
];

const sprintPlan = [
    {
        sprint: '✅ Sprint 1 — Quick Wins ชัดตา (เสร็จแล้ว v1.5.0)',
        duration: '~1 สัปดาห์',
        goal: 'ทำให้ระบบสวยทันทีด้วยการปรับ visual polish ที่ใช้ effort น้อยแต่ผลลัพธ์ชัด',
        badge: 'bg-emerald-600',
        items: [
            { icon: '🌓', title: 'Dark Mode + Theme Switcher', effort: '1 วัน', stack: 'next-themes + shadcn CSS variables' },
            { icon: '🖼️', title: 'Empty State Illustrations', effort: '1 วัน', stack: 'unDraw SVG + EmptyState component' },
            { icon: '✨', title: 'Skeleton Loaders', effort: '1 วัน', stack: 'shadcn Skeleton + react-loading-skeleton' },
            { icon: '🎨', title: 'Homepage Motion Polish', effort: '2 วัน', stack: 'Framer Motion + Parallax' },
        ],
    },
    {
        sprint: 'Sprint 2 — Power User Features',
        duration: '~1 สัปดาห์',
        goal: 'เพิ่มความเร็วในการใช้งานสำหรับ admin/ครู ให้รู้สึกเหมือน Linear/Notion',
        badge: 'bg-blue-500',
        items: [
            { icon: '⌘', title: 'Command Palette (Ctrl+K)', effort: '2 วัน', stack: 'cmdk + shadcn Dialog' },
            { icon: '🔍', title: 'Global Fuzzy Search', effort: '2 วัน', stack: 'fuse.js + Supabase multi-table query' },
            { icon: '🎯', title: 'Onboarding Tour', effort: '1 วัน', stack: 'react-joyride + localStorage flag' },
        ],
    },
    {
        sprint: 'Sprint 3 — Engagement & Gamification',
        duration: '~1-2 สัปดาห์',
        goal: 'ทำให้นักเรียน/ครู/ผู้ปกครอง อยากเข้ามาใช้เว็บบ่อยขึ้น',
        badge: 'bg-rose-500',
        items: [
            { icon: '🏆', title: 'Student Gamification + Badges', effort: '3 วัน', stack: 'Migration + badges table + achievement engine' },
            { icon: '📅', title: 'Activity Heatmap', effort: '2 วัน', stack: 'react-calendar-heatmap + aggregate query' },
            { icon: '📊', title: 'Customizable Dashboard Widgets', effort: '3 วัน', stack: 'dnd-kit + user preferences table' },
        ],
    },
    {
        sprint: 'Sprint 4 — Communication & Integration',
        duration: '~2 สัปดาห์',
        goal: 'เชื่อมโยงกับระบบภายนอก + การสื่อสารระหว่างโรงเรียน-ผู้ปกครอง',
        badge: 'bg-emerald-500',
        items: [
            { icon: '💬', title: 'In-app Chat (Teacher ↔ Parent)', effort: '4 วัน', stack: 'Supabase Realtime + messages table' },
            { icon: '📲', title: 'PWA + Push Notifications', effort: '2 วัน', stack: 'vite-plugin-pwa + Web Push API' },
            { icon: '📱', title: 'LINE Messaging API Integration', effort: '2 วัน', stack: 'LINE Messaging API + Edge Function (LINE Notify ปิดแล้ว เม.ย. 2025)' },
            { icon: '📨', title: 'SMS Gateway (จริง)', effort: '2 วัน', stack: 'ThaiBulkSMS/Twilio + Edge Function' },
            { icon: '🔗', title: 'Parent Multi-child Linking', effort: '2 วัน', stack: 'user_children junction table + child switcher' },
        ],
    },
    {
        sprint: 'Sprint 5 — Advanced Features',
        duration: '~2-3 สัปดาห์',
        goal: 'ยกระดับระบบสู่ production-grade + รองรับผู้ใช้กว้างขึ้น',
        badge: 'bg-amber-500',
        items: [
            { icon: '🌐', title: 'Multi-language (TH/EN)', effort: '4 วัน', stack: 'react-i18next + locale files' },
            { icon: '📆', title: 'Google Calendar 2-way Sync', effort: '3 วัน', stack: 'Google OAuth + Calendar API' },
            { icon: '📧', title: 'Visual Newsletter Builder', effort: '3 วัน', stack: 'Maily.to/unlayer + Resend' },
            { icon: '🗺️', title: 'Interactive Floor Plan', effort: '3 วัน', stack: 'SVG + Tooltip + facilities table' },
            { icon: '📑', title: 'Reports Builder (Visual)', effort: '4 วัน', stack: 'dnd-kit + Recharts + jsPDF' },
        ],
    },
];

const versionHistory = [
    {
        version: 'v1.19.0–1.19.9 (Documents Hub + 6 New Modules)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ผสานเนื้อหา school-docs.html mockup (15 หมวด) เข้าระบบหลัก — 6 phases, 11 migrations (049-059), build verified ทุก phase',
            'Phase 1: Docs Hub Landing — /admin/dashboard/docs-hub — 15 cat grid + KPI ribbon (urgent/pending/active/meetings/training/outgoing) + Urgent list (incoming ด่วน + outgoing รอลงนาม + leave รออนุมัติ) — chunk 12 KB',
            'Phase 2: Document Tracking Timeline — letter_tracking_logs + DB trigger บน incoming/outgoing/leave + RPC add_tracking_note + TrackingTimeline.tsx (PersonAvatar + Mustache-light note input) ใส่ใน IncomingLetters/OutgoingLetters edit dialog',
            'Phase 3: e-Signature — react-signature-canvas + signatures table + storage bucket signatures + SignaturePad/Dialog/List components — wire LeaveManagement (อนุมัติบังคับลงนาม) + OutgoingLetters (รอลงนาม → ส่งแล้ว)',
            'Phase 4A: Budget — budget_categories + budget_transactions + v_budget_summary VIEW + KpiRibbon (งบ/เบิก/ผูกพัน/คงเหลือ) + progress bar ต่อหมวด',
            'Phase 4B: SAR — sar_standards (seed 3) + sar_indicators + sar_assessments (level 1-5) + sar_evidence_files + bucket sar-evidence (signed 7d)',
            'Phase 4C: ICS — ics_forms ปย.1/ปย.2/ปย.3 + content jsonb (schema-flexible) + 3-column overview + JSON editor',
            'Phase 4D: Action Plan — action_plan_projects + milestones + responsible_staff_id FK (PersonAvatar) + formatThaiDateRange',
            'Phase 4E: Doc Templates — seed 12 ฟอร์ม (หนังสือราชการ/ใบลา/บันทึก/เชิญประชุม/รายงานประชุม/คำสั่ง/ประกาศ/เกียรติบัตร/จดหมายผู้ปกครอง/ทัศนศึกษา/จัดซื้อ/ID Plan) + Mustache-style renderer + window.open print',
            'Phase 4F: Student Documents sub-hub — 6 หมวด (ทะเบียน/ปพ./SDQ/อาหาร/เยี่ยมบ้าน/ดูแลช่วยเหลือ) + student_documents + home_visits + sdq_responses + bucket student-docs (signed 30d)',
            'Phase 5: Hub aggregation — v_recent_documents_unified (10 sources ใน 30 วัน) + v_aggregated_calendar (meetings+training+leave+projects) + RecentActivityFeed component ใส่ใน Hub',
            'Phase 6: SystemOverview versionHistory + final build',
            'Bundle: ทุก module chunk แยก 5-12 KB gzip — total bundle เพิ่มน้อย เพราะ shared docs-hub components reuse ข้าม module',
        ],
    },
    {
        version: 'v1.18.0 (Staff Detail Page — per-teacher training showcase)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '/staff/:id: เปลี่ยน modal เป็น page เต็ม สำหรับครู+บุคลากรสนับสนุน — Hero (PersonAvatar 32-40 + ribbon ตำแหน่ง + badges วิชา/แผนก/วิทยฐานะ + contact ปุ่มทอง)',
            'ProfileCard: วุฒิ · วิชาเอก · การศึกษา · ประสบการณ์ · extra_info (grid 2 คอลัมน์) — แสดงเฉพาะที่มีข้อมูล',
            'Stats KPI: เกียรติบัตร (amber) + ชั่วโมงรวม (violet) + ประเภท (emerald) — gradient tile palette แต่ละสี',
            'Certificate showcase รายครู: default = Spotlight + Strip + ViewModeSwitcher สลับ 5 modes (Grid/Bento/Spotlight/Polaroid/Timeline) ครบ',
            'CTA gradient gold "ดูประวัติ + เกียรติบัตร →" หลัง flip card ของครู+support → /staff/:id (admin/ผู้บริหาร ยังใช้ modal เดิม เพราะแยก table)',
            'Empty state: ครูที่ไม่มี cert → "ยังไม่มีเกียรติบัตรที่เผยแพร่" + icon Award',
            'DB: VIEW training_per_staff_view (Migration 048) — เปิดเผย staff_id เพื่อ filter รายคน, ยัง anonymize อย่างอื่น (security_invoker)',
            'Service: staffService.getById + trainingPublicService.getByStaff — เรียกขนาน Promise.all',
            'Routing: lazy /staff/:id + PageLoader fallback + SEOHead ด้วยชื่อครู',
        ],
    },
    {
        version: 'v1.17.0 (Training Showcase — multi-view + motion polish)',
        date: '',
        badge: 'bg-fuchsia-600',
        items: [
            'ViewModeSwitcher: 5 modes (Grid + Bento + Spotlight + Polaroid + Timeline) — toggle bar ใน toolbar ของแท็บภาพรวม + public /training-showcase',
            'Bento Grid: 6-col + slot pattern + stat tiles (ชม./รายการ/ครู) แทรกระหว่าง cert — สไตล์ Apple/Notion 2024-25',
            'Spotlight + Strip: cert ใหญ่ + AnimatePresence + auto-rotate 6s + progress bar + thumbnail snap strip ด้านล่าง + pause/play',
            'Polaroid Wall: deterministic rotation hash(id) -4° ถึง +4° + cork-board gradient bg + rose pin + hover straighten + scale + zIndex raise',
            'Timeline Horizontal: snap-x ตามปีพ.ศ. + sticky year markers + ChevronLeft/Right + dot indicators',
            'Framer Motion: whileInView stagger fade-in (delay clamp 0.45s กัน lag list ยาว) + AnimatePresence ใน Spotlight + Polaroid wiggle',
            'CursorFollower (admin only, lg+): PersonAvatar floating ตาม cursor ด้วย useSpring stiffness 350 damping 30 — hidden บน touch/mobile + respect prefers-reduced-motion',
            'Confetti on hover (admin only): canvas-confetti lazy-loaded → trigger เมื่อ hover cert hours ≥ 16 (debounced 5s/id) + origin = cursor position (track global mousemove)',
            'Dark mode toggle: scoped to showcase เท่านั้น (.dark class wrapper) + localStorage persist → ไม่กระทบหน้าอื่น',
            'Dependencies: + canvas-confetti 1.9.4 + @types/canvas-confetti (lazy import — ไม่กระทบ main bundle)',
        ],
    },
    {
        version: 'v1.16.0 (Training — OCR + Charts + Embed widget)',
        date: '',
        badge: 'bg-violet-700',
        items: [
            'OCR auto-fill: ปุ่ม "อ่านอัตโนมัติจากรูป" ใน TrainingManagement form — Tesseract.js lazy-loaded (tha+eng worker) → parse course/date/hours จาก cert image → prefill ฟอร์ม (ครูตรวจก่อน save) + progress indicator',
            'Recharts trend: BarChart รายการต่อปี + Donut สัดส่วนประเภท ใน TrainingShowcase (admin tab + public /training-showcase) — violet palette + Thai tooltip + responsive',
            'TrainingEmbedWidget บน /staff หลัง stats strip — การ์ดสรุปพัฒนาบุคลากร (3 KPI + sparkline 5 ปี + CTA "ดูทั้งหมด") → /training-showcase',
            'Tesseract.js: dynamic import เท่านั้น → ไม่กระทบ main bundle, Thai trained data cache ใน browser หลังโหลดครั้งแรก',
            'CertOCR parser รองรับ: วันที่ไทย (15 มี.ค. 2568), ISO (2025-03-15), DD/MM/YYYY + เดาชื่อหลักสูตรจาก keyword "เรื่อง/หลักสูตร" หรือบรรทัดยาวสุด + ชั่วโมง "N ชั่วโมง/ชม."',
        ],
    },
    {
        version: 'v1.15.0 (Training Showcase — upload + editorial dashboard)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'แก้ form บันทึกอบรม: certificate_url Input → ImageUpload (school-images/training-certificates/) compressionPreset gallery — admin upload ตรง backward compat ระเบียนเก่ายังแสดงปกติ',
            'หน้า /admin/dashboard/training แท็บใหม่ "ภาพรวม" — Editorial layout (taste-design framework): Hero band slate→violet gradient + 4 KPI (ชม./รายการ/ครู/งบ) + Top 10 ครูพร้อม HoursGauge (ก.ค.ศ. 20 ชม./ปี) + Asymmetric cert grid (lg col-span-2 ทุก 7 ใบ)',
            'Public /training-showcase ใหม่ — aggregated stats ไม่ระบุตัวบุคคล (ผ่าน VIEW training_public_view security_invoker + RPC get_training_public_aggregate ใน migration 047)',
            'Add-ons: Lightbox (yet-another-react-lightbox + Zoom + Captions), Filter ปี/ประเภท/ครู, HoursGauge SVG circular ring (สีตามเปอร์เซ็นต์ rose<amber<emerald), PDF transcript รายบุคคล (print-popup A4 + Sarabun + summary + signoff slots)',
            'src/services/training.service.ts ใหม่ — ปิด gap ที่ component เคยเรียก supabase.from() ตรง (CLAUDE.md rule)',
        ],
    },
    {
        version: 'v1.14.0 (Fast Scanner — FAB + /scan + permission pre-request)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'หน้า /admin/dashboard/scan ใหม่ — สแกน QR แล้วเลือกระบบในหน้าเดียว: ฝากขยะ / ฝากเงิน / ถอนเงิน → compact form prefilled + แสดงยอดคงเหลือ/แต้มของนักเรียนใน sticky header',
            'FAB (Floating Action Button) สีอ่ำพันมุมขวาล่างบนมือถือ — 1 tap จากทุกหน้า admin/teacher เข้าสแกนทันที (lg:hidden — ซ่อนบน desktop)',
            'Camera permission pre-request: Dialog ขออนุญาตกล้องตั้งแต่ login ครั้งแรก → ตอนกดสแกนกล้องเปิดทันที ไม่ต้องผ่าน native prompt (เก็บ flag ใน localStorage ไม่ถามซ้ำ)',
            'Keyboard shortcut Ctrl+Shift+S เปิด /scan จากทุกหน้า admin — สำหรับ user laptop ที่ใช้ keyboard เป็นหลัก',
            'Quick repeat mode (default ติ๊ก) — บันทึก transaction เสร็จ → reset + เปิด scanner ต่อให้นักเรียนคนถัดไปทันที',
            'Sidebar: เพิ่มเมนู "สแกน QR ด่วน" บนสุดของ section ระบบบริการ (ไม่ adminOnly → teacher login เห็นด้วย)',
            'RLS verified: waste_transactions + savings_transactions มี policy (is_admin() OR is_teacher()) สำหรับ INSERT แล้ว — teacher สแกน+บันทึกได้โดยไม่ต้อง migration',
        ],
    },
    {
        version: 'v1.13.1 (QR Scanner UX: beep + preview + โหมดต่อเนื่อง)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'StudentQRScanner: เพิ่ม audio feedback (Web Audio API sine 880Hz 200ms) + haptic vibrate(50ms) ตอน decode สำเร็จ — ครูยืนยันได้โดยไม่ต้องดูจอ',
            'StudentQRScanner: เพิ่มขั้น preview ก่อน prefill — หลัง scan แสดงการ์ดรูปนักเรียน+ชื่อ+ชั้น+เลขที่+รหัส (สีเขียวเด่น) → ครูกด "ยืนยัน" หรือ "สแกนใหม่" กัน scan ผิดคน',
            'Waste/Savings BankManagement: เพิ่ม checkbox "โหมดต่อเนื่อง" — หลังบันทึกรายการสำเร็จเปิด scanner ทันที (เหมาะกับช่วงเช้านักเรียนต่อแถวฝาก)',
            'Scanner lifecycle: stop camera ก่อน fetch student data + รองรับ error case (QR ไม่ตรงนักเรียน) → ปุ่ม "ลองสแกนใหม่"',
        ],
    },
    {
        version: 'v1.13.0 (QR Scan ใช้ร่วม 2 ระบบ + พิมพ์ QR แจกห้อง)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ขยาย QR Scan flow จากธนาคารขยะ → ใช้ได้ทั้งธนาคารพอเพียง: QR ใบเดียวต่อเด็ก (format kampai-student:{uuid}) สแกนรับขยะหรือฝาก/ถอนเงินได้ทั้งคู่ — ครูไม่ต้องเลือกชั้น+ชื่อด้วยมือ',
            'Refactor: QRScannerDialog → src/components/shared/StudentQRScanner.tsx (shared component) + อัปเดต import ใน WasteBankManagement',
            'SavingsBankManagement: เพิ่มปุ่ม "สแกน QR นักเรียน" สีอ่ำพันในแท็บบันทึก — สแกนแล้วชื่อ/ชั้น prefill อัตโนมัติ + แก้ useEffect ที่เคย reset student_id ทุกครั้งที่ class เปลี่ยน (เก็บ id ไว้ถ้ายังอยู่ในชั้นใหม่)',
            'SavingsBankParentView: เพิ่ม QR card หลัง hero — caption ระบุ "QR ใบเดียวใช้ได้กับธนาคารขยะด้วย" ใช้ format เดียวกับ WasteBankParentView',
            'StudentQRSheet ใหม่: หน้า "พิมพ์ QR ทั้งห้อง" (4×8 grid = 32 QR/A4) เข้าผ่านปุ่มใน /admin/dashboard/students เลือกชั้น → preview → print (เส้นประให้ตัด)',
            'Fix: StudentCard QR format → kampai-student:{uuid} (เดิมเป็น plain UUID — scanner accept ทั้ง 2 แต่ระบุ prefix ป้องกัน QR ระบบอื่นชนกัน)',
            'Lesson: ก่อนสร้าง feature ใหม่ ค้นใน codebase ก่อน — QRScannerDialog + react-qr-code + html5-qrcode มีอยู่ครบแล้ว ใช้ซ้ำ ไม่ต้อง add deps ใหม่',
        ],
    },
    {
        version: 'v1.12.0 (Name + Photo Co-display — Rule 14.13)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'User audit พบว่าหลายหน้าแสดงชื่อครู/นักเรียนโดยไม่มีรูปคู่กัน (Scores, Attendance report, Conduct dropdown, RecorderSelect, Parent SavingsBank/WasteBank header) — ทำให้แยกคนยาก ชื่อไทยซ้ำกันบ่อย และไม่สอดคล้องกับหน้าที่ถูกแล้ว (HallOfFame, HomeRightSidebar, Staff directory)',
            'เพิ่ม DESIGN.md Rule 14.13 — Name+Photo Co-display: ทุกที่ที่ render ชื่อครู/ผู้บริหาร/นักเรียน ต้องมี avatar คู่กันเสมอ — บังคับใช้ list/table/dropdown/header/leaderboard ห้าม name-only',
            'สร้าง shared primitive: `src/components/shared/PersonAvatar.tsx` (wrapper รอบ shadcn Avatar — 4 sizes xs/sm/md/lg + aria-label + fallback initials อัตโนมัติ) + `src/lib/avatars.ts` (getInitials util ที่ Staff.tsx ก็ import กลับมาใช้แทน duplicate)',
            'แก้ services ที่ขาด photo_url: `staff.service.ts.getRecorderOptions()` SELECT photo_url เพิ่ม + ชนิด RecorderOption ใน `useRecorderOptions` + WasteStudentSummary type เพิ่ม photo_url + student_code ที่ DB view มีอยู่แล้ว — ConductManagement Student interface เพิ่ม photo_url ให้ตรง service',
            'แก้ component HIGH: ScoresManagement (roster + summary table), AttendanceManagement (report row + student management table + absent students dialog), ConductManagement (student dropdown), RecorderSelect (teacher/admin dropdown) — ทั้งหมดใช้ <PersonAvatar size="sm/xs">',
            'แก้ component MEDIUM: SavingsBankParentView header (avatar lg ring amber), WasteBankParentView summary header (avatar md ring emerald), TeacherListManagement (replace raw <img>+custom fallback ด้วย <PersonAvatar>)',
            'อัปเดต CLAUDE.md Hard Rules + DESIGN-COMPONENTS.md (เพิ่ม PersonAvatar spec + กฎ 10a + 13a ใน AI Hard Rules) เพื่อให้ session/AI ใหม่อ่านแล้วได้ context ครบ',
            'Lesson: Person identity = name + photo เป็น single unit — ถ้า DB มี photo_url แต่ component ไม่ render = bug ของ DESIGN discipline ไม่ใช่ feature work ที่ optional',
        ],
    },
    {
        version: 'v1.11.0 (ธนาคารพอเพียง — Premium UX/UI Redesign)',
        date: '',
        badge: 'bg-slate-900',
        items: [
            'User รายงานหลังแก้ contrast 4 รอบ (v1.10.3-6) ว่า "สีฟ้าอ่อนยังจาง ไม่เอา รีดีไซน์ใหม่ทั้งหมด" — root cause ที่เพิ่งเจอ: `src/index.css` line 62-67 ระบุ `--gold` และ `--navy` ทั้งคู่ถูก repurpose เป็นเฉดเขียวล้วน (HSL 142°) ตามคอมเมนต์ "Custom school variables — repurposed as green tones" → ทุกสีอ่อนที่ tint อยู่ในระบบ (amber-50, sky-100, emerald-50) fight กับ theme green ที่ tint อยู่ทุกที่ → ดูจางตลอด',
            'Redesign ทั้ง UX/UI ของธนาคารพอเพียง 5 ส่วน — ใช้ taste-design skill framework (premium banking aesthetic) + แตกจาก green theme: หลัก dark slate (#0F172A) + saturated amber/gold (#F59E0B) + rose-500 สำหรับถอน — สี solid saturated ไม่ใช้ tinted bg/text คู่กันอีกเลย',
            'SaverTierBadge: 6 tiers ใช้ **saturated gradient panels** (Diamond sky→blue, Platinum slate metallic, Gold amber gradient, Silver zinc, Bronze orange gradient, Beginner emerald) + shadow-md + font-bold + tier icon — contrast WCAG AAA ทุกระดับ',
            'SaverPodium: ลำดับ 2-1-3 พร้อม solid panels (1st amber + crown floating ด้านบน, 2nd silver metallic, 3rd bronze) + รูปนักเรียน floating ด้านบน podium + medal emoji + height ลดหลั่น (44/56/40)',
            'Public /savings-bank: complete rewrite — asymmetric hero split (dark slate gradient ซ้าย + amber rotated floating panel ขวา), animated stats row (4 cards พร้อม featured slate-900 card), Hall of Savers podium + timeline rank 4-10, Recent Activity timeline-style (vertical line + dots), Lookup section (slate-900 header card + amber balance hero), How-it-works zigzag asymmetric (ไม่ใช่ 3 equal cards)',
            'Admin SavingsBankManagement: pill tabs (bg-slate-100 container, active bg-slate-900 text-white), Type toggle solid bg ทั้งบล็อก (active deposit = bg-amber-500 text-amber-950 ring-2, active withdraw = bg-rose-500 text-white ring-2, inactive bg-slate-100) — **แก้ปัญหา toggle มองไม่เห็นที่ user ชี้ใน screenshot**, KpiCard (3 ใบ + 1 KpiHero featured slate-900 ขวาสุด), Summary table zebra + accent column colors, History table solid pills + filter chips',
            'SavingsBankParentView: premium dark hero (slate-900 → amber-900 gradient) + Tier badge ใหญ่, balance text-amber-400 5xl-6xl extrabold (high contrast บน dark), pill tabs, history table consistent กับ admin',
            'Homepage Widget: header bg-slate-900 + eyebrow amber-400 + รูป + tier mini, footer link with ArrowRight icon',
            'Lesson 3: ถ้า theme primary เป็นสีหนึ่ง (เขียว) ห้ามใช้สี semantic ที่เป็น family เดียวกัน (emerald) ใน UI ของ context นั้น แม้จะ convention ของ industry ที่ "green = positive money" — ทำให้ blend ทั้งหมด',
            'Lesson 4: tinted bg + tinted text ของสีเดียวกัน (เช่น bg-amber-100 text-amber-700) จะดู "จาง" แม้ contrast ratio ผ่าน WCAG AA — solution คือ **solid saturated bg + white/dark text** (สูตรของธนาคารจริง) แทน tinted-on-tinted',
            'Scoped exception ใน scope ธนาคารพอเพียง: ใช้ Tailwind colors ตรง (slate/amber/rose) แทน theme tokens (bg-card/text-foreground) เพื่อแก้ green-theme-hell — documented ใน commit',
        ],
    },
    {
        version: 'v1.10.4–5 (ธนาคารพอเพียง — รอบ 2 แก้ muted-foreground ที่ยังจาง)',
        date: '',
        badge: 'bg-amber-100',
        items: [
            'User ยังเห็นสีจางที่หน้า /savings-bank หลัง v1.10.3 — รอบแรกแก้แค่ text-color-700 → 900 แต่ยังเหลือ text-muted-foreground อีกมากที่จาง (opacity ~50% เป็นพื้นฐานของ var) โดยเฉพาะบน amber-tinted bg',
            '/savings-bank (Public): Hero subtitle ใหญ่+leaderboard subtitle muted→foreground/75-80 + font-medium, Rank 4-10 circle bg-muted text-muted → bg-amber-200 text-amber-900 bold, class+date row muted→foreground/70, Activity feed note + row class+date muted→foreground/65-70, Activity/History Badges (ฝาก/ถอน) bg /15→/20 + text-700→900 + font-semibold, Lookup section description + result class name muted→foreground/70-75 medium, Lookup balance card bg /10→/15 + label muted→amber-900 semibold + value 700→900, History table header muted→foreground/80 semibold + bg-muted/40→/60, Date/balance_after columns muted→foreground/75 medium, History amount row 700→900 + font-bold, How-it-works step descriptions muted→foreground/75 medium',
            '/parent/savings-bank (SavingsBankParentView): Tab labels font-medium→semibold + inactive muted→foreground/65, Overview body muted→foreground/80 medium, History table ทุกคอลัมน์ + badges + amounts รูปแบบเดียวกัน, Stat label muted→foreground/70 medium',
            'Lesson 2: text-muted-foreground ใน design system นี้คือ ~50% opacity gray — เหมาะกับ "secondary text" บน bg-card สีขาวที่มี space เยอะ แต่ blend ทันทีบน tinted bg (amber/emerald gradient) หรือ small text/labels — ใช้ text-foreground/70-80 + font-medium ดีกว่าสำหรับ text สำคัญ',
        ],
    },
    {
        version: 'v1.10.3 (ธนาคารพอเพียง — แก้ contrast สีฟอนต์จาง — รอบ 1)',
        date: '',
        badge: 'bg-amber-200',
        items: [
            'User รายงาน "สีฟอนต์ของธนาคารพอเพียง มีบางส่วน สีจาง ไม่ตัดกับหลัง" — text 700-level บน bg 50/100-level แม้ผ่าน WCAG AA numerically แต่ผ่านการรับรู้สายตา (similar warm tones blend) ไม่ตัดเด่นเท่าที่ควร',
            'Bump text 700 → 800/900 + บางจุดเพิ่ม font-medium → font-semibold/bold (pattern เดียวกับ commit ef12092 ที่แก้ medal contrast 700→900 ของธนาคารขยะ)',
            'SaverTierBadge.tsx: 6 tier ทั้งหมด — text 700 → 900 (light) + 300 → 200 (dark) + border 300/60 → 400/60 + font-medium → font-semibold',
            'SavingsBank.tsx public: hero eyebrow badge "เศรษฐกิจพอเพียง" 700→900 + font-semibold, CTA "ตรวจสอบของฉัน" amber-700/10 → amber-700/15 + text-amber-800→900 + font-semibold, stat cards (3 ใบ savers/deposits/gold+) ทั้ง icon และ value 700→900 + bg-100→200 + label text-muted-foreground → text-foreground/80 font-medium, leaderboard rank 4-10 700→900, StudentAvatar fallback 700→900, "ขั้นที่" step labels 700→900 + font-bold',
            'HomeRightSidebar SavingsBankWidget: stats row (savers/deposits) 700→900 (amber + emerald), avatar fallback initial 700→900 + border 200→300, rank deposit count 700→900, footer link "ดูธนาคารพอเพียงทั้งหมด" 700→900 + font-medium→semibold',
            'SavingsBankParentView hero card: gradient bg /10 → /15 (เด่นขึ้น) + border /20 → /30, "ยอดเงินสะสมของ" label text-muted-foreground → text-amber-900 font-semibold, balance 700→900, "ยอดคงเหลือปัจจุบัน" sub-label muted → text-amber-800 font-medium, Stat ฝาก/ถอน emerald-700→900, orange-700→900',
            'Lesson learned: text-amber-700 on bg-amber-100 contrast ~6:1 ผ่าน WCAG AA แต่ visual blend ของ warm tones ทำให้ดูจาง — สำหรับ tinted bg ใช้ 800/900 ดีกว่าเสมอ',
        ],
    },
    {
        version: 'v1.10.2 (ธนาคารพอเพียง — เพิ่มเมนูที่ขาดใน 4 จุด)',
        date: '',
        badge: 'bg-amber-300',
        items: [
            'User รายงาน screenshot ของ `/admin/dashboard` หน้า home "ระบบบริการ (3/7)" ไม่มีการ์ด "ธนาคารพอเพียง" — Quick Menu catalog ที่ขับ card grid ใน admin home ยังไม่มี savings-bank registry แม้ sidebar menu จะมีแล้ว',
            'แก้ 4 จุดที่พลาดใน v1.10.0/v1.10.1: (1) `src/lib/quickMenuCatalog.ts` — เพิ่ม savings-bank ในกลุ่ม "ระบบบริการ" + import Wallet icon (2) `src/lib/menuDefaults.ts` — เพิ่ม savings-bank ใน DEFAULT_MENU_ITEMS services dropdown + shift order ของ documents/enrollment + เพิ่ม "Wallet" ใน MENU_ICON_OPTIONS allowlist (3) `src/components/home/HomeLeftSidebar.tsx` — เพิ่ม link ในเมนู sidebar (4) `src/components/Navbar.tsx` — เพิ่มใน serviceLinks (top bar dropdown)',
            'Note: ถ้า admin เคย save menu config ใน DB (school_settings.menu_config) แล้ว → DB ทับ defaults → ต้องเข้า `/admin/dashboard/menu` เพิ่มเอง (by-design) เปลี่ยน defaults ไม่กระทบ data ที่ customize แล้ว',
            'Bundle impact: +1-2 KB (Wallet icon ใน 4 modules ที่ส่วนใหญ่อยู่ใน main bundle)',
        ],
    },
    {
        version: 'v1.10.1 (ธนาคารพอเพียง — Public stats + Leaderboard + Homepage widget)',
        date: '',
        badge: 'bg-amber-400',
        items: [
            'ขยายระบบ "ธนาคารพอเพียง" จาก core (v1.10.0) → ครบเหมือนธนาคารขยะ — public stats / leaderboard / homepage widget',
            'Migration 046: เพิ่ม `deposit_count` + `withdraw_count` ใน VIEW `savings_student_summary` ผ่าน `COUNT(...) FILTER (WHERE transaction_type=...)` — ใช้สำหรับ leaderboard ranking โดยจำนวนครั้งฝาก (ไม่ใช่จำนวนเงิน — privacy)',
            'Ranking metric: **จำนวนครั้งฝาก** (รางวัลวินัย ไม่ใช่ความรวย) + **Tier system 6 ระดับ** (Diamond 100+/Platinum 50+/Gold 25+/Silver 10+/Bronze 3+/Beginner 1+) — เด็กฝาก 1 ครั้ง 5000 บาท ไม่ควรชนะเด็กฝาก 50 ครั้ง 10 บาท',
            'Public `/savings-bank` overhaul: เพิ่ม 4 sections — animated stats (savers/deposits/gold+) + Hall of Savers leaderboard (Top 3 podium + Rank 4-10 + class filter tabs) + Recent activity feed (ไม่แสดงจำนวนเงิน) + Tier badge ใน lookup result — section "ตรวจสอบยอดของฉัน" ยังแสดงยอดได้ (private, คนกรอก code ของตัวเองรู้จัก kid)',
            'Reusable components ใน `src/components/savings/`: `SaverTierBadge` (6 ระดับ + icon + size sm/md/lg) + `SaverPodium` (top 3 visual 2-1-3 พร้อม StudentAvatar fallback)',
            'Homepage widget: `SavingsBankWidget` ใน `HomeRightSidebar.tsx` mirror `WasteBankWidget` — Top 5 รูป+ชื่อ+ชั้น+tier+ครั้งฝาก, สีทอง (border-amber-100) ต่าง green ของขยะ + register ใน Homepage Manager (`BlockPalette.tsx` + `HomepagePreview.tsx`) ให้ admin เปิด/ปิด/เรียงได้',
            'Admin photo catch-up: เพิ่มรูปนักเรียนใน student selector dropdown + transactions list ของ `SavingsBankManagement` (ใช้ pattern เดียวกับ `WasteBankManagement`)',
            'Service helpers: `getSaverTier(depositCount)` + `savingsSummaryService.getLeaderboard(limit)` (sort by deposit_count DESC, tie-break by total_transactions DESC)',
        ],
    },
    {
        version: 'v1.10.0 (ระบบ "ธนาคารพอเพียง" — ฝาก/ถอนเงินจริงสำหรับนักเรียน)',
        date: '',
        badge: 'bg-amber-500',
        items: [
            'ระบบใหม่: ธนาคารพอเพียง (savings bank) — สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง ใช้เงินจริง (บาท) ฝาก/ถอน — ต่างจากธนาคารขยะที่ใช้แต้ม',
            'Migration `045_savings_bank.sql`: ตาราง `savings_transactions` (deposit/withdraw + balance_after snapshot + recorder FK + term tags) + VIEW `savings_student_summary` (cumulative — ไม่ scope ต่อเทอม เพราะออมเงินไม่ reset) + RLS (public SELECT, teacher/admin write) + 2 RPC public: `lookup_savings_balance(code)` + `get_savings_history(code, limit)` (anon executable, pattern เดียวกับ waste-bank)',
            'Service `src/services/savings.service.ts` mirror waste-bank.service.ts (transactions / summary / lookup) — re-export ผ่าน `services/index.ts`',
            'Admin: `src/components/admin/savings-bank/SavingsBankManagement.tsx` single-file 3-tab (บันทึก / สรุปยอด / ประวัติ) + StatCard ยอดรวมโรงเรียน + Export CSV + reuse `TermBanner` จาก waste-bank (ใช้ termService ร่วมกัน)',
            'Parent/Public: `SavingsBankParentView.tsx` (2-tab overview + history) wire เข้า `ParentChildView` ผ่าน `view="savings-bank"` + public page `src/pages/SavingsBank.tsx` (student lookup ด้วย student_code → ยอด + ประวัติ)',
            'Routes: `/savings-bank` (public) + `/parent/savings-bank` (parent) + `/admin/dashboard/savings-bank` (admin) — Admin sidebar menu entry "ธนาคารพอเพียง" (Wallet icon) ใต้ "ธนาคารขยะ"',
            'ข้อกำหนดความปลอดภัย: ไม่มี self-withdraw RPC สำหรับนักเรียนเอง — ถอนต้องผ่านครู/admin บันทึก (เพราะเงินจริงต้องมีคน verify) Validation: ห้ามถอนเกินยอดคงเหลือ (query summary ก่อน mutate)',
        ],
    },
    {
        version: 'v1.9.6 (Hotfix — TDZ ใน charts-vendor ทำให้ทุกหน้าขาว)',
        date: '',
        badge: 'bg-red-500',
        items: [
            '🚨 หลัง deploy v1.9.3 (Bundle Split) + v1.9.5 (WebP) user รายงาน "ทุกหน้าเข้าไม่ได้ หน้าขาวล้วน" — console พ่น `Uncaught ReferenceError: Cannot access \'S\' before initialization at charts-vendor-*.js`',
            'Root cause: `vite.config.ts` line 34 บังคับ recharts + d3-* ให้อยู่ใน chunk `charts-vendor` เดียวกัน แต่ recharts มี circular deps กับ d3-* ภายใน — เมื่อ esbuild minify chunk ลำดับ declarations พังเป็น Temporal Dead Zone (TDZ)',
            'ทำไมหน้า public ก็พัง: `src/components/ui/chart.tsx` (shadcn) import recharts ทาง dep graph → charts-vendor ถูก eager evaluate ตอน main bundle load → TDZ crash → React ไม่ mount → หน้าขาวทั้งระบบ',
            'Fix: ลบบรรทัด `charts-vendor` เดียวออกจาก manualChunks ใน `vite.config.ts` → Vite auto-split recharts กลับเป็น `generateCategoricalChart-*.js` (334 KB) ที่ co-located กับ component ที่ใช้ (WasteBank/Analytics/Saraban) เหมือนก่อน v1.9.3 — ไม่ TDZ',
            'Vendor chunks อื่นในรอบ v1.9.3 (radix/editor/scanner/motion/uppy/form/query/media/dnd/icons/supabase/utils) ปล่อยไว้ — packages เหล่านี้ไม่มี circular deps แบบ recharts',
            'Lesson learned: ก่อนแตก vendor chunk ต้องตรวจว่า package นั้นมี internal circular dep ไหม (recharts โด่งดังเรื่องนี้) — verify ด้วยการ deploy + browser test ไม่ใช่แค่ Vercel state=READY',
        ],
    },
    {
        version: 'v1.9.5 (Logos PNG → WebP — −63% size, ลบ broken SVG stubs)',
        date: '',
        badge: 'bg-teal-500',
        items: [
            'แปลง `public/logos/{garuda,moe,obec}.png` เป็น `.webp` ผ่าน `scripts/optimize-logos.mjs` (sharp, quality 88, alphaQuality 90): garuda 79.1→30.4 KB (−62%), moe 120.9→55.5 KB (−54%), obec 171.1→52.5 KB (−69%) — รวม 371 KB → 138 KB (−63%)',
            'ลบ PNG files เก่า + 3 broken `.svg` stubs ใน `public/logos/` (เป็น HTML error page จาก Wikimedia ตอนที่ download fail ในอดีต ไม่ใช่ SVG จริง) — clean public/ folder, Vercel ไม่ deploy dead asset',
            'Update 10 references จาก `.png` → `.webp` ใน `HomeMainContent.tsx` (7 จุด) + `PartnersManagement.tsx` (3 จุด)',
            '`pnpm optimize:logos` — regenerate WebP ถ้าเปลี่ยน PNG source (PNG ลบไปแล้ว ถ้าจะ regenerate ต้องเอาจาก git history)',
            'WebP browser support: 98%+ (Chrome/Firefox/Safari 14+/Edge) — ใช้ `<img>` ตรงๆ ไม่ต้อง `<picture>` fallback',
        ],
    },
    {
        version: 'v1.9.4 (Production Polish — QueryClient + ErrorBoundary + console.log cleanup)',
        date: '',
        badge: 'bg-rose-500',
        items: [
            'QueryClient defaults (`src/App.tsx`): staleTime 60s + gcTime 5min + retry 1 + refetchOnWindowFocus false — ทุก useQuery ที่ไม่ override จะใช้ค่านี้, ลด refetch ซ้ำเวลา navigate ไป-กลับใน 1 นาที + ไม่ดึงใหม่ทุก tab focus (ครู/แอดมินสลับ tab LINE/Gmail บ่อย ไม่ควรเปลือง bandwidth)',
            'ErrorBoundary (`src/components/ErrorBoundary.tsx`): class component ใหม่ wrap รอบ BrowserRouter — เมื่อ component crash (render error/undefined access/type mismatch) แสดง fallback UI ภาษาไทย + ปุ่ม "โหลดหน้านี้ใหม่" / "กลับหน้าแรก" แทนหน้าขาวทั้งจอ + dev mode แสดง stack trace ช่วย debug',
            'ลบ `console.log` 3 ตัวใน `src/utils/storageUtils.ts` — debug logs ที่ลืมลบ (success/skip storage deletion) — `console.error` ที่เหลือเก็บไว้ เพราะใช้ diagnose error production จริงๆ',
            'ผลกระทบรวม: cache hit rate สูงขึ้น (ลด Supabase egress + UI responsive ขึ้น), white screen of death หายไป (กัน user เห็นหน้าขาวเมื่อ component error), dev console สะอาดขึ้น',
        ],
    },
    {
        version: 'v1.9.3 (Bundle Split — Main Chunk 787KB → 182KB, -77%)',
        date: '',
        badge: 'bg-violet-500',
        items: [
            'ตั้ง `manualChunks` ใน `vite.config.ts` (function form) — แยก vendor chunks 14 ก้อน: react/radix/charts/editor/dnd/motion/uppy/form/query/media/scanner/icons/supabase/utils → main chunk เหลือ 182 KB (gzip 52 KB) จาก 787 KB เดิม',
            'ผลข้างเคียงดี: WasteBankManagement 370KB → 34KB (deps ย้ายไป charts-vendor ที่ shared), RichTextEditor → editor-vendor 249KB ที่ใช้ร่วมกันใน NewsForm+DocumentsManagement (ไม่ดูเหมือนกันอีก)',
            'Browser caching ดีขึ้น: vendor chunks (immutable) cache ยาว, แก้ app code เปลี่ยนแค่ index.js (52KB gzip) แทน 234KB เดิม — repeat visits เร็วขึ้นมาก',
            'Trade-off: First page load มี HTTP requests มากขึ้น (~5-8 chunks parallel) แต่ HTTP/2 multiplexing + Vercel edge caching ทำให้เร็วกว่า monolithic 787KB chunk',
            'เพิ่ม `chunkSizeWarningLimit: 600` ใน build config — สูงสุดตอนนี้คือ charts-vendor (422 KB / gzip 112 KB) — recharts หนัก แต่ lazy-load เฉพาะหน้าที่ใช้',
        ],
    },
    {
        version: 'v1.9.2 (SEO Polish — OG Image + Schema.org JSON-LD)',
        date: '',
        badge: 'bg-sky-500',
        items: [
            'สร้าง `public/og-image.png` ขนาด 1200×630 (navy gradient + gold accent + Sarabun) — Facebook/Twitter/LINE share เห็นรูป preview แล้ว ไม่ใช่กล่องเทาว่างอีก',
            '`scripts/og-image-template.svg` + `scripts/generate-og-image.mjs` — pipeline แปลง SVG → PNG ผ่าน `sharp` (devDep), `pnpm generate:og` regenerate ได้ทุกเมื่อถ้าเปลี่ยน design',
            'Schema.org `EducationalOrganization` JSON-LD ใน 2 จุด: `index.html` (initial crawl static) + `SEOHead.tsx` (runtime dynamic ที่อ่านจาก school_settings — name/description/logo/address/phone/email/social_links) → Google Rich Results / Knowledge Graph มี structured data',
            '`SEOHead.tsx` ปรับ: og:image/twitter:image fallback chain (image prop → school_logo_url → /og-image.png) + บังคับ absolute URL ผ่าน `absoluteUrl()` helper (crawler ที่ไม่ resolve relative URL ก็เจอรูป) + เพิ่ม `noOrgSchema` prop กันชนกับ schema เฉพาะหน้า (เช่น NewsArticle ในอนาคต)',
            '`index.html`: เพิ่ม og:image:width/height (1200×630), `canonical` + og:url ให้เป็น absolute URL — กฎ Open Graph standard',
        ],
    },
    {
        version: 'v1.9.1 (ลบ Theme Toggle — Light Mode Only)',
        date: '',
        badge: 'bg-amber-500',
        items: [
            'ถอด `next-themes` ออกทั้งระบบ — ลบ `ThemeProvider`, `ThemeToggle`, `.dark` CSS vars block, `darkMode: ["class"]` ใน tailwind — เว็บใช้ light mode อย่างเดียวทั้ง public/admin/portal บน desktop + มือถือ',
            'AdminLayout + RolePortalLayout: ลบปุ่ม ☀ สว่าง/มืด/ตามระบบ ทั้ง mobile header + desktop top bar (RolePortal desktop top bar ว่างเลยลบทั้ง div)',
            'sonner.tsx: ตัด `useTheme()` hardcode `theme="light"` — toast ไม่ตามระบบ OS อีก',
            'index.html: เพิ่ม inline script ลบ `localStorage["kampai-theme"]` + `documentElement.classList.remove("dark")` ก่อน React mount — กัน user ที่เคยเลือกโหมดมืดไว้ค้าง class `dark` บน <html>',
            'หมายเหตุ: ระบบ Theme Manager (`useThemeColors` / `RuntimeThemeStyles` / `school_settings.theme_colors`) ไม่ถูกแตะ — admin ยังปรับสี brand (gold/navy) ได้ตามเดิม คนละระบบกับ light/dark toggle',
        ],
    },
    {
        version: 'v1.9.0 (Quick Menu Personalization — เมนูลัดเลือกเองได้)',
        date: '',
        badge: 'bg-indigo-500',
        items: [
            'Dashboard ทั้ง admin (`/admin/dashboard`) และ teacher (`/teacher`) มี Quick Menu ที่ user เลือกเองได้ — กดปุ่ม "จัดการ" เปิด dialog ลากเรียงลำดับ (drag-drop ด้วย @dnd-kit) + เพิ่ม/ลบเมนูจาก catalog ที่จัดกลุ่มตาม section',
            'Migration 025: ตาราง `user_quick_menu_preferences` (compound PK `user_id` + `context`) — รองรับ user คนเดียวที่มีทั้ง admin + teacher context (เก็บแยก row), RLS `auth.uid() = user_id` กัน user เห็น/แก้ของคนอื่น',
            'Component `<QuickMenu context="admin"|"teacher" />` แทน hardcoded section เดิม — responsive grid auto (2/3/4/5 cols), fallback default ids ถ้าไม่มี preference, ใช้ useQuery + useMutation invalidate ตามมาตรฐาน',
            'Catalog: `src/lib/quickMenuCatalog.ts` — รวมเมนู admin 30+ ตัวจัดกลุ่ม (เว็บไซต์/สารบรรณ/บุคลากร/วิชาการ/ข้อมูลโรงเรียน/ระบบบริการ/อื่นๆ/ระบบ) + teacher 4 ตัว — แยกไฟล์เพื่อ reuse + ลดขนาด AdminLayout',
            'Service `quickMenu.service.ts` — get + save (upsert onConflict `user_id,context`) เป็น contract ระหว่าง component กับ DB',
        ],
    },
    {
        version: 'v1.8.9 (Hall of Fame — หอเกียรติยศคนดีคำไผ่)',
        date: '',
        badge: 'bg-yellow-500',
        items: [
            'หน้าสาธารณะ `/hall-of-fame` เปิดให้ผู้มาเยือนดูได้โดยไม่ต้อง login — แสดง leaderboard top 10 (มี podium top 3 พร้อมเหรียญ), แยกรายชั้น (top 3 ต่อชั้น), feed ความดีล่าสุด 20 รายการ — filter ภาคเรียน/ปีการศึกษา + แสดงรูป `students.photo_url` พร้อม Avatar fallback initials',
            'Migration 024: เพิ่ม RLS policy `Public read positive conduct` (FOR SELECT USING type = \'add\') — เปิดเฉพาะคะแนนบวกตามหลัก PDPA ป้องกัน expose การหักคะแนน, policy เดิม `Auth manage conduct_scores` ยังคงเดิม Postgres รวมแบบ OR ผู้ใช้ login ยังจัดการได้ปกติ',
            'Home block `conduct_leaderboard` ใน `HomeMainContent.tsx` — top 5 เทอมปัจจุบัน คลิกไป `/hall-of-fame` (admin จัดผ่าน MobileLayoutManager / Layout Settings เพื่อเพิ่ม block นี้เข้าหน้าแรก)',
            'Service: `conductService.getPublicPositive()` ใหม่ใน `conduct.service.ts` — join `students(name, class, photo_url)`, filter `type=add` + optional semester/year — ใช้ทั้งหน้า hall of fame และ home block',
        ],
    },
    {
        version: 'v1.8.8 (Hero Slides — Image Fit + 16:9 Frame Standardization)',
        date: '',
        badge: 'bg-sky-500',
        items: [
            'Root cause ของปัญหารูป hero ถูก crop: hero frame เป็น `aspect-[16/7]` แต่ admin hint แนะนำ 1920×1080 (16:9) → ทุกรูปที่ user อัปตามมาตรฐานโดน crop ขอบบน-ล่าง ~16% ทุกใบ — แก้ frame เป็น `aspect-[16/9]` ใน `HomeMainContent.tsx:300` ทีเดียวจบ standard upload 1920×1080 แสดงเต็มเป๊ะ',
            'Migration 041: เพิ่ม `image_fit` column บน `hero_slides` (TEXT, default `cover`, CHECK `cover|contain`) สำหรับ edge case ที่ admin อัปรูป portrait/4:3/panorama แล้วต้องการเห็นเต็มใบ',
            'Admin form: dropdown "การแสดงรูป" ระหว่าง ImageUpload กับ "หัวข้อ" ใน `HeroSlidesManagement.tsx` — เลือก "เต็มจอ" (cover) หรือ "พอดีกรอบ" (contain + blurred dimmed backdrop)',
            'Render: ถ้า `image_fit=contain` ใน `HomeMainContent.tsx` heroSection render `<img>` 2 ชั้น — backdrop `object-cover blur-3xl scale-125 brightness-50` + foreground `object-contain` (backdrop ดิ่มแรงให้แยกชัดจาก foreground ไม่กลืน)',
            'Lesson learned: `src/components/HeroSection.tsx` เป็น dead code ไม่ถูก import ที่ public — รอบแรกแก้ผิดไฟล์เสีย commit ฟรี (`37ba80e`) ต้องตามแก้ที่ `HomeMainContent.tsx` (`09070202`). ต่อไปก่อนแก้ component ที่ดูตรงเป้าตามชื่อ — `grep "import.*ComponentName.*from"` ใน `src/pages/` เช็คก่อนเสมอ',
            'Backwards compat: slide ทุกใบ default = `cover` (migration default) → ไม่มี visual change กับ slide เดิม; admin เลือกปรับเฉพาะ slide ที่ต้องการ',
        ],
    },
    {
        version: 'v1.8.7 (Compact Rewards Catalog + Rules 14.10–14.12)',
        date: '',
        badge: 'bg-emerald-500',
        items: [
            'Rewards Catalog refactor — compact hero (`py-5 md:py-7`, headline `text-xl md:text-2xl`), wrap ใน `max-w-7xl mx-auto` ตรงกับ SiteHeader, ลบ tier overview strip + per-tier sections, เปลี่ยนเป็น single grid + sticky category chip filter (เลื่อน horizontal บน mobile)',
            'Mobile fit: grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`, chip strip `overflow-x-auto whitespace-nowrap`, ปุ่ม CTA hero ใช้ `size="sm" h-8`',
            'Migration 032 + admin form: เพิ่ม `category` column ใน rewards table (TEXT) + datalist 5 ตัวเลือก (เครื่องเขียน/ขนม/กีฬา/ของเล่น/อื่นๆ) — admin พิมพ์เองได้, public derive distinct values เป็น chip',
            'DESIGN.md เพิ่ม Rule 14.10 (compact spacing) / 14.11 (container constraint, ห้าม container mx-auto) / 14.12 (AI ต้องถามก่อนตัดสินใจสิ่งนอกเหนือคำสั่ง) — battle-tested จาก feedback v1 ที่หน้านี้ล้นกรอบ + กินพื้นที่เกิน',
        ],
    },
    {
        version: 'v1.8.5 (Public Rewards Catalog + Teacher Approval)',
        date: '',
        badge: 'bg-amber-400',
        items: [
            'หน้าแลกรางวัลสาธารณะ /waste-bank/rewards — แสดงรางวัลทั้งหมด auto-bucket ตามคะแนน 4 ระดับ (🌱 0–50 / 🌿 51–150 / 🌳 151–300 / 🏆 301+) นักเรียนกรอกรหัสนักเรียนเพื่อแลกได้เอง ครูอนุมัติทีหลัง',
            'Teacher Portal เพิ่มเมนู "อนุมัติรางวัล" /teacher/rewards-approval — reuse <ClaimsApproval /> component ครูทุกคน (role=teacher) อนุมัติ/ปฏิเสธคำขอแลกรางวัลได้ ไม่ต้องเป็น admin',
            'Migration 031_reward_claim_public_rpc.sql เพิ่ม 2 RPC: lookup_student_balance(code) คืนข้อมูลนักเรียน+แต้มคงเหลือ, claim_reward(code, reward_id) สร้างคำขอ pending — ทั้งคู่ SECURITY DEFINER + grant ให้ anon เพื่อไม่ต้องเปิด INSERT policy บน reward_claims',
            'Components ใหม่: <RewardCard />, <RewardClaimDialog /> (modal 2-step ตรวจรหัส→ยืนยัน), tier auto-bucket helper — design เน้น "เห็นเป้าหมายชัด แลกเองได้"',
            'WasteBank.tsx Hero CTA เพิ่มปุ่ม "ดูรางวัลที่แลกได้" สีทอง คู่กับ "ดูสถิติแบบละเอียด"',
        ],
    },
    {
        version: 'v1.8.4 (Compact Spacing + Staff Card Polish)',
        date: '',
        badge: 'bg-emerald-400',
        items: [
            'Compact Spacing ทุกหน้า public (7 หน้า): Hero py-16/py-6 md:py-8 → py-2 md:py-6, Main sections py-8 md:py-12 → py-4 md:py-8, Contact cards py-12 → py-4 md:py-6 — ลบ section-padding utility ออกแทนด้วย explicit py — ใช้กับ About, AcademicCalendar, Contact, Curriculum, Documents, Events, News',
            'Staff Card Hover Effect ใหม่: เปลี่ยนจาก translateY(-44%) overlay เป็น opacity fade เพื่อให้หน้าเห็นตลอดเวลา + Reveal panel glassmorphism (backdrop-filter blur) + เพิ่มชื่อ/ตำแหน่ง/CTA ใน reveal panel ทั้ง StaffCard และ FeaturedCard',
        ],
    },
    {
        version: 'v1.8.3 (Lean Context — Remove Second-Brain Integration)',
        date: '',
        badge: 'bg-emerald-500',
        items: [
            'CLAUDE.md ลบ section "🧠 ก่อนเริ่มงาน — อ่าน Second Brain" (23 บรรทัด — ตาราง 7 row + กฎ 3 ข้อ) — AI ไม่อ่าน second-brain notes อีก ประหยัด ~700 tokens/session',
            'CLAUDE.md ลบ "เมื่อเสร็จงานใหญ่" section (10 บรรทัด — แนะนำ user อัปเดต Decisions/Lessons/Features/Roadmap) — ไม่ต้องคอมมิตซ้อน 2 repo อีก',
            'CLAUDE.md "Documentation Discipline" table: 7 rows → 3 rows (เก็บเฉพาะ DESIGN.md + DESIGN-COMPONENTS.md + SystemOverview.tsx)',
            'CLAUDE.md "Known Pitfalls" trim: 7 entries เต็มประโยค → 5 bullets สั้น (Dark mode/Vercel/worktree/LINE/CRLF) ลด ~250 tokens',
            'DESIGN.md Rule 14.9 simplified: ตาราง 6 rows → 3 rows + workflow 5 ขั้น → 1 บรรทัด — ลบส่วน second-brain ทั้งหมด',
            '.gitignore เพิ่ม: .claude/skills/, .claude/worktrees/, .agents/, skills/, skills-lock.json — git status ไม่แสดง 9 untracked dirs ทุกครั้ง ประหยัดต่อ command',
            'package.json: เพิ่ม script "build:check" = "vite build 2>&1 | tail -5" — quiet build ไม่กิน token จาก asset list 50+ บรรทัด',
            'CLAUDE.md ขนาดสุดท้าย: 11.2 KB → 9.0 KB (-20%) — รวม v1.8.2 + v1.8.3 ประหยัดจาก 14.3 KB → 9.0 KB (-37% / ~1,500 tokens/session)',
        ],
    },
    {
        version: 'v1.8.2 (Token Diet — Trim CLAUDE.md + Split DESIGN.md)',
        date: '',
        badge: 'bg-emerald-500',
        items: [
            'CLAUDE.md trim: ลบ RTK section (74 lines / ~7KB) ที่ duplicate กับ global ~/.claude/CLAUDE.md → แทนด้วย stub 12 บรรทัด ลิงก์ไป global — ประหยัด ~2,500 tokens/session ทุก session AI ทำงาน',
            'DESIGN.md split (621 → ~440 lines): ย้าย Section 8 (Frontend Components specs) + 9 (Backend Components specs) + 10 (Replacement Mapping table) + 11 (Migration Checklist) + 12 (AI Hard Rules) → ไฟล์ใหม่ DESIGN-COMPONENTS.md',
            'DESIGN.md เก็บเฉพาะ "rules ที่ใช้บ่อย" — palette/contrast/typography (1-7) + Theme Manager SoT (13) + UX Rules 14.1-14.9 + Spacing (15) + Verification Commands (16)',
            'DESIGN-COMPONENTS.md (companion file) = "deep specs" load on-demand เมื่อ implement component / refactor legacy purple — ประหยัด ~3,000 tokens ตอนงาน routine ที่ไม่ต้องแตะ component spec',
            'CLAUDE.md Documentation Discipline table: เพิ่ม row DESIGN-COMPONENTS.md เพื่อระบุชัดเจนว่าเปลี่ยน component spec ต้อง update ที่ไหน (Rule 14.9 compliance)',
        ],
    },
    {
        version: 'v1.8.1 (UX Polish — Mobile Compact + Readable Text + Tappable Cards)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'Home Principal Photo (HomeLeftSidebar): วงกลม → สีเหลี่ยม (rounded-full → rounded-xl), ขยาย w-20 h-20 → w-28 h-28 (+40%), เพิ่ม object-position: top เพื่อโฟกัสหน้า ไม่ crop ออก',
            'Staff Admin Photo (FeaturedCard): mobile portrait aspect-ratio 4/5 (จาก fixed height 240px landscape) + object-position: top — สัดส่วนเดียวกับการ์ดครู',
            'Staff Admin Card Tappable: เพิ่ม onClick={onOpenModal} + cursor pointer บน sd-photo + sd-overlay (ชื่อ/ตำแหน่ง) + sd-reveal "แตะเพื่อดูประวัติ" — เหมือนการ์ดครูทุกใบ',
            'Staff Flip Button: opacity 0→1 (เห็นเสมอ ไม่ต้อง hover), background ขาว → var(--sd-acc) ทอง, ขนาด 28→32px, hover scale 1.12 + shadow stronger — flipped state เปลี่ยนเป็น var(--sd-dk) เขียวเข้ม (clear state feedback)',
            'Staff Mobile Layout: stats grid 2×2 → 1×4 (CSS override 2-col removed) + py-5→py-1.5 + text-2xl→text-lg + label text-[10px] — hero py-6→py-2 + ซ่อน kicker/subtitle (hidden sm:block) + toolbar py-3→py-2 — ลด ~90px ทำให้เห็นรูปการ์ดแรกทันทีที่เปิด',
            'Staff Hover Overlay Readability: hover opacity .35→1 (ไม่จาง) + translateY -28%→-44% (ยกสูงไม่ทับ reveal) + gradient เข้มขึ้น (transparent 30%/.68/.96) + text-shadow alpha .5→.95 + ov-pos opacity .82→.95 + font-weight 600 — อ่านชัดบนรูปสว่าง zoom + full color',
            'About Page Compact (6 sections): section-padding (py-16-24) → py-8 md:py-12 ทุก section + Vision/Mission cards p-8→p-5/6 icon w-14→w-12 mb-6→mb-3 + Philosophy strip py-10→py-6/8 + Stats py-16→py-8 grid-cols-2 md:grid-cols-4 → grid-cols-4 (single row mobile) + GPS/PDCA cards p-8 mb-10→p-5/6 mb-6 + Timeline mb-8→mb-4 + Facilities sm:grid-cols-2 — ลดความสูงรวม ~50-60%',
            'About Color Contrast: text-muted-foreground (HSL 142 20% 42% — เขียวคล้ำดูเป็นน้ำเงินบนพื้นขาว → กลืน) → text-foreground/75-80 + kicker text-accent → text-primary (เขียวเข้ม) + uppercase tracking-widest — ปรับ hierarchy ให้อ่านชัดทุกบรรทัด',
        ],
    },
    {
        version: 'v1.8.0 (Two-Surface Design System + Documentation Discipline)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'Two-Surface Design System: แยก palette ของ frontend (airy green+white) กับ backend admin (solid dark slate sidebar + green accent) ใน DESIGN.md ครบ + ลง CSS vars (--admin-bg, --admin-sidebar, --admin-accent ฯลฯ) + Tailwind tokens',
            'Theme Manager (/admin/dashboard/theme): Single Source of Truth สำหรับสีทั้งเว็บ — hex input + native color picker + live preview + RuntimeThemeStyles inject CSS vars ลง :root → public site เปลี่ยนสีโดยไม่ต้อง rebuild',
            'Menu Manager (/admin/dashboard/menu): DnD reorder menu items + group เป็น dropdown (parent/child) + จัดสี navbar (bg/text/active/hover) + font weight + font size — SiteHeader/HomeNavBar อ่านจาก useMenuConfig() hook (school_settings.menu_config JSON)',
            'Admin Backend Palette Refactor (~28 ไฟล์): AdminLayout sidebar เป็น dark slate `bg-admin-sidebar` ตลอด + ลบ purple/violet/indigo/fuchsia/pink ทั้งหมดจาก admin (sed batch replace 16 ไฟล์ + แก้ 8 หน้า frontend manually) — `grep purple|violet|indigo|fuchsia|pink-[0-9] src/` = 0 matches',
            'Compact Hero Sections (9 หน้า public): staff/about/waste-bank/curriculum/students/news/contact + calendar (AcademicCalendar) + events ลด hero จาก ~280-400px เหลือ ~96-128px (60-70% ลด) + standard pattern เดียวกัน (`bg-primary py-6 md:py-8`) + ไม่มี gradient (Rule 14.1) — Staff เลิกใช้ navy palette + AcademicCalendar เลิก `pt-32` + gradient',
            'DESIGN.md v2: เพิ่ม 9 UX Rules (14.1-14.9) สรุปจาก bug ที่เคยเจอ ห้ามทำซ้ำ — gradients/contrast/footer spacing/Theme Manager SoT/Menu Manager SoT/theme toggle scope/documentation discipline + renumber duplicate section 13 → 15 (Spacing) + 16 (Verification)',
            'Documentation Discipline (Rule 14.9): ทุก commit + deploy ต้อง sync DESIGN.md + SystemOverview versionHistory + second-brain (Features/Roadmap/Lessons Learned) ในคอมมิตเดียวกัน — ป้องกันเอกสารหลุด',
            'Quick Fixes: typo "ลังรูปภาพ" → "คลังรูปภาพ" + ลบ ThemeToggle จาก SiteHeader (public ใช้ light mode เท่านั้น) + Gallery widget query gallery_albums → news.cover_image → placeholder UI (ลบ Unsplash CDN ที่ block ได้)',
            'SiteHeader: ลบปุ่ม "สมัครเรียน" ออกจาก navbar (desktop CTA + mobile drawer footer) — user จะวางใน left/right home sidebar block เอง — ทำให้ menu items มีพื้นที่ขยายเต็ม navbar (ลบ `ml-auto` wrapper)',
        ],
    },
    {
        version: 'v1.7.0 (Admin Audit Remediation)',
        date: '',
        badge: 'bg-teal-700',
        items: [
            'Phase 1 — Dead Code Removal: ลบ Puck PageBuilder (PageBuilder.tsx + puck-config.tsx + @measured/puck dependency) + ลบ contact_fax ออกจาก hook (ไม่มี UI ใช้เลย)',
            'Phase 2 — Hero Slides Consolidation: ย้าย slide_interval setting ไปอยู่ใน HeroSlidesManagement (canonical home) + ลบ duplicate CRD section ออกจาก SettingsManagement (~134 lines) + เพิ่ม shortcut link แทน',
            'Phase 3 — SettingsManagement Decomposition: แยก 1,068-line God component เป็น 6 sub-sections (GeneralSection, HeroSection, VisionMissionSection, AboutCurriculumSection, ContactSection, FooterSection) — SettingsManagement เหลือ ~115 lines เป็น coordinator เท่านั้น',
            'Phase 4 — Custom PageBuilder: สร้าง PageBuilderManager ใหม่ทั้งหมด (zone-based DnD, 5 block types: text/image/banner/stats/map) + PageBlockRenderer สำหรับ public pages + เชื่อม About/Contact pages ให้ render custom blocks',
            'Lesson Learned: grep ก่อนลบ field เสมอ — google_maps_embed ที่ดูเหมือน dead แต่ Contact.tsx ใช้อยู่จริง',
        ],
    },
    {
        version: 'v1.6.1 (Dev Workflow — CLAUDE.md + Second Brain Integration)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'เพิ่ม CLAUDE.md ที่ root project: รวมกฎ coding 8 หมวด (data access, styling, forms, auth, RLS, pages, naming, shadcn) — ให้ Claude session ใหม่ทำงานตาม convention ได้ทันที',
            'Second Brain Routing: CLAUDE.md ชี้ให้ Claude อ่าน Obsidian second-brain ก่อนเริ่มงาน — แยกตามประเภท (Decisions, Lessons Learned, Features, Roadmap, RLS Patterns) ไม่ต้อง re-discover ทุก session',
            'RTK (Rust Token Killer) Integration: ระบุ command ทั้งหมดที่ต้อง prefix ด้วย rtk (pnpm, tsc, lint, gh, git, ls/grep/find) — ประหยัด token 60-90% ต่อ command',
            'Known Pitfalls Section: 7 กับดักที่เคยเจอ (Dark Mode hardcode, Vercel webhook หลุด, Windows CRLF, worktree cwd, Edit/Read order, React Quill warning, LINE Notify deprecated) — ไม่ต้องเสียเวลา debug ซ้ำ',
            'Closing Loop: CLAUDE.md สั่งให้ Claude เตือน user อัปเดต second-brain หลังงานใหญ่ → knowledge base เติบโตต่อเนื่องอัตโนมัติ',
        ],
    },
    {
        version: 'v1.6.0 (Waste Bank Refactor — Items + Points + Rewards)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เลิกชั่งน้ำหนัก/แลกเงิน: เปลี่ยนเป็นนับเป็น "จำนวนชิ้น" + สะสม "แต้ม" (ขวดพลาสติกเล็ก 1 แต้ม, ขวดพลาสติกใหญ่ 2 แต้ม, ขวดแก้ว 3 แต้ม, กระป๋อง 2 แต้ม) — เด็กวัดน้ำหนักยาก + ไม่ควรให้จ่ายเงินนักเรียน',
            'ระบบแลกรางวัล: ครูอัพรางวัล (รูป + จำนวนแต้ม + stock) → เด็ก claim ผ่าน Parent Portal → ครูอนุมัติ/ปฏิเสธ — มี audit log ครบ',
            'QR Code Flow: นักเรียนโชว์ QR ใน Parent Portal → ครูสแกนด้วยกล้อง (html5-qrcode) → เปิดฟอร์มพร้อมชื่อ prefilled → บันทึกจำนวนชิ้น → แต้มเพิ่มอัตโนมัติ',
            'DB ใหม่: waste_transactions (quantity + points_earned), waste_categories (points_per_item), rewards + reward_claims — migration 025 ล้างข้อมูลเก่าแล้วสร้างใหม่ (schema สะอาด)',
            'Storage bucket "rewards" (public read, admin+teacher write) สำหรับรูปรางวัล',
            'หน้า Admin เพิ่ม 2 tabs: "รางวัล" (CRUD + upload) และ "คำขอแลกรางวัล" (อนุมัติ/ปฏิเสธพร้อมเหตุผล)',
            'หน้า Parent: QR display + แต้มคงเหลือ + catalog รางวัล + ประวัติฝากขยะ + ประวัติแลกรางวัล',
            'หน้าสาธารณะ /waste-bank: Hall of Fame เปลี่ยนเป็น แต้มสะสม/จำนวนชิ้น/จำนวนครั้ง (ไม่มี ฿ อีกต่อไป)',
        ],
    },
    {
        version: 'v1.5.0 (UX/UI Beautification — Sprint 1)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'Dark Mode + Theme Switcher: next-themes provider + Sun/Moon/System dropdown ใน Admin/Portal/Public header ทั้งหมด — บันทึก preference ตาม user + follow OS preference',
            'Framer Motion เปิดตัวครั้งแรก: Homepage Hero stagger entrance, News grid scroll reveal, Countdown pulse, Stats counter animation, Gallery hover zoom — พร้อม MotionConfig reducedMotion="user" (a11y)',
            'Skeleton Loaders Library: 8 preset (CardSkeleton/TableSkeleton/ListSkeleton/StatSkeleton/HeroSkeleton/FormSkeleton/ChartSkeleton/PageSectionSkeleton) — migrate 7 admin pages จาก "กำลังโหลด..." เป็น shimmer',
            'EmptyState Component + 6 Inline SVG Illustrations: ใช้ currentColor + text-primary ให้ปรับตาม dark/light อัตโนมัติ — migrate 6 จุดใน FacilitiesManagement/ParentChildView/TeacherSchedule/AttendanceManagement',
            'PageLoader upgrade: pulse + spin + logo placeholder แทน spinner เปล่า — ดูนุ่มกว่าเดิม',
        ],
    },
    {
        version: 'v1.4.0 (Security + Notifications + Teacher/Parent Portals)',
        date: '',
        badge: 'bg-rose-600',
        items: [
            'Security Hardening: RLS policies ครอบคลุม 45 tables + helper functions (auth_role, is_admin, is_teacher) — ปิดช่องโหว่ "Allow public full access" บน staff/students/administrators และ sensitive tables ทั้งหมด',
            'Notification Center: ระบบแจ้งเตือน Realtime ในหน้า Admin (Bell icon + Unread badge) — trigger อัตโนมัติเมื่อมีใบสมัคร/ข้อความ/คำขอลา + มีหน้ารวมแจ้งเตือนทั้งหมด',
            'Real Analytics (แทน Mock): Device Breakdown, Peak Hours, Traffic Sources ใช้ข้อมูลจริงจาก page_views.user_agent + referrer',
            'Portal ครู: Dashboard, ตารางสอน, เช็คชื่อ, บันทึกคะแนน — กรองข้อมูลเฉพาะห้องที่สอน (/teacher/*)',
            'Portal ผู้ปกครอง: ดูการมาเรียน, ผลการเรียน, ความประพฤติ, ธนาคารขยะ ของลูก (read-only, /parent/*)',
            'Smart Login Redirect: admin → /admin/dashboard, teacher → /teacher, parent → /parent ตาม role ใน user_roles',
            'UserRolesManagement ขยาย: เพิ่ม role "parent" + link กับ students/staff',
            'Migrations 022/023/024: user_roles + staff_id/student_id linking, notifications + triggers + Realtime publication, page_views.user_agent',
        ],
    },
    {
        version: 'v1.3.1 (Export + แจ้งผู้ปกครอง + Analytics ขยาย)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            'Export CSV + พิมพ์รายงาน: เช็คชื่อนักเรียน, คะแนนผลการเรียน, ธนาคารขยะ — รองรับ UTF-8 BOM สำหรับ Excel ภาษาไทย',
            'แจ้งผู้ปกครองเมื่อนักเรียนขาดเรียน: Dialog แสดงรายชื่อ + เบอร์โทรผู้ปกครอง + SMS template พร้อม Copy to clipboard',
            'Analytics Dashboard ขยาย: Device Breakdown (Donut PieChart), Peak Hours BarChart, Traffic Sources progress bars',
            'Countdown เปิดเทอม Real-time: นับถอยหลังเปิดเทอม 1 (16 พ.ค.) / เปิดเทอม 2 (1 พ.ย.) live ทุก 1 วินาที บนหน้าแรก',
            'เพิ่ม Utility Library: src/lib/export.ts — downloadCSV() + printTable() ใช้ร่วมกันได้ทุก module',
        ],
    },
    {
        version: 'v1.3.0 (ฝ่ายวิชาการ + DB ครบชุด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ระบบฝ่ายวิชาการครบชุด 7 โมดูล: ตารางสอน (Grid 5×8 คาบ), แผนการสอน, สื่อการสอน, ปฏิทินวิชาการ, นักเรียนพิเศษ, แนะแนว, นิเทศชั้นเรียน',
            'Migration 021: 7 ตารางใหม่ — class_schedules, lesson_plans, teaching_materials, academic_calendar, student_special_needs, counseling_records, supervision_records',
            'Migration 019 (สารบรรณ) + 020 (HR): เชื่อมต่อ UI ที่มีอยู่แล้วเข้ากับฐานข้อมูลจริง — incoming_letters, outgoing_letters, meetings, orders_announcements, leave_requests, pa_assessments, training_records',
            'เพิ่ม WasteBankWidget: อันดับ Top 5 นักเรียนธนาคารขยะ (พร้อมเหรียญ 🥇🥈🥉) บนหน้าแรก Right Sidebar',
            'เพิ่ม Menu ฝ่ายวิชาการ ใน Admin Sidebar และ Route /admin/dashboard/academic',
        ],
    },
    {
        version: 'v1.2.5 (Mobile Layout Manager)',
        date: '',
        badge: 'bg-slate-500',
        items: [
            'เพิ่ม Mobile Layout Manager แยกการจัดการหน้าแรกสำหรับมือถือออกจาก Desktop โดยเฉพาะ',
            'รองรับการลากเพื่อเรียงลำดับใหม่ (Drag & Drop) และระบบเปิด/ปิดการแสดงผล (Toggle) แบบเจาะจงเฉพาะมุมมองมือถือ',
            'เพิ่มหน้าจอจำลอง (Phone Mockup Preview) เพื่อให้ Admin เห็นภาพรวมเนื้อหาแบบ Real-time',
        ],
    },
    {
        version: 'v1.2.4 (Responsive & Mock Data)',
        date: '',
        badge: 'bg-amber-500',
        items: [
            'แก้ไขบั๊กหน้าเว็บล้นกรอบ (Horizontal Overflow) ทั้งบน Desktop และ Mobile โดยใช้ overflow-x-hidden และ flex-wrap',
            'ฝังข้อมูลจำลอง (Mock Data & Dummy Images) บนระบบ HomeBlocks เพื่อให้ Layout แสดงผลสมบูรณ์แม้ฐานข้อมูลจะว่างเปล่า',
            'เพิ่มความเสถียรของการ Wrap ตัวอักษรและบรรทัด ป้องกันข้อความยาวดันหน้าเว็บเสียทรง',
        ],
    },
    {
        version: 'v1.2.3 (OBEC E-Services)',
        date: '',
        badge: 'bg-emerald-500',
        items: [
            'เพิ่ม Block "ระบบสารสนเทศบุคลากร" (E-Services & OBEC Systems) สำหรับเชื่อมโยงระบบของ สพฐ.',
            'รองรับระบบที่จำเป็นระดับประถม: DMC, Thai School Lunch, CCT, School MIS, EMIS, OBEC Asset, AMSS++, DPA',
            'ออกแบบ UI Grid แบบ Interactive พร้อม Icon แยกเฉดสีตามประเภทการใช้งาน',
        ],
    },
    {
        version: 'v1.2.2 (Hover Sync & Two-way Binding)',
        date: '',
        badge: 'bg-slate-500',
        items: [
            'Two-way Hover Sync: เลื่อนเมาส์ที่พรีวิวด้านขวา เมนูด้านซ้ายจะสลับโซนตามอัตโนมัติ',
            'Auto Scroll: ชี้เมาส์เมนูด้านซ้าย พรีวิวด้านขวาจะเลื่อน (scroll) ไปหาบล็อคทันที',
        ],
    },
    {
        version: 'v1.2.1 (Layout Sync & Hotfix)',
        date: '',
        badge: 'bg-green-500',
        items: [
            'Cross-Zone Render Sync: ปรับลอจิกหน้าเว็บหลักให้รองรับการสลับบล็อคข้ามคอลัมน์ 100% ไม่ล็อคตำแหน่งเดิมอีกต่อไป',
            'Layout Initialization Fix: แก้บั๊กระบบหลังบ้านหวังดีเกินไป (ดันลบตัวที่ย้ายโซนแล้วดึงกลับคืนที่เดิม) เซฟแล้วพรีวิวไม่เด้งพังแล้ว',
        ],
    },
    {
        version: 'v1.2.0 (Interactive Layout)',
        date: '',
        badge: 'bg-teal-500',
        items: [
            'Cross-Zone Movement: ทะลุข้อจำกัดด้วยเมนู "ย้ายโซน" ย้ายบล็อคระหว่างคอลัมน์ได้อย่างอิสระ',
            'Interactive Live Preview: ระบบใช้เมาส์ลากบล็อคจากเครืองมือ ไปวางในจอพรีวิว (Drag to Drop) ได้เลย',
        ],
    },
    {
        version: 'v1.1.0 (Visual Homepage & Performance)',
        date: '',
        badge: 'bg-teal-500',
        items: [
            'Visual Homepage Layout Manager: ระบบลากวางหน้าแรก 3 คอลัมน์ + Live Preview',
            'Architecture Refactor: เปลี่ยนเป็น Route-based Lazy Loading โหลดเร็วขึ้น 75%',
            'Stability Fix: ระบบ Graceful Fallback ดักจับ 500 Error ของฐานข้อมูล',
            'เพิ่มปุ่ม Export ไฟล์รูปแบบต่างๆ บนหน้าภาพรวมระบบ'
        ],
    },
    {
        version: 'Page Builder v2',
        date: '',
        badge: 'bg-blue-500',
        items: [
            'เพิ่ม 8 blocks ใหม่: HeadingBlock, SpacerBlock, AnnouncementBlock',
            'StatisticsBlock, VideoBlock, QuickLinksBlock, EventsBlock, DocumentsBlock',
        ],
    },
    {
        version: 'Attendance Sprint 3',
        date: '',
        badge: 'bg-teal-500',
        items: [
            'เพิ่มรูปภาพนักเรียนในระบบเช็คชื่อ',
            'Tab รายงานรายบุคคล (Individual Report)',
        ],
    },
    {
        version: 'Waste Bank Sprint 2',
        date: '',
        badge: 'bg-green-500',
        items: [
            'เชื่อมต่อ Waste Bank กับฐานข้อมูลนักเรียน',
            'Student selector + Photo avatar + student_id FK',
        ],
    },
    {
        version: 'HR System',
        date: '',
        badge: 'bg-orange-500',
        items: [
            'ระบบงานบุคคล: การลา, การอบรม',
            'PA Assessment (ประเมินผลงาน)',
        ],
    },
    {
        version: 'Saraban System',
        date: '',
        badge: 'bg-emerald-500',
        items: [
            'ระบบสารบรรณ Phase 1+2',
            'หนังสือรับ-ส่ง, คำสั่ง/ประกาศ, บันทึกการประชุม',
        ],
    },
    {
        version: 'Student Management',
        date: '',
        badge: 'bg-amber-500',
        items: [
            'ฐานข้อมูลนักเรียนรายบุคคล',
            'ระบบเช็คชื่อนักเรียน',
        ],
    },
    {
        version: 'Page Builder v1',
        date: '',
        badge: 'bg-slate-500',
        items: [
            'Visual Page Editor ด้วย Puck',
            'HeroBlock, NewsGridBlock, GalleryBlock, ContactBlock',
        ],
    },
    {
        version: 'Gallery & Media',
        date: '',
        badge: 'bg-yellow-500',
        items: [
            'เปลี่ยนเป็น react-photo-album + lightbox',
            'อัพโหลดโลโก้โรงเรียน + ภาพ Hero',
        ],
    },
    {
        version: 'Initial Launch',
        date: 'เริ่มต้น',
        badge: 'bg-gray-500',
        items: [
            'โครงสร้างหลัก: ข่าว, กิจกรรม, แกลเลอรี่, บุคลากร, หลักสูตร, ติดต่อ',
            'Admin Dashboard + Supabase + Vercel deployment',
        ],
    },
];

const exportData = {
    project: {
        name: 'kampai-school',
        repository: 'github.com/solamon2525/kampai-school',
        hosting: 'Vercel (SPA)',
        database: 'Supabase (PostgreSQL)',
        primaryLanguage: 'TypeScript + PLpgSQL',
        frontend: 'React 18 + Vite',
        auth: 'Supabase Auth + RLS',
        edgeFunctions: 'Deno (Supabase)',
    },
    techStack,
    featureGroups: featureGroups.map(g => ({ category: g.label, features: g.features })),
    database: {
        totalTables: '47+',
        migrations: 23,
        engine: 'PostgreSQL via Supabase',
        security: 'RLS enabled',
        groups: dbGroups,
    },
    roadmap: roadmap.map(r => ({ title: r.title, description: r.desc })),
    sprintPlan: sprintPlan.map(s => ({ sprint: s.sprint, duration: s.duration, goal: s.goal, items: s.items })),
    versionHistory: versionHistory.map(v => ({ version: v.version, date: v.date, changes: v.items })),
    exportedAt: new Date().toISOString(),
};

const generateMarkdown = () => {
    const lines: string[] = [];
    lines.push('# ภาพรวมระบบ — kampai-school');
    lines.push(`\n> Generated: ${new Date().toLocaleString('th-TH')}\n`);

    lines.push('## ข้อมูลโปรเจค');
    Object.entries(exportData.project).forEach(([k, v]) => lines.push(`- **${k}**: ${v}`));

    lines.push('\n## เทคโนโลยีที่ใช้');
    lines.push('\n### Frontend');
    techStack.frontend.forEach(t => lines.push(`- **${t.name}** — ${t.desc}`));
    lines.push('\n### Backend & Database');
    techStack.backend.forEach(t => lines.push(`- **${t.name}** — ${t.desc}`));
    lines.push('\n### Deployment');
    techStack.deployment.forEach(t => lines.push(`- **${t.name}** — ${t.desc}`));

    lines.push('\n## ฟีเจอร์ที่มีอยู่แล้ว');
    featureGroups.forEach(g => {
        lines.push(`\n### ${g.label}`);
        g.features.forEach(f => lines.push(`- ${f}`));
    });

    lines.push('\n## ฐานข้อมูล');
    lines.push(`- **Tables**: 47+`);
    lines.push(`- **Migrations**: 23`);
    lines.push(`- **Engine**: PostgreSQL via Supabase`);
    lines.push(`- **Security**: RLS enabled`);
    dbGroups.forEach(g => {
        lines.push(`\n### ${g.label}`);
        g.tables.forEach(t => lines.push(`- \`${t}\``));
    });

    lines.push('\n## Roadmap — สิ่งที่ยังทำต่อได้');
    roadmap.forEach(r => lines.push(`- **${r.title}**: ${r.desc}`));

    lines.push('\n## แผนพัฒนาต่อ (Sprint Plan)');
    sprintPlan.forEach(s => {
        lines.push(`\n### ${s.sprint} — ${s.duration}`);
        lines.push(`> 🎯 ${s.goal}`);
        s.items.forEach(i => lines.push(`- ${i.icon} **${i.title}** (${i.effort}) — ${i.stack}`));
    });

    lines.push('\n## ประวัติการอัพเดท');
    versionHistory.forEach(v => {
        lines.push(`\n### ${v.version}${v.date ? ` (${v.date})` : ''}`);
        v.items.forEach(i => lines.push(`- ${i}`));
    });

    return lines.join('\n');
};

const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const SystemOverview = () => {
    const [copied, setCopied] = useState(false);

    const handleExportJSON = () => {
        downloadFile(JSON.stringify(exportData, null, 2), 'system-overview.json', 'application/json');
    };

    const handleExportMD = () => {
        downloadFile(generateMarkdown(), 'system-overview.md', 'text/markdown');
    };

    const handleExportTXT = () => {
        const txt = generateMarkdown().replace(/[#*`]/g, '').replace(/\n{3,}/g, '\n\n');
        downloadFile(txt, 'system-overview.txt', 'text/plain');
    };

    const handlePrint = () => window.print();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generateMarkdown());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">ภาพรวมระบบ</h1>
                    <p className="text-muted-foreground">ข้อมูลเทคโนโลยี โครงสร้าง และฟีเจอร์ทั้งหมดของเว็บไซต์โรงเรียน</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5">
                        <FileJson className="w-4 h-4 text-yellow-500" />
                        JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportMD} className="gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportTXT} className="gap-1.5">
                        <Download className="w-4 h-4 text-green-500" />
                        TXT
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                        <Printer className="w-4 h-4 text-emerald-500" />
                        PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy MD'}
                    </Button>
                </div>
            </div>

            {/* Section A: Project Info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Info className="w-5 h-5 text-primary" />
                        ข้อมูลโปรเจค
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Package, label: 'ชื่อโปรเจค', value: 'kampai-school' },
                        { icon: GitBranch, label: 'Repository', value: 'github.com/solamon2525/kampai-school' },
                        { icon: Globe, label: 'Hosting', value: 'Vercel (SPA)' },
                        { icon: Database, label: 'Database', value: 'Supabase (PostgreSQL)' },
                        { icon: Code2, label: 'ภาษาหลัก', value: 'TypeScript + PLpgSQL' },
                        { icon: Layers, label: 'Frontend Framework', value: 'React 18 + Vite' },
                        { icon: Shield, label: 'Auth & Security', value: 'Supabase Auth + RLS' },
                        { icon: Zap, label: 'Edge Functions', value: 'Deno (Supabase)' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                            <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Section B: Tech Stack */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Code2 className="w-5 h-5 text-primary" />
                        เทคโนโลยีที่ใช้
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Frontend */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-blue-500" />
                                <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">Frontend</h4>
                            </div>
                            <div className="space-y-2">
                                {techStack.frontend.map((t) => (
                                    <div key={t.name} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-sm font-medium text-foreground">{t.name}</span>
                                            <span className="text-xs text-muted-foreground ml-1.5">— {t.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Backend */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Server className="w-4 h-4 text-green-500" />
                                <h4 className="font-semibold text-sm text-green-600 dark:text-green-400">Backend & Database</h4>
                            </div>
                            <div className="space-y-2">
                                {techStack.backend.map((t) => (
                                    <div key={t.name} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-sm font-medium text-foreground">{t.name}</span>
                                            <span className="text-xs text-muted-foreground ml-1.5">— {t.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deployment */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Cloud className="w-4 h-4 text-emerald-500" />
                                <h4 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Deployment & Hosting</h4>
                            </div>
                            <div className="space-y-2 mb-6">
                                {techStack.deployment.map((t) => (
                                    <div key={t.name} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-sm font-medium text-foreground">{t.name}</span>
                                            <span className="text-xs text-muted-foreground ml-1.5">— {t.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Infra Details */}
                            <div className="flex items-center gap-2 mb-3">
                                <HardDrive className="w-4 h-4 text-orange-500" />
                                <h4 className="font-semibold text-sm text-orange-600 dark:text-orange-400">Infrastructure</h4>
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <p>• Vercel: SPA + catch-all rewrite, cron <code className="bg-secondary px-1 rounded">/api/ping</code> ทุก 3 วัน</p>
                                <p>• Security headers: X-Frame-Options, XSRF, Referrer-Policy</p>
                                <p>• Asset cache: 1 ปี (immutable)</p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">school-images</code>: รูปภาพ (1 GB)</p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">school-documents</code>: เอกสาร (50 MB/file)</p>
                                <p>• Env vars: <code className="bg-secondary px-1 rounded">VITE_SUPABASE_URL</code>, <code className="bg-secondary px-1 rounded">VITE_SUPABASE_ANON_KEY</code></p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section D: Features Inventory */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        ฟีเจอร์ที่มีอยู่แล้ว
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featureGroups.map((group) => (
                            <div key={group.label}>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {group.features.map((f) => (
                                        <Badge key={f} variant="outline" className={`text-xs ${group.color}`}>
                                            {f}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Section E: Database */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Database className="w-5 h-5 text-primary" />
                        ฐานข้อมูล (Database Schema)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 mb-4">
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">47+ Tables</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">23 Migrations</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">PostgreSQL via Supabase</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">RLS enabled</div>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {dbGroups.map((group) => (
                            <div key={group.label}>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
                                <div className="space-y-1">
                                    {group.tables.map((t) => (
                                        <p key={t} className="text-xs font-mono text-foreground bg-secondary/50 px-2 py-0.5 rounded">{t}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Section F: Roadmap */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        สิ่งที่ยังสามารถทำต่อได้ (Roadmap)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {roadmap.map((item) => (
                            <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-border bg-secondary/30 hover:bg-secondary/60 transition-colors">
                                <span className="text-xl flex-shrink-0">{item.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Section F2: Sprint Plan */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Rocket className="w-5 h-5 text-primary" />
                        แผนพัฒนาต่อ (Sprint Plan)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        ลำดับการพัฒนาที่แนะนำ — เริ่มจากงานที่เห็นผลเร็ว (Quick Wins) แล้วค่อยๆ เพิ่มฟีเจอร์เชิงลึก
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sprintPlan.map((s, i) => (
                            <div key={i} className="rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden">
                                <div className={`${s.badge} text-white px-4 py-2.5 flex items-center justify-between`}>
                                    <p className="text-sm font-bold">{s.sprint}</p>
                                    <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                                        {s.duration}
                                    </Badge>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                                        🎯 {s.goal}
                                    </p>
                                    <Separator />
                                    <div className="space-y-2">
                                        {s.items.map((item, j) => (
                                            <div key={j} className="flex items-start gap-2.5 group">
                                                <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-dashed">
                                                            {item.effort}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate group-hover:text-clip group-hover:whitespace-normal">
                                                        {item.stack}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Section G: Version History */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5 text-primary" />
                        ประวัติการอัพเดท (Version History)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

                        <div className="space-y-5">
                            {versionHistory.map((v, i) => (
                                <div key={i} className="relative pl-10">
                                    {/* Dot */}
                                    <div className={`absolute left-0 w-6 h-6 rounded-full ${v.badge} flex items-center justify-center`}>
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    </div>

                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-foreground">{v.version}</h4>
                                        {v.date && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">{v.date}</Badge>
                                        )}
                                    </div>
                                    <ul className="space-y-0.5">
                                        {v.items.map((item, j) => (
                                            <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-muted-foreground/50 mt-0.5">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
