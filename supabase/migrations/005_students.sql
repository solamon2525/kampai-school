-- Drop existing tables (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS student_achievements CASCADE;
DROP TABLE IF EXISTS student_activities CASCADE;

-- Create student_achievements table
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    year TEXT,
    category TEXT DEFAULT 'รางวัล',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for student_achievements"
ON student_achievements FOR ALL
USING (true)
WITH CHECK (true);

-- Create student_activities table
CREATE TABLE student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    description TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;

-- Allow public full access (for admin panel to work without auth)
CREATE POLICY "Allow public full access for student_activities"
ON student_activities FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default achievements
INSERT INTO student_achievements (title, description, year, category, order_position) VALUES
('เหรียญทองโอลิมปิกวิชาการ', 'นักเรียนได้รับเหรียญทองการแข่งขันคณิตศาสตร์โอลิมปิกระดับชาติ', '2567', 'โอลิมปิก', 1),
('รางวัลชนะเลิศวิทยาศาสตร์', 'โครงงานวิทยาศาสตร์ได้รับรางวัลชนะเลิศระดับภาค', '2567', 'วิทยาศาสตร์', 2),
('ทุนการศึกษาต่อต่างประเทศ', 'นักเรียนได้รับทุนเรียนต่อมหาวิทยาลัยชั้นนำในต่างประเทศ', '2567', 'ทุนการศึกษา', 3),
('ผลสอบ O-NET สูงกว่าค่าเฉลี่ย', 'ผลสอบ O-NET ทุกวิชาสูงกว่าค่าเฉลี่ยระดับประเทศ', '2566', 'วิชาการ', 4);

-- Insert default activities
INSERT INTO student_activities (name, members, description, order_position) VALUES
('ชมรมวิทยาศาสตร์', 85, 'ทดลองและค้นคว้าทางวิทยาศาสตร์', 1),
('ชมรมคณิตศาสตร์', 70, 'พัฒนาทักษะการคิดวิเคราะห์', 2),
('ชมรมภาษาอังกฤษ', 90, 'พัฒนาทักษะการสื่อสารภาษาอังกฤษ', 3),
('ชมรมดนตรี', 65, 'เรียนรู้และแสดงดนตรีหลากหลายแนว', 4),
('ชมรมกีฬา', 120, 'ฝึกฝนกีฬาและส่งเสริมสุขภาพ', 5),
('ชมรมศิลปะ', 55, 'สร้างสรรค์ผลงานศิลปะหลากหลายรูปแบบ', 6);

-- Create student_stats table for overview statistics
DROP TABLE IF EXISTS student_stats CASCADE;

CREATE TABLE student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'text-primary',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for student_stats"
ON student_stats FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO student_stats (label, value, icon, color, order_position) VALUES
('นักเรียนทั้งหมด', '1,250', 'Users', 'text-primary', 1),
('ม.ปลาย', '650', 'GraduationCap', 'text-accent', 2),
('ม.ต้น', '600', 'BookOpen', 'text-green-500', 3),
('นักเรียนเกียรตินิยม', '180', 'Trophy', 'text-purple-500', 4);

-- Create grade_data table for student counts per grade level
DROP TABLE IF EXISTS grade_data CASCADE;

CREATE TABLE grade_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    rooms INTEGER DEFAULT 0,
    students INTEGER DEFAULT 0,
    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE grade_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for grade_data"
ON grade_data FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO grade_data (level, rooms, students, boys, girls, order_position) VALUES
('มัธยมศึกษาปีที่ 1', 6, 210, 105, 105, 1),
('มัธยมศึกษาปีที่ 2', 6, 200, 98, 102, 2),
('มัธยมศึกษาปีที่ 3', 6, 190, 95, 95, 3),
('มัธยมศึกษาปีที่ 4', 6, 220, 110, 110, 4),
('มัธยมศึกษาปีที่ 5', 6, 215, 108, 107, 5),
('มัธยมศึกษาปีที่ 6', 6, 215, 107, 108, 6);

-- Create student_council table for student council members
DROP TABLE IF EXISTS student_council CASCADE;

CREATE TABLE student_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    class TEXT,
    initial TEXT,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_council ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access for student_council"
ON student_council FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO student_council (name, position, class, initial, order_position) VALUES
('นายประสิทธิ์ เก่งมาก', 'ประธานสภานักเรียน', 'ม.6/1', 'ป', 1),
('นางสาวสุดา รักเรียน', 'รองประธานสภานักเรียน', 'ม.6/2', 'ส', 2),
('นายวิชัย ใจดี', 'เลขานุการสภานักเรียน', 'ม.5/1', 'ว', 3);
