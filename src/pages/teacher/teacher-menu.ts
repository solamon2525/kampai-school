import { LayoutDashboard, ClipboardCheck, PenLine, Calendar, Gift, FolderOpen, QrCode, Video, FlaskConical, Package, Trophy } from 'lucide-react';

export const TEACHER_MENU = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/teacher' },
  { id: 'schedule', label: 'ตารางสอน', icon: Calendar, path: '/teacher/schedule' },
  { id: 'attendance', label: 'เช็คชื่อ', icon: ClipboardCheck, path: '/teacher/attendance' },
  { id: 'scores', label: 'คะแนน', icon: PenLine, path: '/teacher/scores' },
  { id: 'competitions', label: 'แข่งใบงานสด', icon: Trophy, path: '/teacher/classroom-competitions' },
  { id: 'rewards', label: 'อนุมัติรางวัล', icon: Gift, path: '/teacher/rewards-approval' },
  { id: 'supplies', label: 'เบิกพัสดุ', icon: Package, path: '/teacher/supplies' },
  { id: 'edu-hub', label: 'คลังสื่อของฉัน', icon: FolderOpen, path: '/teacher/edu-hub' },
  { id: 'game-research', label: 'วิจัยเกม', icon: FlaskConical, path: '/teacher/game-research' },
  { id: 'cctv', label: 'กล้องวงจรปิด', icon: Video, path: '/teacher/cctv' },
  { id: 'scan', label: 'สแกนด่วน', icon: QrCode, path: '/admin/dashboard/scan' },
];
