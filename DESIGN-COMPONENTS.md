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

### PersonAvatar (shared — frontend + backend)

ใช้ทุกที่ที่แสดงชื่อ ครู / ผู้บริหาร / นักเรียน (บังคับโดย DESIGN.md Rule 14.13)

```tsx
import { PersonAvatar } from '@/components/shared/PersonAvatar';

<PersonAvatar name={person.name} photoUrl={person.photo_url} size="sm" />
```

**Props:**
| prop | type | default |
|---|---|---|
| `name` | `string` (required) | — |
| `photoUrl` | `string \| null \| undefined` | — |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` |
| `className` | `string` | — |

**Size map:**
- `xs` = 24px (dropdown items, inline mentions)
- `sm` = 32px (list row, table cell — default)
- `md` = 40px (card body)
- `lg` = 56px (header / profile)

**Behavior:**
- มี `photoUrl` → render `<AvatarImage>` (Radix)
- ไม่มี / null → fallback ตัวอักษรแรก 2 ตัว (`getInitials` จาก `@/lib/avatars`)
- `aria-label={name}` set ให้อัตโนมัติ

**Pattern ที่ถูกต้อง (list/table):**
```tsx
<div className="flex items-center gap-2">
  <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
  <span className="text-sm">{s.name}</span>
</div>
```

**Pattern ที่ถูกต้อง (dropdown):**
```tsx
<SelectItem value={o.id}>
  <div className="flex items-center gap-2">
    <PersonAvatar name={o.name} photoUrl={o.photo_url} size="xs" />
    <span>{o.name}</span>
  </div>
</SelectItem>
```

---

### CommandPalette (shared — global)

Global Cmd-K palette mount ครั้งเดียวใน `App.tsx` ภายใน `<CommandPaletteProvider>`. ทุก feature ใหม่ที่ navigable ควรเพิ่ม entry ใน registry (DESIGN.md Rule 14.18)

```tsx
// src/lib/commands/registry.ts
import { Newspaper } from 'lucide-react';
export const STATIC_COMMANDS: CommandEntry[] = [
  {
    id: 'adm-news-new',
    label: 'เพิ่มข่าวใหม่',
    group: 'แอดมิน',
    icon: Newspaper,
    roles: ['admin'],
    keywords: ['add', 'create', 'new'],
    action: { type: 'navigate', path: '/admin/dashboard/news?new=1' },
  },
];
```

**Trigger:** `useCommandPalette().setOpen(true)` หรือ hotkey Ctrl/Cmd+K (handled by provider)

**Search results:** auto-fetched ผ่าน `globalSearchService.fetchIndex()` + Fuse.js — ไม่ต้อง wire เอง

---

### PaporGenerator (admin/teacher)

หน้า `/admin/dashboard/papor` สร้างเอกสาร ปพ.5 / ปพ.6 อัตโนมัติจากข้อมูลในระบบ

```tsx
import { paporService } from '@/services/papor.service';

// Aggregate one student's data for a term
const data = await paporService.forStudentTerm(studentId, '2569', '1');
// → { student, scores: [{subject, total, max, percent, grade}], attendance, conduct, averagePercent, averageGrade }

// Render PDF (React-PDF)
import { PaporFive } from '@/lib/pdf/papor/PaporFive';
import { pdf } from '@react-pdf/renderer';
const blob = await pdf(<PaporFive data={data} schoolName="..." />).toBlob();
```

**Components:**
- `PaporFive` — ปพ.5, 1 หน้า/คน/ภาคเรียน
- `PaporSix` — ปพ.6, 1 หน้า/คน/ปี (ภาค 1+2 side-by-side)

**Grading scale:** สพฐ. 4-point (`percentToGrade()` exported จาก papor.service)

**Font:** ทุก template เรียก `ensurePaporFontsRegistered()` ก่อนใช้ (idempotent)

---

### ChildSwitcher (parent portal — global)

Popover ที่ให้ผู้ปกครองสลับลูก (Migration 083). Mount ใน parent dashboard header

```tsx
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useActiveChild } from '@/hooks/useActiveChild';

const { activeChild, children: kids } = useActiveChild();
// activeChild = ChildSummary | null (default = is_primary)
{kids.length > 0 && <ChildSwitcher />}
```

**Behavior:**
- 0 children → hidden
- 1 child → static label (ไม่มี popover)
- 2+ children → popover with search + checkmark on active

**Persistence:** เก็บ active id ใน `localStorage['kampai_active_child_id']` — re-hydrate ตอน mount

---

### AiAssistPanel (admin/teacher)

หน้า `/admin/dashboard/ai-assist` 4 modes (Tabs): lesson_plan, exam_questions, report_comment, free

```tsx
import { aiAssistService } from '@/services/ai-assist.service';

