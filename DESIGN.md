---
version: alpha
name: โรงเรียนบ้านคำไผ่
description: Two-surface design system — Frontend (airy green+white) + Backend (solid dark admin)
colors:
  primary: "#157F3C"
  primary-light: "#33AE60"
  primary-pale: "#E5F0E7"
  primary-deep: "#0F5C2C"
  background: "#FFFFFF"
  foreground: "#14291C"
  accent: "#33AE60"
  accent-soft: "#FFD874"
  muted: "#F0F7F1"
  muted-foreground: "#568165"
  border: "#C8DECE"
  destructive: "#DC2626"
  admin-bg: "#F4F6F8"
  admin-surface: "#FFFFFF"
  admin-sidebar: "#1F2937"
  admin-sidebar-fg: "#F3F4F6"
  admin-text: "#1F2937"
  admin-text-muted: "#6B7280"
  admin-border: "#E5E7EB"
  admin-dark-bg: "#0F172A"
  admin-dark-surface: "#1E293B"
  admin-dark-sidebar: "#0B1220"
  admin-dark-text: "#F1F5F9"
  admin-dark-text-muted: "#94A3B8"
  admin-dark-border: "#334155"
typography:
  h1:
    fontFamily: Sarabun
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.15
  h2:
    fontFamily: Sarabun
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: Sarabun
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  h4:
    fontFamily: Sarabun
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Sarabun
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: Sarabun
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: Sarabun
    fontSize: 0.75rem
    fontWeight: 700
    letterSpacing: 0.1em
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-secondary:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
  card-frontend:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: 32px
  badge-primary:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary-deep}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  section-label:
    textColor: "{colors.accent}"
    typography: "{typography.label-caps}"
  admin-sidebar-item:
    backgroundColor: "{colors.admin-sidebar}"
    textColor: "{colors.admin-sidebar-fg}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  admin-card:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-text}"
    rounded: "{rounded.lg}"
    padding: 20px
  admin-stat-card:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-text}"
    rounded: "{rounded.lg}"
    padding: 16px
---

## 1. Visual Theme & Atmosphere

โรงเรียนบ้านคำไผ่ใช้ **two-surface design system** ที่แยกบุคลิกของหน้าสาธารณะออกจากหลังบ้านอย่างชัดเจน:

- **Frontend (public site):** "Airy Forest" — โล่ง สดชื่น ใช้พื้นที่ขาวเยอะ ตัดด้วยเขียวสด เหมือนเดินอยู่ในสวนป่าที่แสงส่องลงมา
- **Backend (admin dashboard):** "Quiet Operator" — สีทึบเย็น (slate dark) เน้นข้อมูลตรงไปตรงมา ไม่มีสีฉูดฉาด ลด noise ให้ผู้ใช้โฟกัสกับงาน

Live: https://kampai-school.vercel.app
Font: **Sarabun** (Google Fonts, wght 100-800) สำหรับทั้งภาษาไทยและอังกฤษ

---

## 2. School Brand Identity

| รายการ | ข้อมูล |
|---|---|
| **ปรัชญา** | นัตถิ ปัญญา สมา อาภา |
| **คำแปล** | แสงสว่างเสมอด้วยปัญญาไม่มี |
| **คำขวัญ** | เรียนดี มีคุณธรรม |
| **อัตลักษณ์** | ยิ้มง่าย ไหว้สวย |
| **สีประจำโรงเรียน** | สีขาว และสีเขียว |
| **ผู้อำนวยการ** | นายมกรธวัช แสนสง่า |

---

## 3. Two-Surface Strategy (กฎเหล็ก)

### Frontend = "Airy Forest"
- **โทนหลัก:** ขาว 70%, เขียว 20%, neutral/น้ำตาลอ่อน 10%
- **บรรยากาศ:** โล่ง โปร่ง สบายตา เหมาะกับการอ่านเนื้อหา ดูภาพ
- **สี deco อื่น:** ใส่ได้แต่ต้อง derived จาก green family (sage, mint, olive) หรือ warm-neutral (cream, sand)
- **ห้ามเด็ดขาด:** purple, violet, indigo, fuchsia, pink, magenta, electric-blue, neon-cyan

