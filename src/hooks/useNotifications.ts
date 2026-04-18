import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'admission' | 'message' | 'leave' | 'general';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    link: string | null;
    read_at: string | null;
    created_at: string;
}

const QUERY_KEY = ['notifications'] as const;

export const useNotifications = (limit = 20) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [...QUERY_KEY, limit],
        queryFn: async (): Promise<Notification[]> => {
            const { data, error } = await supabase
                .from('notifications' as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return (data ?? []) as unknown as Notification[];
        },
        staleTime: 30_000,
    });

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => {
                    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const markRead = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ read_at: new Date().toISOString() } as any)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ read_at: new Date().toISOString() } as any)
                .is('read_at', null);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });

    const unreadCount = (query.data ?? []).filter((n) => !n.read_at).length;

    return {
        notifications: query.data ?? [],
        unreadCount,
        loading: query.isLoading,
        markRead: markRead.mutate,
        markAllRead: markAllRead.mutate,
    };
};
