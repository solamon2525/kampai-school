# Game Quality Contract

Apply every required item unless the game type makes it impossible; document any exception.

## Lifecycle and correctness

- A round has one explicit start and one terminal end.
- `KAMPAI.beginRound()` runs when play becomes possible, including restart.
- Solo completion calls `KAMPAI.submitScore()` exactly once. Practice calls it zero times.
- Restart calls cleanup and starts in the same document; it does not reload the iframe.
- Cleanup cancels timers, animation frames, listeners, audio, subscriptions, and camera/hand instances.
- Pause on `visibilitychange` when continuing unseen would disadvantage the player.
- Competitive randomness comes from the framework-provided RNG.
- The game-over view contains the score, clear next action, and `#kampai-result` when SDK results are expected.

## Interaction and accessibility

- Support 360x800, 768x1024, and 1280x720 without horizontal overflow or clipped primary actions.
- Interactive controls are at least 44x44 CSS pixels.
- Keyboard focus is visible and follows a logical order.
- Core play has pointer/touch fallback; AR always has tap fallback.
- Color and sound are never the only signals for success, failure, or state.
- Honor `prefers-reduced-motion: reduce` by removing nonessential motion.
- Status and result changes use appropriate text or `aria-live` regions.

## Resilience and performance

- Show a recoverable error/fallback for SDK, asset, network, and camera failures.
- Avoid unbounded DOM creation, listeners, intervals, and per-frame allocations.
- Keep the main loop responsive; use delta time for movement and cap extreme frame gaps.
- Load only necessary dependencies and avoid new third-party runtimes without approval/security review.
- Direct-open mode may be non-persistent but must render and remain playable without crashing.

## Integration and documentation

- Use the KAMPAI SDK as the portal boundary.
- New or modified seeded games update `educational_hub_items` and upsert `game_docs` atomically.
- Bump `game_docs.version` for gameplay, scoring, feature, or integration changes.
- Cover is 1280x720 (16:9) and keeps Thai titles inside the safe area.
- Provide stable `data-kampai-action` hooks for automated start, answer/control, finish, practice, and restart flows.
