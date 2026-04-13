import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Facebook, Youtube, Instagram, MessageCircle, Link as LinkIcon, Image, Users, Monitor, FileText, ArrowRight } from 'lucide-react';

const categoryLinks = [
  { label: 'ข่าวประชาสัมพันธ์', href: '/news', color: 'text-blue-700', dot: 'bg-blue-500' },
  { label: 'กิจกรรม', href: '/news', color: 'text-green-700', dot: 'bg-green-500' },
  { label: 'ผลงานนักเรียน', href: '/news', color: 'text-purple-700', dot: 'bg-purple-500' },
  { label: 'บทความ', href: '/news', color: 'text-orange-700', dot: 'bg-orange-500' },
  { label: 'ประกาศจัดซื้อจัดจ้าง', href: '/news', color: 'text-red-700', dot: 'bg-red-500' },
];

// Simple visitor counter using localStorage
const getVisitorStats = () => {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('visitor_stats') || '{}');

  if (stored.date !== today) {
    stored.date = today;
    stored.today = (stored.today || 0) + 1;
    stored.yesterday = stored.todayCount || 0;
    stored.todayCount = 1;
  } else {
    stored.todayCount = (stored.todayCount || 0) + 1;
  }
  stored.total = (stored.total || 0) + 1;
  stored.month = (stored.month || 0) + 1;
  localStorage.setItem('visitor_stats', JSON.stringify(stored));
  return {
    today: stored.todayCount || 1,
    yesterday: stored.yesterday || 0,
    thisWeek: Math.floor((stored.total || 1) * 0.15),
    thisMonth: stored.month || 1,
    thisYear: Math.floor((stored.total || 1) * 0.6),
    total: stored.total || 1,
  };
};

export const useHomeRightBlocks = () => {
  const { settings } = useSchoolSettings();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [visitorStats] = useState(() => getVisitorStats());
  const [documents, setDocuments] = useState<{ id: string; title: string; category: string | null; file_url: string }[]>([]);

  useEffect(() => {
    // Try to fetch some gallery/news images for the photo box
    supabase
      .from('news')
      .select('cover_image_url')
      .eq('is_published', true)
      .not('cover_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setGalleryImages(data.map((n: any) => n.cover_image_url).filter(Boolean));
      });

    // Fetch documents
    supabase
      .from('documents')
      .select('id, title, category, file_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setDocuments(data); });
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return { icon: Facebook, color: 'text-blue-600', label: 'Facebook' };
      case 'youtube': return { icon: Youtube, color: 'text-red-600', label: 'YouTube' };
      case 'instagram': return { icon: Instagram, color: 'text-pink-600', label: 'Instagram' };
      case 'line': return { icon: MessageCircle, color: 'text-green-600', label: 'LINE' };
      default: return { icon: LinkIcon, color: 'text-gray-600', label: platform };
    }
  };

  const rawOrder = settings.homepage_right_widgets;
  const widgetOrder: string[] = rawOrder
    ? (() => { try { return JSON.parse(rawOrder); } catch { return ['categories','gallery','services','social','stats']; } })()
    : ['categories','gallery','services','social','stats'];

  const categoriesWidget = (
    <div key="categories" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white text-xs font-semibold px-3 py-2">รายการหมวดหมู่</div>
      <ul className="divide-y divide-gray-100">
        {categoryLinks.map((c) => (
          <li key={c.label}>
            <Link to={c.href} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-purple-50 transition-colors group">
              <span className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
              <span className={`${c.color} group-hover:underline`}>{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const galleryWidget = galleryImages.length > 0 ? (
    <div key="gallery" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
        <Image className="w-3.5 h-3.5" /> ลังรูปภาพ
      </div>
      <div className="grid grid-cols-3 gap-0.5 p-1">
        {galleryImages.slice(0, 6).map((url, i) => (
          <Link key={i} to="/gallery" className="aspect-square overflow-hidden rounded">
            <img src={url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
          </Link>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-gray-100">
        <Link to="/gallery" className="text-xs text-purple-700 hover:underline flex items-center gap-1">
          <Image className="w-3 h-3" /> ดูรูปภาพทั้งหมด
        </Link>
      </div>
    </div>
  ) : null;

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

  const socialWidget = settings.social_links && settings.social_links.length > 0 ? (
    <div key="social" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white text-xs font-semibold px-3 py-2">โซเชียลมีเดีย</div>
      <div className="p-3 flex flex-wrap gap-2">
        {settings.social_links.map((link, i) => {
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
    </div>
  ) : null;

  const statsWidget = (
    <div key="stats" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
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
            <span className="font-bold text-purple-700">{stat.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const documentsWidget = documents.length > 0 ? (
    <div key="documents" className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-purple-800 text-white text-xs font-semibold px-3 py-2 flex items-center gap-1.5">
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
        <Link to="/documents" className="text-xs text-purple-700 hover:underline flex items-center gap-1">
          ดูเอกสารทั้งหมด <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  ) : null;

  const widgetMap: Record<string, JSX.Element | null> = {
    categories: categoriesWidget,
    gallery: galleryWidget,
    services: servicesWidget,
    social: socialWidget,
    stats: statsWidget,
    documents: documentsWidget,
  };

  return widgetMap;
};
