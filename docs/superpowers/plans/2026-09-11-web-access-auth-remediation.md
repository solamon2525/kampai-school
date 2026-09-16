# Web access and auth readiness — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (if subagents are available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แก้ direct-navigation 404 ของสอง SPA routes และป้องกันการตัดสินสิทธิ์ก่อนโหลดเสร็จหรือ fallback เป็น admin เมื่อผิดพลาด โดยไม่เปลี่ยนข้อมูลจริง

**Architecture:** exact hosting rewrites สำหรับ SPA สองหน้า; AuthProvider ประสาน session และผล role/permissions ที่มีสถานะ pending/ready/error และกัน stale response; privileged routes ใช้ guard เดิมตามบทบาท; queries ตารางย้ายเฉพาะส่วนที่แตะไป service ไม่ขยาย refactor ทั้งระบบ

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, Supabase, Vercel configuration, installed Playwright, pnpm

**Spec:** [รายงาน UX-01/02/03](../../qa/WEB-UX-AUDIT-2026-09-11.md), [route coverage](../../qa/WEB-UX-ROUTES-2026-09-11.md), AGENTS.md, DESIGN.md

**Global Constraints:** แผนนี้ยังไม่ใช่ authorization ให้แก้ระบบในรอบ audit ปัจจุบัน; เริ่มเมื่อผู้ใช้อนุมัติรอบแก้จริง ไม่เขียน production DB/เปลี่ยน roles/สร้าง parent links ไม่ใช้ service-role key ใน browser ไม่แก้ shadcn/ui ไม่เปลี่ยน schema/RPC ไม่เปลี่ยน palette คงหน้าแรกที่ admin จัดได้ และไม่ commit ภาพข้อมูลนักเรียน

## ขอบเขตและไฟล์

| งาน | ไฟล์ |
|---|---|
| ตรวจและรวม exact rewrites | `vercel.json` — มี unrelated/preexisting dirty changes ต้องตรวจและรักษา |
| Auth lifecycle + fail closed | `src/contexts/AuthProvider.tsx` |
| Typed role/menu read | `src/services/auth-permissions.service.ts` ใหม่ เฉพาะเมื่อยังไม่มี service ที่ทำหน้าที่เดียวกัน |
| Readiness/denial UX | `src/components/portal/PortalProtectedRoute.tsx`, `src/pages/AdminDashboard.tsx` เฉพาะ PermissionGuard |
| Page-builder guard | `src/App.tsx` |
| Regression checks | `scripts/test-web-access-auth.mjs` ใหม่ ใช้ Playwright ที่มีอยู่ ไม่เพิ่ม framework โดยไม่จำเป็น |
| Contract/docs | `DESIGN.md`, `DESIGN-COMPONENTS.md` เฉพาะกฎที่เปลี่ยน; `src/components/admin/system/SystemOverview.tsx` versionHistory |

ไม่รวม parent data, attendance upsert, PWA overlay, reward actions และ redesign ซึ่งมี acceptance แยกในรายงาน

### Task 1 — Baseline และ pre-flight (ก่อนเขียน runtime)

- [ ] อ่าน AGENTS.md, DESIGN.md, DESIGN-COMPONENTS.md และสกิล executing-plans/test-driven-development ที่เกี่ยวข้อง
- [ ] ตรวจ `rtk git status -sb`, `rtk git diff -- vercel.json`, branch และ remote; หาก rtk ไม่มี ใช้ git โดยตรงและแจ้ง fallback
- [ ] บันทึก patch เดิมอย่างปลอดภัยโดยไม่ reset/restore งานอื่น; ห้ามถือว่า exact rewrites ที่มีอยู่เป็นงานใหม่ของตน
- [ ] Pre-flight 5 ด้าน: DB ใช้ user_roles/user_menu_permissions/types เดิม; Auth ใช้ guard กลาง; Redundancy ค้น service เดิม; Layout ใช้ PageLoader/error primitive เดิม; Feasibility ยืนยัน browser fixture และ preview URL
- [ ] บันทึก baseline: สอง routes 404 บน production และ admin settings direct-load redirect; ไม่ login ด้วยบัญชีที่ผู้ใช้ไม่ได้ให้
- [ ] หากไม่มี environment สำหรับ negative-role testing ให้หยุดส่วนที่ต้องใช้ fixtureและรายงานข้อจำกัด ห้ามสร้างสิทธิ์บน production เพื่อผ่าน test

### Task 2 — เขียน regression checks ให้จับปัญหาเดิมก่อน

