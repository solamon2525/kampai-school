-- ============================================================================
-- Migration 044: Auto-tag waste_transactions ด้วย active term บน INSERT
-- ============================================================================
-- ปัญหา: หลัง migration 042 view waste_student_summary filter ตาม
-- academic_year + semester แต่ INSERT ใหม่ไม่ได้ส่งฟิลด์เหล่านี้
-- → row ใหม่มี NULL → ไม่ผ่าน filter → summary ไม่อัพเดทหลังบันทึก
--
-- แก้ด้วย BEFORE INSERT trigger: ถ้า caller ส่ง NULL → เติมจาก active_term()
-- อัตโนมัติ (caller ที่ส่งค่ามาเองยังคงเคารพ — สำหรับ backfill หรือ test)
--
-- ใช้ defense-in-depth: caller ไม่ต้องจำว่าต้อง tag เทอม — DB จัดให้
-- ============================================================================

CREATE OR REPLACE FUNCTION public.waste_txn_set_active_term()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_sem  TEXT;
BEGIN
  IF NEW.academic_year IS NULL OR NEW.semester IS NULL THEN
    SELECT year, sem INTO v_year, v_sem FROM active_term();
    IF NEW.academic_year IS NULL THEN NEW.academic_year := v_year; END IF;
    IF NEW.semester IS NULL THEN NEW.semester := v_sem; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waste_txn_set_active_term_trg ON public.waste_transactions;
CREATE TRIGGER waste_txn_set_active_term_trg
  BEFORE INSERT ON public.waste_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.waste_txn_set_active_term();
