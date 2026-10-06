/**
 * verify-cn-imports.mjs
 * ตรวจสอบความถูกต้องของการ import ฟังก์ชัน `cn` จาก '@/lib/utils'
 * ป้องกันปัญหา Runtime Error: "ReferenceError: cn is not defined" ในระบบเว็บเบส
 */
import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

console.log('--- 🧪 STARTING CN IMPORTS VERIFICATION ---');

const files = walk('src');
const missingCnFiles = [];

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  if (/\bcn\(/.test(code)) {
    const hasImport =
      /import\s+{[^}]*\bcn\b[^}]*}\s+from\s+['"][^'"]*utils['"]/.test(code) ||
      /import\s+.*?\bcn\b.*?from/.test(code) ||
      /function\s+cn\(/.test(code) ||
      /const\s+cn\s*=/.test(code);
    if (!hasImport) {
      missingCnFiles.push(file);
    }
  }
});

console.log(`ตรวจสอบไฟล์ทั้งหมด: ${files.length} ไฟล์`);

if (missingCnFiles.length > 0) {
  console.error('❌ พบไฟล์ที่มีการเรียกใช้ cn() แต่ไม่ได้ import cn:');
  missingCnFiles.forEach(f => console.error(`   - ${f}`));
  console.error('\nกรุณาเพิ่ม `import { cn } from \'@/lib/utils\';` ในไฟล์ดังกล่าว');
  process.exit(1);
} else {
  console.log('✅ PASS: ทุกไฟล์ที่เรียกใช้ cn() มีการ import จาก utils ครบถ้วน 100%');
  console.log('🎉 ALL CN IMPORTS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}
