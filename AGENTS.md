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
- **ข้อยกเว้นแคบสำหรับ standalone print worksheet:** ไฟล์ `public/games/**/*-worksheet.html` import service ของ Vite ไม่ได้ จึงอ่าน public staff list ได้เฉพาะผ่าน `/games/worksheet-runtime.js` แบบ read-only + publishable key + RLS เท่านั้น; ห้ามมี URL/key/`/rest/v1/` ซ้ำในไฟล์ใบงานและห้าม mutation

**Styling (light mode only):**
- ใช้ CSS vars เท่านั้น — `bg-background` / `bg-card` / `text-foreground` / `text-muted-foreground` / `border-border`
- ห้าม `bg-white` / `text-black` / hex color hardcode
- รวม class ด้วย `cn()` จาก `@/lib/utils` เสมอ
- Illustrations = inline SVG component ที่ใช้ `currentColor` + Tailwind class (ไม่ download PNG, ไม่ใส่ `public/`)
- ห้ามใช้ `dark:` prefix เด็ดขาด (เว็บเป็น Light-only) และระวังการเขียนทับกันของสไตล์/สิทธิ์การทับซ้อน (Rule 14.15 & 14.16)
- **ก่อนสร้างหน้าใหม่ / Component ใหม่:** ตรวจ DB Schema, Auth, Redundancy, Layout, Feasibility ตามส่วนที่กระทบ (Rule 14.17); ส่วนไม่เกี่ยวข้องระบุ N/A สั้น ๆ ไม่ต้องสำรวจ DB สำหรับ component แสดงผลล้วน
- **ข้อยกเว้น standalone print worksheet:** ใช้ CSS ปกติได้ แต่สีใหม่ต้องประกาศเป็น custom property ใน `:root` หรือ shared worksheet stylesheet แล้วใช้ `var(...)`; ห้ามเพิ่ม hex กระจายใน selector

**Person display:** ทุกที่ที่แสดงชื่อ ครู/ผู้บริหาร/นักเรียน → ต้องใช้ `<PersonAvatar name=... photoUrl=... />` คู่ชื่อเสมอ — ห้าม name-only (DESIGN.md Rule 14.13) + service ที่ดึงชื่อมา **ต้อง SELECT `photo_url` ด้วย**; ยกเว้น print-only worksheet native selector/footer/ช่องลงชื่อ ซึ่งแสดงชื่อเต็ม+ตำแหน่งได้โดยไม่ใช้ avatar

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

- **Think first** — ตรวจข้อเท็จจริงก่อน ถามเฉพาะความกำกวมที่เปลี่ยนผลลัพธ์หรือขอบเขต; งานชัดเจนที่ได้รับอนุญาตแล้วให้ดำเนินการจนตรวจผ่าน
- **Simplicity first** — เขียน code น้อยที่สุดที่แก้ปัญหา; ไม่เพิ่ม abstraction / config / "flexibility" ที่ไม่ได้ขอ; ไม่ handle scenario ที่เป็นไปไม่ได้
- **Surgical changes** — แตะเฉพาะที่จำเป็น; ไม่ refactor adjacent code; match style เดิมแม้จะไม่ใช่ที่ตัวเองชอบ; ลบเฉพาะ orphan ที่ตัวเองทำให้เกิด
- **Goal-driven** — แปลงงานเป็น verifiable success criteria + loop จนผ่าน (เช่น "add validation" → "write tests for invalid inputs, then make them pass")


## Classroom-first Product Rules

ใช้กับ UI สำหรับครูและเด็กทั้ง repo โดยเฉพาะเกม สื่อการสอน และใบงาน:

