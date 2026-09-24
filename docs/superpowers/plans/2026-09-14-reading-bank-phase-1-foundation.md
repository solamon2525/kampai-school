# Reading Bank Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ส่งมอบรากฐานที่ครูตั้ง PIN ตามห้อง สร้างและแชร์บทความ มอบหมายงาน และนักเรียนเข้าสู่ระบบเพื่อเห็นงานอ่านของตนได้อย่างปลอดภัย

**Architecture:** ใช้ตารางเฉพาะธนาคารการอ่านกับ RLS แบบปิดโดยปริยาย ครูและผู้ดูแลใช้ Supabase Auth เดิม ส่วนนักเรียนเรียก Edge Function ด้วย session token เฉพาะระบบที่เก็บแบบแฮช บทความมี version ที่แก้ไม่ได้และ assignment อ้างอิง version เพื่อรักษาประวัติ

**Tech Stack:** Supabase Postgres/RLS/Edge Functions, TypeScript, React Query, React Hook Form, Zod, React Router, Playwright

**Spec:** `docs/superpowers/specs/2026-09-14-reading-bank-design.md`

## Global Constraints

- ห้ามเปิด Supabase Anonymous Auth และห้ามเพิ่ม student เป็น role ใน `user_roles`
- PIN ต้องเป็นตัวเลข 4 หลัก แฮชด้วย `pgcrypto`; แสดง PIN ใหม่ครั้งเดียว
- Session มีอายุ 30 วัน เก็บเฉพาะ SHA-256 hash และเพิกถอนทั้งหมดเมื่อรีเซ็ต PIN
- ครูจัดการ PIN ได้เฉพาะห้องใน `reading_teacher_classrooms`; admin จัดการได้ทุกห้อง
- นักเรียน active อ.3–ป.6 เท่านั้นที่เปิด session ได้
- บทความ published version แก้ย้อนหลังไม่ได้ และ assignment snapshot รายชื่อนักเรียนเมื่อเผยแพร่
- ทุก component ใช้ service + React Query; forms ใช้ RHF/Zod/Form
- หน้าใหม่ lazy-load; UI ใช้ CSS vars, `cn()`, Sarabun และ `<PersonAvatar>` คู่ชื่อ

---

### Task 1: เพิ่มฐานข้อมูลรากฐานและการทดสอบสัญญา schema

**Files:**
- Create: `supabase/migrations/20260914010000_reading_bank_foundation.sql`
- Create: `scripts/test-reading-bank-foundation.mjs`
- Modify: `package.json`
- Regenerate: `src/integrations/supabase/types.ts`

**Interfaces:**
- Produces tables: `reading_teacher_classrooms`, `reading_student_credentials`, `reading_student_sessions`, `reading_articles`, `reading_article_versions`, `reading_assignments`, `reading_assignment_students`
- Produces helpers: `reading_current_staff_id()`, `reading_teacher_has_class(text,text,text)`, `reading_is_supported_grade(text)`
- Produces RPCs: `set_reading_student_pin(uuid,text)`, `revoke_reading_student_sessions(uuid)`, `publish_reading_article(uuid)`, `create_reading_assignment(uuid,text,text,timestamptz,timestamptz)`

- [ ] **Step 1: เขียน verifier ให้ล้มเหลวก่อนมี migration**

