import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const TARGET_W = 1280;
const TARGET_H = 720;

// โค้ด SVG ของปกเกมที่มีความพรีเมียม (สี Navy + Gold + แสงเลเซอร์เรืองแสง)
const svgString = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- ไล่เฉดสีพื้นหลัง -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b19" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <!-- ไล่เฉดสีทองพรีเมียม -->
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- เอฟเฟกต์เรืองแสง -->
    <filter id="glow-laser" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- พื้นหลัง -->
  <rect width="100%" height="100%" fill="url(#bg-grad)" />

  <!-- ตารางพิกัดเรขาคณิต (Coordinate Grid) จางๆ ด้านหลัง -->
  <g stroke="rgba(51, 65, 85, 0.3)" stroke-width="1">
    <!-- เส้นแนวตั้ง -->
    <line x1="100" y1="0" x2="100" y2="720" />
    <line x1="200" y1="0" x2="200" y2="720" />
    <line x1="300" y1="0" x2="300" y2="720" />
    <line x1="400" y1="0" x2="400" y2="720" />
    <line x1="500" y1="0" x2="500" y2="720" />
    <line x1="600" y1="0" x2="600" y2="720" />
    <line x1="700" y1="0" x2="700" y2="720" />
    <line x1="800" y1="0" x2="800" y2="720" />
    <line x1="900" y1="0" x2="900" y2="720" />
    <line x1="1000" y1="0" x2="1000" y2="720" />
    <line x1="1100" y1="0" x2="1100" y2="720" />
    <line x1="1200" y1="0" x2="1200" y2="720" />
    
    <!-- เส้นแนวนอน -->
    <line x1="0" y1="100" x2="1280" y2="100" />
    <line x1="0" y1="200" x2="1280" y2="200" />
    <line x1="0" y1="300" x2="1280" y2="300" />
    <line x1="0" y1="400" x2="1280" y2="400" />
    <line x1="0" y1="500" x2="1280" y2="500" />
    <line x1="0" y1="600" x2="1280" y2="600" />
    <line x1="0" y1="700" x2="1280" y2="700" />
  </g>

  <!-- วาดวงกลมพิกัดเรืองแสงเป็นคลื่นพื้นหลัง -->
  <circle cx="950" cy="360" r="280" fill="none" stroke="rgba(217, 119, 6, 0.05)" stroke-width="2" />
  <circle cx="950" cy="360" r="180" fill="none" stroke="rgba(217, 119, 6, 0.08)" stroke-width="1.5" />
  
  <!-- แกน X และ Y และเส้นลูกศรพิกัด -->
  <line x1="80" y1="640" x2="1200" y2="640" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  <line x1="80" y1="80" x2="80" y2="640" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  
  <!-- ตัวปล่อยเลเซอร์ (Laser Emitter) -->
  <g transform="translate(180, 500) rotate(-30)">
    <rect x="-30" y="-15" width="60" height="30" rx="6" fill="#334155" stroke="#475569" stroke-width="2" />
    <polygon points="30,-10 45,0 30,10" fill="#f59e0b" />
    <circle cx="30" cy="0" r="4" fill="#ef4444" />
  </g>

  <!-- กระจกสะท้อนบานที่ 1 -->
  <g transform="translate(500, 315) rotate(45)">
    <!-- โครงฐานกระจก -->
    <rect x="-40" y="2" width="80" height="6" rx="2" fill="#1e293b" />
    <!-- ผิวกระจกเรืองแสงฟ้า -->
    <rect x="-40" y="-4" width="80" height="6" rx="1" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
    <!-- เส้นปรกติ (Normal line) การสะท้อน -->
    <line x1="0" y1="-4" x2="0" y2="-40" stroke="rgba(245, 158, 11, 0.5)" stroke-width="1.5" stroke-dasharray="3,3" />
  </g>

  <!-- กระจกสะท้อนบานที่ 2 -->
  <g transform="translate(800, 500) rotate(135)">
    <rect x="-40" y="2" width="80" height="6" rx="2" fill="#1e293b" />
    <rect x="-40" y="-4" width="80" height="6" rx="1" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
  </g>

  <!-- ลำแสงเลเซอร์สีแดงเรืองแสง (Laser Beams) -->
  <!-- ยิงจาก Emitter (180, 500) -> ไปยังกระจก 1 (500, 315) -> ไปยังกระจก 2 (800, 500) -> ไปยังเป้าหมาย (950, 350) -->
  <polyline points="206,485 500,315 800,500 950,350" 
            fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
            filter="url(#glow-laser)" />
  <polyline points="206,485 500,315 800,500 950,350" 
            fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

  <!-- จุดชนสะท้อนเป้าหมายและประกายไฟเรืองแสงสีส้ม -->
  <circle cx="500" cy="315" r="7" fill="#ffffff" filter="url(#glow-laser)" />
  <circle cx="800" cy="500" r="7" fill="#ffffff" filter="url(#glow-laser)" />
  
  <!-- เป้าหมาย (Target) สีทองเรืองแสง -->
  <g transform="translate(950, 350)" filter="url(#glow-gold)">
    <circle cx="0" cy="0" r="45" fill="none" stroke="#fbbf24" stroke-width="4" />
    <circle cx="0" cy="0" r="30" fill="none" stroke="#d97706" stroke-width="3" />
    <circle cx="0" cy="0" r="15" fill="#b45309" />
    <circle cx="0" cy="0" r="6" fill="#ffffff" />
    <text x="0" y="-55" fill="#fbbf24" font-size="14" font-weight="bold" font-family="Sarabun" text-anchor="middle">TARGET (9, 7)</text>
  </g>

  <!-- ── องค์ประกอบข้อความ Title (จัดกึ่งกลาง Safe Zone 60% ตามกฎ) ── -->
  <g transform="translate(640, 180)" text-anchor="middle">
    <!-- เงาตัวหนังสือสีทอง -->
    <text x="0" y="0" fill="#78350f" font-size="76" font-weight="900" font-family="Sarabun" letter-spacing="2" filter="url(#glow-gold)">LASER REFLECT</text>
    <text x="0" y="-4" fill="url(#gold-grad)" font-size="76" font-weight="900" font-family="Sarabun" letter-spacing="2">LASER REFLECT</text>
    
    <!-- ซับไตเติ้ลภาษาไทย -->
    <text x="0" y="46" fill="#fef3c7" font-size="28" font-weight="bold" font-family="Sarabun" letter-spacing="1">พิกัดวิถีสะท้อนเลเซอร์</text>
    
    <!-- สติ๊กเกอร์วิชาการ -->
    <rect x="-80" y="70" width="160" height="28" rx="14" fill="#d97706" />
    <text x="0" y="88" fill="#ffffff" font-size="14" font-weight="bold" font-family="Sarabun">คณิตศาสตร์ ป.4 - ป.6</text>
  </g>

  <!-- ตกแต่งมุมตารางเก๋ๆ -->
  <text x="110" y="625" fill="#94a3b8" font-size="11" font-family="Sarabun">(1, 1)</text>
  <text x="515" y="340" fill="#94a3b8" font-size="11" font-family="Sarabun">สะท้อน: 45°</text>
  <text x="815" y="480" fill="#94a3b8" font-size="11" font-family="Sarabun">สะท้อน: 135°</text>
</svg>
`;

async function generateCover() {
  const outputPath = path.resolve('public/games/math/laser-reflect/cover.png');
  const dir = path.dirname(outputPath);
  
  // ตรวจสอบโฟลเดอร์ปลายทาง
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
