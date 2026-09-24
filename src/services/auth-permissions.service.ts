import { supabase } from '@/integrations/supabase/client';

/** Both reads must succeed before any privileged UI is granted. */
export const authPermissionsService = {
  async get(userId: string, signal: AbortSignal) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    const timeout = setTimeout(cancel, 20_000);
    try {
      const [roleResult, menuResult] = await Promise.all([
        supabase.from('user_roles').select('role, staff_id, administrator_id')
          .eq('user_id', userId).abortSignal(controller.signal).single(),
        supabase.from('user_menu_permissions').select('menu_ids')
          .eq('user_id', userId).abortSignal(controller.signal).maybeSingle(),
      ]);
      if (roleResult.error) throw roleResult.error;
      if (menuResult.error) throw menuResult.error;
      const role = roleResult.data?.role;
      if (!role || !['admin', 'teacher', 'parent', 'viewer'].includes(role)) {
        throw new Error('No valid role assigned');
      }
      return { ...roleResult.data, allowedMenus: menuResult.data?.menu_ids ?? [] };
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
    }
  },
};
