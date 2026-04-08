# 🚀 Deploy Checklist — GitHub + Vercel + Supabase

## ✅ สิ่งที่เตรียมไว้แล้ว
- [x] `vercel.json` — SPA routing + Security headers
- [x] `.gitignore` — ไม่ commit `.env` และ `node_modules`
- [x] `.env.example` — template สำหรับ environment variables
- [x] `SUPABASE_SETUP.sql` — SQL สำหรับสร้าง schema ทั้งหมด
- [x] `supabase/migrations/` — migration files 001–010
- [x] Commit พร้อม push ขึ้น GitHub แล้ว

---

## 📋 ขั้นตอนที่ต้องทำบนเครื่องของคุณ

### STEP 1 — Push ขึ้น GitHub

เปิด Terminal ใน folder โปรเจกต์แล้วพิมพ์:

```bash
git push origin main
```

> ถ้า push ไม่ผ่านให้ login ก่อน: `gh auth login` (ต้องติดตั้ง GitHub CLI)

---

### STEP 2 — ตั้งค่า Supabase

1. เข้า [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. ตั้งชื่อโปรเจกต์ → เลือก region Asia (Singapore) → Set password
3. รอประมาณ 2 นาที
4. ไปที่ **SQL Editor** → วาง SQL จากไฟล์ `SUPABASE_SETUP.sql` ทั้งหมด → **Run**
5. ไปที่ **Settings → API** → คัดลอกค่า 2 ค่า:
   - `Project URL` → จะใส่เป็น `VITE_SUPABASE_URL`
   - `anon public` key → จะใส่เป็น `VITE_SUPABASE_ANON_KEY`

---

### STEP 3 — ตั้งค่า Vercel

1. เข้า [vercel.com](https://vercel.com) → Login ด้วย GitHub
2. กด **"Add New Project"** → Import repo `school-website-template`
3. Vercel จะ detect เป็น **Vite** อัตโนมัติ
4. ก่อน Deploy ให้กด **"Environment Variables"** แล้วเพิ่ม:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) |

5. กด **"Deploy"** → รอ ~2 นาที
6. เว็บขึ้นออนไลน์แล้ว! 🎉

---

### STEP 4 — ตั้งค่า Supabase Storage (สำหรับอัพโหลดรูปภาพ)

1. Supabase Dashboard → **Storage** → New Bucket
2. ตั้งชื่อ: `school-images`
3. เปิด **Public bucket** → Save
4. ไปที่ **Policies** → เพิ่ม policy:
   - Allow public read: `SELECT` for `anon`
   - Allow admin upload: `INSERT, UPDATE, DELETE` for `authenticated`

---

### STEP 5 — ตั้งค่า Admin Account

1. Supabase Dashboard → **Authentication** → **Users** → **Invite user**
2. ใส่ email ของ admin
3. เข้าเว็บที่ deploy แล้ว → `/admin` → login ด้วย email นั้น

---

## 🔄 การอัพเดตเว็บในอนาคต

เมื่อแก้ไขโค้ด → commit → push ขึ้น GitHub → Vercel จะ auto-deploy ให้อัตโนมัติ

```bash
git add .
git commit -m "แก้ไข: ..."
git push origin main
```

---

## 🆘 ถ้า Build ล้มเหลวบน Vercel

ตรวจสอบ:
1. Environment Variables ครบไหม? (`VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`)
2. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
