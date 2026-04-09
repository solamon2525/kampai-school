import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Newspaper, Download, MessageSquare, Phone, BookOpen, Menu, X, ChevronDown } from 'lucide-react';

const navItems = [
  { label: 'หน้าหลัก', href: '/', icon: Home },
  { label: 'E-Services', href: '/waste-bank', icon: Layers },
  { label: 'ข่าวสาร', href: '/news', icon: Newspaper },
  { label: 'ดาวน์โหลด', href: '/documents', icon: Download },
  { label: 'กิจกรรม', href: '/calendar', icon: BookOpen },
  { label: 'ติดต่อเรา', href: '/contact', icon: Phone },
];

const HomeNavBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-purple-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  active
                    ? 'border-yellow-400 text-yellow-300 bg-white/10'
                    : 'border-transparent text-white/85 hover:text-yellow-300 hover:bg-white/10 hover:border-yellow-400/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center justify-between py-3">
          <span className="font-semibold text-yellow-300">เมนู</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-purple-900 border-t border-white/10 px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-white/85 hover:text-yellow-300 transition-colors border-b border-white/10"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default HomeNavBar;
