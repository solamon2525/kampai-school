# กระต่าย thai-sara-run (จากภาพอ้างอิง)

## โมเดล
มุมข้าง chibi + หมวก · 128×128 · 12 เฟรม

| เฟรม | ท่า |
|------|-----|
| 0 | idle |
| 1–2 | เดิน |
| 3–6 | วิ่ง |
| 7–9 | กระโดด |
| 10 | โดน |
| 11 | ยินดี (มุมหน้า) |

## สร้าง sprite จากเฟรมฐาน (bunny-base.png)
```bash
node scripts/build-sara-run-from-base.mjs
```
วาดท่า **เดิน / วิ่ง / กระโดด** จากเฟรมเดียวโดยขยับขา+ตัว

## สร้างจาก grid เก่า (reference-bunny.png)
```bash
node scripts/import-sara-run-reference.mjs
```

## แก้ใน Piskel
Import `bunny-white.piskel` → Export PNG sprite sheet แนวนอน 12 columns → ทับ `bunny-white-sheet.png` (1536×128)
