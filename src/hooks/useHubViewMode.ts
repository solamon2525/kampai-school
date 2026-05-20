/**
 * useHubViewMode.ts
 *
 * Persist user's preferred layout for the `/educational-hub` teacher list page:
 * - viewMode: grid / list / compact / featured
 * - columns: 3/4/5/6 (only used when viewMode is 'grid' or 'featured')
 * - sort: default (admin order) / popular / alpha / newest
 *
 * Stored in localStorage `kampai_edu_hub_layout` as a single JSON blob.
 */

import { useCallback, useEffect, useState } from 'react';

export type HubViewMode = 'grid' | 'list' | 'compact' | 'featured';
export type HubColumns = 3 | 4 | 5 | 6;
export type HubSort = 'default' | 'popular' | 'alpha' | 'newest';

export interface HubLayoutState {
    viewMode: HubViewMode;
    columns: HubColumns;
    sort: HubSort;
}

const STORAGE_KEY = 'kampai_edu_hub_layout';

const DEFAULT_STATE: HubLayoutState = {
    viewMode: 'grid',
    columns: 4,
    sort: 'default',
};

const VALID_VIEW: HubViewMode[] = ['grid', 'list', 'compact', 'featured'];
const VALID_COLS: HubColumns[] = [3, 4, 5, 6];
const VALID_SORT: HubSort[] = ['default', 'popular', 'alpha', 'newest'];

const readStorage = (): HubLayoutState => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_STATE;
        const parsed = JSON.parse(raw) as Partial<HubLayoutState>;
        return {
            viewMode: (VALID_VIEW as string[]).includes(parsed.viewMode as string)
                ? (parsed.viewMode as HubViewMode)
                : DEFAULT_STATE.viewMode,
            columns: (VALID_COLS as number[]).includes(parsed.columns as number)
                ? (parsed.columns as HubColumns)
                : DEFAULT_STATE.columns,
            sort: (VALID_SORT as string[]).includes(parsed.sort as string)
                ? (parsed.sort as HubSort)
                : DEFAULT_STATE.sort,
        };
    } catch {
        return DEFAULT_STATE;
    }
};

const writeStorage = (state: HubLayoutState) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* ignore quota / privacy errors */
    }
};

export const useHubViewMode = () => {
    const [state, setState] = useState<HubLayoutState>(() => readStorage());

    // Sync across tabs
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setState(readStorage());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const update = useCallback((patch: Partial<HubLayoutState>) => {
        setState((prev) => {
            const next = { ...prev, ...patch };
            writeStorage(next);
            return next;
        });
    }, []);

    return {
        ...state,
        setViewMode: (v: HubViewMode) => update({ viewMode: v }),
        setColumns: (c: HubColumns) => update({ columns: c }),
        setSort: (s: HubSort) => update({ sort: s }),
    };
};
