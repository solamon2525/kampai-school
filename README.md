# 🏫 โรงเรียนบ้านคำไผ่ (Ban Kamphai School Digital Platform)

> **เว็บไซต์สารสนเทศและแพลตฟอร์มการเรียนรู้ดิจิทัลครบวงจร โรงเรียนบ้านคำไผ่**  
> พัฒนาด้วยเทคโนโลยีสมัยใหม่ **React 18 + TypeScript 5.8 + Vite + TailwindCSS + Supabase (PostgreSQL 15) + Vercel + PWA**  
> ครอบคลุมตั้งแต่เว็บไซต์ประชาสัมพันธ์สาธารณะ, คลังเกมการศึกษาและสื่อการสอน, ระบบสอบออนไลน์พร้อมเสียงพูดสังเคราะห์ AI, ระบบธนาคารความดี, ระบบธนาคารขยะ, พอร์ทัลครูผู้สอน, พอร์ทัลผู้ปกครอง ไปจนถึงระบบบริหารจัดการสถานศึกษาและงานสารบรรณอิเล็กทรอนิกส์

---

[![Production Live](https://img.shields.io/badge/Live_Site-kampai--school.vercel.app-0284c7?style=for-the-badge&logo=vercel)](https://kampai-school.vercel.app)
[![Version](https://img.shields.io/badge/Version-v1.229.140-16a34a?style=for-the-badge)](https://kampai-school.vercel.app/admin)
[![Database](https://img.shields.io/badge/Supabase-567_Migrations_%7C_100%25_RLS-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Installable_%7C_Offline_Resilient-ea580c?style=for-the-badge&logo=pwa)](https://kampai-school.vercel.app)
[![License](https://img.shields.io/badge/License-Copyright_Protected-slate?style=for-the-badge)](LICENSE)

* 🌐 **เว็บไซต์หลัก (Live Website):** [https://kampai-school.vercel.app](https://kampai-school.vercel.app)
* 📦 **ซอร์สโค้ด (GitHub Repository):** [https://github.com/solamon2525/kampai-school](https://github.com/solamon2525/kampai-school)
* ⚡ **กู้คืนแคช PWA กรณีอัปเดต:** [https://kampai-school.vercel.app/?reset_sw=1](https://kampai-school.vercel.app/?reset_sw=1)
* 📧 **ติดต่อโรงเรียน:** info@bankamphai.ac.th

---

## 📑 สารบัญ (Table of Contents)

1. [🌟 ไฮไลท์และภาพรวมระบบ](#-ไฮไลท์และภาพรวมระบบ)
2. [🧩 9 ระบบงานหลักในแพลตฟอร์ม](#-9-ระบบงานหลักในแพลตฟอร์ม)
   - [1. คลังสื่อและเกมการศึกษาดิจิทัล (Educational Hub & Games)](#1-คลังสื่อและเกมการศึกษาดิจิทัล-educational-hub--games)
   - [2. ระบบสอบออนไลน์และคลังข้อสอบมาตรฐาน (Online Exam & Question Bank)](#2-ระบบสอบออนไลน์และคลังข้อสอบมาตรฐาน-online-exam--question-bank)
   - [3. ระบบธนาคารความดีและฮีโร่คุณธรรม (Virtue Bank & Kampai Hero)](#3-ระบบธนาคารความดีและฮีโร่คุณธรรม-virtue-bank--kampai-hero)
   - [4. ระบบธนาคารขยะรีไซเคิลและสมุดเงินฝาก (Waste Bank & Savings Bank)](#4-ระบบธนาคารขยะรีไซเคิลและสมุดเงินฝาก-waste-bank--savings-bank)
   - [5. ระบบการแข่งขันตอบปัญหาห้องเรียนสด (Real-Time Classroom Competitions)](#5-ระบบการแข่งขันตอบปัญหาห้องเรียนสด-real-time-classroom-competitions)
   - [6. พอร์ทัลคุณครูและจัดการการสอน (Teacher Portal)](#6-พอร์ทัลคุณครูและจัดการการสอน-teacher-portal)
   - [7. พอร์ทัลผู้ปกครองติดตามบุตรหลาน (Parent Portal)](#7-พอร์ทัลผู้ปกครองติดตามบุตรหลาน-parent-portal)
   - [8. ระบบบริหารจัดการสถานศึกษาและงานสารบรรณ (Admin & School Operations)](#8-ระบบบริหารจัดการสถานศึกษาและงานสารบรรณ-admin--school-operations)
   - [9. เว็บไซต์สาธารณะและประชาสัมพันธ์ (Public School Portal)](#9-เว็บไซต์สาธารณะและประชาสัมพันธ์-public-school-portal)
3. [👥 ตารางสิทธิ์และการเข้าใช้งานระบบ (Role & Access Matrix)](#-ตารางสิทธิ์และการเข้าใช้งานระบบ-role--access-matrix)
4. [🛠 สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack & Architecture)](#-สถาปัตยกรรมและเทคโนโลยีที่ใช้-tech-stack--architecture)
5. [📁 โครงสร้างโปรเจกต์ (Project Directory Structure)](#-โครงสร้างโปรเจกต์-project-directory-structure)
6. [🚀 การติดตั้งและรันในเครื่องสำหรับนักพัฒนา (Local Development)](#-การติดตั้งและรันในเครื่องสำหรับนักพัฒนา-local-development)
7. [📜 ประวัติการพัฒนาและสถานะล่าสุด (Release & Milestones)](#-ประวัติการพัฒนาและสถานะล่าสุด-release--milestones)

---

## 🌟 ไฮไลท์และภาพรวมระบบ

แพลตฟอร์ม **โรงเรียนบ้านคำไผ่** ถูกออกแบบภายใต้แนวคิด **"Classroom-First & Student-Centric"** ผสมผสานระบบบริหารจัดการโรงเรียนดิจิทัล (Smart School Management) เข้ากับระบบเกมการเรียนรู้ (Gamified Learning Ecosystem) เพื่อส่งเสริมการศึกษาสำหรับนักเรียนระดับอนุบาล ประถมศึกษา และมัธยมศึกษาตอนต้น:

- **100+ เกมการศึกษา & สื่อปฏิสัมพันธ์:** มีระบบ SDK สำหรับจัดเก็บสถิติ คะแนนสูงสุด และจัดอันดับแบบ Real-time
- **ระบบสอบออนไลน์ป้องกันการลอกข้อสอบ:** สุ่มสลับทั้งข้อสอบและตัวเลือกอัตโนมัติ พร้อมเสียงสังเคราะห์ภาษาไทย (AI Thai TTS) อ่านผลคะแนนให้เด็กฟังทันที
- **สร้างแรงบันดาลใจด้วย Gamification:** ระบบคะแนนความดีและขยะรีไซเคิลที่สามารถนำมาแลกของรางวัลจริงในโรงเรียน พร้อมระบบเลี้ยงสัตว์เสมือนจริง (Virtual Pet)
- **ปลอดภัยตามกฎหมาย PDPA:** ระบบความปลอดภัยฐานข้อมูลระดับแถว (Row Level Security - RLS) 100% แยกสิทธิ์ระหว่างสาธารณะ นักเรียน ผู้ปกครอง ครู และผู้บริหารอย่างรัดกุม

---

## 🧩 9 ระบบงานหลักในแพลตฟอร์ม

```
┌────────────────────────────────────────────────────────────────────────┐
│                   🏫 KAMPAI SCHOOL DIGITAL ECOSYSTEM                   │
├──────────────────┬───────────────────┬─────────────────────────────────┤
│  🎮 ฝ่ายการเรียนรู้│  📝 ฝ่ายวัดผลและประเมิน│  🏆 ฝ่ายส่งเสริมคุณธรรมและวินัย  │
│  - Educational Hub│  - Online Exam    │  - Virtue Bank (ธนาคารความดี)   │
│  - 100+ Web Games │  - Auto Shuffle   │  - Kampai Hero & Pet System     │
│  - Smart A4 Sheets│  - Thai Voice TTS │  - Reward Store (ร้านแลกรางวัล) │
├──────────────────┼───────────────────┼─────────────────────────────────┤
│  ♻️ ฝ่ายสิ่งแวดล้อม │  ⚡ ฝ่ายกิจกรรมและแข่งสด │  👨‍🏫 พอร์ทัลครูผู้สอน           │
│  - Waste Bank     │  - Live Quiz Show │  - Attendance & QR Scanner      │
│  - Savings Bank   │  - Cross-Room Host│  - E-Gradebook & Lesson Plans   │
│  - Top Eco Badges │  - Instant Buzzer │  - Teacher CCTV Live Feeds      │
├──────────────────┼───────────────────┼─────────────────────────────────┤
│  👨‍👩‍👧 พอร์ทัลผู้ปกครอง│  🏢 งานบริหารสถานศึกษา│  🌐 เว็บไซต์สาธารณะ              │
│  - Child Progress │  - E-Saraban & Sign│ - Puck Visual Page Builder     │
│  - Conduct Points │  - HR, Leaves, PA │  - News, Lightbox Gallery       │
│  - Meet Teacher   │  - Student 360    │  - Online Admissions            │
└──────────────────┴───────────────────┴─────────────────────────────────┘
```

---

### 1. คลังสื่อและเกมการศึกษาดิจิทัล (Educational Hub & Games)
*เส้นทางหลัก: `/educational-hub` · `/play/:slug` · `/online-arena`*

* **คลังเกมมากกว่า 100+ เกม ครอบคลุมทุกกลุ่มสาระการเรียนรู้:**
  * **คณิตศาสตร์:** Multiply Race (แข่งสูตรคูณประลองความเร็ว), เกมเศษส่วน, คิดเลขเร็ว, รูปทรงเรขาคณิต
  * **วิทยาศาสตร์:** ระบบสุริยะจักรวาล, วัฏจักรน้ำ, สถานะของสาร (Solid, Liquid, Gas), การคัดแยกขยะ
  * **ภาษาอังกฤษ:** English Quest, Vocab Hub นิทานภาพคำศัพท์, Phonics Reveal, Flashcards เสียงสองภาษา
  * **ภาษาไทย:** นินจาตัดคำนาม, ปริศนาสุภาษิตคำพังเพย, คำควบกล้ำ, มาตราตัวสะกด
  * **ประวัติศาสตร์ & สังคมศึกษา:** ยุคสมัยทางประวัติศาสตร์, วัฒนธรรม 4 ภาค, หน้าที่พลเมือง
* **3 โหมดการเล่นมาตรฐานตาม Kampai Game SDK:**
  1. **เล่นคนเดียว (Solo / Practice Mode):** ฝึกทักษะตามระดับความยาก บันทึกสถิติส่วนบุคคลและคะแนนสูงสุด
  2. **ประลองสองคนในเครื่องเดียว (Local Hot-Seat Mode):** แบ่งหน้าจอแข่งขัน 2 ฝั่งบนแท็บเล็ตเครื่องเดียวกัน เหมาะสำหรับเพื่อนในห้องเรียน
  3. **ประลองออนไลน์แบบสด (Online Versus Match):** แข่งขันข้ามห้องเรียนด้วย Kampai Match Protocol พร้อมสุ่มโจทย์ตรงกันด้วย Seeded RNG
* **คลังคำศัพท์และนิทานภาพ (Vocab Hub):** รวมคำศัพท์ภาษาอังกฤษและภาษาไทยพร้อมภาพวาดสไตล์นิทานเด็ก (Storybook Clean Line-Art) พื้นหลังสีงาช้างอบอุ่น (#FFF8EE) ขนาด 512×512 WebP ครบทุกหมวดหมู่
* **เกมที่รองรับกล้องและการเคลื่อนไหว (AR & Camera Games):** ตรวจจับการเคลื่อนไหวของมือและร่างกายผ่าน AI Computer Vision
* **คลังใบงานการพิมพ์ A4 อัจฉริยะ (Smart Worksheets):** ใบงาน HTML สำหรับพิมพ์ลงกระดาษ A4 คมชัด 100% พร้อมเฉลยและระบบกรอกชื่อ/คะแนน

---

### 2. ระบบสอบออนไลน์และคลังข้อสอบมาตรฐาน (Online Exam & Question Bank)
*เส้นทางหลัก: `/exam-online` · `/teacher/exams`*

* **การเข้าสอบสะดวกผ่านรหัส PIN:** นักเรียนเข้าหน้าระบบ กรอกรหัส PIN ประจำชุดข้อสอบ (เช่น `2222`, `5555`, `6001`) และเลือกระดับชั้น
* **ดึงรายชื่อนักเรียนจริงพร้อมรูปถ่าย Avatar:** รองรับการดึงข้อมูลรายชื่อและรูปถ่ายนักเรียนจากฐานข้อมูลจริงผ่าน Safe Public RPC พร้อมช่องค้นหาชื่อ/เลขที่แบบ Instant Filter
* **ระบบป้องกันการลอกข้อสอบแบบสมบูรณ์ (Anti-Cheating Randomization):**
  * สุ่มสลับลำดับข้อสอบอัตโนมัติสำหรับนักเรียนแต่ละคน (Question Shuffling)
  * สุ่มสลับลำดับตัวเลือก ก, ข, ค, ง อิสระในแต่ละข้อ (Option Shuffling ด้วย Fisher-Yates Algorithm)
  * ระบบตรวจคำตอบแปลงดัชนีกลับสู่ข้อสอบต้นฉบับอัตโนมัติ ทำให้การประมวลผลและการวิเคราะห์ข้อสอบ (Item Analysis / KR-20) ถูกต้อง 100%
* **ตรวจผลคะแนนและอ่านออกเสียงทันที (Instant Grading & Thai TTS):**
  * แสดงผลคะแนน เปอร์เซ็นต์ความถูกต้อง และสถานะผ่าน/ไม่ผ่านทันทีที่กดส่งข้อสอบ
  * ระบบเสียงสังเคราะห์ภาษาไทย (Thai Speech Synthesis) อ่านผลสอบ ชื่อนักเรียน และคะแนนที่ได้รับแบบอัตโนมัติ
* **คลังข้อสอบมาตรฐานตามตัวชี้วัด สพฐ.:** รวมข้อสอบครอบคลุม 10 กลุ่มสาระการเรียนรู้มากกว่า 1,000+ ข้อ จัดหมวดหมู่ตาม Bloom's Taxonomy (L1-L6) และเปิดให้ครูคัดเลือกจัดชุดข้อสอบได้เองผ่านหน้าจอ `TeacherExamManagement`

---

### 3. ระบบธนาคารความดีและฮีโร่คุณธรรม (Virtue Bank & Kampai Hero)
*เส้นทางหลัก: `/virtue-bank` · `/virtue-bank/:studentCode` · `/hall-of-fame` · `/rewards`*

* **การบันทึกพฤติกรรมเชิงบวกและข้อควรปรับปรุง:** ครูบันทึกคะแนนความดีและพฤติกรรมผ่าน Single/Bulk Conduct Form ได้รวดเร็วภายใน 1 วินาที
* **คลังเหตุผลสำเร็จรูปฉบับสมบูรณ์ (150+ Standard Presets):** สกัดและรวบรวมจากประวัติการบันทึกจริงของครูในโรงเรียน ครอบคลุม 11 หมวดหมู่ เช่น การช่วยเหลืองานโรงเรียน, การทำเวรเขตสะอาด, การส่งงานตรงเวลา, ความซื่อสัตย์, วินัยแถวเคารพธงชาติ, และการดูแลสัตว์
* **การตรวจสอบพลังความดีสาธารณะ (Student Hero Public):** นักเรียนและผู้ปกครองสามารถกรอกรหัสนักเรียนเพื่อดูประวัติความดี เหรียญรางวัล ตราเกียรติยศ และแต้มสะสม
* **ร้านค้าแลกของรางวัลโรงเรียน (Reward Store):** นักเรียนนำคะแนนความดีและแต้มขยะรีไซเคิลมาขอแลกของรางวัลจริง (อุปกรณ์เครื่องเขียน, ของเล่นเสริมทักษะ, สิทธิ์พิเศษในห้องเรียน) พร้อมระบบอนุมัติของครู
* **ระบบสัตว์เลี้ยงเสมือนจริง (Virtual Pet System):** สัตว์เลี้ยงคู่ใจที่เติบโตและพัฒนาการตามระดับคะแนนความดีที่นักเรียนสะสม

---

### 4. ระบบธนาคารขยะรีไซเคิลและสมุดเงินฝาก (Waste Bank & Savings Bank)
*เส้นทางหลัก: `/waste-bank` · `/waste-bank/stats` · `/savings-bank`*

* **ธนาคารขยะดิจิทัล (Waste Bank Management):**
  * คัดแยกขยะ 4 ประเภทหลัก: กระดาษ, พลาสติก, โลหะ/กระป๋อง, และแก้ว
  * บันทึกน้ำหนัก คำนวณมูลค่าเงินบาท และแปลงเป็นคะแนนแต้มความดีให้อัตโนมัติ
  * จัดอันดับ Top 5 นักเรียนและห้องเรียนรักษ์โลกที่มีส่วนร่วมสูงสุด
  * Export รายงานบัญชีการฝากขยะเป็น CSV และสั่งพิมพ์เอกสารสรุปยอด
* **ธนาคารโรงเรียน (School Savings Bank):** บันทึกการฝาก-ถอนเงินออมของนักเรียน สร้างวินัยทางการเงินตั้งแต่วัยเด็ก

---

### 5. ระบบการแข่งขันตอบปัญหาห้องเรียนสด (Real-Time Classroom Competitions)
*เส้นทางหลัก: `/teacher/competitions` · `/competitions/join`*

* **ระบบ Quiz Show สดในห้องเรียน:** คุณครูทำหน้าที่ Host ฉายจอโปรเจกเตอร์หน้าห้อง นักเรียนใช้มือถือหรือแท็บเล็ตเข้าร่วมแข่งขันผ่าน PIN
* **เชื่อมต่อแบบเรียลไทม์ (Supabase Realtime Broadcast):**
  * ส่งคำถามและจับเวลานับถอยหลังพร้อมกันทุกหน้าจอ
  * ระบบปุ่มกดตอบคำถามความเร็วสูง (Buzzer)
  * แสดงกราฟสรุปคำตอบและกระดานคะแนนสด (Live Leaderboard) เมื่อจบแต่ละข้อ

---

### 6. พอร์ทัลคุณครูและจัดการการสอน (Teacher Portal)
*เส้นทางหลัก: `/teacher/*` (ต้องมีสิทธิ์ Role: `teacher` หรือ `admin`)*

* **ตารางสอนและปฏิทินปฏิบัติงาน:** ตารางสอน Interactive Grid 5 วัน 8 คาบ พร้อมไฮไลท์คาบเรียนปัจจุบัน
* **ระบบเช็คชื่อเข้าเรียนและสแกนเนอร์ (Attendance & QR Scanner):** เช็คชื่อ มา/ลา/ขาด/สาย ด้วยระบบแตะครั้งเดียว (1-Tap) หรือสแกน QR Code บนบัตรนักเรียนผ่านกล้องแท็บเล็ต
* **สมุดบันทึกคะแนนตัวชี้วัด (E-Gradebook):** กรอกคะแนนรายวิชา รายตัวชี้วัด สรุปผลการเรียนและตัดเกรดอัตโนมัติ
* **ระบบจัดการชุดข้อสอบ (Exam Management):** คลังข้อสอบกลาง เลือกประกอบชุดข้อสอบ กำหนดเวลาสอบ เกณฑ์ผ่าน และรหัส PIN
* **ระบบกล้องวงจรปิดภายในโรงเรียน (Teacher CCTV Live Feeds):** คุณครูสามารถเปิดดูภาพสดจากกล้องวงจรปิดจุดสำคัญในโรงเรียน (สนามเด็กเล่น, ประตูโรงเรียน, โรงอาหาร) เพื่อดูแลความปลอดภัยของเด็กๆ
* **แผนการจัดการเรียนรู้บูรณาการ (Integrated Lesson Plans):** จัดเก็บแผนการสอนรายสัปดาห์ บันทึกหลังสอน และรายงานการวิจัยในชั้นเรียน
* **แดชบอร์ดงานวิจัยและการใช้เกมการศึกษา (Teacher Game Research):** วิเคราะห์ Heatmap จุดอ่อน-จุดแข็งของนักเรียนจากการเล่นเกมและการทำแบบทดสอบ

---

### 7. พอร์ทัลผู้ปกครองติดตามบุตรหลาน (Parent Portal)
*เส้นทางหลัก: `/parent/*` (ต้องมีสิทธิ์ Role: `parent`)*

* **สลับดูบุตรหลานได้หลายคน (Multi-Child View):** สลับดูข้อมูลของนักเรียนแต่ละคนในครอบครัวได้อย่างสะดวกรวดเร็ว
* **รายงานสถิติแบบองค์รวม:**
  * การมาเรียนและบันทึกเวลาเข้าแถว
  * คะแนนความประพฤติและประวัติความดีที่ได้รับในแต่ละวัน
  * การบ้านและภาระงานที่ต้องส่ง
  * พัฒนาการทางวิชาการและการฝึกฝนผ่านสื่อการสอน
* **ระบบนัดหมายพบครูประจำชั้น (Parent-Teacher Conference Booking):** จองคิวปรึกษาพัฒนาการของนักเรียนกับคุณครูออนไลน์

---

### 8. ระบบบริหารจัดการสถานศึกษาและงานสารบรรณ (Admin & School Operations)
*เส้นทางหลัก: `/admin/*` (ต้องมีสิทธิ์ Role: `admin`)*

* **งานสารบรรณอิเล็กทรอนิกส์ (E-Saraban Management):**
  * ทะเบียนหนังสือรับ - หนังสือส่ง ราชการ
  * ทะเบียนคำสั่งและประกาศโรงเรียน
  * บันทึกรายงานการประชุมพร้อมแนบไฟล์เอกสาร
  * **ระบบลงนามดิจิทัล (Digital Signature Canvas):** ผู้บริหารและครูสามารถเซ็นชื่อรับรองเอกสารดิจิทัลผ่านหน้าจอได้โดยตรง
* **งานบุคคลและพัฒนาบุคลากร (HR Management):**
  * ระบบยื่นใบลาออนไลน์และอนุมัติการลา (ลาป่วย, ลากิจ, ลาพักผ่อน)
  * ประวัติการอบรมและพัฒนาตนเอง (พร้อมคลังเกียรติบัตร)
  * ระบบประเมินข้อตกลงในการพัฒนางาน (PA Assessment)
* **ฐานข้อมูลนักเรียนครบวงจร (Student 360 & Counseling):**
  * ประวัตินักเรียนรายบุคคล (ข้อมูลทั่วไป, ครอบครัว, สุขภาพ)
  * ระบบคัดกรองนักเรียน (SDQ: Strengths and Difficulties Questionnaire)
  * ระบบบันทึกการแนะแนวและส่งต่อนักเรียน
  * ระบบติดตามภาวะโภชนาการและงบประมาณอาหารกลางวันนักเรียน
* **ระบบรับสมัครนักเรียนใหม่ออนไลน์ (Online Admissions):** จัดการแบบฟอร์มสมัคร ตรวจสอบเอกสาร และออกบัตรประจำตัวผู้สมัคร
* **Visual Page Builder (Puck Builder):** เครื่องมือปรับแต่งหน้าแรกของเว็บไซต์แบบ Drag & Drop จัด 3 คอลัมน์ รองรับการจัดโครงสร้างแยกกันระหว่าง Desktop และ Mobile

---

### 9. เว็บไซต์สาธารณะและประชาสัมพันธ์ (Public School Portal)
*เส้นทางหลัก: `/` · `/news` · `/gallery` · `/events` · `/staff` · `/curriculum` · `/contact`*

* **หน้าแรกทันสมัยและมีชีวิตชีวา:** Hero Slider กิจกรรมเด่น, วิดเจ็ตข่าวสาร, วิดเจ็ตนับถอยหลังเปิดเทอม Real-time, ลิงก์ด่วนสำหรับครู/นักเรียน/ผู้ปกครอง
* **ข่าวสารและบทความประชาสัมพันธ์ (News & Announcements):** ปักหมุดข่าวสำคัญ, แยกหมวดหมู่, แชร์โซเชียล และรองรับ External Links
* **อัลบั้มรูปภาพกิจกรรม (Photo Gallery):** แสดงผลรูปภาพแบบ Masonry Grid พร้อม Lightbox Full-screen Viewer
* **ปฏิทินกิจกรรมโรงเรียน (Academic Calendar):** แสดงกำหนดการและวันสำคัญตลอดปีการศึกษา
* **ทำเนียบบุคลากรและคณะกรรมการ (Staff Directory):** ข้อมูลผู้บริหาร ครู และบุคลากรทางการศึกษาพร้อมรูปถ่ายและช่องทางติดต่อ
* **ข้อมูลหลักสูตรสถานศึกษา (Curriculum):** แผนการเรียน 4 กลุ่มสาระการเรียนรู้ และกิจกรรมพัฒนาผู้เรียน

---

## 👥 ตารางสิทธิ์และการเข้าใช้งานระบบ (Role & Access Matrix)

| ฟังก์ชัน / โมดูล | นักเรียน/บุคคลทั่วไป (`anon`) | ผู้ปกครอง (`parent`) | ครูผู้สอน (`teacher`) | แอดมิน/ผู้บริหาร (`admin`) |
|---|:---:|:---:|:---:|:---:|
| เข้าชมหน้าแรก ข่าวสาร ปฏิทิน ทำเนียบบุคลากร | ✅ | ✅ | ✅ | ✅ |
| เล่นเกมการศึกษาและฝึกทำใบงาน | ✅ | ✅ | ✅ | ✅ |
| ทำข้อสอบออนไลน์ด้วยรหัส PIN | ✅ | ✅ | ✅ | ✅ |
| ตรวจสอบพลังความดีผ่านรหัสนักเรียน | ✅ | ✅ | ✅ | ✅ |
| สมัครเข้าเรียนออนไลน์ / บริจาคเงิน | ✅ | ✅ | ✅ | ✅ |
| ดูข้อมูลการเรียนและความดีของบุตรหลาน | ❌ | ✅ | ✅ | ✅ |
| จองคิวนัดหมายพบครู | ❌ | ✅ | ✅ | ✅ |
| เช็คชื่อนักเรียน / QR Code Scanner | ❌ | ❌ | ✅ | ✅ |
| บันทึกคะแนนตัวชี้วัด / แผนการสอน | ❌ | ❌ | ✅ | ✅ |
| บันทึกคะแนนความดีและพฤติกรรม | ❌ | ❌ | ✅ | ✅ |
| จัดชุดข้อสอบและเปิดการสอบออนไลน์ | ❌ | ❌ | ✅ | ✅ |
| ดูกล้องวงจรปิดภายในโรงเรียน (CCTV) | ❌ | ❌ | ✅ | ✅ |
| งานสารบรรณ เซ็นเอกสารดิจิทัล | ❌ | ❌ | ✅ | ✅ |
| ระบบงานบุคคล ลาออนไลน์ ประเมิน PA | ❌ | ❌ | ✅ | ✅ |
| จัดการโครงสร้างหน้าแรก (Page Builder) | ❌ | ❌ | ❌ | ✅ |
| จัดการฐานข้อมูลและตั้งค่าระบบโรงเรียน | ❌ | ❌ | ❌ | ✅ |

---

## 🛠 สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack & Architecture)

### Frontend Core
* **Framework:** React 18.3 + TypeScript 5.8 (Strict Type Safety)
* **Build Tool:** Vite 5.4 + Rollup (Code Splitting, Tree Shaking)
* **Routing:** React Router v6 (Lazy Loading + Dynamic Retry on Chunk Miss)
* **State & Server Cache:** TanStack Query v5 (React Query)
* **Component Primitives:** shadcn/ui + Radix UI + TailwindCSS 3
* **Page Builder:** Puck v0.20 (Visual Drag-and-Drop)
* **Forms & Validation:** React Hook Form + Zod Schema Validation
* **Charts & Visualizations:** Recharts + Framer Motion
* **Audio & Speech Engine:** Web Speech API + Thai Speech Synthesizer Module
* **PWA & Offline:** Workbox + Progressive Web App Service Worker

### Backend & Database (Supabase Enterprise Engine)
* **Database:** PostgreSQL 15 (Managed on Supabase Cloud)
* **Database Migrations:** **567 Migration Files** (ควบคุมเวอร์ชัน Schema ละเอียดยิบ)
* **Access Control:** Row Level Security (RLS) 100% ครอบคลุมทุกตาราง
* **Custom Functions:** PostgreSQL Stored Procedures & Safe RPCs (`SECURITY DEFINER`)
* **Realtime Protocol:** Supabase Realtime Channels (WebSockets สำหรับการสอบและแข่งขันสด)
* **Cloud Storage:** Supabase Storage (`school-images`, `school-documents`)
* **Edge Computing:** Deno Edge Functions + Resend API (Email Notifications)

### Production & Infrastructure
* **Hosting & CDN:** Vercel Global Edge Network
* **DNS & SSL:** Auto SSL / HTTPS + Security Headers (HSTS, X-Frame-Options)
* **Security & PDPA:** คุ้มครองข้อมูลส่วนบุคคลอย่างรัดกุม ฟิลด์สำคัญถูกซ่อนจากสาธารณะ

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory Structure)

```
kampai-school/
├── public/
│   ├── games/                  # คลังเกมการศึกษา 100+ เกม, SDK, และ Assets
│   │   ├── english/            # เกมและสื่อภาษาอังกฤษ (Vocab Hub, Phonics)
│   │   ├── math/               # เกมคณิตศาสตร์ (Multiply Race, เศษส่วน)
│   │   ├── science/            # เกมวิทยาศาสตร์ (Solar System, วัฏจักรน้ำ)
│   │   ├── thai/               # เกมภาษาไทย (ตัดคำนาม, มาตราตัวสะกด)
│   │   ├── kampai-sdk.js       # Kampai Game Core SDK
│   │   └── kampai-versus.js    # ระบบแข่งออนไลน์ Real-time Versus
│   └── icons/                  # PWA Manifest & App Icons
├── src/
│   ├── components/             # Reusable UI & Business Components
│   │   ├── admin/              # ระบบหลังบ้าน (System, Academic, HR, Saraban, Waste)
│   │   ├── portal/             # สิทธิ์และการนำทาง (PortalProtectedRoute, Navbars)
│   │   ├── shared/             # PersonAvatar, CommandPalette, PWAUpdatePrompt
│   │   └── ui/                 # shadcn/ui components (Radix primitives)
│   ├── contexts/               # React Context Providers (Auth, CommandPalette)
│   ├── hooks/                  # Custom Hooks (usePageView, useSchoolSettings)
│   ├── lib/                    # Helper Utilities (thaiSpeech, utils, export)
│   ├── pages/                  # หน้า Route หลักของเว็บ (Lazy-loaded)
│   │   ├── admin/              # หน้าแอดมินและ PageBuilder
│   │   ├── parent/             # พอร์ทัลผู้ปกครอง
│   │   ├── teacher/            # พอร์ทัลคุณครู
│   │   ├── ExamOnline.tsx      # ระบบสอบออนไลน์สำหรับนักเรียน
│   │   ├── EducationalHub.tsx  # คลังสื่อและเกมการศึกษา
│   │   ├── VirtueBank.tsx      # ธนาคารความดี
│   │   └── Index.tsx           # หน้าแรกของโรงเรียน
│   └── services/               # Supabase Database Services (แยกตามโมดูลงาน)
└── supabase/
    └── migrations/             # 567 ไฟล์ SQL Migrations (ลำดับโครงสร้าง DB ทั้งหมด)
```

---

## 🚀 การติดตั้งและรันในเครื่องสำหรับนักพัฒนา (Local Development)

### ข้อกำหนดเบื้องต้น (Prerequisites)
* **Node.js:** เวอร์ชัน 20 หรือสูงกว่า
* **Package Manager:** `pnpm` (ห้ามใช้ npm/yarn ตามกฎ Hard Rules)
* **Supabase CLI:** (แนะนำสำหรับการรันและทดสอบ Migration)

### ขั้นตอนการรัน (Step-by-Step Guide)

1. **โคลนคลังโค้ด:**
   ```bash
   git clone https://github.com/solamon2525/kampai-school.git
   cd kampai-school
   ```

2. **ติดตั้ง Dependencies ด้วย pnpm:**
   ```bash
   pnpm install
   ```

3. **ตั้งค่า Environment Variables:**
   คัดลอกไฟล์ `.env.example` เป็น `.env` แล้วระบุค่า:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   RESEND_API_KEY=your-resend-api-key
   ```

4. **ทดสอบรัน Development Server:**
   ```bash
   pnpm dev
   ```
   เปิดเบราว์เซอร์ที่ [http://localhost:5173](http://localhost:5173)

5. **ตรวจสอบความสมบูรณ์ก่อน Deploy (Build Verification):**
   ```bash
   pnpm build
   ```

---

## 📜 ประวัติการพัฒนาและสถานะล่าสุด (Release & Milestones)

| เวอร์ชัน | วันที่อัปเดต | ไฮไลท์ฟีเจอร์สำคัญ |
|---|---|---|
| **v1.229.140** | 2 ต.ค. 2569 | **อัปเดตเอกสารระบบฉบับสมบูรณ์ (Comprehensive README.md):** รวบรวม 9 ระบบงานหลัก, ผังสิทธิ์, สถาปัตยกรรม และ Tech Stack ปัจจุบัน |
| **v1.229.139** | 2 ต.ค. 2569 | **ปลดล็อกสิทธิ์ RLS นักเรียนปัจจุบัน (Exam Online):** เปิดสิทธิ์ให้อ่านข้อมูลนักเรียน active ได้ 100% ทุกเครื่อง พร้อมระบบ Instant Refetch เมื่อใส่รหัส PIN ถูกต้อง |
| **v1.229.138** | 2 ต.ค. 2569 | **Safe Public Student Roster RPC (Migration 566):** สร้าง RPC เฉพาะทางสำหรับดึงรายชื่อและรูปถ่าย Avatar ของนักเรียนโดยไม่เปิดเผยข้อมูลส่วนบุคคล PDPA |
| **v1.229.137** | 2 ต.ค. 2569 | **คลังข้อสอบวิชาประวัติศาสตร์ ป.4 (+50 ข้อ):** เพิ่มข้อสอบระดับพื้นฐานที่เหมาะสมกับวัยเด็กไทย ครบ 4 หัวข้อย่อย รวมยอดเป็น 385 ข้อ |
| **v1.229.136** | 2 ต.ค. 2569 | **คลังเหตุผลสำเร็จรูปธนาคารความดี (150+ Presets):** สกัดและบรรจุเหตุผลจริงของครูจากการบันทึกในโรงเรียนลงในระบบ Conduct Management |
| **v1.229.135** | 2 ต.ค. 2569 | **คลังคำศัพท์และภาพนิทาน Vocab Hub (+74 ภาพ):** เติมเต็มภาพวาดประกอบคำศัพท์ 512×512 WebP สไตล์นิทานเด็กครบ 100% กลุ่มที่ 1 |
| **v1.229.130** | 1 ต.ค. 2569 | **ระบบสังเคราะห์เสียงอ่านผลสอบภาษาไทย (Thai TTS):** อ่านคะแนนและผลการสอบเป็นเสียงพูดภาษาไทยอัตโนมัติ |
| **v1.229.120** | 1 ต.ค. 2569 | **ระบบสุ่มสลับข้อสอบและตัวเลือก (Fisher-Yates Shuffle):** สุ่มสลับข้อสอบและชอยส์อัตโนมัติเพื่อป้องกันการลอกข้อสอบ |
| **v1.200.0** | ก.ย. 2569 | **ระบบแข่งขันตอบปัญหาห้องเรียนสด (Realtime Classroom Competitions):** แข่งขันตอบคำถามข้ามห้องเรียนแบบสด |
| **v1.150.0** | ส.ค. 2569 | **ระบบธนาคารความดีและฮีโร่คุณธรรม (Virtue Bank & Kampai Hero):** เปิดใช้งานระบบสะสมแต้มความดีและร้านค้าแลกรางวัล |
| **v1.100.0** | ก.ค. 2569 | **คลังเกมการศึกษาดิจิทัล 100+ เกม (Educational Hub & SDK):** พัฒนาระบบ Kampai SDK รองรับ Solo, Hot-Seat, และ Online Versus |
| **v1.50.0** | มิ.ย. 2569 | **ระบบงานสารบรรณอิเล็กทรอนิกส์ (E-Saraban) & ระบบลงนามดิจิทัล:** ทะเบียนรับ-ส่ง คำสั่ง ประกาศ และเซ็นชื่อดิจิทัล |
| **v1.0.0** | เม.ย. 2569 | **เปิดตัวแพลตฟอร์มโรงเรียนบ้านคำไผ่ (Initial Public Launch)** |

---

## 🏫 เกี่ยวกับโรงเรียนบ้านคำไผ่

* **ที่ตั้ง:** โรงเรียนบ้านคำไผ่ สำนักงานเขตพื้นที่การศึกษาประถมศึกษา
* **วิสัยทัศน์:** มุ่งมั่นพัฒนาผู้เรียนสู่ความเป็นเลิศ ควบคู่คุณธรรม จริยธรรม และทักษะชีวิตในยุคดิจิทัล
* **ลิขสิทธิ์:** สงวนลิขสิทธิ์ © 2568-2569 **โรงเรียนบ้านคำไผ่**  
  *แพลตฟอร์มนี้พัฒนาเพื่อประโยชน์ทางการศึกษาของนักเรียน ครู บุคลากร และชุมชนบ้านคำไผ่*
