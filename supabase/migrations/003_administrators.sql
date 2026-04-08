-- Drop existing table (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS administrators CASCADE;

-- Create administrators table
CREATE TABLE administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    education TEXT,
    quote TEXT,
    photo_url TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for administrators"
ON administrators FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default data
INSERT INTO administrators (name, position, education, quote, order_position) VALUES
('ดร.สมศักดิ์ วิทยาการ', 'ผู้อำนวยการโรงเรียน', 'ปริญญาเอก บริหารการศึกษา', 'การศึกษาคือกุญแจสู่อนาคตที่สดใส', 1),
('นางสาวประภา สุขสวัสดิ์', 'รองผู้อำนวยการฝ่ายวิชาการ', 'ปริญญาโท หลักสูตรและการสอน', 'มุ่งมั่นพัฒนาคุณภาพการเรียนการสอน', 2),
('นายวิชัย บุญมี', 'รองผู้อำนวยการฝ่ายบริหาร', 'ปริญญาโท บริหารธุรกิจ', 'บริหารด้วยความโปร่งใสและมีประสิทธิภาพ', 3),
('นางรัชนี แสงทอง', 'รองผู้อำนวยการฝ่ายกิจการนักเรียน', 'ปริญญาโท จิตวิทยาการศึกษา', 'ดูแลนักเรียนด้วยหัวใจ', 4);
