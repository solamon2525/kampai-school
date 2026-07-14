import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const TARGET_W = 1280;
const TARGET_H = 720;

// โค้ด SVG ของปกเกม Code Craft (สี Navy + Gold + บล็อกคำสั่งสีสันสดใส)
const svgString = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- ไล่เฉดสีพื้นหลัง -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>

    <!-- ไล่เฉดสีทองพรีเมียม -->
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- เอฟเฟกต์เรืองแสง -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- พื้นหลัง -->
  <rect width="100%" height="100%" fill="url(#bg-grad)" />

  <!-- ตารางโรงงานกริด (Warehouse Grid) จางๆ -->
  <g stroke="rgba(217, 119, 6, 0.05)" stroke-width="1.5">
    <line x1="150" y1="0" x2="150" y2="720" />
    <line x1="300" y1="0" x2="300" y2="720" />
    <line x1="450" y1="0" x2="450" y2="720" />
    <line x1="600" y1="0" x2="600" y2="720" />
    <line x1="750" y1="0" x2="750" y2="720" />
    <line x1="900" y1="0" x2="900" y2="720" />
    <line x1="1050" y1="0" x2="1050" y2="720" />
    <line x1="1200" y1="0" x2="1200" y2="720" />
    
    <line x1="0" y1="120" x2="1280" y2="120" />
    <line x1="0" y1="240" x2="1280" y2="240" />
    <line x1="0" y1="360" x2="1280" y2="360" />
    <line x1="0" y1="480" x2="1280" y2="480" />
    <line x1="0" y1="600" x2="1280" y2="600" />
  </g>

  <!-- วงกลมวงจรไฟฟ้าเรืองแสงตกแต่ง -->
  <circle cx="150" cy="360" r="100" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="2" />
  <circle cx="1130" cy="360" r="150" fill="none" stroke="rgba(217, 119, 6, 0.08)" stroke-width="3" />

  <!-- ── วาดหุ่นยนต์ตัวเอก (Chibi Robot) ฝั่งซ้าย ── -->
  <g transform="translate(250, 480)" filter="url(#glow)">
    <!-- ฐานล้อเลื่อน -->
    <rect x="-60" y="30" width="120" height="20" rx="10" fill="#334155" />
    <circle cx="-35" cy="45" r="12" fill="#0f172a" />
    <circle cx="35" cy="45" r="12" fill="#0f172a" />
    
    <!-- ตัวถังสีทอง -->
    <rect x="-45" y="-50" width="90" height="85" rx="16" fill="#b58920" stroke="#78350f" stroke-width="3" />
    
    <!-- หน้าจอสีดำดวงตาสว่างฟ้า -->
    <rect x="-35" y="-38" width="70" height="42" rx="8" fill="#1e293b" />
    <circle cx="-16" cy="-18" r="8" fill="#38bdf8" />
    <circle cx="16" cy="-18" r="8" fill="#38bdf8" />
    
    <!-- หัวกบาลรับสัญญาณไฟแดง -->
    <line x1="0" y1="-50" x2="0" y2="-70" stroke="#475569" stroke-width="4" />
    <circle cx="0" cy="-74" r="7" fill="#ef4444" />
    
    <!-- แขนกลกำลังคีบกล่องสีน้ำเงิน -->
    <path d="M 40 -10 Q 70 -20 80 -5" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <path d="M 40 15 Q 70 20 80 5" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round" />
    <!-- กล่องพัสดุสีส้มสด -->
    <rect x="75" y="-20" width="40" height="40" rx="4" fill="#f97316" stroke="#c2410c" stroke-width="2" />
    <line x1="95" y1="-20" x2="95" y2="20" stroke="#ffffff" stroke-width="1.5" />
    <line x1="75" y1="0" x2="115" y2="0" stroke="#ffffff" stroke-width="1.5" />
  </g>

  <!-- ── บล็อกคำสั่งสีสันสดใสจำลองลอยอยู่ฝั่งขวา ── -->
  <!-- บล็อก 1: Move (ส้ม) -->
  <g transform="translate(850, 260)" filter="url(#glow)">
    <rect x="0" y="0" width="220" height="50" rx="10" fill="#f97316" stroke="#c2410c" stroke-width="2" />
    <text x="20" y="32" fill="#ffffff" font-size="18" font-weight="bold" font-family="Sarabun">🚶 เดินหน้า (Move)</text>
    <circle cx="200" cy="25" r="8" fill="rgba(255,255,255,0.3)" />
  </g>

  <!-- บล็อก 2: Repeat (เขียว) -->
  <g transform="translate(800, 340)" filter="url(#glow)">
    <rect x="0" y="0" width="260" height="50" rx="10" fill="#22c55e" stroke="#15803d" stroke-width="2" />
    <text x="20" y="32" fill="#ffffff" font-size="18" font-weight="bold" font-family="Sarabun">🔁 วนลูป [ 3 ] ครั้ง</text>
    <circle cx="240" cy="25" r="8" fill="rgba(255,255,255,0.3)" />
  </g>

  <!-- บล็อก 3: If-Else (ม่วง) -->
  <g transform="translate(850, 420)" filter="url(#glow)">
    <rect x="0" y="0" width="240" height="70" rx="10" fill="#a855f7" stroke="#7e22ce" stroke-width="2" />
    <text x="20" y="30" fill="#ffffff" font-size="16" font-weight="bold" font-family="Sarabun">❓ ถ้า สีกล่อง = ส้ม</text>
    <text x="40" y="52" fill="#fef08a" font-size="14" font-weight="bold" font-family="Sarabun">ทำ -> เลี้ยวซ้าย</text>
    <circle cx="220" cy="35" r="8" fill="rgba(255,255,255,0.3)" />
  </g>

  <!-- ── องค์ประกอบข้อความ Title (จัดกึ่งกลาง Safe Zone 60% ตามกฎ) ── -->
  <g transform="translate(640, 160)" text-anchor="middle">
    <text x="0" y="0" fill="#78350f" font-size="82" font-weight="900" font-family="Sarabun" letter-spacing="3" filter="url(#glow)">CODE CRAFT</text>
    <text x="0" y="-4" fill="url(#gold-grad)" font-size="82" font-weight="900" font-family="Sarabun" letter-spacing="3">CODE CRAFT</text>
    
    <text x="0" y="46" fill="#fef3c7" font-size="28" font-weight="bold" font-family="Sarabun" letter-spacing="1">วิศวกรโค้ดดิ้งหุ่นยนต์</text>
    
    <!-- สติ๊กเกอร์วิชาการ -->
    <rect x="-100" y="70" width="200" height="28" rx="14" fill="#d97706" />
    <text x="0" y="88" fill="#ffffff" font-size="14" font-weight="bold" font-family="Sarabun">วิทยาการคำนวณ ป.4 - ป.6</text>
  </g>

  <!-- ตกแต่งตกคาร์โกสายพาน -->
  <path d="M 50 680 L 1230 680" stroke="#334155" stroke-width="8" stroke-dasharray="15,10" />
  <circle cx="950" cy="500" r="10" fill="none" stroke="rgba(56, 189, 248, 0.15)" stroke-width="2" />
</svg>
`;

async function generateCover() {
  const outputPath = path.resolve('public/games/tech/code-craft/cover.png');
  const dir = path.dirname(outputPath);
  
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`🎬 เริ่มเรนเดอร์ปกเกมด้วย Sharp SVG -> PNG`);
  console.log(`📤 บันทึกไปที่: ${outputPath}`);

  await sharp(Buffer.from(svgString))
    .resize(TARGET_W, TARGET_H)
    .png({ compressionLevel: 8 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`✅ สำเร็จ! ได้ไฟล์ปกขนาด 1280x720 ขนาดไฟล์: ${Math.round(stats.size / 1024)} KB`);
}

generateCover().catch(err => {
  console.error('❌ พัง:', err);
  process.exit(1);
});
