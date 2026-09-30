import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { calculateHeroLevel } from '@/services/conduct.service';
import { Printer, Award, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CertificateStudent {
  id: string;
  name: string;
  class: string;
  room?: string | null;
  class_number?: number | null;
  photo_url?: string | null;
  student_code?: string | null;
  totalScore: number;
}

interface VirtueCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: CertificateStudent[];
  initialStudentId?: string | null;
  currentClass?: string;
  currentRoom?: string;
}

const toThaiNumerals = (val: number | string): string => {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(val).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const VirtueCertificateModal: React.FC<VirtueCertificateModalProps> = ({
  open,
  onOpenChange,
  students,
  initialStudentId,
  currentClass = '',
  currentRoom = '',
}) => {
  const [filterMode, setFilterMode] = useState<string>(
    initialStudentId ? `single:${initialStudentId}` : 'all'
  );
  const [singleStudentId, setSingleStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? '')
  );
  const [teacherName, setTeacherName] = useState<string>('คุณครูประจำชั้น');
  const [directorName, setDirectorName] = useState<string>('ผู้อำนวยการโรงเรียนบ้านคำไผ่');
  const [issueDate, setIssueDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${toThaiNumerals(day)} ${month} พุทธศักราช ${toThaiNumerals(year)}`;
  });
  const [showScore, setShowScore] = useState<boolean>(true);

  // Synchronize when initialStudentId changes
  React.useEffect(() => {
    if (initialStudentId) {
      setFilterMode(`single:${initialStudentId}`);
      setSingleStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    if (filterMode.startsWith('single:')) {
      const sId = filterMode.split(':')[1] || singleStudentId;
      return students.filter((s) => s.id === sId);
    }
    if (filterMode === 'level2') {
      return students.filter((s) => calculateHeroLevel(s.totalScore).level >= 2);
    }
    if (filterMode === 'level3') {
      return students.filter((s) => calculateHeroLevel(s.totalScore).level >= 3);
    }
    if (filterMode === 'top5') {
      return [...students].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
    }
    if (filterMode === 'top10') {
      return [...students].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
    }
    return students;
  }, [students, filterMode, singleStudentId]);

  const handlePrint = () => {
    window.print();
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kampai-school.vercel.app';

  return (
    <>
      {/* ── Print CSS Rules strictly scoping to A4 Landscape ── */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
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
          #print-virtue-certificates, #print-virtue-certificates * {
            visibility: visible !important;
          }
          #print-virtue-certificates {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            display: block !important;
            background: #ffffff !important;
          }
          .certificate-sheet {
            width: 297mm !important;
            height: 209.5mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            overflow: hidden !important;
          }
          .certificate-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* ── Dialog UI for Configuration ── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
              <Award className="w-6 h-6 text-yellow-500" />
              พิมพ์เกียรติบัตรคนดีศรีคำไผ่ (A4 แนวนอน)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              ระบบสร้างเกียรติบัตรความดีมาตรฐานโรงเรียนบ้านคำไผ่ พร้อมระบบตรวจสอบ QR Code รายบุคคล
            </DialogDescription>
          </DialogHeader>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            {/* Filter Mode */}
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
                  <SelectValue placeholder="เลือกกลุ่มผู้รับเกียรติบัตร" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">พิมพ์เฉพาะรายบุคคล (เลือกชื่อ)</SelectItem>
                  <SelectItem value="all">พิมพ์ทุกคนในห้อง ({students.length} คน)</SelectItem>
                  <SelectItem value="level2">เฉพาะเลเวล ≥ 2 (ผู้ช่วยตัวน้อยขึ้นไป)</SelectItem>
                  <SelectItem value="level3">เฉพาะเลเวล ≥ 3 (ฮีโร่ประจำห้องขึ้นไป)</SelectItem>
                  <SelectItem value="top5">เฉพาะ Top 5 ของห้อง</SelectItem>
                  <SelectItem value="top10">เฉพาะ Top 10 ของห้อง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Individual Student Picker if single */}
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

            {/* Date Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">ข้อความวันที่ออกเกียรติบัตร</Label>
              <Input
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-9 text-xs bg-background"
                placeholder="เช่น ๓๐ กันยายน พุทธศักราช ๒๕๖๙"
              />
            </div>

            {/* Teacher Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">ชื่อครูประจำชั้น (ผู้ลงนามซ้าย)</Label>
              <Input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="h-9 text-xs bg-background"
                placeholder="เช่น คุณครูใจดี มีสุข"
              />
            </div>

            {/* Director Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">ชื่อผู้อำนวยการ (ผู้ลงนามขวา)</Label>
              <Input
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="h-9 text-xs bg-background"
                placeholder="เช่น ผู้อำนวยการโรงเรียนบ้านคำไผ่"
              />
            </div>

            {/* Score Checkbox */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="show-score-chk"
                checked={showScore}
                onChange={(e) => setShowScore(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
              />
              <Label htmlFor="show-score-chk" className="text-xs font-semibold cursor-pointer">
                แสดงคะแนนความดีสะสมบนใบเกียรติบัตร
              </Label>
            </div>
          </div>

          {/* Preview Banner */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
            <span>
              พร้อมพิมพ์ทั้งหมด <strong className="font-extrabold text-blue-950">{filteredStudents.length}</strong> ใบ (กระดาษ A4 แนวนอน 1 คน ต่อ 1 แผ่น)
            </span>
            <Button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            >
              <Printer className="w-4 h-4" /> สั่งพิมพ์ (Print / Save PDF)
            </Button>
          </div>

          {/* Visual Mini Preview Container */}
          <div className="overflow-x-auto p-4 rounded-xl bg-slate-100 border border-border flex justify-center">
            {filteredStudents.length > 0 ? (
              <div className="transform scale-[0.6] origin-top -mb-32 shadow-2xl">
                <CertificateCard
                  student={filteredStudents[0]}
                  teacherName={teacherName}
                  directorName={directorName}
                  issueDate={issueDate}
                  showScore={showScore}
                  originUrl={originUrl}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                ไม่พบนักเรียนตามเงื่อนไขที่เลือก
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Actual Printable A4 Container (Visible only when printing) ── */}
      <div id="print-virtue-certificates" className="hidden">
        {filteredStudents.map((student) => (
          <div key={student.id} className="certificate-sheet flex items-center justify-center">
            <CertificateCard
              student={student}
              teacherName={teacherName}
              directorName={directorName}
              issueDate={issueDate}
              showScore={showScore}
              originUrl={originUrl}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ── Single Certificate Template Component ──
interface CertificateCardProps {
  student: CertificateStudent;
  teacherName: string;
  directorName: string;
  issueDate: string;
  showScore: boolean;
  originUrl: string;
}

const CertificateCard: React.FC<CertificateCardProps> = ({
  student,
  teacherName,
  directorName,
  issueDate,
  showScore,
  originUrl,
}) => {
  const levelInfo = calculateHeroLevel(student.totalScore);
  const verifyUrl = `${originUrl}/virtue-bank/${student.student_code || student.id}`;

  return (
    <div
      className="relative bg-white text-slate-900 border-[10px] border-amber-500 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden"
      style={{
        width: '277mm',
        height: '190mm',
        padding: '12mm 16mm',
        boxSizing: 'border-box',
        fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
      }}
    >
      {/* Inner Elegant Border Accent */}
      <div className="absolute inset-2 border-2 border-dashed border-amber-400 pointer-events-none rounded-xl" />
      <div className="absolute inset-3 border border-slate-300 pointer-events-none rounded-lg" />

      {/* Corner Ornaments */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 rounded-tl-lg pointer-events-none" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 rounded-tr-lg pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 rounded-bl-lg pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 rounded-br-lg pointer-events-none" />

      {/* Background Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-[130mm] h-[130mm] text-amber-900" fill="currentColor">
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="8" fill="none" />
          <path d="M100 25 L120 75 L175 75 L130 110 L150 165 L100 130 L50 165 L70 110 L25 75 L80 75 Z" />
        </svg>
      </div>

      {/* Header Section */}
      <div className="text-center relative z-10 space-y-1">
        {/* School Emblem / Logo */}
        <div className="flex justify-center mb-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-amber-700">
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="currentColor">
                <path d="M20 3L6 10v10c0 10 6 18 14 20 8-2 14-10 14-20V10L20 3zm0 5l10 5v8c0 7-4 13-10 15-6-2-10-8-10-15v-8l10-5zm-2 7h4v2h-4v-2zm0 4h4v6h-4v-6z" />
              </svg>
            </div>
          </div>
        </div>

        <p className="text-sm font-semibold tracking-wider text-slate-600">
          โรงเรียนบ้านคำไผ่ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
        </p>
        <h1 className="text-3xl font-black text-amber-800 tracking-tight">
          เกียรติบัตรคนดีศรีคำไผ่
        </h1>
        <p className="text-base font-bold text-slate-700 tracking-normal pt-1">
          เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
        </p>
      </div>

      {/* Recipient Details */}
      <div className="text-center relative z-10 space-y-2 py-1">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-wide">
          {student.name}
        </h2>
        <p className="text-base font-bold text-slate-700">
          {student.class.startsWith('ป.') ? `ชั้นประถมศึกษาปีที่ ${toThaiNumerals(student.class.replace('ป.', ''))}` : student.class}
          {student.room ? `/${toThaiNumerals(student.room)}` : ''}
          {student.class_number ? ` เลขที่ ${toThaiNumerals(student.class_number)}` : ''}
        </p>

        <p className="text-sm text-slate-700 max-w-[210mm] mx-auto leading-relaxed pt-1 font-medium">
          ได้ประพฤติตนเป็นแบบอย่างที่ดี มีความวิริยะอุตสาหะ มีคุณธรรมจริยธรรม และบำเพ็ญประโยชน์ต่อส่วนรวม
          สมควรได้รับการยกย่องและเชิดชูเกียรติเป็น
        </p>

        {/* Level Honor Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm mt-1">
          <Award className="w-5 h-5 text-amber-600" />
          <span className="text-lg font-black">
            {levelInfo.title} (ระดับ {toThaiNumerals(levelInfo.level)})
          </span>
          {showScore && (
            <span className="text-sm font-bold text-amber-700 ml-1">
              — คะแนนความดีสะสม {toThaiNumerals(student.totalScore)} คะแนน
            </span>
          )}
        </div>
      </div>

      {/* Date Citation */}
      <div className="text-center relative z-10">
        <p className="text-sm font-semibold text-slate-700">
          ให้ไว้ ณ วันที่ {issueDate}
        </p>
      </div>

      {/* Footer Signatures & QR Section */}
      <div className="relative z-10 flex items-end justify-between pt-2 px-6">
        {/* Left Signature: Teacher */}
        <div className="text-center w-56 space-y-1">
          <div className="border-b border-dotted border-slate-600 w-44 mx-auto h-8" />
          <p className="text-sm font-bold text-slate-800">({teacherName})</p>
          <p className="text-xs text-slate-600 font-semibold">ครูประจำชั้น</p>
        </div>

        {/* Center: QR Verification Stamp */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/90 border border-slate-200 shadow-sm">
          <QRCode value={verifyUrl} size={54} />
          <span className="text-[8px] text-slate-500 font-bold mt-1 tracking-tight">
            สแกนตรวจสอบความถูกต้อง
          </span>
          <span className="text-[7px] text-slate-400 font-mono">
            {student.student_code || student.id.slice(0, 8)}
          </span>
        </div>

        {/* Right Signature: Director */}
        <div className="text-center w-56 space-y-1">
          <div className="border-b border-dotted border-slate-600 w-44 mx-auto h-8" />
          <p className="text-sm font-bold text-slate-800">({directorName})</p>
          <p className="text-xs text-slate-600 font-semibold">ผู้อำนวยการโรงเรียนบ้านคำไผ่</p>
        </div>
      </div>
    </div>
  );
};