```js
// scripts/test-reading-bank-foundation.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20260914010000_reading_bank_foundation.sql', 'utf8');
for (const table of [
  'reading_teacher_classrooms', 'reading_student_credentials',
  'reading_student_sessions', 'reading_articles', 'reading_article_versions',
  'reading_assignments', 'reading_assignment_students',
]) assert.match(sql, new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? public\\.${table}`, 'i'));
assert.match(sql, /ALTER TABLE public\.reading_articles ENABLE ROW LEVEL SECURITY/i);
assert.match(sql, /UNIQUE\s*\(assignment_id,\s*student_id\)/i);
assert.match(sql, /CHECK\s*\(pin_failed_attempts >= 0\)/i);
assert.doesNotMatch(sql, /GRANT\s+.*\s+TO\s+anon/i);
console.log('reading-bank foundation contract: ok');
```

- [ ] **Step 2: รัน verifier และยืนยันว่าไฟล์ migration ยังไม่มี**

Run: `node scripts/test-reading-bank-foundation.mjs`

Expected: FAIL ด้วย `ENOENT` สำหรับ migration ใหม่

- [ ] **Step 3: เขียน migration พร้อม constraints และ indexes**

ใช้ enum/check values เหล่านี้โดยตรง:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.reading_teacher_classrooms (
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  room_name text NOT NULL DEFAULT '',
  academic_year text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_id, class_name, room_name, academic_year)
);

CREATE TABLE public.reading_student_credentials (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  pin_failed_attempts integer NOT NULL DEFAULT 0 CHECK (pin_failed_attempts >= 0),
  locked_until timestamptz,
  pin_version integer NOT NULL DEFAULT 1 CHECK (pin_version > 0),
  set_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reading_student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  device_id_hash text NOT NULL,
  pin_version integer NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
```

เพิ่ม columns แบบเจาะจงดังนี้: `reading_articles(id,owner_staff_id,source_article_id,title,cover_url,grade_band,category,status,created_at,updated_at)`, `reading_article_versions(id,article_id,version_number,body_html,read_aloud_text,retell_prompt,estimated_minutes,created_by,published_at)` unique `(article_id,version_number)`, `reading_assignments(id,article_version_id,assigned_by_staff_id,class_name,room_name,opens_at,due_at,base_coins,status,created_at)` และ `reading_assignment_students(id,assignment_id,student_id,status,created_at)` unique `(assignment_id,student_id)`. ใช้สถานะ `draft|published|archived` และ `scheduled|open|closed|archived`; บังคับ `grade_band IN ('lower','upper')`, `base_coins IN (10,15)` และ `estimated_minutes BETWEEN 1 AND 5`

- [ ] **Step 4: เพิ่ม RLS และ grants แบบปิดโดยปริยาย**

ทุกตาราง `ENABLE ROW LEVEL SECURITY`; revoke จาก `anon`; ครูอ่าน published articles ได้, owner แก้ draft ของตน, admin จัดการทั้งหมด, parent อ่าน assignment/result ของบุตรผ่าน `parent_student_links`; student tables ไม่มี direct policy

- [ ] **Step 5: รัน migration ในฐานข้อมูล local และ regenerate types**

Run: `supabase db reset`

Expected: exit 0 และ migration ใหม่ทำงานครบ

Run: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

Expected: types มีทั้งเจ็ดตารางและ RPC ทั้งสี่

- [ ] **Step 6: รัน verifier และ build**

Run: `node scripts/test-reading-bank-foundation.mjs`

Expected: `reading-bank foundation contract: ok`

Run: `pnpm build`

Expected: exit 0

- [ ] **Step 7: เพิ่ม script และ commit**

เพิ่ม `"test:reading-bank:foundation": "node scripts/test-reading-bank-foundation.mjs"` ใน `package.json`

```bash
git add supabase/migrations/20260914010000_reading_bank_foundation.sql scripts/test-reading-bank-foundation.mjs package.json src/integrations/supabase/types.ts
git commit -m "feat(reading-bank): add secure foundation schema"
```

### Task 2: สร้างบริการ session นักเรียนแบบแยกจาก Auth เดิม

**Files:**
- Create: `supabase/functions/reading-student-api/index.ts`
- Create: `src/services/reading-bank-student.service.ts`
- Create: `scripts/test-reading-student-session.mjs`
- Modify: `supabase/config.toml`
- Modify: `package.json`

**Interfaces:**
- Request: `{ action: 'login', studentCode: string, pin: string, deviceId: string }`
- Response: `{ token: string, expiresAt: string, student: { id: string, name: string, photoUrl: string|null, className: string, roomName: string } }`
- Authenticated student actions: `me`, `dashboard`, `assignment`, `logout`
- Client exports: `readingStudentService.login`, `.logout`, `.dashboard`, `.getAssignment`, `.getSession`, `.clearSession`

