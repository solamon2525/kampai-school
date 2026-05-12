-- ===============================================================
-- Migration 024: Public read for positive conduct scores
-- เปิดให้สาธารณะ (ไม่ต้อง login) อ่าน conduct_scores ที่ type='add'
-- เพื่อรองรับหน้า /hall-of-fame เชิดชูนักเรียนที่ทำความดี
-- หมายเหตุ: ไม่แตะ policy เดิม ("Auth manage conduct_scores")
-- Postgres รวม policy แบบ OR — ผู้ใช้ที่ login ยังจัดการได้ปกติ
-- ===============================================================

CREATE POLICY "Public read positive conduct"
  ON conduct_scores FOR SELECT
  USING (type = 'add');
