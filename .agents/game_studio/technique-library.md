# Technique Library

Append only. Record techniques that were proven in this repo or from trusted docs/tools.

## Entry Format

```md
## YYYY-MM-DD — Short technique name

- Source: file, tool, PR, incident, docs, or user instruction.
- Applies to: game type, media type, cover type, or workflow.
- Technique: concrete steps.
- Proof: command, screenshot, browser result, or code reference.
- Use next time when: trigger conditions.
```

## Seed Entries

## 2026-07-09 — Game work starts from repo docs

- Source: `GAME.md`, `AR-GAME.md`, `.agents/skills/kampai-game-dev/SKILL.md`.
- Applies to: all game creation, edits, ports, AR work, and cover work.
- Technique: read the relevant docs first, select the template from the decision tree, then run `rtk pnpm verify:game <path>`. If `rtk` is unavailable in the current shell, record that fact and the fallback command used.
- Proof: repo docs define the integration and verification contract.
- Use next time when: any task mentions game, KAMPAI SDK, AR, multiplayer, scoring, leaderboard, cover, or game_docs.

## 2026-07-09 — Cover prompt safe-zone rule

- Source: `.agents/AGENTS.md` cover guidelines.
- Applies to: AI-generated game covers and Canva cover workflows.
- Technique: keep characters, title, and HUD inside the center 60% safe zone; keep top and bottom crop bands as plain background; resize/crop to 1280x720.
- Proof: cover guideline warns that square source images lose top/bottom content during 16:9 crop.
- Use next time when: generating or editing `cover.png` or `{slug}-cover.png`.

## 2026-07-10 — URL-start games must wait for wrapper data

- Source: `public/games/math/multiply-race.html`, `GAME.md` KAMPAI SDK lifecycle rules.
- Applies to: HTML games with URL-driven modes such as `?mode=daily`, research links, daily challenges, seeded rounds, or any mode that depends on `KAMPAI.gameData`.
- Technique: in URL/autostart paths, poll briefly for the required wrapper payload before calling the mode starter; keep the starter guarded so direct clicks show a loading message instead of launching with missing data. Also call `KAMPAI.beginRound()` at the first playable moment and include `<div id="kampai-result"></div>` in the game-over card.
- Proof: implemented in `public/games/math/multiply-race.html`; `pnpm verify:game public/games/math/multiply-race.html` passed and `pnpm build` passed.
- Use next time when: a game auto-starts from URL params, daily challenge data, research assignments, wrapper `init`, or any parent-to-iframe payload.

## 2026-07-10 — Local versus stats need wrapper-side persistence

- Source: `src/pages/PlayGame.tsx`, `public/games/math/multiply-race.html`, `GAME.md` versus/local competition notes.
- Applies to: local hot-seat, split-screen, same-device multiplayer, custom versus events, and games that compute per-player per-table stats in the iframe.
- Technique: have the game send per-player stats in the versus-end payload, then persist both players in the wrapper using the same service path as solo practice. Record sessions for both players, update mastery for both players when per-table stats exist, and refetch mastery after persistence.
- Proof: implemented in `src/pages/PlayGame.tsx` for `versusEnd`; targeted verification with `pnpm verify:game public/games/math/multiply-race.html` and full `pnpm build` passed.
- Use next time when: a same-device versus mode should affect badges, mastery, dashboards, or student progress instead of being only a local visual result.

## 2026-07-10 — Person display changes must include service and RPC photo data

- Source: `AGENTS.md` Person display rule, `src/pages/teacher/TeacherMultiplyRaceDashboard.tsx`, `src/services/multiply-race.service.ts`, `supabase/migrations/386_multiply_race_dashboard_photo_url.sql`.
- Applies to: teacher/admin dashboards, leaderboards, student lists, multiplayer opponent selectors, and any UI that shows a teacher/student/admin name.
- Technique: when replacing name-only UI with `PersonAvatar`, update every data boundary in the same change: TypeScript row type, service/RPC return fields, SQL `SELECT` and `GROUP BY`, and a new migration. If the RPC signature changes, attempt `supabase gen types typescript --local`; if local Supabase is unavailable, record the exact blocker rather than hand-editing generated types.
- Proof: `TeacherMultiplyRaceDashboard.tsx` now renders `PersonAvatar`; migration `386_multiply_race_dashboard_photo_url.sql` returns `photo_url` and updates `game_docs`; type generation was attempted and blocked by missing local container `supabase_db_dpzqnlmgdhwboghfamof`.
- Use next time when: any UI displays a person's name, a dashboard RPC changes shape, or a game/admin feature needs student profile photos.

## 2026-09-02 — Screenshot-led classroom simplification

- Source: user screenshot reviews and revisions to `public/games/math/short-division-thinking-media.html` and `public/games/english/vocab-hub.html`.
- Applies to: classroom games, teaching media, worksheets, projector/fullscreen modes, and child-facing practice UI.
- Technique: open the real page through HTTP at 360×800 and 1280×720, plus a large display when supported; identify contradictory controls, overflow, unreadable content, and unused space; remove non-essential variants and controls; enlarge the single primary learning task; reduce cards or questions per page when needed; then recheck every affected state and capture screenshots as evidence. Prefer one practice pattern per mode, keep required teaching scaffolds, make toggles update every duplicate display immediately, and require explicit user gestures for audio, TTS, camera, and fullscreen. On projector layouts, primary content may scale roughly 5–10× when space permits, but long content must auto-fit and mobile must retain a readable non-overflow layout.
- Proof: short-division practice was simplified from four question types to one full-answer task, then its prompt and choices were enlarged after a screenshot exposed large unused space; Vocab Hub reduced card density for larger images, made Thai-reading visibility consistent across card and heading surfaces, and kept speech non-automatic.
- Use next time when: the user supplies a screenshot, says the screen is contradictory or too small, asks to remove multiple modes, reports unused space, or intends the material for a classroom display.
