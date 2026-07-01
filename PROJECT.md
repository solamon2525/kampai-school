# Project: AR Hand Tracking Enhancements & Calibration Visualizer

## Architecture
- **AR Core Engine (`public/games/kampai-ar.js`)**: Exposes hand coordinates (`leftHand`, `rightHand`) mapped to MediaPipe landmarks (left/right index fingers) in camera mode, or motion centroid in framediff mode.
- **Client Integration**: Games (like `public/games/thai/balloon-burst/`) import `kampai-ar.js` and query `ar.leftHand` and `ar.rightHand` to draw cursors and process collisions.
- **Data & Registration**: Games are registered in Supabase using migrations and node seed scripts. The Calibration tool will be registered as a Technology utility (`tracked_game = false`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Codebase Exploration | Analyze `kampai-ar.js`, other AR games, and registration/testing processes. | none | DONE |
| 2 | AR Engine Enhancements | Implement One Euro Filter, configurable parameters, and robust fallback for JSDOM in `kampai-ar.js`. | M1 | DONE |
| 3 | AR Calibration Utility | Create interactive calibration page in `public/games/ar-calibration/` with 5-file architecture and canvas visuals. | M2 | DONE |
| 4 | Database & Verification | Add Supabase seed/migration, crop generated cover.png to 1280x720, and run verify tools for `balloon-burst` and `ar-calibration`. | M2, M3 | DONE |

## Interface Contracts
### `kampai-ar.js` API
- Getters: `ar.leftHand`, `ar.rightHand` returning `{ x, y, active }` (smoothed coordinates).
- Raw Getters: `ar.rawLeftHand`, `ar.rawRightHand` returning `{ x, y, active }` (unfiltered coordinates), along with `ar.rawX` and `ar.rawY`.
- Configuration (`tuning` object in `window.GAME_CONFIG` or engine defaults):
  - `filterType`: `'ema'` | `'oneeuro'` (default: `'ema'`)
  - `oneEuroMinCutoff`: Minimum cutoff frequency (Hz) (default: `1.0`)
  - `oneEuroBeta`: Speed coefficient (default: `0.007`)
  - `oneEuroDCutoff`: Derivative cutoff frequency (Hz) (default: `1.0`)

