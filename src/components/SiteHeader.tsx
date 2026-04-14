import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  Home, Info, Users, GraduationCap, BookOpen, Image, Calendar, Newspaper,
  Phone, FileText, Recycle, ChevronDown, Menu, X, Mail, Facebook,
  Youtube, Instagram, MessageCircle, Link as LinkIcon, Globe, LogIn,
  Layers, Download, UserCog,
} from 'lucide-react';

// ─── เมนูหลัก ───────────────────────────────────────────────
const mainNav = [
  { label: 'หน้าหลัก',   href: '/',            icon: Home },
  { label: 'เกี่ยวกับเรา', href: '/about',        icon: Info },
  { label: 'บุคลากร',    href: '/staff',        icon: Users },
  { label: 'นักเรียน',   href: '/students',     icon: GraduationCap },
  { label: 'หลักสูตร',   href: '/curriculum',   icon: BookOpen },
  { label: 'แกลเลอรี่',  href: '/gallery',      icon: Image },
  { label: 'ปฏิทิน',    href: '/calendar',     icon: Calendar },
  { label: 'ข่าวสาร',   href: '/news',         icon: Newspaper },
  { label: 'ติดต่อเรา',  href: '/contact',      icon: Phone },
];

// ─── Dropdown บริการ ────────────────────────────────────────
const serviceNav = [
  { label: 'ธนาคารขยะ',       href: '/waste-bank', icon: Recycle },
  { label: 'เอกสาร/แบบฟอร์ม', href: '/documents',  icon: FileText },
  { label: 'สมัครเรียน',      href: '/enrollment', icon: UserCog },
];

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':  return Facebook;
    case 'youtube':   return Youtube;
    case 'instagram': return Instagram;
    case 'line':      return MessageCircle;
    default:          return LinkIcon;
  }
};

// ─── Easter Egg: คลิก Logo 5 ครั้งใน 3 วิ → /admin ─────────
const SiteHeader = () => {
  const { settings } = useSchoolSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  const logoClicks = useRef(0);
  const logoTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    logoClicks.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    logoTimer.current = setTimeout(() => { logoClicks.current = 0; }, 3000);
    if (logoClicks.current >= 5) {
      logoClicks.current = 0;
      if (logoTimer.current) clearTimeout(logoTimer.current);
      e.preventDefault();
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node))
        setServicesOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const isServiceActive = serviceNav.some(s => location.pathname.startsWith(s.href));

  return (
    <>
      {/* ── Top Bar ── */}
      <div className="bg-gradient-to-r from-purple-950 via-primary to-purple-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Logo + Name */}
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3 group min-w-0">
              <div className="w-16 h-16 rounded-full border-2 border-yellow-400/60 bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all group-hover:border-yellow-400">
                {settings.school_logo_url ? (
                  <img src={settings.school_logo_url} alt={settings.school_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-yellow-300">คผ</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight group-hover:text-yellow-300 transition-colors truncate">
                  {settings.school_name}
                </h1>
                <p className="text-yellow-300/80 text-xs mt-0.5 truncate">{settings.school_tagline}</p>
              </div>
            </Link>

            {/* Contacts */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-full transition-colors">
                  <Phone className="w-3 h-3 text-green-300" />
                  <span>{settings.contact_phone}</span>
                </a>
              )}
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-full transition-colors">
                  <Mail className="w-3 h-3 text-blue-300" />
                  <span>{settings.contact_email}</span>
                </a>
              )}
              {settings.social_links?.map((link, i) => {
                const Icon = getSocialIcon(link.platform);
                const colors: Record<string, string> = {
                  facebook: 'bg-blue-600 hover:bg-blue-700',
                  youtube: 'bg-red-600 hover:bg-red-700',
                  line: 'bg-green-600 hover:bg-green-700',
                };
                return (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors text-white ${colors[link.platform] || 'bg-white/10 hover:bg-white/20'}`}>
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{link.platform}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Bar ── */}
      <nav className={`bg-purple-950 text-white sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-lg shadow-purple-950/50' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center">
            {mainNav.map((item) => (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive(item.href)
                    ? 'border-yellow-400 text-yellow-300 bg-white/10'
                    : 'border-transparent text-white/85 hover:text-yellow-300 hover:bg-white/10 hover:border-yellow-400/40'
                }`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ))}

            {/* Services Dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all ${
                  isServiceActive
                    ? 'border-yellow-400 text-yellow-300 bg-white/10'
                    : 'border-transparent text-white/85 hover:text-yellow-300 hover:bg-white/10 hover:border-yellow-400/40'
                }`}>
                <Layers className="w-3.5 h-3.5" />
                บริการ
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-purple-100 py-1.5 z-50">
                  {serviceNav.map((s) => (
                    <Link key={s.href} to={s.href}
                      onClick={() => setServicesOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        location.pathname.startsWith(s.href)
                          ? 'text-primary bg-purple-50 font-semibold'
                          : 'text-gray-700 hover:bg-purple-50 hover:text-primary'
                      }`}>
                      <s.icon className="w-4 h-4 text-primary" />
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Enroll CTA */}
            <div className="ml-auto">
              <Link to="/enrollment"
                className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-purple-950 font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                สมัครเรียน
              </Link>
            </div>
          </div>

          {/* Mobile Header Row */}
          <div className="lg:hidden flex items-center justify-between py-2.5">
            <span className="text-sm font-semibold text-yellow-300">เมนูหลัก</span>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer Panel */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer header */}
        <div className="bg-gradient-to-r from-purple-950 to-primary text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border border-yellow-400/50 bg-white/10 flex items-center justify-center overflow-hidden">
              {settings.school_logo_url
                ? <img src={settings.school_logo_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-yellow-300">คผ</span>}
            </div>
            <span className="text-sm font-bold text-white leading-tight">{settings.school_name}</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-bold text-purple-400 uppercase tracking-widest">เมนูหลัก</p>
            {mainNav.map((item) => (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                  isActive(item.href)
                    ? 'border-primary bg-purple-50 text-primary font-semibold'
                    : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-primary hover:border-purple-200'
                }`}>
                <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-primary' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            ))}

            <div className="mx-4 my-2 border-t border-gray-100" />
            <p className="px-4 py-2 text-xs font-bold text-purple-400 uppercase tracking-widest">บริการ</p>
            {serviceNav.map((item) => (
              <Link key={item.href} to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                  location.pathname.startsWith(item.href)
                    ? 'border-primary bg-purple-50 text-primary font-semibold'
                    : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-primary hover:border-purple-200'
                }`}>
                <item.icon className={`w-4 h-4 ${location.pathname.startsWith(item.href) ? 'text-primary' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Drawer footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50 space-y-2">
          <Link to="/enrollment"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-purple-800 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
            สมัครเรียน
          </Link>
          <div className="flex gap-2">
            {settings.contact_phone && (
              <a href={`tel:${settings.contact_phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs py-2 rounded-lg transition-colors">
                <Phone className="w-3.5 h-3.5" /> โทร
              </a>
            )}
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-2 rounded-lg transition-colors">
                <Mail className="w-3.5 h-3.5" /> อีเมล
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteHeader;
