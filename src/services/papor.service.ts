/**
 * papor.service.ts
 * Aggregates per-student data for ปพ.5 (per-term) and ปพ.6 (per-year) PDF generation.
 * Pulls from: students, score_records, attendance_records, conduct_scores.
 */
import { supabase } from '@/integrations/supabase/client';

export type Semester = '1' | '2';

export interface PaporSubjectScore {
  subject: string;
  total: number;
  max: number;
  percent: number;
  grade: string;
}

export interface PaporAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalDays: number;
  presentPercent: number;
}

export interface PaporConductSummary {
  positiveCount: number;
  negativeCount: number;
  netScore: number;
  topReasons: string[];
}

export interface PaporStudentData {
  student: {
    id: string;
    name: string;
    student_code: string | null;
    class: string | null;
    room: string | null;
    class_number: number | null;
    photo_url: string | null;
    birth_date: string | null;
    nationality: string | null;
    religion: string | null;
    father_name: string | null;
    mother_name: string | null;
  };
  academicYear: string;
  semester: Semester;
  scores: PaporSubjectScore[];
  attendance: PaporAttendanceSummary;
  conduct: PaporConductSummary;
  averagePercent: number;
  averageGrade: string;
}

/** Thai grading scale (สพฐ. 4-point) */
export function percentToGrade(percent: number): string {
  if (percent >= 80) return '4';
  if (percent >= 75) return '3.5';
  if (percent >= 70) return '3';
  if (percent >= 65) return '2.5';
  if (percent >= 60) return '2';
  if (percent >= 55) return '1.5';
  if (percent >= 50) return '1';
  return '0';
}

function termDateRange(academicYear: string, semester: Semester): { start: string; end: string } {
  // Thai academic year: เทอม 1 = พ.ค.-ก.ย., เทอม 2 = พ.ย.-มี.ค.
  const startCE = parseInt(academicYear) - 543;
  if (semester === '1') {
    return { start: `${startCE}-05-01`, end: `${startCE}-10-15` };
  }
  return { start: `${startCE}-11-01`, end: `${startCE + 1}-03-31` };
}

export const paporService = {
  /** Aggregate data for ปพ.5 — one student, one term */
  async forStudentTerm(
    studentId: string,
    academicYear: string,
    semester: Semester,
  ): Promise<PaporStudentData | null> {
    const { data: student } = await supabase
      .from('students')
      .select('id, name, student_code, class, room, class_number, photo_url, birth_date, nationality, religion, father_name, mother_name')
      .eq('id', studentId)
      .maybeSingle();
    if (!student) return null;

    const [scoresRes, conductRes, attendanceRes] = await Promise.all([
      supabase
        .from('score_records')
        .select('subject, score, max_score, score_type')
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('semester', semester),
      supabase
        .from('conduct_scores' as any)
        .select('type, score, reason')
        .eq('student_id', studentId)
        .eq('academic_year', academicYear)
        .eq('semester', semester),
      (async () => {
        const { start, end } = termDateRange(academicYear, semester);
        return supabase
          .from('attendance_records')
          .select('status')
          .eq('student_id', studentId)
          .gte('attendance_date', start)
          .lte('attendance_date', end);
      })(),
    ]);

    // ─── Scores: group by subject (sum across score_types) ─────────────
    const subjectMap = new Map<string, { total: number; max: number }>();
    for (const r of scoresRes.data ?? []) {
      const cur = subjectMap.get(r.subject) ?? { total: 0, max: 0 };
      cur.total += Number(r.score ?? 0);
      cur.max += Number(r.max_score ?? 0);
      subjectMap.set(r.subject, cur);
    }
    const scores: PaporSubjectScore[] = Array.from(subjectMap.entries()).map(([subject, v]) => {
      const percent = v.max > 0 ? (v.total / v.max) * 100 : 0;
      return {
        subject,
        total: v.total,
        max: v.max,
        percent: Math.round(percent * 10) / 10,
        grade: percentToGrade(percent),
      };
    });
    scores.sort((a, b) => a.subject.localeCompare(b.subject, 'th'));

    const totalScore = scores.reduce((s, x) => s + x.total, 0);
    const totalMax = scores.reduce((s, x) => s + x.max, 0);
    const averagePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0;
    const averageGrade = percentToGrade(averagePercent);

    // ─── Attendance ─────────────────────────────────────────────────────
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of attendanceRes.data ?? []) {
      const s = (r as any).status as keyof typeof counts;
      if (counts[s] !== undefined) counts[s] += 1;
    }
    const totalDays = counts.present + counts.absent + counts.late + counts.leave;
    const attendance: PaporAttendanceSummary = {
      ...counts,
      totalDays,
      presentPercent: totalDays > 0 ? Math.round(((counts.present + counts.late) / totalDays) * 1000) / 10 : 0,
    };

    // ─── Conduct ────────────────────────────────────────────────────────
    let positive = 0, negative = 0, net = 0;
    const reasons = new Map<string, number>();
    for (const r of (conductRes.data ?? []) as any[]) {
      const score = Number(r.score ?? 0);
      if (r.type === 'add') {
        positive += 1;
        net += score;
      } else {
        negative += 1;
        net -= score;
      }
      if (r.reason) reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1);
    }
    const topReasons = Array.from(reasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([r]) => r);

    return {
      student: student as any,
      academicYear,
      semester,
      scores,
      attendance,
      conduct: { positiveCount: positive, negativeCount: negative, netScore: net, topReasons },
      averagePercent,
      averageGrade,
    };
  },

  /** List active classes for the picker */
  async listClasses(): Promise<string[]> {
    const { data } = await supabase
      .from('students')
      .select('class')
      .eq('is_active', true);
    const set = new Set<string>();
    for (const r of (data ?? []) as any[]) {
      if (r.class) set.add(r.class);
    }
    return Array.from(set).sort();
  },

  /** Students in a class */
  async listStudentsInClass(className: string) {
    const { data } = await supabase
      .from('students')
      .select('id, name, class, room, class_number, student_code, photo_url')
      .eq('is_active', true)
      .eq('class', className)
      .order('class_number');
    return data ?? [];
  },
};
