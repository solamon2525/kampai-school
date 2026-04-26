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

## 8. Frontend Components (specs)

### Hero
```tsx
<section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
  <div className="container mx-auto px-4 text-primary-foreground">
    {/* content */}
  </div>
</section>
```

### Card
```tsx
<div className="bg-card text-card-foreground rounded-2xl shadow-md border border-border p-6 md:p-8">
```

### Button (primary)
- `<Button>` (shadcn) ใช้ `--primary` อยู่แล้ว → import จาก `@/components/ui/button`
- ห้าม style เอง

### Section label
```tsx
<span className="inline-block text-accent font-semibold uppercase tracking-widest text-sm">
  หัวข้อ
</span>
```

### NavBar (frontend)
```tsx
<nav className="bg-background/95 backdrop-blur border-b border-border">
  {/* menu items: text-foreground hover:text-primary */}
</nav>
```

---

## 9. Backend Components (specs)

### AdminSidebar
```tsx
<aside className="bg-[--admin-sidebar] text-[--admin-sidebar-fg] w-64 min-h-screen p-4">
  <a className="block px-3 py-2 rounded-md hover:bg-white/5 data-[active=true]:bg-primary">
```

### AdminCard
```tsx
<div className="bg-[--admin-surface] text-[--admin-text] rounded-lg border border-[--admin-border] p-5">
```

### AdminStatCard
```tsx
<div className="bg-[--admin-surface] rounded-lg border border-[--admin-border] p-4">
  <p className="text-[--admin-text-muted] text-sm">{label}</p>
  <p className="text-3xl font-bold text-primary mt-1">{value}</p>
</div>
```

### AdminTable
- Header: `bg-[--admin-bg] text-[--admin-text-muted] uppercase text-xs tracking-wider`
- Row hover: `hover:bg-[--admin-bg]/60`
- Border: `border-[--admin-border]`
- ห้าม row striping ด้วยสีเขียว — ใช้ neutral grey เท่านั้น

---

## 10. Replacement Mapping (Purple → Green tokens)

ใช้ตารางนี้เมื่อ refactor ไฟล์ที่มี hardcoded purple:

| ปัจจุบัน (forbidden) | แทนด้วย (correct) |
|---|---|
| `bg-purple-950` | `bg-foreground` หรือ `bg-primary-deep` |
| `bg-purple-900` | `bg-primary/90` |
| `bg-purple-800` | `bg-primary` |
| `bg-purple-700` | `bg-primary` |
| `bg-purple-600` | `bg-accent` |
| `bg-purple-100` | `bg-secondary` |
| `bg-purple-50` | `bg-muted` |
| `text-purple-900` | `text-primary-deep` หรือ `text-foreground` |
| `text-purple-700` | `text-primary` |
| `text-purple-500` | `text-accent` |
| `from-purple-* to-indigo-*` | `from-primary to-accent` |
| `from-purple-600 to-indigo-700` | `from-primary to-primary-light` |
| `focus:ring-purple-400` | `focus:ring-ring` |
| `border-gray-300` | `border-border` |
| `bg-white` (frontend) | `bg-background` หรือ `bg-card` |
| `text-black` | `text-foreground` |
| `bg-gray-50` (frontend) | `bg-muted` |
| `bg-gray-100` (admin) | `bg-[--admin-bg]` |

---

## 11. Migration Checklist (purple offenders ที่ต้องแก้)

ไฟล์ต่อไปนี้ตรวจพบ hardcoded purple ที่ขัดกับ DESIGN.md (เป็น checklist สำหรับ task ถัดไป — ไม่ใช่ scope ของการ rewrite DESIGN.md):

### Critical (รั่วเข้าหน้าหลัก — แก้ก่อน)
- [ ] `src/components/home/HomeNavBar.tsx` — `bg-purple-950`, `bg-purple-900` (2 จุด)
- [ ] `src/components/home/HomeRightSidebar.tsx` — categories, headers, links (11+ จุด)
- [ ] `src/components/home/HomeMainContent.tsx` — cards, gradients, buttons (30+ จุด)
- [ ] `src/components/home/HomeHeaderZone.tsx` — TBD (ตรวจเพิ่ม)
- [ ] `src/components/home/HomeTopBar.tsx` — TBD
- [ ] `src/components/home/HomeLeftSidebar.tsx` — TBD

