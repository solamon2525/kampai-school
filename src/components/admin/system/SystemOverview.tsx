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
        { name: 'vite-plugin-pwa', desc: 'PWA + Service Worker (Workbox) — Add to Home Screen' },
        { name: 'ThaiDatePicker', desc: 'Custom Buddhist Calendar Date Picker (วัน/เดือน/พ.ศ.)' },
        { name: 'ScanFAB / Mobile Camera Scanner', desc: 'กล้องสแกนด่วนบนมือถือครอบคลุมทุกเมนู Portal ครู' },
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
        features: ['หลักสูตรการเรียน (4 สาย)', 'กิจกรรมเสริมหลักสูตร', 'ระบบเช็คชื่อนักเรียน (Attendance) ปรับปรุงฟอร์แมตวันที่ภาษาไทยย่อ/เต็มแบบพรีเมียม (พ.ศ.) + รายงาน', 'ระบบรับสมัครนักเรียนออนไลน์'],
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
        features: ['ระบบการลา', 'บันทึกการอบรม/พัฒนาตนเอง', 'ประเมินผลงาน PA Assessment', 'ระบบการลาแสดงผลวันที่ พ.ศ. และรูปแบบช่วงวันอัจฉริยะ'],
    },
    {
        label: 'ระบบบริการ',
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        features: ['ธนาคารขยะ (Waste Bank)', 'กล่องข้อความจากผู้ติดต่อ', 'Email Subscribers', 'แจ้งผู้ปกครองเมื่อนักเรียนขาด (SMS)', 'อัปเกรดการแสดงผลวันที่ภาษาไทย พ.ศ. (ธนาคารขยะ/ธนาคารพอเพียง)'],
    },
    {
        label: 'ระบบ/เครื่องมือ',
        color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
        features: ['Custom Page Builder (About/Contact — text/image/banner/stats/map)', 'Analytics ดูสถิติผู้เข้าชม (Device/Peak Hours/Referrer)', 'ตั้งค่าโรงเรียน (100+ fields)', 'User Roles & Permissions (admin/teacher/parent/viewer)', 'จัดการเว็บไซต์ผ่าน Admin', 'Export CSV + Print รายงาน', 'Notification Center (Realtime)', 'RLS Hardened (45 tables)'],
    },
    {
        label: 'Portal ครู/ผู้ปกครอง',
        color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        features: [
            'Portal ครู: Dashboard, ตารางสอน, เช็คชื่อ, คะแนน',
            'Portal ผู้ปกครอง: ดูการมาเรียน/คะแนน/ความประพฤติ/ธนาคารขยะของลูก',
            'Protected Routes ตาม role',
            'Smart Login Redirect (admin/teacher/parent)',
            'Portal ครูรองรับการดึงเมนูระบบงานหลังบ้านแบบไดนามิกตามสิทธิ์และปุ่มสลับระบบหลังบ้าน',
            'ปุ่มทางลัดสแกนด่วนบนแดชบอร์ดครูและปุ่มลอยสแกนด่วนบนมือถือ (ScanFAB) ทุกหน้าจอ',
        ],
    },
    {
        label: 'ศูนย์การศึกษา (Edu Hub)',
        color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        features: [
            'หน้าครูคลังสื่อรายบุคคล (/educational-hub + short URL /h/<username>)',
            '4 หมวด: คลังสื่อ / เกม / ใบงาน / วิดีโอ',
            'Item polymorphic 4 ประเภท: file / link / youtube / text',
            '4 view modes: Grid 3×3 / Featured / List / Compact + column selector + sort',
            'Admin lock layout default (school_settings — readonly + 🔒 badge)',
            'Staff short URL /staff/<username> (Migration 067 ย้าย username → staff)',
            'Portal ครู: tab "รายการของฉัน" + "โปรไฟล์คลัง"',
            'View counter + Download counter (anon-safe SECURITY DEFINER RPC)',
        ],
    },
    {
        label: 'PWA / ติดตั้งบนมือถือ',
        color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        features: [
            'Add to Home Screen — Android (Chrome/Edge/Samsung) + iOS (Safari)',
            'Service Worker (Workbox autoUpdate) — cache shell + ใช้งานได้ offline เบื้องต้น',
            'Manifest: name โรงเรียนบ้านคำไผ่ / standalone / theme #157F3C / 4 icons',
            'InstallBanner: floating bottom banner mobile — Android prompt / iOS instructions',
            'Dismiss + 14-day TTL — กดปิดแล้วไม่กวนซ้ำ',
            'Standalone detection — ไม่โชว์ banner ถ้าติดตั้งแล้ว',
            'Apple PWA meta tags ครบ (capable, status-bar, title, apple-touch-icon)',
        ],
    },
    {
        label: 'เกมการศึกษา',
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        features: [
            'Wrapper /play/:gameSlug — student auth + XP/Level + Badges + result modal',
            'Game session tracking (score, duration, mode, combo, fever, metadata)',
            'XP curve doubling + 8 badge types (first_play, score_*, plays_10, improvement 1.5x, streak_7)',
            '18+ games (Pizza Master Chef, Attack-on-Noun, fishing, typing, kingdom, ฯลฯ)',
            'Single-file Game Template + GAME-TEMPLATE.md (ครูสร้างเกมเองได้)',
            'Admin upload: file หรือ paste HTML code (size counter)',
            'Iframe security: sandbox + SAMEORIGIN + postMessage navigation',
            'Mobile parity: touch controls (virtual joystick + fire/jump/zoom buttons)',
            'Admin dashboard /admin/dashboard/games (stats + leaderboard + BarChart)',
            'Student 360° tab "เกมการศึกษา" + manual push to score_records',
            'Anti-cheat: 20s rate-limit + score sanity (0–1M) + duration ≥ 5s',
        ],
    },
];

