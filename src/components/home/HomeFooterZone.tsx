import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Link } from 'react-router-dom';
import {
    Facebook, Youtube, Instagram, Mail, Phone, MapPin, MessageCircle,
    Link as LinkIcon, ChevronUp,
} from 'lucide-react';

interface FooterZoneProps {
    blockOrder: string[];
}

const quickLinks = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'เกี่ยวกับเรา', href: '/about' },
    { name: 'หลักสูตร', href: '/curriculum' },
    { name: 'ข่าวสาร', href: '/news' },
    { name: 'ติดต่อเรา', href: '/contact' },
];

const getSocialIcon = (platform: string) => {
    switch (platform) {
        case 'facebook': return Facebook;
        case 'youtube': return Youtube;
        case 'instagram': return Instagram;
        case 'line': return MessageCircle;
        default: return LinkIcon;
    }
};

const HomeFooterZone = ({ blockOrder }: FooterZoneProps) => {
    const { settings } = useSchoolSettings();

    const resources = [
        { name: settings.footer_service_1_name, href: settings.footer_service_1_url },
        { name: settings.footer_service_2_name, href: settings.footer_service_2_url },
        { name: settings.footer_service_3_name, href: settings.footer_service_3_url },
        { name: settings.footer_service_4_name, href: settings.footer_service_4_url },
    ].filter(link => link.name && link.href);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Block renderers
    const footerInfo = (
        <div key="footer_info" className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground font-bold text-base">คผ</span>
                </div>
                <div>
                    <h3 className="text-base font-bold">{settings.school_name}</h3>
                    <p className="text-xs text-primary-foreground/70">{settings.school_tagline}</p>
                </div>
            </div>
            <p className="text-sm text-primary-foreground/80 mb-3 leading-relaxed">
                {settings.school_description}
            </p>
        </div>
    );

    const footerLinks = (
        <div key="footer_links">
            <h4 className="text-sm font-bold mb-2">ลิงก์ด่วน</h4>
            <ul className="space-y-1.5 text-sm">
                {quickLinks.map((link) => (
                    <li key={link.name}>
                        <Link
                            to={link.href}
                            onClick={() => window.scrollTo(0, 0)}
                            className="text-primary-foreground/80 hover:text-accent transition-colors"
                        >
                            {link.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    const footerSocial = (
        <div key="footer_social">
            <div className="flex gap-3 flex-wrap">
                {settings.social_links && settings.social_links.length > 0 ? (
                    settings.social_links.map((link, index) => {
                        const Icon = getSocialIcon(link.platform);
                        return (
                            <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                                aria-label={link.platform}
                            >
                                <Icon className="w-5 h-5" />
                            </a>
                        );
                    })
                ) : null}
            </div>
        </div>
    );

    const footerContact = (
        <div key="footer_contact">
            <h4 className="text-sm font-bold mb-2">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm">
                {settings.contact_address && (
                    <li className="flex gap-3">
                        <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-primary-foreground/80">{settings.contact_address}</span>
                    </li>
                )}
                {settings.contact_phone && (
                    <li className="flex gap-3">
                        <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                        <span className="text-primary-foreground/80">{settings.contact_phone}</span>
                    </li>
                )}
                {settings.contact_email && (
                    <li className="flex gap-3">
                        <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                        <span className="text-primary-foreground/80">{settings.contact_email}</span>
                    </li>
                )}
            </ul>
        </div>
    );

    const footerServices = (
        <div key="footer_services">
            <h4 className="text-sm font-bold mb-2">บริการออนไลน์</h4>
            <ul className="space-y-1.5 text-sm">
                {resources.map((link) => (
                    <li key={link.name}>
                        <a
                            href={link.href}
                            className="text-primary-foreground/80 hover:text-accent transition-colors"
                        >
                            {link.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );

    const blockMap: Record<string, JSX.Element | null> = {
        footer_info: footerInfo,
        footer_links: footerLinks,
        footer_social: footerSocial,
        footer_contact: footerContact,
        footer_services: footerServices,
    };

    if (blockOrder.length === 0) return null;

    return (
        <footer>
            <div className="max-w-7xl mx-auto bg-primary text-primary-foreground overflow-hidden w-full">
                {/* Main Footer */}
                <div className="px-4 sm:px-6 lg:px-8 py-5">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {blockOrder.map((key) => blockMap[key] ?? null)}
                    </div>
                </div>

                {/* Bottom Bar — always shown */}
                <div className="border-t border-primary-foreground/10">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-primary-foreground/60 text-center md:text-left">
                            © {new Date().getFullYear()} {settings.school_name}. สงวนลิขสิทธิ์.
                        </p>
                        <button
                            onClick={scrollToTop}
                            className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-accent transition-colors"
                        >
                            กลับด้านบน
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooterZone;
