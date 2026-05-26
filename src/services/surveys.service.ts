/**
 * surveys.service.ts
 * Survey builder + responses (Migration 094).
 */
import { supabase } from '@/integrations/supabase/client';

export type SurveyAudience = 'all' | 'parents' | 'staff' | 'students' | 'class_specific';
export type QuestionType = 'text' | 'radio' | 'checkbox' | 'rating_5' | 'rating_10' | 'nps';

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  audience: SurveyAudience;
  target_class: string | null;
  is_published: boolean;
  is_anonymous: boolean;
  starts_at: string | null;
  ends_at: string | null;
  response_count: number;
  created_at: string;
};

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  order_index: number;
  question_text: string;
  type: QuestionType;
  options: string[] | null;
  is_required: boolean;
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  respondent_user_id: string | null;
  answers: Record<string, any>;
  submitted_at: string;
};

export const surveysService = {
  async listAll(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Survey[];
  },

  async listPublished(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys' as any)
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Survey[];
  },

  async getById(id: string): Promise<{ survey: Survey; questions: SurveyQuestion[] } | null> {
    const [surveyR, questionsR] = await Promise.all([
      supabase.from('surveys' as any).select('*').eq('id', id).maybeSingle(),
      supabase.from('survey_questions' as any).select('*').eq('survey_id', id).order('order_index'),
    ]);
    if (surveyR.error) throw surveyR.error;
    if (!surveyR.data) return null;
    return { survey: surveyR.data as Survey, questions: (questionsR.data ?? []) as SurveyQuestion[] };
  },

  async create(input: { title: string; description?: string; audience: SurveyAudience; is_anonymous: boolean; questions: Omit<SurveyQuestion, 'id' | 'survey_id'>[] }): Promise<Survey> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data: survey, error } = await supabase
      .from('surveys' as any)
      .insert({
        title: input.title,
        description: input.description ?? null,
        audience: input.audience,
        is_anonymous: input.is_anonymous,
        created_by: userResp.user?.id ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;

    if (input.questions.length) {
      const { error: qErr } = await supabase.from('survey_questions' as any).insert(
        input.questions.map((q) => ({
          survey_id: (survey as Survey).id,
          order_index: q.order_index,
          question_text: q.question_text,
          type: q.type,
          options: q.options,
          is_required: q.is_required,
        })),
      );
      if (qErr) throw qErr;
    }
    return survey as Survey;
  },

  async togglePublish(id: string, is_published: boolean): Promise<void> {
    const { error } = await supabase.from('surveys' as any).update({ is_published }).eq('id', id);
    if (error) throw error;
  },

  async submit(surveyId: string, answers: Record<string, any>): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data: surveyR } = await supabase.from('surveys' as any).select('is_anonymous').eq('id', surveyId).maybeSingle();
    const isAnon = (surveyR as any)?.is_anonymous ?? true;
    const { error } = await supabase.from('survey_responses' as any).insert({
      survey_id: surveyId,
      respondent_user_id: isAnon ? null : (userResp.user?.id ?? null),
      answers,
    });
    if (error) throw error;
  },

  async listResponses(surveyId: string): Promise<SurveyResponse[]> {
    const { data, error } = await supabase
      .from('survey_responses' as any)
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SurveyResponse[];
  },
};
