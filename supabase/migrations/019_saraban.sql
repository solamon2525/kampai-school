-- ===================================================
-- Migration 019: งานสารบรรณ
-- หนังสือรับ, หนังสือส่ง, การประชุม, คำสั่ง/ประกาศ
-- ===================================================

-- หนังสือรับ
CREATE TABLE IF NOT EXISTS incoming_letters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number  TEXT NOT NULL,
  received_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  subject        TEXT NOT NULL,
  sender         TEXT,
  priority       TEXT NOT NULL DEFAULT 'ปกติ'
                 CHECK (priority IN ('ปกติ','ด่วน','ด่วนมาก','ด่วนที่สุด')),
  status         TEXT NOT NULL DEFAULT 'รอดำเนินการ'
                 CHECK (status IN ('รอดำเนินการ','กำลังดำเนินการ','เสร็จแล้ว')),
  due_date       DATE,
  notes          TEXT,
  attachment_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- หนังสือส่ง
CREATE TABLE IF NOT EXISTS outgoing_letters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number  TEXT NOT NULL,
  sent_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  subject        TEXT NOT NULL,
  recipient      TEXT,
  priority       TEXT NOT NULL DEFAULT 'ปกติ'
                 CHECK (priority IN ('ปกติ','ด่วน','ด่วนมาก','ด่วนที่สุด')),
  status         TEXT NOT NULL DEFAULT 'ร่าง'
                 CHECK (status IN ('ร่าง','รอลงนาม','ส่งแล้ว')),
  attachment_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- การประชุม
CREATE TABLE IF NOT EXISTS meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  meeting_date  DATE NOT NULL,
  meeting_time  TIME,
  location      TEXT,
  attendees     TEXT[] DEFAULT '{}',
  agendas       TEXT[] DEFAULT '{}',
  decisions     TEXT,
  minutes_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- คำสั่ง / ประกาศ / บันทึกข้อความ
CREATE TABLE IF NOT EXISTS orders_announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type       TEXT NOT NULL DEFAULT 'คำสั่ง'
                 CHECK (doc_type IN ('คำสั่ง','ประกาศ','บันทึกข้อความ')),
  doc_number     TEXT NOT NULL,
  doc_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  subject        TEXT NOT NULL,
  content        TEXT,
  attachment_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incoming_letters_date ON incoming_letters(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_incoming_letters_status ON incoming_letters(status);
CREATE INDEX IF NOT EXISTS idx_outgoing_letters_date ON outgoing_letters(sent_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders_announcements(doc_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders_announcements(doc_type);

-- Row Level Security
ALTER TABLE incoming_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage incoming_letters"
  ON incoming_letters FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage outgoing_letters"
  ON outgoing_letters FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage meetings"
  ON meetings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage orders_announcements"
  ON orders_announcements FOR ALL USING (auth.role() = 'authenticated');
