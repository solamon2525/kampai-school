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
- ห้ามใช้ `dark:` prefix เด็ดขาด (เว็บเป็น Light-only) และระวังการเขียนทับกันของสไตล์/สิทธิ์การทับซ้อน (Rule 14.15 & 14.16)
- **ก่อนสร้างหน้าใหม่ / Component ใหม่:** ต้องรัน Pre-flight Check 5 ด้าน (DB Schema, Auth, Redundancy, Layout, Feasibility) และเช็กความพร้อมก่อนเสมอ (Rule 14.17)

**Person display:** ทุกที่ที่แสดงชื่อ ครู/ผู้บริหาร/นักเรียน → ต้องใช้ `<PersonAvatar name=... photoUrl=... />` คู่ชื่อเสมอ — ห้าม name-only (DESIGN.md Rule 14.13) + service ที่ดึงชื่อมา **ต้อง SELECT `photo_url` ด้วย**

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

## Behavioral guidelines (Karpathy)

- **Think first** — surface assumptions ก่อน code, ถามถ้าไม่ชัด, ไม่เลือกแนวทางเงียบ ๆ
- **Simplicity first** — เขียน code น้อยที่สุดที่แก้ปัญหา; ไม่เพิ่ม abstraction / config / "flexibility" ที่ไม่ได้ขอ; ไม่ handle scenario ที่เป็นไปไม่ได้
- **Surgical changes** — แตะเฉพาะที่จำเป็น; ไม่ refactor adjacent code; match style เดิมแม้จะไม่ใช่ที่ตัวเองชอบ; ลบเฉพาะ orphan ที่ตัวเองทำให้เกิด
- **Goal-driven** — แปลงงานเป็น verifiable success criteria + loop จนผ่าน (เช่น "add validation" → "write tests for invalid inputs, then make them pass")

รายละเอียดเต็มเรียกได้ที่ `/andrej-karpathy-skills:karpathy-guidelines`

## Gotchas

