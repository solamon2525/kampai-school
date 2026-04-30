import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ปรับความเร็ว: ค่าสูง = ช้าลง (วินาทีต่อรอบ)
const DURATION = 30;

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
          setItems(data.map((n: any) => ({ id: n.id, title: n.title, link: '/news' })));
        } else {
          setItems(FALLBACK);
        }
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="relative w-full bg-primary flex items-center overflow-hidden select-none"
      style={{ height: '36px' }}
    >
      {/* Badge */}
      <div className="flex-shrink-0 bg-accent text-accent-foreground text-xs font-bold px-3 h-full flex items-center gap-1.5 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
        <span className="hidden sm:inline tracking-wide">ข่าวล่าสุด</span>
        <span className="sm:hidden">ข่าว</span>
      </div>

      {/* Scrolling area */}
      <div
        className="relative flex-1 overflow-hidden h-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade ซ้าย */}
        <div
          className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, hsl(var(--primary)), transparent)' }}
        />

        {/* ข่าว 5 รายการ — ไม่ซ้ำ วิ่งจากขวาออกซ้ายจบแล้ววนใหม่ */}
        <div
          className="absolute top-1/2 -translate-y-1/2 inline-flex items-center gap-0 whitespace-nowrap text-sm font-medium"
          style={{
            animation: `ticker-rtl ${DURATION}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            willChange: 'transform',
          }}
        >
          {items.map((item, i) => {
            const isFirst = i === 0;
            return (
              <span key={item.id} className="inline-flex items-center">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-primary-foreground hover:text-accent transition-colors duration-200 hover:underline underline-offset-2"
                >
                  {item.title}
                </a>
                {/* separator กว้างพิเศษหลังข่าวแรก */}
                <span
                  className={
                    isFirst
                      ? 'mx-10 text-accent opacity-75 text-sm'
                      : 'mx-6 text-primary-foreground/35 text-xs'
                  }
                >
                  {isFirst ? '◆◆' : '◆'}
                </span>
              </span>
            );
          })}
        </div>

        {/* Fade ขวา */}
        <div
          className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, hsl(var(--primary)), transparent)' }}
        />
      </div>

      <style>{`
        @keyframes ticker-rtl {
          from { transform: translateX(100vw); }
          to   { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
