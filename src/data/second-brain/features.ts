// ข้อมูล Features — kampai-school
// อัปเดต: 2026-09-22

export interface FeatureGroup {
  id: string;
  icon: string;
  title: string;
  color: string;
  features: string[];
}

export const featureGroups: FeatureGroup[] = [
  {
    id: 'public',
    icon: '🌐',
    title: 'เว็บไซต์สาธารณะ',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    features: [
      'ข่าวสาร + ปักหมุด + หมวดหมู่',
      'แกลเลอรี่ + Lightbox',
      'ปฏิทินกิจกรรม',
      'Hero Slides (Embla carousel)',
      'Custom Page Builder (About/Contact)',
      'Countdown นับถอยหลังเปิดเทอม',
      'Facebook Feed Sync',
      'SEO + PWA',
    ],
  },
  {
    id: 'admin',
    icon: '🔧',
    title: 'Admin Dashboard',
    color: 'bg-slate-50 border-slate-200 text-slate-800',
    features: [
      'Theme Manager + Menu Manager',
      'ฝ่ายวิชาการ 7 modules',
      'งานสารบรรณ (DocHub)',
      'งานบุคคล HR + PA Assessment',
      'พัสดุ/ครุภัณฑ์ + Digital Ops',
      'Analytics + Export CSV/PDF',
      'Command Palette (Cmd+K)',
      'Notification Center Realtime',
    ],
  },
  {
    id: 'games',
    icon: '🎮',
    title: 'คลังสื่อ & เกม',
    color: 'bg-violet-50 border-violet-200 text-violet-800',
    features: [
      '100+ เกมการศึกษา ทุกกลุ่มสาระ',
      'KAMPAI SDK — score, sound, AR',
      'AR Hand Tracking (MediaPipe)',
      'Online Multiplayer PvP',
      '500+ สื่อ/ใบงาน ป.1-6',
      'Thai Vocab Hub (2,400+ คำ)',
      'ตัวชี้วัด mapping + Coverage Map',
      'Lesson Packs + Homework',
    ],
  },
  {
    id: 'portals',
    icon: '👥',
    title: 'Portals (3 บทบาท)',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    features: [
      'Portal ครู — ตาราง, เช็คชื่อ, คะแนน',
      'Portal ผู้ปกครอง — ดูลูก, ส่งงาน',
      'Student Hero — XP, Daily Quests',
      'Mastery Portal — ตัวชี้วัดรายคน',
      'Chat ครู↔ผู้ปกครอง (Realtime)',
      'Conference Scheduling',
      'Student Pet System',
      'Online English Quest RPG',
    ],
  },
  {
    id: 'services',
    icon: '🌿',
    title: 'ระบบบริการ',
    color: 'bg-green-50 border-green-200 text-green-800',
    features: [
      'ธนาคารขยะ (QR + แต้ม + รางวัล)',
      'ธนาคารเงินออมนักเรียน',
      'ระบบบริจาค + PromptPay',
      'สุขภาพนักเรียน + รับ-ส่ง',
      'LINE Messaging API',
      'Push Notifications (web-push)',
      'PDPA Compliance',
      'Emergency Alerts',
    ],
  },
  {
    id: 'security',
    icon: '🔒',
    title: 'Security & Infrastructure',
    color: 'bg-rose-50 border-rose-200 text-rose-800',
    features: [
      'RLS ทุก table (100+ tables)',
      'JWT Claims (เร็วขึ้น ~10x)',
      'auth_role() / is_admin() helpers',
      '4 roles: admin/teacher/parent/viewer',
      'Vercel + Supabase Free Tier',
      'GitHub CI/CD Auto Deploy',
      'PWA kill-switch (?reset_sw=1)',
      '472 Database Migrations',
    ],
  },
];

export const projectStats = [
  { label: 'Database Migrations', value: '472', icon: '📊' },
  { label: 'Database Tables', value: '100+', icon: '🗄' },
  { label: 'เกมการศึกษา', value: '100+', icon: '🎮' },
  { label: 'สื่อ/ใบงาน', value: '500+', icon: '📚' },
  { label: 'Thai Vocab', value: '2,400+', icon: '🇹🇭' },
  { label: 'Routes (public+admin+portal)', value: '80+', icon: '🗺️' },
];
