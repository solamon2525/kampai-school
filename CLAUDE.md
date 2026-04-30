# kampai-school

เว็บโรงเรียนบ้านคำไผ่ + ระบบบริหารจัดการครบวงจร (Public + Admin + Teacher Portal + Parent Portal)
Live: https://kampai-school.vercel.app · Repo: solamon2525/kampai-school · v1.6.0

---

## 📋 Documentation Discipline (DESIGN.md Rule 14.9)

ทุก commit ที่เปลี่ยน design/feature ต้อง sync atomic ใน commit เดียว:

| update ที่ไหน | เมื่อไหร่ |
|---|---|
| `DESIGN.md` | เปลี่ยน palette / contrast / typography / UX rules 14.x |
| `DESIGN-COMPONENTS.md` | เปลี่ยน component spec / replacement mapping / AI hard rules |
| `src/components/admin/system/SystemOverview.tsx` (`versionHistory`) | feature ใหม่ / refactor ใหญ่ → เพิ่ม entry หัวบนสุด |

หลัง push → รายงาน user ว่าบันทึกที่ไหนบ้าง

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

## Known Pitfalls

- Dark mode: ใช้ CSS vars เท่านั้น (ห้าม hardcode สี)
- Vercel webhook หลุดเงียบ: ถ้า push แล้วไม่ deploy → `vercel deploy --prod --yes` กู้
- Git worktree: cwd กลับไป worktree → ใช้ absolute path
- LINE Notify ปิด (1 เม.ย. 2025) → ใช้ LINE Messaging API
- Windows CRLF warning + React Quill `findDOMNode` warning → ignore ได้

## Deployment

- Host: **Vercel** (`vercel.json`)
- Edge functions: `api/` folder
- ENV จำเป็น: `VITE_SUPABASE_URL` · `VITE_SUPABASE_PUBLISHABLE_KEY` · `RESEND_API_KEY`
- Supabase Project ID: `dpzqnlmgdhwboghfamof`

## Git

- Branch: `main` (production)
- Commit style: `feat(scope): description` · `fix(scope): ...` · `docs(scope): ...`
- Commit รวม Claude co-author เมื่อใช้ Claude Code
- **ใช้ `rtk` prefix ทุก shell command** — ดูหมวด RTK ด้านล่าง

## 🦀 RTK (Token-Saving CLI Wrapper)

**ใช้ `rtk` prefix ทุก shell command** (git, gh, pnpm, npm, tsc, lint, ls, grep, find, curl, wget, docker, kubectl) — ประหยัด 60-90% ต่อ call ถ้า RTK ไม่ filter ก็ passthrough — ปลอดภัย

- Reference เต็ม (ตารางทุกหมวด + Windows note + chained command rule + `gh` examples): `~/.claude/CLAUDE.md` (global)
- Custom hook ที่ `~/.claude/hooks/rtk-rewrite.py` auto-prefix อัตโนมัติ — ยกเว้น **chained** `&&`/`||`/`;`/`|` ต้อง prefix ทุกตัวเอง:
  ```bash
  ✅ rtk git add X && rtk git commit -m "..." && rtk git push
  ❌ rtk git add X && git commit -m "..." && git push
  ```
- Verify: `rtk gain` ดูสถิติ token saved · `rtk proxy <cmd>` = passthrough (debug)
- ข้อยกเว้น: tool ของ Claude Code เอง (Read/Grep/Glob/Edit/Write) ใช้ตรง ไม่ผ่าน rtk
