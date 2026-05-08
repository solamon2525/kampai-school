import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'teacher' | 'viewer' | 'parent' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole;
  staffId: string | null;
  administratorId: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  loading: boolean;
  userEmail: string;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  role: null,
  staffId: null,
  administratorId: null,
  isAdmin: false,
  isTeacher: false,
  isParent: false,
  loading: true,
  userEmail: '',
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [administratorId, setAdministratorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles' as any)
        .select('role, staff_id, administrator_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Table might not exist — silently default to admin
        console.warn('user_roles query failed (table may not exist):', error.message);
        setRole('admin');
        setStaffId(null);
        setAdministratorId(null);
        return;
      }

      const row = data as any;
      setRole(row?.role ?? 'admin');
      setStaffId(row?.staff_id ?? null);
      setAdministratorId(row?.administrator_id ?? null);
    } catch {
      // Network or other error — default to admin
      setRole('admin');
      setStaffId(null);
      setAdministratorId(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchRole(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          fetchRole(s.user.id);
        } else {
          setRole(null);
          setStaffId(null);
          setAdministratorId(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    role,
    staffId,
    administratorId,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isParent: role === 'parent',
    loading,
    userEmail: session?.user?.email ?? '',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
