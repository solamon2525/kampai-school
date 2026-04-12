import { useAuth, type UserRole } from '@/contexts/AuthProvider';

interface UseUserRoleResult {
    role: UserRole;
    isAdmin: boolean;
    isTeacher: boolean;
    loading: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
    const { role, isAdmin, isTeacher, loading } = useAuth();
    return { role, isAdmin, isTeacher, loading };
};

export type { UserRole };
