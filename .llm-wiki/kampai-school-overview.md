---
source: https://github.com/solamon2525/kampai-school
ingested_at: 2026-04-11
title: kampai-school – Project Overview
tags: [overview, react, supabase, school-website]
---

# kampai-school – Project Overview

**Repo:** https://github.com/solamon2525/kampai-school  
**Description:** School website – kampai school  
**Languages:** TypeScript (primary), PLpgSQL, CSS, HTML, JavaScript

## Purpose
A modern, responsive school website template for Thai schools. Built with React + Vite + Tailwind CSS + Supabase. Provides a public-facing website and a full admin dashboard for content management.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Vite + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Backend / DB | Supabase (PostgreSQL + Storage + RLS) |
| State / Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Routing | React Router DOM v6 |
| Rich Text | React Quill |
| Gallery | react-photo-album + yet-another-react-lightbox |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Deployment | Vercel |

## Key Features
- Public pages: Home, About, News, Gallery, Events, Staff, Administrators, Students, Curriculum, Contact, Enrollment, Documents, Waste Bank, Academic Calendar
- Admin dashboard at `/admin/dashboard` with full CRUD for all content
- Supabase Storage for image/file uploads
- Row Level Security (RLS): public read for published content, full access via `USING (true)` for admin (no auth middleware yet on most tables)
- School settings managed via `school_settings` key-value table

## Environment Setup
- Copy `.env.example` → `.env`
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Run migrations in `supabase/migrations/` in order (001→013)
- Storage bucket `school-images` must be created manually in Supabase dashboard

## Dev Commands
```bash
npm run dev          # start dev server
npm run build        # production build
npm run supabase:reset  # reset local DB (runs all migrations)
```
