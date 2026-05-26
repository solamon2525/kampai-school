/**
 * dmc-export.service.ts
 * Generates Excel file matching DMC (Data Management Center, สพฐ.) schema.
 * Joins students + latest growth measurements + health profile.
 *
 * Schema reference: ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล (DMC)
 * https://portal.bopp-obec.info/obec-dmc/
 */
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface DmcRow {
  ลำดับ: number;
  รหัสนักเรียน: string;
  เลขประจำตัวประชาชน: string;
  คำนำหน้า: string;
  ชื่อ: string;
  นามสกุล: string;
  ชื่อเล่น: string;
  เพศ: string;
  วันเกิด: string;
  สัญชาติ: string;
  ศาสนา: string;
  ชั้น: string;
  ห้อง: string;
  เลขที่: string;
  น้ำหนัก_kg: number | string;
  ส่วนสูง_cm: number | string;
  กรุ๊ปเลือด: string;
  ที่อยู่_ปัจจุบัน: string;
  ตำบล_ปัจจุบัน: string;
  อำเภอ_ปัจจุบัน: string;
  จังหวัด_ปัจจุบัน: string;
  รหัสไปรษณีย์_ปัจจุบัน: string;
  ชื่อบิดา: string;
  เบอร์บิดา: string;
  อาชีพบิดา: string;
  ชื่อมารดา: string;
  เบอร์มารดา: string;
  อาชีพมารดา: string;
  ผู้ปกครอง: string;
  ความสัมพันธ์: string;
  เบอร์ผู้ปกครอง: string;
  ผู้ติดต่อฉุกเฉิน: string;
  เบอร์ฉุกเฉิน: string;
  อาการแพ้: string;
}

const TITLE_TH: Record<string, string> = {
  M: 'นาย', F: 'นางสาว', male: 'ด.ช.', female: 'ด.ญ.',
  ชาย: 'ด.ช.', หญิง: 'ด.ญ.',
};

export const dmcExportService = {
  async fetchRows(classFilter?: string): Promise<DmcRow[]> {
    let q = supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('class')
      .order('class_number');
    if (classFilter) q = q.eq('class', classFilter);
    const { data: students, error } = await q;
    if (error) throw error;

    const studentIds = (students ?? []).map((s: any) => s.id);
    if (!studentIds.length) return [];

    // Latest growth per student
    const { data: growthRows } = await supabase
      .from('student_latest_growth' as any)
      .select('*')
      .in('student_id', studentIds);
    const growthMap = new Map<string, any>();
    for (const g of (growthRows as any[]) ?? []) growthMap.set(g.student_id, g);

    // Health profile (blood type, allergies)
    const { data: healthRows } = await supabase
      .from('student_health_records' as any)
      .select('*')
      .in('student_id', studentIds);
    const healthMap = new Map<string, any>();
    for (const h of (healthRows as any[]) ?? []) healthMap.set(h.student_id, h);

    return (students ?? []).map((s: any, idx: number): DmcRow => {
      const g = growthMap.get(s.id);
      const h = healthMap.get(s.id);
      const title = s.title || (s.gender ? TITLE_TH[s.gender] : '') || '';
      return {
        ลำดับ: idx + 1,
        รหัสนักเรียน: s.student_code ?? '',
        เลขประจำตัวประชาชน: s.national_id ?? '',
        คำนำหน้า: title,
        ชื่อ: s.first_name ?? s.name?.split(' ')[0] ?? '',
        นามสกุล: s.last_name ?? s.name?.split(' ').slice(1).join(' ') ?? '',
        ชื่อเล่น: s.nickname ?? '',
        เพศ: s.gender ?? '',
        วันเกิด: s.birth_date ?? '',
        สัญชาติ: s.nationality ?? 'ไทย',
        ศาสนา: s.religion ?? '',
        ชั้น: s.class ?? '',
        ห้อง: s.room ?? '',
        เลขที่: s.class_number ?? '',
        น้ำหนัก_kg: g?.weight_kg ?? '',
        ส่วนสูง_cm: g?.height_cm ?? '',
        กรุ๊ปเลือด: h?.blood_type ?? s.blood_type ?? '',
        ที่อยู่_ปัจจุบัน: s.current_address ?? '',
        ตำบล_ปัจจุบัน: s.current_subdistrict ?? '',
        อำเภอ_ปัจจุบัน: s.current_district ?? '',
        จังหวัด_ปัจจุบัน: s.current_province ?? '',
        รหัสไปรษณีย์_ปัจจุบัน: s.current_postal_code ?? '',
        ชื่อบิดา: s.father_name ?? '',
        เบอร์บิดา: s.father_phone ?? '',
        อาชีพบิดา: s.father_occupation ?? '',
        ชื่อมารดา: s.mother_name ?? '',
        เบอร์มารดา: s.mother_phone ?? '',
        อาชีพมารดา: s.mother_occupation ?? '',
        ผู้ปกครอง: s.guardian_name ?? '',
        ความสัมพันธ์: s.guardian_relation ?? '',
        เบอร์ผู้ปกครอง: s.guardian_phone ?? '',
        ผู้ติดต่อฉุกเฉิน: h?.emergency_contact_name ?? '',
        เบอร์ฉุกเฉิน: h?.emergency_contact_phone ?? '',
        อาการแพ้: (h?.allergies ?? []).join(', '),
      };
    });
  },

  /** Build and trigger a download of an Excel file with one sheet. */
  async downloadExcel(classFilter?: string, fileName?: string) {
    const rows = await this.fetchRows(classFilter);
    if (!rows.length) throw new Error('ไม่มีข้อมูลนักเรียน');
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns (rough heuristic — max label width)
    const cols = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(
        key.length + 2,
        ...rows.slice(0, 50).map((r) => String((r as any)[key] ?? '').length + 1),
      ),
    }));
    (ws as any)['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DMC');
    const today = new Date().toISOString().slice(0, 10);
    const name = fileName ?? `DMC_export_${classFilter ?? 'all'}_${today}.xlsx`;
    XLSX.writeFile(wb, name);
    return rows.length;
  },
};
