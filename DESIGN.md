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

### Rule 14.15 — Color Contrast & Surface-Aware Palette (สีต้องตัดกับพื้นเสมอ)

**บังคับ:** ก่อนเขียน component ใหม่หรือเปลี่ยนสีใดๆ ต้องทำ **Contrast Pre-Check** ทุกครั้ง

#### 14.15.1 — ห้ามใช้ `dark:` prefix ทั้งระบบ
- เว็บนี้เป็น **Light Mode only** (Rule 14.8) — `dark:` class ไม่มีผลใดๆ
- ❌ `dark:text-indigo-300`, `dark:bg-slate-900/40`, `dark:border-slate-800`
- ✅ ใช้สีตรงๆ เช่น `text-slate-700`, `bg-white`, `border-slate-200`
- **เหตุผล:** ใส่ `dark:` แล้วคิดว่าครอบคลุมแล้ว ทำให้ลืมแก้สี light mode จริงๆ ที่ user เห็น

#### 14.15.2 — กฎ 2 พื้นผิว (Two-Surface Rule)
เมื่อ component มีพื้นหลังเข้ม (เช่น hero banner, gradient card) อยู่ในหน้า light:

| พื้นผิว | ฟ้อนท์/ไอคอน ที่ใช้ได้ | ❌ ห้าม |
|---|---|---|
| **พื้นเข้ม** (`bg-slate-900`, `bg-primary`, gradient เข้ม) | `text-white`, `text-white/80`, `text-yellow-300`, `text-emerald-300` | `text-slate-300`, `text-indigo-300`, `text-slate-500` (วรรณะเดียวกัน = กลืน) |
| **พื้นสว่าง** (`bg-white`, `bg-card`, `bg-slate-50`) | `text-slate-800`, `text-slate-700`, `text-foreground`, `text-muted-foreground` | `text-white`, `text-slate-100`, `text-gray-400` (อ่านไม่ออก) |

**วิธีตรวจง่าย:**
- พื้นเข้ม → ฟ้อนท์ต้อง **lightness ≥ 80%** (white, yellow-300, amber-200)
- พื้นสว่าง → ฟ้อนท์ต้อง **lightness ≤ 40%** (slate-800, gray-700, foreground)

#### 14.15.3 — ห้ามสีวรรณะเดียวกัน (Same-Hue Trap)
- ❌ `text-indigo-300` บน `bg-indigo-950` → hue เดียวกัน lightness ใกล้กัน = กลืน
- ❌ `text-slate-400` บน `bg-slate-800` → hue เดียวกัน = contrast ต่ำ
- ✅ ใช้สีที่ **ต่าง hue** หรือ **ต่าง lightness อย่างน้อย 50%** จากพื้นหลัง
- ✅ ทางที่ดีบนพื้นเข้ม ใช้ **ขาวตรงๆ** (`text-white`) แล้วค่อย tone down ด้วย opacity (`text-white/70`)

#### 14.15.4 — Contrast Pre-Check Checklist (ต้องตรวจก่อนทุกครั้ง)

ก่อนสร้างหน้าใหม่ หรือเพิ่ม/เปลี่ยนสี component ใดๆ:

```
☐ 1. ตรวจว่าหน้านี้ใช้ Light/Dark mode? → ตอบ: Light only (Rule 14.8)
☐ 2. component นี้มีพื้นหลังอะไร? → ระบุให้ชัด (เช่น bg-white, bg-slate-900)
☐ 3. ฟ้อนท์/ไอคอนที่เลือก contrast กับพื้นหลังไหม? → ตรวจ Two-Surface Rule (14.15.2)
☐ 4. มี `dark:` prefix ไหม? → ลบออกทั้งหมด (14.15.1)
☐ 5. มีสีวรรณะเดียวกับพื้นไหม? → เปลี่ยนเป็นข้ามวรรณะ (14.15.3)
☐ 6. ตรวจ index.css ว่า CSS var ที่ใช้ค่าตรง/ไม่ conflict กับ context ไหม?
```

#### 14.15.5 — ห้าม `contrast-fix` hack
- ❌ สร้าง utility class แก้สีแบบ patch (`!important`) → ปิดบังปัญหา ไม่แก้ต้นตอ
- ✅ แก้ที่ต้นทาง: ใช้สีที่ contrast ตั้งแต่แรกตาม Two-Surface Rule

