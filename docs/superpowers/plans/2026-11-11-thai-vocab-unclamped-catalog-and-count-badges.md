# แผนยกเลิกการจำกัด 150 คำ เพิ่มคำศัพท์ทั้งหมดสู่หมวด และแสดงจำนวนคำศัพท์ประจำหมวด

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปลดล็อกข้อจำกัดการตัดคำศัพท์ 150 คำใน Game Engine (`game.js`), บูรณาการคำศัพท์ใหม่จาก 4 แหล่งข้อมูลทั้งหมด (~2,500+ คำที่เหลือ) เข้าสู่หมวดคำศัพท์โดยไม่จำกัดโควตา, และเพิ่มป้ายแสดงจำนวนตัวเลขคำศัพท์อย่างเด่นชัดในทุกหมวดหมู่ทั้งบนการ์ดเลือกหมวดและแถบหัวข้อ

**Architecture:** 
1. **Unclamp Engine:** แก้ไขฟังก์ชัน `getApprovedWords(words)` ใน `game.js` โดยยกเลิกคำสั่ง `list.slice(0, 150)` เพื่อให้ส่งคืนคำศัพท์ที่อนุมัติทั้งหมดโดยไม่มีการจำกัดจำนวน
2. **Prominent Count Badges:** เพิ่ม Badge ตัวเลขแสดงจำนวนคำศัพท์ในแต่ละหมวดหมู่ (เช่น `[ 250 คำ ]`, `[ 1,200 คำ ]`) บน `.hub-card` ในหน้าแรก และใน `.grid-cat-header` ในหน้าเรียนรู้
3. **Full Scale Ingestion:** ปรับปรุง `categorize-and-integrate.mjs` ให้แยกแยะคำพื้นฐานประถม (`lesson`) ออกจากศัพท์ขั้นสูง (`difficult` / `p5-focus`) และผสานคำศัพท์ใหม่ที่ผ่านการตรวจสอบทั้งหมดเข้าสู่ไฟล์ข้อมูลหมวดหมู่
4. **Rebuild & Verification:** คอมไพล์ `data.js` ใหม่, รันการตรวจ `verify:game:all`, รันชุดทดสอบ Unit Tests และ `pnpm build`

**Tech Stack:** JavaScript (ESM), HTML5/CSS3, Thai Vocab Hub Engine (`public/games/thai/thai-vocab-hub`), Node.js Test Runner (`node --test`), Vite

**Spec:** คำสั่งผู้ใช้ (`/writing-plans คำที่เพิ่มเข้า นำมาเพิ่มในหมวดคำศัพท์ด้วย ไม่ต้องจำกัดไว้ 150 คำ ให้แต่ละหมวดมีจำนวนตัวเลขบอก ว่ามีคำศัพท์ในหมวดนี้ เท่าไหร่ด้วย`), หลักสูตรแกนกลางกลุ่มสาระการเรียนรู้ภาษาไทย (สพฐ.), และพจนานุกรมฉบับราชบัณฑิตยสภา

## Global Constraints

- ฟังก์ชัน `getApprovedWords` ใน `game.js` ต้อง **ไม่ตัดคำศัพท์ที่ 150 คำ** อีกต่อไป
- ทุกหมวดหมู่บนหน้าเลือกหัวข้อ (`#hub-grid`) ต้องมีป้ายตัวเลขบอกจำนวนคำศัพท์อย่างชัดเจน (เช่น `🏷️ 250 คำ` หรือ `(250 คำ)`) และอัปเดตตามตัวกรองระดับชั้น
- แถบความคืบหน้าการเล่นอัตโนมัติ (`autoplay-progress`) ต้องแสดงจำนวนจริงตามขนาดหมวด เช่น `1/250` หรือ `1/1200` ไม่ใช่ `1/150`
- คำศัพท์ใหม่ทุกคำต้องผ่านการผสานเนื้อหาครบถ้วน (คำอ่าน, ความหมาย, ชนิดคำ, ตัวชี้วัด, อิโมจิ, ประโยคตัวอย่างแท้) โดยไม่มีประโยค placeholder
- สคริปต์คอมไพล์ `build-vocab-data.mjs` และการตรวจ `verify:game:all` ต้องผ่านครบทุกเกณฑ์
- รัน `pnpm build` ผ่านสำเร็จสมบูรณ์

