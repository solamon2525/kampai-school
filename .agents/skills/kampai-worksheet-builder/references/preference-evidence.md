# Preference evidence ledger

This is an append-only decision record. Never rewrite an old entry; append a `superseded` entry that links to it.

## Status policy

- `candidate`: one supported occurrence; not a rule.
- `proposed`: the same pattern appeared in a second independent task and awaits approval.
- `approved`: the user explicitly accepted the wording and scope.
- `rejected`: the user declined it; do not resurface without new contradictory evidence.
- `superseded`: a later approved decision replaces it.

Only an explicit user instruction, selection between alternatives, or acceptance of a delivered comparison counts. Experiments, exceptions, agent inference, and repeated edits within one task do not increment occurrence count.

## Entry schema

```md
### PREF-YYYYMMDD-NNN — short title

- Status: candidate|proposed|approved|rejected|superseded
- Scope: shared|media-only|worksheet-only|subject/activity-specific:<name>
- Occurrence: 1|2
- Independent task: task/commit identifier
- Source artifact: repository path
- User evidence: concise instruction, selection, or acceptance; do not infer intent
- Reason: learner or teacher outcome
- Before: artifact path plus SHA-256, or `not available` with reason
- After: artifact path plus SHA-256
- Diff/report: artifact path plus SHA-256
- Proposed rule: exact wording, or `none`
- Verifier: deterministic check name, or `browser review`
- Related entry: PREF id or `none`
```

Comparison artifacts belong under `.artifacts/learning-preferences/` locally or in CI artifacts. Do not commit generated PNG or PDF files.

## Historical bootstrap candidates

These are navigation leads only. Reconstruct evidence before creating a formal entry.

- Long division: `08a6ff9`, `b4a4aea`, `11660f2`, and `22f6f99` suggest recurring handwriting-space, alignment, and dead-space concerns.
- Game 24: `d018a61` and `4e1ff90` suggest uniqueness, meaningful operations, and exact-division variety concerns.
- Fraction visuals: the fraction-pieces upgrade suggests mathematically exact visuals and activity-dependent 6-large/8-compact density.
- Screen/print parity: use existing overflow and answer-reveal history only when a before/after pair can be reproduced.

None of these candidates is approved or may override `WORKSHEET.md` or `MEDIA.md`.

### PREF-20260827-001 — cap dense multi-step two-column worksheets at eight

- Status: approved
- Scope: worksheet-only
- Occurrence: 2
- Independent task: long-division density revisions and mixed-number worksheet revision ending after commit `ca68c45`
- Source artifact: `public/games/math/improper-to-mixed-worksheet.html`
- User evidence: user reported that 10 questions made the font too small, selected “เพิ่มกฎแบบแคบ”, and approved a default cap of eight for two-column worksheets with at least three steps
- Reason: preserve readable type and handwriting space without restricting short fluency practice
- Before: `22e12201648395b1b64f9450bd34cb6dfeb5716fe762f19f291d5227ad0c4b42`
- After: `50d4266e40533612c036c49785df8571fe2823251276f1db52d8b810f2b9840e`
- Diff/report: browser comparison and A4 measurement from the implementation verification
- Proposed rule: For two-column calculation worksheets with at least three written scaffold steps per problem, start at no more than eight questions per page. Use ten only when HTTP browser and 100% A4 evidence confirm readable type and genuinely writable slots.
- Verifier: target validator plus HTTP browser/A4 measurement
- Related entry: historical long-division bootstrap candidate
