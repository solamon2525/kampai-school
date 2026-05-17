/**
 * action-plan.service.ts
 * Action Plan — แผนปฏิบัติการ + milestones
 */
import { supabase } from '@/integrations/supabase/client';

export type ActionPlanStatus = 'ยังไม่เริ่ม' | 'กำลังดำเนินการ' | 'เสร็จสิ้น' | 'ยกเลิก';
export type MilestoneStatus = 'รอ' | 'กำลังทำ' | 'เสร็จ';

export type ActionPlanProject = {
    id: string;
    fiscal_year: number;
    code: string | null;
    name: string;
    strategy: string | null;
    responsible_staff_id: string | null;
    budget: number;
    start_date: string | null;
    end_date: string | null;
    kpi: string | null;
    status: ActionPlanStatus;
    notes: string | null;
    created_at: string;
    staff?: { id: string; name: string; photo_url: string | null } | null;
};

export type ActionPlanMilestone = {
    id: string;
    project_id: string;
    title: string;
    due_date: string | null;
    progress_pct: number;
    status: MilestoneStatus;
    notes: string | null;
    created_at: string;
};

export const actionPlanService = {
    listProjects: async (year: number) => {
        const { data, error } = await supabase
            .from('action_plan_projects' as never)
            .select('*, staff:responsible_staff_id(id, name, photo_url)')
            .eq('fiscal_year', year)
            .order('code', { ascending: true });
        return { data: data as ActionPlanProject[] | null, error };
    },

    createProject: async (p: Omit<ActionPlanProject, 'id' | 'created_at' | 'staff'>) =>
        supabase.from('action_plan_projects' as never).insert(p as never).select().single(),

    updateProject: async (id: string, patch: Partial<Omit<ActionPlanProject, 'id' | 'created_at' | 'staff'>>) =>
        supabase.from('action_plan_projects' as never).update(patch as never).eq('id', id).select().single(),

    deleteProject: async (id: string) =>
        supabase.from('action_plan_projects' as never).delete().eq('id', id),

    listMilestones: async (projectId: string) => {
        const { data, error } = await supabase
            .from('action_plan_milestones' as never)
            .select('*')
            .eq('project_id', projectId)
            .order('due_date', { ascending: true });
        return { data: data as ActionPlanMilestone[] | null, error };
    },

    createMilestone: async (m: Omit<ActionPlanMilestone, 'id' | 'created_at'>) =>
        supabase.from('action_plan_milestones' as never).insert(m as never).select().single(),

    updateMilestone: async (id: string, patch: Partial<Omit<ActionPlanMilestone, 'id' | 'project_id' | 'created_at'>>) =>
        supabase.from('action_plan_milestones' as never).update(patch as never).eq('id', id),

    deleteMilestone: async (id: string) =>
        supabase.from('action_plan_milestones' as never).delete().eq('id', id),
};
