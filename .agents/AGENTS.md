# Kampai School Workspace Rules & Guidelines

This document defines workspace-specific behavioral rules, guardrails, and guidelines to ensure quality, prevent runtime bugs, and standardize local testing.

---

## 1. Game Boilerplate & SDK Integration Guardrail

When integrating or copying educational games (especially from `_template-folder` or other existing game templates):

- **DOM Dependency Check**: Always verify if the game's `game.js` references boilerplate elements inside `KAMPAI.onReady(stats => { ... })` or general initialization. These commonly include:
  - `#blocker` (Start screen)
  - `#player-chip` (Player profile avatar wrapper)
  - `#my-stats` (Stats container)
  - `#ms-best` (Best score element)
  - `#ms-plays` (Play counts element)
- **Rule**: If `game.js` references these elements, they **MUST** be present in `index.html`. If the UI design does not need to show them, do not delete them from the HTML. Instead, either keep them hidden using Tailwind classes (e.g., `hidden` or `style="display: none;"`) or refactor the Javascript to gracefully check for null elements before setting properties (e.g., `const el = document.getElementById('ms-best'); if (el) el.innerText = stats.bestScore;`).
- **Failure Impact**: Omiting these elements while `game.js` attempts to access them will cause a runtime `TypeError` for logged-in students, causing the game to freeze.

---

## 2. Local Game Verification & JSDOM Testing Guidelines

When writing or executing script tests for interactive educational games (e.g. using JSDOM or custom node scripts):

- **Path Translation**:
  - JSDOM does not automatically map absolute URL paths (e.g., `/games/science/...`) to the local project directories.
  - When loading game HTML, rewrite absolute script/resource paths to resolve under the `public` directory.
  - *Example helper*:
    ```javascript
    const publicPath = path.resolve(__dirname, '../../public');
    // Translate paths matching /games/... to file:///.../public/games/...
    ```
- **Local Storage Opaque Origin Exception**:
  - Running JSDOM on `file://` URIs triggers a `SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document`.
  - Prior to initializing JSDOM or loading the game scripts, mock or stub the `localStorage` property on the window object:
    ```javascript
    const storageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
      };
    })();
    Object.defineProperty(dom.window, 'localStorage', { value: storageMock });
    ```
- **CDN script mocking (optional)**:
  - If a game imports heavy external libraries via CDN (e.g. Tailwind CSS script or Phaser), prevent network overhead or mutations observer crashes during JSDOM execution by filtering out or mocking these scripts before JSDOM tries to execute them, or stubbing the DOM mutations they perform.

---

## 3. Educational Game Development & SDK Integration Guidelines (การทำเกมการศึกษา)

Follow these standards strictly when developing, refactoring, or integrating educational games:

### A. Folder & File Structure (5-File Architecture)
- For new games, create a subdirectory: `public/games/{subject}/{slug}/`
- Structure the game using **5 primary files**:
  1. `index.html`: Markup structure and script loader.
  2. `style.css`: Styles and visual themes.
  3. `config.js`: Configuration (`window.GAME_CONFIG`) for parameters like time limits, lives, scoring weights.
  4. `data.js`: Educational content, questions, choices, levels (`window.GAME_DATA`).
  5. `game.js`: Game logic, state management, and SDK integration.
  6. `cover.png` or `cover.svg`: Cover image (must be 16:9 ratio, 1280x720).
- **Rule**: Load scripts in `index.html` in sequence (`config.js` -> `data.js` -> `game.js`). Do **NOT** use ES Modules (`import`/`export`) in game scripts.

### B. KAMPAI SDK Integration
- Include `/games/kampai-sdk.js` in `index.html` with a fallback stub to support standalone play.
- **Initialization**: Initialize code inside `KAMPAI.onReady((k) => { ... })`.
  - Read student profile data from `k.student`.
  - Read previous stats from `k.stats`.
  - Read and render the Top 5 leaderboard from `k.leaderboard`.
- **Score Submission**: Always invoke `KAMPAI.submitScore(score, { mode, ... })` at the game-over screen to save student progress.
- **Audio & Sound API**:
  - Trigger `KAMPAI.sound.unlock()` on the first user interaction.
  - Control background music via `KAMPAI.sound.bgmStart()` / `bgmStop()` and `defaultBgm(preset)`.
  - Use `KAMPAI.sound.correct()`, `wrong()`, `timeUp()`, `gameOver()` for events.
  - For language/verbal games, use text-to-speech: `KAMPAI.sound.speak(text, lang)`.

### C. Online Multiplayer (`kampai-match.js`)
- Always ask the user if they want a multiplayer/online option (synchronized live play).
- If yes, include `/games/kampai-match.js` and instantiate it using `KampaiMatch.create({ duration, title, onPlay, onEnd })`.
- Sync real-time scoring via `match.report(score, { correct })`.
- Use the provided seeded `rng` inside `onPlay(({ rng }) => { ... })` so all players receive identical questions.

