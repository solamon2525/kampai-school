import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Eye, Calendar, ArrowRight, FileText, ChevronDown, Database, Heart, Utensils, BookOpen, Briefcase, Building, Send, Award } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { MapEmbed } from '@/components/MapEmbed';
import {
  staggerContainerVariants,
  staggerItemVariants,
  slideUpVariants,
} from '@/hooks/useScrollReveal';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  created_at: string;
  views: number | null;
  published_at: string | null;
}

const categoryColor: Record<string, string> = {
  'ข่าวประชาสัมพันธ์': 'bg-blue-600',
  'กิจกรรม': 'bg-green-600',
  'ผลงานนักเรียน': 'bg-accent',
  'ประกาศ': 'bg-red-600',
  'บทความ': 'bg-orange-500',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const DUMMY_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', title: 'ยินดีต้อนรับสู่สถานศึกษาแห่งการเรียนรู้ยุคใหม่' },
  { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200', title: 'มุ่งมั่นพัฒนาวิชาการ สร้างเสริมทักษะชีวิตที่ยั่งยืน' },
];

const DUMMY_DOCS = [
  { id: 'dummy-d1', title: 'คู่มือนักเรียนและผู้ปกครอง.pdf', category: 'ทั่วไป', file_url: '#' },
  { id: 'dummy-d2', title: 'ใบสมัครเรียนปีการศึกษา 2568.pdf', category: 'รับสมัคร', file_url: '#' },
  { id: 'dummy-d3', title: 'ปฏิทินวิชาการประจำปี.pdf', category: 'วิชาการ', file_url: '#' },
  { id: 'dummy-d4', title: 'แบบฟอร์มใบลากิจ/ลาป่วย.pdf', category: 'เอกสารนักเรียน', file_url: '#' },
];

// ─── Contact Form Block (hooked to contact_messages table) ───────
const ContactFormBlock = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const submit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    const { error } = await supabase.from('contact_messages' as any).insert([{
      name: form.name,
      email: form.email,
      subject: 'ข้อความจากหน้าแรก',
      message: form.message,
    }]);
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold mb-3">✉️ ส่งข้อความถึงโรงเรียน</h3>
      <div className="space-y-3">
        <input
          type="text" placeholder="ชื่อ-นามสกุล" value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <input
          type="email" placeholder="อีเมล" value={form.email}
          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <textarea
          placeholder="ข้อความ" rows={3} value={form.message}
          onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
        />
        <button
          onClick={submit}
          disabled={status === 'sending'}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {status === 'sending' ? 'กำลังส่ง...' : 'ส่งข้อความ'}
        </button>
        {status === 'success' && <p className="text-xs text-green-600">✓ ส่งข้อความสำเร็จ ขอบคุณค่ะ</p>}
        {status === 'error' && <p className="text-xs text-red-600">✗ กรุณากรอกข้อมูลให้ครบ</p>}
      </div>
    </div>
  );
};

