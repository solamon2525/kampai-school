-- ระบบธนาคารขยะ
CREATE TABLE IF NOT EXISTS waste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '♻️',
  color TEXT DEFAULT 'green',
  is_active BOOLEAN DEFAULT true,
  order_position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waste_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  category_id UUID REFERENCES waste_categories(id) ON DELETE SET NULL,
  weight_kg DECIMAL(8,3) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW waste_student_summary AS
SELECT
  student_name,
  student_class,
  COUNT(*) as total_transactions,
  SUM(weight_kg) as total_weight,
  SUM(amount) as total_amount
FROM waste_transactions
GROUP BY student_name, student_class
ORDER BY total_amount DESC;

ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read waste_categories" ON waste_categories FOR SELECT USING (true);
CREATE POLICY "Auth manage waste_categories" ON waste_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read waste_transactions" ON waste_transactions FOR SELECT USING (true);
CREATE POLICY "Auth manage waste_transactions" ON waste_transactions FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO waste_categories (name, price_per_kg, icon, color, order_position) VALUES
  ('ขวดพลาสติก', 5.00, '🍾', 'blue', 1),
  ('กระดาษ', 2.00, '📄', 'yellow', 2),
  ('โลหะ/อะลูมิเนียม', 15.00, '🔩', 'gray', 3),
  ('แก้ว', 1.00, '🫙', 'cyan', 4),
  ('ขยะทั่วไปรีไซเคิล', 1.00, '♻️', 'green', 5)
ON CONFLICT DO NOTHING;
