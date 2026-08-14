---
name: kampai-worksheet-builder
description: Create, upgrade, debug, verify, register, and publish printable HTML worksheets for the kampai-school repository. Use whenever Codex creates or modifies public/games/**/*-worksheet.html, pairs a worksheet with teaching media, adds worksheet sets or step-by-step answers, fixes A4/print layouts, or audits worksheet feature compliance.
---

# Kampai Worksheet Builder

Build worksheets from repository contracts and existing engines. Do not invent a parallel worksheet system.

## Required reading

Before editing:

1. Read `AGENTS.md` and `WORKSHEET.md` completely from the active worktree.
2. Read `MEDIA.md` when creating or changing the paired teaching media relationship.
3. Inspect `public/games/_template-worksheet.html`, `public/games/worksheet-topic.js`, `public/games/worksheet-runtime.js`, `public/games/worksheet-modes.js`, and the closest subject/scaffold example.
4. Read [references/decision-checklist.md](references/decision-checklist.md).

Repository documents are authoritative when they differ from this skill.

## Establish the contract

Determine from repo evidence before coding:

- subject, grade, curriculum indicators, worksheet slug, `worksheet_key`, and paired media path;
- learning process being assessed and the writing scaffold it requires;
- questions per page based on actual handwriting space, not a preferred generic grid;
- controls required: topic, grade, page count, question count, style, teaching mode, school, and teacher;
- whether a new catalog item/migration is required.

Ask only when missing curriculum intent materially changes the artifact. Otherwise select the closest published pattern and state the assumption.

## Choose the implementation path

- Use `worksheet-topic.css` + `worksheet-topic.js` for a standard topic worksheet whose layout fits the shared shell.
- Use the template plus shared runtime/modes for a specialized process scaffold such as long division, vertical multiplication, geometry drawings, charts, or multi-step calculations.
- Extend a shared engine only when behavior is genuinely common. Do not copy teacher fetch, mode logic, print logic, saved-set logic, or answer-navigation logic into each worksheet.
- Preserve specialized mathematical layout. Never replace vertical work, place-value alignment, diagrams, tables, or observation scaffolds with generic question text.

## Mandatory behavior

Every non-template worksheet must:

- load `worksheet-modes.css`, `worksheet-runtime.js`, and `worksheet-modes.js` with the same current cache version;
- expose repeatable `render()` behavior and use deterministic seeded RNG;
- define a unique stable `worksheet_key`;
- mount the shared worksheet-set toolbar and save every applicable control in semantic config keys;
- reproduce identical questions from the same seed and change the seed on randomize;
- support save, load, and `?set=` sharing through the shared engine;
- hide answers initially and provide previous, next, all, status text, and left/right keyboard navigation;
- reset answer progress after randomize or loading a set;
- reveal answers in reserved positions without changing A4 dimensions;
- include source-media and curriculum-indicator metadata pointing to a real file;
- use the shared teacher runtime and never duplicate Supabase URL, key, REST query, or mutation;
- retain `.toolbar-ctrls`, required hidden or visible controls, `#pages > .sheet`, `.questions > .q`, parent slip, footer, student fields, QR, and print support required by `WORKSHEET.md`.

Use CSS custom properties for new standalone worksheet colors. Ensure grayscale print remains understandable.

## Build the learning scaffold

Translate the learning objective into writable evidence:

- calculation: aligned operands, intermediate work, checking, units;
- geometry: diagram, formula, substitution, calculation, unit²;
- language: word bank, classification/evidence, sentence components, or writing plan;
- science/technology: observation table, sequence, classification, prediction, evidence, or reasoning.

Allocate space for a child's handwriting. If content overflows or writing is cramped, redesign that worksheet case-by-case. Never conceal overflow with clipping.

For arithmetic-puzzle worksheets such as Game 24:

- validate every expression programmatically; do not trust written answer text alone;
- verify that each source number is used exactly as many times as it appears;
- reject neutral-operation padding such as multiplying by one, dividing a number by itself, or adding/subtracting zero merely to consume inputs;
- derive a canonical key from the sorted source numbers and enforce uniqueness across every page in a generated set;
- keep elementary-school intermediate results positive integers unless the learning objective explicitly teaches fractions or negative numbers.

## Registration and documentation

For a new worksheet:

1. Create a new three-digit migration; never edit an old migration.
2. Register the published worksheet catalog URL and indicator links using the current migration pattern.
3. Apply the migration when authorized and run the production parity check.

For any feature or meaningful UX change, update `WORKSHEET.md` when the contract changes and add the newest entry to `src/components/admin/system/SystemOverview.tsx`. Follow `AGENTS.md` documentation discipline and keep documentation atomic with implementation.

## Verification loop

Do not certify from static inspection or `file://`.

1. Run `pnpm verify:worksheet <path>` while iterating.
2. Serve through HTTP and test in a real browser.
3. Verify standard, A–B–C, exit, diagnostic, remedial, longest content, and every supported 5/10/fixed-count layout.
4. Verify initial hidden answers, next, previous, all, keyboard controls, and stable sheet dimensions.
5. Verify randomize changes seed; reload with the same seed reproduces questions; save/load config and `?set=` restore state.
6. Emulate print at 100%. Measure every `.sheet`: content and scroll dimensions must fit A4 without clipping. Check all pages, not only page one.
7. For generated puzzles, verify answer correctness, exact input use, canonical uniqueness across the full multi-page set, and prohibited shortcut patterns with a deterministic checker.
8. Run `pnpm verify:worksheet` for the full catalog and `pnpm build`.
9. When a migration changes published catalog state, run `pnpm verify:worksheet:production` after applying it.

Stop publishing if any required check fails or cannot be performed. Report the exact remaining gate.

## Publish

Follow the automatic commit/push policy in `AGENTS.md`: inspect status and diff, stage only task files, confirm no divergence/conflict/secrets, commit atomically with relevant migration/docs/version history, and push the approved production branch.

Report changed worksheet files, shared files, migration status, browser/A4 cases, verifier totals, build result, documentation locations, commit hash, and push branch.
