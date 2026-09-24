import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { authPermissionsService } from '@/services/auth-permissions.service';
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
  authError: string | null;
  retryAuth: () => void;
  userEmail: string;
  allowedMenus: string[];
}

const AUTH_ERROR = 'ไม่สามารถโหลดสิทธิ์การใช้งานได้ กรุณาลองใหม่';
const AuthContext = createContext<AuthContextValue>({
  session: null, user: null, role: null, staffId: null, administratorId: null,
  isAdmin: false, isTeacher: false, isParent: false, loading: true,
  authError: null, retryAuth: () => {}, userEmail: '', allowedMenus: [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [identity, setIdentity] = useState<{ session: Session | null; ready: boolean; generation: number }>({
    session: null, ready: false, generation: 0,
  });
  const [sessionError, setSessionError] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const { session } = identity;
  const userId = session?.user.id;

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const acceptSession = (next: Session | null, revalidate = false) => {
      if (!active) return;
      setSessionError(false);
      setIdentity(previous => ({
        session: next, ready: true,
        generation: previous.generation + (revalidate || previous.session?.user.id !== next?.user.id ? 1 : 0),
      }));
    };
    // No Supabase requests inside the synchronous auth callback (auth lock).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      receivedEvent = true;
      acceptSession(next, ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event));
    });
    const failSession = () => {
      if (active && !receivedEvent) {
        setSessionError(true);
        setIdentity(previous => ({ ...previous, ready: true }));
      }
    };
    const timeout = window.setTimeout(failSession, 20_000);
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedEvent) return;
      if (error) throw error;
      acceptSession(data.session);
    }).catch(failSession).finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); subscription.unsubscribe(); };
  }, [sessionAttempt]);

  const permissions = useQuery({
    queryKey: ['auth-permissions', userId, identity.generation],
    enabled: identity.ready && !!userId && !sessionError,
    queryFn: ({ signal }) => authPermissionsService.get(userId!, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!userId) return;
    const refreshPermissions = () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-permissions', userId] });
    };
    const channel = supabase.channel(`user-permissions-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_menu_permissions', filter: `user_id=eq.${userId}` }, refreshPermissions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${userId}` }, refreshPermissions)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const loading = !identity.ready || (!sessionError && !!userId && (permissions.isPending || permissions.isFetching));
  const authError = sessionError || (!!userId && permissions.isError) ? AUTH_ERROR : null;
  // Stale cached data cannot grant access during refresh or after a failed read.
  const readyPermissions = !loading && !authError && userId ? permissions.data : undefined;
  const role: UserRole = readyPermissions?.role ?? null;
  const retryAuth = () => {
    if (sessionError || !identity.ready) {
      setSessionError(false);
      setIdentity(previous => ({ ...previous, ready: false }));
      setSessionAttempt(previous => previous + 1);
    } else {
      void permissions.refetch();
    }
  };
  return <AuthContext.Provider value={{
    session, user: session?.user ?? null, role,
    staffId: readyPermissions?.staff_id ?? null,
    administratorId: readyPermissions?.administrator_id ?? null,
    isAdmin: role === 'admin', isTeacher: role === 'teacher', isParent: role === 'parent',
    loading, authError, retryAuth, userEmail: session?.user.email ?? '',
    allowedMenus: readyPermissions?.allowedMenus ?? [],
  }}>{children}</AuthContext.Provider>;
};
