# Risk-based Test Matrix

| Risk | Required verification |
|---|---|
| All games | Static contract, migration/game_docs, jsdom render, three viewports, console/page errors, overflow, two rounds, direct-open fallback |
| Timed/animation | Visibility pause, cleanup, restart, reduced motion, extreme frame gap |
| Versus/online | Seed determinism, solo twice, local P1/P2 isolation, online unavailable/disconnect |
| Orientation | Portrait/landscape, rotate during play, state preservation, overlay pause |
| AR/camera | Mock stream in CI, denial/unavailable, cleanup/restart, tap fallback, manual real device |
| React/wrapper | Build, focused component tests, React best-practices review when multiple TSX files change |
| New dependency/network boundary | Security diff review and failure/offline behavior |
