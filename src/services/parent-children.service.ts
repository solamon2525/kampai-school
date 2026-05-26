/**
 * parent-children.service.ts
 * Multi-child support for parents (Migration 083).
 * Uses RPC my_children() which respects RLS via SECURITY DEFINER + auth.uid().
 */
import { supabase } from '@/integrations/supabase/client';

export type ChildSummary = {
  id: string;
  name: string;
  class: string | null;
  room: string | null;
  class_number: number | null;
  photo_url: string | null;
  student_code: string | null;
  is_primary: boolean;
};

export const parentChildrenService = {
  /** Children of the current authenticated parent. */
  async list(): Promise<ChildSummary[]> {
    const { data, error } = await supabase.rpc('my_children' as any);
    if (error) throw error;
    return (data ?? []) as ChildSummary[];
  },
};
