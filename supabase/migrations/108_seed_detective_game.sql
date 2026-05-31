-- 108_seed_detective_game.sql
-- "นักสืบโจทย์ปัญหา" (detective) — ย้าย Storage → git (port React ดิบ → single-file Babel)
-- ไฟล์เดิม edu-hub-games/math/mathdetective.html รันใน iframe ไม่ได้ (import lucide-react → จอเปล่า)
-- ตอนนี้ฝัง KAMPAI SDK (เก็บคะแนน + leaderboard) ที่ public/games/math/detective.html
UPDATE educational_hub_items
SET
    external_url  = '/games/math/detective.html',
    game_slug     = 'detective',
    tracked_game  = true,
    is_published  = true,
    updated_at    = now()
WHERE id = '4ec9c182-2a57-4066-8f6c-d97e52519a86';
