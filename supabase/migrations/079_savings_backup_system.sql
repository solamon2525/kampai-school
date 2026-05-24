-- ============================================================================
-- Migration 079: Savings Bank Backup & Disaster Recovery System
-- ============================================================================

-- 1) Create savings_backups table for internal daily snapshots
CREATE TABLE IF NOT EXISTS public.savings_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_savers INTEGER NOT NULL DEFAULT 0,
  total_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  backup_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system'
);

-- Enable RLS
ALTER TABLE public.savings_backups ENABLE ROW LEVEL SECURITY;

-- Allow admin & teachers with savings-bank menu permission full access
CREATE POLICY "manage_backups" ON public.savings_backups
  FOR ALL USING (public.is_admin() OR public.has_menu_permission('savings-bank'))
  WITH CHECK (public.is_admin() OR public.has_menu_permission('savings-bank'));

-- 2) Seed default global settings into school_settings
INSERT INTO public.school_settings (key, value, category, description)
VALUES 
  ('savings_backup_frequency', '7', 'savings_bank', 'ความถี่ในการส่งออกสำรองข้อมูลภายนอก (7, 15, 30 วัน)'),
  ('savings_backup_teacher_email', '', 'savings_bank', 'อีเมลคุณครูผู้รับผิดชอบระบบสำรองข้อมูลสำหรับรับรายงาน'),
  ('savings_backup_teacher_id', '', 'savings_bank', 'ID ของครูผู้รับผิดชอบจากตาราง staff'),
  ('savings_backup_enabled', 'true', 'savings_bank', 'เปิดใช้งานระบบส่งออกสำรองข้อมูลอัตโนมัติ')
ON CONFLICT (key) DO UPDATE 
SET 
  category = EXCLUDED.category,
  description = EXCLUDED.description;
