import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Eye, Calendar, ArrowRight, FileText, ChevronDown, Database, Heart, Utensils, BookOpen, Briefcase, Building, Send, Award, Trophy, Sparkles, Shield, Star, HeartHandshake } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { MapEmbed } from '@/components/MapEmbed';
import { conductService, type ConductRecord, type HeroProfile } from '@/services/conduct.service';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import {
  staggerContainerVariants,
  staggerItemVariants,
  slideUpVariants,
} from '@/hooks/useScrollReveal';
import FacebookFeedSection from '@/components/home/sections/FacebookFeedSection';
import { educationalHubService, type EduHubItem } from '@/services/educational-hub.service';
import { FeaturedGameDialog } from '@/components/home/FeaturedGameDialog';

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
    <div className="bg-card border border-border rounded-lg shadow-sm p-4">
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
  const [slides, setSlides] = useState<{ url: string; title: string; fit: 'cover' | 'contain' }[]>([]);
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
  const [topConduct, setTopConduct] = useState<{ id: string; name: string; class: string; photo: string | null; total: number }[]>([]);
  const [featuredHeroProfiles, setFeaturedHeroProfiles] = useState<HeroProfile[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [featuredHeroLoading, setFeaturedHeroLoading] = useState(false);
  const [featuredGames, setFeaturedGames] = useState<EduHubItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<EduHubItem | null>(null);

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

    // เกมที่ปักหมุดขึ้นโซน "เกมแนะนำ" หน้าแรก (เลือกจากหลังบ้าน GamesTab)
    educationalHubService.listFeaturedGames().then(({ data }) => {
      setFeaturedGames((data as unknown as EduHubItem[] | null) ?? []);
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

    // Fetch documents (schema: is_published + no `category` string column — use category_id FK)
    supabase
      .from('documents')
      .select('id, title, file_url')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDocuments(data.map((d) => ({ id: d.id, title: d.title, category: null, file_url: d.file_url ?? '#' })));
        } else {
          setDocuments(DUMMY_DOCS);
        }
      });

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
        if (data && data.length > 0) {
          // Hotfix: Auto-replace broken wikimedia URLs with local assets if they were saved in the DB
          const sanitizedData = (data as any[]).map(p => {
            if (p.logo_url && p.logo_url.includes('wikimedia.org')) {
              if (p.name.includes('กระทรวง') || p.name.includes('moe')) p.logo_url = '/logos/moe.webp';
              else if (p.name.includes('สพฐ') || p.name.includes('obec')) p.logo_url = '/logos/obec.webp';
              else p.logo_url = '/logos/garuda.webp';
            }
            return p;
          });
          setPartners(sanitizedData);
        }
        else setPartners([
          { id: 'p1', name: 'กระทรวงศึกษาธิการ', logo_url: '/logos/moe.webp', link_url: 'https://www.moe.go.th' },
          { id: 'p2', name: 'สพฐ.',             logo_url: '/logos/obec.webp', link_url: 'https://www.obec.go.th' },
          { id: 'p3', name: 'สพท.',             logo_url: '/logos/garuda.webp', link_url: '#' },
          { id: 'p4', name: 'ท้องถิ่น',         logo_url: '/logos/garuda.webp', link_url: '#' },
        ]);
      });
  }, []);

  // Fetch top conduct students (current semester guess: month >= May → sem 1, else sem 2)
  useEffect(() => {
    const now = new Date();
    const sem = now.getMonth() >= 4 && now.getMonth() <= 9 ? '1' : '2';
    const year = String(now.getFullYear() + 543);

    const fetchTopStudents = (targetSem?: string, targetYear?: string) => {
      conductService.getPublicPositive(targetSem, targetYear).then(({ data }) => {
        const records = (data || []) as ConductRecord[];

        if (records.length === 0 && targetSem && targetYear) {
          // If empty for current term, fall back to agnostic (all-time/previous semesters)
          fetchTopStudents(undefined, undefined);
          return;
        }

        const map = new Map<string, { id: string; name: string; class: string; photo: string | null; total: number }>();
        for (const r of records) {
          if (!r.students) continue;
          const cur = map.get(r.student_id) ?? {
            id: r.student_id, name: r.students.name, class: r.students.class,
            photo: r.students.photo_url ?? null, total: 0,
          };
          cur.total += r.score;
          map.set(r.student_id, cur);
        }
        const top = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
        setTopConduct(top);

        if (top.length > 0) {
          setFeaturedHeroLoading(true);
          Promise.all(
            top.map(student =>
              conductService.getHeroProfile(student.id)
                .catch(err => {
                  console.error("Error fetching featured hero profile:", err);
                  return null;
                })
            )
          ).then((profiles) => {
            const validProfiles = profiles.filter((p): p is HeroProfile => p !== null);
            setFeaturedHeroProfiles(validProfiles);
          }).finally(() => {
            setFeaturedHeroLoading(false);
          });
        } else {
          setFeaturedHeroProfiles([]);
        }
      });
    };

    fetchTopStudents(sem, year);
  }, []);

  // Auto-play for Hero Showcase
  useEffect(() => {
    if (featuredHeroProfiles.length < 2 || isHeroHovered) return;
    const interval = setInterval(() => {
      setActiveHeroIndex(p => (p + 1) % featuredHeroProfiles.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [featuredHeroProfiles.length, isHeroHovered]);

  // Fetch hero_slides from DB; fallback to news cover images
  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('image_url, title, order_position, image_fit')
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlides((data as { image_url: string; title: string | null; order_position: number; image_fit: string }[]).map(s => ({
            url: s.image_url,
            title: s.title || '',
            fit: (s.image_fit === 'contain' ? 'contain' : 'cover') as 'cover' | 'contain',
          })));
        } else {
          setSlides(DUMMY_SLIDES.map(s => ({ ...s, fit: 'cover' as const })));
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

  const featuredHeroProfile = featuredHeroProfiles[activeHeroIndex] || null;
  const currentHeroRecord = topConduct[activeHeroIndex] || null;

  const featured = news[0];
  const rest = news.slice(1, 5);

  // Determine highest virtue for bubble feedback
  const highestVirtueInfo = (() => {
    if (!featuredHeroProfile?.virtues) return null;
    const virtues = featuredHeroProfile.virtues;
    let highestKey: keyof typeof virtues = 'publicMind';
    let highestVal = -1;

    Object.entries(virtues).forEach(([key, val]) => {
      if (val > highestVal) {
        highestVal = val;
        highestKey = key as keyof typeof virtues;
      }
    });

    const VIRTUE_METRICS = {
      publicMind: { 
        label: 'จิตสาธารณะ 🌱', 
        feedback: 'ความดีด้านจิตสาธารณะของหนู ช่วยให้โรงเรียนและเพื่อนๆ มีสิ่งแวดล้อมที่น่าอยู่และน่าเรียนรู้ยิ่งขึ้น 🌱'
      },
      responsibility: { 
        label: 'ความรับผิดชอบ 📘', 
        feedback: 'ความรับผิดชอบและการทำหน้าที่ของหนูอย่างเต็มความสามารถ เป็นเรื่องที่น่ายกย่องและเป็นแบบอย่างที่ดีเยี่ยม 📘'
      },
      discipline: { 
        label: 'วินัย ⏰', 
        feedback: 'ความมีระเบียบวินัยและการตรงต่อเวลาของหนู เป็นรากฐานสำคัญของผู้นำที่ดีในอนาคต ⏰'
      },
      honesty: { 
        label: 'ซื่อสัตย์ 🤝', 
        feedback: 'ความซื่อสัตย์สุจริตของหนูเป็นเรื่องที่ประเสริฐสุด นำพาความเชื่อมั่นและเกียรติยศที่น่าภูมิใจมาสู่ตนเอง 🤝'
      },
      kindness: { 
        label: 'น้ำใจ ❤️', 
        feedback: 'ความมีน้ำใจและการช่วยเหลือแบ่งปันของหนู เติมเต็มรอยยิ้มและความอบอุ่นให้สังคมรอบตัวมีความสุข ❤️'
      },
    };

    return {
      key: highestKey,
      val: highestVal,
      meta: VIRTUE_METRICS[highestKey]
    };
  })();

  // Dynamic Radar Chart Calculation
  const radarData = (() => {
    if (!featuredHeroProfile?.virtues) return [];
    const values = Object.values(featuredHeroProfile.virtues);
    const maxVal = Math.max(...values, 10);
    return [
      { name: 'จิตสาธารณะ 🌱', score: featuredHeroProfile.virtues.publicMind, fullMark: maxVal },
      { name: 'ความรับผิดชอบ 📘', score: featuredHeroProfile.virtues.responsibility, fullMark: maxVal },
      { name: 'วินัย ⏰', score: featuredHeroProfile.virtues.discipline, fullMark: maxVal },
      { name: 'ซื่อสัตย์ 🤝', score: featuredHeroProfile.virtues.honesty, fullMark: maxVal },
      { name: 'น้ำใจ ❤️', score: featuredHeroProfile.virtues.kindness, fullMark: maxVal },
    ];
  })();

  const maxVirtueScore = (() => {
    if (!featuredHeroProfile?.virtues) return 10;
    return Math.max(...Object.values(featuredHeroProfile.virtues), 10);
  })();

  // Helper for rank styling
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white', label: 'อันดับ 1 👑' };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-slate-800', label: 'อันดับ 2 🥈' };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', text: 'text-white', label: 'อันดับ 3 🥉' };
    return { bg: 'bg-slate-100', text: 'text-slate-600', label: `อันดับ ${rank}` };
  };

  const featuredHeroSection = featuredHeroProfile && currentHeroRecord ? (
    <motion.div
      key="featured_hero_container"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={slideUpVariants}
      onMouseEnter={() => setIsHeroHovered(true)}
      onMouseLeave={() => setIsHeroHovered(false)}
      className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border border-amber-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group/showcase animate-fadeIn"
    >
      {/* Background elegant accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/10 rounded-full blur-2xl -z-10" />

      {/* Header section title */}
      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-800 tracking-tight flex items-center gap-1.5 text-left">
              Kampai Hero Profile Showcase
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            </h3>
            <p className="text-[10px] font-medium text-gray-400 text-left">
              10 อันดับสุดยอดฮีโร่คุณธรรมและความดีสะสมสูงสุดประจำปีการศึกษา
            </p>
          </div>
        </div>

        {/* Current Rank Badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${getRankBadgeStyle(activeHeroIndex + 1).bg} ${getRankBadgeStyle(activeHeroIndex + 1).text}`}>
          {getRankBadgeStyle(activeHeroIndex + 1).label}
        </span>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 items-center">
        {/* Left Side: Avatar and stats with slide transition */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <motion.div 
            key={activeHeroIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row items-center gap-4 w-full"
          >
            {/* Student Photo with premium gold glow frame */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full blur opacity-40 animate-pulse" />
              {currentHeroRecord.photo ? (
                <img
                  src={currentHeroRecord.photo}
                  alt={currentHeroRecord.name}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
                />
              ) : (
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border-4 border-white shadow-md flex items-center justify-center text-2xl font-black flex-shrink-0">
                  {currentHeroRecord.name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, '').slice(0, 2)}
                </div>
              )}
              {/* Level Badge */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow border border-white">
                LV.{featuredHeroProfile.level}
              </div>
            </div>

            {/* Profile core details */}
            <div className="space-y-1.5 text-center md:text-left min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                <Shield className="w-3 h-3 text-amber-500" />
                {featuredHeroProfile.heroTitle}
              </span>
              <h4 className="text-lg font-black text-gray-800 tracking-tight truncate">{currentHeroRecord.name}</h4>
              <p className="text-xs font-bold text-gray-500">
                ชั้นเรียน {currentHeroRecord.class}
              </p>
              <div className="inline-flex items-center gap-1 text-[11px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
                สะสม {featuredHeroProfile.totalXp} XP คะแนนความดี
              </div>
            </div>
          </motion.div>

          {/* Level Progress Bar */}
          <div className="w-full space-y-1 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
            <div className="flex justify-between text-[10px] font-bold text-gray-500">
              <span>ความก้าวหน้าสู่เลเวลถัดไป</span>
              <span>{featuredHeroProfile.xpInLevel} / {featuredHeroProfile.xpInLevel + featuredHeroProfile.xpNeededForNextLevel} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${featuredHeroProfile.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Interactive CTA to full public profile */}
          <Link
            to={`/hero/${featuredHeroProfile.studentId}`}
            className="w-full md:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" />
            เปิดใบประกาศและโปรไฟล์ฉบับเต็ม
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right Side: Recharts 5-Dimension Radar Chart */}
        <div className="w-full bg-gray-50/50 rounded-2xl border border-gray-100 p-3 flex flex-col items-center">
          <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">
            ผังพลังคุณธรรม 5 มิติฮีโร่
          </h4>
          <div className="h-44 w-full flex items-center justify-center min-h-[176px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 8, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, maxVirtueScore]}
                  tick={false}
                />
                <Radar
                  name="คะแนนพลังความดี"
                  dataKey="score"
                  stroke="#d97706"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Psychological positive feedback message bubble */}
      {highestVirtueInfo && (
        <motion.div 
          key={`feedback-${activeHeroIndex}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 relative bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-100 p-3.5 rounded-xl flex items-start gap-3 shadow-inner"
        >
          <div className="p-1.5 bg-white rounded-lg border border-amber-200 shadow-sm text-sm flex-shrink-0">
            💬
          </div>
          <div className="space-y-0.5 text-left">
            <h5 className="text-xs font-extrabold text-amber-800">
              พลังเด่นวันนี้: {highestVirtueInfo.meta.label}
            </h5>
            <p className="text-[11px] font-medium text-amber-950 leading-relaxed">
              "{highestVirtueInfo.meta.feedback}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Slideshow Arrow Navigation */}
      {featuredHeroProfiles.length > 1 && (
        <>
          <button 
            onClick={() => setActiveHeroIndex(p => (p - 1 + featuredHeroProfiles.length) % featuredHeroProfiles.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow border border-slate-200 flex items-center justify-center cursor-pointer md:opacity-0 md:group-hover/showcase:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveHeroIndex(p => (p + 1) % featuredHeroProfiles.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow border border-slate-200 flex items-center justify-center cursor-pointer md:opacity-0 md:group-hover/showcase:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {featuredHeroProfiles.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {featuredHeroProfiles.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveHeroIndex(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${i === activeHeroIndex ? 'bg-amber-500 w-6' : 'bg-slate-300 w-2 hover:bg-slate-400'}`}
              title={`Rank ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  ) : featuredHeroLoading ? (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center space-y-3 h-72">
      <div className="w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      <p className="text-xs text-muted-foreground font-semibold">กำลังดึงข้อมูล Kampai Hero Profile...</p>
    </div>
  ) : null;

  // Parse section order from layout or legacy key
  const getSectionOrder = (): string[] => {
    const rawLayout = settings.homepage_main_sections;
    if (rawLayout) {
      try {
        const parsed = JSON.parse(rawLayout) as string[];
        if (Array.isArray(parsed)) {
          if (!parsed.includes('featured_hero')) {
            const heroIndex = parsed.indexOf('hero');
            if (heroIndex !== -1) {
              parsed.splice(heroIndex + 1, 0, 'featured_hero');
            } else {
              parsed.unshift('featured_hero');
            }
          }
          return parsed;
        }
      } catch { /* fallback */ }
    }
    return ['hero', 'featured_hero', 'featured_games', 'news', 'about'];
  };
  const sectionOrder = getSectionOrder();

  // === SECTIONS ===

  const heroSection = (
    <motion.div
      key="hero"
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[16/9] shadow-md"
    >
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          {slide.fit === 'contain' ? (
            <>
              <img
                src={slide.url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 brightness-50"
              />
              <img
                src={slide.url}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </>
          ) : (
            <img src={slide.url} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
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
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
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
          <Link to={`/news/${featured.id}`} className="sm:col-span-1 block group border-r border-gray-100">
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
            <Link key={item.id} to={`/news/${item.id}`} className="group p-0 block">
              <div className="relative h-28 overflow-hidden bg-muted">
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
    <div key="about" className="bg-card border border-border rounded-lg shadow-sm p-4">
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
    <div key="calendar" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
    <div key="video" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
    <div key="quicklinks" className="bg-card border border-border rounded-lg shadow-sm p-4">
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
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-4">
        {blogNews.slice(0, 6).map((item) => (
          <motion.div key={item.id} variants={staggerItemVariants} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link to={`/news/${item.id}`} className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
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
    <div key="blog_carousel" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">🎠 บทความแนะนำ</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="relative">
        <div ref={carouselRef} className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {blogNews.slice(0, 8).map((item) => (
            <Link key={item.id} to={`/news/${item.id}`} className="flex-shrink-0 w-52 sm:w-60 snap-start group">
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

  // ─── เกมแนะนำ — การ์ดปกเลื่อนแนวนอน + ป๊อปอัปรายละเอียด ───
  const featuredGamesSection = featuredGames.length > 0 ? (
    <div key="featured_games">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={slideUpVariants}
        className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
          <span className="font-semibold text-sm flex items-center gap-2">
            <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
            🎮 เกมแนะนำ
          </span>
          <Link to="/educational-hub" className="text-xs text-yellow-300 hover:text-yellow-100 flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {featuredGames.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setSelectedGame(game)}
              className="flex-shrink-0 w-44 sm:w-52 snap-start group text-left"
            >
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                {game.thumbnail_url ? (
                  <img
                    src={game.thumbnail_url}
                    alt={game.title}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                    <span className="text-2xl">🎮</span>
                  </div>
                )}
              </div>
              <h4 className="text-xs font-semibold mt-2 line-clamp-2 group-hover:text-primary transition-colors">{game.title}</h4>
              {game.subject && <p className="text-[10px] text-muted-foreground mt-0.5">{game.subject}</p>}
            </button>
          ))}
        </div>
      </motion.div>
      <FeaturedGameDialog
        game={selectedGame}
        open={!!selectedGame}
        onOpenChange={(o) => !o && setSelectedGame(null)}
      />
    </div>
  ) : null;

  // ─── NEW: Blog List ─────────────────────────────────────
  const blogListSection = blogNews.length > 0 ? (
    <div key="blog_list" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📋 บทความทั้งหมด</span>
        <Link to="/news" className="text-xs text-yellow-300 hover:text-yellow-100">ดูทั้งหมด →</Link>
      </div>
      <div className="divide-y divide-gray-100">
        {blogNews.slice(0, 6).map((item) => (
          <Link key={item.id} to={`/news/${item.id}`} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors group">
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
    <div key="testimonials" className="bg-card border border-border rounded-lg shadow-sm p-4">
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
    <div key="faq_accordion" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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

  // ─── Partner Links — compact row list: small logo + name ─────────────────────────
  const partnerLogosSection = (
    <div key="partner_logos" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-yellow-400 rounded-full inline-block" />
        <span className="font-semibold text-sm">🤝 หน่วยงานที่เกี่ยวข้อง</span>
      </div>
      <div className="divide-y divide-gray-100">
        {partners.map((p) => {
          const content = (
            <div className="flex items-center gap-3 px-4 py-1.5 hover:bg-gray-50 transition-colors group">
              {/* Logo 32×32 */}
              <div className="w-8 h-8 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                ) : (
                  <Building className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              {/* Name */}
              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                {p.name}
              </span>
              {/* Link icon */}
              {p.link_url && p.link_url !== '#' && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary flex-shrink-0 transition-colors" />
              )}
            </div>
          );
          return p.link_url && p.link_url !== '#' ? (
            <a key={p.id} href={p.link_url} target="_blank" rel="noopener noreferrer" className="block">
              {content}
            </a>
          ) : (
            <div key={p.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );

  // ─── NEW: Photo Album ───────────────────────────────────
  const photoAlbumItems = blogNews.filter(n => n.cover_image_url).slice(0, 8);
  const photoAlbumSection = photoAlbumItems.length > 0 ? (
    <div key="photo_album" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
    <div key="map_embed" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
    <div key="obec_systems" className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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

  const conductLeaderboardSection = topConduct.length > 0 ? (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg shadow-sm border border-yellow-200/60 dark:border-yellow-900/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-base font-bold text-gray-800 dark:text-foreground">คนดีคำไผ่</h3>
        <span className="text-xs text-muted-foreground ml-2">เทอมปัจจุบัน</span>
        <Link to="/hall-of-fame" className="ml-auto text-xs text-primary hover:underline flex items-center gap-0.5">
          ดูทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {topConduct.map((s, idx) => (
          <Link key={s.id} to="/hall-of-fame" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-foreground/5 transition-colors">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              {idx + 1}
            </div>
            {s.photo ? (
              <img src={s.photo} alt={s.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {s.name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, '').slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-foreground truncate">{s.name}</p>
              <p className="text-[10px] text-muted-foreground">{s.class}</p>
            </div>
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex-shrink-0">+{s.total}</span>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  const sectionMap: Record<string, JSX.Element | null> = {
    hero: heroSection,
    featured_hero: featuredHeroSection,
    featured_games: featuredGamesSection,
    news: newsSection,
    facebook_feed: <FacebookFeedSection key="facebook_feed" />,
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
    conduct_leaderboard: conductLeaderboardSection,
  };

  return sectionMap;
};
