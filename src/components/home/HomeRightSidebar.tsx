import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Facebook, Youtube, Instagram, MessageCircle, Link as LinkIcon, Image, Users, Monitor, FileText, ArrowRight, Recycle, Wallet } from 'lucide-react';
import { SaverTierBadge } from '@/components/savings/SaverTierBadge';
import { staggerContainerVariants, staggerItemVariants, fadeInVariants } from '@/hooks/useScrollReveal';

// ─── WasteBank Widget ─────────────────────────────────────

interface WasteSummary {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  photo_url: string | null;
  total_points_earned: number | null;
  total_items: number | null;
  total_transactions: number | null;
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
  'from-teal-400 to-cyan-500',
  'from-emerald-400 to-emerald-600',
];

const DUMMY_DOCS_RIGHT = [
  { id: 'dummy-rd1', title: 'คู่มือนักเรียนและผู้ปกครอง',  category: 'ทั่วไป',         file_url: '#' },
  { id: 'dummy-rd2', title: 'ใบสมัครเรียน ปี 2568',         category: 'รับสมัคร',       file_url: '#' },
  { id: 'dummy-rd3', title: 'ปฏิทินวิชาการประจำปี',          category: 'วิชาการ',        file_url: '#' },
  { id: 'dummy-rd4', title: 'แบบฟอร์มใบลากิจ/ลาป่วย',        category: 'เอกสารนักเรียน', file_url: '#' },
  { id: 'dummy-rd5', title: 'ระเบียบการแต่งกายของนักเรียน', category: 'ทั่วไป',         file_url: '#' },
];

const DUMMY_SOCIAL = [
  { platform: 'facebook',  url: '#' },
  { platform: 'youtube',   url: '#' },
  { platform: 'instagram', url: '#' },
  { platform: 'line',      url: '#' },
];

