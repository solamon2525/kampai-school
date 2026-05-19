import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import NewsTicker from './NewsTicker';

interface HeaderZoneProps {
    blockOrder: string[];
}

const HomeHeaderZone = ({ blockOrder }: HeaderZoneProps) => {
    const { settings } = useSchoolSettings();

    // Block map
    const blockMap: Record<string, JSX.Element | null> = {
        news_ticker: <NewsTicker key="news_ticker" />,
        top_banner: null,
    };

    // Render wrapper เสมอ — ไม่ early return เมื่อ blockOrder empty หรือ children เป็น null
    // เพื่อให้ layout vertical คงที่ตั้งแต่ first paint ป้องกัน layout shift
    return (
        <div className="max-w-7xl mx-auto w-full overflow-hidden">
            {blockOrder.map((key) => blockMap[key] ?? null)}
        </div>
    );
};

export default HomeHeaderZone;
