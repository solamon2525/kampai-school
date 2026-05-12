-- ===============================================================
-- Migration 025: User Quick Menu Preferences
-- เก็บการตั้งค่า "เมนูลัด" ที่ user (ครู/แอดมิน) เลือกเองบน dashboard
-- รองรับทั้ง 2 context (admin dashboard + teacher portal)
-- ===============================================================

CREATE TABLE IF NOT EXISTS user_quick_menu_preferences (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context       TEXT NOT NULL CHECK (context IN ('admin', 'teacher')),
  menu_item_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, context)
);

ALTER TABLE user_quick_menu_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quick menu"
  ON user_quick_menu_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
