/**
 * quickMenu.service.ts
 * Shared "เมนูลัด" — singleton row ในตาราง shared_quick_menu
 * - ครู/แอดมิน/viewer ทุกคนอ่านจาก row เดียวกัน (RLS อนุญาต SELECT ให้ทุก authenticated user)
 * - เฉพาะแอดมินเท่านั้นเขียนได้ (RLS public.is_admin())
 * - known_catalog_ids ใช้เทียบกับ catalog ปัจจุบัน — frontend auto-append เมนูใหม่
 *
 * แทน flow เดิมที่เก็บ pref ต่อแอดมินใน user_quick_menu_preferences ซึ่ง
 * ครูอ่านไม่ได้เพราะ RLS user_id = auth.uid() (incident: ครูเห็นแค่ 4 เมนู default)
 */
import { supabase } from '@/integrations/supabase/client';

export type QuickMenuContext = 'admin' | 'teacher';

export interface SharedQuickMenuRow {
  menu_item_ids: string[];
  known_catalog_ids: string[];
}

export const quickMenuService = {
  /** ดึง shared pins + known catalog */
  getShared: () =>
    supabase
      .from('shared_quick_menu' as never)
      .select('menu_item_ids, known_catalog_ids')
      .eq('id' as never, 1)
      .maybeSingle(),

  /** บันทึก — RLS อนุญาตเฉพาะ admin */
  saveShared: (userId: string, menuItemIds: string[], knownCatalogIds: string[]) =>
    supabase.from('shared_quick_menu' as never).upsert(
      {
        id: 1,
        menu_item_ids: menuItemIds,
        known_catalog_ids: knownCatalogIds,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'id' },
    ),
};
