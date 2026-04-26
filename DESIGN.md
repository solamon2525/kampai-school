---
version: alpha
name: โรงเรียนบ้านคำไผ่
description: ระบบเว็บโรงเรียนบ้านคำไผ่ โทนสีเขียว+ขาว ฟอนต์ภาษาไทย Sarabun
colors:
  primary: "#157F3C"
  primary-light: "#33AE60"
  primary-pale: "#E5F0E7"
  background: "#FFFFFF"
  foreground: "#14291C"
  muted: "#F0F7F1"
  muted-foreground: "#568165"
  accent: "#33AE60"
  border: "#C8DECE"
  destructive: "#DC2626"
  dark-bg: "#0D2615"
  dark-card: "#122B1D"
  dark-primary: "#3DB866"
typography:
  h1:
    fontFamily: Sarabun
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: Sarabun
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Sarabun
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Sarabun
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: Sarabun
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: Sarabun
    fontSize: 0.75rem
    fontWeight: 700
    letterSpacing: 0.1em
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-secondary:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: 32px
  badge-primary:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  section-label:
    textColor: "{colors.accent}"
    typography: "{typography.label-caps}"
---

## Overview

โรงเรียนบ้านคำไผ่ — ระบบบริหารจัดการโรงเรียนครบวงจร
Live: https://kampai-school.vercel.app

โทนสี **เขียว + ขาว** — สะท้อนสีประจำโรงเรียน
ฟอนต์หลัก **Sarabun** (Google Fonts) รองรับภาษาไทย-อังกฤษ
Dark mode รองรับเต็มรูปแบบ (dark bg: `#0D2615`)

## School Brand Identity

| รายการ | ข้อมูล |
|---|---|
| **ปรัชญา** | นัตถิ ปัญญา สมา อาภา |
| **คำแปล** | แสงสว่างเสมอด้วยปัญญาไม่มี |
| **คำขวัญ** | เรียนดี มีคุณธรรม |
| **อัตลักษณ์** | ยิ้มง่าย ไหว้สวย |
| **สีประจำโรงเรียน** | สีขาว และสีเขียว |

## Colors

สีหลักทั้งหมดอยู่ใน `src/index.css` ผ่าน CSS custom properties (HSL):

- **Primary `#157F3C`** — Forest green เขียวเข้ม ใช้เป็นปุ่มหลัก, header, badge
- **Accent `#33AE60`** — Medium green ใช้เป็น highlight, label, icon
- **Primary-pale `#E5F0E7`** — Light green bg สำหรับ secondary button, section bg
- **Background `#FFFFFF`** — Pure white พื้นหลักหลัก (light mode)
- **Foreground `#14291C`** — Very dark green สำหรับข้อความหลัก
- **Dark-bg `#0D2615`** — เขียวเข้มมากสำหรับ dark mode background

> Tailwind tokens: `bg-primary`, `text-primary`, `bg-accent`, `text-accent`, `bg-secondary`, `text-muted-foreground`, `border-border`
> ห้ามใช้ `bg-white` / `text-black` hardcode — ใช้ CSS vars เท่านั้น

## Typography

ฟอนต์เดียว **Sarabun** (wght 100-800) โหลดจาก Google Fonts ใน `src/index.css`
Tailwind class: `font-sarabun`

```css
fontFamily: { sarabun: ['Sarabun', 'sans-serif'] }
```

## Components

ทุก component ใช้ shadcn/ui primitives จาก `src/components/ui/`
ห้ามแก้ไขตรงๆ — ให้ wrap component ใหม่แทน

- **Button:** `btn-navy` (primary green), `btn-gold` (accent green)
- **Card:** `bg-card rounded-2xl shadow-md border border-border`
- **Section label:** `text-accent font-semibold uppercase tracking-widest text-sm`
- **Hero gradient:** `bg-gradient-to-br from-primary via-primary/90 to-primary/80`

## Spacing & Layout

- Container: `container mx-auto px-4` หรือ `.container-school` (max-w-7xl)
- Section padding: `.section-padding` = `py-16 md:py-20 lg:py-24`
- Responsive breakpoints: sm=640 md=768 lg=1024 xl=1280

## Dark Mode

Dark mode ใช้ class strategy (`darkMode: ['class']`) ผ่าน `next-themes`
Dark bg: `hsl(142 30% 7%)` — เขียวเข้มมาก
Dark primary: `hsl(142 60% 50%)` — เขียวสว่างขึ้นสำหรับ contrast

## AI Agent Notes

- ใช้ CSS vars เสมอ: `bg-background`, `text-foreground`, `border-border`, `bg-card`
- Import icons จาก `lucide-react` เท่านั้น
- State management: TanStack Query v5 (`useQuery`/`useMutation`) — ไม่ใช่ useState+fetch
- Supabase queries ต้องผ่าน `src/services/*.service.ts` เท่านั้น
- ภาษา UI: ภาษาไทยเป็นหลัก
