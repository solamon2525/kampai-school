-- 430: lesson_packs — ชุดคาบพร้อมใช้ (สื่อ → ใบงาน → เฉลย)
-- RLS แบบ worksheet_sets: เจ้าของ/แอดมิน เขียน · SELECT = เจ้าของ/แอดมิน หรือ access='link'

CREATE TABLE IF NOT EXISTS public.lesson_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id  UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  pack_key        TEXT NOT NULL,
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '',
  grade_label     TEXT NOT NULL DEFAULT '',
  steps           JSONB NOT NULL DEFAULT '[]'::jsonb,
  access          TEXT NOT NULL DEFAULT 'link'
                    CHECK (access IN ('private', 'link')),
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_staff_id, pack_key)
);

CREATE INDEX IF NOT EXISTS idx_lesson_packs_owner_sort
  ON public.lesson_packs (owner_staff_id, sort_order, created_at DESC);

COMMENT ON TABLE public.lesson_packs IS
  'Ready-to-run classroom packs: ordered steps of media/worksheet/note for one lesson';

ALTER TABLE public.lesson_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_packs_select" ON public.lesson_packs;
DROP POLICY IF EXISTS "lesson_packs_insert" ON public.lesson_packs;
DROP POLICY IF EXISTS "lesson_packs_update" ON public.lesson_packs;
DROP POLICY IF EXISTS "lesson_packs_delete" ON public.lesson_packs;

CREATE POLICY "lesson_packs_select" ON public.lesson_packs
  FOR SELECT USING (
    access = 'link'
    OR public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "lesson_packs_insert" ON public.lesson_packs
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "lesson_packs_update" ON public.lesson_packs
  FOR UPDATE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "lesson_packs_delete" ON public.lesson_packs
  FOR DELETE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Seed 5 starter packs for hub owner (ครูณัฐพงศ์)
DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_staff_id IS NULL THEN
    RAISE NOTICE '430: skip seed lesson_packs (no teaching staff)';
    RETURN;
  END IF;

  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  VALUES
  (
    v_staff_id, 'multiplication',
    'คาบคูณ — สอน · ฝึก · ใบงาน',
    'คณิตศาสตร์', 'ป.3–6', 10, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"นักเรียนคูณได้และอธิบายวิธีคิดสั้น ๆ"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/math/multiplication-thinking-media.html","hint":"โหมดสอน → ฝึกสั้น MCQ"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/math/multiplication-worksheet.html","worksheet_key":"multiplication","hint":"5 ข้อ/หน้า · บันทึกชุดถ้าต้องการ"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/math/multiplication-worksheet.html?present=1","hint":"เปิดใบงานโหมดโปรเจคเตอร์ + เฉลยทีละข้อ"}
    ]'::jsonb
  ),
  (
    v_staff_id, 'short-division',
    'คาบหารสั้น — สอน · ฝึก · ใบงาน',
    'คณิตศาสตร์', 'ป.4–6', 20, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"ตั้งหารสั้นและตรวจด้วยคูณ"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/math/short-division-thinking-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/math/short-division-worksheet.html","worksheet_key":"short-division","hint":"ใช้กระดานหารสั้น"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/math/short-division-worksheet.html?present=1","hint":"present=1 + เฉลยทีละข้อ"}
    ]'::jsonb
  ),
  (
    v_staff_id, 'phonics',
    'คาบ Phonics — สอน · ฝึก · ใบงาน',
    'ภาษาอังกฤษ', 'ป.1–3', 30, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"จับคู่เสียงกับคำขึ้นต้น"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/english/phonics-media.html","hint":"เรียนรู้ → ฝึก"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/english/phonics-worksheet.html","worksheet_key":"phonics","hint":"สแกน QR ฟังเสียงจากสื่อ"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/english/phonics-worksheet.html?present=1","hint":"เปิดโหมดโปรเจคเตอร์"}
    ]'::jsonb
  ),
  (
    v_staff_id, 'food-chain',
    'คาบห่วงโซ่อาหาร — สอน · ฝึก · ใบงาน',
    'วิทยาศาสตร์', 'ป.4–6', 40, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"อธิบายผู้ผลิต–ผู้บริโภค–ทิศพลังงาน"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/science/food-chain-media.html","hint":"สอน → เรียงโซ่ → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/science/food-chain-worksheet.html","worksheet_key":"food-chain","hint":"เขียนลำดับและเหตุผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/science/food-chain-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  ),
  (
    v_staff_id, 'sufficiency',
    'คาบเศรษฐกิจพอเพียง — สอน · ฝึก · ใบงาน',
    'สังคมศึกษา', 'ป.4–6', 50, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"พอประมาณ มีเหตุผล มีภูมิคุ้มกัน"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/social/sufficiency-media.html","hint":"เรียนรู้ → สถานการณ์ → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/social/sufficiency-worksheet.html","worksheet_key":"sufficiency","hint":"เลือกทางเลือกและให้เหตุผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/social/sufficiency-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  )
  ON CONFLICT (owner_staff_id, pack_key) DO UPDATE SET
    title = EXCLUDED.title,
    subject = EXCLUDED.subject,
    grade_label = EXCLUDED.grade_label,
    steps = EXCLUDED.steps,
    sort_order = EXCLUDED.sort_order,
    access = EXCLUDED.access,
    updated_at = now();
END $$;
