# Stitch Generation Prompt — `/waste-bank/rewards` (ห้องของรางวัล)

> **Paste ทั้งไฟล์นี้ที่** [labs.google.com/stitch](https://labs.google.com/stitch)
> → ขอให้ generate **"Public school rewards catalog page (Thai elementary)"**
>
> Stitch จะอ่าน constraints + creative brief แล้ว render mockup ที่ใช้
> **Sarabun** font, **green primary**, ไม่มี purple/Inter/centered hero
>
> **Source of truth:** [`../DESIGN-STITCH.md`](../DESIGN-STITCH.md) — อย่าแก้ไฟล์นี้
> โดยตรง ปรับที่ DESIGN-STITCH.md แล้ว regen prompt นี้

---

## 1. Project Hard Constraints (Non-Negotiable)

- **Font:** Sarabun (Google Fonts wght 100–800) — Thai-ready
  - ❌ ห้าม Inter, Times New Roman, Georgia, Garamond, Palatino
  - ❌ ห้าม distinctive serif ใดๆ (Fraunces, Editorial New, Instrument Serif) — render ภาษาไทยไม่ได้
- **Brand color:** Forest Green `#157F3C` (HSL 142 72% 29%) — primary CTA + brand mark
- **Mode:** Light only (public site เท่านั้น)
- **Functional emoji allowed:** 🌱🌿🌳🏆 (tier indicator), 🥇🥈🥉 (rank). **Decorative emoji ห้าม**
- **Hero:** centered allowed (existing pattern) แต่ encourage **asymmetric / split-screen**
- **No pure black** `#000000` — ใช้ Forest Ink `#14291C` แทน

---

## 2. Visual Atmosphere

**"Sun-dappled forest classroom"** — โล่ง สว่าง สดชื่น เหมือนเดินอยู่ในห้องเรียน STEM ที่แสงสาดผ่านใบไม้ลงมา เด็กดูแล้วอยากเก็บขยะ/ทำดีเพิ่ม

| มิติ | คะแนน | คำอธิบาย |
|---|---|---|
| Density | 4 | Daily App Balanced — leaning airy. ไม่อัดข้อมูลเหมือน cockpit |
| Variance | 5 | Offset asymmetric — ฉีกแนวเล็กน้อย ไม่ chaotic |
| Motion | 6 | Fluid CSS spring + perpetual subtle micro-loop on rank/badge |
| Mood | clinical-warm | สะอาด เป็นมืออาชีพ + อบอุ่นแบบโรงเรียนชนบท |

---

## 3. Color Palette

### Core neutrals + brand
| Role | Hex | Use |
|---|---|---|
| Background | `#FFFFFF` | page bg |
| Quiet Surface | `#F0F7F1` | alt section bg |
| Primary | `#157F3C` | CTA, brand mark, active state |
| Primary Light | `#33AE60` | hover state, accent icon |
| Primary Pale | `#E5F0E7` | secondary button bg, badge bg |
| Primary Deep | `#0F5C2C` | text on pale (contrast pass 7.2:1) |
| Foreground | `#14291C` | body text — **never `#000000`** |
| Muted Text | `#568165` | secondary text, helper, metadata |
| Border | `#C8DECE` | 1px structural lines |
| Accent (≤5%) | `#FFD874` | award highlight, CTA "ดูรางวัล" sticker |
| Destructive | `#DC2626` | error, delete only |

### Tier ribbons (badge bg only, never section bg)
| Tier | Badge bg | Range |
|---|---|---|
| 🌱 ระดับเริ่มต้น | `bg-lime-100 text-lime-700` | 0–50 แต้ม |
| 🌿 ระดับดี | `bg-emerald-100 text-emerald-700` | 51–150 แต้ม |
| 🌳 ระดับเยี่ยม | `bg-teal-100 text-teal-700` | 151–300 แต้ม |
| 🏆 ระดับเลิศ | `bg-amber-100 text-amber-700` | 301+ แต้ม |

---

## 4. Page Brief — หน้าแลกรางวัล (Rewards Catalog)

**Goal:** เด็กนักเรียนชั้นประถม (อ.1 ถึง ป.6) เปิดดูของรางวัลที่แลกได้ด้วย "แต้มสะสม" จากธนาคารขยะ — กรอกรหัสนักเรียน 4 ตัว → ส่งคำขอแลก → ครูอนุมัติทีหลัง

### Functional must-haves
1. **Hero section** — ชื่อหน้า + คำอธิบายสั้น + ปุ่ม "ตรวจสอบแต้มของฉัน" (เปิด dialog ให้กรอกรหัส → แสดงชื่อ + แต้มคงเหลือ)
2. **Tier overview strip** — 4 ลิงก์ (anchor) ไป tier sections
3. **4 tier sections** (เรียงจากแต้มต่ำไปสูง) — heading + รายการรางวัลใน tier นั้น
4. **Reward Card** — รูป + ชื่อ + คำอธิบาย (≤2 บรรทัด) + จำนวนแต้ม + stock badge ถ้ามี + ปุ่ม "แลกรางวัล"
5. **Claim dialog 2-step** — (1) กรอก student_code → ตรวจสอบ → แสดงข้อมูลเด็ก + แต้ม (2) ยืนยัน → toast สำเร็จ
6. **Empty state** ต่อ tier — "ยังไม่มีรางวัลในระดับนี้"
7. **ลิงก์ "กลับไปธนาคารขยะ"** บน hero (back arrow)
8. **Footer** — school name + links (ใช้ component กลาง)

### Visual references (existing pages — ทดลองเปลี่ยนได้)
- **Hero ปัจจุบัน:** emerald-to-cyan gradient ทั้งหน้า, white text, Thai headline, primary CTA สีขาวบนเขียว — *ทดลองเปลี่ยนได้*
- **Tier strip ปัจจุบัน:** 4 cards เท่ากัน — *encourage variation*
- **Reward Card ปัจจุบัน:** aspect-square image + tier badge top-left + stock top-right + name + description + แต้ม + ปุ่มแลก — *encourage variation*

### Real data (ห้ามแต่ง "John Doe" placeholder — ใช้ตัวอย่างเหล่านี้)

**ตัวอย่างรางวัล (Thai elementary school context):**
| ชื่อ | แต้ม | Tier |
|---|---|---|
| ดินสอเขียนสบาย 2B | 10 | 🌱 |
| ยางลบลายช้าง | 15 | 🌱 |
| สมุดนักเรียน A5 | 50 | 🌱 |
| กล่องดินสอลายการ์ตูน | 120 | 🌿 |
| กระบอกน้ำ 500ml | 180 | 🌳 |
| กระเป๋าผ้า canvas | 250 | 🌳 |
| หูฟัง bluetooth | 350 | 🏆 |
| นาฬิกาตั้งโต๊ะ | 500 | 🏆 |

**ตัวอย่างนักเรียน (สำหรับ podium/leaderboard inline):**
- ด.ช. สมชาย รักษ์ดี ป.4
- ด.ญ. มาลี ใจดี ป.5
- ด.ช. ภูมิใจ ตั้งมั่น ป.6

**โรงเรียน:** โรงเรียนบ้านคำไผ่ — ปรัชญา "นัตถิ ปัญญา สมา อาภา" (แสงสว่างเสมอด้วยปัญญาไม่มี)

---

## 5. Variations to Explore (ขอ 3 แบบ)

ขอ Stitch ลอง render **3 variation** ที่ฉีกแนวจากหน้า v1 ปัจจุบัน:

### Variation A — "Forest Magazine" (asymmetric editorial)
- **Hero:** split-screen 60/40
  - Left 60%: ใหญ่ headline + ปรัชญาโรงเรียน + CTA "ตรวจสอบแต้มของฉัน"
  - Right 40%: large featured reward (🏆 เลิศ tier) แบบ editorial photo
- **Inline image typography:** avatar นักเรียน top-1 (28px circular) ใส่ inline ระหว่างคำ "ของรางวัล" กับช่องว่างถัดไป — *signature creative move*
- **Tier sections:** zig-zag layout (left/right/left/right) ไม่ใช่ stack แนวตั้งเดียว
- **Reward grid:** 3-2-3-2 mosaic (ไม่ใช่ 4 เท่ากัน) — feature card ใหญ่ + supporting cards เล็ก

### Variation B — "Garden Path" (vertical journey)
- **Hero:** solid `bg-primary` (Rule 14.1 compliant — no gradient on header), centered ก็ได้
- **Tier sections:** connected ด้วย dotted vertical "path" line ทางซ้าย — รู้สึกเหมือนเดินขึ้นเขาจากต้นกล้าไปยอดไม้
- แต่ละ tier ขึ้นต้นด้วย **oversized emoji (96px)** + label ตัวใหญ่ + caption "ปลดล็อกที่ X แต้ม"
- **Reward Card:** vertical card 2:3 ratio (รูปแบบ trading card) แทน aspect-square
- **Hover:** tilt 3deg + subtle shadow growth (perpetual micro-loop บน card หลัก)

### Variation C — "Compact Catalog" (info-dense, single-screen first)
- **Hero ลด:** 1 row เล็ก + balance-check inline (input + ปุ่มในแถวเดียวกัน เป็น CTA หลักของ hero)
- **Tier overview:** horizontal scroll snap chip strip (mobile-style segmented control)
- **Reward grid:** 5-col tight (mobile = 2-col) — ภาพเล็ก, ข้อมูลแน่น
- **Sticky filter bar:** tier toggle + sort (ราคาต่ำ/ราคาสูง/ของใหม่) ติดบนสุดเมื่อ scroll
- **Claim button** → drawer (slide จากล่าง) แทน modal dialog

---

## 6. Anti-Patterns (Strict Bans — ห้ามปรากฏใน output)

### Color
- ❌ Pure black `#000000` (ใช้ Forest Ink `#14291C`)
- ❌ Purple / violet / indigo / fuchsia / pink / magenta — *any shade*
- ❌ Neon outer glow / `shadow-[0_0_20px_*]`
- ❌ Multi-hue gradient (green → indigo) บน nav/header
- ❌ Yellow text บน white (contrast fail)
- ❌ `text-gray-400` / `text-gray-500` บน white

### Typography
- ❌ Inter font
- ❌ Generic serif: Times, Georgia, Garamond, Palatino
- ❌ Distinctive serif (Fraunces, Editorial New) — render ไทยไม่ได้
- ❌ Body line-height < 1.6 (Thai needs space for tone marks)

### Layout
- ❌ 3-equal feature card row (use zig-zag / asymmetric / 4-col responsive catalog)
- ❌ Centered Hero ใน Variation A + C (Variation B อนุญาต — ใช้ solid bar)
- ❌ Overlapping text/image — clean spatial zones only
- ❌ `h-screen` (use `min-h-[100dvh]`)
- ❌ Horizontal scroll on mobile (Variation C ใช้ snap-strip ไม่ใช่ overflow)
- ❌ Touch target < 44px

### Content
- ❌ Generic placeholder names ("John Doe", "Acme", "Nexus") — ใช้ชื่อไทยจริง
- ❌ Fake metrics ("99.99% claim rate", "124ms response") — ห้ามแต่งสถิติ
- ❌ Fake "SYSTEM // 2024" / "METRICS // 2025" labels (lazy AI convention)
- ❌ AI clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "เปลี่ยนโลก", "ปฏิวัติวงการ"
- ❌ Filler text: "Scroll to explore", "Swipe down", bouncing chevron, scroll arrow icon
- ❌ Decorative emoji (functional 🌱🌿🌳🏆 / 🥇🥈🥉 OK)
- ❌ Broken Unsplash links — ใช้ `picsum.photos/seed/<key>/400/600` หรือ inline SVG

### Behavior
- ❌ Custom mouse cursors
- ❌ Circular spinners — ใช้ skeletal shimmer matching layout dimensions
- ❌ Linear easing motion — ใช้ spring `{ stiffness: 100, damping: 20 }`
- ❌ Animating `width` / `height` / `top` / `left` — ใช้ `transform` + `opacity` only

---

## 7. Output Expectations

ขอจาก Stitch:

1. **3 variations** ตาม Section 5 (Forest Magazine / Garden Path / Compact Catalog)
2. **2 viewports per variation:**
   - Desktop: 1280px width
   - Mobile: 390px width
3. **Mobile collapse rules:**
   - Multi-column → single column
   - No horizontal scroll (overflow ≠ snap-strip)
   - Touch targets ≥ 44px
   - Inline image typography photos stack below headline
4. **Component spec annotations** สำหรับ variation ที่เลือกสุดท้าย:
   - Padding values (e.g., `p-6 md:p-8`)
   - Rounded radius (e.g., `rounded-2xl` = 1.5rem)
   - Shadow opacity + tint
   - Font weights + sizes per element
5. **Export-ready** — Figma frames หรือ HTML preview ที่ open ดูใน browser ได้

### Picking the winner
ถ้าต้องเลือก variation เดียวมาเป็น production version:
- **Variation A "Forest Magazine"** = creative ที่สุด เหมาะถ้าอยากแยกแบรนด์โรงเรียนออกจาก template ราชการทั่วไป
- **Variation B "Garden Path"** = เด็กเข้าใจง่ายที่สุด — visual metaphor ชัดเจน
- **Variation C "Compact Catalog"** = mobile-first ดีที่สุด — เหมาะถ้าผู้ใช้ส่วนใหญ่ใช้มือถือ

ขอ Stitch annotate ใน output ว่า **คิดยังไงกับ tradeoff** ระหว่าง 3 variations — ช่วย user ตัดสินใจ

---

## ⤴ References

- Source design system: [`../DESIGN-STITCH.md`](../DESIGN-STITCH.md)
- Implementation truth: [`../DESIGN.md`](../DESIGN.md) (UX rules 14.x)
- Component specs: [`../DESIGN-COMPONENTS.md`](../DESIGN-COMPONENTS.md)
- Current page (live): [https://kampai-school.vercel.app/waste-bank/rewards](https://kampai-school.vercel.app/waste-bank/rewards)
- Current code: `src/pages/RewardsCatalog.tsx`