const WasteBankWidget = () => {
  const [summaries, setSummaries] = useState<WasteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('waste_student_summary')
      .select('student_id, full_name, class_name, photo_url, total_points_earned, total_items, total_transactions')
      .gt('total_transactions', 0)
      .order('total_points_earned', { ascending: false })
      .then(({ data }) => {
        setSummaries((data as WasteSummary[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  const top5 = useMemo(
    () => [...summaries].sort((a, b) => Number(b.total_points_earned ?? 0) - Number(a.total_points_earned ?? 0)).slice(0, 5),
    [summaries],
  );
  const totalPoints = summaries.reduce((acc, s) => acc + Number(s.total_points_earned ?? 0), 0);
  const totalItems  = summaries.reduce((acc, s) => acc + Number(s.total_items ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
        <Recycle className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold text-sm">🏆 ธนาคารขยะ — Top 5</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-green-50 border-b border-green-100">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">คะแนนรวม</p>
          <p className="font-bold text-green-700 text-sm">{totalPoints.toLocaleString()} คะแนน</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">จำนวนชิ้นรวม</p>
          <p className="font-bold text-blue-700 text-sm">{totalItems.toLocaleString()} ชิ้น</p>
        </div>
      </div>

      {/* Top 5 list */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : top5.length === 0 ? (
        <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</div>
      ) : (
        <ul className="divide-y divide-green-50">
          {top5.map((s, i) => (
            <li key={s.student_id ?? i} className="flex items-center gap-2 px-3 py-2">
              {/* Rank badge */}
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${RANK_COLORS[i]} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm`}>
                {MEDALS[i]}
              </div>
              {/* Photo */}
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.full_name ?? ''} className="w-8 h-8 rounded-full object-cover border border-green-200 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 text-xs font-bold border border-green-200">
                  {(s.full_name ?? '?').charAt(0)}
                </div>
              )}
              {/* Name & stats */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{s.full_name ?? '-'}</p>
                <p className="text-[10px] text-gray-500">{s.class_name ?? ''} · {Number(s.total_transactions ?? 0)} ครั้ง · {Number(s.total_items ?? 0)} ชิ้น</p>
              </div>
              {/* Points */}
              <span className="text-xs font-bold text-green-700 flex-shrink-0">{Number(s.total_points_earned ?? 0).toLocaleString()} คะแนน</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer link */}
      <div className="px-4 py-2.5 border-t border-green-100 bg-green-50">
        <Link to="/waste-bank" className="text-xs text-green-700 hover:underline flex items-center gap-1 font-medium">
          <Recycle className="w-3 h-3" /> ดูธนาคารขยะทั้งหมด
        </Link>
      </div>
    </div>
  );
};

// ─── SavingsBank Widget ───────────────────────────────────
// ⚠️ Privacy: หน้านี้สาธารณะ — ห้ามแสดงตัวเลขเงิน
// จัดอันดับ + แสดงเฉพาะ "จำนวนครั้งฝาก" + tier (รางวัลวินัย ไม่ใช่ความรวย)

interface SavingsSummaryRow {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  photo_url: string | null;
  deposit_count: number | null;
  total_transactions: number | null;
}

const SavingsBankWidget = () => {
  const [rows, setRows] = useState<SavingsSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('savings_student_summary')
      .select('student_id, full_name, class_name, photo_url, deposit_count, total_transactions')
      .gt('deposit_count', 0)
      .order('deposit_count', { ascending: false })
      .order('total_transactions', { ascending: false })
      .then(({ data }) => {
        setRows((data as SavingsSummaryRow[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  const top5 = useMemo(() => rows.slice(0, 5), [rows]);
  const totalSavers = rows.length;
  const totalDeposits = rows.reduce((acc, r) => acc + Number(r.deposit_count ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-amber-500 text-white px-4 py-3 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold text-sm">🏦 ธนาคารพอเพียง — Top 5</h3>
      </div>

      {/* Stats row (ไม่มีตัวเลขเงิน) */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">นักเรียนที่ออม</p>
          <p className="font-bold text-amber-900 text-sm">{totalSavers.toLocaleString('th-TH')} คน</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">ครั้งฝากรวม</p>
          <p className="font-bold text-emerald-900 text-sm">{totalDeposits.toLocaleString('th-TH')} ครั้ง</p>
        </div>
      </div>

      {/* Top 5 list */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : top5.length === 0 ? (
        <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</div>
      ) : (
        <ul className="divide-y divide-amber-50">
          {top5.map((s, i) => (
            <li key={s.student_id ?? i} className="flex items-center gap-2 px-3 py-2">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${RANK_COLORS[i]} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm`}>
                {MEDALS[i]}
              </div>
              {s.photo_url ? (
                <img src={s.photo_url} alt={s.full_name ?? ''} className="w-8 h-8 rounded-full object-cover border border-amber-200 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-900 text-xs font-bold border border-amber-300">
                  {(s.full_name ?? '?').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{s.full_name ?? '-'}</p>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-gray-500">{s.class_name ?? ''}</p>
                  <SaverTierBadge depositCount={s.deposit_count} size="sm" showLabel={false} />
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 flex-shrink-0">
                {Number(s.deposit_count ?? 0).toLocaleString('th-TH')} ครั้ง
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer link */}
      <div className="px-4 py-2.5 border-t border-amber-100 bg-amber-50">
        <Link to="/savings-bank" className="text-xs text-amber-900 hover:underline flex items-center gap-1 font-semibold">
          <Wallet className="w-3 h-3" /> ดูธนาคารพอเพียงทั้งหมด
        </Link>
      </div>
    </div>
  );
};

const categoryLinks = [
  { label: 'ข่าวประชาสัมพันธ์', href: '/news', color: 'text-blue-700', dot: 'bg-blue-500' },
  { label: 'กิจกรรม', href: '/news', color: 'text-green-700', dot: 'bg-green-500' },
  { label: 'ผลงานนักเรียน', href: '/news', color: 'text-primary', dot: 'bg-accent' },
  { label: 'บทความ', href: '/news', color: 'text-orange-700', dot: 'bg-orange-500' },
  { label: 'ประกาศจัดซื้อจัดจ้าง', href: '/news', color: 'text-red-700', dot: 'bg-red-500' },
];

// Real visitor counter from page_views table (with localStorage cache fallback)
interface VisitorStats {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  total: number;
}

const fetchVisitorStats = async (): Promise<VisitorStats> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const queries = await Promise.all([
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', today),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', yesterday).lt('visited_at', today),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', weekAgo),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', monthStart),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', yearStart),
    supabase.from('page_views').select('*', { count: 'exact', head: true }),
  ]);

  return {
    today: queries[0].count ?? 0,
    yesterday: queries[1].count ?? 0,
    thisWeek: queries[2].count ?? 0,
    thisMonth: queries[3].count ?? 0,
    thisYear: queries[4].count ?? 0,
    total: queries[5].count ?? 0,
  };
};

export const useHomeRightBlocks = () => {
  const { settings } = useSchoolSettings();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({ today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, total: 0 });

  useEffect(() => {
    fetchVisitorStats().then(setVisitorStats).catch(() => {
      // Silent fallback to zeros if page_views unavailable
    });
  }, []);
  const [documents, setDocuments] = useState<{ id: string; title: string; category: string | null; file_url: string }[]>([]);

  useEffect(() => {
    // Fetch real school photos: gallery_albums first → news cover_image fallback → empty (placeholder UI)
    (async () => {
      const { data: galleryData } = await supabase
        .from('gallery_albums' as any)
        .select('cover_image_url')
        .eq('is_published', true)
        .not('cover_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);

      const galleryUrls = galleryData
        ? (galleryData as any[]).map((g) => g.cover_image_url).filter(Boolean)
        : [];

      if (galleryUrls.length > 0) {
        setGalleryImages(galleryUrls);
        return;
      }

      const { data: newsData } = await supabase
        .from('news')
        .select('cover_image_url')
        .eq('is_published', true)
        .not('cover_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);

      const newsUrls = newsData
        ? (newsData as any[]).map((n) => n.cover_image_url).filter(Boolean)
        : [];

      setGalleryImages(newsUrls);
    })();

    // Fetch documents
    supabase
      .from('documents')
      .select('id, title, category, file_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setDocuments(data && data.length > 0 ? data : DUMMY_DOCS_RIGHT);
      });
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return { icon: Facebook, color: 'text-blue-600', label: 'Facebook' };
      case 'youtube': return { icon: Youtube, color: 'text-red-600', label: 'YouTube' };
      case 'instagram': return { icon: Instagram, color: 'text-rose-600', label: 'Instagram' };
      case 'line': return { icon: MessageCircle, color: 'text-green-600', label: 'LINE' };
      default: return { icon: LinkIcon, color: 'text-gray-600', label: platform };
    }
  };

  const rawOrder = settings.homepage_right_widgets;
  const widgetOrder: string[] = rawOrder
    ? (() => { try { return JSON.parse(rawOrder); } catch { return ['categories','gallery','services','social','stats','waste_bank','savings_bank']; } })()
    : ['categories','gallery','services','social','stats','waste_bank','savings_bank'];

  const categoriesWidget = (
    <div key="categories" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2">รายการหมวดหมู่</div>
      <ul className="divide-y divide-gray-100">
        {categoryLinks.map((c) => (
          <li key={c.label}>
            <Link to={c.href} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors group">
              <span className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
              <span className={`${c.color} group-hover:underline`}>{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const galleryWidget = (
    <motion.div
      key="gallery"
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
        <Image className="w-3.5 h-3.5" /> คลังรูปภาพ
      </div>
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 p-1">
          {galleryImages.slice(0, 6).map((url, i) => (
            <motion.div key={i} variants={fadeInVariants} whileHover={{ scale: 1.05 }}>
              <Link to="/gallery" className="block aspect-square overflow-hidden rounded">
                <img src={url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center bg-muted/30">
          <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">ยังไม่มีรูปภาพ</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">เพิ่มอัลบั้มได้ที่หน้าจัดการแกลเลอรี่</p>
        </div>
      )}
      <div className="px-3 py-2 border-t border-gray-100">
        <Link to="/gallery" className="text-xs text-primary hover:underline flex items-center gap-1">
          <Image className="w-3 h-3" /> ดูรูปภาพทั้งหมด
        </Link>
      </div>
    </motion.div>
  );

  const servicesWidget = (
    <div key="services" className="flex flex-col gap-2">
      <Link to="/waste-bank" className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">
        <Monitor className="w-5 h-5 flex-shrink-0" /> E-Services
      </Link>
      <Link to="/documents" className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">
        <LinkIcon className="w-5 h-5 flex-shrink-0" /> เอกสารดาวน์โหลด
      </Link>
      {settings.footer_service_1_url && settings.footer_service_1_url !== '#' && (
        <a href={settings.footer_service_1_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">
          <LinkIcon className="w-5 h-5 flex-shrink-0" />{settings.footer_service_1_name || 'Links'}
        </a>
      )}
      {settings.footer_service_2_url && settings.footer_service_2_url !== '#' && (
        <a href={settings.footer_service_2_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">
          <LinkIcon className="w-5 h-5 flex-shrink-0" />{settings.footer_service_2_name || 'Links'}
        </a>
      )}
    </div>
  );

  const socialLinksToShow = settings.social_links && settings.social_links.length > 0
    ? settings.social_links
    : DUMMY_SOCIAL;
  const socialIsDummy = !(settings.social_links && settings.social_links.length > 0);
  const socialWidget = (
    <div key="social" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2">โซเชียลมีเดีย</div>
      <div className="p-3 flex flex-wrap gap-2">
        {socialLinksToShow.map((link, i) => {
          const { icon: Icon, color, label } = getSocialIcon(link.platform);
          return (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-gray-700">{label}</span>
            </a>
          );
        })}
      </div>
      {socialIsDummy && (
        <div className="px-3 pb-2 text-[10px] text-gray-400">(ตัวอย่าง — ตั้งค่า URL ใน Admin)</div>
      )}
    </div>
  );

  const statsWidget = (
    <div key="stats" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> สถิติผู้เข้าชม
      </div>
      <ul className="divide-y divide-gray-100">
        {[
          { label: 'ผู้ใช้งานวันนี้', value: visitorStats.today, icon: '🟢' },
          { label: 'ผู้ใช้งานเมื่อวาน', value: visitorStats.yesterday, icon: '🌙' },
          { label: 'ผู้ใช้งานเดือนนี้', value: visitorStats.thisMonth, icon: '📅' },
          { label: 'ผู้ใช้งานปีนี้', value: visitorStats.thisYear, icon: '📆' },
          { label: 'ผู้ใช้ทั้งหมด', value: visitorStats.total, icon: '👥' },
        ].map((stat) => (
          <li key={stat.label} className="flex items-center justify-between px-3 py-2 text-xs">
            <span className="text-gray-600 flex items-center gap-1.5"><span>{stat.icon}</span>{stat.label}</span>
            <span className="font-bold text-primary">{stat.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const documentsWidget = (
    <div key="documents" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" /> เอกสารล่าสุด
      </div>
      <div className="divide-y divide-gray-100">
        {documents.map((doc) => (
          <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
            <span className="text-sm flex-shrink-0">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{doc.title}</p>
              {doc.category && <p className="text-[10px] text-gray-500">{doc.category}</p>}
            </div>
          </a>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-gray-100">
        <Link to="/documents" className="text-xs text-primary hover:underline flex items-center gap-1">
          ดูเอกสารทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  const widgetMap: Record<string, JSX.Element | null> = {
    categories: categoriesWidget,
    gallery: galleryWidget,
    services: servicesWidget,
    social: socialWidget,
    stats: statsWidget,
    documents: documentsWidget,
    waste_bank: <WasteBankWidget key="waste_bank" />,
    savings_bank: <SavingsBankWidget key="savings_bank" />,
  };

  return widgetMap;
};