- [ ] **Step 1: เขียน contract test สำหรับ CORS, action และการไม่ใช้ anonymous auth**

```js
const source = readFileSync('supabase/functions/reading-student-api/index.ts', 'utf8');
assert.match(source, /action\s*===\s*['"]login['"]/);
assert.match(source, /x-reading-session/i);
assert.match(source, /crypto\.subtle\.digest\(['"]SHA-256['"]/);
assert.doesNotMatch(source, /signInAnonymously/);
assert.doesNotMatch(source, /pin\s*[,)]\s*console\./i);
```

- [ ] **Step 2: รัน test ให้ล้มด้วยไฟล์ที่ยังไม่มี**

Run: `node scripts/test-reading-student-session.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: สร้าง Edge Function และจำกัดต้นทาง**

กำหนด allowed origins เป็น production origin และ `http://localhost:8080`; login สร้าง token จาก `crypto.getRandomValues(new Uint8Array(32))`, hash token/device ด้วย SHA-256, เรียก SQL ตรวจ `crypt(pin, pin_hash)`, ล็อก 15 นาทีหลังผิด 5 ครั้ง และคืนข้อความ `INVALID_STUDENT_LOGIN` เดียวกันทุกกรณี

ทุก action นอกจาก login ต้องอ่าน `x-reading-session`, hash, ตรวจ `revoked_at IS NULL`, `expires_at > now()` และ `pin_version` ตรงก่อน query ด้วย service-role client ห้ามคืน `student_code`, `pin_hash`, `token_hash` หรือข้อมูลนักเรียนคนอื่น

- [ ] **Step 4: ปิด JWT verification เฉพาะ function นี้**

```toml
[functions.reading-student-api]
verify_jwt = false
```

- [ ] **Step 5: สร้าง client service และเก็บ session ใน IndexedDB**

```ts
export type ReadingStudentSession = {
  token: string;
  expiresAt: string;
  student: { id: string; name: string; photoUrl: string | null; className: string; roomName: string };
};

export const readingStudentService = {
  login(input: { studentCode: string; pin: string }): Promise<ReadingStudentSession>,
  logout(): Promise<void>,
  dashboard(): Promise<ReadingStudentDashboard>,
  getAssignment(assignmentId: string): Promise<ReadingStudentAssignment>,
};
```

ใช้ฐาน IndexedDB `kampai-reading-bank`, store `session`, key `active`; สร้าง device ID ครั้งเดียวใน store เดียวกัน ห้ามใส่ token ใน URL หรือ query key

- [ ] **Step 6: ทดสอบ function local**

Deploy local: `supabase functions serve reading-student-api --no-verify-jwt`

Run: `node scripts/test-reading-student-session.mjs --http http://127.0.0.1:54321/functions/v1/reading-student-api`

Expected: PIN ผิดห้าครั้งถูกพัก, error เหมือนกัน, login สำเร็จคืน token, token ปลอมอ่าน dashboard ไม่ได้, logout ทำให้ token เดิมใช้ไม่ได้

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/reading-student-api/index.ts src/services/reading-bank-student.service.ts scripts/test-reading-student-session.mjs supabase/config.toml package.json
git commit -m "feat(reading-bank): add isolated student sessions"
```

### Task 3: เพิ่ม service ครู การผูกห้อง และหน้าตั้ง PIN

**Files:**
- Create: `src/services/reading-bank.service.ts`
- Create: `src/components/reading-bank/teacher/ClassroomAccessManager.tsx`
- Create: `src/components/reading-bank/teacher/StudentPinManager.tsx`
- Create: `src/lib/reading-bank/schemas.ts`
- Create: `scripts/test-reading-bank-teacher-access.mjs`

**Interfaces:**
- `readingBankService.listTeacherClassrooms()`
- `readingBankService.saveTeacherClassroom({ staffId, className, roomName, academicYear })`
- `readingBankService.listStudentsForPin(className, roomName)`
- `readingBankService.setStudentPin(studentId, pin): Promise<{ oneTimePin: string }>`
- Zod `studentPinSchema`: exactly `/^\d{4}$/`

- [ ] **Step 1: เขียน test ตรวจว่า component ไม่ query Supabase ตรงและใช้ PersonAvatar**

```js
assert.doesNotMatch(pinManager, /supabase\.(from|rpc)/);
assert.match(pinManager, /PersonAvatar/);
assert.match(schemas, /\^\\d\{4\}\$/);
```

- [ ] **Step 2: รัน test ให้ล้มก่อนสร้างไฟล์**

Run: `node scripts/test-reading-bank-teacher-access.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: สร้าง service จาก generated Database types**

