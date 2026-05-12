import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useMenuConfig } from '@/hooks/useMenuConfig';
import { resolveMenuIcon } from '@/lib/menuIcons';
import type { MenuItem } from '@/lib/menuDefaults';
import {
  ChevronDown, Menu, X, Phone, Mail, Facebook,
  Youtube, Instagram, MessageCircle, Link as LinkIcon, Globe,
} from 'lucide-react';

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
  const { config: menuConfig } = useMenuConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive top-level + children-by-parent maps from menu config
  const { topLevel, childrenByParent } = useMemo(() => {
    const top = menuConfig.items
      .filter((i) => i.parent === null)
      .sort((a, b) => a.order - b.order);
    const map = new Map<string, MenuItem[]>();
    menuConfig.items.forEach((i) => {
      if (i.parent) {
        const arr = map.get(i.parent) ?? [];
        arr.push(i);
        map.set(i.parent, arr);
      }
    });
    map.forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return { topLevel: top, childrenByParent: map };
  }, [menuConfig.items]);

  const navStyle = menuConfig.style;

  const logoClicks = useRef(0);
  const logoTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    logoClicks.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    logoTimer.current = setTimeout(() => { logoClicks.current = 0; }, 3000);
    if (logoClicks.current >= 3) {
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (href: string | null) =>
    !href ? false : href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const isParentActive = (parentId: string) => {
    const children = childrenByParent.get(parentId) ?? [];
    return children.some((c) => isActive(c.href));
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <div className="max-w-7xl mx-auto bg-primary text-primary-foreground overflow-hidden w-full">
        <div className="px-4 py-2.5">
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

      {/* ── Navigation Bar ── (driven by useMenuConfig) ── */}
      <nav
        className={`sticky top-0 z-50 transition-shadow max-w-7xl mx-auto w-full ${scrolled ? 'shadow-lg' : ''}`}
        style={{ backgroundColor: navStyle.navBg, color: navStyle.navText }}
      >
        <div className="px-4">
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center" ref={dropdownRef}>
            {topLevel.map((item) => {
              const Icon = resolveMenuIcon(item.icon);
              const children = childrenByParent.get(item.id) ?? [];
              const hasChildren = children.length > 0;
              const active = hasChildren ? isParentActive(item.id) : isActive(item.href);
              const isOpen = openDropdownId === item.id;

              const buttonStyle: React.CSSProperties = {
                color: active ? navStyle.navTextActive : navStyle.navText,
                backgroundColor: active ? navStyle.navBgActive : 'transparent',
                borderBottomColor: active ? navStyle.borderActive : 'transparent',
                fontWeight: navStyle.fontWeight as any,
                fontSize: navStyle.fontSize,
              };

              const navItemClass = 'flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap';

              if (hasChildren) {
                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(isOpen ? null : item.id)}
                      className={navItemClass}
                      style={buttonStyle}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-card rounded-xl shadow-xl border border-border py-1.5 z-50">
                        {children.map((c) => {
                          const ChildIcon = resolveMenuIcon(c.icon);
                          const childActive = isActive(c.href);
                          return c.href ? (
                            <Link
                              key={c.id}
                              to={c.href}
                              onClick={() => setOpenDropdownId(null)}
                              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                childActive
                                  ? 'text-primary bg-secondary font-semibold'
                                  : 'text-foreground hover:bg-secondary hover:text-primary'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 text-primary" />
                              {c.label}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return item.href ? (
                <Link
                  key={item.id}
                  to={item.href}
                  className={navItemClass}
                  style={buttonStyle}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ) : null;
            })}
          </div>

          {/* Mobile Header Row */}
          <div className="lg:hidden flex items-center justify-between py-2.5">
            <span className="text-sm font-semibold text-yellow-300">เมนูหลัก</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Toggle menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
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
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-card z-50 shadow-2xl flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer header */}
        <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between flex-shrink-0">
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

        {/* Menu items (driven by menu config) */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {topLevel.map((item, idx) => {
              const Icon = resolveMenuIcon(item.icon);
              const children = childrenByParent.get(item.id) ?? [];
              const hasChildren = children.length > 0;
              const isFirst = idx === 0;

              return (
                <div key={item.id}>
                  {hasChildren ? (
                    <>
                      {!isFirst && <div className="mx-4 my-2 border-t border-border" />}
                      <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </p>
                      {children.map((c) => {
                        const ChildIcon = resolveMenuIcon(c.icon);
                        const childActive = isActive(c.href);
                        return c.href ? (
                          <Link
                            key={c.id}
                            to={c.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                              childActive
                                ? 'border-primary bg-secondary text-primary font-semibold'
                                : 'border-transparent text-foreground hover:bg-muted hover:text-primary hover:border-border'
                            }`}
                          >
                            <ChildIcon className={`w-4 h-4 ${childActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            {c.label}
                          </Link>
                        ) : null;
                      })}
                    </>
                  ) : (
                    item.href && (
                      <Link
                        to={item.href}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                          isActive(item.href)
                            ? 'border-primary bg-secondary text-primary font-semibold'
                            : 'border-transparent text-foreground hover:bg-muted hover:text-primary hover:border-border'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`} />
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawer footer */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-muted space-y-2">
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
