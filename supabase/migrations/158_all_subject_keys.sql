-- ===============================================================
-- Migration 158: ครบ 8 กลุ่มสาระแกนกลางประถม (Gamification รอบ 2)
-- ===============================================================
-- เดิม subject_keys() รู้จักแค่ math/thai/english — วิทย์ เทคโน สังคม
-- สุขศึกษา ศิลปะ การงาน ถูกยุบเป็น 'other' หมด
--
-- ใหม่: map ครบ 8 กลุ่มสาระ (เทคโนโลยี/วิทยาการคำนวณ รวมใน
-- วิทยาศาสตร์ฯ ตามหลักสูตรแกนกลาง 2551 ปรับปรุง 2560)
-- + เหรียญวิชารอง 10 ใบ (5 วิชา × 2 ชั้น) + ladder "รอบรู้" 3 ขั้น
--
-- ไม่ต้องแตะ record_game_session / views / RPCs — ออกแบบ generic ไว้แล้ว
-- ===============================================================

-- ─── 1) subject_keys ครบ 8 กลุ่มสาระ ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.subject_keys(p_subject text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_subject IS NULL THEN ARRAY['other']
    ELSE COALESCE(
      NULLIF(ARRAY(SELECT k FROM (VALUES
        ('math',    p_subject LIKE '%คณิต%'),
        ('thai',    p_subject LIKE '%ไทย%'),
        ('english', p_subject LIKE '%อังกฤษ%'),
        ('science', p_subject LIKE '%วิทย%' OR p_subject LIKE '%เทคโน%'),
        ('social',  p_subject LIKE '%สังคม%' OR p_subject LIKE '%ประวัติ%' OR p_subject LIKE '%ศาสนา%'),
        ('health',  p_subject LIKE '%สุข%' OR p_subject LIKE '%พลศึกษา%'),
        ('arts',    p_subject LIKE '%ศิลป%' OR p_subject LIKE '%ดนตรี%' OR p_subject LIKE '%นาฏ%'),
        ('career',  p_subject LIKE '%การงาน%' OR p_subject LIKE '%อาชีพ%')
      ) AS v(k, hit) WHERE hit), ARRAY[]::text[]),
      ARRAY['other']
    )
  END;
$$;

-- ─── 2) เหรียญวิชารอง 10 ใบ (5 วิชา × ต้น/สูง) ──────────────────────────
INSERT INTO public.game_achievements_catalog
  (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, tier, subject_key, sort_order)
SELECT NULL, v.code, v.title, v.descr, v.icon, 'subject_xp_gte', v.val, v.bonus, v.tier, v.subj, v.sort
FROM (VALUES
  ('g_sci_1',    'เซียนวิทย์-เทคโนโลยี ระดับต้น', 'สะสม XP จากเกมวิทยาศาสตร์-เทคโนโลยี 150', '🔬', 150::numeric, 10, 'bronze', 'science', 53),
  ('g_sci_2',    'เซียนวิทย์-เทคโนโลยี ระดับสูง', 'สะสม XP จากเกมวิทยาศาสตร์-เทคโนโลยี 500', '🔬', 500,          30, 'gold',   'science', 54),
  ('g_social_1', 'เซียนสังคมศึกษา ระดับต้น',      'สะสม XP จากเกมสังคมศึกษา 150',            '🏛️', 150,          10, 'bronze', 'social',  55),
  ('g_social_2', 'เซียนสังคมศึกษา ระดับสูง',      'สะสม XP จากเกมสังคมศึกษา 500',            '🏛️', 500,          30, 'gold',   'social',  56),
  ('g_health_1', 'เซียนสุขศึกษา-พละ ระดับต้น',    'สะสม XP จากเกมสุขศึกษา-พลศึกษา 150',       '💪', 150,          10, 'bronze', 'health',  57),
  ('g_health_2', 'เซียนสุขศึกษา-พละ ระดับสูง',    'สะสม XP จากเกมสุขศึกษา-พลศึกษา 500',       '💪', 500,          30, 'gold',   'health',  58),
  ('g_arts_1',   'เซียนศิลปะ ระดับต้น',           'สะสม XP จากเกมศิลปะ 150',                  '🎨', 150,          10, 'bronze', 'arts',    59),
  ('g_arts_2',   'เซียนศิลปะ ระดับสูง',           'สะสม XP จากเกมศิลปะ 500',                  '🎨', 500,          30, 'gold',   'arts',    60),
  ('g_career_1', 'เซียนการงานอาชีพ ระดับต้น',     'สะสม XP จากเกมการงานอาชีพ 150',            '🛠️', 150,          10, 'bronze', 'career',  61),
  ('g_career_2', 'เซียนการงานอาชีพ ระดับสูง',     'สะสม XP จากเกมการงานอาชีพ 500',            '🛠️', 500,          30, 'gold',   'career',  62)
) AS v(code, title, descr, icon, val, bonus, tier, subj, sort)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_achievements_catalog c
  WHERE c.game_slug IS NULL AND c.code = v.code
);

-- ─── 3) ladder "รอบรู้" 3 ขั้น (subjects_distinct นับได้ถึง 9 แล้ว) ──────
-- เดิม g_allround = 4 วิชา gold → ปรับเป็นขั้นแรก (silver) — คนที่ปลดแล้วคงเหรียญไว้
UPDATE public.game_achievements_catalog
SET title_th = 'รอบรู้ 4 วิชา', tier = 'silver', sort_order = 63,
    description_th = 'เล่นเกมครบ 4 หมวดวิชา'
WHERE game_slug IS NULL AND code = 'g_allround';

INSERT INTO public.game_achievements_catalog
  (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, tier, sort_order)
SELECT NULL, v.code, v.title, v.descr, v.icon, 'subjects_distinct_gte', v.val, v.bonus, v.tier, v.sort
FROM (VALUES
  ('g_allround_2', 'รอบด้าน 6 วิชา', 'เล่นเกมครบ 6 หมวดวิชา', '📚', 6::numeric, 40, 'gold',    64),
  ('g_allround_3', 'ปราชญ์ 8 วิชา',  'เล่นเกมครบ 8 หมวดวิชา', '🦉', 8,          80, 'diamond', 65)
) AS v(code, title, descr, icon, val, bonus, tier, sort)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_achievements_catalog c
  WHERE c.game_slug IS NULL AND c.code = v.code
);
