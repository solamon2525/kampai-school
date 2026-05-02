import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TickerItem {
  id: string;
  title: string;
  link: string;
}

const fetchTicker = async (): Promise<TickerItem[]> => {
  // ข่าวที่ admin ติ๊ก "แสดงในตัววิ่งข่าว" (สูงสุด 5)
  const { data: news } = await supabase
    .from('news')
    .select('id, title')
    .eq('published', true)
    .eq('show_in_ticker', true)
    .order('ticker_order', { ascending: true, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(5);

  return ((news as { id: string; title: string }[] | null) ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    link: `/news?id=${n.id}`,
  }));
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
