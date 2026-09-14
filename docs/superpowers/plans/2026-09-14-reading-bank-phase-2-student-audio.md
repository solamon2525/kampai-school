# Reading Bank Phase 2 Student Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้นักเรียนอ่าน อัด ฟัง อัดใหม่ เก็บเสียงเมื่อเน็ตหลุด และส่งหลักฐานเสียงหนึ่งหรือสองรายการตามช่วงชั้นผ่านมือถือ

**Architecture:** เพิ่ม attempt และ audio metadata แยกจาก assignment ใช้ private Storage bucket `reading-audio` การขอที่อยู่อัปโหลดและยืนยันไฟล์ผ่าน `reading-audio-api` เท่านั้น ตัวบันทึกเสียงแยกเป็น hook ที่ควบคุม MediaRecorder กับ IndexedDB queue และหน้ากิจกรรมแสดงงานเด่นทีละขั้น

**Tech Stack:** MediaRecorder, Web Audio/HTMLAudioElement, IndexedDB (`idb`), Supabase Storage/Edge Functions/Postgres, React Query, Playwright

**Spec:** `docs/superpowers/specs/2026-09-14-reading-bank-design.md`

## Global Constraints

- ไมโครโฟนเริ่มจาก user gesture เท่านั้น ไม่มี autoplay หรือเริ่มอัดเอง
- lower band ต้องส่ง `read_aloud` 30–90 วินาที; upper band ต้องส่ง `read_aloud` ไม่เกิน 120 วินาทีและ `retell` 30–60 วินาที
- รองรับ MIME ที่ browser รายงานจริงในกลุ่ม `audio/webm`, `audio/mp4`, `audio/ogg`; ขนาดไฟล์ละไม่เกิน 8 MiB
- bucket เป็น private และไม่มี public SELECT policy
- ไฟล์ต้องอยู่ที่ `<student_id>/<assignment_id>/<attempt_id>/<clip_type>.<ext>` ซึ่ง server สร้างเอง
- ส่งซ้ำด้วย `idempotencyKey` เดิมต้องคืน submission เดิม
- เก็บ draft audio ใน IndexedDB และลบเมื่อ server ยืนยันสำเร็จ
- ตรวจจริง Android Chrome และ iOS Safari; desktop test ไม่แทน mobile microphone test

---

### Task 1: เพิ่ม schema การส่งงาน ความพยายาม และข้อมูลเสียง

**Files:**
- Create: `supabase/migrations/20260914011000_reading_bank_student_audio.sql`
- Create: `scripts/test-reading-bank-audio-schema.mjs`
- Modify: `package.json`
- Regenerate: `src/integrations/supabase/types.ts`

**Interfaces:**
- Tables: `reading_submissions`, `reading_submission_attempts`, `reading_audio_clips`
- Submission status: `not_started|reading|draft|uploading|submitted|changes_requested|approved|overdue`
- Clip type: `read_aloud|retell`

- [ ] **Step 1: เขียน failing schema contract**

```js
for (const table of ['reading_submissions','reading_submission_attempts','reading_audio_clips']) {
  assert.match(sql, new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? public\\.${table}`, 'i'));
}
assert.match(sql, /UNIQUE\s*\(assignment_student_id\)/i);
assert.match(sql, /UNIQUE\s*\(submission_id,\s*attempt_number\)/i);
assert.match(sql, /UNIQUE\s*\(attempt_id,\s*clip_type\)/i);
assert.match(sql, /reading-audio/);
assert.doesNotMatch(sql, /public\s*=\s*true/i);
```

- [ ] **Step 2: รันให้ล้มก่อนมี migration**

Run: `node scripts/test-reading-bank-audio-schema.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: เขียน migration และ private bucket**

`reading_submissions` unique ต่อ assignment target; `reading_submission_attempts` เก็บ attempt number, idempotency key, status, submitted_at; `reading_audio_clips` เก็บ storage_path, mime_type, byte_size, duration_seconds, sha256, upload_status และ timestamps

