import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'teacher' | 'viewer' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  loading: boolean;
  userEmail: string;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  role: null,
  isAdmin: false,
  isTeacher: false,
  loading: true,
  userEmail: '',
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', userId)
      .single();

    setRole((data as any)?.role ?? 'admin'); // Default to admin (backwards-compat)
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
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    loading,
    userEmail: session?.user?.email ?? '',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
