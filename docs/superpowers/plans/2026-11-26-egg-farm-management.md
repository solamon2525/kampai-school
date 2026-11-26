# School Egg Farm Management (ระบบบันทึกไข่ไก่และยอดขาย) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend module under `/admin/dashboard/egg-farm` where teachers and admins can record daily egg collections, record egg sales with configurable prices, view daily/weekly/monthly reports, and export data to Excel (`.xlsx`).

**Architecture:** Three Supabase tables (`egg_settings`, `egg_collections`, `egg_sales`) protected by RLS (`is_admin() OR is_teacher()`) feed a typed service (`src/services/egg-farm.service.ts`) and pure aggregation/export helpers (`src/lib/eggFarmHelpers.ts`). The UI lives in `src/components/admin/egg-farm/` using existing school backend patterns (`RecorderSelect`, `ThaiDatePicker`, `PersonAvatar`, React Query, React Hook Form + Zod, Recharts, and `xlsx`).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS (light-only CSS vars), Supabase (PostgreSQL + RLS), TanStack React Query, React Hook Form + Zod, Recharts, SheetJS (`xlsx`), Node built-in test runner (`node --test`).

**Spec:** User request (`/writing-plans`): ระบบบันทึกไข่ไก่ อยู่ระบบหลังบ้าน มีการเก็บไข่และบันทึก หากมีรายการขายขอให้สรุปยอดขายและตั้งราคาไข่ได้ด้วย ออกแบบระบบให้ใช้งานได้ง่าย บันทึกข้อมูลจากครูเหมือนเดิม มีระบบรายงาน รายวัน รายสัปดาห์ รายเดือน พร้อมสามารถ export ข้อมูลได้

## Global Constraints