- **Rule**: Never prompt the student for their name or attempt to manage lobbies manually. The SDK and KampaiMatch wrapper handle authentication, student profiles, and lobby synchronization.

### D. DB Migration & game_docs Registration
- Register every new game by creating a new migration file: `supabase/migrations/NNN_seed_{slug}_game.sql`.
- **Rule**: The migration must:
  1. Seed the item in `educational_hub_items` (`game_slug`, `tracked_game = true`, `thumbnail_url = '/games/{subject}/{slug}/cover.png'`).
  2. Insert or update the game profile details in `game_docs` using `INSERT ... ON CONFLICT (item_id) DO UPDATE` with game format, features, build version, and notes.
- **Programmatic Seeding**: Note that writing an SQL migration file in `supabase/migrations` registers the schema but does not automatically populate/publish the game on the live Supabase production database. To make the game immediately visible in the Game Library (คลังเกมการศึกษา), you **MUST** also create a JavaScript seed script under `scripts/seed-{slug}-game.mjs` and execute it (`node scripts/seed-{slug}-game.mjs`) to programmatically upsert the game metadata into `educational_hub_items` and `game_docs` using the Supabase Service Role key from `.env.local`.

### E. Local Verification
- Before finalizing a game, run the verification tool:
  ```bash
  pnpm verify:game public/games/{subject}/{slug}
  ```
- The game **MUST** pass all verification checks (including the 16:9 thumbnail check and browser/JSDOM smoke-test) before staging.

### F. Game Cover Art Guidelines (แนวทางการสร้างภาพปกเกมด้วย AI)
เมื่อต้องการสร้างภาพปกเกมสำหรับระบบการเรียนรู้ (เช่น ใช้เครื่องมือ `generate_image`) ต้องปฏิบัติตามกฎและแนวทางดังต่อไปนี้อย่างเคร่งครัดเพื่อให้ภาพปกมีคุณภาพ เหมาะสมกับนักเรียน และเข้ากับระบบ:

1. **สไตล์ภาพและโทนสี (Aesthetics & Theme):**
   - **ความสนุก ตื่นเต้น และมีความเป็นเกม (Gamification):** ภาพปกต้องมีชีวิตชีวา ดูสนุกสนาน ตื่นเต้น เร้าใจ มีการสอดแทรกองค์ประกอบที่แสดงความเป็นเกม (เช่น แถบพลังงาน HP, เหรียญรางวัลลอยตัว, หีบสมบัติ, เอฟเฟกต์แสงวิบวับ หรือไอคอน UI ของเกม) เพื่อดึงดูดความสนใจของเด็กๆ
   - **สไตล์จิบิลายเส้นสะอาดตา (Chibi Style & Clean Line Art):** ตัวละครและวัตถุต่างๆ ต้องออกแบบในสไตล์จิบิ น่ารัก หัวโตตัวเล็ก ตาโตกลมโตเป็นประกาย เส้นวาดต้องสะอาดตา (Clean line art) และใช้โทนสีสดใส (Bright colors) อบอุ่น และเป็นมิตร สมวัยนักเรียนระดับประถมศึกษา
   - **สไตล์การเรนเดอร์ (Rendering Style):** แนะนำรูปแบบการวาดการ์ตูนอนิเมะน่ารักลายเส้นคมชัดสะอาดตา (Cute Cartoon/Anime Clean Line Art), อาร์ตเวกเตอร์ผิวมน (Smooth Vector Art), หรือสไตล์ดินปั้น 3D (3D Claymation) ที่ดูมีมิติและสดใส

2. **ความไม่รุนแรง (Non-Violent & Kid-Friendly):**
   - **ห้ามมีความรุนแรง:** ภาพปกห้ามมีภาพอาวุธจริง ปืนจริง เลือด การต่อสู้ที่รุนแรง เอฟเฟกต์การระเบิดที่มีควันดำมืด หรืออารมณ์ก้าวร้าว
   - **การแปลงรูปแบบอาวุธ/การปะทะ:** หากเป็นเกมต่อสู้ (เช่น รถถัง หรือยานอวกาศ) ให้แปลงเป็นรูปแบบแฟนตาซีหรือของเล่นไม้/ของเล่นพลาสติกสีพาสเทลยิงกระสุนเป็นลูกบอลฟองสบู่ แสงเลเซอร์สีรุ้ง หรือไอคอนสัญลักษณ์การศึกษาแทน