## Review Focus

1. **Root Cause of 150-Word Limit:** ใน `game.js` ฟังก์ชัน `getApprovedWords()` ทำการตรวจสอบ `word?.content_status` ซึ่งถูกตัดทิ้งตอนคอมไพล์ลง `data.js` ส่งผลให้เงื่อนไขตกไปที่ `list.slice(0, 150)` เสมอ ต้องแก้ไขให้ตรวจกรองเฉพาะ `content_status === 'quarantined'` และส่งคืนรายการทั้งหมด
2. **Dynamic Count Badge Rendering:** ตัวเลขจำนวนคำในแต่ละหมวดต้องคำนวณจากคำที่อนุมัติจริง และเมื่อเลือกตัวกรองระดับชั้น (ป.1 - ป.6) ตัวเลขต้องเปลี่ยนตามจำนวนคำในชั้นนั้นอย่างถูกต้อง
3. **Autoplay & Pagination Consistency:** เมื่อหมวดมีคำศัพท์มากกว่า 150 คำ ตัวนับในแถบ autoplay และระบบสไลด์การ์ดต้องรองรับจำนวนคำทั้งหมดได้ลื่นไหล ไม่เกิดบั๊ก overflow
4. **Balanced Category Ingestion:** การนำคำศัพท์ที่เหลือ 2,500+ คำเข้าหมวด ต้องไม่กองอยู่ที่หมวดใดหมวดหนึ่งมากเกินไป โดยกระจายคำศัพท์พื้นฐาน K-6 เข้า `lesson`, ศัพท์วิทยาศาสตร์-สังคมเข้า `p5-focus`, และศัพท์โครงสร้างซับซ้อนเข้า `difficult`
5. **No Performance Degradation:** การเรนเดอร์การ์ดจำนวนมากต้องยังคงรักษา Progressive chunking (ชุดละ 24 การ์ด) ตามเดิม ไม่ให้หน้าเว็บค้างหรือกระตุก

---

### Task 1: ปลดล็อกข้อจำกัด 150 คำใน Game Engine (`game.js`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js:73-81`
- Test: `tests/thai-vocab-hub/unclamped-catalog.test.mjs`

**Interfaces:**
- Consumes:
  - `words: Array<object>` (รายการคำศัพท์จาก `data.js` หรือหมวดหมู่)
- Produces:
  - `getApprovedWords(words) -> Array<object>` (ส่งคืนคำศัพท์ทั้งหมดที่ไม่ได้ถูกกักกัน โดยไม่ตัดที่ 150 คำ)

- [ ] **Step 1: เขียน Unit Test ตรวจสอบว่า getApprovedWords ไม่ตัดคำที่ 150 คำ (failing test)**

```javascript
// tests/thai-vocab-hub/unclamped-catalog.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('getApprovedWords does not clamp words to 150', () => {
  const gameJs = fs.readFileSync('public/games/thai/thai-vocab-hub/game.js', 'utf8');
  assert.ok(!gameJs.includes('list.slice(0, 150)'), 'Should not contain hardcoded list.slice(0, 150)');
  assert.ok(gameJs.includes('word.content_status !== \'quarantined\'') || gameJs.includes('word?.content_status !== \'quarantined\''));
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/unclamped-catalog.test.mjs`
Expected: FAIL (เพราะยังมี `list.slice(0, 150)` อยู่ใน `game.js`)

- [ ] **Step 3: แก้ไขฟังก์ชัน `getApprovedWords` ใน `public/games/thai/thai-vocab-hub/game.js`**

