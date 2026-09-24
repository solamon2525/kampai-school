# Reading Bank Phase 3 Review and Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ครูตรวจและรับรองงานแบบไม่ให้คะแนนซ้ำ นักเรียนเห็นคะแนนสะสม/คงเหลือ และใช้เหรียญธนาคารการอ่านแลกรางวัลในคลังเดิมได้

**Architecture:** ใช้ review events และ immutable reading ledger การรับรองกับฝากคะแนนเกิดใน RPC transaction เดียว รางวัลเดิมเพิ่ม `reading_points_cost`; public claim เดิมต้องปฏิเสธรางวัลที่ใช้เหรียญอ่าน ส่วนการแลกด้วยเหรียญอ่านทำผ่าน student session API และ RPC ที่รับ student UUID จากบริการเท่านั้น

**Tech Stack:** Supabase Postgres transactions/RLS, Edge Functions, React Query, React/TypeScript, Playwright

**Spec:** `docs/superpowers/specs/2026-09-14-reading-bank-design.md`

## Global Constraints

- คะแนนพื้นฐาน lower=10, upper=15; โบนัสมีเฉพาะ 0/2/5
- รับรอง attempt แรกที่สำเร็จสร้าง earn transaction ได้ครั้งเดียวด้วย unique source
- Ledger append-only; ห้าม UPDATE/DELETE รายการเดิม
- คะแนนสะสมรวมเฉพาะ earn/positive adjustment; คะแนนใช้ได้รวม signed transactions
- การแลกรางวัลและ stock update เป็น transaction เดียว; reject คืนเหรียญด้วย refund row ใหม่
- `claim_reward(student_code,...)` เดิมต้อง reject เมื่อ `reading_points_cost > 0`
- เสียงไม่เปิด public; ครูรับ URL ชั่วคราวผ่าน service
- ทุก mutation invalidate query keys ที่เกี่ยวข้อง

---

### Task 1: เพิ่ม review, ledger และ RPC รับรองแบบ atomic

**Files:**
- Create: `supabase/migrations/20260914012000_reading_bank_review_wallet.sql`
- Create: `scripts/test-reading-bank-review-wallet.mjs`
- Modify: `package.json`
- Regenerate: `src/integrations/supabase/types.ts`

**Interfaces:**
- Tables: `reading_review_events`, `reading_coin_transactions`
- View: `reading_student_wallets`
- RPC: `review_reading_submission(uuid,text,integer,text,uuid)`
- RPC: `adjust_reading_coins(uuid,integer,text)` admin only

- [ ] **Step 1: เขียน failing contract test**

```js
assert.match(sql, /CREATE TABLE public\.reading_review_events/i);
assert.match(sql, /CREATE TABLE public\.reading_coin_transactions/i);
assert.match(sql, /UNIQUE\s*\(source_type,\s*source_id\)/i);
assert.match(sql, /bonus_coins\s+integer.*IN\s*\(0,\s*2,\s*5\)/is);
assert.match(sql, /pg_advisory_xact_lock/i);
assert.match(sql, /REVOKE\s+UPDATE,\s*DELETE/i);
```

- [ ] **Step 2: รันให้ล้มก่อนมี migration**

Run: `node scripts/test-reading-bank-review-wallet.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: สร้าง review events และ ledger**

Review decision มี `approved|changes_requested`; เก็บ attempt, reviewer user/staff, bonus, feedback และ created_at. Ledger columns: student_id, amount signed nonzero, transaction_type `earn|spend|refund|adjustment|reversal`, source_type, source_id, reason, actor_user_id, balance_before, balance_after, created_at

- [ ] **Step 4: สร้าง review RPC**

ตรวจ teacher assignment access, submission status=`submitted`, bonus set, attempt clips พร้อม; lock submission/student; insert review; ถ้า approve ให้ insert ledger amount=`base_coins+bonus` source=`submission_approval` และ update status=`approved`; ถ้า changes ให้ update status=`changes_requested` โดยไม่ insert ledger; unique conflict ของ approval คืนผลเดิม

- [ ] **Step 5: สร้าง wallet view และ append-only policies**

View คืน `student_id,total_earned,available_balance`; parent SELECT ได้เฉพาะ `student_id` ที่อยู่ใน `parent_student_links`, teacher SELECT ได้เฉพาะ assignment ใน `reading_teacher_classrooms`, admin SELECT ได้ทั้งหมด, anon ไม่มี grant และทุก mutation ทำผ่าน RPC เท่านั้น; trigger ปฏิเสธ update/delete ledger แม้ service-role path ที่ไม่ใช่ maintenance function

- [ ] **Step 6: Reset DB, regenerate, test concurrent approval**

Run: `supabase db reset`

Run: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

Run: `node scripts/test-reading-bank-review-wallet.mjs --integration`

Expected: approve สองคำขอพร้อมกันมี ledger earn หนึ่ง row, changes request ไม่มีคะแนน, adjustment สร้าง row ใหม่

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260914012000_reading_bank_review_wallet.sql scripts/test-reading-bank-review-wallet.mjs package.json src/integrations/supabase/types.ts
git commit -m "feat(reading-bank): add atomic reviews and coin ledger"
```

