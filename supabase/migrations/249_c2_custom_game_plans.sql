-- Migration 249: Custom C2 Game Builder Plans Table
-- สร้างตารางสำหรับเก็บเซสชั่นสมุดบันทึกขั้นตอนสร้างเกมส่วนตัว

CREATE TABLE IF NOT EXISTS public.c2_custom_game_plans (
    id TEXT PRIMARY KEY DEFAULT 'default_plan',
    project_name TEXT NOT NULL DEFAULT 'เกม Red Hood ของฉัน',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิด Row Level Security (RLS)
ALTER TABLE public.c2_custom_game_plans ENABLE ROW LEVEL SECURITY;

-- ลบ policy เดิมหากมี
DROP POLICY IF EXISTS "Allow public select c2 plans" ON public.c2_custom_game_plans;
DROP POLICY IF EXISTS "Allow public insert/update c2 plans" ON public.c2_custom_game_plans;

-- สร้าง RLS Policy ให้ทุกคนอ่าน เขียน แก้ไขได้สะดวก
CREATE POLICY "Allow public select c2 plans"
ON public.c2_custom_game_plans FOR SELECT
USING (true);

CREATE POLICY "Allow public insert/update c2 plans"
ON public.c2_custom_game_plans FOR ALL
USING (true)
WITH CHECK (true);
