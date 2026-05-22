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
  allowedMenus: string[];
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
  allowedMenus: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [administratorId, setAdministratorId] = useState<string | null>(null);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const [roleRes, menuRes] = await Promise.all([
        supabase
          .from('user_roles' as any)
          .select('role, staff_id, administrator_id')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_menu_permissions' as any)
          .select('menu_ids')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (roleRes.error) {
        // Table might not exist — silently default to admin
        console.warn('user_roles query failed (table may not exist):', roleRes.error.message);
        setRole('admin');
        setStaffId(null);
        setAdministratorId(null);
        setAllowedMenus([]);
        return;
      }

      const row = roleRes.data as any;
      setRole(row?.role ?? 'admin');
      setStaffId(row?.staff_id ?? null);
      setAdministratorId(row?.administrator_id ?? null);

      if (menuRes.data) {
        setAllowedMenus((menuRes.data as any).menu_ids || []);
      } else {
        setAllowedMenus([]);
      }
    } catch {
      // Network or other error — default to admin
      setRole('admin');
      setStaffId(null);
      setAdministratorId(null);
      setAllowedMenus([]);
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
          setAllowedMenus([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for instant permission & role propagation
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const channel = supabase
      .channel(`user-permissions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_menu_permissions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRole(userId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRole(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

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
    allowedMenus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
