# kampai-school

Live: https://kampai-school.vercel.app · Repo: solamon2525/kampai-school
Supabase Project ID: `lkpqssbqxxpasidfqhpb`
ENV จำเป็น: `VITE_SUPABASE_URL` · `VITE_SUPABASE_PUBLISHABLE_KEY` · `RESEND_API_KEY`

## Documentation Discipline (DESIGN.md Rule 14.9)

ทุก commit ที่เปลี่ยน design/feature ต้อง sync atomic ใน commit เดียวกัน:

| ที่ไหน | เมื่อไหร่ |
|---|---|
| `DESIGN.md` | เปลี่ยน palette / contrast / typography / UX rule 14.x |
| `DESIGN-COMPONENTS.md` | เปลี่ยน component spec / replacement mapping / AI hard rules |
| `src/components/admin/system/SystemOverview.tsx` (`versionHistory`) | feature ใหม่ / refactor ใหญ่ → เพิ่ม entry บนสุด |

หลัง push → รายงานว่าบันทึกที่ไหนบ้าง

## Hard Rules

**Package manager:** pnpm only (lockfile = pnpm-lock.yaml — ห้ามใช้ npm/yarn ใน install)

**Data access:**
- Query Supabase ผ่าน `src/services/*.service.ts` เท่านั้น — ห้าม `supabase.from()` ตรง ๆ ใน component
- Server state ใช้ `useQuery` / `useMutation` (ไม่ใช่ `useState + useEffect`)
- หลัง mutation → `queryClient.invalidateQueries({ queryKey: [...] })` เสมอ
- Types ใช้จาก `@/integrations/supabase/types` — ห้ามสร้าง interface ซ้ำ

**Styling (light mode only):**
- ใช้ CSS vars เท่านั้น — `bg-background` / `bg-card` / `text-foreground` / `text-muted-foreground` / `border-border`
- ห้าม `bg-white` / `text-black` / hex color hardcode
- รวม class ด้วย `cn()` จาก `@/lib/utils` เสมอ
- Illustrations = inline SVG component ที่ใช้ `currentColor` + Tailwind class (ไม่ download PNG, ไม่ใส่ `public/`)

**Forms:** React Hook Form + `zodResolver(schema)` + `<Form>` primitive จาก `components/ui/form` เสมอ

**Auth:** ใช้ `<PortalProtectedRoute requiredRole="admin|teacher|parent">` — ห้ามเขียน auth check ใน component  
Client check = UX เท่านั้น **ความปลอดภัยจริงอยู่ที่ RLS**

**Supabase / RLS:**
- ทุก table เปิด RLS — เขียน policy ก่อน query ทำงาน
- Helper functions: `auth_role()` · `is_admin()` · `is_teacher()` (Migration 022+)
- Migration ใหม่ = ไฟล์ใหม่ `NNN_description.sql` — **ห้ามแก้ migration เก่า**
- หลังเปลี่ยน schema → regenerate: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

**Routing:** ทุกไฟล์ใน `src/pages/` lazy-load ยกเว้น `Index.tsx` — ใช้ `<PageLoader />` ใน Suspense fallback

**shadcn/ui:** ไฟล์ใน `components/ui/` ห้ามแก้ตรง — wrap component ใหม่ที่อื่นแทน

## Conventions (ไม่ obvious)

- UI ภาษาไทยเป็นหลัก, font = Sarabun, brand = gold + navy
- Format วันที่ใช้ `date-fns` + locale ไทย
- Component folders = `kebab-case/` แต่ไฟล์ component = `PascalCase.tsx`
- Migrations 3-digit prefix: `NNN_description.sql`

## Gotchas

- **Vercel webhook หลุดเงียบ:** push แล้วไม่ deploy → กู้ด้วย `vercel deploy --prod --yes`
- **Git worktree:** cwd อาจกลับไป worktree → ใช้ absolute path
- **LINE Notify ปิด** (1 เม.ย. 2025) → ใช้ LINE Messaging API แทน
- Windows CRLF warning + React Quill `findDOMNode` warning → ignore ได้

## Git

- Branch: `main` (production)
- Commit: `feat(scope): ...` · `fix(scope): ...` · `docs(scope): ...`
- รวม Claude co-author เมื่อใช้ Claude Code
- **ใช้ `rtk` prefix ทุก shell command** — chained ต้อง prefix ทุกตัว:
  ```
  ✅ rtk git add X && rtk git commit -m "..." && rtk git push
  ❌ rtk git add X && git commit -m "..." && git push
  ```
  Reference เต็ม + Windows note: `~/.claude/CLAUDE.md`