- [ ] สร้าง `scripts/test-web-access-auth.mjs` ผ่าน apply_patch ใช้ `node:assert/strict` และ Playwright; รับ `AUDIT_BASE_URL` ชัดเจนและปฏิเสธ production เมื่อเปิดโหมด mocked auth/response fault
- [ ] วัด document navigation จริงของ `/games/daily-quest` และ `/games/arena`; ใช้ Vercel preview เพื่อทดสอบ rewrites เพราะ Vite dev fallback อาจทำให้ false pass
- [ ] เพิ่ม assertions static resource: `/games/kampai-sdk.js` เป็น JS ไม่ใช่ index.html; missing static path ยัง 404; API route ไม่ถูก rewrite เป็น SPA
- [ ] ใช้ isolated browser context กับ synthetic local auth fixtures เท่านั้น; mock session/role/menu response ที่ขอบ network โดยไม่ดัดแปลงบัญชีจริง ไม่ persist tokens/sessions ลง git
- [ ] เพิ่มกรณี role pending → ready, error, missing row, denied role, response เก่ามาทีหลัง, sign-out ระหว่างโหลด และ permissions update
- [ ] ทดสอบ page-builder anonymous/parent/teacher-without-permission ไม่เห็น editor; admin เห็น editor แต่ห้ามกด save

ตัวอย่าง assertion ที่ต้องมี (ปรับ locator ให้ตรง DOM จริง):

```js
await page.goto(`${base}/admin/dashboard/settings`);
// fixture หน่วง role request: ต้องยังไม่ redirect ออกจาก URL เป้าหมาย
await expectUrlPath(page, '/admin/dashboard/settings');
await releaseRoleFixture({ role: 'admin', menu_ids: [] });
await page.getByRole('heading', { name: 'ตั้งค่า', exact: true }).waitFor();
assert.equal(new URL(page.url()).pathname, '/admin/dashboard/settings');
```

`expectUrlPath` และ `releaseRoleFixture` เป็น helper ที่ต้อง implement ในสคริปต์ ไม่ใช่ API ที่มีอยู่แล้ว ก่อนใช้ heading ให้ตรวจ accessible name จริงและเลือก element เฉพาะหน้าไม่ใช่เมนูซ้ำ

- [ ] รัน `node scripts/test-web-access-auth.mjs` บน baseline ที่กำหนด fixture แล้ว ยืนยัน test ล้มเหลวด้วยอาการที่ตั้งใจ ไม่ใช่ network/config error และบันทึกผล

### Task 3 — รวม rewrite เฉพาะสอง URL

- [ ] ตรวจลำดับ routing ใน vercel.json โดยรักษา headers/redirects/static handling เดิม
- [ ] ใช้ exact entries ต่อไปนี้ก่อน catch-all ที่ตัด `/games/` ออก หากมีอยู่แล้วไม่เพิ่มซ้ำ:

```json
{ "source": "/games/daily-quest", "destination": "/index.html" }
{ "source": "/games/arena", "destination": "/index.html" }
```

- [ ] ทดสอบ preview direct/reload/internal navigation ทั้งสอง route; URL query parameters ไม่หาย; static JS/เกมเดิมไม่รับ HTML ผิดประเภท
- [ ] ไม่เพิ่ม blanket `/games/(.*)` rewrite และไม่แก้ชื่อ URL ภายในเกม

### Task 4 — Auth readiness แบบ fail closed

- [ ] ใช้ generated table types สำหรับ role/menu; หากต้องสร้าง auth-permissions.service ให้เปิดเฉพาะ read function สองตาราง ไม่สร้าง interface ตารางซ้ำ
- [ ] เริ่ม loading ก่อนประมวล session ใหม่ และคงไว้จน role+menu resolve; unknown/error ไม่กลายเป็น admin
- [ ] แยก `error` จาก `unauthenticated/denied`; แสดงข้อความลองใหม่โดยไม่เผย SQL/token ห้าม spinner ไม่จบ
- [ ] กำหนด state transition ให้ชัด:

```text
session absent -> role null, permissions [], ready unauthenticated
session present -> pending (ยังไม่ตัดสินสิทธิ์ route)
role + menu success -> ready ตามสิทธิ์ที่ server ส่ง
role missing/error หรือ menu error -> error, ไม่ให้ privileged access
session change/sign-out -> invalidate request generation + clear prior identity
```

