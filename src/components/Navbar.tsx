import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Recycle, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const serviceLinks = [
  { name: 'ธนาคารขยะ', href: '/waste-bank', icon: Recycle },
  { name: 'สถิติธนาคารขยะ', href: '/waste-bank/stats', icon: BarChart3 },
  { name: 'เอกสาร/แบบฟอร์ม', href: '/documents', icon: FileText },
];

const navLinks = [
  { name: 'หน้าแรก', href: '/' },
  { name: 'เกี่ยวกับเรา', href: '/about' },
  { name: 'บุคลากร', href: '/staff' },
  { name: 'นักเรียน', href: '/students' },
  { name: 'หลักสูตร', href: '/curriculum' },
  { name: 'แกลเลอรี่', href: '/gallery' },
  { name: 'ปฏิทิน', href: '/calendar' },
  { name: 'ข่าวสาร', href: '/news' },
  { name: 'ติดต่อ', href: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { settings } = useSchoolSettings();

  const isServiceActive = serviceLinks.some(l => location.pathname === l.href);

  // ── Easter Egg: คลิก Logo 3 ครั้งภายใน 3 วินาที → Admin Login ──
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    // ถ้าคลิก Link ปกติ (ไม่ใช่ Easter Egg) ให้ผ่านไป
    logoClickCount.current += 1;

    // รีเซ็ต timer ทุกครั้งที่คลิก
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    logoClickTimer.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 3000);

    if (logoClickCount.current >= 3) {
      logoClickCount.current = 0;
      if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
      e.preventDefault();
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHomePage
        ? 'bg-card/95 backdrop-blur-md shadow-lg'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          {/* Logo — คลิก 3 ครั้งภายใน 3 วินาทีเพื่อเข้า Admin */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0">
              {settings.school_logo_url ? (
                <img src={settings.school_logo_url} alt={settings.school_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-accent font-bold text-xl">คผ</span>
              )}
            </div>
            <div>
              <h1 className={`text-sm sm:text-lg font-bold leading-tight transition-colors ${scrolled || !isHomePage ? 'text-primary' : 'text-card'}`}>
                {settings.school_name}
              </h1>
              <p className={`text-xs transition-colors hidden sm:block ${scrolled || !isHomePage ? 'text-muted-foreground' : 'text-card/80'}`}>
                {settings.school_tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-accent/20 ${location.pathname === link.href
                  ? 'bg-primary text-primary-foreground shadow-md font-bold'
                  : scrolled || !isHomePage
                    ? 'text-foreground hover:text-primary'
                    : 'text-card hover:text-accent'
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Dropdown บริการ */}
            <div className="relative" ref={servicesRef}>
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-accent/20 ${isServiceActive
                  ? 'bg-primary text-primary-foreground shadow-md font-bold'
                  : scrolled || !isHomePage
                    ? 'text-foreground hover:text-primary'
                    : 'text-card hover:text-accent'
                  }`}
              >
                บริการ
                <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                  {serviceLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setServicesOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary ${location.pathname === link.href ? 'text-primary' : 'text-foreground'}`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link to="/enrollment">
              <Button className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all">
                สมัครเรียน
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled || !isHomePage ? 'text-foreground' : 'text-card'
              }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[700px] pb-4' : 'max-h-0'
            }`}
        >
          <div className="bg-card rounded-xl shadow-lg p-4 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-border my-2 pt-2">
              <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">บริการ</p>
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === link.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                    }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}
            </div>
            <Link to="/enrollment" onClick={() => setIsOpen(false)}>
              <Button className="w-full mt-2 bg-accent text-accent-foreground font-semibold hover:bg-accent/90">
                สมัครเรียน
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
