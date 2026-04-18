import { useAuth, type UserRole } from '@/contexts/AuthProvider';

interface UseUserRoleResult {
    role: UserRole;
    isAdmin: boolean;
    isTeacher: boolean;
    isParent: boolean;
    loading: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
    const { role, isAdmin, isTeacher, isParent, loading } = useAuth();
    return { role, isAdmin, isTeacher, isParent, loading };
};

export type { UserRole };