- **Package manager:** `pnpm` only (never `npm`/`yarn`).
- **Data access:** All Supabase queries go through `src/services/egg-farm.service.ts` (no `supabase.from()` in components). Server state uses `useQuery` / `useMutation` + `queryClient.invalidateQueries`.
- **Styling:** Light-mode CSS vars only (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`); no `bg-white`, `text-black`, hardcoded hex colors, or `dark:` prefix; use `cn()`.
- **Person display:** Every teacher/admin recorder name displayed in tables must pair with `<PersonAvatar name=... photoUrl=... />` and the service must `SELECT photo_url`.
- **Forms:** Use React Hook Form + `zodResolver` + `<Form>` primitives from `components/ui/form`.
- **Routing & Navigation:** Lazy-load `EggFarmManagement` in `src/pages/AdminDashboard.tsx`. Any icon added to `src/lib/commands/registry.ts` must be imported from `lucide-react` at the top of the file.
- **Documentation discipline:** Add a top entry to `versionHistory` in `src/components/admin/system/SystemOverview.tsx`.

## Review Focus

1. **Zero or negative quantities / prices:** Submitting `0` total eggs in a collection, `0` quantity in a sale, or negative prices must be blocked by both Zod validation and DB `CHECK` constraints, returning clear Thai error messages.
2. **Overselling beyond available stock (warning vs hard block):** If a teacher records a sale when `remainingGoodEggs` is lower than `eggsCount` (e.g., forgot to log morning collection first), show a clear non-blocking warning badge/confirmation rather than corrupting stock math (`remainingGoodEggs` can display negative or `0` with deficit indicator, and calculations never `NaN`).
3. **Thai date & Bangkok timezone boundaries:** Daily/weekly/monthly grouping must use `YYYY-MM-DD` in Asia/Bangkok (`getBangkokTodayIso`) so late-evening or early-morning entries do not shift into the previous UTC day.
4. **Price snapshot integrity:** Changing `price_per_egg` or `price_per_tray` in `egg_settings` must only affect future sales; historical `egg_sales` rows retain their recorded `unit_price` and `total_amount`.
5. **Empty dataset export & reporting:** Viewing daily/weekly/monthly reports or clicking Export Excel when there are 0 collections or 0 sales must produce valid empty-state UI and a valid `.xlsx` file with headers instead of crashing.

---

### File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/594_egg_farm_system.sql` | Create `egg_settings`, `egg_collections`, `egg_sales` tables, indexes, triggers, RLS policies, and default price seed |
| `src/lib/eggFarmHelpers.ts` | Pure calculation, stock summary, daily/weekly/monthly report aggregation, and Excel sheet row formatting |
| `scripts/test-egg-farm-helpers.mjs` | Unit tests for `eggFarmHelpers.ts` (including all 5 Review Focus edge cases) |
| `src/services/egg-farm.service.ts` | Typed Supabase CRUD for settings, collections, and sales (selecting `photo_url` on recorder joins) |
| `src/services/index.ts` | Re-export `egg-farm.service.ts` |
| `src/components/admin/egg-farm/EggPriceDialog.tsx` | Modal form (RHF + Zod) to configure egg price per egg, per tray, eggs per tray, and flock size |
| `src/components/admin/egg-farm/EggReportTab.tsx` | Daily/Weekly/Monthly report table, Recharts bar chart, and `.xlsx` multi-sheet export button |
| `src/components/admin/egg-farm/EggFarmManagement.tsx` | Main backend workspace: KPI cards, price banner, Tab 1 (บันทึกเก็บไข่), Tab 2 (บันทึกขายไข่), Tab 3 (รายงาน & Export) |
| `src/pages/AdminDashboard.tsx` | Lazy-load and mount `<Route path="egg-farm" element={<EggFarmManagement />} />` |
| `src/components/admin/shared/AdminLayout.tsx` | Add `ฟาร์มไก่ไข่` menu item under `ระบบบริการ` (accessible to both admin & teacher) |
| `src/pages/teacher/teacher-menu.ts` | Add `ฟาร์มไก่ไข่` shortcut to `TEACHER_MENU` |
| `src/lib/commands/registry.ts` | Add `go-egg-farm` command palette entry with imported `Egg` icon |
| `src/components/admin/system/SystemOverview.tsx` | Add `versionHistory` entry for Egg Farm Management |

---

### Task 1: Database Migration & RLS Policies

**Files:**
- Create: `supabase/migrations/594_egg_farm_system.sql`

**Interfaces:**
- Produces SQL tables:
  - `public.egg_settings (id text PK, price_per_egg numeric(10,2), price_per_tray numeric(10,2), eggs_per_tray integer, flock_size integer, updated_by_staff_id uuid, updated_by_administrator_id uuid, updated_by_name text, updated_at timestamptz)`
  - `public.egg_collections (id uuid PK, collected_date date, period text, good_eggs integer, cracked_eggs integer, spoiled_eggs integer, total_eggs integer GENERATED, note text, recorder_staff_id uuid, recorder_administrator_id uuid, recorder_name text, created_by uuid, created_at timestamptz, updated_at timestamptz)`
  - `public.egg_sales (id uuid PK, sale_date date, unit_type text, quantity integer, eggs_count integer, unit_price numeric(10,2), total_amount numeric(12,2), buyer_name text, payment_method text, note text, recorder_staff_id uuid, recorder_administrator_id uuid, recorder_name text, created_by uuid, created_at timestamptz, updated_at timestamptz)`

- [ ] **Step 1: Write `supabase/migrations/594_egg_farm_system.sql`**

Include:
1. `CREATE TABLE IF NOT EXISTS public.egg_settings` with `CHECK (price_per_egg >= 0)`, `CHECK (price_per_tray >= 0)`, `CHECK (eggs_per_tray > 0)`, `CHECK (flock_size >= 0)`, and seed `INSERT INTO public.egg_settings (id, price_per_egg, price_per_tray, eggs_per_tray, flock_size) VALUES ('default', 5.00, 150.00, 30, 0) ON CONFLICT (id) DO NOTHING;`.
2. `CREATE TABLE IF NOT EXISTS public.egg_collections` with `CHECK (period IN ('เช้า', 'บ่าย', 'ทั้งวัน'))`, non-negative egg counts, `CHECK (good_eggs + cracked_eggs + spoiled_eggs > 0)`, `total_eggs integer GENERATED ALWAYS AS (good_eggs + cracked_eggs + spoiled_eggs) STORED`, and index `idx_egg_collections_date ON public.egg_collections (collected_date DESC)`.
3. `CREATE TABLE IF NOT EXISTS public.egg_sales` with `CHECK (unit_type IN ('ฟอง', 'แผง'))`, `CHECK (quantity > 0)`, `CHECK (eggs_count > 0)`, `CHECK (unit_price >= 0)`, `CHECK (total_amount >= 0)`, `CHECK (payment_method IN ('เงินสด', 'โอนเงิน', 'ค้างชำระ'))`, and index `idx_egg_sales_date ON public.egg_sales (sale_date DESC)`.
4. `ENABLE ROW LEVEL SECURITY` on all 3 tables.
5. RLS policies using `(SELECT public.is_admin()) OR (SELECT public.is_teacher())` for `SELECT`, `INSERT`, `UPDATE`, `DELETE` on `egg_collections` and `egg_sales`, and `SELECT`, `UPDATE` on `egg_settings`.

- [ ] **Step 2: Apply migration & regenerate TypeScript types (when DB target is authorized/running)**

Run: `supabase migration up` (or verify SQL syntax against local Supabase) and `supabase gen types typescript --local > src/integrations/supabase/types.ts`.
Expected: Migration applies cleanly and `src/integrations/supabase/types.ts` includes `egg_settings`, `egg_collections`, `egg_sales`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/594_egg_farm_system.sql src/integrations/supabase/types.ts
git commit -m "feat(egg-farm): add database tables and RLS policies"
```

---

### Task 2: Pure Calculation, Aggregation & Export Helpers (TDD)

**Files:**
- Create: `src/lib/eggFarmHelpers.ts`
- Create: `scripts/test-egg-farm-helpers.mjs`

**Interfaces:**
- Produces:
  - `EggCollectionRow` / `EggSaleRow` minimal structural types
  - `calculateSaleSummary(params: { unitType: 'ฟอง' | 'แผง'; quantity: number; pricePerEgg: number; pricePerTray: number; eggsPerTray?: number; overrideUnitPrice?: number }): { eggsCount: number; unitPrice: number; totalAmount: number }`
  - `computeEggStockSummary(collections: EggCollectionRow[], sales: EggSaleRow[]): { totalGood: number; totalCracked: number; totalSpoiled: number; totalAll: number; totalSoldEggs: number; remainingGoodEggs: number; totalRevenue: number }`
  - `aggregateEggReport(collections: EggCollectionRow[], sales: EggSaleRow[], granularity: 'daily' | 'weekly' | 'monthly', dateFrom?: string, dateTo?: string): { rows: EggReportPeriodRow[]; totals: EggReportTotals }`
  - `buildEggExportSheets(collections: EggCollectionRow[], sales: EggSaleRow[], reportRows: EggReportPeriodRow[]): { summarySheet: Record<string, unknown>[]; collectionsSheet: Record<string, unknown>[]; salesSheet: Record<string, unknown>[] }`

- [ ] **Step 1: Write failing unit tests in `scripts/test-egg-farm-helpers.mjs`**

Test cases using `node:test` and `node:assert/strict`:
1. `calculateSaleSummary_per_egg_and_per_tray`: verifies `2 แผง` at `150` baht/tray (`eggsPerTray = 30`) returns `{ eggsCount: 60, unitPrice: 150, totalAmount: 300 }`, and `10 ฟอง` at `5` baht/egg returns `{ eggsCount: 10, unitPrice: 5, totalAmount: 50 }`.
2. `calculateSaleSummary_override_price_and_zero_guard`: verifies `overrideUnitPrice` overrides default price and throws/clamps when `quantity <= 0` or `unitPrice < 0`.
3. `computeEggStockSummary_handles_deficit_and_price_snapshot`: verifies `remainingGoodEggs = totalGood - totalSoldEggs`, historical sales keep their own `total_amount`, and overselling yields negative `remainingGoodEggs` without `NaN`.
4. `aggregateEggReport_daily_weekly_monthly`: verifies grouping across `2026-11-23` (Monday) and `2026-11-26` (Thursday) merges into 1 weekly row, 2 daily rows, and 1 monthly row (`2569-11` / `พ.ย. 2569`), with accurate sums and date-range filtering.
5. `buildEggExportSheets_empty_dataset`: verifies empty arrays produce valid header-compatible objects or empty arrays without throwing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/test-egg-farm-helpers.mjs`
Expected: FAIL (module `src/lib/eggFarmHelpers.ts` not found or functions undefined).

- [ ] **Step 3: Implement `src/lib/eggFarmHelpers.ts`**

Implement pure TypeScript functions using `src/lib/thaiDate.ts` formatting (`formatThaiDateShort` / Thai month names) and ISO week calculation based strictly on `YYYY-MM-DD` string parsing (no UTC timezone drift). Keep functions small and single-purpose.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/test-egg-farm-helpers.mjs` (or via `npx tsx --test` if TS stripping is needed — check Node version in workspace; if Node < 22.6, use `tsx` or `vite` / `.mjs`-compatible import).
Expected: All 5 test cases PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/eggFarmHelpers.ts scripts/test-egg-farm-helpers.mjs
git commit -m "feat(egg-farm): add calculation, report aggregation, and export helpers"
```

---

### Task 3: Service Layer (`egg-farm.service.ts`)

**Files:**
- Create: `src/services/egg-farm.service.ts`
- Modify: `src/services/index.ts:40-43`

**Interfaces:**
- Consumes: `supabase` from `@/integrations/supabase/client`
- Produces:
  - Types: `EggSettings`, `EggCollection`, `EggSale`, `CreateEggCollectionInput`, `CreateEggSaleInput`, `UpdateEggSettingsInput`
  - Service object `eggFarmService`:
    - `getSettings(): Promise<EggSettings>`
    - `updateSettings(input: UpdateEggSettingsInput): Promise<EggSettings>`
    - `listCollections(opts?: { from?: string; to?: string }): Promise<EggCollection[]>`
    - `createCollection(input: CreateEggCollectionInput): Promise<EggCollection>`
    - `updateCollection(id: string, input: Partial<CreateEggCollectionInput>): Promise<EggCollection>`
    - `deleteCollection(id: string): Promise<void>`
    - `listSales(opts?: { from?: string; to?: string }): Promise<EggSale[]>`
    - `createSale(input: CreateEggSaleInput): Promise<EggSale>`
    - `updateSale(id: string, input: Partial<CreateEggSaleInput>): Promise<EggSale>`
    - `deleteSale(id: string): Promise<void>`

- [ ] **Step 1: Implement `src/services/egg-farm.service.ts`**

Ensure `listCollections` and `listSales` select `staff:recorder_staff_id(id, name, photo_url)` and `administrator:recorder_administrator_id(id, name, photo_url)` so `<PersonAvatar>` receives `photo_url`. Export from `src/services/index.ts`.

- [ ] **Step 2: Type-check service**

Run: `pnpm exec tsc --noEmit`
Expected: 0 TypeScript errors in `src/services/egg-farm.service.ts` and `src/services/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/services/egg-farm.service.ts src/services/index.ts
git commit -m "feat(egg-farm): add eggFarmService for settings, collections, and sales"
```

---

### Task 4: Egg Price Configuration Dialog (`EggPriceDialog.tsx`)

**Files:**
- Create: `src/components/admin/egg-farm/EggPriceDialog.tsx`

**Interfaces:**
- Consumes: `EggSettings`, `eggFarmService.updateSettings`
- Produces: `<EggPriceDialog open={boolean} onOpenChange={(open: boolean) => void} settings={EggSettings | undefined} />`

- [ ] **Step 1: Implement `EggPriceDialog.tsx`**

Use React Hook Form + `zodResolver` + `<Form>` primitives from `@/components/ui/form`.
Schema fields:
- `price_per_egg`: `z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ')`
- `price_per_tray`: `z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ')`
- `eggs_per_tray`: `z.coerce.number().int().min(1, 'ต้องมีอย่างน้อย 1 ฟองต่อแผง')`
- `flock_size`: `z.coerce.number().int().min(0, 'จำนวนแม่ไก่ต้องไม่ติดลบ')`
Include a convenience button/auto-hint `"คำนวณราคาแผงอัตโนมัติ (ราคาต่อฟอง × จำนวนต่อแผง)"`. On submit, call `eggFarmService.updateSettings(...)`, invalidate `['egg-settings']`, and show `toast.success('บันทึกการตั้งค่าราคาไข่แล้ว')`.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/egg-farm/EggPriceDialog.tsx
git commit -m "feat(egg-farm): add egg price settings dialog"
```

---

### Task 5: Daily/Weekly/Monthly Report & Excel Export Tab (`EggReportTab.tsx`)

**Files:**
- Create: `src/components/admin/egg-farm/EggReportTab.tsx`

**Interfaces:**
- Consumes: `EggCollection[]`, `EggSale[]`, `aggregateEggReport`, `buildEggExportSheets`, `XLSX` (`xlsx`), `Recharts`
- Produces: `<EggReportTab collections={EggCollection[]} sales={EggSale[]} />`

- [ ] **Step 1: Implement `EggReportTab.tsx`**

Features:
- Granularity segmented toggle: `รายวัน` (`daily`) | `รายสัปดาห์` (`weekly`) | `รายเดือน` (`monthly`).
- Optional date range filter (`ThaiDatePicker` from / to + quick preset buttons: `7 วันล่าสุด`, `เดือนนี้`, `ทั้งหมด`).
- Recharts `ResponsiveContainer` + `BarChart` showing `ไข่ดีที่เก็บได้ (ฟอง)` vs `ไข่ที่ขาย (ฟอง)` and `ยอดขาย (บาท)` (using CSS variable colors / semantic tokens, no hardcoded hex if avoidable or via chart config).
- Summary table per period (`ช่วงเวลา`, `ไข่ดี`, `ไข่ร้าว`, `ไข่เสีย`, `รวมเก็บ`, `ขายแล้ว (ฟอง)`, `ยอดขาย (บาท)`) with totals footer row.
- `Export Excel (.xlsx)` button: uses `buildEggExportSheets(...)` + `XLSX.utils.json_to_sheet` + `XLSX.utils.book_new` + `XLSX.writeFile(wb, \`รายงานไข่ไก่_${granularityLabel}_${today}.xlsx\`)` creating 3 sheets (`สรุปรายงาน`, `บันทึกเก็บไข่`, `บันทึกขายไข่`).

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/egg-farm/EggReportTab.tsx
git commit -m "feat(egg-farm): add daily/weekly/monthly report and Excel export tab"
```

---

### Task 6: Main Egg Farm Workspace (`EggFarmManagement.tsx`)

**Files:**
- Create: `src/components/admin/egg-farm/EggFarmManagement.tsx`

**Interfaces:**
- Consumes: `eggFarmService`, `RecorderSelect`, `ThaiDatePicker`, `PersonAvatar`, `ConfirmDialog`, `EggPriceDialog`, `EggReportTab`, `computeEggStockSummary`, `calculateSaleSummary`
- Produces: `export function EggFarmManagement()`

- [ ] **Step 1: Implement `EggFarmManagement.tsx`**

Layout & UX designed for quick daily teacher entry:
1. **Header bar:** Title `ระบบฟาร์มไก่ไข่โรงเรียน`, current price badge (`ฟองละ X บาท · แผงละ Y บาท`), `ตั้งราคาไข่` button opening `<EggPriceDialog />`.
2. **4 KPI Cards:**
   - `เก็บไข่ได้วันนี้` (good + total eggs today)
   - `ไข่ดีคงเหลือพร้อมขาย` (stock in ฟอง + approximate แผง)
   - `ยอดขายสะสม` (total revenue in บาท + total eggs sold)
   - `อัตราการวางไข่ / จำนวนแม่ไก่` (shows % if `flock_size > 0`, otherwise prompt to set flock size)
3. **3 Tabs (`บันทึกเก็บไข่` | `บันทึกขายไข่` | `รายงาน & Export`):**
   - **Tab 1 (`บันทึกเก็บไข่`):**
     - RHF + `zodResolver` form: `ThaiDatePicker` (default `getBangkokTodayIso()`), `ช่วงเวลา` (`เช้า` / `บ่าย` / `ทั้งวัน`), `ไข่ดี (ฟอง)`, `ไข่ร้าว/บุบ (ฟอง)`, `ไข่เสีย (ฟอง)`, `หมายเหตุ`, `RecorderSelect` (auto-defaults to logged-in teacher via `useAuth()`).
     - Recent collections table with `<PersonAvatar>` for recorder, Thai formatted date, counts, edit (inline/dialog) and `ConfirmDialog` delete.
   - **Tab 2 (`บันทึกขายไข่`):**
     - RHF + `zodResolver` form: `ThaiDatePicker`, `หน่วยขาย` (`ฟอง` / `แผง`), `จำนวน`, `ราคาต่อหน่วย (บาท)` (auto-filled from `egg_settings`, editable per transaction), live computed `ยอดรวม (บาท)` card, `ผู้ซื้อ`, `วิธีชำระเงิน` (`เงินสด` / `โอนเงิน` / `ค้างชำระ`), `หมายเหตุ`, `RecorderSelect`.
     - Warning banner if `eggsCount > stock.remainingGoodEggs` (non-blocking, reminds teacher to log egg collection if needed).
     - Recent sales table with `<PersonAvatar>` for recorder, buyer, unit/quantity, total amount, payment badge, edit/delete.
   - **Tab 3 (`รายงาน & Export`):** Renders `<EggReportTab collections={collections} sales={sales} />`.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/egg-farm/EggFarmManagement.tsx
git commit -m "feat(egg-farm): add EggFarmManagement workspace for collections and sales"
```

---

### Task 7: Wire Routing, Menus, Command Palette & System Overview

**Files:**
- Modify: `src/pages/AdminDashboard.tsx:78-82,176-185`
- Modify: `src/components/admin/shared/AdminLayout.tsx` (import `Egg` icon + add menu item under `ระบบบริการ`)
- Modify: `src/pages/teacher/teacher-menu.ts` (import `Egg` icon + add menu item)
- Modify: `src/lib/commands/registry.ts` (import `Egg` icon + add `go-egg-farm` command)
- Modify: `src/components/admin/system/SystemOverview.tsx` (add top `versionHistory` entry)

**Interfaces:**
- Consumes: `EggFarmManagement` from `@/components/admin/egg-farm/EggFarmManagement`
- Produces: Route `/admin/dashboard/egg-farm` accessible from Admin Sidebar, Teacher Portal menu, and Command Palette (`Ctrl+K`).

- [ ] **Step 1: Update `AdminDashboard.tsx`, `AdminLayout.tsx`, `teacher-menu.ts`, `registry.ts`, and `SystemOverview.tsx`**

Ensure:
- `Egg` is imported from `lucide-react` in `registry.ts`, `AdminLayout.tsx`, and `teacher-menu.ts`.
- `<Route path="egg-farm" element={<EggFarmManagement />} />` is placed under `{/* ระบบบริการ */}` in `AdminDashboard.tsx` (without `adminOnly: true`, matching `attendance`/`scores`/`conduct` so teachers can record directly).
- `SystemOverview.tsx` has a new top `versionHistory` entry describing the Egg Farm Management module.

- [ ] **Step 2: Run full verification**

Run:
1. `node --test scripts/test-egg-farm-helpers.mjs`
2. `pnpm exec tsc --noEmit`
3. `pnpm build`
4. Verify `registry.ts` icon check (per `AGENTS.md`): `Select-String -Path src/lib/commands/registry.ts -Pattern "icon: [A-Z][a-zA-Z]+" -AllMatches`
5. Real-screen browser check on `/admin/dashboard/egg-farm` at `360x800` and `1280x720` (no overflow, forms submit cleanly, report tabs & export work).

Expected: All unit tests pass, `tsc` and `vite build` succeed with 0 errors, and browser verification passes cleanly.

- [ ] **Step 3: Commit & Push**

```bash
git add src/pages/AdminDashboard.tsx src/components/admin/shared/AdminLayout.tsx src/pages/teacher/teacher-menu.ts src/lib/commands/registry.ts src/components/admin/system/SystemOverview.tsx
git commit -m "feat(egg-farm): wire routes, teacher/admin menus, command registry, and version history"
git push origin main
```

---

## Self-Review

1. **Spec coverage:**
   - อยู่ระบบหลังบ้าน: `/admin/dashboard/egg-farm` (Task 7)
   - เก็บไข่และบันทึก: `egg_collections` + Tab 1 in `EggFarmManagement.tsx` (Tasks 1, 3, 6)
   - รายการขาย & สรุปยอดขาย: `egg_sales` + KPI cards + Tab 2 in `EggFarmManagement.tsx` (Tasks 1, 2, 3, 6)
   - ตั้งราคาไข่ได้ด้วย: `egg_settings` + `EggPriceDialog.tsx` (Tasks 1, 3, 4)
   - บันทึกข้อมูลจากครูเหมือนเดิม: `RecorderSelect` + `<PersonAvatar>` + `teacher-menu.ts` & non-`adminOnly` route (Tasks 3, 6, 7)
   - รายงาน รายวัน รายสัปดาห์ รายเดือน: `aggregateEggReport` + `EggReportTab.tsx` (Tasks 2, 5)
   - Export ข้อมูลได้: `buildEggExportSheets` + `XLSX.writeFile` in `EggReportTab.tsx` (Tasks 2, 5)
2. **Type consistency:** `eggFarmService`, `EggSettings`, `EggCollection`, `EggSale`, `calculateSaleSummary`, `computeEggStockSummary`, `aggregateEggReport`, `buildEggExportSheets`, `EggFarmManagement`, `EggPriceDialog`, `EggReportTab` match across all tasks.
3. **Review Focus:** All 5 failure modes have corresponding constraints in Tasks 1, 2, 4, 5, and 6.
