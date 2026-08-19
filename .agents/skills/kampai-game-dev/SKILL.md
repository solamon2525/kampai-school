---
name: kampai-game-dev
description: Build, modify, port, debug, verify, document, and ship games for kampai-school. Use for HTML/folder games, React ports, orientation-aware games, AR/camera/hand tracking, KAMPAI SDK scoring, local or online versus, game generators/templates, game_docs migrations, covers, browser QA, and production game regressions under public/games.
---

# Kampai Game Dev

Follow this workflow in order. Keep changes surgical and treat automated verification as a release gate.

## 1. Discover

1. Read `GAME.md` and `references/quality-contract.md`.
2. Read the matching variant reference:
   - Standard folder game: `references/standard-games.md`
   - Local/online competition: `references/versus-online.md`
   - Portrait/landscape behavior: `references/orientation.md` and `ORIENT-GAME.md`
   - Camera, body, or hand tracking: `references/ar-games.md` and `AR-GAME.md`
3. Inspect `AGENTS.md`, `.agents/game_studio/technique-library.md`, the target game, and one similar verified game.
4. Run the five-part pre-flight: DB Schema, Auth, Redundancy, Layout, Feasibility.
5. Surface only assumptions that materially change gameplay, data, or rollout.

## 2. Design the contract

Before editing, state the player goal, audience/grade, round start/end, scoring formula, modes, inputs, failure/recovery behavior, and acceptance tests. Classify risk with `references/test-matrix.md`.

Require deterministic round state where competition or replay depends on identical questions. Define cleanup ownership for every timer, listener, animation frame, audio source, network subscription, and camera instance.

## 3. Scaffold

For a new game run:

```sh
pnpm create:game -- --subject <subject> --slug <slug> --type standard|versus|orient|ar-zone|ar-hands
```

Review every generated TODO before implementation. Never overwrite an existing path or guess a migration number. Use the generated migration draft and keep the game entry plus `game_docs` upsert atomic.

## 4. Implement

- Use `/games/kampai-sdk.js`; do not add Firebase, player-name inputs, or direct portal navigation.
- Call `KAMPAI.beginRound()` at the first playable moment of every round.
- Submit once at a real solo game end. Practice must never submit. Let KampaiVersus own competitive completion.
- Keep Thai-first UI, 360px support, 44px controls, keyboard/pointer/tap paths, visible focus, reduced-motion behavior, and non-audio feedback.
- Use explicit lifecycle functions: start, pause/resume where relevant, finish, and cleanup. Restart through cleanup plus start; do not reload the page.
- Include stable `data-kampai-action` hooks on start, finish/test end, restart, practice, and answer/control surfaces that browser QA must drive.
- Use a visible fallback for runtime, asset, SDK, camera, and network failures.

## 5. Verify

Run the narrowest checks during development, then the full gate:

```sh
pnpm verify:game <game-path>
pnpm verify:game:browser -- <game-path>
pnpm verify:game:all -- <game-path>
```

`verify:game` must produce a deterministic exit code and JSON report. Any skipped required check is a failure for a new or modified game. Browser verification must use HTTP, inspect console/page errors and overflow at required viewports, and exercise two complete rounds. For AR, CI uses a camera mock; manually verify real-camera and tap fallback before shipping.

If `rtk` is unavailable, record that once and run the exact fallback command. Do not claim browser, camera, or multiplayer verification that was not performed.

## 6. Document and ship

- Update or add the migration with the seeded game and `game_docs` build/version in the same file.
- Sync `GAME.md`, templates, design/component docs, and `SystemOverview.tsx` version history when their contracts change.
- Review `git status -sb` and the scoped diff. Stage only this task's files.
- Commit and push only after all applicable gates pass and the branch/remote are safe.
- Report changed game files, migration and `game_docs`, commands/results, browser/manual checks, commit, and deployment state.

## Conditional skill routing

Use installed skills without copying their guidance into this skill:

- Use `vercel:agent-browser-verify` after starting a dev server when browser automation or visual QA is required.
- Use `vercel:verification` for a full player journey before a high-risk release.
- Use `imagegen` only for 1280x720 covers with the Thai-title safe zone, not as a default gameplay-asset generator.
- Use `vercel:react-best-practices` after editing multiple TSX game/wrapper components.
- Use `codex-security:security-diff-scan` when adding dependencies, network input, iframe messaging, camera access, or multiplayer behavior.

If a routed skill is unavailable, continue with the repository verifier and report the missing capability.
