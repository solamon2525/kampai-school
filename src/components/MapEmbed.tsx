import { ExternalLink, MapPin } from 'lucide-react';
import { parseMapInput } from '@/utils/mapUtils';

interface Props {
  /** URL หรือ iframe HTML ที่ผู้ใช้ใส่ไว้ใน Admin Settings */
  url: string | null | undefined;
  /** ใช้แทน iframe ถ้า url ว่าง — null = ซ่อนทั้ง section, undefined = แสดง placeholder default */
  emptyFallback?: React.ReactNode;
  /** title ของ iframe / aria-label */
  title?: string;
  className?: string;
}

/**
 * Embed Google Maps แบบกันพัง
 * - ถ้าเป็น embed URL หรือ iframe HTML → render iframe ตามปกติ
 * - ถ้าเป็น share link (maps.app.goo.gl, /maps/place/...) → Google บล็อก iframe
 *   จึงแสดงการ์ด "เปิดใน Google Maps" แทน
 */
export const MapEmbed = ({ url, emptyFallback, title = 'แผนที่', className = '' }: Props) => {
  const { embedUrl, openUrl } = parseMapInput(url || '');

  if (!url || !openUrl) {
    return <>{emptyFallback ?? (
      <div className="w-full h-full flex items-center justify-center bg-muted text-sm text-muted-foreground">
        กรุณาตั้งค่า Google Maps ใน Admin Settings
      </div>
    )}</>;
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className={`w-full h-full border-0 ${className}`}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  // Share link → fallback การ์ด
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-br from-muted to-muted/50">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <ExternalLink className="w-4 h-4" />
        เปิดใน Google Maps
      </a>
    </div>
  );
};
