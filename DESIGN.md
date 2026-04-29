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

### Dark mode (admin)
| Token | Hex | Use |
|---|---|---|
| `--admin-dark-bg` | `#0F172A` | Page bg |
| `--admin-dark-surface` | `#1E293B` | Card |
| `--admin-dark-sidebar` | `#0B1220` | Sidebar (deeper than surface) |
| `--admin-dark-text` | `#F1F5F9` | Body |
| `--admin-dark-text-muted` | `#94A3B8` | Secondary |
| `--admin-dark-border` | `#334155` | Divider |

### Backend rules
- **Sidebar เป็น dark slate ตลอดเวลา** ไม่ว่า light/dark mode ของ user — เพื่อให้ navigation มีน้ำหนัก แยกชัดจาก content area
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
   1. `src/index.css` (`:root` + `.dark`)
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
- Dark mode variants (Phase 2 ใช้ light only)

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

### Rule 14.8 — Theme toggle in admin/portal only
- Light/dark mode toggle (`<ThemeToggle />`) ใช้เฉพาะ:
  - `AdminLayout` (admin dashboard)
  - `RolePortalLayout` (teacher/parent portal)
- ❌ `SiteHeader`, `HomeNavBar`, `Footer` ห้ามมี
- เหตุผล: public site ใช้ light mode เท่านั้น (school brand เน้นความสว่าง โล่ง)

### Rule 14.9 — Documentation Discipline (commit + deploy = ต้อง sync ทุกที่)

ทุกครั้งที่จะ `git commit` + `git push` (deploy) **ต้องบันทึกการแก้ไขในทุกจุดที่เกี่ยวข้องก่อน**:

| ที่ต้อง update | ใน case ไหน |
|---|---|
| **`DESIGN.md`** | เปลี่ยน design token / กฎ / pattern ใหม่ → เพิ่ม section หรือ Rule |
| **`SystemOverview.tsx`** (`versionHistory` array) | feature ใหม่ / refactor ใหญ่ → เพิ่ม version entry หัวบนสุด |
| **second-brain `Features.md`** | feature ใหม่ที่ user-visible → list ในหมวดที่เกี่ยวข้อง |
| **second-brain `Roadmap.md`** | sprint/version จบ → tick `[x]` ใน "✅ เสร็จแล้ว" |
| **second-brain `Lessons Learned.md`** | bug ที่ระบุ root cause + fix → entry ใหม่ |
| **second-brain `Decisions.md`** | architecture / library choice → entry ใหม่พร้อม rationale |

**Workflow:**
1. ทำ code changes
2. **ก่อน commit** — update เอกสารข้างบนตามที่เกี่ยวข้อง
3. Commit ทั้ง code + docs ใน commit เดียว (atomic — ไม่แยก "code" กับ "doc fix")
4. Push kampai-school → push second-brain (ถ้าแก้)
5. **รายงาน user ว่าบันทึกที่ไหนบ้าง**

**เหตุผล:** ป้องกันเอกสารหลุด/ล้าสมัย → ทุก session ใหม่ของ Claude/dev อ่าน docs แล้วได้ context ปัจจุบันจริง ไม่ใช่ snapshot เก่า

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
