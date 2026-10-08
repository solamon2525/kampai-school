/**
 * papor-evaluation.service.ts
 * บริการจัดการผลการเรียนรู้มาตรฐาน สพฐ. 4 ด้าน และการประเมิน ปพ.5 / ปพ.6
 * รองรับการอ่านและนำเข้า/ส่งออกไฟล์ Excel (.xlsm / .xlsx) ของโรงเรียน
 */
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import * as xlsx from 'xlsx';

type RawSheetRow = (string | number | boolean | null | undefined)[];
type ScoreRowInsert = TablesInsert<'score_records'>;
type EvaluationRowInsert = TablesInsert<'student_obec_evaluations'>;
type PromotionRowInsert = TablesInsert<'student_term_promotion_records'>;

// ===== Types & Interfaces =====

export interface SubjectMeta {
  name: string;
  code: string;
  teacher?: string;
  ratioFormative: number;
  ratioSummative: number;
  indicatorsT1: number;
  indicatorsT2: number;
  weight: number;
  learningArea: string;
  type: 'core' | 'additional';
}

export interface StudentScoreItem {
  subject: string;
  code: string;
  term1: number;
  term2: number;
  total: number;
  grade: string;
}

export interface CompetencyEvaluation {
  studentNo: number;
  studentName: string;
  scores: number[]; // [สื่อสาร, คิด, แก้ปัญหา, ทักษะชีวิต, เทคโนโลยี] (0-3)
  mode: number;
  grade: string; // 'ดย', 'ด', 'ผ', 'มผ'
}

export interface CharacterEvaluation {
  studentNo: number;
  studentName: string;
  c1: number; // รักชาติ ศาสน์ กษัตริย์
  c2: number; // ซื่อสัตย์สุจริต
  c3: number; // มีวินัย
  c4: number; // ใฝ่เรียนรู้
  c5: number; // อยู่อย่างพอเพียง
  c6: number; // มุ่งมั่นในการทำงาน
  c7: number; // รักความเป็นไทย
  c8: number; // มีจิตสาธารณะ
  totalGrade: string; // 'ดย', 'ด', 'ผ', 'มผ'
}

export interface ReadingEvaluation {
  studentNo: number;
  studentName: string;
  q1: number; // การอ่าน 1
  q2: number; // การอ่าน 2
  q3: number; // การคิดวิเคราะห์ 1
  q4: number; // การคิดวิเคราะห์ 2
  q5: number; // การเขียน
  mode: number;
  grade: string; // 'ดย', 'ด', 'ผ', 'มผ'
}

export interface ActivityEvaluation {
  studentNo: number;
  studentName: string;
  guidance: { hours: number; status: string };
  scout: { hours: number; status: string };
  club: { hours: number; status: string };
  social: { hours: number; status: string };
  summary: string; // 'ผ' | 'มผ'
}

export interface AttendanceTermItem {
  total: number;
  present: number;
  sick: number;
  leave: number;
  absent: number;
  pct: number;
}

export interface AttendanceSummaryItem {
  studentNo: number;
  term1: AttendanceTermItem;
  term2: AttendanceTermItem;
  year: { total: number; present: number; pct: number };
}

export interface StudentPromotionItem {
  studentNo: number;
  studentCode: string;
  studentName: string;
  gpa: number;
  attendancePct: number;
  attendancePass: boolean;
  indicatorsPass: boolean;
  academicPass: boolean;
  competencyGrade: string;
  characterGrade: string;
  readingGrade: string;
  activitiesPass: boolean;
  promotionDecision: 'promoted' | 'retained';
  teacherCommentTerm1?: string;
  teacherCommentTerm2?: string;
  parentComment?: string;
}

export interface PaporWorkbookParsedData {
  schoolInfo: {
    schoolName: string;
    district: string;
    academicYear: string;
    gradeLevel: string;
    teacherName: string;
    directorName: string;
    registrarName: string;
  };
  subjects: SubjectMeta[];
  students: Array<{
    no: number;
    studentCode: string;
    fullName: string;
    nationalId: string;
    birthDate: string;
    nickname: string;
    fatherName: string;
    motherName: string;
  }>;
  scoresByStudent: Record<number, StudentScoreItem[]>;
  competencies: CompetencyEvaluation[];
  character: CharacterEvaluation[];
  reading: ReadingEvaluation[];
  activities: ActivityEvaluation[];
  attendance: AttendanceSummaryItem[];
  promotions: StudentPromotionItem[];
}

