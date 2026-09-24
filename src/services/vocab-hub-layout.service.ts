import { supabase } from '@/integrations/supabase/client';
import { isOrderPayload, normalizeOrder } from '../../public/games/english/vocab-hub-order.mjs';

export const vocabHubLayoutKey = ['vocab-hub-category-order'] as const;
const settingKey = 'vocab_hub_category_order';

export const vocabHubLayoutService = {
  async read() {
    const { data, error } = await supabase.from('school_settings')
      .select('value').eq('key', settingKey).maybeSingle();
    if (error) throw error;
    return normalizeOrder(data?.value ? JSON.parse(data.value) : null) as string[];
  },
  async save(order: string[]) {
    if (!isOrderPayload(order)) throw new Error('ลำดับหมวดหมู่ไม่ถูกต้อง');
    const { data, error } = await supabase.from('school_settings').upsert({
      key: settingKey, value: JSON.stringify(order), category: 'educational-hub',
      description: 'ลำดับกลางหมวดหมู่คำศัพท์ภาษาอังกฤษ',
    }, { onConflict: 'key' }).select('value').single();
    if (error) throw error;
    return normalizeOrder(JSON.parse(data.value!)) as string[];
  },
};