3. **สื่อถึงเนื้อหาบทเรียน (Educational Relevance):**
   - ต้องสอดแทรกสัญลักษณ์การศึกษาและองค์ประกอบของวิชานั้นๆ ลงไปในการออกแบบอย่างกลมกลืน เช่น:
     - **คณิตศาสตร์:** ตัวเลข เครื่องหมายบวก/ลบ/คูณ/หาร รูปทรงเรขาคณิตน่ารักๆ
     - **เทคโนโลยี/วิทยาการคอมพิวเตอร์:** หุ่นยนต์จิ๋ว บล็อกโค้ดสีพาสเทล ลายเส้นวงจรไฟฟ้าเรืองแสงสีฟ้าน่ารักๆ ไอคอนคอมพิวเตอร์หน้ายิ้ม
     - **วิทยาศาสตร์:** หลอดทดลองมีฟองสบู่ ดวงดาวอวกาศยิ้มแย้ม พืชและสัตว์สไตล์การ์ตูน
     - **ภาษาอังกฤษ/ภาษาไทย:** ตัวอักษรดุ๊กดิ๊ก คำศัพท์ลอยตัว หรือสมุดโน้ตการ์ตูน

4. **รูปแบบข้อความและภาษา (Text & HUD UI):**
   - **แสดงชื่อ 2 ภาษา:** ใส่ชื่อเกมทั้ง **ภาษาอังกฤษ (English Name) และภาษาไทย (Thai Name)** บนหน้าปกควบคู่กัน
   - ใช้ฟอนต์ที่อ่านง่าย น่ารัก และสไตล์โค้งมน (Rounded) หรือสไตล์ฟองสบู่ (Bubble) หลีกเลี่ยงฟอนต์สไตล์ทหารหรือหักมุมคมกริบ
   - จัดตำแหน่งชื่อเกมให้อยู่กึ่งกลางหรือส่วนบนที่สมดุล ไม่บดบังรายละเอียดสำคัญของตัวละครหลักหรือองค์ประกอบเกม

5. **สเปคทางเทคนิคและสัดส่วนภาพ (Technical Specification):**
   - **ปรับภาพให้พอดีกับขนาด 16:9 (1280×720 pixels):** เนื่องจากระบบสร้างภาพของ AI มักจะส่งออกภาพขนาด 1024×1024 (1:1) เสมอ ดังนั้น **หลังจากรันคำสั่งสร้างภาพแล้ว คุณต้องเรียกใช้สคริปต์ย่อ/ขยายและครอบภาพ (High-Quality Crop/Resize) ให้ได้ขนาด 1280×720 pixels ทันที** ก่อนจะนำไปจัดเก็บที่โฟลเดอร์เกม เพื่อให้ภาพปกแสดงผลได้เต็มช่อง aspect-video อย่างสมบูรณ์ ไม่มีขอบดำ
   - **การจัดวางองค์ประกอบให้เห็นครบถ้วน (Fit to Scale & Full Visibility):** การจัดองค์ประกอบภาพปกจะต้องปรับขนาดแบบรักษาอัตราส่วน (Fit to scale) เพื่อไม่ให้ภาพบิดเบี้ยว และต้องออกแบบในลักษณะ Safe Zone โดยให้ตัวละครหลัก ชื่อภาษาอังกฤษ/ไทย และ HUD ของเกมอยู่ถัดเข้ามาจากขอบ เพื่อรับประกันว่าจะไม่มีส่วนสำคัญใดๆ ถูกตัดขาด (Crop-off) และจะสามารถมองเห็นทุกส่วนของภาพได้อย่างครบถ้วนสมบูรณ์เมื่อแสดงผลบนระบบพอร์ทัล
   - **กฎการจัด safe zone สำหรับ AI Prompt (AI Prompt Safe Zone Rule)**: ในการเขียน prompt ให้กับ AI ทุกครั้ง ต้องระบุคำสั่งบังคับว่า "ตัวละครหลัก ข้อความพาดหัว และองค์ประกอบที่สื่อถึงเกมทั้งหมด จะต้องอยู่กึ่งกลางภาพภายในพื้นที่ Safe Zone 60% ของภาพ (centered within 60% safe zone) และปล่อยขอบด้านบนและด้านล่าง (อย่างน้อย 20%) เป็นเพียงพื้นหลังเปล่าๆ" เพื่อป้องกันขอบภาพโดนตัดขาดเมื่อย่อ/ครอบสัดส่วนรูปเป็น 16:9 (1280x720)
   - **ชื่อไฟล์ภาพปก:** ต้องเซฟในชื่อ `cover.png` หรือ `{slug}-cover.png` ให้อยู่ในโฟลเดอร์เกมเดียวกับหน้าหลักของเกม


6. **ตัวอย่าง Prompt สำเร็จรูปสำหรับสั่ง AI (Gemini Prompt Template):**
   - *ตัวอย่างสำหรับเกมเทคโนโลยี/วิทยาการคำนวณ:*

