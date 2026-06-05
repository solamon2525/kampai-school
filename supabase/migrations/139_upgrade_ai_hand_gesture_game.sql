-- 139_upgrade_hand_gesture_game.sql
-- อัปเกรดเกม AR โบกมือ (MediaPipe Hands) สองภาษา → เวอร์ชันใหม่ "อัจฉริยะสองภาษา"
-- ใช้ slug เดิม ai-hand-gesture-game (อัปเกรดของเดิม ไม่สร้างซ้ำ — เก็บ leaderboard history)
-- port: ภาพ bg แยกเป็นไฟล์, ใส่ KAMPAI SDK + submitScore + player/leaderboard/goHome, guard MediaPipe
-- public/games/thai/ai-hand-gesture-game.html
-- Idempotent: UPDATE by game_slug (รันซ้ำได้)
UPDATE public.educational_hub_items
SET external_url  = '/games/thai/ai-hand-gesture-game.html',
    title         = 'อัจฉริยะสองภาษา',
    subject       = 'บูรณาการ (ไทย+อังกฤษ)',
    tracked_game  = true,
    is_published  = true,
    thumbnail_url = '/games/thai/ai-hand-gesture-game-cover.svg',
    updated_at    = now()
WHERE game_slug = 'ai-hand-gesture-game';
