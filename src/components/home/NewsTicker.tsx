import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTickerItems } from '@/hooks/useTickerItems';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const FALLBACK_TITLES = [
  'ยินดีต้อนรับสู่โรงเรียนบ้านคำไผ่',
  'ประกาศรับสมัครนักเรียน ปีการศึกษา 2569',
  'กิจกรรมวันสำคัญประจำภาคเรียน',
  'ผลการแข่งขันทักษะทางวิชาการ ประจำปี 2568',
  'ประชาสัมพันธ์โครงการธนาคารขยะโรงเรียน',
];

const isExternal = (url: string) => /^https?:\/\//i.test(url);

const NewsTicker = () => {
  const { items: dbItems } = useTickerItems();
  const { settings } = useSchoolSettings();

  const duration = Math.max(5, parseInt(settings.ticker_speed_seconds || '30', 10) || 30);
  const gapPx = Math.max(8, parseInt(settings.ticker_gap_px || '60', 10) || 60);
  const pauseOnHover = (settings.ticker_pause_on_hover ?? 'true') !== 'false';

  // Use DB items if any; otherwise fall back to static list
  const items =
    dbItems.length > 0
      ? dbItems
      : FALLBACK_TITLES.map((title, i) => ({
          id: `f-${i}`,
          title,
          link: '/news' as string | null,
          source: 'news' as const,
        }));

  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setContainerW(Math.round(entries[0].contentRect.width));
    });
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  const ready = containerW > 0 && items.length > 0;

  if (items.length === 0) return null;

  return (
    <div
      className="relative w-full bg-primary flex items-center select-none"
      style={{ height: '36px' }}
    >
      {/* Scrolling area */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-hidden h-full"
        onMouseEnter={() => pauseOnHover && setPaused(true)}
        onMouseLeave={() => pauseOnHover && setPaused(false)}
      >
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, hsl(var(--primary)), transparent)' }}
        />

        {ready && (
          <div
            className="absolute inset-y-0 inline-flex items-center whitespace-nowrap text-sm font-medium"
            style={{
              animation: `ticker-rtl ${duration}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
              willChange: 'transform',
              gap: `${gapPx}px`,
            }}
          >
            {items.map((item) => {
              const linkClass =
                'whitespace-nowrap text-primary-foreground hover:text-accent transition-colors duration-200 hover:underline underline-offset-2';
              const content = (
                <span className="inline-flex items-center gap-2">
                  <span className="text-accent/70 text-xs">◆</span>
                  <span>{item.title}</span>
                </span>
              );

              if (!item.link) {
                return (
                  <span key={item.id} className={linkClass}>
                    {content}
                  </span>
                );
              }

              return isExternal(item.link) ? (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {content}
                </a>
              ) : (
                <Link key={item.id} to={item.link} className={linkClass}>
                  {content}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, hsl(var(--primary)), transparent)' }}
        />
      </div>

      {/* Badge */}
      <div className="flex-shrink-0 bg-accent text-accent-foreground text-xs font-bold px-3 h-full flex items-center gap-1.5 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
        <span className="hidden sm:inline tracking-wide">ข่าวล่าสุด</span>
        <span className="sm:hidden">ข่าว</span>
      </div>

      <style>{`
        @keyframes ticker-rtl {
          from { transform: translateX(${containerW}px); }
          to   { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
