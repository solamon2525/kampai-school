-- migration 382: corner_badge column for educational_hub_items
-- เพิ่ม field corner_badge สำหรับแสดง badge มุมซ้ายบนบนการ์ดเกม
-- ค่า NULL = ไม่แสดง badge, 'AR' = badge AR สีแดง, รองรับค่าอื่นในอนาคต (เช่น 'NEW', 'HOT', 'BETA')

ALTER TABLE educational_hub_items
    ADD COLUMN IF NOT EXISTS corner_badge TEXT DEFAULT NULL;

COMMENT ON COLUMN educational_hub_items.corner_badge IS
    'ป้าย (badge) มุมซ้ายบนบนการ์ดเกม — NULL = ไม่แสดง, ''AR'' = ต้องใช้กล้อง/AR, ''NEW'' = เกมใหม่, ''HOT'' = กำลังนิยม, ''BETA'' = รุ่นทดสอบ';