const result = await aiAssistService.generate({
  mode: 'lesson_plan',
  input: { subject: 'คณิต', grade: 'ป.4', topic: 'การบวก', duration: '60' },
  notes: 'เน้นกิจกรรมกลุ่ม',
});
// result = { text, model, usage: {input_tokens, output_tokens, cached}, duration_ms }
```

**Modes + required input fields:**
| mode | fields |
|---|---|
| `lesson_plan` | subject, grade, topic, duration |
| `exam_questions` | subject, grade, topic, count, difficulty |
| `report_comment` | studentName, grade, strengths, improvements, conduct |
| `free` | prompt |

**ห้าม:** เรียก ai-assist จาก client ของ parent/student — backend จะ 403 (Rule 14.21)

---

### LineConnectCard (parent portal)

แสดงสถานะการเชื่อมต่อ LINE OA สำหรับ parent (Rule 14.23)

```tsx
import { LineConnectCard } from '@/components/parent/LineConnectCard';
<LineConnectCard />  // self-managing: detects linked status via lineService
```

**3 states:**
- Loading → skeleton + spinner
- Linked → profile picture + display name + ปุ่ม "ยกเลิกการเชื่อมต่อ"
- Not linked → "เพิ่มเพื่อน LINE" button + show/hide QR + 3-step instructions

**Required env:** `VITE_LINE_OA_BASIC_ID` — ถ้าไม่ตั้งจะแสดง warning "ยังไม่ได้ตั้งค่า"

---

### LineFollowersManager (admin)

หน้า `/admin/dashboard/line` — manage ผู้ติดตาม LINE OA

```tsx
import { LineFollowersManager } from '@/components/admin/line/LineFollowersManager';
<LineFollowersManager />
```

**3 tabs:** รอผูก / ผูกแล้ว / เลิกติดตาม
**Actions per row:** "ผูก" (เปิด dialog ใส่ user UUID) + "ทดสอบ" (ส่งข้อความ test ตามใจ)
**Test text:** กำหนดได้ที่ Card ด้านบน — ใช้ร่วมทั้งหน้า

ใช้ `lineService.send({ line_user_ids: [...] })` — ส่งตรงไปยัง LINE userId ไม่ผ่าน user_id

---

### FacebookFeedSection (homepage block)

Homepage block ใต้ส่วน "ข่าวสารล่าสุด" — แสดงโพสต์ล่าสุดจาก Facebook Page

```tsx
import FacebookFeedSection from '@/components/home/sections/FacebookFeedSection';
<FacebookFeedSection />  // self-managing — ใช้ react-query + facebookService
```

**Block id:** `facebook_feed` (registered ใน `BlockPalette.MAIN_BLOCKS` + `HomeMainContent.sectionMap` + `HomepagePreview`)

**Data flow:**
| layer | path |
|---|---|
| Table (admin-only RLS) | `public.facebook_feed_config` (singleton) |
| Table (public read, service-role write) | `public.facebook_posts` |
| RPC (anon-readable, no token) | `public.get_facebook_feed_meta()` |
| Edge function | `supabase/functions/facebook-fetch` (admin auth) |
| Service | `facebookService` ใน `src/services/facebook.service.ts` |
| Hooks | `useFacebookFeedMeta`, `useFacebookPosts`, `useRefreshFacebookFeed` |

**Admin form:** `Settings → Homepage Content → ฟีดข่าว Facebook` — `FacebookFeedSettingsCard.tsx`

**States:** loading skeleton / `enabled=false` → null / `last_status=token_expired` → error banner "Facebook token หมดอายุ..." / empty / posts list

**Visual:** outer card `bg-card border-border` + brand header `bg-primary` + inner card `bg-muted/40` + post rows with thumbnail (`w-16 h-16`) + relative time (date-fns th locale)

**Hard rule:** access_token ห้ามถูกส่งให้ anonymous client — ใช้ RPC `get_facebook_feed_meta()` สำหรับ public meta เท่านั้น

---

### PushPermissionBanner (shared — global)

Mount ใน `App.tsx` ระดับ root. แสดงเฉพาะเมื่อ login + permission default + ไม่ได้กดไว้ก่อนใน 7 วันที่ผ่านมา

```tsx
import { PushPermissionBanner } from '@/components/shared/PushPermissionBanner';
<PushPermissionBanner />  // self-managing
```

**API ผ่าน `pushService`:**
| method | ใช้เมื่อ |
|---|---|
| `pushService.isSupported()` | ก่อนแสดง UI ใดๆ ที่เกี่ยวกับ push |
| `pushService.subscribe()` | ผู้ใช้กด "เปิดแจ้งเตือน" — return `{ok:true}` หรือ `{ok:false, reason}` |
| `pushService.unsubscribe()` | settings page "ปิดการแจ้งเตือน" |
| `pushService.getPermission()` | sync check ปัจจุบัน |

**Push payload (จาก edge function):**
```ts
{ title: string, body: string, url?: string, icon?: string, tag?: string }
```

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
10a. **Person display** ทุกที่ที่ render ชื่อครู/ผู้บริหาร/นักเรียน ต้องใช้ `<PersonAvatar>` คู่ชื่อเสมอ (DESIGN.md Rule 14.13) — ห้ามใช้ shadcn `<Avatar>` ตรง

### กฎ data
11. **State management** ใช้ TanStack Query v5 (`useQuery`/`useMutation`) — ไม่ใช่ `useState` + `useEffect` + `fetch`
12. **Supabase queries** ผ่าน `src/services/*.service.ts` เท่านั้น — ห้ามเรียก `supabase.from()` ใน component
13. **Types** ใช้จาก `@/integrations/supabase/types` — ห้ามสร้าง interface ซ้ำ
13a. **Person services** ที่ดึงชื่อมาแสดง **ต้อง SELECT `photo_url`** ด้วยเสมอ (staff/teachers/administrators/students) — ขาดข้อนี้ = ผิด Rule 14.13

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

---

## 18. Game Play Wrapper — `/play/:gameSlug` (v1.22.0 Pizza pilot)

**Hierarchy:** เกมจะเปิดผ่าน wrapper แทน `window.open` เมื่อ `educational_hub_items.tracked_game = true`

| Component | Path | หน้าที่ |
|---|---|---|
| `PlayGame` (page) | `src/pages/PlayGame.tsx` | State machine `lookup → confirm → pre-game → playing → result` |
| `GamePlayDashboard` (admin) | `src/components/admin/games/GamePlayDashboard.tsx` | 4 stat cards + BarChart + leaderboard |
| `GamesSummary` (Student 360°) | `src/components/admin/student-docs/GamesSummary.tsx` | Per-student stats + LineChart trend + badges + push-to-score dialog |

**Service primitives** (`src/services/game-play.service.ts`):
- `gamePlayService.lookupStudent(code)` · `recordSession({...})` · `getLeaderboard(slug)` · `pushToScoreRecord({...})`
- `gameStatsService.getForStudent(sid, slug)` (view `game_student_stats`)
- `gameSessionsService.getByStudent` / `getRecent` / `getInDateRange`
- `gameAchievementsService.getCatalog(slug)` · `getUnlocked(sid, slug)`
- `trackedGamesService.getBySlug(slug)` · `listTracked()`
- **Helper** `levelFromXp(xp): { level, xpInLevel, xpToNext, progress, isMaxLevel }` — compute client-side

**AI hard rules:**
- ❌ ห้าม `supabase.from('game_sessions').insert()` ใน component — ใช้ `gamePlayService.recordSession()` (RPC)
- ❌ ห้าม trust `studentCode` ที่ส่งจาก iframe โดยตรง — ทุก RPC resolve student เอง
- ❌ ห้าม push session เข้า `score_records` อัตโนมัติ — ต้อง manual gate ผ่าน Student 360° (admin/teacher only)
- ❌ ห้ามแก้ HTML game โดยไม่ทำตาม embed contract ใน DESIGN.md Rule 14.14

**XP/Level curve** (doubling): L(n) requires `100 * (2^(n-1) - 1)` cumulative XP → L1=0, L2=100, L3=300, L4=700, L5=1500, L6=3100, L7=6300 …

**Badge thresholds** (Pizza pilot, migration 066 seed):
| Code | Title | Type | Threshold | XP Bonus |
|---|---|---|---|---|
| `first_play` | ก้าวแรกเชฟพิซซ่า | first_play | — | 20 |
| `score_1k`/`3k`/`5k`/`10k` | พิซซ่ามือ… | score_gte | 1000/3000/5000/10000 | 30/50/80/150 |
| `plays_10` | ขยันฝึกฝน | plays_gte | 10 | 40 |
| `improve_1_5` | พัฒนาตัวเอง 1.5x | improvement_ratio | 1.5 (last_5_avg/first_5_avg) | 100 |
| `streak_7` | ติดต่อกัน 7 วัน | streak_days | 7 (Asia/Bangkok day) | 60 |

**ขยายระบบไปเกมอื่น:**
1. Patch HTML game ตาม contract Rule 14.14 (5 บรรทัด: EMBED flag + listener + postMessage)
2. INSERT badges ลง `game_achievements_catalog` (game_slug ใหม่)
3. UPDATE `educational_hub_items SET game_slug='...', tracked_game=true WHERE external_url='...'`
4. ตรวจ `subject` ให้ตรงเนื้อหาจริง (ไม่ใช่ folder)
