import { supabase } from '@/integrations/supabase/client';

export type TopicStatus = 'not_started' | 'in_progress' | 'taught';

export type PlanIndicator = {
  id: string;
  strand_title: string | null;
  standard_code: string | null;
  indicator_code: string;
  description: string;
};

export type IntegratedPlanTopic = {
  id: string;
  owner_staff_id: string;
  grade: 'ป.4';
  subject_key: string;
  title: string;
  essential_concept: string;
  keywords: string[];
  status: TopicStatus;
  note: string | null;
  sort_order: number;
  is_custom: boolean;
  integrated_plan_topic_indicators: Array<{ curriculum_indicators: PlanIndicator | null }>;
};

export type IntegratedPlanUnit = {
  id: string;
  owner_staff_id: string;
  title: string;
  note: string | null;
  integrated_plan_unit_topics: Array<{ topic_id: string }>;
};

type TopicInput = {
  subject_key: string;
  title: string;
  essential_concept: string;
  keywords: string[];
  note?: string;
};

export const integratedPlanService = {
  initialize: async () => {
    const { data, error } = await supabase.rpc('initialize_integrated_plan' as never);
    if (error) throw error;
    return data as number;
  },

  listTopics: async (): Promise<IntegratedPlanTopic[]> => {
    const { data, error } = await supabase
      .from('integrated_plan_topics' as never)
      .select('*, integrated_plan_topic_indicators(curriculum_indicators(id,strand_title,standard_code,indicator_code,description))')
      .eq('grade', 'ป.4')
      .order('subject_key')
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as unknown as IntegratedPlanTopic[];
  },

  createTopic: async (ownerStaffId: string, input: TopicInput) => {
    const { error } = await supabase.from('integrated_plan_topics' as never).insert({
      owner_staff_id: ownerStaffId,
      grade: 'ป.4',
      ...input,
      is_custom: true,
    } as never);
    if (error) throw error;
  },

  updateTopic: async (id: string, input: Partial<TopicInput>) => {
    const { error } = await supabase
      .from('integrated_plan_topics' as never)
      .update({ ...input, updated_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (error) throw error;
  },

  updateStatus: async (id: string, status: TopicStatus) => {
    const { error } = await supabase
      .from('integrated_plan_topics' as never)
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (error) throw error;
  },

  deleteTopic: async (id: string) => {
    const { error } = await supabase.from('integrated_plan_topics' as never).delete().eq('id', id).eq('is_custom', true);
    if (error) throw error;
  },

  listUnits: async (): Promise<IntegratedPlanUnit[]> => {
    const { data, error } = await supabase
      .from('integrated_plan_units' as never)
      .select('*, integrated_plan_unit_topics(topic_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as IntegratedPlanUnit[];
  },

  createUnit: async (ownerStaffId: string, title: string, note: string, topicIds: string[]) => {
    const { data: selectedTopics, error: topicError } = await supabase
      .from('integrated_plan_topics' as never)
      .select('id, subject_key')
      .in('id', topicIds);
    if (topicError) throw topicError;
    const subjects = new Set(((selectedTopics ?? []) as Array<{ subject_key: string }>).map((topic) => topic.subject_key));
    if (topicIds.length < 2 || subjects.size < 2) throw new Error('หน่วยบูรณาการต้องมีอย่างน้อย 2 หัวข้อจากต่างวิชา');
    const { data, error } = await supabase
      .from('integrated_plan_units' as never)
      .insert({ owner_staff_id: ownerStaffId, title, note: note || null } as never)
      .select('id')
      .single();
    if (error) throw error;
    const unitId = (data as { id: string }).id;
    const { error: linkError } = await supabase.from('integrated_plan_unit_topics' as never).insert(
      topicIds.map((topicId) => ({ unit_id: unitId, topic_id: topicId })) as never,
    );
    if (linkError) throw linkError;
  },

  deleteUnit: async (id: string) => {
    const { error } = await supabase.from('integrated_plan_units' as never).delete().eq('id', id);
    if (error) throw error;
  },

  pinStatus: async (): Promise<{ has_pin: boolean; locked_until: string | null }> => {
    const { data, error } = await supabase.rpc('integrated_plan_pin_status' as never);
    if (error) throw error;
    return data as unknown as { has_pin: boolean; locked_until: string | null };
  },

  setPin: async (pin: string) => {
    const { error } = await supabase.rpc('set_integrated_plan_pin' as never, { p_pin: pin } as never);
    if (error) throw error;
  },

  verifyPin: async (pin: string): Promise<{ ok: boolean; reason?: string; locked_until?: string }> => {
    const { data, error } = await supabase.rpc('verify_integrated_plan_pin' as never, { p_pin: pin } as never);
    if (error) throw error;
    return data as unknown as { ok: boolean; reason?: string; locked_until?: string };
  },
};