### Task 2: เพิ่มเหรียญอ่านในคลังรางวัลและปิดช่อง public claim

**Files:**
- Create: `supabase/migrations/20260914012100_reward_reading_points_wallet.sql`
- Create: `scripts/test-reading-reward-wallet.mjs`
- Modify: `src/services/waste-bank.service.ts`
- Modify: `src/components/rewards/reward-cost.ts`
- Modify: `src/components/rewards/RewardCostDisplay.tsx`
- Modify: `src/components/rewards/RewardClaimDialog.tsx`
- Modify: `src/pages/RewardsCatalog.tsx`
- Regenerate: `src/integrations/supabase/types.ts`

**Interfaces:**
- `rewards.reading_points_cost integer NOT NULL DEFAULT 0`
- `reward_claims.reading_points_used`, `reading_balance_after`
- RPC internal: `claim_reward_for_student(uuid,uuid,integer,text)`
- Student API action: `claim-reward`
- Public RPCs `lookup_student_balance` และ `get_student_history` คงผลลัพธ์เดิมและไม่เปิดยอดเหรียญอ่านด้วยรหัสนักเรียนอย่างเดียว

- [ ] **Step 1: เขียน failing wallet test**

ทดสอบ reward reading cost 20: public `claim_reward(code,...)` ได้ `READING_PIN_REQUIRED`; session นักเรียน balance 19 ได้ `INSUFFICIENT_READING_POINTS`; balance 20 claim สำเร็จและ ledger spend=-20; เรียก idempotency key ซ้ำได้ claim เดิม; reject สร้าง refund=20 หนึ่งครั้ง

- [ ] **Step 2: รันให้ล้มก่อน migration**

Run: `node scripts/test-reading-reward-wallet.mjs --integration`

Expected: FAIL เพราะไม่มี reading fields

- [ ] **Step 3: เพิ่ม columns/constraints และ RPC**

เพิ่ม reading cost เข้า constraint `waste + virtue + reading > 0`; ปรับ normalize trigger ให้ `points_cost` เป็นผลรวมทั้งสาม; เพิ่ม reading used/balance ใน claims; `claim_reward_for_student` lock student/reward, ตรวจทั้งสาม wallet กับ stock, insert claim, ledger spend, และลด stockใน transaction เดียว คง projection ของ public balance/history เดิมไว้ ส่วนยอดและประวัติเหรียญอ่านคืนผ่าน student session API เท่านั้น

- [ ] **Step 4: ปรับ public RPC เดิมอย่างเข้ากันได้**

ก่อนคำนวณยอด หาก reward `reading_points_cost > 0` ให้ raise `READING_PIN_REQUIRED`; reward ที่ reading cost=0 ทำงานเหมือนเดิมทุกประการ

- [ ] **Step 5: เพิ่ม claim-reward ใน reading-student-api**

ตรวจ student session แล้วเรียก `claim_reward_for_student` ด้วย student ID จาก session เท่านั้น ห้ามรับ student ID/code จาก request; ส่ง idempotency key; คืน claim ID และ wallet ใหม่

- [ ] **Step 6: ปรับ types และ UI ราคา**

```ts
export type RewardCost = { waste: number; virtue: number; reading: number };
export const canAffordReward = (
  reward: Reward,
  balance: StudentBalanceLookup,
  readingAvailable?: number,
) => balance.waste_points_available >= reward.waste_points_cost
  && balance.virtue_points_available >= reward.virtue_points_cost
  && (reward.reading_points_cost === 0
    || (readingAvailable !== undefined && readingAvailable >= reward.reading_points_cost));
```

แสดง “อ่าน” เฉพาะ cost > 0; dialog public แจ้งให้เข้า `/reading-bank` เมื่อรางวัลต้องใช้เหรียญอ่าน

- [ ] **Step 7: รัน integration, lint และ build**

Run: `node scripts/test-reading-reward-wallet.mjs --integration`

Run: `pnpm exec eslint src/services/waste-bank.service.ts src/components/rewards src/pages/RewardsCatalog.tsx`

Run: `pnpm build`

