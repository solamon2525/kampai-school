// Lessons Learned — kampai-school
// อัปเดต: 2026-09-22

export interface Lesson {
  id: string;
  emoji: string;
  title: string;
  symptom: string;
  fix: string;
  code?: string;
  tag: 'bug' | 'ux' | 'security' | 'devops' | 'game' | 'perf';
}

export const lessons: Lesson[] = [
  {
    id: 'registry-blank',
    emoji: '🔴',
    title: 'registry.ts → เว็บขาวทั้งระบบ',
    symptom: 'เพิ่ม Command ใหม่ใน registry.ts แล้วเว็บขาว ไม่มี console error',
    fix: 'ลืม import icon จาก lucide-react — TypeScript ปล่อยผ่าน runtime พัง ตรวจก่อน commit:\ngrep -oE "icon: [A-Z][a-zA-Z]+" src/lib/commands/registry.ts | sort -u',
    tag: 'bug',
  },
  {
    id: 'pwa-cache',
    emoji: '📱',
    title: 'PWA Cache → เว็บขาวหลัง deploy',
    symptom: 'Service Worker cache เก่าค้าง serve bundle เก่าไม่ match server',
    fix: 'บอก user เปิด https://kampai-school.vercel.app/?reset_sw=1 — kill-switch ใน src/main.tsx',
    tag: 'devops',
  },
  {
    id: 'ar-container',
    emoji: '🎥',
    title: 'AR Game: กล้องไม่เต็มจอ / cursor ผิดตำแหน่ง',
    symptom: 'Container กล้องเป็น position: relative — coordinate system ผิด',
    fix: 'Container กล้องต้อง position: absolute; inset: 0 เสมอ ห้าม relative',
    code: '/* ✅ ถูก */\n.camera-wrap { position: absolute; inset: 0; }\n/* ❌ ผิด */\n.camera-wrap { position: relative; }',
    tag: 'bug',
  },
  {
    id: 'ar-restart',
    emoji: '🔄',
    title: 'AR Game: restart → กล้องค้าง / memory leak',
    symptom: 'Restart หลาย rounds — tracking ช้าลงเรื่อยๆ',
    fix: 'hands.stop(); hands = null; ก่อน buildHands() + start() ทุกครั้ง',
    code: '// ✅ ถูก\nhands.stop();\nhands = null;\nbuildHands();\nhands.start();',
    tag: 'bug',
  },
  {
    id: 'game-score',
    emoji: '🎮',
    title: 'คะแนนไม่ขึ้น Round 2+ (pizza-master-chef)',
    symptom: 'Round แรกได้คะแนน แต่ round 2 คะแนนไม่บันทึก',
    fix: 'แก้กลางที่ SDK + PlayGame.tsx: reset _submitted=false ตอน beginRound(). ไม่ต้องแก้ทุกไฟล์เกม',
    tag: 'game',
  },
  {
    id: 'dark-mode',
    emoji: '🌓',
    title: 'muted-foreground ดูเป็นสีน้ำเงินบนพื้นขาว',
    symptom: 'HSL 142 20% 42% — saturation ต่ำ + hue 142 → สายตาเห็นเป็น navy จาง',
    fix: 'ใช้ text-foreground/75 หรือ /80 แทน text-muted-foreground สำหรับ body text ที่ต้องอ่านง่าย',
    code: '// ❌\n<p className="text-muted-foreground">\n// ✅\n<p className="text-foreground/80">',
    tag: 'ux',
  },
  {
    id: 'rls-default',
    emoji: '🔒',
    title: 'RLS "Allow public full access" Default',
    symptom: 'Tables เปิดโล่ง anyone อ่าน/แก้ได้ทั้งหมด',
    fix: 'ปิด policy เดิม เขียน helper functions + re-write policies ทุก table ใน Migration 022+',
    code: 'CREATE FUNCTION is_admin() RETURNS boolean AS $$\n  SELECT auth_role() = \'admin\'\n$$ LANGUAGE sql;',
    tag: 'security',
  },
  {
    id: 'vercel-webhook',
    emoji: '🚨',
    title: 'Vercel Auto-deploy หลุดเงียบ',
    symptom: 'git push สำเร็จ แต่เว็บจริงไม่อัปเดต — webhook หาย',
    fix: 'vercel deploy --prod --yes (force deploy) หรือ Reconnect GitHub integration ใน Vercel dashboard',
    tag: 'devops',
  },
  {
    id: 'thai-filename',
    emoji: '🗂',
    title: 'Thai Filename ใน URL / SQL',
    symptom: 'ชื่อไฟล์ภาษาไทย เช่น ตกปลามาตรา ตัวสะกด2.html ใน DB พัง',
    fix: 'URL-encode ก่อน seed: encodeURIComponent("ตกปลามาตรา ตัวสะกด2.html") ใน migration SQL',
    tag: 'bug',
  },
  {
    id: 'cert-ocr',
    emoji: '📜',
    title: 'OCR เกียรติบัตรภาษาไทย — Vision ดีกว่า Tesseract',
    symptom: 'Tesseract.js อ่านชื่อภาษาไทยในเกียรติบัตรผิดบ่อย',
    fix: 'Drop รูปใน Claude Code → Claude อ่านด้วย vision → ได้ JSON ที่แม่นกว่ามาก → import ด้วย import-cert.mjs',
    tag: 'devops',
  },
];
