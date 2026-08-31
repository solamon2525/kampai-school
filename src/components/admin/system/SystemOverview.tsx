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
    Search,
    ArrowRight,
    CircleAlert,
    RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { educationalHubService } from '@/services/educational-hub.service';
import { curriculumService } from '@/services/curriculum.service';
import { lessonPacksService } from '@/services/lesson-packs.service';
import { assignmentsService } from '@/services/assignments.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Input } from '@/components/ui/input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    featureCatalog,
    featureCatalogStats,
    featureGroupsFromCatalog,
    longTermPlan,
    type FeatureStatus,
} from '@/components/admin/system/featureCatalog';
import { cn } from '@/lib/utils';

const featureGroups = featureGroupsFromCatalog;

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
        { name: 'cmdk + fuse.js', desc: 'Command Palette + fuzzy search — live (Ctrl/Cmd+K)' },
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

const dbGroups = [
    { label: 'เนื้อหา CMS', tables: ['news', 'news_categories', 'gallery_albums', 'gallery_photos', 'events', 'documents', 'hero_slides', 'testimonials', 'partners', 'faq', 'ticker_items', 'surveys'] },
    { label: 'บุคลากร / นักเรียน', tables: ['administrators', 'staff', 'students', 'attendance_records', 'grade_data', 'score_records', 'conduct_scores', 'parent_student_links', 'student_health_records', 'student_documents'] },
    { label: 'ธนาคาร / รางวัล', tables: ['waste_categories', 'waste_transactions', 'savings_transactions', 'rewards', 'reward_claims', 'daily_quest_config', 'daily_quest_completions'] },
    { label: 'สารบรรณ / Docs Hub', tables: ['incoming_letters', 'outgoing_letters', 'meetings', 'signatures', 'budget_categories', 'budget_transactions', 'supply_items', 'supply_requests', 'digital_workload_baselines', 'digital_paper_logs', 'sar_standards', 'sar_assessments', 'ics_forms', 'action_plan_projects', 'doc_template_definitions'] },
    { label: 'HR', tables: ['leave_requests', 'leave_balances', 'training_records', 'pa_assessments'] },
    { label: 'วิชาการ / ตัวชี้วัด', tables: ['class_schedules', 'lesson_plans', 'teaching_materials', 'academic_calendar', 'curriculum_indicators', 'indicator_games', 'indicator_lesson_plans', 'integrated_plan_topics', 'integrated_plan_units', 'student_indicator_assessments', 'student_special_needs', 'counseling_records'] },
    { label: 'คลังสื่อ / packs', tables: ['educational_hub_categories', 'educational_hub_profiles', 'educational_hub_items', 'lesson_packs', 'lesson_pack_items', 'game_docs', 'game_bgm_tracks'] },
    { label: 'เกม / quest', tables: ['game_sessions', 'game_achievements_catalog', 'game_student_achievements', 'online_matches', 'english_quest_worlds', 'english_quest_progress', 'pixel_forest_rpg_profiles'] },
    { label: 'Portal / การบ้าน', tables: ['assignments', 'assignment_submissions', 'conference_slots', 'conference_bookings', 'pickup_persons', 'pickup_log', 'class_photos', 'class_photo_tags'] },
    { label: 'สื่อสาร', tables: ['chat_threads', 'chat_messages', 'notifications', 'push_subscriptions', 'line_user_links', 'line_message_logs', 'emergency_alerts'] },
    { label: 'PDPA / บริจาค', tables: ['pdpa_consents', 'pdpa_erasure_requests', 'data_access_logs', 'donation_campaigns', 'donations'] },
    { label: 'ระบบ', tables: ['school_settings', 'page_views', 'user_roles', 'user_menu_permissions', 'shared_quick_menu', 'user_dashboard_layout', 'ai_assist_log', 'cctv_cameras', 'admissions', 'alumni_profiles'] },
];

const SYSTEM_OVERVIEW_META = {
    version: 'v1.227.6',
    verifiedDate: '28 ส.ค. 2569',
    verifiedIsoDate: '2026-08-28',
    productionUrl: 'https://kampai-school.vercel.app',
    database: {
        tables: 165,
        views: 16,
        rlsTables: 165,
        appliedMigrations: 250,
        trackedMigrationFiles: 506,
        latestProductionMigration: '20260827162859 · upgrade_mixed_number_conversion_worksheet',
        latestRepositoryMigration: '476_upgrade_mixed_number_conversion_worksheet.sql',
    },
} as const;

/** รายการที่ยังไม่ ship / ยังไม่ครบ — ของที่ขึ้น production แล้วอยู่ featureCatalog */
const roadmap = [
    { icon: '📅', title: 'Activity Heatmap', desc: 'ความมีส่วนร่วมรายปีแบบ GitHub contribution graph' },
    { icon: '🗺️', title: 'Interactive Floor Plan', desc: 'แผนที่โรงเรียน SVG — คลิกอาคาร/ห้องดูข้อมูล' },
    { icon: '📧', title: 'Visual Newsletter Builder', desc: 'ลากวางเทมเพลตอีเมล + ส่งผ่าน Resend เมื่อมีข่าวใหม่' },
    { icon: '📨', title: 'SMS Gateway (จริง)', desc: 'ส่ง SMS ผ่าน provider จริง — ตอนนี้มีแค่เทมเพลตคัดลอก (deferred)' },
    { icon: '🌐', title: 'i18n ครบทั้งเว็บ', desc: 'LanguageSwitcher ใน portal มีแล้ว — ขยายแอดมิน + หน้าสาธารณะ' },
    { icon: '📆', title: 'Google Calendar / iCal', desc: 'ซิงค์ปฏิทินภายนอก (เริ่มจาก iCal ก่อน OAuth เต็ม)' },
    { icon: '📑', title: 'Reports Builder (Visual)', desc: 'สร้างรายงานลาก chart + filter ส่งออก PDF/CSV' },
    { icon: '🧾', title: 'e-Donation กรมสรรพากร', desc: 'ใบเสร็จภาษีทางการ — ตอนนี้มีใบเสร็จเบา + PromptPay (deferred ปี 2)' },
    { icon: '🏫', title: 'MoE SIS / EMIS sync', desc: 'ซิงค์ทะเบียนสองทาง — คง DMC export จนกว่ามี API ชัด (deferred)' },
];

const sprintPlan = [
    {
        sprint: `✅ ส่งมอบแล้ว (ถึง ${SYSTEM_OVERVIEW_META.version})`,
        duration: 'เสร็จ',
        goal: 'แกนโรงเรียนครบ: CMS · วิชาการ/ปพ./DMC · ธนาคาร+เกม · คลังสื่อ/เกม/ใบงาน/packs · Chat/LINE/Push · Portal 3 บทบาท · สารบรรณ/HR · PDPA/บริจาค',
        badge: 'bg-emerald-600',
        items: [
            { icon: '💬', title: 'Chat + แนบไฟล์ · Push · LINE OA', effort: 'live', stack: 'mig 446 + push_subscriptions + line_*' },
            { icon: '📦', title: 'Lesson packs + มอบหมายบ้าน + แนบงาน', effort: 'live', stack: 'lesson_packs · assignments · mig 450' },
            { icon: '📊', title: 'Coverage KPI + soft-gap + BatchMapper', effort: 'live', stack: 'RPC indicator_coverage_summary · mig 447–449' },
            { icon: '🧾', title: 'บริจาค PromptPay + ใบเสร็จเบา', effort: 'live', stack: 'donations · printable receipt' },
            { icon: '📚', title: 'บทสรุปฟีเจอร์ทั้งระบบ (SoT)', effort: 'live', stack: 'featureCatalog.ts · v1.204' },
        ],
    },
    {
        sprint: 'ตอนนี้ — Phase 16 ops',
        duration: 'ต่อเนื่อง',
        goal: 'โค้ด Phase 16 พร้อมแล้ว — ปิดด้วยหลักฐานการใช้งานจริงของครู + คุณภาพ map',
        badge: 'bg-amber-600',
        items: [
            { icon: '👩‍🏫', title: 'ครู non-admin อัปสื่อ ≥1 คน', effort: 'ops', stack: 'KPI ใน /teacher/edu-hub + System Overview' },
            { icon: '🔎', title: 'รีวิว soft-gap รายวิชา', effort: 'ops', stack: 'IndicatorCoverageDialog กรอง soft-gap' },
            { icon: '🔁', title: 'ลูป pack → มอบหมาย → ส่ง → ตรวจ', effort: 'habit', stack: 'ทำให้เป็นกิจวัตรรายสัปดาห์' },
        ],
    },
    {
        sprint: 'คิวถัดไป — ปี 1 harden',
        duration: '3–6 เดือน',
        goal: 'ทำให้ของที่มีใช้ครบทุกวัน + สื่อสารพึ่งได้ + PDPA เป็นกิจวัตร',
        badge: 'bg-blue-600',
        items: [
            { icon: '✅', title: 'เช็คชื่อ/คะแนนครบก่อนปิดภาค', effort: 'ops', stack: 'ปพ. completeness drills' },
            { icon: '🔐', title: 'PDPA ความยินยอม + erasure SLA', effort: 'ops', stack: 'pdpa_* + /privacy' },
            { icon: '📣', title: 'ซ้อมแจ้งเตือนฉุกเฉิน + Push/LINE', effort: 'ops', stack: 'emergency_alerts' },
            { icon: '📦', title: 'พัสดุ + Digital Ops ลดภาระครู', effort: 'live', stack: 'mig 452 · v1.208' },
            { icon: '🎯', title: 'Onboarding tour ครู', effort: 'live', stack: 'TeacherOnboardingTour · v1.208' },
            { icon: '📋', title: 'งานค้างครูบนแดชบอร์ด', effort: 'live', stack: 'TeacherPendingTasksCard · v1.207' },
        ],
    },
    {
        sprint: 'ปี 2 — เชื่อมภายนอก (ตัดสินใจก่อนทำ)',
        duration: 'ปีถัดไป',
        goal: 'ขยายเฉพาะเมื่อมีความต้องการจริง — ไม่ทำ SIS/e-Donation ล่วงหน้า',
        badge: 'bg-violet-700',
        items: [
            { icon: '🧾', title: 'e-Donation API', effort: 'deferred', stack: 'กรมสรรพากร' },
            { icon: '🏫', title: 'ตัดสินใจ SIS vs DMC-only', effort: 'deferred', stack: 'รอสเปก MoE' },
            { icon: '🌐', title: 'i18n ครบ + newsletter/calendar', effort: 'optional', stack: 'ถ้ายังต้องการ' },
        ],
    },
];

const mediaRoadmap = {
    baseline:
        'Phase 16 โค้ดพร้อม (KPI ครูอัป · packs ในคลัง · มอบหมายบ้าน+แนบไฟล์ · coverage RPC ≈100% ตัวชี้วัดใช้งาน) — เหลือ ops: ครู non-admin อัปจริง + รีวิว soft-gap',
    target:
        'เป้าปิด Phase 16: หลักฐานครู non-admin ≥1 อัปใน 30 วัน · packs เป็นหน่วยสอนประจำ · soft-gap รีวิวต่อเนื่อง · parent ส่งงานจากชุดเรียนเป็นกิจวัตร',
    phases: [
        {
            phase: 'Phase 11 — เติมวิชาบาง (+10 คู่)',
            duration: 'เดือน 1–2',
            status: 'done',
            badge: 'bg-emerald-600',
            goal: 'ปิดวิชาที่สื่อน้อยที่สุด: ศิลปะ +3 · การงาน +3 · เทคโนโลยี +2 · สังคม +2',
            items: [
                'ศิลปะ: ทัศนธาตุ · จังหวะ-ดนตรี · นาฏศิลป์พื้นฐาน',
                'การงาน: งานบ้าน-งานประดิษฐ์ · การเกษตร · อาหาร-โภชนาการ',
                'เทคโนโลยี: อัลกอริทึม unplugged · ข้อมูล-การนำเสนอ',
                'สังคม: ภูมิศาสตร์ไทย · หน้าที่พลเมือง ป.ต้น',
                'ทุกคู่: สื่อ learn+practice + ใบงาน scaffold + ปก PNG + ตัวชี้วัด + migration 432',
            ],
        },
        {
            phase: 'Phase 12 — ป.ต้น daily-use (+10 คู่)',
            duration: 'เดือน 3–4',
            status: 'done',
            badge: 'bg-emerald-600',
            goal: 'สื่อ ป.1–2 ใช้สอนได้ทุกวัน + grade coverage matrix ใน audit script',
            items: [
                'ไทย: ประสมคำ · อ่านคล่อง-เขียนคล่อง · คำพื้นฐาน',
                'คณิต: จำนวน 1–100 · บวกลบไม่เกิน 100 · รูปทรงพื้นฐาน',
                'อังกฤษ: Sight words daily · ABC-phonics',
                'วิทย์ ป.1–2: สิ่งมีชีวิต-ไม่มีชีวิต · วัสดุรอบตัว',
                'ใบงาน ป.ต้น: ตัวใหญ่ รอยประ ลากเส้น · migration 433',
            ],
        },
        {
            phase: 'Phase 13 — ป.6 + ระบบตัวชี้วัด (+8 คู่)',
            duration: 'เดือน 5–7',
            status: 'done',
            badge: 'bg-emerald-600',
            goal: 'เติม ป.6 + ผูกตัวชี้วัดสื่อ+เกม ≥80% + publish checklist',
            items: [
                'ป.6: ร้อยละ · สมการ · วรรณคดี · ไฟฟ้า · ระบบร่างกาย · tense · เศรษฐศาสตร์',
                'Seed indicator_games ให้สื่อเก่า → ≥80%',
                'Coverage สื่อแยกจากเกมใน IndicatorCoverageDialog',
                'Publish checklist หลังบ้าน',
            ],
        },
        {
            phase: 'Phase 14 — แนะนำสื่อ + ครูอัปโหลดเอง',
            duration: 'เดือน 8–10',
            status: 'done',
            badge: 'bg-emerald-600',
            goal: 'นักเรียนเห็นสื่อแนะนำใน /my + ครู non-admin สร้างสื่อเองได้',
            items: [
                'สื่อแนะนำใน /my จากตัวชี้วัดที่คะแนนเกมต่ำ',
                'ปุ่มดูสื่อก่อนเล่นบนการ์ดเกม',
                'ครู non-admin อัปโหลดสื่อ/ใบงาน (RLS ทดสอบจริง)',
                'W8 คู่มือครูใช้สื่อ',
            ],
        },
        {
            phase: 'Phase 15 — lesson packs + polish',
            duration: 'เดือน 11–12',
            status: 'done',
            badge: 'bg-emerald-600',
            goal: 'lesson_packs 15 → ≥30 + เก็บตกคุณภาพทั้งคลัง',
            items: [
                'ทุกคู่ใหม่จาก Phase 11–13 มี lesson pack',
                'หน้าใบงานบ้าน parent กรองตามชั้นลูก',
                'ปก PNG ครบ + ล้าง extras ใน production catalog',
                'อัปเดต แผนพัฒนาคลังสื่อ.md ล้างรายการ stale',
            ],
        },
        {
            phase: 'Phase 16 — habit + pack surface',
            duration: 'ต่อเนื่อง (ops)',
            status: 'now',
            badge: 'bg-amber-600',
            goal: 'โค้ดพร้อมแล้ว — ปิดด้วยหลักฐานครูใช้จริง + คุณภาพ soft-gap',
            items: [
                '✅ KPI ครู non-admin อัป 30 วัน + แถบสถิติใน /teacher/edu-hub',
                '✅ ชุดเรียนบน /educational-hub และหน้าครู (สื่อ → พิมพ์ → เกม)',
                '✅ มอบหมายใบงาน + parent ส่งงานแนบไฟล์ (mig 450) + ความเห็นครู',
                '✅ coverage RPC ≈100% ตัวชี้วัดใช้งาน + soft-gap filter (mig 447–449)',
                '⏳ ops: ครู non-admin อัปจริง ≥1 · รีวิว soft-gap รายวิชา · ลูป pack เป็นกิจวัตร',
            ],
        },
    ],
};

