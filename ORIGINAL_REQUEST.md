# Original User Request

## Initial Request — 2026-06-30T23:52:17+07:00

Audit, debug, and verify the score counting and data recording/submission systems in the math games (`catch-numbers` and `math-hand-raising`) to ensure they are fully correct, robust, and correctly integrated with the KAMPAI SDK.

Working directory: d:\kampai-school-main
Integrity mode: benchmark

## Requirements

### R1. Scoring & Stats Calculation correctness
The game must compute and show scores, correct counts, wrong counts, and time-ups properly. The scores and statistics must be accurate in all play styles: Solo play, Local 2-player hot-seat, and Online multiplayer matches.

### R2. SDK & Database Submission correctness
The game must submit scores and statistics to the Kampai School SDK via `KAMPAI.submitScore(...)`, and report real-time scores to the versus system using `vs.report(...)` and `vs.finish(...)`. All database seed entries and migrations must reflect the correct metadata and files.

### R3. File modification containment
All modifications must be strictly contained inside the game directories `public/games/math/catch-numbers/` and `public/games/math/math-hand-raising/`, along with their database seed scripts and SQL migrations.

## Acceptance Criteria

### Automated Quality Checks
- [ ] Run `pnpm verify:game public/games/math/catch-numbers` and ensure it passes with zero warnings or errors.
- [ ] Run `pnpm verify:game public/games/math/math-hand-raising` and ensure it passes with zero warnings or errors.

### Code Quality & Lifecycle Integrity
- [ ] Verify that all interval timers, timeout IDs, and canvas frame loops are fully stopped and cleared upon game completion, pause, or exit.
- [ ] Verify that qrand (seeded RNG) is correctly and uniformly used for all randomized logic (spawn items, math operators) during versus or online matches, and reset back to Math.random for normal solo play.
