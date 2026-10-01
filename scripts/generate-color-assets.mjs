// scripts/generate-color-assets.mjs
// Generates 512x512 WebP child-friendly color images for English visual vocabulary
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.resolve('public/games/english/vocab-hub-assets/colors');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const colors = [
  { name: 'red', hex: '#EF4444', light: '#F87171', border: '#DC2626' },
  { name: 'blue', hex: '#3B82F6', light: '#60A5FA', border: '#2563EB' },
  { name: 'green', hex: '#22C55E', light: '#4ADE80', border: '#16A34A' },
  { name: 'yellow', hex: '#FACC15', light: '#FEF08A', border: '#EAB308' },
  { name: 'pink', hex: '#EC4899', light: '#F472B6', border: '#DB2777' },
  { name: 'orange', hex: '#F97316', light: '#FB923C', border: '#EA580C' },
  { name: 'purple', hex: '#A855F7', light: '#C084FC', border: '#9333EA' },
  { name: 'brown', hex: '#854D0E', light: '#A16207', border: '#713F12' },
  { name: 'black', hex: '#1F2937', light: '#374151', border: '#111827' },
  { name: 'white', hex: '#F8FAFC', light: '#FFFFFF', border: '#CBD5E1' },
  { name: 'gray', hex: '#6B7280', light: '#9CA3AF', border: '#4B5563' }
];

async function generateColorSvg(col) {
  const isWhite = col.name === 'white';
  const shadowColor = isWhite ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.18)';
  const outlineStroke = isWhite ? '#94A3B8' : col.border;
  const strokeWidth = isWhite ? 8 : 6;

  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="grad-${col.name}" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${col.light}" />
      <stop offset="65%" stop-color="${col.hex}" />
      <stop offset="100%" stop-color="${col.border}" />
    </radialGradient>
    
    <!-- Glossy Highlight Gradient -->
    <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="${shadowColor}" />
    </filter>
  </defs>

  <!-- Canvas Background (Pure Transparent) -->
  <rect width="512" height="512" fill="none" />

  <!-- Outer Rounded Paint Blob / Badge with Shadow -->
  <g filter="url(#shadow)">
    <!-- Base Color Circle with Smooth Organic Soft-Corners -->
    <rect x="56" y="56" width="400" height="400" rx="140" ry="140"
          fill="url(#grad-${col.name})"
          stroke="${outlineStroke}"
          stroke-width="${strokeWidth}" />
  </g>

  <!-- Cute Inner Gloss Arc -->
  <path d="M 120 100 Q 256 70 380 110 Q 340 190 256 180 Q 170 170 120 100 Z"
        fill="url(#gloss)" />

  <!-- Inner Sparkle Highlight -->
  <circle cx="140" cy="140" r="16" fill="#FFFFFF" opacity="0.8" />
  <circle cx="170" cy="125" r="7" fill="#FFFFFF" opacity="0.6" />
</svg>
  `.trim();
}

async function main() {
  console.log(`Generating ${colors.length} color assets in ${outputDir}...`);

  for (const col of colors) {
    const svgStr = await generateColorSvg(col);
    const targetPath = path.join(outputDir, `${col.name}.webp`);

    await sharp(Buffer.from(svgStr))
      .webp({ quality: 90 })
      .toFile(targetPath);

    console.log(`✓ Generated: ${col.name}.webp`);
  }

  console.log('All color assets generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
