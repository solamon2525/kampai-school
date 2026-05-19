/**
 * useFavorites.ts
 *
 * Track student-favorited educational-hub items in localStorage.
 * Anonymous (no auth) — favorites are per-device. Falls back gracefully
 * if localStorage is unavailable (SSR / privacy mode).
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kampai_edu_hub_favorites';

const readStorage = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []);
    } catch {
        return new Set();
    }
};

const writeStorage = (set: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
        /* ignore quota / privacy errors */
    }
};

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<Set<string>>(() => readStorage());

    // Sync across tabs/windows
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setFavorites(readStorage());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggle = useCallback((itemId: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            writeStorage(next);
            return next;
        });
    }, []);

    const isFavorite = useCallback((itemId: string) => favorites.has(itemId), [favorites]);

    return { favorites, toggle, isFavorite, count: favorites.size };
};