- [ ] ใช้ generation/request ID หรือ query key ที่ผูก user ID กัน response เก่าและ unmount; auth callback ต้องไม่รอ request Supabase ภายใน callback จนเสี่ยง lock ให้ schedule/read ผ่าน lifecycle ภายนอก
- [ ] ใช้ server-state query/service ตามกติกา repo; ตรวจ retry/refetch/realtime ไม่ทำซ้ำโดยไม่จำเป็นและไม่ flash content จาก role ก่อนหน้า
- [ ] PermissionGuard/PortalProtectedRoute รอ readiness เดียวกัน และใช้ error UI กลาง; ไม่เพิ่ม auth check กระจายในแต่ละหน้า
- [ ] หน้า `/admin/page-builder` ครอบ `PortalProtectedRoute requiredRole="admin"` ตาม policy editor admin โดยคง lazy loading/Suspense PageLoader เดิม
- [ ] ทดสอบ role refresh, menu changes และ auth token refresh ไม่ปล่อย role เดิมขณะ identity เปลี่ยน
- [ ] หากพบ RLS อนุญาตเกินสิทธิ์ ให้แยก blocker P0 พร้อมหลักฐาน และขอขอบเขต migration ใหม่ ไม่แก้ policy production เงียบ ๆ

### Task 5 — Verify ด้วย browser และตรวจโค้ด

- [ ] รัน regression script กับ mock/staging แล้วตรวจทุก case ผ่าน ไม่รับรองจาก static regex
- [ ] รัน `pnpm exec eslint` เฉพาะ TSX/service ที่แก้ และ `pnpm build`; ตรวจ `pnpm exec tsc --noEmit` ตาม tsconfig ของ repo หากมี baseline failure ให้แยกหลักฐานและหยุดเผยแพร่ ไม่อ้างว่าผ่าน
- [ ] ทบทวน react-best-practices เฉพาะ async lifecycle/cache/guard ที่เปลี่ยน
- [ ] เปิด HTTP/browser จริง 360×800 และ 1280×720: settings/homepage-layout deep link, dashboard/menu, page-builder authorized/denied, game routes direct/reload
- [ ] ใช้ Tab/Enter/Escape ตรวจ loader/error/retry และเมนู; ไม่ใช้ภาพ login แทนการตรวจหน้าภายใน; ตรวจ clip ด้วย bounding boxes และภาพ ไม่ใช้ body overflow อย่างเดียว
- [ ] รัน RLS negative-role tests เฉพาะฐานทดสอบเพื่อยืนยัน server ไม่พึ่ง client guard หากไม่มีสิทธิ์ให้ระบุยังไม่ตรวจและไม่อ้าง security complete
- [ ] เก็บ screenshot ที่ปกปิดข้อมูลหรือ synthetic fixtures; ไม่ commit auth storage หรือภาพนักเรียนจริง

### Task 6 — เอกสารและส่งมอบเมื่อผ่านจริง

- [ ] อัปเดตกฎ auth readiness/error ใน DESIGN.md และ component contract ใน DESIGN-COMPONENTS.md หากเปลี่ยน contract; เพิ่ม versionHistory entry บนสุดสำหรับ auth refactor ใหญ่ใน SystemOverview.tsx
- [ ] อัปเดตรายงาน UX-01/02/03 ว่าแก้ใน commit/deployment ใด พร้อมผลตรวจและข้อจำกัด RLS
- [ ] ตรวจ `git diff --check`, status, diff ทีละไฟล์, ไม่มี secret/unrelated changes และอยู่ main ไม่มี divergence
- [ ] Stage เฉพาะ patch ของงานที่แยกได้; หาก vercel.json มีงานอื่นที่แยกไม่ได้ให้หยุดขอทิศทาง ห้าม add ทั้ง repository
- [ ] เมื่อผู้ใช้อนุมัติรอบแก้และผ่าน checks แล้วจึง commit ตาม Conventional Commits พร้อม `Co-authored-by: Codex <noreply@openai.com>` และ push origin main ตามกติกา repo
- [ ] หลัง deployment ตรวจ HTTP สอง route อีกครั้งและตรวจ deep link จริง ไม่ถือ push สำเร็จเท่ากับ deploy สำเร็จ

**Done เมื่อ:** regression/หน้าจอสองขนาดผ่าน, direct links ใช้งานได้, unknown role ไม่ให้ admin, guard ไม่ redirect ก่อน role พร้อม, ไม่มีการทำลาย static game routing, เอกสาร sync และระบุชัดว่าทดสอบ role/RLS ใดจริง ห้ามปิดงานหากผลสำคัญล้มเหลว
