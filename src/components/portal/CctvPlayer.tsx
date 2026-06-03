import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** HLS (.m3u8) URL ของกล้อง */
  src: string;
  className?: string;
}

/**
 * เล่นสตรีม HLS (.m3u8) จาก relay ของกล้อง
 * - เบราว์เซอร์ทั่วไป → ใช้ hls.js
 * - Safari/iOS รองรับ HLS native → ใช้ <video> ตรง ๆ
 */
export const CctvPlayer = ({ src, className }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setStatus('loading');
    let hls: Hls | null = null;

    const onPlaying = () => setStatus('playing');
    video.addEventListener('playing', onPlaying);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS — native HLS
      video.src = src;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setStatus('error');
      });
    } else {
      setStatus('error');
    }

    return () => {
      video.removeEventListener('playing', onPlaying);
      if (hls) hls.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return (
    <div className={cn('relative w-full aspect-video bg-foreground/90 rounded-lg overflow-hidden', className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted
        autoPlay
        playsInline
        controls
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-background/80 pointer-events-none">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">กำลังเชื่อมต่อกล้อง...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-background/80">
          <VideoOff className="w-7 h-7" />
          <span className="text-xs">เชื่อมต่อกล้องไม่ได้</span>
          <span className="text-[10px] opacity-70">ตรวจสอบว่า relay เปิดอยู่และ URL ถูกต้อง</span>
        </div>
      )}
    </div>
  );
};