- **Real-screen truth (mandatory)** — ตรวจ UI ผ่าน HTTP/browser จริง ห้ามรับรองจาก static check หรือ verifier อย่างเดียว; อย่างน้อยตรวจ 360×800 และ 1280×720 รวมถึงจอใหญ่เมื่อสื่อรองรับ และต้องไม่มี overflow/ข้อความล้น
- **One dominant task (default)** — แต่ละโหมดควรมีงานเรียนรู้หลักเพียงอย่างเดียว; ห้ามเพิ่มหลายรูปแบบเพียงเพราะทำได้ ถ้าผู้ใช้ยังไม่ได้ขอชัดเจน
- **Readability over density (default)** — ยอมลดจำนวนข้อ การ์ด หรือ controls ต่อหน้า เพื่อให้ภาพ ตัวอักษร และพื้นที่ตอบใหญ่พอสำหรับห้องเรียน
- **No contradictory state (mandatory)** — toggle หรือสถานะหนึ่งตัวต้องมีผลกับข้อความและพฤติกรรมเดียวกันทุกตำแหน่งทันที; label, state และสิ่งที่แสดงต้องตรงกัน
- **Use available space (default)** — ถ้าพื้นที่หลักว่างมาก ให้ขยายเนื้อหาหลักแทนการยึด `max-width` หรือขนาดฟอนต์เดิม; สื่อจอใหญ่อาจขยายเนื้อหาหลักประมาณ 5–10 เท่าตามพื้นที่ แต่ต้อง auto-fit ข้อความยาวและไม่ล้นบนจอเล็ก; ห้ามนำอัตรานี้ไปบังคับกับหน้าระบบทั่วไป
- **User-triggered defaults (mandatory)** — autoplay, TTS, กล้อง และ fullscreen ต้องไม่เริ่มเอง; เริ่มเฉพาะจาก user gesture ที่ชัดเจน
- **Remove, do not hide (default)** — เมื่อยืนยันว่าไม่ต้องการรูปแบบหรือฟีเจอร์แล้ว ให้ลบ logic, state, UI และ test ที่หมดหน้าที่ ไม่ใช่เพียงซ่อน UI

## Gotchas

- **รูปคนบีบ/ไม่สมส่วน:** แสดงรูป ครู/นักเรียน/ผู้บริหาร ต้องใช้ `<PersonAvatar>` เท่านั้น — base `AvatarImage` (`components/ui/avatar.tsx`) มี `object-cover` แล้ว + ESLint `no-restricted-imports` ห้าม import `@/components/ui/avatar` ตรง (ยกเว้น `PersonAvatar.tsx`). ถ้าจำเป็นต้องใช้ `<img>` raw กับรูปคน → **ใส่ `object-cover` เสมอ** (DESIGN.md Rule 14.13)
- **Vercel webhook หลุดเงียบ:** push แล้วไม่ deploy → กู้ด้วย `vercel deploy --prod --yes`
- **Git worktree:** cwd อาจกลับไป worktree → ใช้ absolute path
- **LINE Notify ปิด** (1 เม.ย. 2025) → ใช้ LINE Messaging API แทน
- Windows CRLF warning + React Quill `findDOMNode` warning → ignore ได้
- **registry.ts blank-screen trap:** เพิ่ม entry ใน `src/lib/commands/registry.ts` ต้องเช็คว่า icon ใน `icon: X` มีใน top `import { ... } from 'lucide-react'` — TS ปล่อยผ่าน, runtime ถึงพัง, ทำให้เว็บขาวทั้งระบบ (incident `2ba6903` — ดู DESIGN.md Rule 14.38, รัน `grep -oE "icon: [A-Z][a-zA-Z]+" src/lib/commands/registry.ts | sort -u` ก่อน commit)
- **PWA cache recovery:** user รายงานเว็บขาว → แนะนำเปิด `https://kampai-school.vercel.app/?reset_sw=1` เป็นด่านแรกก่อน escalate (kill-switch อยู่ใน `src/main.tsx` — DESIGN.md Rule 14.39)

## อ่านตามประเภทงาน

อ่านเฉพาะหัวข้อที่เกี่ยวข้อง ไม่ต้องอ่านคู่มือทั้งหมดก่อนทุก edit

| งาน | แหล่งหลัก |
|---|---|
| เกม / SDK / คะแนน / multiplayer / game_docs | [GAME.md](GAME.md) และ [game skill](.agents/skills/kampai-game-dev/SKILL.md); คงมาตรฐาน 3 โหมดตาม GAME.md |
| กล้อง / มือ / ท่าทาง | [AR-GAME.md](AR-GAME.md) เฉพาะ engine และ lifecycle ที่แก้ |
| แนวตั้ง / แนวนอน | [ORIENT-GAME.md](ORIENT-GAME.md) |
| ใบงาน / A4 / scaffold | [WORKSHEET.md](WORKSHEET.md) และ [worksheet skill](.agents/skills/kampai-worksheet-builder/SKILL.md) |
| สื่อการสอน | [MEDIA.md](MEDIA.md) และ worksheet skill ส่วน media |
| Design / component | [DESIGN.md](DESIGN.md) / [DESIGN-COMPONENTS.md](DESIGN-COMPONENTS.md) เฉพาะสัญญาที่เปลี่ยน |
| นำเข้าเกียรติบัตรครู | [คู่มือนำเข้า](docs/operations/import-training-certificates.md) |

