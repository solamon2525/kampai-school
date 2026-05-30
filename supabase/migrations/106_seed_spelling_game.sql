-- ============================================================================
-- Migration 106: ย้ายเกม "มือปราบคำผิด Top-Down" (spelling) Storage → git
-- ============================================================================
-- เดิม external_url ชี้ไป Supabase Storage (edu-hub-games/thai/spelling.html)
-- และเกมเดิม "ไม่มี" kampai integration เลย (ไม่ส่งคะแนน / ไม่มีตารางอันดับ)
-- ย้ายเป็น local path /games/thai/spelling.html (version-controlled) + เพิ่ม
-- EMBED block (init/sendGameEnd/navigateBack) + ตารางอันดับในจอแรก (kampai-leaderboard.js)
-- ============================================================================

UPDATE public.educational_hub_items
SET external_url = '/games/thai/spelling.html',
    game_slug    = 'spelling',
    tracked_game = true,
    is_published = true,
    updated_at   = now()
WHERE id = '41d4461f-960d-41ef-b6c7-29a5b1182971';
