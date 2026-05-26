/**
 * ai-assist.service.ts
 * Client wrapper for the ai-assist edge function.
 * Backend handles model selection, prompt caching, and usage logging.
 */
import { supabase } from '@/integrations/supabase/client';

export type AiMode = 'lesson_plan' | 'exam_questions' | 'report_comment' | 'free';

export interface AiAssistRequest {
  mode: AiMode;
  input: Record<string, string>;
  notes?: string;
}

export interface AiAssistResponse {
  text: string;
  model: string;
  usage: { input_tokens?: number; output_tokens?: number; cached?: number };
  duration_ms: number;
}

export const aiAssistService = {
  async generate(req: AiAssistRequest): Promise<AiAssistResponse> {
    const { data, error } = await supabase.functions.invoke('ai-assist', { body: req });
    if (error) throw new Error(error.message);
    if (!data || (data as any).error) throw new Error((data as any)?.error ?? 'AI call failed');
    return data as AiAssistResponse;
  },

  /** Recent calls for the current user (or all if admin). RLS handles visibility. */
  async recentLog(limit = 20) {
    const { data, error } = await supabase
      .from('ai_assist_log' as any)
      .select('id, mode, model, input_tokens, output_tokens, cached_input_tokens, duration_ms, error, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
