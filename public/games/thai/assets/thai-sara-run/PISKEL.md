# แก้กระต่ายมุมหน้าใน Piskel

## เฟรม (12)
| # | ท่า |
|---|-----|
| 0 | idle ยืน |
| 1–2 | เดิน |
| 3–6 | วิ่ง |
| 7–9 | กระโดด (ขึ้น / ลอย / ลง) |
| 10 | โดน |
| 11 | ยินดี |

## เปิดไฟล์
1. [piskelapp.com](https://www.piskelapp.com/p/create/sprite) → **Import** → `bunny-white.piskel`
2. แก้ pixel ทีละเฟรม (64×64)

## Export
**Export** → PNG → Sprite sheet แนวนอน 12 columns → ทับ `bunny-white-sheet.png` (768×64)

## สร้างใหม่
```bash
node scripts/generate-sara-run-sprites.mjs
```
