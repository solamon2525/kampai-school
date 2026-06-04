-- 127_update_circuit_builder_cover_png.sql
-- เปลี่ยนปกเกม "ต่อวงจรไฟฟ้า" (circuit-builder) จาก SVG → PNG สร้างด้วย Canva AI
-- (การ์ตูนเด็กนักเรียน 2 คนใส่ชุดนักเรียนต่อวงจรไฟฟ้าเข้าหลอดไฟ) — public/games/science/circuit-builder-cover.png
-- Idempotent: re-run แล้ว sync ค่าเดิมทุกครั้ง
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/circuit-builder-cover.png', updated_at = now()
WHERE game_slug = 'circuit-builder';
