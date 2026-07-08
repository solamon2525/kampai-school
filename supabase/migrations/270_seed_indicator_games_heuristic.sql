-- ============================================================================
-- Migration 270: Seed indicator_games แบบ heuristic (เร่งการ map เกม↔ตัวชี้วัด)
-- ============================================================================
-- ปัญหา: indicator_games ว่างเปล่าเพราะต้อง map ด้วยมือทีละเกม (120+ เกม)
--       → ระบบแนะนำเกม (#1) จะ fallback ไปแค่ popular ไม่ฉลาด
--
-- วิธีนี้ (heuristic seed): อ่าน subject + grade_levels ของแต่ละเกม → match ตัวชี้วัด
--   ที่ตรง subject_key + grade เดียวกัน → insert อัตโนมัติ
-- - Idempotent: ใช้ ON CONFLICT DO NOTHING (รันซ้ำได้ ไม่ซ้ำ)
-- - ไม่ทับ mapping ที่ครูทำเอง (CONFLICT ข้าม)
-- - จำกัด 6 ตัวชี้วัดต่อเกม (เอา sort_order ต่ำสุด = ตัวชี้วัดพื้นฐาน)
--
-- หลังรัน: ครูควรเข้า GamesTab → "🔗 จับคู่เกม↔ตัวชี้วัด" ตรวจและปรับแต่งต่อ
--           heuristic = จุดเริ่มต้น ไม่ใช่ของจริง 100%
-- ============================================================================

-- helper ชั่วคราว: แปลง subject (folder text) → subject_key array
-- (public.subject_keys รับเฉพาะ math/thai/english → ทำเองเพื่อครอบคลุม 8 สาระ)
CREATE OR REPLACE FUNCTION public.subject_key_from_folder(p_subject text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_subject IS NULL THEN NULL
    WHEN p_subject ILIKE '%คณิต%' THEN 'math'
    WHEN p_subject ILIKE '%ไทย%' THEN 'thai'
    WHEN p_subject ILIKE '%อังกฤษ%' THEN 'english'
    WHEN p_subject ILIKE '%วิทย์%' OR p_subject ILIKE '%วิทยา%' OR p_subject ILIKE '%วิทยาศาสตร์%'
      OR p_subject ILIKE '%เทคโนโลยี%' OR p_subject ILIKE '%tech%' OR p_subject = 'science' THEN 'science'
    WHEN p_subject ILIKE '%สังคม%' THEN 'social'
    WHEN p_subject ILIKE '%สุข%' OR p_subject ILIKE '%พลศึกษา%' OR p_subject ILIKE '%พละ%' THEN 'health'
    WHEN p_subject ILIKE '%ศิลป%' THEN 'arts'
    WHEN p_subject ILIKE '%การงาน%' OR p_subject ILIKE '%อาชีพ%' THEN 'career'
    -- fallback: ลองตรง key เลย (ถ้า subject เก็บเป็น 'math'/'thai' อยู่แล้ว)
    WHEN p_subject IN ('math','thai','english','science','social','health','arts','career') THEN p_subject
    ELSE NULL
  END;
$$;

-- Seed: เกมที่ยังไม่มี mapping เลย → เติม heuristic
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT
  ehi.id AS edu_hub_item_id,
  ci.id AS indicator_id
FROM public.educational_hub_items ehi
CROSS JOIN LATERAL (
  -- เลือกตัวชี้วัดที่ตรง subject_key + grade แรกของเกม เรียงตาม sort_order จำกัด 6 ตัว
  SELECT id FROM public.curriculum_indicators
  WHERE is_active = true
    AND subject_key = public.subject_key_from_folder(ehi.subject)
    AND grade = COALESCE(
      -- grade_levels เก็บเป็น text[] เช่น ['ป.1','ป.2'] → เอาตัวแรก
      (ehi.grade_levels)[1],
      'ป.1'
    )
  ORDER BY sort_order
  LIMIT 6
) ci
WHERE ehi.tracked_game = true
  AND ehi.is_published = true
  AND ehi.game_slug IS NOT NULL
  AND public.subject_key_from_folder(ehi.subject) IS NOT NULL
  -- เฉพาะเกมที่ยังไม่มี mapping เลย (เคารพที่ครูทำไว้แล้ว)
  AND NOT EXISTS (
    SELECT 1 FROM public.indicator_games ig WHERE ig.edu_hub_item_id = ehi.id
  )
ON CONFLICT DO NOTHING;

-- รายงานผล (ดูใน Output)
SELECT
  'seeded' AS status,
  COUNT(DISTINCT ig.edu_hub_item_id) AS games_mapped,
  COUNT(*) AS total_mappings
FROM public.indicator_games ig
JOIN public.educational_hub_items ehi ON ehi.id = ig.edu_hub_item_id;

-- สถิติรวมทั้งระบบ
SELECT
  COUNT(*) FILTER (WHERE ig.edu_hub_item_id IS NOT NULL) AS mapped_games,
  COUNT(*) FILTER (WHERE ig.edu_hub_item_id IS NULL) AS unmapped_games
FROM public.educational_hub_items ehi
LEFT JOIN public.indicator_games ig ON ig.edu_hub_item_id = ehi.id
WHERE ehi.tracked_game = true AND ehi.is_published = true
GROUP BY ();

-- ไม่ drop function subject_key_from_folder (เผื่อรันซ้ำ/re-seed)
-- ถ้าต้องการลบ: DROP FUNCTION IF EXISTS public.subject_key_from_folder(text);
