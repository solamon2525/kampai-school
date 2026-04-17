# 🏫 โรงเรียนบ้านคำไผ่

**เว็บไซต์ระบบสารสนเทศโรงเรียนบ้านคำไผ่** — พัฒนาด้วย React 18 + Supabase + Vercel  
ระบบบริหารจัดการโรงเรียนแบบครบวงจร ตั้งแต่เนื้อหาเว็บไซต์ไปจนถึงงานวิชาการ งานสารบรรณ และงานบุคคล

🌐 **Live Site**: [kampai-school.vercel.app](https://kampai-school.vercel.app)  
📦 **Repository**: [github.com/solamon2525/kampai-school](https://github.com/solamon2525/kampai-school)  
📧 **Contact**: info@bankamphai.ac.th

---

## 📸 ภาพรวมระบบ

| หน้าเว็บไซต์ | Admin Dashboard |
|---|---|
| หน้าแรกปรับแต่งได้ด้วย Visual Page Builder | ระบบหลังบ้านครบวงจร |

---

## ✨ ฟีเจอร์หลัก

### 🌐 เว็บไซต์สาธารณะ (Public)
| ฟีเจอร์ | รายละเอียด |
|---|---|
| หน้าแรก | Visual Page Builder 3 คอลัมน์ ลากวางได้ + Mobile Layout แยก |
| ข่าวสาร | ระบบข่าว + ปักหมุด + หมวดหมู่ + External Links |
| แกลเลอรี่ | อัลบั้มรูปภาพ + Lightbox Viewer |
| ปฏิทิน | กิจกรรมตลอดปีการศึกษา |
| บุคลากร | ผู้บริหาร ครู และบุคลากรทั้งหมด |
| นักเรียน | ความสำเร็จ ชุมนุม สภานักเรียน |
| หลักสูตร | 4 สายการเรียน + กิจกรรมเสริม |
| รับสมัคร | ระบบสมัครนักเรียนออนไลน์ |
| ธนาคารขยะ | Top 5 Leaderboard นักเรียน |
| ติดต่อ | แผนที่ Google Maps + แบบฟอร์ม |
| Countdown | นับถอยหลังเปิดเทอม Real-time |

### 🔧 Admin Dashboard
| หมวด | ฟีเจอร์ |
|---|---|
| **เนื้อหา** | จัดการข่าว แกลเลอรี่ กิจกรรม เอกสาร Hero Slides FAQ |
| **บุคลากร** | ผู้บริหาร ครู-บุคลากร (พร้อมรูปภาพ) |
| **นักเรียน** | ฐานข้อมูลนักเรียนรายบุคคล ระบบเช็คชื่อ คะแนน ความประพฤติ |
| **รับสมัคร** | ใบสมัครออนไลน์ + จัดการสถานะ + พิมพ์ใบสมัคร |
| **ธนาคารขยะ** | บันทึกธุรกรรม เชื่อมรหัสนักเรียน สรุปรายงาน + Export CSV |
| **ฝ่ายวิชาการ** | ตารางสอน (Grid 5×8) แผนการสอน สื่อการสอน ปฏิทินวิชาการ นักเรียนพิเศษ แนะแนว นิเทศ |
| **งานสารบรรณ** | หนังสือรับ-ส่ง คำสั่ง/ประกาศ บันทึกประชุม Dashboard ภาพรวม |
| **งานบุคคล (HR)** | ระบบการลา บันทึกการอบรม ประเมิน PA Assessment |
| **รายงาน** | Export CSV + พิมพ์รายงานเช็คชื่อ คะแนน ธนาคารขยะ |
| **แจ้งผู้ปกครอง** | Dialog รายชื่อขาดเรียน + SMS Template + Copy |
| **Analytics** | สถิติผู้เข้าชม Device Breakdown Peak Hours Traffic Sources |
| **Page Builder** | Visual Editor หน้าแรก + Mobile Preview |
| **ตั้งค่า** | ข้อมูลโรงเรียน 100+ fields โซเชียล แผนที่ |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript 5.8** + **Vite**
- **TailwindCSS 3** + **shadcn/ui** (Radix UI)
- **React Router v6** — Lazy Loading
- **TanStack Query v5** — Data Fetching & Cache
- **TanStack Table v8** — Data Tables
- **Recharts** — Charts & Analytics
- **Framer Motion** — Animations
- **Puck v0.20** — Visual Page Builder
- **dnd-kit** — Drag & Drop
- **React Hook Form + Zod** — Forms & Validation
- **Uppy** — File Upload
- **React Quill** — Rich Text Editor
- **react-photo-album** + **yet-another-react-lightbox** — Gallery

### Backend & Database
- **Supabase** — PostgreSQL + Auth + Storage + Edge Functions
- **Row Level Security (RLS)** — ควบคุมสิทธิ์ทุก Table
- **Deno** — Edge Functions Runtime
- **Resend API** — Email Notifications

### Deployment & Infrastructure
- **Vercel** — Frontend Hosting + Cron Jobs
- **GitHub** — Source Code Repository
- **40+ Tables** / **21 Migrations**
- Storage: `school-images` (1 GB) + `school-documents` (50 MB/file)
- Security Headers: X-Frame-Options, XSRF, Referrer-Policy
- Asset Cache: 1 ปี (immutable)

---

## 🗄 โครงสร้างฐานข้อมูล

```
เนื้อหา     → news, news_categories, gallery_albums, gallery_photos,
               events, documents, document_categories
บุคลากร     → administrators, staff, students, attendance_records,
               student_council, student_achievements, student_activities,
               student_stats, grade_data
บริการ      → admissions, contact_messages, waste_categories,
               waste_transactions, curriculum_programs, curriculum_activities,
               faq, email_subscribers
สารบรรณ     → incoming_letters, outgoing_letters, orders_announcements, meetings
HR          → leave_requests, training_records, pa_assessments
วิชาการ     → class_schedules, lesson_plans, teaching_materials,
               academic_calendar, student_special_needs,
               counseling_records, supervision_records
ระบบ        → school_settings, page_views, milestones, facilities
```

---

## 🚀 การติดตั้ง (สำหรับนักพัฒนา)

### ข้อกำหนดเบื้องต้น
- Node.js 20+
- npm / pnpm
- Supabase account
- Vercel account (สำหรับ deploy)

### 1. Clone Repository
```bash
git clone https://github.com/solamon2525/kampai-school.git
cd kampai-school
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
```bash
cp .env.example .env
```
แก้ไขไฟล์ `.env`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. รัน Database Migrations
ใน Supabase SQL Editor หรือ CLI รัน migrations ตามลำดับจาก `supabase/migrations/`:
```
001_initial_schema.sql
002_events_and_settings.sql
...
021_academic.sql
```

### 5. รัน Development Server
```bash
npm run dev
```
เปิด [http://localhost:5173](http://localhost:5173)

### 6. Deploy to Vercel
```bash
vercel --prod
```
หรือ push ไปที่ `main` branch — Vercel จะ deploy อัตโนมัติ

---

## 📁 โครงสร้างโปรเจค

```
src/
├── components/
│   ├── admin/
│   │   ├── academic/         # ฝ่ายวิชาการ (7 modules)
│   │   ├── analytics/        # Analytics Dashboard
│   │   ├── attendance/       # ระบบเช็คชื่อ + Export
│   │   ├── hr/               # งานบุคคล (ลา / อบรม / PA)
│   │   ├── saraban/          # งานสารบรรณ
│   │   ├── scores/           # คะแนน + Export
│   │   ├── students/         # ฐานข้อมูลนักเรียน
│   │   ├── system/           # ภาพรวมระบบ
│   │   └── waste-bank/       # ธนาคารขยะ + Export
│   ├── home/                 # หน้าแรก (Blocks + Layout)
│   └── ui/                   # shadcn/ui components
├── hooks/                    # useSchoolSettings, useAuth, ...
├── lib/
│   └── export.ts             # downloadCSV() + printTable()
├── pages/                    # Route pages
└── services/                 # Supabase query services
supabase/
└── migrations/               # 21 SQL migrations
```

---

## 🔐 ระบบ Admin

เข้าถึงที่ `/admin` — ต้องล็อกอินด้วย Supabase Auth

| Role | สิทธิ์ |
|---|---|
| `admin` | เข้าถึงได้ทุกหน้า รวม Settings และ User Management |
| `editor` | จัดการเนื้อหา ไม่สามารถจัดการ Users |

---

## 📊 Version History

| เวอร์ชัน | ฟีเจอร์หลัก |
|---|---|
| **v1.3.1** | Export CSV+Print รายงาน, แจ้งผู้ปกครอง SMS, Analytics ขยาย, Countdown Real-time |
| **v1.3.0** | ฝ่ายวิชาการ 7 modules, DB migrations ครบ (019-021), WasteBankWidget |
| **v1.2.5** | Mobile Layout Manager แยก Desktop/Mobile |
| **v1.2.4** | Responsive Fix, Mock Data Fallback |
| **v1.2.3** | OBEC E-Services Block |
| **v1.2.2** | Two-way Hover Sync, Auto Scroll Preview |
| **v1.2.1** | Cross-Zone Layout Fix |
| **v1.2.0** | Interactive Drag & Drop Layout |
| **v1.1.0** | Visual Homepage Layout Manager |
| **v1.0.0** | Initial Launch |

---

## 📜 License

สงวนลิขสิทธิ์ © 2568 **โรงเรียนบ้านคำไผ่**  
พัฒนาและดูแลโดยทีมงานโรงเรียนบ้านคำไผ่
