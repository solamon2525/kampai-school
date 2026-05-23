-- 1. Delete existing incorrect weekend records (Saturday & Sunday)
DELETE FROM attendance_records 
WHERE EXTRACT(ISODOW FROM attendance_date) IN (6, 7);

-- 2. Add CHECK constraint to prevent future inserts/updates on weekends
ALTER TABLE attendance_records 
ADD CONSTRAINT chk_weekday_only 
CHECK (EXTRACT(ISODOW FROM attendance_date) NOT IN (6, 7));
