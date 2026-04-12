import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'teacher' | 'viewer' | null;

interface UseUserRoleResult {
    role: UserRole;
    isAdmin: boolean;
    isTeacher: boolean;
    loading: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setLoading(false); return; }

            const { data } = await supabase
                .from('user_roles' as any)
                .select('role')
                .eq('user_id', session.user.id)
                .single();

            setRole((data as any)?.role ?? 'admin'); // Default to admin if no role set (backwards-compat)
            setLoading(false);
        };

        fetchRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchRole();
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        role,
        isAdmin: role === 'admin',
        isTeacher: role === 'teacher',
        loading,
    };
};