ปรับเปลี่ยนฟังก์ชัน:
```javascript
function getApprovedWords(words) {
  const list = Array.isArray(words) ? words : [];
  return list.filter((word) => !word || word.content_status !== 'quarantined');
}
```

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/unclamped-catalog.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add public/games/thai/thai-vocab-hub/game.js tests/thai-vocab-hub/unclamped-catalog.test.mjs
git commit -m "fix(thai-vocab-hub): remove 150-word clamp in game engine to support full category catalogs"
```

---

### Task 2: เพิ่มป้ายตัวเลขบอกจำนวนคำศัพท์อย่างเด่นชัดในทุกหมวดหมู่

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js:1547-1576`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Test: `tests/thai-vocab-hub/category-word-count-display.test.mjs`

**Interfaces:**
- Consumes:
  - `CATEGORIES`, `ALL_WORDS`, `getApprovedWords()`
- Produces:
  - `.hub-card` ที่มีป้าย `.hc-count-badge` เด่นชัดระบุจำนวนคำ (เช่น `250 คำ`)
  - สไตล์ CSS `.hc-count-badge` ที่มองเห็นชัดเจนในธีม Light Mode

- [ ] **Step 1: เขียน Unit Test ตรวจสอบว่าการ์ดหมวดหมู่แสดงจำนวนคำศัพท์ (failing test)**

```javascript
// tests/thai-vocab-hub/category-word-count-display.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('initHubGrid renders visible word count badge on category cards', () => {
  const gameJs = fs.readFileSync('public/games/thai/thai-vocab-hub/game.js', 'utf8');
  assert.ok(gameJs.includes('hc-count-badge') || gameJs.includes('hc-word-badge'), 'Expected dedicated count badge class in hub cards');
  
  const styleCss = fs.readFileSync('public/games/thai/thai-vocab-hub/style.css', 'utf8');
  assert.ok(styleCss.includes('.hc-count-badge') || styleCss.includes('.hc-word-badge'), 'Expected CSS styling for category count badge');
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/category-word-count-display.test.mjs`
Expected: FAIL with "Expected dedicated count badge class"

- [ ] **Step 3: แก้ไข `game.js` และ `style.css`**

- ใน `initHubGrid()`:
  เพิ่ม Badge แสดงจำนวนคำชัดเจนในแต่ละการ์ด เช่น:
  ```javascript
  <div class="hc-header-row">
    <div class="hc-icon">${cat.icon}</div>
    <div class="hc-count-badge">${count} คำ</div>
  </div>
  <div class="hc-th">${cat.title}</div>
  ```
