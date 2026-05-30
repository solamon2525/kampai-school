-- ============================================================================
-- Migration 104: seed wizard-thai game ("ศึกจอมเวทแห่งภาษา")
-- ============================================================================
-- เกม RPG ต่อสู้คำศัพท์ภาษาไทย — port จาก React ดิบ (ที่รันใน iframe ไม่ได้)
-- เป็น single-file HTML (React+Babel CDN) + kampai integration ตาม GAME.md
-- ย้าย external_url จาก Supabase Storage → local path (/games/thai/wizard-thai.html)
-- ให้ version-controlled + verify:game ผ่าน + Vercel serve
-- ============================================================================

UPDATE public.educational_hub_items
SET external_url = '/games/thai/wizard-thai.html',
    game_slug    = 'wizard-thai',
    tracked_game = true,
    is_published = true,
    updated_at   = now()
WHERE id = '77300b4f-e17d-422e-9d41-8f33707d7da6';
