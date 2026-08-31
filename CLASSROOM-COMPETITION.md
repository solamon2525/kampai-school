# ระบบแข่งขันใบงานสดในห้องเรียน

โมดูลนำร่องสำหรับนักเรียน ป.4 วิชาคณิตศาสตร์ ใช้คอมพิวเตอร์ 3 เครื่อง: Host ของครู 1 เครื่อง และเครื่องทีม 2 เครื่อง

## เส้นทางใช้งาน

- ครูสร้างห้อง ดูประวัติ และสถิติ: `/teacher/classroom-competitions`
- จอควบคุม Host: `/teacher/classroom-competitions/:id/host`
- เครื่องทีมขอเข้าห้อง: `/classroom-competition/join`

## กติกา MVP

- แข่ง 2 ทีม แต่ละทีมใช้ 1 เครื่องและทำโจทย์ตามความเร็วของทีม
- เลือกชุดเดียวกันหรือต่างชุดที่ provider และ difficulty เดียวกัน
- ตอบได้ไม่เกิน 2 ครั้งต่อข้อ ถูกได้ 1 คะแนน ผิดไม่หักคะแนน
- ผิดครั้งที่สองล็อกข้อและเลื่อนไปข้อถัดไป
- ผู้ชนะได้ 3 แต้มลีก ผู้แพ้ได้ 1 แต้มลีก สมาชิกทุกคนรับผลตามทีม
- ตัดสินด้วยคะแนนถูกมากกว่า, ผิดน้อยกว่า, เวลาตอบรวมน้อยกว่า แล้วจึงใช้ข้อชี้ขาด
- แมตช์ที่ยกเลิกไม่ถูกนำไปคำนวณสถิติ

## Question Engine

ไฟล์ `supabase/functions/_shared/classroom-competition-engine.mjs` เป็น source of truth ของ generator และ validator รุ่น `p4-math-1.0.0`

| `activityKey` | เนื้อหา | ตัวชี้วัด |
|---|---|---|
| `math24` | เกม 24 | ค 1.1 ป.4/10, ค 1.1 ป.4/12 |
| `improper_to_mixed` | เศษเกินเป็นจำนวนคละ | ค 1.1 ป.4/3, ค 1.1 ป.4/4 |
| `mixed_to_improper` | จำนวนคละเป็นเศษเกิน | ค 1.1 ป.4/3, ค 1.1 ป.4/4 |
| `fraction_add_sub` | บวก/ลบเศษส่วนตัวส่วนเท่ากัน | ค 1.1 ป.4/13, ค 1.1 ป.4/14 |
| `mixed` | หมุนเวียนทั้ง 4 provider | ตาม provider ของแต่ละข้อ |

Generator ใช้ seed ที่บันทึกในแมตช์และเก็บ `engine_version`, prompt, answer key และ canonical key เพื่อ replay และ audit ได้ Answer key อยู่ในฐานข้อมูลและ Edge Function เท่านั้น

Game 24 รับ operation tree จากการแตะการ์ดและเครื่องหมาย ไม่รับ JavaScript expression และไม่ใช้ `eval` Validator บังคับใช้เลขต้นทางตาม index ครบหนึ่งครั้ง, intermediate เป็นจำนวนเต็มบวก, การหารลงตัว, ผลสุดท้ายเท่ากับ 24 และปฏิเสธ operation ที่ไม่เปลี่ยนค่า เช่นคูณหรือหารด้วย 1

## Security Model

- Host Edge Function เปิด JWT verification และตรวจ `user_roles` ว่าเป็นครูหรือแอดมิน
- Team Edge Function ปิด JWT เฉพาะ endpoint นี้ เครื่องขอเข้าแล้วได้รับ capability token สุ่ม 256 บิต
- Browser เก็บ token ใน `sessionStorage`; ฐานข้อมูลเก็บเฉพาะ SHA-256 hash พร้อมเวลาหมดอายุ
- ทุก action หลัง join ตรวจ token, expiry, device status, team, match status, server time, attempt limit, rate limit และ idempotency key
- เครื่องทีมไม่มีสิทธิ์ Data API และ payload state ไม่คืน `answer_key` หรือข้อมูลทีมคู่แข่ง
- `record_classroom_competition_attempt` เป็น `SECURITY INVOKER`, revoke จาก `PUBLIC`, grant เฉพาะ `service_role`
- ตารางทั้ง 7 เปิด RLS ครูอ่านเฉพาะรายการของตน แอดมินอ่านทั้งหมด

## Realtime และเวลา

Host ใช้ authenticated private Supabase channel รับ Postgres changes และมี polling สำรองทุก 5 วินาที เครื่องทีมรับผล submit ทันทีและ poll canonical state ทุก 1 วินาที โดยถ้า error จะ backoff เป็น 5 วินาที ทุกคำขอ state/submit ตรวจเวลาฝั่งเซิร์ฟเวอร์และเรียก finalize แบบ idempotent เมื่อหมดเวลา

## ตาราง

- `classroom_competitions`
- `classroom_competition_teams`
- `classroom_competition_members`
- `classroom_competition_devices`
- `classroom_competition_questions`
- `classroom_competition_attempts`
- `classroom_competition_results`

Migrations:

- `supabase/migrations/477_classroom_competitions.sql` สร้าง schema, RLS และ transactional RPC
- `supabase/migrations/479_classroom_competition_policy_cleanup.sql` แยก write policies เพื่อลด policy overlap

## Verification

```bash
pnpm verify:classroom-competition
pnpm verify:worksheet
pnpm build
node scripts/test-classroom-competition-e2e.mjs --production
```

Verifier สร้างและตรวจโจทย์ 180,000 ข้อจาก 1,200 seeds x 3 difficulties x 5 activity modes x 10 ข้อ พร้อมทดสอบ determinism, ความไม่ซ้ำ, answer key, รูปเศษส่วน และ negative rules ของ Game 24

E2E เปิด Playwright 3 browser contexts พร้อมกันสำหรับ Host, Team A และ Team B สร้างข้อมูลทดสอบแบบ isolated บน Production และลบทิ้งใน `finally` เสมอ ต้องมี `SUPABASE_SERVICE_ROLE_KEY` และส่ง flag `--production` โดยชัดเจนจึงจะรันได้

## Roadmap

1. Phase 2: 2-4 ทีม, ทีมประจำ, template, export, recovery และ device Realtime หลัง Auth/RLS audit
2. Phase 3: ป.5-ป.6 และ provider ภาษาไทย อังกฤษ วิทยาศาสตร์ พร้อม dashboard รายหัวข้อ
3. Phase 4: ฤดูกาล ตารางคะแนน ทีมถาวร ทัวร์นาเมนต์ badge และ responder attribution
4. Phase 5: คลังโจทย์ครู, AI-assisted draft ที่ผ่าน validator, adaptive difficulty และ provider SDK

## Deployment Note

Repository กับ production มี migration history ไม่ตรงกัน จึงห้ามใช้ `supabase db push` จนกว่าจะ reconcile history โดยผู้ดูแลฐานข้อมูล ใช้ migration ไฟล์นี้ผ่าน workflow ที่เลือก version เดียวอย่างชัดเจน แล้ว regenerate `src/integrations/supabase/types.ts` หลัง apply schema สำเร็จ
