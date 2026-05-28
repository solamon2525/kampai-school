---
description: Integrate kampai-school postMessage protocol + score tracking เข้าเกม HTML ใหม่
argument-hint: <path-to-game.html>
---

# /integrate-game $ARGUMENTS

คุณกำลังทำหน้าที่ integrate เกม HTML ใหม่เข้าระบบ kampai-school ทำตามขั้นตอนนี้ลำดับ:

## 1. อ่านเอกสารและไฟล์เกม

- อ่าน `GAME.md` ทั้งไฟล์ (คู่มือมาตรฐาน)
- อ่านไฟล์ `$ARGUMENTS` (เกมที่ต้อง integrate)

## 2. ตรวจ integration ปัจจุบัน

รัน verify script:
```
pnpm verify:game $ARGUMENTS
```

จับว่าขาดอะไร:
- ❌ ไม่พบ `GAME_SLUG` → ต้องเพิ่ม EMBED block
- ❌ `GAME_SLUG = 'placeholder-slug'` → ต้องเปลี่ยนเป็น slug จริงตามชื่อไฟล์
- ❌ ไม่พบ `sendGameEnd()` define → ต้องเพิ่ม EMBED block
- ❌ ไม่พบ `navigateBack()` define → ต้องเพิ่ม EMBED block
- ❌ ไม่พบ init listener → EMBED block ไม่ครบ
- ❌ `sendGameEnd` ถูก define แต่ไม่ถูกเรียก → ต้องเพิ่มในจุดจบเกม
- ❌ ไม่พบ migration → ต้องสร้าง SQL migration

## 3. แก้ตามที่ขาด

### ถ้าขาด EMBED block:
Copy block จาก `GAME.md` Section 3 วางต้นสุดของ `<script>` tag หลัก แก้ `GAME_SLUG` เป็น slug จริง (ใช้ชื่อไฟล์โดยตัด `.html` ออก)

### ถ้า `sendGameEnd` ไม่ถูกเรียก:
หาฟังก์ชันจุดจบเกม (มักชื่อ `endGame()`, `gameOver()`, `showGameOver()`) แล้วเพิ่ม:
```javascript
sendGameEnd(score, 'normal', {
    // เพิ่ม metadata เช่น wave, lives_remaining, level
});
```

### ถ้าปุ่ม "กลับ" / "Home" ใช้ `window.location.href`:
แทนด้วย `navigateBack()` หรือใช้ `<a target="_top" href="/h/nattapong">` (anchor interceptor จะแปลงให้)

### ถ้ามี Firebase SDK หรือ input ชื่อผู้เล่น:
- Firebase: comment `<script src="...firebasejs...">` และ `saveScoreToFirebase()` ออก
- Input ชื่อ: ลบ `<input id="player-name">` ออก ใช้ `DISPLAY_NAME_INIT` แทนถ้าต้องการชื่อ

### ถ้ายังไม่มี migration:
สร้างไฟล์ `supabase/migrations/NNN_seed_{slug}_game.sql` ตาม pattern ใน GAME.md Section 5
หา NNN ถัดไปด้วย `ls supabase/migrations/ | tail`

## 4. (Optional) เพิ่ม Leaderboard

ถ้าต้องการแสดง top-5 leaderboard บน start/gameover screen:
Copy HTML+CSS+JS ทั้งหมดจาก `public/games/_template-full.html` Section B (Supabase Leaderboard)

## 5. Verify อีกครั้ง

รัน `pnpm verify:game $ARGUMENTS` อีกครั้ง — ต้องผ่านทั้ง 6 checks

## 6. รายงานผล

สรุปสั้น ๆ:
- ⚙️ แก้อะไรบ้าง (bullet points)
- 📝 ต้องสร้าง migration ไหม (ถ้าใช่ — ระบุไฟล์)
- ✅ verify ผลลัพธ์
- 🚀 พร้อม commit หรือไม่

**ห้ามทำเอง:** อย่า commit / push — ปล่อยให้ user สั่งเอง
