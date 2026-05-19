/**
 * useViewMode.ts
 *
 * Persist user's preferred display mode for educational-hub items.
 * compact = list 1-line, grid = default 2-4 col grid, spotlight = 1 big card per row
 */

import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'compact' | 'grid' | 'spotlight';

const STORAGE_KEY = 'kampai_edu_hub_view_mode';
const DEFAULT: ViewMode = 'grid';

const ALL: ViewMode[] = ['compact', 'grid', 'spotlight'];

const readStorage = (): ViewMode => {
    if (typeof window === 'undefined') return DEFAULT;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw && (ALL as string[]).includes(raw)) return raw as ViewMode;
    } catch {
        /* ignore */
    }
    return DEFAULT;
};

export const useViewMode = () => {
    const [mode, setMode] = useState<ViewMode>(() => readStorage());

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setMode(readStorage());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const update = useCallback((next: ViewMode) => {
        setMode(next);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(STORAGE_KEY, next);
            } catch {
                /* ignore */
            }
        }
    }, []);

    return { mode, setMode: update };
};