Expected: ผ่านทั้งหมดและ reward เดิมไม่เปลี่ยนพฤติกรรม

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260914012100_reward_reading_points_wallet.sql scripts/test-reading-reward-wallet.mjs src/integrations/supabase/types.ts src/services/waste-bank.service.ts src/components/rewards src/pages/RewardsCatalog.tsx
git commit -m "feat(rewards): support reading-bank coins"
```

### Task 3: สร้างกล่องตรวจงานของครู

**Files:**
- Create: `src/components/reading-bank/teacher/ReviewQueue.tsx`
- Create: `src/components/reading-bank/teacher/SubmissionReviewPanel.tsx`
- Create: `src/components/reading-bank/teacher/ReadingAudioPlayer.tsx`
- Create: `scripts/test-reading-review-ui.mjs`
- Modify: `src/services/reading-bank.service.ts`
- Modify: `src/pages/teacher/TeacherReadingBank.tsx`
- Modify: `src/components/teacher/TeacherPendingTasksCard.tsx`

**Interfaces:**
- `readingBankService.listPendingReviews(filters)`
- `readingBankService.getSubmissionForReview(submissionId)`
- `readingBankService.getAudioPlaybackUrl(clipId)`
- `readingBankService.reviewSubmission({ submissionId, attemptId, decision, bonusCoins, feedback })`

- [ ] **Step 1: เขียน UI contract test**

ยืนยันรายชื่อนักเรียนใช้ PersonAvatar, มี player label “อ่านออกเสียง”/“เล่าเรื่อง”, bonus buttons 0/2/5, approve disabled จนเสียงโหลดได้, mutation success invalidate pending/submission/wallet keys และไม่มี `supabase.from` ใน component

- [ ] **Step 2: รันให้ล้มก่อนมี components**

Run: `node scripts/test-reading-review-ui.mjs`

Expected: FAIL `ENOENT`

- [ ] **Step 3: เพิ่ม service methods และ signed playback action**

เพิ่ม teacher action ใน `reading-audio-api` ที่ตรวจ JWT กับ Supabase Auth แล้วตรวจ assignment access ก่อนคืน signed URL อายุ 10 นาที; service เป็นผู้เรียก ห้าม component แตะ storage โดยตรง

- [ ] **Step 4: สร้าง ReviewQueue และ panel**

กรองห้อง/บทความ/สถานะ/วันส่ง; panel แสดง article excerpt, attempt history, audio players, feedback presets และ textarea; approve dialog สรุป base+bonus+total; changes request บังคับเหตุผล

- [ ] **Step 5: เชื่อม TeacherPendingTasksCard**

เพิ่มจำนวน reading submissions ที่รอตรวจและ link `/teacher/reading-bank?tab=reviews`; query ผ่าน readingBankService และ cache แยก

- [ ] **Step 6: รัน test/lint/browser**

Run: `node scripts/test-reading-review-ui.mjs`

Run: `pnpm exec eslint src/components/reading-bank/teacher src/services/reading-bank.service.ts src/pages/teacher/TeacherReadingBank.tsx src/components/teacher/TeacherPendingTasksCard.tsx`

เปิด review ที่ 360×800 และ 1280×720; player/ปุ่มไม่ล้น

- [ ] **Step 7: Commit**

```bash
git add src/components/reading-bank/teacher src/services/reading-bank.service.ts src/pages/teacher/TeacherReadingBank.tsx src/components/teacher/TeacherPendingTasksCard.tsx scripts/test-reading-review-ui.mjs supabase/functions/reading-audio-api/index.ts
git commit -m "feat(reading-bank): add teacher review workflow"
```

### Task 4: เพิ่มกระเป๋าเหรียญและการแลกรางวัลในหน้าของนักเรียน

**Files:**
- Create: `src/components/reading-bank/student/ReadingWallet.tsx`
- Create: `src/components/reading-bank/student/ReadingRewardCatalog.tsx`
- Create: `src/components/reading-bank/student/ReadingHistory.tsx`
- Create: `scripts/test-reading-wallet-browser.mjs`
- Modify: `src/pages/student/ReadingBank.tsx`
- Modify: `src/services/reading-bank-student.service.ts`

**Interfaces:**
- API actions: `wallet`, `rewards`, `claim-reward`, `reward-history`
- Query keys: `['reading-bank','student','wallet']`, `['reading-bank','student','rewards']`, `['reading-bank','student','reward-history']`

- [ ] **Step 1: เขียน browser test**

mock wallet total=120 available=80; ยืนยันแสดงทั้งสองค่า; reward cost=90 ปุ่ม disabled, cost=40 claim ได้; double click ส่ง idempotency key เดียว; success แสดง available=40 และประวัติ; reject แสดง refund

- [ ] **Step 2: รันให้ล้มก่อนมี components**

Run: `node scripts/test-reading-wallet-browser.mjs --base-url http://127.0.0.1:4173`

