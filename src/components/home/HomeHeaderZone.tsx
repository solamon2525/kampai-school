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

    if (blockOrder.length === 0) return null;

    return (
        <div>
            {blockOrder.map((key) => blockMap[key] ?? null)}
        </div>
    );
};

export default HomeHeaderZone;
