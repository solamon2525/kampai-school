/**
 * global-search.service.ts
 * Fetches a lightweight search index (students + staff + news) once per session.
 * RLS handles visibility — anonymous users get public read-only data, admin/teacher
 * get full visibility via existing policies.
 */
import { supabase } from '@/integrations/supabase/client';
import type { SearchIndexItem } from '@/lib/search/fuse-config';

const STUDENT_LIMIT = 800;
const STAFF_LIMIT = 200;
const NEWS_LIMIT = 200;

export const globalSearchService = {
  async fetchIndex(): Promise<SearchIndexItem[]> {
    const [students, staff, news] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, class, room, photo_url, student_code')
        .eq('is_active', true)
        .limit(STUDENT_LIMIT),
      supabase
        .from('staff')
        .select('id, name, position, photo_url')
        .limit(STAFF_LIMIT),
      supabase
        .from('news')
        .select('id, title, excerpt')
        .order('created_at', { ascending: false })
        .limit(NEWS_LIMIT),
    ]);

    const items: SearchIndexItem[] = [];

    (students.data ?? []).forEach((s: any) => {
      const cls = [s.class, s.room].filter(Boolean).join('/');
      items.push({
        type: 'student',
        id: s.id,
        title: s.name ?? '',
        subtitle: [cls, s.student_code].filter(Boolean).join(' · '),
        photoUrl: s.photo_url,
        path: `/hero/${s.id}`,
      });
    });

    (staff.data ?? []).forEach((p: any) => {
      items.push({
        type: 'staff',
        id: p.id,
        title: p.name ?? '',
        subtitle: p.position ?? '',
        photoUrl: p.photo_url,
        path: `/staff/${p.id}`,
      });
    });

    (news.data ?? []).forEach((n: any) => {
      items.push({
        type: 'news',
        id: n.id,
        title: n.title ?? '',
        subtitle: n.excerpt ?? '',
        path: `/news/${n.id}`,
      });
    });

    return items;
  },
};
