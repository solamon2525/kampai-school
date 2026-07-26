# Phase 10 — Media + Worksheet Upgrade

**Status:** P0–P7 complete (ship pending commit/deploy)  
**Scope:** all `*-media` / `*-thinking-media` (51) + all `*-worksheet` (68), including hub worksheets  
**Locked decisions:**
- **P3 = A — deepen-in-place**
- **Run phases sequentially** P0 → P7

Audit: `scripts/audit-media-worksheets.mjs`  
Baseline: `output/audit-media-worksheets-baseline.json`

---

## Final metrics (post P0–P7)

| Metric | Before (P0) | After |
|---|---:|---:|
| Media | 51 | 51 |
| Practice FAIL | 7 | **0** |
| Learn FAIL | 7 | **0** |
| Missing covers | 24 | **0** |
| SDK without `?v=` | 51 | **0** (`?v=1.181.0`) |
| Worksheets | 68 | 68 |
| Audit shallow | 15 | **0** |
| Hub shallow | — | **0/17** |
| `verify:media:matrix` | — | **51/51** |
| Lesson packs | 5 | **15** |

---

## Phase checklist

- [x] **P0** Audit + baseline
- [x] **P1** Media contract 51/51
- [x] **P2** Worksheet depth (shallow→0)
- [x] **P3** Hub deepen-in-place 17/17
- [x] **P4** Covers + SDK cache + CI `verify:media:matrix`
- [x] **P5** subjectGuides + modes `?v=1.184.0` + parent-slip audit
- [x] **P6** lesson_packs 15 (437) · seed missing worksheets (438) · remap/unpublish orphans (439)
- [x] **P7** Docs · SystemOverview v1.184.0 · production coverage gate · deploy

### Migrations
- `437_phase10_lesson_packs_expand.sql`
- `438_seed_missing_repo_worksheets.sql`
- `439_phase10_remap_unpublish_orphan_worksheets.sql`
