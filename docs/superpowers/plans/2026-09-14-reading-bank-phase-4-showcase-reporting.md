# Reading Bank Phase 4 Showcase and Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มการเสนอและอนุมัตินักอ่านดีเด่น ส่วนหน้าแรกที่จัดตำแหน่งได้ รายงานการใช้งาน และการล้างไฟล์เสียงตามอายุ

**Architecture:** Candidates มาจากข้อมูลรับรองและ ledger แต่การเผยแพร่ใช้ approval row แยกและตรวจ `pdpa_consents.scope='photo_public'` ทุกครั้ง หน้าแรกอ่านเฉพาะ public-safe view บล็อก `featured_readers` ลงทะเบียนกับ HomepageManager เดิม รายงานใช้ service/view แยก และ cleanup ใช้ scheduled Edge Function ผ่าน Storage API

**Tech Stack:** Supabase Postgres views/RLS/Edge Functions/Storage, React Query, Recharts, HomepageManager, Playwright

**Spec:** `docs/superpowers/specs/2026-09-14-reading-bank-design.md`

## Global Constraints

- ไม่มีเสียง URL หรือ student UUID ใน public showcase response
- นักเรียนต้องมี consent ล่าสุด `photo_public=true` ก่อน approve และก่อน render
- หนึ่งคนได้ไม่เกินหนึ่งประเภทต่อรอบ และต้องรองรับการหมุนเวียน lower/upper band
- ระบบเสนอรายชื่อได้ แต่ไม่ publish อัตโนมัติ
- `featured_readers` ต้องเปิด/ปิด/ลากตำแหน่งได้ใน HomepageManager desktop และ mobile
- Cleanup ลบผ่าน Storage API ไม่ลบ `storage.objects` ด้วย SQL
- เก็บ metadata/review/ledger หลังลบเสียง และบันทึก audit ทุกการลบ

---

### Task 1: เพิ่ม showcase schema, candidate RPC และ public-safe view

**Files:**
- Create: `supabase/migrations/20260914013000_reading_bank_showcase.sql`
- Create: `scripts/test-reading-showcase-schema.mjs`
- Regenerate: `src/integrations/supabase/types.ts`
- Modify: `package.json`

**Interfaces:**
- Table: `reading_showcase_entries`
- Category: `excellent|consistent|improved|storyteller|weekly_star`
- RPC: `get_reading_showcase_candidates(date,text)` authenticated teacher/admin
- RPC: `approve_reading_showcase(uuid,text)`
- View/RPC: `public_reading_showcase()` returning display fields only

- [ ] **Step 1: เขียน failing schema/security test**

```js
assert.match(sql, /CREATE TABLE public\.reading_showcase_entries/i);
assert.match(sql, /excellent.*consistent.*improved.*storyteller.*weekly_star/is);
assert.match(sql, /photo_public/i);
assert.match(sql, /UNIQUE\s*\(period_start,\s*student_id\)/i);
const returnsClause = sql.match(/public_reading_showcase\([^)]*\)\s+RETURNS TABLE\s*\(([^)]*)\)/is)?.[1] ?? '';
assert.doesNotMatch(returnsClause, /audio|storage_path|student_id/i);
```

- [ ] **Step 2: รันให้ล้มก่อน migration**

Run: `node scripts/test-reading-showcase-schema.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: สร้าง table/RPC**

เก็บ period_start/end, category, student_id, approved_submission_id, caption, status `draft|published|hidden`, approved_by/at. Candidate RPC แยก grade band และคำนวณจาก approved submissions: excellent=ค่าโบนัส/จำนวนงาน, consistent=สัปดาห์ต่อเนื่อง, improved=bonus ล่าสุดสูงกว่าช่วงก่อน, storyteller=upper retell ที่โบนัส 5, weekly_star=manual eligible list

- [ ] **Step 4: บังคับ consent และ public projection**

approve ตรวจ consent ล่าสุดของ student/scope `photo_public`; public function join student และคืน `display_name,photo_url,class_name,category,caption,period`; ไม่มี UUID, score detail หรือ audio

- [ ] **Step 5: Reset DB, regenerate และทดสอบ negative cases**

Run: `supabase db reset`

Run: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

Run: `node scripts/test-reading-showcase-schema.mjs --integration`

Expected: no-consent approve ถูกปฏิเสธ, คนเดียวสอง category ใน period ถูกปฏิเสธ, public result ไม่มี private fields

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260914013000_reading_bank_showcase.sql scripts/test-reading-showcase-schema.mjs src/integrations/supabase/types.ts package.json
git commit -m "feat(reading-bank): add consent-gated reader showcase"
```