### Page-level (รองลงมา)
- [ ] `src/pages/Enrollment.tsx`
- [ ] `src/pages/Events.tsx`
- [ ] `src/pages/Gallery.tsx`
- [ ] `src/pages/AcademicCalendar.tsx`
- [ ] `src/pages/WasteBank.tsx`

### Admin (separate task — ใช้ backend palette แทน)
- [ ] `src/components/admin/shared/AdminLayout.tsx` — sidebar ใช้ `--admin-sidebar`
- [ ] `src/components/admin/system/SystemOverview.tsx`
- [ ] `src/components/admin/analytics/AnalyticsManagement.tsx`
- [ ] `src/components/admin/attendance/AttendanceManagement.tsx`
- [ ] `src/components/admin/academic/*` (5 files)

> **วิธีตรวจรอบใหม่:** `grep -rn "purple\|violet\|indigo\|fuchsia" src/` แล้วเทียบ replacement table

---

## 12. AI Agent Hard Rules

กฎที่ AI coding agent ต้องตามให้เคร่งครัด เมื่อเขียน/แก้โค้ด UI:

### กฎสี (สำคัญที่สุด)
1. **ใช้ CSS vars เสมอ** — `bg-primary`, `text-foreground`, `border-border`, `bg-card`, `bg-background`, `bg-muted`, `text-muted-foreground`, `bg-secondary`, `text-accent`
2. **ห้าม hardcode** — `bg-white`, `bg-black`, `text-black`, `text-white`, `bg-gray-*`, `border-gray-*`, สีใน hex
3. **ห้ามสีต้องห้ามเด็ดขาด** บน frontend: `purple`, `violet`, `indigo`, `fuchsia`, `pink`, `magenta`, neon variants
4. **Admin ใช้ admin palette** — `bg-[--admin-bg]`, `bg-[--admin-surface]`, `text-[--admin-text]` ฯลฯ

### กฎ component
5. **ไฟล์ใน `src/components/ui/`** (shadcn) ห้ามแก้ — ถ้าต้อง custom ให้ wrap component ใหม่
6. **Icon** import จาก `lucide-react` เท่านั้น
7. **Card** ใช้ `<Card>` จาก shadcn — ห้าม build div+border เอง

### กฎ data
8. **State management** ใช้ TanStack Query v5 (`useQuery`/`useMutation`) — ไม่ใช่ `useState` + `useEffect` + `fetch`
9. **Supabase queries** ผ่าน `src/services/*.service.ts` เท่านั้น — ห้ามเรียก `supabase.from()` ใน component
10. **Types** ใช้จาก `@/integrations/supabase/types` — ห้ามสร้าง interface ซ้ำ

### กฎ a11y
11. **Contrast** ต้องผ่าน WCAG AA (4.5:1 body, 3:1 large/UI)
12. **Form** ใช้ React Hook Form + `zodResolver(schema)` + `<Form>` primitive จาก shadcn
13. **Focus ring** ใช้ `focus:ring-ring` หรือ `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### กฎภาษา
14. **UI ภาษาไทยเป็นหลัก** — ตัวอย่าง placeholder, label, error message
15. **Typography line-height** ≥ 1.6 บน body text (ภาษาไทยต้องการพื้นที่)

---

## 13. Spacing & Layout

- **Container:** `container mx-auto px-4` หรือ `.container-school` (max-w-7xl)
- **Section padding:** `.section-padding` = `py-16 md:py-20 lg:py-24`
- **Responsive breakpoints:** sm=640, md=768, lg=1024, xl=1280, 2xl=1536
- **Grid gap:** ใช้ Tailwind `gap-4` (mobile) / `gap-6 md:gap-8` (desktop)

---

## 14. Verification Commands

```bash
# Validate DESIGN.md syntax
pnpm lint:design

# Find purple offenders
grep -rn "purple\|violet\|indigo\|fuchsia" src/ | grep -v ".test."

# Find hardcoded white/black
grep -rn "bg-white\|text-black\|bg-black\|text-white" src/

# Build check
pnpm build
```
