# Worksheet implementation reference

Read the sections relevant to the changed behavior. Repository contracts take precedence.

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

For two-column calculation worksheets with at least three written scaffold steps per problem, start at no more than eight questions per page. Ten questions are acceptable only after HTTP browser and 100% A4 verification show that the font remains readable and every writing slot accommodates student handwriting.

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

## Continuous rule improvement

When worksheet implementation or verification reveals a new issue that is likely to recur across worksheets, do not leave the lesson only in the current file:

1. record the first supported occurrence as `candidate` using [preference-evidence.md](preference-evidence.md), without changing a permanent rule;
2. after the same pattern appears in a second independent task, prepare a `proposed` rule with wording, scope, before/after evidence, impact, and verifier feasibility;
3. after explicit approval, mark it `approved` and add the smallest rule to the relevant preference profile;
4. append `rejected` or `superseded` decisions rather than erasing history;
5. add a verifier only for deterministic requirements; keep subjective taste in browser comparison review.

Historical commits may bootstrap candidates but cannot bootstrap approval. Urgent correctness or safety fixes may proceed within scope, but broader permanent rules still require approval.

## Verification and publishing

Use the scope matrix in [../SKILL.md](../SKILL.md) and `WORKSHEET.md` §7. Publish under root `AGENTS.md`; report only checks actually run and explicit remaining gates.
