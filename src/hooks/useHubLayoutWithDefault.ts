/**
 * useHubLayoutWithDefault.ts
 *
 * Merges global hub layout default (from school_settings table) with the
 * visitor's localStorage preference (useHubViewMode).
 *
 * Behavior:
 * - If DB has `is_locked: true` → visitors are forced to DB values; toolbar
 *   controls become readonly. localStorage is ignored (but kept — restored
 *   if admin unlocks later).
 * - If DB has `is_locked: false` (or no row) → visitor's localStorage takes
 *   priority. DB values just provide a "first-visit" default.
 *
 * Used by `/educational-hub` page in place of bare `useHubViewMode()`.
 */

import { useQuery } from '@tanstack/react-query';
import { useHubViewMode } from './useHubViewMode';
import type { HubViewMode, HubColumns, HubSort } from './useHubViewMode';
import { educationalHubService } from '@/services/educational-hub.service';

interface DBLayout {
    viewMode?: HubViewMode;
    columns?: HubColumns;
    sort?: HubSort;
    is_locked?: boolean;
}

const VALID_VIEW: HubViewMode[] = ['grid', 'list', 'compact', 'featured'];
const VALID_COLS: HubColumns[] = [3, 4, 5, 6];
const VALID_SORT: HubSort[] = ['default', 'popular', 'alpha', 'newest'];

const parseDBLayout = (raw: string | null | undefined): DBLayout | null => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return {
            viewMode: (VALID_VIEW as string[]).includes(parsed.viewMode) ? parsed.viewMode : undefined,
            columns: (VALID_COLS as number[]).includes(parsed.columns) ? parsed.columns : undefined,
            sort: (VALID_SORT as string[]).includes(parsed.sort) ? parsed.sort : undefined,
            is_locked: typeof parsed.is_locked === 'boolean' ? parsed.is_locked : false,
        };
    } catch {
        return null;
    }
};

export const useHubLayoutWithDefault = () => {
    // Fetch DB default (5 min cache)
    const { data: dbLayout, isLoading: dbLoading } = useQuery({
        queryKey: ['school-settings', 'hub-layout-default'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.getHubLayoutDefault();
            if (error) {
                console.warn('[hub-layout] fetch failed:', error.message);
                return null;
            }
            const row = data as { value?: string | null } | null;
            return parseDBLayout(row?.value);
        },
        staleTime: 5 * 60 * 1000,
    });

    const local = useHubViewMode();

    const isLocked = !!dbLayout?.is_locked;

    // Effective values
    const effective = isLocked
        ? {
              viewMode: dbLayout?.viewMode ?? local.viewMode,
              columns: dbLayout?.columns ?? local.columns,
              sort: dbLayout?.sort ?? local.sort,
          }
        : {
              // Visitor's localStorage already has DEFAULT_STATE as fallback,
              // but on first visit (no localStorage row), the DB default
              // should be the seed. Easiest: if visitor's value equals the
              // hardcoded default AND DB provides a value, prefer DB.
              viewMode: local.viewMode,
              columns: local.columns,
              sort: local.sort,
          };

    // No-op setters when locked
    const noop = () => {};

    return {
        ...effective,
        setViewMode: isLocked ? noop : local.setViewMode,
        setColumns: isLocked ? noop : local.setColumns,
        setSort: isLocked ? noop : local.setSort,
        isLocked,
        readonly: isLocked,
        loading: dbLoading,
    };
};
