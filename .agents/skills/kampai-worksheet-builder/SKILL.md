---
name: kampai-worksheet-builder
description: Use when creating or editing Kampai HTML worksheets, teaching media, A4 layouts, or their shared runtimes.
---

# Kampai Worksheet Builder

Classify as media, worksheet, or paired dual-track. Preserve the learning process, shared runtime, and writable scaffold. Read only what the change needs.

## Read by task

| Change | Read |
|---|---|
| Text/content in one artifact | Target file and affected subject/answer requirements in WORKSHEET.md or MEDIA.md; no full manual/template prerequisite |
| Worksheet layout, print, answers or saved sets | Relevant WORKSHEET.md sections, affected runtime/style, and [worksheet contract](references/worksheet-contract.md) sections |
| Shared runtime/style | Contract for the affected behavior, consumers, and [decision checklist](references/decision-checklist.md) |
| New worksheet | WORKSHEET.md core contract, [worksheet contract](references/worksheet-contract.md), [decision checklist](references/decision-checklist.md), closest scaffold and chosen template/runtime |
| Teaching media | Relevant MEDIA.md sections and closest media; load worksheet contract only if the paired worksheet changes |
| Layout choice or user feedback | [media preferences](references/media-preferences.md) or [worksheet preferences](references/worksheet-preferences.md); feedback also uses [preference evidence](references/preference-evidence.md) |

Ask only about missing curriculum intent that materially changes the artifact. Otherwise state a reasonable assumption and proceed within the request.

## Authority and preferences

Apply correctness, safety, curriculum validity, and accessibility; WORKSHEET.md or MEDIA.md; approved preferences in their recorded scope; template defaults.
A narrow preference never overrides a hard contract.
One independent task creates a candidate; the second creates a proposal; only user approval promotes it. See the evidence reference for promotion, rejection and supersession.

Compare layout revisions with the same seed, scenario, data, viewport and print settings using `pnpm compare:learning-artifact -- --kind <media|worksheet> --before <path|ref:path> --after <path|ref:path> --scenario <name> --seed <seed>`. Do not require image comparison for a text-only correction.

## Verify by impact

| Change | Required evidence |
|---|---|
| One worksheet, including a typo | `pnpm verify:worksheet <path>`, HTTP/browser at 360×800 and 1280×720, affected longest content and A4 at 100%; verify edited answers mathematically where relevant |
| New worksheet or layout/behavior change | Above plus every supported mode/count affected, every generated A4 page, no clipping, answer navigation, same/new seed and save/load/share as applicable |
| Shared worksheet runtime/style | Full worksheet verifier plus browser/A4 matrix across affected consumers and behaviors; include deterministic puzzles if their generation changes |
| Media | Target media verifier and HTTP/browser journey per MEDIA.md; paired worksheet checks only if affected |
| React/app/wrapper/build integration | Affected tests and `pnpm build` in addition to artifact checks |
| Catalog migration | Verify local catalog contract; after authorized apply, `pnpm verify:worksheet:production` before claiming production parity |
| Instructions/preferences/comparison tooling | Skill metadata/link checks and `pnpm test:learning-preferences`; no whole-site build/browser for documentation only |

Static checks or file:// never certify UI. Do not repeat passing checks without a new change or unresolved concern. Failed or unavailable required checks block publishing; report the exact gate.

## Document and ship

Follow root AGENTS.md for documentation, command fallback and scoped automatic commit/push. Update only changed contracts. New catalog entries use a new migration, never an applied file. Preserve paired metadata and registration; report migration/production status separately from Git publication.
