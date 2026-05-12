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
};
