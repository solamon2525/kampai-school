# Instruction and skills cleanup — 2026-09-15

## Scope and decisions

Approved scope: repository instructions and two machine-level skills. Keep all three game modes (solo/local/online), existing runtime behavior, RLS, browser/A4 evidence, and scoped automatic publication. No production data changes or product version bump are needed for this documentation-only change.

Root AGENTS.md routes readers to relevant contract sections. GAME.md owns modes, score submission, SDK details and migration publication. WORKSHEET.md §7 owns impact-based verification; detailed worksheet implementation guidance remains in the skill reference. Certificate import steps moved to `docs/operations/import-training-certificates.md`.

## Before/after scenario review

This is a document-driven scenario evaluation, including an independent read-only review. It is not a behavioral benchmark or a measurement of time/token savings.

| Scenario | Previous instructions | Revised instructions |
|---|---|---|
| Worksheet typo | Full manuals, template/runtime reading, full catalog and build | Target content contract, target verifier, affected HTTP/browser and A4 evidence |
| Shared worksheet runtime | Full catalog and unconditional build | Full affected catalog/browser/A4; build when app/wrapper/build integration changes |
| New game | Ask about multiplayer despite mandatory three modes; separate seed script; component and aggregate checks | Keep three modes through KampaiVersus; new migration plus game_docs; aggregate gate once |
| Practice score bug | Some references said submit on every game end | Practice sends zero; solo once per real round end; framework owns competition |
| Ambiguous feature | Broad skill triggers and universal approval ceremony | Inspect facts, ask material intent/tradeoff questions; clear authorized work proceeds |

Review also corrected the public prompt's optional-online section, legacy API checklist wording and missing `beginRound()` fallback methods. Existing application source and migrations were not modified by this task.

## Validation

- `pnpm test:learning-preferences`: passed (four routing cases plus promotion/scope/comparison assertions).
- `pnpm test:game-tooling`: passed (five templates and six bug classes).
- Official `quick_validate.py`: all four changed skills passed. The bundled Python lacked PyYAML; installed it only in the untracked audit output directory for validation.
- Local Markdown link scan: 31 links across 12 changed/related instruction files resolved.
- Scoped Git whitespace check and review performed before publication.
- No whole-site build/browser run: no UI/runtime implementation changed. This does not certify overall production health.

## Machine-level changes and preservation

Updated `using-superpowers/SKILL.md` and `brainstorming/SKILL.md` under the user's `.codex/skills` directory. These are local machine files, not part of the repository commit. Original copies and prepared drafts are retained in `output/instruction-audit/` locally.

Unrelated working changes are excluded. For `.agents/AGENTS.md`, stage only this task's score/mode/publication/verifier corrections from the original Git version; retain the user's pre-existing content edits in the working file. The duplicate AR block introduced in those working edits is reduced to one copy locally without including the unrelated draft content in this commit.
