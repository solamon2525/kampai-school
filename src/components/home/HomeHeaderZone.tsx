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
        top_banner: settings.hero_badge ? (
            <div key="top_banner" className="bg-accent text-accent-foreground px-4 py-2 text-center">
                <p className="text-sm font-medium">{settings.hero_badge}</p>
            </div>
        ) : null,
    };

    if (blockOrder.length === 0) return null;

    return (
        <div>
            {blockOrder.map((key) => blockMap[key] ?? null)}
        </div>
    );
};

export default HomeHeaderZone;
