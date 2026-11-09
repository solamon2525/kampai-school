# Plan: Restore English Vocab Hub (Math Feature) & Audit Teaching Media Catalog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the missing English Vocabulary Hub (`public/games/english/vocab-hub.html`) featuring spoken math arithmetic ("what is one minus one") to teacher profiles and catalog, fix RPC deduplication, and catalog orphaned teaching media across other subjects.

**Architecture:**
1. SQL migration `586_restore_vocab_hub_and_audit_media.sql` to reactivate English Vocab Hub item `58ca7383-8b28-4628-a73e-f3d326f10868`, enrich metadata (`grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6']`, title `📚 คำศัพท์ภาษาอังกฤษ ป.4–6 (English Vocab Hub)`), and update `get_public_media_catalog` RPC to use URL-based deduplication so multi-teacher ownership works cleanly.
2. Seed uncataloged high-value interactive teaching media (`weather-seasons-media.html`, `agriculture-basics-media.html`, `cooking-basics-media.html`, etc.) whose worksheets already exist in `educational_hub_items`.
3. Regenerate TypeScript types and verify teacher hub counts and game SDK compliance.

**Tech Stack:** Supabase PostgreSQL, SQL Migrations, TypeScript, Vite/React, Kampai SDK.

**Spec:** User request to locate missing English math addition/subtraction learning media ("what is one minus one") and audit missing media across other subjects.

## Global Constraints
- Package manager: pnpm only.
- Never edit past migrations (create `586_restore_vocab_hub_and_audit_media.sql`).
- Light mode only, CSS vars (`bg-background`, `bg-card`, `text-foreground`).
- Types generated via `supabase gen types typescript --local > src/integrations/supabase/types.ts`.
- Conventional Commits + co-author attribution.

## Review Focus
1. Multi-teacher media ownership: Re-publishing `58ca7383` for ครูณัฐพงศ์ without breaking `2cc2e12b` for ครูมะลิวัลย์ or showing duplicate cards in public explorer.
2. Badge count consistency: ครูณัฐพงศ์'s `คลังสื่อการสอน` count increases from 124 to 125+ immediately.
3. Math feature integrity: Verify that `vocab-hub.html` renders and speaks arithmetic operations correctly.
4. Paired media and worksheet linkages: Ensure paired worksheets (`/games/english/weather-seasons-worksheet.html`, etc.) link bidirectional with their media.
5. Schema stability: Type generation succeeds with 0 errors.

---

### Task 1: Migration 586 — Restore English Vocab Hub & Upgrade Media RPC

**Files:**
- Create: `supabase/migrations/586_restore_vocab_hub_and_audit_media.sql`
- Test: `scripts/test-media-catalog.mjs`

**Interfaces:**
- Consumes: `educational_hub_items`, `educational_hub_categories`, `game_docs`
- Produces: Updated `get_public_media_catalog(p_subject text)` returning deduplicated rows by `external_url`

- [ ] **Step 1: Write test script to verify missing media state**

Create `scripts/test-media-catalog.mjs` verifying:
1. Item `58ca7383-8b28-4628-a73e-f3d326f10868` is published.
2. `get_public_media_catalog('ภาษาอังกฤษ')` returns exactly one English Vocab Hub item without duplicates.
3. ครูณัฐพงศ์ (`a5f53911-b9cb-465a-b963-7202bcb907b1`) has English Vocab Hub in his published items.

- [ ] **Step 2: Run test script to verify failure on current database**

Run: `node scripts/test-media-catalog.mjs`
Expected: FAIL (`58ca7383` is unpublished, count is 124).

- [ ] **Step 3: Create migration `586_restore_vocab_hub_and_audit_media.sql`**

Write SQL to:
1. Re-publish `58ca7383-8b28-4628-a73e-f3d326f10868`:
   - `is_published = true`
   - `title = '📚 คำศัพท์ภาษาอังกฤษ ป.4–6 (English Vocab Hub)'`
   - `grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6']`
   - `updated_at = NOW()`
2. Update `get_public_media_catalog(p_subject text)`:
   - Use `DISTINCT ON (i.external_url)` prioritizing `tracked_game = true`, `sort_order ASC`, `created_at ASC`.
   - Maintain ordering by subject preference and sort order.
3. Catalog high-value media currently missing from `educational_hub_items`:
   - `weather-seasons-media.html` (ภาษาอังกฤษ, ป.4)
   - `agriculture-basics-media.html` (การงานอาชีพ, ป.4–6)
   - `cooking-basics-media.html` (การงานอาชีพ, ป.4–6)
   - `housework-craft-media.html` (การงานอาชีพ, ป.4–6)
   - `homophone-context-media.html` (ภาษาไทย, ป.4–6)
   - `civic-duty-media.html` (สังคมศึกษา, ป.1–3)
   - `map-directions-media.html` (สังคมศึกษา, ป.1–3)
   - `thai-regions-media.html` (สังคมศึกษา, ป.4–6)

- [ ] **Step 4: Apply migration 586 via Supabase MCP tool**

Execute migration using Supabase `apply_migration` or `execute_sql`.

- [ ] **Step 5: Run test script to verify all assertions pass**

Run: `node scripts/test-media-catalog.mjs`
Expected: PASS (English Vocab Hub published, public catalog deduplicated, teacher count $\ge$ 125).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/586_restore_vocab_hub_and_audit_media.sql scripts/test-media-catalog.mjs
git commit -m "feat(edu-hub): restore english vocab hub and deduplicate media catalog"
```

---

### Task 2: TypeScript Types & Pair Linkages Verification

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/lib/edu-hub-worksheet-pairs.ts`
- Modify: `src/lib/edu-hub-game-media-pairs.ts`
- Test: `pnpm build`

**Interfaces:**
- Consumes: Supabase DB schema
- Produces: Updated types and paired links for newly cataloged media items

- [ ] **Step 1: Regenerate TypeScript types**

Run: `pnpm exec supabase gen types typescript --local > src/integrations/supabase/types.ts`
Verify: No syntax errors and `types.ts` compiles.

- [ ] **Step 2: Update pair mappings for newly cataloged media**

Ensure `weather-seasons-media.html` pairs with `weather-seasons-worksheet.html` and `agriculture-basics-media.html` pairs with `agriculture-basics-worksheet.html` in `edu-hub-worksheet-pairs.ts`.

- [ ] **Step 3: Run build and typecheck**

Run: `pnpm build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts src/lib/edu-hub-worksheet-pairs.ts
git commit -m "chore(types): regenerate supabase types and sync media worksheet pairs"
```

---

### Task 3: Comprehensive End-to-End Verification & Documentation Sync

**Files:**
- Modify: `src/components/admin/system/SystemOverview.tsx` (versionHistory entry)
- Test: `pnpm verify:game:all -- public/games/english/vocab-hub.html`

- [ ] **Step 1: Verify English Vocab Hub game & media integration**

Run: `pnpm verify:game:all -- public/games/english/vocab-hub.html`
Expected: All 12 checks PASS.

- [ ] **Step 2: Add versionHistory entry in `SystemOverview.tsx`**

Add entry explaining the restoration of English Vocab Hub (Math arithmetic challenge) and catalog enhancement under Migration 586.

- [ ] **Step 3: Run git status check and push**

Run: `git status -sb`
Commit & push to `origin/main` according to workspace rules.