**ข้อยกเว้นเดียว:** component ที่ render ทั้งบนพื้นเข้มและพื้นสว่าง (เช่น Badge ที่ reuse) → ใส่ prop `variant="light"|"dark"` เพื่อเลือกสีให้ตรง context

---

### Rule 14.16 — CSS Cascade & Color Overriding Prevention (ระวังการทับกันของกฎสีและสไตล์)

**บังคับ:** ทุกการเขียน Component ต้องระวังเรื่อง **Cascading & Rule Conflicts** เพื่อไม่ให้สไตล์อื่นหรือ CSS global เข้ามาทับจนอ่านไม่ออกหรือเลย์เอาต์พัง

#### 14.16.1 — ห้ามสไตล์ชนกัน (No Tailwind Utility Collisions)
- **ห้ามใส่ Utility Class ชนิดเดียวกันซ้ำใน Component:**
  - ❌ `<div className="bg-white bg-slate-50 text-slate-800 text-gray-700">`
  - **ความเสี่ยง:** บราวเซอร์จะเลือกสไตล์ที่ลำดับโหลดหลังสุด ทำให้สไตล์ทับกันและเพี้ยนในบางเครื่อง
  - ✅ **ใช้ `cn()` จาก `@/lib/utils` เสมอ:** ในการ merge classes หรือ conditional formatting เพื่อตัดคลาสที่ซ้ำซ้อนกันทิ้งโดยอัตโนมัติ

#### 14.16.2 — ระวัง CSS Inheritance จาก Parent (Parent Override Danger)
- **ห้ามปล่อยให้สีตัวอักษรของ Parent ครอบงำ Child ที่มีพื้นหลังต่างกัน:**
  - ❌ กำหนด `text-slate-800` ที่ Parent Div แล้วใส่ `bg-slate-900` ที่ Child Card โดยไม่ระบุสีของ Child
  - **ผลเสีย:** Child จะดึงสี `text-slate-800` มาใช้ ทำให้ตัวหนังสือสีเข้มทับบนพื้นเข้ม (กลืนหายมองไม่เห็น)
  - ✅ **กำกับสีเจาะจงให้ Child เสมอ:** บนพื้นผิวที่เปลี่ยนวรรณะเข้ม/สว่าง ต้องประกาศสีตัวอักษรขององค์ประกอบนั้นโดยตรง (Explicit Colors)

#### 14.16.3 — จัดการสไตล์ทับซ้อนใน Global CSS
- **ห้ามเขียน Custom Selector เปล่าๆ ทับ Tailwind Class ทั่วไปใน `index.css`:**
  - ❌ `h2 { color: #1e293b; }` (โดยไม่ระบุ layer หรือ specificity)
  - **ความเสี่ยง:** จะทำให้ utility อย่าง `text-primary` บน `h2` ทำงานไม่ถูกต้องในบางบราวเซอร์เพราะถูกความจำเพาะ (specificity) ของ CSS เปล่าๆ ทับ
  - ✅ **ใช้ `@layer base` หรือ `@layer components` เสมอ:** เพื่อให้ Tailwind utility classes สามารถระบุทับ (override) ได้อย่างถูกต้องตามมาตรฐาน

---

### Rule 14.17 — Page & Component Creation Pre-flight Rule (การเช็กความพร้อมและความเป็นไปได้ก่อนสร้างหน้าใหม่)

**บังคับ:** ก่อนสร้างหน้าใหม่ (`src/pages/`) หรือ Component ขนาดใหญ่ **ห้าม** ลงมือโค้ดทันที ให้รัน **Pre-flight Check** เพื่อตรวจสอบข้อจำกัดและทิศทางโครงสร้างระบบก่อนว่าสมควรและทำได้จริงไหม

#### 14.17.1 — Checklist 5 ด้านหลัก (ต้องตอบให้ได้ครบทุกข้อก่อนเริ่ม)

1. **โครงสร้างฐานข้อมูล (Database & Schema Check):**
   - *คำถาม:* หน้านี้ใช้ Table/View/RPC หรือ RLS Policy อะไรบ้าง? มีอยู่จริงหรือยัง?
   - *วิธีตรวจสอบ:* รัน queries หรือเปิดดู migration files ก่อน
   - *คำสั่ง:* ถ้ายังไม่มี ห้าม Mock ข้อมูลชั่วคราวใน Component เปล่าๆ ให้เริ่มสร้าง SQL Migration เสนอเข้าแผนก่อน

