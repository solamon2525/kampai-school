import type { IFuseOptions } from 'fuse.js';

export type SearchResultType = 'student' | 'staff' | 'news' | 'document';

export interface SearchIndexItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  photoUrl?: string | null;
  path: string;
}

/** Fuse options tuned for short Thai names + multi-field weighting. */
export const fuseOptions: IFuseOptions<SearchIndexItem> = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'subtitle', weight: 0.3 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
  includeScore: true,
};
