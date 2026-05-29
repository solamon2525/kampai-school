import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facebookService } from '@/services/facebook.service';
import type { FacebookFeedConfigInsert } from '@/services/facebook.service';

export const FB_META_KEY = ['facebook-feed-meta'] as const;
export const FB_POSTS_KEY = (limit: number) => ['facebook-posts', limit] as const;
export const FB_CONFIG_KEY = ['facebook-feed-config'] as const;

export const useFacebookFeedMeta = () =>
  useQuery({
    queryKey: FB_META_KEY,
    queryFn: () => facebookService.getMeta(),
    staleTime: 5 * 60 * 1000,
  });

export const useFacebookPosts = (limit: number) =>
  useQuery({
    queryKey: FB_POSTS_KEY(limit),
    queryFn: () => facebookService.getRecentPosts(limit),
    staleTime: 5 * 60 * 1000,
  });

export const useFacebookConfig = (enabled = true) =>
  useQuery({
    queryKey: FB_CONFIG_KEY,
    queryFn: () => facebookService.getConfig(),
    enabled,
    staleTime: 60 * 1000,
  });

export const useSaveFacebookConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FacebookFeedConfigInsert) => facebookService.saveConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FB_CONFIG_KEY });
      qc.invalidateQueries({ queryKey: FB_META_KEY });
    },
  });
};

export const useRefreshFacebookFeed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => facebookService.triggerRefresh(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FB_CONFIG_KEY });
      qc.invalidateQueries({ queryKey: FB_META_KEY });
      qc.invalidateQueries({ queryKey: ['facebook-posts'] });
    },
  });
};
