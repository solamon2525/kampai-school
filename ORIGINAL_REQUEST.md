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

## Follow-up — 2026-07-01T15:21:07+07:00

Please implement the following AR hand tracking system enhancements and visualizer, based on the approved project prompt:

## Context & Files
- Working directory: d:\kampai-school-main
- Primary files:
  1. `public/games/kampai-ar.js`: The central AR wrapper.
  2. Any AR-based games (e.g. `public/games/thai/balloon-burst/` and any others found in `public/games/` referencing `kampai-ar.js`).
  3. A new calibration/debug/visualizer page in `public/games/ar-calibration/` or similar path.

## Tasks & Requirements
1. **Coordinate Smoothing in `kampai-ar.js`**:
   - Implement coordinate smoothing (such as One Euro Filter, Exponential Moving Average - EMA, or similar low-pass filter) to eliminate coordinate jitter for both `leftHand` and `rightHand` landmarks.
   - It should be configurable with parameters (e.g., smoothing factor alpha, or cutoff frequency).
   - Ensure the latency remains extremely low while providing smooth and stable tracking.
   - Maintain the getters `ar.leftHand` and `ar.rightHand` returning `{ x, y, active }` coordinates.
2. **Robust Fallback & JSDOM/Headless Compatibility**:
   - Verify and harden the fallback mechanism when no camera is present, or when running in a headless test environment (e.g., JSDOM).
   - Ensure it falls back gracefully to mouse/touch tap controls without throwing any TypeError or runtime exceptions that crash the game.
   - Ensure proper cleanup of resource handlers (like intervals, timeouts, video streams) upon stop/reset.
3. **Interactive Calibration & Debug Visualizer Screen**:
   - Build a beautiful, responsive calibration tool/page at `public/games/ar-calibration/` (including the 5-file architecture: index.html, style.css, config.js, data.js, game.js) or as a toggleable overlay in `kampai-ar.js`. Let's build a standalone calibration tool/page at `public/games/ar-calibration/`.
   - The visualizer must show:
     - Real-time video feed (if camera is active) or a fallback interactive canvas.
     - Hand pointer trails, current raw vs. smoothed coordinate positions.
     - Interactive controls to adjust smoothing settings (sliders/inputs) in real-time.
     - Visual latency/FPS counters.
     - Clean modern design (rich aesthetics, vibrant accents, dark mode/glassmorphism).
4. **Integration & Verification**:
   - Integrate these changes so that `balloon-burst` (and any other AR games) automatically benefit from the improved tracking/smoothing.
   - Verify that the game passes the verification tool: `pnpm verify:game public/games/thai/balloon-burst` and `pnpm verify:game public/games/ar-calibration` (if created as a standard game).
   - Test compatibility to ensure no regressions in JSDOM smoke tests.
   - Make sure database migrations or seed scripts are updated/created if registering `ar-calibration` as a game item.

Please perform these tasks carefully, following all workspace rules (including the safety check for boilerplate DOM elements, JSDOM path translations, local storageopaque origin exceptions, and non-violent aesthetics).

## Follow-up — 2026-07-01T08:32:11Z

The user has manually edited `public/games/kampai-ar.js` to implement:
- OneEuroFilter class and methods
- Raw coordinate getters (`rawX`, `rawY`, `rawLeftHand`, `rawRightHand`) and st.rawX/Y/LeftHand/RightHand tracking
- Configuration options under `DEFAULT_TUNING`: `filterType: 'ema'`, `oneEuroMinCutoff: 1.0`, `oneEuroBeta: 0.007`, `oneEuroDCutoff: 1.0`
- Filtering of coordinates in both framediff and pose detectors using OneEuroFilter when `filterType === 'oneeuro'`

Please review these changes, make sure the JSDOM/headless compatibility fallback mechanism is robust, proceed with building the calibration tool in `public/games/ar-calibration/`, crop the cover art to 1280x720 (using scripts if available), and run the verification checks.

## Follow-up — 2026-07-14T18:08:30+07:00

ปรับปรุงและพัฒนาเกม AR "จรวดพลังงาน" (energy-rocket) ในวิชาวิทยาศาสตร์ เพื่อเพิ่มความท้าทายในการเล่น โดยปรับความสมดุลของการชาร์จพลังงาน (ไม่ให้พลังงานขึ้นเร็วเกินไป) และเพิ่มลูกเล่น Visual/Audio เอฟเฟกต์กระตุ้นการออกแรง

Working directory: `public/games/science/energy-rocket/`
Integrity mode: development

## Requirements

### R1. การปรับสมดุลระดับพลังงานและการชาร์จ (Energy Balance Tuning)
- ลดอัตราสัมประสิทธิ์การเติมพลังงานจากทั้งการขยับร่างกาย (onEnergy ใน game.js และ CHARGE_K ใน config.js) และการแตะปุ่มกดออกแรง (TAP_K ใน config.js) เพื่อไม่ให้ชาร์จจรวดเต็มเร็วเกินไป
- ปรับจูนค่าพารามิเตอร์ต่างๆ (เช่น CHARGE_K, TAP_K, DRAIN) ให้สมดุล โดยอ้างอิงจากการจำลองการเคลื่อนไหวที่สมจริง (เช่น ขยับตัวต่อเนื่องควรใช้เวลาประมาณ 6-10 วินาทีจึงจะเต็ม และการกดปุ่มรัวควรใช้การกดประมาณ 35-50 ครั้ง)
- เพิ่มอัตราการลดของพลังงานชาร์จเมื่อหยุดนิ่ง (DRAIN) เพื่อกดดันและบังคับให้ผู้เล่นขยับตัวต่อเนื่อง

