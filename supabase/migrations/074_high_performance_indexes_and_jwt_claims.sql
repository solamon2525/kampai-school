-- ============================================================================
-- Migration 074: High-Performance Database Indexes & JWT Claims Caching
-- ============================================================================
-- 1) สร้างดัชนีคีย์นอก (Foreign Key Indexes) เพื่อความเร็วระดับมิลลิวินาที
-- 2) สร้างระบบอัตโนมัติเพื่อซิงค์บทบาทและสิทธิ์ผู้ใช้ไปยัง JWT app_metadata (O(1) RLS)
-- 3) ปรับปรุงฟังก์ชันสิทธิ์ RLS ให้ประมวลผลผ่าน JWT Claim Caching + ระบบป้องกันสำรอง
-- ============================================================================

-- ---------- 1. High-Performance Database Indexes ----------
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_conduct_scores_student_id ON public.conduct_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_waste_transactions_student_id ON public.waste_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_staff_id ON public.user_roles(staff_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_student_id ON public.user_roles(student_id);

-- ---------- 2. JWT app_metadata Synchronization Functions ----------

-- ทริกเกอร์สำหรับบทบาท (user_roles)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS trigger
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_role text;
  v_staff_id text;
  v_student_id text;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_role := NULL;
    v_staff_id := NULL;
    v_student_id := NULL;
  ELSE
    v_user_id := NEW.user_id;
    v_role := NEW.role::text;
    v_staff_id := NEW.staff_id::text;
    v_student_id := NEW.student_id::text;
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', v_role,
      'staff_id', v_staff_id,
      'student_id', v_student_id
    )
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_role_changed ON public.user_roles;
CREATE TRIGGER on_user_role_changed
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_metadata();


-- ทริกเกอร์สำหรับสิทธิ์เมนู (user_menu_permissions)
CREATE OR REPLACE FUNCTION public.sync_user_menu_permissions_to_metadata()
RETURNS trigger
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_menu_ids jsonb;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_menu_ids := '[]'::jsonb;
  ELSE
    v_user_id := NEW.user_id;
    v_menu_ids := to_jsonb(NEW.menu_ids);
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'menu_ids', v_menu_ids
    )
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_menu_permissions_changed ON public.user_menu_permissions;
CREATE TRIGGER on_user_menu_permissions_changed
AFTER INSERT OR UPDATE OR DELETE ON public.user_menu_permissions
FOR EACH ROW EXECUTE FUNCTION public.sync_user_menu_permissions_to_metadata();


-- ---------- 3. Backfill Existing Users to JWT Claims ----------
DO $$
DECLARE
  r RECORD;
BEGIN
  -- ซิงค์บทบาทเดิม
  FOR r IN SELECT user_id, role::text, staff_id::text, student_id::text FROM public.user_roles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', r.role,
        'staff_id', r.staff_id,
        'student_id', r.student_id
      )
    WHERE id = r.user_id;
  END LOOP;

  -- ซิงค์สิทธิ์เมนูเดิม
  FOR r IN SELECT user_id, menu_ids FROM public.user_menu_permissions LOOP
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'menu_ids', to_jsonb(r.menu_ids)
      )
    WHERE id = r.user_id;
  END LOOP;
END $$;


-- ---------- 4. Turbo-Charged O(1) RLS Helper Functions ----------

-- ตรวจสอบความเป็นแอดมิน (is_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- 1. ดึงจาก JWT Claim (O(1))
  v_role := auth.jwt() -> 'app_metadata' ->> 'role';
  IF v_role IS NOT NULL THEN
    RETURN v_role = 'admin';
  ELSE
    -- 2. ระบบสำรอง (Fallback) ดึงจากฐานข้อมูลตรง
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    );
  END IF;
END;
$$;


-- ตรวจสอบความเป็นครูหรือแอดมิน (is_teacher)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- 1. ดึงจาก JWT Claim (O(1))
  v_role := auth.jwt() -> 'app_metadata' ->> 'role';
  IF v_role IS NOT NULL THEN
    RETURN v_role IN ('teacher', 'admin');
  ELSE
    -- 2. ระบบสำรอง (Fallback) ดึงจากฐานข้อมูลตรง
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text IN ('teacher', 'admin')
    );
  END IF;
END;
$$;


-- ตรวจสอบสิทธิ์เมนูเฉพาะ (has_menu_permission)
CREATE OR REPLACE FUNCTION public.has_menu_permission(menu_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
  v_menu_ids jsonb;
BEGIN
  -- 1. ดึงจาก JWT Claim (O(1))
  v_role := auth.jwt() -> 'app_metadata' ->> 'role';
  v_menu_ids := auth.jwt() -> 'app_metadata' -> 'menu_ids';
  
  IF v_role IS NOT NULL THEN
    IF v_role = 'admin' THEN
      RETURN TRUE;
    ELSIF v_menu_ids IS NOT NULL THEN
      RETURN jsonb_build_array(menu_id) <@ v_menu_ids;
    END IF;
  END IF;

  -- 2. ระบบสำรอง (Fallback) ดึงจากฐานข้อมูลตรง
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_menu_permissions
    WHERE user_id = auth.uid() AND menu_id = ANY(menu_ids)
  );
END;
$$;

-- รีเซ็ตการให้สิทธิ์รันฟังก์ชันแก่ผู้ใช้
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_menu_permission(TEXT) TO anon, authenticated;
