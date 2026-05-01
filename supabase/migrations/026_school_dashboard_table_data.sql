-- ============================================================================
-- Migration 026: school_dashboard_entries — add structured table_data
-- เก็บข้อมูลแบบตาราง (columns + rows) สำหรับแสดงผล grid view
-- ============================================================================

ALTER TABLE public.school_dashboard_entries
  ADD COLUMN IF NOT EXISTS table_data JSONB;

COMMENT ON COLUMN public.school_dashboard_entries.table_data IS
  'Optional structured table: { columns: [{key,label,align?,width?}], rows: [{[key]:value}] }';

-- เปลี่ยน "ทำเนียบบุคลากรโรงเรียน" ให้ใช้ table_data + เคลียร์ extra_fields
UPDATE public.school_dashboard_entries
SET
  description = 'โรงเรียนบ้านคำไผ่ — กลุ่มเครือข่ายโรงเรียนกุมภวาปี 1',
  extra_fields = '[]'::jsonb,
  table_data = '{
    "columns": [
      {"key":"no",       "label":"ที่",        "align":"center", "width":"56px"},
      {"key":"name",     "label":"ชื่อ-สกุล"},
      {"key":"position", "label":"ตำแหน่ง"},
      {"key":"phone",    "label":"เบอร์โทร",   "align":"right",  "width":"140px"}
    ],
    "rows": [
      {"no":"1","name":"นายมกรธวัช แสนสง่า",       "position":"ผู้อำนวยการสถานศึกษา",   "phone":"06-5625-5651"},
      {"no":"2","name":"นางสาวมะลิวัลย์ จรุงพันธ์",   "position":"ครูชำนาญการพิเศษ",      "phone":"06-3076-4589"},
      {"no":"3","name":"นางสาวศิมาภรณ์ ดวงจำปา",   "position":"ครูชำนาญการ",          "phone":"08-4377-7213"},
      {"no":"4","name":"นางสาวภณิดา หล้าหา",       "position":"พนักงานราชการ ตำแหน่งครู","phone":"06-2752-9706"},
      {"no":"5","name":"นางสาวธัญพิชชา วังผือ",      "position":"พนักงานราชการ ตำแหน่งครู","phone":"09-0813-4239"},
      {"no":"6","name":"นายเอกวิทย์ พละลี",         "position":"ครูอัตราจ้าง",          "phone":"09-8650-6024"},
      {"no":"7","name":"นายพิติด ว่องไว",           "position":"นักการภารโรง",          "phone":"08-5581-8427"},
      {"no":"8","name":"นางสาวภัทรา ไอศริยะสมบัติ",  "position":"เจ้าหน้าที่ธุรการ",      "phone":"06-44753501"}
    ]
  }'::jsonb
WHERE category = 'contacts' AND title = 'ทำเนียบบุคลากรโรงเรียน';
