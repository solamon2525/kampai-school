/**
 * digital-ops.service.ts — KPI ลดภาระครู / Role Model / รายงาน (Migration 452)
 */
import { supabase } from '@/integrations/supabase/client';
import { educationalHubService } from '@/services/educational-hub.service';
import { assignmentsService } from '@/services/assignments.service';
import { suppliesService } from '@/services/supplies.service';
import { surveysService } from '@/services/surveys.service';

export type WorkloadBaseline = {
  id: string;
  workflow_key: string;
  workflow_label: string;
  minutes_before: number;
  minutes_after: number;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
};

export type PaperLog = {
  id: string;
  year_be: number;
  month: number;
  sheets_used: number;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type RoleModelRow = {
  staffId: string;
  name: string;
  photoUrl: string | null;
  score: number;
  badges: string[];
};

const SURVEY_TITLE = 'ความพึงพอใจระบบดิจิทัลลดภาระครู (รายเดือน)';

export const digitalOpsService = {
  listBaselines: async (): Promise<WorkloadBaseline[]> => {
    const { data, error } = await supabase
      .from('digital_workload_baselines' as never)
      .select('*')
      .order('workflow_label');
    if (error) throw error;
    return (data ?? []) as WorkloadBaseline[];
  },

  upsertBaseline: async (row: {
    workflow_key: string;
    workflow_label: string;
    minutes_before: number;
    minutes_after: number;
    note?: string;
    recorded_by?: string | null;
  }) => {
    const { data, error } = await supabase
      .from('digital_workload_baselines' as never)
      .upsert(
        {
          ...row,
          note: row.note ?? null,
          recorded_at: new Date().toISOString(),
        } as never,
        { onConflict: 'workflow_key' },
      )
      .select()
      .single();
    if (error) throw error;
    return data as WorkloadBaseline;
  },

  listPaperLogs: async (yearBe?: number): Promise<PaperLog[]> => {
    let q = supabase
      .from('digital_paper_logs' as never)
      .select('*')
      .order('year_be', { ascending: false })
      .order('month', { ascending: false });
    if (yearBe) q = q.eq('year_be', yearBe);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as PaperLog[];
  },

  upsertPaperLog: async (row: {
    year_be: number;
    month: number;
    sheets_used: number;
    note?: string;
    recorded_by?: string | null;
  }) => {
    const { data, error } = await supabase
      .from('digital_paper_logs' as never)
      .upsert(
        {
          ...row,
          note: row.note ?? null,
        } as never,
        { onConflict: 'year_be,month' },
      )
      .select()
      .single();
    if (error) throw error;
    return data as PaperLog;
  },

  /** Ensure monthly staff satisfaction survey exists and is published. */
  ensureSatisfactionSurvey: async (): Promise<{ id: string; responseCount: number; created: boolean }> => {
    const all = await surveysService.listAll();
    const existing = all.find((s) => s.title === SURVEY_TITLE);
    if (existing) {
      if (!existing.is_published) await surveysService.togglePublish(existing.id, true);
      return { id: existing.id, responseCount: existing.response_count, created: false };
    }
    const created = await surveysService.create({
      title: SURVEY_TITLE,
      description: 'แบบประเมินตามแนวทางลดภาระครูด้วยดิจิทัล — ใช้วัดความพึงพอใจและความสะดวกในการใช้งาน',
      audience: 'staff',
      is_anonymous: true,
      questions: [
        {
          order_index: 0,
          question_text: 'ความพึงพอใจโดยรวมต่อการใช้ระบบดิจิทัลในการทำงานธุรการ',
          type: 'rating_5',
          options: null,
          is_required: true,
        },
        {
          order_index: 1,
          question_text: 'ระบบช่วยลดเวลาจัดทำเอกสารได้มากน้อยเพียงใด',
          type: 'rating_5',
          options: null,
          is_required: true,
        },
        {
          order_index: 2,
          question_text: 'ข้อเสนอแนะเพิ่มเติม',
          type: 'text',
          options: null,
          is_required: false,
        },
      ],
    });
    await surveysService.togglePublish(created.id, true);
    return { id: created.id, responseCount: 0, created: true };
  },

  /** Aggregate live KPIs for Digital Ops dashboard. */
  kpiSummary: async (sinceDays = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    const sinceIso = since.toISOString();

    const [
      leaveRes,
      lettersIn,
      lettersOut,
      habit,
      homework,
      pendingSupplies,
      lowStock,
      baselines,
      paperLogs,
      survey,
      staffCountRes,
    ] = await Promise.all([
      supabase
        .from('leave_requests' as never)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso),
      supabase
        .from('incoming_letters' as never)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso),
      supabase
        .from('outgoing_letters' as never)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso),
      educationalHubService.getNonAdminUploadHabit(sinceDays),
      assignmentsService.opsSummary(sinceDays),
      suppliesService.countPending(),
      suppliesService.lowStockItems(),
      digitalOpsService.listBaselines(),
      digitalOpsService.listPaperLogs(),
      digitalOpsService.ensureSatisfactionSurvey(),
      supabase.from('staff' as never).select('*', { count: 'exact', head: true }),
    ]);

    const avgTimeSavedPct =
      baselines.length === 0
        ? null
        : Math.round(
            (baselines.reduce((sum, b) => {
              if (Number(b.minutes_before) <= 0) return sum;
              return sum + (1 - Number(b.minutes_after) / Number(b.minutes_before)) * 100;
            }, 0) /
              baselines.length) *
              10,
          ) / 10;

    const paperSorted = [...paperLogs].sort((a, b) =>
      a.year_be !== b.year_be ? a.year_be - b.year_be : a.month - b.month,
    );
    const latestPaper = paperSorted.at(-1) ?? null;
    const prevPaper = paperSorted.at(-2) ?? null;
    const paperDelta =
      latestPaper && prevPaper ? latestPaper.sheets_used - prevPaper.sheets_used : null;

    return {
      sinceDays,
      digitalSystemsInUse: 5, // สารบรรณ · นักเรียน · คลังสื่อ · ลา · พัสดุ
      leaveRequests: leaveRes.count ?? 0,
      letters: (lettersIn.count ?? 0) + (lettersOut.count ?? 0),
      teacherUploaders: habit.uploaderCount,
      homeworkSubmissions: homework.submissions,
      pendingSupplies,
      lowStockCount: lowStock.length,
      staffTotal: staffCountRes.count ?? 0,
      avgTimeSavedPct,
      baselinesCount: baselines.length,
      latestPaper,
      paperDelta,
      surveyId: survey.id,
      surveyResponses: survey.responseCount,
    };
  },

  /** Score staff for Digital Role Model board. */
  roleModels: async (limit = 12): Promise<RoleModelRow[]> => {
    const { data: staffRows, error: staffErr } = await supabase
      .from('staff' as never)
      .select('id, name, photo_url')
      .order('name');
    if (staffErr) throw staffErr;
    const staff = (staffRows ?? []) as Array<{ id: string; name: string; photo_url: string | null }>;
    if (!staff.length) return [];

    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceIso = since.toISOString();

    const [itemsRes, leaveRes, gradeRes, supplyRes, rolesRes] = await Promise.all([
      supabase
        .from('educational_hub_items' as never)
        .select('owner_staff_id')
        .eq('is_published', true)
        .gte('created_at', sinceIso),
      supabase
        .from('leave_requests' as never)
        .select('staff_id')
        .gte('created_at', sinceIso),
      supabase
        .from('assignment_submissions' as never)
        .select('graded_by')
        .not('graded_at', 'is', null)
        .gte('graded_at', sinceIso),
      supabase
        .from('supply_requests' as never)
        .select('staff_id')
        .in('status', ['จ่ายแล้ว', 'อนุมัติ'])
        .gte('created_at', sinceIso),
      supabase
        .from('user_roles' as never)
        .select('user_id, staff_id')
        .not('staff_id', 'is', null),
    ]);

    const userToStaff = new Map(
      ((rolesRes.data ?? []) as Array<{ user_id: string; staff_id: string }>).map((r) => [
        r.user_id,
        r.staff_id,
      ]),
    );

    const uploadCounts = new Map<string, number>();
    for (const r of (itemsRes.data ?? []) as Array<{ owner_staff_id: string | null }>) {
      if (!r.owner_staff_id) continue;
      uploadCounts.set(r.owner_staff_id, (uploadCounts.get(r.owner_staff_id) ?? 0) + 1);
    }
    const leaveCounts = new Map<string, number>();
    for (const r of (leaveRes.data ?? []) as Array<{ staff_id: string }>) {
      leaveCounts.set(r.staff_id, (leaveCounts.get(r.staff_id) ?? 0) + 1);
    }
    const gradeCounts = new Map<string, number>();
    for (const r of (gradeRes.data ?? []) as Array<{ graded_by: string | null }>) {
      if (!r.graded_by) continue;
      const sid = userToStaff.get(r.graded_by);
      if (!sid) continue;
      gradeCounts.set(sid, (gradeCounts.get(sid) ?? 0) + 1);
    }
    const supplyCounts = new Map<string, number>();
    for (const r of (supplyRes.data ?? []) as Array<{ staff_id: string }>) {
      supplyCounts.set(r.staff_id, (supplyCounts.get(r.staff_id) ?? 0) + 1);
    }

    const rows: RoleModelRow[] = staff.map((s) => {
      const badges: string[] = [];
      let score = 0;
      const up = uploadCounts.get(s.id) ?? 0;
      const lv = leaveCounts.get(s.id) ?? 0;
      const gr = gradeCounts.get(s.id) ?? 0;
      const sp = supplyCounts.get(s.id) ?? 0;
      if (up > 0) {
        badges.push('อัปสื่อ');
        score += Math.min(up, 5) * 3;
      }
      if (lv > 0) {
        badges.push('ลาออนไลน์');
        score += Math.min(lv, 3) * 2;
      }
      if (gr > 0) {
        badges.push('ตรวจการบ้าน');
        score += Math.min(gr, 10);
      }
      if (sp > 0) {
        badges.push('เบิกพัสดุ');
        score += Math.min(sp, 5) * 2;
      }
      return {
        staffId: s.id,
        name: s.name,
        photoUrl: s.photo_url,
        score,
        badges,
      };
    });

    return rows
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  buildReportMarkdown: async () => {
    const kpi = await digitalOpsService.kpiSummary(30);
    const baselines = await digitalOpsService.listBaselines();
    const models = await digitalOpsService.roleModels(5);
    const schoolName = 'โรงเรียนบ้านคำไผ่';

    const timeRows = baselines
      .map(
        (b) =>
          `| ${b.workflow_label} | ${b.minutes_before} | ${b.minutes_after} | ${
            Number(b.minutes_before) > 0
              ? Math.round((1 - Number(b.minutes_after) / Number(b.minutes_before)) * 100)
              : 0
          }% |`,
      )
      .join('\n');

    return `# รายงานผลการดำเนินงานลดภาระงานครูของสถานศึกษา
ด้วยนวัตกรรม และ/หรือ เทคโนโลยีดิจิทัล
ประจำปีงบประมาณ ${(new Date().getFullYear() + 543 + (new Date().getMonth() >= 9 ? 1 : 0))}
${schoolName}

ชื่อผลงาน Kampai Smart Office — ปรับกระบวนการ พลิกงานเอกสาร สู่ระบบดิจิทัล

## ๑. หลักการและเหตุผล
สถานศึกษานำนโยบายลดภาระงานครูของ สพฐ. มาสู่การปฏิบัติ โดยบูรณาการระบบดิจิทัลบนเว็บไซต์โรงเรียน เพื่อลดงานเอกสารซ้ำซ้อน คืนเวลาให้ครูจัดการเรียนรู้และดูแลผู้เรียน

## ๒. วัตถุประสงค์
๒.๑ พัฒนาระบบงานเอกสารและธุรการให้เป็น Digital Workflow
๒.๒ ลดระยะเวลาและภาระงานเชิงธุรการของครู
๒.๓ สร้างเสริมทักษะดิจิทัลและวัฒนธรรมองค์กรที่ยั่งยืน

## ๓. เป้าหมายเชิงปริมาณ (สถานะปัจจุบัน)
- ระบบงานดิจิทัลหลักที่ใช้งาน: ${kpi.digitalSystemsInUse} ระบบ (สารบรรณ · ข้อมูลนักเรียน · คลังสื่อ · การลา · พัสดุ)
- การลาออนไลน์ ${kpi.sinceDays} วัน: ${kpi.leaveRequests} รายการ
- หนังสือสารบรรณ ${kpi.sinceDays} วัน: ${kpi.letters} ฉบับ
- ครู non-admin อัปสื่อ: ${kpi.teacherUploaders} คน
- ส่งงานการบ้าน: ${kpi.homeworkSubmissions} ชิ้น
- ความพึงพอใจ (แบบสำรวจ): ${kpi.surveyResponses} ตอบกลับ
- เวลาเฉลี่ยที่ลดได้จาก baseline: ${kpi.avgTimeSavedPct != null ? `${kpi.avgTimeSavedPct}%` : 'ยังไม่บันทึก'}

## ๔. วิธีการดำเนินงาน (PDCA)
- Plan: วิเคราะห์งานธุรการและจัดลำดับระบบที่เปลี่ยนเป็นดิจิทัลได้ทันที
- Do: ใช้งาน ๕ ระบบงานหลัก + Digital Clinic / Onboarding
- Check: แดชบอร์ดลดภาระครู + แบบสำรวจความพึงพอใจ + ตัวชี้วัดเวลา/กระดาษ
- Act: Digital Role Model และการแลกเปลี่ยนเรียนรู้ (PLC)

## ๕. ตัวชี้วัด Time-Saving
| งาน | นาทีก่อน | นาทีหลัง | ลดลง |
|---|---:|---:|---:|
${timeRows || '| — | — | — | — |'}

## ๖. Digital Role Model (ล่าสุด)
${models.map((m, i) => `${i + 1}. ${m.name} — ${m.badges.join(', ')} (คะแนน ${m.score})`).join('\n') || '— ยังไม่มีข้อมูล adoption พอ'}

## ๗. การเผยแพร่
เผยแพร่ผ่านเว็บไซต์โรงเรียน เพจเฟซบุ๊ก และ LINE ผู้ปกครอง พร้อมใช้รายงานนี้เป็นแหล่งเรียนรู้ต้นแบบ

---
สร้างอัตโนมัติจากระบบเมื่อ ${new Date().toLocaleString('th-TH')}
`;
  },
};
