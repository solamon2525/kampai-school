# DESIGN-COMPONENTS.md — Component Specs + Migration

> Companion to [`DESIGN.md`](./DESIGN.md). อ่านไฟล์นี้เมื่อ:
> - กำลัง implement component ตาม spec (Hero/Card/Button/AdminSidebar/AdminTable)
> - ต้องตรวจ replacement mapping (purple → green token)
> - ต้องการ AI Hard Rules version ละเอียด
> - กำลัง migrate ไฟล์ legacy ที่มี hardcoded purple

DESIGN.md ครอบคลุม: theme, palette, contrast, typography, UX rules 14.x, spacing, verification commands

---

## 1. Frontend Components (specs)

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

## 2. Backend Components (specs)

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

## 3. Replacement Mapping (Purple → Green tokens)

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

## 4. Migration Checklist (purple offenders ที่ต้องแก้)

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

## 5. AI Agent Hard Rules

กฎที่ AI coding agent ต้องตามให้เคร่งครัด เมื่อเขียน/แก้โค้ด UI:

### กฎสี (สำคัญที่สุด)
1. **ใช้ CSS vars เสมอ** — `bg-primary`, `text-foreground`, `border-border`, `bg-card`, `bg-background`, `bg-muted`, `text-muted-foreground`, `bg-secondary`, `text-accent`
2. **ห้าม hardcode** — `bg-white`, `bg-black`, `text-black`, `text-white`, `bg-gray-*`, `border-gray-*`, สีใน hex
3. **ห้ามสีต้องห้ามเด็ดขาด** บน frontend: `purple`, `violet`, `indigo`, `fuchsia`, `pink`, `magenta`, neon variants
4. **Admin ใช้ admin palette** — `bg-[--admin-bg]`, `bg-[--admin-surface]`, `text-[--admin-text]` ฯลฯ
5. **ห้าม gradient บน nav/header/announcement banner** — ใช้ **solid color เท่านั้น**
   ```
   ❌ <nav className="bg-gradient-to-r from-primary to-accent">     // ขอบ blend ดูเลอะ
   ❌ <header className="bg-gradient-to-br from-primary via-primary/90 to-accent">
   ❌ <div className="bg-gradient... text-white">📢 ประกาศ...</div>  // banner
   ✅ <nav className="bg-primary text-primary-foreground">
   ✅ <header className="bg-primary text-primary-foreground">
   ✅ <div className="bg-accent text-accent-foreground">📢 ประกาศ...</div>
   ```
   Gradient ใช้ได้เฉพาะ:
   - Image overlay (text legibility): `bg-gradient-to-t from-black/70 to-transparent`
   - Image placeholder: `bg-gradient-to-br from-muted to-secondary`
   - Decorative card thumbnail (ที่ไม่ใช่ navigation/header)

