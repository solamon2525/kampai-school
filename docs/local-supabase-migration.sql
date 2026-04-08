-- =============================================
-- School Students Database Schema
-- สำหรับใช้กับ Local Supabase
-- รันใน SQL Editor: http://localhost:54323
-- =============================================

-- Create enum for student gender
CREATE TYPE public.student_gender AS ENUM ('male', 'female');

-- =============================================
-- 1. STUDENTS TABLE - ตารางข้อมูลนักเรียน
-- =============================================
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender student_gender NOT NULL,
  birth_date DATE,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 6),
  classroom VARCHAR(10) NOT NULL,
  parent_name VARCHAR(200),
  parent_phone VARCHAR(20),
  address TEXT,
  profile_image_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.students IS 'ตารางเก็บข้อมูลนักเรียน';
COMMENT ON COLUMN public.students.student_id IS 'รหัสนักเรียน';
COMMENT ON COLUMN public.students.grade_level IS 'ระดับชั้น (1-3 = ม.1-3, 4-6 = ม.4-6)';
COMMENT ON COLUMN public.students.classroom IS 'ห้องเรียน เช่น 1/1, 2/3';

-- =============================================
-- 2. CLUBS TABLE - ตารางชมรม
-- =============================================
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  advisor_name VARCHAR(200),
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clubs IS 'ตารางเก็บข้อมูลชมรม';

-- =============================================
-- 3. STUDENT_ACHIEVEMENTS TABLE - ผลงานนักเรียน
-- =============================================
CREATE TABLE public.student_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  achievement_date DATE,
  category VARCHAR(50),
  icon VARCHAR(50) DEFAULT 'trophy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.student_achievements IS 'ตารางเก็บผลงานและรางวัลนักเรียน';

-- =============================================
-- 4. STUDENT_CLUBS TABLE - การเป็นสมาชิกชมรม
-- =============================================
CREATE TABLE public.student_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, club_id)
);

COMMENT ON TABLE public.student_clubs IS 'ตารางเชื่อมนักเรียนกับชมรม';

