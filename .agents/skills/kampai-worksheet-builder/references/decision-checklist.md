# Worksheet decision checklist

Use this checklist before selecting a layout or declaring completion.

## Pre-flight

- Search for an existing worksheet with the same learning process, not merely the same subject.
- Confirm the paired media file exists and its indicator/grade matches.
- Search migrations and the worksheet catalog to avoid duplicate URL, slug, or `worksheet_key`.
- Inspect the latest migration number from the filesystem; never guess it.
- Check the active worktree for unrelated changes before editing.

## Engine choice

Choose the topic shell when questions can be expressed by its supported scaffold and shared A4 layout.

Choose a specialized worksheet when the student must preserve spatial relationships, including:

- vertical multiplication or long/short division;
- place-value or decimal alignment;
- geometry diagrams and measurements;
- graphs, tables, timelines, cycles, or labeled scientific diagrams;
- multi-line written reasoning that needs a custom page density.

## Layout evidence

- Select question density only after estimating required writing steps.
- Measure the longest generated case and all teaching modes.
- Test answers hidden and fully revealed.
- Confirm the last question, parent slip, and footer remain visible.
- Confirm text, lines, and cells are large enough for handwriting and distance viewing where requested.
- If one page fails, revise that layout specifically; do not weaken every worksheet globally without evidence.

## Saved-set state

Persist only applicable semantic config fields, such as:

```js
{
  topic,
  grade,
  pageCount,
  count,
  style,
  useMode,
  schoolName,
  teacherName
}
```

Add specialized fields such as calculation format or progression strategy when they change generated questions. Loading a set must restore controls before rendering.

## Completion evidence

- Target verifier passes.
- Full worksheet verifier passes.
- Same-seed reproduction passes.
- New-seed randomization passes.
- Saved config/load/link path passes or the exact auth-dependent portion is explicitly isolated.
- All answer-navigation paths pass.
- HTTP browser and print A4 measurements pass for every required case.
- Production build passes.
- Catalog production parity passes after catalog migration.
- Documentation/version history and migration are atomic with the feature.
