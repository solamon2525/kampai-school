import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

const CUSTOM_AI_COVERS = [
  'tank-commander',
  'online-safety',
  'debug-it',
  'binary-bits',
  'logic-gates',
  'robot-path',
  'fraction-garden',
  'fraction-garden-ar',
  'math-runner',
  'catch-numbers'
];

const commitGroups = [
  {
    commit: '67a4848908e341e810a0b316c325fd944c35b7cf',
    files: [
      'public/games/arts/color-wheel/cover.svg',
      'public/games/arts/line-trace/cover.svg',
      'public/games/arts/rhythm-master/cover.svg',
      'public/games/arts/thai-instruments/cover.svg',
      'public/games/career/veggie-garden/cover.svg',
      'public/games/demo/ar-zone-quiz/cover.svg',
      'public/games/english/hands-up-quiz/cover.svg',
      'public/games/english/phonics-pop/cover.svg',
      'public/games/english/reading-quest/cover.svg',
      'public/games/english/sentence-builder/cover.svg',
      'public/games/english/snake-3d/cover.svg',
      'public/games/math/math-blaster/cover.svg',
      'public/games/math/math-rally/cover.svg',
      'public/games/math/math-runner/cover.svg',
      'public/games/math/measure-up/cover.svg',
      'public/games/math/multiplication-kingdom/cover.svg',
      'public/games/math/probability-zoo-board/cover.svg',
      'public/games/science/blocky-safari/cover.svg',
      'public/games/science/digestive-ar/cover.svg',
      'public/games/science/energy-rocket/cover.svg',
      'public/games/science/genetic-quest/cover.svg',
      'public/games/science/sink-float/cover.svg',
      'public/games/thai/balloon-fighter/cover.svg',
      'public/games/thai/battle-city/cover.svg',
      'public/games/thai/fishing/cover.svg',
      'public/games/thai/reading-game/cover.svg',
      'public/games/thai/sentence-craft/cover.svg',
      'public/games/thai/thai-story/cover.svg',
      'public/games/thai/thai-vocab-arena/cover.svg',
      'public/games/thai/thai-vocab-hub/cover.svg'
    ]
  },
  {
    commit: '5bc8c4127ffb136003fa9285fcbb94a2b546728e',
    files: [
      'public/games/math/coin-exchange/cover.svg',
      'public/games/math/farm-adventure/cover.svg',
      'public/games/math/jump-even-odd/cover.svg',
      'public/games/math/math-move-quiz/cover.svg',
      'public/games/math/math-racer/cover.svg'
    ]
  },
  {
    commit: '4803c3422ee16c798f100b15cad82960234091fb',
    files: [
      'public/games/arts/color-mix-cover.svg',
      'public/games/english/english-quest-cover.svg',
      'public/games/english/room-3d-cover.svg',
      'public/games/english/vocab-hub-cover.svg',
      'public/games/english/vocab-move-cover.svg',
      'public/games/math/block-3d-cover.svg',
      'public/games/math/coord-3d-cover.svg',
      'public/games/math/multiply-race-cover.svg',
      'public/games/math/net-3d-cover.svg',
      'public/games/math/solid-3d-cover.svg',
      'public/games/science/food-chain-cover.svg',
      'public/games/science/sci-sort-cover.svg',
      'public/games/social/globe-3d-cover.svg',
      'public/games/social/social-quiz-cover.svg',
      'public/games/thai/ai-hand-gesture-game-cover.svg',
      'public/games/thai/nitro-arena-cover.svg',
      'public/games/thai/spelling-moto-cover.svg',
      'public/games/thai/thai-edu-rpg-cover.svg',
      'public/games/thai/thai-spelling-cover.svg',
      'public/games/thai/tug-of-war-cover.svg',
      'public/games/thai/wipod-cover.svg'
    ]
  }
];

async function main() {
  console.log('🚀 Starting Fit-to-Scale Reconversion of SVG Covers...');

  for (const group of commitGroups) {
    console.log(`\n🔑 Processing group from commit: ${group.commit.substring(0, 7)}`);

    for (const relativeSvgPath of group.files) {
      const svgPath = path.resolve('d:/kampai-school-main', relativeSvgPath).replace(/\\/g, '/');
      
      // Determine the output PNG path
      const dir = path.dirname(svgPath);
      const ext = path.extname(svgPath);
      const baseName = path.basename(svgPath, ext);
      const pngPath = path.join(dir, `${baseName === 'cover' ? 'cover' : baseName}.png`).replace(/\\/g, '/');
      
      // Extract game slug to check if it has a custom AI cover
      const gameDirName = path.basename(dir);
      // For legacy flat files like block-3d-cover.svg, extract from filename
      const slugName = baseName.endsWith('-cover') ? baseName.replace('-cover', '') : gameDirName;

      if (CUSTOM_AI_COVERS.includes(slugName)) {
        console.log(`   ⏭️ Skipping custom AI cover: ${slugName}`);
        continue;
      }

      console.log(`   📦 Processing cover: ${slugName}`);
      
      try {
        // 1. Restore the SVG file from git
        execSync(`git checkout ${group.commit}~1 -- "${relativeSvgPath}"`, { stdio: 'ignore' });
        
        if (!fs.existsSync(svgPath)) {
          console.log(`      ⚠️ Failed to restore SVG: ${relativeSvgPath}`);
          continue;
        }

        // 2. Re-render SVG to PNG with fit: 'contain' and transparent background
        await sharp(svgPath)
          .resize(1280, 720, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 } // Clean transparent background
          })
          .png()
          .toFile(pngPath);
        
        console.log(`      ✅ Rendered PNG with Fit-to-Scale (contain).`);

        // 3. Clean up the SVG file
        if (fs.existsSync(svgPath)) {
          try {
            execSync(`git rm "${relativeSvgPath}"`, { stdio: 'ignore' });
          } catch {
            fs.unlinkSync(svgPath);
          }
        }

        // 4. Stage the new PNG
        execSync(`git add "${pngPath}"`);

      } catch (err) {
        console.error(`      ❌ Error processing:`, err.message);
      }
    }
  }

  console.log('\n🎉 Reconversion completed successfully!');
}

main().catch(err => {
  console.error('Fatal error in main:', err);
});
