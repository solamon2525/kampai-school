import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

// Configuration
const GAMES_DIR = 'd:/kampai-school-main/public/games';
const MIGRATIONS_DIR = 'd:/kampai-school-main/supabase/migrations';

// Helper to find all files recursively
function getFilesRecursively(dir, filterFn) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file).replace(/\\/g, '/');
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, filterFn));
    } else {
      if (filterFn(filePath)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

async function main() {
  console.log('🚀 Starting SVG to PNG Cover Conversion Script...');

  // 1. Find all *-cover.svg files
  const svgCovers = getFilesRecursively(GAMES_DIR, (p) => p.toLowerCase().endsWith('-cover.svg'));
  console.log(`🔍 Found ${svgCovers.length} SVG cover files to convert.\n`);

  if (svgCovers.length === 0) {
    console.log('✨ No SVG covers found! All covers might already be converted.');
    return;
  }

  // 2. Find all migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => path.join(MIGRATIONS_DIR, f).replace(/\\/g, '/'));

  for (const svgPath of svgCovers) {
    const dir = path.dirname(svgPath);
    const ext = path.extname(svgPath);
    const baseName = path.basename(svgPath, ext); // e.g., 'spelling-moto-cover'
    const pngPath = path.join(dir, `${baseName}.png`).replace(/\\/g, '/');

    const relativeSvgPath = svgPath.replace('d:/kampai-school-main/public', ''); // e.g., '/games/thai/spelling-moto-cover.svg'
    const relativePngPath = pngPath.replace('d:/kampai-school-main/public', ''); // e.g., '/games/thai/spelling-moto-cover.png'

    console.log(`📦 Processing: ${baseName}`);
    console.log(`   SVG: ${svgPath}`);
    console.log(`   PNG: ${pngPath}`);

    try {
      // A. Render SVG to PNG (exactly 1280x720, high quality)
      await sharp(svgPath)
        .resize(1280, 720)
        .png()
        .toFile(pngPath);
      console.log(`   ✅ Rendered PNG successfully.`);

      // B. Update migrations
      let migrationUpdated = false;
      for (const migFile of migrationFiles) {
        let content = fs.readFileSync(migFile, 'utf8');
        // Search for the relative SVG path in migration
        if (content.includes(relativeSvgPath)) {
          // Replace with PNG path
          const newContent = content.replace(new RegExp(relativeSvgPath, 'g'), relativePngPath);
          fs.writeFileSync(migFile, newContent, 'utf8');
          console.log(`   📝 Updated migration: ${path.basename(migFile)}`);
          
          // Git add the updated migration
          execSync(`git add "${migFile}"`);
          migrationUpdated = true;
        }
      }

      if (!migrationUpdated) {
        console.log(`   ⚠️ Warning: No migration file found referencing ${relativeSvgPath}`);
      }

      // C. Remove SVG file and stage PNG file in Git
      if (fs.existsSync(svgPath)) {
        try {
          execSync(`git rm "${svgPath}"`);
          console.log(`   🗑️ Removed SVG via git rm.`);
        } catch (gitRmErr) {
          // Fallback to fs.unlinkSync if not tracked yet
          fs.unlinkSync(svgPath);
          console.log(`   🗑️ Deleted SVG via filesystem.`);
        }
      }
      
      execSync(`git add "${pngPath}"`);
      console.log(`   ➕ Staged PNG in git.\n`);

    } catch (err) {
      console.error(`   ❌ Error processing ${baseName}:`, err.message);
      console.error(err);
      console.log();
    }
  }

  console.log('🎉 All conversions and updates completed!');
}

main().catch(err => {
  console.error('Fatal error in main:', err);
});
