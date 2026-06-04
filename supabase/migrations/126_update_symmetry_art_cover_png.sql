-- 126_update_symmetry_art_cover_png.sql
-- เปลี่ยนปกเกม "เติมลายสมมาตร" (symmetry-art) จาก SVG วาดมือ → PNG สร้างด้วย Canva AI
-- (การ์ตูน chibi เด็กศิลปินระบายผีเสื้อสมมาตร สวยกว่าเดิม) — public/games/arts/symmetry-art-cover.png
-- Idempotent: re-run แล้ว sync ค่าเดิมทุกครั้ง
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/symmetry-art-cover.png', updated_at = now()
WHERE game_slug = 'symmetry-art';