- **รูปคนบีบ/ไม่สมส่วน:** แสดงรูป ครู/นักเรียน/ผู้บริหาร ต้องใช้ `<PersonAvatar>` เท่านั้น — base `AvatarImage` (`components/ui/avatar.tsx`) มี `object-cover` แล้ว + ESLint `no-restricted-imports` ห้าม import `@/components/ui/avatar` ตรง (ยกเว้น `PersonAvatar.tsx`). ถ้าจำเป็นต้องใช้ `<img>` raw กับรูปคน → **ใส่ `object-cover` เสมอ** (DESIGN.md Rule 14.13)
- **Vercel webhook หลุดเงียบ:** push แล้วไม่ deploy → กู้ด้วย `vercel deploy --prod --yes`
- **Git worktree:** cwd อาจกลับไป worktree → ใช้ absolute path
- **LINE Notify ปิด** (1 เม.ย. 2025) → ใช้ LINE Messaging API แทน
- Windows CRLF warning + React Quill `findDOMNode` warning → ignore ได้
- **registry.ts blank-screen trap:** เพิ่ม entry ใน `src/lib/commands/registry.ts` ต้องเช็คว่า icon ใน `icon: X` มีใน top `import { ... } from 'lucide-react'` — TS ปล่อยผ่าน, runtime ถึงพัง, ทำให้เว็บขาวทั้งระบบ (incident `2ba6903` — ดู DESIGN.md Rule 14.38, รัน `grep -oE "icon: [A-Z][a-zA-Z]+" src/lib/commands/registry.ts | sort -u` ก่อน commit)
- **PWA cache recovery:** user รายงานเว็บขาว → แนะนำเปิด `https://kampai-school.vercel.app/?reset_sw=1` เป็นด่านแรกก่อน escalate (kill-switch อยู่ใน `src/main.tsx` — DESIGN.md Rule 14.39)
- **เกม HTML (port/integrate):** อ่าน `GAME.md` + รัน `pnpm verify:game <path>` ต้องผ่าน **7/7** (มี Check 7 render smoke-test — static อย่างเดียวเคยปล่อยเกมจอดำผ่าน เคส wizard-thai) + เปิด browser จริง. เกม React component → `cp public/games/_template-react.html`; lucide IconNode = `["svg", attrs, children]` → drawing อยู่ `node[2]` (อย่าเขียน shim เอง map ผิด level)
- **ลงเกียรติบัตรครูจาก CLI:** drop รูปเกียรติบัตรใน Claude Code → Claude อ่านด้วย vision (แม่นกว่า Tesseract เดิม) → เขียน data JSON (recipient_name/course_name/training_type/start_date ISO ค.ศ./hours/...) → `node scripts/import-cert.mjs --image=<path> --data=<json> [--staff-id=<uuid>] [--dry-run]` (match staff→staff_id, อัปรูปเข้า `school-images/training-certificates/`, insert `training_records` status='ผ่านการอบรม'). **ต้องมี `SUPABASE_SERVICE_ROLE_KEY` ใน .env.local** (storage policy ให้แค่ authenticated อัป — anon ไม่ผ่าน). ชื่อ match หลายคน → script print candidate ให้ส่ง `--staff-id`. รับ `.pdf` ด้วย (render หน้าแรก→PNG @2x ผ่าน `mupdf` devDep). ภาพตะแคง/มีแถบ → หมุน/ครอปด้วย `sharp` ก่อน (เปิดดูยืนยันก่อนอัปเสมอ). เช็ค duplicate ใน `training_records` ก่อนลงทุกครั้ง
- **เกมใหม่ใช้ KAMPAI SDK:** `/games/kampai-sdk.js` (single source) = `window.KAMPAI` — `setSlug/onReady/student/stats/leaderboard/submitScore/goHome/controls.mount(D-pad)` + `sound.*` (ระบบเสียงรวม: `mountToggles()` ปุ่ม 🔊/🗣️/🎵 + `correct/wrong/timeUp/gameOver/speak(text,lang)/fxFlash/bgmStart/bgmStop/defaultBgm(preset)` — แก้เสียงที่ SDK ที่เดียวมีผลทุกเกม; เพลงรายเกมตั้งจากหลังบ้าน: `educational_hub_items.bgm_preset` (เพลงสังเคราะห์) หรือ `bgm_url` (mp3 อัปโหลดจาก "คลังเพลง" ใน GamesTab → ตาราง `game_bgm_tracks`, bucket `educational-hub/bgm/`) → wrapper ส่ง `init.audio.{bgm,bgmUrl}` — `setBgmUrl()` เล่น mp3 (HTMLAudio loop) มาก่อน synth). wrapper (`PlayGame.tsx`) ส่ง student+stats+leaderboard ผ่าน init ให้เกมโชว์ในจอ. สั่ง AI เจ้าอื่นสร้างเกม → ใช้ `public/GAME-PROMPT.md` (ปุ่มดาวน์โหลด+คัดลอกใน GamesTab). เทมเพลต `_template-full.html`/`_template-react.html` ใช้ SDK แล้ว
- **รายละเอียดเกม (game_docs) — บังคับทุกครั้งที่สร้าง/แก้เกม:** ตาราง `game_docs` (1:1 กับ `educational_hub_items`, migration 168) เก็บ **รูปแบบเกม / ฟีเจอร์ / เวอร์ชันบิลด์ / notes** แบบสเปกเดียวต่อเกม (แก้ทับ). RLS เห็นเฉพาะ **เจ้าของเกม (owner_staff_id) + admin** — ไม่ล็อกอิน = 0 แถว. ดู/แก้ในหลังบ้านที่ปุ่ม **"รายละเอียด"** ในการ์ดเกม GamesTab. **กฎ:** ทุกครั้งที่ seed เกมใหม่หรือแก้เกม ต้อง `INSERT ... ON CONFLICT (item_id) DO UPDATE` ลง `game_docs` **ใน migration เดียวกัน** + เด้งเวอร์ชัน (ดูเทมเพลตใน `GAME.md`). service = `gameDocsService` (`src/services/educational-hub.service.ts`)

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
