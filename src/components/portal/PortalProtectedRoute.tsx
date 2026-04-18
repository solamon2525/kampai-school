import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthProvider';

interface Props {
    children: ReactNode;
    allow: UserRole[]; // roles ที่เข้าได้
}

export const PortalProtectedRoute = ({ children, allow }: Props) => {
    const { session, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) return <Navigate to="/admin" replace />;
    if (!allow.includes(role)) return <Navigate to="/admin" replace />;

    return <>{children}</>;
};
