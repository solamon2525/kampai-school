import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Database, Settings, Palette, Menu as MenuIcon, SlidersHorizontal,
  MessageCircle, Handshake, Newspaper, Image, Calendar, ClipboardList, MailOpen,
  SendHorizontal, Stamp, CalendarCheck, UserX, BookMarked, Award, BookOpen, History,
  Building2, Briefcase, Users, UserCog, GraduationCap, Recycle, Wallet, ClipboardCheck,
  PenLine, Star, FolderOpen, BarChart2, LayoutTemplate, FileText, Mail, HelpCircle,
  Info, Gift,
  // newly added admin routes (educational-hub, docs-hub family, system)
  Sparkles, Folder, DollarSign, FileCheck2, NotebookText, Target, Files, IdCard,
  Bell, QrCode,
} from 'lucide-react';

export type QuickMenuOption = {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  group: string;
};

export const ADMIN_QUICK_MENU_CATALOG: QuickMenuOption[] = [
  // หลัก
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/admin/dashboard', group: 'หลัก' },
  { id: 'dashboard-school', label: 'แดชบอร์ดโรงเรียน', icon: Database, path: '/admin/dashboard/dashboard-school', group: 'หลัก' },

  // เว็บไซต์
  { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/admin/dashboard/settings', group: 'เว็บไซต์' },
  { id: 'theme', label: 'ธีมสี', icon: Palette, path: '/admin/dashboard/theme', group: 'เว็บไซต์' },
  { id: 'menu', label: 'เมนูเว็บไซต์', icon: MenuIcon, path: '/admin/dashboard/menu', group: 'เว็บไซต์' },
  { id: 'hero-slides', label: 'Hero Slides', icon: SlidersHorizontal, path: '/admin/dashboard/hero-slides', group: 'เว็บไซต์' },
  { id: 'testimonials', label: 'Testimonials', icon: MessageCircle, path: '/admin/dashboard/testimonials', group: 'เว็บไซต์' },
  { id: 'partners', label: 'พันธมิตร', icon: Handshake, path: '/admin/dashboard/partners', group: 'เว็บไซต์' },
  { id: 'news', label: 'ข่าวสาร', icon: Newspaper, path: '/admin/dashboard/news', group: 'เว็บไซต์' },
  { id: 'gallery', label: 'แกลเลอรี่', icon: Image, path: '/admin/dashboard/gallery', group: 'เว็บไซต์' },
  { id: 'events', label: 'ปฏิทิน', icon: Calendar, path: '/admin/dashboard/events', group: 'เว็บไซต์' },
  { id: 'educational-hub', label: 'คลังสื่อและเกม', icon: Sparkles, path: '/admin/dashboard/educational-hub', group: 'เว็บไซต์' },

  // ศูนย์เอกสาร (docs-hub family, v1.19.x — เพิ่งเพิ่ม)
  { id: 'docs-hub', label: 'ศูนย์เอกสาร', icon: Folder, path: '/admin/dashboard/docs-hub', group: 'ศูนย์เอกสาร' },
  { id: 'budget', label: 'งบประมาณ', icon: DollarSign, path: '/admin/dashboard/budget', group: 'ศูนย์เอกสาร' },
  { id: 'sar', label: 'SAR (รายงานประจำปี)', icon: FileCheck2, path: '/admin/dashboard/sar', group: 'ศูนย์เอกสาร' },
  { id: 'ics', label: 'ICS (แผนการเรียนรู้)', icon: NotebookText, path: '/admin/dashboard/ics', group: 'ศูนย์เอกสาร' },
  { id: 'action-plan', label: 'แผนปฏิบัติการ', icon: Target, path: '/admin/dashboard/action-plan', group: 'ศูนย์เอกสาร' },
  { id: 'doc-templates', label: 'แม่แบบเอกสาร', icon: Files, path: '/admin/dashboard/doc-templates', group: 'ศูนย์เอกสาร' },
  { id: 'student-docs', label: 'เอกสารนักเรียน 360°', icon: IdCard, path: '/admin/dashboard/student-docs', group: 'ศูนย์เอกสาร' },

  // งานสารบรรณ
  { id: 'saraban', label: 'สารบรรณ — ภาพรวม', icon: ClipboardList, path: '/admin/dashboard/saraban', group: 'งานสารบรรณ' },
  { id: 'incoming-letters', label: 'หนังสือรับ', icon: MailOpen, path: '/admin/dashboard/incoming-letters', group: 'งานสารบรรณ' },
  { id: 'outgoing-letters', label: 'หนังสือส่ง', icon: SendHorizontal, path: '/admin/dashboard/outgoing-letters', group: 'งานสารบรรณ' },
  { id: 'orders', label: 'คำสั่ง/ประกาศ', icon: Stamp, path: '/admin/dashboard/orders', group: 'งานสารบรรณ' },
  { id: 'meetings', label: 'การประชุม', icon: CalendarCheck, path: '/admin/dashboard/meetings', group: 'งานสารบรรณ' },

  // บุคลากร (HR)
  { id: 'leave', label: 'การลา', icon: UserX, path: '/admin/dashboard/leave', group: 'บุคลากร (HR)' },
  { id: 'training', label: 'การอบรม', icon: BookMarked, path: '/admin/dashboard/training', group: 'บุคลากร (HR)' },
  { id: 'pa', label: 'PA Assessment', icon: Award, path: '/admin/dashboard/pa', group: 'บุคลากร (HR)' },

  // ฝ่ายวิชาการ
  { id: 'academic', label: 'ฝ่ายวิชาการ', icon: BookOpen, path: '/admin/dashboard/academic', group: 'ฝ่ายวิชาการ' },

  // ข้อมูลโรงเรียน
  { id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard/milestones', group: 'ข้อมูลโรงเรียน' },
  { id: 'facilities', label: 'สิ่งอำนวยความสะดวก', icon: Building2, path: '/admin/dashboard/facilities', group: 'ข้อมูลโรงเรียน' },
  { id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard/staff', group: 'ข้อมูลโรงเรียน' },
  { id: 'teachers', label: 'รายชื่อครู', icon: Users, path: '/admin/dashboard/teachers', group: 'ข้อมูลโรงเรียน' },
  { id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard/administrators', group: 'ข้อมูลโรงเรียน' },
  { id: 'students', label: 'นักเรียน', icon: GraduationCap, path: '/admin/dashboard/students', group: 'ข้อมูลโรงเรียน' },
  { id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard/curriculum', group: 'ข้อมูลโรงเรียน' },
  { id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard/activities', group: 'ข้อมูลโรงเรียน' },

  // ระบบบริการ
  { id: 'waste-bank', label: 'ธนาคารขยะ', icon: Recycle, path: '/admin/dashboard/waste-bank', group: 'ระบบบริการ' },
  { id: 'savings-bank', label: 'ธนาคารพอเพียง', icon: Wallet, path: '/admin/dashboard/savings-bank', group: 'ระบบบริการ' },
  { id: 'attendance', label: 'เช็คชื่อนักเรียน', icon: ClipboardCheck, path: '/admin/dashboard/attendance', group: 'ระบบบริการ' },
  { id: 'scores', label: 'คะแนนเก็บ', icon: PenLine, path: '/admin/dashboard/scores', group: 'ระบบบริการ' },
  { id: 'conduct', label: 'Kampai Hero System', icon: Star, path: '/admin/dashboard/conduct', group: 'ระบบบริการ' },
  { id: 'documents', label: 'จัดการเอกสาร', icon: FolderOpen, path: '/admin/dashboard/documents', group: 'ระบบบริการ' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/admin/dashboard/analytics', group: 'ระบบบริการ' },
  { id: 'page-builder', label: 'Page Builder', icon: LayoutTemplate, path: '/admin/page-builder', group: 'ระบบบริการ' },
  { id: 'scan', label: 'สแกน QR', icon: QrCode, path: '/admin/dashboard/scan', group: 'ระบบบริการ' },

  // อื่นๆ
  { id: 'admissions', label: 'ใบสมัคร', icon: FileText, path: '/admin/dashboard/admissions', group: 'อื่นๆ' },
  { id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard/messages', group: 'อื่นๆ' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, path: '/admin/dashboard/faq', group: 'อื่นๆ' },

  // ระบบ
  { id: 'system-overview', label: 'ภาพรวมระบบ', icon: Info, path: '/admin/dashboard/system-overview', group: 'ระบบ' },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, path: '/admin/dashboard/notifications', group: 'ระบบ' },
];

export const TEACHER_QUICK_MENU_CATALOG: QuickMenuOption[] = [
  { id: 'schedule', label: 'ตารางสอน', icon: Calendar, path: '/teacher/schedule', group: 'งานครู' },
  { id: 'attendance', label: 'เช็คชื่อ', icon: ClipboardCheck, path: '/teacher/attendance', group: 'งานครู' },
  { id: 'scores', label: 'คะแนน', icon: PenLine, path: '/teacher/scores', group: 'งานครู' },
  { id: 'rewards', label: 'อนุมัติรางวัล', icon: Gift, path: '/teacher/rewards-approval', group: 'งานครู' },
];

export const DEFAULT_ADMIN_IDS = ['news', 'gallery', 'events', 'settings'];
export const DEFAULT_TEACHER_IDS = ['schedule', 'attendance', 'scores', 'rewards'];

export const getCatalog = (context: 'admin' | 'teacher'): QuickMenuOption[] =>
  context === 'admin' ? ADMIN_QUICK_MENU_CATALOG : TEACHER_QUICK_MENU_CATALOG;

export const getDefaultIds = (context: 'admin' | 'teacher'): string[] =>
  context === 'admin' ? DEFAULT_ADMIN_IDS : DEFAULT_TEACHER_IDS;
