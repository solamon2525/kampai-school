-- =============================================
-- FIX 008: Drop and Recreate Contact Messages Table
-- Run this if you encounter "column is_read does not exist" error
-- =============================================

-- 1. Drop the table if it exists (to clear old schema)
DROP TABLE IF EXISTS public.contact_messages;

-- 2. Recreate the table with the correct schema
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE public.contact_messages IS 'ตารางเก็บข้อความจากฟอร์มติดต่อเรา';
COMMENT ON COLUMN public.contact_messages.is_read IS 'สถานะการอ่านข้อความ';

-- 3. RLS Policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view messages"
  ON public.contact_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can update messages"
  ON public.contact_messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete messages"
  ON public.contact_messages
  FOR DELETE
  USING (true);

-- 4. Trigger for updated_at
-- (Assuming public.update_updated_at_column() already exists from previous migrations)
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Indexes
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages(is_read);
