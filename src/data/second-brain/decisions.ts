// Architecture Decisions (ADR) — kampai-school
// อัปเดต: 2026-09-22

export interface Decision {
  id: string;
  title: string;
  version: string;
  chosen: string;
  reason: string[];
  tradeoff?: string;
}

export const decisions: Decision[] = [
  {
    id: 'supabase',
    title: 'Backend: Supabase (ไม่ใช่ Firebase)',
    version: 'v1.0',
    chosen: 'Supabase',
    reason: [
      'PostgreSQL จริง — SQL, JOIN, relation ชัด',
      'Row Level Security ระดับ database — ปลอดภัยกว่า app layer',
      'Auth + Storage + Edge Functions + Realtime ในตัวเดียว',
      'Open source — migrate ออกได้',
      'Free tier พอสำหรับโรงเรียน 40-100 คน',
    ],
    tradeoff: 'Cold start Edge Functions บางช่วงแรก',
  },
  {
    id: 'vite',
    title: 'Build: Vite SPA (ไม่ใช่ Next.js)',
    version: 'v1.0',
    chosen: 'Vite + React SPA',
    reason: [
      'เว็บโรงเรียนไม่ต้องการ SSR/SEO ระดับสูง',
      'HMR เร็วกว่า Next.js มาก — dev experience ดีกว่า',
      'Deploy เป็น static bundle ถูกลงที่ Vercel',
      'React Router ยืดหยุ่นกว่าสำหรับ admin dashboard',
    ],
    tradeoff: 'SEO หน้าข่าวไม่ดีเท่า SSR — ยอมรับได้',
  },
  {
    id: 'shadcn',
    title: 'UI: shadcn/ui (ไม่ใช่ MUI/Ant)',
    version: 'v1.0',
    chosen: 'shadcn/ui (Radix UI)',
    reason: [
      'Copy code เข้าโปรเจค — customize ได้ 100%',
      'Radix UI headless — accessibility ดีมาก',
      'Tailwind-based — consistent styling',
      'ไม่มี runtime library — bundle เล็ก',
    ],
    tradeoff: 'ต้อง update component เองเวลามี version ใหม่',
  },
  {
    id: 'light-only',
    title: 'Design: Light-Only (ลบ Dark Mode)',
    version: 'v1.5–1.8',
    chosen: 'Light-only + CSS vars',
    reason: [
      'โรงเรียนประถมใช้กลางวัน — dark mode ไม่มีประโยชน์',
      'dark: prefix เพิ่ม complexity maintenance สูง',
      'Brand = gold + navy + green ทำงานได้ดีใน light',
    ],
    tradeoff: 'ไม่มี — ตัดสินใจถูกต้อง',
  },
  {
    id: 'jwt-claims',
    title: 'Auth: JWT Claims (ไม่ใช่ query user_roles ทุกครั้ง)',
    version: 'Migration 074',
    chosen: 'JWT custom claims (app_role)',
    reason: [
      'ทุก RLS policy เคย query user_roles — N+1 queries, ช้า',
      'JWT claims เร็วขึ้น ~10x (ไม่มี extra query)',
      'Supabase Auth Hook inject ได้โดยตรง',
    ],
    tradeoff: 'Role change ต้อง re-login — acceptable เพราะ role เปลี่ยนน้อย',
  },
  {
    id: 'kampai-sdk',
    title: 'Games: KAMPAI SDK (single-file global)',
    version: 'Educational Hub',
    chosen: 'window.KAMPAI via /games/kampai-sdk.js',
    reason: [
      'เกม HTML ทุกตัวโหลด script เดียว — ไม่ต้อง bundle',
      'แก้ที่เดียวมีผลทุกเกมทันที (เสียง, score, leaderboard)',
      'ครูหรือ AI สร้างเกมใหม่ใช้ SDK โดยไม่ต้อง build',
      'GAME-PROMPT.md เป็น spec ให้ AI อื่นสร้างเกมที่ compatible',
    ],
    tradeoff: 'Global variable — ไม่มี TypeScript type, ใช้ JSDoc แทน',
  },
  {
    id: 'waste-bank',
    title: 'ธนาคารขยะ: Items + Points (ไม่ใช่ kg + ฿)',
    version: 'v1.6',
    chosen: 'นับชิ้น + สะสมแต้ม',
    reason: [
      'เด็กประถมชั่งน้ำหนักยาก ไม่มีตาชั่งในห้องเรียน',
      'การจ่ายเงินจริงไม่เหมาะกับโรงเรียน (liability)',
      'แต้มทำให้เด็กอยากสะสมมากกว่า — gamification',
      'ง่ายต่อการบันทึก: นับชิ้น → คลิก → เสร็จ',
    ],
    tradeoff: 'ต้องอธิบายระบบแต้มให้ผู้ปกครองเข้าใจ',
  },
];
