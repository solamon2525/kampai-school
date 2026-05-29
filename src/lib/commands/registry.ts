/**
 * Command Palette static registry
 * Commands grouped + role-filtered. Search results (students/news/staff)
 * are added dynamically by CommandPalette via global-search.service.
 */
import {
  Home,
  Newspaper,
  Calendar,
  Image as ImageIcon,
  GraduationCap,
  Briefcase,
  Recycle,
  Wallet,
  Award,
  BookOpen,
  Gamepad2,
  LayoutDashboard,
  Settings,
  ClipboardCheck,
  ClipboardList,
  PenLine,
  Users,
  FileText,
  QrCode,
  Star,
  BarChart2,
  Sparkles,
  LogOut,
  Facebook,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

export type CommandRole = 'admin' | 'teacher' | 'parent' | 'public';

export type CommandAction =
  | { type: 'navigate'; path: string }
  | { type: 'function'; fn: () => void | Promise<void> };

export interface CommandEntry {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  icon: LucideIcon;
  /** ถ้าไม่ระบุ = ทุก role เห็น (รวม public) */
  roles?: CommandRole[];
  action: CommandAction;
  shortcut?: string;
}

export const STATIC_COMMANDS: CommandEntry[] = [
  // ── ไปยัง (Public) ────────────────────────────────────────
  { id: 'go-home', label: 'หน้าแรก', group: 'ไปยังหน้า', icon: Home, keywords: ['home'], action: { type: 'navigate', path: '/' } },
  { id: 'go-news', label: 'ข่าวสาร', group: 'ไปยังหน้า', icon: Newspaper, keywords: ['news'], action: { type: 'navigate', path: '/news' } },
  { id: 'go-events', label: 'ปฏิทินกิจกรรม', group: 'ไปยังหน้า', icon: Calendar, keywords: ['events', 'calendar'], action: { type: 'navigate', path: '/events' } },
  { id: 'go-gallery', label: 'แกลเลอรี่', group: 'ไปยังหน้า', icon: ImageIcon, keywords: ['gallery', 'photo'], action: { type: 'navigate', path: '/gallery' } },
  { id: 'go-staff', label: 'ครู/บุคลากร', group: 'ไปยังหน้า', icon: Briefcase, keywords: ['staff', 'teacher'], action: { type: 'navigate', path: '/staff' } },
  { id: 'go-curriculum', label: 'หลักสูตร', group: 'ไปยังหน้า', icon: BookOpen, keywords: ['curriculum'], action: { type: 'navigate', path: '/curriculum' } },
  { id: 'go-savings', label: 'ธนาคารพอเพียง', group: 'ไปยังหน้า', icon: Wallet, keywords: ['savings'], action: { type: 'navigate', path: '/savings-bank' } },
  { id: 'go-waste', label: 'ธนาคารขยะ', group: 'ไปยังหน้า', icon: Recycle, keywords: ['waste', 'recycle'], action: { type: 'navigate', path: '/waste-bank' } },
  { id: 'go-rewards', label: 'ของรางวัล', group: 'ไปยังหน้า', icon: Award, keywords: ['rewards'], action: { type: 'navigate', path: '/waste-bank/rewards' } },
  { id: 'go-edu-hub', label: 'คลังสื่อ/เกม', group: 'ไปยังหน้า', icon: Sparkles, keywords: ['edu', 'hub', 'games'], action: { type: 'navigate', path: '/educational-hub' } },
  { id: 'go-enrollment', label: 'สมัครเข้าเรียน', group: 'ไปยังหน้า', icon: GraduationCap, keywords: ['enroll', 'apply'], action: { type: 'navigate', path: '/enrollment' } },
  { id: 'go-donate', label: 'ร่วมบริจาคให้โรงเรียน', group: 'ไปยังหน้า', icon: Award, keywords: ['donate', 'fundraise', 'promptpay', 'บริจาค'], action: { type: 'navigate', path: '/donate' } },
  { id: 'go-alumni', label: 'เครือข่ายศิษย์เก่า', group: 'ไปยังหน้า', icon: GraduationCap, keywords: ['alumni', 'reunion', 'ศิษย์เก่า'], action: { type: 'navigate', path: '/alumni' } },

  // ── Admin ────────────────────────────────────────────────
  { id: 'adm-dashboard', label: 'แดชบอร์ดผู้ดูแล', group: 'แอดมิน', icon: LayoutDashboard, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard' } },
  { id: 'adm-news', label: 'จัดการข่าวสาร', group: 'แอดมิน', icon: Newspaper, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/news' } },
  { id: 'adm-news-new', label: 'เพิ่มข่าวใหม่', group: 'แอดมิน', icon: Newspaper, roles: ['admin'], keywords: ['add', 'create', 'new'], action: { type: 'navigate', path: '/admin/dashboard/news?new=1' } },
  { id: 'adm-students', label: 'จัดการนักเรียน', group: 'แอดมิน', icon: GraduationCap, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/students' } },
  { id: 'adm-staff', label: 'จัดการครู/บุคลากร', group: 'แอดมิน', icon: Briefcase, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/staff' } },
  { id: 'adm-attendance', label: 'เช็คชื่อนักเรียน', group: 'แอดมิน', icon: ClipboardCheck, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/attendance' } },
  { id: 'adm-scores', label: 'คะแนนเก็บ', group: 'แอดมิน', icon: PenLine, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/scores' } },
  { id: 'adm-conduct', label: 'Kampai Hero (ความประพฤติ)', group: 'แอดมิน', icon: Star, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/conduct' } },
  { id: 'adm-waste', label: 'ธนาคารขยะ (admin)', group: 'แอดมิน', icon: Recycle, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/waste-bank' } },
  { id: 'adm-savings', label: 'ธนาคารพอเพียง (admin)', group: 'แอดมิน', icon: Wallet, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/savings-bank' } },
  { id: 'adm-scan', label: 'สแกน QR ด่วน', group: 'แอดมิน', icon: QrCode, roles: ['admin', 'teacher'], shortcut: '⌃⇧S', action: { type: 'navigate', path: '/admin/dashboard/scan' } },
  { id: 'adm-docs-hub', label: 'ศูนย์เอกสาร', group: 'แอดมิน', icon: FileText, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/docs-hub' } },
  { id: 'adm-games', label: 'การเล่นเกม (analytics)', group: 'แอดมิน', icon: Gamepad2, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/games' } },
  { id: 'adm-analytics', label: 'Analytics', group: 'แอดมิน', icon: BarChart2, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/analytics' } },
  { id: 'adm-settings', label: 'ตั้งค่าระบบ', group: 'แอดมิน', icon: Settings, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/settings' } },
  { id: 'adm-system', label: 'ภาพรวมระบบ (Version)', group: 'แอดมิน', icon: Sparkles, roles: ['admin'], action: { type: 'navigate', path: '/admin/dashboard/system-overview' } },
  { id: 'adm-ai-assist', label: 'AI ผู้ช่วยครู (Claude)', group: 'แอดมิน', icon: Sparkles, roles: ['admin', 'teacher'], keywords: ['ai', 'claude', 'lesson', 'exam', 'comment', 'gpt'], action: { type: 'navigate', path: '/admin/dashboard/ai-assist' } },
  { id: 'adm-line', label: 'LINE OA — ผู้ติดตาม', group: 'แอดมิน', icon: Sparkles, roles: ['admin'], keywords: ['line', 'oa', 'message', 'notify', 'broadcast'], action: { type: 'navigate', path: '/admin/dashboard/line' } },
  { id: 'adm-facebook-feed', label: 'ฟีดข่าว Facebook — ตั้งค่า', group: 'แอดมิน', icon: Facebook, roles: ['admin'], keywords: ['facebook', 'feed', 'page', 'token', 'social', 'fb'], action: { type: 'navigate', path: '/admin/dashboard/facebook-feed' } },
  { id: 'adm-tip-prompt', label: 'Tip Prompt — คลังคำสั่ง/prompt', group: 'แอดมิน', icon: Lightbulb, roles: ['admin'], keywords: ['tip', 'prompt', 'guide', 'help', 'snippet', 'slash', 'command'], action: { type: 'navigate', path: '/admin/dashboard/tip-prompt' } },
  { id: 'adm-health', label: 'สุขภาพนักเรียน (น้ำหนัก/วัคซีน)', group: 'แอดมิน', icon: Award, roles: ['admin', 'teacher'], keywords: ['health', 'weight', 'height', 'vaccine', 'bmi'], action: { type: 'navigate', path: '/admin/dashboard/health' } },
  { id: 'adm-dmc', label: 'DMC Export (สพฐ.)', group: 'แอดมิน', icon: FileText, roles: ['admin'], keywords: ['dmc', 'emis', 'moe', 'export', 'excel'], action: { type: 'navigate', path: '/admin/dashboard/dmc-export' } },
  { id: 'adm-pdpa', label: 'PDPA Compliance', group: 'แอดมิน', icon: Sparkles, roles: ['admin'], keywords: ['pdpa', 'consent', 'privacy', 'audit', 'erasure'], action: { type: 'navigate', path: '/admin/dashboard/pdpa' } },
  { id: 'adm-emergency', label: 'แจ้งเตือนฉุกเฉิน (Push + LINE)', group: 'แอดมิน', icon: Sparkles, roles: ['admin'], keywords: ['emergency', 'alert', 'broadcast', 'urgent', 'ฉุกเฉิน'], action: { type: 'navigate', path: '/admin/dashboard/emergency' } },
  { id: 'adm-donations', label: 'รับบริจาค (PromptPay)', group: 'แอดมิน', icon: Award, roles: ['admin'], keywords: ['donate', 'fundraise', 'promptpay', 'qr', 'บริจาค'], action: { type: 'navigate', path: '/admin/dashboard/donations' } },
  { id: 'adm-dismissal', label: 'ระบบรับ-ส่งนักเรียน', group: 'แอดมิน', icon: ClipboardCheck, roles: ['admin', 'teacher'], keywords: ['pickup', 'dismissal', 'bus', 'รับ', 'ส่ง'], action: { type: 'navigate', path: '/admin/dashboard/dismissal' } },
  { id: 'adm-surveys', label: 'แบบสำรวจ', group: 'แอดมิน', icon: ClipboardList, roles: ['admin'], keywords: ['survey', 'feedback', 'nps', 'แบบสำรวจ'], action: { type: 'navigate', path: '/admin/dashboard/surveys' } },
  { id: 'adm-alumni', label: 'ศิษย์เก่า (จัดการ)', group: 'แอดมิน', icon: GraduationCap, roles: ['admin'], keywords: ['alumni', 'verify', 'reunion', 'ศิษย์เก่า'], action: { type: 'navigate', path: '/admin/dashboard/alumni' } },
  { id: 'adm-class-photos', label: 'รูปห้อง + แท็กหน้า', group: 'แอดมิน', icon: ImageIcon, roles: ['admin', 'teacher'], keywords: ['photo', 'tag', 'class', 'รูป'], action: { type: 'navigate', path: '/admin/dashboard/class-photos' } },
  { id: 'adm-papor', label: 'สร้างเอกสาร ปพ.5 / ปพ.6', group: 'แอดมิน', icon: FileText, roles: ['admin', 'teacher'], keywords: ['papor', 'transcript', 'report', 'card', 'ปพ', 'สมุดพก', 'pdf'], action: { type: 'navigate', path: '/admin/dashboard/papor' } },

  // ── Teacher ──────────────────────────────────────────────
  { id: 't-dashboard', label: 'แดชบอร์ดครู', group: 'พอร์ทัลครู', icon: LayoutDashboard, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher' } },
  { id: 't-schedule', label: 'ตารางสอน', group: 'พอร์ทัลครู', icon: Calendar, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher/schedule' } },
  { id: 't-attendance', label: 'เช็คชื่อ (ครู)', group: 'พอร์ทัลครู', icon: ClipboardCheck, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher/attendance' } },
  { id: 't-scores', label: 'บันทึกคะแนน', group: 'พอร์ทัลครู', icon: PenLine, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher/scores' } },
  { id: 't-rewards', label: 'อนุมัติของรางวัล', group: 'พอร์ทัลครู', icon: Award, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher/rewards-approval' } },
  { id: 't-edu-hub', label: 'จัดการคลังสื่อของฉัน', group: 'พอร์ทัลครู', icon: Sparkles, roles: ['teacher', 'admin'], action: { type: 'navigate', path: '/teacher/edu-hub' } },
  { id: 't-assignments', label: 'จัดการการบ้าน', group: 'พอร์ทัลครู', icon: ClipboardCheck, roles: ['teacher', 'admin'], keywords: ['homework', 'assignment', 'การบ้าน'], action: { type: 'navigate', path: '/teacher/assignments' } },
  { id: 't-conferences', label: 'ตารางนัดผู้ปกครอง', group: 'พอร์ทัลครู', icon: Calendar, roles: ['teacher', 'admin'], keywords: ['conference', 'slot', 'นัด'], action: { type: 'navigate', path: '/teacher/conferences' } },

  // ── Parent ───────────────────────────────────────────────
  { id: 'p-dashboard', label: 'แดชบอร์ดผู้ปกครอง', group: 'พอร์ทัลผู้ปกครอง', icon: LayoutDashboard, roles: ['parent', 'admin'], action: { type: 'navigate', path: '/parent' } },
  { id: 'p-attendance', label: 'การเข้าเรียนของบุตร', group: 'พอร์ทัลผู้ปกครอง', icon: ClipboardCheck, roles: ['parent', 'admin'], action: { type: 'navigate', path: '/parent/attendance' } },
  { id: 'p-scores', label: 'คะแนนของบุตร', group: 'พอร์ทัลผู้ปกครอง', icon: PenLine, roles: ['parent', 'admin'], action: { type: 'navigate', path: '/parent/scores' } },
  { id: 'p-conduct', label: 'ความประพฤติของบุตร', group: 'พอร์ทัลผู้ปกครอง', icon: Star, roles: ['parent', 'admin'], action: { type: 'navigate', path: '/parent/conduct' } },
  { id: 'p-savings', label: 'ธนาคารของบุตร', group: 'พอร์ทัลผู้ปกครอง', icon: Wallet, roles: ['parent', 'admin'], action: { type: 'navigate', path: '/parent/savings-bank' } },
  { id: 'p-privacy', label: 'ความเป็นส่วนตัว (PDPA)', group: 'พอร์ทัลผู้ปกครอง', icon: Sparkles, roles: ['parent', 'admin'], keywords: ['privacy', 'consent', 'erasure', 'pdpa'], action: { type: 'navigate', path: '/parent/privacy' } },
  { id: 'p-chat', label: 'แชตกับครู', group: 'พอร์ทัลผู้ปกครอง', icon: Sparkles, roles: ['parent', 'admin'], keywords: ['chat', 'message', 'teacher', 'แชต'], action: { type: 'navigate', path: '/parent/chat' } },
  { id: 't-chat', label: 'แชตกับผู้ปกครอง', group: 'พอร์ทัลครู', icon: Sparkles, roles: ['teacher', 'admin'], keywords: ['chat', 'message', 'parent', 'แชต'], action: { type: 'navigate', path: '/teacher/chat' } },
  { id: 'p-assignments', label: 'การบ้านของบุตร', group: 'พอร์ทัลผู้ปกครอง', icon: ClipboardCheck, roles: ['parent', 'admin'], keywords: ['homework', 'การบ้าน'], action: { type: 'navigate', path: '/parent/assignments' } },
  { id: 'p-conferences', label: 'จองนัดครู', group: 'พอร์ทัลผู้ปกครอง', icon: Calendar, roles: ['parent', 'admin'], keywords: ['book', 'conference', 'นัด', 'จอง'], action: { type: 'navigate', path: '/parent/conferences' } },
];

/** Filter visible commands based on the user's effective role. */
export function getVisibleCommands(role: CommandRole | null): CommandEntry[] {
  return STATIC_COMMANDS.filter((c) => {
    if (!c.roles) return true; // public — visible to everyone
    if (!role) return false; // restricted commands hidden when not logged in
    if (role === 'admin') return true; // admin sees everything
    return c.roles.includes(role);
  });
}
