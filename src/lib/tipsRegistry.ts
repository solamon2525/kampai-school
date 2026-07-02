/**
 * Tip Prompt registry — static, commit-driven.
 *
 * เพิ่ม tip ใหม่: push entry ลง TIPS. เพิ่มหมวด: push entry ลง TIP_CATEGORIES
 * และตั้ง entry.category เป็น id ของหมวดที่ตรง.
 *
 * หน้า admin: /admin/dashboard/tip-prompt
 */

export interface TipEntry {
  id: string;
  title: string;
  category: string;
  description: string;
  whenToUse: string;
  code?: string;
  example?: string;
  keywords?: string[];
}

export interface TipCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'slash-commands',
    label: 'Claude Code Slash Commands',
    description: 'คำสั่ง /skill ที่น่าใช้ใน workflow ของ project นี้',
    icon: '⚡',
  },
  {
    id: 'game-dev',
    label: 'Game Dev & Ops (kampai-school)',
    description: 'คำสั่ง/workflow เฉพาะระบบนี้ — สร้าง·ตรวจเกม + กู้ deploy/PWA + ลงเกียรติบัตร',
    icon: '🎮',
  },
];

export const TIPS: TipEntry[] = [
  {
    id: 'hunt-game-bugs',
    title: '/hunt-game-bugs <path> [อาการ]',
    category: 'slash-commands',
    description: 'หาบัคในเกม HTML/JS (รวม AR/กล้อง) แบบ evidence-first — detect ระบบ → รีวิวเฉพาะ lane ที่เกมมี + reproduce ในเบราว์เซอร์ + กัน false-positive (ไม่โทษ engine). ลิสต์ก่อน ยังไม่แก้จนกว่าจะเลือกข้อ',
    whenToUse: 'หลัง integrate/แก้เกมแล้วสงสัยมีบัค (loop ไม่ stop, เสียงค้าง, AR container ยุบ, คะแนนนับซ้ำ)',
    code: '/hunt-game-bugs public/games/math/math-move-quiz เสียงค้างตอนออก',
    example: 'เกม AR จอดำ → สกิลเช็ก container position:absolute, ar.stop() ทุก exit, tap fallback',
    keywords: ['game', 'bug', 'debug', 'ar', 'evidence', 'เกม', 'บัค'],
  },
  {
    id: 'integrate-game',
    title: '/integrate-game <path>',
    category: 'slash-commands',
    description: 'integrate เกม HTML ใหม่เข้าระบบ kampai — KAMPAI SDK/postMessage + score tracking + migration + verify:game ตาม GAME.md',
    whenToUse: 'มีไฟล์เกม HTML (จาก AI/ที่อื่น) อยากผูกเข้าระบบให้บันทึกคะแนน/XP/leaderboard',
    code: '/integrate-game public/games/{subject}/{slug}.html',
    example: 'ได้เกม React จาก Stitch → สกิล wire SDK + สร้าง migration + รัน verify',
    keywords: ['game', 'integrate', 'sdk', 'kampai', 'เกม', 'score'],
  },
  {
    id: 'code-review',
    title: '/code-review [high|ultra] [--fix|--comment]',
    category: 'slash-commands',
    description: 'review diff หา bug correctness + cleanup (reuse/simplify/efficiency). effort low→max; ultra = multi-agent บน cloud (alias เดิม /ultrareview). --fix แก้ให้, --comment โพสต์ใน PR',
    whenToUse: 'ก่อน merge/commit feature สำคัญ อยากตรวจ bug จริง (ต่างจาก /simplify ที่เน้นคุณภาพอย่างเดียว)',
    code: '/code-review high',
    example: 'แก้ migration + RPC ใหม่ → หา edge case + N+1 + RLS leak',
    keywords: ['review', 'bug', 'pr', 'ultra', 'ultrareview', 'fix'],
  },
  {
    id: 'verify',
    title: '/verify',
    category: 'slash-commands',
    description: 'ยืนยันว่า fix/feature ทำงานจริง โดย "รันแอป + ดูพฤติกรรม" (ไม่ใช่แค่อ่านโค้ด) แล้วรายงานหลักฐาน',
    whenToUse: 'หลังแก้บัค/ทำ feature อยากพิสูจน์ว่าใช้ได้จริงก่อนปิดงาน',
    code: '/verify',
    example: 'หลังทำ English Quest → เปิด /english-quest กดเล่นจริง เช็ก XP เข้า DB',
    keywords: ['verify', 'test', 'prove', 'ทดสอบ', 'ยืนยัน'],
  },
  {
    id: 'run',
    title: '/run',
    category: 'slash-commands',
    description: 'launch + ขับแอปของ project นี้เพื่อดูการเปลี่ยนแปลงทำงานจริง (เริ่ม dev server, เปิดหน้า, screenshot)',
    whenToUse: 'อยากเห็นผลบนจอจริง ไม่ใช่แค่ assert ใน test',
    code: '/run',
    example: '"เปิดหน้า /english-quest ให้ดูหน่อย" → start server + screenshot',
    keywords: ['run', 'launch', 'preview', 'server', 'รัน'],
  },
  {
    id: 'debug',
    title: '/debug',
    category: 'slash-commands',
    description: 'debugging แบบมีระบบ — reproduce → isolate → diagnose → fix (ใช้กับ error/stack trace/พฤติกรรมเพี้ยน)',
    whenToUse: 'เจอ error ที่หาสาเหตุไม่เจอ หรือ "ทำงานบน staging แต่พังบน prod"',
    code: '/debug',
    example: '"เกมส่งคะแนนไม่เข้า DB" → ไล่ตั้งแต่ console → network postMessage → RLS',
    keywords: ['debug', 'error', 'reproduce', 'fix', 'แก้บัค'],
  },
  {
    id: 'verify-game-cli',
    title: 'pnpm verify:game <path>',
    category: 'game-dev',
    description: 'ตรวจเกม HTML 10 จุด: GAME_SLUG, score submit, navigateBack, render smoke-test (จับจอดำ), Check 8 ไอคอนชน global ทำ CSS หาย, Check 9 ปก 16:9, Check 10 AR engine, migration',
    whenToUse: 'ก่อน commit เกมทุกครั้ง (ต้องผ่านครบ) + หลังแก้เกม',
    code: 'pnpm verify:game public/games/math/math-move-quiz',
    example: 'ปกจัตุรัส 1024×1024 → Check 9 fail บอกให้ทำใหม่ 1280×720',
    keywords: ['verify', 'game', 'check', 'cover', 'เกม', 'ตรวจ'],
  },
  {
    id: 'ar-hands-start',
    title: 'cp -r public/games/_template-ar-hands … (จิ้ม/ชนด้วยมือ)',
    category: 'game-dev',
    description: 'เกมจิ้ม/ชนวัตถุหรือเลื่อนตะกร้าด้วยมือ: KampaiHands + HANDS config. หลัง stop ต้อง hands=null ก่อน restart (AR-GAME.md §4.12)',
    whenToUse: 'เกม poke ลูกโป่ง / ตะกร้ารับของ / ชนวัตถุด้วยปลายนิ้ว',
    code: 'cp -r public/games/_template-ar-hands public/games/{subject}/{slug}',
    example: 'catch-numbers: minExtendedFingers:0 เลื่อนตะกร้า · multiply-burst: minExtendedFingers:4 poke',
    keywords: ['ar', 'hands', 'kampai-hands', 'finger', 'กล้อง', 'template'],
  },
  {
    id: 'ar-calibration',
    title: '/games/ar-calibration/ — จูน filter AR แบบสด',
    category: 'game-dev',
    description: 'หน้าปรับแต่ง AR: สไลด์ One Euro / EMA แบบเรียลไทม์ · Copy JSON → config.js · Stop/Start ทด restart',
    whenToUse: 'มือสั่น/หน่วงเกินไป อยากจูน oneEuroMinCutoff / beta ก่อนใส่เกม',
    code: 'pnpm verify:game public/games/ar-calibration',
    example: 'multiply-burst preset: minConfidence 0.58, oneEuroBeta 0.008, 960×720 — ดู AR-GAME.md §5.2',
    keywords: ['ar', 'calibration', 'oneeuro', 'filter', 'จูน', 'กล้อง'],
  },
  {
    id: 'ar-game-start',
    title: 'cp -r public/games/_template-ar … (เกม AR)',
    category: 'game-dev',
    description: 'เริ่มเกม AR/กล้อง: copy template ที่ใช้ engine กลาง KampaiAR (กล้อง/ตรวจจับ/zone-hold/tap fallback/cleanup จัดการให้). อ่าน AR-GAME.md ก่อนทุกครั้ง',
    whenToUse: 'ทำเกมที่ใช้กล้องจับการเคลื่อนไหว (เอียงตัว/ยกมือ/กระโดด เลือกคำตอบ)',
    code: 'cp -r public/games/_template-ar public/games/{subject}/{slug}',
    example: 'math-move-quiz: เอียงซ้าย/ขวาเลือก A/B + กล้องมุมจอ (AR-GAME.md §2.1)',
    keywords: ['ar', 'camera', 'kampai-ar', 'เกม', 'กล้อง', 'template'],
  },
  {
    id: 'import-cert',
    title: 'node scripts/import-cert.mjs',
    category: 'game-dev',
    description: 'ลงเกียรติบัตรอบรมครูจากรูป: drop รูปใน Claude Code → อ่านด้วย vision → เขียน data JSON → import เข้า training_records + อัปรูปเข้า storage (ต้องมี SUPABASE_SERVICE_ROLE_KEY ใน .env.local)',
    whenToUse: 'มีรูป/PDF เกียรติบัตรอบรมของครู อยากบันทึกเข้าระบบ',
    code: 'node scripts/import-cert.mjs --image=<path> --data=<json> [--staff-id=<uuid>] [--dry-run]',
    example: 'ชื่อ match หลายคน → script print candidate ให้ส่ง --staff-id',
    keywords: ['cert', 'certificate', 'training', 'เกียรติบัตร', 'ครู', 'vision'],
  },
  {
    id: 'deploy-recovery',
    title: 'vercel deploy --prod --yes (กู้ deploy)',
    category: 'game-dev',
    description: 'กู้เวลา push แล้ว Vercel ไม่ deploy (webhook หลุดเงียบ) — สั่ง deploy production ตรง',
    whenToUse: 'push ขึ้น main แล้วเว็บไม่อัปเดตสักที',
    code: 'vercel deploy --prod --yes',
    example: 'หลัง push English Quest แต่ /english-quest ยัง 404 → รันคำสั่งนี้',
    keywords: ['vercel', 'deploy', 'webhook', 'กู้', 'production'],
  },
  {
    id: 'pwa-reset',
    title: '?reset_sw=1 (กู้ PWA cache เว็บขาว)',
    category: 'game-dev',
    description: 'kill-switch ล้าง service worker cache เวลา user รายงานเว็บขาว — แนะนำเป็นด่านแรกก่อน escalate',
    whenToUse: 'user เปิดเว็บแล้วจอขาว/ค้างเวอร์ชันเก่า',
    code: 'https://kampai-school.vercel.app/?reset_sw=1',
    example: 'ครูเปิดมือถือแล้วขาว → ส่งลิงก์นี้ให้เปิด รีเซ็ต SW เอง',
    keywords: ['pwa', 'cache', 'service worker', 'เว็บขาว', 'reset'],
  },
  {
    id: 'security-review',
    title: '/security-review',
    category: 'slash-commands',
    description: 'ตรวจ security ของการเปลี่ยนแปลงใน branch ปัจจุบัน (RLS, XSS, SQL injection, token leak)',
    whenToUse: 'ก่อน merge feature ที่แตะ migration, edge function, auth flow, หรือเก็บข้อมูล sensitive',
    code: '/security-review',
    example: 'หลังเพิ่ม facebook_feed_config ที่เก็บ token → run /security-review เพื่อยืนยัน RLS ไม่รั่ว',
    keywords: ['security', 'rls', 'audit', 'review', 'token'],
  },
  {
    id: 'simplify',
    title: '/simplify',
    category: 'slash-commands',
    description: 'review โค้ดที่เพิ่งแก้ — หา code ที่ reuse ได้, ลด complexity, fix ปัญหาคุณภาพ',
    whenToUse: 'หลังเขียน feature ใหญ่เสร็จ ก่อน commit (ตรงกับ Karpathy "Simplicity first")',
    code: '/simplify',
    example: 'หลังสร้าง FacebookFeedSection.tsx → /simplify จะแนะนำว่าควร extract helper หรือลดสไตล์ที่ทำเอง',
    keywords: ['quality', 'cleanup', 'refactor', 'simplicity', 'karpathy'],
  },
  {
    id: 'review',
    title: '/review',
    category: 'slash-commands',
    description: 'review pull request แบบมืออาชีพ — เช็ค bug, edge case, security, style',
    whenToUse: 'เปิด PR แล้วอยาก second opinion ก่อน merge',
    code: '/review',
    example: 'pr-#42 ก่อน merge → /review จะ comment เรื่อง edge case + style',
    keywords: ['pr', 'pull request', 'merge', 'review'],
  },
  {
    id: 'fewer-permission-prompts',
    title: '/fewer-permission-prompts',
    category: 'slash-commands',
    description: 'scan transcript หา Bash/MCP commands ที่ใช้บ่อย แล้วเพิ่ม allowlist ใน .claude/settings.json ลดการกด "Allow" ซ้ำ ๆ',
    whenToUse: 'เริ่มรู้สึกว่ากด allow บ่อย (เช่น rtk git status ถูกถามทุกครั้ง)',
    code: '/fewer-permission-prompts',
    example: 'หลัง session ใหญ่ที่ใช้ rtk + git บ่อย → run คำสั่งนี้แล้ว session ถัดไปจะลื่นขึ้น',
    keywords: ['permission', 'allowlist', 'settings', 'friction'],
  },
  {
    id: 'loop',
    title: '/loop <interval> <prompt>',
    category: 'slash-commands',
    description: 'รัน prompt ซ้ำ ๆ ทุก X นาที (หรือ self-paced ถ้าไม่ใส่ interval)',
    whenToUse: 'เช็คสถานะ deploy / poll status / babysit งานที่เปลี่ยนเรื่อย ๆ',
    code: '/loop 2m เช็คว่า Vercel state = READY ยัง',
    example: 'หลัง git push แล้วรอ Vercel deploy → /loop 2m จะเช็คทุก 2 นาทีจนกว่าจะ READY',
    keywords: ['cron', 'poll', 'recurring', 'deploy', 'vercel'],
  },
  {
    id: 'schedule',
    title: '/schedule',
    category: 'slash-commands',
    description: 'สร้าง cron job ของ Claude (รัน routine แบบ remote ตามเวลา)',
    whenToUse: 'งานเป็นรอบ ทุกวัน/สัปดาห์ — ผ่าน Anthropic server, ไม่กิน local CLI',
    code: '/schedule',
    example: 'ทุก 24 ชม. เช็คว่า Facebook token ใกล้หมดอายุไหม → ส่ง notification',
    keywords: ['cron', 'schedule', 'routine', 'remote'],
  },
  {
    id: 'karpathy-guidelines',
    title: '/andrej-karpathy-skills:karpathy-guidelines',
    category: 'slash-commands',
    description: 'กฎ 4 ข้อ (Think first / Simplicity first / Surgical changes / Goal-driven) — ลดความผิดพลาดของ LLM',
    whenToUse: 'เริ่ม session ถ้าจะทำงานสำคัญ (4 ข้อหลักฝังใน CLAUDE.md แล้ว session ใหม่ auto-load)',
    code: '/andrej-karpathy-skills:karpathy-guidelines',
    example: 'ก่อนเริ่ม refactor ใหญ่ → invoke เพื่อให้ Claude คิดก่อน code',
    keywords: ['behavior', 'guideline', 'karpathy', 'rules'],
  },
  {
    id: 'senior-frontend',
    title: '/senior-frontend',
    category: 'slash-commands',
    description: 'Frontend expert mode สำหรับ React / Next / TS / Tailwind — performance, bundle size, a11y, code quality',
    whenToUse: 'ทำ component ซับซ้อน, optimize performance, audit a11y, รื้อ Vite config',
    code: '/senior-frontend',
    example: '"ทำไม recharts chunk โต" → /senior-frontend วิเคราะห์ + เสนอ chunk split',
    keywords: ['react', 'frontend', 'tailwind', 'performance', 'bundle'],
  },
  {
    id: 'shadcn-ui',
    title: '/shadcn-ui',
    category: 'slash-commands',
    description: 'ผู้เชี่ยวชาญ shadcn/ui — discover component, install, customize',
    whenToUse: 'ก่อนเพิ่ม shadcn component ใหม่ (Combobox, DataTable, ฯลฯ)',
    code: '/shadcn-ui',
    example: 'อยากใช้ DataTable ใหม่ → /shadcn-ui แนะนำว่าควร install อะไร + wrap ยังไง (ห้าม edit components/ui/* ตรง)',
    keywords: ['shadcn', 'component', 'ui'],
  },
  {
    id: 'database-schema-designer',
    title: '/database-schema-designer',
    category: 'slash-commands',
    description: 'ออกแบบ ERD, normalize schema, วาง relationship, plan migration',
    whenToUse: 'ก่อนเขียน migration ใหม่ที่ซับซ้อน (3+ table, FK เยอะ, RLS หลายชั้น)',
    code: '/database-schema-designer',
    example: 'ก่อนเริ่ม homework_portal schema → ใช้ skill นี้ก่อนเขียน SQL จริง',
    keywords: ['schema', 'erd', 'migration', 'supabase', 'database'],
  },
  {
    id: 'update-config',
    title: '/update-config',
    category: 'slash-commands',
    description: 'แก้ .claude/settings.json (hooks, permissions, env vars, status line, theme)',
    whenToUse: 'อยากให้ Claude ทำอะไรอัตโนมัติ (hook), เปลี่ยน permission, ตั้ง env',
    code: '/update-config',
    example: 'หลัง edit ทุกครั้งให้รัน prettier → ใช้ skill นี้ตั้ง PostToolUse hook',
    keywords: ['settings', 'config', 'hook', 'permission', 'env'],
  },
  {
    id: 'keybindings-help',
    title: '/keybindings-help',
    category: 'slash-commands',
    description: 'ปรับ keyboard shortcuts ของ Claude Code (~/.claude/keybindings.json)',
    whenToUse: 'อยาก rebind ปุ่ม (ปุ่ม submit, chord shortcut)',
    code: '/keybindings-help',
    keywords: ['keyboard', 'shortcut', 'rebind', 'keybinding'],
  },
  {
    id: 'init',
    title: '/init',
    category: 'slash-commands',
    description: 'สร้าง / refresh CLAUDE.md จากการอ่าน codebase',
    whenToUse: 'project ใหม่ที่ไม่มี CLAUDE.md หรืออยาก regenerate',
    code: '/init',
    example: 'project นี้มี CLAUDE.md ดีอยู่แล้ว — ไม่ต้องใช้ ยกเว้นต้องการ rebuild',
    keywords: ['init', 'claude.md', 'setup'],
  },
];
