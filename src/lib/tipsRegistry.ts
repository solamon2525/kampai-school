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
];

export const TIPS: TipEntry[] = [
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
