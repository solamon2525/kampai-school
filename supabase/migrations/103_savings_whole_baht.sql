-- ============================================================================
-- Migration 103: ธนาคารพอเพียง — บังคับฝาก/ถอนเป็นจำนวนเต็มบาท
-- ============================================================================
-- กัน mouse-wheel footgun: <input type="number" step="0.01"> ถูก scroll ลด
-- ค่าทีละ 0.01 เงียบ ๆ (เคสจริง ฝาก 20 → ลงเป็น 19.98). app-layer บังคับ
-- parseInt + Number.isInteger แล้ว — CHECK นี้เป็น defense-in-depth ที่ DB.
-- คง column เป็น DECIMAL(10,2) ตามเดิม (ไม่เปลี่ยน type).
-- ============================================================================

ALTER TABLE public.savings_transactions
  ADD CONSTRAINT savings_amount_whole_baht CHECK (amount = trunc(amount));
