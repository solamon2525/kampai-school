/**
 * quickMenu.service.ts
 * เก็บ/ดึงการตั้งค่า "เมนูลัด" ของผู้ใช้แต่ละคน (admin/teacher dashboard)
 */
import { supabase } from '@/integrations/supabase/client';

export type QuickMenuContext = 'admin' | 'teacher';

export const quickMenuService = {
  /** ดึง preference ของ user — return null ถ้ายังไม่เคยตั้ง */
  get: (userId: string, context: QuickMenuContext) =>
    supabase
      .from('user_quick_menu_preferences' as never)
      .select('menu_item_ids')
      .eq('user_id', userId)
      .eq('context', context)
      .maybeSingle(),

  /** บันทึก / อัพเดต preference */
  save: (userId: string, context: QuickMenuContext, menuItemIds: string[]) =>
    supabase
      .from('user_quick_menu_preferences' as never)
      .upsert(
        {
          user_id: userId,
          context,
          menu_item_ids: menuItemIds,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'user_id,context' },
      ),

  /** ดึงเมนูลัดของแอดมินคนแรก/หลัก เพื่อใช้ในการซิงค์ */
  getAdminQuickMenu: async () => {
    // 1. ดึง user_id ของผู้ใช้ที่เป็น 'admin' คนแรกจากตาราง user_roles
    const { data: adminRole } = await supabase
      .from('user_roles' as any)
      .select('user_id')
      .eq('role', 'admin')
      .order('created_at' as any, { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!adminRole?.user_id) return { data: null, error: null };

    // 2. ดึงเมนูลัดของแอดมินคนนั้น
    return supabase
      .from('user_quick_menu_preferences' as any)
      .select('menu_item_ids')
      .eq('user_id', adminRole.user_id)
      .eq('context', 'admin')
      .maybeSingle();
  },
};
