import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ปรับความเร็ว: ค่าสูง = ช้าลง (วินาทีต่อรอบ)
const DURATION = 42;

interface TickerItem {
  id: string;
  title: string;
  link: string;
}

const FALLBACK: TickerItem[] = [
  { id: '1', title: 'ยินดีต้อนรับสู่โรงเรียนบ้านคำไผ่', link: '/news' },
  { id: '2', title: 'ประกาศรับสมัครนักเรียน ปีการศึกษา 2569', link: '/news' },
  { id: '3', title: 'กิจกรรมวันสำคัญประจำภาคเรียน', link: '/news' },
  { id: '4', title: 'ผลการแข่งขันทักษะทางวิชาการ ประจำปี 2568', link: '/news' },
  { id: '5', title: 'ประชาสัมพันธ์โครงการธนาคารขยะโรงเรียน', link: '/news' },
];

const NewsTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    supabase
      .from('news')
      .select('id, title')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(
            data.map((n: any) => ({
              id: n.id,
              title: n.title,
              link: '/news',
            }))
          );
        } else {
          setItems(FALLBACK);
        }
      });
  }, []);

  if (items.length === 0) return null;

  // render ข่าวทั้งหมด 1 รอบ — ข่าวแรก (i=0) มี separator กว้างพิเศษ
  const renderItems = (loopKey: number) =>
    items.map((item, i) => {
      const isFirst = i === 0;
      return (
        <span key={`${loopKey}-${item.id}`} className="inline-flex items-center">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-primary-foreground hover:text-accent transition-colors duration-200 underline-offset-2 hover:underline"
          >
            {item.title}
          </a>
          {/* separator กว้างกว่าหลังข่าวแรก เพื่อเน้นความสำคัญ */}
          <span
            className={
              isFirst
                ? 'mx-12 text-accent opacity-80 text-base'
                : 'mx-7 text-primary-foreground/40 text-xs'
            }
          >
            {isFirst ? '◆◆' : '◆'}
          </span>
        </span>
      );
    });

  return (
    <div className="relative w-full bg-primary flex items-center overflow-hidden select-none"
      style={{ height: '36px' }}>

      {/* Badge */}
      <div className="flex-shrink-0 bg-accent text-accent-foreground text-xs font-bold px-3 h-full flex items-center gap-1.5 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
        <span className="hidden sm:inline tracking-wide">ข่าวล่าสุด</span>
        <span className="sm:hidden tracking-wide">ข่าว</span>
      </div>

      {/* Scrolling area */}
      <div
        className="relative flex-1 overflow-hidden h-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade ซ้าย */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, hsl(var(--primary)), transparent)' }}
        />

        {/* Content — ซ้ำ 2 รอบเพื่อ seamless loop */}
        <div
          className="inline-flex items-center h-full text-sm font-medium"
          style={{
            animation: `news-ticker-reverse ${DURATION}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            willChange: 'transform',
          }}
        >
          {renderItems(0)}
          {renderItems(1)}
        </div>

        {/* Fade ขวา */}
        <div
          className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, hsl(var(--primary)), transparent)' }}
        />
      </div>

      <style>{`
        @keyframes news-ticker-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