### Backend = "Quiet Operator"
- **โทนหลัก:** Slate dark (sidebar) + light slate (page bg) + white (cards)
- **บรรยากาศ:** สงบ มืออาชีพ ทึบ ไม่ดึงสายตา ตัวอักษรเด่น
- **Accent:** เขียวเดียว (เฉพาะปุ่ม CTA, active state, link, success badge)
- **ห้าม:** สีฉูดฉาดใดๆ ที่ไม่ใช่ semantic (success/warning/error)

---

## 4. Frontend Color Palette

### Primary green family
| Token | HSL | Hex | Use |
|---|---|---|---|
| `--primary` | `hsl(142 72% 29%)` | `#157F3C` | ปุ่มหลัก, header, badge, link active |
| `--primary-light` | `hsl(142 55% 44%)` | `#33AE60` | Hover state, accent icon |
| `--primary-pale` | `hsl(142 35% 93%)` | `#E5F0E7` | Section bg อ่อน, secondary button bg |
| `--primary-deep` | `hsl(142 75% 22%)` | `#0F5C2C` | Text บน pale bg (contrast pass) |

### Neutral support
| Token | HSL | Hex | Use |
|---|---|---|---|
| `--background` | `hsl(0 0% 100%)` | `#FFFFFF` | Page bg |
| `--foreground` | `hsl(142 35% 12%)` | `#14291C` | Body text หลัก |
| `--muted` | `hsl(142 20% 93%)` | `#F0F7F1` | Quiet bg (alt section) |
| `--muted-foreground` | `hsl(142 20% 42%)` | `#568165` | Secondary text |
| `--border` | `hsl(142 18% 87%)` | `#C8DECE` | Card border, divider |

### Allowed secondary accents (sparingly!)
| Token | Hex | Use |
|---|---|---|
| `--accent-soft` | `#FFD874` | Warm gold เฉพาะ award badge, highlight สำคัญ — ไม่เกิน 5% ของหน้า |
| `--destructive` | `#DC2626` | Error, delete, warning เท่านั้น |

### Forbidden on Frontend
```
❌ purple, violet, indigo, fuchsia, pink, magenta
❌ electric/neon variants ของสีใดๆ
❌ Tailwind: bg-purple-* / text-purple-* / from-purple-* / via-purple-* / to-purple-*
❌ Tailwind: bg-violet-* / bg-indigo-* / bg-fuchsia-* / bg-pink-*
❌ Hex: #6366F1 / #8B5CF6 / #A855F7 / #EC4899 / hardcoded purples
```

---

## 5. Backend (Admin) Color Palette

### Light mode (default admin)
| Token | Hex | Use |
|---|---|---|
| `--admin-bg` | `#F4F6F8` | Admin page background |
| `--admin-surface` | `#FFFFFF` | Cards, panels, table rows |
| `--admin-sidebar` | `#1F2937` | Sidebar (dark always — ตัดกับ content) |
| `--admin-sidebar-fg` | `#F3F4F6` | Sidebar text/icon |
| `--admin-sidebar-active` | `#157F3C` | Active menu item bg |
| `--admin-text` | `#1F2937` | Body text |
| `--admin-text-muted` | `#6B7280` | Secondary text, helper, placeholder |
| `--admin-border` | `#E5E7EB` | Table border, input border, divider |
| `--admin-accent` | `#157F3C` | CTA button, active link, success state ONLY |

### Backend rules
- **Sidebar เป็น dark slate ตลอดเวลา** — เพื่อให้ navigation มีน้ำหนัก แยกชัดจาก content area (เว็บใช้ light mode อย่างเดียว)
- **CTA และ active state ใช้เขียวเดียว** ไม่มีสีอื่นเลย
- **Stat cards ใช้ neutral surface + เขียว accent number** ไม่ใช้ rainbow ของสี
- **ห้าม gradient** ในหน้า admin ใดๆ (ยกเว้น progress bar ที่จำเป็น)

---

## 6. Contrast Rules (WCAG AA — strict)

| Element | Min ratio | Example pass |
|---|---|---|
| **Body text on bg** | 4.5:1 | `#14291C` on `#FFFFFF` = 17.7:1 ✅ |
| **Large text (18pt+)** | 3.0:1 | `#157F3C` on `#FFFFFF` = 5.34:1 ✅ |
| **UI element (border, icon)** | 3.0:1 | `#C8DECE` on `#FFFFFF` = 1.27:1 ❌ → ใช้สำหรับ decorative เท่านั้น |
| **Primary text on primary-pale** | 4.5:1 | `#0F5C2C` on `#E5F0E7` = 7.2:1 ✅ — ใช้ primary-deep แทน primary |
| **Sidebar text on sidebar bg** | 4.5:1 | `#F3F4F6` on `#1F2937` = 13.6:1 ✅ |

