# MEDIA.md — สื่อการสอน (kampai-school)

Live hub: หมวด `media` ใน Educational Hub · สัญญาสร้างชิ้นใหม่: [`public/MEDIA-PROMPT.md`](public/MEDIA-PROMPT.md) · เทมเพลต: [`public/games/_template-media.html`](public/games/_template-media.html)

## Dual-track (สื่อ ↔ ใบงาน)

| สื่อ | ใบงาน | `worksheet_key` |
|---|---|---|
| `public/games/{subject}/*-media.html` หรือ `*-thinking-media.html` | `*-worksheet.html` | ค่าใน `WORKSHEET_CONFIG.worksheetKey` |
| QR / meta `worksheet-source-media` | ชี้กลับสื่อ | ชุดบันทึกใช้ key เดียวกัน |

กฎชื่อ: ต้นทางสอนบนจอใช้ suffix **`-media.html`** · ไฟล์เก่าที่เปลี่ยนชื่อต้องเหลือ **redirect HTML** ไป path ใหม่ · อัป `educational_hub_items.external_url` ใน migration เดียวกัน

รายละเอียดใบงาน / verify ใบงาน → [`WORKSHEET.md`](WORKSHEET.md)

## สัญญาโหมด (Phase 7+)

สื่อชิ้นใหม่หรือที่แตะในเฟสนี้ต้องมีอย่างน้อย:

1. **📖 สอน / เรียนรู้** — สาธิตบนโปรเจคเตอร์ได้
2. **✏️ ฝึกสั้น** — MCQ หรือเช็กความเข้าใจสั้น ๆ (ไม่ใช่เกมแข่งคะแนน)

ห้าม: `submitScore` / leaderboard / lives / timer แข่ง (นั่นคือเกม — ดู `GAME.md`)

## Verification

```bash
pnpm verify:media public/games/{subject}/{slug}-media.html
pnpm verify:worksheet public/games/{subject}/{slug}-worksheet.html   # ถ้ามีคู่ใบงาน
pnpm verify:worksheet:matrix -- --strict
```

หลัง seed/อัป URL ในคลัง → apply migration แล้ว `pnpm verify:worksheet:production` เมื่อแตะรายการ worksheets

## Shipping checklist

- [ ] HTML สื่อ + (ถ้ามี) ใบงานคู่
- [ ] redirect ไฟล์เก่า (ถ้า rename)
- [ ] migration: `external_url` + `game_docs` (+ `indicator_games` ถ้าเชื่อมตัวชี้วัดใหม่)
- [ ] `SystemOverview` `versionHistory`
- [ ] sync ตาราง dual-track ใน `WORKSHEET.md` เมื่อเพิ่มคู่ใหม่สำคัญ
- [ ] commit · push หรือ `vercel deploy --prod` ไปโปรเจกต์ `kampai-school`

## Phase 7 notes

- **7A** English dual-track: `phonics-media` · `sight-words-media` · `grammar-mini-media` · `follow-instructions-media` · `grammar-vocab-media` (+ redirect เก่า)
- **7B** ฝึกสั้น MCQ: `rect-area` · `community-jobs` · `plant-parts` · `sufficiency` · `bone-muscle`
- **7C** วิชาบาง: `coding-social-media` · `thailand-map-media` · `sukhothai-timeline-media` · `water-cycle-media` · `color-mix-media`

## Phase 8 notes

- **8A** Lesson packs: ตาราง `lesson_packs` · แท็บชุดคาบ · seed คูณ/หารสั้น/Phonics/ห่วงโซ่/พอเพียง
- **8B** Dual-track rename leftovers: `fact-opinion` · `thai-word-types` · `states-of-matter` · `vertebrate-sort` · `fraction-pieces` · `sentence-structure` → `*-media.html`
- **8C** content fill dual-track (migration 432): `online-safety-media` · `symmetry-media` · `exercise-care-media` · `past-tense-mini-media` · `money-change-media` (+ คู่ `*-worksheet`)
- **8D–8F** Teacher usage panel · diagnostic→remedial · lesson favorites + parent ใบงานบ้าน
- **8G** `verify:media` เช็กสัญญา: `setSlug`/`MEDIA_SLUG` · โหมดสอน · ฝึกสั้น · ห้าม `submitScore`
