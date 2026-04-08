-- =============================================
-- Events and Settings Management Tables
-- For KK School Admin Panel
-- =============================================

-- =============================================
-- 1. EVENTS TABLE - ตารางกิจกรรม/ปฏิทิน
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(200),
  category VARCHAR(50) DEFAULT 'general',
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.events IS 'ตารางเก็บข้อมูลกิจกรรมและปฏิทินโรงเรียน';
COMMENT ON COLUMN public.events.category IS 'หมวดหมู่ เช่น academic, sports, cultural, general';
COMMENT ON COLUMN public.events.status IS 'สถานะการแสดงผล: draft, published, archived';

-- =============================================
-- 2. SCHOOL_SETTINGS TABLE - ตารางตั้งค่าโรงเรียน
-- =============================================
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.school_settings IS 'ตารางเก็บการตั้งค่าต่างๆ ของโรงเรียน';
COMMENT ON COLUMN public.school_settings.key IS 'คีย์การตั้งค่า เช่น school_name, phone, email';
COMMENT ON COLUMN public.school_settings.category IS 'หมวดหมู่ เช่น general, contact, social_media, branding';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Public Read for Published Content
-- =============================================

-- Drop existing policies first (for re-running migration)
DROP POLICY IF EXISTS "Published events are publicly readable" ON public.events;
DROP POLICY IF EXISTS "Admin can insert events" ON public.events;
DROP POLICY IF EXISTS "Admin can update events" ON public.events;
DROP POLICY IF EXISTS "Admin can delete events" ON public.events;
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can delete settings" ON public.school_settings;

-- Events: อ่านได้เฉพาะที่ published
CREATE POLICY "Published events are publicly readable" 
  ON public.events 
  FOR SELECT 
  USING (status = 'published');

-- Events: Admin can do everything (temporarily allow all authenticated users)
-- Note: In production, you should check if user is admin
CREATE POLICY "Admin can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update events"
  ON public.events
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete events"
  ON public.events
  FOR DELETE
  USING (true);

-- Settings: อ่านได้ทั้งหมด
CREATE POLICY "Settings are publicly readable" 
  ON public.school_settings 
  FOR SELECT 
  USING (true);

-- Settings: Admin can do everything
CREATE POLICY "Admin can insert settings"
  ON public.school_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update settings"
  ON public.school_settings
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete settings"
  ON public.school_settings
  FOR DELETE
  USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Drop existing triggers first (for re-running migration)
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_school_settings_updated_at ON public.school_settings;

-- Function to update timestamps (create if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates on events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for automatic timestamp updates on settings
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES สำหรับประสิทธิภาพ
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_school_settings_key ON public.school_settings(key);
CREATE INDEX IF NOT EXISTS idx_school_settings_category ON public.school_settings(category);

-- =============================================
-- SAMPLE DATA - ข้อมูลเริ่มต้น
-- =============================================

-- Insert default school settings
INSERT INTO public.school_settings (key, value, category, description) VALUES
  ('school_name', 'โรงเรียนตัวอย่าง', 'general', 'ชื่อโรงเรียน'),
  ('school_motto', 'เรียนดี มีความสุข พัฒนาตน', 'general', 'คำขวัญโรงเรียน'),
  ('school_phone', '02-xxx-xxxx', 'contact', 'เบอร์โทรศัพท์'),
  ('school_email', 'info@school.ac.th', 'contact', 'อีเมล'),
  ('school_address', '123 ถนนตัวอย่าง เขต... กรุงเทพฯ 10xxx', 'contact', 'ที่อยู่'),
  ('facebook_url', '', 'social_media', 'Facebook Page URL'),
  ('line_id', '', 'social_media', 'LINE Official Account'),
  ('youtube_url', '', 'social_media', 'YouTube Channel URL')
ON CONFLICT (key) DO NOTHING;

-- Insert sample events
INSERT INTO public.events (title, description, event_date, event_time, location, category, status) VALUES
  (
    'วันเปิดเทอม ภาคเรียนที่ 1/2568',
    'พิธีเปิดภาคเรียนใหม่ ให้นักเรียนทุกคนมาพร้อมกัน',
    CURRENT_DATE + INTERVAL '7 days',
    '08:00:00',
    'โรงยิมนาเซียม',
    'academic',
    'published'
  ),
  (
    'กีฬาสีประจำปี 2568',
    'การแข่งขันกีฬาภายในโรงเรียน เพื่อส่งเสริมความสามัคคี',
    CURRENT_DATE + INTERVAL '30 days',
    '09:00:00',
    'สนามกีฬาโรงเรียน',
    'sports',
    'published'
  ),
  (
    'งานวันสถาปนาโรงเรียน',
    'ร่วมฉลองครบรอบวันสถาปนาโรงเรียน พร้อมกิจกรรมมากมาย',
    CURRENT_DATE + INTERVAL '60 days',
    '10:00:00',
    'หอประชุมโรงเรียน',
    'cultural',
    'published'
  );

-- =============================================
-- END OF MIGRATION
-- =============================================