**Enforcement:** ก่อน commit สีใหม่ ต้องตรวจ ratio ผ่าน `pnpm lint:design` หรือ https://webaim.org/resources/contrastchecker/

---

## 7. Typography Scale (Sarabun)

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `h1` | 3rem (48px) | 700 | 1.15 | Page title (hero) |
| `h2` | 2.25rem (36px) | 700 | 1.2 | Section title |
| `h3` | 1.5rem (24px) | 600 | 1.3 | Card title, sub-section |
| `h4` | 1.25rem (20px) | 600 | 1.4 | Group title |
| `body` | 1rem (16px) | 400 | 1.7 | Paragraph (Thai needs 1.7+ for readability) |
| `body-sm` | 0.875rem (14px) | 400 | 1.6 | Caption, meta |
| `label-caps` | 0.75rem (12px) | 700 | 1, 0.1em letter-spacing, uppercase | Section label |

> **Thai readability tip:** ภาษาไทยต้อง `line-height ≥ 1.6` เพราะวรรณยุกต์เพิ่มความสูงตัวอักษร — ห้าม line-height < 1.5 บน body text

---

## 8. Component Specs + Migration → ดู `DESIGN-COMPONENTS.md`

> **เนื้อหา 5 หัวข้อย้ายไป [`DESIGN-COMPONENTS.md`](./DESIGN-COMPONENTS.md):**
> - Frontend Components specs (Hero/Card/Button/Section label/NavBar)
> - Backend Components specs (AdminSidebar/AdminCard/AdminStatCard/AdminTable)
> - Replacement Mapping (Purple → Green tokens)
> - Migration Checklist (purple offenders)
> - AI Agent Hard Rules (กฎสี/contrast/component/data/a11y/ภาษา/layout)

อ่านไฟล์ companion เมื่อกำลัง implement component, refactor legacy purple, หรือต้องการ AI Hard Rules เต็ม

---

## 13. Theme Manager — Single Source of Truth

ทุกสีของเว็บถูกควบคุมผ่าน **Theme Manager** ที่ `/admin/dashboard/theme`

### Architecture
```
school_settings.theme_colors (JSON, key-value table)
       ↓
useThemeColors() hook (TanStack Query, 5 min staleTime)
       ↓
RuntimeThemeStyles component (mounted at App root)
       ↓
<style id="kampai-runtime-theme">:root { --primary: ... }</style>
       ↓
overrides defaults from src/index.css → all Tailwind tokens reflect
```

### กฎการใช้งาน
17. **ห้ามแก้ CSS vars hardcode ใน `src/index.css`** — ค่าเริ่มต้นเท่านั้น (fallback)
   - User เปลี่ยนสีผ่าน Admin → Theme Manager → DB → runtime override
   - ค่าใน `src/index.css` คือ "ถ้า DB ว่าง ใช้นี้แทน"
18. **ห้ามอ่านสีจาก DB ตรงๆ ใน component** — ใช้ Tailwind class (`bg-primary`, etc.)
   เท่านั้น CSS vars ทำหน้าที่ resolution เอง
19. **DEFAULT_THEME** อยู่ที่ `src/lib/themeDefaults.ts` — ค่าตรงกับ DESIGN.md hex
   ถ้าจะเพิ่ม token ใหม่ ต้องเพิ่มทั้ง 3 ที่:
   1. `src/index.css` (`:root`)
   2. `tailwind.config.ts` (`colors: {...}`)
   3. `src/lib/themeDefaults.ts` (`DEFAULT_THEME` + `THEME_LABELS` + `THEME_GROUPS`)

### Tokens ที่ user แก้ได้ผ่าน Theme Manager
- `primary` + `primary-foreground`
- `secondary` + `secondary-foreground`
- `accent` + `accent-foreground`
- `background` + `foreground`
- `muted` + `muted-foreground`
- `border`
- `destructive`

