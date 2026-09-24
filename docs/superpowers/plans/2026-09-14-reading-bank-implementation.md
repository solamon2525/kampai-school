# Reading Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างธนาคารการอ่านครบวงจรให้ครูมอบหมายบทความ เด็กอัดเสียงผ่านมือถือ ครูรับรองคะแนน เด็กแลกรางวัล และโรงเรียนแสดงนักอ่านดีเด่นได้อย่างปลอดภัย

**Architecture:** แบ่งส่งมอบเป็นสี่ระยะที่ตรวจรับได้อิสระ โดยใช้ตารางและบริการเฉพาะธนาคารการอ่าน เชื่อมข้อมูลนักเรียน ผู้ปกครอง คลังรางวัล และระบบจัดหน้าแรกเดิม เด็กใช้รหัสนักเรียนกับรหัสลับผ่าน Edge Function และรหัสผ่านชั่วคราวเฉพาะระบบนี้ ไม่เปิด Supabase Anonymous Auth ซึ่งอาจชนกับนโยบาย `authenticated` เดิม

**Tech Stack:** React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Supabase Postgres/RLS/Storage/Edge Functions, MediaRecorder, IndexedDB (`idb`), Playwright

**Spec:** `docs/superpowers/specs/2026-09-14-reading-bank-design.md`

## Global Constraints

- รุ่นแรกใช้กับนักเรียน active ระดับ อ.3–ป.6 และหน้าจอภาษาไทย
- อ.3–ป.3 ใช้เสียงอ่าน 30–90 วินาที คะแนนพื้นฐาน 10 เหรียญ
- ป.4–ป.6 ใช้เสียงอ่านไม่เกิน 2 นาทีและเสียงเล่า 30–60 วินาที คะแนนพื้นฐาน 15 เหรียญ
- โบนัสครูมีเฉพาะ 0, 2 หรือ 5 เหรียญ และฝากคะแนนหลังรับรองครั้งแรกเท่านั้น
- นักเรียนเข้าใช้ด้วย `student_code + PIN 4 หลัก`; PIN และ session token เก็บเฉพาะค่าแฮช
- ห้ามเปิด Supabase Anonymous Auth; นักเรียนใช้ `reading-student-api` และ `reading-audio-api` เท่านั้น
- เสียงอยู่ใน private bucket; ไม่มี public URL และไม่เผยแพร่บนหน้าแรก
- ทุกตารางใหม่เปิด RLS; คำสั่งที่เปลี่ยนคะแนนหรือสต็อกต้องเป็นธุรกรรมเดียวและรองรับการเรียกซ้ำ
- Components query ผ่าน `src/services/*.service.ts`; ใช้ React Query และ invalidate query หลัง mutation
- Forms ใช้ React Hook Form, Zod และ `<Form>`; ชื่อบุคคลต้องคู่กับ `<PersonAvatar>`
- ใช้ CSS variables/classes ตาม `DESIGN.md`, light mode เท่านั้น และรวม class ด้วย `cn()`
- หน้าใน `src/pages/` ต้อง lazy-load และใช้ `<PageLoader />` ใน Suspense
- ตรวจ HTTP จริงที่ 360×800 และ 1280×720 รวม Android Chrome และ iOS Safari สำหรับการอัดเสียง
- การเปลี่ยน feature ต้อง sync `DESIGN.md`, `DESIGN-COMPONENTS.md` และ `SystemOverview.tsx` ใน commit เดียวกัน
- Stage เฉพาะไฟล์ของระยะปัจจุบัน ห้ามรวมงานอื่นใน worktree

---

## แผนย่อยและลำดับบังคับ

- [ ] **ระยะที่ 1 — รากฐาน บทความ งานอ่าน และรหัสนักเรียน**

  ใช้ `docs/superpowers/plans/2026-09-14-reading-bank-phase-1-foundation.md`

  ผลส่งมอบ: ครูตั้ง PIN ตามห้อง สร้าง/เผยแพร่/คัดลอกบทความ มอบหมายงาน และเด็กเข้าสู่หน้าธนาคารการอ่านพร้อมเห็นงานของตนได้ แต่ยังไม่อัดเสียง