### Task 2: สร้างหน้าคัดเลือกและอนุมัตินักอ่านดีเด่น

**Files:**
- Create: `src/components/reading-bank/teacher/ShowcaseManager.tsx`
- Create: `src/components/reading-bank/teacher/ShowcaseCandidateCard.tsx`
- Create: `scripts/test-reading-showcase-manager.mjs`
- Modify: `src/services/reading-bank.service.ts`
- Modify: `src/pages/teacher/TeacherReadingBank.tsx`

**Interfaces:**
- `readingBankService.listShowcaseCandidates(periodStart, gradeBand)`
- `readingBankService.publishShowcase({ candidateId, category, caption })`
- `readingBankService.hideShowcase(entryId)`

- [ ] **Step 1: เขียน UI contract test**

ยืนยัน candidate card ใช้ PersonAvatar, แสดงเหตุผลที่เสนอ, consent badge, publish disabled เมื่อไม่มี consent, category/caption form ใช้ RHF/Zod และ success invalidate showcase queries

- [ ] **Step 2: รันให้ล้มก่อน components**

Run: `node scripts/test-reading-showcase-manager.mjs`

Expected: FAIL

- [ ] **Step 3: สร้าง service และ manager**

แยก tabs ตามสัปดาห์/ช่วงชั้น; card ไม่แสดงอันดับรวม; ป้องกันนักเรียนซ้ำใน period; teacher publish เฉพาะงานในห้องของตน, admin publish ทั้งหมด; hide ต้องมี confirm

- [ ] **Step 4: รัน test/lint/browser**

Run: `node scripts/test-reading-showcase-manager.mjs`

Run: `pnpm exec eslint src/components/reading-bank/teacher/ShowcaseManager.tsx src/components/reading-bank/teacher/ShowcaseCandidateCard.tsx src/services/reading-bank.service.ts`

เปิด manager ที่ 360×800 และ 1280×720; cards/filters ไม่ล้น

- [ ] **Step 5: Commit**

```bash
git add src/components/reading-bank/teacher/ShowcaseManager.tsx src/components/reading-bank/teacher/ShowcaseCandidateCard.tsx src/services/reading-bank.service.ts src/pages/teacher/TeacherReadingBank.tsx scripts/test-reading-showcase-manager.mjs
git commit -m "feat(reading-bank): let teachers curate featured readers"
```

### Task 3: เพิ่มบล็อกนักอ่านดีเด่นในหน้าแรกและตัวจัดหน้า

**Files:**
- Create: `src/components/home/FeaturedReadersSection.tsx`
- Create: `src/services/reading-bank-public.service.ts`
- Create: `scripts/test-featured-readers-home.mjs`
- Modify: `src/components/home/HomeMainContent.tsx`
- Modify: `src/components/home/featuredBlocks.ts`
- Modify: `src/components/admin/homepage/BlockPalette.tsx`
- Modify: `src/components/admin/homepage/HomepageManager.tsx`
- Modify: `src/components/admin/homepage/HomepagePreview.tsx`

**Interfaces:**
- Block ID: `featured_readers`
- `readingBankPublicService.listPublished(period?: string)`
- Query key: `['reading-bank','public-showcase']`

- [ ] **Step 1: เขียน failing homepage test**

ยืนยัน block อยู่ใน MAIN_BLOCKS, inject หลัง `featured_hero`, preview รองรับ, sectionMap render, public service เลือกเฉพาะ public RPC และ component ไม่มี audio/storage path

- [ ] **Step 2: รันให้ล้มก่อนเพิ่ม block**

Run: `node scripts/test-featured-readers-home.mjs`

Expected: FAIL

- [ ] **Step 3: สร้าง public service และ section**

การ์ดแสดง PersonAvatar, ชื่อ, ชั้น, category label, caption; carousel เปลี่ยนด้วยการกด ไม่ autoplay; empty state คืน `null`; responsive 1 card mobile และ 3 cards desktop

- [ ] **Step 4: ลงทะเบียน block ใน layout manager**

เพิ่ม `{ id:'featured_readers', label:'นักอ่านดีเด่น', icon:'📚', category:'data' }`; ปรับ shared injector ให้แทรกหลัง `featured_hero` เฉพาะเมื่อ block ไม่มีทั้ง visible/hidden; desktop/mobile logic ต้องตรงกัน

- [ ] **Step 5: เพิ่ม render/preview และรัน tests**

