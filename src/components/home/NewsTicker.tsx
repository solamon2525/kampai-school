import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const NewsTicker = () => {
  const [headlines, setHeadlines] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('news')
      .select('title')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHeadlines(data.map((n: any) => n.title));
        }
      });
  }, []);

  if (headlines.length === 0) return null;

  const tickerText = headlines.join('   ★   ') + '   ★   ';

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 flex items-center overflow-hidden">
      {/* Badge */}
      <div className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-3 py-2 flex items-center gap-1.5 z-10">
        <span className="animate-pulse w-1.5 h-1.5 bg-white rounded-full inline-block" />
        ข่าวด่วน
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="whitespace-nowrap text-sm text-gray-700 py-2 px-4 animate-marquee inline-block"
          style={{
            animation: 'marquee 30s linear infinite',
          }}
        >
          {tickerText}{tickerText}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
