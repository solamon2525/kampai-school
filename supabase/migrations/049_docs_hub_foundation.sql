-- ============================================================================
-- Migration 049: Docs Hub Foundation
-- ============================================================================
-- 1) doc_category_meta — table หมวดเอกสาร (15 หมวด) สำหรับ landing grid
-- 2) v_docs_hub_kpi    — VIEW รวม KPI ribbon (active/pending/urgent/monthly)
-- 3) v_urgent_documents — VIEW union ของ urgent: incoming ด่วน + outgoing รอลงนาม
--                          + leave รออนุมัติ
-- ============================================================================

-- ---------- 1. doc_category_meta ----------
CREATE TABLE IF NOT EXISTS public.doc_category_meta (
  key          TEXT PRIMARY KEY,
  label        TEXT NOT NULL,
  emoji        TEXT,
  icon_name    TEXT NOT NULL,             -- ชื่อ Lucide icon (e.g. 'Mailbox')
  route        TEXT NOT NULL,             -- route ใน /admin/dashboard/*
  color_class  TEXT NOT NULL DEFAULT 'primary',
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_category_meta_sort ON public.doc_category_meta(sort_order);

ALTER TABLE public.doc_category_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_doc_category_meta" ON public.doc_category_meta;
CREATE POLICY "public_read_doc_category_meta"
  ON public.doc_category_meta FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_write_doc_category_meta" ON public.doc_category_meta;
CREATE POLICY "admin_write_doc_category_meta"
  ON public.doc_category_meta FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 2. Seed 15 categories ----------
INSERT INTO public.doc_category_meta (key, label, emoji, icon_name, route, color_class, description, sort_order)
VALUES
  ('saraban',         'งานสารบรรณ',           '📨', 'Mailbox',       '/admin/dashboard/saraban',         'primary',     'หนังสือรับ-ส่ง คำสั่ง ประกาศ',          10),
  ('incoming',        'หนังสือรับเข้า',        '📬', 'MailOpen',      '/admin/dashboard/incoming-letters','info',        'ทะเบียนหนังสือรับ',                    20),
  ('outgoing',        'หนังสือส่งออก',         '📤', 'SendHorizontal','/admin/dashboard/outgoing-letters','success',     'ทะเบียนหนังสือส่ง',                    30),
  ('orders',          'คำสั่ง / ประกาศ',       '📝', 'Stamp',         '/admin/dashboard/orders',          'accent',      'คำสั่งโรงเรียน ประกาศ บันทึกข้อความ',   40),
  ('meetings',        'การประชุม',             '🤝', 'CalendarCheck', '/admin/dashboard/meetings',        'primary',     'นัดประชุม วาระ มติที่ประชุม',           50),
  ('training',        'อบรม / พัฒนา',          '🎓', 'BookMarked',    '/admin/dashboard/training',        'success',     'การพัฒนาบุคลากร 60 ชม./ปี',             60),
  ('leave',           'การลา / ไปราชการ',      '🏖️', 'UserX',         '/admin/dashboard/leave',           'warning',     'ทะเบียนคุมวันลา ขออนุมัติ',             70),
  ('pa',              'ว.PA / ประเมินครู',     '📋', 'Award',         '/admin/dashboard/pa',              'accent',      'ID Plan ประเมิน PA สังเกตการสอน',       80),
  ('budget',          'การเงิน / งบประมาณ',    '💰', 'Wallet',        '/admin/dashboard/budget',          'success',     'งบทั้งปี เบิกจ่าย ผูกพัน',              90),
  ('students',        'เอกสารนักเรียน',        '👦', 'GraduationCap', '/admin/dashboard/student-docs',    'info',        'ทะเบียน ปพ. SDQ เยี่ยมบ้าน',           100),
  ('sar',             'SAR / ประกันคุณภาพ',    '📊', 'ClipboardCheck','/admin/dashboard/sar',             'primary',     '3 มาตรฐาน + หลักฐาน',                  110),
  ('ics',             'ควบคุมภายใน (ICS)',     '🛡️', 'ShieldCheck',   '/admin/dashboard/ics',             'info',        'ปย.1 ปย.2 ปย.3',                       120),
  ('action_plan',     'แผนปฏิบัติการ',         '🎯', 'Target',        '/admin/dashboard/action-plan',     'accent',      '12 โครงการ ตามกลยุทธ์',                130),
  ('doc_templates',   'แบบฟอร์มสำเร็จรูป',     '📄', 'FileText',      '/admin/dashboard/doc-templates',   'muted',       'หนังสือราชการ ใบลา เกียรติบัตร',        140),
  ('documents',       'จัดการเอกสาร',           '📁', 'FolderOpen',    '/admin/dashboard/documents',       'muted',       'อัปโหลด/ดาวน์โหลดไฟล์ทั่วไป',          150)
ON CONFLICT (key) DO UPDATE SET
  label        = EXCLUDED.label,
  emoji        = EXCLUDED.emoji,
  icon_name    = EXCLUDED.icon_name,
  route        = EXCLUDED.route,
  color_class  = EXCLUDED.color_class,
  description  = EXCLUDED.description,
  sort_order   = EXCLUDED.sort_order;

-- ---------- 3. v_docs_hub_kpi VIEW ----------
-- รวม count สด ๆ จากตารางที่มีอยู่ — Hub landing แสดงเป็น KPI ribbon
CREATE OR REPLACE VIEW public.v_docs_hub_kpi AS
SELECT
  -- เอกสารที่ active (ทุก saraban ภายในเดือนนี้)
  (SELECT COUNT(*) FROM public.incoming_letters
   WHERE received_date >= DATE_TRUNC('month', CURRENT_DATE))
  + (SELECT COUNT(*) FROM public.outgoing_letters
     WHERE sent_date >= DATE_TRUNC('month', CURRENT_DATE))
  AS active_this_month,

  -- งานรอดำเนินการ (incoming + outgoing + leave pending)
  (SELECT COUNT(*) FROM public.incoming_letters
   WHERE status IN ('รอดำเนินการ','กำลังดำเนินการ'))
  + (SELECT COUNT(*) FROM public.outgoing_letters
     WHERE status IN ('ร่าง','รอลงนาม'))
  + (SELECT COUNT(*) FROM public.leave_requests
     WHERE status = 'รออนุมัติ')
  AS pending_count,

  -- ด่วน
  (SELECT COUNT(*) FROM public.incoming_letters
   WHERE priority IN ('ด่วน','ด่วนมาก','ด่วนที่สุด')
     AND status <> 'เสร็จแล้ว')
  AS urgent_count,

  -- meeting ใน 7 วันข้างหน้า
  (SELECT COUNT(*) FROM public.meetings
   WHERE meeting_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
  AS upcoming_meetings,

  -- การอบรมเดือนนี้
  (SELECT COUNT(*) FROM public.training_records
   WHERE start_date >= DATE_TRUNC('month', CURRENT_DATE))
  AS training_this_month,

  -- หนังสือส่งเดือนนี้
  (SELECT COUNT(*) FROM public.outgoing_letters
   WHERE sent_date >= DATE_TRUNC('month', CURRENT_DATE))
  AS outgoing_this_month;

GRANT SELECT ON public.v_docs_hub_kpi TO authenticated;

-- ---------- 4. v_urgent_documents VIEW ----------
-- รายการ urgent unified: incoming priority ด่วน + outgoing รอลงนาม + leave รออนุมัติ
CREATE OR REPLACE VIEW public.v_urgent_documents AS
  SELECT
    'incoming'::TEXT       AS entity_type,
    il.id                  AS entity_id,
    il.subject             AS title,
    il.sender              AS subtitle,
    il.priority            AS badge,
    il.status              AS status,
    il.received_date       AS doc_date,
    il.due_date            AS due_date,
    NULL::UUID             AS staff_id,
    il.created_at
  FROM public.incoming_letters il
  WHERE il.priority IN ('ด่วน','ด่วนมาก','ด่วนที่สุด')
    AND il.status <> 'เสร็จแล้ว'
UNION ALL
  SELECT
    'outgoing'::TEXT,
    ol.id,
    ol.subject,
    ol.recipient,
    ol.priority,
    ol.status,
    ol.sent_date,
    NULL::DATE,
    NULL::UUID,
    ol.created_at
  FROM public.outgoing_letters ol
  WHERE ol.status = 'รอลงนาม'
UNION ALL
  SELECT
    'leave'::TEXT,
    lr.id,
    lr.leave_type || ' — ' || s.name AS title,
    lr.reason,
    'pending'::TEXT,
    lr.status,
    lr.start_date,
    lr.end_date,
    lr.staff_id,
    lr.created_at
  FROM public.leave_requests lr
  LEFT JOIN public.staff s ON s.id = lr.staff_id
  WHERE lr.status = 'รออนุมัติ';

GRANT SELECT ON public.v_urgent_documents TO authenticated;
