---
source: https://github.com/solamon2525/kampai-school
ingested_at: 2026-04-11
title: kampai-school – Routes & Pages
tags: [routes, pages, components, admin]
---

# kampai-school – Routes & Pages

## Public Routes (src/App.tsx)
| Path | Page Component | Notes |
|---|---|---|
| `/` | `Index` | Home page – loaded eagerly (critical path) |
| `/about` | `About` | School about page — แสดง school settings + milestones (จากตาราง `milestones`) + facilities (จากตาราง `facilities`) |
| `/administrators` | `Administrators` | School administrators |
| `/staff` | `Staff` | Teaching & support staff |
| `/students` | `Students` | Student info, achievements, activities |
| `/curriculum` | `Curriculum` | Study programs |
| `/news` | `News` | News listing |
| `/contact` | `Contact` | Contact form |
| `/gallery` | `Gallery` | Photo albums with lightbox |
| `/events` | `Events` | School events |
| `/calendar` | `AcademicCalendar` | Academic calendar |
| `/enrollment` | `Enrollment` | Online enrollment form |
| `/documents` | `Documents` | Downloadable documents |
| `/waste-bank` | `WasteBank` | Waste bank system |
| `/admin` | `AdminLogin` | Admin login |
| `/admin/dashboard` | `AdminDashboard` | Admin dashboard |
| `*` | `NotFound` | 404 |

All pages except Index and NotFound are **lazy-loaded** via `React.lazy()` with a spinner fallback.

## Admin Dashboard Sections (src/components/admin/)
- `about/` – FacilitiesManagement, MilestonesManagement
- `administrators/` – AdministratorsManagement
- `admissions/` – AdmissionsManagement
- `attendance/` – AttendanceManagement
- `curriculum/` – CurriculumManagement, ActivitiesManagement
- `documents/` – DocumentsManagement
- `events/` – EventsManagement, EventForm
- `faq/` – FaqManagement ⚠️ admin-only, ไม่มี public route `/faq` (ใช้ตาราง `faq` ที่ไม่มี migration)
- `gallery/` – GalleryManagement, AlbumList, AlbumForm, PhotoManager
- `messages/` – MessagesManagement
- `news/` – NewsManagement, NewsList, NewsForm
- `settings/` – SettingsManagement
- `staff/` – StaffManagement
- `students/` – StudentsManagement, GradeDataManagement, StudentCouncilManagement, StudentStatsManagement
- `waste-bank/` – WasteBankManagement
- `shared/` – AdminLayout, ConfirmDialog, ImageUpload, MultiImageUpload, RichTextEditor

## Home Page Layout (src/components/home/)
- HomeTopBar, HomeNavBar, HomeLeftSidebar, HomeMainContent, HomeRightSidebar, NewsTicker

## Public Section Components (src/components/)
- HeroSection, AboutSection, AdministratorsSection, ContactSection, CurriculumSection, Footer, NavLink, Navbar, NewsSection, SiteHeader