### R2. การเพิ่มเอฟเฟกต์กระตุ้นเชิงการเคลื่อนไหว (Visual & Shake Effects)
- เพิ่มเอฟเฟกต์สั่นสะเทือน (Shake Animation) ให้กับกราฟิกตัวจรวด โดยความแรงของการสั่นจะต้องแปรผันตามระดับพลังงานชาร์จในปัจจุบัน (ยิ่งพลังงานใกล้เต็ม จรวดจะสั่นไหวและมีแรงขับไอพ่นเรืองแสงมากขึ้น)
- ปรับเปลี่ยนสไตล์หรือข้อความ HUD เพื่อบ่งบอกสถานะการควิกชาร์จหรือการเตือนความหน่วงให้สนุกยิ่งขึ้น

## Acceptance Criteria

### ความสมดุลของพลังงานชาร์จ
- [ ] สปริงตัวเลขพลังงานชาร์จเพิ่มขึ้นอย่างสมดุล ไม่พุ่งเต็ม 100% ภายใน 1-2 วินาที
- [ ] ปุ่มแตะออกแรง (fallback) ต้องแตะมากกว่า 30 ครั้งเพื่อชาร์จเต็ม
- [ ] หากผู้เล่นหยุดขยับตัว พลังงานสะสมจะค่อยๆ ไหลลงอย่างต่อเนื่อง ป้องกันการค้างชาร์จ

### การแสดงผลและการตรวจสอบ
- [ ] ตัวจรวดมีวิชวลเอฟเฟกต์สั่นและเร่งเครื่องสัมพันธ์กับค่าพลังชาร์จอย่างชัดเจน
- [ ] ผ่านเกณฑ์การรัน `verify:game public/games/science/energy-rocket` ครบ 11/11 Checks

## Follow-up — 2026-09-15T13:50:04Z

# Comprehensive Bug & Quality Audit for English Educational Media

Conduct an in-depth, rigorous code and runtime audit across Kampai School's primary English educational media:
1. `public/games/english/vocab-hub.html` (Vocabulary Hub — 29 topics, 14 game modes, Lightbox 3x)
2. `public/games/english/everyday-conversation-p4-media.html` (Everyday Conversation P.4 — guided dialogue, speech recognition, audio playback)

Working directory: `d:/kampai-school-main`
Integrity mode: development

## Requirements

### R1. Root Cause Analysis: TTS Double-Speech Bug
- Thoroughly trace the audio lifecycle in `vocab-hub.html` (and `everyday-conversation-p4-media.html` if applicable):
  - Investigate card click vs tap double event triggers (`click` + `touchend`, or bubbling from child elements like sound button inside card).
  - Investigate speech synthesis queue collision: race conditions between `speechSynthesis.cancel()` and concurrent `speechSynthesis.speak()`.
  - Check mode transitions (e.g. autoplay timer step firing concurrently with manual word selection).
  - Check Lightbox 3x modal audio triggers vs underlying cell audio handlers.
- Document exact code lines, trigger conditions, and concrete code patches to eliminate double-speech completely.

### R2. Comprehensive Code & Logic Audit Across Game Modes
Audit all 14 interactive modes in Vocab Hub (Auto, Flash, Choice, Match, Listen, Spell, Timed, Type-in, True/False, Flip Race, Word Search, Lightbox 3x, Math, 2-Player Versus):
- **Timer & Lifecycle leaks:** Identify un-cleared intervals (`setInterval`), dangling timeouts (`setTimeout`), or animation frames when switching modes, pausing, or exiting to hub.
- **State desynchronization:** Identify state variables (`curIdx`, `score`, `streak`, `timer`) that fail to reset cleanly or conflict between modes.
- **Input & Event Glitches:** Check double-submission, rapid-click breaking game flow, or modal backdrop event leaks.
- **Content & Vocabulary Integrity:** Audit `vocab-hub-data.js` and inlined `TOPICS` data for missing translations, mismatched Thai pronunciations, broken image paths, or null reference hazards.

### R3. Everyday Conversation P.4 Media Audit
Audit `everyday-conversation-p4-media.html` and its runtime scripts:
- Audio/TTS playback synchronization with dialogue speech bubbles.
- Microphone / Web Speech Recognition error handling and fallbacks when permission is denied or audio fails.
- Step transition reliability, scoring accuracy, and completion events.

### R4. Actionable Audit Report Delivery
Produce a clear, prioritized Markdown report categorized into:
1. **Critical / High Impact Bugs:** (TTS double-speech, game freeze, memory leaks) with root causes and exact code diff solutions.
2. **Medium Impact UX / Classroom Issues:** (Touch target misalignments, timer glitches, mobile responsive flaws).
3. **Low Impact Polish & Minor Inconsistencies:** (Translations, styling edge cases).

## Acceptance Criteria

### Audit Depth & Precision
- [ ] Root cause of the TTS double-speech bug is definitively pinpointed with reproducible scenario and verified code fix.
- [ ] All 14 modes in `vocab-hub.html` are audited for timer cleanup and lifecycle transitions.
- [ ] Dialogue flow, speech recognition, and audio in `everyday-conversation-p4-media.html` are thoroughly audited.
- [ ] The generated audit report provides concrete file paths, line numbers, and copy-paste ready code patches for all reported bugs.
- [ ] Existing verifiers (`pnpm verify:game:all -- public/games/english/vocab-hub.html`) continue to pass without regression.
