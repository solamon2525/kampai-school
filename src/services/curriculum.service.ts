/**
 * curriculum.service.ts
 * กระดูกสันหลังตัวชี้วัด (migration 170) — ตัวชี้วัดหลักสูตรแกนกลาง 2551 ระดับนักเรียน
 * เชื่อม เกม ↔ ตัวชี้วัด ↔ แผนการเรียน ↔ ความก้าวหน้านักเรียน (หลักฐานผสม เกม + สมุดคะแนน)
 *
 * NOTE: ใช้ `as never` casts ตาม pattern เดียวกับ educational-hub.service.ts
 */
import { supabase } from '@/integrations/supabase/client';

export type CurriculumIndicator = {
    id: string;
    subject_key: string;
    grade: string;
    strand_no: string | null;
    strand_title: string | null;
    standard_code: string | null;
    indicator_code: string;
    description: string;
    sort_order: number;
    is_active: boolean;
};

/** สถานะความก้าวหน้าต่อ (นักเรียน, ตัวชี้วัด) จาก view รวม */
export type IndicatorMasteryStatus = 'not_started' | 'practicing' | 'passed' | 'mastered';

export type StudentIndicatorMastery = {
    student_id: string;
    indicator_id: string;
    attempts: number;
    any_passed: boolean;
    best_score: number | null;
    last_event: string | null;
    assessed_level: number | null;
    assessed_source: string | null;
    status: IndicatorMasteryStatus;
};

export type StudentIndicatorAssessment = {
    id: string;
    student_id: string;
    indicator_id: string;
    level: number | null;
    academic_year: string;
    semester: string | null;
    source: string;
    assessed_by: string | null;
    note: string | null;
    updated_at: string;
};

export const curriculumService = {
    // ─── ตัวชี้วัด ──────────────────────────────────────────────────────────
    /** ลิสต์ตัวชี้วัดตามวิชา + ชั้น (เรียงตาม sort_order) */
    listIndicators: (subjectKey: string, grade: string) =>
        supabase
            .from('curriculum_indicators' as never)
            .select('*')
            .eq('subject_key', subjectKey)
            .eq('grade', grade)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

    /** สรุปจำนวนตัวชี้วัดต่อวิชา/ชั้น (สำหรับ admin overview) */
    listAllIndicators: (subjectKey?: string) => {
        let q = supabase.from('curriculum_indicators' as never).select('*');
        if (subjectKey) q = q.eq('subject_key', subjectKey);
        return q.order('subject_key').order('grade').order('sort_order');
    },

    // ─── Mapping: เกม ↔ ตัวชี้วัด ─────────────────────────────────────────────
    /** indicator_id ที่ผูกกับเกม (edu_hub_item) นี้ */
    listGameIndicatorIds: async (eduHubItemId: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('indicator_games' as never)
            .select('indicator_id')
            .eq('edu_hub_item_id', eduHubItemId);
        if (error) throw error;
        return ((data ?? []) as { indicator_id: string }[]).map((r) => r.indicator_id);
    },

    /** แทนที่ชุด mapping ของเกม (ลบเก่า + ใส่ใหม่) */
    setGameIndicators: async (
        eduHubItemId: string,
        indicatorIds: string[],
    ): Promise<{ error: Error | null }> => {
        const del = await supabase
            .from('indicator_games' as never)
            .delete()
            .eq('edu_hub_item_id', eduHubItemId);
        if (del.error) return { error: del.error as Error };
        if (indicatorIds.length === 0) return { error: null };
        const rows = indicatorIds.map((id) => ({
            indicator_id: id,
            edu_hub_item_id: eduHubItemId,
        }));
        const ins = await supabase.from('indicator_games' as never).insert(rows as never);
        return { error: (ins.error as Error | null) ?? null };
    },

    // ─── Mapping: แผนการเรียน ↔ ตัวชี้วัด ─────────────────────────────────────
    listLessonPlanIndicatorIds: async (lessonPlanId: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('indicator_lesson_plans' as never)
            .select('indicator_id')
            .eq('lesson_plan_id', lessonPlanId);
        if (error) throw error;
        return ((data ?? []) as { indicator_id: string }[]).map((r) => r.indicator_id);
    },

    setLessonPlanIndicators: async (
        lessonPlanId: string,
        indicatorIds: string[],
    ): Promise<{ error: Error | null }> => {
        const del = await supabase
            .from('indicator_lesson_plans' as never)
            .delete()
            .eq('lesson_plan_id', lessonPlanId);
        if (del.error) return { error: del.error as Error };
        if (indicatorIds.length === 0) return { error: null };
        const rows = indicatorIds.map((id) => ({
            indicator_id: id,
            lesson_plan_id: lessonPlanId,
        }));
        const ins = await supabase.from('indicator_lesson_plans' as never).insert(rows as never);
        return { error: (ins.error as Error | null) ?? null };
    },

    // ─── ความก้าวหน้า ────────────────────────────────────────────────────────
    /** สถานะตัวชี้วัดของนักเรียนรายคน (teacher/admin — RLS) */
    masteryByStudent: (studentId: string) =>
        supabase
            .from('v_student_indicator_mastery' as never)
            .select('*')
            .eq('student_id', studentId),

    // ─── ประเมินโดยครู (manual) ──────────────────────────────────────────────
    upsertAssessment: (
        data: {
            student_id: string;
            indicator_id: string;
            level: number;
            academic_year: string;
            semester?: string | null;
            source?: string;
            assessed_by?: string | null;
            note?: string | null;
        },
    ) =>
        supabase
            .from('student_indicator_assessments' as never)
            .upsert(
                { ...data, source: data.source ?? 'manual', updated_at: new Date().toISOString() } as never,
                { onConflict: 'student_id,indicator_id,academic_year' },
            ),
};
