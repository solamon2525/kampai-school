import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Eye, Calendar, ArrowRight, FileText, ChevronDown, Database, Heart, Utensils, BookOpen, Briefcase, Building, Send, Award } from 'lucide-react';
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

const DUMMY_NEWS: NewsItem[] = [
  { id: 'dummy-1', title: 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568', summary: 'รับสมัครนักเรียนใหม่ตั้งแต่ระดับชั้นอนุบาลจนถึงมัธยมศึกษาตอนปลาย', cover_image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800', category: 'ข่าวประชาสัมพันธ์', created_at: new Date().toISOString(), view_count: 542, author: 'ฝ่ายวิชาการ' },
  { id: 'dummy-2', title: 'ยินดีกับนักเรียนที่คว้ารางวัลชนะเลิศโครงงานวิทยาศาสตร์', summary: 'ตัวแทนนักเรียนได้รับรางวัลชนะเลิศระดับประเทศ', cover_image_url: 'https://images.unsplash.com/photo-1546410531-fa4ab3ba45cb?q=80&w=800', category: 'ผลงานนักเรียน', created_at: new Date(Date.now() - 86400000*2).toISOString(), view_count: 320, author: 'ฝ่ายประชาสัมพันธ์' },
  { id: 'dummy-3', title: 'ภาพบรรยากาศกิจกรรมกีฬาสี ประจำปี 2567', summary: 'เต็มไปด้วยความสนุกสนานและรอยยิ้มของเด็กๆ', cover_image_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=800', category: 'กิจกรรม', created_at: new Date(Date.now() - 86400000*5).toISOString(), view_count: 890, author: 'สภานักเรียน' },
  { id: 'dummy-4', title: 'เทคนิคการเตรียมความพร้อมก่อนการสอบ TCAS', summary: 'คำแนะนำดีๆ จากคุณครูแนะแนว สำหรับน้องๆ ม.6', cover_image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800', category: 'บทความ', created_at: new Date(Date.now() - 86400000*7).toISOString(), view_count: 125, author: 'ครูแนะแนว' },
  { id: 'dummy-5', title: 'ประกาศหยุดเรียนในวันสำคัญทางศาสนา', summary: 'เนื่องในวันวิสาขบูชา โรงเรียนจะหยุดทำการเรียนการสอน 1 วัน', cover_image_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=800', category: 'ประกาศ', created_at: new Date(Date.now() - 86400000*12).toISOString(), view_count: 210, author: 'ธุรการ' },
  { id: 'dummy-6', title: 'ทัศนศึกษาศูนย์การเรียนรู้สร้างแรงบันดาลใจ', summary: 'นักเรียนทัศนศึกษาเพื่อเปิดโลกทัศน์', cover_image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800', category: 'กิจกรรม', created_at: new Date(Date.now() - 86400000*15).toISOString(), view_count: 450, author: 'ฝ่ายกิจกรรม' },
];

const DUMMY_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', title: 'ยินดีต้อนรับสู่สถานศึกษาแห่งการเรียนรู้ยุคใหม่' },
  { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200', title: 'มุ่งมั่นพัฒนาวิชาการ สร้างเสริมทักษะชีวิตที่ยั่งยืน' },
];

const DUMMY_EVENTS = [
  { id: 'dummy-e1', title: 'ปฐมนิเทศนักเรียนใหม่ ชั้น ม.1 และ ม.4', start_date: new Date(Date.now() + 86400000 * 3).toISOString(), location: 'หอประชุมใหญ่' },
  { id: 'dummy-e2', title: 'การประชุมผู้ปกครองภาคเรียนที่ 1', start_date: new Date(Date.now() + 86400000 * 10).toISOString(), location: 'หอประชุมโรงเรียน' },
  { id: 'dummy-e3', title: 'กิจกรรมกีฬาสีภายใน ทวิภาคี', start_date: new Date(Date.now() + 86400000 * 25).toISOString(), location: 'สนามกีฬาเฉลิมพระเกียรติ' },
  { id: 'dummy-e4', title: 'สอบกลางภาคเรียน', start_date: new Date(Date.now() + 86400000 * 40).toISOString(), location: 'ห้องสอบ' },
];

const DUMMY_DOCS = [
  { id: 'dummy-d1', title: 'คู่มือนักเรียนและผู้ปกครอง.pdf', category: 'ทั่วไป', file_url: '#' },
  { id: 'dummy-d2', title: 'ใบสมัครเรียนปีการศึกษา 2568.pdf', category: 'รับสมัคร', file_url: '#' },
  { id: 'dummy-d3', title: 'ปฏิทินวิชาการประจำปี.pdf', category: 'วิชาการ', file_url: '#' },
  { id: 'dummy-d4', title: 'แบบฟอร์มใบลากิจ/ลาป่วย.pdf', category: 'เอกสารนักเรียน', file_url: '#' },
];

export const useHomeMainBlocks = () => {
  const { settings } = useSchoolSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [slides, setSlides] = useState<{ url: string; title: string }[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [events, setEvents] = useState<{ id: string; title: string; start_date: string; location: string | null }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; title: string; category: string | null; file_url: string }[]>([]);
  const [blogNews, setBlogNews] = useState<NewsItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('news')
      .select('id, title, summary, cover_image_url, category, created_at, view_count, author')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNews((data as NewsItem[]).slice(0, 6));
          setBlogNews(data as NewsItem[]);
        } else {
          setNews(DUMMY_NEWS.slice(0, 6));
          setBlogNews(DUMMY_NEWS);
        }
      });

    // Fetch events
    supabase
      .from('events')
      .select('id, title, start_date, location')
      .gte('start_date', new Date().toISOString().slice(0, 10))
      .order('start_date')
      .limit(4)
      .then(({ data }) => { if (data && data.length > 0) setEvents(data); else setEvents(DUMMY_EVENTS); });

    // Fetch documents
    supabase
      .from('documents')
      .select('id, title, category, file_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data && data.length > 0) setDocuments(data); else setDocuments(DUMMY_DOCS); });
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
          setSlides(DUMMY_SLIDES);
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

  // Parse section order from layout or legacy key
  const getSectionOrder = (): string[] => {
    const rawLayout = settings.homepage_main_sections;
    if (rawLayout) {
      try { return JSON.parse(rawLayout); } catch { /* fallback */ }
    }
    return ['hero', 'news', 'about'];
  };
  const sectionOrder = getSectionOrder();

  // === SECTIONS ===

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

  const calendarSection = events.length > 0 ? (
    <div key="calendar" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
          📅 ปฏิทินกิจกรรม
        </span>
        <Link to="/calendar" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
            <div className="text-center bg-purple-100 text-purple-700 rounded-lg px-3 py-1.5 flex-shrink-0">
              <div className="text-lg font-bold leading-none">{new Date(ev.start_date).getDate()}</div>
              <div className="text-[10px] uppercase">{new Date(ev.start_date).toLocaleDateString('th-TH', { month: 'short' })}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-1">{ev.title}</p>
              {ev.location && <p className="text-xs text-gray-500 mt-0.5">📍 {ev.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const videoSection = (
    <div key="video" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2">
        <span className="font-semibold text-sm">🎬 แนะนำโรงเรียน</span>
      </div>
      <div className="p-3">
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
          <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Video Thumbnail" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center pl-1 group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-xl">▶</span>
            </div>
            <span className="text-white text-xs font-medium mt-2 drop-shadow">คลิกเพื่อเล่นวิดีโอแนะนำ</span>
          </div>
        </div>
      </div>
    </div>
  );

  const statisticsSection = (
    <div key="statistics" className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-lg p-6 text-center shadow-md">
      <h3 className="text-lg font-bold mb-4 opacity-90">โรงเรียนของเราในตัวเลข</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: settings.stat_students || '500+', label: settings.stat_students_label || 'นักเรียน' },
          { value: settings.stat_university || '98%', label: settings.stat_university_label || 'ผ่านเข้ามหาวิทยาลัย' },
          { value: settings.stat_years || '50+', label: settings.stat_years_label || 'ปีแห่งความเป็นเลิศ' },
          { value: settings.about_stat_3 || '200+', label: settings.about_stat_3_label || 'บุคลากร' },
        ].map((s, i) => (
          <div key={i}>
            <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
            <div className="text-xs opacity-75 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const quicklinksSection = (
    <div key="quicklinks" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-3">🔗 เมนูด่วน</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: '📰', label: 'ข่าวสาร', href: '/news' },
          { icon: '🖼️', label: 'แกลเลอรี่', href: '/gallery' },
          { icon: '📄', label: 'เอกสาร', href: '/documents' },
          { icon: '📝', label: 'สมัครเรียน', href: '/enrollment' },
        ].map((link, i) => (
          <Link key={i} to={link.href} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-center">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-xs font-medium text-gray-700">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  const announcementSection = (
    <div key="announcement" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-300 bg-blue-50 shadow-sm">
      <span className="text-2xl flex-shrink-0">📢</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">{settings.hero_badge || 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568'}</p>
        <Link to="/enrollment" className="text-xs text-blue-600 hover:text-blue-800 underline mt-0.5 inline-block">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );

  // ─── NEW: Blog Grid ─────────────────────────────────────
  const blogGridSection = blogNews.length > 0 ? (
    <div key="blog_grid" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
          📝 บทความล่าสุด
        </span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {blogNews.slice(0, 6).map((item) => (
          <Link key={item.id} to="/news" className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-[16/10] bg-gray-200 overflow-hidden">
              {item.cover_image_url ? (
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-purple-300 text-3xl">📝</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${categoryColor[item.category] || 'bg-gray-600'}`}>{item.category}</span>
              <h4 className="text-sm font-semibold text-gray-800 mt-2 line-clamp-2 group-hover:text-purple-700 transition-colors">{item.title}</h4>
              {item.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.summary}</p>}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                <span>{formatDate(item.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  // ─── NEW: Blog Carousel ─────────────────────────────────
  const blogCarouselSection = blogNews.length > 0 ? (
    <div key="blog_carousel" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">🎠 บทความแนะนำ</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="relative">
        <div ref={carouselRef} className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {blogNews.slice(0, 8).map((item) => (
            <Link key={item.id} to="/news" className="flex-shrink-0 w-52 sm:w-60 snap-start group">
              <div className="aspect-[16/10] bg-gray-200 rounded-lg overflow-hidden">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-purple-300 text-2xl">🎠</span>
                  </div>
                )}
              </div>
              <h4 className="text-xs font-semibold mt-2 line-clamp-2 group-hover:text-purple-700">{item.title}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  // ─── NEW: Blog List ─────────────────────────────────────
  const blogListSection = blogNews.length > 0 ? (
    <div key="blog_list" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📋 บทความทั้งหมด</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {blogNews.slice(0, 6).map((item) => (
          <Link key={item.id} to="/news" className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors group">
            {item.cover_image_url && (
              <div className="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white ${categoryColor[item.category] || 'bg-gray-600'}`}>{item.category}</span>
              <h4 className="text-sm font-medium text-gray-800 line-clamp-1 mt-1 group-hover:text-purple-700">{item.title}</h4>
              {item.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.summary}</p>}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span>{formatDate(item.created_at)}</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.view_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  // ─── NEW: Testimonials ──────────────────────────────────
  const testimonialsSection = (
    <div key="testimonials" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-4">💬 เสียงจากนักเรียนและผู้ปกครอง</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { name: 'ผู้ปกครอง', text: 'โรงเรียนมีคุณภาพ ดูแลนักเรียนดีมาก', rating: 5 },
          { name: 'นักเรียน', text: 'ชอบกิจกรรมที่หลากหลาย ทำให้ได้เรียนรู้นอกห้องเรียน', rating: 5 },
        ].map((t, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(t.rating)}</div>
            <p className="text-xs text-gray-600 italic mb-2">"{t.text}"</p>
            <p className="text-xs font-semibold text-gray-700">— {t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: FAQ Accordion ─────────────────────────────────
  const faqAccordionSection = (
    <div key="faq_accordion" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2">
        <span className="font-semibold text-sm">❓ คำถามที่พบบ่อย</span>
      </div>
      <div className="divide-y divide-gray-100">
        {[
          { q: 'สมัครเรียนต้องทำอย่างไร?', a: 'สามารถสมัครผ่านทางเว็บไซต์หรือติดต่อสำนักงานโรงเรียนโดยตรง' },
          { q: 'ค่าเทอมเท่าไหร่?', a: 'ดูรายละเอียดค่าเทอมได้ที่หน้าสมัครเรียน' },
          { q: 'มีรถรับ-ส่งนักเรียนหรือไม่?', a: 'โรงเรียนมีบริการรถรับส่งในเขตพื้นที่ใกล้เคียง' },
        ].map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-3 text-xs text-gray-600 leading-relaxed">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: Countdown ─────────────────────────────────────
  const countdownSection = (
    <div key="countdown" className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6 text-center shadow-md">
      <h3 className="text-sm font-bold mb-1 opacity-90">⏳ นับถอยหลังสู่วันเปิดเทอม</h3>
      <p className="text-xs opacity-70 mb-4">ปีการศึกษา 2568</p>
      <div className="flex justify-center gap-4">
        {[
          { value: '--', label: 'วัน' },
          { value: '--', label: 'ชม.' },
          { value: '--', label: 'นาที' },
          { value: '--', label: 'วินาที' },
        ].map((item, i) => (
          <div key={i} className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs opacity-70">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: Partner Logos ─────────────────────────────────
  const partnerLogosSection = (
    <div key="partner_logos" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-4">🤝 หน่วยงานที่เกี่ยวข้อง</h3>
      <div className="flex flex-wrap justify-center gap-4 opacity-60">
        {['กระทรวงศึกษาธิการ', 'สพฐ.', 'สพท.', 'ท้องถิ่น'].map((name, i) => (
          <div key={i} className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-center p-2">
            <span className="text-[10px] text-gray-500 leading-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: Photo Album ───────────────────────────────────
  const photoAlbumSection = (
    <div key="photo_album" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📸 ภาพกิจกรรมล่าสุด</span>
        <Link to="/gallery" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">
        {blogNews.filter(n => n.cover_image_url).slice(0, 8).map((item, i) => (
          <Link key={item.id} to="/gallery" className="aspect-square overflow-hidden rounded-lg group">
            <img src={item.cover_image_url!} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          </Link>
        ))}
      </div>
    </div>
  );

  // ─── NEW: Map Embed ─────────────────────────────────────
  const mapEmbedSection = settings.contact_map_url ? (
    <div key="map_embed" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white px-4 py-2">
        <span className="font-semibold text-sm">🗺️ แผนที่โรงเรียน</span>
      </div>
      <div className="aspect-[2/1]">
        <iframe
          src={settings.contact_map_url}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  ) : null;

  // ─── NEW: Contact Form ──────────────────────────────────
  const contactFormSection = (
    <div key="contact_form" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold mb-3">✉️ ส่งข้อความถึงโรงเรียน</h3>
      <div className="space-y-3">
        <input type="text" placeholder="ชื่อ-นามสกุล" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
        <input type="email" placeholder="อีเมล" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
        <textarea placeholder="ข้อความ" rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none" />
        <button className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium rounded-lg transition-colors">
          ส่งข้อความ
        </button>
      </div>
    </div>
  );

  // ─── NEW: OBEC E-Services ───────────────────────────────
  const obecSystemsSection = (
    <div key="obec_systems" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm block">🖥️ ระบบสารสนเทศบุคลากร</span>
            <span className="text-[10px] text-blue-200 font-medium tracking-wide">E-SERVICES & OBEC SYSTEMS</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* DMC */}
        <a href="https://portal.bopp-obec.info/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-700 leading-tight">ระบบ DMC</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">ข้อมูลนักเรียนรายบุคคล</p>
            </div>
          </div>
        </a>

        {/* Thai School Lunch */}
        <a href="https://www.thaischoollunch.in.th/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-green-50 hover:border-green-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-green-700 leading-tight">School Lunch</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">ระบบประเมินอาหารกลางวัน</p>
            </div>
          </div>
        </a>

        {/* CCT */}
        <a href="https://cct.thaieduforall.org/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-orange-700 leading-tight">ระบบ CCT</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">คัดกรองนักเรียนยากจน</p>
            </div>
          </div>
        </a>

        {/* School MIS */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-purple-700 leading-tight">School MIS</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">บริหารจัดการสถานศึกษา</p>
            </div>
          </div>
        </a>

        {/* EMIS */}
        <a href="http://data.bopp-obec.info/emis/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-cyan-50 hover:border-cyan-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-cyan-700 leading-tight">ระบบ EMIS</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">บริหารการศึกษาสถานศึกษา</p>
            </div>
          </div>
        </a>

        {/* B-OBEC / Asset */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-rose-700 leading-tight">OBEC Asset</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">ระบบข้อมูลสิ่งก่อสร้าง</p>
            </div>
          </div>
        </a>

        {/* AMSS++ */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-indigo-700 leading-tight">AMSS++</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">รับส่งหนังสืออิเล็กทรอนิกส์</p>
            </div>
          </div>
        </a>

        {/* DPA / HRMS */}
        <a href="https://dpa.otepc.go.th/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-teal-700 leading-tight">ระบบ DPA</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">ประเมินวิทยฐานะดิจิทัล</p>
            </div>
          </div>
        </a>

      </div>
    </div>
  );

  const sectionMap: Record<string, JSX.Element | null> = {
    hero: heroSection,
    news: newsSection,
    about: aboutSection,
    calendar: calendarSection,
    video: videoSection,
    statistics: statisticsSection,
    quicklinks: quicklinksSection,
    announcement: announcementSection,
    blog_grid: blogGridSection,
    blog_carousel: blogCarouselSection,
    blog_list: blogListSection,
    testimonials: testimonialsSection,
    faq_accordion: faqAccordionSection,
    countdown: countdownSection,
    partner_logos: partnerLogosSection,
    photo_album: photoAlbumSection,
    map_embed: mapEmbedSection,
    contact_form: contactFormSection,
    obec_systems: obecSystemsSection,
  };

  return sectionMap;
};