const dbGroups = [
    { label: 'เนื้อหา', tables: ['news', 'news_categories', 'gallery_albums', 'gallery_photos', 'events', 'documents', 'document_categories', 'hero_slides', 'testimonials', 'partners'] },
    { label: 'บุคลากร', tables: ['administrators', 'staff', 'students', 'attendance_records', 'student_council', 'student_achievements', 'student_activities', 'student_stats', 'grade_data', 'score_records', 'conduct_scores'] },
    { label: 'บริการ', tables: ['admissions', 'contact_messages', 'waste_categories', 'waste_transactions', 'savings_transactions', 'savings_summary', 'rewards', 'reward_claims', 'curriculum_programs', 'curriculum_activities', 'faq', 'email_subscribers'] },
    { label: 'สารบรรณ + Docs Hub', tables: ['incoming_letters', 'outgoing_letters', 'letter_tracking_logs', 'orders_announcements', 'meetings', 'signatures', 'budget_items', 'sar_records', 'ics_records', 'action_plan_items', 'doc_templates', 'student_documents'] },
    { label: 'HR', tables: ['leave_requests', 'training_records', 'pa_assessments'] },
    { label: 'วิชาการ', tables: ['class_schedules', 'lesson_plans', 'teaching_materials', 'academic_calendar', 'student_special_needs', 'counseling_records', 'supervision_records'] },
    { label: 'ศูนย์การศึกษา', tables: ['educational_hub_categories', 'educational_hub_profiles', 'educational_hub_items', 'v_educational_hub_teachers (view)'] },
    { label: 'เกมการศึกษา', tables: ['game_sessions', 'game_achievements_catalog', 'game_student_achievements', 'game_student_stats (view)'] },
    { label: 'ระบบ', tables: ['school_settings', 'page_views', 'milestones', 'facilities', 'notifications', 'user_roles', 'user_quick_menu_preferences'] },
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
        version: 'v1.135.0 (Thai Vocab Hub — TTS lifecycle)',
        date: 'ล่าสุด',
        badge: 'bg-amber-600',
        items: [
            '**disposeGameSession** — หยุด TTS + autoplay เมื่อ goHome / กลับ hub / ซ่อนแท็บ / parent navigate',
            '**speechGen** — ยกเลิกลำดับอ่าน (`setTimeout`) ค้างหลัง cancelSpeech · debounce ResizeObserver กริด',
            'autoplay scrollIntoView เฉพาะการ์ดนอกจอ · migration 288 · game_docs v1.7.2',
        ],
    },
    {
        version: 'v1.134.0 (KampaiHands restart + AR tuning log)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiHands v1.3.1** — `stop()` ปล่อย camera tracks + `srcObject=null` · `start()` teardown ก่อนเปิดใหม่ · `set mode()`',
            'แก้บัค restart กล้องไม่ทำงาน (`catch-numbers`, `multiply-burst`) · แพทเทิร์น `hands=null` หลัง stop',
            '**catch-numbers** ย้าย framediff → KampaiHands (เลื่อนตะกร้าด้วยมือ) · **AR-GAME.md v1.4.4** + Presets จูน + Pitfall §4.12',
        ],
    },
    {
        version: 'v1.133.0 (KampaiHands precision boost)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiHands v1.1.0** — map มือให้ตรง `object-fit:cover` + `lostHoldMs` กันหลุดชั่วคราว',
            'เพิ่ม `sweepSteps` ใน hit probe (กันนิ้วพุ่งเร็วแล้วทะลุวัตถุ) · จูน `balloon-burst` ให้ชนแม่นขึ้น',
        ],
    },
    {
        version: 'v1.132.0 (KampaiHands finger poke)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiHands v1.0.0** — engine มาตรฐานจิ้ม/ทับ/ชนวัตถุด้วยปลายนิ้วชี้ (MediaPipe Hands + camera_utils)',
            '**balloon-burst** + **`_template-ar-hands`** ย้ายมาใช้ KampaiHands · อัปเดต `AR-GAME.md` v1.4.0',
        ],
    },
    {
        version: 'v1.131.0 (Balloon Burst poke fix)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiAR v1.3.2** — แปลงพิกัดมือให้ตรง object-fit:cover · `displaySize` callback',
            '**balloon-burst** ชนลูกโป่งด้วยหลายปลายนิ้ว + `FINGER_HIT_PADDING` · แตะ scale พิกัดถูก',
        ],
    },
    {
        version: 'v1.130.0 (Hand skeleton + lock)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiAR v1.3.1** — โครงมือ `leftHandLandmarks`/`rightHandLandmarks` + ล็อกตำแหน่ง `handLockMs` หลังจับได้',
            '**balloon-burst** วาดโครงมือเส้นแทน cursor วงกลม · แสดง 🔒 ตอนล็อก',
            'อัปเดต `AR-GAME.md` v1.3.1',
        ],
    },
    {
        version: 'v1.131.0 (Thai Vocab Hub เฟส H)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**โหมดสุ่มการ์ด (Flash)** — รู้แล้ว/ทบทวน spaced repetition · ทิศ คำ→ความ / ความ→คำ / 🔊→คำ · ความคืบหน้า % บนการ์ดหมวด',
            '**ฟังทายคำ** — ฟัง TTS เลือกคำ (homophones ใช้ decoy กลุ่ม reading)',
            '**ฝึกคำที่พลาด** — แบนเนอร์คลิกได้ + ตัวกรองกริด "คำที่พลาด" · ลิงก์แดชบอร์ด',
            '**Quiz ตาม metadata** — antonyms จับคู่ pair_id · classifiers โจทย์เติมคำ · synonyms decoy กลุ่มเดียว',
            '**กริดพลิกหลัง** — ความหมายยาวขยายความสูงชั่วคราว แทน scrollbar (อ่านจากระยะได้ครบ)',
            'migration 285 · game_docs v1.7.1',
        ],
    },
    {
        version: 'v1.130.0 (Thai Vocab Hub — กริดคำยาว + อ่านอัตโนมัติ)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**กริดทบทวน** — คำยาวขยายแนวนอน (span 2–3) แทนตัดบรรทัดกลางพยางค์ · ตัวอักษรใหญ่ใน 3×3/4×4 (cqh)',
            '**อ่านอัตโนมัติ** — รอ TTS จบ → หน่วง → คำถัดไป · โหมด คำ/คำอ่าน/ความหมาย/ครบ · พลิกการ์ด · ไฮไลต์การ์ด',
            'migration 284 · game_docs v1.6.1',
        ],
    },
    {
        version: 'v1.129.0 (KampaiAR Hands detector)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**KampaiAR v1.3.0** — `DETECTOR:\'hands\'` (MediaPipe Hands) ติดตามปลายนิ้วชี้ซ้าย/ขวา · fallback framediff',
            '**balloon-burst** สลับใช้ `hands` detector · AR Calibration เพิ่มตัวเลือก Hands',
            'อัปเดต `AR-GAME.md` v1.3.0 + `_template-ar-hands` default `DETECTOR:\'hands\'`',
        ],
    },
    {
        version: 'v1.128.0 (Thai Vocab Hub เฟส E/F/G)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**เฟส E** — รายงานคำพลาด (ครู/ผู้ปกครอง) · Teacher Edu Hub จัดการคำศัพท์ + แท็บชั้นเรียน · quiz กรองตามชั้น',
            '**เฟส F** — metadata (`classifier_for`, `pair_id`, `synonym_group`, `origin_lang`) · `indicator_code` ทุกหมวด · scripts dedupe/enrich',
            '**เฟส G** — lazy load คำต่อหมวดจาก DB · ผูก mastery ผ่าน `record_vocab_missed_indicators` · sync DB→JSON · migration 280–281 · game_docs v1.6.0',
        ],
    },
    {
        version: 'v1.127.0 (Thai Vocab Hub เฟส D)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**Thai Vocab Hub เฟส D** — คลังคำศัพท์ใน Supabase (`thai_vocab_*`) + RPC catalog/missed',
            'GamesTab ปุ่ม **จัดการคำศัพท์** — นำเข้า/ส่งออก CSV · PlayGame ส่ง `gameData.vocab` + sync คำพลาด',
            'หมวด lesson/spelling ผูก `indicator_code` · migration 278–279 · game_docs v1.5.0',
        ],
    },
    {
        version: 'v1.126.0 (แนวเกม game_play_style)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**แนวเกม 7 ประเภท** — แพลตฟอร์ม 2D · มองด้านบน · กระโดด · แข่งรถ · ยิง · พัสเซิล · 3D มายคราฟ',
            'GamesTab กรองรายการตามแนวก่อนแสดง · ตั้งค่าเกม + อัปโหลดใหม่เลือกแนวได้',
            'Character Studio แสดงเกมที่ผูกตัวละคร แยกตามแนว',
        ],
    },
    {
        version: 'v1.125.0 (scene preview จำลองเกม)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**CharacterSheetScenePreview** — ตัวละครเดิน/วิ่ง/กระโดด/หยุดขอบใน canvas · ใช้ `pickCharacterFrameIndex` เหมือน runtime',
            'Character Studio + อัปโหลดตัวละคร — แสดง scene P1/P2 · โชว์ท่า attack/happy ถ้า map แล้ว',
        ],
    },
    {
        version: 'v1.124.0 (pose catalog ครบ + studio sync)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**Pose map 5 กลุ่ม** — attack/crouch/slide/special/death ฯลฯ ใน `animation_config.extras` · admin UI พับกลุ่ม',
            '`KAMPAI.pickCharacterFrame` รองรับ state ครบ · preview ทุกท่าใน Character Studio',
            'Fix PoseMapper โหลด config ที่บันทึกแล้ว · game_docs v1.5.0',
        ],
    },
    {
        version: 'v1.123.0 (ตัดพื้นหลัง sprite ตัวละคร)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**ตัดพื้นหลังอัตโนมัติ** ในคลังตัวละคร — flood fill จากขอบ · preview checkerboard · ปรับความไว',
            '`src/lib/sprite-background.ts` + `pnpm process:sprite-bg` สำหรับ bundled assets',
            'thai-sara-run bunny sheets → PNG โปร่งใส',
        ],
    },
    {
        version: 'v1.122.0 (คลังตัวละคร — animation config)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**animation_config** (migration 265) — preset platformer-12: idle/walk/run/jump/hurt/happy · denormalize ลงเกม',
            'Admin: preview animation (idle/walk/run/jump) · auto-detect ขนาดเฟรมจาก PNG · `KAMPAI.pickCharacterFrame`',
            'thai-sara-run v1.2.0 · `CharacterSheetPreview` component',
        ],
    },
    {
        version: 'v1.121.0 (คลัง Sprite Sheet ตัวละคร)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**คลังตัวละคร** (`game_character_sheets`) — admin อัปโหลด PNG sprite sheet (P1 + P2 co-op) · เลือกใช้รายเกมใน GameSettings',
            'PlayGame ส่ง `init.character` → `KAMPAI.character` + `loadCharacterSheets()` · pilot: `thai-sara-run` fallback bundled git',
            'Migration 263/264 · `characterSheetsService` · ปุ่ม 🐰 คลังตัวละคร ใน GamesTab',
        ],
    },
    {
        version: 'v1.120.0 (Math Tank Raid + คืน Tank Commander)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เกม **Math Tank Raid** (`math-tank-raid`) — รถถังคณิต ป.3-4 คู่·หาร·เศษส่วน (เกมใหม่ แยกต่างหาก)',
            'คืน **Tank Commander** (`tank-commander`) — วิทยาการคำนวณ ม.1-3 เวอร์ชันเดิม · ทั้งสองเกมเผยแพร่พร้อมกัน (migration 254)',
        ],
    },
    {
        version: 'v1.119.0 (เกมใหม่ — ตะลุยด่านสระพาสนุก ป.1-6)',
        date: '',
        badge: 'bg-pink-600',
        items: [
            'เกม **ตะลุยด่านสระพาสนุก** (`thai-sara-run`) — HTML5 Canvas platformer สอนสระไทย ป.1-6: กระต่ายกระโดด 2 ชั้น · ลูกโป่งคำตอบเจลลี่ · คอมโบ · KampaiVersus 90s',
            'ไฟล์: `public/games/thai/thai-sara-run.html` + ปก `thai-sara-run-cover.png` · Migration 251 seed + `game_docs`',
        ],
    },
    {
        version: 'v1.118.0 (คลังเกม — ปักหมุดเรียงลำดับจากหน้าฟронต์)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'หมวด **คลังเกมการศึกษา** (`/h/:identifier`): แอดมินปักหมุดเกม 📌 บนการ์ดโดยตรง — มีผล**ทุกเครื่อง** (คนละส่วนกับ ⭐ เกมโปรด localStorage และ 🎮 หน้าแรก)',
            'เกมที่ปักหมุดเรียงตาม `library_pin_order` (ลากจัดลำดับได้) · เกมที่ไม่ปักหมุดเรียง **ใหม่ล่าสุดก่อน** (`created_at desc`) · หมวดเกมไม่สน toolbar sort',
            'Migration 249: `library_pinned` + `library_pin_order` บน `educational_hub_items` · UI: `GamesCategorySection` + ปุ่ม 📌 ใน `EduHubItemCard` · service: `sortGamesLibraryItems` / `toggleLibraryPin`',
        ],
    },
    {
        version: 'v1.117.0 (หน้าแรก — โซน "เกมแนะนำ" ปรับการแสดงผลได้จากหลังบ้าน)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'โซน "🎮 เกมแนะนำ" หน้าแรก: แอดมินคุมการแสดงผลได้จาก **GamesTab** (educational-hub) — ขยาย **1 หรือ 2 แถว** + เลือก **3 โหมด**: เลื่อนเอง (snap, เดิม) / **เลื่อนอัตโนมัติ ขวา→ซ้าย (โชว์เคส marquee)** / กริดนิ่ง',
            'ปกเกม **เฟดเข้าทีละใบ (stagger)** — ตั้งเวลาเฟด (duration) + ความหน่วงระหว่างใบได้ · โหมด marquee ตั้งความเร็วเลื่อน (วินาที/รอบ) + หยุดเมื่อชี้/แตะ',
            'ใช้ตาราง `school_settings` (key-value) — ไม่มี migration/แก้ schema · reuse keyframe `news-ticker-rtl` เดิม · ค่าเริ่มต้น = พฤติกรรมเดิม (scroll/1 แถว) ของเก่าไม่กระทบ',
        ],
    },
    {
        version: 'v1.116.0 (หน้ารวมเกม — กริดวิดีโอ: การ์ดโชว์ปก 2 วิ แล้วเล่นเดโมเกม)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            '🎬 **กริดวิดีโอหน้ารวมเกม**: การ์ดเกมโชว์รูปปกก่อน → เข้าจอครบ ~2 วิ แล้ว **เล่นคลิปเดโมอัตโนมัติ** (มิวต์ วน) fade ทับปก — คอมโพเนนต์ `GameDemoPreview` ใช้ใน `EduHubItemCard` (ทุก grid หน้ารวมเกม) + **โซน "เกมแนะนำ" หน้าแรก** (carousel + ป๊อปอัป FeaturedGameDialog)',
            'ประสิทธิภาพ: เล่นเฉพาะการ์ด **ในจอ** (IntersectionObserver) · lazy `src` (`preload=none`) · เคารพ prefers-reduced-motion + โหมดประหยัดเน็ต (saveData) → โชว์รูปปกเฉย ๆ · ออกจอ = หยุด+คาย memory · เกมไม่มีคลิป = รูปปกปกติ (backward-safe)',
            'หลังบ้าน: คอลัมน์ `preview_video_url` (migration 241) + คอมโพเนนต์ `VideoUpload` (mp4/webm ≤15MB → bucket educational-hub) อัปคลิปต่อเกมได้ทั้งฟอร์มสร้างเกม + ดialog "ตั้งค่าเกม"',
            'ทดสอบ: `pnpm build` ผ่าน · เบราว์เซอร์ยืนยันโครงสร้าง (ปก + วิดีโอ overlay lazy/มิวต์) + เฉพาะเกมที่มีคลิปจึงมี `<video>` + graceful fallback ตอนคลิปโหลดไม่ได้ (คงรูปปก ไม่มี error)',
        ],
    },
    {
        version: 'v1.115.0 (จัดการหน้าแรก — บล็อก "เกมแนะนำ" จัดการได้จริง)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            '🎮 แก้บล็อก **"เกมแนะนำ" (featured_games)** ในตัวแก้หน้าแรกให้จัดการได้จริง — เดิมโผล่บนหน้าเว็บ (auto-inject) แต่ในตัวแก้เดสก์ท็อป **ไม่มี preview** (ล่องหน) + ถูก inject ต่อท้ายสุด (หาไม่เจอ · เซฟแล้วเกมเด้งไปอยู่ล่างสุด)',
            'เพิ่ม preview การ์ดเกมใน `HomepagePreview` + ดึงโลจิกตำแหน่ง auto-inject (`featured_hero`/`featured_games`) เป็น util ร่วม `src/components/home/featuredBlocks.ts` ใช้ทั้งหน้าเว็บจริง (`Index`) + ตัวแก้ (`HomepageManager`) → ตำแหน่งตรงกัน · เปิด/ปิด/ลากเรียงได้ · เซฟไม่ทำเกมเด้งท้าย',
            'ทดสอบ: util logic 8/8 (ข้อมูลจริง + กรณีซ่อน/ย้ายโซน/idempotent) · `pnpm build` ผ่าน · หน้าแรกจริง render โซนเกมแนะนำปกติ ไม่ regress',
        ],
    },
    {
        version: 'v1.114.0 (ระบบออนไลน์เฟส 4 — rollout: KampaiMatch smooth + math-rally + docs)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เฟส 4 — **rollout netcode เข้าเฟรมเวิร์กกลาง**: `KampaiMatch` interpolate ตำแหน่งคู่แข่งผ่าน kampai-net แล้วเปิด `match.opponents()` (มี `v` = ตำแหน่ง interpolated) → **ทุกเกม race/score อ่านต่อเฟรมได้ลื่นทันที** (KampaiVersus ส่งต่อให้ด้วย) · ลด throttle ส่งคะแนน 120→80ms',
            'เกมตัวอย่าง **math-rally**: เปลี่ยนจากเซ็ต `rival.dist` ดิบตอนรับ event (กระโดดทุก ~150ms = กระตุก) → อ่าน `match.opponents()` แบบ interpolated ใน loop (ลื่น) · โหลด `kampai-net.js` · backward-safe (ไม่มี net = ค่าดิบ)',
            'เอกสาร: เพิ่มหัวข้อ **Netcode** ใน GAME.md (ทางลัด match.opponents() + host-authority + prediction) · ทดสอบ: math-rally verify 10/10 ผ่าน + browser loop เดินจริง (rival ขยับ, ไม่มี error, ไม่ regress vs คอม)',
            'เกมแอ็กชันที่เหลือ (tank-commander host-authority, blocky-safari) = rollout ต่อไปที่ต้องทดสอบ 2 เครื่องจริง',
        ],
    },
    {
        version: 'v1.113.0 (ระบบออนไลน์เฟส 3 — client-side prediction + reconciliation)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เฟส 3 — **client-side prediction**: peer ทำนายตัวเองให้ตอบสนอง input ทันที (ไม่รอ host ~100ms) แล้ว **reconcile** เข้าหา world ของ host แบบนุ่ม → คุมตัวเองรู้สึก "ทันมือ" แม้ latency สูง',
            'เพิ่ม API `predictor({step,fields,blend,maxLead,init,localId})` + `predictStep(dt,input)` + `localView()` · `maxLead` กันทำนายนำ host เกินขีด (กันทะลุกำแพง — host ยังเป็น authoritative)',
            'ทดสอบ Node 7/7: instant response (ไม่รอ host) · reconcile blend เข้าหา authoritative · พิสูจน์ wall-case (ไม่มี clamp ทะลุ x=90 · maxLead:15 จำกัด x=65) · browser โหลด v1.2.0 + API ครบ',
        ],
    },
    {
        version: 'v1.112.0 (ระบบออนไลน์เฟส 2 — host-authority รองรับหลายคน + แก้ jitter)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เฟส 2 — **host-authority star topology** ใน `kampai-net.js`: host จำลองโลกทั้งหมด + broadcast world snapshot, peer ส่งแค่ input → ตัด "authority-fighting" (ต้นเหตุ tank สั่น) + traffic O(N) แทน mesh O(N²) → **รองรับ 4-8 คน**',
            'เพิ่ม API: `setHost()` · `localWorld(ents)` (host) · `localInput(obj)` + `viewEntity(id)` (peer อ่านโลกแบบ interpolate) · `input(peerId)`/`inputs()` (host อ่าน input) · entity โผล่/หายระหว่าง snapshot ไม่พัง',
            'ทดสอบ: Node 19/19 (peer-broadcast + world interp + input + emit routing) + **end-to-end sim 1 host + 2 peers 8/8** — peer ทั้งคู่เห็นตำแหน่งตรงกัน (authoritative เดียว = ไม่ diverge) + ตามหลัง ~100ms (ลื่น)',
        ],
    },
    {
        version: 'v1.111.0 (ระบบออนไลน์เฟส 0-1 — ปลดคอขวด + kampai-net.js interpolation)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            '🌐 **เริ่มยกเครื่องระบบเล่นออนไลน์ (แนวทาง A)** ให้ลื่นขึ้น + รองรับเกิน 2 คน — ทำที่ shared layer มีผลกับทุกเกมที่ใช้ `KAMPAI.online`/`KampaiMatch`',
            'เฟส 0 — ปลดคอขวด: ตั้ง `realtime.params.eventsPerSecond: 30` ใน supabase client (เดิมใช้ default 10/s ที่ throttle เกมแอ็กชันให้กระตุก)',
            'เฟส 1 — `public/games/kampai-net.js` (keystone): network tick แยกจาก render + **snapshot interpolation** (เรนเดอร์ย้อนหลัง ~100ms แล้ว lerp ระหว่าง 2 snapshot) → คู่แข่งขยับลื่นแทนการ set ตำแหน่งดิบที่กระโดดเป็นก้อน · lerp มุมแบบทางสั้น · timebase = เวลาตอนรับ (ไม่ต้อง sync นาฬิกาข้ามเครื่อง)',
            'ทดสอบ: Node controlled-clock 11/11 ผ่าน (interpolate/angle-wrap/starvation/prune) + เบราว์เซอร์ยืนยัน x,y กึ่งกลาง + มุมทางสั้นถูกต้อง · แอปบูตปกติหลังเปลี่ยน client config',
        ],
    },
    {
        version: 'v1.110.0 (math-runner — มือถือเล่นแนวนอน + ปุ่ม ▲▼ วิชวลกดง่าย)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            '🐛 **แก้บั๊กกดเริ่มเกมไม่ได้บนมือถือ (root cause)** — `checkOrientation()` ถูกเรียกตอนโหลด แต่ไปอ้าง `started` ที่ประกาศทีหลัง → **TDZ ReferenceError** ทำให้สคริปต์ค้างทั้งไฟล์ (`startSinglePlayer` ไม่ถูกผูก) เฉพาะบนจอสัมผัส+แนวตั้ง (`is-touch`=true → `show`=true → แตะ `started`) · เดสก์ท็อปไม่เจอเพราะ short-circuit. แก้: ย้ายประกาศ `started/isGameOver` ขึ้นก่อนบล็อกมือถือ',
            'math-runner บนมือถือ: **บังคับเล่นแนวนอน** — overlay "หมุนเครื่อง" แสดง **เฉพาะตอนเล่นจริง** (จอเมนูไม่ถูกบัง กดเริ่มได้เสมอ) + หยุดเวลา/เกมชั่วคราว (กลับแนวนอน = เล่นต่อ) · ตรวจ orientation ด้วย `matchMedia` + เช็คซ้ำหน่วงเวลา · **ปุ่ม "▶ เริ่มเล่นเลย" กันค้าง** (เครื่องล็อกหมุน/อยู่ในกรอบไม่หมุน) — เดสก์ท็อปไม่กระทบ',
            'เพิ่ม **ปุ่ม ▲▼ วิชวล กดง่าย** สำหรับสลับเลน (แสดงเฉพาะจอสัมผัส) — โหมด 1 คน = ขวาล่าง (นิ้วโป้งขวา) · โหมด 2 คน = ซ้าย P1 / ขวา P2 · ปุ่ม ≥66px + เอฟเฟกต์กด · คงระบบแตะครึ่งจอเดิมไว้ด้วย',
            'ทดสอบในเบราว์เซอร์: overlay หมุนเครื่อง (portrait+touch) · gamePaused หยุดเวลา · ปุ่มสลับเลนถูกต้อง (confused-aware + clamp) · เดสก์ท็อปไม่มีปุ่ม/overlay · game_docs migration 239 (v2.1.0)',
        ],
    },
    {
        version: 'v1.109.0 (math-runner v2 — Mix default + ความยากใช้งานจริง + ขยายหัวใจ/ไอเทม)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'math-runner: ค่าเริ่มต้นเครื่องหมาย **Mix** (สุ่ม +−×÷) + ความยาก **ง่าย**',
            'ปุ่มความยาก (ง่ายมาก/ง่าย/ยาก) **มีผลจริง**: ง่ายมาก = เลขน้อย/บล็อกช้า/ไม่มีมอนสเตอร์/ตอบผิดไม่เสียหัวใจ · ยาก = เลขใหญ่ + โจทย์หาตัวแปร (? × B = Ans) + เร็วขึ้น + มอนสเตอร์เยอะ + ตอบผิดเสียหัวใจ (กันความยากรั่วเข้าโหมดออนไลน์/2 คน)',
            'ขยายระบบหัวใจ: เพดาน **5 ดวง** · คอมโบครบ 8 → ได้หัวใจ · ตอบผิด/ชนมอนสเตอร์ = เสียหัวใจ · มีหัวใจทั้งโหมดผจญภัย + แข่งเวลา · ไอเทม 1-UP 🍀',
            'ไอเทมใหม่: ✖️2 คะแนนคูณสอง · 🧲 แม่เหล็กดูดไอเทม/เหรียญเข้าเลน · 💣 ระเบิดเคลียร์มอนสเตอร์ทั้งจอ · ทดสอบในเบราว์เซอร์ครบ · game_docs migration 238 (v2.0.0)',
        ],
    },
    {
        version: 'v1.108.0 (จอจบเกมรวม XP ในจอเดียว + แก้ math-runner ก้อนคำตอบแยกอิสระ)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'มาตรฐานใหม่ "จอจบเกมเดียว": wrapper ส่งผล XP/เลเวล/เหรียญกลับเข้าเกม → KAMPAI SDK ฝังแถบ XP ลงในการ์ด GAME OVER ของเกมเอง (`<div id="kampai-result">`) → **ไม่มีการ์ด XP ลอยซ้อนทับ/ปุ่มซ้ำ** อีก (เกมเก่าที่ยังไม่มี slot ยังเด้งการ์ดลอยเหมือนเดิม — backward-safe)',
            'เพิ่ม `KAMPAI.showResult()` / `KAMPAI.onResult()` + slot `#kampai-result` ในเทมเพลตจอจบทุกตัว (`_template-full`/`_template-versus`/`_template-folder`) + กฎ GAME.md',
            'แก้เกม math-runner: ก้อนคำตอบ 4 ก้อนเป็นอิสระต่อกัน — ชนก้อนในเลนเดียวกับเรา = ตอบ (ถูก/ผิด) · ก้อนเลนอื่นลอยผ่านปกติ ไม่จางหาย · ตอบได้หลายก้อนต่อคำถาม (เดิมชน 1 ก้อน อีก 3 จางหายทันที)',
        ],
    },
    {
        version: 'v1.107.0 (Rollout "แข่ง 2 คน" — ทยอยติดตั้ง KampaiVersus ให้เกมเดิม 23 เกมแรก)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'retrofit เกมเดี่ยวให้มีโหมด "2 คนเครื่องนี้ (local hot-seat) + ออนไลน์": ปลอดภัยออนไลน์, พลเมืองดี (judgment MCQ), ห่วงโซ่อาหาร (เรียงลำดับ), กลุ่มเกม 3 มิติ block/coord/net/solid-3d + globe-3d (Three.js MCQ)',
            'อัปเกรดเกมที่มีออนไลน์อยู่แล้ว (KampaiMatch → KampaiVersus) ให้เพิ่มโหมด local hot-seat ฟรี — 14 เกม: social-quiz, color-mix, symmetry-art, cashier, vocab-race, handwash-order, plate-builder, number-line, order-it, sci-sort, veggie-garden, listen-spell, math-rally, sink-float, balloon-fighter',
            'ทุกเกมผ่าน verify:game 10/10 (รวม Check 11 บังคับ 2 ผู้เล่น) · seed เดียวกัน → P1/P2 โจทย์ตรงกัน ยุติธรรม · เก็บสถิติแชมป์ห้องเมื่อเลือกคู่แข่งจากรายชื่อ (migration 208)',
            'รวม 23/98 เกม · game_docs migration ต่อกลุ่ม (230-236) · rollout ต่อเนื่อง: เกม 1P ที่เหลือ + React + AR',
        ],
    },
    {
        version: 'v1.106.0 (ระบบ "แข่ง 2 คน" ทุกเกม — เฟรมเวิร์ก KampaiVersus: เดี่ยว + local hot-seat + online)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'เฟรมเวิร์กกลางใหม่ `/games/kampai-versus.js` (`KampaiVersus`) — drop-in เดียวให้ทุกเกมแข่ง 2 คนได้ครบ 3 โหมดจาก wiring ชุดเดียว: **เดี่ยว · 2 คนเครื่องนี้ (local hot-seat จอเดียว ไม่แบ่งจอ) · ออนไลน์** (delegate `kampai-match.js`)',
            'Local hot-seat: P1 เล่นจบ → "ส่งเครื่องให้ P2" → P2 เล่น (**seed เดียวกัน = โจทย์/โลกตรงกัน ยุติธรรม**) → จอเทียบผู้ชนะ · เลือกคู่แข่ง P2 จากรายชื่อห้อง (เก็บสถิติแชมป์/head-to-head) หรือ "เล่นเร็ว" ไม่ระบุชื่อ',
            'เก็บสถิติแมตช์ reuse โครงเดิม (migration 208 — `online_matches` source=local + wrapper `versusEnd`) · sabotage "ตอบถูก = ป่วนคู่แข่ง" เป็นออปชั่นรายเกม (`sabotage:true`)',
            'เทมเพลตใหม่ `_template-versus.html` + กฎ GAME.md "ทุกเกมต้องแข่ง 2 คนได้" + `verify:game` **Check 11** (บังคับมีทาง 2 ผู้เล่น) — เริ่ม rollout retrofit เกมเดิมทั้งหมด',
        ],
    },
    {
        version: 'v1.105.0 (อัพเกรด "Blocky Safari" — โหมดออนไลน์แข่ง + ตอบถูกป่วนคู่แข่ง)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมวิทยาศาสตร์ ป.4 จำแนกสัตว์ 3D (`science/blocky-safari`) v3.0.0: เพิ่ม **โหมดออนไลน์แข่งต่างเครื่อง** ด้วย `kampai-match.js` (สร้าง/เข้าห้องรหัส 4 หลัก · นับถอยหลังซิงค์ · แถบคะแนนสด · จัดอันดับผู้ชนะ) — โหมดเดี่ยวเดิมคงทุกอย่าง',
            'แมคคานิกแข่งขันใหม่ "ตอบถูก = ป่วนคู่แข่ง": ทุกครั้งที่เก็บสัตว์ถูก → โลกของคู่แข่งจะเพิ่มความเร็วการไล่ล่า + เกิดสัตว์ดุพิเศษรอบตัว (ตัวคูณค่อย ๆ ลดกลับสู่ปกติ) กระตุ้นให้รีบตอบให้ถูก',
            'โลกแข่งใช้ seed เดียวกัน (รหัสห้อง + เลขด่าน) → ทุกเครื่องได้เป้าหมาย/สัตว์/ตำแหน่งเหมือนกัน ยุติธรรม · sabotage ใช้กลไก report/onOpponent ของ KampaiMatch (ไม่ต้อง sync ตำแหน่ง — network เบา)',
            'จูนความแรง sabotage + เวลาแมตช์ได้ที่ config.js (SAB_*/ONLINE_DURATION) · ผ่าน verify:game 10/10 + ทดสอบ logic ในเบราว์เซอร์ (sabotage/seed/regression เดี่ยว) · game_docs migration 229',
        ],
    },
    {
        version: 'v1.104.0 (เพิ่ม "เสียงไทย" 3 โหมดให้เกมอังกฤษ 4 เกม + อัพเกรด KAMPAI SDK)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'อัพเกรด `kampai-sdk.js` (single source ของทุกเกม) — เพิ่ม `Sound.speakBilingual(en, th, opts)` + state `_voiceMode` (en/th/both) + ปุ่ม 🌐 ลอยมุมซ้ายบน เปลี่ยน 3 โหมดเสียงอ่าน จำค่า localStorage',
            'เกมที่เพิ่มแล้ว: `vocab-hub` (3 โหมดในตัวเกม) · `reading-quest` (popup ศัพท์อ่าน EN+ไทย) · `phonics-pop` · `listen-spell` · `vocab-move` — รวม 5 เกม',
            'Spoiler protection: เกมควิซที่เสียง = "คำถาม" (phonics-pop / listen-spell / vocab-move) บังคับ EN ตอนเล่นโจทย์ ปล่อยเสียงไทยเฉพาะตอน reveal/correct → กันเฉลย',
            'Backward compatible: `Sound.speak(text, lang)` API เดิมไม่แตะ เกมอื่นที่ยังไม่ migrate ใช้งานต่อได้ปกติ — fallback stub ของทุกเกมที่ปรับ มี `speakBilingual` stub กันพังถ้า SDK โหลดไม่ได้',
        ],
    },
    {
        version: 'v1.103.0 (ฟีเจอร์ใหม่ "English Quest" — แอปเรียนศัพท์อังกฤษรายวันแบบเกม ป.4-6)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'ฟีเจอร์เรียนคำศัพท์อังกฤษแบบ gamified สำหรับนักเรียน (route `/english-quest`): เลือกโลกผจญภัยตามธีม (สัตว์/อาหาร/โรงเรียน) → เรียนการ์ดคำ (ฟังเสียง TTS) → ทำแบบทดสอบ → เก็บดาว + XP',
            'มีมาสคอตจิ้งจอกตั้งชื่อเองได้ + เลเวล/แถบ XP/สถิติเรียนต่อเนื่อง (streak) — บันทึกความคืบหน้าผูกกับนักเรียนฝั่ง server (เข้าผ่านรหัสนักเรียนเหมือนหน้าเล่นเกม)',
            'ขี่ระบบ gamification กลางเดิม: เรียนจบ 1 บท → record_game_session → ได้ XP วิชาภาษาอังกฤษ + นับ streak + ขึ้นอันดับ อัตโนมัติ (reuse ไม่สร้าง engine ใหม่)',
            'หลังบ้านใหม่: ตาราง english_quest_worlds/lessons/words/progress + RPC get_state/complete_lesson/set_mascot (RLS ครบ) · หลักสูตรชุดแรก 3 โลก × 60 คำ ป.4-6 (migration 222–223) แก้/เพิ่มคำได้',
            'ทำตามแนวแอปเรียนภาษาเด็กยอดนิยม แต่ตัดส่วนขายของ/โฆษณา/ลิงก์ผู้ขายออกทั้งหมด',
        ],
    },
    {
        version: 'v1.102.0 (เกมคณิต AR "ขยับตอบเลข" — เอียงตัวซ้าย/ขวาเลือกคำตอบ ป.4-6)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมคณิตศาสตร์ ป.4-6 แนวตอบคำถาม 2 ตัวเลือก (`math/math-move-quiz`): ใช้กล้องจับการเคลื่อนไหว เอียงตัวไปทางซ้าย (A) หรือขวา (B) แล้วค้างไว้จนแถบเต็มเพื่อเลือกคำตอบ — สร้างบน KampaiAR engine',
            'Layout ใหม่ครั้งแรกของหมวด AR: จอเกมแสดงเต็มจอ + กล่องกล้องแทร็คขนาดเล็กที่มุมล่างขวา (ต่างจากเกม AR เดิมที่ใช้ภาพกล้องเต็มจอ) เหมาะกับการเล่นเป็นกลุ่มบนจอใหญ่',
            'มีโหมดแตะสำรองอัตโนมัติเมื่อเครื่องไม่มีกล้อง/ปฏิเสธสิทธิ์ (แตะแผงคำตอบได้), โบนัสคะแนนเมื่อตอบไว, สุ่มลำดับโจทย์ และเชื่อม KAMPAI SDK (Leaderboard/สถิติ/เสียง) ครบ',
            'ผ่านการตรวจสอบ verify:game 10/10 ข้อ (รวม Check 10 — AR engine) ติดตั้งด้วย SQL migration 221 พร้อม game_docs เรียบร้อย',
        ],
    },
    {
        version: 'v1.101.0 (เกมวิทยาศาสตร์ "Blocky Safari" — สุดยอดนักสำรวจพิทักษ์สัตว์โลก ป.4)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมวิทยาศาสตร์ ป.4 เรื่องการจำแนกประเภทกลุ่มสัตว์ (`science/blocky-safari`): พัฒนาเกมสำรวจ 3D ด้วย Three.js ช่วยเหลือและจำแนกกลุ่มสัตว์ (สัตว์เลี้ยงลูกด้วยนม สัตว์ปีก สัตว์เลื้อยคลาน สัตว์สะเทินน้ำสะเทินบก และปลา)',
            'ฟีเจอร์เด่น: ระบบกล้องวิ่งตามตัวละครทรงลูกบาศก์สุดน่ารัก, ป้ายชื่อสัตว์ลอยได้แบบบิลบอร์ด 2D หมุนเข้าหากล้องอัตโนมัติ, ระบบสุ่มเกิดและการเคลื่อนที่ลอยตัวของกลุ่มสัตว์ป่า',
            'ระบบตอบคำถามแยกประเภทสัตว์พร้อมระบบใบ้คำถามและเอฟเฟกต์การสั่นป้ายเมื่อตอบผิด, การเชื่อมโยงสถิติโปรไฟล์ (Best Score, Plays) และบอร์ดสถิติในเกม (Leaderboard) ร่วมกับ KAMPAI SDK อย่างสมบูรณ์',
            'ผ่านการตรวจสอบ verify:game 9/9 ข้อ พร้อมการติดตั้งด้วย SQL migration 220 รองรับการเข้าชมและใช้งานผ่านเส้นทางระบบจริงเรียบร้อย',
        ],
    },
    {
        version: 'v1.100.0 (เกมวิทยาศาสตร์ "Genetic Treasure Quest" — ล่าสมบัติพันธุศาสตร์ ป.6/ม.ต้น)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมวิทยาศาสตร์ ป.6/ม.ต้น เรื่องพันธุศาสตร์และการถ่ายทอดลักษณะ (`science/genetic-quest`): พัฒนาเกมแนว RPG 2D ด้วย Phaser 3 ผจญภัยบนเกาะจีโนมขนาดใหญ่ 4000x4000 พิกเซล แยกเป็น 7 กลุ่มระบบนิเวศ',
            'ฟีเจอร์เด่น: หีบสมบัติพันธุศาสตร์ 50 แห่ง, มอนสเตอร์ยีนกลายพันธุ์ไล่ล่าผู้เล่นบนแผนที่, ระบบตอบคำถามสะสมชิ้นส่วน DNA (A, T, C, G, Sugars, Phosphates) เพื่อนำมาเก็บสะสมในกระเป๋า',
            'ระบบความก้าวหน้าและการปลดล็อกความสำเร็จ (Achievements), การสะสมสถิติ EXP, การเลเวลอัปเพิ่มขีดจำกัดเลือด และเชื่อมโยง KAMPAI SDK บันทึกสถิติ Leaderboard ครบครัน',
            'ผ่านการตรวจสอบ verify:game 9/9 ข้อ พร้อมสำหรับอัปโหลดด้วย SQL migration 219 เพื่อรองรับข้อมูลเกมและรายละเอียดลงในฐานข้อมูลหลัก',
        ],
    },
    {
        version: 'v1.99.0 (เกมวิทยาศาสตร์ "Digestive System AR Explorer" — ระบบย่อยอาหารมหัศจรรย์ ป.4-6)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมวิทยาศาตร์ ป.4-6 เรื่องโครงสร้างและหน้าที่อวัยวะในระบบย่อยอาหาร (`science/digestive-ar`): เรียนรู้กายวิภาคผ่านระบบตรวจจับท่าทางมือแบบไฮเทค (Index/Thumb pinching) หรือเล่นโหมดสัมผัส/เมาส์ลากแบบมีโฮโลแกรมบอกใบ้',
            'พัฒนาลอจิกและฟิสิกส์ลากวางอัญรูป (Drag & Drop) เชื่อมต่อด้วยเส้นประโฮโลแกรมอัจฉริยะ (Beziers) พร้อมฝุ่นอนุภาคเวทมนตร์ (Particles) และพลุกระดาษเฉลองชัย',
            'ผูกติดกับ KAMPAI SDK สมบูรณ์แบบ: บันทึกคะแนนและสถิติเวลา Leaderboard, ปุ่มปิด/เปิดเสียง BGM/SFX ที่ไม่ทับซ้อนกับ UI หลัก',
            'ผ่านการตรวจสอบ verify:game 9/9 ข้อ พร้อมสำหรับอัปโหลดด้วย SQL migration 218 เพื่อรองรับข้อมูลเกมและรายละเอียดลงในฐานข้อมูลหลัก',
        ],
    },
    {
        version: 'v1.98.0 (เกมคณิตศาสตร์ "Farm Adventure" — ภารกิจวัดความยาวในฟาร์มมหาสนุก ป.4)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกมคณิตศาสตร์ ป.4 เรื่องการวัดความยาวและหน่วยวัดความยาว (`math/farm-adventure`): ผจญภัยฟื้นฟูฟาร์ม Chibi ผ่าน 5 ด่าน (วัดความยาวแปลงผัก, เปรียบเทียบหน่วย, แปลงหน่วย mm/cm/m/km, บวก-ลบความยาว, โจทย์ปัญหาประยุกต์)',
            'ฟีเจอร์ครบถ้วนตามมาตรฐาน: ระบบหัวใจ 5 ดวง, ระบบ streak combo โบนัส, การสะสมเหรียญทองเพื่อปลดล็อกสัตว์เลี้ยง Chibi (หมู วัว กระต่าย ไก่ ม้า) และการเลือกเพศชาวนาน้อย',
            'เชื่อมโยง KAMPAI SDK สมบูรณ์แบบ: บันทึกประวัติและคะแนนสูงสุดลงระบบ, leaderboard ในเกม, และมีปุ่มเปิด/ปิดเสียง SFX/BGM ครบถ้วน',
            'รัน verify:game ผ่าน 9/9 checks เรียบร้อย พร้อมไฟล์ SQL migration 217 สำหรับ seed ข้อมูลเกมและ game_docs เข้าสู่ educational-hub',
        ],
    },
    {
        version: 'v1.97.0 (เกม AR "จรวดพลังงาน" — โชว์ energy meter ครบ Tier 2 ทั้ง 3 แนว)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกม AR ตัวที่ 3 ของ engine Tier 2 → "🚀 จรวดพลังงาน" (`science/energy-rocket`): ขยับตัว/วิ่งอยู่กับที่เติมพลังจนเต็ม → ปล่อยจรวด (ใช้ `onEnergy`) — หยุดนิ่งพลังไหลลง บังคับเคลื่อนไหวต่อเนื่อง (ออกกำลัง)',
            'วัดพลังด้วย framediff (ไม่พึ่ง CDN — ทนเครื่องโรงเรียน) + ความรู้เรื่องพลังงาน/การเคลื่อนไหว · fallback แตะปุ่ม "ออกแรง" · verify:game 9/9 + Check 10 AR',
            'ครบ 3 แนว Tier 2 แล้ว: ยกมือ (hands) · กระโดด-ย่อ (gesture) · พลัง (energy) — ไม่แตะ engine เพิ่ม (ใช้ v1.1.0) · seed migration 216 + game_docs (apply remote)',
        ],
    },
    {
        version: 'v1.96.0 (เกม AR "กระโดดเลขคู่-คี่" — โชว์ gesture jump/squat)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เกม AR ตัวอย่างตัวที่ 2 ของ engine Tier 2 → "🦘 กระโดดเลขคู่-คี่" (`math/jump-even-odd`): กระโดด=เลขคู่ · ย่อตัว=เลขคี่ ใช้ `onGesture` (คอมมิตทันที ไม่ต้องค้าง) — แนวเคลื่อนไหวเต็มตัว เหมาะเล่นกลุ่ม/พละ',
            'fallback แตะ 2 ป้าย (เครื่องไม่มีกล้องเล่นได้) · ตรวจ jump/squat ด้วย MediaPipe Pose (ความเร็วแกน Y สะโพก) · verify:game 9/9 + Check 10 AR',
            'seed migration 215 + game_docs (apply remote แล้ว) — ต่อยอดจาก engine v1.1.0 (v1.95.0) โดยไม่แตะ engine เพิ่ม',
        ],
    },
    {
        version: 'v1.95.0 (AR Engine Tier 2 — ยกมือ/กระโดด/พลัง + เกม "ยกมือตอบ")',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'ขยาย engine `kampai-ar.js` v1.0.0 → v1.1.0: โหมด `hands` (ยกมือ ซ้าย/ขวา/สองมือ → เลือกคำตอบ, reuse hold→commit เดิม) + gesture `jump`/`squat` (onGesture) + พลังเคลื่อนไหว (onEnergy/ar.energy) + getters ar.y/ar.hands — backward compatible (เกม AR เดิมไม่กระทบ)',
            'เกม AR ตัวอย่าง "🙌 ยกมือตอบ" (`english/hands-up-quiz`) — ยกมือข้างที่ตรงคำตอบค้างไว้ + fallback แตะ · ตรวจด้วย MediaPipe Pose (ข้อมือเทียบไหล่) · verify:game 9/9 + Check 10 AR',
            'seed migration 214 (+ game_docs) · เอกสาร AR-GAME.md อัปเป็น v1.1.0 (โหมด/knob/API ใหม่ + Performance Tuning Log)',
        ],
    },
    {
        version: 'v1.94.0 (หน้าแรก — โซน "เกมแนะนำ" เลื่อนแนวนอน + ป๊อปอัปรายละเอียด)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'โซน "🎮 เกมแนะนำ" บนหน้าแรก — การ์ดปกเกมเลื่อนแนวนอน คลิกการ์ด → ป๊อปอัปรายละเอียด (ปก/คำอธิบาย/วิชา/ระดับชั้น/แท็ก/อันดับผู้เล่น top-5) + ปุ่ม "เล่นเลย" ไป /play/:slug — ดูเกมได้โดยไม่ต้องเข้าเมนูหลายชั้น',
            'เลือกเกมเองจากหลังบ้าน: ปุ่ม "🎮 หน้าแรก" (ปักหมุด) ในการ์ดเกม GamesTab → คอลัมน์ใหม่ educational_hub_items.homepage_featured (migration 213) · โซนซ่อนอัตโนมัติเมื่อไม่มีเกมปักหมุด',
            'เป็น section block จัดการได้ในตัวแก้เลย์เอาท์หน้าแรก (BlockPalette "เกมแนะนำ") + auto-inject ต่อจาก featured_hero ทั้ง desktop/mobile',
        ],
    },
    {
        version: 'v1.93.0 (ปก AI — เพิ่มตัวละครสาย "ผู้สร้าง" + แกนคุมขนาดตัวละคร)',
        date: '',
        badge: 'bg-pink-600',
        items: [
            'เพิ่มตัวเอก 6 แบบ: เด็กนักประดิษฐ์/เมกเกอร์ · โปรแกรมเมอร์น้อย · ศิลปิน/นักออกแบบน้อย · ตัวการ์ตูนมาสคอตกลม · สิ่งของมีชีวิต (ดินสอ/หนังสือ) · ฮีโร่จิ๋วใส่ผ้าคลุม (รวมเป็น 18 แบบ)',
            'เพิ่มแกนใหม่ "ขนาดตัวละคร": เล็ก (เน้นฉาก) / กลาง (สมดุล) / ใหญ่ (โดดเด่น) — คุมความเด่นของตัวละครในภาพได้ ("ไม่ใหญ่มาก" ก็เลือก เล็ก/กลาง)',
            'ชุดสำเร็จรูป 12 ชุดเซ็ตค่าขนาดให้เหมาะธีม (แอ็กชัน/เวทมนตร์ = ใหญ่ · นิทาน/ใต้ทะเล = เล็ก) — ขยายใน `coverPresets.ts` ที่เดียว Dialog/สุ่ม เด้งครบเอง',
        ],
    },
    {
        version: 'v1.92.0 (ปก AI — ขยายคลังคำสั่งเช็กลิสต์ให้ละเอียด/หลากหลายขึ้น)',
        date: '',
        badge: 'bg-pink-600',
        items: [
            'เพิ่มตัวเลือกในทุกแกนเดิม: สไตล์ภาพ 12 แบบ (เพิ่ม คอมมิค/ดินปั้น/กระดาษตัด/วอกเซล/สีเทียน/เวกเตอร์) · โทนสี 12 · ตัวเอก 12 (ครู/ชุดไทย/นักวิทย์/พ่อมด/มังกร) · ฉาก 21 · ฉากหลัง 14 · เอฟเฟกต์ 12',
            'เพิ่ม 3 แกนใหม่: อารมณ์ภาพ (สดใส/เร้าใจ/อบอุ่น/ลึกลับ/ฮา/ฝันละมุน) · มุมมองกล้อง (หน้าตรง/เงยฮีโร่/พาโนรามา/โคลสอัพ/ไดนามิก) · ความละเอียด (รายละเอียดสูง/เรียบ/มิติลึก/สีจัด)',
            'เพิ่มชุดสำเร็จรูปเป็น 12 ชุด (ใต้ทะเล/อวกาศ/ไทยมงคล/แล็บวิทย์/กีฬา/ขนมหวาน/เวทมนตร์) — ขยายในไฟล์ `coverPresets.ts` ที่เดียว Dialog เด้งครบเอง (buildParts/สุ่มรองรับอัตโนมัติ)',
        ],
    },
    {
        version: 'v1.91.0 (ปก AI เช็กลิสต์สำเร็จรูป — หลายสไตล์ + สไตล์โลโก้ชื่อเกม)',
        date: '',
        badge: 'bg-pink-600',
        items: [
            'เปลี่ยน "ปก AI" จากพิมพ์เอง → เลือกจากชิป (checklist ล้วน ไม่ต้องพิมพ์): สไตล์ภาพ/โทนสี/ตัวเอก/ฉาก/ฉากหลัง/เอฟเฟกต์ + "ชุดสำเร็จรูป" คลิกเดียวเซ็ตทุกแกน + ปุ่ม 🎲 สุ่ม — preset ทั้งหมดอยู่ที่ `coverPresets.ts` ที่เดียว',
            'หลายสไตล์ภาพ (chibi น่ารัก / อนิเมะแอ็กชัน / เกม 3D มันวาว / โปสเตอร์อิงเกม / นิทานสีน้ำ / พิกเซล) — client ประกอบ parts[] แล้ว `api/generate-cover.ts` ครอบ invariant (16:9 + ห้ามมีตัวอักษร + เว้นที่ด้านบน) เสมอ',
            'สไตล์โลโก้ชื่อเกม 5 แบบ (คลาสสิก/ทองนูน/แบนเนอร์/ป๊อป/นีออน) overlay ฝั่ง client — เปลี่ยนสไตล์โลโก้แล้ววาดทับใหม่ทันทีโดยไม่ต้อง gen ภาพใหม่ (ประหยัดเวลา/โควตา)',
        ],
    },
    {
        version: 'v1.90.0 (ปก AI — ปุ่มสร้างปกเกมด้วย AI ในหลังบ้าน GamesTab)',
        date: '',
        badge: 'bg-pink-600',
        items: [
            'ปุ่ม "🎨 ปก AI" ในการ์ดเกม (GamesTab) → กรอกฉาก/โทนสี → AI วาดภาพประกอบตามมาตรฐาน `public/COVER-PROMPT.md` (chibi เด็กไทย 16:9) → preview → "ใช้ปกนี้" เปลี่ยน thumbnail ทันที',
            'ตัวอักษรไทย (ชื่อเกม/วิชา) overlay ฝั่ง client ด้วย canvas (ฟอนต์ Sarabun) → คมชัดถูกต้อง ไม่ถูก AI สะกดเพี้ยน + canvas ส่งออก 1280×720 การันตี 16:9',
            'server `api/generate-cover.ts` (Vercel function) เรียก Pollinations (Flux ฟรี ไม่ต้องมี API key/billing) วาดเฉพาะภาพล้วน + ตรวจสิทธิ admin/teacher ผ่าน auth_role()',
        ],
    },
    {
        version: 'v1.89.0 (AR Game Scaffold — engine กลาง + เทมเพลต + read-first doc สำหรับเกมกล้อง/เคลื่อนไหว)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'AR engine กลาง `public/games/kampai-ar.js` (KampaiAR, single source แบบ kampai-sdk) — รวม camera/ตรวจจับ/zone-hold/fallback/cleanup; รองรับ 2 detector เลือกผ่าน config (frame-differencing / MediaPipe pose); แก้ engine ที่เดียว ทุกเกม AR ดีขึ้นพร้อมกัน',
            'เทมเพลต `public/games/_template-ar/` + เกมตัวอย่างเล่นได้จริง `demo/ar-zone-quiz/` (ยืน/แตะ 3 โซน เลือกคำตอบ, browser-verified) + คู่มือ `AR-GAME.md` (อ่านก่อนทำ: สถาปัตยกรรม + pitfalls + ตารางจูน + Performance Tuning Log)',
            'baked layout ที่ถูกต้อง (container กล้อง position:absolute กันบัค #gameScreen ยุบ 0px) + บังคับ tap fallback (เครื่องไม่มีกล้องเล่นได้) + verify:game Check 10 (AR) นำทางให้ใช้ engine',
        ],
    },
    {
        version: 'v1.88.0 (Multiply Race — โหมด 2 คนจอเดียว split-screen บน PC + สถิติแมตช์ในห้อง)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'เกม "แข่งสูตรคูณ" (multiply-race) เพิ่มโหมด 2 คนเล่นจอเดียวกัน แบ่งครึ่งจอซ้าย/ขวา แข่งเวลา 60 วิ คะแนนสูงกว่าชนะ — P1 ใช้ปุ่มลูกศร, P2 ใช้ WASD (เลย์เอาต์คำตอบแบบเพชรตรงทิศปุ่ม)',
            'รองรับจอยแพด: เสียบเล่นได้ทันที (จอย 1 = P1, จอย 2 = P2) + หน้าตั้งค่า remap ปุ่ม เก็บใน localStorage',
            'เลือกคู่แข่ง (P2) จากรายชื่อนักเรียนห้องเดียวกัน (รูป+รหัสจากฐานข้อมูล) + รูปแบบ Best-of-3/5 (ระบบยก) + สรุปผลรายแม่สูตรคูณหลังจบ',
            'เก็บสถิติแมตช์ในห้องแบบ reuse ระบบ online-stats (migration 208 · online_matches source=local) → head-to-head บนจอจบเกม + แชมป์ห้อง + แท็บ "ในห้อง (2 คน)" ในแดชบอร์ดสถิติแข่งของแอดมิน',
        ],
    },
    {
        version: 'v1.87.0 (Tank Commander — เกมยิงรถถัง 2D ผสมควิซตอบคำถามวิชาวิทยาการคำนวณและเทคโนโลยี ม.1-3)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เกมใหม่ "Tank Commander : Learning Edition" (tank-commander) ที่ /games/tech/tank-commander.html — ขับรถถังยิงต่อสู้ 2D Top-down ผสมผสานควิซคำถามวิทยาการคำนวณและทักษะการคิดเชิงคำนวณ ม.1-3',
            'ระบบควิซคัทซีนตอบคำถาม 4 หัวข้อหลัก (Hardware, Data, Algorithms, Cyber Safety) ท้าทายผู้เล่นทุกๆ 10 ศัตรูที่เอาชนะได้ ปรับความยากควิซอัตโนมัติ (Adaptive Learning) ตามสถิติถูก/ผิด',
            'ระบบอัพเกรดพารามิเตอร์พื้นฐาน (Damage, Speed, HP, Fire Rate, Crit) และสายพัฒนาความเชี่ยวชาญ (Assault, Engineer, Cyber Commander) เพื่อสู้กับบอสประจำ 4 ด่าน (CPU Destroyer, Data Corruptor, Logic Commander, Cyber Hacker King)',
            'รายงานวิเคราะห์ผลสะท้อนการเรียนรู้และคำแนะนำรายบุคคล (Personalized Analytics Report) หลังจบเกม พร้อมอัพเดทตาราง `game_docs` (migration 207) และปกภาพประกอบไซไฟ'
        ],
    },
    {
        version: 'v1.86.0 (TeacherGameAnalytics — แท็บ "วิจัยในชั้นเรียน" เปรียบเทียบก่อน-หลังเรียน + สร้างเอกสารวิจัย 5 บท)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'แท็บใหม่ในหน้าวิเคราะห์เกมของครู: เลือกช่วงวันที่ "ก่อนเรียน" + "หลังเรียน" → คำนวณคะแนนเฉลี่ยรายบุคคล/กลุ่ม (mean, SD, % ดีขึ้น) จาก game_sessions ที่มีอยู่แล้ว ไม่ต้อง migration ใหม่',
            'ปุ่ม "สร้างเอกสารวิจัย" เปิดฟอร์มให้ครูกรอกชื่อเรื่อง/ความสำคัญของปัญหา/วัตถุประสงค์/ข้อเสนอแนะ แล้ว generate เอกสารวิจัยในชั้นเรียน 5 บทแบบพิมพ์ได้ (window.print) — บทที่ 3-4 (วิธีดำเนินการ/ผลการวิจัย) auto-fill จากข้อมูลจริง',
            'Component ใหม่ ClassroomResearchTab.tsx + printClassroomResearchDoc.ts (mirror pattern จาก TrainingTranscriptPDF.tsx) — ใช้ sessionsQuery/studentsQuery เดิมของ TeacherGameAnalytics ไม่ query เพิ่ม',
        ],
    },
    {
        version: 'v1.85.0 (Educational Hub — ย่อบล็อก "อันดับ & เหรียญ" เป็นแถบสรุป+แท็บกดขยาย)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'รวม 3 การ์ด (DailyQuestPanel + GameRankings + HonorWall) ที่เคยซ้อนแนวตั้งกินพื้นที่ ~1,000px → GamificationHub การ์ดเดียว: แถบสรุปย่อ 1 แถว (LV ring + ชื่อ + XP bar + chips 🎮/🏅/🔥/🎯) สูงเหลือ ~143px (เดสก์ท็อป) / ~188px (มือถือ)',
            'ปุ่มแท็บ 3 อัน (🏆 อันดับ / 🎖️ เหรียญ / 🎯 ภารกิจ) collapsed by default — กดขยายดูเนื้อหาเต็ม, กดซ้ำ/สลับแท็บได้ → เปิดหน้า hub เห็นภาพปกเกมทันทีโดยไม่ต้องเลื่อนผ่าน gamification',
            'HonorWall เพิ่ม variant "medals" (ตู้เหรียญล้วน ไม่มีหัวโปรไฟล์ซ้ำ) + export LevelRing ใช้ร่วมกับแถบสรุป — reuse logic เดิมทั้งหมด ไม่เขียนตรรกะอันดับ/เหรียญ/quest ใหม่',
            'GamificationHub ใช้ queryKey เดียวกับ HonorWall/DailyQuestPanel (honor-profile / daily-quest-status) → react-query แชร์ cache ไม่ยิงซ้ำ; ไม่มี student code = โชว์เฉพาะแท็บ "อันดับ"',
        ],
    },
    {
        version: 'v1.84.0 (ตัวชี้วัดหลักสูตร — นำเข้าครบ 8 กลุ่มสาระ + สร้างเกมอิงตัวชี้วัด + Coverage)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'นำเข้าตัวชี้วัดทางการครบ 8 กลุ่มสาระ ป.1-6 จาก PDF สพฐ. (1,061 ตัวชี้วัด: ไทย180/คณิต116/วิทย์139/สังคม217/สุข120/ศิลปะ154/การงาน25/อังกฤษ110) — ตรงตารางสรุปหน้า 2 ทุกวิชา (mig 176-183)',
            'เพิ่มมิติ "ระหว่างทาง/ปลายทาง" (indicator_kind, mig 175) ตรวจจากตำแหน่งคอลัมน์ใน PDF + checksum — แสดงเป็น badge ทุก dialog ตัวชี้วัด',
            'ขยาย dropdown วิชาจาก 4 → 8 ครบทุกที่ (GameIndicatorsDialog/IndicatorMasteryTab/LessonPlanIndicatorsDialog) ผ่าน const กลาง src/lib/curriculumSubjects.ts',
            'GamesTab: ปุ่ม "🎯 ใช้ตัวชี้วัดช่วยสร้าง" (IndicatorPromptDialog) เลือกตัวชี้วัด → แนบเข้า GAME-PROMPT.md ให้ AI + จำไว้ auto-map เข้าเกมหลังอัปโหลดอัตโนมัติ',
            'GamesTab: badge "🎯 N ตัวชี้วัด" ต่อเกม + ปุ่ม "📊 ความครอบคลุมตัวชี้วัด" (IndicatorCoverageDialog) เห็นตัวชี้วัดไหนมีเกม/ยังขาด',
            'ฟอร์มอัปโหลดเกมรองรับครบ 8 หมวด (เดิม 3: คณิต/วิทย์/ไทย) → ไทย/คณิต/วิทย์/สังคม/สุข/ศิลปะ/การงาน/อังกฤษ ตรงกับ 8 กลุ่มสาระตัวชี้วัด',
        ],
    },
    {
        version: 'v1.83.0 (ตัวชี้วัดหลักสูตร — ผูกแผนการสอน↔ตัวชี้วัด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'LessonPlanManagement: ปุ่ม "ตัวชี้วัด" (🎯) ต่อแถวแผนการสอน → LessonPlanIndicatorsDialog เลือกตัวชี้วัดหลักสูตร 2551 ที่แผนนั้นครอบคลุม (ระบุ "ตัวชี้วัดที่เกี่ยวข้อง" ตามแบบแผนการสอนไทย) → เขียน indicator_lesson_plans (mig 170)',
            'subject ของแผน (ข้อความไทย) map เป็น subject_key อัตโนมัติ (คณิต/วิทย์/อังกฤษ/ไทย); เลือกข้ามชั้น/วิชาได้ (สะสมรวมกัน) เผื่อ subject ไม่ตรง',
            'consumer ที่ 3 ของ curriculum.service (setLessonPlanIndicators + listLessonPlanIndicatorIds) — ครบทั้ง mapping เกม + แผนการสอน',
            'ไม่แตะ pattern เดิมของ LessonPlanManagement (useState/useEffect) — เพิ่มเฉพาะปุ่ม+dialog แยก',
        ],
    },
    {
        version: 'v1.82.0 (ตัวชี้วัดหลักสูตร — แท็บความก้าวหน้ารายนักเรียน + ประเมินครู)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'Student 360° แท็บใหม่ "ตัวชี้วัด" (IndicatorMasteryTab): แสดงตัวชี้วัดทั้งหมดของวิชา+ชั้นนักเรียน (จัดกลุ่มตามสาระ) พร้อมสถานะรวม ยังไม่เริ่ม/กำลังฝึก/ผ่าน/เชี่ยวชาญ จาก v_student_indicator_mastery',
            'หลักฐานผสม 2 ทาง: อัตโนมัติจากเกม (attempts/ผ่านแล้ว แสดงต่อตัวชี้วัด) + ประเมินครู inline ระดับ 1-4 (กำลังพัฒนา/พอใช้/ดี/ดีเยี่ยม) → upsert student_indicator_assessments (ปีการศึกษาปัจจุบัน BE)',
            'ระดับชั้น derive จาก classroom (ป.5/2 → ป.5); รองรับเฉพาะประถม ป.1-6 ตาม seed ปัจจุบัน',
            'consumer ที่ 2 ของ curriculum.service (masteryByStudent + upsertAssessment) — ต่อจาก v1.81.0 ที่ผูกเกม↔ตัวชี้วัด',
        ],
    },
    {
        version: 'v1.81.0 (ตัวชี้วัดหลักสูตร — ผูกเกม↔ตัวชี้วัด + หลักฐานอัตโนมัติ)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ปุ่ม "ตัวชี้วัด" ในการ์ดเกม GamesTab → GameIndicatorsDialog: เลือกตัวชี้วัดหลักสูตรแกนกลาง 2551 (แยกวิชา+ชั้น, เลือกข้ามชั้น/วิชาสะสมรวมกัน) ที่เกมนั้นฝึก → เขียนตาราง indicator_games',
            'Phase 3 (migration 173): trigger trg_game_session_indicator_events บน game_sessions (AFTER INSERT, SECURITY DEFINER) → ทุกครั้งที่นักเรียนเล่น สร้างหลักฐาน student_indicator_events ให้ทุกตัวชี้วัดที่ผูกกับเกม (หา edu_hub_item จาก column ตรงหรือ fallback game_slug)',
            'passed: derive จาก metadata (passed/won/cleared) ถ้าเกมส่งมา — ไม่ส่ง = นับเป็น attempt (practicing) ตามดีไซน์หลักฐานผสม เกม+ครู',
            'ต่อยอดจาก Phase 1 (migration 170-172): ตัวชี้วัดภาษาไทย ป.1-6 (180 ตัวชี้วัด) + view v_student_indicator_mastery + curriculum.service.ts — service มี consumer แล้ว (listIndicators/listGameIndicatorIds/setGameIndicators)',
        ],
    },
    {
        version: 'v1.80.0 (รายละเอียดเกม — Game Docs registry ต่อเกม)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'ตาราง game_docs (migration 168, 1:1 กับ educational_hub_items) เก็บ รูปแบบเกม / ฟีเจอร์ / เวอร์ชันบิลด์ / notes — สเปกเดียวต่อเกม (แก้ทับ)',
            'RLS เห็นเฉพาะเจ้าของเกม (owner_staff_id) + ผู้ดูแลระบบ (is_admin) — ไม่มี public read · ไม่ล็อกอิน = ไม่เห็น (แยกตารางเพราะ educational_hub_items เปิดอ่านสาธารณะทั้งแถว)',
            'ปุ่ม "รายละเอียด" ในการ์ดเกม GamesTab → GameDocsDialog ดู/แก้ได้ในหลังบ้าน',
            'กฎใหม่ (DESIGN.md Rule 14.43): ทุกครั้งที่สร้าง/แก้เกม ต้อง upsert game_docs ใน migration เดียวกัน + เด้งเวอร์ชัน (เทมเพลตใน GAME.md)',
        ],
    },
    {
        version: 'v1.79.0 (สถิติแข่งออนไลน์ Win/Loss + สังเวียนแชมป์)',
        date: '',
        badge: 'bg-rose-600',
        items: [
            'ตารางเก็บแมตช์แข่งออนไลน์ (online_matches + online_match_participants) — reconstruct จาก game_sessions (mode=online) จับกลุ่ม (game_slug, room, ≤30 นาที) จัดอันดับด้วย score (migration 162)',
            'AFTER INSERT trigger process_online_match บน game_sessions (ไม่ต้องแก้เกม/SDK/kampai-match) + backfill ข้อมูลเก่า — รองรับ head-to-head ใครชนะใคร',
            'แดชบอร์ดแอดมิน /admin/dashboard/online-stats: วิเคราะห์เกม (ความนิยม/การมีส่วนร่วม/อัตราเล่นคนเดียว/ความสูสี + flag เกมควรปรับปรุง) · นักเรียน W/L + ตัวต่อตัวรายคู่ · ประวัติแมตช์',
            'หน้าสาธารณะ "สังเวียนแชมป์" /games/arena: KPI + leaderboard wins/win-rate (podium) + แมตช์ล่าสุด + เกมยอดนิยม (recharts)',
            'RPC public: get_online_overview/game_stats/student_leaderboard/head_to_head/match_log — ใช้วิเคราะห์ว่าเกมใดนิยม/ควรพัฒนาต่อ',
        ],
    },
    {
        version: 'v1.78.0 (ระบบ Daily Quest — ภารกิจประจำวันแยกตามวิชาแกน)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เดลี่เควสแยกวิชาแกน คณิต/ไทย/อังกฤษ: เล่นเกมในวิชานั้นให้ได้คะแนนถึงเกณฑ์ขั้นต่ำ = ผ่านเควสวันนั้น — เพิ่มวิชาอื่นได้จากหลังบ้าน (migration 161)',
            'Credit อัตโนมัติผ่าน trigger บน game_sessions (ไม่แตะ record_game_session) → รองรับ mode online: 2 คนเล่นด้วยกันได้เครดิตเควสทั้งคู่',
            'ทำครบทุกวิชา/วัน = คะแนนพิเศษเก็บแยก (quest points) + นับ streak 🔥 + โบนัส XP เข้าระบบ gamification เดิม (ตั้งค่าจำนวนได้จากหลังบ้าน)',
            'แจ้งผู้เล่น: DailyQuestPanel โชว์เควสที่เหลือ — หน้า pre-game (PlayGame) + หน้าฮับเกม + celebrate ตอนผ่านเควส/ครบทุกวิชา',
            'แดชบอร์ดสถิติ: หน้าแอดมิน /admin/dashboard/daily-quest (participation รายวัน + กรองชั้น + แนวโน้ม + streak + ตั้งค่าวิชา/โบนัส/เกณฑ์ต่อเกม) + หน้าสาธารณะจอใหญ่ /games/daily-quest (recharts)',
            'เกณฑ์คะแนนต่อเกม: educational_hub_items.quest_min_score (NULL = auto 50% ของ median) · RPC get_daily_quest_status/overview/trend/participation/streak_leaderboard',
        ],
    },
    {
        version: 'v1.77.0 (เกมใหม่ "รถซิ่งสูตรคูณ" — racing duel 2 เลน)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'เกมใหม่ math-rally (คณิตศาสตร์): แข่งรถ 2 เลน ตอบคำถามคณิตศาสตร์ถูกรถพุ่ง ผิดรถช้า+ควัน ถึงเส้นชัยก่อนชนะ 🏁 — โฟลเดอร์ 5 ไฟล์ตาม GAME.md, verify:game 8/8',
            'ไอเทมบนถนน: 🚀 นิโทร / 🛡️ โล่กันตอบผิด / ⭐ คะแนน×2 / 🐢 เต่าชะลอคู่แข่ง (vs คอมเท่านั้น) + สายฟ้า ⚡ ตอบเร็ว <2 วิ + คอมโบตัวคูณ',
            'โหมด: 🤖 แข่งกับคอม 3 ระดับ (ง่าย 70% / กลาง 85% / โหด 95%) + 🌐 ออนไลน์ผ่าน kampai-match (lobby/ลีก/ผู้ชม) + เลือกแม่สูตรคูณ 2-12 หรือผสม',
            'ตอบได้ทั้งแตะ/เมาส์ และคีย์ลูกศร ↑←→↓ ตาม layout ปุ่มเพชร (+ เลข 1-4) — มือถือ 375px ไม่ล้นจอ',
            'kampai-match เพิ่ม opts.onOpponent (ระยะคู่แข่งสด → ขยับรถเลนบน) + opts.rankBy "score" (อันดับตามระยะแทนจำนวนข้อถูก) — backward-compatible เกมเดิม 16 เกมไม่กระทบ',
        ],
    },
    {
        version: 'v1.76.1 (Gamification ครบ 8 กลุ่มสาระแกนกลาง)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'subject_keys() ขยายจาก 3 วิชา (คณิต/ไทย/อังกฤษ) → ครบ 8 กลุ่มสาระ: + วิทย์-เทคโนโลยี (วิทยาการคำนวณรวมในวิทย์ฯ ตามหลักสูตร 2560) / สังคมศึกษา / สุขศึกษา-พละ / ศิลปะ / การงานอาชีพ — ทุกวิชาใน DB map ครบ ไม่เหลือ "other" (migration 158)',
            'เหรียญวิชารอง 10 ใบ: เซียนวิทย์ฯ/สังคม/สุข-พละ/ศิลปะ/การงาน อย่างละ 2 ชั้น (ต้น 150 / สูง 500 XP) — วิชาหลักคง ladder 3 ชั้นเดิม',
            'ladder "รอบรู้" 3 ขั้น: รอบรู้ 4 วิชา (เงิน) → รอบด้าน 6 วิชา (ทอง) → ปราชญ์ 8 วิชา (เพชร 🦉)',
            'อันดับรายวิชา: แท็บ "รายวิชา" + chip strip 8 กลุ่มสาระ (เลื่อนแนวนอนบนมือถือ) แทนแท็บแยก 3 วิชา · HonorWall โชว์ chip วิชา top 4 ตาม XP',
        ],
    },
    {
        version: 'v1.76.0 (Gamification กลาง — XP ยุติธรรม + เหรียญเกียรติยศ + อันดับ)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'XP ใหม่ทุกเกม: เลิก score/10 (pizza เคยได้ XP ~100 เท่าของเกมคะแนนน้อย) → base 10 + perf 0-20 เทียบ median ของเกมตัวเอง + โบนัส online/daily/ชนะ — ทุกเกมยุติธรรมเท่ากัน + คำนวณย้อนหลังทุก session (migration 155)',
            'Diminishing: เกมเดิมเกิน 10 รอบ/วันได้แค่ฐาน → ผลักให้เด็กเล่นหลายเกมหลายแบบ',
            'เหรียญเกียรติยศ 2 ชั้น: สากล 30 ใบ (นักสำรวจ/นักสะสม XP/เซียนคณิต-ไทย-อังกฤษ/ขยัน/นักแข่ง-แชมป์ออนไลน์/เจ้าลีก/สายชาเลนจ์/ครบเครื่อง) + ประจำเกม 5 ใบ auto ทุกเกมรวมเกมอนาคต ไม่ต้อง seed มือ (migration 156)',
            'อันดับ 3 แบบ: รายสัปดาห์ (รีเซ็ตทุกจันทร์ — เด็กใหม่มีลุ้น) / รวม / รายวิชา คณิต-ไทย-อังกฤษ + HonorWall (level ring + streak 🔥 + ตู้เหรียญ + แถบใกล้ปลดล็อก) ใน hub เกม /h/* และจอ pre-game (migration 157)',
            'kampai-match ส่ง rank/players/tournament ใน metadata ตอนรับ XP → เหรียญแชมป์/เจ้าลีกนับชนะจริงทั้ง 16 เกมออนไลน์',
        ],
    },
    {
        version: 'v1.75.1 (แก้ HUD ทับปุ่มระบบ + จัดเลย์เอาท์มือถือ — "แข่งคำศัพท์")',
        date: '',
        badge: 'bg-slate-700',
        items: [
            'เกม "แข่งคำศัพท์" (vocab-race): แถบคะแนน/ชีวิต (#hud) เคยอยู่ขอบบนสุดทับกับปุ่มเสียง SDK (ซ้ายบน) และปุ่มเต็มจอ/เมนูของ wrapper (ขวาบน) → มองไม่เห็นคะแนน',
            'แก้: เว้น "แถบบนของระบบ" ~56px แล้วดัน HUD + ทุกจอ (start/จบเกม/บัตรเรียน) ลงมาใต้แถบ → ไม่ทับปุ่มระบบอีก',
            'จัดเลย์เอาท์มือถือ: ย่อ font HUD + media query (≤480px และจอเตี้ยแนวนอน) ลดระยะ/ย่อโจทย์ให้พอดีจอ กดง่าย มองชัด — แก้ CSS ไฟล์เดียว ไม่แตะ SDK/wrapper · verify:game 8/8 + เทสเดิมครบ',
        ],
    },
    {
        version: 'v1.75.0 (แข่งเร็ว "แข่งคำศัพท์" — เลือกหมวดได้ รวม/แยก/ผสม)',
        date: '',
        badge: 'bg-orange-700',
        items: [
            'โหมด ⚡ แข่งเร็ว (vocab-race): แตะแล้วเลือกหมวดที่จะแข่งได้ — 🌈 รวมทั้งหมด หรือเลือกแยกหมวด + ผสมหลายหมวดได้ แล้วกด "เริ่มแข่ง!"',
            'กติกา: เลือก "รวมทั้งหมด" = เอาทุกหมวด (ล้างการเลือกแยก) · แตะหมวด = ปิดรวมอัตโนมัติ · ปิดจนไม่เหลือ = กลับเป็นรวมทั้งหมด · ค่าเริ่มต้น = รวม (เหมือนเดิม)',
            'หมวดที่เลือกทำงานร่วมกับตัวกรองระดับชั้น (ป.1-3/ป.4-6) · online ไม่กระทบ (ทุกหมวด seeded ตรงกัน) · ฝึกหมวดยังเลือกทีละหมวด',
            'ไฟล์เดียว ไม่แตะ DB/SDK · verify:game 8/8 + jsdom features 32/32 (เพิ่มเทสเลือกหมวด) · study 23/23 · speak 6/6',
        ],
    },
    {
        version: 'v1.74.1 (โหมดเรียนศัพท์ "แข่งคำศัพท์" — เพิ่มเสียงไทย + คำแปลประโยค)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'โหมดฝึกอ่าน/เรียนศัพท์ (vocab-race): เปลี่ยนการ์ด → อ่านออกเสียงอังกฤษแล้วตามด้วยไทยอัตโนมัติ + ปุ่ม 🔊 อังกฤษ / 🗣️ ไทย แยกกัน (แตะคำไทยก็ฟังเสียงไทยได้)',
            'เพิ่มคำแปลไทยของประโยคตัวอย่างทุกคำ (exTh ~110 ประโยค) แสดงใต้ประโยคอังกฤษ — แตะประโยคอังกฤษ/ไทยเพื่อฟังเสียงภาษานั้น ๆ',
            'verify:game 8/8 + jsdom: study 23/23 (เพิ่มเช็กคำแปล/เสียงไทย) · features 24/24 · speak 6/6',
        ],
    },
    {
        version: 'v1.74.0 (ยกเครื่องเกม "แข่งคำศัพท์" — 9 ฟีเจอร์ใหม่)',
        date: '',
        badge: 'bg-sky-700',
        items: [
            'เกม "แข่งคำศัพท์" (vocab-race) ขยายคลังคำ 8→12 หมวด ~110 คำ (เพิ่ม คำกริยา/อากาศ/อาชีพ/ยานพาหนะ) · ทุกคำมีระดับชั้น (ป.1-3 / ป.4-6) + ประโยคตัวอย่าง',
            'ชนิดคำถาม 3 แบบสุ่มสลับ: ไทย→อังกฤษ · อังกฤษ→ไทย · 🔊 ฟังเสียง→เลือกภาพ (ฝึกครบ อ่าน/แปล/ฟัง) · เลือกระดับชั้น ป.1-3/ป.4-6/ทั้งหมด · แตะรูปฟังซ้ำได้',
            '📕 ทบทวนคำที่พลาด: จำคำที่ตอบผิดลงเครื่อง → เปิดบัตรคำเฉพาะคำที่อ่อน + เล่นทบทวน (ตอบถูกแล้วถอดออกจากคลัง) · บัตรฝึกอ่านโชว์ประโยคตัวอย่าง+ฟังได้',
            'จบเกม: ดาว 1-3 ตามความแม่น + สรุปรายการคำที่พลาด(พร้อมคำแปล)ให้ทบทวน · เหรียญสะสม (นักผจญภัย/ถูกติด10/200คะแนน/แม่นเต็มร้อย/สะสม50คำ) · 🌟 คำประจำวัน · juice particle+คะแนนลอยตอนตอบถูก',
            'ไฟล์เดียว ไม่แตะ DB/SDK · verify:game 8/8 + 3 ชุดเทส jsdom (study 19/19 · speak 6/6 · features 24/24: ระดับชั้น/ชนิดคำถาม/คำพลาด/เหรียญ/คำประจำวัน)',
        ],
    },
    {
        version: 'v1.73.0 (โหมด "ฝึกอ่าน" บัตรคำ — เกม "แข่งคำศัพท์")',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'เกม "แข่งคำศัพท์" (vocab-race) เพิ่มโหมด 📖 ฝึกอ่าน — เรียนคำก่อนเล่น: เลือกหมวด → บัตรคำทีละใบ (รูป emoji ใหญ่ + คำอังกฤษ + คำแปลไทย) อ่านออกเสียงอัตโนมัติ ปัดนิ้ว/กดลูกศร/ปุ่ม 🔊 เปลี่ยน-ฟังเสียงได้ มีแถบความคืบหน้า (เช่น 3/12)',
            'เรียนจบกดปุ่ม "▶ เล่นเกมหมวดนี้เลย!" เด้งเข้าโหมดฝึกหมวดเดิมทันที (เรียนง่าย → เล่นต่อสนุก) · กันคีย์ 1-4 ไม่ให้ไปตอบควิซตอนอยู่จอเรียน',
            'reuse คลังคำ WORDS/CATS + ระบบเสียง TTS เดิม (ใช้ speak interrupt → ปัดเร็วเสียงไม่หาย) · ไฟล์เดียว ไม่แตะ DB/SDK · verify:game 8/8 + scripts/test-vocab-race-study.mjs 19/19 (jsdom: เปิด/ปัด/clamp ขอบ/เด้งเข้าเล่น)',
        ],
    },
    {
        version: 'v1.72.1 (แก้บั๊กเสียงอ่านคำหายตอนตอบถูก — เกม "แข่งคำศัพท์")',
        date: '',
        badge: 'bg-sky-700',
        items: [
            'เกม "แข่งคำศัพท์" (vocab-race): ตอบถูกแล้วเสียงอ่านคำอังกฤษหาย (โดยเฉพาะตอนเล่นเร็ว) — เพราะ KAMPAI.sound.speak() มี guard ทิ้งเสียงใหม่ถ้ามีเสียงเก่าค้างอยู่ (เสียงไทยของโจทย์ยังพูดไม่จบ → เสียงอังกฤษโดนทิ้ง)',
            'แก้ที่ SDK: เพิ่ม param ตัวที่ 3 speak(text, lang, interrupt) — interrupt=true จะ cancel เสียงค้างก่อนแล้วพูดคำใหม่ (เสียงล่าสุดชนะ). ค่า default เดิม = guard กันทับ → เกมอื่นทุกตัว (เรียกแบบ 2 args) ไม่กระทบ',
            'vocab-race: speakQuestion()/speakAnswerEn() ส่ง interrupt=true → ตอบถูกได้ยินคำอังกฤษทุกครั้ง + ขึ้นโจทย์ใหม่ได้ยินคำไทยเสมอ · scripts/test-vocab-race-speak.mjs (6 เคส โหลด SDK จริง: guard/interrupt/regression)',
        ],
    },
    {
        version: 'v1.72.0 (เกม "ตรรกะสวิตช์ไฟ" — เทคโนโลยี/วิทยาการคำนวณ ป.6 · ครบชุด 4 เกม)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'เกมใหม่ "ตรรกะสวิตช์ไฟ" (logic-gates) ที่ /games/tech/logic-gates.html — วงจรเกตตรรกะ (AND/OR/NOT/XOR/NAND/NOR): สวิตช์ป้อนเข้า → เกต → หลอดไฟ 💡 วาดเป็นไดอะแกรม SVG. โจทย์กันมั่ว: กำหนดค่าสวิตช์มาให้ → ทำนายว่าหลอดไฟ "ติด" หรือ "ดับ" — สอนตรรกะ boolean (ป.6)',
            '11 รูปแบบวงจรไล่ความยาก (เกตเดี่ยว → 2 เกตซ้อน เช่น (A AND B) OR C, (A XOR B) AND C) สุ่มค่าสวิตช์ทุกรอบ · ไดอะแกรมเรนเดอร์อัตโนมัติแบบ layered (สวิตช์ซ้าย→เกต→หลอดไฟขวา) · 2 โหมด (แข่งเวลา 60 วิ / ฝึก 3 ชีวิต) + คีย์ลัด 1/2',
            'KAMPAI SDK เต็ม · migration 146 (apply remote, sort 75, bgm playful) · ปก SVG ธีม emerald · verify:game 8/8 + scripts/test-logic-gates.mjs (115 เคส: truth table 6 เกต + ทุกวงจรประเมินครบทุกชุดสวิตช์ + ไม่คงที่ + integrity topo/out/switches)',
            '🎉 ครบชุด 4 เกมวิทยาการคำนวณ (online-safety · debug-it · binary-bits · logic-gates) — วิชาเทคโนโลยีจาก 2 → 6 เกม ครอบคลุม พลเมืองดิจิทัล · debug · การแทนข้อมูล · ตรรกะ',
        ],
    },
    {
        version: 'v1.71.0 (เกม "ถอดรหัสเลขฐานสอง" — เทคโนโลยี/วิทยาการคำนวณ ป.5-6)',
        date: '',
        badge: 'bg-violet-700',
        items: [
            'เกมใหม่ "ถอดรหัสเลขฐานสอง" (binary-bits) ที่ /games/tech/binary-bits.html — หลอดไฟบิตเรียงตามค่าประจำหลัก (16 8 4 2 1) สอน "การแทนข้อมูล" ฐานสอง↔ฐานสิบ. 2 ชนิดโจทย์สลับกัน: แทนเลข (แตะหลอดบิตให้ผลรวม = เป้า แล้วกดตรวจ) · อ่านบิต (เลือกค่าฐานสิบจาก 4 ตัวเลือก MCQ)',
            'ไล่ระดับ: 5 ข้อแรก 4 บิต (0–15) แล้วเลื่อนเป็น 5 บิต (0–31) · ตัวลวง MCQ บางตัว "ต่างกัน 1 บิต" เพิ่มความท้าทาย · 2 โหมด (แข่งเวลา 60 วิ คอมโบ / ฝึก 3 ชีวิต)',
            'KAMPAI SDK เต็ม (score/leaderboard/sound) · migration 145 (apply remote, sort 74, bgm playful) · ปก SVG ธีม violet (หลอดบิต 1101=13) · verify:game 8/8 + scripts/test-binary-bits.mjs (round-trip ทุกค่า 0–31 + makeQuestion 8000 รอบ: target ในช่วง + bits↔target ตรง + MCQ 4 ไม่ซ้ำมีคำตอบ)',
        ],
    },
    {
        version: 'v1.70.0 (เกม "พิชิตบั๊ก" — เทคโนโลยี/วิทยาการคำนวณ ป.4-6)',
        date: '',
        badge: 'bg-amber-700',
        items: [
            'เกมใหม่ "พิชิตบั๊ก" (debug-it) ที่ /games/tech/debug-it.html — ต่อยอด robot-path: แต่ละด่านมี "โปรแกรมหุ่นยนต์ที่มีบั๊ก" มาให้แล้ว (หุ่นชนกำแพง/ไปไม่ถึงธง) → แตะคำสั่งที่ผิดเพื่อหมุนเปลี่ยนทิศ ⬆️→➡️→⬇️→⬅️ แก้ให้หุ่นถึงธง — สอน "การตรวจหาข้อผิดพลาด (debug)" ตรงหลักสูตร',
            '8 ด่านบั๊กไล่ความยาก (ออกนอกแถว/ชนขอบ/ชนกำแพง/พลาดดาว/บั๊กในลูป) แต่ละด่านแก้ได้ด้วยการหมุน 1–2 คำสั่ง · ใช้ engine ร่วม runProgram() กับ robot-path · 2 โหมด (แข่งด่าน 3 ชีวิต+คอมโบ / ฝึกหัด)',
            'KAMPAI SDK เต็ม (score/leaderboard/sound) · migration 144 (apply remote, sort 73, bgm playful) · ปก SVG ธีม amber (หุ่นชน 💥+คำสั่งบั๊ก) · verify:game 8/8 + scripts/test-debug-it.mjs (68 เคส: ทุกด่าน buggy ล้มเหลวจริง + fix ถึงธง + แก้ได้ด้วยการหมุน 1–2 ตำแหน่ง + integrity)',
        ],
    },
    {
        version: 'v1.69.0 (เกม "ปลอดภัยออนไลน์" — เทคโนโลยี/พลเมืองดิจิทัล ป.4-6)',
        date: '',
        badge: 'bg-cyan-700',
        items: [
            'เกมใหม่ "ปลอดภัยออนไลน์" (online-safety) ที่ /games/tech/online-safety.html — การ์ดสถานการณ์บนโลกออนไลน์ → ตัดสิน 👍 ปลอดภัย/ควรทำ หรือ 👎 เสี่ยง/ไม่ควรทำ + เหตุผล. 36 การ์ด 6 หมวด: รหัสผ่าน · ข้อมูลส่วนตัว · กลโกง/สแปม · กลั่นแกล้งไซเบอร์ · เวลาหน้าจอ · ลิขสิทธิ์/มารยาท — สอนพลเมืองดิจิทัล (digital citizenship)',
            '2 โหมด: แข่งเวลา 60 วิ (คอมโบทวีคูณ) · ฝึก 3 ชีวิต + คีย์ลัด 1/2 · เสียง+TTS อ่านสถานการณ์. เข้าวัฒนธรรม kampai เต็ม (SDK + submitScore + leaderboard) · migration 143 (apply remote, sort 72, bgm playful) · ปก SVG ธีม cyan (โล่+กุญแจ) · verify:game 8/8 + scripts/test-online-safety.mjs (258 เคส: data-integrity ทุกการ์ด + สมดุล good/bad + กลไกคะแนน)',
        ],
    },
    {
        version: 'v1.68.0 (เกม "หุ่นยนต์ทำตามคำสั่ง" — เทคโนโลยี/วิทยาการคำนวณ ป.4-6)',
        date: '',
        badge: 'bg-indigo-700',
        items: [
            'เกมใหม่ "หุ่นยนต์ทำตามคำสั่ง" (robot-path) ที่ /games/tech/robot-path.html — เติมวิชาเทคโนโลยีที่ยังมีเกมน้อยสุด (1→2 เกม). วางลำดับคำสั่ง ⬆️⬇️⬅️➡️ ให้หุ่นเดินบนตาราง หลบกำแพง 🧱 เก็บดาว ⭐ ไปถึงธง 🏁 → กด ▶️ รัน → หุ่นเดินทีละช่อง · ชนแล้วแก้คำสั่งใหม่ได้ (debug). แกนวิชา: การคิดเชิงคำนวณ · ขั้นตอนวิธี (algorithm) · ลูป · การแก้จุดบกพร่อง',
            '8 ด่านไล่ความยาก (เส้นตรง → หักมุม → อ้อมกำแพง → เก็บดาว → บันไดที่ต้องใช้ 🔁 ทำซ้ำทั้งชุด ×N → เขาวงกต → 2 ดาว). โบนัสประหยัดคำสั่ง (ใช้ ≤ par) จูงใจให้ใช้ลูป · 2 โหมด: แข่งด่าน (3 ชีวิต + คอมโบ นับอันดับ) · ฝึกหัด (ไม่กดดัน เล่นครบทุกด่าน). คุมด้วยปุ่ม D-pad บนจอ + ลูกศรคีย์บอร์ด',
            'เข้าวัฒนธรรม kampai เต็ม: KAMPAI SDK + submitScore + ป้ายผู้เล่น + leaderboard ในเกม + ระบบเสียง · migration 142 (apply remote แล้ว, sort 71, bgm playful) · ปก SVG ธีม indigo · verify:game 8/8 + scripts/test-robot-path.mjs (58 เคส: ทุกด่านมีเฉลยผ่านจริง ≤ par + crash/incomplete/star-gate + integrity ตาราง)',
        ],
    },
    {
        version: 'v1.67.0 (เกม "พิกัด 3 มิติ" — คณิตศาสตร์ ป.4-6, 3D Three.js)',
        date: '',
        badge: 'bg-cyan-700',
        items: [
            'เกมใหม่ "พิกัด 3 มิติ" (coord-3d) ที่ /games/math/coord-3d.html — ระบบพิกัด 3 มิติ (Three.js): จุดเป้าหมายบนแกน X(แนวนอน)/Y(แนวตั้ง)/Z(ลึก) ลากเพื่อหมุนกล้องดูรอบด้าน แล้วเลือกพิกัด (x, y, z) ที่ถูกต้องแบบ MCQ — ต่อยอดตระกูลเกม 3D คณิต (solid-3d/net-3d/block-3d)',
            'เข้าวัฒนธรรม kampai เต็ม: KAMPAI SDK + submitScore + ป้ายผู้เล่น + leaderboard ในเกม + ระบบเสียง · migration 141 (apply remote แล้ว, sort 26, bgm playful) · ปก SVG ธีม cyan + แกน isometric · verify:game 8/8 + scripts/test-coord-3d.mjs (logic test makeQuestion 6000 รอบ: 4 ตัวเลือกไม่ซ้ำ + มีคำตอบ + พิกัดในช่วง)',
        ],
    },
    {
        version: 'v1.66.0 (เกม "ล้างมือ 7 ขั้น" — สุขศึกษา ป.4-6 + โหมดออนไลน์)',
        date: '',
        badge: 'bg-teal-700',
        items: [
            'เกมใหม่ "ล้างมือ 7 ขั้น" (handwash-order) ที่ /games/health/handwash-order.html — เรียงลำดับขั้นตอนล้างมือ 7 ขั้นให้ถูก: การ์ด 7 ใบสลับมั่ว (ฝ่ามือถูฝ่ามือ → ซอกนิ้ว → ประสานนิ้ว → หลังนิ้ว → หัวแม่มือ → ปลายนิ้ว → ข้อมือ) แตะตามลำดับ 1→7 ลงราง เติมวิชาสุขศึกษาที่ยังมีเกมน้อย (1→2 เกม)',
            '3 โหมด: แข่งเร็ว (3 ชีวิต + โบนัสเร็ว + คอมโบทุก 2 รอบไร้พลาด นับอันดับ) · ฝึกหัด (ไม่กดดัน เรียนรู้ลำดับ) · ออนไลน์แข่งสดต่างเครื่อง (kampai-match, seeded shuffle การ์ดสลับเหมือนกันทุกเครื่อง)',
            'เข้าวัฒนธรรม kampai เต็ม: KAMPAI SDK + submitScore + ป้ายผู้เล่น + leaderboard ในเกม + ระบบเสียง · migration 140 (apply remote แล้ว, bgm playful) · ปก SVG · verify:game 8/8 + scripts/test-handwash-order.mjs (jsdom 104 เคส: ตรวจ 7 ขั้น/แตะถูก→คะแนนขึ้น/แตะผิด→เสียชีวิต)',
        ],
    },
    {
        version: 'v1.65.2 (อัปเกรดเกม AR "อัจฉริยะสองภาษา" — เวอร์ชันปรับปรุง)',
        date: '',
        badge: 'bg-cyan-700',
        items: [
            'นำเข้าเวอร์ชันปรับปรุงของเกม AI Hand Gesture (ai-hand-gesture-game) ที่ /games/thai/ai-hand-gesture-game.html — เกมโบกมือ MediaPipe Hands สองภาษา: ไทย (มาตรา/ไวยากรณ์/ประโยค/คำพ้อง/คำควบกล้ำ) + อังกฤษ (classic/translation/spelling) · ทูทอเรียลแบบโต้ตอบ · พจนานุกรมในเกม · โหมดเมาส์/สัมผัส fallback',
            'เข้าวัฒนธรรม kampai (port ไฟล์เดียว, slug เดิม): ถอด bg เป็นไฟล์ PNG แยก (828KB→113KB), KAMPAI SDK + submitScore ตอนหมดเวลา + ป้ายผู้เล่น + ปุ่มออกเกมบนจอ title/game-over',
            'guard MediaPipe: ถ้า CDN โหลดไม่ได้ (เครื่องโรงเรียน/offline) → shim no-op เกมเล่นโหมดเมาส์ได้ ไม่ crash · ใช้ slug เดิมเก็บ leaderboard history (migration 139 apply remote แล้ว) · verify:game 8/8',
        ],
    },
    {
        version: 'v1.65.1 (จัดแถวรูปนักเรียนในการ์ดเกมให้อยู่แนวเดียวกัน)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'EduHubItemCard (grid/spotlight): แก้ mini-leaderboard (รูปนักเรียน Top 5) ที่อยู่คนละระดับเพราะแท็ก 1 vs 2 บรรทัดดันตำแหน่ง → การ์ดเป็น flex-col h-full + pin แถวรูปไปล่างสุด (mt-auto) → ทุกการ์ดในแถวรูปอยู่แนวเดียวกัน ช่องว่างไปอยู่โซนแท็กด้านบนแทน',
            'reserve แถว leaderboard ไว้เสมอสำหรับเกม tracked (min-h + placeholder "ยังไม่มีผู้เล่น") → เกมที่ยังไม่มีคะแนนก็ไม่ทำให้แถวเหลื่อม',
        ],
    },
    {
        version: 'v1.65.0 (เกม RPG "ภารกิจกอบกู้อาณาจักร" — บูรณาการ ไทย+คณิต ป.4-5)',
        date: '',
        badge: 'bg-purple-700',
        items: [
            'นำเข้า + ปรับเกม RPG ผลัดตา "ภารกิจกอบกู้อาณาจักร" (thai-edu-rpg) ที่ /games/thai/thai-edu-rpg.html — ตอบคำถามคณิต+ไทยเพื่อโจมตีบอส 15 ตัว 5 โซน · เลือกอาชีพ (นักรบ/เวทย์/บวช) · เลเวล/สแตตัส/การ์ดสกิล/fever/ร้านค้า/achievements/lore/daily quest · เสียง+particle ในตัว',
            'เข้าวัฒนธรรม kampai (port ไฟล์เดียว): KAMPAI SDK + ส่งคะแนน power score ทุกครั้งที่ชนะบอส + ป้ายผู้เล่น + leaderboard + ปุ่มกลับ hub บนจอ title',
            'ตัดระบบที่ชน/ซ้ำ + anti-pattern ออก: Online PvP (Firebase SDK) · Live Class (BroadcastChannel) · Teacher Mode dashboard ในเกม — เหลือ RPG เล่นเดี่ยวสะอาด ใช้ leaderboard/นักเรียนของ kampai',
            'ขยายคลังคำถาม 12+12 → 40+40 (คณิต: ตัวประกอบ/จำนวนเฉพาะ/ห.ร.ม./ค.ร.น./เศษส่วน/ทศนิยม/เลขยกกำลัง · ไทย: ไวพจน์/ชนิดคำ/คำเป็นคำตาย/ราชาศัพท์) · migration 138 (apply remote แล้ว) · ปก SVG ชั่วคราว · verify:game 8/8 + jsdom playthrough (navigate+battle+answer) ไม่มี error',
        ],
    },
    {
        version: 'v1.64.1 (ยกระดับเกมตัวอย่างในเทมเพลต — baseline เกมใหม่ทุกตัว)',
        date: '',
        badge: 'bg-cyan-700',
        items: [
            'ปรับเกมตัวอย่างใน _template-folder (รับดาว) ให้เป็น reference คุณภาพสูง — เกมใหม่ทุกตัว cp -r ไป = ได้ baseline สูงขึ้น แล้วแค่สลับเนื้อหา (คงโครงวัฒนธรรม SDK/leaderboard/เสียง/ออนไลน์ + คอมเมนต์ // [JUICE]/[MODE] ให้ลอกง่าย)',
            'ความสนุก (juice): particle burst + คะแนนเด้งลอยขึ้น + คอมโบตัวคูณ 🔥 + สั่นจอตอนเสียชีวิต + ตะกร้า squash-pop + ดาวหมุน',
            'เนื้อหา/โหมด: ของดี ⭐ / ของร้าย 💣 (เสียชีวิต) / โบนัส 💎 + ไต่เลเวลความยาก (toast) + 2 โหมด (🗺️ ผจญภัย / ⏱️ แข่งเวลา) นอกจากออนไลน์',
            'ท้าทาย/UX: ดาว 1–3 ตอนจบ (ตาม STAR_THRESHOLDS) + จอเลือกโหมด + HUD combo/level/timer + ลากตะกร้าตามนิ้ว (lerp) · ทดสอบ jsdom playthrough ครบ 3 โหมด+ทุก branch ไม่มี runtime error',
        ],
    },
    {
        version: 'v1.64.0 (วัฒนธรรมเกม v2 — โครงสร้างโฟลเดอร์ 5 ไฟล์ + โหมดออนไลน์)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'โครงสร้างเกมแบบโฟลเดอร์ (แทนไฟล์ HTML เดียวหลายร้อยบรรทัด): แยก index.html + style.css + config.js (พารามิเตอร์) + data.js (เนื้อหา) + game.js (ลอจิก) → แอดมิน/ครูปรับ ระบบ/ภาพ/เสียง/พารามิเตอร์ ทีละส่วนได้ง่าย · เทมเพลต cp -r _template-folder · เกมเก่า ~30 เกมคงไฟล์เดียว ค่อยทยอยย้าย',
            'โหมดออนไลน์ "ถามก่อนสร้าง": ทุกเกมที่เหมาะ (เก็บแต้ม/แข่งเวลา) ควรมีโหมดแข่งสดต่างเครื่อง (kampai-match) — GAME.md/GAME-PROMPT.md เพิ่มกฎถามก่อน + ตารางเกมที่เหมาะ/ไม่เหมาะ',
            'นำร่อง: ย้าย "ฟังแล้วสะกด" (listen-spell) เป็นโฟลเดอร์ 5 ไฟล์ + เพิ่มปุ่ม 🌐 ออนไลน์ (race seeded rng) · migration 137 (apply remote แล้ว) · ปกย้ายเข้าโฟลเดอร์',
            'verify:game อัปเกรดรองรับเกมโฟลเดอร์ (resolve โฟลเดอร์→index.html, inline sibling scripts เข้า static checks, eval relative siblings ใน render, slug จาก config) — เกมไฟล์เดียวเดิมยังผ่าน 8/8 (regression)',
        ],
    },
    {
        version: 'v1.63.1 (sync วัฒนธรรมเกม — GAME.md + GAME-PROMPT.md + เทมเพลต)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'sync เอกสาร "วัฒนธรรมเกม" ให้ตรงของจริงที่ ship อยู่: GAME.md เพิ่ม "เช็กลิสต์วัฒนธรรมมาตรฐานจุดเดียว" (จอเริ่ม/HUD/จอจบ/เสียง/มือถือ) + ตาราง KAMPAI.sound.* ใน SDK API + หมวด "🎥 เกม AR/กล้อง" (getUserMedia, allow=camera, jsdelivr pose, แตะสำรอง) อิง vocab-move',
            'แก้ความไม่สอดคล้อง: verify 6/6 → 8/8 ทุกจุด · migration pattern เก่า (UPDATE WHERE id) → idempotent DO $$ block จริง (อิง 136) + ย้ำขั้นตอน "apply เข้า remote" · อัป footer version',
            'กระจายระบบเสียงเข้าเทมเพลต/prompt ที่ตกหล่น: GAME-PROMPT.md (fallback stub + section เสียง + TTS) · _template-full.html (defaultBgm + mountToggles + correct/wrong/gameOver/bgm) — เกมใหม่จากเทมเพลต/AI จะมีเสียงครบโดยไม่ตกวัฒนธรรม · gotcha #kampai-snd ทับ HUD',
        ],
    },
    {
        version: 'v1.63.0 (เกม AR กล้อง "เดินตอบศัพท์" — อังกฤษ ป.4-6)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'นำเข้า + ปรับเกม AR กล้อง "เดินตอบศัพท์" (vocab-move) ที่ /games/english/vocab-move.html — MediaPipe Pose ตรวจจับร่างกาย: เห็นคำศัพท์อังกฤษ → เดินซ้าย/ขวาหน้ากล้องไปยืนฝั่งคำแปลที่ถูก (ยืนค้าง 1 วิ = ตอบ) · กลไก "ขยับร่างกายจริง" เกมแรกของระบบ',
            'ปรับเข้าวัฒนธรรมเกมมาตรฐาน (KAMPAI SDK): ส่งคะแนน + leaderboard/ป้ายผู้เล่น/สถิติในจอ + ระบบเสียงรวม (🔊/🗣️/🎵) + ออกเสียงคำศัพท์อังกฤษ (TTS) ทุกข้อ + ปุ่มฟังซ้ำ',
            '"แตะสำรอง": แตะ zone ซ้าย/ขวาตอบได้เมื่อกล้อง/pose ใช้ไม่ได้ (กล้องไม่ผ่าน → เล่นแบบแตะแทนอัตโนมัติ) · แก้การโหลด MediaPipe ให้เสถียร (jsdelivr ตัวเดียว) · migration 136 (apply remote แล้ว) · verify:game 8/8 · ปก SVG',
        ],
    },
    {
        version: 'v1.62.0 (เกม 3D ที่ 5 "ห้องคำศัพท์ 3 มิติ" — อังกฤษ ป.4-6)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'เกม 3 มิติเกมที่ 5 "ห้องคำศัพท์ 3 มิติ" (Room 3D) ที่ /games/english/room-3d.html — Three.js สร้างห้องจำลองมีสิ่งของ 10 อย่างจาก primitive · ลาก/หมุนดูรอบห้อง · กลไกใหม่ "แตะสิ่งของ" (raycasting) เกมแรกที่ใช้',
            'โจทย์โชว์คำศัพท์อังกฤษ (chair/ball/book/cup/bag/plant/lamp/bed/clock/door) + emoji + คำแปลไทย → แตะสิ่งของในห้องให้ถูก · ตอบถูกเรืองเขียว ผิดเรืองแดง+เฉลย',
            'โหมด ⚡ แข่งเวลา / 📚 ฝึก · คอมโบ + โบนัสเร็ว · migration 135 (apply remote แล้ว) · verify:game 8/8 · เติมวิชาอังกฤษเป็นเกมที่ 3 · ปก SVG ชั่วคราว',
        ],
    },
    {
        version: 'v1.61.0 (เกม 3D ที่ 4 "บล็อก 3 มิติ" — คณิต ป.4-6)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เกม 3 มิติเกมที่ 4 "บล็อก 3 มิติ" (Block 3D) ที่ /games/math/block-3d.html — Three.js สร้างจากลูกบาศก์หน่วย หมุน/ลากดูรอบด้าน · 2 โหมดในเกมเดียว',
            'โหมดปริมาตร: กล่องลูกบาศก์ a×b×c → นับจำนวนลูกบาศก์ทั้งหมด (หมุนดูก้อนที่ซ่อนด้านหลัง) · โหมดเศษส่วน: แถวบล็อก N ก้อน สีทอง M ก้อน → อ่านเป็นเศษส่วน M/N',
            'โหมด ⚡ แข่งเวลา / 📚 ฝึก (ปริมาตร/เศษส่วน/ผสม) · คอมโบ + โบนัสเร็ว · migration 134 (apply remote แล้ว) · verify:game 8/8 + node logic test (ปริมาตร=a×b×c + เศษส่วนถูก) · ปก SVG ชั่วคราว',
        ],
    },
    {
        version: 'v1.60.0 (เกม 3D ที่ 3 "รูปคลี่ → ทรง" — คณิต ป.4-6)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'เกม 3 มิติเกมที่ 3 "รูปคลี่ → ทรง" (Net 3D) ที่ /games/math/net-3d.html — Three.js โชว์ทรงเรขาคณิต 3 มิติหมุน/ลากดูรอบด้าน → เลือก "รูปคลี่ (แบบกาง)" ที่พับขึ้นเป็นทรงนั้น จาก 4 ตัวเลือก (วาดด้วย canvas)',
            '5 ทรง + รูปคลี่: ลูกบาศก์ (กากบาท) · พีระมิด (สี่เหลี่ยม+4 สามเหลี่ยม) · ปริซึมสามเหลี่ยม · ทรงกระบอก (สี่เหลี่ยม+2 วงกลม) · กรวย (พัด+วงกลม) — สอนเรื่องรูปคลี่ที่ 2 มิติทำไม่ได้',
            'โหมด ⚡ แข่งเวลา / 📚 ฝึก · คอมโบ + โบนัสเร็ว · migration 133 (apply remote แล้ว) · verify:game 8/8 + node logic test · de-risk รูปคลี่ด้วย SVG preview ก่อนสร้าง · ปก SVG ชั่วคราว',
        ],
    },
    {
        version: 'v1.59.0 (เกม 3D ที่ 2 "ลูกโลก 3 มิติ" — สังคม ป.4-6)',
        date: '',
        badge: 'bg-cyan-600',
        items: [
            'เกม 3 มิติเกมที่ 2 "ลูกโลก 3 มิติ" (Globe 3D) ที่ /games/social/globe-3d.html — Three.js เรนเดอร์ลูกโลกหมุนได้ (วาดแผนที่ทวีปเองด้วย CanvasTexture ไม่พึ่งรูปภายนอก) + ลากนิ้ว/เมาส์หมุนดูรอบโลก',
            'ทวีปเป้าหมายเรืองแสงสีทอง + หันโลกมาด้านหน้าอัตโนมัติ → ทายชื่อทวีป (MCQ 4 ตัวเลือก) · 7 ทวีป (เอเชีย/ยุโรป/แอฟริกา/อเมริกาเหนือ-ใต้/ออสเตรเลีย/แอนตาร์กติกา)',
            'โหมด ⚡ แข่งเวลา (timer + 3 ชีวิต) / 📚 ฝึก · คอมโบ + โบนัสเร็ว · migration 132 (apply remote แล้ว) · verify:game 8/8 + node logic test · เติมวิชาสังคมเป็นเกมที่ 3 · ปก SVG ชั่วคราว',
        ],
    },
    {
        version: 'v1.58.0 (เกม 3D เกมแรก "สำรวจทรง 3 มิติ" — คณิต ป.4-6)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เกม 3 มิติเกมแรกของระบบ "สำรวจทรง 3 มิติ" (Solid 3D) ที่ /games/math/solid-3d.html — ใช้ Three.js เรนเดอร์ทรงเรขาคณิต 3 มิติจริง หมุนอัตโนมัติ + ลากนิ้ว/เมาส์หมุนดูรอบด้าน (เล่นได้ทั้ง desktop + มือถือ)',
            '7 ทรง (ลูกบาศก์ · ทรงสี่เหลี่ยมมุมฉาก · พีระมิด · ปริซึมสามเหลี่ยม · ทรงกลม · ทรงกระบอก · กรวย) · 2 แบบคำถาม: ทายชื่อทรง / นับหน้า–ขอบ–มุม (นับเฉพาะทรงหลายหน้าให้คำตอบชัด) · เส้นขอบดำช่วยนับ',
            'โหมด ⚡ แข่งเวลา (timer + 3 ชีวิต) / 📚 ฝึก (ทายชื่อ/นับ/ผสม) · คอมโบ + โบนัสเร็ว · migration 131 (apply remote แล้ว) · verify:game 8/8 + node logic test 11 เคส (ตรวจสูตรออยเลอร์ V−E+F=2 ครบทุกทรง + สร้างโจทย์ถูก) · ปก SVG ชั่วคราว (อัป Canva ภายหลัง)',
        ],
    },
    {
        version: 'v1.57.1 (มาตรฐานปกเกม + ปกใหม่ 2 เกมด้วย Canva AI)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            'วางมาตรฐานการสร้างปกเกม (Game Cover Standard): สดใสระดับประถม · มีเด็กนักเรียน (ชุดนักเรียน) เป็นตัวเอก · ภาพประกอบ + ฉากเด่นที่สื่อ gameplay · ปกตรงกับเกม + ชื่อไทยตัวใหญ่อ่านชัด · 16:9 (1280×720)',
            'เพิ่มไฟล์ Prompt คัดลอกได้ public/COVER-PROMPT.md (เติมชื่อเกม/วิชา/ฉาก/โทนสี แล้ววางใน Canva หรือ AI สร้างภาพ) + การ์ด "🎨 มาตรฐานปกเกม" ในแท็บเกม (ปุ่มคัดลอก Prompt ปก + รูปตัวอย่าง 2 ใบ) + section ใน GAME.md (พร้อม Canva workflow)',
            'ทำปกใหม่ด้วย Canva AI ให้ 2 เกม (PNG แทน SVG): "ต่อวงจรไฟฟ้า" (เด็กนักเรียนต่อสายไฟเข้าหลอดไฟ) + "เติมลายสมมาตร" (เด็กศิลปินระบายผีเสื้อ) — migration 126/127 เปลี่ยน thumbnail_url เป็น .png (apply remote แล้ว)',
        ],
    },
    {
        version: 'v1.57.0 (เกมใหม่ "เติมลายสมมาตร" — ศิลปะ ป.4-6)',
        date: '',
        badge: 'bg-green-700',
        items: [
            'เกมใหม่ "เติมลายสมมาตร" (Symmetry Art) ที่ /games/arts/symmetry-art.html — โชว์ลายที่ระบายไว้ครึ่งหนึ่ง (ล็อกสี) → เลือกสีจากจานแล้วแตะเติมอีกครึ่งให้สะท้อนกระจกสมมาตร แล้วกด "ตรวจ" (กลไก spatial/visual ใหม่ ไม่ซ้ำเกมเดิม)',
            '12 ลาย 3 ระดับ: ง่าย 💖🌳🏠💎 · กลาง 🦋🌸🪁🍄 · ยาก 🐟🦋🍃👑 · รองรับกระจกแนวตั้ง ↔ และแนวนอน ↕ · สุ่มซ่อนฝั่งซ้าย/ขวา-บน/ล่าง · จานสีเฉพาะสีที่อยู่ในลาย + ปุ่มลบ',
            '3 โหมด: ⚡ แข่งเวลา (timer bar ปรับตามจำนวนช่อง + 3 ชีวิต) / 📚 ฝึกตามระดับ (แก้ช่องที่ผิดได้) / 🌐 ออนไลน์ (KampaiMatch) · คอมโบตัวคูณ + โบนัสความเร็ว',
            'เกมที่ 2 ของกลุ่มสาระศิลปะ (ต่อจาก color-mix) · migration 125 (bgm playful, apply remote แล้ว) · verify:game 8/8 + node/jsdom test 82 เคส (ตรวจสมมาตรครบ 12 ลาย + เล่นจริงทุกระดับ) · ปก 16:9',
        ],
    },
    {
        version: 'v1.56.0 (เกมใหม่ "แยกขยะ 4 ถัง" — การงานอาชีพ ป.4-6)',
        date: '',
        badge: 'bg-green-700',
        items: [
            'เกมใหม่ "แยกขยะ 4 ถัง" (Waste Sort) ที่ /games/career/waste-sort.html — ดูขยะที่ปรากฏ → แตะถังให้ถูกสีตามถังขยะมาตรฐานไทย (🟢 เปียก/ย่อยสลายได้ · 🟡 รีไซเคิล · 🔵 ทั่วไป · 🔴 อันตราย) พร้อมเฉลยเหตุผลทุกข้อ (กลไก fixed-bins ต่างจาก cashier ที่ทอนเงิน)',
            '38 ชิ้น 4 ประเภท (เปียก 11 · รีไซเคิล 9 · ทั่วไป 9 · อันตราย 9) · 2 โหมด: ⚡ แข่งเวลา (timer bar + 3 ชีวิต) / 📚 ฝึก (3 ชีวิต) · คอมโบตัวคูณ + โบนัสความเร็ว · กดเลข 1–4 ได้',
            'เกมที่ 2 ของกลุ่มสาระการงานอาชีพ (ต่อจาก cashier) เชื่อมธีมธนาคารขยะของโรงเรียน · migration 124 (bgm bright, apply remote แล้ว) · verify:game 8/8 + jsdom playthrough เล่นจริง 2 โหมด · ปก 16:9',
        ],
    },
    {
        version: 'v1.55.1 (อัปเกรด "ฟังแล้วสะกด" — คลังคำ + เลือกหมวด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เกม "ฟังแล้วสะกด" (listen-spell) — ขยายคลังคำ 60 → 124 คำ และจัดเป็น 6 หมวดธีม: 🐾 สัตว์ · 🍎 อาหาร · 🏫 โรงเรียน · 🌳 ธรรมชาติ · 🚗 สิ่งของ · 🧍 ร่างกาย',
            'เพิ่มแถบเลือกหมวดในหน้าเริ่ม (ปุ่ม 🌈 ทั้งหมด + 6 หมวด แสดงจำนวนคำ) — เล่นเจาะหมวดที่อยากฝึกได้ · recent-word cap ปรับ adaptive ตามขนาดหมวด (กันคำซ้ำในหมวดเล็ก)',
            'fix: TDZ bug — เดิม renderCats() ถูกเรียกใน onReady ก่อน const CATEGORIES init (จอขาวเฉพาะโหมด standalone) · verify:game 8/8 + jsdom DOM playthrough 30 คำจริง',
        ],
    },
    {
        version: 'v1.55.0 (เกมใหม่ "พลเมืองดี" — สังคมศึกษา ป.4-6)',
        date: '',
        badge: 'bg-indigo-700',
        items: [
            'เกมใหม่ "พลเมืองดี" (Good Citizen) ที่ /games/social/good-citizen.html — judgment game: เห็นสถานการณ์ + การกระทำ → ตัดสิน 👍 ควรทำ / 👎 ไม่ควรทำ พร้อมเหตุผลสอนทุกข้อ (กลไกต่างจาก social-quiz MCQ และ order-it timeline)',
            '36 สถานการณ์ 6 หมวด: มารยาทไทย · กฎกติกา/หน้าที่พลเมือง · น้ำใจ · ประชาธิปไตย/สิทธิ · ส่วนรวม/สิ่งแวดล้อม · ซื่อสัตย์ (สมดุล ควรทำ 21 / ไม่ควร 15) · 2 โหมด: ⚡ แข่งเวลา 60 วิ / 📚 ฝึก 3 ชีวิต · คอมโบ + TTS อ่านสถานการณ์',
            'เกมที่ 2 ของกลุ่มสาระสังคมศึกษา (ต่อจาก social-quiz) · migration 123 (bgm warm) · verify:game 8/8 + DOM playthrough จริง 2 โหมด · ปก 16:9',
        ],
    },
    {
        version: 'v1.54.0 (เกมใหม่ "ต่อวงจรไฟฟ้า" — วิทยาศาสตร์ ป.4-6)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'เกมใหม่ "ต่อวงจรไฟฟ้า" (Circuit Builder) ที่ /games/science/circuit-builder.html — แตะวางชิ้นส่วน (สายไฟ/สวิตช์/วัสดุ) ลงช่องว่างในวงจร SVG → ตรวจ closed-loop จริงด้วย graph BFS หลอดติด/ดับทันที',
            '6 ด่านไล่ความรู้: วงปิด → สวิตช์ → ตัวนำ/ฉนวน (ทองแดง/เหล็ก vs พลาสติก/ไม้) → อนุกรม 2 หลอด → ขนาน 2 หลอด → ขนาน+สวิตช์ (กิ่งอิสระ) · 2 โหมด: ⚡ ผจญภัย (เก็บคะแนน+โบนัสเร็ว/ไร้พลาด) · 📚 ฝึก',
            'เกมที่ 2 ของกลุ่มสาระวิทยาศาสตร์ (ต่อจาก sci-sort) · migration 122 (bgm calm) · verify:game ผ่าน 8/8 + DOM playthrough จริง 6 ด่าน · ปก 16:9',
        ],
    },
    {
        version: 'v1.53.0 (เกมใหม่ "ฟังแล้วสะกด" — ภาษาอังกฤษ ป.4-6)',
        date: '',
        badge: 'bg-blue-700',
        items: [
            'เกมใหม่ "ฟังแล้วสะกด" (Listen & Spell) ที่ /games/english/listen-spell.html — SDK อ่านออกเสียงคำอังกฤษ (TTS) + รูป emoji คำใบ้ → เด็กแตะตัวอักษรเรียงให้สะกดถูก ฝึกการฟัง+สะกดคำ (ต่างจาก vocab-race)',
            'คลังคำ ป.4-6 ~50 คำ (สัตว์/อาหาร/โรงเรียน/ธรรมชาติ) 3 ระดับความยากตามจำนวนตัวอักษร + ตัวอักษรหลอกในคำยาว · 2 โหมด: แข่งเวลา 60 วิ / ฝึก 3 ชีวิต · คะแนน = ฐาน+โบนัสเร็ว+คอมโบ',
            'เกมที่ 2 ของกลุ่มสาระภาษาต่างประเทศ · migration 121 (bgm playful) · verify:game ผ่าน · ปก 16:9',
        ],
    },
    {
        version: 'v1.52.1 (ใบเกียรติบัตรฮีโร่ + กันรูปคนบีบไม่สมส่วนถาวร)',
        date: '',
        badge: 'bg-emerald-700',
        items: [
            'ใบเกียรติบัตรฮีโร่ความดี (/hero): รูปนักเรียนเป็นกรอบเต็มตัวไม่ครอป, แก้สังกัดเป็น "สพป.อุดรธานี เขต 2", URL สั้นด้วยรหัสนักเรียน (/hero/<รหัส>) + QR สแกนได้จริงเปิดหน้าประวัติ',
            'แก้รูป ครู/นักเรียน ถูกบีบยืดไม่สมส่วน: base AvatarImage (shadcn) ใส่ object-cover → รูปไม่จัตุรัส crop กึ่งกลางพอดี ไม่บิด มีผลทุก avatar ทั้งระบบ',
            'Guardrail กันเกิดซ้ำ: ESLint no-restricted-imports ห้าม import @/components/ui/avatar ตรง (ยกเว้น PersonAvatar) → บังคับ avatar คนทุกตัวผ่าน <PersonAvatar> จับตอน build + migrate HallOfFame เข้า PersonAvatar',
        ],
    },
    {
        version: 'v1.52.0 (ระบบกล้องวงจรปิด CCTV — มินิแมพสำหรับครู)',
        date: '',
        badge: 'bg-sky-700',
        items: [
            'หน้าใหม่ /teacher/cctv (เมนู "กล้องวงจรปิด" ใน Portal ครู): มินิแมพ Leaflet + หมุดกล้อง + รายชื่อกล้อง คลิกดูภาพสด (HLS) ในโมดอล — ดูได้เฉพาะครู/แอดมิน ไม่ public เพื่อความเป็นส่วนตัวนักเรียน (PDPA)',
            'กล้อง Tapo/Vigi → media relay (MediaMTX/go2rtc) แปลง RTSP เป็น HLS แล้วเปิดผ่าน Cloudflare Tunnel → เก็บ HLS URL ต่อกล้องในตาราง cctv_cameras',
            'migration 120: ตาราง cctv_cameras (name/location/lat/lng/hls_url) + RLS อ่านเฉพาะ is_teacher(), จัดการเฉพาะ is_admin() · deps ใหม่ leaflet + react-leaflet@4 (React 18) + hls.js (แยก leaflet-vendor chunk)',
        ],
    },
    {
        version: 'v1.51.0 (วิวแสดงเกียรติบัตรใหม่ 4 แบบ + แอดมินล็อกวิวให้ทุกคน)',
        date: '',
        badge: 'bg-violet-700',
        items: [
            'วิวใหม่ 4 แบบในหน้าเกียรติบัตร (training showcase + หน้าครู): รายการ (List/แถวแน่น), เมสันรี (Masonry/Pinterest), เส้นเวลาแนวตั้ง (Vertical Timeline), โคฟเวอร์โฟลว์ 3D — รวมเป็น 9 วิว',
            'แอดมินล็อกวิว (soft-lock): หน้า "ภาพรวม" กดปุ่ม 🔒 "ตั้งเป็นค่าเริ่มต้นของทุกคน" → ผู้เข้าชมทุกคนเห็นวิวนั้นตอนเข้า (เก็บใน school_settings.cert_default_view) แต่ปุ่มสลับยังอยู่ กดเปลี่ยนชั่วคราวได้ · ปุ่ม "ปลด" คืนค่า auto',
            'migration 095 (seed cert_default_view) · ViewModeSwitcher isDark เป็น optional (แก้ TS error แฝงใน StaffDetail)',
        ],
    },
    {
        version: 'v1.50.0 (ลงเกียรติบัตรครูจาก CLI ด้วย AI vision + หมวด "รางวัล/เกียรติยศ")',
        date: '',
        badge: 'bg-rose-700',
        items: [
            'scripts/import-cert.mjs: drop รูปเกียรติบัตรใน Claude Code → อ่านด้วย vision → จับคู่ staff_id อัตโนมัติ + อัปรูปเข้า school-images/training-certificates/ + insert training_records (status=ผ่านการอบรม) — ลดเวลากรอกฟอร์มมือ ~10 field/ใบ',
            'หมวดประเภทใหม่ "รางวัล/เกียรติยศ" (training_type) — รองรับเกียรติบัตรรางวัลที่ไม่ใช่การอบรม (เช่น ผู้กำกับลูกเสือดีเด่น) แสดงใน showcase สีกุหลาบ + filter chip',
            'migration 094: ตั้ง CHECK constraint training_type ครบ 5 ค่า (แก้ schema drift — prod ไม่เคยมี constraint) · CertCard ซ่อน "0 ชม." เมื่อไม่ระบุชั่วโมง',
        ],
    },
    {
        version: 'v1.49.4 (เกมใหม่ "ร้านค้าทอนเงิน" — ครบเกมทั้ง 8 กลุ่มสาระ! 🎉)',
        date: '',
        badge: 'bg-amber-700',
        items: [
            'เกมใหม่ cashier (การงานอาชีพ ป.4-6): หยอดเหรียญ/แบงก์ไทยให้ตรงเป้า — กลไก "ประกอบจำนวนเงิน" (หยิบเงินพอดี/คิดเงินทอน) ฝึกทักษะค้าขาย',
            '💰 เกมแรกของกลุ่มสาระ "การงานอาชีพ" → ตอนนี้มีเกมครบทั้ง 8 กลุ่มสาระการเรียนรู้ (ไทย/คณิต/วิทย์/สังคม/อังกฤษ/ศิลปะ/สุขศึกษา/การงานอาชีพ)',
            'verify:game 8/8 · โบนัสใช้เงินน้อยใบ (วิธีคิดดี) · 3 โหมด + KAMPAI.sound',
        ],
    },
    {
        version: 'v1.49.3 (เกมใหม่ "จัดจานสุขภาพ" — เกมแรกของกลุ่มสาระสุขศึกษาฯ)',
        date: '',
        badge: 'bg-green-700',
        items: [
            'เกมใหม่ plate-builder (สุขศึกษา ป.4-6): แตะเลือกอาหารจากถาดให้ครบเป้า — กลไก "เลือกหลายชิ้น/วางแผนจาน"',
            '2 เป้า: จัดจานครบ 5 หมู่ (โปรตีน/แป้ง/ผัก/ผลไม้/ไขมัน) · เลือกเฉพาะหมู่ที่กำหนด — สอนโภชนาการอาหาร 5 หมู่',
            '🍽️ เกมแรกของกลุ่มสาระ "สุขศึกษาและพลศึกษา" · verify:game 8/8 (เหลือ การงานอาชีพ อีก 1 กลุ่มสาระ)',
        ],
    },
    {
        version: 'v1.49.2 (เกมใหม่ "เรียงให้ถูกลำดับ" — บูรณาการ ป.4-6)',
        date: '',
        badge: 'bg-cyan-700',
        items: [
            'เกมใหม่ order-it: แตะการ์ด 2 ใบเพื่อสลับ → เรียงให้ถูกลำดับ แล้วกด "ตรวจ" — กลไก "จัดลำดับ" (คนละสกิลกับเลือกข้อ)',
            'บูรณาการ 3 หัวข้อ: เรียงจำนวน น้อย→มาก (ทศนิยม/เศษส่วน-คณิต) · ไทม์ไลน์ประวัติศาสตร์ไทย (สังคม) · ขั้นตอนวิทยาศาสตร์ (วัฏจักรน้ำ/วงจรชีวิต)',
            'คะแนน = ตำแหน่งถูก + คู่ลำดับถูก + เร็ว · เป็นเทมเพลตเพิ่มหัวข้อได้ · ครบชุดเกมรูปแบบใหม่ 3 เกม (เส้นจำนวน/ผสมสี/เรียงลำดับ) · verify:game 8/8',
        ],
    },
    {
        version: 'v1.49.1 (เกมใหม่ "ผสมสีให้ตรงเป้า" — เกมแรกของกลุ่มสาระศิลปะ)',
        date: '',
        badge: 'bg-fuchsia-600',
        items: [
            'เกมใหม่ color-mix (ศิลปะ ป.4-6): ปรับสไลเดอร์แม่สี แดง/เหลือง/น้ำเงิน ผสมให้ได้สีตรงเป้า — คะแนน = ความใกล้ของสี × ความเร็ว',
            'กลไกใหม่ "ปรับค่าต่อเนื่อง" + โมเดลผสมเม็ดสี subtractive (เหลือง+น้ำเงิน=เขียว จริง) สอนทฤษฎีสี · 3 ระดับ (แม่สี/สีรอง/ผสม 3 สี)',
            '🎨 เกมแรกของกลุ่มสาระ "ศิลปะ" → ครอบคลุม 6 วิชาแล้ว (ไทย/คณิต/อังกฤษ/วิทย์/สังคม/ศิลปะ) · verify:game 8/8',
        ],
    },
    {
        version: 'v1.49.0 (เกมใหม่ "เส้นจำนวนแม่นเป้า" — กลไกใหม่ ไม่ใช่ MCQ)',
        date: '',
        badge: 'bg-blue-700',
        items: [
            'เกมใหม่ number-line (คณิต ป.4-6): ลากหมุดบนเส้นจำนวนให้ตรงค่าเป้า (ทศนิยม/เศษส่วน/จำนวนหลักพัน/จำนวนลบ) — คะแนน = ความแม่น × ความเร็ว',
            'กลไกใหม่ "กะระยะแม่นยำ" (อินพุตต่อเนื่อง) ฝึก number sense ที่ MCQ ทำไม่ได้ · 3 โหมด (แข่งเร็ว/ฝึกระดับ/ออนไลน์) + เสียง/เพลงจาก KAMPAI.sound',
            'verify:game 8/8 · เริ่มชุดเกม "รูปแบบใหม่" ป.4-6 (ถัดไป: ผสมสี-ศิลปะ, เรียงลำดับ-บูรณาการ)',
        ],
    },
    {
        version: 'v1.48.2 (อัปโหลดเพลง mp3 เอง → คลังเพลงกลาง → เลือกใช้รายเกม)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'เพิ่ม "คลังเพลงประกอบ" ในหน้า admin (คลังเกม) — อัปโหลด mp3 (เก็บใน bucket educational-hub) ฟังตัวอย่าง/ลบได้ · ตาราง game_bgm_tracks (migration 114)',
            'dropdown เพลงประกอบรายเกมรวมเป็นที่เดียว: ค่าเริ่มต้น / เพลงที่อัปโหลด (mp3) / เพลงสังเคราะห์ 7 แบบ — mp3 เล่นผ่าน KAMPAI.sound (HTMLAudio loop) มาก่อน synth',
            'wrapper ส่ง init.audio.bgmUrl → SDK เล่นไฟล์จริง · ผู้เล่นยังกดปิด 🎵 เองได้ · เลือก "ปิดเพลง" ต่อเกมได้',
        ],
    },
    {
        version: 'v1.48.1 (หลังบ้านเลือกเพลงประกอบรายเกมได้)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'เพิ่มคอลัมน์ educational_hub_items.bgm_preset (migration 113) + dropdown "🎵 เพลงประกอบ" ในหน้า ตั้งค่าเกม (admin)',
            'เลือกได้ 7 แบบ: สดใส/นุ่มสงบ/อบอุ่น/เล่น ๆ/สว่าง/ผ่อนคลาย/ปิดเพลง หรือ "ค่าเริ่มต้นของเกม" — wrapper ส่งเข้า KAMPAI.sound ผ่าน init.audio.bgm',
            'seed ค่าปัจจุบันของ 4 เกมไว้แล้ว · ผู้เล่นยังกดปิด 🎵 เองได้ทุกเมื่อ',
        ],
    },
    {
        version: 'v1.48.0 (รวมระบบเสียงเข้า SDK ที่เดียว — เกมทุกตัวใช้ร่วม)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'ย้าย SFX + เสียงพูด (TTS) + เพลงแบ็กกราวด์ + ปุ่ม 🔊/🗣️/🎵 เข้า kampai-sdk.js เป็น KAMPAI.sound (single source) — เดิม copy ซ้ำใน 4 เกม ต่อไปแก้ที่เดียวมีผลทุกเกม + เกมใหม่ได้เสียงฟรี',
            '4 เกมควิซ (สูตรคูณ/วิทย์/สังคม/อังกฤษ) เปลี่ยนเป็นเรียก KAMPAI.sound.* (โค้ดต่อเกมสั้นลง ~80 บรรทัด) — additive ไม่กระทบเกม legacy',
            'รองรับตั้งเพลงรายเกมจากหลังบ้าน (wrapper ส่ง init.audio.bgm → override เพลงเริ่มต้นของเกม)',
        ],
    },
    {
        version: 'v1.47.8 (เพลงแบ็กกราวด์ตามเกม — 4 เกมควิซ + ปุ่ม 🎵 ปิดได้)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'เพิ่มเพลงประกอบสังเคราะห์ (อาร์เพจจิโอ chord progression วนลูป เบา ๆ) — ต่างคีย์/จังหวะ/โทนต่อวิชา: คณิต C สดใส · วิทย์ D นุ่ม · สังคม A อุ่น · อังกฤษ E playful',
            'เปิดอัตโนมัติตอนเริ่มเกม (fade-in) หยุดตอนจบเกม · ปุ่ม 🎵 เปิด/ปิดได้ จำค่าใน localStorage (mr_bgm)',
            'ยังเป็น Web Audio สังเคราะห์สด ไม่มีไฟล์เพลง · เสียงเบากว่า SFX/เสียงพูด (ไม่กลบ) · ไม่หน่วง (timer เคลียร์ตอนจบ)',
        ],
    },
    {
        version: 'v1.47.7 (แก้เสียงอ่านโจทย์ทับกัน — ปล่อยอ่านจบก่อน ไม่ตัด/ไม่โอเวอร์แลป)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'อาการ: ข้อต่อไปอ่านมาทับ/ตัดเสียงเก่ายังไม่จบ — เพราะ speak() เดิม cancel() แล้ว speak ทันที (บาง TTS มือถือหยุดที่ขอบคำ → ทับสั้น ๆ)',
            'แก้: ถ้ายังอ่านอยู่ (speaking/pending) ให้ข้ามอันใหม่ — ปล่อยอันเดิมอ่านจบก่อน ไม่ตัด ไม่ทับ (stopSpeak ตอนจบเกม/ออนไลน์/ปิดเสียง ยังหยุดทันทีเหมือนเดิม)',
            'มีผลทั้ง 4 เกมควิซ',
        ],
    },
    {
        version: 'v1.47.6 (ยกระดับเสียงเกม — SFX ไพเราะขึ้น + เสียงพูดเลือก voice ดีสุด)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'SFX สังเคราะห์ใหม่: envelope นุ่ม (ไม่มีเสียงคลิก) + โน้ตเลเยอร์ → ตอบถูก = อาร์เพจจิโอเบลล์สดใส, ผิด/หมดเวลา = ลงเสียงนุ่ม (ไม่ buzz), จบเกม = ไล่เมโลดี้ — ยังเป็น Web Audio ไม่มีไฟล์ ไม่หน่วง',
            'เสียงพูด: เลือก voice คุณภาพสูงสุดที่เครื่องมี (Google/Natural/Enhanced/Neural) + ปรับความเร็ว/โทนให้ฟังชัด เป็นมิตร — ทั้ง 4 เกมควิซ',
            'หมายเหตุ: คุณภาพเสียงพูดยังขึ้นกับ voice ในเครื่องผู้เล่น (ถ้าต้องการเสียงสตูดิโอคงที่ทุกเครื่อง = ต้อง pre-render เป็นไฟล์เสียง ภายหลัง)',
        ],
    },
    {
        version: 'v1.47.5 (ใส่เสียง+เอฟเฟกต์+อ่านโจทย์ ครบอีก 3 เกม: วิทย์/สังคม/อังกฤษ)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'จำแนกวิทย์ · สังคมรอบรู้ · แข่งคำศัพท์ — เพิ่มชุดเดียวกับแข่งสูตรคูณ: เสียงตอบถูก/ผิด + จอสั่น/แฟลช/เด้ง + อ่านโจทย์ภาษาไทย (Web Audio + Web Speech) ปุ่ม 🔊/🗣️ จำค่าไว้',
            'แข่งคำศัพท์ (อังกฤษ) พิเศษ: อ่านคำไทยตอนเป็นโจทย์ (ไม่สปอยล์) แล้วอ่านคำอังกฤษให้ฟังตอนตอบถูก = ฝึกออกเสียง',
            'ครบทั้ง 5 เกมควิซมีระบบเสียงแล้ว · เบา ไม่หน่วง (ไม่มีไฟล์เสียง) · verify:game 8/8 ทุกเกม',
        ],
    },
    {
        version: 'v1.47.4 (แข่งสูตรคูณ — เสียงตอบถูก/ผิด + เสียงอ่านโจทย์ + เอฟเฟกต์จอ)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'เพิ่มเสียงตอบถูก (สดใส) / ผิด (ต่ำ) + จอสั่นตอนผิด + โจทย์เด้ง + แฟลชเขียว/แดง — Web Audio synth สังเคราะห์สด ไม่มีไฟล์ ไม่หน่วง',
            'เสียงอ่านโจทย์ "ห้า คูณ แปด" (Web Speech API ภาษาไทย) — ทุกโหมดยกเว้นออนไลน์ ถ้าเครื่องไม่มีเสียงไทยก็เงียบ ไม่พัง',
            'ปุ่มเปิด/ปิดแยก 🔊 เอฟเฟกต์ · 🗣️ อ่านโจทย์ (มุมซ้ายบน) จำค่าไว้ใน localStorage',
        ],
    },
    {
        version: 'v1.47.3 (แถบ "มีเวอร์ชันใหม่" — กดปิดแล้วเงียบ 6 ชม. ไม่เด้งซ้ำ)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'เดิมกดปิดแถบอัปเดตแล้ว พอเปิดหน้าใหม่มันเด้งซ้ำทุกครั้ง (เพราะ SW ตัวใหม่ยัง waiting) — รำคาญเวลา deploy ถี่',
            'เพิ่ม snooze: กด X → จำใน localStorage เงียบ 6 ชม. ค่อยเตือนใหม่ — ยังกด "อัปเดต" เองได้ตลอด, ไม่รีโหลดเองกันงานที่กรอกค้างหาย',
        ],
    },
    {
        version: 'v1.47.2 (หน้าจบเกม — การ์ด XP ลอยไม่ตัดหน้า ค้างไว้จนกดปิด)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            'เดิมจบเกมแล้วเด้งหน้า +XP เต็มจอทับทันที (unmount เกม) → อ่านจอจบเกม/อันดับไม่ทัน รู้สึก "ตัดหน้า"',
            'ตอนนี้เกมโชว์จอจบของตัวเองต่อ การ์ด XP เล็ก ๆ ลอยขึ้นมุมล่าง (ไม่มี backdrop ไม่บังจอ) ทับแทน',
            'การ์ดค้างไว้จนผู้เล่นกด ปิด/เล่นซ้ำ/ออก เอง (ไม่หาย ไม่หน่วง) — แก้ทีเดียวที่ PlayGame wrapper มีผลทุกเกม',
        ],
    },
    {
        version: 'v1.47.1 (เกม "จำแนกวิทย์" — ตัวเลือก 4 ปุ่มทุกข้อ + เพิ่มกลุ่มจริง)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เดิมแสดงแค่ 3 ตัวเลือก (ทุกหัวข้อมี 3 กลุ่ม) → เพิ่มเป็น 4 ปุ่มทุกข้อ (2×2)',
            'เพิ่มกลุ่มจริงตามหลักสูตร: สิ่งมีชีวิต +"มนุษย์" (พืช/สัตว์/มนุษย์/ไม่มีชีวิต) · ที่อยู่อาศัย +"ใต้ดิน" (ไส้เดือน/มด/หนู)',
            'สถานะสสารคง 3 สถานะจริง (ของแข็ง/เหลว/แก๊ส) — เติมตัวเลือกที่ 4 เป็นตัวลวงจากหัวข้ออื่น ไม่สร้าง "สถานะปลอม" ผิดวิทย์',
            'ทดสอบ headless 180 ข้อ: 4 ปุ่มครบ · คำตอบถูกอยู่ในตัวเลือกเสมอ · ไม่ซ้ำ · 0 error',
        ],
    },
    {
        version: 'v1.47.0 (เกม "จำแนกวิทย์" + "สังคมรอบรู้" — เติมวิชาวิทยาศาสตร์ + สังคมศึกษา)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เกมใหม่ sci-sort "จำแนกวิทย์" (วิทยาศาสตร์ ป.1–6): ดูสิ่งของ → จัดกลุ่มให้ถูก (สิ่งมีชีวิต/สถานะสสาร/ที่อยู่อาศัย)',
            'เกมใหม่ social-quiz "สังคมรอบรู้" (สังคมศึกษา ป.4–6): จังหวัด→ภาค · เหตุการณ์/บุคคล→ยุคอาณาจักร',
            'ทั้งคู่เป็น Classify Quiz 3 โหมด (แข่งเร็ว · ฝึกหัวข้อ · 🌐 ออนไลน์) reuse เฟรมเวิร์ก kampai-match — ครอบคลุมหลักสูตรเพิ่มเป็น 5 วิชา (ไทย/คณิต/อังกฤษ/วิทย์/สังคม) ถัดไป: ศิลปะ/สุขศึกษา',
        ],
    },
    {
        version: 'v1.46.0 (เกม "แข่งคำศัพท์" — วิชาภาษาอังกฤษ เกมแรกของกลุ่มสาระฯ นี้)',
        date: '',
        badge: 'bg-cyan-600',
        items: [
            'เกมใหม่ vocab-race (Vocabulary Race ป.1–6): ดู emoji + คำไทย → เลือกคำอังกฤษ 8 หมวดตามหลักสูตร (สัตว์/สี/ครอบครัว/อาหาร/ร่างกาย/ตัวเลข/โรงเรียน/ผลไม้)',
            '3 โหมด: แข่งเร็ว (แถบเวลา+ชีวิต+combo) · ฝึกหมวดเจาะจง · 🌐 ออนไลน์แข่งสด 60 วิ — reuse เฟรมเวิร์ก kampai-match ตรง ๆ (พิสูจน์ว่าโครงสร้างกลางใช้ซ้ำข้ามวิชาได้)',
            'อุดช่องว่างหลักสูตร: เดิมมีเกมแค่ ภาษาไทย/คณิต/เทคโนโลยี — ภาษาอังกฤษเป็นวิชาแกนที่ยังไม่มีเกมเลย (ถัดไป: วิทยาศาสตร์/สังคม/ศิลปะ/สุขศึกษา)',
        ],
    },
    {
        version: 'v1.45.1 (จบแมตออนไลน์ — โชว์อันดับผู้ชนะก่อน แล้วค่อยปุ่ม "รับ XP")',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'แก้ลำดับจอจบแมตออนไลน์: เดิม submitScore ยิงทันที → จอ "+XP" ของ wrapper บังจอจัดอันดับ. ตอนนี้โชว์อันดับ/ผู้ชนะก่อน แล้วผู้เล่นกด "รับ XP →" ค่อยขึ้นจอ +XP',
            'กันลืมรับ: ถ้าไม่กดภายใน 20 วิ บันทึก XP อัตโนมัติ — XP ไม่หาย (แก้ที่ kampai-match.js ที่เดียว ทุกเกมที่ใช้เฟรมเวิร์กได้ผลพร้อมกัน)',
            'ยืนยัน: โหมด online ได้ XP = floor(score/10) ขั้นต่ำ 1 (+โบนัสเหรียญ) ต่อคนตามคะแนนตัวเอง รวมเข้ากองเดียวกับโหมดเดี่ยวของเกมนั้น',
        ],
    },
    {
        version: 'v1.45.0 (เฟรมเวิร์กเกมออนไลน์หลายคน kampai-match — โครงสร้างกลางสำหรับเกมอนาคต)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'ยกระบบ lobby/นับถอยหลัง/แถบคะแนนสด/จัดอันดับ ขึ้นเป็นเฟรมเวิร์กกลาง drop-in `public/games/kampai-match.js` — เกมในอนาคตทำ "นักเรียนเล่นด้วยกัน" ได้ด้วยโค้ดไม่กี่บรรทัด',
            'เกมเขียนแค่: KampaiMatch.create({duration,onPlay,onEnd}) + ปุ่ม openMenu() + report(score) ตอนได้คะแนน — ที่เหลือเฟรมเวิร์กจัดการ (สร้าง/เข้าห้อง รหัส 4 หลัก, presence สด, ซิงค์เริ่ม, seeded RNG ให้โจทย์ตรงกัน, submit คะแนน)',
            'Refactor multiply-race มาใช้เฟรมเวิร์ก (โค้ดสั้นลง ~40%) + เพิ่ม starter `_template-online.html` + อัปเดต GAME.md / GAME-PROMPT.md',
        ],
    },
    {
        version: 'v1.44.0 (เกม "แข่งสูตรคูณ" + โหมดออนไลน์เรียลไทม์ คนละเครื่อง)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เกมใหม่ multiply-race (Quiz Race สูตรคูณ 2–12): โหมดแข่งเร็ว (แถบเวลา+3ชีวิต+combo) + ฝึกแม่เจาะจง + ปก 16:9 — เก็บคะแนน/XP/อันดับผ่าน KAMPAI SDK',
            'โหมดออนไลน์: นักเรียนสร้างห้อง (รหัส 4 หลัก) เล่นคนละเครื่อง แข่งสด 60 วิ — โจทย์เดียวกันทุกเครื่อง (seed จากรหัสห้อง) + เห็นคะแนนคู่แข่งวิ่งสด + จัดอันดับผู้ชนะ',
            'สถาปัตย์ใหม่: KAMPAI.online ใน SDK + PlayGame wrapper รีเลย์ Supabase Realtime (broadcast+presence) ผ่าน postMessage — เกมไม่ต้องมี anon key, ไม่ต้อง migration, เกมอื่นนำไปใช้ซ้ำได้',
        ],
    },
    {
        version: 'v1.43.1 (Pizza เฟส 4/C2 — กระดานอันดับสดหน้าครู · ครบเฟส 4)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เพิ่มแท็บ "อันดับสด" ใน TeacherGameAnalytics: เรียงตามคะแนนสูงสุดของห้อง อัปเดตอัตโนมัติทุก 8 วิ (React Query refetchInterval) — ฉายหน้าห้องตอนแข่งได้',
            'ไฮไลต์ Top 3 (เหรียญ) + ปุ่มรีเฟรชเอง + empty state — ไม่ต้อง migration/realtime publication (เบา+verify ได้)',
            'ครบเฟส 4 (ครู): C3 รายงานเศษส่วน + C1 ลิงก์มอบหมาย + C2 อันดับสด — และครบทั้ง roadmap Pizza (เฟส 1-4)',
        ],
    },
    {
        version: 'v1.43.0 (Pizza เฟส 4/C1 — ครูตั้งโจทย์ผ่านลิงก์มอบหมาย)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'ครูสร้างลิงก์มอบหมายในหน้าวิเคราะห์เกม: เลือกระดับชั้น + โหมด → คัดลอกลิงก์ /play/pizza-master-chef?grade=&mode= ส่งให้นักเรียน',
            'PlayGame wrapper ส่งต่อ param (grade/mode/practice) จาก URL เข้า iframe เกมอัตโนมัติ',
            'เกม pizza อ่าน param: ตั้งระดับชั้น/โหมดฝึกแบบ session-only (ไม่ทับ pref เด็ก) + ถ้าระบุ mode → เริ่มเกมโหมดนั้นทันที',
            'ทดสอบ headless: grade=lower&mode=compare → auto-start compare+lower, grade=upper&practice=1 → preset ค้างจอเริ่ม, 0 error',
        ],
    },
    {
        version: 'v1.42.9 (Pizza เฟส 4/C3 — รายงานครู "เศษส่วนที่พลาดบ่อย")',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'เพิ่มแท็บ "วิเคราะห์เศษส่วน" ใน TeacherGameAnalytics: รวม miss_log จาก game_sessions.metadata ทั้งห้อง → กราฟแท่ง + ตาราง เศษส่วนที่นักเรียนตอบผิดบ่อย (ลดรูป) + จำนวนนักเรียนที่พลาด',
            'ใช้ data ที่เกมเก็บไว้ตั้งแต่เฟส 1 (miss_log + grade_band) — ครูเห็นจุดที่ควรเน้นสอนต่อชั้นเรียน',
            'ต่อยอดหน้าเดิม (ไม่สร้างใหม่) — build ผ่าน; ข้อมูลปรากฏเมื่อนักเรียนเล่นเวอร์ชันใหม่',
        ],
    },
    {
        version: 'v1.42.8 (Pizza เฟส 3 — เหรียญตราสะสม + Boss order ท้ายเวฟ)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'B1 เหรียญตรา 8 แบบ (BadgeManager + localStorage): เปิดร้านครั้งแรก/คอมโบ5,10/แม่นยำ100%/เสิร์ฟ50,200/ครบ7โหมด/เล่น7วันติด — แถวเหรียญบนจอเริ่ม + แจ้งปลดล็อกตอนจบเกม',
            'B3 Boss order: ขึ้นเวฟใหม่ → ลูกค้าบอส 👹 สั่งตัวส่วนใหญ่สุดของเวฟ (ยากสุด) คะแนน ×5 + เวลา/confetti',
            'ทดสอบ headless: 8 เหรียญ render, recordGame ปลดล็อก [first,combo5,combo10,perfect,served50] ถูก, boss type/slices/emoji ถูก, 0 error',
        ],
    },
    {
        version: 'v1.42.7 (Pizza เฟส 2B — โหมดเทียบเศษส่วน >,<,= ครบเฟส 2)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'A1 โหมดเทียบเศษส่วน (compare): โชว์ 2 ถาดซ้าย-ขวา (ระบายตามเศษส่วน + ป้าย) → กดปุ่ม > / = / < เทียบ — interaction ใหม่ ไม่ใช่เลือก slice',
            'ออกโจทย์ตามระดับชั้น (lower ตัวส่วน≤4) + ~30% เป็นคู่สมมูล (เช่น 2/3=4/6) ฝึกเครื่องหมาย =; เฉลยเมื่อตอบผิด',
            'layout บังคับซ้าย-ขวาเสมอ (ตรงกับปุ่ม), ปิด power-up/wave ในโหมดนี้, รองรับโหมดฝึก',
            'ทดสอบ headless: เทียบถูก/ผิดทำงาน, 2/3=4/6 ตรวจถูก, 0 error + screenshot จอชัด',
        ],
    },
    {
        version: 'v1.42.6 (Pizza เฟส 2A — โหมดสมมูล + รูปเศษส่วน + สรุปการเรียนรู้)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'A3 โหมดเศษส่วนสมมูล: โชว์ตัวลด (เช่น 1/2) แต่หั่นพิซซ่าเป็นตัวเต็ม (4/8) → เด็กต้องเลือกให้สมมูล (base-scaling การันตีลดรูปได้ทุกออเดอร์)',
            'A5 toggle รูปเศษส่วน: วงกลม conic-gradient ระบายตามเศษส่วนเป้าหมายข้างตั๋ว (เชื่อมสัญลักษณ์↔ภาพ) default เปิด',
            'A7 สรุปการเรียนรู้จอจบเกม: "✅ เก่งแล้ว: 1/2 1/4 · 📚 ฝึกเพิ่ม: 5/8 3/8" จาก hitLog/missLog (ลดรูปแสดง)',
            'ทดสอบ headless: equivalent ลดรูปทุกออเดอร์, visual toggle, diagnostic ถูกต้อง, 0 error',
        ],
    },
    {
        version: 'v1.42.5 (Pizza Master Chef เฟส 1 — ระดับชั้น + โหมดฝึก + เก็บ data พลาด)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'A4 เลือกระดับชั้น: ป.1-3 (ตัวส่วน ≤4 ไม่ลดรูป) ↔ ป.4-6 (เต็ม) — ปุ่มบนจอเริ่ม จำใน localStorage (ทดสอบ: lower ออเดอร์ตัวส่วน≤4 ทุกครั้ง)',
            'A6 โหมดฝึก (ไม่จับเวลา): เวลาแช่แข็ง timer โชว์ "∞" ตอบผิดไม่หักเวลา ไม่บันทึกคะแนน/leaderboard — เลื่อนเวฟตามจำนวนที่ทำถูก',
            'E1 เก็บ data พลาด: missLog (พลาดเศษส่วนไหนบ้าง) + grade_band ส่งใน metadata ของ gameEnd → ป้อนรายงานครู/diagnostic (เฟสถัดไป)',
            'D1 มือถือ: คอนโทรลใหม่พอดีจอ 390px ปุ่ม ≥44px (ทดสอบ headless จริง)',
        ],
    },
    {
        version: 'v1.42.4 (Pizza Master Chef — เอาเลขนับกลางถาดออก + เฉลยช่องถูกตอนผิด)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'เอาตัวเลข "เลือกไปแล้ว x/y" กลางถาดพิซซ่าออก (มันนับให้เด็กเสร็จ → เกมง่ายเกินไป) — เด็กต้องนับช่องเองจากการมอง = ฝึกเศษส่วนจริง',
            'ระบบใหม่: ตอบผิด → ไฮไลต์ช่องที่ถูก "สีเขียว" ชั่วคราว (2.2 วิ) + ข้อความอธิบาย → เรียนรู้จากที่พลาด เหมาะเด็กประถม (เลือกตามที่ผู้ใช้กำหนด)',
            'GAME-PROMPT.md: เพิ่มหลักออกแบบ — อย่าโชว์คำตอบ/นับอัตโนมัติจนง่ายไป ให้เด็กคิดเองแล้วเฉลยตอนผิด (กันออกแบบเกมง่ายไปในอนาคต)',
        ],
    },
    {
        version: 'v1.42.3 (ตรวจสุขภาพเกมทั้งระบบ + verify:game Check 8 กันบั๊กซ้ำ)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ตรวจ 12 เกม active (headless render/style smoke): ไม่มีจอเปล่า, Tailwind ขึ้นครบ, 0 console error — ระบบสุขภาพดี (detective คือตัวเดียวที่เคยพังและแก้แล้ว)',
            'verify:game Check 8 (ใหม่): จับไอคอน/ตัวแปรชื่อชน JS global (Map/Image/Set/Promise/Text/History...) ที่ทำ Tailwind Play CDN ล่ม → fail ก่อน commit (negative test จับ Map+Image ได้)',
            'GAME-PROMPT.md: เพิ่มข้อห้ามตั้งชื่อทับ global + ย้ำ responsive มือถือ (~360px ไม่ล้น, ปุ่ม ≥44px, ไม่ต้องเลื่อนหาปุ่ม) + ทดสอบ browser จริง',
            '_template-react.html: คอมเมนต์เตือน global-shadow ที่ SECTION B + GAME.md อัปเดตเป็น 8 checks',
        ],
    },
    {
        version: 'v1.42.2 (เล่นเกมเต็มจอ — ปุ่ม Fullscreen + ขยายเต็มพื้นที่ ทุกเกม)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'PlayGame wrapper: ตอนเล่น หน้าเป็น flex เต็ม viewport (h-100dvh) → iframe เต็มความกว้าง + สูงเท่าที่เหลือจาก header (เดิม max-w-5xl + h-80vh ทำให้ต้องสกอลหน้า/หาปุ่ม)',
            'เพิ่มปุ่ม "เต็มจอ" (Fullscreen API — iframe มี allow=fullscreen อยู่แล้ว) ข้างปุ่มเมนู → ขยายเต็มหน้าจอจริง ซ่อน header+แถบเบราว์เซอร์, กด ESC/ปุ่มย่อกลับ',
            'มีผลกับทุกเกม (อยู่ที่ wrapper) — build ผ่าน',
        ],
    },
    {
        version: 'v1.42.1 (เกม "นักสืบโจทย์ปัญหา" — port React ดิบ → เล่นได้ + เก็บคะแนน)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'mathdetective.html เดิมเป็น React/TSX ดิบ (import lucide-react) รันใน iframe ไม่ได้ → จอเปล่า เล่นไม่ได้',
            'Port เป็น single-file Babel (React 18 UMD + _mkIcon shim) → public/games/math/detective.html, render Check 7 ผ่าน (DOM 7367 ตัวอักษร)',
            'ฝัง KAMPAI SDK: submitScore 4 จุดจบเกม (ด่านสำเร็จ/ล้มเหลว, บอสชนะ/หมดเวลา) + การ์ดสถิติฉัน + ตารางอันดับนักเรียนในจอแผนที่ + ปุ่มกลับหน้าหลัก',
            'Migration 108: ย้าย Storage → git (repoint external_url → /games/math/detective.html), verify:game 7/7',
            'Fix จอเบี้ยว: ไอคอน lucide ชื่อ Map (const Map=...) ทับ global Map → Tailwind Play CDN พัง (i.set is not a function) ไม่มี CSS เลย — rename เป็น MapIcon (ยืนยันด้วย headless Chrome screenshot)',
        ],
    },
    {
        version: 'v1.42.0 (ข่าวอัตโนมัติจาก Facebook — sync โพสต์เพจ → หน้าข่าว)',
        date: '',
        badge: 'bg-[#1877F2]',
        items: [
            'Edge function facebook-fetch: เมื่อเปิด toggle "แปลงโพสต์เป็นข่าวอัตโนมัติ" → แปลงโพสต์ใหม่จากเพจเป็น row ในตาราง news (published ทันที, หมวด "ข่าวจาก Facebook") โผล่หน้า /news เอง',
            'รูปปกถูกดาวน์โหลดจาก Facebook CDN แล้ว re-host ใน bucket school-images/facebook/ (กัน URL หมดอายุ) + แนบลิงก์ "ดูบน Facebook" ใน external_links',
            'Idempotency ผ่าน facebook_posts.news_synced — ลบข่าวที่ไม่ต้องการได้ ระบบจะไม่สร้างซ้ำ; กันโพสต์ซ้ำด้วย unique index news.source_fb_post_id',
            'อัตโนมัติจริง: Vercel Cron /api/sync-facebook (รายวัน) เรียก edge function ผ่าน x-cron-secret โดยไม่ต้องรอแอดมินเปิดเว็บ (เดิม stale-while-revalidate เท่านั้น)',
            'Migration 107 + toggle ใน หน้าแอดมิน → ฟีดข่าว Facebook; ต้องตั้ง Long-Lived Page Access Token + secret CRON_SECRET (Supabase + Vercel) ก่อนใช้งาน',
        ],
    },
    {
        version: 'v1.41.4 (เทมเพลตเกม + AI Prompt — blueprint โครงสร้างหน้าจอ + การ์ดสถิติฉัน)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'GAME-PROMPT.md (ปุ่ม "คัดลอก Prompt" + "ดู Prompt"): เพิ่ม section "โครงสร้างหน้าจอมาตรฐาน (ต้องมีครบ)" — จอเริ่ม (การ์ดสถิติฉัน + ตารางอันดับ, ห้ามช่องกรอกชื่อ) / HUD / จอจบ (อันดับ + เล่นใหม่ + goHome) / มือถือ + เพิ่ม playsCount ใน k.stats',
            'เทมเพลต vanilla (_template-full.html) + React (_template-react.html): เพิ่มการ์ด "สถิติฉัน" (คะแนนสูงสุด + จำนวนครั้งที่เล่น จาก KAMPAI.stats) ในจอ title — ซ่อนเองถ้าไม่มีข้อมูล (เปิดทดสอบเดี่ยว)',
            'ทั้ง 2 เทมเพลต render Check 7 ผ่าน (การ์ดสถิติ + อันดับ render กับ mock init); เกมใหม่/สั่ง AI สร้างจะได้โครงสร้างมาตรฐานตั้งแต่แรก',
        ],
    },
    {
        version: 'v1.41.3 (เกม — ตารางอันดับในจอแรกให้เหมือนกันทุกเกม)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'public/games/kampai-leaderboard.js (ใหม่) — drop-in widget: ใส่ <script src> + <div data-kampai-lb> ก็โชว์ตารางอันดับในจอ title ได้ทันที (อ่านจาก init ที่ wrapper ส่ง, ไม่ฝัง anon key, ไม่มีข้อมูล→ซ่อนเอง)',
            'เพิ่ม/แก้ตารางอันดับในจอแรกของเกมที่ยังขาด: wizard-thai + kingdom (React panel), 24 + attack-on-noun (drop-in), Pizza (เดิมซ่อนตอน embed → โชว์ของจริงจาก init)',
            'มือปราบคำผิด (spelling): ย้าย Storage → git (/games/thai/spelling.html, migration 106) + เพิ่ม KAMPAI integration ที่ขาดทั้งหมด (init/sendGameEnd/navigateBack — เดิมไม่เก็บคะแนนเลย) + ตารางอันดับ',
            'ทุกเกม verify:game ผ่าน (เกม SDK/React ผ่าน render Check 7, เกม vanilla ผ่าน Check 1-6 + widget ตรวจ jsdom แยก)',
        ],
    },
    {
        version: 'v1.41.2 (เกม math-han — เลิกพิมพ์ชื่อเอง, ใช้ชื่อจริง + โชว์อันดับ/สถิติ)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'เอาช่องกรอกชื่อหน้าเมนูออก — เกียรติบัตร + หน้า Game Over ใช้ชื่อจริงจากระบบ (student.displayName) แทนชื่อที่พิมพ์เอง (fallback "นักเรียน" ตอนเล่นนอกระบบ)',
            'หน้าเมนูโชว์ "สถิติฉัน" (คะแนนสูงสุด + จำนวนครั้งที่เล่น) + ตารางอันดับ Top 10 (เหรียญ/avatar/ชื่อ/ชั้น/คะแนน, ไฮไลต์แถวตัวเอง) — ดึงจาก init payload ที่ PlayGame ส่งให้อยู่แล้ว (stats/leaderboard)',
            'อ่าน init เต็ม (student/stats/leaderboard) + listener กัน race ตอน init มาหลัง mount · คะแนนยังบันทึกผ่าน sendGameEnd เหมือนเดิม · verify:game 7/7',
        ],
    },
    {
        version: 'v1.41.1 (Educational Hub — รวมแท็บ + ครูอัปเกมเอง + UX อัปโหลด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'รวมแท็บ "ครูทั้งหมด" + "รายการทั้งหมด" → แท็บ "รายการทั้งหมด" เดียว: ลิสต์ทุก item + filter (ครู/หมวด/ประเภท/สถานะ) + CRUD inline (แก้/ลบ/toggle เผยแพร่) — RLS คุมสิทธิ์ (admin เห็นทั้งหมด, ครูแก้เฉพาะของตัว) · แท็บ "ครู" เหลือ toggle เปิด/ปิดแสดงในคลัง + แก้โปรไฟล์',
            'Migration 105: storage bucket edu-hub-games จาก admin-only → teacher-or-admin (public.is_teacher()) — "ใครอัปเกมก็มีสิทธิ์แก้" (table RLS owner-or-admin อยู่แล้ว ไม่แตะ)',
            'อัปโหลดเกม UX: auto-slug จากชื่อ (ascii kebab, ไทยล้วน→fallback ts, แก้เองได้) · เช็ก KAMPAI SDK ก่อนบันทึก (เจอ submitScore→เขียว+auto game_slug/tracked, ไม่เจอ→เตือน "ไม่เก็บคะแนน") · owner เริ่มต้น=ตัวเอง (ครูล็อก, admin เลือกได้) · ปุ่ม "เล่นทดสอบ" Blob preview ในจอ (ทั้ง create + replace v.2)',
        ],
    },
    {
        version: 'v1.41.0 (KAMPAI Game SDK — เชื่อมเกมเข้าระบบง่ายสุด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'public/games/kampai-sdk.js (window.KAMPAI) — single source ของ integration: setSlug/onReady/submitScore/goHome + student/stats/leaderboard; เกมโหลด <script src> ไฟล์เดียว แก้ SDK ทีเดียวทุกเกมได้ตาม',
            'PlayGame init ส่ง student + stats + leaderboard เข้าเกม (additive — เกมเก่าไม่กระทบ) → เกมโชว์ชื่อผู้เล่น + 5 อันดับในจอได้โดยไม่ยิง Supabase เอง (เลิกฝัง anon key)',
            'มือถือ: KAMPAI.controls.mount({dpad,buttons}) วาด D-pad+ปุ่ม action บน touch + sync คีย์บอร์ด → อ่าน KAMPAI.input ที่เดียว',
            'public/GAME-PROMPT.md + ปุ่ม "ดาวน์โหลดเทมเพลต" + "คัดลอก Prompt สำหรับ AI" ใน admin (GamesTab) — สั่ง ChatGPT/Gemini/Claude สร้างเกมแล้วเชื่อมระบบได้ทันที',
            'อัปเกรด _template-full.html (vanilla) + _template-react.html ใช้ SDK + leaderboard ในเกม + D-pad · verify:game รองรับ SDK (Check 2-5) + Check 7 post mock init + เกม vanilla',
        ],
    },
    {
        version: 'v1.40.6 (verify:game render smoke-test — กันเกมจอดำ)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'บทเรียน wizard-thai: verify:game เดิมเป็น static regex ล้วน — ผ่าน 6/6 ทั้งที่เกมจอดำ (ไม่เคย render จริง)',
            'เพิ่ม Check 7 ใน scripts/verify-game.mjs: render เกมจริงใน jsdom + React UMD → จับ runtime crash / root ว่าง (undefined component, compile error)',
            'devDeps: jsdom + @babel/standalone · cache CDN ที่ node_modules/.cache/game-verify · offline → WARN skip (ไม่ fail)',
            'public/games/_template-react.html ใหม่ — base เกม React+Babel ที่ lucide shim ถูกต้อง (อ่าน node[2]) สำหรับ port เกม React component',
            'GAME.md + CLAUDE.md: section เกม React + lucide IconNode = [tag,attrs,children] + ⚠️ verify ต้อง 7/7 + browser test',
        ],
    },
    {
        version: 'v1.40.5 (เกม wizard-thai — port เข้า /play)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'เกม "ศึกจอมเวทแห่งภาษา" (/play/wizard-thai) เล่นไม่ได้ — ไฟล์ที่อัปโหลดเป็น React/TSX ดิบ (import + lucide-react) รันใน iframe ไม่ได้',
            'Port เป็น single-file HTML แบบ mth.html (React18+Babel CDN) + lucide UMD shim (33 ไอคอน) + ฝัง kampai EMBED block (GAME_SLUG, sendGameEnd ตอนแพ้/ชนะ, navigateBack)',
            'Fix bug ที่ทำให้เกมพัง: handleNextStage ถูกเรียกแต่ไม่เคย define (crash ตอนผ่านด่าน) + proceedToArena ด่านสุดท้าย index เกิน → เพิ่มเงื่อนไขจบเกมชนะ',
            'Migration 104: ย้าย external_url จาก Supabase Storage → /games/thai/wizard-thai.html (version-controlled, verify:game 6/6)',
            'เพิ่มปุ่ม "กลับหน้าหลัก" (navigateBack) ในจอแพ้/ชนะ — ไม่ค้างใน iframe',
        ],
    },
    {
        version: 'v1.40.4 (สแกน QR + ระบบอัปเดต PWA)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'แก้ "ไม่สามารถเปิดกล้องได้" จริง ๆ คือ PWA บนมือถือจำ cache โค้ดเก่าค้าง (โค้ดสแกนเวอร์ชันใหม่ขึ้น production แล้ว แต่เครื่องไม่โหลด)',
            'เพิ่ม PWAUpdatePrompt: registerType=prompt + sw.ts message-driven skipWaiting → มีเวอร์ชันใหม่ขึ้นแถบ "อัปเดต" แตะแล้วรีโหลด (deploy ใหม่ถึงมือถืออัตโนมัติ ไม่ต้อง reset_sw)',
            'อัปเกรดกล้อง: helper กลาง src/lib/qrCamera.ts — startRearScanner ลองกล้องหลังก่อน ถ้า facingMode ล้มเหลว fallback ไป getCameras() เลือก deviceId',
            'รวมโค้ดซ้ำ: describeCameraError + start logic เข้า qrCamera.ts (StudentQRScanner + ClaimQRScanner ใช้ร่วม) + ลบ orphan QRScannerDialog.tsx',
            'Recovery ทันที (เครื่องที่ค้างอยู่ก่อน): เปิด ?reset_sw=1 1 ครั้งเพื่อรับโค้ดที่มีแถบอัปเดต',
        ],
    },
    {
        version: 'v1.40.3 (ธนาคารพอเพียง — ปุ่มเลือกจำนวนเงินด่วน)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'เพิ่มปุ่มเลือกด่วน 5/10/20/50/100 บาท ใต้ช่องจำนวนเงิน — กดแทนค่า (set) ลดเวลากรอกช่วงนักเรียนต่อแถว',
            'ใส่ทั้ง 2 ฟอร์ม: บันทึกธุรกรรมหลัก (SavingsBankManagement) + หน้าสแกน QR (ScanRecorder)',
            'ปุ่มที่ตรงกับค่าปัจจุบัน highlight สีทอง · พิมพ์เองได้ตามปกติ · ค่าเป็นจำนวนเต็มเข้ากับ whole-baht constraint (v1.40.2)',
        ],
    },
    {
        version: 'v1.40.2 (Fix — ธนาคารพอเพียง ฝากเป็นจำนวนเต็มบาท)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'แก้บั๊ก mouse-wheel footgun: <input type="number" step="0.01"> ถูก scroll ลดค่าทีละ 0.01 เงียบ ๆ (เคสจริง ฝาก 20 → ลงเป็น 19.98)',
            'ฟอร์มฝาก/ถอน (SavingsBankManagement + ScanRecorder): step="1" + inputMode="numeric" + parseInt + Number.isInteger + onWheel blur — รับจำนวนเต็มเท่านั้น',
            'Migration 103: CHECK (amount = trunc(amount)) เป็น defense-in-depth ที่ DB (คง column DECIMAL(10,2) เดิม)',
            'แก้ข้อมูล production: ด.ญ.กมลชนก อุ้ยอั้ง — รวม row 19.98 + row patch 0.02 เป็น deposit 20.00 รายการเดียว',
        ],
    },
    {
        version: 'v1.40.1 (Admin — เมนูสายตรง Facebook Feed)',
        date: '',
        badge: 'bg-[#1877F2]',
        items: [
            'เพิ่มเมนู Sidebar "ฟีดข่าว Facebook" ใต้หมวด "เว็บไซต์" (next to Hero Slides) → /admin/dashboard/facebook-feed',
            'หน้าใหม่ FacebookFeedManager.tsx — header + collapsible help (วิธีหา Page ID + วิธีสร้าง Long-Lived Token + การแก้ Token หมดอายุ) + FacebookFeedSettingsCard (reuse)',
            'ย้ายฟอร์มออกจาก Settings → Homepage Content (single source of truth) — Quicklinks ตามมาด้วย OBEC links โดยตรง',
            'เพิ่ม Cmd+K entry "ฟีดข่าว Facebook — ตั้งค่า" (keywords: facebook, feed, page, token, social, fb)',
            'อัปเดต BlockPalette hint: ตั้งค่าที่เมนู "ฟีดข่าว Facebook" (เดิมชี้ไปที่เนื้อหาหน้าแรก)',
            'PermissionGuard menuId="facebook-feed" — admin only (defense-in-depth + RLS layer)',
        ],
    },
    {
        version: 'v1.40.0 (Homepage — ฟีดข่าว Facebook)',
        date: '',
        badge: 'bg-[#1877F2]',
        items: [
            'Widget ใหม่ "ฟีดข่าว Facebook" ใต้ส่วนข่าวสารบนหน้าแรก — ดึงโพสต์ล่าสุดจาก Facebook Page ผ่าน Graph API',
            'Edge function `facebook-fetch` — โทร Graph API + cache โพสต์ + จัดการ token_expired/error status',
            'Migration 102: `facebook_feed_config` (admin-only RLS, token เก็บลึก) + `facebook_posts` (public read, service-role write)',
            'RPC `get_facebook_feed_meta` — เปิด non-secret config ให้หน้าแรกอ่านโดยไม่หลุด token',
            'Admin form ใน Settings → Homepage Content: ตั้ง Page ID, Token (masked), จำนวนโพสต์, refresh interval, ปุ่ม "รีเฟรชเดี๋ยวนี้"',
            'PageBuilder รองรับ block `facebook_feed` (BlockPalette + HomepagePreview)',
            'Stale-while-revalidate — หน้าโหลด cache ทันที + ยิง refresh background ถ้าเกิน refresh_interval',
        ],
    },
    {
        version: 'v1.39.6 (EducationalHubTeacher — ลบ Hero Bar Chart)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ลบ bar chart ใน hero ออก — ครูส่วนใหญ่มี content ไม่ครบทุกหมวด ทำให้ chart โล่ง ดูแปลก',
            'คืน info เต็มความกว้าง (ลบ max-w-sm) — hero เรียบ ไม่มีพื้นที่ว่างกลาง',
            'ลบ Recharts imports + chartData useMemo ออก — bundle เล็กลงเล็กน้อย',
            'รักษา Rule 14.11 wrapper (max-w-7xl mx-auto) จาก v1.39.5 ไว้',
        ],
    },
    {
        version: 'v1.39.5 (EducationalHubTeacher — Rule 14.11 fix)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /h/:identifier: ทำตาม DESIGN.md Rule 14.11 — wrap content ใน max-w-7xl mx-auto',
            'ลบ container mx-auto max-w-6xl ออกจาก hero + category sections (ละเมิด rule)',
            'CategoryChipStrip: ลบ -mx-4 hack + ลบ container mx-auto max-w-6xl inner',
            'Bar chart กลับมาใช้ ResponsiveContainer ได้ตามปกติ — root cause fix',
            'ขอบเนื้อหาตรงแนวเดียวกับ SiteHeader ที่ทุก viewport — ไม่ล้นซ้าย/ขวา',
        ],
    },
    {
        version: 'v1.39.4 (EducationalHubTeacher — Hero Bar Chart)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /h/:identifier: เพิ่ม horizontal bar chart แสดง content breakdown แต่ละหมวดในพื้นที่ด้านขวาของ hero',
            'ใช้ข้อมูล counts_by_category + categories ที่มีอยู่แล้ว — ไม่มี API call ใหม่',
            'Chart ซ่อนบน mobile (hidden sm:flex) — แสดงเฉพาะ desktop/tablet',
            'รองรับ banner variant (ครูที่มีรูป background) — ปรับสี label/tick อัตโนมัติ',
        ],
    },
    {
        version: 'v1.39.3 (EducationalHubTeacher — Compact Hero)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /h/:identifier: hero section ลดพื้นที่แนวตั้ง ~60% — py-3 sm:py-5 (จาก py-10 sm:py-14)',
            'Avatar: 48px (จาก 80px), layout เป็น flex-row ตลอด (ไม่ stack บนมือถือ)',
            'ชื่อครู: text-base sm:text-lg (จาก text-2xl sm:text-3xl), bio ซ่อนบนมือถือ',
            'ใช้กับทุกครู /h/:identifier อัตโนมัติ — content โหลดทันทีโดยไม่ต้องเลื่อน',
        ],
    },
    {
        version: 'v1.39.2 (RewardCard — Mobile teacher photo fix)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'RewardCard: teacher photo capsule เล็กลงบนมือถือ (w-9 h-9 + container w-[50px]) — ไม่บังภาพสินค้า',
            'Background โปร่งใส 35% บน mobile (bg-white/35) เทียบกับ 95% บน desktop — เห็นสินค้าชัดขึ้น',
            'ซ่อนชื่อครู/รางวัลกลางบน mobile (hidden sm:block) — ลด visual noise',
            'Desktop (sm+): ทุกอย่างเหมือนเดิม — ไม่กระทบ UX desktop',
        ],
    },
    {
        version: 'v1.39.1 (GamesTab — Developer Cheatsheet card)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มกล่อง "💡 คู่มือคำสั่งสำหรับ AI / นักพัฒนา" ด้านบนสุดของ GamesTab',
            'แสดง 3 คำสั่งหลัก: pnpm verify:game / /integrate-game / cp _template-full.html — กด copy ได้',
            'Integration Checklist 5 ข้อ + ลิงก์ไปยัง GAME.md',
            'Collapsible card — เปิดปิดได้ ไม่เกะกะตอนใช้งานปกติ',
        ],
    },
    {
        version: 'v1.39.0 (GAME.md rewrite + Automation System)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'GAME.md เขียนใหม่ AI-friendly (~250 บรรทัด จาก 460+242) — รวม GAME-TEMPLATE.md เข้าไฟล์เดียว',
            'สร้าง public/games/_template-full.html — template ใหม่ที่มี kampai + Supabase leaderboard ครบ',
            'สร้าง scripts/verify-game.mjs + `pnpm verify:game <file>` — ตรวจ 6 จุด integration อัตโนมัติ',
            'สร้าง /integrate-game slash command (Claude Code) — AI auto-integrate ตาม checklist',
            'เพิ่ม anti-pattern warnings: Firebase SDK, input ชื่อผู้เล่น, window.location.href ตรงๆ',
            'ลด integrate time จาก ~30 นาที → ~5 นาที',
        ],
    },
    {
        version: 'v1.38.8 (PlayGame — Fix session persistence ด้วย localStorage)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'เปลี่ยน sessionStorage → localStorage — session คงอยู่แม้ปิด tab / ปิด browser',
            '"กลับหน้าหลัก" ไม่ล้าง session อีกต่อไป — เปิดเกมถัดไปก็ยังไม่ต้องกรอกรหัส',
            'ล้าง session ได้ทางเดียว: กดปุ่ม "เปลี่ยนผู้เล่น" เท่านั้น',
        ],
    },
    {
        version: 'v1.38.7 (PlayGame — Exit Menu 4 ตัวเลือก + Auto-login)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'Exit Menu อัปเกรดเป็น 4 ตัวเลือก: เล่นซ้ำ / เลือกเกมอื่น / เปลี่ยนผู้เล่น / กลับหน้าหลัก',
            'Auto-login: บันทึกรหัสนักเรียนใน sessionStorage — เปลี่ยนเกมแล้วไม่ต้องกรอกรหัสใหม่',
            '"เลือกเกมอื่น" คง session ไว้ → เปิดเกมถัดไป auto-login ทันที',
            '"เปลี่ยนผู้เล่น" / "กลับหน้าหลัก" ลบ session → ต้องกรอกรหัสใหม่',
            'handleLookup รับ overrideCode ได้ เพื่อรองรับ auto-login จาก sessionStorage',
        ],
    },
    {
        version: 'v1.38.6 (PlayGame — Floating Exit Menu ระหว่างเล่นเกม)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'เพิ่มปุ่ม "☰ เมนู" floating มุมบนขวาของ game container ปรากฏตลอดระหว่าง phase=playing',
            'กดปุ่ม → AlertDialog "ออกจากเกม?" ถามยืนยัน',
            'กด "เล่นต่อ" → ปิด dialog เล่นต่อได้ปกติ / กด "ออกจากเกม" → navigate /h/nattapong',
            'ทำงานกับทุกเกมโดยไม่ต้องแก้ไฟล์ HTML เกมใดเลย',
        ],
    },
    {
        version: 'v1.38.5 (Word-Shield — Supabase leaderboard พร้อมรูปนักเรียน)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'ลบ input ชื่อผู้เล่น (Player Name) ออกจาก start screen',
            'เพิ่ม Supabase leaderboard top-5 พร้อมรูป avatar นักเรียน บน start screen',
            'เพิ่ม leaderboard ใน gameover screen — re-fetch หลังเล่นจบ',
            'startGame() ใช้ DISPLAY_NAME_INIT จาก kampai init message แทน input',
            'CSS: .leaderboard-box, .lb-avatar, .lb-entry-* สไตล์ neobrutalist ตามธีมเกม',
        ],
    },
    {
        version: 'v1.38.4 (Word-Shield — kampai postMessage + score tracking)',
        date: '',
        badge: 'bg-green-600',
        items: [
            'เพิ่ม kampai postMessage integration ใน word-shield.html (เกมพิมพ์คำสกัดศัตรู)',
            'IS_EMBED detection + รับ STUDENT_CODE / DISPLAY_NAME_INIT จาก init message',
            'sendGameEnd() ส่งคะแนนพร้อม metadata: wordsTyped, wave, wpm',
            'navigateBack() ใน restart-btn เมื่อ IS_EMBED → ส่ง navigate ไป /h/nattapong',
            'comment out saveScore() (Firebase) — ใช้ kampai แทน',
            'สร้าง migration 099_seed_word_shield_game.sql — game_slug=word-shield, tracked_game=true',
        ],
    },
    {
        version: 'v1.38.3 (EduHubItemCard — leaderboard strip)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'เพิ่ม leaderboard strip ในการ์ดเกม (tracked_game=true) — แสดง top-5 อันดับนักเรียน',
            'แต่ละช่อง: rank badge + PersonAvatar (xs) + คะแนน personal_best',
            'useQuery staleTime 5 นาที ป้องกัน RPC ซ้ำเมื่อการ์ดเยอะ',
            'ถ้าเกมยังไม่มีคนเล่น → ไม่แสดง strip (ความสูงการ์ดไม่เปลี่ยน)',
            'compact view: ไม่ fetch และไม่แสดง strip',
        ],
    },
    {
        version: 'v1.38.2 (Math Han — postMessage + score tracking)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เพิ่ม kampai postMessage integration ใน mth.html (เกมหารยาว Math Journey)',
            'IS_EMBED detection + รับ STUDENT_CODE / DISPLAY_NAME จาก init message',
            'ส่ง gameEnd เมื่อผ่านสอบ (test pass): score = (ด่าน+1)×10 + HP×2',
            'ส่ง gameEnd เมื่อ HP หมด (gameover): score = ด่านที่ผ่าน × 10',
            'ส่ง gameEnd เมื่อจบโหมดสอน (tutorial): score = 50 (participation)',
            'ปุ่ม Home ใน gameplay/gameover/certificate → navigateBack() เมื่อ embed',
            'เปลี่ยน external_url ใน DB จาก Storage URL → /games/math/mth.html (git path)',
        ],
    },
    {
        version: 'v1.38.1 (GamesTab — จัดการเกมทั้งหมด Storage + Git)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'GamesTab query: ขยายจาก Storage-only → Storage + Git legacy games (17 ตัว ใน /games/...)',
            'เพิ่ม badge "ประเภท" ในตาราง — Storage (เขียว) vs Git (เทา)',
            'ปุ่ม "อัพเดท v.2" แสดงเฉพาะ Storage games เท่านั้น',
            'ปุ่ม "ตั้งค่า" (Settings) สำหรับทุกเกม → GameSettingsDialog แก้ game_slug / tracked_game / is_published',
            'ลบ Git game: ลบแค่ DB record พร้อมแจ้ง dialog ว่าไฟล์ยังอยู่ใน git',
            'ลบ Storage game: ลบ DB record + ไฟล์จาก Storage (เดิม)',
            'แสดง game_slug ใต้ชื่อเกมในตาราง (ถ้ามี)',
        ],
    },
    {
        version: 'v1.38.0 (Game Management — ลบเกม + รีเซทคะแนนนักเรียน)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'GamesTab: ปุ่ม "ลบเกม" — ลบ DB record + ไฟล์ HTML จาก Storage พร้อม ConfirmDialog',
            'GamesTab: ปุ่ม "รีเซทคะแนน" (เฉพาะเกมที่มี game_slug) — ลบ sessions + achievements ของทุกนักเรียนสำหรับเกมนั้น',
            'GamePlayDashboard: game selector dropdown — เลือกดู leaderboard ของเกมใดก็ได้ (ไม่ล็อค pizza)',
            'GamePlayDashboard: ปุ่มรีเซทคะแนนต่อนักเรียน (icon RotateCcw) ใน leaderboard row',
            'Migration 097: RPC admin_reset_game_sessions(p_game_slug, p_student_id?) — ลบ sessions + achievements แบบ atomic ผ่าน SECURITY DEFINER',
            'Math Jumper bugfixes: star flicker, splice-in-forEach, bgObjects accumulation',
            'Math Jumper gravity -30%: very_easy 0.14 / easy 0.28 / hard 0.525',
        ],
    },
    {
        version: 'v1.37.4 (Stock-in-RPC — แก้บัค stock ไม่ตัด + เลิกพึ่ง trigger + admin reset UI)',
        date: '',
        badge: 'bg-rose-600',
        items: [
            '🐛 Critical bug: v1.37.3 พึ่ง trigger trg_reward_claim_status_change เพื่อหัก stock. ใน prod ตรวจพบ trigger หายเงียบๆ (function อยู่ครบ migration 081 รันแล้ว แต่ pg_trigger ว่าง) → claim หลายร้อย rows insert โดย stock ไม่ถูกหัก → drift "ลูกบอล" stock=6 vs claimed=7',
            'Architecture fix (migration 100): ย้าย stock mutation ทั้งหมดเข้า RPC ไม่พึ่ง trigger',
            'claim_reward RPC: เพิ่ม UPDATE rewards SET stock = stock - p_quantity inline หลัง INSERT — atomic ใน TX เดียว',
            'approve_reward_claim RPC ใหม่: ไม่กระทบ stock (pending→approved ไม่ต้องเปลี่ยน). idempotent. RPC อ่าน reviewer + approver จาก auth.uid() + user_roles เอง — ไม่ต้องส่ง params จาก client',
            'reject_reward_claim RPC ใหม่: คืน stock +qty เฉพาะถ้า OLD status เป็น active. Idempotent กัน double-restore (ถ้า reject ซ้ำจะ no-op)',
            'admin_set_reward_stock RPC ใหม่: SECURITY DEFINER + is_admin() guard — admin เซ็ต stock ตรงๆ สำหรับ reconcile drift',
            'DROP TRIGGER trg_reward_claim_status_change — ไม่ใช้แล้ว. Function handle_reward_claim_status_change() คงไว้ + COMMENT DEPRECATED (ใช้ escape hatch รอ rollback)',
            '🛠️ Admin UI: หน้า Rewards Management — คลิก stock badge ของรางวัล → popover พิมพ์ค่าใหม่ → setStock RPC. ปุ่ม "ตั้งเป็นไม่จำกัด" เซ็ต stock=NULL (admin RLS อนุญาต)',
            'Service refactor: approve(claimId) / reject(claimId, reason) — ลบ args reviewedBy/staffId/administratorId. setStock(rewardId, n) เพิ่มใน rewardsService',
            'Call sites: ClaimsApproval.tsx + ClaimQRScanner.tsx ตัด args เก่าออก — ไม่กระทบฟังก์ชันเดิม',
            'DESIGN.md Rule 14.42: architecture matrix + ห้าม update reward_claims.status ตรงๆ + Admin reconcile workflow',
        ],
    },
    {
        version: 'v1.37.3 (Reward Claim Quantity — แลกหลายชิ้นต่อครั้ง + รายการที่แลกได้เลยจากหน้าเช็คแต้ม)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '🎁 Feature: หน้า /waste-bank/rewards (หน้าบ้านนักเรียน) — เลือกจำนวนชิ้นที่จะแลกได้ผ่าน +/− stepper + ช่อง number input. แสดง total breakdown ใหญ่ + แต้มคงเหลือหลังหัก realtime',
            'Schema (migration 099): reward_claims เพิ่ม column quantity INT NOT NULL DEFAULT 1 CHECK > 0. claim_reward RPC signature ใหม่ (p_code, p_reward_id, p_quantity DEFAULT 1) — บันทึก row เดียวต่อการแลกพร้อม points_used = points_cost × quantity',
            'Stock trigger handle_reward_claim_status_change อัปเดต: ใช้ NEW/OLD.quantity แทน ±1. status active→rejected คืน stock +qty, rejected→active หัก −qty, DELETE คืน +qty',
            'maxQuantity clamp: min(floor(available_points/points_cost), stock). user ใส่เกิน max → auto-clamp. ปุ่ม + disabled เมื่อถึง max — กัน RPC error ก่อนถึง server',
            '🔍 UX: BalanceCheckDialog — หลังกรอกรหัสตรวจแต้มสำเร็จ แสดง mini-grid "🎁 รางวัลที่คุณแลกได้เลย" (filter เฉพาะที่ points_cost ≤ available_points + stock พอ + sort ราคาน้อยก่อน). คลิก "แลกเลย" → balance dialog ปิด + claim dialog เปิดทันที พร้อมข้อมูลนักเรียน prefilled (ไม่ต้อง lookup ซ้ำ)',
            'RewardClaimDialog props ใหม่ initialCode + initialStudent — skip lookup ทันทีที่มี → ลด round-trip RPC',
            'get_student_history RPC: คืน quantity เพิ่ม ใช้ตอนแสดงประวัติ "ครั้งนั้นแลกกี่ชิ้น" ในอนาคต',
            'Backward compat: ทุก claim เก่ามี quantity=1 (DEFAULT) ไม่ต้อง backfill. RPC signature ใหม่ใช้ DEFAULT 1 → caller เดิม claim_reward(code, reward_id) ยังเรียกได้ผ่าน positional/named args',
            'DESIGN.md Rule 14.41: source-of-truth = RPC, ห้าม insert ตรง, stock trigger logic, max quantity formula',
        ],
    },
    {
        version: 'v1.37.2 (Shared Quick Menu — แอดมินปักหมุดเมนูเดียว ครูทุกคนเห็นเหมือนกัน)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            '🐛 Bug fix: ครูเห็นเมนูลัดไม่ครบกับที่แอดมินปัก — ส่วนใหญ่เห็นแค่ 4 เมนู default. Root cause: migration 025 ตั้ง RLS เป็น auth.uid() = user_id → quickMenuService.getAdminQuickMenu() คืน null สำหรับครู → fallback ไป DEFAULT_TEACHER_IDS',
            'Architecture fix: migration 098 สร้างตาราง shared_quick_menu (singleton, id=1) เป็น single source of truth — RLS: ทุก authenticated user อ่านได้, เฉพาะ is_admin() เขียนได้. Seed จาก user_quick_menu_preferences ของแอดมินคนแรก (ไม่หาย)',
            'Auto-append เมนูใหม่: เพิ่ม known_catalog_ids ใน shared_quick_menu — เมื่อ catalog เพิ่มเมนูใหม่ (เช่น budget, sar) → รอบที่แอดมินเปิด dashboard ครั้งถัดไป QuickMenu จะ append อัตโนมัติ → ครูทุกคนเห็นทันที (ไม่ต้องให้แอดมินกดจัดการเอง)',
            'Permission-aware rendering: เมนูที่ครูไม่มีสิทธิ์ (ไม่อยู่ใน allowedMenus + ไม่ใช่เมนูครูพื้นฐาน) แสดงเป็นปุ่มสีเทา + ไอคอน lock + tooltip "คุณยังไม่มีสิทธิ์ใช้เมนูนี้" — ไม่ซ่อน, เพื่อให้ครูรู้ว่ามีเมนูนี้และขอสิทธิ์ได้',
            'Service rewrite: quickMenu.service.ts เหลือแค่ getShared / saveShared (ลบ get / save / getAdminQuickMenu เดิม). QuickMenu.tsx ใช้ useRef กัน auto-append re-fire ระหว่าง mount',
            'Backwards-compat: คงตาราง user_quick_menu_preferences (migration 025) ไว้ ไม่ drop — เผื่อ rollback. ไม่มี code path ไหนใช้แล้ว',
            'DESIGN.md Rule 14.40: source of truth + data flow + ห้ามเปลี่ยน id ของเมนูเดิม (จะกลายเป็นเมนูใหม่และเมนูเดิมหายจาก list ของทุกคน)',
        ],
    },
    {
        version: 'v1.37.1 (Critical Hotfix — Cmd-K registry icon import + safety net)',
        date: '',
        badge: 'bg-red-600',
        items: [
            '🚨 Critical: หน้าเว็บขาวทั้งระบบ เนื่องจาก src/lib/commands/registry.ts อ้าง icon ClipboardList ที่ไม่ได้ import จาก lucide-react → ReferenceError ตอน module load → React ไม่ mount (incident 2ba6903)',
            'Root cause: เพิ่ม Cmd-K entries ใน v1.35-1.37 หลายรอบ แต่ลืม sync top imports. TypeScript ปล่อยผ่านเพราะ object literal value reference + lenient tsconfig (noImplicitAny: false + strictNullChecks: false)',
            'Fix หลัก: เพิ่ม ClipboardList ใน import block ของ src/lib/commands/registry.ts + เปลี่ยน bare Image (browser global) → ImageIcon (alias ที่มีอยู่)',
            'Hardening กันซ้ำ (1): src/i18n/config.ts เพิ่ม react.useSuspense=false + .catch() บน init — ป้องกัน i18n race condition ที่อาจทำให้ขาวซ้ำในอนาคต',
            'Hardening กันซ้ำ (2): src/main.tsx wrap <App /> ด้วย <ErrorBoundary> ที่ root — error ก่อน App body render จะเห็น error fallback แทนหน้าขาว',
            'Recovery tool: src/main.tsx เพิ่ม URL kill-switch ?reset_sw=1 → unregister ทุก ServiceWorker + clear ทุก Cache Storage + reload — สำหรับ user ที่ติด PWA cache เก่า (เปิด https://kampai-school.vercel.app/?reset_sw=1)',
            'DESIGN.md sync: Rule 14.38 (Cmd-K Registry Icon Import Discipline — mandatory pre-commit grep check) + Rule 14.39 (PWA Service Worker Recovery — ?reset_sw=1 protocol)',
            'CLAUDE.md Gotchas: 2 bullets ใหม่ — registry.ts blank-screen trap + PWA cache recovery workflow',
            'Lesson learned: เพิ่ม entry ใน registry.ts ต้อง grep ตรวจ icons ก่อน commit ทุกครั้ง — คำสั่ง: grep -oE "icon: [A-Z][a-zA-Z]+" src/lib/commands/registry.ts | sort -u',
        ],
    },
    {
        version: 'v1.37.0 (Productivity & Polish — i18n + Heatmap + Custom Dashboard + Offline Attendance)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'i18n TH/EN (#17): react-i18next + i18next-browser-languagedetector — config + 2 locale files (th/en) + LanguageSwitcher dropdown ใน SiteHeader (public) + AdminLayout top bar. localStorage key kampai_lang ผู้ใช้เปลี่ยนแล้วจำ',
            'ActivityHeatmap (#20): GitHub-style 52-week grid component — percent-based threshold intensity, Thai month/day labels, total contributions footer, tooltip per cell. Reusable ทุกที่ที่อยากแสดง daily activity (admin home, student profile, teacher dashboard)',
            'Migration 097 user_dashboard_layout: per-user JSONB widgets config — RLS scoped to own user only. service dashboard-layout.service ใช้ upsert จัด layout',
            'CustomizableDashboard (#18): wrapper component รับ widgets[] + จำ layout per user — dnd-kit (มีอยู่แล้ว) reorder + hide/show ผ่าน dialog "จัด layout" + auto-merge widget catalog ใหม่ที่เพิ่มมาภายหลัง',
            'Offline-First Attendance (#22): IndexedDB queue (lib idb) ใน src/lib/offline-queue.ts + service เพิ่ม upsertBulkResilient + flushOfflineQueue (auto-retry, drop after 5 failures)',
            'OfflineQueueIndicator: floating badge bottom-left แสดงคิว pending + auto-flush เมื่อ window online event — hide เมื่อคิวว่าง + online',
            'Dependencies: + i18next@26, react-i18next@17, i18next-browser-languagedetector@8, idb@8',
            'Skipped จาก Tier 3: #19 Visual Report Builder (ใหญ่มาก ต้อง full drag-drop builder + scheduler), #21 Capacitor wrapper (ส่วนใหญ่เป็น infra config — verify ไม่ได้ใน session)',
        ],
    },
    {
        version: 'v1.36.0 (Community & Engagement — Surveys + Alumni + Class Photos with Face Tagging)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'Migration 094 Surveys: surveys + survey_questions + survey_responses (answers stored as JSONB keyed by question_id) + trigger increment_response_count. 6 question types (text/radio/checkbox/rating_5/rating_10/nps)',
            'SurveyManagement /admin/dashboard/surveys: question builder + audience selection (all/parents/staff/students/class) + anonymous toggle + publish toggle + responses viewer',
            'SurveyResponse /surveys/:id (public): fill UI with required validation, NPS/rating button grids, anonymous-by-default',
            'Migration 095 Alumni Network: alumni_profiles (public submit, admin verifies) + alumni_events + alumni_event_attendees (RSVP) + trigger increment_attendee_count',
            'Alumni /alumni (public): grid of verified profiles, RSVP to events, submit own profile (สถานะรอตรวจสอบ)',
            'AlumniManagement /admin/dashboard/alumni: 3 tabs (รอตรวจ/ยืนยันแล้ว/กิจกรรม) — verify with "เด่น" flag + create events',
            'Migration 096 Class Photos + Face Tagging: class_photos + class_photo_tags (x/y/radius as percent — responsive) + RLS PDPA-strict (parents see only own child tags)',
            'ClassPhotosManagement /admin/dashboard/class-photos: upload via existing school_images storage bucket + click-to-tag UI (cursor crosshair → click face → pick student) + tooltip with delete on hover',
            'Routes ใหม่: /alumni + /surveys/:id (public) · /admin/dashboard/{surveys,alumni,class-photos} (admin/teacher) · Cmd-K 5 entries + 1 public',
            'Sidebar section "ชุมชน/Engagement" — แยกจาก operations เพื่อความชัดเจน',
        ],
    },
    {
        version: 'v1.35.0 (School Daily Operations — Homework + Conference + Dismissal)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'Migration 091 Homework Portal: assignments (per class+room+due_date+max_score) + assignment_submissions (UNIQUE per student) + RLS แยกตามบทบาท (staff manage, parent submit own children only)',
            'AssignmentManagement /teacher/assignments: ครูสร้างการบ้าน + ดูรายชื่อนักเรียนที่ส่ง/ยังไม่ส่ง + grade inline พร้อม comment',
            'ParentAssignments /parent/assignments: ผู้ปกครองเห็นการบ้านของบุตรในห้องเรียน + ส่งงาน (text body) + เห็นคะแนน + ความเห็นครู',
            'Migration 092 Conference Scheduling: conference_slots (teacher publishes, Calendly-style) + conference_bookings (UNIQUE per slot — ป้องกัน double-booking) + status (confirmed/cancelled/no_show/completed)',
            'ConferenceSlotsManager /teacher/conferences: ครูเปิด slot พร้อม duration + location + notes, ดูว่า slot ไหนถูกจอง, ยกเลิกได้',
            'ConferenceBooking /parent/conferences: parent ดู slot ว่างทั้งหมด group by day, จองพร้อมระบุหัวข้อที่อยากคุย, ยกเลิกได้',
            'Migration 093 Dismissal Tracking: pickup_persons (authorized adults per student พร้อม photo + nat_id 4 หลักท้าย) + pickup_log (snapshot ชื่อ+ความสัมพันธ์เผื่อ pickup_persons ลบทีหลัง)',
            'DismissalManagement /admin/dashboard/dismissal: 3 tabs — บันทึกการรับ (quick mode + ค้นหานักเรียน), จัดการผู้รับ (CRUD pickup persons), ประวัติ (50 รายการล่าสุด real-time)',
            'Auto-notify parents: ทุกครั้งที่บันทึก pickup → fan out Push + LINE พร้อมกัน — parent ได้รับข้อความ "ลูกถูกรับโดย X เรียบร้อย"',
            'Routes ใหม่: /teacher/{assignments,conferences} + /parent/{assignments,conferences} + /admin/dashboard/dismissal',
            'Cmd-K: t-assignments, t-conferences, p-assignments, p-conferences, adm-dismissal — รองรับ keywords ไทย/อังกฤษ',
        ],
    },
    {
        version: 'v1.34.0 (Communication & Engagement — Emergency + Chat + Donations)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'Migration 088 emergency_alerts: severity (info/warning/critical) + target_audience (all_parents/all_staff/all_users/class_specific) + audit trail (push_sent_count, line_sent_count, total_targets)',
            'EmergencyAlertPanel /admin/dashboard/emergency: one-click broadcast UI → fan out Push + LINE พร้อมกัน, severity preview, confirmation dialog ก่อนส่ง, history list',
            'Migration 089 realtime chat: chat_threads (UNIQUE per parent×teacher×student) + chat_messages พร้อม read_at + trigger auto-update last_message_preview + ALTER PUBLICATION supabase_realtime — enable live updates',
            'chat.service.ts: openThread (idempotent), sendMessage, markRead, subscribeToThread (Supabase Realtime postgres_changes), unreadCount',
            'ChatWindow + ChatPage components: message list with read receipts + auto-scroll + Enter-to-send + composer, parent picks teacher จาก staff list ที่มี user_role=teacher, ใช้กับทั้ง /parent/chat และ /teacher/chat',
            'Migration 090 donations: donation_campaigns + donations + trigger recalc_campaign_raised (auto-sum verified donations), RLS public read campaigns + verified donations',
            'Donate.tsx public page /donate: PromptPay QR generation (lib promptpay-qr) ตามจำนวนที่กรอก, multi-campaign picker, anonymous donation toggle, progress bar',
            'DonationsManagement /admin/dashboard/donations: create campaign + verify slips + toggle active/featured + ทั้ง 3 tabs (campaigns/pending/all)',
            'Sidebar entries: แจ้งเตือนฉุกเฉิน + รับบริจาค (admin only) + Cmd-K entries: emergency, donations, p-chat, t-chat, go-donate',
            'Routes ใหม่: /donate (public), /parent/chat + /teacher/chat (gated), /admin/dashboard/{emergency,donations} (admin)',
            'Dependencies: + promptpay-qr@0.5.0',
        ],
    },
    {
        version: 'v1.33.0 (Tier 1 Compliance — Health + DMC + PDPA)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'Migration 086 health: student_health_records (กรุ๊ปเลือด, แพ้, ยาประจำตัว, ผู้ติดต่อฉุกเฉิน, สายตา, ฟัน) + student_vaccinations (วัคซีน 10+ ชนิด, dose, next_dose_date) + student_growth_measurements (น้ำหนัก/ส่วนสูง/BMI generated column) + view student_latest_growth → ใช้ใน DMC export',
            'HealthManagement /admin/dashboard/health: per-student detail panel 3 tabs (โปรไฟล์, วัคซีน, น้ำหนัก/ส่วนสูง) — admin/teacher บันทึก, parent อ่าน (RLS ผ่าน parent_student_links)',
            'Migration 087 PDPA: pdpa_consents (6 scopes — photo_public, photo_news, line_msg, push_notify, data_sharing_moe, data_sharing_thirdparty), data_access_logs (append-only audit trail), pdpa_erasure_requests (parent submit → admin review) + RPC log_data_access() SECURITY DEFINER',
            'DMC Export Excel (M002): xlsx lib + dmc-export.service ดึง students + latest growth + health → 34 columns ตาม DMC schema (ลำดับ, รหัส, ปชช., คำนำหน้า, ชื่อ-สกุล, เพศ, วันเกิด, ชั้น, น้ำหนัก, ส่วนสูง, กรุ๊ปเลือด, ที่อยู่, ผู้ปกครอง, อาการแพ้)',
            'DmcExportPanel /admin/dashboard/dmc-export: filter ตามชั้น + completeness audit (5 fields ที่บังคับ) + ตัวอย่าง 5 ระเบียน + ดาวน์โหลด .xlsx ผ่าน XLSX.writeFile (100% client-side)',
            'PdpaDashboard /admin/dashboard/pdpa: 3 tabs (คำขอลบ pending → review with notes, audit log 100 รายการล่าสุด, แนวปฏิบัติพ.ร.บ.มาตรา 83 ปรับ 5 ล้านบาท)',
            'PdpaSelfView /parent/privacy: parent toggle consent ต่อ scope (6 ตัว) + submit erasure request (photos/attendance/scores/all) + ดู status คำขอเก่า',
            'Sidebar section "สุขภาพ/Compliance": Health (ทุกบทบาท admin), DMC (admin), PDPA (admin) + Cmd-K entries ครบ 4 keywords (health, dmc, pdpa, privacy)',
            'Dependencies: + xlsx@0.18.5 (DMC Excel formatter)',
        ],
    },
    {
        version: 'v1.32.0 (LINE Official Account Integration — replaces LINE Notify)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'Migration 085 line_user_links + line_message_logs: schema สำหรับเก็บผู้ติดตาม LINE OA + log ทุก in/out message + RPC helper line_ids_for_users(uuid[]) (SECURITY DEFINER) ใช้ fanout ตอนส่ง',
            'Edge function line-webhook (verify_jwt=false): รับ events จาก LINE — ตรวจ x-line-signature ด้วย HMAC-SHA256, follow → upsert profile, unfollow → mark is_followed=false, message → log + auto-reply text "ติดต่อครูประจำชั้น"',
            'Edge function line-send (verify_jwt=true, admin/teacher): resolve user_ids → line_user_ids ผ่าน RPC → push text message ผ่าน LINE Messaging API + log ทุก attempt (status ok/error)',
            'LineConnectCard ใน parent dashboard: แสดงสถานะ "เชื่อมต่อแล้ว" (พร้อมรูป profile + ปุ่มยกเลิก) หรือ "ยังไม่เชื่อมต่อ" (พร้อม "เพิ่มเพื่อน LINE" + QR + คำแนะนำ 3 ขั้น)',
            'LineFollowersManager /admin/dashboard/line: admin manage ผู้ติดตาม 3 tabs (รอผูก / ผูกแล้ว / เลิกติดตาม) + ปุ่ม "ผูก" (ใส่ user UUID) + ปุ่ม "ทดสอบ" ส่งข้อความเฉพาะคน',
            'Absence trigger v2: attendanceService.notifyAbsenceParents() ตอนนี้ fan-out ทั้ง send-push (Web Push) และ line-send (LINE) แบบขนาน — parent ที่มีอย่างใดอย่างหนึ่งหรือทั้งสองจะได้รับเสมอ',
            'Sidebar + Cmd-K entries: "LINE OA" admin-only — รองรับ Cmd-K keywords "line", "oa", "notify", "broadcast"',
            'Required Supabase secrets ก่อนใช้งาน: LINE_CHANNEL_SECRET (webhook signature), LINE_CHANNEL_ACCESS_TOKEN (Messaging API)',
            'Required Vercel env: VITE_LINE_OA_BASIC_ID (basic ID ของ OA — ใช้สร้าง add-friend URL)',
        ],
    },
    {
        version: 'v1.31.0 (Save Teachers — ปพ.5 / ปพ.6 Auto PDF Generation)',
        date: 'ล่าสุด',
        badge: 'bg-green-700',
        items: [
            'ปพ.5 (รายภาคเรียน) + ปพ.6 (รายปี) สร้าง PDF อัตโนมัติ: ดึงคะแนน scores_records + การมาเรียน attendance_records + ความประพฤติ conduct_scores ของนักเรียนแต่ละคน → ออก PDF พร้อมส่ง สพฐ. ลดเวลาครูจาก 3-5 วัน/เทอม เหลือไม่กี่นาที',
            'หน้า /admin/dashboard/papor (admin + teacher): tab ปพ.5 / ปพ.6, เลือกปีการศึกษา + ภาคเรียน + ชั้น + นักเรียน → preview inline ผ่าน PDFViewer + ปุ่ม "ดาวน์โหลด" และ "ดาวน์โหลดทั้งห้อง" (bulk per class)',
            'paporService: ฟังก์ชัน forStudentTerm() aggregate ข้อมูล + คำนวณเกรดตามเกณฑ์ สพฐ. 4-point (80=4, 75=3.5, ..., <50=0) + ช่วงวันที่ภาคเรียนตามรูปแบบไทย (เทอม 1 พ.ค.-ก.ย., เทอม 2 พ.ย.-มี.ค.)',
            'React-PDF templates: PaporFive (1 หน้า/คน/ภาคเรียน) + PaporSix (1 หน้า/คน/ปี รวม 2 ภาคเรียน) — มี school header, นักเรียน info block, ตารางคะแนน, สรุปการมาเรียน, conduct summary, ลายเซ็น 3 ตำแหน่ง (ครูประจำชั้น/หัวหน้าวิชาการ/ผอ.)',
            'Sarabun font embedded: bundle จาก @fontsource/sarabun (weights Thai 400+700) ไป public/fonts/ + Font.register() + Font.registerHyphenationCallback() ป้องกันตัดคำไทย',
            'PDF generation 100% client-side (browser): ไม่ผ่าน server, ข้อมูลไม่หลุดออกจาก client — แต่ละ download trigger 1 ครั้ง ต่อนักเรียน, มี 150ms delay กันบราวเซอร์บล็อก bulk download',
            'Command Palette + Sidebar entry: เพิ่ม "ปพ.5 / ปพ.6 (PDF)" — Cmd-K → "ปพ" หรือ "papor" หรือ "สมุดพก" ค้นเจอ',
            'Dependencies: + @react-pdf/renderer@4.5.1, + @fontsource/sarabun@5.2.8',
        ],
    },
    {
        version: 'v1.30.0 (AI Assistant + Multi-child Parent + Absence Push Trigger)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'AI ผู้ช่วยครู (Anthropic Claude API): edge function ai-assist + service ai-assist.service.ts + admin/teacher UI หน้า /admin/dashboard/ai-assist พร้อม 4 modes — แผนการสอน (lesson_plan), ข้อสอบ (exam_questions, รูปแบบ ก./ข./ค./ง. + เฉลย), ความเห็นในสมุดพก (report_comment) ใช้ claude-haiku-4-5, แบบอิสระ (free)',
            'Prompt caching: ใช้ cache_control: ephemeral บน system prompt → ลด input tokens ครั้งถัดไป (auto-tracked ใน ai_assist_log.cached_input_tokens)',
            'Migration 084 ai_assist_log: บันทึก mode/model/token usage/duration/error → admin audit cost ได้ผ่าน RLS (user เห็นของตัวเอง, admin เห็นทุกคน)',
            'Multi-child parent linking (Migration 083): parent_student_links many-to-many + RPC helpers my_children() และ parents_of_student() (SECURITY DEFINER) + backfill ผู้ปกครองเดิมจาก user_roles อัตโนมัติ',
            'ChildSwitcher UI: ผู้ปกครองที่มีบุตรหลายคนสลับได้จาก parent dashboard header — เก็บ active child ใน localStorage, default เป็น is_primary',
            'useActiveChild hook + ActiveChildProvider: context ใช้ทั่ว parent portal — แทน useLinkedRecord เดิมที่จำกัด 1 ลูก',
            'Absence Push Trigger: เมื่อบันทึก attendance status="absent" → attendanceService.notifyAbsenceParents() resolve parent user_ids ผ่าน parents_of_student RPC → invoke send-push พร้อมชื่อบุตร + วันที่ (รวมหลายลูกใน 1 push ต่อผู้ปกครอง)',
            'Command Palette entry: เพิ่ม "AI ผู้ช่วยครู (Claude)" ใน registry (admin + teacher) — Cmd-K → "AI" ค้นเจอ',
            'Sidebar entry: "AI ผู้ช่วยครู" ใน AdminLayout menu (ทุก role ที่เข้า admin dashboard)',
            'Env: ต้องตั้ง ANTHROPIC_API_KEY บน Supabase Edge Function secrets (ทางเลือก: ANTHROPIC_MODEL_FAST / ANTHROPIC_MODEL_SMART)',
        ],
    },
    {
        version: 'v1.29.0 (Quick Wins — Command Palette + Fuzzy Search + Web Push)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'Command Palette (Ctrl/Cmd+K): global dialog เรียกได้ทุกหน้า — รวม static commands ตามสิทธิ์ (admin/teacher/parent/public), shortcut overlay บน Admin top bar, mount ครั้งเดียวใน App.tsx ผ่าน CommandPaletteProvider',
            'Global Fuzzy Search (Fuse.js): ค้นข้ามนักเรียน/บุคลากร/ข่าวจากช่องเดียวใน Cmd-K — debounce + แคชด้วย TanStack Query (staleTime 5 นาที), respect RLS via existing tables, แสดงเป็น group แยกตามประเภท พร้อม icon',
            'Web Push Notifications (PWA): Migration 082 push_subscriptions + RLS (user เห็นของตัวเอง, admin อ่าน/ลบได้), สลับ vite-plugin-pwa จาก GenerateSW → InjectManifest พร้อม src/sw.ts ที่จัดการ push event + notificationclick + ย้าย workbox runtime caching เดิมมาให้ครบ',
            'PushPermissionBanner: nudge ผู้ปกครอง/ครูเปิด permission — แสดงเมื่อ login + browser รองรับ + permission default, กดไว้ก่อนแล้วเงียบ 7 วัน, แสดงผ่าน sonner toast',
            'send-push Edge Function: รับ {user_ids, topic, title, body, url} → ตรวจสิทธิ์ admin → ดึง subscription ผ่าน service role → ส่งผ่าน web-push (VAPID) → auto-prune subscription ที่ 404/410',
            'Theme cleanup: ลบ bg-white / border-gray-200 / border-slate-200 / text-slate-700 hardcoded ออกจากหน้าหลัก (SavingsBank, StudentHeroPublic, WasteBank, RewardsCatalog) และบล็อก homepage (HomeMainContent, HomeLeftSidebar, HomeRightSidebar, KampaiHeroDashboard, SavingsBankParentView) → ใช้ bg-card / border-border / text-muted-foreground ตาม Rule 14',
            'Dependencies: + cmdk (มีอยู่), + fuse.js@7, + web-push@3.6.7, + workbox-precaching/routing/strategies/expiration/core',
            'Env: ต้องตั้ง VITE_VAPID_PUBLIC_KEY บน Vercel + VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY / VAPID_SUBJECT บน Supabase Edge Function secrets',
        ],
    },
    {
        version: 'v1.28.0 (Thai Dates & Teacher Portal Scanner FAB Upgrades)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'ระบบวันที่ภาษาไทย (Thai Localized Dates): ฟอร์แมตวันที่ภาษาไทยย่อ/เต็มแบบพรีเมียม (พ.ศ.) ในระบบบันทึกเวลาเรียน (Attendance), ธนาคารขยะ (Waste Bank), ธนาคารพอเพียง (Savings Bank), และระบบใบลา (Leave Management) ด้วย formatThaiDateCustom และ formatThaiDateRange',
            'ระบบจัดการสิทธิ์ Portal ครู (Teacher Portal Access & Navigation): ปรับปรุงการแสดงผลเมนูหลังบ้านบนแถบเมนูข้าง (Dynamic Sidebar) และการ์ดสวิตช์ระบบ (Back-office Welcomer Card) บนแดชบอร์ดของครูอัตโนมัติตามสิทธิ์ allowedMenus',
            'ปุ่มสแกนด่วน (Quick Scan & ScanFAB): เพิ่มปุ่มทางลัดสแกนด่วนบน Portal ครู และนำเข้าปุ่มลอยกล้องสแกนด่วนบนมือถือ (ScanFAB) ครอบคลุมการทำงานครูทุกหน้าจอ',
        ],
    },
    {
        version: 'v1.27.0 (Featured Hero Visibility & DB RLS Policies)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'แก้ไขระบบการจัดการโครงร่างหน้าแรก (Homepage Layout Manager) ให้ทำงานครอบคลุมโค้ดการสร้างหน้าจากคีย์ดั้งเดิม (Legacy Keys) เพื่อให้ปุ่มและบล็อก สุดยอดฮีโร่ความดีประจำสัปดาห์ (featured_hero) ถูกโหลดและแสดงผลได้โดยอัตโนมัติ',
            'สร้าง Migration 070_public_read_active_students_basic.sql เพื่อตั้งค่าสิทธิ์ Row Level Security (RLS) ของตารางนักเรียน (students) ให้ผู้ใช้ทั่วไป (anon) และผู้ใช้ที่ล็อกอินสามารถ SELECT นักเรียนที่มีสถานะ is_active = true และให้ผู้ปกครองสามารถ SELECT ประวัตินักเรียนของตนเองได้',
            'ปรับปรุงระบบการแสดงผลชื่อนักเรียนและรูปภาพโปรไฟล์ (PersonAvatar) บนหน้าแรก (Featured Hero Block) ให้สอดคล้องตามกฎ PDPA และกฎ DESIGN.md Rule 14.13 ในระบบโรงเรียน',
        ],
    },
    {
        version: 'v1.26.0 (PWA — Add to Home Screen / Installable App Icon)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'vite-plugin-pwa (Workbox autoUpdate) + injectRegister: ผู้ใช้ไม่ต้องพิมพ์ URL — ติดตั้ง icon บนหน้าจอมือถือได้เลย (Android + iOS)',
            'public/manifest.webmanifest: name โรงเรียนบ้านคำไผ่ / short_name คำไผ่ / display standalone / theme #157F3C / scope / + 4 icons (192, 512, maskable 192/512)',
            'public/icons/ (6 ไฟล์ via @vite-pwa/assets-generator): pwa-64/192/512.png + maskable-icon-512.png + apple-touch-icon-180x180.png + favicon.ico — gen จาก og-image placeholder (admin upload ของจริง → rerun generator)',
            'src/hooks/usePwaInstall.ts: state machine — canInstall (beforeinstallprompt) + isIos + isStandalone + isMobile + isDismissed (14-day TTL via localStorage)',
            'src/components/pwa/InstallBanner.tsx (mounted global ใน App.tsx ใต้ Toaster): floating bottom banner — Android โชว์ปุ่ม "ติดตั้ง" / iOS โชว์คำแนะนำ 3 ขั้น (Share → เพิ่มที่หน้าจอโฮม → เพิ่ม) + Framer Motion slide-up + dismiss button',
            'index.html: เพิ่ม link rel="manifest" + apple-touch-icon + apple-mobile-web-app-* meta tags + เปลี่ยน theme-color #1e3a5f → #157F3C (sync กับ DESIGN.md)',
            'Workbox: globPatterns รวม js/css/html/png/svg/woff + navigateFallback /index.html + denylist (/api/, /games/) — sync กับ vercel.json rewrites + Supabase = NetworkOnly (กัน stale data)',
            'devOptions.enabled: false — SW run แค่ production (กัน dev cache headache) + registerType autoUpdate (Workbox check version + reload auto)',
        ],
    },
    {
        version: 'v1.25.0 (Layout Density — Premium Compact Refactor)',
        date: '',
        badge: 'bg-slate-600',
        items: [
            'WasteBank + WasteBankStats: compress spacing + padding + typography (742 บรรทัด refactor) — เห็น content ต่อ viewport มากขึ้น',
            'SavingsBank: compress layout + ลด podium height + box main container กัน full-width banner overflow + "วิธีฝาก-ถอน" compact (272 บรรทัด รวม 4 commits)',
            'Contact: compress spacing + card padding + typography ให้ match site density (93 บรรทัด)',
            'Calendar: compress spacing + paddings + timeline dot + card height (82 บรรทัด)',
            'แนวคิด "high-density premium" — premium visual presentation แต่ content density สูงขึ้น โดยไม่เสีย hierarchy',
            'Pure visual density polish — ไม่มี logic เปลี่ยน ไม่กระทบ data/queries',
        ],
    },
    {
        version: 'v1.24.0 (Educational Hub — View Modes + Admin Layout Lock + Staff Short URL)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'HubToolbar.tsx (new): 4 view modes (Grid 3×3 / Featured / List / Compact) + column selector (3/4/5/6) + sort (Default / Popular / Alpha / Newest) + integrated search',
            'useHubViewMode hook (new, 93 บรรทัด): localStorage persistence (key: kampai_edu_hub_layout) + cross-tab sync via storage event',
            'Admin lock layout: HubLayoutDefaultsTab.tsx (new, 224 บรรทัด) — admin lock view+cols+sort ทั้งหมด → users เห็น readonly + amber 🔒 badge',
            'useHubLayoutWithDefault hook (new, 97 บรรทัด): compose DB default (school_settings) + localStorage + isLocked gate; uses useQuery + invalidation chain',
            'TeacherHubCard refactored: 4 variants (grid / featured / list / compact) — share base, differ in layout/typography',
            'Staff short URL /staff/<username>: Migration 067 ย้าย username จาก educational_hub_profiles → staff table (UNIQUE + CHECK regex) + staffService.getByIdentifier() resolve UUID หรือ username',
            'Migration 066 (edu_hub_view_last_item_at.sql): เพิ่ม last_item_at column ใน view v_educational_hub_teachers สำหรับ Newest sort',
        ],
    },
    {
        version: 'v1.23.0 (Games Framework — Single-file Template + Teacher Guide + Admin Paste Upload)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'public/games/_template.html (new, 395 บรรทัด): single-file boilerplate — EMBED detection, STUDENT_CODE cache, postMessage init/gameEnd, IS_TOUCH detection, score/lives HUD, sample Tap-the-Dot game; แบ่ง 3 sections (A boilerplate / B TODO logic / C entry)',
            'GAME-TEMPLATE.md (new, 242 บรรทัด) ที่ repo root: 11-section guide — single-file rationale, quick start, structure, naming conventions, upload workflow, testing checklist, AI prompt template, game ideas, FAQ, versioning',
            'GamesTab.tsx (admin): toggle inputMode file ↔ paste — textarea + size counter (เปลี่ยนเป็นแดงเมื่อ >5MB) + resolveHtmlFile() helper สร้าง File blob จาก text — support ทั้ง create + replace flow (ไม่ต้องแก้ backend)',
            'Workflow ใหม่: ครู copy _template.html → rename → แก้แค่ SECTION B (game logic) แล้ว upload ผ่าน admin UI ได้เลย — ไม่ต้อง code knowledge เชิงลึก',
            'Standalone playable ที่ /games/_template.html (test ก่อน upload) หรือ /play/_template (เมื่อ tracked_game = true → เก็บ score/XP/badges)',
        ],
    },
    {
        version: 'v1.22.3 (Attack-on-Noun — Score Tracking + Mobile Touch Controls)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            'Attack-on-Noun (3D FPS shooter) hook เข้า game tracking pattern เดียวกับ pizza: postMessage init/gameEnd, score HUD, +100 ถูก / −20 ผิด (min 0), 3 hearts; final score → record_game_session RPC ผ่าน wrapper',
            'Mobile/tablet touch controls: IS_TOUCH detection → virtual joystick (left-bottom, 130px+ responsive) + look pad (full-screen drag) + fire/jump/zoom buttons (right-bottom) — ทุกตัวมี touch-action: none กัน scroll',
            'Mobile fix: skip pointer-lock เมื่อ IS_TOUCH (iOS/Android ไม่ support) → manually show/hide blocker overlay แทน',
            'Navigation polish: เพิ่ม "← Back to games" button ใน PlayGame header + game redirect ปรับเป็น /h/nattapong (specific teacher hub แทน /educational-hub generic)',
        ],
    },
    {
        version: 'v1.22.2 (Pizza Master Chef — Complete Overhaul + Pause System)',
        date: '',
        badge: 'bg-amber-500',
        items: [
            'Visual overhaul: glassmorphism start screen, circular timer, star rating system, gradient pizza fills, confetti, fever mode visual, VIP (⭐) / angry (😠) / group customers',
            'Difficulty system: 3 waves (14/20/26 orders) + daily challenge mode + equivalent fractions mini-challenge + wrong-answer explanation modal (feedback loop ดีขึ้น)',
            'Pause system: ESC modal + exit / select-new-game navigation buttons ภายใน iframe',
            'External nav links ทั้งหมดเพิ่ม target="_top" + return-to-selection link ปรับไปยัง /educational-hub',
            'File ขยาย 2174 → 2362 บรรทัด (+188 บรรทัด — UI/feedback/power-ups/pause)',
        ],
    },
    {
        version: 'v1.22.1 (Iframe Security & Navigation — Vercel SAMEORIGIN + Sandbox + postMessage)',
        date: '',
        badge: 'bg-red-500',
        items: [
            'vercel.json SPA rewrite pattern: /((?!api/).*) → /((?!api/|games/).*) — กัน static game HTML ตก fallback เป็น index.html (เคยทำให้เกมโหลด React app แทน HTML)',
            'vercel.json header rule: /games/(.*) → X-Frame-Options: SAMEORIGIN เฉพาะ (route อื่นยังคง DENY กัน clickjacking) — แก้ /play wrapper ที่ embed iframe ไม่ได้',
            'PlayGame iframe sandbox: เพิ่ม allow-pointer-lock + allow-modals tokens + Permissions-Policy header (pointer-lock, fullscreen, autoplay, cross-origin-isolated) — แก้ Attack-on-Noun start ไม่ได้เพราะ pointer-lock ถูก block',
            'postMessage navigation pattern: game ส่ง {type:"navigate", to} → parent ทำ React Router navigate (กัน <a target="_top"> break ออกจาก iframe ทำลาย wrapper state)',
            'PlayGame URL cache-bust: append ?t=Date.now() ป้องกัน iframe cache เก่าค้างหลัง deploy',
        ],
    },
    {
        version: 'v1.22.0 (Game Play Tracking — XP/Level/Badges + Pizza pilot)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'หน้าใหม่ /play/:gameSlug (สาธารณะ): wrapper state-machine 5 ขั้น — กรอกรหัสนักเรียน → ยืนยันด้วยรูป (PersonAvatar) → pre-game (XP bar + Level + Badge grid) → playing (iframe) → result modal (level-up, badges)',
            'แก้ public/games/thai/pizza-master-chef.html (~25 บรรทัด): EMBED detection + postMessage gameEnd ออกไปยัง parent wrapper (ส่ง score+mode+duration+combo+fever), CSS .embed-mode ซ่อน name input + standalone leaderboard',
            'Migration 066: game_sessions + game_achievements_catalog + game_student_achievements + view game_student_stats (first_5_avg vs last_5_avg) + 4 RPCs (lookup_student_for_game, record_game_session, get_game_leaderboard, push_game_session_to_score_records) + RLS pattern (writes ผ่าน SECURITY DEFINER เท่านั้น) + seed 8 badges + fix Pizza subject เป็น "คณิตศาสตร์" (migration 062 seed ผิด เพราะ folder /games/thai/)',
            'Anti-cheat: 20s rate-limit per (student, game) ใน RPC + sanity (score 0–1M, duration ≥ 5s ถ้า score > 100) + clamp params',
            'XP/Level: xp_earned = max(1, score/10) + badge xp_bonus, level curve doubling (L1=0, L2=100, L3=300, L4=700, L5=1500...) compute client-side',
            'Badges 8 ประเภท: first_play, score_gte (1k/3k/5k/10k), plays_gte (10), improvement_ratio (1.5x last_5_avg/first_5_avg), streak_days (7 — ใช้ Asia/Bangkok timezone)',
            'EduHubItemCard: เพิ่ม branch ถ้า item.tracked_game && game_slug → navigate /play/:slug (แทน window.open) + Badge "เก็บคะแนน" บน card',
            'Admin Dashboard /admin/dashboard/games: 4 stat cards (30 วัน) + BarChart plays/day (14 วัน) + เกมยอดนิยม + leaderboard pizza (RPC get_game_leaderboard)',
            'Student 360° tab "เกมการศึกษา": per-game stats + improvement % + LineChart trend + Badge grid + sessions table พร้อมปุ่ม "ส่งเข้าคะแนน" (admin/teacher only) → push เข้า score_records (manual gate — ไม่ปนคะแนนจริงโดยอัตโนมัติ)',
            'Service: src/services/game-play.service.ts + helper levelFromXp() — ทุก query ผ่าน service layer (กฎ CLAUDE.md)',
        ],
    },
    {
        version: 'v1.21.0 (Educational Hub — คลังสื่อและเกมการศึกษา)',
        date: '',
        badge: 'bg-purple-600',
        items: [
            'หน้าใหม่ /educational-hub (สาธารณะ): list การ์ดครูทุกคน — รูป + คำอธิบาย + chip นับรายการต่อหมวด + ปุ่มเข้าหน้าครูแต่ละท่าน',
            'หน้าใหม่ /educational-hub/:staffId (สาธารณะ): banner + bio + ปุ่ม "ดูข้อมูลครู" (→ /staff/:id) + "เว็บส่วนตัวครู" (→ external_url) + sticky chip nav สำหรับ scroll to category + sections แสดง items ของแต่ละหมวด',
            'หน้าใหม่ /teacher/edu-hub (Teacher Portal): tab "รายการของฉัน" จัดการ items ของตัวเอง + tab "โปรไฟล์คลัง" แก้ banner / bio / external_url / is_hub_active',
            'หน้าใหม่ /admin/dashboard/educational-hub: 3 tab — หมวดหมู่ (CRUD global catalog) / ครูทั้งหมด (toggle is_hub_active + drill-in จัดการ items แทนครู) / รายการทั้งหมด (moderation filter)',
            'Item types 4 แบบใน 1 ตาราง (polymorphic + CHECK constraint): file (อัพโหลด, 50MB), link (URL ภายนอก), youtube (auto-extract ID + iframe preview), text (rich text snippet)',
            'Migration 061: 3 tables (categories/profiles/items) + view v_educational_hub_teachers (JSON counts_by_category) + 2 RPC counters (incrementView/incrementDownload, anon-safe SECURITY DEFINER) + storage bucket educational-hub (public, 50MB, mime allowlist)',
            'RLS owner pattern (จาก migration 042 rewards): public อ่าน is_published=true เท่านั้น, ครูแก้เฉพาะของตัวเอง via user_roles.staff_id, admin จัดการได้ทั้งหมด',
            'Reuse: ImageUpload (banners + thumbnails), PersonAvatar (DESIGN Rule 14.13), Form+RHF+zod, TanStack Query + invalidation chain (items → teachers view), PortalProtectedRoute',
            'Seed 4 หมวดเริ่มต้น: คลังสื่อการสอน / คลังเกมการศึกษา / คลังใบงาน / วิดีโอการสอน',
        ],
    },
    {
        version: 'v1.20.4 (docs-hub date INPUTS เป็น พ.ศ. ผ่าน ThaiDatePicker)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            'รายงานจาก screenshot ผู้ใช้: dialog "รับหนังสือใหม่" ช่อง "วันที่รับ" แสดง 17/05/2026 (HTML5 native = ค.ศ.) — v1.20.3 แก้แค่ "display" (table cells) ไม่ได้แตะ "input" (form fields)',
            'แก้ 19 จุดใน 13 ไฟล์ใต้ /admin/dashboard/docs-hub: `<Input type="date">` → `<ThaiDatePicker>` (component พร้อมตั้งแต่ v1.18.x)',
            'Saraban (4 ไฟล์): IncomingLetters (received_date+due_date), OutgoingLetters (sent_date), Meetings (meeting_date), Orders (doc_date)',
            'HR (1 ไฟล์): LeaveManagement (start_date+end_date)',
            'Budget (1 ไฟล์): BudgetManagement (txn_date)',
            'ActionPlan (1 ไฟล์): start_date+end_date',
            'StudentDocs (2 ไฟล์): HomeVisitForm (visit_date), GeneralDocsTab (doc_date)',
            'Academic (4 ไฟล์ที่เข้าจาก docs-hub ผ่าน /academic): AcademicCalendar (start_date+end_date), Supervision (visit_date+followup_date), Counseling (session_date+followup_date), SpecialNeeds (start_date+end_date)',
            'Required fields (received_date/sent_date/meeting_date/visit_date) ใส่ clearable={false} กันลบโดยไม่ตั้งใจ',
            'ภายในเก็บ value เป็น ISO ค.ศ. เหมือนเดิม — DB ไม่เปลี่ยน, ผู้ใช้เห็น "17 พฤษภาคม 2569" + month/year dropdown ภาษาไทย + weekday header ภาษาไทย',
        ],
    },
    {
        version: 'v1.20.3 (docs-hub — Thai dates + file-first upload UX)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            'ผู้ใช้ตรวจ /admin/dashboard/docs-hub พบ 2 จุดต้องปรับ: รูปแบบวันที่ไม่ consistent + saraban forms รับเฉพาะ URL ไม่มีปุ่ม upload',
            'Date format: 5 จุดเปลี่ยนเป็น formatThaiDateFull/Medium จาก @/lib/thaiDate',
            '  • IncomingLetters: คอลัมน์ "วันที่รับ" + "ครบกำหนด" (.toLocaleDateString → formatThaiDateFull)',
            '  • OutgoingLetters: คอลัมน์ "วันที่" (.toLocaleDateString → formatThaiDateFull)',
            '  • MeetingsManagement: คอลัมน์ "วันประชุม" (raw ISO → formatThaiDateFull)',
            '  • OrdersManagement: คอลัมน์ "วันที่" (raw ISO → formatThaiDateFull)',
            '  • RecentActivityFeed fallback (.toLocaleDateString → formatThaiDateMedium)',
            'Upload UX: IncomingLetters/OutgoingLetters dialogs เปลี่ยน "URL ไฟล์แนบ" เดิม → file input PRIMARY (บน, label "แนะนำให้อัปโหลด") + URL input SECONDARY (ล่าง, label "หรือใส่ URL — ทางเลือก")',
            'letterTrackingService.uploadAttachment(type, id, file) — เก็บใน student-docs bucket path letters/{type}/{id}/{ts}.{ext}, signed URL 1 ปี, ไม่ต้อง migration ใหม่',
            'Out of scope (defer): Budget/ICS/ActionPlan ฟอร์ม ไม่มีช่องไฟล์แนบเลย → เป็น feature ใหม่ ไม่ใช่ UX fix',
        ],
    },
    {
        version: 'v1.20.2 (academic cluster — service layer refactor)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'ต่อจาก v1.20.1 lesson: 7 components ใน admin/academic/ ฝ่าฝืน Hard Rule "no raw supabase.from() in component" — 28 occurrences เสี่ยง schema drift เหมือน BanksSummary ที่เพิ่งแก้',
            'Wire-up only: academic.service.ts มี 7 services พร้อมแล้ว (classSchedule/lessonPlan/teachingMaterial/academicCalendar/specialNeeds/counseling/supervision) — แค่ component ไม่ได้ใช้',
            'Refactor 7 components: TeachingMaterials, Supervision, SpecialNeeds, Counseling, LessonPlan, ClassSchedule, AcademicCalendar — แต่ละไฟล์ 4 ที่ (fetch/insert/update/delete) → service method',
            'Lookup helpers ใหม่: staffService.getNameOptions() + studentsService.getAcademicOptions() — ปิด dropdown queries ใน 5 ไฟล์ (LessonPlan/Supervision/ClassSchedule/SpecialNeeds/Counseling)',
            'ปิด loop จาก v1.20.1: Student360Detail.SupportSummary เลิก raw query → ใช้ specialNeedsService.countByStudent + counseling Service.countByStudent → **Student 360° = 0 raw queries**',
            'Bonus: ลบ `import { supabase }` ใน 8 ไฟล์ (เหลือ 0 หลัง refactor)',
            'ผลรวม: 111 raw occurrences → 83 (-28 จาก academic cluster + ไม่นับ supportSummary ที่ aliased ผ่าน v1.20.1 ก่อนหน้า). cluster ที่เหลือ defer ตามแผน supabase_refactor_pending: saraban/hr/students/homepage/gallery',
        ],
    },
    {
        version: 'v1.20.1 (hotfix — Student 360° banks/attendance schema mismatch)',
        date: '',
        badge: 'bg-rose-600',
        items: [
            'รายงานจากผู้ใช้: นักเรียนที่มี waste deposit จริง — Student360 tab "ธนาคาร" แสดง 0 — สำรวจพบ 2 schema mismatch + ฝ่าฝืน Hard Rule "no raw supabase.from() in component"',
            'BanksSummary: query `waste_transactions.select(\'amount\')` ผิด schema — waste_transactions ใช้ Items+Points model (`quantity` + `points_earned`) ไม่มี column `amount` → r.amount เป็น undefined → sum = 0 เสมอ',
            'แก้: ใช้ wasteSummaryService.getForStudent + savingsSummaryService.getForStudent (view waste_student_summary / savings_student_summary ที่มีอยู่แล้ว) → แสดง total_transactions + total_points_earned + available_points สำหรับ waste, deposit_count + withdraw_count + current_balance สำหรับ savings',
            'AttendanceSummary: เปรียบ status === "มา"/"ขาด"/"สาย" แต่ DB เก็บเป็น English literal "present"/"absent"/"late"/"leave" (ดู AttendanceStatus type) → ทุก condition false → % การมาเรียน = 0% เสมอ',
            'แก้: ใช้ attendanceService.getByStudentDateRange (12 เดือนล่าสุด) + เปรียบเทียบ English literal + เพิ่ม bucket "ลา" เป็นช่องที่ 5 ใน grid',
            'SupportSummary: เปลี่ยน .select("*") (โหลด rows เต็ม) → .select("id", { count: "exact", head: true }) — ลด network payload, type-safe (state: number ไม่ใช่ unknown[])',
            'Lesson learned: component ที่เขียน raw supabase.from() เสี่ยงสูง — schema เปลี่ยน (เช่น migration 018 เปลี่ยน waste จาก kg/baht → items/points) แต่ component ไม่รู้ — service layer จะ catch ด้วย type system ตั้งแต่ compile',
        ],
    },
    {
        version: 'v1.20.0 (Student 360° integration — Phase 4G)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            'จาก data overlap audit พบ student-docs (Phase 4F) duplicate กับ students/score_records/student_special_needs/counseling_records 80-100% — refactor เป็น Student 360° Profile Hub เพื่อใช้ source-of-truth tables ตัวเดียว',
            'Migration 060: student_meal_budget (UNIQUE student+year+period) + RLS is_teacher() + DELETE rows category IN (registry,transcript,support) + UPDATE doc_category_meta.students label เป็น "ภาพรวมนักเรียน 360°"',
            'ยุบ 3 หมวดซ้ำ: STUDENT_DOC_CATEGORIES จาก 6 → 4 (home_visit/health/meal/general) — เลิก registry/transcript/support ที่ duplicate students table',
            'lib/sdqScoring.ts: 25 ข้อ Thai SDQ (5 domain × 5) + reverse-coded items + computeSdqScores + interpretSdqTotal (0-15 ปกติ, 16-19 เสี่ยง, 20-40 มีปัญหา) + interpretDomain cutoffs',
            'Services ใหม่: meal-budget (upsert onConflict student+year+period) + home-visits (photo upload signed 365d) + sdq (upsert onConflict student+year) + student-360 (getProfile aggregate address + listStudents search/classroom filter + listClassrooms)',
            'StudentDocsHub refactor: 6-card category grid → student-first landing (search + classroom Select + grid PersonAvatar) — คลิกนักเรียน → ?id=... → Student360Detail',
            'Student360Detail (10 tabs): โปรไฟล์ (read-only จาก students + link StudentsManagement) / คะแนน+ความดี (External link ไป /admin/dashboard/scores+conduct) / เช็คชื่อ (% present/late/absent คำนวณจาก attendance_records) / ดูแลพิเศษ (special_needs+counseling counts) / เยี่ยมบ้าน (HomeVisit form+timeline+photo) / SDQ (25 ข้อ Likert + real-time domain scoring + history) / อาหาร/นม (per ปี-ภาคเรียน + totals card) / ธนาคาร (waste+savings sum) / ไฟล์แนบ (general category)',
            'No duplicate data: ทุก field profile ดึงจาก students table ตรง ๆ (current_address compose จาก house_no+moo+tambon+amphoe+province) — ไม่มี local copy + แก้ที่ StudentsManagement = sync ทั่วระบบ',
            'Bundle: chunk student-docs ≤ 30 KB gz — reuse PersonAvatar / formatThaiDateFull / shadcn Card/Select/Badge/Table/Dialog',
        ],
    },
    {
        version: 'v1.19.0–1.19.9 (Documents Hub + 6 New Modules)',
        date: '',
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
            'Menu Manager (/admin/dashboard/menu): DnD reorder menu items + group เป็น dropdown (parent/child) + จัดสี navbar (bg/text/active/hover) + font weight + font size — SiteHeader อ่านจาก useMenuConfig() hook (school_settings.menu_config JSON)',
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
        totalTables: '70+',
        migrations: 84,
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
    lines.push(`- **Tables**: ${exportData.database.totalTables}`);
    lines.push(`- **Migrations**: ${exportData.database.migrations}`);
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
                                <p>• Vercel: SPA rewrite <code className="bg-secondary px-1 rounded">{'/((?!api/|games/).*)'}</code> (exclude static games), cron <code className="bg-secondary px-1 rounded">/api/ping</code> ทุก 3 วัน</p>
                                <p>• Security headers: X-Frame-Options DENY (default), XSRF, Referrer-Policy</p>
                                <p>• Iframe security: <code className="bg-secondary px-1 rounded">/games/*</code> = SAMEORIGIN เฉพาะ (อื่น = DENY), sandbox tokens <code className="bg-secondary px-1 rounded">allow-pointer-lock allow-modals</code>, Permissions-Policy รวม fullscreen + autoplay + cross-origin-isolated</p>
                                <p>• Game iframe nav: parent ↔ child via <code className="bg-secondary px-1 rounded">postMessage</code> ({'{type:"gameEnd"}'} score + {'{type:"navigate"}'} route) — กัน <code className="bg-secondary px-1 rounded">{'<a target="_top">'}</code> break out</p>
                                <p>• Asset cache: 1 ปี (immutable) + iframe URL cache-bust <code className="bg-secondary px-1 rounded">?t=Date.now()</code></p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">school-images</code>: รูปภาพ (1 GB)</p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">school-documents</code>: เอกสาร (50 MB/file)</p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">educational-hub</code>: คลังสื่อ (50 MB/file)</p>
                                <p>• Storage bucket <code className="bg-secondary px-1 rounded">edu-hub-games</code>: เกมการศึกษา HTML (single-file template)</p>
                                <p>• Env vars: <code className="bg-secondary px-1 rounded">VITE_SUPABASE_URL</code>, <code className="bg-secondary px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code>, <code className="bg-secondary px-1 rounded">RESEND_API_KEY</code></p>
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
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{exportData.database.totalTables} Tables</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">{exportData.database.migrations} Migrations</div>
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