const versionHistory = [
    {
        version: 'v1.229.1 (vocab-hub — fruits แสดงคำอ่านภาษาไทย)',
        date: '31 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'แสดงป้าย “คำอ่าน: …” ใต้คำอังกฤษบนการ์ดหลักของหมวด fruits โดยไม่ขึ้นกับโหมดเสียง',
            'เพิ่มคำอ่านภาษาไทยในการ์ดคำทุกใบในกริด เพื่อให้เด็กเห็นคำอังกฤษ คำอ่าน และภาพพร้อมกัน',
            'เพิ่ม data verifier ป้องกัน UI คำอ่าน fruits หายในการแก้ไขครั้งถัดไป และอัปเดต game_docs เป็น v2.4.1',
        ],
    },
    {
        version: 'v1.229.0 (vocab-hub — คลังศัพท์ 839 คำ)',
        date: '31 ส.ค. 2569',
        badge: 'bg-blue-600',
        items: [
            'ขยาย 23 หมวดเป็นหมวดละ 30 คำ เพิ่มคำศัพท์ ป.4–6 จำนวน 467 คำ รวมทั้งระบบ 839 คำ',
            'เพิ่มตัวกรอง พื้นฐาน / ทั้งหมด จำค่าต่อเครื่อง พร้อมคำนวณจำนวนและ progress จากข้อมูลจริง',
            'แยกคำต่อยอดไว้ใน vocab-hub-data.js และเพิ่มตัวตรวจ 28 หมวด ฟิลด์บังคับ คำซ้ำ และ phonics ของ fruits',
            'ปรับโหมดรูปภาพให้ใช้เฉพาะคำที่มี visual โดยไม่ตัดโหมดอื่นเมื่อคลังคำมีรายการที่ไม่มี emoji',
        ],
    },
    {
        version: 'v1.228.3 (vocab-hub — fruits ฝึกผสมเสียง)',
        date: '31 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มตัวช่วยฝึก phonics ใน fruits เมื่อเลือกโหมดเสียง ไทย หรือ EN+ไทย โดยแบ่งคำเป็นช่วงเสียง เช่น `ap + ple → apple`',
            'กดฟังแต่ละช่วงเสียงได้เอง เพื่อให้เด็กค่อย ๆ ผสมเสียงไปหาคำเต็ม โดยไม่เปิดเสียงอัตโนมัติ',
        ],
    },
    {
        version: 'v1.228.2 (vocab-hub — ป้ายโหมดเสียง fruits)',
        date: '31 ส.ค. 2569',
        badge: 'bg-cyan-600',
        items: [
            'เพิ่มป้ายสถานะโหมดเสียงข้างปุ่มอ่านใน fruits เพื่อให้เห็น EN / ไทย / EN+ไทย ชัดขึ้นทันที',
            'คงค่าเริ่มต้นแบบไม่อ่านอัตโนมัติ และยังจำโหมดเสียงรายหมวดใน localStorage ต่อ topic ตามเดิม',
        ],
    },
    {
        version: 'v1.228.1 (vocab-hub — ปิดอ่านอัตโนมัติ + fruits อ่านไทย)',
        date: '31 ส.ค. 2569',
        badge: 'bg-sky-600',
        items: [
            'vocab-hub: ตัดเสียงอ่านอัตโนมัติจากการเปิดการ์ด/เปลี่ยนคำ ให้เหลือเฉพาะการกดอ่านโดยผู้ใช้หรือโหมดที่ตั้งใจ',
            'เพิ่มโหมดเสียงแยกตามหมวด โดย `fruits` สลับได้ EN / ไทย / EN+ไทย และจำค่าต่อหมวดใน localStorage',
            'Thai Vocab Hub: ลดค่าเริ่มต้น autoplay read mode เป็นคำศัพท์ และตั้งค่าเริ่มต้นให้เลือกเองก่อนอ่านยาว',
        ],
    },
    {
        version: 'v1.228.0 (แข่งขันใบงานสด ป.4 คณิตศาสตร์)',
        date: '28 ส.ค. 2569',
        badge: 'bg-amber-600',
        items: [
            'เพิ่มห้องแข่งขัน 3 เครื่อง: ครูเป็น Host และเครื่องทีม 2 เครื่อง พร้อมสุ่ม/สลับสมาชิก อนุมัติเครื่อง เวลา และคะแนนสด',
            'เพิ่ม seeded provider คณิตศาสตร์ 4 ชุดและโหมดผสม พร้อม operation-tree validator ของเกม 24 และสิทธิ์ตอบ 2 ครั้งต่อข้อ',
            'เพิ่มผล 3/1 ประวัติทีม สถิติรายบุคคล RLS, capability token แบบ SHA-256, Edge Functions และ transactional attempt RPC',
        ],
    },
    {
        version: 'v1.227.6 (System Overview — production snapshot และสถานะระบบ)',
        date: '28 ส.ค. 2569',
        badge: 'bg-indigo-700',
        items: [
            'รวม metadata เวอร์ชันและฐานข้อมูลไว้จุดเดียว พร้อม snapshot production 165 ตาราง 16 views และ RLS ครบ 165 ตาราง',
            'แยกจำนวน migration ที่ใช้จริงบน production ออกจากไฟล์ migration ที่ติดตามใน Git และระบุวันที่ตรวจล่าสุด',
            'เพิ่ม error/retry state ให้ Phase 16 KPI และปรับหน้า System Overview ไม่ให้ล้นจอบนมือถือ',
        ],
    },
    {
        version: 'v1.227.5 (คลังสื่อ — ค้นหาเมื่อยืนยัน)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'แยกข้อความที่กำลังพิมพ์ออกจากคำค้นที่ใช้ดึงข้อมูล ป้องกันรายการและ network request เปลี่ยนก่อนพิมพ์เสร็จ',
            'เพิ่มปุ่มค้นหาและรองรับ Enter พร้อมป้องกันการส่งระหว่างพิมพ์ภาษาไทยด้วย IME composition',
            'ปุ่มล้างคืนรายการทั้งหมดทันที และปิดการค้นหาซ้ำเมื่อคำค้นเดิมหรือกำลังโหลด',
        ],
    },
    {
        version: 'v1.227.4 (ใบงานจำนวนคละสองทิศทาง — 8 ข้อฟอนต์ใหญ่)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ปรับใบงานแปลงเศษเกินจาก 10 เป็น 8 ข้อต่อหน้าแบบ 2×4 เพื่อเพิ่มขนาดฟอนต์และพื้นที่เขียน พร้อมคงโหมด 5 ข้อที่มีภาพประกอบ',
            'เพิ่มโหมดจำนวนคละ→เศษเกินและชุดผสมสองทิศทาง โดยซ่อนผลคูณ ผลบวก และตัวส่วนไว้ในช่องเฉลยจนกว่าครูจะเปิด',
            'บันทึก direction ใน saved set ป้องกันโจทย์ค่าหรือคู่กลับซ้ำข้ามหน้า และรองรับชุดเก่า count=10 ด้วยการปรับเป็น 8 อัตโนมัติ',
        ],
    },
    {
        version: 'v1.227.3 (ใบงานแปลงเศษเกิน — ซ่อนค่าคำนวณและขยายพื้นที่เขียน)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ซ่อนผลหาร ผลคูณ เศษ ตัวหารที่ใช้ย่อ และเศษส่วนอย่างต่ำในช่องเติม แก้กรณี 70/18 ที่ข้อความตรวจสอบเคยเปิดคำตอบ 18×3=54 ล่วงหน้า',
            'จัดขั้น ①–③ เป็นแถวความสูงคงที่และเพิ่มระยะห่าง เพื่อให้นักเรียนเขียนมือได้สะดวกโดยตำแหน่งไม่ขยับระหว่างหน้าจอกับ A4',
            'ย้ายคำตอบจำนวนคละมาอยู่ถัดจากคำว่า “ตอบ” ด้วยระยะคงที่ ไม่ดัน 3 16/18 = 3 8/9 ไปชิดขอบขวา',
        ],
    },
    {
        version: 'v1.227.2 (ใบงานแปลงเศษเกินเป็นจำนวนคละ ป.4–ป.5 A4 3 หน้า 10 ข้อ)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'สร้างใบงานพิมพ์ A4 แปลงเศษเกินเป็นจำนวนคละ (improper-to-mixed-worksheet.html) จัดหน้าพอดี A4 210×297mm ไม่ล้นขอบ',
            'ค่าเริ่มต้น 3 หน้า หน้าละ 10 ข้อ (2 คอลัมน์ x 5 แถว) รวม 30 ข้อไม่ซ้ำกัน พร้อมโหมด 5 ข้อที่มีภาพแท่งเศษส่วน inline SVG',
            'ระบบแสดงวิธีทำ 3 ขั้น: ตั้งหารตัวเศษด้วยตัวส่วน, ตรวจสอบเหตุผล, ตอบจำนวนคละรูปอย่างต่ำ พร้อมระบบเฉลยทีละข้อ (◀/▶) และบันทึกชุด ?set=',
        ],
    },
    {
        version: 'v1.227.1 (ใบงานเศษส่วน — แปลงเศษเกินเป็นจำนวนคละ)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มหัวข้อฝึกแปลงเศษเกินเป็นจำนวนคละ 6 ข้อต่อหน้า พร้อมภาพแท่งเศษส่วนและ scaffold หารตัวเศษด้วยตัวส่วนทีละขั้น',
            'แยกระดับง่าย มาตรฐาน และท้าทาย โดยทุกโจทย์มีเศษเหลือจริง เฉลยทุกช่อง และย่อส่วนเศษก่อนสรุปจำนวนคละรูปแบบ 1 2/3',
            'เชื่อม CTA จากสื่อจำนวนคละเข้าหัวข้อใหม่โดยตรง พร้อม validator สมการย้อนกลับ ความเป็นเศษส่วนอย่างต่ำ และความไม่ซ้ำข้ามหน้า',
        ],
    },
    {
        version: 'v1.227.0 (สื่อจำนวนคละ ป.4–ป.5 — ภาพและวิธีคิดทีละขั้น)',
        date: '27 ส.ค. 2569',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มสื่อ standalone จำนวนคละ 6 บท: ความหมาย ภาพจำนวนเต็มกับส่วนที่เหลือ การแปลงเศษเกิน การเปรียบเทียบ บวก–ลบ และตรวจด้วยเส้นจำนวน',
            'รองรับ ป.4–ป.5 โหมดสอนเปิดทีละขั้น ฝึกสั้น 5 ข้อ deterministic seed, keyboard, fullscreen และ CTA ไปใบงานคลังเศษส่วน',
            'ลงทะเบียน catalog พร้อมปก 16:9, ตัวชี้วัด ค 1.1 ป.4/3,/4,/13,/14 และ ป.5/3 รวมถึง game_docs และ validator คณิตศาสตร์เฉพาะสื่อ',
        ],
    },
    {
        version: 'v1.226.5 (ใบงานเศษส่วน — วิธีทำบวก–ลบแบบทีละขั้น)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่ม scaffold บวก–ลบเศษส่วนแบบลำดับ ①–④ ตั้งแต่รวมตัวเศษ คงตัวส่วน เขียนผลลัพธ์ ย่อด้วยตัวหารร่วม และแปลงเศษเกินเป็นจำนวนคละ',
            'ทุกค่าระหว่างทำมีช่องเฉลยของตนเอง เช่น 8/6 ÷ ด้วย 2 = 4/3 และ 4 ÷ 3 = 1 เศษ 1 ก่อนสรุปคำตอบ 1 1/3',
            'เพิ่มตัวตรวจจำนวนช่อง ขั้นย่อ และขั้นแปลงจำนวนคละให้ตรงกับผลลัพธ์จริงของทุกโจทย์ในคลัง',
        ],
    },
    {
        version: 'v1.226.4 (ใบงานเศษส่วน — จำนวนคละเป็นกลุ่มเดียวและขั้นตอนตรงความหมาย)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'จัดคำตอบจำนวนคละเป็นกลุ่มเดียวแบบ 1 2/3 โดยเว้นระยะคงที่ระหว่างจำนวนเต็มกับเศษส่วนซ้อนเส้น ป้องกันการอ่านสับสนเป็นเศษเกิน',
            'เปลี่ยนคำอธิบายผลลัพธ์ระหว่างทำตามค่าจริงเป็น “ก่อนแปลงเป็นจำนวนคละ”, “ก่อนแปลงเป็นจำนวนเต็ม”, “ก่อนย่อ” หรือ “รวมได้”',
            'เพิ่มตัวตรวจโครงสร้างจำนวนคละและข้อความขั้นกลาง เพื่อป้องกันการถอยกลับของรูปแบบเฉลย',
        ],
    },
    {
        version: 'v1.226.3 (ใบงานเศษส่วน — เฉลยครบและอ่านจำนวนคละชัดเจน)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เปลี่ยนการแสดงเศษส่วนเป็นตัวเศษซ้อนเส้นตัวส่วน และแยกจำนวนเต็มออกจากเศษส่วนในจำนวนคละให้อ่านไม่สับสนกับเศษเกิน',
            'เติมเฉลยให้ทุกช่องระหว่างทำ ได้แก่ ตัวเศษ ตัวส่วน ค่าก่อนย่อ ส่วนจำนวนเต็ม ส่วนเศษ และการทดหรือยืม โดยไม่เปลี่ยนขนาดใบงาน',
            'ตัดตัวตั้งบวกแบบ d/d ออกจากคลัง เพื่อให้โจทย์เศษส่วนตัวส่วนเท่ากันเป็นธรรมชาติสำหรับนักเรียน ป.4',
        ],
    },
    {
        version: 'v1.226.2 (ใบงานคลังเศษส่วน ป.4 — ระบายภาพและเติมคำตอบ)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'อัปเกรดใบงานคู่ math-fraction-hub ให้ครบ 8 กิจกรรม: ระบาย อ่านภาพ เปรียบเทียบ บวกลบ จำนวนเต็มกับเศษส่วน และจำนวนคละ',
            'เพิ่มแท่งเศษส่วน SVG ที่แบ่งช่องเท่ากันจริง พร้อมเฉลยลาย hatch สำหรับงานพิมพ์ขาวดำ และปรับอัตโนมัติเป็น 6 ข้อภาพใหญ่หรือ 8 ข้อคำนวณ',
            'เพิ่มระดับตัวส่วน 2–5, 2–8 และ 2–12 พร้อม validator ตรวจคำตอบ ภาพ และความไม่ซ้ำข้ามหน้า 300 seed',
        ],
    },
    {
        version: 'v1.226.1 (ระบบเสียงยืนยันธุรกรรมส่วนกลาง)',
        date: '27 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'รวมเสียงธนาคารพอเพียง ธนาคารขยะ คะแนนความดี และแลกรางวัลไว้ในคิว FIFO ส่วนกลาง พร้อมเก็บ utterance จนอ่านจบ',
            'เพิ่มคำอ่านจำนวนเต็มภาษาไทยระดับหลักล้าน และแบ่งข้อความยืนยันเป็นช่วงสั้นเพื่อป้องกัน Chromium ตัดเสียงกลางประโยค',
            'หน้าต่างยืนยันรอเสียงจบก่อนปิด รองรับรายการเพิ่ม/หัก และแก้ยอดคะแนนความดีคงเหลือจากประวัติจริง',
        ],
    },
    {
        version: 'v1.226.0 (ชุดใบงานเติมคำและระบายสี 4 วิชา)',
        date: '24 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มสื่อสรุปความรู้และฝึกสั้น 4 หน่วย: แรงและการเคลื่อนที่, ทิศและแผนที่, Weather and Seasons และคำพ้องเสียง',
            'เพิ่มใบงาน A4 หน่วยละ 3 หน้า ประกอบด้วยใบสรุปสี ใบเติมคำ/ระบายสี และใบประยุกต์ พร้อมเฉลยทีละข้อและระบบบันทึกชุด',
            'เพิ่มเอนจิน color-fill กลางสำหรับภาพ SVG ต้นฉบับ การพิมพ์ และพื้นที่เขียนที่ใช้ร่วมกันทุกวิชา',
        ],
    },
    {
        version: 'v1.225.1 (ธนาคารขยะ — รางวัลสำหรับนักเรียน)',
        date: '20 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มหัวข้อรางวัลสำหรับนักเรียนในหน้าผลการดำเนินงานธนาคารขยะ พร้อมภาพ จำนวนคงเหลือ และแต้มที่ใช้แลก',
            'เชื่อมรายการกับคลังรางวัลเดิมผ่าน rewardsService ทำให้แก้ภาพหรือเปิด/ปิดรางวัลจากหลังบ้านแล้วหน้าผลการดำเนินงานอัปเดตตามอัตโนมัติ',
        ],
    },
    {
        version: 'v1.225.0 (ธนาคารขยะ — หน้าผลการดำเนินงานสาธารณะ)',
        date: '20 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มหน้า /waste-bank/results สำหรับนำเสนอ KPI กระบวนการ กราฟ นักเรียน Top 10 ภาพกิจกรรมจริง และ QR Code โดยไม่ต้องเข้าสู่ระบบ',
            'เพิ่มแท็บหลังบ้านให้แอดมินแก้ข้อความ อัปโหลดหลายภาพ แยกหมวด จัดลำดับ และควบคุมสถานะร่าง/เผยแพร่',
            'เพิ่ม aggregate RPC แบบจำกัดข้อมูล ตารางรายงาน/แกลเลอรี่ private storage และ RLS ที่เปิดเฉพาะข้อมูลภาคเรียนปัจจุบันต่อสาธารณะ',
        ],
    },
    {
        version: 'v1.224.0 (สื่อและใบงาน — Evidence-backed Preference Learning)',
        date: '20 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'แยกโปรไฟล์ความชอบสื่อการสอนและใบงาน โดยให้กฎความถูกต้อง หลักสูตร และ repository contract มีอำนาจสูงกว่า preference เสมอ',
            'เพิ่มหลักฐานแบบ append-only: ครั้งแรกเป็น candidate ครั้งที่สองจากงานอิสระเป็น proposal และต้องได้รับอนุมัติก่อนเลื่อนเป็นกฎถาวร',
            'เพิ่มคำสั่ง compare:learning-artifact สำหรับภาพก่อน–หลัง visual diff, metrics และ checksum ที่ viewport สื่อ 3 ขนาดหรือ A4 screen/print',
        ],
    },
    {
        version: 'v1.223.0 (Game Dev Quality Gate — Generator, Playwright และ CI)',
        date: '19 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ยกระดับทักษะ kampai-game-dev เป็น workflow Discover → Design → Scaffold → Implement → Verify → Document → Ship พร้อม quality contract แยกตามเกมมาตรฐาน, versus, orientation และ AR',
            'เพิ่ม create:game generator, static verifier แบบ strict/JSON, Playwright browser gate 3 viewport/2 รอบ, regression tooling และ GitHub Actions artifacts สำหรับเกมที่เปลี่ยน',
            'อัปเดต templates ให้ restart โดยไม่ reload, เรียก beginRound ทุกครั้ง, มี browser hooks, reduced-motion/focus-visible และปรับปุ่มเสียง KAMPAI SDK เป็นขั้นต่ำ 44×44px',
        ],
    },
    {
        version: 'v1.222.0 (สื่อการสอน — 🪐 ระบบสุริยะ 3 มิติ Solar System 3D Lab & Dual-Track Worksheet)',
        date: '19 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มสื่อการสอนวิทยาศาสตร์และดาราศาสตร์ 3 มิติ (ว 3.1 ป.4–ป.6) ภายใต้ public/games/science/solar-system-3d-media.html พร้อมปก 16:9 1280×720 และผ่าน verify:media ครบถ้วน',
            'โหมดสำรวจ 3D: Three.js OrbitControls, ปรับความเร็วกาลเวลา, ผ่าดูโครงสร้างภายในดาวเคราะห์ (Cross-Section Slicer), เรียงแถวเปรียบเทียบขนาด (Scale Alignment), ข้างขึ้น-ข้างแรม 8 เฟส, คำนวณการเดินทางความเร็วแสง (Speed of Light Trip) และสารานุกรมอวกาศ 3 มิติพร้อมเสียงอ่านภาษาไทย (TTS)',
            'โหมดภารกิจควิซ 3D (Practice Mode): คำถาม 9 ข้อตามตัวชี้วัดหลักสูตรแกนกลาง รองรับการคลิกเลือกดาว 3 มิติในอวกาศและปุ่มตัวเลือก พร้อมเฉลยละเอียดและเสียงเอฟเฟกต์ตอบรับ',
            'สร้างใบงานพิมพ์คู่สื่อ Dual-track: solar-system-3d-worksheet.html รองรับโหมดฝึก 5/8/10 ข้อ, สุ่มโจทย์ 4 ทักษะ, scaffold แสดงวิธีคิด, เฉลยครู และผ่าน verify:worksheet 16/16 Checks',
        ],
    },
    {
        version: 'v1.221.0 (วิทยาศาสตร์ — Maglev Rush รถไฟแม่เหล็กความเร็วสูง)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'สร้างเกมโฟลเดอร์ 5 ไฟล์ Maglev Rush (วิทยาศาสตร์ ป.1-6 เรื่องแรงและแม่เหล็ก ว 2.2) พร้อมระบบเรนเดอร์ 2.5D Pseudo-3D Canvas 60fps',
            'ระบบสลับขั้วแม่เหล็ก N/S: ขั้วเหมือนกันผลักกันสร้างแรงผลักเทอร์โบ (180-480 km/h) และระบบฟิสิกส์ดูดเก็บสารแม่เหล็ก (เหล็ก, นิกเกิล, โคบอลต์)',
            'ระบบเบรกแม่เหล็กไฟฟ้า (Eddy Current Brake) พร้อมควิซชานชาลาสถานี, เชื่อมต่อ KampaiVersus ครบ 3 โหมด (เดี่ยว, 2 คนบนเครื่องเดียวกัน, ออนไลน์), ภาพปก 16:9 1280×720 และผ่าน verify:game 11/11 Checks',
        ],
    },
    {
        version: 'v1.220.9 (Educational Hub — ชุดเรียนพร้อมสอนเป็นหมวดปกติ)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ย้ายชุดเรียนพร้อมสอนจากหมวดสังเคราะห์ที่ล็อกไว้บนสุดเป็นแถวจริงใน educational_hub_categories ผ่าน migration 464',
            'แอดมินลากหรือกดลูกศรย้ายชุดเรียนพร้อมสอนไปตำแหน่งใดก็ได้ และบันทึก sort_order ร่วมกับหมวดอื่นแบบเดียวกัน',
            'คงการโหลดเนื้อหาชุดเรียนจาก lessonPacksService และผูกจำนวนรายการเข้ากับ id ของหมวดจริง โดยไม่ query รายการ Educational Hub ซ้ำ',
        ],
    },
    {
        version: 'v1.220.9 (ใบงานเกม 24 — สุ่มหลากหลายและหารลงตัว)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ขยายคลังเกม 24 เป็น 120 ชุด canonical ไม่ซ้ำ แบ่ง 4 หัวข้อหัวข้อละ 30 ข้อ และลดโจทย์ที่มีเลข 1 เหลือไม่เกิน 20% ต่อหน้า',
            'เพิ่มตัวเลือกโจทย์แบบมีโควตา: การหารลงตัว 1–2 ข้อในหน้า 5 ข้อ หรือ 2–3 ข้อในหน้า 10 ข้อ พร้อมไม่ซ้ำข้ามหน้า',
            'เพิ่ม solver และ validator ที่บังคับให้ทุกผลลัพธ์ระหว่างทางเป็นจำนวนเต็มบวก ใช้เลขครบ และปฏิเสธ operation เติมเงื่อนไข',
        ],
    },
    {
        version: 'v1.220.8 (Educational Hub — เมนูหมวดแบบ compact)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เปลี่ยนแถบชิปแนวนอนเป็นปุ่มเลือกหมวดแบบ compact และ dialog รายการแบบ responsive จึงไม่ต้องเลื่อนหรือลากเมาส์ยาวไปทางขวา',
            'แอดมินจัดลำดับใน dialog แนวตั้งด้วยการลากหรือปุ่มขึ้นลง โดยแก้ลำดับร่างก่อนกดบันทึก และล็อกชุดเรียนพร้อมสอนไว้บนสุด',
            'ตรวจจำนวนแถวที่อัปเดตและอ่านลำดับกลับจากเซิร์ฟเวอร์ก่อนแจ้งสำเร็จ เพื่อป้องกันลำดับดีดกลับเมื่อ RLS หรือการบันทึกไม่สำเร็จ',
        ],
    },
    {
        version: 'v1.220.7 (ใบงานหารยาว — กระจายแถวเต็มพื้นที่เขียน)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'เปลี่ยนพื้นที่ทำหารยาวเป็น grid ยืดเต็มการ์ด และแบ่งความสูงเท่า ๆ กันตามจำนวนแถวคำนวณจริงของแต่ละโจทย์',
            'เพิ่มระยะเขียนระหว่างผลคูณ เส้นลบ เศษ และเลขดึงลง โดยยังรักษาระยะขั้นต่ำสำหรับโจทย์ยาว 6 หลักไม่ให้ล้น A4',
            'คงจำนวน 8 ข้อสำหรับตัวตั้ง 2–3 หลัก และ 6 ข้อสำหรับตัวตั้ง 4–6 หลัก พร้อมตำแหน่งเฉลยเดิม',
        ],
    },
    {
        version: 'v1.220.6 (ใบงานหารยาว — พื้นที่เขียนตามจำนวนหลัก)',
        date: '18 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'ขยายระยะบรรทัดผลคูณ ผลลบ เศษ และเลขที่ดึงลง ให้เหมาะกับลายมือนักเรียนโดยคำนวณจากจำนวนขั้นหารจริง',
            'ปรับจำนวนข้ออัตโนมัติ: ตัวตั้ง 2–3 หลักใช้ 8 ข้อ ส่วนตัวตั้ง 4–6 หลักและโหมดผสมใช้ 6 ข้อต่อหน้าแบบ 2 × 3',
            'คง deterministic seed, saved set, teaching modes และเฉลยทีละข้อ โดยจำนวนข้อใน config และชื่อชุดตรงกับใบงานจริง',
        ],
    },
    {
        version: 'v1.220.5 (Sci-Lab Defender — AR วันวิทย์)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'สร้างและแก้ไขเกม AR วิทยาศาสตร์ "🧪 Sci-Lab Defender (AR วันวิทย์)" ผสาน 3 ฐานกิจกรรมวันวิทยาศาสตร์ (สสารและเคมี, แสงและพลังงาน, อวกาศและดาราศาสตร์ Fever Time)',
            'รองรับระบบตรวจจับมือ MediaPipe Hands (KampaiHands Engine) + One Euro Filter ปลายนิ้วแม่นยำ พร้อมระบบ Tap/Touch Fallback 100%',
            'เชื่อมต่อระบบคะแนน KAMPAI SDK, Leaderboard โรงเรียน, โหมด Versus ดวล 2 คน และภาพปก 16:9 1280×720 (migration 463)',
        ],
    },
    {
        version: 'v1.220.4 (ใบงานเศษส่วนแบบภาพ ป.4–5)',
        date: '17 ส.ค. 2569',
        badge: 'bg-emerald-600',
        items: [
            'อัปเกรด fraction-pieces-worksheet เป็นเครื่องมือสร้างใบงาน SVG แบบสุ่ม 10 ทักษะ: อ่าน/เขียน โยงคำ ระบายสี วาดรูป เปรียบเทียบ เศษส่วนเท่ากัน เส้นจำนวน จำนวนคละ คำนวณ และนักสืบเหตุผล',
            'แยกโจทย์ตามตัวชี้วัด ป.4–ป.5 รองรับ 1–10 หน้าและ 6/8 ข้อต่อหน้า พร้อม saved set, deterministic seed, เฉลยทีละข้อ และโหมดการสอนกลาง',
            'เพิ่ม migration 462 อัปเดต catalog/ตัวชี้วัด และตัวตรวจภาพว่าจำนวนส่วนเท่ากัน จำนวนที่ระบายตรงตัวเศษ และคลังมีอย่างน้อย 80 ข้อต่อหัวข้อ',
        ],
    },
    {
        version: 'v1.220.3 (แผนบูรณาการ — รายการตัวชี้วัดละเอียด)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'แตกหัวข้อหลักสูตร ป.4 เป็นหนึ่งรายการต่อตัวชี้วัด พร้อมย้ายสถานะ โน้ต และลิงก์หน่วยบูรณาการเดิมไปยังรายการลูก',
            'จัดรายการแบบ accordion สาระ → มาตรฐาน → ตัวชี้วัด และแยกหัวข้อส่วนตัวไว้ท้ายวิชา',
            'ไฮไลต์รายการที่สอนแล้วด้วยสีเขียวทั้งแถว และเพิ่มสรุปสอนแล้วแบบขยายดูรายวิชาด้านบน',
        ],
    },
    {
        version: 'v1.220.2 (แผนบูรณาการ — แก้ตั้งและตรวจ PIN บน Supabase)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'แก้ RPC ตั้ง/ตรวจ PIN ให้เรียก extensions.gen_salt และ extensions.crypt ตาม schema จริงของ hosted Supabase',
            'คง SECURITY DEFINER search_path แบบจำกัดไว้ที่ public และ qualify ฟังก์ชันเข้ารหัสโดยตรงเพื่อความปลอดภัย',
        ],
    },
    {
        version: 'v1.220.1 (แผนการสอนบูรณาการ ป.4 ส่วนตัว)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มหน้า /teacher/integrated-plan เป็น Do List ส่วนตัวครบ 8 กลุ่มสาระ สร้างหัวข้อจากมาตรฐานและตัวชี้วัดหลักสูตรแกนกลาง ป.4 ที่มีอยู่จริง',
            'ติดตามสถานะ ยังไม่สอน/กำลังสอน/สอนแล้ว พร้อมค้นหา กรอง สรุปความคืบหน้า เพิ่มหัวข้อส่วนตัว และสร้างหน่วยบูรณาการข้ามวิชา',
            'ทางเข้าลับจากการกดรูปเจ้าของคลังครู 5 ครั้ง ใช้บัญชีครู + PIN 6 หลักแบบ hash/lockout และ RLS แยกข้อมูลตาม owner_staff_id',
        ],
    },
    {
        version: 'v1.220.0 (ใบงานเกม 24 — สมการพื้นฐานและโจทย์ไม่ซ้ำ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับคลังใบงานเกม 24 เป็น 40 ชุดไม่ซ้ำ แบ่ง 4 ทักษะทักษะละ 10 ข้อ และใช้เลขทั้ง 4 ตัวครบในสมการพื้นฐาน',
            'ตัดโจทย์ที่เติมเลขด้วย ×1, หารเลขตัวเอง หรือ ±0 พร้อมจำกัดขั้นตอนระหว่างทางเป็นจำนวนเต็มบวก',
            'เพิ่มตัวตรวจอัตโนมัติสำหรับผลลัพธ์ 24 การใช้เลขครบ canonical key ไม่ซ้ำ และจำนวนโจทย์ต่อหัวข้อ พร้อมบันทึกกฎทั่วไปใน kampai-worksheet-builder skill',
        ],
    },
    {
        version: 'v1.219.9 (ธนาคารขยะและ Kampai Hero — เสียงแจ้งคะแนน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /admin/dashboard/waste-bank อ่านชื่อจริง คะแนนจากการฝากล่าสุด และคะแนนขยะสะสมหลังบันทึก พร้อมการ์ดยืนยันตัวเลขขนาดใหญ่กลางจอ',
            'หน้า /admin/dashboard/conduct อ่านชื่อจริง คะแนนความดีล่าสุด และคะแนนความดีสุทธิสะสมของปีการศึกษาที่เลือกหลังบวกคะแนนสำเร็จ',
            'ใช้เสียงไทยจากเบราว์เซอร์แบบ optional ยกเลิกเสียงเก่าก่อนอ่านรายการใหม่ และการ์ดปิดอัตโนมัติใน 5 วินาที; รายการหัก/ลบและบันทึกหลายคนคงพฤติกรรมเดิม',
        ],
    },
    {
        version: 'v1.219.8 (Rewards — แลกรางวัลด้วยแต้มขยะและคะแนนความดี)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'รางวัลกำหนดราคาได้ 3 แบบ: แต้มธนาคารขยะล้วน คะแนนความดีล้วน หรือจำนวนตายตัวจากทั้งสองกระเป๋า โดยรางวัลเดิมย้ายเป็นแต้มขยะล้วนแบบ backward compatible',
            'คะแนนความดีคงเหลือคำนวณจาก add ลบ deduct ของปีการศึกษาปัจจุบัน หักเฉพาะคำขอ pending/approved และคืนสิทธิ์อัตโนมัติเมื่อปฏิเสธโดยไม่ลบประวัติความดี',
            'หน้าตรวจยอด แลก เป้าหมาย ประวัติ QR และอนุมัติ แสดงยอดสะสม/คงเหลือและต้นทุนสองกระเป๋า พร้อม RPC lock นักเรียนและรางวัลเพื่อกันใช้คะแนนเกินยอดพร้อมกัน',
            'Security hardening: migration 458 revoke anon จาก can_approve/approve/reject RPC โดยคงเฉพาะ lookup/history/claim ที่เปิดสำหรับรหัสนักเรียน',
        ],
    },
    {
        version: 'v1.219.7 (Thai Vocab Hub — pilot ภาพคำราชาศัพท์)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มภาพประกอบสมจริง 25 คำในหมวดคำราชาศัพท์: ผู้เรียนเห็นคำและคำอ่านก่อน แล้วจึงกดเปิดภาพเพื่อเชื่อมความหมายอย่างเป็นรูปธรรม',
            'มีทั้งแท็บภาพประกอบและปุ่มดูภาพในบัตรคำ/กริด พร้อมปิดด้วย Esc และ fallback เมื่อภาพโหลดไม่สำเร็จ โดยไม่กระทบระบบคะแนน',
            'เพิ่ม image_url/image_alt ใน source, seed, export, lazy RPC และ validator รวมถึงรายงาน CSV สำหรับครูตรวจภาพ; migration 20260813052859 อัปเดต game_docs เป็น v2.2.0',
        ],
    },
    {
        version: 'v1.217.1 (Thai Vocab Hub — กรองคำศัพท์ให้ตรงหมวด)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'กักกันคำจากชุดขยาย ป.4 ที่ยืมข้ามหมวด 800 รายการ ทำให้ผู้เรียนเห็นเฉพาะ 2,400 คำที่ผ่านการตรวจหมวด',
            'เพิ่มสถานะ approved/quarantined, เหตุผลตรวจทาน, หลักฐานหมวด และเหตุผลคำซ้ำใน JSON, DB และ lazy RPC',
            'เพิ่ม validator เชิงโครงสร้างและรายงาน CSV สำหรับครูสุ่มตรวจ ก่อนเติมคำทดแทนให้กลับครบ 3,200 คำ',
            'migration 20260813031018 อัปเดต game_docs เป็น v2.1.0',
        ],
    },
    {
        version: 'v1.219.6 (ธนาคารพอเพียง — เสียงแจ้งยอดและการ์ดยืนยันฝากเงิน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /admin/dashboard/savings-bank อ่านเสียงภาษาไทยหลังฝากสำเร็จ โดยแจ้งเฉพาะชื่อจริง ยอดฝากล่าสุด และยอดเงินสะสม และไม่กระทบการบันทึกหากอุปกรณ์ไม่มีระบบเสียง',
            'เพิ่มการ์ดยืนยันกลางจอพร้อมรูปและชื่อนักเรียน แสดงยอดฝากล่าสุดกับยอดสะสมเป็นตัวเลขขนาดใหญ่ ปิดอัตโนมัติใน 5 วินาที และรองรับโหมดสแกนต่อเนื่องโดยไม่เปิดหน้าต่างซ้อนกัน',
        ],
    },
    {
        version: 'v1.219.5 (Educational Hub — แอดมินจัดลำดับชิปหมวดหมู่)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /h/:identifier เพิ่ม grip บนชิปหมวดหมู่สำหรับแอดมิน ลากซ้าย–ขวาเพื่อกำหนดหมวดที่แสดงก่อน–หลังได้โดยตรงจากแถบหมวด',
            'บันทึกลำดับใหม่ลง educational_hub_categories.sort_order ผ่าน educationalHubService และ invalidate cache ให้ลำดับใหม่มีผลทุกเครื่อง',
            'ผู้ใช้ทั่วไปไม่เห็นเครื่องมือจัดลำดับ และหมวดระบบชุดเรียนพร้อมสอนยังปักซ้ายสุดเพราะเป็นหมวดสังเคราะห์นอกตารางหมวดหมู่',
        ],
    },
    {
        version: 'v1.219.4 (Educational Hub — ย้ายข้อมูลนักเรียนขึ้น Hero)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'หน้า /h/:identifier ปรับ Hero เป็น responsive split layout: ข้อมูลครูอยู่ซ้าย และการ์ดสรุปนักเรียน GamificationHub ใช้พื้นที่ว่างด้านขวาบน desktop',
            'มือถือและแท็บเล็ตเรียงข้อมูลครูกับการ์ดนักเรียนแนวตั้งอัตโนมัติ โดยยังคง compact spacing และกรอบ max-w-7xl',
            'พาเนลอันดับ เหรียญ ภารกิจ และคู่หู render ผ่าน optional panelTargetId ไปใต้แถบหมวดหมู่ จึงเปิดรายละเอียดได้โดยไม่ทำให้ Hero สูงกระโดด',
        ],
    },
    {
        version: 'v1.219.3 (ปรับบรรทัด "ตอบ" ไปจัดวางทางฝั่งซ้าย ใต้ตำแหน่งตัวหาร พอดีเป๊ะ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/math/division-worksheet.html ปรับสไตล์บรรทัด .ans ("ตอบ _____") ให้จัดวางทางฝั่งซ้ายของช่องการ์ด (justify-content: flex-start)',
            'เข้ากับพื้นที่ว่างใต้ตัวหารฝั่งซ้ายของโครงสร้างตั้งหารยาวพอดี ไม่ทับซ้อนกับขั้นตอนตั้งหารที่เฉียงลงทางฝั่งขวา 100%',
        ],
    },
    {
        version: 'v1.219.2 (ปรับย้ายบรรทัด "ตอบ" ชิดขวา และปรับระยะบรรทัดหารยาว ป้องกันข้อความซ้อนทับกัน 100%)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/math/division-worksheet.html ปรับสไตล์บรรทัด .ans ("ตอบ _____") ให้ขยับไปจัดวางชิดขวาของช่องการ์ดใบงาน (justify-content: flex-end)',
            'ปรับคำนวณความสูงบรรทัดคำนวณตั้งหารยาว (rowHeight) ให้กระชับพอดีกับการ์ด ช่วยไม่ให้ตัวเลขลบลดหลั่นมาทับช่องเขียนตอบ 100%',
        ],
    },
    {
        version: 'v1.219.1 (เพิ่มเส้นขีดใต้ตัวเลขทุกบรรทัดในการตั้งหารยาว และเส้นคู่ใต้เศษสุดท้าย)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/math/division-worksheet.html เพิ่มเส้นขีดใต้ตัวเลขให้ครบถ้วนทุกบรรทัดวิธีคำนวณ (บรรทัดลบ .ld-product มีเส้นเดี่ยว, บรรทัดดึง/เศษย่อย .ld-partial มีเส้นขีดใต้, และบรรทัดเศษสุดท้าย .ld-final-remainder มีเส้นขีดใต้คู่ขนาน 2 เส้น)',
            'ตรงตามมาตรฐานรูปแบบการเขียนตั้งหารยาว สสวท. ช่วยให้นักเรียนเห็นตำแหน่งคำนวณชัดเจนและเป็นระเบียบสวยงาม',
        ],
    },
    {
        version: 'v1.219.0 (ยกระดับใบงานการหารยาว ป.6 ให้ตรงตามตัวชี้วัด ค 1.1 ป.6/1 และ ป.6/7 สมบูรณ์แบบ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/math/division-worksheet.html เพิ่มหัวข้อฝึกทักษะ ป.6 ตรงตามตัวชี้วัด สพฐ. 6 รูปแบบ (หารทศนิยมด้วยทศนิยม, หารทศนิยมด้วยจำนวนนับ, หารเศษส่วน/จำนวนคละ, หารยาวไม่เกิน 6 หลัก, โจทย์ปัญหาการหารระคน, และผสมทุกทักษะ ป.6)',
            'อัปเดตแท็กและป้ายตัวชี้วัดส่วนหัวใบงานเป็น ค 1.1 ป.6/1 และ ค 1.1 ป.6/7 ตรงตามหลักสูตรแกนกลางคณิตศาสตร์',
            'ปรับระบบสุ่มโจทย์แบบ Deterministic RNG รับประกันความถูกต้องตามโครงสร้างการตั้งหารจริง และไม่ซ้ำข้อในทุกชุดใบงาน',
        ],
    },
    {
        version: 'v1.218.9 (ปรับปรุงใบงานหาร 2 ในใจ เพิ่มระดับความยาก 1-6 หลัก และแก้บรรทัดตกหล่น)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/math/divide-by-2-worksheet.html เพิ่มตัวเลือกระดับความยาก 5 ระดับ (1 หลัก, 2 หลัก เช่น 48/60, 3 หลัก เช่น 150/160, 4–6 หลัก เช่น 1,200/48,000, และผสมทุกระดับ)',
            'แก้ปัญหาตัวหนังสือลอยและตกบรรทัด โดยปรับโครงสร้างแสดงผลเป็น 2 บรรทัดวิธีทำ (คิดแบ่งครึ่ง และ ตรวจคำตอบ) + 1 บรรทัดสรุปผล จัดวางตรงเส้นจุดประเป๊ะ 100%',
            'ขยายคลังโจทย์รวมเป็น 120+ ข้อ และใช้ระบบ selectAllPageItems รับประกันว่าจะไม่มีโจทย์ซ้ำกันเลยในใบงานแต่ละชุด (หน้า 1, 2, 3)',
        ],
    },
    {
        version: 'v1.218.8 (ปรับเฉลยบรรทัดสรุปเป็นสีแดง และขยายขนาดใหญ่เป็นพิเศษ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/worksheet-topic.css เปลี่ยนสีฟอนต์บรรทัดสรุปผลตอบ .answer-fill เป็นสีแดงเข้ม (#b42318) โทนเดียวกับขั้นวิธีทำ',
            'ขยายขนาดฟอนต์เฉลยบรรทัดสรุปเป็น 11.5pt (โหมด 10 ข้อ) และ 13.5pt (โหมด 5 ข้อ) ให้ใหญ่และโดดเด่นกว่าบรรทัดวิธีคิดอย่างชัดเจน',
        ],
    },
    {
        version: 'v1.218.7 (เพิ่มขนาดตัวอักษรเฉลยให้ใหญ่ คมชัด อ่านง่ายยิ่งขึ้น)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/worksheet-topic.css เพิ่มขนาดตัวอักษรเฉลย .work-fill เป็น 10.2pt และ .answer-fill เป็น 10.8pt (โหมด 5 ข้อขยายใหญ่เป็น 12.5pt)',
            'ปรับ font-weight เป็น 800 (Bold) พร้อมปรับความสูงบรรทัดเป็น 6.2mm ให้ตัวเลขเฉลยโดดเด่น อ่านง่ายชัดเจนจากระยะไกล',
            'เพิ่มสีพื้นหลังไฮไลต์เขียวอ่อนสดใส (#f0fdf4) ให้กับข้อที่กำลังเปิดเฉลย .q.reveal-current',
        ],
    },
    {
        version: 'v1.218.6 (แก้ไขปัญหาเฉลยซ้อนทับกันและการจัดวางช่องในใบงานเกม 24)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/worksheet-topic.css ปรับความสูงบรรทัดคำนวณ .calc-line เป็น 5.8mm และคุม overflow ให้กับ .q-work-block ป้องกันการเกยทับช่องสรุปคำตอบ',
            'อัปเดต renderQuestion ใน public/games/math/math-24-worksheet.html แสดง 2 บรรทัดวิธีทำขั้นที่ 1-2 และ 1 บรรทัดสรุปผลสมการสุดท้าย',
            'จัดระยะขอบ padding และความสูงบรรทัดใหม่ทั้งหมด ป้องกันตัวหนังสือเบียดหรือทับกันในโหมด 10 ข้อบน A4 คมชัดสวยงาม 100%',
        ],
    },
    {
        version: 'v1.218.5 (แก้ไขปัญหาการแสดงผลตัวเลขเฉลยเมื่อกดเปิดเฉลย)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/worksheet-topic.js ให้สลับคลาส show-answers บน document.body และ reveal-answer บนการ์ดคำถามแบบซิงก์กัน 100%',
            'อัปเดต public/games/worksheet-topic.css เพิ่มความสำคัญ CSS Specificity และ !important ให้กับ .work-fill, .answer-fill, .teacher-answer',
            'แก้ไขปัญหาตัวเลขเฉลยไม่เปลี่ยนสีเมื่อกดเฉลย ให้แสดงสีแดงเข้ม (#b42318) และสีเขียวเข้ม (#086c5c) คมชัดอ่านง่ายทุกเครื่อง',
        ],
    },
    {
        version: 'v1.218.4 (ปรับปรุงระบบสุ่มคำถาม ห้ามซ้ำคำถามกันในชุดใบงานเดียวกัน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุงระบบสุ่มเลือกโจทย์ selectAllPageItems ใน public/games/worksheet-topic.js ให้สุ่มจัดคิวคำถามจากคลังรวมแบบไม่ซ้ำ (Unique Sampling Across Pages)',
            'รับประกันว่าคำถามทุกข้อในใบงาน (หน้า 1, หน้า 2, หน้า 3) จะไม่มีข้อซ้ำกันเลยแม้แต่ข้อเดียว',
            'ขยายคลังโจทย์ใบงานเกม 24 (MATH24_ITEMS) เป็น 40 ชุดโจทย์จำนวนเต็ม ถัวเฉลี่ย 10 ข้อต่อทักษะ รองรับการพิมพ์ใบงาน 3 หน้าได้อย่างเต็มอิ่มไม่ซ้ำข้อ',
        ],
    },
    {
        version: 'v1.218.3 (ปรับโจทย์ใบงานเกม 24 เป็นรูปแบบมาตรฐาน หา 24 จาก A, B, C, D พร้อมเฉลยจำนวนเต็ม 100%)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง MATH24_ITEMS ใน public/games/math/math-24-worksheet.html เป็นรูปแบบมาตรฐาน หา 24 จาก [ตัวเลข 4 ตัว] ทุกข้อ',
            'ตรวจสอบเฉลยคำนวณทีละขั้น (step1, step2, step3) ทั้งหมด 25 ชุดโจทย์ เป็นการคำนวณจำนวนเต็มถ้วน (Integer Arithmetic) 100% ไม่มีทศนิยมหรือเศษส่วน',
            'รับประกันผลลัพธ์คำนวณได้ 24 และใช้เลขครบทั้ง 4 ตัวทุกข้อ สมบูรณ์สำหรับนักเรียน ป.4–6',
        ],
    },
    {
        version: 'v1.218.2 (เพิ่มฟีเจอร์เฉลยทีละข้อในใบงานหัวข้อทุกวิชา)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'อัปเดต public/games/worksheet-topic.js เพิ่มระบบควบคุมเฉลยทีละข้อ (Step-by-Step Answer Reveal Navigation)',
            'เพิ่มปุ่ม ◀ ข้อก่อน, ▶ เฉลยข้อถัดไป, ตัวนับสถานะ เฉลยข้อ X / N และปุ่ม 👁 ทั้งหมด บน Toolbar ใบงานหัวข้อทุกวิชา',
            'รองรับคีย์บอร์ดลัด ปุ่มลูกศรขวา (▶) / N สำหรับเปิดข้อถัดไป และปุ่มลูกศรซ้าย (◀) / B สำหรับซ่อนข้อล่าสุด พร้อมกรอบเน้นสีประจำข้อ .q.reveal-current',
        ],
    },
    {
        version: 'v1.218.1 (แก้ไขปัญหาใบงานหัวข้อ/เกม 24 แสดงผลล้นขอบขวา)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุง public/games/worksheet-topic.css แก้ไขระบบ Grid จาก 1fr 1fr เป็น repeat(2, minmax(0, 1fr)) ป้องกันเนื้อหาการ์ดดึงคอลัมน์เกิน 50%',
            'เพิ่ม min-width: 0, table-layout: fixed และ overflow-wrap ให้กับ .questions, .q, .mini-table, .answer-line ป้องกันการ์ดล้นขอบขวาบน A4',
            'แก้ปัญหาใบงานเกม 24 (math-24-worksheet.html) และใบงานหัวข้อทุกวิชาแสดงผลเต็มแผ่น A4 สมบูรณ์',
        ],
    },
    {
        version: 'v1.218.0 (เพิ่มฟีเจอร์สมุดบันทึกขั้นตอนสร้างเกมส่วนตัว ซิงก์ตรงลง Supabase Production DB)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'สร้าง Migration 249 เพิ่มตาราง c2_custom_game_plans บน Supabase Production DB (lkpqssbqxxpasidfqhpb)',
            'เพิ่มไฟล์ public/training/construct2-ban-khamphai/my-game-steps.html สมุดบันทึกขั้นตอนสร้างเกมส่วนตัว (Custom Step Planner UI)',
            'รองรับการพิมพ์ข้อความเอง เพิ่มแถว ลบแถว ติ๊กความสำเร็จ ลากสลับลำดับแถว (Drag & Drop) และพิมพ์ออก A4',
            'ระบบ Auto-Sync สองทาง Realtime กับ Supabase Production DB สลับเครื่องเล่นเปิดมาข้อมูลก็ยังอยู่ครบ',
            'เพิ่มปุ่มเมนู 📝 บันทึกขั้นตอนสร้างเกม ใน Toolbar หน้าแรก และ Guide Bar ของบทเรียนทุกหน้า',
        ],
    },
    {
        version: 'v1.217.0 (สร้างฟีเจอร์คลังคำศัพท์ Construct 2 พร้อมเสียงอ่านภาษาไทย & ตัวอย่างเหตุการณ์ใช้งาน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มไฟล์ public/training/construct2-ban-khamphai/glossary.html คลังคำศัพท์ C2 สมบูรณ์แบบ 50+ คำศัพท์',
            'พัฒนาคลังข้อมูล c2-glossary-data.js แบ่ง 5 หมวดหมู่ (IDE, Conditions, Actions, Behaviors, Variables) พร้อมระบุเหตุการณ์ที่ใช้ชัดเจน',
            'สร้างระบบเสียงอ่าน c2-speech.js (Speech Synthesis) รองรับปุ่ม 🔊 ฟังเสียงอธิบายภาษาไทย และ 🗣️ เสียงออกเสียงภาษาอังกฤษ',
            'เพิ่มปุ่มทางเข้า 📖 คลังคำศัพท์ C2 ใน Toolbar หน้าหลัก และ Guide Bar ในบทเรียนทุกหน้า',
        ],
    },
    {
        version: 'v1.217.0 (ใบงานการหารยาว — เลือกหลักตัวหารและตัวตั้งได้อิสระ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'อัปเดต public/games/math/division-worksheet.html เพิ่มตัวเลือกกำหนดหลักตัวหาร (1–2 หลัก) และตัวตั้ง (2–6 หลัก รวมถึงผสม 3–6 หลัก) เช่น 20 ÷ 269, 21 ÷ 2456 และ 35 ÷ 654321',
            'เพิ่มโหมดพรีเซ็ต ป.5–ป.6 (ตัวหารไม่เกิน 2 หลัก ÷ ตัวตั้งไม่เกิน 6 หลัก ผสม) และปรับขนาดกริดอัจฉริยะ (cellWidth & rowHeight) รองรับการตั้งหาร 6 หลักได้เต็มแผ่น A4 ไม่ล้นขอบ',
            'รองรับการเซฟ/โหลด config และ URL parameters ครบถ้วน พร้อมผ่านการออดิท pnpm verify:worksheet 14/14 checks',
        ],
    },
    {
        version: 'v1.216.0 (ภาพประกอบขั้นตอนแม่นยำ 100% — 619 ภาพไม่ซ้ำใน 59 บทเรียน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'สร้างภาพประกอบประจำขั้นตอน (Step-specific C2 Screenshots) ใหม่ทั้งหมด 301 ภาพ — แต่ละภาพแสดงหน้าต่าง C2 ที่แม่นยำตรงกับขั้นตอนนั้น (Layout View, Behaviors Dialog, Properties Panel, Event Sheet Group, Add Event Dialog, Sprite Editor, Preview Browser)',
            'ลบภาพ generic ซ้ำ (c2-behaviors.jpg, c2-event-sheet.jpg, c2-properties.jpg) ออกจากการ์ดทุกใบ — ป้องกันภาพกระจุกในบทเดียวกัน',
            'ตรวจสอบ 619 แท็ก <img> ใน 60 ไฟล์ HTML — Missing: 0 (100% pass)',
        ],
    },
    {
        version: 'v1.215.0 (เพิ่มภาพประกอบประจำขั้นตอนครบทุกการ์ด 451 ภาพใน 29 บทเรียน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มภาพประกอบประจำขั้นตอน (Step-by-step C2 UI Screenshots) ในทุกการ์ดของ 29 บทเรียน (451 แท็กภาพ 0 missing link)',
            'แสดงผลหน้าต่าง C2 IDE UI (Event Sheet Group, Properties Inspector, Dialog Boxes, Layout Viewport) แบบตรงตามโปรเจกต์ master_v32.capx',
            'ผ่านการออดิทความสมบูรณ์และทดสอบการสร้าง Vite bundle 100%',
        ],
    },
    {
        version: 'v1.214.2 (แก้ไขภาพไอคอน C2 และตรวจสอบลิงก์ภาพประกอบทุกบทเรียน 100%)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'สร้างภาพไอคอน Construct 2 Objects (Keyboard, System, Sprite, Text, Mouse, Audio) 32px HD PNG และ c2-properties.jpg',
            'ตรวจสอบลิงก์ <img> ทุกบทเรียนผ่านสคริปต์ออดิท (154 แท็กใน 60 ไฟล์ HTML) ไม่พบรูปเสียหรือขาดหายอีกต่อไป (Missing: 0)',
            'ปรับปรุง common.css เพิ่มสไตล์และระบบ fallback สำหรับไอคอน Event Sheet',
        ],
    },
    {
        version: 'v1.214.1 (ภาพประกอบและ Visual UI ของ Construct 2 จริงทุกบทเรียน)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มภาพประกอบหน้าจอซอฟต์แวร์จริงของ Construct 2 (Workspace UI, Event Sheet, Properties Panel, Behaviors Dialog) ทุกบทเรียน 29 บท',
            'ปรับปรุงระบบแสดงผลการ์ดใน common.css ด้วย UI Component (c2-eventsheet, c2-properties, c2-dialog, c2-window-mockup)',
            'เพิ่มคำอธิบายขั้นตอนเมาส์คลิก (คลิกซ้าย, ดับเบิลคลิก, คลิกขวา) และการตั้งค่าอย่างละเอียด',
        ],
    },
    {
        version: 'v1.214.0 (คู่มือ Construct 2 master_v32 — 29 บทเรียน 3 ระดับ)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'ผสานคู่มือ 2 เข้ากับคู่มือบ้านคำไผ่ ขยายเป็น 29 บทเรียน 3 ระดับ (พื้นฐาน B1-B6, ระบบหลัก 01-16, ขั้นสูง A1-A7)',
            'ปรับปรุง index.html เป็นระบบ 3 แท็บระดับ ค้นหา กรองแท็ก จัดลำดับบทเรียน และ visual learning path',
            'เพิ่มคำแนะนำ 📍 ที่ไหนใน C2 และ ⚠️ ข้อผิดพลาดที่พบบ่อย ในทุกบทเรียนอ้างอิง master_v32.capx',
        ],
    },
    {
        version: 'v1.213.0 (คู่มือ Construct 2 บ้านคำไผ่)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มคู่มือ Construct 2 แบบจับมือทำ 8 บท พร้อมภาพ Event Sheet ภาษาไทย',
            'เพิ่มเช็กลิสต์สร้างเกมแบบโต้ตอบและหน้า Training ใหม่ของครูณัฐพงศ์ โดยไม่ทับรายการเดิม',
        ],
    },
    {
        version: 'v1.212.5 (ใบงานทั้งคลัง — บันทึกชุด + เฉลยทีละข้อ)',
        date: 'ล่าสุด',
        badge: 'bg-indigo-600',
        items: [
            'ยกระดับใบงานอังกฤษ วิทยาศาสตร์ เทคโนโลยี ภาษาไทย และการคูณ ให้บันทึก โหลด และแชร์ชุดเดิมด้วย seed ได้',
            'เพิ่มเฉลยทีละข้อ ย้อนกลับ เปิดทั้งหมด และคีย์ลัด โดยคำตอบซ่อนเริ่มต้นและไม่เปลี่ยนเลย์เอาต์ A4',
            'บังคับ contract ฟีเจอร์ใหม่ในตัวตรวจใบงานทุกไฟล์ และแก้กฎหารยาวเป็น 8 ข้อแบบ 2×4',
            'ขยายตัวเลขเฉลยและระยะบรรทัดวิธีทำของกระดานหารยาว โดยยังคงพอดี A4',
        ],
    },
    {
        version: 'v1.212.4 (ใบงานหารยาว — ตัวหารชิดเส้น + ช่องวิธีทำอัตโนมัติ)',
        date: 'ล่าสุด',
        badge: 'bg-teal-600',
        items: [
            'ลดช่องตัวหารให้เลขอยู่ชิดเส้นตั้งหารตามรูปแบบการเขียนจริง',
            'ขยายแถวแสดงวิธีทำอัตโนมัติตามจำนวนขั้น โดยคง 8 ข้อและไม่ล้น A4',
        ],
    },
    {
        version: 'v1.212.3 (ใบงานหารยาว — พื้นที่เขียนด้วยมือ)',
        date: 'ล่าสุด',
        badge: 'bg-cyan-600',
        items: [
            'ขยายช่องค่าประจำหลักเป็น 16 มม. และช่องตอบเป็น 40 มม. สำหรับลายมือนักเรียน',
            'เพิ่มความสูงแถวคำนวณแบบปรับตามจำนวนหลัก พร้อมตรวจ A4 โจทย์ 4 หลักหลายชุด',
        ],
    },
    {
        version: 'v1.212.2 (ใบงานหารยาว — บันทึกชุด + เฉลยทีละข้อ)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'ใบงานหารยาว 8 ข้อแบบ 2×4 บันทึกและโหลดชุดเดิมด้วย seed ได้อีกครั้ง',
            'เพิ่มเฉลยทีละข้อ ◀/▶, เปิดทั้งหมด และคีย์ลัด โดยคงคำตอบซ่อนเป็นค่าเริ่มต้น',
        ],
    },
    {
        version: 'v1.212.1 (HEART infographic บนหน้าเกี่ยวกับเรา)',
        date: 'ล่าสุด',
        badge: 'bg-rose-600',
        items: [
            'แทรกอินโฟกราฟิก HEART Model (`/images/heart-model-infographic.png`) ในหน้า About ใต้หัวข้อนวัตกรรมการบริหาร',
            'รายงานลดภาระงานครูใช้ภาพ curated เดียวกัน (ไม่ทับด้วยภาพ PIL อัตโนมัติ)',
        ],
    },
    {
        version: 'v1.212.0 (HEART Model — แทน GPS บนหน้าเกี่ยวกับเรา)',
        date: '',
        badge: 'bg-rose-700',
        items: [
            'หน้า About: แทน GPS-Model ด้วย HEART Model (Hub · Ease · Activate · Relate · Track) จากสถาปัตยกรรมเว็บโรงเรียน',
            'อัปเดตคำอธิบาย PDCA ให้ขับเคลื่อน HEART เพื่อคืนเวลาครู — ลบเนื้อหา Good Governance / Participation / System Approach เดิม',
        ],
    },
    {
        version: 'v1.211.0 (Universal LPC Character Importer)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'คลังตัวละครหลังบ้าน: เปิด Universal LPC Generator และนำเข้า PNG + JSON + Credits แบบครบชุด',
            'ตรวจ Complete sheet 13×21+ · map เดิน 4 ทิศ/ฟัน/แทง/ร่ายเวท/บาดเจ็บอัตโนมัติ · รองรับเฟรม 64/128/192px',
            'Migration 455 เก็บ source JSON, license และเครดิต พร้อมส่งเครดิตไปยังเกมและแสดงก่อนเริ่มเล่น',
        ],
    },
    {
        version: 'v1.210.0 (Educational Hub progressive loading)',
        date: 'ล่าสุด',
        badge: 'bg-amber-600',
        items: [
            'ย้ายชุดเรียนพร้อมสอนไปอยู่ในคลังของผู้สร้าง และย่อหน้ารวมเหลือแถบสรุปที่ deep-link เข้าหมวดโดยตรง',
            'คลังครูแสดงทีละหมวดและโหลด 24 รายการต่อครั้ง พร้อมค้นหา/กรอง/เรียง/range ฝั่ง Supabase',
            'เลิก query leaderboard แยกทุกการ์ดเกมตอนเปิดหน้าแรก ลด request fan-out ในคลังขนาดใหญ่',
        ],
    },
    {
        version: 'v1.209.0 (BAYAO harden — คืนพัสดุ · กราฟ · DOCX/PDF · tour แอดมิน)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-700',
        items: [
            'พัสดุ: โฟลว์คืนของ (จ่ายแล้ว→ขอคืน→คืนแล้ว + เติมสต็อก) · แถบแจ้งเตือนสต็อกต่ำ (mig 453)',
            'Digital Ops: KPI % ครูใช้งานดิจิทัล · กราฟ Time/Paper (recharts) · ส่งออก MD/DOCX/PDF',
            'AdminOnboardingTour 6 สเต็ป (สารบรรณ→ลา→พัสดุ→Digital Ops→คลังสื่อ)',
        ],
    },
    {
        version: 'v1.209.0 (Road Blitz Arcade Racer Game)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มเกมใหม่: 🏎️ Road Blitz (Arcade Racing 8-Bit Famicom 2D Pixel Art) — ถนนซิ่งฉากกลางวัน/กลางคืน',
            'ระบบฟิสิกส์หลบรถคู่แข่ง + ถังน้ำมันเชื้อเพลิง (Fuel Anxiety Loop) + น้ำมันลื่นไถล',
            'บูรณาการ KAMPAI SDK, Versus Mode แข่ง 2 คน (Hot-seat / Online), migration 454 & seed script',
        ],
    },
    {
        version: 'v1.208.0 (BAYAO Smart Office — พัสดุ + Digital Ops)',
        date: 'ก่อนหน้า',
        badge: 'bg-emerald-700',
        items: [
            'ระบบพัสดุ/วัสดุพื้นฐาน: ทะเบียน · ครูขอเบิก · อนุมัติตัดสต็อก (mig 452) + /teacher/supplies',
            'Digital Ops ลดภาระครู: KPI PDCA · Time/Paper metrics · Role Model · Digital Clinic · ส่งออกรายงาน Markdown',
            'Onboarding tour ครู 5 สเต็ป + แบบสำรวจความพึงพอใจระบบดิจิทัล (auto-ensure)',
            'featureCatalog / Cmd+K / สิทธิ์เมนู supplies + digital-ops',
        ],
    },
    {
        version: 'v1.207.0 (Teacher ops UX + coverage deep link)',
        date: 'ก่อนหน้า',
        badge: 'bg-blue-600',
        items: [
            'Teacher Dashboard: การ์ดงานค้าง — ตรวจการบ้าน · อนุมัติรางวัล · เตือนอัปสื่อครั้งแรก',
            'Portal ครู/ผู้ปกครอง: ปุ่มค้นหา Ctrl/Cmd+K บน top bar (เทียบเท่า AdminLayout)',
            'Deep link Coverage: /admin/dashboard/educational-hub?tab=games&coverage=1 + Cmd+K "Coverage"',
            'อัปเดต roadmap: Cmd+K/fuzzy search ขึ้น production แล้ว',
        ],
    },
    {
        version: 'v1.206.0 (Phase 16 Ops dashboard)',
        date: 'ก่อนหน้า',
        badge: 'bg-amber-600',
        items: [
            'System Overview: แดชบอร์ด Phase 16 Ops — soft-gap RPC (mig 451) · ชุดเรียน · การบ้าน · รายชื่อครู non-admin อัป',
            'เช็กลิสต์ปิด Phase 16 แบบ live + ลิงก์ไปคลังสื่อ/ครูอัปสื่อ',
            'getNonAdminUploadHabit แนบชื่อ+รูปครูจาก staff',
        ],
    },
    {
        version: 'v1.205.0 (System Overview ข้อมูลปัจจุบัน)',
        date: 'ก่อนหน้า',
        badge: 'bg-indigo-700',
        items: [
            'รีเฟรช inventory: ตาราง 143 + views 16 · migration ล่าสุด 450 (จากตัวเลขเก่า 84 / 70+)',
            'dbGroups / roadmap / sprintPlan ให้ตรงของที่ ship แล้ว vs คิวถัดไป · Phase 16 ระบุโค้ดพร้อมเหลือ ops',
            'export MD/JSON + featureCatalog notes (coverage ≈100% โฟกัส soft-gap)',
        ],
    },
    {
        version: 'v1.204.0 (บทสรุปฟีเจอร์ทั้งระบบ + แผน 1–2 ปี)',
        date: 'ก่อนหน้า',
        badge: 'bg-indigo-700',
        items: [
            'System Overview: บทสรุปฟีเจอร์ 8 โดเมน (purpose · พัฒนาต่อได้ไหม · ไอเดีย 1–2 ปี) + ค้นหา',
            'แผนพัฒนาระยะยาว 1–2 ปี ในหลังบ้าน · export MD/JSON รวม catalog · SoT ที่ featureCatalog.ts',
        ],
    },
    {
        version: 'v1.203.0 (coverage quality UX + homework attach + portal i18n)',
        date: 'ก่อนหน้า',
        badge: 'bg-indigo-700',
        items: [
            'IndicatorCoverageDialog: กรอง soft-gap (ยังไม่มีเกม/สื่อ/ใบงาน) · BatchMapper รวมสื่อ+ใบงาน + เฉพาะยังไม่ map',
            'Parent ส่งงานแนบรูป/PDF (bucket assignment-attachments · mig 450) + push แจ้งครู · YouTube auto-thumb',
            'LanguageSwitcher ใน RolePortalLayout (ครู/ผู้ปกครอง) ตาม Rule 14.34',
        ],
    },
    {
        version: 'v1.202.1 (fix coverage KPI truncation + reverse map)',
        date: 'ล่าสุด',
        badge: 'bg-teal-700',
        items: [
            'แก้ KPI coverage ที่ PostgREST ตัดที่ 1000 แถว → RPC indicator_coverage_summary (mig 449)',
            'mig 448 reverse heuristic + สคริปต์เช็ก coverage แบบ paged — จริง ~100% ของตัวชี้วัด active',
        ],
    },
    {
        version: 'v1.202.0 (360 cont: coverage heuristic, receipt, fork, stock)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-700',
        items: [
            'mig 447: heuristic map สื่อ/ใบงานที่ยังไม่มีตัวชี้วัด → เร่ง coverage',
            'ใบเสร็จบริจาค Phase 2 เบา: ออกเลข KP-พ.ศ. + /donate/receipt/:id พิมพ์ได้',
            'Parent ชุดเรียนโชว์คะแนน/ความเห็นครู · ปุ่มทำสำเนาสื่อ · แถบสต็อกรางวัล drift',
        ],
    },
    {
        version: 'v1.201.0 (roadmap 360: chat attach, conference push, trust, packs↔plans)',
        date: 'ล่าสุด',
        badge: 'bg-violet-700',
        items: [
            'Chat แนบรูป/PDF (bucket chat-attachments · mig 446) + push นัดประชุมเมื่อจอง/ยกเลิก',
            'การบ้าน: การ์ดงานรอตรวจ · เข้าเรียน/คะแนน: เตือนข้อมูลไม่ครบก่อนปพ. · footer + /privacy PDPA',
            'แผนสอนผูก lesson pack · สตูดิโอเบาจากเทมเพลตสื่อ · HubUsageInsights ยอดเปิดดู · coverage กรองช่องว่าง',
        ],
    },
    {
        version: 'v1.200.0 (Phase 16 habit + lesson packs in hub)',
        date: 'ล่าสุด',
        badge: 'bg-amber-600',
        items: [
            'โชว์ชุดเรียน (lesson packs) ใน /educational-hub และหน้าครู — CTA สื่อ→พิมพ์→เกม',
            'KPI ครู non-admin อัป 30 วัน + แถบสถิติใน /teacher/edu-hub · coverage ตัวชี้วัดใน SystemOverview',
            'มอบหมายใบงานจาก pack → /teacher/assignments · parent บันทึกฝึกแล้ว + ส่งงาน/ดูความเห็นครู',
            'ขยายคู่เกม↔สื่อดูก่อนเล่น · รีเฟรช showcase · เปิด mediaRoadmap Phase 16',
        ],
    },
    {
        version: 'v1.199.2 (long-division cover chibi refresh)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เปลี่ยนปก `long-division-thinking-media` เป็นภาพจิบิ 16:9 แบบไม่มีคน เน้นแค่คณิตศาสตร์และหัวข้อหารยาวให้ดูเป็นสื่อการสอนชัดเจน',
            'อัปเดต asset ปกหลักเป็น `public/games/math/long-division-thinking-media-cover.png` เพื่อใช้กับสื่อ long division ตัวนี้โดยตรง',
        ],
    },
    {
        version: 'v1.199.1 (worksheet print/screen line parity)',
        date: 'ล่าสุด',
        badge: 'bg-sky-700',
        items: [
            'แก้บรรทัดเขียนขยับตอนพิมพ์: ล็อก A4 297mm เท่าจอ+พิมพ์ · เลิก space-evenly/space-between ในช่องทำโจทย์',
            'KampaiWorksheet.printA4() รอ Sarabun โหลดก่อน print · บัมพ์ cache worksheet-topic/runtime v1.199.1',
            'แก้ clock-media markup ที่ใส่ work-line ครอบทั้งข้อ · อัปเดต WORKSHEET.md §7.1',
        ],
    },
    {
        version: 'v1.199.0 (salvage orphan media/worksheets + student pet)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ดึงไฟล์ orphan เข้า git: Batch 9–13 ใบงาน hub · Media Y/Z/AA · QR ออฟไลน์ · starter-media notes',
            'Student pet companion (437) + idle GIF · แท็บคู่หูใน GamificationHub · PlayGame ส่ง pet เข้า SDK',
            'renumber mig ชนเลขบน main → 436–445 · แก้ตัวชี้วัดโจทย์ปัญหา (436)',
        ],
    },
    {
        version: 'v1.198.0 (Phase 15 lesson packs + parent worksheets)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ตาราง lesson_packs / lesson_pack_items (migration 435) · seed ≥30 ชุดจาก Phase 11–13 + legacy',
            'หน้า /parent/worksheets กรองใบงานและชุดเรียนตามชั้นลูก',
            'อัปเดต แผนพัฒนาคลังสื่อ.md · ปิด mediaRoadmap Phase 15 = done',
        ],
    },
    {
        version: 'v1.197.0 (Phase 14 แนะนำสื่อ + ครูอัปโหลดเอง)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'แนะนำสื่อบน /my (RPC recommend_media · migration 429) + RecommendedMedia',
            'ปุ่ม「ดูสื่อก่อน」บน PreGamePanel และการ์ดคลังเกม (edu-hub-game-media-pairs)',
            'ครูอัปสื่อ/ใบงานใน /teacher/edu-hub + W8 คู่มือ 5 นาที · ปิด Phase 14 = done',
        ],
    },
    {
        version: 'v1.196.0 (Phase 13 ป.6 + ตัวชี้วัด — 8 media+worksheet pairs)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'Phase 13: คณิต×2 · ไทย×1 · วิทย์×2 · อังกฤษ×2 · สังคม×1 สำหรับ ป.6 (migration 434)',
            'IndicatorCoverageDialog แยกเกม/สื่อ/ใบงาน + publish checklist ใน EduHubItemForm',
            'Backfill indicator_games สื่อเก่า + ปิดสถานะ mediaRoadmap Phase 13 = done',
        ],
    },
    {
        version: 'v1.195.0 (Phase 12 ป.ต้น daily-use — 10 media+worksheet pairs)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'Phase 12: ไทย×3 · คณิต×3 · อังกฤษ×2 · วิทย์×2 สำหรับ ป.1–2 (ตัวใหญ่/รอยประ · migration 433)',
            'ปิดสถานะ mediaRoadmap Phase 12 = done',
            'scripts/generate-media-phase12.mjs + apply-migration-433-phase12.mjs',
        ],
    },
    {
        version: 'v1.194.0 (Phase 11 thin subjects — 10 media+worksheet pairs)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'Phase 11: ศิลปะ×3 · การงาน×3 · เทคโนโลยี×2 · สังคม×2 (สื่อ+ใบงาน+ปก+ตัวชี้วัด · migration 432)',
            'ฝัง mediaRoadmap Phase 11–15 ใน SystemOverview · ปิดสถานะ Phase 11 = done',
            'scripts/generate-media-phase11.mjs + apply-migration-432-phase11.mjs',
        ],
    },
    {
        version: 'v1.176.0 (Mario Math Run — ฉากไหล + หลุม + มอนสเตอร์ + โหม่งบล็อก)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'อัปเกรด Mario Math Run (มาริโอ้ลุยโจทย์คณิต): ระบบฉากไหลอัตโนมัติ (Auto-scroller) กระโดดข้ามหลุม (Pits) หลบ/เหยียบมอนสเตอร์ (Goombas) และกระโดดโหม่งบล็อก 4 เหลี่ยมลอยฟ้าเพื่อเลือกตอบ (+ − × ÷ หรือผสม) รองรับ 1 คน และ 2 คนในหน้าจอเดียว + KampaiVersus online',
        ],
    },
    {
        version: 'v1.175.9 (vocab-hub — TTS ฟังง่ายขึ้น)',
        date: '23 ก.ค. 2569',
        badge: 'bg-sky-600',
        items: [
            'Math Question: อ่านเลขเป็นคำอังกฤษ (nine ไม่ใช่ 9) · ช้าลง · เว้นจังหวะทีละช่วง What is / เลข / plus / เลข',
        ],
    },
    {
        version: 'v1.175.8 (vocab-hub — เสียงชาย/หญิง)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'vocab-hub Math Question: ปุ่มเลือกเสียงอ่านอังกฤษ 👩 หญิง / 👨 ชาย · จำค่าในเครื่อง · กดแล้วลองฟังโจทย์ทันที',
        ],
    },
    {
        version: 'v1.175.7 (vocab-hub — ปุ่ม +−×÷ แยก)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'vocab-hub Math Question (Numbers): แยกเครื่องหมายเป็นปุ่ม + − × ÷ เลือกได้ทีละชนิดหรือผสม · ช่วงตัวเลขยังเป็น ง่าย 1–20 / กลาง 1–100',
        ],
    },
    {
        version: 'v1.175.6 (พื้นที่ — วิธีทำ 3 แถว)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'rect-area: ช่องแสดงวิธีทำ 3 แถว — 1 ขั้นต่อแถว (เช่น คางหมู: แทนค่า → รวมคู่ขนาน → ได้คำตอบ) ไม่ยัดหลาย = ในบรรทัดเดียว',
        ],
    },
    {
        version: 'v1.175.5 (ใบงานพื้นที่ — เลย์เอาต์ 5/10 ข้อ)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'rect-area: เลือก 5 ข้อ/หน้า (1 คอลัมน์ แถวสูง เขียนวิธีทำ) หรือ 10 ข้อ/หน้า (2 คอลัมน์ ฝึกเร็ว) — ค่าเริ่มต้น 5 ข้อ',
            'บันทึกชุดเก็บ config.count + ชื่อชุดอัตโนมัติมี · N ข้อ; โหมด A–B–C ใช้ window.render + worksheet-mode-five ร่วมกับเลย์เอาต์ 5 ข้อ',
        ],
    },
    {
        version: 'v1.175.4 (ชื่อชุดใบงานอัตโนมัติทุกใบงาน)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'worksheet-sets.js: buildDefaultSetTitle เป็นค่าเริ่มต้นของ mountToolbar — {ชื่อ} - {หัวข้อ} · N หน้า · ชุด k ไม่ต้องพิมพ์',
            'worksheet-topic.js ส่ง titlePrefix จาก WORKSHEET_CONFIG.title + รีเฟรชชื่อตอนสุ่ม/เปลี่ยนหัวข้อ; rect-area ใช้ titlePrefix + topicLabels',
        ],
    },
    {
        version: 'v1.175.2 (แก้ปุ่มสุ่มโจทย์ใบงาน)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'worksheet-modes.js ไม่ทับ btnRandom ด้วย render ซ้ำ seed — เรียก randomize() / KampaiTopicWorksheet.randomize() ก่อนตกแต่งโหมด',
            'กระทบทุกใบงานที่โหลด worksheet-modes (rect-area, topic hub, คูณ/หาร ฯลฯ) — bump cache worksheet-modes.js?v=1.175.2',
        ],
    },
    {
        version: 'v1.175.1 (แถวชื่อนักเรียนใบงาน — layout กลาง)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'ย้าย layout ช่องชื่อ/ชั้น/เลขที่ไป worksheet-modes.css + worksheet-topic — แถวเดียว เส้นชื่อยาว เลขที่ไม่ตกบรรทัด ใช้ร่วมทุกใบงานที่โหลด modes/topic',
            'อัปเดตแม่แบบและใบงาน standalone (คูณ/หาร ฯลฯ) ให้ใช้ markup lbl+blank เดียวกัน',
        ],
    },
    {
        version: 'v1.175.0 (บันทึกชุดใบงานบนคลาวด์)',
        date: 'ล่าสุด',
        badge: 'bg-sky-700',
        items: [
            'ตาราง worksheet_sets (migration 419) + RLS: เจ้าของ/แอดมินเขียนได้ · access=link อ่านด้วย anon เพื่อเปิด ?set= บนจอ',
            'Engine กลาง public/games/worksheet-sets.js — seed RNG (mulberry32), บันทึก/โหลด/รายการชุด, คัดลอกลิงก์; worksheet-runtime โหลดโมดูลให้ใบงาน',
            'ต่อ rect-area + worksheet-topic: toolbar บันทึกชุด / เลือกชุดของฉัน / ?set= โหลดโจทย์เดิมสำหรับเฉลยวันหลัง',
            'พอร์ทัลครู/แอดมิน: แท็บ «ชุดใบงาน» ทางลัดเปิดใบงานพร้อม ?set= (WorksheetSetsPanel + worksheet-sets.service)',
        ],
    },
    {
        version: 'v1.174.3 (คลังความรู้ทั่วไป — เทคนิค 3D Print)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มหมวด “คลังความรู้ทั่วไป” ในคลังสื่อและเกมการศึกษา พร้อมรายการบทความที่ผู้ดูแลแก้ไขสถานะและข้อมูลได้จากหลังบ้าน',
            'เพิ่มคู่มือแก้ชิ้นงาน 3D ขนาดเล็กไม่ติดฐานสำหรับ Bambu Lab A1 Mini และเครื่องพิมพ์ FDM แบบวิเคราะห์อาการและแก้ทีละขั้น',
            'ปรับคำแนะนำให้เริ่มจากโปรไฟล์เพลท/เส้น การทำความสะอาด และ Bed Leveling ก่อน พร้อม Brim 3–5 มม. การปรับอุณหภูมิทีละ 5°C และข้อควรระวังเรื่องกาว/Z-hop',
        ],
    },
    {
        version: 'v1.174.2 (attack-on-noun Three.js CDN fix)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'แก้บักเกม attack-on-noun เข้าเล่นไม่ได้: three@0.170.0/build/three.min.js คืน 404 ทำให้ THREE ไม่โหลดและสคริปต์พังตอน init',
            'เปลี่ยน CDN เป็น three@0.160.0 (UMD ที่ยังมี three.min.js) + แสดงข้อความเมื่อโหลด 3D ล้มเหลว + ใส่ <base href> กัน asset path หลุด',
            'เรียก KAMPAI.beginRound() ตอนเริ่มรอบ, เพิ่ม #kampai-result จอจบ, ผูก STAGES/SKINS จาก config.js',
        ],
    },
    {
        version: 'v1.174.1 (attack-on-noun playability & controls fix)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'แก้ไขปัญหากดเริ่มเกมไม่ได้บน Vercel/Iframe due to PointerLock permission rejection loop',
            'เพิ่มระบบควบคุมการมองและยิงด้วย Mouse Drag Fallback เมื่อไม่ได้ล็อคเมาส์',
            'เปิดใช้งานปุ่มควบคุมบนมือถือ/แท็บเล็ต (#mobile-controls, #look-pad, #joystick-base, #btn-fire, #btn-jump, #btn-zoom)',
            'แสดงตัวเลือกหมวดหมู่คำศัพท์ (#category-select) บนหน้าแรกของเกมให้ผู้เรียนเลือกเล่นได้ตามต้องการ',
        ],
    },
    {
        version: 'v1.172.6 (worksheet thumbnail simplification)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ลดปกใบงานให้เหลือเฉพาะชื่อวิชาและชื่อเรื่องบนภาพ 16:9 สำหรับใช้เป็นปกสื่อ ไม่ใส่คำชี้แจง ช่องกรอก หรือข้อมูลสำหรับการพิมพ์',
            'คงสไตล์จิบิอุปกรณ์การเรียนโดยไม่มีตัวละครมนุษย์ เพื่อให้หัวข้ออ่านชัดในภาพตัวอย่าง',
        ],
    },
    {
        version: 'v1.172.5 (kawaii worksheet cover refresh)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ปรับปกใบงานตัวอย่างเป็นสไตล์จิบิสีพาสเทล ใช้ดินสอ ยางลบ ไม้บรรทัด เครื่องคิดเลข และคลิปหนีบกระดาษแทนภาพคนทั้งหมด',
            'คงโครงสร้างปกใบงาน A4 พร้อมช่องข้อมูล คำชี้แจง เป้าหมายการเรียนรู้ และตารางคะแนนสำหรับงานพิมพ์',
        ],
    },
    {
        version: 'v1.174.0 (attack-on-noun story & adaptive learning)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่ม Phase 7 โหมดเนื้อเรื่อง (Story Campaign): แผนที่ 10 ด่าน, บทสนทนา Chibi, Boss พิเศษ และศึกราชาไททัน King Titan (+1000)',
            'เพิ่ม Phase 8 ระบบ Progression: Level 1-50, XP bar, ดาว ⭐⭐⭐ ประจำด่าน, สกินตัวละคร 5 ชุด (นักรบกำแพง, เกราะ, วีรบุรุษ, ตำนาน)',
            'เพิ่ม Phase 10 Adaptive Learning (Leitner 5-Box): อัลกอริทึมสุ่มคำสอดคล้องกับความเชี่ยวชาญ, เน้นย้ำคำที่ผิดบ่อย',
            'เพิ่ม หน้าสรุปผลหลังเกม (Word Report): รายงานคำศัพท์ประจำรอบพร้อมปุ่ม 🔊 อ่านออกเสียงลักษณะนาม',
            'เพิ่ม หน้าสถิติความเชี่ยวชาญ (Analytics): กราฟแสดงผลแยกตาม 11 หมวดหมู่คำลักษณะนาม',
        ],
    },
    {
        version: 'v1.173.0 (attack-on-noun major upgrade)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'อัพเกรดเกม ผู้พิทักษ์ลักษณะนาม ครบ 6 เฟส: แก้บัก Timer + เปลี่ยนเสียงเป็น KAMPAI SDK + fix memory leak + อัพ Three.js r170',
            'เพิ่มระบบ Performance: CanvasTexture cache, Bullet pool, Shadow optimization, Distance-based update skip',
            'เพิ่ม Visual: Gradient sky, Particle effects, Combo counter, Kill feed, Camera shake, Mini-map, Game over stats',
            'เพิ่ม Educational: 3 ระดับความยาก, โหมดฝึกซ้อม, Wave/Stage system, เลือกหมวดหมู่คำ, สมุดสะสมลักษณะนาม 132 คำ',
            'เพิ่ม Gameplay: Power-ups (โล่/แช่แข็ง/กระสุนเพลิง), Fever Mode ×2, Boss Armored Titan (+500), คำอธิบายเมื่อตอบผิด',
            'เพิ่ม Mobile: Landscape warning, Touch aim assist, ปรับ UI scaling',
        ],
    },
    {
        version: 'v1.172.4 (printable worksheet cover prototype)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่มตัวอย่างปกใบงาน A4 แนวตั้งที่มองออกเป็นใบงานทันที: ชื่อเรื่อง ช่องชื่อ–ชั้น–เลขที่ คำชี้แจง เป้าหมายการเรียนรู้ และช่องคะแนน',
            'ลดการพึ่งพาภาพครู/นักเรียน ใช้กรอบกระดาษและไอคอนเครื่องเขียนเพื่อคุมลำดับสายตาให้เหมาะกับงานพิมพ์',
        ],
    },
    {
        version: 'v1.172.3 (worksheet catalog recovery)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ลงทะเบียนใบงานตกค้าง 6 รายการให้แสดงในคลัง พร้อมเชื่อมเจ้าของ สื่อคู่ และตัวชี้วัดผ่าน migration 412',
            'แก้ QR และตัวชี้วัดของใบงานหารยาว การคูณ พื้นที่ แผนภูมิ ภาษาไทย อังกฤษ วิทยาศาสตร์ และวิทยาการคำนวณให้ตรงกับสื่อจริง',
            'เพิ่ม verify:worksheet ตรวจ URL ใบงานกับ migration และบังคับ metadata สื่อคู่/ตัวชี้วัด เพื่อป้องกันไฟล์ตกค้างซ้ำ',
            'เพิ่ม verify:worksheet:production เทียบ URL ใบงานใน repo กับรายการ published จริง และล้มเหลวเมื่อ migration ยังไม่ถูก apply',
            'ขยายช่องค่าประจำหลักของกระดานหารยาวและจัดคำตอบให้อยู่ใกล้กระดาน ลดพื้นที่กันชนที่บีบตัวเลข',
        ],
    },
    {
        version: 'v1.172.2 (positional long division)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ปรับใบงานหารยาวเป็น 5 ข้อต่อหน้าทุกโหมด เพื่อขยายพื้นที่ตั้งหารและรองรับลายมือนักเรียนจริง',
            'ออกแบบพื้นที่ทำใหม่ให้ผลหาร ผลคูณ เส้นลบ เศษ และเลขที่ดึงลงตรงคอลัมน์ค่าประจำหลัก โดยยกเลิกป้ายขั้นและสมการข้อความ',
            'เพิ่ม fixed-count contract และกฎ verify:worksheet ป้องกันใบงานหารย้อนกลับไปเป็น 10 ข้อหรือเฉลยผิดตำแหน่ง',
        ],
    },
    {
        version: 'v1.172.1 (worked long-division answers)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ออกแบบเฉลยใบงานการหารใหม่ให้เติมผลหารลงช่องด้านบนและเติมตัวเลขจริงครบทุกขั้น: หาร คูณ ลบ ดึงลง และเศษ',
            'ย้ายคำตอบสุดท้ายเข้าเส้นตอบและยกเลิกป้ายเฉลยแยกด้านข้าง พร้อมคงความพอดี A4 ทั้งโหมด 5 และ 10 ข้อ',
            'เพิ่มกฎ verify:worksheet ป้องกันใบหารย้อนกลับไปใช้เฉลยแบบแสดงคำตอบอย่างเดียว',
        ],
    },
    {
        version: 'v1.172.0 (paired worksheet batch 1)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่มใบงานคู่สื่อ 5 วิชา: ข้อมูลและแผนภูมิ, ข้อเท็จจริง–ความคิดเห็น, Phonics, วัฏจักรน้ำ และอ่านฉลากโภชนาการ',
            'เพิ่ม worksheet-topic.css / worksheet-topic.js เป็น A4 engine กลาง พร้อม QR กลับสื่อหลักและ process scaffold เฉพาะทักษะ',
            'เพิ่ม metadata contract สำหรับ source media / curriculum indicators และขยาย verify:worksheet ให้ตรวจไฟล์คู่สื่อกับ scaffold อัตโนมัติ',
            'ลงทะเบียนใบงานทั้ง 5 ในคลังใบงานและเชื่อมตัวชี้วัดผ่าน migration 411',
        ],
    },
    {
        version: 'v1.171.2 (attack-on-noun cover & seed)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'สร้างภาพปกใหม่ 16:9 (1280×720) สำหรับเกม "ผู้พิทักษ์ลักษณะนาม: ปะทะ 3 ขุนพลไททัน" (Attack on Noun)',
            'ผ่านการทดสอบ pnpm verify:game 11/11 หัวข้อ และรันสคริปต์ seed-attack-on-noun-game.mjs อัปเดตข้อมูลเข้าคลังเกมเรียบร้อยแล้ว',
        ],
    },
    {
        version: 'v1.171.3 (worksheet quality contract)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่มโหมดใช้สอนร่วมสำหรับใบงานอัจฉริยะ: แยกระดับ A–B–C, ตรวจเร็วท้ายคาบ, วินิจฉัยก่อนเรียน และซ่อมเสริมเฉพาะจุด',
            'รวมตรรกะและรูปแบบของโหมดไว้ที่ worksheet-modes.js / worksheet-modes.css เพื่อให้ใบงานทุกวิชาและแม่แบบใหม่ใช้มาตรฐานเดียวกัน',
            'อัปเกรดใบงานพื้นที่รูปเรขาคณิตให้เลือกหัวข้อ/จำนวนหน้าและใช้โหมดกลาง พร้อมข้อความวินิจฉัยและขั้นตอนซ่อมเสริมเฉพาะทั้ง 7 วิชา',
            'ปรับใบงานการหารจากโจทย์เครื่องหมายหารเป็นกระดานตั้งหารยาวจริง พร้อมช่องผลหาร ตัวตั้ง ตัวหาร และบรรทัดเติมวิธีทำทีละขั้น',
            'รวมการโหลดรายชื่อครูไว้ที่ worksheet-runtime.js จุดเดียวแบบ read-only เพื่อลดโค้ดซ้ำและคงเงื่อนไข RLS / publishable key',
            'เพิ่มกฎ Worksheet Contract, Process Scaffold และคำสั่ง verify:worksheet เพื่อตรวจโครงสร้าง โหมดกลาง A4 และการไม่ฝัง data access ซ้ำโดยอัตโนมัติ',
            'ระบุข้อยกเว้น print-only แบบแคบสำหรับชื่อครูและ CSS โดยไม่ลดความเข้มของกฎ PersonAvatar และ service ในหน้า React',
        ],
    },
    {
        version: 'v1.170.0 (teacher-led teaching-media covers)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'สร้าง/รีเฟรชปกสื่อการสอน 10 รายการเป็นภาพโปสเตอร์ห้องเรียน 16:9 (1280×720) โดยให้ครูผู้ชายภาพจริงเป็นตัวละครหลัก',
            'เพิ่มข้อยกเว้นใน GAME.md และ COVER-PROMPT.md: ปก *-media ใช้ครูภาพจริงได้ ไม่บังคับ chibi หรือนักเรียนเป็นตัวเอก; ปกเกมทั่วไปยังใช้กฎเดิม',
        ],
    },
    {
        version: 'v1.169.1 (pixel forest production cover)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เปลี่ยนปกฮีโร่จิ๋วผจญป่าเป็น PNG พิกเซลอาร์ต 1280×720 แบบเต็ม 16:9 พร้อม title safe zone ภาษาไทย',
            'ภาพปกสรุปฟีเจอร์ Phase 4–5 ทั้งฮีโร่ มอนสเตอร์ บอส ดันเจี้ยน ไอเทมหายาก ตกปลา และคู่หู พร้อม migration 410 และ game_docs v6.0.1',
        ],
    },
    {
        version: 'v1.169.0 (pixel forest progression & companion)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'Phase 4 เพิ่มร้านค้า ยาฟื้นพลัง ชุดวัตถุดิบ คราฟอาวุธตาม rarity ตีบวกแบบต้นทุนไล่ระดับ และรูน 2 ช่อง',
            'เพิ่ม drop table เฉพาะมอนสเตอร์และอาวุธ Rare / Epic / Legendary เฉพาะโซน พร้อมปรับรายรับทองและพลังตีบวกใหม่',
            'Phase 5 เพิ่มเขาวงกตหมอกคราม 3 ห้อง บอสราชินีหมอกครามสองเฟส รางวัลและสถิติถาวร',
            'เพิ่มคู่หูช่วยต่อสู้ 3 แบบ—ฮีล ยิงเป้าหมาย และเวทวงกว้าง—พร้อม migration 401 และ game_docs v6.0.0',
        ],
    },
    {
        version: 'v1.168.0 (pixel forest phase 3 content)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่มมอนสเตอร์เฉพาะโซน 3 ชนิด: ภูตรากหนาม คางคกหมอกพิษ และอัศวินศิลารูน พร้อมพฤติกรรมโจมตีและภาพพิกเซลเฉพาะตัว',
            'อัปเกรดบอสแคมเปญทั้ง 4 ตัวเป็นการต่อสู้สองเฟส โดยเข้าสู่ช่วงคลั่งเมื่อ HP ต่ำกว่า 50% และเปลี่ยนแพตเทิร์นสกิล',
            'เพิ่มดันเจี้ยนแรก “ถ้ำรากโบราณ” 3 ห้องภายใน 100 วินาที พร้อมบอสผู้กลืนกินราก รางวัลถาวร จำนวนครั้งที่ผ่าน และสถิติเวลาเร็วที่สุด',
            'Migration 400 อัปเดต game_docs และ build version ของฮีโร่จิ๋วผจญป่าเป็น 4.0.0',
        ],
    },
    {
        version: 'v1.167.0 (pixel forest persistent RPG)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เชื่อม KAMPAI RPG bridge เข้ากับ PlayGame เพื่อโหลดและเซฟอาชีพ เลเวล แคมเปญ อุปกรณ์ ทอง วัตถุดิบ และรูนข้ามเครื่อง',
            'เพิ่ม optimistic version + idempotency ป้องกันเซฟเก่าทับเซฟใหม่ พร้อมคืน state ล่าสุดให้เกมลองบันทึกซ้ำเมื่อชนกัน',
            'Migration 398–399 ตรวจรูปทรงและขนาด JSON อย่างเข้มงวด จำกัด economy delta/telemetry payload และเพิ่ม index สำหรับ audit รายผู้เล่น',
            'เพิ่ม pixel_forest_balance_summary สำหรับแอดมินวิเคราะห์จำนวนผู้เล่น เหตุการณ์ และค่าเฉลี่ยรายวัน แยกตามอาชีพ บท และโซน',
        ],
    },
    {
        version: 'v1.166.0 (pixel forest RPG vertical slice)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'ขยาย “ฮีโร่จิ๋วผจญป่า” เป็น RPG Vertical Slice: เลือก 3 อาชีพ นักดาบ/เรนเจอร์/เมจ พร้อมอาวุธและสกิลประจำอาชีพ',
            'เพิ่มแคมเปญ 4 บท 4 โซน และบอสประจำบทที่มีกลไกเฉพาะตัว ตั้งแต่โกเลมฝึกหัดจนถึงผู้พิทักษ์รูน',
            'เพิ่มเศรษฐกิจในเกมแบบย่อ: ทอง วัตถุดิบ หีบสมบัติ คราฟอาวุธ ตีบวก และติดตั้งรูน พร้อมเมนูค่ายพัก',
            'Migration 397 เพิ่มเซฟเกมถาวรแบบ optimistic version + idempotency, ledger ตรวจสอบทอง และ telemetry สำหรับบาลานซ์เกม โดยจำกัดข้อมูลผ่าน RLS/RPC',
        ],
    },
    {
        version: 'v1.165.0 (pixel forest action RPG)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'อัปเกรด “ฮีโร่จิ๋วผจญป่า” เป็น Action RPG พิกเซลอาร์ต: ผู้เล่นมี HP/XP/Level/Damage/Critical และฟันดาบระยะใกล้ 4 ทิศ',
            'เพิ่มมอนสเตอร์มีเลเวลและ HP ตามความยากของโซน 3 สาย ได้แก่ สไลม์ไล่ชน หมูป่าพุ่งชาร์จ และชาแมนรักษาระยะยิงเวท',
            'เพิ่ม Skill Tree 4 สาย แต้มสกิลจากการเลเวลอัป/เปิดหีบ ของดรอปฟื้นเลือด เอฟเฟกต์โจมตี คริติคอล กล้องสั่น และปุ่มต่อสู้บนมือถือ',
            'อัปเดต game_docs เป็น v2.0.0 ใน Migration 396 พร้อมคงโหมดเดี่ยว จับเวลา KampaiVersus และ leaderboard',
        ],
    },
    {
        version: 'v1.164.0 (pixel forest explorer)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มเกม “ฮีโร่จิ๋วผจญป่า” แบบ Canvas 2D พิกเซลอาร์ตมุมมองบนลงล่าง พร้อมแมพป่าขนาดใหญ่ ต้นไม้ แม่น้ำ สะพาน ทางเดิน และดอกไม้',
            'ตัวละครฮีโร่เดิน 4 ทิศด้วย WASD/ลูกศร/ปุ่มสัมผัส มี walk cycle และกล้องเลื่อนตามแบบนุ่มนวล',
            'รองรับโหมดเดินเล่น โหมดเก็บแสง 60 วินาที และ KampaiVersus สำหรับ local hot-seat + online พร้อมบันทึก game_docs v1.0.0 ใน Migration 395',
        ],
    },
    {
        version: 'v1.163.0 (student pet companion MVP)',
        date: 'ล่าสุด',
        badge: 'bg-primary',
        items: [
            'เพิ่มระบบคู่หูนักเรียน: ร้านสัตว์ 6 ตัว · กระเป๋าเหรียญดาว · คลังสัตว์ · เลือกตัวใช้งาน ผ่าน GamificationHub แบบพับได้',
            'Migration 422: pet_catalog / student_pet_wallets / pet_coin_transactions / student_pets พร้อม RLS และ RPC ซื้อ/สวมใส่แบบ atomic',
            'รับเหรียญจาก 3 รอบแรกต่อวัน + โบนัส Daily Quest; XP ไม่ถูกหักและสัตว์ไม่เพิ่มพลังหรือคะแนน',
            'PlayGame ส่ง pet/wallet เข้า KAMPAI SDK กลาง และแสดงคู่หูบน RewardPopup โดยเกมเดิมยังทำงานได้เหมือนเดิม',

        ],
    },
    {
        version: 'v1.163.15 (Savings Bank — ประวัติครบและยอดปัจจุบัน)',
        date: 'ล่าสุด',
        badge: 'bg-amber-600',
        items: [
            'แก้หน้า /admin/dashboard/savings-bank ที่เคยโหลดเฉพาะ 100 ธุรกรรมล่าสุดทั้งโรงเรียน ทำให้รายการถอนของบางคนหายจากหน้าตรวจสอบ แม้ข้อมูลยังอยู่ในฐานข้อมูล',
            'savingsTransactionsService.getAll โหลดบัญชีธุรกรรมครบแบบแบ่งหน้า 1,000 รายการ ป้องกันเพดานต่อคำขอของ Data API',
            'แท็บประวัติเพิ่มจำนวนรายการที่แสดง/ทั้งหมด ปุ่มอัปเดตข้อมูล กรองชั้น และค้นหาชื่อนักเรียน เพื่อเทียบยอดฝากถอนปัจจุบันได้ทันที',
            'ตรวจฐานข้อมูล ป.4 จำนวน 148 ธุรกรรม: ยอดคงเหลือที่คำนวณจาก ledger ตรงกับ savings_student_summary ครบทั้ง 8 คน และไม่มีรายการ student_id หลุด',
        ],
    },
    {
        version: 'v1.163.14 (Area Lab — ใบงานพื้นที่ 110 ข้อ)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'เพิ่มหน้าใบงาน A4 สำหรับพื้นที่รูปเรขาคณิตครบ 11 แบบ รูปละ 1 หน้า หน้าละ 10 ข้อ รวม 110 ข้อ',
            'ทุกข้อมีภาพ SVG กำกับมิติ ช่องเขียนวิธีทำ ช่องตอบ และรองรับพิมพ์หรือบันทึก PDF',
            'ลงทะเบียนใบงานใน “คลังใบงาน” ของ Educational Hub และเชื่อมสองทาง: จาก Area Lab เปิดใบงาน และจากใบงานกลับสื่อ',
            'เพิ่มปุ่มสุ่มชุดใบงานใหม่และโหมดแสดง/ซ่อนเฉลยสำหรับครู',
        ],
    },
    {
        version: 'v1.163.13 (Area Lab — กระดานแทนค่าสูตรเต็มจอ)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'เฉลย Area Lab เปิดเป็นกระดานเต็มจอ แสดงภาพรูปทรงและวิธีคำนวณตัวใหญ่ เหมาะกับสอนหน้าห้อง',
            'แทนค่าลงสูตรทีละตัว แล้วแยกวงเล็บ การคูณ การหาร และการลบเป็นคนละขั้น คล้ายรูปแบบสอนคูณ/หารยาว',
            'จำนวนขั้นปรับตามรูปอัตโนมัติ 5–9 ขั้น และยังซ่อนคำตอบจนถึงขั้นสุดท้าย',
        ],
    },
    {
        version: 'v1.163.12 (Area Lab — สูตรเศษส่วนแบบเวกเตอร์)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'ปรับการ์ดสูตรเป็นสมการเวกเตอร์ responsive คมชัดทุกระดับซูม แทนการใช้ภาพ raster ที่ข้อความไทยอาจเพี้ยน',
            'สูตร 1/2 และ 1/4 แสดงเป็นเศษส่วนแนวตั้งพร้อมเส้นคั่นจริง อ่านชัดบนโปรเจกเตอร์',
            'เลขยกกำลัง 2 ของสูตรวงกลมแสดงเป็น superscript ชัดเจน และสูตรยังเปลี่ยนอัตโนมัติตามรูปทรง',
        ],
    },
    {
        version: 'v1.163.12 (คู่มือฝึก Construct 2 — รวมสื่อทั้งชุด)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มคู่มือฝึกสร้างเกมด้วย Construct 2 ใน Educational Hub หมวด “คู่มือฝึก” พร้อมลิงก์สาธารณะภายในเว็บโรงเรียน',
            'นำเข้าสื่อครบ 252 ไฟล์: 10 บท 67 ขั้นตอน ภาพคู่มือ 134 ภาพ คลัง Event 524 คำสั่ง และคำแปลไทยครบทุกคำสั่ง',
            'เพิ่ม Action Simulator สำหรับคำสั่ง Action 189 รายการ พร้อมตารางค่าก่อน–หลัง และการจำลองคำสั่ง Browser แบบปลอดภัย',
        ],
    },
    {
        version: 'v1.163.11 (Area Lab — สุ่มค่าในสูตรเดิม)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'เพิ่มปุ่ม “สุ่มขนาดใหม่ — รูปร่างเดิม” เพื่อให้นักเรียนฝึกโจทย์รูปชนิดเดิมซ้ำโดยเปลี่ยนเฉพาะตัวเลข',
            'แยกจากปุ่ม “สุ่มรูปและสูตรใหม่” อย่างชัดเจน และหลีกเลี่ยงการสุ่มได้ค่าชุดเดิม',
            'ขยายสูตรหลักเป็นตัวอักษร responsive ขนาดใหญ่สูงสุด 2.5rem เหมาะกับจอหน้าห้องและโปรเจกเตอร์',
        ],
    },
    {
        version: 'v1.163.10 (Area Lab — เฉลยภาพทีละขั้น)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'เพิ่มปุ่ม “เฉลยทีละขั้น” สำหรับรูปเรขาคณิตทั้ง 11 ประเภท แบ่งเป็นอ่านข้อมูล เลือกสูตร/แทนค่า และคำนวณพร้อมหน่วย',
            'ภาพ SVG เปลี่ยนคำกำกับตามแต่ละขั้น พร้อมปุ่มขั้นก่อนหน้าและขั้นถัดไป',
            'คำตอบตัวเลขยังถูกซ่อนในขั้น 1–2 และเปิดเฉพาะขั้นคำนวณสุดท้าย',
        ],
    },
    {
        version: 'v1.163.09 (Area Lab — ซ่อนเฉลยก่อนตอบ)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'Area Lab ซ่อนตัวเลขพื้นที่จากภาพและแผงผลลัพธ์เมื่อเริ่มโจทย์หรือเปลี่ยนค่ามิติ',
            'แยกปุ่ม “ตรวจคำตอบ” และ “ดูเฉลย” ชัดเจน เพื่อให้นักเรียนคิดและตอบก่อนเปิดขั้นตอน',
            'การสุ่มรูป เปลี่ยนรูป หรือปรับขนาดจะปิดเฉลยเดิมอัตโนมัติ',
        ],
    },
    {
        version: 'v1.163.08 (Area Lab — พื้นที่รูปเรขาคณิต ป.4–6)',
        date: 'ล่าสุด',
        badge: 'bg-sky-600',
        items: [
            'rect-area-media ยกระดับเป็นห้องทดลองพื้นที่ รองรับ 11 รูป: จัตุรัส ผืนผ้า สามเหลี่ยม ด้านขนาน ขนมเปียกปูน คางหมู รูปว่าว วงกลม ครึ่งวงกลม หนึ่งในสี่วงกลม และรูปประกอบ',
            'เพิ่มตัวเลือกระดับ ป.4–6 สูตรตามรูป ปรับมิติ ตรวจคำตอบ และสุ่มรูปพร้อมขนาดใหม่',
            'ภาพ SVG ขยายได้ 75–200% มีปุ่มพอดีหน้าจอ โหมดโปรเจกเตอร์ และจำระดับการขยายล่าสุด',
        ],
    },
    {
        version: 'v1.163.07 (เกม 24 — สุ่มโจทย์และหารลงตัว)',
        date: 'ล่าสุด',
        badge: 'bg-amber-600',
        items: [
            'math-24-thinking-media ขยายการ์ดตัวเลขและตัวเลขในช่องกรอกให้มองเห็นชัดขึ้น โดยยังจัดครบ 4 ใบบนมือถือ',
            'สุ่มชุดตัวเลขที่แก้ได้อัตโนมัติทุกครั้งที่เปิด พร้อมปุ่มลูกเต๋า “สุ่มโจทย์ใหม่” และหลีกเลี่ยงชุดล่าสุดด้วย localStorage',
            'ตัวแก้โจทย์ยอมรับการหารเฉพาะกรณีหารลงตัวทุกขั้น จึงไม่แสดงวิธีคิดที่มีผลลัพธ์ทศนิยม',
        ],
    },
    {
        version: 'v1.163.06 (Thai Vocab Hub — ป.4 รวม 3,200 คำ)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'Thai Vocab Hub เพิ่มชุดทบทวนระดับ ป.4 อีก 800 รายการ ครบ 16 หมวด จากหมวดละ 150 เป็น 200 รายการ รวม 3,200 รายการ',
            'เปลี่ยนชื่อหน้าจอ “คำศัพท์ ป.5 เน้นหน่วย” เป็น “คำศัพท์ตามหน่วยการเรียน” โดยคง slug เดิมเพื่อไม่กระทบลิงก์และข้อมูลเดิม',
            'เพิ่มคำสั่ง expand:vocab-p4, ปรับ strict validator เป็น 200 รายการต่อหมวด และ migration 402 bump game_docs เป็น v2.0.0 พร้อม Build timestamp',
        ],
    },
    {
        version: 'v1.163.05 (Thai Vocab Hub grid 10×10)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'Thai Vocab Hub ขยายตัวเลือกกริดทบทวนจากสูงสุด 7×7 เป็น 8×8, 9×9 และ 10×10',
            'ปรับ gap, padding, ปุ่มเสียง และขนาดอักษรตามความหนาแน่น พร้อมให้คำยาวขยายได้ถึง 4 ช่องเพื่อไม่ตัดตัวอักษร',
            'migration 401 bump game_docs เป็น v1.9.0 และใช้ระบบ Build timestamp บนปกหน้ารวมเกม',
        ],
    },
    {
        version: 'v1.163.04 (game build metadata)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'หน้ารวมเกมแสดง Build version และวันเวลาแก้ไขล่าสุดที่มุมล่างซ้ายของภาพปก โดยไม่เพิ่มความสูงหรือเปลี่ยนโครงสร้างการ์ดเดิม',
            'migration 398 เพิ่ม build_version/build_updated_at และ trigger sync อัตโนมัติจาก game_docs ทุกครั้งที่สร้างหรืออัปเดตเวอร์ชันเกม',
            'GAME.md บังคับทุกการแก้เกมให้ bump game_docs.version และ updated_at = now() เพื่อให้ข้อมูลบนปกเป็นปัจจุบัน',
        ],
    },
    {
        version: 'v1.163.03 (Vocab Hub Math Question)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มโหมด Math Question ในหมวด Numbers ของสื่อ Vocab Hub: โจทย์ภาษาอังกฤษ What is ...? พร้อมเฉลยประโยค The answer is ... และเสียงอ่าน en-US',
            'รองรับระดับง่าย 1–20, กลาง 1–100, ยากบวก-ลบ-คูณ-หาร และรูปแบบคิดแล้วเฉลยหรือเลือกตอบ 4 ตัวเลือก',
            'เพิ่มคะแนน streak, metadata รายรอบ และเรียก KAMPAI.beginRound() เพื่อให้เล่นซ้ำแล้วส่งคะแนนได้ถูกต้อง',
        ],
    },
    {
        version: 'v1.163.02 (energy rocket tuning)',
        date: 'ล่าสุด',
        badge: 'bg-emerald-600',
        items: [
            'ปรับปรุงและจูนระดับความท้าทายในวิถีพลังงานของเกม AR "จรวดพลังงาน" (Energy Rocket) วิชาการวิทยาศาสตร์ ป.4-6',
            'ปรับแก้พารามิเตอร์อัตราการเติมพลังงานเคลื่อนไหว (CHARGE_K) และแตะปุ่มกดชาร์จ (TAP_K) ให้ช้าลง และเร่งอัตราการลด DRAIN เพื่อสมดุลเชิงสรีรวิทยา',
            'ติดตั้งแอนิเมชันสั่นสะเทือนของขีปนาวุธ (2D Rocket Shake) และสเกลพลังเปลวไฟขับไล่ตามเปอร์เซ็นต์พลังงานชาร์จจริงบนหน้าจอ',
            'สปอนระบบทดสอบด้วย JSDOM Simulation และจูน thumbnail_url ของภาพปกให้ตรงตามเกณฑ์ 16:9',
        ],
    },
    {
        version: 'v1.163.01 (code craft game)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มเกมวิทยาการคำนวณตัวใหม่: Code Craft (วิศวกรโค้ดดิ้งหุ่นยนต์) สำหรับฝึกฝนลำดับขั้นตอน (Sequence), เงื่อนไข (If-Else), และการวนลูป (Loop) ป.4-6',
            'พัฒนา Visual block coding Workspace ปรับพารามิเตอร์คำสั่งแบบ Inline อำนวยความสะดวกบนอุปกรณ์หน้าจอสัมผัสของโรงเรียน',
            'ติดตั้งโปรแกรมแปลคำสั่งและทดสอบการทำงานทีละขั้น (Step-by-step Visual Interpreter) พร้อมไฮไลต์โค้ดจำลองความตื่นเต้นในการทำงาน',
            'ลงทะเบียนข้อมูลเกมและระบบจำลองโรงงานในตาราง educational_hub_items และ game_docs ผ่าน migration และ seed script สำเร็จ',
        ],
    },
    {
        version: 'v1.163.00 (laser reflect game)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มเกมการศึกษาคณิตศาสตร์ตัวใหม่: Laser Reflect (ลำแสงสะท้อนเรขาคณิต) สำหรับฝึกทักษะพิกัด X/Y และมุมสะท้อน ป.4-6',
            'พัฒนาด้วยรูปแบบ 5-File Architecture รองรับ Canvas Grid สแน็ปกระจก พลอยเส้นทางแสงเลเซอร์ (Raycasting) ชนสิ่งกีดขวาง/เป้าหมาย',
            'เชื่อมโยงเข้ากับระบบ KAMPAI SDK และ KampaiVersus สำหรับประลองความรู้ 2 ผู้เล่น (แข่งเครื่องเดียวกันสลับตา หรือ แข่งสดออนไลน์ต่างเครื่อง)',
            'ลงทะเบียนข้อมูลเกมและโครงสร้างระบบในตาราง educational_hub_items และ game_docs ผ่าน migration และ seed script สำเร็จ',
        ],
    },
    {
        version: 'v1.162.23 (research lesson plan download)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มไฟล์ดาวน์โหลดแผนการจัดการเรียนรู้ ป.4 เกมแข่งสูตรคูณ แยกจากเล่มวิจัยที่ `/docs/classroom-research/p4-multiply-race-lesson-plan.docx`',
            'จัดทำแผนเต็มรูปแบบพร้อมข้อมูลรายวิชา จุดประสงค์ สื่อ กิจกรรม 10 คาบ รูปแบบรายคาบ 50 นาที และการวัดผลที่อิงคะแนนเกม',
            'ใส่ตารางรหัส/ชื่อนักเรียน 8 คน และแบบสังเกตพฤติกรรมการมีส่วนร่วม 4 รายการ พร้อมตรวจเปิดไฟล์ด้วย Microsoft Word แล้ว',
        ],
    },
    {
        version: 'v1.162.22 (research plan A observation appendix)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มภาคผนวกแผน จ แบบสังเกตพฤติกรรมการมีส่วนร่วมรายบุคคลใน DOCX ชุด A',
            'ใส่ตารางเกณฑ์คะแนน 3/2/1 และตารางรายชื่อนักเรียน 8 คนพร้อมเลขที่ รหัส ชื่อ ช่องสังเกต 4 รายการ รวมคะแนน และหมายเหตุ',
            'อัปเดตสารบัญเป็นภาคผนวกแผน ก-จ พร้อมเลขหน้าใหม่ และตรวจ R1 ให้กลับเป็นหัวเรื่องระดับ 1 หลังแทรกภาคผนวก',
        ],
    },
    {
        version: 'v1.162.21 (research plan A TOC page numbers)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เติมเลขหน้าจริงในสารบัญ DOCX ชุด A ด้วย Microsoft Word หลังคำนวณ pagination ของเอกสาร',
            'เพิ่มรายการบทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ ลงในสารบัญ หน้า 15 ก่อนภาคผนวก',
            'ตรวจสารบัญกลับครบ 24 แถว และยืนยันว่าโครง `word/document.xml` ไม่มี paragraph ผิด parent',
        ],
    },
    {
        version: 'v1.162.20 (research plan A DOCX openability fix)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'แก้ DOCX ชุด A ที่เปิดไม่ได้หลังเพิ่มบทที่ 5 โดยย้ายเนื้อหาใหม่ออกจากโครง `w:pPr` ให้เป็นย่อหน้าระดับ body ที่ถูกต้อง',
            'ตรวจซ้ำว่าไม่มี paragraph ผิด parent ใน `word/document.xml` และหัวข้อบทที่ 5 อยู่ใต้ `body` โดยตรง',
            'เปิดและบันทึกไฟล์จริงด้วย Microsoft Word สำเร็จ เพื่อยืนยันว่าไฟล์ดาวน์โหลดล่าสุดเปิดได้',
        ],
    },
    {
        version: 'v1.162.19 (research plan A chapter 5 dummy summary)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มบทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ ลงใน DOCX ชุด A โดยใช้ข้อมูลดัมมี่ประกอบเล่ม',
            'สรุปผลจากคะแนนก่อนเรียน 278.7 หลังเรียน 396.0 ผลต่างเฉลี่ย +117.3 และนักเรียน 8/8 คนมีคะแนนเพิ่มขึ้น',
            'ระบุชัดในบทที่ 5 ว่าข้อมูลชุดนี้เป็นข้อมูลดัมมี่สำหรับตรวจรูปแบบ ก่อนแทนที่ด้วยข้อมูลจริงจาก `/teacher/game-research`',
        ],
    },
    {
        version: 'v1.162.18 (research plan A page numbers)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'ปรับ footer ของ DOCX ชุด A ให้แสดงเลขหน้าแบบชัดเจนเป็น "โรงเรียนบ้านคำไผ่ | หน้า X"',
            'ผูก footer เลขหน้าให้ครอบคลุมหน้าปก หน้าคู่ และหน้าปกติ เพื่อให้เปิดใน Microsoft Word แล้วเลขหน้าไม่หายบางหน้า',
            'ตรวจซ้ำว่าไฟล์ยังใช้ลิงก์ดาวน์โหลดเดิม `/docs/classroom-research/p4-multiply-race-research-plan-a.docx` สำหรับเผยแพร่ฉบับล่าสุด',
        ],
    },
    {
        version: 'v1.162.17 (research plan A school-day schedule)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'ปรับตารางกำหนดการ DOCX ชุด A ให้เก็บข้อมูลเฉพาะวันเรียนจันทร์-ศุกร์ ไม่กินวันเสาร์-อาทิตย์',
            'เปลี่ยนช่วงก่อนเรียนเป็น 22-26 และ 29-30 มิ.ย. 2569 และช่วงหลังเรียนเป็น 1-3 และ 6-9 ก.ค. 2569 รวม 7 วันเรียนต่อช่วง',
            'เพิ่มหมายเหตุในเล่มว่านับเฉพาะวันเรียน เพื่อให้แผนวิจัยสอดคล้องกับการจัดกิจกรรมในโรงเรียน',
        ],
    },
    {
        version: 'v1.162.16 (research plan A dummy dataset)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เพิ่มส่วน "ข้อมูลดัมมี่ประกอบเล่ม" ใน DOCX ชุด A สำหรับจำลองผลวิจัยเกมแข่งสูตรคูณ ป.4 ก่อนใช้ข้อมูลจริง',
            'ใส่ตารางนักเรียน 8 คนพร้อมคะแนนก่อนเรียน หลังเรียน ผลต่าง และรอบการเล่น ให้สอดคล้องกับสมมติฐาน One-Group Pretest–Posttest',
            'สรุปค่าเฉลี่ยจำลองก่อนเรียน 278.7 หลังเรียน 396.0 ผลต่าง +117.3 และระบุชัดว่าเป็นข้อมูลดัมมี่เพื่อจัดรูปเล่ม/ตรวจรูปแบบ',
        ],
    },
    {
        version: 'v1.162.15 (research plan A school identity correction)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'แก้ข้อมูลสถานศึกษาใน DOCX ชุด A ทุกหน้าจากข้อมูลโรงเรียนเดิมที่ไม่ตรง เป็นโรงเรียนบ้านคำไผ่ กลุ่มเครือข่ายโรงเรียนกุมภวาปี 1',
            'ปรับที่อยู่เป็นเลขที่ 159 หมู่ 9 ตำบลเวียงคำ อำเภอกุมภวาปี จังหวัดอุดรธานี 41110 และสังกัด สพป.อุดรธานี เขต 2',
            'แก้ผู้ลงนามผู้อำนวยการเป็นนายสมพิศ แรงน้อย พร้อมตรวจ XML, Word render และ accessibility ก่อนเผยแพร่ทับไฟล์ดาวน์โหลดเดิม',
        ],
    },
    {
        version: 'v1.162.14 (research plan A DOCX download)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'หน้าหลังบ้านงานวิจัย `/teacher/game-research` เพิ่มปุ่ม "ชุด A แผน + รับรอง (DOCX)" สำหรับโครงการเกมแข่งสูตรคูณ ชั้น ป.4',
            'ไฟล์ DOCX ผ่านการเปิด\u2013บันทึก\u2013เปิดซ้ำด้วย Microsoft Word, ตรวจ OOXML/a11y และเรนเดอร์ครบ 23 หน้า ก่อนนำขึ้นระบบ',
            'ดาวน์โหลดจากไฟล์สาธารณะ `/docs/classroom-research/p4-multiply-race-research-plan-a.docx` โดยไม่ต้องสร้างเอกสารซ้ำในเบราว์เซอร์',
        ],
    },
    {
        version: 'v1.162.13 (archery-verb game integration)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'เพิ่มเกม AR ยิงธนูสู้คำกริยา (/games/thai/archery-verb) ที่ใช้กล้องและ Hand Tracking (KampaiHands)',
            'สปอนเป้าผลไม้คำศัพท์ 15 ข้อแบบสุ่มคำกริยาและคำนามหลอก ยิงกริยา +10 ยิงนาม -5 กริยาตกพื้น -5',
            'ระบบดึงคันธนูด้วยมือซ้ายและลากสายธนูด้วยมือขวาพร้อมแถบพาวเวอร์เกจและแรงโน้มถ่วงลูกธนู 2D',
        ],
    },
    {
        version: 'v1.162.12 (research real PDF download)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'หน้าวิจัยในชั้นเรียน `/teacher/game-research` แยกปุ่ม “ดาวน์โหลด PDF จริง” ออกจาก “พิมพ์รายงาน” เพื่อให้ผู้ใช้เลือก workflow ได้ชัดเจน',
            'PDF export ใหม่ใช้ React-PDF สร้างไฟล์จริงสำหรับดาวน์โหลด โดยยังคงรายงาน 5 บท + หน้า cover + ตารางสรุปให้สำนวนทางวิชาการมากขึ้น',
            'DOCX export เดิมยังคงใช้งานได้ และใช้ข้อมูลชุดเดียวกันเพื่อให้เนื้อหาในไฟล์ทั้งสามแบบสอดคล้องกัน',
        ],
    },
    {
        version: 'v1.162.11 (research 5-chapter export pack)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'หน้าวิจัยในชั้นเรียน `/teacher/game-research` เพิ่มปุ่มดาวน์โหลด DOCX ควบคู่ PDF/พิมพ์รายงาน สำหรับชุดรายงานฉบับสมบูรณ์แบบ 5 บท',
            'เพิ่มตัวสร้างไฟล์ DOCX แบบออฟไลน์จากข้อมูลวิจัยเดียวกันกับหน้าพิมพ์ เพื่อให้ export ออก Word ได้ทันทีโดยไม่ต้องคัดลอกมือ',
            'คงสรุปผล 7 วัน + ตารางรายบุคคล + บทที่ 1-5 + อ้างอิง/ภาคผนวก ให้พร้อมใช้งานเป็นรายงานวิจัยในชั้นเรียน',
        ],
    },
    {
        version: 'v1.162.10 (research complete report pack)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'รายงานวิจัยในชั้นเรียนเพิ่มบทคัดย่อ, สรุปเชิงวิเคราะห์, ข้อเสนอแนะ และเอกสารอ้างอิง ทำให้ชุดรายงานพร้อมใช้งานมากขึ้น',
            'บทที่ 3 แสดงวิธีวิเคราะห์ข้อมูลและหลักฐานรายวัน 7 วันก่อน + 7 วันหลัง พร้อม coverage box ครบชุด',
            'หน้ารายงาน `/teacher/game-research` และตัวพิมพ์เอกสารใช้ข้อมูลสรุปเดียวกัน ทำให้ผลแสดงในแดชบอร์ดและไฟล์พิมพ์สอดคล้องกัน',
        ],
    },
    {
        version: 'v1.162.9 (research 7-day completeness)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'หน้า `/teacher/game-research` เพิ่มหลักฐานรายวันก่อน/หลังเรียนแบบ 7 วัน พร้อมสรุปความครบถ้วนของข้อมูลทั้งชุด',
            'รายงานพิมพ์วิจัยเพิ่มตารางรายวัน + coverage box เพื่อยืนยันจำนวนรอบ/จำนวนนักเรียน/ค่าเฉลี่ยของแต่ละวัน',
            'สรุปแดชบอร์ดเพิ่มตัวชี้วัดวันมีข้อมูล เพื่อให้ตรวจความครบของชุดวิจัยได้ในหน้าเดียว',
        ],
    },
    {
        version: 'v1.162.8 (research per-student score reset)',
        date: 'ล่าสุด',
        badge: 'bg-blue-600',
        items: [
            'หน้า `/teacher/game-research` เพิ่มปุ่ม **รีเซ็ต** รายบุคคลในตารางรอบวันนี้ สำหรับลบคะแนนสอบวิจัย 4 รอบของนักเรียนคนนั้น',
            'เพิ่ม RPC `reset_research_student_scores` จำกัดสิทธิ์เฉพาะครูเจ้าของโครงการวิจัยหรือแอดมิน',
            'หลังรีเซ็ต ระบบ refresh ตารางรอบวันนี้และผลก่อน/หลังเรียนทันที พร้อม confirm ก่อนลบคะแนน',
        ],
    },
    {
        version: 'v1.162.7 (research document phase alignment)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'เอกสารวิจัยในชั้นเรียน 5 บทระบุรูปแบบการทดสอบ **ก่อนเรียน/หลังเรียนภายในวันเดียว** เมื่อช่วงวันที่เป็นวันเดียวกัน',
            'บทที่ 3 เพิ่มคำอธิบายวิธีเก็บข้อมูลด้วยปุ่มก่อนเรียน/หลังเรียน และ `metadata.research_phase`',
            'ตารางผลวิจัยในบทที่ 4 เพิ่มจำนวนรอบก่อนเรียน/หลังเรียนรายบุคคล เพื่อให้หลักฐานการทดสอบตรวจสอบได้',
        ],
    },
    {
        version: 'v1.162.6 (one-day research phases)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            '**multiply-race** เพิ่มปุ่มวิจัยแยก **ก่อนเรียน** และ **หลังเรียน** ทั้งในเมนูเกมและ wrapper เพื่อทำแผนวิจัยได้ในวันเดียว',
            'บันทึกคะแนนวิจัยพร้อม `metadata.research_phase` และหน้าครู `/teacher/game-research` รวมผลก่อน/หลังจาก phase โดยตรง พร้อม fallback ข้อมูลเก่าตามวันที่',
            'migration **391** ผ่อน constraint วันที่วิจัยให้ posttest อยู่วันเดียวกับ pretest ได้ และ bump `game_docs` เป็น v1.1.3',
        ],
    },
    {
        version: 'v1.162.5 (multiply-race research menu)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            '**multiply-race** เพิ่มปุ่ม **วิจัย** ในเมนูเริ่มของเกม เมื่อมีโครงการวิจัย active ที่ตรงกับเกมและชั้นเรียน',
            'wrapper ส่ง `gameData.research.studies` เข้า iframe และปุ่มวิจัยนำทางด้วย `study` + `autostart` เพื่อแยกคะแนนเข้า `/teacher/game-research`',
            'migration **390** bump `game_docs` เป็น v1.1.2 สำหรับ research menu integration',
        ],
    },
    {
        version: 'v1.162.3 (Math Jumper — score lifecycle fix)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**math-jumper** แก้บักโจทย์รอบแรก/แพลตฟอร์มคำตอบไม่ตรงกัน โดยสุ่มโจทย์ก่อนสร้าง row เกม',
            'แก้การเก็บและส่งคะแนน: `KAMPAI.setSlug` + `beginRound()` ทุกครั้ง, เพิ่ม `#kampai-result`, metadata คะแนนละเอียด และ guard ไม่ส่งเดี่ยวซ้ำในโหมดแข่ง',
            'เพิ่มปก 16:9 + KampaiVersus พื้นฐาน · migration **388** bump `game_docs` เป็น v1.0.1',
        ],
    },
    {
        version: 'v1.162.2 (Thai Vocab Hub — 2,400 คำ)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            '**thai-vocab-hub** ขยายคลังคำศัพท์ทุกหมวดเป็น **150 คำ/หมวด** รวม 16 หมวด 2,400 คำ · build จาก source JSON ไม่แก้ `data.js` ตรง',
            'ปรับ tooling vocab target 150 + validator ให้ warning คำซ้ำข้ามหมวดไม่ทำให้ `--strict` fail เพราะคำเดียวกันอยู่ได้หลายบริบท',
            'เพิ่ม `scripts/expand-thai-vocab-to-150.mjs` แบบ idempotent + เติม metadata `difficulty` สำหรับคำชุดใหม่เพื่อรองรับ adaptive review ระยะยาว',
            'migration **387** bump `game_docs` เป็น v1.8.0',
        ],
    },
    {
        version: 'v1.162.4 (game research entry link)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            'หน้า `/play/:gameSlug` แสดงการ์ด **งานวิจัยในชั้นเรียน** หลังนักเรียนยืนยันตัวตน เมื่อมีโครงการ active ที่ตรงกับเกมและชั้นเรียน',
            'กดเข้าโหมดวิจัยแล้วเปิดเกมด้วย `study` + `autostart` ทันที ทำให้คะแนนรอบนั้นแยกเข้ารายงาน `/teacher/game-research`',
            'migration **389** เพิ่ม RPC `list_research_studies_for_game` สำหรับลิงก์งานวิจัยจากหน้าเกมโดยไม่เปิดอ่านตารางตรง',
        ],
    },
    {
        version: 'v1.162.1 (multiply-race stability sync)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            '**multiply-race** แก้ Daily Challenge ผ่าน URL ให้รอ wrapper data/กันเล่นซ้ำ, เพิ่ม `KAMPAI.beginRound()` + `#kampai-result` ตาม SDK ใหม่',
            'Local versus sync mastery รายแม่ให้ทั้ง P1/P2 · dashboard คืน `photo_url` และใช้ `PersonAvatar` คู่ชื่อนักเรียน',
            'migration **386** อัปเดต RPC `get_multiply_race_class_overview` + bump `game_docs` เป็น v1.1.1',
        ],
    },
    {
        version: 'v1.162.0 (Batch X — สื่อเต็มมิติ 10 ชิ้น)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            '**Batch X1–X3** สื่อ interactive 10 ชิ้น (`category_key=media` · ไม่เก็บคะแนน): อาหาร 5 หมู่ · วงล้อสีวรรณะ · ไวพจน์ · ส่วนพืช · ดวงจันทร์ 8 ข้าง · พื้นที่สี่เหลี่ยม · กระดูก/กล้ามเนื้อ/ข้อ · อาชีพชุมชน · เศรษฐกิจพอเพียง · พจนานุกรมดิจิทัล',
            'migration **380–381** seed + indicator map + game_docs · ปก 📚 1280×720 ทั้งชุด',
            'คู่เกม: plate-builder · color-wheel · waipot · veggie-garden · mini-farm-island',
        ],
    },
    {
        version: 'v1.161.9 (พรีวิววิดีโอการ์ดเกม — สลับปกวนซ้ำ)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            '**GameDemoPreview** สลับปก ↔ วิดีโอเดโมแบบวนซ้ำ (ปก → วิดีโอ → ปก)',
            'หลังบ้าน GamesTab → ตั้งค่า **โชว์ปกกี่วิ / โชว์วิดีโอกี่วิ** (`game_preview_cover_seconds` · `game_preview_video_seconds`) และ **ปกหลังวิดีโอรอบแรกแบบสุ่ม** (`game_preview_cover_round2_min_seconds`–`game_preview_cover_round2_max_seconds`) — ค่าเริ่มต้น 2 วิ / วิดีโอ 5 วิ / ปกสุ่ม 3–5 วิ',
            'ใช้กับหน้ารวมเกม (`EduHubItemCard`) + โซนเกมแนะนำหน้าแรก + FeaturedGameDialog',
        ],
    },
    {
        version: 'v1.161.8 (วิจัยเกม — เมนูหลังบ้าน)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            'Admin sidebar + Quick Menu catalog + Cmd-K **วิจัยเกมในชั้นเรียน** → `/teacher/game-research` (ข้าง คลังสื่อ/เกม · การเล่นเกม)',
        ],
    },
    {
        version: 'v1.161.7 (วิจัยเกมในชั้นเรียน — หน้าแยก)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**game_research_studies** (migration 372) — โครงการวิจัย pre/post: เกม+โหมด+ชั้น+ช่วงวันที่+จำกัดรอบ/วัน · RLS เจ้าของเกม',
            '**record_game_session** +7th arg `p_research_study_id` — บันทึก research_study_id · จำกัด 3 รอบ/วัน · RPC count_research_rounds_today',
            'หน้าใหม่ `/teacher/game-research` — แดชบอร์ดรอบวันนี้ · รายงาน 5 บท · Export CSV',
            '**หน้าบ้าน `/research/:studyId`** (migration 373) — นักเรียนกรอกรหัสยืนยัน · ลิงก์สั้น · โหมดฝังใน URL · autostart เข้าเกมทันที',
            'migration 374 — `show_on_homepage` + RPC list_research_studies_public · โซนหน้าแรก `research_play` · QR พิมพ์ในแท็บลิงก์ครู · `/research` รายการโครงการ',
        ],
    },
    {
        version: 'v1.161.6 (สื่อเกม 24 วิธีคิด)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**math-24-thinking-media** — กรอกตัวเลข 4 ตัว แสดงวิธีคิดทีละขั้นจนได้ 24',
            'migration 371 — seed คลังสื่อ + ตัวชี้วัด ค 1.1 ป.4/10–12 · คู่เกม math-24',
        ],
    },
    {
        version: 'v1.161.5 (ตัวชี้วัด สื่อ+เศษส่วน+สะกด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'migration 370 — ผูก ป.4: สื่อ hub 4 รายการ (โจทย์ปัญหา/คำศัพท์ไทย-อังกฤษ/AR cal)',
            'เกมเศษส่วน 4 เกม + ไทยสะกด 5 เกม (ท 4.1 ป.4/1,4 · ค 1.1 ป.4/13–14)',
        ],
    },
    {
        version: 'v1.161.4 (การ์ดเกม — ชิดแถบอันดับ)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ลบแถวว่างใต้ตัวชี้วัด · ชิดแถบอันดับมากขึ้น',
            'สไลด์อันดับเว้นช่องปลายลูป (อันดับสุดท้าย ↔ 1)',
        ],
    },
    {
        version: 'v1.161.3 (การ์ดเกม — แนวตัวชี้วัด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'footer ตัวชี้วัด/อันดับย้ายลงล่างการ์ดคงที่ — ชื่อยาว Math Runner ไม่ดันแถบขึ้น',
            'เผื่อช่องอันดับทุกการ์ดในคลังเกม · grid items-stretch',
        ],
    },
    {
        version: 'v1.161.2 (การ์ดเกม — ช่องคงที่ 2 แถว)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'ช่องตัวชี้วัดเผื่อ 2 แถวคงที่ — แท็กน้อยไม่ดึงอันดับขึ้น',
            'อันดับรูปใหญ่ขึ้น (xs) + ช่อง h-8 คงที่ทุกการ์ดเก็บคะแนน',
        ],
    },
    {
        version: 'v1.161.1 (การ์ดเกม — แถบแคบสไลด์)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            'แถบตัวชี้วัด/อันดับ คงที่ ~20px/แถว — ไม่ wrap หลายระดับ',
            'อันดับ 1–10 สไลด์แนวนอน (รูป+เลข+คะแนน) · ตัวชี้วัด muted เข้ม สูงสุด 6',
        ],
    },
    {
        version: 'v1.161.0 (การ์ดเกม — แถบตัวชี้วัด)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            '**EduHubItemCard** — แถบสไลด์ตัวชี้วัดบน + leaderboard Top 5 ล่าง (ทุกคนเห็น)',
            'ยังไม่ผูกตัวชี้วัด → แสดง **ทดสอบ** · วนซ้ายอัตโนมัติ หยุดเมื่อชี้',
            'migration 369 — ผูกตัวชี้วัด ป.4 กับเกมยอดนิยม top 20',
        ],
    },
    {
        version: 'v1.160.0 (Pizza ภารกิจเชฟ v2)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            '**pizza-master-chef v2.0.0** — โหมดภารกิจเชฟ สลับ 4 แบบ (หั่น / เติมเต็ม / เทียบ / สมมูล) ไม่ซ้ำจำเสีย',
            'ฝึกซ้ำเศษที่พลาดอัตโนมัติ + ออเดอร์คำไทย (ครึ่งถาด ฯลฯ) · migration 368 game_docs',
            'ครูมอบหมาย `?mode=mission` ได้จากหน้าวิเคราะห์เกม',
        ],
    },
    {
        version: 'v1.159.0 (กฎเก็บคะแนนเกม · pizza fix)',
        date: 'ก่อนหน้า',
        badge: 'bg-orange-600',
        items: [
            '**fix เก็บคะแนนรอบ 2+ (ทุกเกม):** SDK รีเซ็ต `_submitted` ตอนรับ `gameResult` · PlayGame รีเซ็ต `sessionSubmittedRef` + ส่ง `init` ซ้ำหลังบันทึก (stats/leaderboard อัปเดตทันที)',
            '**KAMPAI.beginRound()** + `pnpm audit:game-scores` + GAME.md §กฎเก็บคะแนน (incident pizza)',
        ],
    },
    {
        version: 'v1.158.0 (คำขวัญ · โดยนัย · อาขยาน)',
        date: 'ก่อนหน้า',
        badge: 'bg-orange-600',
        items: [
            '**คำขวัญ** ขยายใน poetry-hub 12 บท · build:poetry',
            '**ความหมายโดยนัย** — `thai-implied-meaning-media.html` · migration 364–365',
            '**บทอาขยาน** หมวดใหม่ใน literature-hub 5 บท · build:literature',
        ],
    },
    {
        version: 'v1.157.0 (ปก Hub · vocab 100 · บรรยาย/พรรณนา)',
        date: 'ก่อนหน้า',
        badge: 'bg-orange-600',
        items: [
            '**ปก Hub มาตรฐาน** 15 ชิ้น — `pnpm build:hub-covers` (1280×720 SVG)',
            '**p5-focus** ขยายเป็น 100 คำ · `pnpm build:vocab-p5`',
            '**บทร้อยกรอง** ขยายใน poetry-hub 9 บท · build:poetry',
            '**บรรยาย vs พรรณนา** — `thai-narration-style-media.html` · migration 362–363',
        ],
    },
    {
        version: 'v1.156.0 (สังคม · อังกฤษ Hub + vocab ป.5)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**คลังสังคมศึกษาไทย** (`social-thailand-hub`) — แผนที่/สุโขทัย/พลเมือง · migration 359',
            '**คลังอังกฤษ ป.4-5** (`english-grammar-p45-hub`) — grammar/sight/instructions · migration 360',
            '**ขยาย vocab ป.5** — หมวด `p5-focus` 15 คำ · `pnpm build:vocab-p5`',
            'ผูกตัวชี้วัด migration 361 · backlog 17/17 เสร็จครบ',
        ],
    },
    {
        version: 'v1.155.0 (ข้อมูล · วิทย์ · สำนวน Hub)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            '**คลังข้อมูลและกราฟ** (`math-data-hub`) — แท่ง/รูปภาพ/ตาราง/ฝึกอ่าน · migration 355',
            '**คลังวิทยาศาสตร์ ป.4-5** (`science-p45-hub`) — สสาร/น้ำ/สัตว์/ย่อย · migration 356',
            '**คลังสำนวนไทย** (`thai-idiom-hub`) — 5 หมวด 48 รายการ · migration 357',
            'ผูกตัวชี้วัด migration 358 · backlog 14/17 เสร็จเต็ม',
        ],
    },
    {
        version: 'v1.154.0 (วรรณกรรม · ทศนิยม · เรขา Hub)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            '**คลังวรรณคดีวรรณกรรม** (`thai-literature-hub`) — 6 หมวด 26 รายการ · migration 351',
            '**คลังทศนิยม** (`math-decimal-hub`) — อ่าน/เทียบ/บวกลบ/เงิน · migration 352',
            '**คลังเรขาคณิต** (`math-geometry-hub`) — มุม/เส้นรอบ/พื้นที่/รูป2D · migration 353',
            'ผูกตัวชี้วัด migration 354 · backlog 17/17 เสร็จครบ',
        ],
    },
    {
        version: 'v1.153.0 (บทร้อยกรรม · โจทย์ปัญหา · แต่งข้อความ)',
        date: '',
        badge: 'bg-violet-600',
        items: [
            '**คลังบทร้อยกรรม** (`thai-poetry-hub`) — 7 หมวด 36 รายการ · ท่องบท TTS · migration 347',
            '**โจทย์ปัญหา** (`math-word-problem-hub`) — บวกลบ/คูณหาร/2 ขั้น · คำสำคัญ+เฉลย · migration 348',
            '**คลังแต่งข้อความ** (`thai-writing-hub`) — สรุป/บันทึก/จดหมาย/คำขวัญ + checklist · migration 349',
            'ผูกตัวชี้วัด migration 350 · `pnpm build:poetry`',
        ],
    },
    {
        version: 'v1.152.0 (Hub ไทย 3 ชิ้น — วรรคตอน · ประโยค · อ่าน)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**คลังวรรคตอน** (`thai-punctuation-hub`) — 9 หมวด 66 รายการ · โหมดเติมเครื่องหมาย · migration 343',
            '**คลังประโยคไทย** (`thai-sentence-hub`) — 9 หมวด 61 รายการ · ทายส่วนประโยค · migration 344',
            '**คลังอ่านจับใจความ** (`thai-reading-hub`) — 5 หมวด 18 บทอ่าน · โหมดอ่านแล้วตอบ · migration 345',
            'ผูกตัวชี้วัด migration 346 · อัปเดต `docs/TEACHING-MEDIA-IDEAS.md`',
        ],
    },
    {
        version: 'v1.151.0 (ปก safe zone — หัวข้อไทยไม่ล้น)',
        date: '',
        badge: 'bg-sky-600',
        items: [
            'Reframe ปกที่หัวข้อฝังชิดขอบบน **50 ไฟล์** · `GameCoverThumb` + padding · สคริปต์ `audit:covers` / `fix:covers-safe-top`',
            '`verify:game` **Check 9b** เตือน safe zone · อัปเดต `COVER-PROMPT.md` + `GAME.md`',
        ],
    },
    {
        version: 'v1.150.0 (mini-farm-island ปกเต็มขอบ)',
        date: '',
        badge: 'bg-emerald-600',
        items: [
            '**Mini Farm Island** — ปกจิบิเต็มขอบ 1280×720 มีชื่อ **มินิฟาร์มไอส์แลนด์** + **Mini Farm Island** ไม่ถูกตัด',
            'อัปเดต `cover.png` + cache bust `?v=2` · Migration 329',
        ],
    },
    {
        version: 'v1.149.0 (แทนปก SVG ทั้งหมดเป็น PNG เต็มขอบ)',
        date: '',
        badge: 'bg-indigo-600',
        items: [
            'แทนปก SVG/แบบเวกเตอร์เก่าด้วย PNG เต็มขอบ 1280×720 + ชื่อไทย/อังกฤษ: **Multiply Burst** · **Math Rally** · **Voxel Quiz** · **Platformer Blueprint**',
            'ลบ `cover.svg` ที่เหลือในเกมจริง · Migration 328',
        ],
    },
    {
        version: 'v1.148.0 (balloon-burst ปกจิบิใหม่)',
        date: '',
        badge: 'bg-pink-500',
        items: [
            '**Balloon Burst** — ปกจิบิเต็มขอบ 1280×720 มีชื่อ **Balloon Burst** + **คำประวิสรรชนีย์**',
            '`cover-chibi-full.png` · Migration 326–327',
        ],


    },
    {
        version: 'v1.147.0 (ปกคลังสื่อ — ไม่ซ้ำ + ตรงเนื้อหา)',
        date: '',
        badge: 'bg-violet-600',

        items: [
            'แก้ปกซ้ำ 3 ชิ้นที่ใช้ไฟล์เดียวกัน (math-fraction-hub / thai-grammar-hub / thai-script-hub)',
            'สร้างปกใหม่ตรงเนื้อหา: **แท่งเศษส่วนบวกลบ** · **คลังไวยากรณ์ไทย** · **Phonics A-apple B-ball C-cat**',
            'ใช้ชื่อไฟล์ใหม่ `cover-bars.png` / `cover-pos.png` ตัด cache ปกเก่า · Migration 324–325',
        ],

    },
    {
        version: 'v1.146.0 (สื่อมาตราตัวสะกด — T2)',
        date: '',
        badge: 'bg-rose-600',
        items: [
            '**สื่อการสอน** `thai-matra-chart` — มาตราตัวสะกด ป.1–3: 8 แม่ (กก กง กด กน กบ กม เกย เกอว) + ตัวสะกด + คำตัวอย่าง',
            'โหมด **✏️ ฝึก** — เห็นคำแล้วเลือกแม่มาตรา · คู่เกมตกปลา (`fishing`)',
            'หมวดคลังสื่อการสอน · Migration 323',
        ],
    },

    {
        version: 'v1.145.0 (สื่อตารางสูตรคูณ — M2)',
        date: '',
        badge: 'bg-blue-600',
        items: [
            '**สื่อการสอน** `times-table` — ตารางสูตรคูณ 1–12 ป.2–4: แตะช่องไฮไลต์แถว/คอลัมน์ + อ่านสูตร / ทั้งแถว',
            'โหมด **✏️ ฝึก** — เลือกช่วงแม่ 1–5 / 1–9 / 1–12 · เลือกคำตอบ 4 ตัวเลือก · streak',
            'หมวดคลังสื่อการสอน · Migration 322',
        ],
    },

    {
        version: 'v1.144.0 (สื่อวัฏจักรน้ำ — S1)',
        date: '',
        badge: 'bg-teal-600',
        items: [
            '**สื่อการสอน** `water-cycle` — วัฏจักรน้ำ ป.3–5: แผนภาพ 4 ขั้น (ระเหย · ควบแน่น · หยาดน้ำฟ้า · รวมตัว)',
            'โหมดเรียนรู้: แตะขั้น / เล่นวนอัตโนมัติ / TTS · โหมด **เรียงลำดับ** ลากตรวจคำตอบ',
            'หมวดคลังสื่อการสอน · Migration 321 · ปิดช่องว่างวิชาวิทยาศาสตร์',
        ],
    },

    {
        version: 'v1.143.0 (Phonics โหมดฝึก + แผนภาพสระไทย T1)',
        date: '',
        badge: 'bg-orange-600',
        items: [
            '**Phonics Chart** — เสียงแบบห้องเรียน “a as in apple” + โหมด **✏️ ฝึก** (ฟังแล้วเลือกคำ · streak)',
            '**สื่อ T1** `thai-sara-chart` — แผนภาพสระไทย ป.1–2: สระสั้น / ยาว / ประสม แตะฟัง + คำตัวอย่าง · คู่เกม `thai-sara-run`',
            'Migration 320 seed · ปก PNG · หมวดคลังสื่อการสอน',
        ],
    },

    {
        version: 'v1.142.0 (สื่อ Phonics Chart — E1)',
        date: '',
        badge: 'bg-cyan-600',
        items: [
            '**สื่อการสอน** `phonics-chart` — แผนภูมิ phonics ป.1–3: A–Z · blends · digraphs แตะฟังเสียง + คำตัวอย่าง (TTS)',
            'หมวด **คลังสื่อการสอน** · `tracked_game=false` · ปก PNG 1280×720 · Migration 319 · ลิงก์ไปคลังคำศัพท์อังกฤษ',
        ],
    },

    {
        version: 'v1.141.0 (เครื่องมือสร้างสื่อ — เทมเพลต + Prompt + ปก)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**W1** `public/games/_template-media.html` — เทมเพลตสื่อการสอน (sidebar + แสดงเฉลย · ไม่มีคะแนน/อันดับ)',
            '**W2** `public/MEDIA-PROMPT.md` — contract ให้ AI สร้างสื่อ interactive · การ์ด **📚 สร้างสื่อการสอนด้วย AI** ใน GamesTab',
            '**W5** ชุดสำเร็จรูปปก **📚 สื่อการสอน** + สไตล์ `edu_poster` + ฉากสาธิตบนกระดาน — โทนห้องเรียน ไม่ใช่เกมอาร์เคด',
        ],
    },

    {
        version: 'v1.140.0 (สื่อเศษส่วนวงกลม / แท่ง — M3)',
        date: '',
        badge: 'bg-orange-500',
        items: [
            '**สื่อการสอน** `fraction-pieces` — โมเดลเศษส่วนแบบวงกลมและแท่ง ป.3–5: แตะ/ลากชิ้นส่วนเทียบสมมูล (เช่น ½ = ²⁄₄) · preset ตัวอย่าง + สุ่มฝึก · ลิงก์ไปเกม Pizza (`math-pizza`)',
            'หมวด **คลังสื่อการสอน** (media) · `tracked_game=false` · ปก PNG 1280×720 · Migration 318 seed',
            'เอกสาร backlog: `ไอเดียทำสื่อ.md` ติ๊ก M3 เสร็จ · คู่กับ `math-fraction-hub` (บวก/ลบ/เทียบ)',
        ],
    },

    {
        version: 'v1.139.0 (Math Fraction Hub — เศษส่วน ป.4)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**สื่อเศษส่วน** (`math-fraction-hub`) — 5 เรื่อง: แท่ง เทียบ บวก ลบ จำนวนเต็ม+เศษส่วน',
            '**แนว rounding** — sidebar สุ่มโจทย์ + แสดงเฉลยพร้อมแท่งภาพและคำอธิบาย',
            'migration 317 · path `/games/math/math-fraction-hub/` · game_docs v1.0.0',
        ],
    },

    {
        version: 'v1.138.0 (Thai Grammar Hub — ไวยากรณ์ ป.4-5)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**คลังไวยากรณ์ไทย** (`thai-grammar-hub`) — 9 หมวด 112 รายการ: นาม กริยา คุณศัพท์ บุพบท สันธาน',
            '**โหมดทายชนิดคำ** — ถามจากประโยคตัวอย่าง · จับคู่คำ–ชนิด · badge สีตาม POS',
            'scripts `seed-thai-grammar-data` + `build:grammar` · migration 316 · game_docs v1.0.0',
        ],
    },
    {
        version: 'v1.137.0 (Thai Script Hub — ไตรยางศ์ ป.1-4)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**คลังอักษรไทย** (`thai-script-hub`) — 12 หมวด 188 รายการ: พยัญชนะ 3 หมู่ สระ วรรณยุกต์ ไตรยางศ์',
            '**ป.4** — อักษรนำ หลักออกเสียง มาตราสะกด ไตรยางศ์ขั้นสูง · โหมดทายหมู่/กฎ',
            'scripts `seed-thai-script-data` + `build:script` · migration 290 · game_docs v1.0.0',
        ],
    },
    {
        version: 'v1.136.0 (Thai Vocab Hub — grid span loop)',
        date: '',
        badge: 'bg-amber-600',
        items: [
            '**กริด span refit** — ResizeObserver ตอบสนองแค่ความกว้างกริดเปลี่ยน ไม่ refit เมื่อความสูงเปลี่ยนจากพลิกหลัง',
            '**gridSpanFitting** — ล็อกวัด layout กันซ้อน · retry cqh ครั้งเดียว · เอา scale autoplay ออก',
            'migration 289 · game_docs v1.7.3',
        ],
    },
    {
        version: 'v1.135.0 (Thai Vocab Hub — TTS lifecycle)',
        date: '',
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
        version: SYSTEM_OVERVIEW_META.version,
        live: SYSTEM_OVERVIEW_META.productionUrl,
        repository: 'github.com/solamon2525/kampai-school',
        hosting: 'Vercel (SPA)',
        database: `Supabase (PostgreSQL) — ${SYSTEM_OVERVIEW_META.database.tables} tables · ${SYSTEM_OVERVIEW_META.database.views} views`,
        primaryLanguage: 'TypeScript + PLpgSQL',
        frontend: 'React 18.3 + Vite 5',
        auth: 'Supabase Auth + RLS',
        edgeFunctions: 'Deno (Supabase)',
        currentFocus: 'Phase 16 ops (teacher adoption + soft-gap review)',
    },
    techStack,
    featureGroups: featureGroups.map(g => ({ category: g.label, features: g.features })),
    featureCatalog: featureCatalog.map((d) => ({
        id: d.id,
        label: d.label,
        summary: d.summary,
        features: d.features,
    })),
    longTermPlan,
    featureCatalogStats,
    database: {
        totalTables: SYSTEM_OVERVIEW_META.database.tables,
        totalViews: SYSTEM_OVERVIEW_META.database.views,
        rlsTables: SYSTEM_OVERVIEW_META.database.rlsTables,
        appliedMigrations: SYSTEM_OVERVIEW_META.database.appliedMigrations,
        migrationFiles: SYSTEM_OVERVIEW_META.database.trackedMigrationFiles,
        latestProductionMigration: SYSTEM_OVERVIEW_META.database.latestProductionMigration,
        latestRepositoryMigration: SYSTEM_OVERVIEW_META.database.latestRepositoryMigration,
        verifiedDate: SYSTEM_OVERVIEW_META.verifiedDate,
        verifiedIsoDate: SYSTEM_OVERVIEW_META.verifiedIsoDate,
        engine: 'PostgreSQL via Supabase',
        security: `RLS enabled ${SYSTEM_OVERVIEW_META.database.rlsTables}/${SYSTEM_OVERVIEW_META.database.tables} tables`,
        groups: dbGroups,
        note: 'ตัวเลข schema เป็น snapshot จาก production ตามวันที่ตรวจ; KPI Phase 16 โหลดสดเมื่อเปิดหน้า กลุ่มด้านล่างเป็น inventory หลัก ไม่ dump ทุกตาราง',
    },
    roadmap: roadmap.map(r => ({ title: r.title, description: r.desc })),
    sprintPlan: sprintPlan.map(s => ({ sprint: s.sprint, duration: s.duration, goal: s.goal, items: s.items })),
    mediaRoadmap,
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

    lines.push('\n## บทสรุปฟีเจอร์ทั้งระบบ');
    lines.push(
        `> ${featureCatalogStats.domains} โดเมน · ${featureCatalogStats.features} ฟีเจอร์ (live ${featureCatalogStats.live} / partial ${featureCatalogStats.partial} / deferred ${featureCatalogStats.deferred})`,
    );
    featureCatalog.forEach((d) => {
        lines.push(`\n### ${d.label}`);
        lines.push(d.summary);
        d.features.forEach((f) => {
            const st = f.status ?? 'live';
            const extend = f.canExtend ? 'พัฒนาต่อได้' : 'ยังไม่ขยาย / รอภายนอก';
            lines.push(`\n#### ${f.name} [${st}]`);
            lines.push(`- **มีไว้ทำอะไร:** ${f.purpose}`);
            lines.push(`- **${extend}**${f.extendNote ? ` — ${f.extendNote}` : ''}`);
            if (f.ideas12m.length) {
                lines.push('- **ไอเดีย ~1 ปี:**');
                f.ideas12m.forEach((i) => lines.push(`  - ${i}`));
            }
            if (f.ideas24m?.length) {
                lines.push('- **ไอเดีย ~2 ปี:**');
                f.ideas24m.forEach((i) => lines.push(`  - ${i}`));
            }
        });
    });

    lines.push('\n## แผนพัฒนาระยะยาว 1–2 ปี');
    longTermPlan.forEach((y) => {
        lines.push(`\n### ${y.label}`);
        y.themes.forEach((t) => {
            lines.push(`\n#### ${t.title}`);
            t.items.forEach((i) => lines.push(`- ${i}`));
        });
    });

    lines.push('\n## ฐานข้อมูล');
    lines.push(`- **Tables**: ${exportData.database.totalTables}`);
    lines.push(`- **Views**: ${exportData.database.totalViews}`);
    lines.push(`- **RLS tables**: ${exportData.database.rlsTables}/${exportData.database.totalTables}`);
    lines.push(`- **Applied migrations (production)**: ${exportData.database.appliedMigrations}`);
    lines.push(`- **Tracked migration files (Git)**: ${exportData.database.migrationFiles}`);
    lines.push(`- **Latest production migration**: ${exportData.database.latestProductionMigration}`);
    lines.push(`- **Latest repository migration**: ${exportData.database.latestRepositoryMigration}`);
    lines.push(`- **Verified**: ${exportData.database.verifiedDate}`);
    lines.push(`- **Engine**: PostgreSQL via Supabase`);
    lines.push(`- **Security**: RLS enabled`);
    lines.push(`- **Note**: ${exportData.database.note}`);
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

    const statusLabel: Record<string, string> = { done: 'เสร็จ', pending: 'รอ', 'in-progress': 'กำลังทำ' };
    lines.push('\n## Roadmap คลังสื่อ+ใบงาน (Phase 11–16)');
    lines.push(`> ${mediaRoadmap.baseline}`);
    lines.push(`> ${mediaRoadmap.target}`);
    mediaRoadmap.phases.forEach(p => {
        lines.push(`\n### ${p.phase} — ${p.duration} [${statusLabel[p.status] ?? p.status}]`);
        lines.push(`> 🎯 ${p.goal}`);
        p.items.forEach(i => lines.push(`- ${i}`));
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

const OpsQueryState = ({
    isLoading,
    isError,
    error,
    onRetry,
    children,
}: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    onRetry: () => void;
    children: ReactNode;
}) => {
    if (isLoading) {
        return <p className="text-sm text-muted-foreground">กำลังโหลด…</p>;
    }
    if (isError) {
        return (
            <div className="space-y-1.5" role="alert">
                <p className="text-sm font-medium text-destructive">โหลดข้อมูลไม่สำเร็จ</p>
                {error instanceof Error && (
                    <p className="text-xs text-muted-foreground break-words">{error.message}</p>
                )}
                <Button variant="outline" size="sm" className="h-7 gap-1.5" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    ลองใหม่
                </Button>
            </div>
        );
    }
    return <>{children}</>;
};

export const SystemOverview = () => {
    const [copied, setCopied] = useState(false);
    const [featureQuery, setFeatureQuery] = useState('');

    const statusLabel: Record<FeatureStatus, string> = {
        live: 'ใช้งานจริง',
        partial: 'บางส่วน',
        deferred: 'เลื่อนไว้',
    };

    const filteredCatalog = useMemo(() => {
        const q = featureQuery.trim().toLowerCase();
        if (!q) return featureCatalog;
        return featureCatalog
            .map((d) => ({
                ...d,
                features: d.features.filter(
                    (f) =>
                        f.name.toLowerCase().includes(q) ||
                        f.purpose.toLowerCase().includes(q) ||
                        (f.extendNote ?? '').toLowerCase().includes(q) ||
                        f.ideas12m.some((i) => i.toLowerCase().includes(q)) ||
                        (f.ideas24m ?? []).some((i) => i.toLowerCase().includes(q)),
                ),
            }))
            .filter((d) => d.features.length > 0 || d.label.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q));
    }, [featureQuery]);

    const habitQuery = useQuery({
        queryKey: ['edu-hub', 'non-admin-habit', 30],
        queryFn: () => educationalHubService.getNonAdminUploadHabit(30),
        staleTime: 60_000,
    });

    const coverageQuery = useQuery({
        queryKey: ['curriculum', 'indicator-coverage-summary'],
        queryFn: () => curriculumService.indicatorCoverageSummary(),
        staleTime: 60_000,
    });

    const softGapQuery = useQuery({
        queryKey: ['curriculum', 'indicator-soft-gap-summary'],
        queryFn: () => curriculumService.indicatorSoftGapSummary(),
        staleTime: 60_000,
    });

    const packCountQuery = useQuery({
        queryKey: ['lesson-packs', 'published-count'],
        queryFn: () => lessonPacksService.countPublished(),
        staleTime: 60_000,
    });

    const homeworkQuery = useQuery({
        queryKey: ['assignments', 'ops-summary', 30],
        queryFn: () => assignmentsService.opsSummary(30),
        staleTime: 60_000,
    });

    const habit = habitQuery.data;
    const coverage = coverageQuery.data;
    const softGap = softGapQuery.data;
    const packCount = packCountQuery.data;
    const homework = homeworkQuery.data;

    const phase16Checklist = useMemo(() => {
        const teacherOk = (habit?.uploaderCount ?? 0) > 0;
        const coverageOk = (coverage?.pctCovered ?? 0) >= 80;
        const packsOk = (packCount ?? 0) >= 30;
        const homeworkOk = (homework?.submissions ?? 0) > 0;
        return [
            {
                id: 'teacher-upload',
                label: 'ครู non-admin อัปสื่อจริง (30 วัน)',
                done: teacherOk,
                detail: habitQuery.isError
                    ? 'โหลดข้อมูลไม่สำเร็จ'
                    : habit
                    ? `${habit.uploaderCount} คน · ${habit.itemCount} รายการ`
                    : 'กำลังโหลด…',
                failed: habitQuery.isError,
            },
            {
                id: 'coverage',
                label: 'ตัวชี้วัดมีสื่อ/เกมผูก ≥80%',
                done: coverageOk,
                detail: coverageQuery.isError
                    ? 'โหลดข้อมูลไม่สำเร็จ'
                    : coverage ? `${coverage.pctCovered}% (${coverage.covered}/${coverage.totalIndicators})` : 'กำลังโหลด…',
                failed: coverageQuery.isError,
            },
            {
                id: 'packs',
                label: 'ชุดเรียนเผยแพร่ ≥30',
                done: packsOk,
                detail: packCountQuery.isError ? 'โหลดข้อมูลไม่สำเร็จ' : packCount != null ? `${packCount} ชุด` : 'กำลังโหลด…',
                failed: packCountQuery.isError,
            },
            {
                id: 'homework',
                label: 'ผู้ปกครองส่งงาน (30 วัน)',
                done: homeworkOk,
                detail: homeworkQuery.isError
                    ? 'โหลดข้อมูลไม่สำเร็จ'
                    : homework
                    ? `${homework.submissions} ส่ง · ${homework.withAttachment} แนบไฟล์`
                    : 'กำลังโหลด…',
                failed: homeworkQuery.isError,
            },
            {
                id: 'soft-gap',
                label: 'รีวิว soft-gap (ยังไม่มีเกม/สื่อ/ใบงาน)',
                done: false,
                detail: softGapQuery.isError
                    ? 'โหลดข้อมูลไม่สำเร็จ'
                    : softGap
                    ? `ขาดเกม ${softGap.noGame} · สื่อ ${softGap.noMedia} · ใบงาน ${softGap.noWorksheet} · ยังไม่ map ${softGap.unmapped}`
                    : 'กำลังโหลด…',
                ongoing: true,
                failed: softGapQuery.isError,
            },
        ];
    }, [habit, coverage, packCount, homework, softGap, habitQuery.isError, coverageQuery.isError, packCountQuery.isError, homeworkQuery.isError, softGapQuery.isError]);

    const phase16DoneCount = phase16Checklist.filter((c) => c.done).length;
    const phase16Queries = [habitQuery, coverageQuery, softGapQuery, packCountQuery, homeworkQuery];
    const hasPhase16QueryError = phase16Queries.some((query) => query.isError);
    const retryPhase16Queries = () => {
        void Promise.all(phase16Queries.map((query) => query.refetch()));
    };

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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">ภาพรวมระบบ</h1>
                    <p className="text-muted-foreground">
                        ข้อมูลเทคโนโลยี โครงสร้าง และฟีเจอร์ทั้งหมด · เวอร์ชันปัจจุบัน{' '}
                        <span className="font-medium text-foreground">{SYSTEM_OVERVIEW_META.version}</span>
                        {' · '}live{' '}
                        <a
                            href={SYSTEM_OVERVIEW_META.productionUrl}
                            className="text-primary underline-offset-2 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                        >
                            kampai-school.vercel.app
                        </a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        ตรวจ snapshot ระบบล่าสุด {SYSTEM_OVERVIEW_META.verifiedDate} · ตัวเลข schema เป็น snapshot และ KPI Phase 16 โหลดสดเมื่อเปิดหน้า
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap">
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
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Package, label: 'ชื่อโปรเจค', value: 'kampai-school' },
                        { icon: Rocket, label: 'เวอร์ชัน (Overview)', value: SYSTEM_OVERVIEW_META.version },
                        { icon: GitBranch, label: 'Repository', value: 'github.com/solamon2525/kampai-school' },
                        { icon: Globe, label: 'Hosting / Live', value: 'Vercel · kampai-school.vercel.app' },
                        { icon: Database, label: 'Database', value: `Supabase · ${SYSTEM_OVERVIEW_META.database.tables} tables · ${SYSTEM_OVERVIEW_META.database.views} views` },
                        { icon: HardDrive, label: 'Migrations', value: `production ${SYSTEM_OVERVIEW_META.database.appliedMigrations} · Git ${SYSTEM_OVERVIEW_META.database.trackedMigrationFiles} ไฟล์` },
                        { icon: Code2, label: 'ภาษาหลัก', value: 'TypeScript + PLpgSQL' },
                        { icon: Layers, label: 'Frontend Framework', value: 'React 18.3 + Vite 5' },
                        { icon: Shield, label: 'Auth & Security', value: 'Supabase Auth + RLS' },
                        { icon: Zap, label: 'Edge Functions', value: 'Deno (Supabase)' },
                        { icon: CheckCircle2, label: 'Feature catalog', value: `${featureCatalogStats.domains} โดเมน · ${featureCatalogStats.features} ฟีเจอร์ (SoT)` },
                        { icon: Lightbulb, label: 'โฟกัสปัจจุบัน', value: 'Phase 16 ops + harden ปี 1' },
                        { icon: Clock, label: 'ตรวจข้อมูลล่าสุด', value: SYSTEM_OVERVIEW_META.verifiedDate },
                    ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                            <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-medium text-foreground break-words">{item.value}</p>
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
                                <h4 className="font-semibold text-sm text-blue-600">Frontend</h4>
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
                                <h4 className="font-semibold text-sm text-green-600">Backend & Database</h4>
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
                                <h4 className="font-semibold text-sm text-emerald-600">Deployment & Hosting</h4>
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
                                <h4 className="font-semibold text-sm text-orange-600">Infrastructure</h4>
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

            {/* Section D: Feature catalog summary */}
            <Card>
                <CardHeader className="pb-3 space-y-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        บทสรุปฟีเจอร์ทั้งระบบ
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                        Inventory เชิงบริหาร — {featureCatalogStats.domains} โดเมน · {featureCatalogStats.features} ฟีเจอร์
                        (ใช้งานจริง {featureCatalogStats.live} · บางส่วน {featureCatalogStats.partial} · เลื่อนไว้ {featureCatalogStats.deferred})
                        · ไม่ใช่คู่มือผู้ใช้ทีละปุ่ม
                    </p>
                    <div className="relative max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={featureQuery}
                            onChange={(e) => setFeatureQuery(e.target.value)}
                            placeholder="ค้นหาชื่อฟีเจอร์ / คำอธิบาย / ไอเดีย…"
                            className="pl-8"
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Accordion type="multiple" className="w-full" defaultValue={filteredCatalog.slice(0, 2).map((d) => d.id)}>
                        {filteredCatalog.map((domain) => (
                            <AccordionItem key={domain.id} value={domain.id}>
                                <AccordionTrigger className="hover:no-underline text-left">
                                    <div className="flex flex-col gap-1 pr-2">
                                        <span className="font-semibold text-foreground">{domain.label}</span>
                                        <span className="text-xs text-muted-foreground font-normal line-clamp-2">
                                            {domain.summary} · {domain.features.length} รายการ
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-4 pt-1">
                                        {domain.features.map((f) => {
                                            const st = (f.status ?? 'live') as FeatureStatus;
                                            return (
                                                <li
                                                    key={f.name}
                                                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium text-sm">{f.name}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px]',
                                                                st === 'live' && 'border-emerald-300 text-emerald-800 bg-emerald-500/10',
                                                                st === 'partial' && 'border-amber-300 text-amber-900 bg-amber-500/10',
                                                                st === 'deferred' && 'border-border text-muted-foreground',
                                                            )}
                                                        >
                                                            {statusLabel[st]}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {f.canExtend ? 'พัฒนาต่อได้' : 'ยังไม่ขยาย / รอภายนอก'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{f.purpose}</p>
                                                    {f.extendNote && (
                                                        <p className="text-xs text-muted-foreground">
                                                            ขอบเขต: {f.extendNote}
                                                        </p>
                                                    )}
                                                    {f.ideas12m.length > 0 && (
                                                        <div>
                                                            <p className="text-[11px] font-semibold text-foreground mb-1">
                                                                ไอเดีย ~1 ปี
                                                            </p>
                                                            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                                                                {f.ideas12m.map((idea) => (
                                                                    <li key={idea}>{idea}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {f.ideas24m && f.ideas24m.length > 0 && (
                                                        <div>
                                                            <p className="text-[11px] font-semibold text-foreground mb-1">
                                                                ไอเดีย ~2 ปี
                                                            </p>
                                                            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                                                                {f.ideas24m.map((idea) => (
                                                                    <li key={idea}>{idea}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    {filteredCatalog.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">ไม่พบฟีเจอร์ตามคำค้น</p>
                    )}
                </CardContent>
            </Card>

            {/* Section D2: Long-term plan */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        แผนพัฒนาระยะยาว 1–2 ปี
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                        ธีมภาพรวม — รายละเอียดรายฟีเจอร์อยู่ในบทสรุปด้านบน · Phase 16 โค้ดพร้อมแล้ว เหลือ adoption/ops
                    </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {longTermPlan.map((year) => (
                        <div key={year.id} className="rounded-lg border border-border p-4 space-y-3">
                            <h3 className="font-semibold text-sm">{year.label}</h3>
                            {year.themes.map((theme) => (
                                <div key={theme.title}>
                                    <p className="text-xs font-semibold text-primary mb-1">{theme.title}</p>
                                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                                        {theme.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ))}
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
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{exportData.database.totalTables} Tables</div>
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{exportData.database.totalViews} Views</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">RLS {exportData.database.rlsTables}/{exportData.database.totalTables}</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">Production {exportData.database.appliedMigrations} migrations</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">Git {exportData.database.migrationFiles} ไฟล์</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">PostgreSQL via Supabase</div>
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm">ตรวจ {exportData.database.verifiedDate}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{exportData.database.note}</p>
                    <div className="grid gap-2 sm:grid-cols-2 mb-4 text-xs">
                        <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 break-all">
                            <span className="font-semibold text-foreground">Production ล่าสุด:</span>{' '}
                            <span className="text-muted-foreground">{exportData.database.latestProductionMigration}</span>
                        </p>
                        <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 break-all">
                            <span className="font-semibold text-foreground">Git ล่าสุด:</span>{' '}
                            <span className="text-muted-foreground">{exportData.database.latestRepositoryMigration}</span>
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                    <p className="text-xs text-muted-foreground mt-1">
                        รายการที่ยังไม่ ship หรือยังไม่ครบ — ของที่ขึ้น production แล้วดูที่บทสรุปฟีเจอร์ / ประวัติเวอร์ชัน
                    </p>
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
                        สถานะปัจจุบันถึง {SYSTEM_OVERVIEW_META.version} · ตรวจล่าสุด {SYSTEM_OVERVIEW_META.verifiedDate}
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

            {/* Section F2b: Phase 16 Ops live dashboard */}
            <Card className="border-amber-200/80 bg-amber-500/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CircleAlert className="w-5 h-5 text-amber-700" />
                                Phase 16 Ops — สถานะปิดงาน
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                โค้ดพร้อมแล้ว — ติดตาม adoption จริง · เช็กลิสต์ {phase16DoneCount}/{phase16Checklist.length} ผ่าน
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link to="/admin/dashboard/educational-hub?tab=games&coverage=1">
                                    Soft-gap
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link to="/admin/dashboard/educational-hub">
                                    คลังสื่อ
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link to="/teacher/edu-hub" target="_blank" rel="noreferrer">
                                    ครูอัปสื่อ
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {hasPhase16QueryError && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2" role="alert">
                            <p className="text-sm font-medium text-destructive">ข้อมูล KPI บางส่วนโหลดไม่สำเร็จ จึงไม่แสดงค่าศูนย์แทนผลจริง</p>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={retryPhase16Queries}>
                                <RefreshCw className="h-4 w-4" />
                                ลองใหม่ทั้งหมด
                            </Button>
                        </div>
                    )}
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {phase16Checklist.map((item) => (
                            <li
                                key={item.id}
                                className={cn(
                                    'flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm',
                                    item.done && 'bg-emerald-500/10',
                                    item.failed && 'border-destructive/40 bg-destructive/5',
                                    item.ongoing && !item.done && 'bg-secondary/40',
                                )}
                            >
                                {item.failed ? (
                                    <CircleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                ) : item.done ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                ) : item.ongoing ? (
                                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                ) : (
                                    <CircleAlert className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">ครู non-admin อัป (30 วัน)</p>
                            <OpsQueryState isLoading={habitQuery.isLoading} isError={habitQuery.isError} error={habitQuery.error} onRetry={() => { void habitQuery.refetch(); }}>
                                <p className="text-2xl font-bold text-foreground">
                                    {habit?.uploaderCount ?? 0}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        คน · {habit?.itemCount ?? 0} รายการ
                                    </span>
                                </p>
                            </OpsQueryState>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Coverage ตัวชี้วัด</p>
                            <OpsQueryState isLoading={coverageQuery.isLoading} isError={coverageQuery.isError} error={coverageQuery.error} onRetry={() => { void coverageQuery.refetch(); }}>
                                <p className="text-2xl font-bold text-foreground">
                                    {coverage?.pctCovered ?? 0}%
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        {coverage?.covered ?? 0}/{coverage?.totalIndicators ?? 0}
                                    </span>
                                </p>
                            </OpsQueryState>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Soft-gap (ทั้งหลักสูตร)</p>
                            <OpsQueryState isLoading={softGapQuery.isLoading} isError={softGapQuery.isError} error={softGapQuery.error} onRetry={() => { void softGapQuery.refetch(); }}>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    เกม {softGap?.noGame ?? 0} · สื่อ {softGap?.noMedia ?? 0} · ใบงาน {softGap?.noWorksheet ?? 0}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    ยังไม่ map {softGap?.unmapped ?? 0} ตัวชี้วัด
                                </p>
                            </OpsQueryState>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">การบ้าน 30 วัน</p>
                            <OpsQueryState isLoading={homeworkQuery.isLoading} isError={homeworkQuery.isError} error={homeworkQuery.error} onRetry={() => { void homeworkQuery.refetch(); }}>
                                <p className="text-2xl font-bold text-foreground">
                                    {homework?.submissions ?? 0}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">ส่งงาน</span>
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    มอบหมาย {homework?.assignments ?? 0} · แนบไฟล์ {homework?.withAttachment ?? 0}
                                </p>
                            </OpsQueryState>
                        </div>
                    </div>

                    {habit && habit.uploaders.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">ครูที่อัปล่าสุด (non-admin)</p>
                            <ul className="flex flex-wrap gap-3">
                                {habit.uploaders.slice(0, 8).map((u) => (
                                    <li key={u.staffId} className="flex items-center gap-2 text-sm">
                                        <PersonAvatar name={u.name} photoUrl={u.photoUrl} size="sm" />
                                        <span>
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-muted-foreground text-xs ml-1">({u.count})</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section F3: Media Roadmap Phase 11–16 */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Rocket className="w-5 h-5 text-primary" />
                        Roadmap คลังสื่อ+ใบงาน (Phase 11–16)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{mediaRoadmap.baseline}</p>
                    <p className="text-xs text-muted-foreground">{mediaRoadmap.target}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">ครู non-admin อัป (30 วัน)</p>
                            <OpsQueryState isLoading={habitQuery.isLoading} isError={habitQuery.isError} error={habitQuery.error} onRetry={() => { void habitQuery.refetch(); }}>
                                <p className="text-2xl font-bold text-foreground">
                                    {habit?.uploaderCount ?? 0}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        คน · {habit?.itemCount ?? 0} รายการ
                                    </span>
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {(habit?.uploaderCount ?? 0) > 0
                                        ? 'มีหลักฐานใช้งานแล้ว — คงกระตุ้นเป็นรายสัปดาห์'
                                        : 'ยังไม่มีหลักฐาน — ส่งคู่มือ W8 + /teacher/edu-hub ให้ครูทดลองอัป'}
                                </p>
                            </OpsQueryState>
                        </div>
                        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">ตัวชี้วัดที่มีสื่อ/เกมผูก</p>
                            <OpsQueryState isLoading={coverageQuery.isLoading} isError={coverageQuery.isError} error={coverageQuery.error} onRetry={() => { void coverageQuery.refetch(); }}>
                                <p className="text-2xl font-bold text-foreground">
                                    {coverage?.pctCovered ?? 0}%
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        {coverage?.covered ?? 0}/{coverage?.totalIndicators ?? 0}
                                    </span>
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    เป้า ≥80% · รายการที่ถูก map {coverage?.linkedItems ?? 0} ชิ้น · เติมต่อใน IndicatorCoverageDialog
                                </p>
                            </OpsQueryState>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {mediaRoadmap.phases.map((p) => (
                            <div key={p.phase} className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
                                <div className={`${p.badge} text-white px-4 py-2.5 flex items-center justify-between gap-2`}>
                                    <p className="text-sm font-bold">{p.phase}</p>
                                    <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs shrink-0">
                                        {p.status === 'done' ? 'เสร็จ' : p.status === 'now' ? 'กำลังทำ' : p.duration}
                                    </Badge>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="text-xs text-muted-foreground italic">🎯 {p.goal}</p>
                                    <Separator />
                                    <ul className="space-y-1.5">
                                        {p.items.map((item) => (
                                            <li key={item} className="text-sm text-foreground flex gap-2">
                                                <span className="text-muted-foreground">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
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
