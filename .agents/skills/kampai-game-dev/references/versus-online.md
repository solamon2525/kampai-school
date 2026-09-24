# Versus and Online Games

Use KampaiVersus for solo, local hot-seat, and online modes. Do not build a parallel lobby or persistence layer.

- Use the RNG supplied to `onPlay` for questions, item placement, and tie-sensitive events.
- Call `vs.report()` for progress and `vs.finish()` before the solo submit path.
- Let the framework own competitive timing, switching, comparison, and online submission.
- Clean up the prior player's timers and listeners before a hot-seat turn starts.
- Treat disconnect and unavailable online services as recoverable states with solo or local fallback.
- Verify solo round 1 and 2, local P1/P2 isolation, deterministic same-seed output, and online-unavailable fallback.
