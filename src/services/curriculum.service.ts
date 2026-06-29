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
    /** ระหว่างทาง (formative) | ปลายทาง (summative) — mig 175; null = ยังไม่จัดประเภท */
    indicator_kind: 'ระหว่างทาง' | 'ปลายทาง' | null;
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

// ─── Phase A/B: Student & Parent Mastery Portal (migration 269) ──────────────

/** ตัวชี้วัดหนึ่งตัว พร้อมสถานะความก้าวหน้าของนักเรียน (จาก RPC my_mastery/child_mastery) */
export type MasteryRow = {
    indicator_id: string;
    subject_key: string;
    grade: string;
    indicator_code: string;
    description: string;
    indicator_kind: 'ระหว่างทาง' | 'ปลายทาง' | null;
    strand_title: string | null;
    sort_order: number;
    status: IndicatorMasteryStatus;
    attempts: number;
    best_score: number | null;
    last_event: string | null;
    assessed_level: number | null;
    assessed_source: string | null;
};

export type MasteryStudent = {
    id: string;
    name: string;
    nickname?: string | null;
    photo_url: string | null;
    class: string;
    room?: string | null;
    student_code?: string | null;
    grade: string | null;
};

export type MasteryStats = {
    total_xp: number;
    games_played: number;
    plays_count: number;
    active_days?: number;
    medals_count: number;
};

/** ผลลัพธ์จาก RPC my_mastery / child_mastery */
export type MasteryBundle = {
    student: MasteryStudent;
    grade: string | null;
    mastery: MasteryRow[];
    stats: MasteryStats;
};

export type GameRecommendationReason = 'indicator_gap' | 'subject_suggest' | 'popular';

/** คำแนะนำเกมถัดไป (จาก RPC recommend_games) */
export type GameRecommendation = {
    item_id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    subject: string | null;
    subject_key: string | null;
    reason: GameRecommendationReason;
    indicator_desc: string | null;
    tier: number;
};

/** แถว heatmap ต่อตัวชี้วัด (จาก RPC class_indicator_heatmap) */
export type IndicatorHeatmapRow = {
    indicator_id: string;
    indicator_code: string;
    description: string;
    indicator_kind: 'ระหว่างทาง' | 'ปลายทาง' | null;
    strand_title: string | null;
    sort_order: number;
    total: number;
    not_started: number;
    practicing: number;
    passed: number;
    mastered: number;
};

export type ClassHeatmap = {
    total_students: number;
    rows: IndicatorHeatmapRow[];
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

    /** นับจำนวนตัวชี้วัดที่ผูกต่อเกม → Map(edu_hub_item_id → count) สำหรับ badge ในตาราง */
    countIndicatorsByGame: async (): Promise<Map<string, number>> => {
        const { data, error } = await supabase
            .from('indicator_games' as never)
            .select('edu_hub_item_id');
        if (error) throw error;
        const m = new Map<string, number>();
        ((data ?? []) as { edu_hub_item_id: string }[]).forEach((r) => {
            m.set(r.edu_hub_item_id, (m.get(r.edu_hub_item_id) ?? 0) + 1);
        });
        return m;
    },

    /**
     * ความครอบคลุม: ตัวชี้วัดของวิชา+ชั้น → รายชื่อเกมที่ผูก (เห็นว่าตัวไหนยังไม่มีเกม)
     * คืน indicator ทุกตัว (เรียง sort_order) พร้อม games[] (อาจว่าง)
     */
    gamesByIndicator: async (
        subjectKey: string,
        grade: string,
    ): Promise<Array<CurriculumIndicator & { games: { id: string; title: string }[] }>> => {
        const { data: inds, error: e1 } = await supabase
            .from('curriculum_indicators' as never)
            .select('*')
            .eq('subject_key', subjectKey)
            .eq('grade', grade)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (e1) throw e1;
        const indicators = (inds as unknown as CurriculumIndicator[]) ?? [];
        if (indicators.length === 0) return [];

        const ids = indicators.map((i) => i.id);
        const { data: maps, error: e2 } = await supabase
            .from('indicator_games' as never)
            .select('indicator_id, educational_hub_items(id, title)')
            .in('indicator_id', ids);
        if (e2) throw e2;

        const byInd = new Map<string, { id: string; title: string }[]>();
        ((maps ?? []) as {
            indicator_id: string;
            educational_hub_items: { id: string; title: string } | null;
        }[]).forEach((r) => {
            if (!r.educational_hub_items) return;
            const arr = byInd.get(r.indicator_id) ?? [];
            arr.push(r.educational_hub_items);
            byInd.set(r.indicator_id, arr);
        });

        return indicators.map((ind) => ({ ...ind, games: byInd.get(ind.id) ?? [] }));
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

    // ─── Student & Parent Mastery Portal (migration 269 RPCs) ──────────────────

    /** Student Dashboard (#4): ความเชี่ยวชาญตัวชี้วัด + stats ของนักเรียนตามรหัส */
    myMasteryByCode: async (studentCode: string): Promise<MasteryBundle> => {
        const { data, error } = await supabase.rpc('my_mastery' as never, {
            p_student_code: studentCode,
        } as never);
        if (error) throw error;
        return data as unknown as MasteryBundle;
    },

    /** Parent Mastery (#2): เหมือน myMastery แต่ resolve ด้วย student_id + ตรวจ is_my_student */
    childMastery: async (studentId: string): Promise<MasteryBundle> => {
        const { data, error } = await supabase.rpc('child_mastery' as never, {
            p_student_id: studentId,
        } as never);
        if (error) throw error;
        return data as unknown as MasteryBundle;
    },

    /** Game Recommendation (#1): เกมที่ควรเล่นต่อ (3-tier fallback) */
    recommendGames: async (
        studentCode: string,
        limit = 8,
    ): Promise<GameRecommendation[]> => {
        const { data, error } = await supabase.rpc('recommend_games' as never, {
            p_student_code: studentCode,
            p_limit: limit,
        } as never);
        if (error) throw error;
        return (data as unknown as GameRecommendation[]) ?? [];
    },

    /** Class Heatmap (#3): สถานะตัวชี้วัดรวมรายห้อง */
    classHeatmap: async (
        classroom: string,
        subjectKey: string,
        grade: string,
    ): Promise<ClassHeatmap> => {
        const { data, error } = await supabase.rpc('class_indicator_heatmap' as never, {
            p_class: classroom,
            p_subject_key: subjectKey,
            p_grade: grade,
        } as never);
        if (error) throw error;
        return data as unknown as ClassHeatmap;
    },

    /** Batch Map (admin support): แทนที่ mapping หลายเกมใน transaction เดียว */
    batchSetGameIndicators: async (
        mappings: Array<{ edu_hub_item_id: string; indicator_ids: string[] }>,
    ): Promise<{ error: Error | null }> => {
        const { error } = await supabase.rpc('batch_set_game_indicators' as never, {
            p_mappings: mappings,
        } as never);
        return { error: (error as Error | null) ?? null };
    },
};
