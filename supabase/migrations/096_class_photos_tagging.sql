-- ===============================================================
-- Migration 096: Class Photos with Face Tagging
-- ===============================================================
-- Staff uploads group photo, clicks faces to tag students. Parents see
-- only photos for their child's class AND only tag for their own child
-- (PDPA: don't expose tags of other children).

CREATE TABLE IF NOT EXISTS public.class_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  class text NOT NULL,
  room text,
  photo_url text NOT NULL,
  taken_at date,
  caption text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_photos_class ON public.class_photos(class, room, taken_at DESC);

CREATE TABLE IF NOT EXISTS public.class_photo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.class_photos(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  x_pct numeric(5, 2) NOT NULL CHECK (x_pct >= 0 AND x_pct <= 100),
  y_pct numeric(5, 2) NOT NULL CHECK (y_pct >= 0 AND y_pct <= 100),
  radius_pct numeric(5, 2) NOT NULL DEFAULT 4.0 CHECK (radius_pct > 0 AND radius_pct <= 30),
  tagged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_tags_photo ON public.class_photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_tags_student ON public.class_photo_tags(student_id);

ALTER TABLE public.class_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_photo_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_class_photos" ON public.class_photos;
CREATE POLICY "staff_manage_class_photos" ON public.class_photos
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_class_photos" ON public.class_photos;
CREATE POLICY "parent_read_class_photos" ON public.class_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      JOIN public.students s ON s.id = psl.student_id
      WHERE psl.user_id = auth.uid() AND s.class = class_photos.class
    )
  );

DROP POLICY IF EXISTS "staff_manage_tags" ON public.class_photo_tags;
CREATE POLICY "staff_manage_tags" ON public.class_photo_tags
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_own_child_tags" ON public.class_photo_tags;
CREATE POLICY "parent_read_own_child_tags" ON public.class_photo_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = class_photo_tags.student_id)
  );

COMMENT ON TABLE public.class_photos IS 'Group photos per class — staff uploads, parent reads photos for own child class';
COMMENT ON TABLE public.class_photo_tags IS 'Click-to-tag positions per student (x/y/radius as percent). Parent sees only own child tags.';
