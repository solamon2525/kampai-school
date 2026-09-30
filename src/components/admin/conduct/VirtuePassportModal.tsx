import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QRCode from 'react-qr-code';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { conductService, type HeroProfile } from '@/services/conduct.service';
import { Printer, BookOpen, Filter, Loader2, Sparkles } from 'lucide-react';
import { CertificateStudent } from './VirtueCertificateModal';

interface VirtuePassportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: CertificateStudent[];
  initialStudentId?: string | null;
  academicYear?: string;
  semester?: string;
}

const toThaiNumerals = (val: number | string): string => {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(val).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
};

export const VirtuePassportModal: React.FC<VirtuePassportModalProps> = ({
  open,
  onOpenChange,
  students,
  initialStudentId,
  academicYear = (new Date().getFullYear() + 543).toString(),
  semester = '1',
}) => {
  const [filterMode, setFilterMode] = useState<string>(
    initialStudentId ? `single:${initialStudentId}` : 'all'
  );
  const [singleStudentId, setSingleStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? '')
  );
  const [profiles, setProfiles] = useState<Record<string, HeroProfile>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Synchronize when initialStudentId changes
  useEffect(() => {
    if (initialStudentId) {
      setFilterMode(`single:${initialStudentId}`);
      setSingleStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Determine students to display/print
  const targetStudents = useMemo(() => {
    if (filterMode.startsWith('single:')) {
      const sId = filterMode.split(':')[1] || singleStudentId;
      return students.filter((s) => s.id === sId);
    }
    return students;
  }, [students, filterMode, singleStudentId]);

  // Fetch Hero Profiles for target students
  useEffect(() => {
    if (!open || targetStudents.length === 0) return;

    let isMounted = true;
    const fetchProfiles = async () => {
      setLoading(true);
      const newProfiles: Record<string, HeroProfile> = { ...profiles };
      const missing = targetStudents.filter((s) => !newProfiles[s.id]);

      if (missing.length > 0) {
        try {
          const results = await Promise.all(
            missing.map((s) => conductService.getHeroProfile(s.id))
          );
          results.forEach((prof, idx) => {
            newProfiles[missing[idx].id] = prof;
          });
          if (isMounted) {
            setProfiles(newProfiles);
          }
        } catch (err) {
          console.error('Error fetching hero profiles for passport:', err);
        }
      }
      if (isMounted) setLoading(false);
    };

    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, [open, targetStudents]);

  const handlePrint = () => {
    window.print();
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kampai-school.vercel.app';

  return (
    <>
      {/* ── Print CSS Rules strictly scoping to A4 Portrait ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-virtue-passports, #print-virtue-passports * {
            visibility: visible !important;
          }
          #print-virtue-passports {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            display: block !important;
            background: #ffffff !important;
          }
          .passport-sheet {
            width: 210mm !important;
            height: 296.5mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            overflow: hidden !important;
          }
          .passport-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* ── Dialog UI ── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
              <BookOpen className="w-6 h-6 text-primary" />
              สมุดพาสปอร์ตความดีดิจิทัล (A4 แนวตั้ง)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              เอกสารสรุปผลการพัฒนาคุณธรรม 5 มิติ ประจำตัวนักเรียน พร้อมสถิติบูรณาการธนาคารขยะและธนาคารพอเพียง
            </DialogDescription>
          </DialogHeader>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> เลือกนักเรียนที่ต้องการพิมพ์
              </Label>
              <Select
                value={filterMode.startsWith('single:') ? 'single' : filterMode}
                onValueChange={(val) => {
                  if (val === 'single') {
                    setFilterMode(`single:${singleStudentId || students[0]?.id}`);
                  } else {
                    setFilterMode(val);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="เลือกกลุ่มนักเรียน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">พิมพ์เฉพาะรายบุคคล (เลือกชื่อ)</SelectItem>
                  <SelectItem value="all">พิมพ์ทุกคนในห้อง ({students.length} คน)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode.startsWith('single') && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">เลือกนักเรียน</Label>
                <Select
                  value={singleStudentId}
                  onValueChange={(val) => {
                    setSingleStudentId(val);
                    setFilterMode(`single:${val}`);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="ค้นหาหรือเลือกชื่อนักเรียน" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.totalScore} คะแนน)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
            <span>
              พร้อมพิมพ์ทั้งหมด <strong className="font-extrabold text-emerald-950">{targetStudents.length}</strong> แผ่น (A4 แนวตั้ง 1 คน ต่อ 1 แผ่น)
            </span>
            <Button
              onClick={handlePrint}
              disabled={loading || targetStudents.length === 0}
              className="font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังเตรียมข้อมูล...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" /> สั่งพิมพ์ (Print / Save PDF)
                </>
              )}
            </Button>
          </div>

          {/* Mini Preview */}
          <div className="overflow-x-auto p-4 rounded-xl bg-slate-100 border border-border flex justify-center">
            {targetStudents.length > 0 && profiles[targetStudents[0].id] ? (
              <div className="transform scale-[0.55] origin-top -mb-64 shadow-2xl">
                <PassportSheet
                  student={targetStudents[0]}
                  profile={profiles[targetStudents[0].id]}
                  academicYear={academicYear}
                  semester={semester}
                  originUrl={originUrl}
                />
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>กำลังโหลดข้อมูลพาสปอร์ตความดี...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Actual Printable A4 Container ── */}
      <div id="print-virtue-passports" className="hidden">
        {targetStudents.map((student) => {
          const prof = profiles[student.id];
          if (!prof) return null;
          return (
            <div key={student.id} className="passport-sheet flex items-center justify-center">
              <PassportSheet
                student={student}
                profile={prof}
                academicYear={academicYear}
                semester={semester}
                originUrl={originUrl}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── Single Passport Sheet (210mm x 297mm) ──
interface PassportSheetProps {
  student: CertificateStudent;
  profile: HeroProfile;
  academicYear: string;
  semester: string;
  originUrl: string;
}

const PassportSheet: React.FC<PassportSheetProps> = ({
  student,
  profile,
  academicYear,
  semester,
  originUrl,
}) => {
  const verifyUrl = `${originUrl}/virtue-bank/${student.student_code || student.id}`;

  const topDeeds = useMemo(() => {
    return (profile.timeline || [])
      .filter((t) => t.type === 'add')
      .slice(0, 5);
  }, [profile.timeline]);

  const virtuesList = [
    { key: 'publicMind', label: 'จิตสาธารณะ 🌱', val: profile.virtues.publicMind },
    { key: 'responsibility', label: 'ความรับผิดชอบ 📘', val: profile.virtues.responsibility },
    { key: 'discipline', label: 'วินัย ⏰', val: profile.virtues.discipline },
    { key: 'honesty', label: 'ซื่อสัตย์ 🤝', val: profile.virtues.honesty },
    { key: 'kindness', label: 'น้ำใจ ❤️', val: profile.virtues.kindness },
  ];

  return (
    <div
      className="relative bg-white text-slate-900 border-[4px] border-emerald-700 rounded-xl shadow-lg flex flex-col justify-between"
      style={{
        width: '194mm',
        height: '280mm',
        padding: '7mm 9mm',
        boxSizing: 'border-box',
        fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
      }}
    >
      {/* ── Section 1: Header ── */}
      <div className="border-b-2 border-emerald-600 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center p-2 shadow">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-emerald-900 tracking-tight leading-tight">
              โรงเรียนบ้านคำไผ่ สพป.อุดรธานี เขต ๒
            </h1>
            <p className="text-xs font-bold text-slate-700">
              สมุดบันทึกความดีประจำตัวนักเรียน (Virtue Passport & Portfolio)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
            ภาคเรียนที่ {toThaiNumerals(semester)} / ปีการศึกษา {toThaiNumerals(academicYear)}
          </span>
          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
            รหัสเอกสาร: VP-{student.student_code || student.id.slice(0, 6)}
          </p>
        </div>
      </div>

      {/* ── Section 2: Student Profile Strip ── */}
      <div className="my-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden shadow-sm flex-shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <PersonAvatar name={student.name} photoUrl={null} size="lg" className="w-full h-full rounded-none" />
            )}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-snug">
              {student.name}
            </h2>
            <p className="text-xs font-bold text-slate-600">
              ชั้น {student.class}{student.room ? `/${student.room}` : ''}
              {student.class_number ? ` เลขที่ ${student.class_number}` : ''}
              {student.student_code ? ` · รหัสประจำตัว: ${student.student_code}` : ''}
            </p>
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black shadow-sm">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            {profile.heroTitle} (LV.{profile.level})
          </span>
          <p className="text-xs font-black text-slate-800">
            พลังความดีสะสม: <strong className="text-emerald-700 text-sm">{profile.totalXp}</strong> คะแนน
          </p>
        </div>
      </div>

      {/* ── Section 3: Radar Chart & Virtue Matrix ── */}
      <div className="my-1 grid grid-cols-12 gap-3 items-center">
        {/* Radar Chart */}
        <div className="col-span-5 p-2 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col items-center">
          <h3 className="text-[10px] font-black text-slate-700 mb-1">
            แผนผังคุณธรรม ๕ มิติ
          </h3>
          <SvgRadarChart virtues={profile.virtues} size={150} />
        </div>

        {/* Virtue Matrix */}
        <div className="col-span-7">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-emerald-50 text-emerald-950 font-black text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-1 px-2">มิติคุณธรรม</th>
                <th className="py-1 px-2 text-center">คะแนน</th>
                <th className="py-1 px-2 text-center">ระดับผลการประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px]">
              {virtuesList.map((v) => {
                let badge = 'ผ่านเกณฑ์ 🌱';
                let badgeClass = 'text-slate-700 bg-slate-100';
                if (v.val >= 40) {
                  badge = 'ยอดเยี่ยม 🌟';
                  badgeClass = 'text-emerald-800 bg-emerald-100 font-bold';
                } else if (v.val >= 20) {
                  badge = 'ดีมาก ⭐';
                  badgeClass = 'text-blue-800 bg-blue-100 font-bold';
                }
                return (
                  <tr key={v.key} className="hover:bg-slate-50/50">
                    <td className="py-1 px-2 font-bold text-slate-800">{v.label}</td>
                    <td className="py-1 px-2 text-center font-black text-emerald-700">{v.val} XP</td>
                    <td className="py-1 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] ${badgeClass}`}>
                        {badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: Top 5 Good Deeds ── */}
      <div className="my-1 space-y-1">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1">
          <span className="w-1.5 h-3.5 bg-emerald-600 rounded-sm inline-block" />
          ๕ บันทึกความดีเด่น (Top 5 Deeds Highlight)
        </h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-1 px-2 w-16">วันที่</th>
                <th className="py-1 px-2">รายการความดีที่ปฏิบัติ</th>
                <th className="py-1 px-2 w-28 text-center">หมวดหมู่</th>
                <th className="py-1 px-2 w-14 text-center">คะแนน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topDeeds.length > 0 ? (
                topDeeds.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-1 px-2 text-slate-500 font-medium">
                      {new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-800 line-clamp-1">{d.title}</td>
                    <td className="py-1 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[9px]">
                        {conductService.getConductCategoryMeta(d.category).label}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center font-black text-emerald-700">+{d.xp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-400">
                    ยังไม่มีบันทึกรายการความดีในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: Synergy External Integration Stats ── */}
      <div className="my-1 space-y-1">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1">
          <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm inline-block" />
          การบูรณาการระบบโรงเรียน (School Synergy Integration)
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Waste Bank */}
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">♻️ ธนาคารขยะ</span>
            <p className="text-xs font-black text-slate-900 mt-0.5">
              {profile.synergy?.wastePoints ?? 0} แต้ม
            </p>
            <span className="text-[8px] text-emerald-700 font-semibold">
              โบนัสจิตสาธารณะ +{profile.synergy?.wasteBonus ?? 0} XP
            </span>
          </div>

          {/* Savings Bank */}
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">🪙 ธนาคารพอเพียง</span>
            <p className="text-xs font-black text-slate-900 mt-0.5">
              {profile.synergy?.depositCount ?? 0} ครั้ง
            </p>
            <span className="text-[8px] text-amber-700 font-semibold">
              โบนัสวินัย +{profile.synergy?.savingsBonus ?? 0} XP
            </span>
          </div>

          {/* Attendance */}
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">📅 การเข้าเรียน</span>
            <p className="text-xs font-black text-slate-900 mt-0.5">
              {profile.synergy?.attendancePresentDays ?? 0} / {profile.synergy?.attendanceTotalDays ?? 0} วัน
            </p>
            <span className="text-[8px] text-blue-700 font-semibold">
              โบนัสความรับผิดชอบ +{profile.synergy?.attendanceBonus ?? 50} XP
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 6: Dual Assessment & Signatures ── */}
      <div className="mt-2 pt-2 border-t-2 border-slate-200 grid grid-cols-12 gap-3 items-end">
        {/* Teacher Box */}
        <div className="col-span-5 p-2 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1">
          <p className="text-[10px] font-black text-slate-800">
            ความเห็นและคำชื่นชมของครูประจำชั้น:
          </p>
          <div className="h-9 border-b border-dotted border-slate-400" />
          <div className="pt-2 text-center">
            <div className="border-b border-dotted border-slate-400 w-32 mx-auto h-4" />
            <p className="text-[9px] font-bold text-slate-700 mt-0.5">(........................................................)</p>
            <p className="text-[8px] text-slate-500 font-semibold">ครูประจำชั้น</p>
          </div>
        </div>

        {/* Parent Box */}
        <div className="col-span-5 p-2 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1">
          <p className="text-[10px] font-black text-slate-800">
            ความเห็นและความภาคภูมิใจของผู้ปกครอง:
          </p>
          <div className="h-9 border-b border-dotted border-slate-400" />
          <div className="pt-2 text-center">
            <div className="border-b border-dotted border-slate-400 w-32 mx-auto h-4" />
            <p className="text-[9px] font-bold text-slate-700 mt-0.5">(........................................................)</p>
            <p className="text-[8px] text-slate-500 font-semibold">ผู้ปกครอง</p>
          </div>
        </div>

        {/* QR Verification Stamp */}
        <div className="col-span-2 flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-200 bg-white">
          <QRCode value={verifyUrl} size={46} />
          <span className="text-[7px] text-slate-500 font-bold mt-1 text-center leading-tight">
            สแกนตรวจสอบ
          </span>
        </div>
      </div>
    </div>
  );
};

// ── SvgRadarChart Component ──
function SvgRadarChart({
  virtues,
  size = 150,
}: {
  virtues: { publicMind: number; responsibility: number; discipline: number; honesty: number; kindness: number };
  size?: number;
}) {
  const categories = [
    { key: 'publicMind', label: 'จิตสาธารณะ' },
    { key: 'responsibility', label: 'รับผิดชอบ' },
    { key: 'discipline', label: 'วินัย' },
    { key: 'honesty', label: 'ซื่อสัตย์' },
    { key: 'kindness', label: 'น้ำใจ' },
  ];
  const maxVal = Math.max(30, ...Object.values(virtues));
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  const points = categories.map((cat, i) => {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const val = virtues[cat.key as keyof typeof virtues] || 0;
    const dist = (Math.min(val, maxVal) / maxVal) * r;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      labelX: cx + (r + 14) * Math.cos(angle),
      labelY: cy + (r + 14) * Math.sin(angle),
      label: cat.label,
      val,
    };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {gridLevels.map((lvl) => {
        const gridPoints = categories
          .map((_, i) => {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            return `${cx + r * lvl * Math.cos(angle)},${cy + r * lvl * Math.sin(angle)}`;
          })
          .join(' ');
        return (
          <polygon
            key={lvl}
            points={gridPoints}
            fill={lvl === 1.0 ? '#f8fafc' : 'none'}
            stroke="#cbd5e1"
            strokeWidth="0.8"
            strokeDasharray={lvl < 1.0 ? '2 2' : 'none'}
          />
        );
      })}
      {categories.map((_, i) => {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />
        );
      })}
      <polygon
        points={polygonPath}
        fill="#10b981"
        fillOpacity="0.35"
        stroke="#059669"
        strokeWidth="1.5"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="2.5" fill="#047857" />
          <text
            x={p.labelX}
            y={p.labelY}
            fontSize="8"
            fontWeight="bold"
            fill="#334155"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
