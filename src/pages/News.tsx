import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Calendar, Eye, Search, Filter, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { SEOHead } from '@/components/SEOHead';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  views: number;
  content: string;
  cover_image_url?: string;
  is_pinned: boolean;
  external_links?: { title: string; url: string }[];
}

const categoryColors: Record<string, string> = {
  'ข่าวประชาสัมพันธ์': 'bg-accent text-accent-foreground',
  'กิจกรรม': 'bg-green-500 text-card',
  'ผลงานนักเรียน': 'bg-blue-500 text-card',
  'ประกาศ': 'bg-red-500 text-card',
};

const News = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['ทั้งหมด']);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Support /news/:id (path param) and /news?id= (legacy query string)
  useEffect(() => {
    if (allNews.length === 0) return;
    const newsId = paramId ?? new URLSearchParams(location.search).get('id');
    if (!newsId) { setSelectedNews(null); return; }
    const found = allNews.find(n => n.id === newsId);
    if (found) handleNewsClick(found);
  }, [allNews, paramId, location.search]);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formattedNews: NewsItem[] = ((data as any[]) || []).map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        excerpt: item.excerpt || '',
        date: item.published_at
          ? format(new Date(item.published_at), 'dd MMM yyyy', { locale: th })
          : format(new Date(item.created_at), 'dd MMM yyyy', { locale: th }),
        views: item.views || 0,
        content: item.content || '',
        cover_image_url: item.cover_image_url || undefined,
        is_pinned: item.is_pinned || false,
        external_links: item.external_links || [],
      }));

      setAllNews(formattedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories' as any)
        .select('name')
        .order('name');

      if (error) throw error;

      const categoryNames = data?.map((c) => c.name) || [];
      setCategories(['ทั้งหมด', ...categoryNames]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleNewsClick = async (news: NewsItem) => {
    setSelectedNews(news);
    window.scrollTo(0, 0);
    try {
      await (supabase as any).rpc('increment_news_view', { news_id: news.id });
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const openNews = (news: NewsItem) => {
    navigate(`/news/${news.id}`);
  };

  const filteredNews = allNews.filter((news) => {
    const matchesSearch =
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ทั้งหมด' || news.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedNews) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-7xl mx-auto w-full bg-background">
        <div className="container-school py-4 md:py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/news')}
            className="mb-4"
          >
            ← กลับ
          </Button>

          <article className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Badge className={categoryColors[selectedNews.category] || 'bg-secondary'}>
                {selectedNews.category}
              </Badge>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {selectedNews.date}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                {selectedNews.views.toLocaleString()} ครั้ง
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {selectedNews.title}
            </h1>

            {selectedNews.cover_image_url && (
              <img
                src={selectedNews.cover_image_url}
                alt={selectedNews.title}
                className="w-full h-96 object-cover rounded-2xl mb-5"
              />
            )}

            <div
              className="prose prose-lg max-w-none text-foreground mb-8"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedNews.content) }}
            />

            {/* External Links */}
            {selectedNews.external_links && selectedNews.external_links.length > 0 && (
              <div className="flex flex-col gap-4 p-6 bg-secondary/30 rounded-xl border border-secondary">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full"></span>
                  ลิ้งค์ที่เกี่ยวข้อง
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedNews.external_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-background rounded-lg border hover:border-primary hover:shadow-md transition-all group"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate pr-4">
                        {link.title || link.url}
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
        <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="ข่าวสาร" description="ข่าวสารและประกาศจากโรงเรียน" />
      <SiteHeader />
      <div className="max-w-7xl mx-auto w-full bg-background">

      {/* Hero — Compact */}
      <section className="bg-primary py-2 md:py-6">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
            ข่าวสารและกิจกรรม
          </span>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1.5">
            ข่าวสารและกิจกรรม
          </h1>
          <p className="text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
            ติดตามข่าวสารและกิจกรรมต่างๆ ของโรงเรียนได้ที่นี่
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ค้นหาข่าวสาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-card"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-4 md:py-6 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">กำลังโหลด...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">ไม่พบข่าวสาร</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => openNews(news)}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border cursor-pointer"
                >
                  {news.cover_image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={news.cover_image_url}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary to-navy-light relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors" />
                      {news.is_pinned && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary">📌 ปักหมุด</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={categoryColors[news.category] || 'bg-secondary'}>
                        {news.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        {news.views.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {news.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {news.excerpt}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {news.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
};

export default News;
