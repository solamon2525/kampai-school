-- ============================================================================
-- Migration 594: School Egg Farm Management System (ระบบฟาร์มไก่ไข่โรงเรียน)
-- ============================================================================

-- 1. Egg settings (ราคาไข่และข้อมูลพื้นฐานฟาร์ม)
CREATE TABLE IF NOT EXISTS public.egg_settings (
  id text PRIMARY KEY DEFAULT 'default',
  price_per_egg numeric(10, 2) NOT NULL DEFAULT 5.00 CHECK (price_per_egg >= 0),
  price_per_tray numeric(10, 2) NOT NULL DEFAULT 150.00 CHECK (price_per_tray >= 0),
  eggs_per_tray integer NOT NULL DEFAULT 30 CHECK (eggs_per_tray > 0),
  flock_size integer NOT NULL DEFAULT 0 CHECK (flock_size >= 0),
  updated_by_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  updated_by_administrator_id uuid REFERENCES public.administrators(id) ON DELETE SET NULL,
  updated_by_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.egg_settings (id, price_per_egg, price_per_tray, eggs_per_tray, flock_size)
VALUES ('default', 5.00, 150.00, 30, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Egg collections (บันทึกการเก็บไข่ประจำวัน)
CREATE TABLE IF NOT EXISTS public.egg_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  period text NOT NULL DEFAULT 'เช้า' CHECK (period IN ('เช้า', 'บ่าย', 'ทั้งวัน')),
  good_eggs integer NOT NULL DEFAULT 0 CHECK (good_eggs >= 0),
  cracked_eggs integer NOT NULL DEFAULT 0 CHECK (cracked_eggs >= 0),
  spoiled_eggs integer NOT NULL DEFAULT 0 CHECK (spoiled_eggs >= 0),
  total_eggs integer GENERATED ALWAYS AS (good_eggs + cracked_eggs + spoiled_eggs) STORED,
  note text,
  recorder_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  recorder_administrator_id uuid REFERENCES public.administrators(id) ON DELETE SET NULL,
  recorder_name text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT egg_collections_positive_total CHECK (good_eggs + cracked_eggs + spoiled_eggs > 0)
);

CREATE INDEX IF NOT EXISTS idx_egg_collections_date
  ON public.egg_collections (collected_date DESC, created_at DESC);

-- 3. Egg sales (บันทึกการขายไข่และสรุปยอดขาย)
CREATE TABLE IF NOT EXISTS public.egg_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  unit_type text NOT NULL DEFAULT 'ฟอง' CHECK (unit_type IN ('ฟอง', 'แผง')),
  quantity integer NOT NULL CHECK (quantity > 0),
  eggs_count integer NOT NULL CHECK (eggs_count > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  buyer_name text,
  payment_method text NOT NULL DEFAULT 'เงินสด' CHECK (payment_method IN ('เงินสด', 'โอนเงิน', 'ค้างชำระ')),
  note text,
  recorder_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  recorder_administrator_id uuid REFERENCES public.administrators(id) ON DELETE SET NULL,
  recorder_name text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_egg_sales_date
  ON public.egg_sales (sale_date DESC, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.egg_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_sales ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Admin & Teacher can view and manage)
CREATE POLICY "staff_read_egg_settings"
  ON public.egg_settings FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_update_egg_settings"
  ON public.egg_settings FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()))
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_insert_egg_settings"
  ON public.egg_settings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_read_egg_collections"
  ON public.egg_collections FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_insert_egg_collections"
  ON public.egg_collections FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_update_egg_collections"
  ON public.egg_collections FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()))
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_delete_egg_collections"
  ON public.egg_collections FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_read_egg_sales"
  ON public.egg_sales FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_insert_egg_sales"
  ON public.egg_sales FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_update_egg_sales"
  ON public.egg_sales FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()))
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));

CREATE POLICY "staff_delete_egg_sales"
  ON public.egg_sales FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));
