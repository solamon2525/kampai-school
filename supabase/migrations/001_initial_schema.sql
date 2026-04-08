-- =============================================
-- INITIAL SCHEMA - School Website Database
-- Version: 1.0
-- =============================================
-- This creates the core tables needed for the website
-- Run this FIRST before any other migrations
-- =============================================

-- =============================================
-- 1. NEWS TABLE - ตารางข่าวสาร
-- =============================================
CREATE TABLE IF NOT EXISTS public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  image_url TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'ข่าวประชาสัมพันธ์',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  cover_image_url TEXT,
  external_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.news IS 'ตารางเก็บข่าวสารและประชาสัมพันธ์';
COMMENT ON COLUMN public.news.category IS 'หมวดหมู่ข่าว เช่น ข่าวประชาสัมพันธ์, กิจกรรม, ผลงานนักเรียน, ประกาศ';
COMMENT ON COLUMN public.news.is_pinned IS 'ปักหมุดข่าวให้แสดงด้านบน';
COMMENT ON COLUMN public.news.sort_order IS 'ลำดับการแสดงผล (เริ่มจาก 0)';
COMMENT ON COLUMN public.news.external_links IS 'ลิงก์ภายนอกที่เกี่ยวข้อง (JSON array)';

-- =============================================
-- 2. NEWS CATEGORIES TABLE - ตารางหมวดหมู่ข่าว
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.news_categories IS 'ตารางเก็บหมวดหมู่ของข่าวสาร';

-- =============================================
-- 3. GALLERY ALBUMS TABLE - ตารางอัลบั้มภาพ
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'ทั่วไป',
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_albums IS 'ตารางเก็บอัลบั้มรูปภาพ';
COMMENT ON COLUMN public.gallery_albums.category IS 'หมวดหมู่ เช่น กิจกรรม, กีฬา, วิชาการ';

-- =============================================
-- 4. GALLERY PHOTOS TABLE - ตารางรูปภาพ
-- =============================================
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_photos IS 'ตารางเก็บรูปภาพในแต่ละอัลบั้ม';

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Public Read, Admin Write
-- =============================================

-- NEWS Policies
DROP POLICY IF EXISTS "Published news are publicly readable" ON public.news;
CREATE POLICY "Published news are publicly readable"
  ON public.news
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin can manage news" ON public.news;
CREATE POLICY "Admin can manage news"
  ON public.news
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- NEWS CATEGORIES Policies
DROP POLICY IF EXISTS "News categories are publicly readable" ON public.news_categories;
CREATE POLICY "News categories are publicly readable"
  ON public.news_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage news categories" ON public.news_categories;
CREATE POLICY "Admin can manage news categories"
  ON public.news_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- GALLERY ALBUMS Policies
DROP POLICY IF EXISTS "Published albums are publicly readable" ON public.gallery_albums;
CREATE POLICY "Published albums are publicly readable"
  ON public.gallery_albums
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin can manage albums" ON public.gallery_albums;
CREATE POLICY "Admin can manage albums"
  ON public.gallery_albums
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- GALLERY PHOTOS Policies
DROP POLICY IF EXISTS "Photos are publicly readable" ON public.gallery_photos;
CREATE POLICY "Photos are publicly readable"
  ON public.gallery_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage photos" ON public.gallery_photos;
CREATE POLICY "Admin can manage photos"
  ON public.gallery_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);

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
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_categories_updated_at
  BEFORE UPDATE ON public.news_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_albums_updated_at
  BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_photos_updated_at
  BEFORE UPDATE ON public.gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_pinned ON public.news(is_pinned);
CREATE INDEX IF NOT EXISTS idx_news_sort_order ON public.news(sort_order);

CREATE INDEX IF NOT EXISTS idx_gallery_albums_category ON public.gallery_albums(category);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_published ON public.gallery_albums(is_published);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_album_id ON public.gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_sort_order ON public.gallery_photos(sort_order);

-- =============================================
-- STORAGE BUCKET Setup (for file uploads)
-- =============================================

-- Note: Storage buckets need to be created in Supabase Dashboard or via:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('school-images', 'school-images', true);

-- This will be handled separately as storage is managed differently

-- =============================================
-- SAMPLE DATA - ข้อมูลเริ่มต้น
-- =============================================

-- Insert default news categories
INSERT INTO public.news_categories (name, description, color) VALUES
  ('ข่าวประชาสัมพันธ์', 'ข่าวสารทั่วไปของโรงเรียน', 'blue'),
  ('กิจกรรม', 'กิจกรรมต่างๆ ภายในโรงเรียน', 'green'),
  ('ผลงานนักเรียน', 'ผลงานและความสำเร็จของนักเรียน', 'purple'),
  ('ประกาศ', 'ประกาศสำคัญจากทางโรงเรียน', 'red')
ON CONFLICT (name) DO NOTHING;

-- Insert sample news (optional - can be removed if you want clean installation)
INSERT INTO public.news (title, content, excerpt, category, published, published_at, sort_order) VALUES
  (
    'ยินดีต้อนรับสู่เว็บไซต์โรงเรียน',
    '<p>ยินดีต้อนรับสู่เว็บไซต์โรงเรียนรูปแบบใหม่ พร้อมระบบจัดการที่ทันสมัย</p>',
    'ยินดีต้อนรับสู่เว็บไซต์โรงเรียนรูปแบบใหม่',
    'ข่าวประชาสัมพันธ์',
    true,
    now(),
    0
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- END OF INITIAL SCHEMA
-- =============================================