Expected: FAIL

- [ ] **Step 3: เพิ่ม API/service methods**

API คืนเฉพาะ active rewards และสามต้นทุน; claim ใช้ student จาก session; success client invalidate wallet/rewards/history/dashboard พร้อมกัน

- [ ] **Step 4: สร้าง wallet/catalog/history UI**

ยอดสะสมกับยอดใช้ได้ต้อง label ชัด; การ์ดรางวัลใช้ shared RewardCard/RewardCostDisplay; confirm dialog สรุปยอดก่อน/ใช้/หลัง; pending/approved/rejected แสดงข้อความไทยเดียวกับระบบกลาง

- [ ] **Step 5: รัน browser/lint/build**

Run: `node scripts/test-reading-wallet-browser.mjs --base-url http://127.0.0.1:4173 --viewports 360x800,1280x720`

Run: `pnpm exec eslint src/components/reading-bank/student src/pages/student/ReadingBank.tsx src/services/reading-bank-student.service.ts`

Run: `pnpm build`

Expected: ผ่านและไม่มี overflow

- [ ] **Step 6: Commit**

```bash
git add src/components/reading-bank/student src/pages/student/ReadingBank.tsx src/services/reading-bank-student.service.ts scripts/test-reading-wallet-browser.mjs
git commit -m "feat(reading-bank): let students spend reading coins"
```

### Task 5: เพิ่มมุมมองผู้ปกครองและตรวจรับระยะที่ 3

**Files:**
- Create: `src/pages/parent/ParentReadingBank.tsx`
- Create: `src/components/parent/ParentReadingSummary.tsx`
- Create: `scripts/test-parent-reading-access.mjs`
- Create: `docs/qa/READING-BANK-PHASE-3-2026-09-14.md`
- Modify: `supabase/functions/reading-audio-api/index.ts`
- Modify: `src/services/reading-bank.service.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages/parent/ParentDashboard.tsx`
- Modify: `src/lib/commands/registry.ts`
- Modify: `DESIGN.md`
- Modify: `DESIGN-COMPONENTS.md`
- Modify: `src/components/admin/system/SystemOverview.tsx`

- [ ] **Step 1: เขียน parent access test**

parent A เห็น summary/wallet/reviews/audio ของ child A, ไม่เห็น child B, ไม่มีปุ่มอัด/ส่ง/แลกรางวัล, signed URL ของ child A หมดอายุตามกำหนด

- [ ] **Step 2: สร้าง parent service queries, playback authorization และ UI**

เพิ่ม service queries ที่ใช้ `parent_student_links`; เพิ่ม action ขอ playback URL ใน `reading-audio-api` ซึ่งตรวจ JWT และยืนยันว่า clip เป็นของบุตร; ใช้ `useParentChildren`/active child pattern เดิม; แสดง PersonAvatar, จำนวนเรื่อง, wallet, status, feedback และ audio ของบุตร; route `/parent/reading-bank` ครอบ `PortalProtectedRoute allow={['parent','admin']}`

- [ ] **Step 3: เพิ่ม parent menu/command และรัน registry guard**

เพิ่ม `p-reading-bank` พร้อม icon ที่ import จริง; ห้ามทำให้ registry blank screen

- [ ] **Step 4: รัน full phase tests**

Run: `node scripts/test-reading-bank-review-wallet.mjs --integration`

Run: `node scripts/test-reading-reward-wallet.mjs --integration`

Run: `node scripts/test-reading-review-ui.mjs`

Run: `node scripts/test-reading-wallet-browser.mjs --viewports 360x800,1280x720`

Run: `node scripts/test-parent-reading-access.mjs`

Run: `pnpm build`

Expected: ผ่านทั้งหมด

- [ ] **Step 5: Sync docs/version และเขียน QA evidence**

บันทึก concurrent approval, duplicate protection, claim/refund, role matrix และภาพสอง viewport; เพิ่ม version entry บนสุด

- [ ] **Step 6: Commit และ push**

```bash
git add src/pages/parent/ParentReadingBank.tsx src/components/parent/ParentReadingSummary.tsx supabase/functions/reading-audio-api/index.ts src/services/reading-bank.service.ts src/App.tsx src/pages/parent/ParentDashboard.tsx src/lib/commands/registry.ts scripts/test-parent-reading-access.mjs docs/qa/READING-BANK-PHASE-3-2026-09-14.md DESIGN.md DESIGN-COMPONENTS.md src/components/admin/system/SystemOverview.tsx
git commit -m "feat(reading-bank): add parent results and verify rewards"
git push origin main
```
