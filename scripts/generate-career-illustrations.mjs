// scripts/generate-career-illustrations.mjs
// Generates 25 high-quality, kid-friendly 512x512 WebP illustrations for Career & Housework (การงานอาชีพ)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.resolve('public/games/career/illustrations');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to create circular badge with soft background, tool graphic, and clear badge title
function wrapCard(content, bgGrad, title, badgeColor = '#0F172A') {
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${bgGrad[0]}" />
      <stop offset="70%" stop-color="${bgGrad[1]}" />
      <stop offset="100%" stop-color="${bgGrad[2]}" />
    </radialGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="rgba(0,0,0,0.14)" />
    </filter>
    <filter id="iconShadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.18)" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="40" fill="url(#bg)" />

  <!-- Inner Soft Container -->
  <circle cx="256" cy="225" r="185" fill="#FFFFFF" opacity="0.92" filter="url(#cardShadow)" />
  <circle cx="256" cy="225" r="175" fill="#F8FAFC" stroke="${bgGrad[1]}" stroke-width="4" stroke-dasharray="10 6" opacity="0.6" />

  <!-- Main Illustration Content -->
  <g filter="url(#iconShadow)">
    ${content}
  </g>

  <!-- Title Ribbon at Bottom -->
  <rect x="36" y="420" width="440" height="66" rx="20" fill="#FFFFFF" filter="url(#cardShadow)" />
  <rect x="40" y="424" width="432" height="58" rx="17" fill="${bgGrad[1]}" opacity="0.15" />
  <text x="256" y="462" text-anchor="middle" font-family="'Sarabun', 'Segoe UI', Tahoma, sans-serif" font-size="24" font-weight="bold" fill="${badgeColor}">
    ${title}
  </text>
</svg>
  `.trim();
}

const assets = [
  {
    filename: 'coconut-broom.webp',
    title: 'ไม้กวาดทางมะพร้าวมีด้าม',
    bg: ['#FEF3C7', '#FDE68A', '#F59E0B'],
    badgeColor: '#78350F',
    svg: `
      <!-- Bamboo/Wooden Handle -->
      <line x1="256" y1="70" x2="256" y2="220" stroke="#92400E" stroke-width="20" stroke-linecap="round" />
      <line x1="256" y1="70" x2="256" y2="220" stroke="#B45309" stroke-width="12" stroke-linecap="round" />
      <!-- Wire / Cord Binding -->
      <rect x="238" y="210" width="36" height="30" rx="6" fill="#D97706" stroke="#78350F" stroke-width="3" />
      <line x1="240" y1="220" x2="272" y2="220" stroke="#78350F" stroke-width="3" />
      <line x1="240" y1="230" x2="272" y2="230" stroke="#78350F" stroke-width="3" />
      <!-- Coconut Palm Ribs Bristles -->
      <path d="M 238 240 Q 200 310 170 360 Q 256 370 342 360 Q 312 310 274 240 Z" fill="#78350F" stroke="#451A03" stroke-width="3" />
      <!-- Bristle Lines -->
      <line x1="248" y1="240" x2="190" y2="355" stroke="#D97706" stroke-width="4" stroke-linecap="round" />
      <line x1="252" y1="240" x2="220" y2="360" stroke="#D97706" stroke-width="4" stroke-linecap="round" />
      <line x1="256" y1="240" x2="256" y2="362" stroke="#FEF3C7" stroke-width="4" stroke-linecap="round" />
      <line x1="260" y1="240" x2="292" y2="360" stroke="#D97706" stroke-width="4" stroke-linecap="round" />
      <line x1="264" y1="240" x2="322" y2="355" stroke="#D97706" stroke-width="4" stroke-linecap="round" />
      <!-- Outdoor Ground Accent -->
      <ellipse cx="256" cy="375" rx="100" ry="12" fill="#E2E8F0" />
      <circle cx="160" cy="365" r="8" fill="#94A3B8" />
      <circle cx="350" cy="368" r="6" fill="#94A3B8" />
    `
  },
  {
    filename: 'grass-broom.webp',
    title: 'ไม้กวาดดอกหญ้า',
    bg: ['#DCFCE7', '#BBF7D0', '#4ADE80'],
    badgeColor: '#14532D',
    svg: `
      <!-- Plastic/Woven Grip Handle -->
      <line x1="256" y1="65" x2="256" y2="200" stroke="#16A34A" stroke-width="22" stroke-linecap="round" />
      <line x1="256" y1="65" x2="256" y2="200" stroke="#4ADE80" stroke-width="12" stroke-linecap="round" />
      <circle cx="256" cy="65" r="14" fill="#15803D" />
      <!-- Bound Woven Collar -->
      <path d="M 230 200 L 282 200 L 295 245 L 217 245 Z" fill="#DC2626" stroke="#991B1B" stroke-width="3" />
      <line x1="222" y1="220" x2="290" y2="220" stroke="#FDE047" stroke-width="4" />
      <line x1="219" y1="235" x2="293" y2="235" stroke="#FDE047" stroke-width="4" />
      <!-- Wide Fan-shaped Straw Grass Bristles -->
      <path d="M 217 245 Q 160 300 135 360 Q 256 375 377 360 Q 352 300 295 245 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="3" />
      <!-- Grass Rib Strands -->
      <line x1="225" y1="245" x2="160" y2="355" stroke="#EAB308" stroke-width="3" />
      <line x1="235" y1="245" x2="195" y2="362" stroke="#CA8A04" stroke-width="3" />
      <line x1="248" y1="245" x2="235" y2="368" stroke="#EAB308" stroke-width="3" />
      <line x1="264" y1="245" x2="277" y2="368" stroke="#CA8A04" stroke-width="3" />
      <line x1="277" y1="245" x2="317" y2="362" stroke="#EAB308" stroke-width="3" />
      <line x1="287" y1="245" x2="352" y2="355" stroke="#CA8A04" stroke-width="3" />
      <!-- Indoor Sparkle Clean Accent -->
      <path d="M 360 210 Q 365 225 380 230 Q 365 235 360 250 Q 355 235 340 230 Q 355 225 360 210 Z" fill="#F59E0B" />
      <path d="M 140 220 Q 144 232 156 236 Q 144 240 140 252 Q 136 240 124 236 Q 136 232 140 220 Z" fill="#F59E0B" />
    `
  },
  {
    filename: 'mop-bucket.webp',
    title: 'ไม้ถูพื้นและถังน้ำ',
    bg: ['#E0F2FE', '#BAE6FD', '#38BDF8'],
    badgeColor: '#0369A1',
    svg: `
      <!-- Bucket Base -->
      <path d="M 270 230 L 390 230 L 375 350 L 285 350 Z" fill="#0284C7" stroke="#0369A1" stroke-width="4" />
      <!-- Bucket Rim -->
      <ellipse cx="330" cy="230" rx="60" ry="18" fill="#38BDF8" stroke="#0369A1" stroke-width="4" />
      <ellipse cx="330" cy="230" rx="50" ry="12" fill="#E0F2FE" />
      <!-- Bucket Handle -->
      <path d="M 270 230 Q 255 190 330 185 Q 405 190 390 230" fill="none" stroke="#64748B" stroke-width="6" stroke-linecap="round" />
      <!-- Water Waves inside -->
      <path d="M 290 270 Q 330 280 370 270" stroke="#38BDF8" stroke-width="4" fill="none" stroke-linecap="round" />
      <!-- Mop Pole -->
      <line x1="170" y1="70" x2="220" y2="300" stroke="#64748B" stroke-width="16" stroke-linecap="round" />
      <line x1="170" y1="70" x2="220" y2="300" stroke="#94A3B8" stroke-width="8" stroke-linecap="round" />
      <circle cx="170" cy="70" r="12" fill="#0284C7" />
      <!-- Mop Clamp -->
      <rect x="200" y="290" width="40" height="22" rx="6" fill="#F97316" stroke="#C2410C" stroke-width="3" transform="rotate(12 220 300)" />
      <!-- Mop Cloth Strips -->
      <path d="M 195 310 Q 180 360 160 370 Q 230 380 260 365 Q 235 330 235 315 Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="3" />
      <line x1="205" y1="315" x2="185" y2="365" stroke="#CBD5E1" stroke-width="4" />
      <line x1="220" y1="315" x2="215" y2="370" stroke="#CBD5E1" stroke-width="4" />
      <line x1="235" y1="315" x2="245" y2="365" stroke="#CBD5E1" stroke-width="4" />
      <!-- Water Droplets -->
      <circle cx="160" cy="330" r="6" fill="#38BDF8" />
      <circle cx="270" cy="360" r="5" fill="#38BDF8" />
    `
  },
  {
    filename: 'mopping-backwards.webp',
    title: 'การถูพื้นเดินถอยหลัง',
    bg: ['#F1F5F9', '#E2E8F0', '#94A3B8'],
    badgeColor: '#1E293B',
    svg: `
      <!-- Floor Grid Tiles -->
      <path d="M 120 180 L 392 180 L 432 360 L 80 360 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="4" />
      <line x1="256" y1="180" x2="256" y2="360" stroke="#CBD5E1" stroke-width="4" />
      <line x1="100" y1="270" x2="412" y2="270" stroke="#CBD5E1" stroke-width="4" />
      <!-- Clean Shiny Zone on Top Tiles -->
      <rect x="120" y="180" width="272" height="90" fill="#BAE6FD" opacity="0.4" />
      <text x="256" y="215" text-anchor="middle" font-size="16" font-weight="bold" fill="#0284C7">✨ พื้นสะอาดแห้งแล้ว</text>
      <!-- Backward Footprints (Stepping Backwards) -->
      <!-- Footprint Left -->
      <ellipse cx="200" cy="320" rx="14" ry="24" fill="#475569" transform="rotate(-10 200 320)" />
      <circle cx="195" cy="290" r="5" fill="#475569" />
      <circle cx="205" cy="292" r="4.5" fill="#475569" />
      <!-- Footprint Right -->
      <ellipse cx="280" cy="340" rx="14" ry="24" fill="#475569" transform="rotate(10 280 340)" />
      <circle cx="275" cy="310" r="4.5" fill="#475569" />
      <circle cx="285" cy="312" r="5" fill="#475569" />
      <!-- Backward Arrows -->
      <path d="M 256 240 L 256 295" stroke="#DC2626" stroke-width="8" stroke-linecap="round" />
      <polyline points="240,280 256,305 272,280" fill="none" stroke="#DC2626" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="160" y="120" width="192" height="38" rx="12" fill="#DC2626" />
      <text x="256" y="145" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFFFFF">ถอยหลังขณะถูพื้น ⬇️</text>
    `
  },
  {
    filename: 'dishwashing.webp',
    title: 'การล้างจานชามและฟองน้ำ',
    bg: ['#E0F2FE', '#7DD3FC', '#0284C7'],
    badgeColor: '#075985',
    svg: `
      <!-- Big Clean Ceramic Plate -->
      <circle cx="256" cy="220" r="115" fill="#F8FAFC" stroke="#94A3B8" stroke-width="6" />
      <circle cx="256" cy="220" r="85" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" />
      <!-- Plate Rim Shine -->
      <path d="M 170 190 A 90 90 0 0 1 230 135" fill="none" stroke="#38BDF8" stroke-width="6" stroke-linecap="round" />
      <!-- Dishwashing Sponge Scrubber -->
      <g transform="translate(230, 210) rotate(-15)">
        <rect x="0" y="0" width="110" height="60" rx="16" fill="#FACC15" stroke="#CA8A04" stroke-width="4" />
        <rect x="0" y="0" width="110" height="18" rx="8" fill="#15803D" stroke="#166534" stroke-width="3" />
      </g>
      <!-- Soapy Foam Bubbles -->
      <circle cx="210" cy="180" r="22" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <circle cx="235" cy="160" r="16" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <circle cx="180" cy="205" r="14" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <circle cx="330" cy="170" r="18" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <circle cx="310" cy="280" r="15" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <circle cx="170" cy="270" r="20" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" opacity="0.9" />
      <!-- Sparkles -->
      <path d="M 330 110 Q 333 120 345 123 Q 333 126 330 136 Q 327 126 315 123 Q 327 120 330 110 Z" fill="#FACC15" />
      <path d="M 150 140 Q 152 148 160 150 Q 152 152 150 160 Q 148 152 140 150 Q 148 148 150 140 Z" fill="#FACC15" />
    `
  },
  {
    filename: 'dish-drying-rack.webp',
    title: 'ตะแกรงคว่ำจานชาม',
    bg: ['#F3E8FF', '#E9D5FF', '#C084FC'],
    badgeColor: '#6B21A8',
    svg: `
      <!-- Wire Drying Rack Frame -->
      <rect x="110" y="220" width="292" height="120" rx="14" fill="#F8FAFC" stroke="#64748B" stroke-width="6" />
      <!-- Rack Wire Slots -->
      <line x1="160" y1="220" x2="160" y2="340" stroke="#94A3B8" stroke-width="5" />
      <line x1="210" y1="220" x2="210" y2="340" stroke="#94A3B8" stroke-width="5" />
      <line x1="260" y1="220" x2="260" y2="340" stroke="#94A3B8" stroke-width="5" />
      <line x1="310" y1="220" x2="310" y2="340" stroke="#94A3B8" stroke-width="5" />
      <line x1="360" y1="220" x2="360" y2="340" stroke="#94A3B8" stroke-width="5" />
      <!-- Rack Legs -->
      <line x1="130" y1="340" x2="130" y2="365" stroke="#475569" stroke-width="8" stroke-linecap="round" />
      <line x1="382" y1="340" x2="382" y2="365" stroke="#475569" stroke-width="8" stroke-linecap="round" />
      <!-- Draining Tray Underneath -->
      <rect x="90" y="360" width="332" height="16" rx="8" fill="#CBD5E1" stroke="#94A3B8" stroke-width="3" />
      <!-- Inverted Plates Sitting In Slots -->
      <ellipse cx="185" cy="180" rx="35" ry="65" fill="#FFFFFF" stroke="#0284C7" stroke-width="4" transform="rotate(-15 185 180)" />
      <ellipse cx="235" cy="175" rx="35" ry="65" fill="#FFFFFF" stroke="#16A34A" stroke-width="4" transform="rotate(-15 235 175)" />
      <ellipse cx="285" cy="170" rx="35" ry="65" fill="#FFFFFF" stroke="#EA580C" stroke-width="4" transform="rotate(-15 285 170)" />
      <!-- Inverted Glass / Cup on Right -->
      <path d="M 335 190 L 375 190 L 365 240 L 345 240 Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="4" />
      <!-- Air Breeze & Water Drips -->
      <path d="M 120 130 Q 150 115 180 130" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" />
      <path d="M 140 145 Q 170 130 200 145" fill="none" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" />
      <circle cx="230" cy="350" r="4" fill="#38BDF8" />
      <circle cx="355" cy="350" r="4" fill="#38BDF8" />
    `
  },
  {
    filename: 'laundry-sorting.webp',
    title: 'การแยกผ้าขาวและผ้าสีก่อนซัก',
    bg: ['#FEF2F2', '#FEE2E2', '#FCA5A5'],
    badgeColor: '#991B1B',
    svg: `
      <!-- Basket 1: White Clothes (Left) -->
      <path d="M 120 200 L 220 200 L 210 330 L 130 330 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="5" />
      <ellipse cx="170" cy="200" rx="50" ry="16" fill="#F1F5F9" stroke="#94A3B8" stroke-width="5" />
      <rect x="135" y="240" width="70" height="28" rx="6" fill="#E2E8F0" />
      <text x="170" y="260" text-anchor="middle" font-size="16" font-weight="bold" fill="#334155">ผ้าขาว</text>
      <!-- White Shirts overflowing -->
      <ellipse cx="170" cy="180" rx="35" ry="25" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3" />
      <path d="M 155 170 L 170 190 L 185 170" fill="none" stroke="#64748B" stroke-width="3" />

      <!-- Basket 2: Colored Clothes (Right) -->
      <path d="M 292 200 L 392 200 L 382 330 L 302 330 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="5" />
      <ellipse cx="342" cy="200" rx="50" ry="16" fill="#FECACA" stroke="#EF4444" stroke-width="5" />
      <rect x="307" y="240" width="70" height="28" rx="6" fill="#EF4444" />
      <text x="342" y="260" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFFFFF">ผ้าสี</text>
      <!-- Colorful clothes overflowing -->
      <ellipse cx="330" cy="180" rx="28" ry="22" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3" />
      <ellipse cx="355" cy="175" rx="25" ry="20" fill="#FACC15" stroke="#CA8A04" stroke-width="3" />

      <!-- Divider / Protection Arrow -->
      <line x1="256" y1="140" x2="256" y2="350" stroke="#DC2626" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="256" cy="170" r="22" fill="#DC2626" />
      <text x="256" y="177" text-anchor="middle" font-size="20" font-weight="bold" fill="#FFFFFF">≠</text>
    `
  },
  {
    filename: 'clothes-mud-soak.webp',
    title: 'การแช่ผ้าเปื้อนโคลนก่อนซัก',
    bg: ['#FEF3C7', '#FDE68A', '#D97706'],
    badgeColor: '#78350F',
    svg: `
      <!-- Washing Basin / Wash Tub -->
      <path d="M 120 230 L 392 230 L 362 360 L 150 360 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="6" />
      <ellipse cx="256" cy="230" rx="136" ry="32" fill="#60A5FA" stroke="#1D4ED8" stroke-width="6" />
      <ellipse cx="256" cy="230" rx="122" ry="24" fill="#93C5FD" />
      <!-- Water level inside -->
      <ellipse cx="256" cy="260" rx="110" ry="20" fill="#BFDBFE" />
      <!-- Soaking T-Shirt with Mud Spots -->
      <path d="M 210 200 L 240 180 L 256 195 L 272 180 L 302 200 L 285 280 L 227 280 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4" />
      <!-- Mud Spots on Shirt -->
      <ellipse cx="245" cy="240" rx="16" ry="12" fill="#78350F" opacity="0.85" />
      <ellipse cx="265" cy="255" rx="12" ry="8" fill="#78350F" opacity="0.85" />
      <ellipse cx="240" cy="265" rx="8" ry="6" fill="#78350F" opacity="0.85" />
      <!-- Laundry Brush on Basin Rim -->
      <g transform="translate(130, 200) rotate(-20)">
        <rect x="0" y="0" width="75" height="30" rx="8" fill="#F97316" stroke="#C2410C" stroke-width="3" />
        <rect x="0" y="24" width="75" height="15" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2" />
        <line x1="15" y1="24" x2="15" y2="39" stroke="#64748B" stroke-width="2" />
        <line x1="30" y1="24" x2="30" y2="39" stroke="#64748B" stroke-width="2" />
        <line x1="45" y1="24" x2="45" y2="39" stroke="#64748B" stroke-width="2" />
        <line x1="60" y1="24" x2="60" y2="39" stroke="#64748B" stroke-width="2" />
      </g>
      <!-- Soap Bubbles in Basin -->
      <circle cx="200" cy="245" r="14" fill="#FFFFFF" stroke="#60A5FA" stroke-width="2" opacity="0.9" />
      <circle cx="295" cy="235" r="16" fill="#FFFFFF" stroke="#60A5FA" stroke-width="2" opacity="0.9" />
      <circle cx="315" cy="255" r="10" fill="#FFFFFF" stroke="#60A5FA" stroke-width="2" opacity="0.9" />
    `
  },
  {
    filename: 'clothes-drying-shade.webp',
    title: 'การตากผ้ากลับด้านในที่ร่ม',
    bg: ['#ECFDF5', '#A7F3D0', '#10B981'],
    badgeColor: '#064E3B',
    svg: `
      <!-- Roof Canopy / Shaded Area -->
      <polygon points="100,100 412,100 380,135 132,135" fill="#64748B" stroke="#334155" stroke-width="4" />
      <rect x="140" y="135" width="232" height="12" fill="#94A3B8" />
      <text x="256" y="90" text-anchor="middle" font-size="16" font-weight="bold" fill="#047857">⛱️ ที่ร่มรำไร ลมโกรก ไม่โดนแดดจัด</text>

      <!-- Clothesline Cable -->
      <line x1="100" y1="165" x2="412" y2="165" stroke="#64748B" stroke-width="5" />

      <!-- Clothespeg Clothespins -->
      <rect x="200" y="155" width="8" height="20" rx="3" fill="#EF4444" />
      <rect x="225" y="155" width="8" height="20" rx="3" fill="#EF4444" />
      <rect x="280" y="155" width="8" height="20" rx="3" fill="#3B82F6" />
      <rect x="305" y="155" width="8" height="20" rx="3" fill="#3B82F6" />

      <!-- Shirt 1: Inside-out Bright Red Shirt -->
      <path d="M 185 165 L 210 180 L 235 165 L 245 280 L 175 280 Z" fill="#F87171" stroke="#DC2626" stroke-width="4" />
      <!-- Seam lines showing inside-out -->
      <line x1="185" y1="185" x2="235" y2="265" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4" />
      <line x1="235" y1="185" x2="185" y2="265" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4" />

      <!-- Shirt 2: Inside-out Bright Blue Shirt -->
      <path d="M 265 165 L 290 180 L 315 165 L 325 280 L 255 280 Z" fill="#60A5FA" stroke="#2563EB" stroke-width="4" />
      <line x1="265" y1="185" x2="315" y2="265" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4" />
      <line x1="315" y1="185" x2="265" y2="265" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4" />

      <!-- Wind / Breeze curves -->
      <path d="M 120 240 Q 145 225 170 240" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round" />
      <path d="M 330 230 Q 360 215 390 230" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round" />
      <path d="M 345 250 Q 370 240 395 250" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
    `
  },
  {
    filename: 'wardrobe-organized.webp',
    title: 'การจัดตู้เสื้อผ้าเป็นระเบียบ',
    bg: ['#FDF4FF', '#F5D0FE', '#E879F9'],
    badgeColor: '#701A75',
    svg: `
      <!-- Wardrobe Cabinet Body -->
      <rect x="120" y="80" width="272" height="280" rx="16" fill="#F8FAFC" stroke="#854D0E" stroke-width="8" />
      <!-- Hanging Rail Division (Left side) -->
      <line x1="256" y1="80" x2="256" y2="360" stroke="#854D0E" stroke-width="6" />
      <!-- Left: Hanging Rod -->
      <line x1="130" y1="120" x2="250" y2="120" stroke="#94A3B8" stroke-width="6" />
      <!-- Hanging Shirts -->
      <!-- Shirt 1 -->
      <path d="M 155 125 L 175 140 L 155 240 L 135 240 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="3" />
      <!-- Shirt 2 -->
      <path d="M 185 125 L 205 140 L 185 240 L 165 240 Z" fill="#F87171" stroke="#DC2626" stroke-width="3" />
      <!-- Shirt 3 -->
      <path d="M 215 125 L 235 140 L 215 240 L 195 240 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="3" />

      <!-- Right: Folded Shelves -->
      <line x1="256" y1="170" x2="384" y2="170" stroke="#854D0E" stroke-width="5" />
      <line x1="256" y1="260" x2="384" y2="260" stroke="#854D0E" stroke-width="5" />

      <!-- Folded Clothes Stack (Top Shelf) -->
      <rect x="275" y="130" width="90" height="16" rx="5" fill="#34D399" stroke="#059669" stroke-width="2" />
      <rect x="275" y="145" width="90" height="16" rx="5" fill="#60A5FA" stroke="#2563EB" stroke-width="2" />

      <!-- Folded Towels Stack (Middle Shelf) -->
      <rect x="275" y="215" width="90" height="18" rx="5" fill="#FB923C" stroke="#EA580C" stroke-width="2" />
      <rect x="275" y="232" width="90" height="18" rx="5" fill="#F472B6" stroke="#DB2777" stroke-width="2" />

      <!-- Storage Boxes (Bottom Shelf) -->
      <rect x="270" y="295" width="100" height="50" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3" />
      <circle cx="320" cy="320" r="5" fill="#64748B" />
    `
  },
  {
    filename: 'pencil-case.webp',
    title: 'กล่องดินสอและเครื่องเขียน',
    bg: ['#EFF6FF', '#DBEAFE', '#93C5FD'],
    badgeColor: '#1E3A8A',
    svg: `
      <!-- Pencil Case Pouch Base -->
      <rect x="110" y="180" width="292" height="140" rx="28" fill="#3B82F6" stroke="#1D4ED8" stroke-width="6" />
      <path d="M 110 200 L 402 200" stroke="#1E40AF" stroke-width="8" />
      <!-- Zipper Track & Pull Tab -->
      <line x1="130" y1="192" x2="382" y2="192" stroke="#FDE047" stroke-width="4" stroke-dasharray="6 4" />
      <rect x="360" y="186" width="16" height="24" rx="4" fill="#F59E0B" stroke="#B45309" stroke-width="2" />

      <!-- Pencil 1 (Yellow) -->
      <g transform="translate(140, 110) rotate(-15)">
        <polygon points="12,0 0,35 24,35" fill="#FDE047" />
        <polygon points="12,0 7,15 17,15" fill="#1E293B" />
        <rect x="0" y="35" width="24" height="100" fill="#EAB308" stroke="#CA8A04" stroke-width="2" />
        <rect x="0" y="125" width="24" height="18" rx="4" fill="#F43F5E" />
      </g>

      <!-- Ruler (Green Transparent) -->
      <g transform="translate(240, 100) rotate(10)">
        <rect x="0" y="0" width="36" height="150" rx="6" fill="#4ADE80" stroke="#16A34A" stroke-width="3" opacity="0.9" />
        <line x1="0" y1="30" x2="16" y2="30" stroke="#15803D" stroke-width="2" />
        <line x1="0" y1="60" x2="22" y2="60" stroke="#15803D" stroke-width="2" />
        <line x1="0" y1="90" x2="16" y2="90" stroke="#15803D" stroke-width="2" />
        <line x1="0" y1="120" x2="22" y2="120" stroke="#15803D" stroke-width="2" />
      </g>

      <!-- Eraser (Blue & White) -->
      <g transform="translate(320, 130) rotate(25)">
        <rect x="0" y="0" width="34" height="70" rx="8" fill="#F8FAFC" stroke="#64748B" stroke-width="3" />
        <rect x="0" y="25" width="34" height="45" fill="#0284C7" />
        <text x="17" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#FFFFFF">ERASER</text>
      </g>
    `
  },
  {
    filename: 'schoolbag-schedule.webp',
    title: 'การจัดกระเป๋าตามตารางเรียน',
    bg: ['#FFFBEB', '#FEF3C7', '#FBBF24'],
    badgeColor: '#78350F',
    svg: `
      <!-- Backpack Body -->
      <rect x="140" y="110" width="232" height="250" rx="45" fill="#EA580C" stroke="#9A3412" stroke-width="7" />
      <!-- Top Handle -->
      <path d="M 210 110 Q 256 60 302 110" fill="none" stroke="#9A3412" stroke-width="10" stroke-linecap="round" />
      <!-- Front Zipper Pocket -->
      <rect x="170" y="210" width="172" height="120" rx="24" fill="#FB923C" stroke="#9A3412" stroke-width="5" />
      <line x1="190" y1="230" x2="322" y2="230" stroke="#FEF08A" stroke-width="4" stroke-dasharray="6 4" />
      <!-- Side Water Bottle Pocket -->
      <rect x="115" y="220" width="28" height="80" rx="10" fill="#C2410C" />
      <rect x="122" y="195" width="14" height="30" rx="4" fill="#38BDF8" />

      <!-- Textbooks Poking Out Organized -->
      <rect x="170" y="100" width="30" height="70" rx="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3" transform="rotate(-8 170 100)" />
      <rect x="210" y="90" width="30" height="80" rx="5" fill="#22C55E" stroke="#15803D" stroke-width="3" />
      <rect x="250" y="95" width="30" height="75" rx="5" fill="#EC4899" stroke="#BE185D" stroke-width="3" transform="rotate(6 250 95)" />

      <!-- Timetable Card Attached -->
      <rect x="275" y="250" width="65" height="50" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2" />
      <line x1="282" y1="262" x2="330" y2="262" stroke="#EF4444" stroke-width="3" />
      <line x1="282" y1="272" x2="325" y2="272" stroke="#64748B" stroke-width="2" />
      <line x1="282" y1="280" x2="320" y2="280" stroke="#64748B" stroke-width="2" />
      <line x1="282" y1="288" x2="328" y2="288" stroke="#64748B" stroke-width="2" />
    `
  },
  {
    filename: 'courtyard-sweeping.webp',
    title: 'การช่วยกวาดลานบ้าน',
    bg: ['#FEF9C3', '#FEF08A', '#FACC15'],
    badgeColor: '#713F12',
    svg: `
      <!-- Courtyard Ground / Yard -->
      <path d="M 90 280 Q 256 260 422 280 L 422 360 L 90 360 Z" fill="#D97706" opacity="0.3" />
      <!-- Dry Leaves on Ground -->
      <!-- Leaf 1 (Brown) -->
      <path d="M 140 310 Q 160 290 180 310 Q 160 330 140 310 Z" fill="#B45309" stroke="#78350F" stroke-width="2" />
      <!-- Leaf 2 (Orange) -->
      <path d="M 200 325 Q 215 305 235 320 Q 215 340 200 325 Z" fill="#EA580C" stroke="#9A3412" stroke-width="2" />
      <!-- Leaf 3 (Yellow) -->
      <path d="M 330 315 Q 350 295 370 315 Q 350 335 330 315 Z" fill="#CA8A04" stroke="#854D0E" stroke-width="2" />

      <!-- Sweeping Coconut Broom in Action -->
      <g transform="translate(220, 100) rotate(22)">
        <line x1="0" y1="0" x2="0" y2="160" stroke="#92400E" stroke-width="14" stroke-linecap="round" />
        <rect x="-15" y="150" width="30" height="24" rx="4" fill="#D97706" />
        <path d="M -15 174 Q -35 230 -50 260 Q 0 270 50 260 Q 35 230 15 174 Z" fill="#78350F" stroke="#451A03" stroke-width="2" />
        <line x1="-5" y1="174" x2="-25" y2="255" stroke="#FBBF24" stroke-width="3" />
        <line x1="0" y1="174" x2="0" y2="260" stroke="#FBBF24" stroke-width="3" />
        <line x1="5" y1="174" x2="25" y2="255" stroke="#FBBF24" stroke-width="3" />
      </g>

      <!-- Sweeping Dust Motion Lines -->
      <path d="M 230 340 Q 260 335 290 345" fill="none" stroke="#CA8A04" stroke-width="3" stroke-linecap="round" />
      <path d="M 240 352 Q 270 348 300 355" fill="none" stroke="#CA8A04" stroke-width="3" stroke-linecap="round" />
    `
  },
  {
    filename: 'toilet-brush.webp',
    title: 'แปรงขัดโถสุขภัณฑ์',
    bg: ['#E0F2FE', '#BAE6FD', '#0284C7'],
    badgeColor: '#0C4A6E',
    svg: `
      <!-- Toilet Brush Holder Stand -->
      <path d="M 160 240 L 230 240 L 220 350 L 170 350 Z" fill="#FFFFFF" stroke="#64748B" stroke-width="5" />
      <ellipse cx="195" cy="240" rx="35" ry="12" fill="#E2E8F0" stroke="#64748B" stroke-width="5" />

      <!-- Toilet Brush Handle Sticking Up -->
      <line x1="280" y1="75" x2="215" y2="260" stroke="#0284C7" stroke-width="16" stroke-linecap="round" />
      <circle cx="280" cy="75" r="14" fill="#0369A1" />
      <line x1="280" y1="75" x2="215" y2="260" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" />

      <!-- Brush Bristle Head (Curved for Toilet Rim) -->
      <g transform="translate(300, 240)">
        <ellipse cx="20" cy="40" rx="32" ry="42" fill="#38BDF8" stroke="#0284C7" stroke-width="4" />
        <!-- Bristle Spikes -->
        <line x1="20" y1="0" x2="20" y2="80" stroke="#FFFFFF" stroke-width="4" />
        <line x1="-10" y1="15" x2="50" y2="65" stroke="#FFFFFF" stroke-width="4" />
        <line x1="-10" y1="65" x2="50" y2="15" stroke="#FFFFFF" stroke-width="4" />
      </g>

      <!-- Bathroom Cleaning Spray Bottle (Right) -->
      <rect x="360" y="210" width="45" height="120" rx="14" fill="#10B981" stroke="#047857" stroke-width="4" />
      <rect x="372" y="175" width="20" height="35" fill="#D1FAE5" stroke="#047857" stroke-width="3" />
      <!-- Spray Trigger -->
      <path d="M 370 175 L 350 160 L 395 160 L 390 175 Z" fill="#047857" />
      <path d="M 355 175 Q 345 190 355 200" fill="none" stroke="#047857" stroke-width="4" stroke-linecap="round" />

      <!-- Clean Shine Stars -->
      <path d="M 230 150 Q 233 160 245 163 Q 233 166 230 176 Q 227 166 215 163 Q 227 160 230 150 Z" fill="#FACC15" />
    `
  },
  {
    filename: 'sneakers-wash.webp',
    title: 'การซักรองเท้าผ้าใบ',
    bg: ['#EFF6FF', '#BFDBFE', '#3B82F6'],
    badgeColor: '#1E3A8A',
    svg: `
      <!-- White/Blue Sneaker -->
      <path d="M 120 280 C 130 250 170 230 210 235 C 240 238 270 210 320 210 C 370 210 395 240 400 280 C 400 300 380 310 350 310 L 140 310 C 120 310 115 295 120 280 Z" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="6" />
      <!-- Sneaker Rubber Sole -->
      <path d="M 115 285 L 400 285 L 395 315 L 125 315 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="4" />
      <!-- Blue Accent Stripe -->
      <path d="M 200 245 Q 260 260 320 240" fill="none" stroke="#3B82F6" stroke-width="8" stroke-linecap="round" />
      <!-- Shoelaces -->
      <line x1="260" y1="215" x2="285" y2="235" stroke="#94A3B8" stroke-width="4" stroke-linecap="round" />
      <line x1="285" y1="215" x2="260" y2="235" stroke="#94A3B8" stroke-width="4" stroke-linecap="round" />
      <line x1="290" y1="225" x2="315" y2="245" stroke="#94A3B8" stroke-width="4" stroke-linecap="round" />

      <!-- Shoe Cleaning Brush (Above) -->
      <g transform="translate(190, 110) rotate(-12)">
        <rect x="0" y="0" width="120" height="35" rx="10" fill="#F59E0B" stroke="#B45309" stroke-width="4" />
        <rect x="0" y="32" width="120" height="24" fill="#334155" />
        <line x1="20" y1="32" x2="20" y2="56" stroke="#94A3B8" stroke-width="3" />
        <line x1="45" y1="32" x2="45" y2="56" stroke="#94A3B8" stroke-width="3" />
        <line x1="70" y1="32" x2="70" y2="56" stroke="#94A3B8" stroke-width="3" />
        <line x1="95" y1="32" x2="95" y2="56" stroke="#94A3B8" stroke-width="3" />
      </g>

      <!-- Soap Foam Clouds -->
      <circle cx="210" cy="200" r="14" fill="#FFFFFF" stroke="#60A5FA" stroke-width="3" />
      <circle cx="330" cy="180" r="16" fill="#FFFFFF" stroke="#60A5FA" stroke-width="3" />
      <circle cx="355" cy="195" r="12" fill="#FFFFFF" stroke="#60A5FA" stroke-width="3" />
    `
  },
  {
    filename: 'cleaning-rag.webp',
    title: 'ผ้าขี้ริ้วซักสะอาดตากแห้ง',
    bg: ['#F1F5F9', '#CBD5E1', '#64748B'],
    badgeColor: '#0F172A',
    svg: `
      <!-- Small Clothes Airer / Drying Stand -->
      <line x1="130" y1="120" x2="382" y2="120" stroke="#475569" stroke-width="8" stroke-linecap="round" />
      <line x1="160" y1="120" x2="140" y2="350" stroke="#475569" stroke-width="8" stroke-linecap="round" />
      <line x1="352" y1="120" x2="372" y2="350" stroke="#475569" stroke-width="8" stroke-linecap="round" />
      <!-- Feet of Stand -->
      <line x1="110" y1="350" x2="170" y2="350" stroke="#334155" stroke-width="8" stroke-linecap="round" />
      <line x1="340" y1="350" x2="400" y2="350" stroke="#334155" stroke-width="8" stroke-linecap="round" />

      <!-- Clean Folded Microfiber Rag 1 (Yellow) -->
      <path d="M 180 120 L 250 120 L 245 270 L 175 270 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="4" />
      <!-- Checkerboard / Waffle Texture -->
      <line x1="180" y1="160" x2="248" y2="160" stroke="#EAB308" stroke-width="2" />
      <line x1="178" y1="200" x2="246" y2="200" stroke="#EAB308" stroke-width="2" />
      <line x1="176" y1="240" x2="244" y2="240" stroke="#EAB308" stroke-width="2" />

      <!-- Clean Folded Microfiber Rag 2 (Blue) -->
      <path d="M 270 120 L 340 120 L 335 250 L 265 250 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="4" />
      <line x1="270" y1="160" x2="338" y2="160" stroke="#0EA5E9" stroke-width="2" />
      <line x1="268" y1="200" x2="336" y2="200" stroke="#0EA5E9" stroke-width="2" />

      <!-- Sparkle of Cleanliness -->
      <path d="M 210 80 Q 213 90 225 93 Q 213 96 210 106 Q 207 96 195 93 Q 207 90 210 80 Z" fill="#F59E0B" />
      <path d="M 310 75 Q 312 83 320 85 Q 312 87 310 95 Q 308 87 300 85 Q 308 83 310 75 Z" fill="#0284C7" />
    `
  },
  {
    filename: 'garden-hose.webp',
    title: 'สายยางรดน้ำต้นไม้',
    bg: ['#ECFDF5', '#6EE7B7', '#059669'],
    badgeColor: '#064E3B',
    svg: `
      <!-- Coiled Green Garden Hose -->
      <ellipse cx="230" cy="270" rx="100" ry="40" fill="none" stroke="#15803D" stroke-width="24" />
      <ellipse cx="230" cy="250" rx="90" ry="36" fill="none" stroke="#16A34A" stroke-width="22" />
      <ellipse cx="230" cy="230" rx="80" ry="32" fill="none" stroke="#22C55E" stroke-width="20" />

      <!-- Hose End Leading to Spray Nozzle -->
      <path d="M 290 210 Q 320 180 340 140" fill="none" stroke="#22C55E" stroke-width="20" stroke-linecap="round" />

      <!-- Brass Spray Nozzle -->
      <g transform="translate(340, 140) rotate(-45)">
        <rect x="-10" y="-30" width="20" height="35" rx="5" fill="#F59E0B" stroke="#B45309" stroke-width="3" />
        <polygon points="-16,-30 16,-30 10,-45 -10,-45" fill="#D97706" stroke="#B45309" stroke-width="2" />
        <!-- Water Spray Mist -->
        <path d="M -12 -50 L -45 -110 L 45 -110 L 12 -50 Z" fill="#38BDF8" opacity="0.55" />
        <line x1="-5" y1="-50" x2="-25" y2="-105" stroke="#BAE6FD" stroke-width="3" stroke-linecap="round" />
        <line x1="0" y1="-50" x2="0" y2="-110" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
        <line x1="5" y1="-50" x2="25" y2="-105" stroke="#BAE6FD" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- Water Droplets Spreading -->
      <circle cx="280" cy="70" r="6" fill="#38BDF8" />
      <circle cx="320" cy="50" r="5" fill="#38BDF8" />
      <circle cx="380" cy="65" r="7" fill="#38BDF8" />
    `
  },
  {
    filename: 'bed-making.webp',
    title: 'การเก็บที่นอนและพับผ้าห่ม',
    bg: ['#EFF6FF', '#BFDBFE', '#3B82F6'],
    badgeColor: '#1E3A8A',
    svg: `
      <!-- Bed Frame -->
      <rect x="110" y="180" width="292" height="150" rx="16" fill="#F8FAFC" stroke="#64748B" stroke-width="6" />
      <!-- Headboard -->
      <rect x="95" y="130" width="322" height="60" rx="14" fill="#92400E" stroke="#78350F" stroke-width="6" />
      <!-- Bed Legs -->
      <rect x="120" y="325" width="20" height="35" rx="4" fill="#78350F" />
      <rect x="372" y="325" width="20" height="35" rx="4" fill="#78350F" />

      <!-- Tightly Tucked Bed Mattress Sheet (Smooth Light Blue) -->
      <rect x="115" y="185" width="282" height="135" rx="12" fill="#BAE6FD" stroke="#0284C7" stroke-width="3" />

      <!-- Fluffy Pillow at Head -->
      <rect x="140" y="195" width="100" height="55" rx="18" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4" />
      <line x1="175" y1="215" x2="205" y2="215" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" />

      <!-- Neatly Folded Blanket (Square Pack on Right) -->
      <g transform="translate(265, 205)">
        <rect x="0" y="0" width="115" height="75" rx="12" fill="#F472B6" stroke="#DB2777" stroke-width="4" />
        <line x1="0" y1="25" x2="115" y2="25" stroke="#BE185D" stroke-width="3" />
        <line x1="0" y1="50" x2="115" y2="50" stroke="#BE185D" stroke-width="3" />
      </g>

      <!-- Cleanliness Stars -->
      <path d="M 230 140 Q 233 150 245 153 Q 233 156 230 166 Q 227 156 215 153 Q 227 150 230 140 Z" fill="#FACC15" />
    `
  },
  {
    filename: 'vegetable-garden.webp',
    title: 'แปลงผักสวนครัว',
    bg: ['#ECFDF5', '#A7F3D0', '#10B981'],
    badgeColor: '#064E3B',
    svg: `
      <!-- Raised Garden Bed Wood Box -->
      <path d="M 100 230 L 412 230 L 382 350 L 130 350 Z" fill="#854D0E" stroke="#582900" stroke-width="6" />
      <line x1="100" y1="265" x2="400" y2="265" stroke="#A16207" stroke-width="4" />
      <line x1="115" y1="305" x2="390" y2="305" stroke="#A16207" stroke-width="4" />

      <!-- Rich Soil Inside Bed -->
      <ellipse cx="256" cy="230" rx="150" ry="24" fill="#3D1D02" stroke="#582900" stroke-width="4" />

      <!-- Plant 1: Green Cabbage / Kale (Left) -->
      <g transform="translate(150, 160)">
        <ellipse cx="30" cy="50" rx="30" ry="24" fill="#22C55E" stroke="#15803D" stroke-width="3" />
        <ellipse cx="30" cy="40" rx="22" ry="18" fill="#4ADE80" stroke="#16A34A" stroke-width="3" />
        <circle cx="30" cy="35" r="14" fill="#86EFAC" />
      </g>

      <!-- Plant 2: Morning Glory / Chili (Center) -->
      <g transform="translate(235, 130)">
        <line x1="20" y1="90" x2="20" y2="30" stroke="#15803D" stroke-width="6" />
        <path d="M 20 60 Q -5 45 5 25 Q 25 40 20 60 Z" fill="#22C55E" stroke="#15803D" stroke-width="2" />
        <path d="M 20 45 Q 45 30 35 10 Q 15 25 20 45 Z" fill="#4ADE80" stroke="#16A34A" stroke-width="2" />
        <polygon points="17,30 23,30 20,10" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5" />
      </g>

      <!-- Plant 3: Basil / Lettuce (Right) -->
      <g transform="translate(315, 155)">
        <ellipse cx="30" cy="50" rx="28" ry="22" fill="#16A34A" stroke="#14532D" stroke-width="3" />
        <ellipse cx="30" cy="38" rx="20" ry="16" fill="#22C55E" stroke="#15803D" stroke-width="3" />
        <circle cx="30" cy="32" r="12" fill="#86EFAC" />
      </g>

      <!-- Friendly Sun in Corner -->
      <circle cx="120" cy="110" r="28" fill="#FACC15" stroke="#EAB308" stroke-width="4" />
      <line x1="120" y1="70" x2="120" y2="60" stroke="#EAB308" stroke-width="4" stroke-linecap="round" />
      <line x1="120" y1="150" x2="120" y2="160" stroke="#EAB308" stroke-width="4" stroke-linecap="round" />
      <line x1="80" y1="110" x2="70" y2="110" stroke="#EAB308" stroke-width="4" stroke-linecap="round" />
      <line x1="160" y1="110" x2="170" y2="110" stroke="#EAB308" stroke-width="4" stroke-linecap="round" />
    `
  },
  {
    filename: 'family-cooperation.webp',
    title: 'การทำงานร่วมกันในครอบครัว',
    bg: ['#FFF7ED', '#FFEDD5', '#FB923C'],
    badgeColor: '#9A3412',
    svg: `
      <!-- Big Golden Heart Symbolizing Love & Unity -->
      <path d="M 256 160 C 220 80 120 100 130 180 C 138 250 256 320 256 320 C 256 320 374 250 382 180 C 392 100 292 80 256 160 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="6" />

      <!-- Family Members (Chibi avatars holding hands / working) -->
      <!-- Father (Left) -->
      <circle cx="180" cy="210" r="24" fill="#FED7AA" stroke="#9A3412" stroke-width="3" />
      <rect x="156" y="235" width="48" height="60" rx="16" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3" />
      <!-- Father's hair -->
      <path d="M 156 205 Q 180 185 204 205" fill="#451A03" stroke="#451A03" stroke-width="6" />

      <!-- Child (Center) -->
      <circle cx="256" cy="240" r="20" fill="#FED7AA" stroke="#9A3412" stroke-width="3" />
      <rect x="236" y="260" width="40" height="50" rx="12" fill="#FACC15" stroke="#CA8A04" stroke-width="3" />
      <!-- Child's hair -->
      <path d="M 236 235 Q 256 220 276 235" fill="#78350F" stroke="#78350F" stroke-width="5" />

      <!-- Mother (Right) -->
      <circle cx="332" cy="210" r="24" fill="#FED7AA" stroke="#9A3412" stroke-width="3" />
      <rect x="308" y="235" width="48" height="60" rx="16" fill="#EC4899" stroke="#BE185D" stroke-width="3" />
      <!-- Mother's hair -->
      <path d="M 308 215 Q 332 180 356 215 Q 360 250 356 260" fill="#451A03" stroke="#451A03" stroke-width="6" />

      <!-- Sparkling Stars of Happiness -->
      <path d="M 256 95 Q 259 105 269 108 Q 259 111 256 121 Q 253 111 243 108 Q 253 105 256 95 Z" fill="#F59E0B" />
      <path d="M 140 120 Q 142 128 150 130 Q 142 132 140 140 Q 138 132 130 130 Q 138 128 140 120 Z" fill="#F59E0B" />
      <path d="M 370 120 Q 372 128 380 130 Q 372 132 370 140 Q 368 132 360 130 Q 368 128 370 120 Z" fill="#F59E0B" />
    `
  },
  {
    filename: 'hoe-digging.webp',
    title: 'จอบขุดดินและดายหญ้า',
    bg: ['#FEF3C7', '#FDE68A', '#D97706'],
    badgeColor: '#78350F',
    svg: `
      <!-- Wooden Long Handle -->
      <line x1="140" y1="90" x2="320" y2="280" stroke="#92400E" stroke-width="18" stroke-linecap="round" />
      <line x1="140" y1="90" x2="320" y2="280" stroke="#B45309" stroke-width="10" stroke-linecap="round" />

      <!-- Steel Eye Collar Connection -->
      <ellipse cx="320" cy="280" rx="18" ry="14" fill="#475569" stroke="#1E293B" stroke-width="4" transform="rotate(45 320 280)" />

      <!-- Heavy Steel Blade of Hoe -->
      <path d="M 320 280 L 375 225 L 395 245 L 340 300 Z" fill="#64748B" stroke="#1E293B" stroke-width="4" />
      <polygon points="340,300 395,245 410,260 355,315" fill="#94A3B8" stroke="#1E293B" stroke-width="4" />
      <!-- Sharp Cutting Edge -->
      <line x1="395" y1="245" x2="410" y2="260" stroke="#F8FAFC" stroke-width="6" />

      <!-- Soil Pile Being Dug -->
      <path d="M 280 340 Q 350 310 420 340 Z" fill="#78350F" stroke="#451A03" stroke-width="3" />
      <circle cx="340" cy="330" r="5" fill="#92400E" />
      <circle cx="370" cy="335" r="4" fill="#92400E" />
    `
  },
  {
    filename: 'transplanting-trowel.webp',
    title: 'ช้อนปลูก',
    bg: ['#ECFDF5', '#A7F3D0', '#34D399'],
    badgeColor: '#064E3B',
    svg: `
      <!-- Wooden Handle -->
      <line x1="160" y1="120" x2="230" y2="190" stroke="#92400E" stroke-width="22" stroke-linecap="round" />
      <line x1="160" y1="120" x2="230" y2="190" stroke="#B45309" stroke-width="12" stroke-linecap="round" />
      <!-- Metal Shank Collar -->
      <rect x="220" y="180" width="20" height="24" rx="4" fill="#475569" stroke="#1E293B" stroke-width="3" transform="rotate(45 230 192)" />

      <!-- Pointed Scoop Blade of Trowel -->
      <path d="M 240 200 C 270 210 320 230 350 290 C 330 320 290 320 260 280 C 235 250 230 220 240 200 Z" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
      <!-- Blade Scoop Curve Highlight -->
      <path d="M 255 215 Q 295 245 320 285" fill="none" stroke="#F1F5F9" stroke-width="5" stroke-linecap="round" />

      <!-- Small Seedling Plant beside trowel -->
      <g transform="translate(160, 240)">
        <line x1="20" y1="80" x2="20" y2="40" stroke="#15803D" stroke-width="5" />
        <ellipse cx="10" cy="40" rx="14" ry="9" fill="#22C55E" stroke="#15803D" stroke-width="2" transform="rotate(-20 10 40)" />
        <ellipse cx="30" cy="40" rx="14" ry="9" fill="#4ADE80" stroke="#16A34A" stroke-width="2" transform="rotate(20 30 40)" />
        <!-- Soil lump at root -->
        <ellipse cx="20" cy="85" rx="18" ry="10" fill="#78350F" />
      </g>
    `
  },
  {
    filename: 'cultivating-fork.webp',
    title: 'ส้อมพรวนดิน',
    bg: ['#EFF6FF', '#BFDBFE', '#60A5FA'],
    badgeColor: '#1E3A8A',
    svg: `
      <!-- Wooden Grip Handle -->
      <line x1="160" y1="120" x2="230" y2="190" stroke="#92400E" stroke-width="22" stroke-linecap="round" />
      <line x1="160" y1="120" x2="230" y2="190" stroke="#B45309" stroke-width="12" stroke-linecap="round" />
      <!-- Metal Shank -->
      <rect x="220" y="180" width="20" height="24" rx="4" fill="#475569" stroke="#1E293B" stroke-width="3" transform="rotate(45 230 192)" />

      <!-- 3 Metal Prongs of Cultivator Fork -->
      <!-- Center Prong -->
      <line x1="240" y1="200" x2="330" y2="290" stroke="#64748B" stroke-width="10" stroke-linecap="round" />
      <polygon points="330,290 345,305 325,305" fill="#475569" />
      <!-- Left Prong -->
      <path d="M 235 205 Q 260 240 295 315" fill="none" stroke="#64748B" stroke-width="10" stroke-linecap="round" />
      <polygon points="295,315 310,325 290,330" fill="#475569" />
      <!-- Right Prong -->
      <path d="M 245 195 Q 285 210 355 260" fill="none" stroke="#64748B" stroke-width="10" stroke-linecap="round" />
      <polygon points="355,260 375,270 360,285" fill="#475569" />

      <!-- Loosened Soil Clods -->
      <ellipse cx="330" cy="335" rx="30" ry="12" fill="#78350F" />
      <circle cx="365" cy="305" r="8" fill="#92400E" />
      <circle cx="280" cy="340" r="6" fill="#92400E" />
    `
  },
  {
    filename: 'watering-can.webp',
    title: 'บัวรดน้ำ',
    bg: ['#E0F2FE', '#7DD3FC', '#0284C7'],
    badgeColor: '#075985',
    svg: `
      <!-- Watering Can Main Body -->
      <rect x="140" y="180" width="160" height="150" rx="35" fill="#22C55E" stroke="#15803D" stroke-width="6" />

      <!-- Top Loop Handle -->
      <path d="M 180 180 C 180 110 260 110 260 180" fill="none" stroke="#15803D" stroke-width="14" stroke-linecap="round" />

      <!-- Side Grip Handle -->
      <path d="M 140 210 C 90 210 90 300 140 300" fill="none" stroke="#15803D" stroke-width="14" stroke-linecap="round" />

      <!-- Long Spout Sticking Forward -->
      <line x1="280" y1="260" x2="380" y2="180" stroke="#16A34A" stroke-width="18" stroke-linecap="round" />

      <!-- Rose / Sprinkle Head (Perforated Nozzle) -->
      <ellipse cx="385" cy="175" rx="18" ry="32" fill="#FACC15" stroke="#CA8A04" stroke-width="4" transform="rotate(-30 385 175)" />
      <!-- Perforation Holes -->
      <circle cx="380" cy="165" r="2.5" fill="#713F12" />
      <circle cx="385" cy="175" r="2.5" fill="#713F12" />
      <circle cx="390" cy="185" r="2.5" fill="#713F12" />

      <!-- Gentle Water Spray Droplets -->
      <line x1="395" y1="180" x2="445" y2="210" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6 4" stroke-linecap="round" />
      <line x1="395" y1="190" x2="440" y2="230" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6 4" stroke-linecap="round" />
      <line x1="390" y1="200" x2="430" y2="250" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6 4" stroke-linecap="round" />
    `
  },
  {
    filename: 'waste-sorting-4bins.webp',
    title: 'ถังขยะ 4 สี แยกประเภท',
    bg: ['#F8FAFC', '#E2E8F0', '#94A3B8'],
    badgeColor: '#0F172A',
    svg: `
      <!-- 4 Standard Thai School Bins Side-by-Side -->
      <!-- Bin 1: Green (ขยะย่อยสลาย / อินทรีย์) -->
      <g transform="translate(100, 190)">
        <rect x="0" y="30" width="60" height="120" rx="8" fill="#22C55E" stroke="#15803D" stroke-width="3" />
        <ellipse cx="30" cy="30" rx="32" ry="12" fill="#4ADE80" stroke="#15803D" stroke-width="3" />
        <rect x="25" y="10" width="10" height="15" rx="3" fill="#15803D" />
        <text x="30" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">เปียก</text>
      </g>

      <!-- Bin 2: Yellow (ขยะรีไซเคิล) -->
      <g transform="translate(175, 190)">
        <rect x="0" y="30" width="60" height="120" rx="8" fill="#FACC15" stroke="#CA8A04" stroke-width="3" />
        <ellipse cx="30" cy="30" rx="32" ry="12" fill="#FEF08A" stroke="#CA8A04" stroke-width="3" />
        <rect x="25" y="10" width="10" height="15" rx="3" fill="#CA8A04" />
        <text x="30" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#713F12">รีไซเคิล</text>
      </g>

      <!-- Bin 3: Blue (ขยะทั่วไป) -->
      <g transform="translate(250, 190)">
        <rect x="0" y="30" width="60" height="120" rx="8" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3" />
        <ellipse cx="30" cy="30" rx="32" ry="12" fill="#93C5FD" stroke="#1D4ED8" stroke-width="3" />
        <rect x="25" y="10" width="10" height="15" rx="3" fill="#1D4ED8" />
        <text x="30" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">ทั่วไป</text>
      </g>

      <!-- Bin 4: Red (ขยะอันตราย) -->
      <g transform="translate(325, 190)">
        <rect x="0" y="30" width="60" height="120" rx="8" fill="#EF4444" stroke="#B91C1C" stroke-width="3" />
        <ellipse cx="30" cy="30" rx="32" ry="12" fill="#FCA5A5" stroke="#B91C1C" stroke-width="3" />
        <rect x="25" y="10" width="10" height="15" rx="3" fill="#B91C1C" />
        <text x="30" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">อันตราย</text>
      </g>
    `
  }
];

async function main() {
  console.log(`Generating ${assets.length} career illustrations into ${outputDir}...`);
  for (const item of assets) {
    const svg = wrapCard(item.svg, item.bg, item.title, item.badgeColor);
    const target = path.join(outputDir, item.filename);
    await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toFile(target);
    console.log(`✓ Generated ${item.filename} (${item.title})`);
  }
  console.log('All career illustrations generated successfully!');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