- ใน `style.css`:
  เพิ่มสไตล์สำหรับ `.hc-count-badge` (พื้นหลังสีอ่อน ขอบมน ตัวหนา สอดคล้องกับ Light Mode และ Rule 14.x)

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/category-word-count-display.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add public/games/thai/thai-vocab-hub/game.js public/games/thai/thai-vocab-hub/style.css tests/thai-vocab-hub/category-word-count-display.test.mjs
git commit -m "feat(thai-vocab-hub): display prominent word count badges on category cards and headers"
```

---

### Task 3: บูรณาการคำศัพท์ใหม่ทั้งหมด 2,500+ คำเข้าสู่หมวดหมู่โดยไม่จำกัดโควตา

**Files:**
- Modify: `scripts/thai-vocab/categorize-and-integrate.mjs`
- Modify: `public/games/thai/thai-vocab-hub/data/words/*.json`
- Test: `tests/thai-vocab-hub/full-catalog-expansion.test.mjs`

**Interfaces:**
- Consumes:
  - 2,531 New Candidate Words จาก Task 1 & 2
- Produces:
  - อัปเดตไฟล์ `public/games/thai/thai-vocab-hub/data/words/*.json` โดยผสานคำศัพท์ใหม่ครบถ้วน

- [ ] **Step 1: เขียน Unit Test ตรวจสอบว่าคลังคำศัพท์ได้รับการขยายมากกว่า 4,500 คำ (failing test)**

```javascript
// tests/thai-vocab-hub/full-catalog-expansion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Thai Vocab Hub catalog has expanded beyond 4,500 total words', () => {
  const dir = 'public/games/thai/thai-vocab-hub/data/words';
  let totalWords = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json') && x !== 'spelling-decoder.json')) {
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    totalWords += list.length;
  }
  assert.ok(totalWords >= 4500, `Expected total words >= 4500, got ${totalWords}`);
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/full-catalog-expansion.test.mjs`
Expected: FAIL (ปัจจุบันมี 3,797 คำ)

- [ ] **Step 3: ปรับปรุง `scripts/thai-vocab/categorize-and-integrate.mjs` และรันบูรณาการเต็มรูปแบบ**

- ปรับเกณฑ์ `categorizeWord`:
  - คำศัพท์พื้นฐานระดับประถมทั่วไป (เช่น ครอบครัว, โรงเรียน, ดินสอ, ยางลบ, สัตว์, พืช, อาหาร, ผลไม้) จัดเข้า `lesson`
  - คำศัพท์วิทยาศาสตร์ สิ่งแวดล้อม ธรรมชาติ เทคโนโลยี จัดเข้า `p5-focus`
  - คำศัพท์ยาก/วิชาการ/คำประสมซับซ้อน จัดเข้า `difficult`
  - ปลดล็อกพารามิเตอร์ `maxPerCategory = 2000`
- รันสคริปต์เพื่อผสานคำศัพท์ทั้งหมดลงใน `public/games/thai/thai-vocab-hub/data/words/*.json`

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/full-catalog-expansion.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add scripts/thai-vocab/categorize-and-integrate.mjs public/games/thai/thai-vocab-hub/data/words/*.json tests/thai-vocab-hub/full-catalog-expansion.test.mjs
git commit -m "feat(thai-vocab-hub): integrate complete candidate vocabulary into categories without artificial caps"
```

---

### Task 4: คอมไพล์ฐานข้อมูล, รันการตรวจรับรองเกม และอัปเดตเวอร์ชันระบบ

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data.js`
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Test: `node scripts/build-vocab-data.mjs`
- Test: `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`
- Test: `node --test tests/thai-vocab-hub/*.test.mjs`
- Test: `pnpm build`

**Interfaces:**
- Consumes:
  - ข้อมูลหมวดหมู่ทั้งหมดใน `public/games/thai/thai-vocab-hub/data/words/*.json`
- Produces:
  - `public/games/thai/thai-vocab-hub/data.js` คอมไพล์ใหม่สมบูรณ์
  - บันทึกเวอร์ชัน `v2.8.19` ในประวัติระบบ

- [ ] **Step 1: รันคำสั่งคอมไพล์ฐานข้อมูลคำศัพท์**

Run: `node scripts/build-vocab-data.mjs`
Expected: `✅ Wrote public/games/thai/thai-vocab-hub/data.js`

- [ ] **Step 2: ตรวจสอบความถูกต้องของคลังข้อมูลคำศัพท์ทั้งหมด**

Run: `node scripts/build-vocab-data.mjs --check`
Expected: ตรวจสอบผ่านครบทั้ง 17 หมวดหมู่

- [ ] **Step 3: ตรวจสอบความสมบูรณ์ของ Game Engine และ SDK Integration**

Run: `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`
Expected: ผ่านครบทั้ง 12 มิติ (DOM element, Cover, SDK, Audio, Lifecycle)

- [ ] **Step 4: รันชุดทดสอบ Unit Tests ทั้งหมดของ Thai Vocab Hub**

Run: `node --test tests/thai-vocab-hub/*.test.mjs`
Expected: ผ่าน 100% ทุกข้อทดสอบ

- [ ] **Step 5: อัปเดต System Overview และบันทึกประวัติเวอร์ชัน**

เพิ่ม entry เวอร์ชัน `v2.8.19` ใน `versionHistory` ของ `src/components/admin/system/SystemOverview.tsx`

- [ ] **Step 6: ตรวจสอบการ Build ของแอปพลิเคชันหลัก**

Run: `pnpm build`
Expected: `✓ built in ...` สำเร็จสมบูรณ์ ไม่มี error

- [ ] **Step 7: Git commit และ push สู่ remote**

```bash
git add public/games/thai/thai-vocab-hub/data.js src/components/admin/system/SystemOverview.tsx
git commit -m "feat(thai-vocab-hub): compile expanded vocabulary hub with full categories and count badges v2.8.19"
```
