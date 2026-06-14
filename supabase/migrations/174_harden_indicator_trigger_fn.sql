-- ============================================================================
-- Migration 174: Harden trigger function fn_game_session_to_indicator_events
-- ============================================================================
-- fn_game_session_to_indicator_events เป็น trigger function (ไม่มี args, อ้าง NEW)
-- ไม่ได้ตั้งใจให้ client เรียกตรง ๆ. ถอน EXECUTE จาก PUBLIC/anon/authenticated เพื่อ
-- ปิด security advisor (security_definer_function_executable) — trigger ยังทำงานปกติ
-- เพราะ PostgreSQL ไม่ตรวจ EXECUTE privilege ตอน fire trigger.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.fn_game_session_to_indicator_events()
  FROM PUBLIC, anon, authenticated;