### Tokens ที่ user แก้ไม่ได้ (ระบบกำหนด)
- `--ring` (always = `--primary`)
- `--input` (always = `--border`)
- `--card` / `--popover` (always = `--background`)
- Sidebar tokens (admin only — separate task)

---

## 14. Frontend UX Rules (กฎเฉพาะที่เคยพลาด — ห้ามทำซ้ำ)

กฎต่อไปนี้สรุปจาก bug ที่เกิดขึ้นจริงในเว็บโรงเรียนหลัง refactor หลายครั้ง
ใส่ไว้เพื่อ AI agent / dev อนาคต ไม่ทำซ้ำ:

### Rule 14.1 — No gradients on nav/header/banner
❌ `bg-gradient-to-*` บน `<nav>`, `<header>`, top bar, announcement banner
✅ Solid color เท่านั้น — `bg-primary`, `bg-foreground`, `bg-accent`

**เหตุผล:** gradient ที่มี hue ต่างกัน (เช่น green→indigo) ทำให้สีเลอะ + ดูไม่เป็นมืออาชีพ
ปัญหา: Vercel screenshot show top bar เป็น green→white→purple bleed

**ข้อยกเว้น:** image overlay (`from-black/60 to-transparent`) สำหรับ legibility ของข้อความบนรูปภาพ — ใช้ได้