// ===== Helper Functions =====

export function scoreToGrade(score: number): string {
  if (score >= 80) return '4';
  if (score >= 75) return '3.5';
  if (score >= 70) return '3';
  if (score >= 65) return '2.5';
  if (score >= 60) return '2';
  if (score >= 55) return '1.5';
  if (score >= 50) return '1';
  return '0';
}

export function levelToText(level: number | string): string {
  const n = Number(level);
  if (n === 3) return 'ดีเยี่ยม';
  if (n === 2) return 'ดี';
  if (n === 1) return 'ผ่าน';
  return 'ไม่ผ่าน';
}

export function levelToShort(level: number | string): string {
  const n = Number(level);
  if (n === 3) return 'ดย';
  if (n === 2) return 'ด';
  if (n === 1) return 'ผ';
  return 'มผ';
}

// ===== Parser Engine =====

export function parsePaporWorkbook(fileBuffer: ArrayBuffer | Uint8Array): PaporWorkbookParsedData {
  const wb = xlsx.read(fileBuffer, { type: 'array' });

  // 1. School Info & Subjects (แผ่นงาน 'ข้อมูลพื้นฐาน')
  const wsBasic = wb.Sheets['ข้อมูลพื้นฐาน'] || wb.Sheets[wb.SheetNames[1]];
  const basicData = xlsx.utils.sheet_to_json(wsBasic, { header: 1, defval: '' }) as RawSheetRow[];

  const schoolName = String(basicData[2]?.[1] || 'โรงเรียนบ้านคำไผ่').trim();
  const district = String(basicData[3]?.[1] || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 2').trim();
  const academicYear = String(basicData[7]?.[1] || '2569').trim();
  const gradeLevel = String(basicData[8]?.[1] || '5').trim();
  const teacherName = String(basicData[9]?.[1] || '').trim();
  const directorName = String(basicData[10]?.[1] || '').trim();
  const registrarName = String(basicData[11]?.[1] || '').trim();

  const subjects: SubjectMeta[] = [];
  // Core subjects
  for (let r = 14; r <= 22; r++) {
    const row = basicData[r];
    if (row && row[0]) {
      subjects.push({
        name: String(row[0]).trim(),
        teacher: String(row[1] || teacherName).trim(),
        code: String(row[2]).trim(),
        ratioFormative: Number(row[3]) || 70,
        ratioSummative: Number(row[4]) || 30,
        indicatorsT1: Number(row[5]) || 0,
        indicatorsT2: Number(row[6]) || 0,
        weight: Number(row[7]) || 1,
        learningArea: String(row[8] || '').trim(),
        type: 'core',
      });
    }
  }
  // Additional subjects
  for (let r = 24; r <= 25; r++) {
    const row = basicData[r];
    if (row && row[0]) {
      subjects.push({
        name: String(row[0]).trim(),
        teacher: String(row[1] || teacherName).trim(),
        code: String(row[2]).trim(),
        ratioFormative: Number(row[3]) || 80,
        ratioSummative: Number(row[4]) || 20,
        indicatorsT1: Number(row[5]) || 0,
        indicatorsT2: Number(row[6]) || 0,
        weight: Number(row[7]) || 1,
        learningArea: String(row[8] || '').trim(),
        type: 'additional',
      });
    }
  }

  // 2. Student Roster (แผ่นงาน 'กรอกข้อมูล นร1')
  const wsStudents = wb.Sheets['กรอกข้อมูล นร1'] || wb.Sheets[wb.SheetNames[2]];
  const studentData = xlsx.utils.sheet_to_json(wsStudents, { header: 1, defval: '' }) as RawSheetRow[];
  const students: PaporWorkbookParsedData['students'] = [];

  for (let r = 4; r < studentData.length; r++) {
    const row = studentData[r];
    if (row[2] && String(row[2]).trim() !== '' && String(row[2]).trim() !== 'ย้าย') {
      students.push({
        no: Number(row[0]) || students.length + 1,
        studentCode: String(row[1] || '').trim(),
        fullName: String(row[2] || '').trim(),
        nationalId: String(row[3] || '').trim(),
        birthDate: String(row[5] || '').trim(),
        nickname: String(row[7] || '').trim(),
        fatherName: String(row[11] || '').trim(),
        motherName: String(row[13] || '').trim(),
      });
    }
  }

  // 3. Scores by Subject (แผ่นงาน 'สรุปคะแนนทั้งปี')
  const wsYearScores = wb.Sheets['สรุปคะแนนทั้งปี'];
  const scoresByStudent: Record<number, StudentScoreItem[]> = {};
  const yearData = wsYearScores ? (xlsx.utils.sheet_to_json(wsYearScores, { header: 1, defval: '' }) as RawSheetRow[]) : [];

  const subjectBlocks = [
    {
      startRow: 7,
      items: [
        { name: 'ภาษาไทย', code: 'ท15101', col: 1 },
        { name: 'คณิตศาสตร์', code: 'ค15101', col: 5 },
        { name: 'วิทยาศาสตร์และเทคโนโลยี', code: 'ว15101', col: 9 },
        { name: 'สังคมศึกษาศาสนาและวัฒนธรรม', code: 'ส15101', col: 13 },
      ],
    },
    {
      startRow: 67,
      items: [
        { name: 'ประวัติศาสตร์', code: 'ส15102', col: 1 },
        { name: 'สุขศึกษาและพลศึกษา', code: 'พ15101', col: 5 },
        { name: 'ศิลปะ', code: 'ศ15101', col: 9 },
        { name: 'การงานอาชีพ', code: 'ง15101', col: 13 },
      ],
    },
    {
      startRow: 127,
      items: [
        { name: 'ภาษาอังกฤษ', code: 'อ15101', col: 1 },
        { name: 'ภาษาอังกฤษเพื่อการสื่อสาร', code: 'อ15201', col: 5 },
        { name: 'ต้านทุจริตศึกษา', code: 'ส15201', col: 9 },
      ],
    },
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const sNo = students[sIdx].no;
    scoresByStudent[sNo] = [];

    for (const block of subjectBlocks) {
      const row = yearData[block.startRow + sIdx] || [];
      for (const sub of block.items) {
        const t1 = Number(row[sub.col]) || 0;
        const t2 = Number(row[sub.col + 1]) || 0;
        const total = Number(row[sub.col + 2]) || Math.round((t1 + t2) / 2);
        const grade = String(row[sub.col + 3] || scoreToGrade(total));
        scoresByStudent[sNo].push({
          subject: sub.name,
          code: sub.code,
          term1: t1,
          term2: t2,
          total,
          grade,
        });
      }
    }
  }

  // 4. Competencies (แผ่นงาน 'สมรรถนะ')
  const wsComp = wb.Sheets['สมรรถนะ'];
  const compData = wsComp ? (xlsx.utils.sheet_to_json(wsComp, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const competencies: CompetencyEvaluation[] = [];

  for (let i = 0; i < students.length; i++) {
    const row = compData[i + 4] || [];
    const scores = [Number(row[2]) || 0, Number(row[3]) || 0, Number(row[4]) || 0, Number(row[5]) || 0, Number(row[6]) || 0];
    const mode = Number(row[7]) || Math.max(...scores);
    const grade = String(row[8] || levelToShort(mode));
    competencies.push({
      studentNo: students[i].no,
      studentName: students[i].fullName,
      scores,
      mode,
      grade,
    });
  }

  // 5. Character (แผ่นงาน 'คุณลักษณะอันพึงประสงค์')
  const wsChar = wb.Sheets['คุณลักษณะอันพึงประสงค์'];
  const charData = wsChar ? (xlsx.utils.sheet_to_json(wsChar, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const character: CharacterEvaluation[] = [];

  for (let i = 0; i < students.length; i++) {
    const row = charData[i + 7] || [];
    character.push({
      studentNo: students[i].no,
      studentName: students[i].fullName,
      c1: Number(row[2]) || 3,
      c2: Number(row[6]) || 3,
      c3: Number(row[8]) || 3,
      c4: Number(row[9]) || 3,
      c5: Number(row[11]) || 3,
      c6: Number(row[13]) || 3,
      c7: Number(row[15]) || 3,
      c8: Number(row[17]) || 3,
      totalGrade: String(row[22] || 'ดย'),
    });
  }

  // 6. Reading, Thinking & Writing (แผ่นงาน 'อ่าน คิดวิเคราะห์ เขียน')
  const wsRead = wb.Sheets['อ่าน คิดวิเคราะห์ เขียน'];
  const readData = wsRead ? (xlsx.utils.sheet_to_json(wsRead, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const reading: ReadingEvaluation[] = [];

  for (let i = 0; i < students.length; i++) {
    const row = readData[i + 5] || [];
    const qScores = [Number(row[2]) || 0, Number(row[3]) || 0, Number(row[4]) || 0, Number(row[5]) || 0, Number(row[6]) || 0];
    const mode = Number(row[7]) || Math.max(...qScores);
    reading.push({
      studentNo: students[i].no,
      studentName: students[i].fullName,
      q1: qScores[0],
      q2: qScores[1],
      q3: qScores[2],
      q4: qScores[3],
      q5: qScores[4],
      mode,
      grade: String(row[8] || levelToShort(mode)),
    });
  }

  // 7. Student Development Activities (แผ่นงาน 'กิจกรรมพัฒนผู้เรียน')
  const wsAct = wb.Sheets['กิจกรรมพัฒนผู้เรียน'];
  const actData = wsAct ? (xlsx.utils.sheet_to_json(wsAct, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const activities: ActivityEvaluation[] = [];

  for (let i = 0; i < students.length; i++) {
    const row = actData[i + 5] || [];
    activities.push({
      studentNo: students[i].no,
      studentName: students[i].fullName,
      guidance: { hours: Number(row[1]) || 40, status: String(row[2] || 'ผ') },
      scout: { hours: Number(row[4]) || 40, status: String(row[5] || 'ผ') },
      club: { hours: Number(row[7]) || 40, status: String(row[8] || 'ผ') },
      social: { hours: Number(row[14]) || 40, status: 'ผ' },
      summary: String(row[10] || 'ผ'),
    });
  }

  // 8. Attendance (แผ่นงาน 'สรุปเวลาเรียน')
  const wsAtt = wb.Sheets['สรุปเวลาเรียน'];
  const attData = wsAtt ? (xlsx.utils.sheet_to_json(wsAtt, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const attendance: AttendanceSummaryItem[] = [];

  for (let i = 0; i < students.length; i++) {
    const row = attData[i + 4] || [];
    const t1 = {
      total: Number(row[5]) || 100,
      present: Number(row[6]) || 0,
      sick: Number(row[7]) || 0,
      leave: Number(row[8]) || 0,
      absent: Number(row[9]) || 0,
      pct: Number(row[10]) || 0,
    };
    const t2 = {
      total: Number(row[11]) || 100,
      present: Number(row[12]) || 0,
      sick: Number(row[13]) || 0,
      leave: Number(row[14]) || 0,
      absent: Number(row[15]) || 0,
      pct: Number(row[16]) || 0,
    };
    const yearPresent = t1.present + t2.present;
    const yearTotal = t1.total + t2.total || 200;
    const yearPct = Math.round((yearPresent / yearTotal) * 100);

    attendance.push({
      studentNo: students[i].no,
      term1: t1,
      term2: t2,
      year: { total: yearTotal, present: yearPresent, pct: yearPct },
    });
  }

  // 9. Promotions & GPA Calculation
  const promotions: StudentPromotionItem[] = [];
  const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0) || 24;

  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const sScores = scoresByStudent[st.no] || [];
    let weightedGradeSum = 0;
    let academicPass = true;

    for (const sc of sScores) {
      const gNum = parseFloat(sc.grade) || 0;
      const subMeta = subjects.find(s => s.code === sc.code || s.name === sc.subject);
      const w = subMeta?.weight || 1;
      weightedGradeSum += gNum * w;
      if (gNum === 0 && sc.total === 0) {
        academicPass = false;
      }
    }

    const gpa = Math.round((weightedGradeSum / totalWeight) * 100) / 100;
    const att = attendance[i];
    const comp = competencies[i];
    const chr = character[i];
    const rd = reading[i];
    const act = activities[i];

    const attPass = (att?.year?.pct || 0) >= 80;
    const isPromoted = attPass && academicPass && comp?.grade !== 'มผ' && chr?.totalGrade !== 'มผ' && rd?.grade !== 'มผ' && act?.summary === 'ผ';

    promotions.push({
      studentNo: st.no,
      studentCode: st.studentCode,
      studentName: st.fullName,
      gpa,
      attendancePct: att?.year?.pct || 0,
      attendancePass: attPass,
      indicatorsPass: academicPass,
      academicPass,
      competencyGrade: comp?.grade || 'ดย',
      characterGrade: chr?.totalGrade || 'ดย',
      readingGrade: rd?.grade || 'ดย',
      activitiesPass: act?.summary === 'ผ',
      promotionDecision: isPromoted ? 'promoted' : 'retained',
      teacherCommentTerm1: isPromoted ? 'ตั้งใจเรียน มีวินัย และมีพัฒนาการที่ดีเด่น' : 'ต้องพัฒนาผลการเรียนเพิ่มเติม',
      teacherCommentTerm2: isPromoted ? 'มีความพร้อมในการศึกษาต่อในระดับชั้นที่สูงขึ้น' : 'ต้องแก้ไขผลการเรียน',
      parentComment: 'รับทราบผลการเรียนของนักเรียนเป็นที่เรียบร้อย',
    });
  }

  return {
    schoolInfo: {
      schoolName,
      district,
      academicYear,
      gradeLevel: `ป.${gradeLevel}`,
      teacherName,
      directorName,
      registrarName,
    },
    subjects,
    students,
    scoresByStudent,
    competencies,
    character,
    reading,
    activities,
    attendance,
    promotions,
  };
}

// ===== Supabase Sync Engine =====

export interface SyncAuditResult {
  studentsMatched: number;
  studentsCreated: number;
  scoresInserted: number;
  evaluationsInserted: number;
  promotionsInserted: number;
  errors: string[];
}

export async function syncPaporWorkbookToDatabase(
  parsed: PaporWorkbookParsedData,
  onProgress?: (step: string, pct: number) => void
): Promise<SyncAuditResult> {
  const result: SyncAuditResult = {
    studentsMatched: 0,
    studentsCreated: 0,
    scoresInserted: 0,
    evaluationsInserted: 0,
    promotionsInserted: 0,
    errors: [],
  };

  onProgress?.('กำลังจับคู่ข้อมูลนักเรียนกับระบบโรงเรียน...', 10);

  // 1. Match or find students in DB by student_code
  const { data: dbStudents, error: fetchErr } = await supabase
    .from('students')
    .select('id, student_code, name, class');

  if (fetchErr) {
    result.errors.push(`ดึงข้อมูลนักเรียนไม่สำเร็จ: ${fetchErr.message}`);
    return result;
  }

  const studentMap = new Map<string, string>(); // studentCode -> student UUID
  dbStudents?.forEach(s => {
    if (s.student_code) studentMap.set(String(s.student_code).trim(), s.id);
  });

  const parsedStudentIds: Record<number, string> = {};

  for (const st of parsed.students) {
    let sId = studentMap.get(st.studentCode);
    if (!sId) {
      // Helper: ตัดคำนำหน้าชื่อไทยเพื่อเปรียบเทียบชื่อ-สกุลจริงอย่างแม่นยำ
      const cleanName = (name: string) =>
        (name || '')
          .replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|น\.ส\.)\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();

      const stClean = cleanName(st.fullName);
      const matched = dbStudents?.find((d) => {
        const dTrim = (d.name || '').trim();
        const stTrim = (st.fullName || '').trim();
        if (dTrim === stTrim) return true;
        const dClean = cleanName(dTrim);
        return dClean.length > 0 && dClean === stClean;
      });

      if (matched) {
        sId = matched.id;
        studentMap.set(st.studentCode, sId);
      }
    }

    if (sId) {
      result.studentsMatched++;
      parsedStudentIds[st.no] = sId;
    } else {
      // Insert new student if missing
      const { data: newS, error: insErr } = await supabase
        .from('students')
        .insert({
          student_code: st.studentCode,
          name: st.fullName,
          class: parsed.schoolInfo.gradeLevel,
          national_id: st.nationalId || null,
          nickname: st.nickname || null,
          father_name: st.fatherName || null,
          mother_name: st.motherName || null,
          is_active: true,
        })
        .select('id')
        .single();

      if (insErr) {
        result.errors.push(`เพิ่มนักเรียน ${st.fullName} ไม่สำเร็จ: ${insErr.message}`);
      } else if (newS) {
        result.studentsCreated++;
        parsedStudentIds[st.no] = newS.id;
        studentMap.set(st.studentCode, newS.id);
      }
    }
  }

  onProgress?.('กำลังบันทึกคะแนนรายวิชา (Term 1 & Term 2)...', 35);

  // 2. Upsert scores into score_records
  const scoreRows: ScoreRowInsert[] = [];
  for (const st of parsed.students) {
    const sId = parsedStudentIds[st.no];
    if (!sId) continue;
    const sScores = parsed.scoresByStudent[st.no] || [];

    for (const sc of sScores) {
      // Term 1
      scoreRows.push({
        student_id: sId,
        subject: sc.subject,
        score_type: 'ระหว่างเรียน_T1',
        score: sc.term1,
        max_score: 100,
        semester: '1',
        academic_year: parsed.schoolInfo.academicYear,
        notes: `รหัสวิชา ${sc.code}`,
      });
      // Term 2
      scoreRows.push({
        student_id: sId,
        subject: sc.subject,
        score_type: 'ระหว่างเรียน_T2',
        score: sc.term2,
        max_score: 100,
        semester: '2',
        academic_year: parsed.schoolInfo.academicYear,
        notes: `รหัสวิชา ${sc.code}`,
      });
      // Yearly combined
      scoreRows.push({
        student_id: sId,
        subject: sc.subject,
        score_type: 'รวมทั้งปี',
        score: sc.total,
        max_score: 100,
        semester: 'all',
        academic_year: parsed.schoolInfo.academicYear,
        notes: `เกรด ${sc.grade}`,
      });
    }
  }

  if (scoreRows.length > 0) {
    const { error: scErr } = await supabase.from('score_records').upsert(scoreRows, {
      onConflict: 'student_id,subject,score_type,semester,academic_year',
      ignoreDuplicates: false,
    });
    if (scErr) {
      // Fallback: insert row-by-row if upsert constraint fails
      for (const row of scoreRows) {
        const { error: singleErr } = await supabase.from('score_records').insert(row);
        if (!singleErr) result.scoresInserted++;
      }
    } else {
      result.scoresInserted = scoreRows.length;
    }
  }

  onProgress?.('กำลังบันทึกผลการประเมิน 4 ด้านมาตรฐาน สพฐ....', 65);

  // 3. Upsert 4-dimension evaluations into student_obec_evaluations
  const evalRows: EvaluationRowInsert[] = [];
  const year = parsed.schoolInfo.academicYear;

  for (const st of parsed.students) {
    const sId = parsedStudentIds[st.no];
    if (!sId) continue;

    // Competencies 5 ด้าน
    const comp = parsed.competencies.find(c => c.studentNo === st.no);
    if (comp) {
      const compKeys = ['communication', 'thinking', 'problem_solving', 'life_skills', 'technology'];
      comp.scores.forEach((sc, idx) => {
        evalRows.push({
          student_id: sId,
          academic_year: year,
          semester: 'all',
          evaluation_type: 'competency',
          category_key: compKeys[idx],
          item_key: String(idx + 1),
          score: sc,
          status: levelToShort(sc),
          notes: comp.grade,
        });
      });
    }

    // Character 8 ข้อ
    const chr = parsed.character.find(c => c.studentNo === st.no);
    if (chr) {
      const cScores = [chr.c1, chr.c2, chr.c3, chr.c4, chr.c5, chr.c6, chr.c7, chr.c8];
      cScores.forEach((sc, idx) => {
        evalRows.push({
          student_id: sId,
          academic_year: year,
          semester: 'all',
          evaluation_type: 'character',
          category_key: `c${idx + 1}`,
          item_key: String(idx + 1),
          score: sc,
          status: levelToShort(sc),
          notes: chr.totalGrade,
        });
      });
    }

    // Reading, Thinking & Writing 5 ข้อ
    const rd = parsed.reading.find(r => r.studentNo === st.no);
    if (rd) {
      const qScores = [rd.q1, rd.q2, rd.q3, rd.q4, rd.q5];
      qScores.forEach((sc, idx) => {
        evalRows.push({
          student_id: sId,
          academic_year: year,
          semester: 'all',
          evaluation_type: 'reading_thinking',
          category_key: idx < 2 ? 'reading' : idx < 4 ? 'thinking' : 'writing',
          item_key: String(idx + 1),
          score: sc,
          status: levelToShort(sc),
          notes: rd.grade,
        });
      });
    }

    // Student activities 4 กิจกรรม
    const act = parsed.activities.find(a => a.studentNo === st.no);
    if (act) {
      const actItems = [
        { key: 'guidance', item: act.guidance },
        { key: 'scout', item: act.scout },
        { key: 'club', item: act.club },
        { key: 'social', item: act.social },
      ];
      actItems.forEach(({ key, item }) => {
        evalRows.push({
          student_id: sId,
          academic_year: year,
          semester: 'all',
          evaluation_type: 'activity',
          category_key: key,
          item_key: null,
          score: item.hours,
          status: item.status,
          notes: act.summary,
        });
      });
    }
  }

  if (evalRows.length > 0) {
    const { error: evErr } = await supabase.from('student_obec_evaluations').upsert(evalRows, {
      onConflict: 'student_id,academic_year,semester,evaluation_type,category_key,item_key',
    });
    if (evErr) {
      result.errors.push(`บันทึกการประเมิน 4 ด้านไม่สำเร็จ: ${evErr.message}`);
    } else {
      result.evaluationsInserted = evalRows.length;
    }
  }

  onProgress?.('กำลังบันทึกสรุปผลการตัดสินเลื่อนชั้นและสมุดพก...', 90);

  // 4. Upsert Promotion & Decision Records
  const promoRows: PromotionRowInsert[] = [];
  for (const promo of parsed.promotions) {
    const sId = parsedStudentIds[promo.studentNo];
    if (!sId) continue;

    promoRows.push({
      student_id: sId,
      academic_year: year,
      attendance_percent: promo.attendancePct,
      attendance_status: promo.attendancePass,
      indicator_status: promo.indicatorsPass,
      gpa: promo.gpa,
      academic_pass: promo.academicPass,
      competency_grade: promo.competencyGrade,
      character_grade: promo.characterGrade,
      reading_grade: promo.readingGrade,
      activities_status: promo.activitiesPass,
      promotion_decision: promo.promotionDecision,
      promoted_to_level: promo.promotionDecision === 'promoted' ? 'ชั้นประถมศึกษาปีที่ 6' : null,
      teacher_comment_term1: promo.teacherCommentTerm1,
      teacher_comment_term2: promo.teacherCommentTerm2,
      parent_comment: promo.parentComment,
      approved_by: parsed.schoolInfo.teacherName,
      approved_at: new Date().toISOString(),
    });
  }

  if (promoRows.length > 0) {
    const { error: prErr } = await supabase.from('student_term_promotion_records').upsert(promoRows, {
      onConflict: 'student_id,academic_year',
    });
    if (prErr) {
      result.errors.push(`บันทึกการตัดสินเลื่อนชั้นไม่สำเร็จ: ${prErr.message}`);
    } else {
      result.promotionsInserted = promoRows.length;
    }
  }

  onProgress?.('นำเข้าข้อมูลเสร็จสมบูรณ์!', 100);
  return result;
}

// ===== Export to Excel Workbook =====

export function exportPaporWorkbookToBlob(data: PaporWorkbookParsedData): Blob {
  const wb = xlsx.utils.book_new();

  // Sheet 1: ข้อมูลพื้นฐาน
  const basicRows = [
    ['ข้อมูลพื้นฐาน'],
    [],
    ['โรงเรียน', data.schoolInfo.schoolName],
    ['สังกัด', data.schoolInfo.district],
    ['ปีการศึกษา', data.schoolInfo.academicYear],
    ['ระดับชั้น', data.schoolInfo.gradeLevel],
    ['ครูประจำชั้น', data.schoolInfo.teacherName],
    ['ผู้อำนวยการ', data.schoolInfo.directorName],
    ['นายทะเบียน', data.schoolInfo.registrarName],
    [],
    ['รายวิชา', 'ครูผู้สอน', 'รหัสวิชา', 'สัดส่วนระหว่างภาค', 'สัดส่วนปลายภาค', 'น้ำหนัก/หน่วยกิต', 'กลุ่มสาระ'],
    ...data.subjects.map(s => [
      s.name,
      s.teacher || data.schoolInfo.teacherName,
      s.code,
      s.ratioFormative,
      s.ratioSummative,
      s.weight,
      s.learningArea,
    ]),
  ];
  const wsBasic = xlsx.utils.aoa_to_sheet(basicRows);
  xlsx.utils.book_append_sheet(wb, wsBasic, 'ข้อมูลพื้นฐาน');

  // Sheet 2: รายชื่อนักเรียน
  const studentRows = [
    ['รายชื่อนักเรียน'],
    ['เลขที่', 'เลขประจำตัว', 'ชื่อ-สกุล', 'เลขบัตรประชาชน', 'วันเดือนปีเกิด', 'ชื่อเล่น', 'ชื่อบิดา', 'ชื่อมารดา'],
    ...data.students.map(s => [
      s.no,
      s.studentCode,
      s.fullName,
      s.nationalId,
      s.birthDate,
      s.nickname,
      s.fatherName,
      s.motherName,
    ]),
  ];
  const wsStudents = xlsx.utils.aoa_to_sheet(studentRows);
  xlsx.utils.book_append_sheet(wb, wsStudents, 'รายชื่อนักเรียน');

  // Sheet 3: สรุปเกรดและผลการเรียน
  const promoRows = [
    ['สรุปผลการเรียนและเลื่อนชั้น'],
    [
      'เลขที่',
      'เลขประจำตัว',
      'ชื่อ-สกุล',
      'เกรดเฉลี่ย (GPA)',
      'เวลาเรียน (%)',
      'สมรรถนะ',
      'คุณลักษณะฯ',
      'อ่านคิดวิเคราะห์',
      'กิจกรรม',
      'ผลการตัดสิน',
    ],
    ...data.promotions.map(p => [
      p.studentNo,
      p.studentCode,
      p.studentName,
      p.gpa,
      `${p.attendancePct}%`,
      p.competencyGrade,
      p.characterGrade,
      p.readingGrade,
      p.activitiesPass ? 'ผ่าน' : 'ไม่ผ่าน',
      p.promotionDecision === 'promoted' ? 'เลื่อนชั้น' : 'ไม่เลื่อนชั้น',
    ]),
  ];
  const wsPromo = xlsx.utils.aoa_to_sheet(promoRows);
  xlsx.utils.book_append_sheet(wb, wsPromo, 'สรุปผลการเรียน');

  const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ===== Query Service =====

export const paporEvaluationService = {
  /** โหลดการประเมิน 4 ด้านตามห้องและปีการศึกษา */
  async getEvaluations(academicYear: string, studentIds: string[]) {
    if (studentIds.length === 0) return [];
    const { data } = await supabase
      .from('student_obec_evaluations')
      .select('*')
      .eq('academic_year', academicYear)
      .in('student_id', studentIds);
    return data || [];
  },

  /** โหลดผลการตัดสินเลื่อนชั้น */
  async getPromotionRecords(academicYear: string, studentIds: string[]) {
    if (studentIds.length === 0) return [];
    const { data } = await supabase
      .from('student_term_promotion_records')
      .select('*')
      .eq('academic_year', academicYear)
      .in('student_id', studentIds);
    return data || [];
  },

  /** อัปเดตผลการตัดสินเลื่อนชั้น */
  async updatePromotionRecord(record: PromotionRowInsert) {
    return supabase.from('student_term_promotion_records').upsert(record, {
      onConflict: 'student_id,academic_year',
    });
  },
};
