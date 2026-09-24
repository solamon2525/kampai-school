# นำเข้าเกียรติบัตรครู

อ่านเมื่อผู้ใช้ขอเพิ่มประวัติอบรมจากภาพหรือ PDF เท่านั้น

- **ลงเกียรติบัตรครูจาก CLI:** drop รูปเกียรติบัตรใน Codex → Codex อ่านด้วย vision (แม่นกว่า Tesseract เดิม) → เขียน data JSON (recipient_name/course_name/training_type/start_date ISO ค.ศ./hours/...) → `node scripts/import-cert.mjs --image=<path> --data=<json> [--staff-id=<uuid>] [--dry-run]` (match staff→staff_id, อัปรูปเข้า `school-images/training-certificates/`, insert `training_records` status='ผ่านการอบรม'). **ต้องมี `SUPABASE_SERVICE_ROLE_KEY` ใน .env.local** (storage policy ให้แค่ authenticated อัป — anon ไม่ผ่าน). ชื่อ match หลายคน → script print candidate ให้ส่ง `--staff-id`. รับ `.pdf` ด้วย (render หน้าแรก→PNG @2x ผ่าน `mupdf` devDep). ภาพตะแคง/มีแถบ → หมุน/ครอปด้วย `sharp` ก่อน (เปิดดูยืนยันก่อนอัปเสมอ). เช็ค duplicate ใน `training_records` ก่อนลงทุกครั้ง