### Rule 14.2 — Yellow text contrast
- `text-yellow-300` / `accent-soft` (#FFD874) ใช้ได้เฉพาะบน:
  - `bg-primary` (dark forest green) ✅ contrast ~9.5:1
  - `bg-foreground` (very dark) ✅
- ❌ ห้ามใช้บน:
  - bg-gradient ที่มี white/light area (กลืน)
  - `bg-secondary` / `bg-muted` (contrast fail)
  - `bg-background` (white) — contrast 1.8:1 fail

### Rule 14.3 — Text on white bg minimum
- ❌ `text-gray-400` / `text-gray-500` บน white = อ่านยาก
- ✅ `text-foreground` (#14291C) — body default
- ✅ `text-muted-foreground` (#568165) — minimum สำหรับ secondary/helper

ปัญหา: เมนูในหน้า /documents เคยใช้ `text-gray-700` บนพื้นขาว — เกือบกลืน

### Rule 14.4 — Footer compact spacing
- Container: `py-10` (ไม่ใช่ `py-16` ใหญ่เกิน)
- Column gap: `gap-8` (ไม่ใช่ `gap-12`)
- Item gap: `space-y-1.5` หรือ `space-y-2` (ไม่ใช่ `space-y-3/4`)
- มี subtle divider ใต้ heading (`border-b border-primary-foreground/15`)
- Text size: `text-sm` ในรายการ (ไม่ใช่ default `text-base`)

ปัญหาเก่า: footer มี vertical space เยอะเกิน — ดูโล่ง

### Rule 14.5 — Theme Manager = Single Source of Truth
- สี + token ทั้งหมดควรกำหนดผ่าน `/admin/dashboard/theme`
- `school_settings.theme_colors` (JSON) override CSS vars ผ่าน `RuntimeThemeStyles`
- DESIGN.md hex = default fallback ถ้า DB ว่าง
- ห้าม hardcode สีใน component — ใช้ Tailwind class ที่ map กับ CSS var

### Rule 14.6 — Section header colors admin configurable
- Section header bg/text สามารถ override ผ่าน Theme/Menu Manager
- Default: `bg-primary text-primary-foreground`
- HomepageManager block ที่มี optional `bg_color` + `text_color` → ใช้ override

### Rule 14.7 — Menu items + nav style controlled via Menu Manager
- `/admin/dashboard/menu` — single source of truth สำหรับ navigation
- `school_settings.menu_config` (JSON) เก็บ items + style
- `SiteHeader` / `HomeNavBar` อ่านจาก `useMenuConfig()` hook (`src/hooks/useMenuConfig.ts`)
- `DEFAULT_MENU_CONFIG` (`src/lib/menuDefaults.ts`) = fallback เมื่อ DB ว่าง
- ห้าม hardcode `mainNav` / `serviceNav` array ใน component

### Rule 14.8 — Light mode only (ทั้งระบบ)
- เว็บใช้ light mode อย่างเดียว — ไม่มี theme toggle ทั้ง public/admin/portal
- `next-themes` + `ThemeToggle` ถูกถอดออกแล้ว (v1.9.1)
- เหตุผล: school brand เน้นความสว่าง โล่ง — ผู้ใช้ผู้ปกครอง/ครูส่วนใหญ่ไม่รู้จัก dark mode + ทำให้ contrast แตกบางหน้า

### Rule 14.9 — Documentation Discipline (commit + deploy = ต้อง sync ทุกที่)

ทุกครั้งที่จะ `git commit` + `git push` (deploy) **ต้องบันทึกการแก้ไขในทุกจุดที่เกี่ยวข้องก่อน**:

| ที่ต้อง update | ใน case ไหน |
|---|---|
| **`DESIGN.md`** | เปลี่ยน palette / contrast / typography / UX rules 14.x |
| **`DESIGN-COMPONENTS.md`** | เปลี่ยน component spec / replacement mapping / AI hard rules |
| **`SystemOverview.tsx`** (`versionHistory` array) | feature ใหม่ / refactor ใหญ่ → เพิ่ม version entry หัวบนสุด |

**Workflow:** code changes → update docs ในตาราง → commit atomic (ไม่แยก code/doc) → push → รายงาน user ที่ touched

**เหตุผล:** ป้องกันเอกสารหลุด/ล้าสมัย → session ใหม่อ่าน docs แล้วได้ context ปัจจุบันจริง

### Rule 14.10 — Compact spacing (หน้า public ทุกหน้า)

หน้า public ใช้พื้นที่ vertical ให้น้อยที่สุด — เน้น **"directory"** ไม่ใช่ "showroom":

| ส่วน | กฎ | ห้าม |
|---|---|---|
| Hero | `py-5 md:py-7` หรือ `py-6 md:py-8` (compact pattern เดียวกับ WasteBank.tsx) | `py-16` / `py-20` / `py-24` |
| Hero headline | `text-xl md:text-2xl lg:text-3xl` 1 บรรทัด | `text-4xl/5xl` หรือใส่ `<br>` ขึ้น 2 บรรทัด |
| Description | `text-xs md:text-sm` 1–2 บรรทัด | paragraph ยาว ≥ 3 บรรทัด |
| Section gap | `py-5` หรือ `py-6 md:py-8` (ระหว่าง section) | `py-12` ขึ้นไป |
| List item gap | `gap-2` หรือ `gap-3` | `gap-6` ขึ้นไป |
| Button height | `h-8` (size="sm") บน hero CTA | `size="lg"` ที่กิน vertical space |

**เหตุผล:** หน้า rewards v1 ใช้ `py-16 md:py-20` + headline 4xl/5xl — มือถือต้อง scroll ไกลก่อนเห็น content จริง user feedback ตรงๆ ว่า "ใช้พื้นที่มากเกินไป" — refactor ใน v1.8.7 ลด vertical height ของ above-fold ลงเกิน 50%

**ข้อยกเว้น:** หน้า marketing/landing พิเศษที่ต้องการ "showcase feel" (เช่น Index, About) — ใช้ hero `py-12 md:py-16` ได้

### Rule 14.11 — Container constraint (ห้ามล้นกรอบ)

ทุกหน้า public ที่ render หลัง `<SiteHeader />` **ต้อง wrap content ใน `max-w-7xl mx-auto`** ตาม pattern ของ WasteBank.tsx:

```tsx
<div className="min-h-screen flex flex-col bg-background">
  <SiteHeader />
  <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
    {/* hero + content + sections ทุกอย่างไว้ในนี้ */}
  </div>
  <Footer />
</div>
```

**ห้าม:**
- ❌ ใช้ `container mx-auto` (Tailwind `container` ขยายถึง 1536px ที่ breakpoint `2xl` — ไม่ตรงกับ SiteHeader ที่ใช้ `max-w-7xl` = 1280px)
- ❌ Hero / section อยู่ระดับเดียวกับ `<SiteHeader />` แล้วใช้ full-width gradient (จะล้นเกินกรอบบนจอกว้าง)

**เหตุผล:** หน้า rewards v1 ใช้ `container mx-auto` → จอกว้าง > 1280px เนื้อหาขยายเลยกรอบ SiteHeader → user mark ว่า "ล้นขอบจอ" ใน screenshot v1.8.7

**ตรวจสอบ:** เปิดหน้าใหม่ที่ viewport ≥ 1400px → ขอบเนื้อหาต้องตรงแนวเดียวกับขอบ SiteHeader (logo ซ้าย / menu ขวา)

### Rule 14.12 — ถามก่อนตัดสินใจสิ่งที่นอกเหนือคำสั่ง (AI agent rule)

เวลา user สั่งงานสร้าง/แก้หน้า ถ้า requirement ไม่ครบหรือต้องตัดสินใจสำคัญที่ user ไม่ได้ระบุ — **AI ต้องถามก่อน ห้ามเดาเอง**

**ตัวอย่างที่ต้องถาม:**
- Layout pattern ของ hero (centered / split / asymmetric) ถ้า user ไม่ได้บอก
- Filter dimension (tier vs category vs ทั้งคู่) ถ้า user ไม่ได้ระบุ
- การ remove section ที่มีอยู่ vs เพิ่มใหม่ทับ
- Data source / schema change (เพิ่ม column ใหม่หรือใช้ของเดิม)
- Public vs portal-protected route
- Default values (เช่น list ของ category options ที่มีให้เลือก)
- Spacing/density (compact directory vs spacious showroom) ถ้าไม่ระบุ → default เป็น compact (Rule 14.10)

**ใช้ `AskUserQuestion` tool** ใน Plan Mode (Phase 1 / Phase 3) — ส่ง 1-4 คำถามชัดเจนพร้อม options

**ข้อยกเว้นที่ตัดสินใจเองได้ (ไม่ต้องถาม):**
- Implementation detail (variable name, helper function ordering)
- Bug fix แบบ obvious (typo, missing import)
- Style refactor ที่ไม่กระทบ behavior
- Convention ที่ codebase กำหนดไว้แล้ว (เช่น CLAUDE.md / DESIGN.md rule ระบุชัด)

**เหตุผล:** หน้า rewards v1 AI เลือกใช้ tier-based grouping + emerald gradient hero + 4-col tier overview strip โดยไม่ได้ถาม — user feedback หลังเห็น production ว่า "ไม่ใช่สิ่งที่ต้องการ" → เสีย time + commit cycles แก้ทับ (v1.8.7 refactor) ครั้งหน้าให้ถามก่อน ไม่ตีความเอง

### Rule 14.13 — Name + Photo Co-display (ห้ามแสดงชื่อเดียว)

ทุกที่ที่ render **ชื่อครู / ผู้บริหาร / นักเรียน** ใน UI ต้องมี **รูป (avatar)** คู่กันเสมอ — ห้าม name-only

**บังคับใช้กับ:**
- รายการ / ตาราง (list, table) — score, attendance, conduct, transactions, leaderboard
- Dropdown / Selector — ครู ผอ. นักเรียน (รวมทุก `<SelectItem>` ที่มีชื่อคน)
- Card / Profile header — parent portal "ยอดของ &lt;ชื่อนักเรียน&gt;", widget สรุป
- Comment / Author / Recorder mention — บันทึกโดย, แสดงความเห็น

**วิธีใช้:**
```tsx
import { PersonAvatar } from '@/components/shared/PersonAvatar';

<div className="flex items-center gap-2">
  <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
  <span>{s.name}</span>
</div>
```

**Size guide:**
- `xs` (24px) — dropdown items, inline mentions
- `sm` (32px) — list rows, table cells (default)
- `md` (40px) — card content
- `lg` (56px) — hero / profile header

**ข้อบังคับ service layer:**
- ทุก service ที่ดึงชื่อคนมาแสดง → **ต้อง SELECT `photo_url`** (สำหรับ staff/teachers/administrators) หรือ `image_url` (student_council) ด้วย
- Type interface ในฝั่ง component ต้องประกาศ `photo_url: string | null` ให้ตรง

**Fallback อัตโนมัติ:** ถ้า `photoUrl` เป็น `null/undefined` → `PersonAvatar` จะ render initials เอง (ใช้ `getInitials` จาก `src/lib/avatars.ts`) ไม่ต้องเขียน fallback ซ้ำ

**ห้าม:**
- ❌ Render `<span>{name}</span>` เดี่ยว ๆ ใน list/dropdown/header
- ❌ ใช้ shadcn `<Avatar>` ตรง — ต้องใช้ `<PersonAvatar>` (เพื่อให้ a11y label + initials fallback เป็น single API)
- ❌ Hardcode `<img src={photo}/>` แบบ raw — ไม่มี fallback เมื่อรูปหาย

**เหตุผล:** ชื่อไทยซ้ำกันบ่อย (สมชาย, สมหญิง) — รูปช่วย recognition ทันที + สอดคล้องกับ pattern ที่ HallOfFame, HomeRightSidebar leaderboard, Staff directory ใช้แล้ว v1.12.0 audit พบ Scores/Attendance/Conduct/RecorderSelect/ParentViews/TeacherList แสดงชื่อเดียวไม่มีรูป → refactor ผ่าน `<PersonAvatar>` primitive ครั้งเดียวจบ

**ตรวจสอบ:** ทุกหน้าใหม่ที่แสดงชื่อคน → grep หา `<PersonAvatar` ในไฟล์เดียวกัน ถ้าไม่มีคือผิดกฎ

### Rule 14.14 — Game embed contract (เกมการศึกษา เก็บคะแนน)

เกม HTML ใต้ `public/games/{subject}/*.html` ที่ tracked (มี row `educational_hub_items.tracked_game = true` + `game_slug`) ต้องรองรับ **iframe embed mode** เพื่อให้ wrapper `/play/:gameSlug` รับ-ส่งข้อมูลได้:

**Contract:**
1. ตรวจ embed mode ผ่าน 2 เงื่อนไข: `window.parent !== window` **และ** query `?embed=1`
2. เมื่อ embed: รับ `postMessage({type:'init', studentCode})` จาก parent — เก็บไว้ใน scope ของเกม
3. เมื่อจบเกม: `window.parent.postMessage({type:'gameEnd', gameSlug, studentCode, score, mode, metadata}, '*')`
4. CSS class `html.embed-mode` ใช้ซ่อน UI ที่ wrapper ทำให้แทน (input ชื่อ, standalone leaderboard, ปุ่ม restart)
5. **เกมต้องเล่นแบบ standalone ได้ปกติ** — ไม่ใช่ทุกครั้งที่เปิดต้องอยู่ใน wrapper (เก็บ localStorage HighScore ไว้สำหรับโหมดเดี่ยว)

**Server-side enforcement (Migration 066 RPC `record_game_session`):**
- Rate-limit: 1 session/20s per (student_id, game_slug) — กัน accidental double-submit + spam
- Sanity: score ∈ [0, 1,000,000]; duration ≥ 5s ถ้า score > 100
- XP formula: `max(1, floor(score/10)) + sum(badge.xp_bonus)` — clamp & compute server-side
- Badge unlock: ตรวจ threshold หลัง insert session (atomic ใน transaction เดียว)

**Subject linkage (สำคัญ — ตรวจก่อน seed):**
- `educational_hub_items.subject` ต้องเป็นวิชาจริง ๆ ของเกม **ไม่ใช่ folder name** (Pizza อยู่ใน `/games/thai/` แต่เป็นเศษส่วน = คณิตศาสตร์)
- เมื่อ admin/teacher push session เข้า `score_records` → ใช้ subject จากแถวนี้

**ห้าม:**
- ❌ ส่งคะแนนเข้า `score_records` อัตโนมัติทุก session — ต้อง manual gate ที่ Student 360°
- ❌ trust `student_id` จาก iframe โดยตรง — server resolve เองจาก `student_code` ใน RPC
- ❌ INSERT `game_sessions` ตรง ๆ จาก client — ผ่าน SECURITY DEFINER RPC เท่านั้น (RLS ปิด INSERT ทุก policy)

---

## 15. Spacing & Layout

- **Container:** `container mx-auto px-4` หรือ `.container-school` (max-w-7xl)
- **Section padding:** `.section-padding` = `py-16 md:py-20 lg:py-24`
- **Responsive breakpoints:** sm=640, md=768, lg=1024, xl=1280, 2xl=1536
- **Grid gap:** ใช้ Tailwind `gap-4` (mobile) / `gap-6 md:gap-8` (desktop)

---

## 16. Verification Commands

```bash
# Validate DESIGN.md syntax
pnpm lint:design

# Find purple offenders
grep -rn "purple\|violet\|indigo\|fuchsia\|pink-[0-9]" src/ | grep -v ".test."

# Find hardcoded white/black
grep -rn "bg-white\|text-black\|bg-black\|text-white" src/

# Build check
pnpm build
```