ใช้ `Tables<'reading_articles'>` และ RPC จาก types; mutation ทุกตัวคืน error ให้ caller และ UI invalidate `['reading-bank','teacher-classrooms']` หรือ `['reading-bank','pin-students',className,roomName]`

- [ ] **Step 4: สร้างฟอร์มผูกครูกับห้องสำหรับ admin**

ใช้ RHF/Zod/Form เลือกครู ชั้น ห้อง ปีการศึกษา; admin เพิ่ม/ลบ mapping; ครูเห็น mapping แบบอ่านอย่างเดียว

- [ ] **Step 5: สร้างหน้าตั้ง PIN**

แสดง `PersonAvatar`, ชื่อ, รหัสนักเรียน และสถานะ “ยังไม่ตั้ง/ตั้งแล้ว”; dialog รับ PIN และยืนยัน PIN; หลังบันทึกแสดง PIN ใหม่กับปุ่มพิมพ์บัตรครั้งเดียว เมื่อปิด dialog ห้ามโหลด PIN เดิมกลับมา

- [ ] **Step 6: รัน lint, test และ browser smoke**

Run: `node scripts/test-reading-bank-teacher-access.mjs`

Run: `pnpm exec eslint src/services/reading-bank.service.ts src/components/reading-bank/teacher src/lib/reading-bank/schemas.ts`

Expected: ทุกคำสั่ง exit 0

- [ ] **Step 7: Commit**

```bash
git add src/services/reading-bank.service.ts src/components/reading-bank/teacher/ClassroomAccessManager.tsx src/components/reading-bank/teacher/StudentPinManager.tsx src/lib/reading-bank/schemas.ts scripts/test-reading-bank-teacher-access.mjs
git commit -m "feat(reading-bank): let teachers manage student pins"
```

### Task 4: สร้างบทความ ฉบับบทความ และคลังส่วนกลาง

**Files:**
- Create: `src/components/reading-bank/teacher/ArticleEditor.tsx`
- Create: `src/components/reading-bank/teacher/ArticleLibrary.tsx`
- Create: `src/components/reading-bank/teacher/ArticlePreview.tsx`
- Create: `src/lib/reading-bank/article-templates.ts`
- Create: `src/lib/reading-bank/reading-time.ts`
- Create: `scripts/test-reading-bank-articles.mjs`
- Modify: `src/services/reading-bank.service.ts`

**Interfaces:**
- `ArticleFormValues = { title; coverUrl; gradeBand; category; bodyHtml; readAloudText; retellPrompt; estimatedMinutes }`
- `readingBankService.createArticle`, `.updateDraft`, `.publishArticle`, `.copyPublishedArticle`, `.listMine`, `.listLibrary`
- `estimateReadingMinutes(bodyText, gradeBand): number`

- [ ] **Step 1: เขียน tests สำหรับต้นแบบ เวลาอ่าน และ sanitization contract**

```js
assert.match(templates, /อ\.3–ป\.1/);
assert.match(templates, /ป\.2–ป\.3/);
assert.match(templates, /ป\.4–ป\.6/);
assert.match(editor, /zodResolver/);
assert.match(editor, /DOMPurify\.sanitize/);
assert.match(editor, /ArticlePreview/);
```

- [ ] **Step 2: รัน test ให้ล้ม**

Run: `node scripts/test-reading-bank-articles.mjs`

Expected: FAIL ก่อนมีไฟล์

- [ ] **Step 3: สร้างต้นแบบและตัวคำนวณเวลา**

