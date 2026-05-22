-- ============================================================================
-- Migration 072: Dynamic Menu Permissions & RLS Updates
-- ============================================================================
-- 1) สร้างตาราง user_menu_permissions
-- 2) สร้างฟังก์ชันตรวจสอบสิทธิ์กลาง public.has_menu_permission(text)
-- 3) ปรับปรุง RLS Policies ของตารางต่าง ๆ เพื่อเช็คสิทธิ์ตามเมนู
-- ============================================================================

-- ---------- 1. user_menu_permissions Table ----------
CREATE TABLE IF NOT EXISTS public.user_menu_permissions (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_ids    TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เปิดใช้งาน RLS สำหรับตารางใหม่
ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;

-- นโยบายสำหรับ user_menu_permissions
DROP POLICY IF EXISTS "admin_manage_menu_permissions" ON public.user_menu_permissions;
CREATE POLICY "admin_manage_menu_permissions"
  ON public.user_menu_permissions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_read_own_menu_permissions" ON public.user_menu_permissions;
CREATE POLICY "user_read_own_menu_permissions"
  ON public.user_menu_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- ---------- 2. Helper function: has_menu_permission ----------
CREATE OR REPLACE FUNCTION public.has_menu_permission(menu_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    -- แอดมินหลักมีสิทธิ์เข้าถึงทุกเมนูโดยอัตโนมัติ
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    -- ครู/ผู้ใช้ที่มีสิทธิ์ตามที่แอดมินกำหนด
    SELECT 1 FROM public.user_menu_permissions
    WHERE user_id = auth.uid() AND menu_id = ANY(menu_ids)
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_menu_permission(TEXT) TO anon, authenticated;

-- ---------- 3. Update RLS Policies on Key Tables ----------

-- ── 3.1 งานสารบรรณ (incoming_letters, outgoing_letters, orders_announcements, meetings, letter_tracking_logs) ──

-- incoming_letters
DROP POLICY IF EXISTS "admin_manage_incoming_letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "dynamic_manage_incoming_letters" ON public.incoming_letters;
CREATE POLICY "dynamic_manage_incoming_letters" ON public.incoming_letters
  FOR ALL USING (public.has_menu_permission('saraban') OR public.has_menu_permission('incoming-letters'))
  WITH CHECK (public.has_menu_permission('saraban') OR public.has_menu_permission('incoming-letters'));

-- outgoing_letters
DROP POLICY IF EXISTS "admin_manage_outgoing_letters" ON public.outgoing_letters;
DROP POLICY IF EXISTS "dynamic_manage_outgoing_letters" ON public.outgoing_letters;
CREATE POLICY "dynamic_manage_outgoing_letters" ON public.outgoing_letters
  FOR ALL USING (public.has_menu_permission('saraban') OR public.has_menu_permission('outgoing-letters'))
  WITH CHECK (public.has_menu_permission('saraban') OR public.has_menu_permission('outgoing-letters'));

-- orders_announcements (เมนูคำสั่ง/ประกาศ)
DROP POLICY IF EXISTS "admin_manage_orders_announcements" ON public.orders_announcements;
DROP POLICY IF EXISTS "dynamic_manage_orders_announcements" ON public.orders_announcements;
CREATE POLICY "dynamic_manage_orders_announcements" ON public.orders_announcements
  FOR ALL USING (public.has_menu_permission('saraban') OR public.has_menu_permission('orders'))
  WITH CHECK (public.has_menu_permission('saraban') OR public.has_menu_permission('orders'));

-- meetings (การประชุม)
DROP POLICY IF EXISTS "admin_manage_meetings" ON public.meetings;
DROP POLICY IF EXISTS "dynamic_manage_meetings" ON public.meetings;
CREATE POLICY "dynamic_manage_meetings" ON public.meetings
  FOR ALL USING (public.has_menu_permission('saraban') OR public.has_menu_permission('meetings'))
  WITH CHECK (public.has_menu_permission('saraban') OR public.has_menu_permission('meetings'));

-- letter_tracking_logs
DROP POLICY IF EXISTS "admin_manage_letter_tracking_logs" ON public.letter_tracking_logs;
DROP POLICY IF EXISTS "dynamic_manage_letter_tracking_logs" ON public.letter_tracking_logs;
CREATE POLICY "dynamic_manage_letter_tracking_logs" ON public.letter_tracking_logs
  FOR ALL USING (public.has_menu_permission('saraban') OR public.is_admin())
  WITH CHECK (public.has_menu_permission('saraban') OR public.is_admin());


-- ── 3.2 การเงิน / งบประมาณ (budget_categories, budget_transactions) ──

-- budget_categories
DROP POLICY IF EXISTS "admin_manage_budget_categories" ON public.budget_categories;
DROP POLICY IF EXISTS "dynamic_manage_budget_categories" ON public.budget_categories;
CREATE POLICY "dynamic_manage_budget_categories" ON public.budget_categories
  FOR ALL USING (public.has_menu_permission('budget'))
  WITH CHECK (public.has_menu_permission('budget'));

-- budget_transactions
DROP POLICY IF EXISTS "admin_manage_budget_transactions" ON public.budget_transactions;
DROP POLICY IF EXISTS "dynamic_manage_budget_transactions" ON public.budget_transactions;
CREATE POLICY "dynamic_manage_budget_transactions" ON public.budget_transactions
  FOR ALL USING (public.has_menu_permission('budget'))
  WITH CHECK (public.has_menu_permission('budget'));


-- ── 3.3 SAR ประกันคุณภาพ (sar_standards, sar_indicators, sar_assessments, sar_evidence_files) ──

-- sar_standards
DROP POLICY IF EXISTS "admin_write_sar_standards" ON public.sar_standards;
DROP POLICY IF EXISTS "dynamic_write_sar_standards" ON public.sar_standards;
CREATE POLICY "dynamic_write_sar_standards" ON public.sar_standards
  FOR ALL USING (public.has_menu_permission('sar'))
  WITH CHECK (public.has_menu_permission('sar'));

-- sar_indicators
DROP POLICY IF EXISTS "admin_write_sar_indicators" ON public.sar_indicators;
DROP POLICY IF EXISTS "dynamic_write_sar_indicators" ON public.sar_indicators;
CREATE POLICY "dynamic_write_sar_indicators" ON public.sar_indicators
  FOR ALL USING (public.has_menu_permission('sar'))
  WITH CHECK (public.has_menu_permission('sar'));

-- sar_assessments
DROP POLICY IF EXISTS "admin_write_sar_assessments" ON public.sar_assessments;
DROP POLICY IF EXISTS "dynamic_write_sar_assessments" ON public.sar_assessments;
CREATE POLICY "dynamic_write_sar_assessments" ON public.sar_assessments
  FOR ALL USING (public.has_menu_permission('sar'))
  WITH CHECK (public.has_menu_permission('sar'));

-- sar_evidence_files
DROP POLICY IF EXISTS "admin_write_sar_evidence" ON public.sar_evidence_files;
DROP POLICY IF EXISTS "dynamic_write_sar_evidence" ON public.sar_evidence_files;
CREATE POLICY "dynamic_write_sar_evidence" ON public.sar_evidence_files
  FOR ALL USING (public.has_menu_permission('sar'))
  WITH CHECK (public.has_menu_permission('sar'));


-- ── 3.4 ควบคุมภายใน ICS (ics_forms) ──

-- ics_forms
DROP POLICY IF EXISTS "admin_manage_ics_forms" ON public.ics_forms;
DROP POLICY IF EXISTS "dynamic_manage_ics_forms" ON public.ics_forms;
CREATE POLICY "dynamic_manage_ics_forms" ON public.ics_forms
  FOR ALL USING (public.has_menu_permission('ics'))
  WITH CHECK (public.has_menu_permission('ics'));


-- ── 3.5 แผนปฏิบัติการ (action_plan_projects, action_plan_milestones) ──

-- action_plan_projects
DROP POLICY IF EXISTS "admin_manage_action_plan_projects" ON public.action_plan_projects;
DROP POLICY IF EXISTS "dynamic_manage_action_plan_projects" ON public.action_plan_projects;
CREATE POLICY "dynamic_manage_action_plan_projects" ON public.action_plan_projects
  FOR ALL USING (public.has_menu_permission('action-plan'))
  WITH CHECK (public.has_menu_permission('action-plan'));

-- action_plan_milestones
DROP POLICY IF EXISTS "admin_manage_action_plan_milestones" ON public.action_plan_milestones;
DROP POLICY IF EXISTS "dynamic_manage_action_plan_milestones" ON public.action_plan_milestones;
CREATE POLICY "dynamic_manage_action_plan_milestones" ON public.action_plan_milestones
  FOR ALL USING (public.has_menu_permission('action-plan'))
  WITH CHECK (public.has_menu_permission('action-plan'));


-- ── 3.6 แบบฟอร์มสำเร็จรูป (doc_template_definitions) ──

-- doc_template_definitions
DROP POLICY IF EXISTS "admin_write_doc_template_definitions" ON public.doc_template_definitions;
DROP POLICY IF EXISTS "dynamic_write_doc_template_definitions" ON public.doc_template_definitions;
CREATE POLICY "dynamic_write_doc_template_definitions" ON public.doc_template_definitions
  FOR ALL USING (public.has_menu_permission('doc-templates'))
  WITH CHECK (public.has_menu_permission('doc-templates'));


-- ── 3.7 จัดการเอกสารทั่วไป (document_categories, documents) ──

-- document_categories
DROP POLICY IF EXISTS "admin_manage_doc_categories" ON public.document_categories;
DROP POLICY IF EXISTS "dynamic_manage_doc_categories" ON public.document_categories;
CREATE POLICY "dynamic_manage_doc_categories" ON public.document_categories
  FOR ALL USING (public.has_menu_permission('documents'))
  WITH CHECK (public.has_menu_permission('documents'));

-- documents
DROP POLICY IF EXISTS "admin_manage_documents" ON public.documents;
DROP POLICY IF EXISTS "dynamic_manage_documents" ON public.documents;
CREATE POLICY "dynamic_manage_documents" ON public.documents
  FOR ALL USING (public.has_menu_permission('documents'))
  WITH CHECK (public.has_menu_permission('documents'));


-- ── 3.8 ธนาคารขยะ (waste_transactions) ──

-- waste_transactions
DROP POLICY IF EXISTS "admin_manage_waste_transactions" ON public.waste_transactions;
DROP POLICY IF EXISTS "dynamic_manage_waste_transactions" ON public.waste_transactions;
CREATE POLICY "dynamic_manage_waste_transactions" ON public.waste_transactions
  FOR ALL USING (public.has_menu_permission('waste-bank'))
  WITH CHECK (public.has_menu_permission('waste-bank'));


-- ── 3.9 ข้อมูลโรงเรียน & แดชบอร์ดโรงเรียน (school_dashboard_entries) ──

-- school_dashboard_entries
DROP POLICY IF EXISTS "admin_insert_school_dashboard" ON public.school_dashboard_entries;
DROP POLICY IF EXISTS "admin_update_school_dashboard" ON public.school_dashboard_entries;
DROP POLICY IF EXISTS "admin_delete_school_dashboard" ON public.school_dashboard_entries;
DROP POLICY IF EXISTS "admin_read_school_dashboard" ON public.school_dashboard_entries;

DROP POLICY IF EXISTS "dynamic_manage_school_dashboard" ON public.school_dashboard_entries;
CREATE POLICY "dynamic_manage_school_dashboard" ON public.school_dashboard_entries
  FOR ALL USING (public.has_menu_permission('dashboard-school') OR public.has_menu_permission('settings'))
  WITH CHECK (public.has_menu_permission('dashboard-school') OR public.has_menu_permission('settings'));
