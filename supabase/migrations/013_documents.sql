-- ระบบจัดการเอกสาร
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Folder',
  color TEXT DEFAULT 'blue',
  order_position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  academic_year TEXT DEFAULT '2569',
  is_published BOOLEAN DEFAULT true,
  download_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read doc_categories" ON document_categories FOR SELECT USING (true);
CREATE POLICY "Auth manage doc_categories" ON document_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read documents" ON documents FOR SELECT USING (is_published = true);
CREATE POLICY "Auth manage documents" ON documents FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO document_categories (name, icon, color, order_position) VALUES
  ('แบบฟอร์ม', 'FileText', 'blue', 1),
  ('ประกาศ/คำสั่ง', 'Megaphone', 'red', 2),
  ('คู่มือ', 'BookOpen', 'green', 3),
  ('รายงาน', 'BarChart', 'purple', 4),
  ('อื่นๆ', 'Folder', 'gray', 5)
ON CONFLICT DO NOTHING;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('school-documents', 'school-documents', true, 52428800)
ON CONFLICT (id) DO NOTHING;