ต้นแบบต้องมี `picture-story-lower`, `short-reading-lower`, `article-retell-upper`; ตัวคำนวณ clamp 1–5 นาทีและคืน `isTooLong` แยกต่างหากเพื่อปิดปุ่มเผยแพร่เมื่อเกิน 5 นาที

- [ ] **Step 4: สร้าง ArticleEditor ด้วย RHF/Zod/Form**

ใช้ ReactQuill สำหรับ body, DOMPurify ก่อนส่ง, image URL ผ่าน upload method ใน service, lower band บังคับ readAloudText, upper band บังคับทั้ง readAloudText และ retellPrompt; แสดง preview 360px ใน dialog

- [ ] **Step 5: สร้างคลังส่วนกลางและการคัดลอก**

กรองตามช่วงชั้น ประเภท เจ้าของ และคำค้น; การ์ดเจ้าของต้องใช้ PersonAvatar; “คัดลอกมาใช้” สร้าง draft ใหม่พร้อม `source_article_id`; ห้ามแก้ published version เดิม

- [ ] **Step 6: รัน test/lint/build**

Run: `node scripts/test-reading-bank-articles.mjs`

Run: `pnpm exec eslint src/components/reading-bank/teacher src/lib/reading-bank src/services/reading-bank.service.ts`

Run: `pnpm build`

Expected: exit 0 ทั้งหมด

- [ ] **Step 7: Commit**

```bash
git add src/components/reading-bank/teacher/ArticleEditor.tsx src/components/reading-bank/teacher/ArticleLibrary.tsx src/components/reading-bank/teacher/ArticlePreview.tsx src/lib/reading-bank/article-templates.ts src/lib/reading-bank/reading-time.ts src/services/reading-bank.service.ts scripts/test-reading-bank-articles.mjs
git commit -m "feat(reading-bank): add shared article library"
```

### Task 5: มอบหมายงานและเปิดหน้าธนาคารการอ่านของนักเรียน

**Files:**
- Create: `src/components/reading-bank/teacher/AssignmentBuilder.tsx`
- Create: `src/components/reading-bank/student/StudentReadingLogin.tsx`
- Create: `src/components/reading-bank/student/ReadingDashboard.tsx`
- Create: `src/pages/student/ReadingBank.tsx`
- Create: `src/pages/teacher/TeacherReadingBank.tsx`
- Create: `scripts/test-reading-bank-phase1-browser.mjs`
- Modify: `src/App.tsx`
- Modify: `src/pages/teacher/teacher-menu.ts`
- Modify: `src/lib/quickMenuCatalog.ts`
- Modify: `src/lib/commands/registry.ts`
- Modify: `src/services/reading-bank.service.ts`

**Interfaces:**
- Routes: `/reading-bank`, `/teacher/reading-bank`
- `readingBankService.createAssignment({ articleVersionId, className, roomName, opensAt, dueAt })`
- Student dashboard cards contain `assignmentId`, `title`, `coverUrl`, `status`, `dueAt`, `estimatedMinutes`

- [ ] **Step 1: เขียน browser test ก่อนเพิ่ม routes**

Playwright test เปิด `/reading-bank`, ยืนยันหัวข้อ “ธนาคารการอ่าน”, ช่องรหัสนักเรียน, ช่อง PIN แบบ password/numeric และไม่มี horizontal overflow ที่ 360×800; เปิด `/teacher/reading-bank` ด้วย storage state ครูแล้วเห็นแท็บบทความ/คลัง/มอบหมาย/PIN

- [ ] **Step 2: รัน browser test และยืนยัน 404 หรือ assertion fail**

Run: `node scripts/test-reading-bank-phase1-browser.mjs --base-url http://127.0.0.1:4173`

Expected: FAIL เพราะ routes ยังไม่มี

- [ ] **Step 3: สร้าง AssignmentBuilder**

ใช้ RHF/Zod/Form; เลือก published version, ห้องจาก mapping, เวลาเปิดและวันส่ง; preview รายชื่อนักเรียน active พร้อม PersonAvatar; submit เรียก RPC ที่ snapshot targets และ invalidate assignment queries