-- =============================================
-- 5. STUDENT_COUNCIL TABLE - สภานักเรียน
-- =============================================
CREATE TABLE public.student_council (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.student_council IS 'ตารางสภานักเรียน';

-- =============================================
-- 6. SCHOOL_ACHIEVEMENTS TABLE - ผลงานระดับโรงเรียน
-- =============================================
CREATE TABLE public.school_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  achievement_year INTEGER,
  category VARCHAR(50),
  icon VARCHAR(50) DEFAULT 'trophy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.school_achievements IS 'ตารางผลงานระดับโรงเรียน';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_council ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_achievements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - สำหรับเว็บไซต์โรงเรียน (อ่านได้สาธารณะ)
-- =============================================
CREATE POLICY "Students are publicly readable" 
  ON public.students FOR SELECT USING (true);

CREATE POLICY "Achievements are publicly readable" 
  ON public.student_achievements FOR SELECT USING (true);

CREATE POLICY "Clubs are publicly readable" 
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "Student clubs are publicly readable" 
  ON public.student_clubs FOR SELECT USING (true);

CREATE POLICY "Student council is publicly readable" 
  ON public.student_council FOR SELECT USING (true);

CREATE POLICY "School achievements are publicly readable" 
  ON public.school_achievements FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES สำหรับประสิทธิภาพ
-- =============================================
CREATE INDEX idx_students_grade_level ON public.students(grade_level);
CREATE INDEX idx_students_classroom ON public.students(classroom);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_student_achievements_student_id ON public.student_achievements(student_id);
CREATE INDEX idx_student_clubs_student_id ON public.student_clubs(student_id);
CREATE INDEX idx_student_clubs_club_id ON public.student_clubs(club_id);
CREATE INDEX idx_student_council_academic_year ON public.student_council(academic_year);

-- =============================================
-- SAMPLE DATA - ข้อมูลตัวอย่าง
-- =============================================

-- Insert sample clubs
INSERT INTO public.clubs (name, description, advisor_name, max_members) VALUES
  ('ชมรมวิทยาศาสตร์', 'ทดลองและค้นคว้าทางวิทยาศาสตร์', 'อาจารย์วิทยา ฉลาดคิด', 85),
  ('ชมรมคณิตศาสตร์', 'พัฒนาทักษะการคิดวิเคราะห์', 'อาจารย์สุภา รักเรียน', 70),
  ('ชมรมภาษาอังกฤษ', 'พัฒนาทักษะการสื่อสารภาษาอังกฤษ', 'อาจารย์ภาวินี สุขสม', 90),
  ('ชมรมดนตรี', 'เรียนรู้และแสดงดนตรีหลากหลายแนว', 'อาจารย์ประเสริฐ ศิลปิน', 65),
  ('ชมรมกีฬา', 'ฝึกฝนกีฬาและส่งเสริมสุขภาพ', 'อาจารย์กาญจนา แข็งแรง', 120),
  ('ชมรมศิลปะ', 'สร้างสรรค์ผลงานศิลปะหลากหลายรูปแบบ', 'อาจารย์ประเสริฐ ศิลปิน', 55);

-- Insert sample school achievements
INSERT INTO public.school_achievements (title, description, achievement_year, category, icon) VALUES
  ('รางวัลชนะเลิศการแข่งขันวิทยาศาสตร์โอลิมปิก', 'นักเรียนได้รับรางวัลชนะเลิศระดับประเทศ', 2024, 'วิชาการ', 'trophy'),
  ('โรงเรียนต้นแบบด้านสิ่งแวดล้อม', 'ได้รับการรับรองจากกระทรวงทรัพยากรธรรมชาติ', 2024, 'สิ่งแวดล้อม', 'leaf'),
  ('รางวัลเหรียญทองกีฬาระดับภาค', 'ทีมฟุตบอลได้รับรางวัลเหรียญทอง', 2023, 'กีฬา', 'medal'),
  ('รางวัลชมเชยการประกวดวงดนตรี', 'วงโยธวาทิตได้รับรางวัลระดับจังหวัด', 2023, 'ศิลปะ', 'music');

-- Insert sample students
INSERT INTO public.students (student_id, first_name, last_name, gender, birth_date, grade_level, classroom, parent_name, parent_phone) VALUES
  ('STD-2567-001', 'สมชาย', 'ใจดี', 'male', '2010-03-15', 4, '4/1', 'นายสมศักดิ์ ใจดี', '081-234-5678'),
  ('STD-2567-002', 'สมหญิง', 'รักเรียน', 'female', '2010-05-20', 4, '4/1', 'นางสมใจ รักเรียน', '082-345-6789'),
  ('STD-2567-003', 'วิชัย', 'เก่งมาก', 'male', '2011-01-10', 3, '3/2', 'นายวิเชียร เก่งมาก', '083-456-7890'),
  ('STD-2567-004', 'วิภา', 'สวยงาม', 'female', '2009-08-25', 5, '5/1', 'นางวิไล สวยงาม', '084-567-8901'),
  ('STD-2567-005', 'ประเสริฐ', 'ดีเยี่ยม', 'male', '2008-12-01', 6, '6/1', 'นายประสิทธิ์ ดีเยี่ยม', '085-678-9012');

-- Link students to clubs
INSERT INTO public.student_clubs (student_id, club_id)
SELECT s.id, c.id 
FROM public.students s, public.clubs c 
WHERE s.student_id = 'STD-2567-001' AND c.name = 'ชมรมวิทยาศาสตร์';

INSERT INTO public.student_clubs (student_id, club_id)
SELECT s.id, c.id 
FROM public.students s, public.clubs c 
WHERE s.student_id = 'STD-2567-002' AND c.name = 'ชมรมภาษาอังกฤษ';

-- Insert student council
INSERT INTO public.student_council (student_id, position, academic_year)
SELECT id, 'ประธานนักเรียน', '2567' FROM public.students WHERE student_id = 'STD-2567-005';

INSERT INTO public.student_council (student_id, position, academic_year)
SELECT id, 'รองประธานนักเรียน', '2567' FROM public.students WHERE student_id = 'STD-2567-004';

-- =============================================
-- END OF MIGRATION
-- =============================================
