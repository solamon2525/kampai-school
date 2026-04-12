import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getOrCreateSessionId(): string {
    const key = 'pv_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem(key, id);
    }
    return id;
}

export const usePageView = () => {
    const location = useLocation();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        const path = location.pathname;
        // Skip admin pages and avoid duplicate tracking
        if (path.startsWith('/admin') || path === lastPath.current) return;
        lastPath.current = path;

        const sessionId = getOrCreateSessionId();
        supabase.from('page_views').insert({
            page_path: path,
            session_id: sessionId,
            referrer: document.referrer || null,
        } as any).then(() => {});
    }, [location.pathname]);
};
