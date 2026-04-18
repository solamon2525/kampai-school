import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

/**
 * Fetches staff_id / student_id linked to the current logged-in user via user_roles.
 */
export const useLinkedRecord = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['user-roles-link', user?.id],
        enabled: !!user?.id,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_roles' as any)
                .select('role, staff_id, student_id')
                .eq('user_id', user!.id)
                .maybeSingle();
            if (error) throw error;
            return data as { role: string; staff_id: string | null; student_id: string | null } | null;
        },
    });
};