สร้าง bucket:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reading-audio', 'reading-audio', false, 8388608,
  ARRAY['audio/webm','audio/mp4','audio/ogg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 8388608;
```

ไม่สร้าง policy ให้ anon; authenticated teacher SELECT เฉพาะ object ที่มี clip เชื่อมกับ assignment ของตนหรือ admin; parent SELECT เฉพาะเสียงของบุตร

- [ ] **Step 4: Reset local DB, regenerate types และรัน verifier**

Run: `supabase db reset`

Run: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

Run: `node scripts/test-reading-bank-audio-schema.mjs`

Expected: ผ่านทั้งหมด

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260914011000_reading_bank_student_audio.sql src/integrations/supabase/types.ts scripts/test-reading-bank-audio-schema.mjs package.json
git commit -m "feat(reading-bank): add private audio submission schema"
```

### Task 2: สร้าง reading-audio-api และการอัปโหลดแบบยืนยันสองขั้น

**Files:**
- Create: `supabase/functions/reading-audio-api/index.ts`
- Create: `scripts/test-reading-audio-api.mjs`
- Modify: `supabase/config.toml`
- Modify: `src/services/reading-bank-student.service.ts`

**Interfaces:**
- `prepare-upload`: `{ assignmentId, attemptId?, clipType, mimeType, byteSize, durationSeconds, sha256, idempotencyKey }`
- Response: `{ attemptId, clipId, path, signedUploadToken }`
- `finalize-upload`: `{ clipId, path, sha256, idempotencyKey }`
- `submit-attempt`: `{ attemptId, idempotencyKey }`
- `readingStudentService.prepareAudioUpload`, `.finalizeAudioUpload`, `.submitAttempt`

- [ ] **Step 1: เขียน failing HTTP contract test**

ทดสอบ token ปลอมได้ 401, path จาก client ถูกปฏิเสธ, lower band ส่ง retell ถูกปฏิเสธ, upper band ขาด retell ส่งไม่ได้, finalize object ที่ไม่มีจริงไม่ได้ และส่ง idempotency key ซ้ำคืน attempt เดิม

- [ ] **Step 2: รัน test ให้ล้มเพราะ function ยังไม่มี**

Run: `node scripts/test-reading-audio-api.mjs --http http://127.0.0.1:54321/functions/v1/reading-audio-api`

Expected: connection/404 failure

- [ ] **Step 3: สร้าง prepare-upload**

ตรวจ student session ด้วย helper เดียวกับ `reading-student-api`; ตรวจ assignment target และเวลางาน; validate MIME/size/duration; สร้างหรือคืน attempt ตาม idempotency key; server สร้าง path และเรียก `storage.from('reading-audio').createSignedUploadUrl(path)`

- [ ] **Step 4: สร้าง finalize-upload และ submit-attempt**

finalize อ่าน object metadata ผ่าน Storage API, เทียบ path/size และบันทึก clip เป็น `ready`; submit ตรวจ clip requirements ตาม grade band แล้วเปลี่ยน attempt/submission เป็น `submitted` ใน transaction เดียว ห้ามสร้างคะแนนในระยะนี้

- [ ] **Step 5: เพิ่ม config และ client methods**

```toml
[functions.reading-audio-api]
verify_jwt = false
```

Client ส่ง `x-reading-session` header ทุก action และใช้ `uploadToSignedUrl(path, token, blob, { contentType })`; ห้ามเก็บ signed upload URL หลังอัปโหลด

- [ ] **Step 6: Serve function และรัน HTTP test**

Run: `supabase functions serve reading-audio-api --no-verify-jwt`

Run: `node scripts/test-reading-audio-api.mjs --http http://127.0.0.1:54321/functions/v1/reading-audio-api`

Expected: ทุกกรณีผ่านและ bucket listing จาก anon ถูกปฏิเสธ

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/reading-audio-api/index.ts supabase/config.toml src/services/reading-bank-student.service.ts scripts/test-reading-audio-api.mjs
git commit -m "feat(reading-bank): secure student audio uploads"
```

### Task 3: สร้างตัวบันทึกเสียงและคิว IndexedDB

**Files:**
- Create: `src/hooks/useAudioRecorder.ts`
- Create: `src/lib/reading-bank/audio-format.ts`
- Create: `src/lib/reading-bank/audio-drafts.ts`
- Create: `src/components/reading-bank/student/AudioRecorder.tsx`
- Create: `scripts/test-reading-audio-recorder.mjs`

**Interfaces:**
- `useAudioRecorder({ minSeconds, maxSeconds, clipType })`
- State: `idle|requesting|recording|recorded|error`
- Actions: `start()`, `stop()`, `reset()`
- Result: `{ blob, mimeType, durationSeconds, objectUrl }`
- Draft API: `saveAudioDraft`, `loadAudioDraft`, `deleteAudioDraft`

- [ ] **Step 1: เขียน source contract test สำหรับ MediaRecorder**

อ่าน source ของ hook/component แล้ว assert ว่า `getUserMedia` อยู่ภายในฟังก์ชัน `start`, มี `MediaRecorder.isTypeSupported`, `track.stop()`, `URL.revokeObjectURL`, `visibilitychange`, timer หยุดที่ `maxSeconds`, ปุ่มส่ง disabled เมื่อสั้นกว่า `minSeconds` และมีข้อความกรณีปฏิเสธไมโครโฟน การทดสอบพฤติกรรมด้วย fake MediaRecorder จะทำใน Task 4 ผ่านหน้ากิจกรรมจริง

- [ ] **Step 2: รัน test ให้ล้มก่อนมี component**

Run: `node scripts/test-reading-audio-recorder.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: สร้าง format selector และ recorder hook**

เลือก MIME ตามลำดับ `audio/webm;codecs=opus`, `audio/mp4`, `audio/ogg;codecs=opus`; ใช้ `MediaRecorder.isTypeSupported`; stop tracks ทุกครั้งใน cleanup; เมื่อ `visibilitychange` เป็น hidden ระหว่างอัดให้ stop และเก็บเสียงที่ได้

- [ ] **Step 4: สร้าง IndexedDB draft store**

Key เป็น `${studentId}:${assignmentId}:${attemptId}:${clipType}`; เก็บ Blob, MIME, duration, updatedAt; ลบ draft เกิน 7 วันเมื่อเปิดระบบ; ไม่เก็บ PIN หรือ session token ใน draft record

- [ ] **Step 5: สร้าง AudioRecorder UI**

ปุ่มเริ่ม/หยุดอย่างน้อย 44px, แสดง timer และสถานะสีจาก CSS vars, มี `<audio controls>` หลังอัด, ปุ่ม “อัดใหม่” และ “ใช้เสียงนี้”; ไม่มี autoplay

- [ ] **Step 6: รัน browser test, lint และ build**

Run: `node scripts/test-reading-audio-recorder.mjs`

Run: `pnpm exec eslint src/hooks/useAudioRecorder.ts src/lib/reading-bank/audio-format.ts src/lib/reading-bank/audio-drafts.ts src/components/reading-bank/student/AudioRecorder.tsx`

Run: `pnpm build`

Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useAudioRecorder.ts src/lib/reading-bank/audio-format.ts src/lib/reading-bank/audio-drafts.ts src/components/reading-bank/student/AudioRecorder.tsx scripts/test-reading-audio-recorder.mjs
git commit -m "feat(reading-bank): record resilient mobile audio"
```

### Task 4: สร้างหน้ากิจกรรมอ่านและขั้นตอนส่งงาน

**Files:**
- Create: `src/pages/student/ReadingAssignment.tsx`
- Create: `src/components/reading-bank/student/ReadingArticleView.tsx`
- Create: `src/components/reading-bank/student/ReadingSubmissionFlow.tsx`
- Create: `src/components/reading-bank/student/UploadProgress.tsx`
- Modify: `src/pages/student/ReadingBank.tsx`
- Modify: `src/App.tsx`
- Modify: `src/services/reading-bank-student.service.ts`
- Create: `scripts/test-reading-assignment-flow.mjs`

**Interfaces:**
- Route: `/reading-bank/assignments/:assignmentId`
- Steps: `article|read_aloud|retell|review|uploading|submitted`
- Query keys: `['reading-bank','student','dashboard']`, `['reading-bank','student','assignment',assignmentId]`

- [ ] **Step 1: เขียน Playwright flow สำหรับ lower และ upper band**

lower: อ่าน → ยืนยัน → อัดหนึ่งเสียง → review → submit; upper: ปุ่ม submit ต้อง disabled จนมีสองเสียง; ทดสอบ reload หลังอัดแล้ว draft ยังอยู่; mock upload ล้มครั้งแรกแล้ว retry สำเร็จโดยไม่เรียก recorder ใหม่

- [ ] **Step 2: รัน test ให้ล้มก่อนมี route**

Run: `node scripts/test-reading-assignment-flow.mjs --base-url http://127.0.0.1:4173`

Expected: FAIL route missing

- [ ] **Step 3: สร้าง ReadingArticleView**

แสดง sanitized HTML, ปุ่มตัวอักษร เล็ก/กลาง/ใหญ่, progress เฉพาะขั้นปัจจุบัน, sticky action ที่ไม่ถูก mobile keyboard บัง และปุ่ม “ฉันอ่านจบแล้ว”; ห้ามใช้ timer เป็นหลักฐานคะแนน

- [ ] **Step 4: สร้าง ReadingSubmissionFlow**

ใช้ reducer เดียวควบคุม step; lower ไม่สร้าง retell step; upper บังคับสอง clips; review แสดงเครื่องเล่นทุก clip; upload เรียง prepare → signed upload → finalize ต่อ clip → submit attempt; retry ใช้ idempotency key เดิม

- [ ] **Step 5: เพิ่ม route และเชื่อม dashboard**

lazy-load `ReadingAssignment`; dashboard card link ด้วย assignment ID เท่านั้น; guard ทุกหน้าเรียก `getSession()` และกลับ login เมื่อ token หมดอายุ

- [ ] **Step 6: รัน flow สอง viewport**

Run: `node scripts/test-reading-assignment-flow.mjs --base-url http://127.0.0.1:4173 --viewports 360x800,1280x720`

Expected: lower/upper/retry ผ่าน ไม่มี horizontal overflow และข้อความไม่ล้น

- [ ] **Step 7: Commit**

```bash
git add src/pages/student/ReadingAssignment.tsx src/pages/student/ReadingBank.tsx src/components/reading-bank/student src/services/reading-bank-student.service.ts src/App.tsx scripts/test-reading-assignment-flow.mjs
git commit -m "feat(reading-bank): add guided reading submissions"
```

### Task 5: ตรวจอุปกรณ์จริง เอกสาร และเผยแพร่ระยะที่ 2

**Files:**
- Create: `docs/qa/READING-BANK-PHASE-2-2026-09-14.md`
- Modify: `DESIGN.md`
- Modify: `DESIGN-COMPONENTS.md`
- Modify: `src/components/admin/system/SystemOverview.tsx`

- [ ] **Step 1: ทดสอบ Android Chrome**

ใช้บัญชีนักเรียนทดสอบ อนุญาต/ปฏิเสธไมค์ อัดจนหมดเวลา สลับแอป ฟัง อัดใหม่ ปิดเน็ตระหว่างส่ง เปิดเน็ต และส่งใหม่ บันทึกชนิดไฟล์/ขนาด/ผลเล่นกลับ

- [ ] **Step 2: ทดสอบ iOS Safari**

ทำชุดเดียวกับ Android และยืนยันเสียง MP4 เล่นในหน้าครู/desktop ได้ หาก MIME หลักไม่รองรับต้อง fallback ตาม `audio-format.ts` ไม่เพิ่ม transcoding ในระยะนี้

- [ ] **Step 3: รัน regression**

Run: `node scripts/test-reading-audio-api.mjs --http http://127.0.0.1:54321/functions/v1/reading-audio-api`

Run: `node scripts/test-reading-audio-browser.mjs`

Run: `node scripts/test-reading-assignment-flow.mjs --viewports 360x800,1280x720`

Run: `pnpm build`

Expected: ผ่านทั้งหมด

- [ ] **Step 4: Sync design/version และเขียน QA report**

บันทึก microphone user gesture, one-dominant-step, draft recovery, MIME limits และภาพสอง viewport; เพิ่ม version entry บนสุด

- [ ] **Step 5: Commit และ push**

```bash
git add docs/qa/READING-BANK-PHASE-2-2026-09-14.md DESIGN.md DESIGN-COMPONENTS.md src/components/admin/system/SystemOverview.tsx
git commit -m "docs(reading-bank): verify mobile audio workflow"
git push origin main
```
