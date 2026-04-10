import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Eye, Calendar, ArrowRight } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  category: string;
  created_at: string;
  view_count: number;
  author: string | null;
}

const categoryColor: Record<string, string> = {
  'ข่าวประชาสัมพันธ์': 'bg-blue-600',
  'กิจกรรม': 'bg-green-600',
  'ผลงานนักเรียน': 'bg-purple-600',
  'ประกาศ': 'bg-red-600',
  'บทความ': 'bg-orange-500',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const HomeMainContent = () => {
  const { settings } = useSchoolSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [slides, setSlides] = useState<{ url: string; title: string }[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase
      .from('news')
      .select('id, title, summary, cover_image_url, category, created_at, view_count, author')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setNews(data as NewsItem[]);
      });
  }, []);

  // Fetch hero_slides from DB; fallback to news cover images
  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('image_url, title, order_position')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlides((data as { image_url: string; title: string | null; order_position: number }[]).map(s => ({ url: s.image_url, title: s.title || '' })));
        } else {
          // fallback: news cover images
          const s: { url: string; title: string }[] = [];
          news.filter(n => n.cover_image_url).slice(0, 5).forEach(n => s.push({ url: n.cover_image_url!, title: n.title }));
          if (s.length === 0) s.push({ url: '/hero-school.jpg', title: settings.school_name });
          setSlides(s);
        }
      });
  }, [news, settings.school_name]);

  // Auto-play
  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  const prevSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentSlide(p => (p - 1 + slides.length) % slides.length);
  };
  const nextSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentSlide(p => (p + 1) % slides.length);
  };

  const featured = news[0];
  const rest = news.slice(1, 5);

  const rawOrder = settings.homepage_main_sections;
  const sectionOrder: string[] = rawOrder
    ? (() => { try { return JSON.parse(rawOrder); } catch { return ['hero','news','about']; } })()
    : ['hero','news','about'];

  const heroSection = (
    <div key="hero" className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[16/7] shadow-md">
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-16 text-white">
            <p className="text-sm font-semibold drop-shadow line-clamp-2">{slide.title}</p>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-5' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );

  const newsSection = news.length > 0 ? (
    <div key="news" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
          ข่าวสารล่าสุด
        </span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
        {featured && (
          <Link to="/news" className="sm:col-span-1 block group border-r border-gray-100">
            <div className="relative h-44 sm:h-52 bg-gradient-to-br from-purple-600 to-indigo-700 overflow-hidden">
              {featured.cover_image_url ? (
                <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-white/40 text-6xl font-bold">ข่าว</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-2 left-2">
                <span className={`text-white text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[featured.category] || 'bg-gray-600'}`}>{featured.category}</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{featured.title}</p>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(featured.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{featured.view_count}</span>
                </div>
              </div>
            </div>
          </Link>
        )}
        <div className="sm:col-span-2 grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100">
          {rest.map((item) => (
            <Link key={item.id} to="/news" className="group p-0 block">
              <div className="relative h-28 overflow-hidden bg-gray-100">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><span className="text-gray-400 text-xs">ไม่มีรูป</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-1.5 left-1.5">
                  <span className={`text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryColor[item.category] || 'bg-gray-600'}`}>{item.category}</span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}
          {Array.from({ length: Math.max(0, 4 - rest.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 bg-gray-50" />
          ))}
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 text-right">
        <Link to="/news" className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 justify-end">
          ดูข่าวสารทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  ) : null;

  const aboutSection = (
    <div key="about" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider border-l-4 border-purple-700 pl-2">ABOUT</span>
        <span className="text-xs text-gray-400">—</span>
        <span className="text-sm font-bold text-gray-800">WHO WE ARE</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{settings.school_description}</p>
      <Link to="/about" className="inline-flex items-center gap-1 mt-2 text-xs text-purple-700 hover:text-purple-900 font-medium">
        อ่านเพิ่มเติม <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );

  const sectionMap: Record<string, JSX.Element | null> = { hero: heroSection, news: newsSection, about: aboutSection };

  return (
    <div className="flex flex-col gap-4">
      {sectionOrder.map(key => sectionMap[key] ?? null)}
    </div>
  );
};

export default HomeMainContent;
