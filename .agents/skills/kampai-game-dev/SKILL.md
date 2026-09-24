---
name: kampai-game-dev
description: Use when creating, porting, or changing Kampai games, game SDK integration, scoring, or game release checks.
---

# Kampai Game Dev

Use GAME.md as the source of truth for SDK integration, scoring, three modes, migration/game_docs and release gates. Read relevant sections instead of the full manual for every edit.

## Read by task

| Change | Read |
|---|---|
| Text/content or a focused game fix | Target files and affected GAME.md contract; no scaffold or full design ceremony |
| Scoring, restart or SDK | GAME.md scoring and SDK sections, [quality contract](references/quality-contract.md), wrapper/SDK ownership where affected |
| New game or substantial gameplay | GAME.md decision tree, [standard games](references/standard-games.md), [quality contract](references/quality-contract.md), closest verified game and chosen template |
| Local/online behavior | [versus](references/versus-online.md) and GAME.md framework sections |
| Orientation | [orientation](references/orientation.md) and affected ORIENT-GAME.md sections |
| Camera/body/hands | [AR](references/ar-games.md) and affected AR-GAME.md engine/lifecycle sections |

For a new game, state the player goal, grade, round boundaries, scoring, inputs and acceptance checks. Check schema/auth only where data or permissions are involved; inspect redundancy/layout/feasibility for the proposed change. Ask only about missing decisions that materially change the result. Existing approved designs do not need approval again.

## Implement within the contract

- Retain solo, local hot-seat and online via KampaiVersus as required by GAME.md; do not ask whether to add these standard modes.
- Use KAMPAI SDK. Call `KAMPAI.beginRound()` at every playable round start. Solo submits once at a real end; practice never submits; framework owns competitive completion.
- Preserve lifecycle cleanup, accessible inputs, user-triggered audio/camera, deterministic competitive rounds and visible failure fallbacks. See quality contract for details.
- For new games use `pnpm create:game -- --subject <subject> --slug <slug> --type standard|versus|orient|ar-zone|ar-hands`; inspect the generated TODOs and never overwrite an existing path.
- Register changes and versioned `game_docs` in a new migration per GAME.md. Never edit an applied migration. Apply to the verified target within authorized scope and verify the resulting rows; writing SQL alone does not publish. No additional seed script by default.

## Verify once per final change

During development run the narrowest affected check. Before shipping a changed game run `pnpm verify:game:all -- <game-path>` once: it includes static strict and browser verification. Do not separately repeat both component commands after a passing aggregate run.

Use [test matrix](references/test-matrix.md) for additional affected behaviors. Verify HTTP, console/page errors, overflow and two complete rounds; camera changes also need real-device and tap-fallback evidence. Shared SDK/template changes require affected consumers and tooling regressions. Build only when React/app/wrapper or build integration changes.

For documentation-only changes, validate instructions, references and skill metadata; run affected tooling tests if they assert the changed contracts. Whole-site build/browser and new game_docs migrations are not required when no game behavior, content or registration changes.

## Ship

Follow root AGENTS.md for command fallback, documentation and scoped automatic commit/push. Update contract documents only when their rules change. Stop publishing if a required check fails or is unavailable; report the exact gate. Report actual verification, migration/game_docs, commit and deployment state separately.

## Optional specialist routing

Use browser verification skills when automating a player journey, React guidance for affected TSX, and security diff review when changing trust boundaries. Use imagegen for requested covers. Load only the skill whose workflow is needed; do not copy or repeat its checks here. Missing optional skills do not replace required evidence.