- [ ] **ระยะที่ 2 — การอ่านและอัดเสียงบนมือถือ**

  ใช้ `docs/superpowers/plans/2026-09-14-reading-bank-phase-2-student-audio.md`

  เงื่อนไขเริ่ม: ระยะที่ 1 ผ่าน RLS, session, route และ browser smoke test

  ผลส่งมอบ: เด็กอ่าน อัด ฟัง อัดใหม่ เก็บเสียงระหว่างเน็ตหลุด และส่งหนึ่งหรือสองเสียงตามช่วงชั้นได้

- [ ] **ระยะที่ 3 — ตรวจงาน คะแนน และรางวัล**

  ใช้ `docs/superpowers/plans/2026-09-14-reading-bank-phase-3-review-rewards.md`

  เงื่อนไขเริ่ม: ระยะที่ 2 ส่งงานซ้ำได้โดยไม่สร้าง attempt ซ้ำและไฟล์ไม่มี public URL

  ผลส่งมอบ: ครูรับรอง/ส่งกลับ คะแนนเข้าครั้งเดียว นักเรียนเห็นยอดสะสมกับยอดใช้ได้ และแลกรางวัลที่มีต้นทุนเหรียญการอ่านได้

- [ ] **ระยะที่ 4 — นักอ่านดีเด่น รายงาน และการดูแลไฟล์**

  ใช้ `docs/superpowers/plans/2026-09-14-reading-bank-phase-4-showcase-reporting.md`

  เงื่อนไขเริ่ม: บัญชีคะแนนและการแลกรางวัลในระยะที่ 3 ผ่านการทดสอบพร้อมกันและการย้อนรายการ

  ผลส่งมอบ: ผู้ดูแลอนุมัตินักอ่านดีเด่น ส่วนหน้าแรกจัดตำแหน่งได้ รายงานครบ และล้างเสียงตามอายุได้

## จุดตรวจร่วมหลังแต่ละระยะ

- [ ] อ่าน diff เฉพาะไฟล์ในระยะและรัน `git diff --check`
- [ ] รัน verifier ที่ระบุในแผนย่อยและ `pnpm build`
- [ ] รัน ESLint เฉพาะไฟล์ TypeScript/TSX ที่แก้
- [ ] เปิดหน้าเกี่ยวข้องผ่าน HTTP ที่ 360×800 และ 1280×720
- [ ] ทดสอบด้วยบทบาทจริงที่เกี่ยวข้อง ห้ามใช้ admin แทนครูหรือเด็ก
- [ ] ตรวจว่าไฟล์เสียง รหัสลับ token และ service-role key ไม่อยู่ใน log, URL หรือ bundle
- [ ] เพิ่ม version history และเอกสารออกแบบเฉพาะเมื่อ feature ในระยะนั้นพร้อมเผยแพร่
- [ ] Commit แบบ Conventional Commit และ push `origin/main` เฉพาะเมื่อทุกข้อของระยะผ่าน

## การตรวจรับระบบรวม

- [ ] สร้างบทความตัวอย่างครบสามต้นแบบและมอบหมายให้นักเรียนทดสอบสองช่วงชั้น
- [ ] เด็กเล็กส่งเสียงอ่านหนึ่งรายการ เด็กโตส่งเสียงอ่านและเสียงเล่าอย่างละหนึ่งรายการ
- [ ] ครูส่งกลับหนึ่งงาน แล้วเด็กส่งใหม่โดย attempt เดิมไม่ถูกนับคะแนน
- [ ] ครูรับรองพร้อมโบนัส 5 และตรวจว่าได้ 15 เหรียญสำหรับเด็กเล็กหรือ 20 เหรียญสำหรับเด็กโต
- [ ] เรียกคำสั่งรับรองซ้ำและยืนยันว่า ledger ไม่มีรายการเพิ่มซ้ำ
- [ ] แลกรางวัล ทดสอบคะแนนไม่พอ สต็อกหมด ปฏิเสธคำขอ และคืนคะแนน
- [ ] อนุมัตินักอ่านดีเด่นที่มี `photo_public` consent และยืนยันว่าผู้ไม่มี consent ไม่ปรากฏ
- [ ] ยืนยันว่าบุคคลทั่วไปเปิดไฟล์เสียงหรือข้อมูลส่วนตัวไม่ได้
- [ ] ตรวจ production deployment และบันทึก URL/เวลา/บัญชีทดสอบในรายงาน QA โดยไม่บันทึกรหัสลับ