Run: `node scripts/test-featured-readers-home.mjs`

Run: `pnpm exec eslint src/components/home/FeaturedReadersSection.tsx src/services/reading-bank-public.service.ts src/components/home/HomeMainContent.tsx src/components/home/featuredBlocks.ts src/components/admin/homepage`

Run: `pnpm build`

Expected: ผ่าน; ซ่อน block แล้วไม่ถูก inject กลับ; ลากตำแหน่งแล้วหน้า preview กับหน้าจริงตรงกัน

- [ ] **Step 6: Browser evidence และ commit**

เปิดหน้าแรก 360×800/1280×720 ทั้งมีข้อมูล ไม่มีข้อมูล และซ่อน block; บันทึกภาพ

```bash
git add src/components/home/FeaturedReadersSection.tsx src/services/reading-bank-public.service.ts src/components/home/HomeMainContent.tsx src/components/home/featuredBlocks.ts src/components/admin/homepage scripts/test-featured-readers-home.mjs
git commit -m "feat(home): showcase approved student readers"
```

### Task 4: เพิ่มรายงานผู้ดูแลและการล้างไฟล์เสียง

**Files:**
- Create: `supabase/migrations/20260914013100_reading_bank_reports.sql`
- Create: `supabase/functions/reading-audio-cleanup/index.ts`
- Create: `src/components/admin/reading-bank/ReadingBankManagement.tsx`
- Create: `src/components/admin/reading-bank/ReadingReports.tsx`
- Create: `src/services/reading-bank-admin.service.ts`
- Create: `scripts/test-reading-bank-cleanup-reports.mjs`
- Modify: `supabase/config.toml`
- Modify: `src/components/admin/shared/AdminLayout.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/lib/commands/registry.ts`

**Interfaces:**
- Views/RPCs: `reading_class_progress`, `reading_bank_kpis(date,date)`, `list_expired_reading_audio(integer)`
- Cleanup action returns `{ scanned, deleted, failed, bytesFreed }`
- Admin route: `/admin/dashboard/reading-bank`

- [ ] **Step 1: เขียน failing report และ cleanup contract test**

อ่าน `src/pages/AdminDashboard.tsx` เพื่อยืนยันว่าเป็นเจ้าของ nested routes จากนั้นให้ test ตรวจ KPI fields `assigned,submitted,changes_requested,approved,earned,spent,available,audio_bytes`, route `path="reading-bank"` และยืนยันว่า cleanup ไม่มี SQL `DELETE` ต่อ `storage.objects`

- [ ] **Step 2: สร้าง report views/RPC**

รายงานแยกห้อง/สถานะ, turnaround time, attempts, base/bonus, wallet, claims, article reuse และ audio bytes; admin only for detailed data; teacher report restricted to mapped classes

- [ ] **Step 3: สร้าง cleanup Edge Function**

รับ secret header `x-cleanup-secret`; query clips older than academic-year retention and not held; delete each object via `storage.from('reading-audio').remove(paths)`; on success mark `purged_at`, clear storage_path, append data access/audit record; failures remain retryable

- [ ] **Step 4: เพิ่ม admin service/page/menu**

หน้าใช้ cards และ charts ที่มีตารางข้อมูลสำรอง; filters date/class/status; PersonAvatar ในรายบุคคล; action cleanup เป็น admin-only confirm dialog; เพิ่ม sidebar/command icon import ถูกต้อง

- [ ] **Step 5: ตั้ง schedule และทดสอบ dry run**

Deploy function แล้วตั้ง schedule ทุกวัน 02:30 Asia/Bangkok ด้วย secret ฝั่ง Supabase; dry-run คืนจำนวนแต่ไม่ลบ; fixture expired หนึ่งไฟล์ถูกลบ metadata คงอยู่; fixture ใหม่ไม่ถูกแตะ

- [ ] **Step 6: รัน tests/lint/build**

Run: `node scripts/test-reading-bank-cleanup-reports.mjs --integration`

Run: `pnpm exec eslint src/components/admin/reading-bank src/services/reading-bank-admin.service.ts`

Run: `pnpm build`

