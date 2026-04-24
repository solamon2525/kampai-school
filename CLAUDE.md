# kampai-school

เว็บโรงเรียนบ้านคำไผ่ + ระบบบริหารจัดการครบวงจร (Public + Admin + Teacher Portal + Parent Portal)
Live: https://kampai-school.vercel.app · Repo: solamon2525/kampai-school · v1.6.0

---

## 🧠 ก่อนเริ่มงาน — อ่าน Second Brain ก่อนเสมอ

**Knowledge base อยู่ที่:** `C:\Users\Admin\Documents\second-brain\`

ก่อนเสนอ design / แก้บั๊ก / เพิ่มฟีเจอร์ อ่านไฟล์ที่เกี่ยวข้องก่อน:

| เรื่องที่จะทำ | อ่านไฟล์นี้ก่อน |
|---|---|
| ตัดสินใจ architecture / เลือก library | `01 - Projects/kampai-school/Decisions.md` |
| แก้บั๊ก / เจอ error / deploy ไม่สำเร็จ | `01 - Projects/kampai-school/Lessons Learned.md` |
| ถามว่ามีฟีเจอร์อะไรแล้ว | `01 - Projects/kampai-school/Features.md` |
| วางแผน sprint / ฟีเจอร์ใหม่ | `01 - Projects/kampai-school/Roadmap.md` |
| RLS policy / auth helper | `03 - Resources/Supabase RLS Patterns.md` |
| Pattern React + Supabase | `03 - Resources/Tech Stack/React + Supabase Pattern.md` |
| Overview ทั้งหมด | `HOME.md` (index ของทุก note) |

**กฎ:**
1. ถ้า user ถามเรื่องการตัดสินใจ ("ทำไมใช้ X") → อ่าน Decisions.md ก่อน อย่าเดา
2. ถ้าเจอบั๊กที่คุ้นๆ → เช็ค Lessons Learned.md ก่อน debug ใหม่
3. เมื่อจบงานที่มี decision/bug สำคัญ → แนะนำ user ให้อัปเดต second-brain

---

## Tech Stack

- **Frontend:** React 18 + TypeScript 5.8 + Vite 5 (SWC)
- **UI:** shadcn/ui + Radix + Tailwind 3.4 + Framer Motion 12
- **Data:** Supabase (PostgreSQL + Auth + Storage + RLS) + TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6 (lazy-loaded)
- **Page Builder:** Puck v0.20
- **Theme:** next-themes (dark mode)
- **Email:** Resend API
- **Deploy:** Vercel

## Commands

```bash
pnpm dev              # Vite dev server
pnpm build            # production build
pnpm lint             # ESLint
pnpm supabase:start   # local Supabase (ก่อน migration)
pnpm supabase:reset   # reset DB + run migrations
```

> ใช้ **pnpm** (ไม่ใช่ npm/yarn) — lockfile เป็น pnpm

## Folder Structure

```
src/
├── pages/                    # Route pages — ทุกตัว lazy-loaded ยกเว้น Index
├── components/
│   ├── admin/                # Admin dashboard (academic, attendance, students, ...)
│   ├── home/                 # Landing sections
│   ├── teacher/ · parent/    # Role-specific portals
│   ├── portal/               # Shared + PortalProtectedRoute
│   ├── puck/                 # Page builder blocks
│   ├── theme/                # ThemeProvider
│   └── ui/                   # shadcn primitives — ห้ามแก้ตรง
├── services/                 # *.service.ts — Supabase query wrappers
├── hooks/                    # useXxx.ts
├── contexts/                 # AuthProvider
├── integrations/supabase/    # Auto-generated client + types
├── lib/                      # utils (cn(), formatters)
└── utils/                    # export/print helpers
supabase/migrations/          # NNN_description.sql
api/                          # Vercel edge functions
```

Alias: `@/*` → `./src/*`

## กฎการเขียนโค้ด (ลำดับสำคัญจากมากไปน้อย)

### 1. Data Access
- Query Supabase ผ่าน `src/services/*.service.ts` **เท่านั้น** — ห้าม `supabase.from()` ใน component
- Server state ต้องผ่าน `useQuery` / `useMutation` — ไม่ใช่ `useState + useEffect`
- หลัง mutation: `queryClient.invalidateQueries({ queryKey: [...] })` เสมอ
- Types ใช้จาก `@/integrations/supabase/types` — ห้ามสร้าง interface ซ้ำ

### 2. Styling & Theme (Dark Mode compatible)
- ใช้ CSS vars เท่านั้น — **ห้าม** `bg-white` / `text-black` hardcode
  ```tsx
  ❌ <div className="bg-white text-black">
  ✅ <div className="bg-background text-foreground">
  ```
- Tokens: `bg-background` `bg-card` `bg-muted` `text-foreground` `text-muted-foreground` `border-border`
- รวม class ด้วย `cn()` จาก `@/lib/utils` เสมอ
- Illustrations เป็น **inline SVG component** ที่ใช้ `currentColor` + Tailwind class (ไม่ download PNG, ไม่ใส่ public/)

### 3. Forms
- React Hook Form + `zodResolver(schema)` เสมอ
- ใช้ `<Form>` primitive จาก `components/ui/form` (shadcn)

### 4. Auth & Protected Routes
- Roles: `admin` · `teacher` · `parent`
- ใช้ `<PortalProtectedRoute requiredRole="admin">` — ห้ามเขียน auth check ใน component เอง
- Client check ป้องกัน UX เท่านั้น — **ความปลอดภัยจริงอยู่ที่ RLS**

### 5. Supabase / RLS
- ทุก table เปิด RLS — ต้องเขียน policy ก่อน query ทำงาน
- ใช้ helper functions: `auth_role()` · `is_admin()` · `is_teacher()` (Migration 022+)
- Migration ใหม่ = ไฟล์ใหม่ (`NNN_description.sql`) — **ห้ามแก้ migration เก่า**
- หลังเพิ่ม table/column: regenerate types
  ```bash
  supabase gen types typescript --local > src/integrations/supabase/types.ts
  ```

### 6. Pages & Lazy Loading
- ทุกไฟล์ใน `src/pages/` lazy-load ยกเว้น `Index.tsx`
- `<PageLoader />` shimmer UI ใส่ใน Suspense fallback

### 7. Naming
- Components: `PascalCase.tsx` · Component folders: `kebab-case/`
- Services: `camelCase.service.ts`
- Hooks: `useCamelCase.ts`
- Migrations: `NNN_description.sql` (3-digit prefix)
- DB columns: `snake_case`
- Thai filename ได้ในกรณีจำเป็น (URL encoded)

### 8. shadcn/ui
- ไฟล์ใน `components/ui/` **ห้ามแก้** — เป็น generated
- ถ้าต้อง custom → wrap component ใหม่ที่อื่น

## Brand & i18n

- UI ภาษาไทยเป็นหลัก (Sarabun font)
- สี brand: **gold** + **navy** (ดู `tailwind.config.ts`)
- Format วันที่ใช้ `date-fns` + locale ไทย

## Known Pitfalls (อย่าเสียเวลาซ้ำ)

1. **Dark Mode:** hardcode สี = contrast แตก → ใช้ CSS vars เท่านั้น
2. **Vercel auto-deploy หลุด:** ถ้า push แล้ว deploy ไม่ขึ้น → เช็ค `gh api repos/solamon2525/kampai-school/hooks` ถ้า `[]` = webhook หาย → `vercel deploy --prod --yes` กู้ชั่วคราว
3. **Windows CRLF:** warning `LF will be replaced by CRLF` — cosmetic ไม่ต้องแก้
4. **Git worktree:** Bash cwd กลับไป worktree เสมอ → ใช้ absolute path + verify ด้วย `git status` ที่ main repo
5. **Edit/Write ต้อง Read ก่อน** — tool validation บังคับ
6. **React Quill + React 18:** มี warning `findDOMNode` — ignore ได้
7. **LINE Notify ปิดแล้ว** (1 เม.ย. 2025) → ใช้ LINE Messaging API

## Deployment

- Host: **Vercel** (`vercel.json`)
- Edge functions: `api/` folder
- ENV จำเป็น: `VITE_SUPABASE_URL` · `VITE_SUPABASE_PUBLISHABLE_KEY` · `RESEND_API_KEY`
- Supabase Project ID: `dpzqnlmgdhwboghfamof`

## Git

- Branch: `main` (production)
- Commit style: `feat(scope): description` · `fix(scope): ...` · `docs(scope): ...`
- ใช้ RTK prefix สำหรับทุก git command (`rtk git ...`) — ประหยัด token
- Commit รวม Claude co-author เมื่อใช้ Claude Code

## เมื่อเสร็จงานใหญ่

แนะนำ user ให้อัปเดต second-brain:
- Decision ใหม่ → `Decisions.md`
- Bug/Solution ใหม่ → `Lessons Learned.md`
- ฟีเจอร์ใหม่ → `Features.md` + bump version
- Sprint complete → `Roadmap.md`