### กฎ contrast เฉพาะสีเหลือง / accent อบอุ่น
6. **`text-yellow-300` / `accent-soft` (#FFD874)** ใช้ได้เฉพาะบน:
   - `bg-primary` (forest green) — contrast 9.5:1 ✅
   - `bg-foreground` / dark surface — contrast > 8:1 ✅

   **ห้ามใช้บน:**
   - Gradient ที่มี white/light area — ตรงจุด white จะกลืนหายทันที ❌
   - `bg-secondary` / `bg-muted` (light bg) — contrast < 1.8:1 fail ❌
   - `bg-background` (white) — fail ❌

### กฎ text-on-light-bg minimum
7. **บน white/light bg ห้ามใช้ text เบาเกินไป**:
   ```
   ❌ text-gray-400 / text-gray-500       (เบา → อ่านยาก)
   ❌ text-foreground/40 (opacity ต่ำเกิน)
   ✅ text-foreground                     (default body)
   ✅ text-muted-foreground               (#568165 — minimum สำหรับ secondary text)
   ```
   - Body text ต้อง weight ≥ 400, contrast ≥ 4.5:1
   - Menu/link items ใช้ `font-medium` ขึ้นไปเพื่อเพิ่ม readability

### กฎ component
8. **ไฟล์ใน `src/components/ui/`** (shadcn) ห้ามแก้ — ถ้าต้อง custom ให้ wrap component ใหม่
9. **Icon** import จาก `lucide-react` เท่านั้น
10. **Card** ใช้ `<Card>` จาก shadcn — ห้าม build div+border เอง

### กฎ data
11. **State management** ใช้ TanStack Query v5 (`useQuery`/`useMutation`) — ไม่ใช่ `useState` + `useEffect` + `fetch`
12. **Supabase queries** ผ่าน `src/services/*.service.ts` เท่านั้น — ห้ามเรียก `supabase.from()` ใน component
13. **Types** ใช้จาก `@/integrations/supabase/types` — ห้ามสร้าง interface ซ้ำ

### กฎ a11y
14. **Contrast** ต้องผ่าน WCAG AA (4.5:1 body, 3:1 large/UI)
15. **Form** ใช้ React Hook Form + `zodResolver(schema)` + `<Form>` primitive จาก shadcn
16. **Focus ring** ใช้ `focus:ring-ring` หรือ `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### กฎภาษา
17. **UI ภาษาไทยเป็นหลัก** — ตัวอย่าง placeholder, label, error message
18. **Typography line-height** ≥ 1.6 บน body text (ภาษาไทยต้องการพื้นที่)

### กฎ layout/spacing
19. **Footer ต้อง compact + มี visual hierarchy:**
   - Container padding: `py-10` (ห้าม `py-16` ใหญ่เกิน)
   - Column gap: `gap-8` (ห้าม `gap-12+`)
   - Item gap: `space-y-1.5` หรือ `space-y-2` (ห้าม `space-y-3+`)
   - Section heading: `text-base font-bold mb-3 pb-2 border-b border-primary-foreground/15`
     (ใช้ subtle bottom border แทนการเว้น margin เยอะ)
   - Body text: `text-sm` (ห้าม default 1rem ใน footer ดูใหญ่เกิน)

---

## Rewards Catalog (Public)

### `<RewardCard reward={...} onClaim={...} />`
- Path: `src/components/rewards/RewardCard.tsx`
- Square aspect image (fallback `<Gift>` icon บน gradient ของ tier)
- Top-left badge = **tier** (emoji + label) — สีตาม `tierFor(points_cost)`
- Top-right badge = **stock** ถ้า `stock !== null` (สีแดงเมื่อหมด)
- Bottom: ชื่อ + description (line-clamp-2) + แต้ม + ปุ่ม "แลกรางวัล"
- Hover: `-translate-y-1 hover:shadow-xl`

### `<RewardClaimDialog reward open onOpenChange />`
- Path: `src/components/rewards/RewardClaimDialog.tsx`
- 2-step flow ใน Dialog เดียว:
  1. กรอก `student_code` → ปุ่ม "ตรวจสอบ" → เรียก RPC `lookup_student_balance`
  2. Preview ชื่อ + แต้มคงเหลือ + การ์ดเตือนถ้าแต้มไม่พอ → ปุ่ม "ยืนยันส่งคำขอ" → เรียก RPC `claim_reward`
- Error mapping: `STUDENT_NOT_FOUND` / `REWARD_UNAVAILABLE` / `INSUFFICIENT_POINTS` / `OUT_OF_STOCK` → ภาษาไทย
- Reset state ทุกครั้งที่เปิดใหม่

### Tier auto-bucket (`src/components/rewards/tier.ts`)
| Key | Emoji | Label | Range | Badge classes |
|---|---|---|---|---|
| `starter` | 🌱 | ระดับเริ่มต้น | 0–50 | `bg-lime-100 text-lime-700` |
| `good` | 🌿 | ระดับดี | 51–150 | `bg-emerald-100 text-emerald-700` |
| `great` | 🌳 | ระดับเยี่ยม | 151–300 | `bg-teal-100 text-teal-700` |
| `elite` | 🏆 | ระดับเลิศ | 301+ | `bg-amber-100 text-amber-700` |

ใช้ `tierFor(points_cost)` เพื่อ map คะแนน → tier ทั้งใน `RewardCard` (สี+badge) และ `RewardsCatalog` (grouping)

### กฎ Public Claim flow (security)
- **ห้ามเปิด INSERT policy บน `reward_claims`** ให้ anon ตรงๆ — ใช้ SECURITY DEFINER RPC `claim_reward(p_code, p_reward_id)` แทน
- Validation ทั้งหมด (student lookup, balance, stock, active) อยู่ใน RPC ฝั่ง DB — ไม่เชื่อ client
- Migration: `supabase/migrations/031_reward_claim_public_rpc.sql`
