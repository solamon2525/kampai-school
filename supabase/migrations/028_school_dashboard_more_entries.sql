-- ============================================================================
-- Migration 028: เพิ่ม entries ใหม่ใน dashboard-school
--   • TikTok โรงเรียน (systems)
--   • ระบบโรงเรียนวิถีพุทธ (systems)
--   • ที่อยู่และเลขประจำตัวผู้เสียภาษี (codes)
-- ============================================================================

INSERT INTO public.school_dashboard_entries
  (category, title, description, url, username, password, extra_fields, tags, is_sensitive, order_position)
VALUES
  ('systems',
   'TikTok โรงเรียนบ้านคำไผ่',
   'บัญชี TikTok ทางการของโรงเรียน',
   'https://www.tiktok.com/',
   'kampai2252@gmail.com',
   'kampai2252#',
   '[]'::jsonb,
   ARRAY['social','TikTok'],
   true, 2),

  ('systems',
   'ระบบโรงเรียนวิถีพุทธ',
   'ระบบรายงานโรงเรียนวิถีพุทธ',
   NULL,
   '41020050',
   '4120050',
   '[]'::jsonb,
   ARRAY['ระบบราชการ','วิถีพุทธ'],
   true, 3),

  ('codes',
   'ที่อยู่และข้อมูลทางทะเบียน',
   'โรงเรียนบ้านคำไผ่',
   NULL, NULL, NULL,
   '[
     {"label":"ที่อยู่","value":"เลขที่ 159 หมู่ 9 ต.เวียงคำ อ.กุมภวาปี จ.อุดรธานี 41110","type":"text"},
     {"label":"เลขประจำตัวผู้เสียภาษี","value":"0994000936648","type":"text"}
   ]'::jsonb,
   ARRAY['ที่อยู่','ทะเบียน','ภาษี'],
   false, 2)
ON CONFLICT DO NOTHING;
