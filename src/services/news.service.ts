/**
 * news.service.ts
 * Supabase queries สำหรับ news และ news_categories tables
 */
import { supabase } from '@/integrations/supabase/client';

export const newsService = {
  getAll: () =>
    supabase
      .from('news')
      .select('*, news_categories(name, color)')
      .order('published_at', { ascending: false }),

  getPublished: () =>
    supabase
      .from('news')
      .select('*, news_categories(name, color)')
      .eq('published', true)
      .order('published_at', { ascending: false }),

  insert: (data: Record<string, unknown>) =>
    supabase.from('news').insert(data as never),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('news').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('news').delete().eq('id', id),
};

export const newsCategoriesService = {
  getAll: () =>
    supabase.from('news_categories').select('*').order('name'),

  insert: (data: Record<string, unknown>) =>
    supabase.from('news_categories').insert(data as never),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('news_categories').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('news_categories').delete().eq('id', id),
};
