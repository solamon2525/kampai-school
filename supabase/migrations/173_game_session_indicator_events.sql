-- ============================================================================
-- Migration 173: Game Play → Indicator Events (หลักฐานตัวชี้วัดอัตโนมัติ) — Phase 3
-- ============================================================================
-- ทุกครั้งที่บันทึก game_session → สร้าง 1 หลักฐาน (student_indicator_event) ต่อ
-- ตัวชี้วัดที่ผูกกับเกมนั้น (ตาราง indicator_games จาก migration 170).
--   • หาเกมจาก edu_hub_item_id ตรง ๆ หรือ fallback ผ่าน game_slug
--   • passed: derive จาก metadata (passed/won/cleared) ถ้าเกมส่งมา —
--     ไม่ส่ง = practicing (attempts > 0) ตามดีไซน์หลักฐานผสม
-- insert ผ่าน trigger SECURITY DEFINER → ไม่ต้องมี client write policy (ดู mig 170)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_game_session_to_indicator_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_passed  BOOLEAN;
BEGIN
  -- หา edu_hub_item_id (column ตรง หรือ fallback ผ่าน game_slug)
  v_item_id := NEW.edu_hub_item_id;
  IF v_item_id IS NULL AND NEW.game_slug IS NOT NULL THEN
    SELECT id INTO v_item_id
    FROM public.educational_hub_items
    WHERE game_slug = NEW.game_slug
    LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    RETURN NEW;  -- เกมไม่อยู่ในคลัง → ไม่มีตัวชี้วัดให้ผูก
  END IF;

  -- "ผ่าน" เมื่อเกมส่ง flag มาเอง (เกมส่วนใหญ่ไม่ส่ง → นับเป็น attempt/practicing)
  v_passed := lower(COALESCE(
                NEW.metadata->>'passed',
                NEW.metadata->>'won',
                NEW.metadata->>'cleared',
                '')) IN ('true', '1', 'yes', 'y', 't');

  INSERT INTO public.student_indicator_events
    (student_id, indicator_id, game_slug, session_id, score, passed)
  SELECT NEW.student_id, ig.indicator_id, NEW.game_slug, NEW.id, NEW.score, v_passed
  FROM public.indicator_games ig
  WHERE ig.edu_hub_item_id = v_item_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_game_session_indicator_events ON public.game_sessions;
CREATE TRIGGER trg_game_session_indicator_events
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_game_session_to_indicator_events();