export const useHomeMainBlocks = () => {
  const { settings } = useSchoolSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [slides, setSlides] = useState<{ url: string; title: string }[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [events, setEvents] = useState<{ id: string; title: string; event_date: string; location: string | null }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; title: string; category: string | null; file_url: string }[]>([]);
  const [blogNews, setBlogNews] = useState<NewsItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqItems, setFaqItems] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ id: string; name: string; role: string | null; quote: string; rating: number }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string; logo_url: string | null; link_url: string | null }[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState({ days: '--', hours: '--', minutes: '--', seconds: '--', label: 'เปิดเทอม' });

  useEffect(() => {
    supabase
      .from('news')
      .select('id, title, excerpt, cover_image_url, category, created_at, views, published_at')
      .eq('published', true)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(12)
      .then(({ data }) => {
        const items = (data as NewsItem[] | null) ?? [];
        setNews(items.slice(0, 6));
        setBlogNews(items);
      });

    // Fetch upcoming 5 events from "ปฏิทิน" (events table) — sync กับเมนู Admin "ปฏิทิน"
    supabase
      .from('events')
      .select('id, title, event_date, location')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().slice(0, 10))
      .order('event_date', { ascending: true })
      .limit(5)
      .then(({ data }) => { setEvents(data ?? []); });

    // Fetch documents
    supabase
      .from('documents')
      .select('id, title, category, file_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data && data.length > 0) setDocuments(data); else setDocuments(DUMMY_DOCS); });

    // Fetch FAQ from DB (fallback to defaults if empty)
    supabase
      .from('faq')
      .select('id, question, answer')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setFaqItems(data);
        else setFaqItems([
          { id: 'd1', question: 'สมัครเรียนต้องทำอย่างไร?', answer: 'สามารถสมัครผ่านทางเว็บไซต์หรือติดต่อสำนักงานโรงเรียนโดยตรง' },
          { id: 'd2', question: 'ค่าเทอมเท่าไหร่?', answer: 'ดูรายละเอียดค่าเทอมได้ที่หน้าสมัครเรียน' },
          { id: 'd3', question: 'มีรถรับ-ส่งนักเรียนหรือไม่?', answer: 'โรงเรียนมีบริการรถรับส่งในเขตพื้นที่ใกล้เคียง' },
        ]);
      });

    // Fetch Testimonials (fallback if table missing/empty)
    supabase
      .from('testimonials' as any)
      .select('id, name, role, quote, rating')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data as any);
        else setTestimonials([
          { id: 't1', name: 'คุณสมศรี ใจดี',     role: 'ผู้ปกครอง', quote: 'โรงเรียนมีคุณภาพ ดูแลนักเรียนดีมาก ลูกของฉันมีความสุขกับการมาโรงเรียนทุกวัน', rating: 5 },
          { id: 't2', name: 'น้องพิม ป.6',       role: 'นักเรียน',   quote: 'ชอบกิจกรรมที่หลากหลาย ทำให้ได้เรียนรู้นอกห้องเรียน ครูทุกคนเป็นกันเอง',     rating: 5 },
        ]);
      });

    // Fetch Partners (fallback if table missing/empty)
    supabase
      .from('partners' as any)
      .select('id, name, logo_url, link_url')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) setPartners(data as any);
        else setPartners([
          { id: 'p1', name: 'กระทรวงศึกษาธิการ', logo_url: null, link_url: 'https://www.moe.go.th' },
          { id: 'p2', name: 'สพฐ.',             logo_url: null, link_url: 'https://www.obec.go.th' },
          { id: 'p3', name: 'สพท.',             logo_url: null, link_url: '#' },
          { id: 'p4', name: 'ท้องถิ่น',         logo_url: null, link_url: '#' },
        ]);
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

  // ── Countdown to next semester ──────────────────────────────────────────────
  useEffect(() => {
    const getNextTarget = () => {
      const now = new Date();
      const y = now.getFullYear();
      const sem1 = new Date(y, 4, 16, 0, 0, 0); // May 16
      const sem2 = new Date(y, 10, 1, 0, 0, 0);  // Nov 1
      if (now < sem1) return { date: sem1, label: 'เปิดเทอม 1' };
      if (now < sem2) return { date: sem2, label: 'เปิดเทอม 2' };
      return { date: new Date(y + 1, 4, 16, 0, 0, 0), label: 'เปิดเทอม 1' };
    };
    const tick = () => {
      const { date, label } = getNextTarget();
      const diff = date.getTime() - Date.now();
      if (diff <= 0) { setCountdown({ days: '0', hours: '0', minutes: '0', seconds: '0', label }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ days: String(d), hours: String(h).padStart(2, '0'), minutes: String(m).padStart(2, '0'), seconds: String(s).padStart(2, '0'), label });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
    <motion.div
      key="hero"
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[16/7] shadow-md"
    >
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
    </motion.div>
  );

  const newsSection = news.length > 0 ? (
    <motion.div
      key="news"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={slideUpVariants}
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
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
          <Link to={`/news?id=${featured.id}`} className="sm:col-span-1 block group border-r border-gray-100">
            <div className="relative h-44 sm:h-52 bg-gradient-to-br from-primary to-accent overflow-hidden">
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
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(featured.published_at ?? featured.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{featured.views ?? 0}</span>
                </div>
              </div>
            </div>
          </Link>
        )}
        <div className="sm:col-span-2 grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100">
          {rest.map((item) => (
            <Link key={item.id} to={`/news?id=${item.id}`} className="group p-0 block">
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
                  <p className="text-[10px] text-white/60 mt-0.5">{formatDate(item.published_at ?? item.created_at)}</p>
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
        <Link to="/news" className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1 justify-end">
          ดูข่าวสารทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  ) : null;

  const aboutSection = (
    <div key="about" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-primary uppercase tracking-wider border-l-4 border-primary pl-2">ABOUT</span>
        <span className="text-xs text-gray-400">—</span>
        <span className="text-sm font-bold text-gray-800">WHO WE ARE</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{settings.school_description || 'โรงเรียนของเรามุ่งมั่นพัฒนาเด็กนักเรียนให้เป็นคนเก่ง คนดี และมีความสุข ภายใต้บรรยากาศการเรียนรู้ที่อบอุ่นและทันสมัย พร้อมบุคลากรครูที่มีคุณภาพและกิจกรรมเสริมหลักสูตรที่หลากหลาย เพื่อเตรียมความพร้อมสู่อนาคตที่สดใส'}</p>
      <Link to="/about" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary font-medium">
        อ่านเพิ่มเติม <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );

  const calendarSection = events.length > 0 ? (
    <div key="calendar" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
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
            <div className="text-center bg-secondary text-primary rounded-lg px-3 py-1.5 flex-shrink-0">
              <div className="text-lg font-bold leading-none">{new Date(ev.event_date).getDate()}</div>
              <div className="text-[10px] uppercase">{new Date(ev.event_date).toLocaleDateString('th-TH', { month: 'short' })}</div>
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

  const videoUrl = (settings as any).intro_video_url as string | undefined;
  const videoThumb = (settings as any).intro_video_thumbnail as string | undefined
    || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800';
  const videoSection = (
    <div key="video" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2">
        <span className="font-semibold text-sm">🎬 แนะนำโรงเรียน</span>
      </div>
      <div className="p-3">
        {videoUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
            <iframe
              src={videoUrl}
              className="w-full h-full"
              title="School intro video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
            <img src={videoThumb} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Video Thumbnail" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center pl-1 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-xl">▶</span>
              </div>
              <span className="text-white text-xs font-medium mt-2 drop-shadow">คลิกเพื่อเล่นวิดีโอแนะนำ</span>
              <span className="text-white/60 text-[10px] mt-1">(ตัวอย่าง — ตั้งค่า YouTube embed URL ใน Admin)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const statisticsSection = (
    <motion.div
      key="statistics"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainerVariants}
      className="bg-primary text-primary-foreground rounded-lg p-6 text-center shadow-md"
    >
      <h3 className="text-lg font-bold mb-4 opacity-90">โรงเรียนของเราในตัวเลข</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: settings.stat_students || '500+', label: settings.stat_students_label || 'นักเรียน' },
          { value: settings.stat_university || '98%', label: settings.stat_university_label || 'ผ่านเข้ามหาวิทยาลัย' },
          { value: settings.stat_years || '50+', label: settings.stat_years_label || 'ปีแห่งความเป็นเลิศ' },
          { value: settings.about_stat_3 || '200+', label: settings.about_stat_3_label || 'บุคลากร' },
        ].map((s, i) => (
          <motion.div key={i} variants={staggerItemVariants}>
            <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
            <div className="text-xs opacity-75 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const DEFAULT_QUICKLINKS = [
    { icon: '📰', label: 'ข่าวสาร',    href: '/news' },
    { icon: '🖼️', label: 'แกลเลอรี่', href: '/gallery' },
    { icon: '📄', label: 'เอกสาร',    href: '/documents' },
    { icon: '📝', label: 'สมัครเรียน', href: '/enrollment' },
  ];
  const quicklinks = (() => {
    const raw = (settings as any).quicklinks_json as string | undefined;
    if (!raw) return DEFAULT_QUICKLINKS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_QUICKLINKS;
    } catch {
      return DEFAULT_QUICKLINKS;
    }
  })();
  const quicklinksSection = (
    <div key="quicklinks" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-3">🔗 เมนูด่วน</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quicklinks.map((link: { icon: string; label: string; href: string }, i: number) => (
          <Link key={i} to={link.href} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-muted rounded-xl transition-colors text-center">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-xs font-medium text-gray-700">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  const announcementSection = (
    <div key="announcement" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-300 bg-blue-50 shadow-sm overflow-hidden">
      <span className="text-2xl flex-shrink-0">📢</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 break-words leading-tight">{settings.hero_badge || 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568'}</p>
        <Link to="/enrollment" className="text-xs text-blue-600 hover:text-blue-800 underline mt-0.5 inline-block">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );

  // ─── NEW: Blog Grid ─────────────────────────────────────
  const blogGridSection = blogNews.length > 0 ? (
    <motion.div
      key="blog_grid"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainerVariants}
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
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
          <motion.div key={item.id} variants={staggerItemVariants} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link to={`/news?id=${item.id}`} className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-[16/10] bg-gray-200 overflow-hidden">
              {item.cover_image_url ? (
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                  <span className="text-muted-foreground text-3xl">📝</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${categoryColor[item.category] || 'bg-gray-600'}`}>{item.category}</span>
              <h4 className="text-sm font-semibold text-gray-800 mt-2 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h4>
              {item.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                <span>{formatDate(item.published_at ?? item.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views ?? 0}</span>
              </div>
            </div>
          </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  ) : null;

  // ─── NEW: Blog Carousel ─────────────────────────────────
  const blogCarouselSection = blogNews.length > 0 ? (
    <div key="blog_carousel" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">🎠 บทความแนะนำ</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="relative">
        <div ref={carouselRef} className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {blogNews.slice(0, 8).map((item) => (
            <Link key={item.id} to={`/news?id=${item.id}`} className="flex-shrink-0 w-52 sm:w-60 snap-start group">
              <div className="aspect-[16/10] bg-gray-200 rounded-lg overflow-hidden">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-2xl">🎠</span>
                  </div>
                )}
              </div>
              <h4 className="text-xs font-semibold mt-2 line-clamp-2 group-hover:text-primary">{item.title}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(item.published_at ?? item.created_at)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  // ─── NEW: Blog List ─────────────────────────────────────
  const blogListSection = blogNews.length > 0 ? (
    <div key="blog_list" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📋 บทความทั้งหมด</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {blogNews.slice(0, 6).map((item) => (
          <Link key={item.id} to={`/news?id=${item.id}`} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors group">
            {item.cover_image_url && (
              <div className="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white ${categoryColor[item.category] || 'bg-gray-600'}`}>{item.category}</span>
              <h4 className="text-sm font-medium text-gray-800 line-clamp-1 mt-1 group-hover:text-primary">{item.title}</h4>
              {item.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.excerpt}</p>}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span>{formatDate(item.published_at ?? item.created_at)}</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views ?? 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  // ─── NEW: Testimonials (DB-backed with fallback) ──────────────────────────────────
  const testimonialsSection = (
    <div key="testimonials" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-4">💬 เสียงจากนักเรียนและผู้ปกครอง</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(t.rating)}</div>
            <p className="text-xs text-gray-600 italic mb-2">"{t.quote}"</p>
            <p className="text-xs font-semibold text-gray-700">— {t.name}{t.role ? ` (${t.role})` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: FAQ Accordion ─────────────────────────────────
  const faqAccordionSection = (
    <div key="faq_accordion" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2">
        <span className="font-semibold text-sm">❓ คำถามที่พบบ่อย</span>
      </div>
      <div className="divide-y divide-gray-100">
        {faqItems.map((faq, i) => (
          <div key={faq.id}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">{faq.question}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-3 text-xs text-gray-600 leading-relaxed">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── NEW: Countdown ─────────────────────────────────────
  const countdownDays = parseInt(countdown.days, 10);
  const isUrgent = !isNaN(countdownDays) && countdownDays < 7 && countdownDays >= 0;
  const countdownSection = (
    <motion.div
      key="countdown"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={slideUpVariants}
      className={`relative bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6 text-center shadow-md overflow-hidden ${isUrgent ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-background animate-pulse' : ''}`}
    >
      <h3 className="text-sm font-bold mb-1 opacity-90 truncate">⏳ นับถอยหลังสู่{countdown.label}</h3>
      <p className="text-xs opacity-70 mb-4 truncate">ปีการศึกษา 2568</p>
      <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
        {[
          { value: countdown.days, label: 'วัน' },
          { value: countdown.hours, label: 'ชม.' },
          { value: countdown.minutes, label: 'นาที' },
          { value: countdown.seconds, label: 'วินาที' },
        ].map((item, i) => (
          <div key={i} className="bg-white/20 rounded-lg px-4 py-2 min-w-[60px]">
            <motion.div
              key={item.value}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-2xl font-bold tabular-nums"
            >
              {item.value}
            </motion.div>
            <div className="text-xs opacity-70">{item.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // ─── NEW: Partner Logos (DB-backed with fallback) ─────────────────────────────────
  const partnerLogosSection = (
    <div key="partner_logos" className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-center mb-4">🤝 หน่วยงานที่เกี่ยวข้อง</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {partners.map((p) => {
          const inner = p.logo_url ? (
            <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-gray-500 leading-tight px-1">{p.name}</span>
          );
          return p.link_url && p.link_url !== '#' ? (
            <a key={p.id} href={p.link_url} target="_blank" rel="noopener noreferrer"
              className="w-20 h-20 rounded-lg bg-gray-100 hover:bg-muted flex items-center justify-center text-center p-2 transition-colors"
              title={p.name}>
              {inner}
            </a>
          ) : (
            <div key={p.id} className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-center p-2">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── NEW: Photo Album ───────────────────────────────────
  const photoAlbumItems = blogNews.filter(n => n.cover_image_url).slice(0, 8);
  const photoAlbumSection = photoAlbumItems.length > 0 ? (
    <div key="photo_album" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📸 ภาพกิจกรรมล่าสุด</span>
        <Link to="/gallery" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">
        {photoAlbumItems.map((item) => (
          <Link key={item.id} to="/gallery" className="aspect-square overflow-hidden rounded-lg group">
            <img src={item.cover_image_url!} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  // ─── NEW: Map Embed ─────────────────────────────────────
  // Fallback: ภาคอีสาน Thailand pin (ปรับใน Admin Settings → google_maps_embed)
  const DUMMY_MAP_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3814.5!2d104.2!3d16.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDMwJzAuMCJOIDEwNMKwMTInMC4wIkU!5e0!3m2!1sen!2sth!4v1700000000000!5m2!1sen!2sth';
  const mapUrlToShow = settings.google_maps_embed || DUMMY_MAP_URL;
  const mapEmbedSection = (
    <div key="map_embed" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2">
        <span className="font-semibold text-sm">🗺️ แผนที่โรงเรียน</span>
      </div>
      <div className="aspect-[2/1]">
        <MapEmbed url={mapUrlToShow} title="แผนที่โรงเรียน" />
      </div>
      {!settings.google_maps_embed && (
        <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100">
          (ตัวอย่าง — ตั้งค่า Google Maps URL ใน Admin Settings)
        </div>
      )}
    </div>
  );

  // ─── NEW: Contact Form ──────────────────────────────────
  const contactFormSection = <ContactFormBlock key="contact_form" />;

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
        <a href="#" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-muted hover:border-border transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-primary leading-tight">School MIS</h4>
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
        <a href="#" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-muted hover:border-border transition-all shadow-sm hover:shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-accent flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 group-hover:text-accent leading-tight">AMSS++</h4>
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
