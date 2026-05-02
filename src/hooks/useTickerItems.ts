import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TickerItem {
  id: string;
  title: string;
  link: string | null;
  source: 'manual' | 'news';
}

const fetchTicker = async (): Promise<TickerItem[]> => {
  // 1) Manual ticker_items — RLS already filters active + within schedule window
  const { data: manual } = await supabase
    .from('ticker_items' as any)
    .select('id, title, link, sort_order')
    .order('sort_order', { ascending: true });

  // 2) Selected news (admin ticked show_in_ticker) — max 5
  const { data: news } = await supabase
    .from('news')
    .select('id, title')
    .eq('published', true)
    .eq('show_in_ticker', true)
    .order('ticker_order', { ascending: true, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(5);

  const manualItems: TickerItem[] = ((manual as any[]) || []).map((m) => ({
    id: `m-${m.id}`,
    title: m.title,
    link: m.link ?? null,
    source: 'manual' as const,
  }));

  const newsItems: TickerItem[] = ((news as any[]) || []).map((n) => ({
    id: `n-${n.id}`,
    title: n.title,
    link: `/news/${n.id}`,
    source: 'news' as const,
  }));

  return [...manualItems, ...newsItems];
};

export const useTickerItems = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['ticker-items'],
    queryFn: fetchTicker,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  return { items: data, loading: isLoading };
};
