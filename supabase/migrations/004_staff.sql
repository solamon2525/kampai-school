-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS staff CASCADE;

-- Create staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    subject TEXT,
    education TEXT,
    experience TEXT,
    photo_url TEXT,
    staff_type TEXT NOT NULL DEFAULT 'teaching' CHECK (staff_type IN ('teaching', 'support')),
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for staff"
ON staff FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default teaching staff
INSERT INTO staff (name, position, subject, education, experience, staff_type, order_position) VALUES
('นายสมชาย ใจดี', 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาไทย', 'ภาษาไทย', 'ปริญญาโท ภาษาไทย', '15 ปี', 'teaching', 1),
('นางสาวสุภา รักเรียน', 'หัวหน้ากลุ่มสาระการเรียนรู้คณิตศาสตร์', 'คณิตศาสตร์', 'ปริญญาโท คณิตศาสตร์ศึกษา', '12 ปี', 'teaching', 2),
('นายวิทยา ฉลาดคิด', 'หัวหน้ากลุ่มสาระการเรียนรู้วิทยาศาสตร์', 'วิทยาศาสตร์', 'ปริญญาโท วิทยาศาสตร์ศึกษา', '10 ปี', 'teaching', 3),
('นางภาวินี สุขสม', 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', 'ภาษาอังกฤษ', 'ปริญญาโท ภาษาอังกฤษ', '14 ปี', 'teaching', 4),
('นายประเสริฐ ศิลปิน', 'หัวหน้ากลุ่มสาระการเรียนรู้ศิลปะ', 'ศิลปะ', 'ปริญญาตรี ศิลปศึกษา', '8 ปี', 'teaching', 5),
('นางสาวกาญจนา แข็งแรง', 'หัวหน้ากลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', 'สุขศึกษาและพลศึกษา', 'ปริญญาตรี พลศึกษา', '7 ปี', 'teaching', 6),
('นายอุดม ช่างคิด', 'หัวหน้ากลุ่มสาระการเรียนรู้การงานอาชีพ', 'การงานอาชีพ', 'ปริญญาโท เทคโนโลยีการศึกษา', '11 ปี', 'teaching', 7),
('นางสาวสังคม สันติสุข', 'หัวหน้ากลุ่มสาระการเรียนรู้สังคมศึกษา', 'สังคมศึกษา', 'ปริญญาโท สังคมศาสตร์', '13 ปี', 'teaching', 8);

-- Insert default support staff
INSERT INTO staff (name, position, department, experience, staff_type, order_position) VALUES
('นางสาวปราณี รักงาน', 'หัวหน้างานธุรการ', 'ฝ่ายบริหารทั่วไป', '10 ปี', 'support', 101),
('นายสมศักดิ์ รักษ์ความสะอาด', 'หัวหน้างานอาคารสถานที่', 'ฝ่ายบริหารทั่วไป', '8 ปี', 'support', 102),
('นางวันดี ใจดี', 'หัวหน้างานการเงินและพัสดุ', 'ฝ่ายบริหาร', '12 ปี', 'support', 103),
('นายคอมพิวเตอร์ เก่งมาก', 'หัวหน้างานเทคโนโลยีสารสนเทศ', 'ฝ่ายวิชาการ', '6 ปี', 'support', 104);
