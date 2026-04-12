---
source: https://github.com/solamon2525/kampai-school
ingested_at: 2026-04-11
title: kampai-school – Database Schema
tags: [database, supabase, schema, migrations]
---

# kampai-school – Database Schema

All tables use UUID primary keys with `gen_random_uuid()`. All have `created_at` / `updated_at` timestamps. RLS is enabled on all tables.

## Migrations (run in order)
| File | Tables Created |
|---|---|
| 001_initial_schema | news, news_categories, gallery_albums, gallery_photos |
| 002_events_and_settings | events, school_settings |
| 003_administrators | administrators |
| 004_staff | staff |
| 005_students | student_achievements, student_activities |
| 006_admissions | admissions |
| 007_curriculum | curriculum_programs, curriculum_activities |
| 008_contact_messages | contact_messages |
| 009_news_external_links | adds `external_links JSONB` column to news |
| 010_increment_views | function `increment_news_view(UUID)` — SECURITY DEFINER, ให้ anonymous user increment views ได้โดยไม่ต้องมีสิทธิ์ UPDATE |
| 011_waste_bank | waste_categories, waste_transactions, waste_student_summary (view) |
| 012_attendance | students, attendance_records |
| 013_documents | document_categories, documents; storage bucket `school-documents` |

## Key Table Structures

### news
`id, title, content(TEXT), excerpt, image_url, category, published(bool), published_at, views, is_pinned, sort_order, cover_image_url, external_links(JSONB), created_at, updated_at`

### gallery_albums
`id, name, description, category, cover_image_url, is_published, created_at, updated_at`

### gallery_photos
`id, album_id(FK→gallery_albums), image_url, caption, sort_order, created_at, updated_at`

### events
`id, title, description, event_date(DATE), event_time(TIME), location, category, image_url, status('draft'|'published'|'archived'), created_at, updated_at`

### school_settings
`id, key(UNIQUE), value(TEXT), category, description, created_at, updated_at`  
Used as a key-value store for school configuration (school_name, phone, email, social_media, branding, etc.)

### administrators
`id, name, position, education, quote, photo_url, order_position, created_at, updated_at`

### staff
`id, name, position, department, subject, education, experience, photo_url, staff_type('teaching'|'support'), order_position, created_at, updated_at`

### students (attendance system)
`id, student_code(UNIQUE), name, class, class_number, gender('male'|'female'), parent_name, parent_phone, is_active, created_at, updated_at`

### attendance_records
`id, student_id(FK→students), attendance_date(DATE), status('present'|'absent'|'late'|'leave'), notes, recorded_by, created_at, updated_at`  
UNIQUE constraint on (student_id, attendance_date)

### student_achievements
`id, title, description, year, category, icon, order_position, created_at`

### student_activities
`id, name, members(INT), description, order_position, created_at`

### admissions (enrollment applications)
`id, student_name, student_id_card, birth_date, gender, parent_name, parent_phone, parent_email, address, previous_school, grade_applying, program_applying, status('pending'|'reviewing'|'approved'|'rejected'), notes, created_at, updated_at`

### curriculum_programs
`id, title, description, icon, color, subjects(TEXT[]), careers(TEXT[]), order_position, is_active, created_at, updated_at`

### curriculum_activities
`id, name, description, icon, order_position, is_active, created_at, updated_at`

### contact_messages
`id, name, email, phone, subject, message, is_read(bool), created_at, updated_at`

### waste_categories
`id, name, price_per_kg(DECIMAL), icon, color, is_active, order_position, created_at`

### waste_transactions
`id, student_name, student_class, category_id(FK→waste_categories), weight_kg, amount, transaction_date, notes, recorded_by, created_at`

### document_categories
`id, name, icon, color, order_position, is_active, created_at`

### documents
`id, title, description, category_id(FK), file_url, file_name, file_type, file_size, academic_year, is_published, download_count, sort_order, created_at, updated_at`

### ⚠️ ตารางที่ใช้ในโค้ดแต่ไม่มี migration
ตารางเหล่านี้ถูกเรียกใช้ใน components แต่ **ไม่มีไฟล์ migration** — ต้องสร้างเองใน Supabase:
- `milestones` — ใช้ใน `About.tsx` และ `MilestonesManagement.tsx` (columns: `id, year, event, is_active, order_position`)
- `facilities` — ใช้ใน `About.tsx` และ `FacilitiesManagement.tsx` (columns: `id, title, description, icon, is_active, order_position`)
- `faq` — ใช้ใน `FaqManagement.tsx` (columns: `id, question, answer, order_position, is_active`)

## RLS Pattern
- Most tables: `USING (true) WITH CHECK (true)` = full public access (no auth required)
- Exception – waste_bank, attendance, documents: `auth.role() = 'authenticated'` for write; public SELECT
- This means **no authentication is enforced** on most admin operations (by design for simplicity)

## Storage Buckets
- `school-images` – for news/gallery/staff/admin photos (public, created manually)
- `school-documents` – for downloadable documents (public, 50MB limit, created in migration 013)

## Utility Function
`public.update_updated_at_column()` – trigger function that sets `updated_at = now()` on every UPDATE
