# Standard Games

Use `type=standard` for a folder game and `type=versus` when the primary design is competitive.

1. Prefer the folder template so config, data, logic, style, and markup stay separate.
2. Keep gameplay data immutable; copy or shuffle into round-local state.
3. Drive screens from a small explicit state set such as ready, playing, paused, and finished.
4. Centralize timers and animation-frame IDs in round state and clear them in `cleanupRound()`.
5. Provide keyboard and touch/pointer controls with the same scoring semantics.
6. Use text plus motion/color feedback and honor reduced motion.

Expose `data-kampai-action="start"`, at least one answer/control hook, `finish-test` for deterministic QA when natural completion is slow, and `restart`. The finish-test action may exist only when `?kampai_test=1` is present and must use the real end-game path.
