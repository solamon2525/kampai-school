-- ============================================================================
-- Migration 073: Realtime Permissions Propagation
-- ============================================================================
-- 1) เพิ่ม user_roles ลงใน supabase_realtime publication (หากยังไม่ได้เพิ่ม)
-- 2) เพิ่ม user_menu_permissions ลงใน supabase_realtime publication (หากยังไม่ได้เพิ่ม)
-- ============================================================================

DO $$
BEGIN
  -- 1. เพิ่มตาราง user_roles ลงใน Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    -- ตรวจสอบก่อนว่ามี Publication ชื่อ supabase_realtime หรือไม่
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
    ELSE
      CREATE PUBLICATION supabase_realtime FOR TABLE public.user_roles;
    END IF;
  END IF;

  -- 2. เพิ่มตาราง user_menu_permissions ลงใน Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_menu_permissions'
  ) THEN
    -- ตรวจสอบก่อนว่ามี Publication ชื่อ supabase_realtime หรือไม่
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_menu_permissions;
    ELSE
      -- หากพึ่งถูกสร้างในขั้นตอนก่อนหน้า ให้ทำการ ADD แทน
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_menu_permissions;
    END IF;
  END IF;
END;
$$;
