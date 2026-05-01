/**
 * แยก/ตรวจสอบ Google Maps embed URL จาก input ของผู้ใช้
 *
 * ผู้ใช้มักวางได้ 3 รูปแบบ:
 * 1) Embed URL ที่ถูกต้อง: https://www.google.com/maps/embed?pb=...
 * 2) iframe HTML ทั้งก้อน: <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>
 * 3) Share link: https://maps.app.goo.gl/... หรือ https://www.google.com/maps/place/...
 *    → Google บล็อกการ embed ใน iframe (X-Frame-Options) → ต้องเปิดในแท็บใหม่แทน
 */

export interface MapInput {
  /** URL ที่ embed ใน iframe ได้จริง (ถ้าไม่ใช่ embed URL จะเป็น null) */
  embedUrl: string | null;
  /** ลิงก์ดิบสำหรับเปิดใน Google Maps (ใช้ตอน fallback) */
  openUrl: string;
}

const EMBED_PREFIX = 'https://www.google.com/maps/embed';

export const isEmbedUrl = (url: string): boolean =>
  typeof url === 'string' && url.trim().startsWith(EMBED_PREFIX);

/** ดึง src="..." จากก้อน iframe HTML */
const extractIframeSrc = (html: string): string | null => {
  const m = html.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
};

export const parseMapInput = (raw: string): MapInput => {
  const value = (raw || '').trim();
  if (!value) return { embedUrl: null, openUrl: '' };

  // กรณีวาง iframe HTML — พยายามดึง src
  if (value.toLowerCase().startsWith('<iframe')) {
    const src = extractIframeSrc(value);
    if (src && isEmbedUrl(src)) return { embedUrl: src, openUrl: src };
    return { embedUrl: null, openUrl: src || value };
  }

  // กรณี URL embed ตรง ๆ
  if (isEmbedUrl(value)) return { embedUrl: value, openUrl: value };

  // กรณี share link / URL อื่น ๆ — embed ไม่ได้ ให้เปิดในแท็บใหม่แทน
  return { embedUrl: null, openUrl: value };
};
