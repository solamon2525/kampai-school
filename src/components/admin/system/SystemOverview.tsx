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
        features: ['จัดการข่าวสาร + ปักหมุด', 'แกลเลอรี่อัลบั้มรูปภาพ', 'ปฏิทินกิจกรรม', 'จัดการเอกสารดาวน์โหลด', 'FAQ', 'Hero Slides หน้าหลัก', 'Countdown เปิดเทอม Real-time'],
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
        color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        features: ['หนังสือรับ', 'หนังสือส่ง', 'คำสั่ง/ประกาศ', 'บันทึกการประชุม', 'Dashboard ภาพรวม'],
    },
    {
        label: 'งานบุคคล (HR)',
        color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        features: ['ระบบการลา', 'บันทึกการอบรม/พัฒนาตนเอง', 'ประเมินผลงาน PA Assessment'],
    },
    {
        label: 'ระบบบริการ',
        color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800',
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
    { label: 'บุคลากร', tables: ['administrators', 'staff', 'students', 'attendance_records', 'student_council', 'student_achievements', 'student_activities', 'student_stats', 'grade_data'] },
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
    { icon: '📱', title: 'LINE Notify Integration', desc: 'แจ้งผ่าน LINE เมื่อมีข่าว/กิจกรรม/ลูกขาดเรียน — เชื่อม LINE Login ผู้ปกครอง' },
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
        badge: 'bg-purple-500',
        items: [
            { icon: '💬', title: 'In-app Chat (Teacher ↔ Parent)', effort: '4 วัน', stack: 'Supabase Realtime + messages table' },
            { icon: '📲', title: 'PWA + Push Notifications', effort: '2 วัน', stack: 'vite-plugin-pwa + Web Push API' },
            { icon: '📱', title: 'LINE Notify Integration', effort: '2 วัน', stack: 'LINE Notify API + Edge Function' },
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
        version: 'v1.7.0 (Admin Audit Remediation)',
        date: 'ล่าสุด',
        badge: 'bg-violet-700',
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
        badge: 'bg-indigo-600',
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
        badge: 'bg-indigo-500',
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
        badge: 'bg-indigo-500',
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
        badge: 'bg-violet-500',
        items: [
            'Cross-Zone Movement: ทะลุข้อจำกัดด้วยเมนู "ย้ายโซน" ย้ายบล็อคระหว่างคอลัมน์ได้อย่างอิสระ',
            'Interactive Live Preview: ระบบใช้เมาส์ลากบล็อคจากเครืองมือ ไปวางในจอพรีวิว (Drag to Drop) ได้เลย',
        ],
    },
    {
        version: 'v1.1.0 (Visual Homepage & Performance)',
        date: '',
        badge: 'bg-violet-500',
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
        badge: 'bg-purple-500',
        items: [
            'ระบบสารบรรณ Phase 1+2',
            'หนังสือรับ-ส่ง, คำสั่ง/ประกาศ, บันทึกการประชุม',
        ],
    },
    {
        version: 'Student Management',
        date: '',
        badge: 'bg-pink-500',
        items: [
            'ฐานข้อมูลนักเรียนรายบุคคล',
            'ระบบเช็คชื่อนักเรียน',
        ],
    },
    {
        version: 'Page Builder v1',
        date: '',
        badge: 'bg-indigo-500',
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
        totalTables: '45+',
        migrations: 24,
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
    lines.push(`- **Tables**: 45+`);
    lines.push(`- **Migrations**: 24`);
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
                        <Printer className="w-4 h-4 text-purple-500" />
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
                                <Cloud className="w-4 h-4 text-purple-500" />
                                <h4 className="font-semibold text-sm text-purple-600 dark:text-purple-400">Deployment & Hosting</h4>
                            </div>
                            <div className="space-y-2 mb-6">
                                {techStack.deployment.map((t) => (
                                    <div key={t.name} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
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
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">45+ Tables</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">24 Migrations</div>
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
