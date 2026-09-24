/**
 * Teacher cloud favorites for hub items ("ใช้ในคาบนี้").
 * Stored on educational_hub_profiles.lesson_favorites (jsonb string[]).
 */
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationalHubService, type EduHubProfile } from '@/services/educational-hub.service';

function asIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export function useTeacherLessonFavorites(staffId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['teacher-lesson-favorites', staffId ?? ''] as const;

  const { data: favorites = [], isLoading } = useQuery({
    queryKey,
    enabled: Boolean(staffId),
    queryFn: async () => {
      const { data, error } = await educationalHubService.getProfile(staffId!);
      if (error) throw error;
      const profile = data as (EduHubProfile & { lesson_favorites?: unknown }) | null;
      return asIdList(profile?.lesson_favorites);
    },
  });

  const mutation = useMutation({
    mutationFn: async (next: string[]) => {
      const { data: existing } = await educationalHubService.getProfile(staffId!);
      const base = (existing ?? { staff_id: staffId!, is_hub_active: true }) as EduHubProfile;
      const payload = {
        ...base,
        staff_id: staffId!,
        lesson_favorites: next,
      } as EduHubProfile & { lesson_favorites: string[] };
      const { error } = await educationalHubService.upsertProfile(payload as EduHubProfile);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKey, next);
      queryClient.invalidateQueries({ queryKey: ['edu-hub-profile', staffId] });
    },
  });

  const isFavorite = useCallback(
    (itemId: string) => favorites.includes(itemId),
    [favorites],
  );

  const toggle = useCallback(
    (itemId: string) => {
      const next = favorites.includes(itemId)
        ? favorites.filter((id) => id !== itemId)
        : [...favorites, itemId];
      mutation.mutate(next);
    },
    [favorites, mutation],
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggle,
    isSaving: mutation.isPending,
  };
}
