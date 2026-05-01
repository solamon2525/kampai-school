-- ============================================================================
-- Migration 027: ขยายตารางบุคลากรเป็น 9 คอลัมน์
--   เพิ่ม วิทยฐานะ / วุฒิ / วิชาเอก / วันบรรจุ / วันเกิด
-- ============================================================================

UPDATE public.school_dashboard_entries
SET table_data = '{
  "columns": [
    {"key":"no",        "label":"ที่",         "align":"center", "width":"48px"},
    {"key":"name",      "label":"ชื่อ-สกุล",   "width":"180px"},
    {"key":"position",  "label":"ตำแหน่ง",     "width":"160px"},
    {"key":"academic",  "label":"วิทยฐานะ",    "width":"120px"},
    {"key":"degree",    "label":"วุฒิ",         "align":"center", "width":"80px"},
    {"key":"major",     "label":"วิชาเอก",      "width":"150px"},
    {"key":"appointed", "label":"วันบรรจุ",     "align":"center", "width":"110px"},
    {"key":"birth",     "label":"วันเกิด",      "align":"center", "width":"100px"},
    {"key":"phone",     "label":"เบอร์โทร",    "align":"right",  "width":"130px"}
  ],
  "rows": [
    {"no":"1","name":"นายมกรธวัช แสนสง่า",       "position":"ผู้อำนวยการสถานศึกษา",   "academic":"ชำนาญการพิเศษ","degree":"ศษ.ม.","major":"การบริหารการศึกษา","appointed":"28 ธ.ค. 52","birth":"7 ต.ค. 26","phone":"06-5625-5651"},
    {"no":"2","name":"นางสาวมะลิวัลย์ จรุงพันธ์",   "position":"ครู",                   "academic":"ชำนาญการพิเศษ","degree":"ศษ.ม.","major":"เทคโนโลยีฯ",      "appointed":"1 มิ.ย. 36",  "birth":"5 มิ.ย. 12","phone":"06-3076-4589"},
    {"no":"3","name":"นางสาวศิมาภรณ์ ดวงจำปา",   "position":"ครู",                   "academic":"ชำนาญการ",     "degree":"ค.บ.","major":"การศึกษาปฐมวัย",   "appointed":"23 ธ.ค. 59","birth":"14 เม.ย. 36","phone":"08-4377-7213"},
    {"no":"4","name":"นางสาวภณิดา หล้าหา",       "position":"พนักงานราชการ ตำแหน่งครู","academic":"-",            "degree":"ค.บ.","major":"ภาษาไทย",         "appointed":"24 พ.ย. 65","birth":"1 ส.ค. 41", "phone":"06-2752-9706"},
    {"no":"5","name":"นางสาวธัญพิชชา วังผือ",      "position":"พนักงานราชการ ตำแหน่งครู","academic":"-",            "degree":"ค.บ.","major":"ภาษาอังกฤษ",      "appointed":"8 ม.ค. 65", "birth":"9 มี.ค. 42","phone":"09-0813-4239"},
    {"no":"6","name":"นายเอกวิทย์ พละลี",         "position":"ครูอัตราจ้าง",          "academic":"-",            "degree":"วท.บ.","major":"เทคโนโลยีการอาหาร","appointed":"1 ต.ค. 64", "birth":"9 มี.ค. 39","phone":"09-8650-6024"},
    {"no":"7","name":"นายพิติด ว่องไว",           "position":"นักการภารโรง",          "academic":"-",            "degree":"-",   "major":"-",               "appointed":"27 ต.ค. 65","birth":"21 พ.ค. 18","phone":"08-5581-8427"},
    {"no":"8","name":"นางสาวภัทรา ไอศริยะสมบัติ",  "position":"เจ้าหน้าที่ธุรการ",      "academic":"-",            "degree":"-",   "major":"บริหารธุรกิจ",      "appointed":"-",        "birth":"22 ธ.ค. 22","phone":"06-44753501"}
  ]
}'::jsonb
WHERE category='contacts' AND title='ทำเนียบบุคลากรโรงเรียน';
