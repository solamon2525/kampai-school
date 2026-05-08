# Design System (Stitch Brief): ธนาคารขยะ + แลกรางวัล + คะแนนความดี

> **Companion to** [`DESIGN.md`](./DESIGN.md) **and** [`DESIGN-COMPONENTS.md`](./DESIGN-COMPONENTS.md) — ใช้ไฟล์นี้เฉพาะตอน prompt **Google Stitch** ([labs.google.com/stitch](https://labs.google.com/stitch))
>
> ไม่แทนที่ DESIGN.md — DESIGN.md ยังเป็น ground truth สำหรับ implementation/codebase
> ไฟล์นี้คือ **creative brief** สำหรับการ generate screen mockup
>
> **Scope:** 3 หน้าเท่านั้น
> 1. `/waste-bank` + `/waste-bank/stats` (ธนาคารขยะ — มีอยู่)
> 2. `/waste-bank/rewards` (แลกรางวัล — มีอยู่ ship แล้ว)
> 3. `/conduct` (คะแนนความดี — *สาธารณะยังไม่มี* ใช้เป็น guideline ตอน generate)

---

## 0. Project Overrides (Hard Constraints — ขัดไม่ได้)

| Skill default | Project override | Reason |
|---|---|---|
| Geist / Outfit / Cabinet Grotesk / Satoshi | **Sarabun เท่านั้น** | ภาษาไทยต้องใช้ Sarabun — fonts อื่นที่ skill แนะนำ render ภาษาไทยไม่ได้ |
| Pure neutrals (Zinc/Slate) base | **Forest Green `#157F3C`** + neutral support | School brand — สีประจำโรงเรียน "ขาว+เขียว" (DESIGN.md §2) |
| Auto dark/light | **Light mode only** บน public site | DESIGN.md Rule 14.8 — ตัดสินใจไปแล้ว |
| "No emojis anywhere" | **Functional emoji allowed** | 🌱🌿🌳🏆 = tier indicator / 🥇🥈🥉 = rank indicator — เป็น semantic ไม่ใช่ decoration. **Decorative emoji ห้าม** |
| "No centered Hero" (variance > 4) | **Centered hero allowed** บนหน้าเดิม — encourage asymmetric สำหรับหน้าใหม่ | WasteBank.tsx Hero centered อยู่แล้ว ไม่ refactor ครั้งนี้ |
| "Inter banned" | ✅ เห็นด้วย (ใช้ Sarabun อยู่แล้ว) | — |
| Spring physics motion | ✅ เห็นด้วย — codebase มี framer-motion + `MotionConfig reducedMotion="user"` | — |
| Skeletal loaders | ✅ เห็นด้วย — codebase มี `animate-pulse` แล้ว | — |

---

## 1. Visual Theme & Atmosphere

**"Sun-dappled forest classroom"** — โล่ง สว่าง สดชื่น ไม่อึดอัด เหมือนเดินอยู่ในห้องเรียน STEM ที่แสงสาดผ่านใบไม้ลงมา เด็กดูแล้วอยากเก็บขยะ/ทำดีเพิ่ม

| มิติ | คะแนน | คำอธิบาย |
|---|---|---|
| Density | 4 | Daily App Balanced — leaning airy. ไม่อัดข้อมูลเหมือน cockpit |
| Variance | 5 | Offset asymmetric — ฉีกแนวเล็กน้อย ไม่ chaotic |
| Motion | 6 | Fluid CSS spring + perpetual subtle micro-loop บน rank/badge |
| Mood | clinical-warm | สะอาด เป็นมืออาชีพ + อบอุ่นแบบโรงเรียนชนบท |

---

## 2. Color Palette & Roles

### Core neutrals + brand
| Role | Name | Hex | Function |
|---|---|---|---|
| Background | Canvas White | `#FFFFFF` | page background |
| Surface | Pure Surface | `#FFFFFF` | card fill |
| Quiet Surface | Whisper Mint | `#F0F7F1` | alt section bg, divide subtle |
| Primary | Forest Primary | `#157F3C` | CTA, brand mark, active state |
| Primary Light | Spring Leaf | `#33AE60` | hover state, accent icon |
| Primary Pale | Dawn Mist | `#E5F0E7` | secondary button bg, badge bg |
| Primary Deep | Pine Ink | `#0F5C2C` | text on pale (contrast pass 7.2:1) |
| Foreground | Forest Ink | `#14291C` | body text — **never `#000000`** |
| Muted Text | Stone Sage | `#568165` | secondary text, helper, metadata |
| Border | Whisper Border | `#C8DECE` | 1px structural lines, card borders |
| Accent (sparingly) | Honey Gold | `#FFD874` | award badge, highlight ≤5% area |
| Destructive | Pomegranate | `#DC2626` | error, delete, warning only |

### Tier ribbons (rewards page only)
ใช้เป็น **soft badge backgrounds** เท่านั้น (Tailwind `*-100` shade) — ห้ามเป็น full section bg

| Tier | Badge bg | Use |
|---|---|---|
| 🌱 ระดับเริ่มต้น | `bg-lime-100 text-lime-700` | 0–50 แต้ม |
| 🌿 ระดับดี | `bg-emerald-100 text-emerald-700` | 51–150 แต้ม |
| 🌳 ระดับเยี่ยม | `bg-teal-100 text-teal-700` | 151–300 แต้ม |
| 🏆 ระดับเลิศ | `bg-amber-100 text-amber-700` | 301+ แต้ม |

### Banned absolutely
- Pure black `#000000` (any context — ใช้ Forest Ink แทน)
- Purple / violet / indigo / fuchsia / pink / magenta — **any shade**
- Neon / electric variants ของสีใดๆ
- Multi-hue gradients (green → indigo, etc.)
- Saturation > 80%

---

## 3. Typography Rules

**Font:** Sarabun (Google Fonts wght 100–800) ใช้กับทั้งภาษาไทยและอังกฤษ

| Token | Spec | Use |
|---|---|---|
| Display (h1) | Sarabun 700w, `clamp(2rem, 5vw, 3rem)`, tracking `-0.02em`, leading `1.15` | Hero headline — **never screaming** |
| Heading (h2) | Sarabun 700w, `2.25rem`, leading `1.2` | Section title |
| Heading (h3) | Sarabun 600w, `1.5rem`, leading `1.3` | Card title |
| Heading (h4) | Sarabun 600w, `1.25rem`, leading `1.4` | Group title |
| Body | Sarabun 400w, `1rem`, **leading `1.7`** | Paragraph — Thai readability minimum |
| Body small | Sarabun 400w, `0.875rem`, leading `1.6` | Caption, meta |
| Caps label | Sarabun 700w, `0.75rem`, `tracking-widest`, `uppercase` | Section eyebrow |
| Mono numbers | `JetBrains Mono` หรือ `IBM Plex Mono` | ตัวเลข leaderboard เมื่อ density > 5 |

**Rules:**
- Body line-length cap: **65ch**
- Body `line-height ≥ 1.6` (Thai requires extra space for tone marks)
- Hierarchy via **weight + color**, not massive size
- **Banned:** Inter, Times New Roman, Georgia, Garamond, Palatino, generic system serif

---

## 4. Component Stylings

### Buttons
- Flat fill — **no outer glow**
- Tactile `-translate-y-px` on `:active`
- Primary: `bg-primary` solid + `text-primary-foreground`
- Secondary: ghost/outline (`border-border bg-transparent`)
- Icon button: minimum 44px tap target
- Spring ease on hover scale (no linear)

### Cards (`RewardCard`, `ClaimsCard`, `StatsCard`)
- Rounded `1.5rem` (24px) — generously rounded
- Diffused shadow tinted to bg (`shadow-md` with 8% opacity primary tint, never gray)
- Border `1px var(--border)` only when on white-on-white
- Hover: `-translate-y-1` + shadow grow with spring physics
- **Use ONLY when elevation = hierarchy.** High-density rows → `border-top` divider แทน

### Hero (3 page-specific patterns)
- **WasteBank Hero** — solid `bg-primary` (DESIGN.md Rule 14.1: no gradient on header). **Keep as-is.**
- **RewardsCatalog Hero** — teal-emerald gradient อนุญาต (เป็น content section ไม่ใช่ nav). **Keep as-is.**
- **Conduct Hero (NEW)** — propose **asymmetric split**: left 60% headline + CTA, right 40% live mini-podium top-3. Use **inline image typography** — embed avatar เด็ก top-1 (28px circular) inline ระหว่างคำในหัวข้อ — *signature creative move*

### Leaderboard / Podium
- Top-3 = elevated card; **1st scaled `1.05x`**, gold/silver/bronze ring
- Rank 4-10 = compact row, numbered circle 32px
- Avatar: 48px circular, `ring-2 ring-primary/20` for top-3
- **No "vs %" bars** — pure number + name + class only
- Rank emoji 🥇🥈🥉 allowed (functional)

### Inputs / Forms (`RewardClaimDialog` pattern)
- Label **above** input — no floating label
- Helper text optional, 12px muted
- Error text **below** in `--destructive`
- Focus ring: `ring-2 ring-primary ring-offset-2`
- Input height: 40px (touch-friendly)

### Loaders
- **Skeletal shimmer matching exact layout dimensions** — never circular spinner
- Use `bg-muted animate-pulse` blocks sized like the content they replace
- Reference: `src/pages/RewardsCatalog.tsx` tier sections

### Empty States
- Composed Lucide icon scene (e.g., `<Gift className="opacity-40">` + 1-line text + optional CTA)
- **Never** just "No data"

---

## 5. Layout Principles

- **Container:** `max-w-7xl` (1280px) `mx-auto px-4`
- **Section padding:** `py-8 md:py-12` — Thai content needs breathing room
- **Grid > Flexbox math** — use `grid grid-cols-12` หรือ `grid-cols-[1fr_2fr]` แทน `flex` + `calc()`
- **No overlapping elements** — clean spatial separation. Badge บน image OK เป็น ribbon ที่มุม
- **3-equal-card row banned** — use 2-col zig-zag, 4-col responsive catalog, หรือ asymmetric `[2fr_1fr]`
- **Full-height:** `min-h-[100dvh]` เสมอ — **never** `h-screen` (iOS Safari catastrophic jump)
- **Centered hero** อนุญาตบนหน้าเดิม (waste-bank/rewards) — encourage asymmetric สำหรับหน้าใหม่ (conduct)

### Mobile-first collapse (< 768px)
- All multi-column → single column
- **No horizontal scroll** — overflow ล้นแนวนอนเป็น critical failure
- Touch targets ≥ 44px
- Inline image typography photos stack below headline
- Vertical section gaps reduce: `clamp(3rem, 8vw, 6rem)`

---

## 6. Motion & Interaction

- **Spring default** — `{ stiffness: 100, damping: 20 }` (framer-motion)
- **Stagger reveals** — list items cascade `delay: idx * 0.05s` on mount
- **Perpetual micro-loops:**
  - Top-1 podium card: subtle `scale 1.05 ↔ 1.06` infinite 2s
  - Sparkles icon next to point counts: gentle rotate ±3deg infinite
  - Tier emoji on RewardCard hover: bounce-y 4px once
- **Page transitions** — fade `200ms` (no slide — slide feels heavy on Thai-language reading)
- **Hardware accel only** — animate `transform` + `opacity`. **Never** animate `width` / `height` / `top` / `left`
- **Reduced motion** — `MotionConfig reducedMotion="user"` (already in App.tsx)

---

## 7. Page-Specific Briefs

### `/waste-bank` (existing — refresh hints)
- **Hero:** solid `bg-primary` + CTA group ("ดูรางวัลที่แลกได้" gold + "ดูสถิติแบบละเอียด" ghost)
- **Stats row:** 3 number cards (students/items/points) — *metric strip ≠ 3-feature row*, อนุญาต
- **Hall of Fame:** podium 3 + ranked list (4-10) — keep
- **Search section:** green-tinted table header — keep
- **HOW_IT_WORKS:** ปัจจุบัน 3-step icon row — propose **zig-zag 3 sections** (icon left/right/left) เพื่อ asymmetry

### `/waste-bank/rewards` (existing — refresh hints)
- **Hero:** emerald-teal gradient + balance-check CTA — keep
- **Tier strip:** 4 anchor links — keep, consider asymmetric sizing (great/elite slightly larger)
- **RewardCard grid:** 4-col responsive — *catalog ≠ feature row*, อนุญาต
- **Claim dialog:** 2-step (lookup → confirm) — keep, no changes

### `/conduct` (NEW — generation brief สำหรับ Stitch)
- **Goal:** สาธารณะ — เด็กและผู้ปกครองดู leaderboard "เด็กดี" ได้
- **Hero:** asymmetric split layout
  - Left 60%: headline "ห้องเกียรติยศ คะแนนความดี" + ปรัชญา "นัตถิ ปัญญา สมา อาภา" (ภาษาไทย+คำแปล) + CTA "ดูคะแนนของฉัน"
  - Right 40%: live mini-podium top-3 (compact)
- **Inline image typography:** avatar เด็ก top-1 (28px circular) inline ระหว่างคำ "ความดี" กับช่องว่างถัดไป — *signature creative move*
- **Leaderboard section:** podium + ranked list (mirror waste-bank Hall of Fame pattern) — แยก tab "เพิ่ม / ลด / สุทธิ" 
- **Category breakdown:** asymmetric `[2fr_1fr]` — left big bar chart of total +/− by month, right top-5 categories list
- **Self-check dialog:** กรอก student_code → แสดงคะแนนปัจจุบัน + history รายการล่าสุด (mirror RewardsCatalog balance-check pattern)
- **+/-X badges** — ใช้เฉพาะใน history list, **ห้ามใช้เป็น decoration** บน hero/podium
- **Color semantic:** เขียว (`--primary`) สำหรับ +, แดง (`--destructive`) สำหรับ − — **never neon**

---

## 8. Anti-Patterns (Banned)

จาก skill + project rules — ต้องไม่ปรากฏในผลลัพธ์ Stitch:

### Color
- ❌ Pure black `#000000` (ใช้ Forest Ink `#14291C`)
- ❌ Purple / violet / indigo / fuchsia / pink / magenta — *any shade*
- ❌ Neon outer glow / `shadow-[0_0_20px_*]`
- ❌ Multi-hue gradient (green→indigo) บน nav/header (Rule 14.1)
- ❌ Yellow text บน white (Rule 14.2 — fail contrast)
- ❌ `text-gray-400` / `text-gray-500` บน white (Rule 14.3)

### Typography
- ❌ Inter font
- ❌ Generic serif: Times New Roman, Georgia, Garamond, Palatino
- ❌ Distinctive serif (Fraunces, Editorial New) — ไม่ render ภาษาไทย
- ❌ Body line-height < 1.6

### Layout
- ❌ 3-equal feature card row (use zig-zag/asymmetric)
- ❌ Centered Hero ใน new pages (encourage split/asymmetric)
- ❌ Overlapping text/image — clean spatial zones only
- ❌ `h-screen` (use `min-h-[100dvh]`)
- ❌ Horizontal scroll on mobile
- ❌ Touch target < 44px

### Content
- ❌ Generic placeholder names ("John Doe", "Acme", "Nexus") — ใช้ชื่อไทยจริงจาก seed data
- ❌ Fake metrics ("99.99%", "50%", "124ms") — ทุกตัวเลขมาจาก Supabase (real data)
- ❌ Fake "SYSTEM // 2024" / "METRICS // 2025" labels (lazy AI convention)
- ❌ AI clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "เปลี่ยนโลก", "ปฏิวัติวงการ"
- ❌ Filler text: "Scroll to explore", "Swipe down", bouncing chevron, scroll arrow icons
- ❌ Decorative emoji (functional tier 🌱🌿🌳🏆 / rank 🥇🥈🥉 OK)
- ❌ Broken Unsplash links — use `picsum.photos/seed/<key>/400/600` หรือ inline SVG

### Behavior
- ❌ Custom mouse cursors
- ❌ Circular spinners (use skeletal shimmer)
- ❌ Linear easing on motion (use spring)
- ❌ Animating `width` / `height` / `top` / `left` (use transform/opacity)

---

## 9. Stitch Prompt Recipe

**ตอน prompt Stitch ให้ paste section ตามลำดับนี้:**

1. **Section 0** (Project Overrides) — non-negotiable, paste แรก
2. **Section 1-2** (Atmosphere + Color Palette) — บอก vibe + hex
3. **Section 7** เฉพาะ page brief ที่จะ generate
4. **Section 8** (Anti-patterns) — paste สุดท้ายเพื่อ "negative prompt"

**ข้าม:** Section 3-6 (typography/component/layout/motion) — Stitch มี sensible default อยู่แล้ว เปิดโอกาสให้ AI creative ในส่วนนี้ ตราบใดที่ section 0 + 8 บังคับเงื่อนไข

**ตัวอย่าง prompt skeleton:**
```
[Paste Section 0]

Visual atmosphere:
[Paste Section 1 + 2]

Generate a screen for: /conduct (public Thai school leaderboard)
Brief:
[Paste Section 7 → /conduct subsection]

Strict bans:
[Paste Section 8]
```

---

## Cross-References

- **Color hex source:** `src/index.css` `:root` block (ทุก `--*` token)
- **Default theme runtime:** `src/lib/themeDefaults.ts` (`DEFAULT_THEME` constant)
- **Type scale source:** [`DESIGN.md`](./DESIGN.md) §7
- **UX rules invariants:** [`DESIGN.md`](./DESIGN.md) §14.1–14.9
- **Existing hero patterns:** `src/pages/WasteBank.tsx` (hero L275-296), `src/pages/RewardsCatalog.tsx` (hero L60-110)
- **Existing podium pattern:** `src/pages/WasteBankStats.tsx` (L142-156 realtime + podium render)
- **Component spec details:** [`DESIGN-COMPONENTS.md`](./DESIGN-COMPONENTS.md)