## ตรวจตามผลกระทบ

- ระหว่างแก้รัน checks เฉพาะจุด; เกมที่เปลี่ยนต้องผ่าน `pnpm verify:game:all -- <path>` ก่อนส่งหนึ่งครั้ง ไม่ต้องรัน static/browser ซ้ำถ้าชุดรวมตรวจแล้ว
- ใบงานรายชิ้น: verifier เป้าหมาย + HTTP/browser และ A4; shared runtime/style: ตรวจทั้งคลังที่ได้รับผล ตาม WORKSHEET.md §7
- Build เมื่อกระทบ React/app/wrapper หรือ build integration; เอกสารล้วนตรวจเนื้อหา ลิงก์ และ skill metadata โดยไม่ต้อง build/browser ทั้งเว็บ
- รักษา browser จริงและ viewport ตาม Classroom-first เมื่อเปลี่ยน UI; ไม่ใช้ static แทนการตรวจจอจริง
- ผ่านทุก check ที่เกี่ยวข้องและแก้ failure จากงานนี้แล้วจึงส่ง; รายงาน required check ที่ทำไม่ได้ ห้ามอ้างว่าผ่าน
- คำสั่งอ่าน/ทดสอบใน local ที่อยู่ในขอบเขตงานทำต่อได้โดยไม่ถามซ้ำ; seed/import/migration ที่เขียนข้อมูลจริงต้องอยู่ในขอบเขตที่ได้รับอนุญาต ตรวจเป้าหมายก่อนรัน

## Git

- Branch: `main` (production)
- Commit: `feat(scope): ...` · `fix(scope): ...` · `docs(scope): ...`
- รวม Codex co-author เมื่อใช้ Codex
- ใช้ `rtk` prefix เมื่อมีใน environment; chained commands ใส่ prefix ให้แต่ละคำสั่ง หากไม่พบหรือไม่รองรับคำสั่ง ให้แจ้งครั้งเดียวแล้วใช้คำสั่งตรง ไม่ต้องติดตั้งเพื่อทำงานต่อ
- PowerShell ใช้คำสั่ง native และ absolute path; ตัวอย่าง bash ในคู่มือให้แปลงตาม shell ที่ใช้งาน

### Automatic Commit & Push

เมื่อผู้ใช้สั่งสร้างหรือแก้ไขงาน และงานที่อยู่ในขอบเขตนั้นเสร็จพร้อมผ่านการตรวจที่เกี่ยวข้องแล้ว ให้ Codex commit และ push ไปยัง `origin/main` อัตโนมัติโดยไม่ต้องรอคำสั่ง `commit` หรือ `push` ซ้ำ เว้นแต่ผู้ใช้สั่งชัดเจนว่าไม่ให้ commit/push หรือให้เก็บเป็น draft

ก่อนเผยแพร่ทุกครั้ง:

1. ตรวจ `git status -sb` และ diff ของไฟล์ที่จะเผยแพร่
2. stage เฉพาะไฟล์ของงานปัจจุบัน ห้ามใช้ `git add -A`/`git add .` ใน worktree ที่มีไฟล์อื่นค้าง
3. รัน verification/test ที่ตรงกับชนิดงาน และหยุดทันทีถ้าไม่ผ่าน
4. ตรวจว่าอยู่ branch `main` และไม่มี conflict/divergence ที่เสี่ยงเขียนทับงานบน remote
5. commit ตาม Conventional Commits พร้อม Codex co-author แล้ว push `origin main`
6. รายงาน commit hash, branch, ผลตรวจ และเอกสาร design/spec/version history ที่ sync ใน commit นั้น

ห้าม auto commit/push เมื่อเป็นงานตรวจสอบ/วิเคราะห์ที่ไม่ได้อนุญาตให้แก้, มี test ล้มเหลว, มี conflict หรือ push ถูกปฏิเสธ, แยกไฟล์งานออกจาก unrelated changes ไม่ได้, หรือพบ secret/credential/ไฟล์ชั่วคราวอยู่ในชุดที่จะ stage