Expected: ผ่านทั้งหมด

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260914013100_reading_bank_reports.sql supabase/functions/reading-audio-cleanup/index.ts supabase/config.toml src/components/admin/reading-bank src/services/reading-bank-admin.service.ts scripts/test-reading-bank-cleanup-reports.mjs src/components/admin/shared/AdminLayout.tsx src/pages/AdminDashboard.tsx src/lib/commands/registry.ts
git commit -m "feat(reading-bank): add reports and audio retention"
```

### Task 5: ตรวจรับระบบรวม เอกสาร และ production

**Files:**
- Create: `docs/qa/READING-BANK-FINAL-2026-09-14.md`
- Modify: `DESIGN.md`
- Modify: `DESIGN-COMPONENTS.md`
- Modify: `src/components/admin/system/SystemOverview.tsx`

- [ ] **Step 1: รันฐานข้อมูลและ verifier ทุกระยะ**

Run: `supabase db reset`

Run: `pnpm test:reading-bank:foundation`

Run: `node scripts/test-reading-bank-foundation.mjs`

Run: `node scripts/test-reading-student-session.mjs --http http://127.0.0.1:54321/functions/v1/reading-student-api`

Run: `node scripts/test-reading-bank-teacher-access.mjs`

Run: `node scripts/test-reading-bank-articles.mjs`

Run: `node scripts/test-reading-bank-phase1-browser.mjs --base-url http://127.0.0.1:4173`

Run: `node scripts/test-reading-bank-audio-schema.mjs`

Run: `node scripts/test-reading-audio-api.mjs --http http://127.0.0.1:54321/functions/v1/reading-audio-api`

Run: `node scripts/test-reading-audio-recorder.mjs`

Run: `node scripts/test-reading-assignment-flow.mjs --base-url http://127.0.0.1:4173 --viewports 360x800,1280x720`

Run: `node scripts/test-reading-bank-review-wallet.mjs --integration`

Run: `node scripts/test-reading-reward-wallet.mjs --integration`

Run: `node scripts/test-reading-review-ui.mjs`

Run: `node scripts/test-reading-wallet-browser.mjs --base-url http://127.0.0.1:4173 --viewports 360x800,1280x720`

Run: `node scripts/test-parent-reading-access.mjs`

Run: `node scripts/test-reading-showcase-schema.mjs --integration`

Run: `node scripts/test-reading-showcase-manager.mjs`

Run: `node scripts/test-featured-readers-home.mjs`

Run: `node scripts/test-reading-bank-cleanup-reports.mjs --integration`

Run: `pnpm build`

Expected: ทุกคำสั่ง exit 0

- [ ] **Step 2: ทดสอบบทบาทครบเส้นทาง**

admin จัดห้อง/รายงาน/layout; teacher สร้าง/มอบหมาย/PIN/ตรวจ/showcase; lower student ส่งหนึ่งเสียง; upper student ส่งสองเสียง/แลกรางวัล; parent ดูแต่ส่งไม่ได้; public เห็น showcase แต่เสียงเปิดไม่ได้

- [ ] **Step 3: ทดสอบเหตุการณ์เสี่ยง**

PIN ผิดห้าครั้ง, token ปลอม/หมดอายุ/หลัง reset, duplicate upload/submit/approve/claim/reject, concurrent stock claim, no-consent showcase, expired audio cleanup และ public storage access

- [ ] **Step 4: ตรวจหน้าจอจริง**

เก็บภาพทุกเส้นทางหลักที่ 360×800 และ 1280×720; Android/iOS อัดเสียงจริง; ตรวจ overflow, keyboard, permission denied, network retry และ playback ข้ามอุปกรณ์

- [ ] **Step 5: Sync documentation atomically**

เพิ่มกฎและ component spec ขั้นสุดท้ายใน DESIGN files; เพิ่ม versionHistory entry บนสุดที่สรุป routes, migrations, RLS, audio, ledger, rewards, showcase และ reports

- [ ] **Step 6: Stage เฉพาะงาน ตรวจ secret และ commit**

Run: `git diff --check`

ค้น `service_role`, PIN ตัวอย่างจริง, session token, cleanup secret และ signed URL ใน staged diff; ต้องไม่มีค่า secret

```bash
git add docs/qa/READING-BANK-FINAL-2026-09-14.md DESIGN.md DESIGN-COMPONENTS.md src/components/admin/system/SystemOverview.tsx
git commit -m "docs(reading-bank): verify complete school reading workflow"
git push origin main
```

- [ ] **Step 7: ตรวจ deployment หลัง push**

ตรวจ `/reading-bank`, `/teacher/reading-bank`, `/parent/reading-bank`, `/admin/dashboard/reading-bank` และหน้าแรกบน production; ตรวจ function logs ว่าไม่มี PIN/token/audio URL และบันทึก commit hash, deployment URL, เวลา และผลในรายงาน QA