2. **ระบบสิทธิ์และการป้องกัน (Auth & Portal Protection Guard):**
   - *คำถาม:* หน้าใหม่นี้ใช้กับบทบาทใด? (Admin, Teacher, Parent, Public)
   - *วิธีปฏิบัติ:* ต้องกำหนดการครอบด้วย `<PortalProtectedRoute>` ตั้งแต่เริ่ม เพื่อให้สิทธิ์ความปลอดภัยตรงตามเงื่อนไข (Rule 14.12 & Rule 14.13)

3. **ความซ้ำซ้อนและการประหยัดโค้ด (Redundancy & Reusability):**
   - *คำถาม:* มีหน้าจอหรือ Component ที่ทำงานคล้ายกันอยู่แล้วหรือไม่? สามารถขยาย (extend) จากของเดิมได้ไหม?
   - *เป้าหมาย:* หลีกเลี่ยงการสร้างหน้าเปล่าใหม่ที่มีการทำงานซ้ำ 80% กับหน้าเดิม

4. **การเตรียม Layout และ Palette (Layout Integration):**
   - *คำถาม:* หน้าใหม่นี้อยู่ใน Context ไหน?
     - Frontend (Airy Forest): พื้นสว่าง, brand-green, Sarabun, สะอาดตา
     - Backend (Quiet Operator): พื้นหลัง `--admin-bg` (#F4F6F8), Sidebar เข้มเสมอ, ห้าม gradient บน nav
   - *เป้าหมาย:* ป้องกันการใส่โทนสีสะเปะสะปะหรือการผสมผสานปะปน

5. **สิทธิ์ของ User และ Context (Can it be done?):**
   - *คำถาม:* ฟังก์ชันที่กำลังจะทำ ได้รับความเห็นชอบหรือสอดคล้องกับ Requirement ส่วนอื่นหรือไม่? มีกฎเหล็กใดขวางอยู่หรือไม่?

#### 14.17.2 — Pre-flight Command List
ก่อนเขียนโค้ดหน้าใหม่ ให้รันคำสั่งเหล่านี้เพื่อตรวจสอบสภาพแวดล้อม:
```bash
# 1. ตรวจสอบว่ามี components ที่คล้ายกันในระบบหรือไม่ (เช่น หน้า Dashboard หรือ Table)
grep -rn "Table" src/components/admin/

# 2. ตรวจสอบ types ของ supabase เสมอเพื่อให้มั่นใจว่า schema พร้อมใช้งาน
grep -A 20 "table_name_here" src/integrations/supabase/types.ts
```

---

### Rule 14.18 — Command Palette & Global Search (Ctrl/Cmd+K)

ทุก action ที่ "เปิดหน้า" หรือ "เปิด dialog หลัก" **ควร** เข้าถึงได้จาก Command Palette เพื่อให้ผู้ใช้ขั้นสูง (admin/teacher) ทำงานเร็วโดยไม่ต้อง navigate ผ่านเมนู

- **Registry:** `src/lib/commands/registry.ts` (static commands) — เพิ่ม entry ตอนสร้าง feature ใหม่ พร้อมระบุ `roles?: ('admin'|'teacher'|'parent'|'public')[]`
- **Hotkey:** Ctrl/Cmd+K สงวนไว้สำหรับ Command Palette เท่านั้น — ห้ามใช้กับ shortcut อื่น
- **Fuzzy Search:** ใช้ index จาก `globalSearchService.fetchIndex()` (cache 5 นาทีผ่าน TanStack Query) — แสดงผลแยก group ตาม type (student/staff/news/document)
- **Affordance:** ทุก layout หลัก (AdminLayout) ต้องโชว์ปุ่ม "🔍 ค้นหา... ⌘K" ใน top bar
- **RLS:** Service ที่ดึง index ต้องอาศัย RLS เดิม — ห้ามเปิด policy เพิ่มเพื่อ search

### Rule 14.22 — ปพ. PDF Generation Standards

- **เกรด:** ใช้เกณฑ์ สพฐ. 4-point เท่านั้น — 80=4 / 75=3.5 / 70=3 / 65=2.5 / 60=2 / 55=1.5 / 50=1 / <50=0. **ห้าม** ใช้ระบบเกรดอื่น (เช่น A-F หรือ 100-point) ใน ปพ.
- **ช่วงเทอม:** เทอม 1 = พ.ค.-15 ต.ค. · เทอม 2 = 1 พ.ย.-31 มี.ค. (ปี ค.ศ. ถัดไป) — Hardcoded ใน `termDateRange()` ของ `papor.service.ts`
- **ฟอนต์:** ต้องใช้ Sarabun (Thai weights 400/700) เท่านั้น — ไฟล์อยู่ที่ `public/fonts/Sarabun-{Regular,Bold}.woff`. ห้าม fallback เป็นฟอนต์ระบบ
- **Hyphenation:** ปิด React-PDF hyphenation สำหรับไทยด้วย `Font.registerHyphenationCallback((w) => [w])` — ป้องกัน "การเรียน" ถูกตัดเป็น "การ-เรียน"
- **Bulk download:** ต้องมี `setTimeout(150)` ระหว่างไฟล์เพื่อกัน browser block (Chrome จำกัด <= 10 downloads/sec)
- **Data source:** ดึงจาก score_records + attendance_records + conduct_scores เท่านั้น — **ห้าม** Mock หรือ hardcode ตัวอย่าง
- **Disclaimer:** ปุ่ม download ต้องมีข้อความเตือน "กรุณาตรวจสอบก่อนส่ง" — ระบบไม่รับผิดชอบความถูกต้องของข้อมูลก่อนส่งราชการ

### Rule 14.28 — Homework Portal (M091)

- **1 submission per (assignment, student):** UNIQUE constraint — re-submit = upsert (overwrite previous body/attachment)
- **Parent submits, never edits after grading:** policy `parent_update_own_submission` blocks UPDATE when `graded_at IS NOT NULL`
- **Class scope:** assignments เก็บ `class` + nullable `room` — parent visibility via parent_student_links → students.class match
- **max_score default 10:** ถ้าครูไม่ระบุจะ default 10 (ป้องกัน null)
- **Archive flag:** ใช้ `is_archived` ลบ soft — **ห้าม** DELETE assignment ที่มี submissions (เก็บประวัติคะแนน)

### Rule 14.29 — Conference Scheduling (M092)

- **UNIQUE slot booking:** `chat_threads.slot_id UNIQUE` — 1 booking ต่อ slot เด็ดขาด (no double-booking)
- **Future-only booking:** RLS policy `parent_book_open_slot` ตรวจ `starts_at > NOW()` — server-side enforcement
- **Cancellation:** ใช้ status='cancelled' + cancelled_reason — **ห้าม** DELETE booking (audit trail)
- **No timezone field:** ทุกอย่างใช้ timestamptz + Asia/Bangkok ในการแสดงผล — สมมุติว่าเฉพาะโรงเรียนเดียวเขต TH
- **Notification (TODO):** ยังไม่ wire push เมื่อ booking สร้าง — ใส่ใน next sprint (เพิ่ม trigger หรือ edge fn)

### Rule 14.30 — Dismissal/Pickup Tracking (M093)

- **Snapshot fields mandatory:** pickup_log.pickup_person_name_snapshot + relation_snapshot — เก็บค่าตอนบันทึก เพราะ pickup_persons อาจ deactivated ทีหลัง (audit needs name)
- **Action enum:** pickup / self_dismiss / bus_board / bus_arrive_home / left_school — **ห้าม** เพิ่มค่านอก enum โดยไม่อัพ CHECK
- **Auto-notify parents:** ทุกครั้งที่ insert pickup_log → fan out send-push + line-send แบบ best-effort (catch errors, ไม่ block)
- **PDPA:** ID 4 หลักท้ายเท่านั้น (`national_id_last4`) — ห้ามเก็บเต็ม 13 หลัก ยกเว้นในตาราง `students.national_id` ที่ใช้สำหรับ DMC export

### Rule 14.25 — Realtime Chat Architecture (M089)

- **1 thread per tuple:** UNIQUE(parent_user_id, teacher_user_id, student_id) — **ห้าม** สร้าง thread ซ้ำสำหรับคู่เดิม. ใช้ `chatService.openThread()` ที่ idempotent
- **Realtime subscription:** `chat.service.subscribeToThread()` ส่ง postgres_changes INSERT events เท่านั้น — UPDATE (mark-read) ไม่ broadcast เพื่อลด traffic
- **Read receipt:** field `read_at` set โดย receiver ผ่าน policy `message_mark_read` — sender แก้ไม่ได้
- **trigger update_thread_on_new_message:** sync `last_message_at` + `last_message_preview` ให้ทุก INSERT — **ห้าม** sync ใน client (race condition)
- **Attachments (Phase 2):** ใช้ storage bucket `chat-attachments` (ยังไม่สร้าง — เพิ่มเมื่อต้องการ)
- **Working hours hint:** UI แสดง "ตอบกลับช่วง 08:00–17:00" — ไม่บังคับด้วย code (parent อาจส่งนอกเวลา, teacher เห็นใน working hours จริง)

### Rule 14.26 — Emergency Alerts (M088)

- **3 severities:** info (ℹ️), warning (⚠️), critical (🚨) — มี visual + prefix แตกต่าง
- **4 audiences:** all_parents / all_staff / all_users / class_specific — admin เท่านั้นที่ส่งได้
- **Fan-out pattern:** Push (`send-push`) + LINE (`line-send`) พร้อมกันด้วย Promise.all — แต่ละช่องล้มเหลวอย่างเดียวไม่ block
- **Audit mandatory:** ทุก broadcast ต้อง insert emergency_alerts row พร้อม push_sent_count + line_sent_count + total_targets
- **Confirmation dialog:** ต้องมี ก่อนส่งทุกครั้ง — ห้าม one-click ส่งทันที (life-safety, ลด accidental broadcasts)

### Rule 14.27 — Donations & PromptPay (M090)

- **Source of truth:** ใช้ `donation_campaigns.raised_amount` ที่ trigger auto-recalc จาก verified donations — **ห้าม** คำนวณยอดเองใน client
- **Verification flow:** parent บริจาค → donations.is_verified = false → admin ตรวจสลิปจริง → verify → trigger รวมเข้า raised_amount
- **PromptPay QR:** ใช้ lib `promptpay-qr@0.5.0` — `generatePayload(id, { amount })` → render ใน `<QRCode>` (lib react-qr-code)
- **PromptPay ID format:** รองรับเบอร์มือถือ (xxx-xxx-xxxx) และเลขปชช. (x-xxxx-xxxxx-xx-x) — lib parse อัตโนมัติ
- **Tax receipt (Phase 2):** ปัจจุบันออกใบเสร็จ manual — เชื่อม e-Donation ของกรมสรรพากร = next sprint
- **Public read:** anyone อ่าน campaigns ที่ is_active = true + verified donations ได้ — สำหรับ transparency

### Rule 14.24 — Health Records & PDPA (M086 + M087)

- **Health source of truth:** `student_health_records` (1:1) + `student_vaccinations` + `student_growth_measurements` — **ห้าม** เก็บข้อมูลสุขภาพในตารางอื่น
- **น้ำหนัก/ส่วนสูง:** ใช้ view `student_latest_growth` เมื่อต้องการค่าล่าสุด (DMC export, parent dashboard) — view auto-refresh เมื่อเพิ่ม measurement ใหม่
- **BMI:** generated column ใน student_growth_measurements — **ห้าม** คำนวณใน client (เผื่อ inconsistency)
- **DMC export:** ต้องใช้ `dmcExportService.fetchRows()` เท่านั้น — ตาราง schema match สพฐ. — **ห้าม** export field อื่นที่ผู้ปกครองไม่อนุญาต (ตรวจ pdpa_consents.data_sharing_moe ก่อน)
- **PDPA consents:** scope ใหม่ทุกตัวต้องเพิ่มใน CHECK constraint ของ pdpa_consents.scope + SCOPE_LABELS ใน pdpa.service.ts — sync ทั้งคู่
- **Audit log mandatory:** ทุก action ที่อ่าน/แก้ข้อมูลละเอียดอ่อนของนักเรียน (รูป, คะแนน, attendance, health) **ต้อง** call `log_data_access()` RPC — admin จะใช้ตรวจตาม พ.ร.บ.มาตรา 83
- **Erasure SLA:** เมื่อ pdpa_erasure_requests.status = 'approved' → ต้อง execute deletion ภายใน 30 วัน → mark status='completed'
- **Privacy notice link:** footer ของเว็บไซต์โรงเรียน**ต้อง**มี link "นโยบายความเป็นส่วนตัว" (ปัจจุบันยังขาด — ติดตามใน next sprint)
- **DPO contact:** ถ้าโรงเรียนมีนักเรียน > 5,000 คน → ต้องแต่งตั้ง DPO + เปิด contact form สำหรับ data subject

### Rule 14.23 — LINE Official Account Integration (M085)

ทดแทน LINE Notify ที่ปิดไป 1 เม.ย. 2025

- **Schema source of truth:** `line_user_links` — ห้ามเก็บ line_user_id ในตารางอื่น
- **Webhook URL ใน LINE Console:** `https://lkpqssbqxxpasidfqhpb.supabase.co/functions/v1/line-webhook` (verify_jwt=false, ใช้ x-line-signature แทน)
- **Signature verification:** HMAC-SHA256 + base64 + constant-time compare — **ห้าม** skip ในทุกกรณี
- **Required secrets (Supabase Edge Functions):** `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` — ห้าม commit
- **Required Vercel env:** `VITE_LINE_OA_BASIC_ID` (จาก LINE OA Manager → ตั้งค่า → ID) → ใช้สร้าง add-friend URL `https://line.me/R/ti/p/@{basicId}`
- **ส่งข้อความ:** ทุกครั้งต้องผ่าน `line-send` edge function — **ห้าม** call LINE Messaging API ตรงจาก client (access token = secret)
- **Fan-out pattern:** เมื่อมี event ที่ต้อง notify (absence, score, news) → call `send-push` + `line-send` **คู่กัน** แบบขนาน (Promise.all) — parent ที่มีอย่างใดอย่างหนึ่งก็พอ
- **Log audit:** ทุก in/out message ต้องบันทึก `line_message_logs` — admin ใช้ตรวจการส่ง
- **Rate limit:** LINE OA Free plan = 200 messages/month — production ควรอัป plan หรือใช้ broadcast แทน per-user push เมื่อส่ง mass message

### Rule 14.20 — Multi-Child Parent Architecture (M083)

- **Source of truth:** ตาราง `parent_student_links` (many-to-many) — **ห้าม** อ่าน `user_roles.student_id` โดยตรงสำหรับ parent อีกต่อไป
- **Client API:** `useActiveChild()` hook returns `{children, activeChild, setActiveChildId}` — ทุก parent page ใช้ `activeChild` ไม่ใช่ `useLinkedRecord`
- **RPC:** ใช้ `my_children()` (parent) และ `parents_of_student(uuid)` (server-side push trigger) — ทั้งคู่ SECURITY DEFINER
- **Default child:** field `is_primary` ใน parent_student_links → fallback ไป list[0] ถ้าไม่มี
- **localStorage key:** `kampai_active_child_id` — persist across sessions
- **Backward compat:** Backfill migration ดึงข้อมูลเดิมจาก user_roles เข้า parent_student_links ตอน apply M083 (idempotent)

### Rule 14.21 — AI Assistant Boundaries

- **Roles:** admin + teacher เท่านั้น — parent/student/public ห้ามเรียก ai-assist function
- **Logging:** ทุก call ต้อง insert `ai_assist_log` (mode, model, tokens, duration) — admin ใช้ audit cost
- **Prompt caching:** system prompt ต้องใช้ `cache_control: { type: 'ephemeral' }` เสมอ — ประหยัด input tokens ครั้งถัดไป
- **Model selection:** `report_comment` ใช้ MODEL_FAST (haiku), อื่นๆ ใช้ MODEL_SMART (sonnet) — override ผ่าน env ANTHROPIC_MODEL_FAST/SMART ได้
- **Disclaimer:** ผลลัพธ์ AI **ต้อง** มีคำเตือนใน UI ว่า "ปรับแก้ต่อก่อนใช้งานจริง" — AI อาจ hallucinate ข้อมูลตัวเลข
- **Secret:** `ANTHROPIC_API_KEY` ใน Supabase Edge Function — **ห้าม** commit หรือใส่ใน VITE_* env

### Rule 14.19 — Web Push Notifications (PWA)

- **VAPID keys:** Public key อยู่ใน `VITE_VAPID_PUBLIC_KEY` (env), Private key อยู่ใน Supabase Edge Function secret `VAPID_PRIVATE_KEY` — **ห้าม** commit private key
- **Service Worker:** ใช้ InjectManifest strategy + `src/sw.ts` เท่านั้น — ห้ามกลับไปใช้ GenerateSW
- **Subscription table:** `push_subscriptions` (Migration 082) — schema มี `topics` array สำหรับ filter (absence/score/news/emergency)
- **Edge function `send-push`:** ตรวจสิทธิ์ admin ก่อนส่งเสมอ; auto-prune subscription ที่ 404/410
- **iOS support:** ต้องติดตั้ง PWA ผ่าน "Add to Home Screen" + iOS 16.4+ เท่านั้น — แสดง hint นี้ใน PushPermissionBanner ถ้าตรวจพบ Safari iOS ปกติ
- **Banner UX:** `PushPermissionBanner` แสดงเฉพาะเมื่อ `session && permission === 'default' && !dismissedRecently(7d)` — ห้าม spam

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
