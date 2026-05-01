import { Phone, Mail, Facebook } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Link } from 'react-router-dom';

const HomeTopBar = () => {
  const { settings } = useSchoolSettings();

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo + School Name */}
          <Link to="/" className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {settings.school_logo_url ? (
                <img src={settings.school_logo_url} alt={settings.school_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-yellow-300">คผ</span>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{settings.school_name}</h1>
            </div>
          </Link>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            {settings.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                <Phone className="w-3.5 h-3.5 text-green-300" />
                <span>{settings.contact_phone}</span>
              </a>
            )}
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                <span>{settings.contact_email}</span>
              </a>
            )}
            {settings.social_links && settings.social_links.find(l => l.platform === 'facebook') && (
              <a
                href={settings.social_links.find(l => l.platform === 'facebook')!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTopBar;
