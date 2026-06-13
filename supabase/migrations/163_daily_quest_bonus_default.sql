-- 163_daily_quest_bonus_default.sql
-- ปรับค่าโบนัส Daily Quest ตอนทำครบทุกวิชา: 50/30 → 100/50 (จูงใจสูงขึ้น)
-- เกณฑ์คะแนนผ่านเควสคงเดิม (auto 50% ของคะแนนกลางเกม) — ไม่แตะ trigger

UPDATE public.daily_quest_config
   SET all_complete_points = 100,
       all_complete_xp     = 50,
       updated_at          = now()
 WHERE id = true;
