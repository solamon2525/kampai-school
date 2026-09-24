// ข้อมูล Roadmap — kampai-school
// อัปเดต: 2026-09-22

export interface RoadmapMilestone {
  version: string;
  title: string;
  date?: string;
  highlights: string[];
  icon: string;
  status: 'done' | 'in-progress' | 'planned';
}

export const roadmapMilestones: RoadmapMilestone[] = [
  {
    version: 'v1.0',
    title: 'Initial Launch',
    highlights: ['React + Supabase + หน้าสาธารณะ', 'ข่าว, แกลเลอรี่, บุคลากร, ติดต่อ', 'ระบบ Auth + Admin'],
    icon: '🚀',
    status: 'done',
  },
  {
    version: 'v1.1–1.2',
    title: 'Visual Homepage Builder',
    highlights: ['Drag & Drop Block Palette', 'Live Preview 3 คอลัมน์', 'Cross-Zone movement'],
    icon: '🏗️',
    status: 'done',
  },
  {
    version: 'v1.3',
    title: 'ฝ่ายวิชาการ',
    highlights: ['7 modules: ตารางสอน, แผนการสอน, สื่อ, ปฏิทิน, แนะแนว, นิเทศ, นักเรียนพิเศษ', 'Export CSV + Print'],
    icon: '🎓',
    status: 'done',
  },
  {
    version: 'v1.4',
    title: 'Security + Portals',
    highlights: ['RLS 45+ tables', 'Portal ครู + ผู้ปกครอง', 'Notification Center Realtime'],
    icon: '🔒',
    status: 'done',
  },
  {
    version: 'v1.5',
    title: 'UX/UI Sprint',
    highlights: ['Framer Motion animations', 'Skeleton Loaders + EmptyState', 'PWA + Light-only design'],
    icon: '✨',
    status: 'done',
  },
  {
    version: 'v1.6',
    title: 'Waste Bank Refactor',
    highlights: ['Items + Points system', 'QR Code Flow (นักเรียนโชว์ ครูสแกน)', 'Rewards + Leaderboard'],
    icon: '♻️',
    status: 'done',
  },
  {
    version: 'v1.7–1.8',
    title: 'Design System',
    highlights: ['Theme Manager + Menu Manager', 'Custom Page Builder (About/Contact)', 'DESIGN.md v2 — 9 UX Rules'],
    icon: '🎨',
    status: 'done',
  },
  {
    version: 'v1.100–1.150',
    title: 'Educational Hub (เกม)',
    highlights: ['KAMPAI SDK — score, leaderboard, sound', '50+ เกมการศึกษา', 'AR Hand Tracking (kampai-hands.js)', 'Online Multiplayer PvP'],
    icon: '🎮',
    status: 'done',
  },
  {
    version: 'v1.151–1.180',
    title: 'คลังสื่อ + ตัวชี้วัด',
    highlights: ['500+ สื่อ/ใบงาน ทุกกลุ่มสาระ ป.1-6', 'Thai Vocab Hub 2,400+ คำ', 'ตัวชี้วัด mapping ครบ', 'Coverage Map'],
    icon: '📚',
    status: 'done',
  },
  {
    version: 'v1.181–1.204',
    title: 'Platform Completeness',
    highlights: ['Chat ครู↔ผู้ปกครอง', 'Homework Portal + แนบไฟล์', 'Donations + บริจาค', 'PDPA Compliance', 'LINE + Push Notifications'],
    icon: '💬',
    status: 'done',
  },
  {
    version: 'v1.205–1.209',
    title: 'Ops & Phase 16',
    highlights: ['Supplies/พัสดุ + คืนพัสดุ', 'Digital Ops Suite ลดภาระครู', 'Ops Dashboard Phase 16', 'Teacher Pending Tasks + Cmd+K'],
    icon: '⚙️',
    status: 'done',
  },
  {
    version: 'ถัดไป',
    title: 'Year 1 Harden',
    highlights: ['ซ้อมแจ้งเตือนฉุกเฉิน', 'PDPA กิจวัตร', 'ครู non-admin อัปสื่อ ≥1 คน', 'Soft-gap รีวิวต่อเนื่อง'],
    icon: '🏫',
    status: 'in-progress',
  },
  {
    version: 'ปีถัดไป',
    title: 'External Integrations',
    highlights: ['e-Donation API (กรมสรรพากร)', 'SIS/EMIS sync', 'i18n ครบทั้งเว็บ', 'Google Calendar sync'],
    icon: '🌐',
    status: 'planned',
  },
];