- [ ] **Step 4: สร้าง StudentReadingLogin และ ReadingDashboard**

login ใช้ `inputMode="numeric"`, autocomplete ปิดสำหรับ PIN, error เดียว “รหัสนักเรียนหรือรหัสลับไม่ถูกต้อง”; dashboard แสดง PersonAvatar, งานต้องทำ, สถานะ และไม่ใส่ token ใน URL

- [ ] **Step 5: สร้างหน้าครูและ routes แบบ lazy**

`TeacherReadingBank` ใช้ `RolePortalLayout` และ `TEACHER_MENU`; `/teacher/reading-bank` ครอบด้วย `PortalProtectedRoute allow={['teacher','admin']}`; `/reading-bank` เป็น student session page ไม่ใช้ PortalProtectedRoute

- [ ] **Step 6: เพิ่มเมนูและ command registry**

เพิ่ม teacher core item `{ id: 'reading-bank', label: 'ธนาคารการอ่าน', path: '/teacher/reading-bank' }` และ command `t-reading-bank`; ตรวจ icon import ด้วยคำสั่ง registry guard ของ repository

- [ ] **Step 7: รัน browser test, lint และ build**

Run: `node scripts/test-reading-bank-phase1-browser.mjs --base-url http://127.0.0.1:4173`

Run: `pnpm exec eslint src/pages/student/ReadingBank.tsx src/pages/teacher/TeacherReadingBank.tsx src/components/reading-bank src/App.tsx src/pages/teacher/teacher-menu.ts src/lib/quickMenuCatalog.ts src/lib/commands/registry.ts`

Run: `pnpm build`

Expected: ผ่านและไม่มี overflow

- [ ] **Step 8: Sync docs/version และ commit**

เพิ่มข้อกำหนด student PIN/reading layout ใน `DESIGN.md`, component contracts ใน `DESIGN-COMPONENTS.md`, และ version entry บนสุดใน `src/components/admin/system/SystemOverview.tsx`

```bash
git add src/App.tsx src/pages/student/ReadingBank.tsx src/pages/teacher/TeacherReadingBank.tsx src/pages/teacher/teacher-menu.ts src/components/reading-bank src/lib/quickMenuCatalog.ts src/lib/commands/registry.ts src/services/reading-bank.service.ts scripts/test-reading-bank-phase1-browser.mjs DESIGN.md DESIGN-COMPONENTS.md src/components/admin/system/SystemOverview.tsx
git commit -m "feat(reading-bank): launch article assignments and student access"
```

### Task 6: ตรวจรับและเผยแพร่ระยะที่ 1

**Files:**
- Create: `docs/qa/READING-BANK-PHASE-1-2026-09-14.md`

- [ ] **Step 1: รันชุดตรวจทั้งหมดจากฐานข้อมูลใหม่**

Run: `supabase db reset`

Run: `pnpm test:reading-bank:foundation`

Run: `node scripts/test-reading-student-session.mjs --http http://127.0.0.1:54321/functions/v1/reading-student-api`

Run: `pnpm build`

Expected: exit 0 ทุกคำสั่ง

- [ ] **Step 2: ตรวจ browser จริงสองขนาด**

เปิด `/reading-bank` และ `/teacher/reading-bank` ที่ 360×800 และ 1280×720; บันทึกภาพและผล overflow ในรายงาน QA

- [ ] **Step 3: ทดสอบสิทธิ์ลบ**

ยืนยัน teacher A ตั้ง PIN ห้อง A ได้แต่ห้อง B ไม่ได้, parent อ่านข้อมูลบุตรแต่แก้ไม่ได้, anon query ตารางใหม่ได้ 0 แถว/permission denied, token ปลอมและ token หลัง reset ใช้ไม่ได้

- [ ] **Step 4: ตรวจ staged diff และ push**

Stage เฉพาะไฟล์ระยะที่ 1, ตรวจ `git diff --cached --check`, commit รายงาน QA แล้ว `git push origin main`; ตรวจ deployment จน `/reading-bank` ตอบ 200
