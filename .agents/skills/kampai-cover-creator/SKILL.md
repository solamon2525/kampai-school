---
name: kampai-cover-creator
description: Standards, prompt generation templates, automated cropping, and database cataloging for kid-friendly 16:9 educational game and worksheet covers.
---

# Kampai Cover Creator

Use this skill when generating, editing, cropping, or cataloging cover images for Kampai School games, teaching media studios, and companion worksheets.

## 1. Core Principles & Non-Violent Aesthetics

1. **Gamification & Child Appeal (K–6 Friendly):**
   - High visual interest, vibrant colors, warm lighting, playful sparkles, coins, stars, or magical educational effects.
   - Character style: Chibi anime, clean line art, smooth vector art, or 3D claymation.
   - Non-violent: Strictly no realistic weapons, blood, gore, dark explosion smoke, or aggression. Combat or obstacles must be rendered as bubble blasters, laser light, wooden toys, or math/science symbols.
2. **Subject & Educational Relevance:**
   - Math: Number lines, place value grids, fractions, baht coins, 3D geometric shapes.
   - English/Thai: Floating vocabulary bubbles, letter blocks, notebooks, speech bubbles.
   - Science: Beakers with bubbles, smiling planets, nature, circuits with pastel sparks.
3. **Bilingual Typography & Centering:**
   - Display English and Thai titles together (e.g. "Decimal Hub" / "คลังทศนิยม ป.4–ป.5").
   - Cute bubble or rounded typography with high-contrast borders/drop-shadows.
   - Positioned in center or lower-middle within the safe zone. Never close to the top or bottom edges.

## 2. Safe Zone Rules & AI Prompting

When prompting generative AI:
- **Vertical Safe Zone (27%–73%):** Because `scripts/make-cover.mjs` crops 22%–27% from both the top and bottom of a 1:1 image, instruct the AI:
  > *"All important characters, titles, subtitles, and HUD elements must be centered within the 60% vertical safe zone. The top 25% and bottom 25% of the image must be plain background with no text or character heads."*

### Standard AI Prompt Template

```text
Game cover art for "[English Title]" (Thai: [Thai Title]). A cute chibi anime [Main Character] exploring [Educational Elements, e.g. glowing decimal blocks, 10/100 grids, place value chart, and Thai baht coins] with playful [Subject] sparkles, star icons, and gamified accents. Vibrant, cheerful, and educational theme with clean line art and smooth 3D vector claymation style. Includes bold centered text reading "[English Title]" and "[Thai Title]" in cute bubble rounded typography. Important characters, all text labels, and educational models must be strictly centered within the 60% vertical safe zone of the image (between 27% and 73% vertical range). The top 25% and bottom 25% areas must only contain plain soft pastel background with no text, character heads, or UI, to allow 16:9 cropping.
```

## 3. Automated Cropping via `scripts/make-cover.mjs`

After generating the 1024×1024 source image:

```bash
# Syntax:
node scripts/make-cover.mjs <source-image.png> <target-path.png>

# Example:
node scripts/make-cover.mjs ./temp-cover.png public/games/math/math-decimal-hub/cover.png
```

### Verification Command
Verify that the output is exactly 1280×720 px:
```bash
node -e "import('sharp').then(({default: sharp}) => sharp('public/games/math/math-decimal-hub/cover.png').metadata().then(m => console.log(m.width + 'x' + m.height)))"
```

## 4. Dual-Track Cataloging & Database Pairing

1. **Shared Thumbnail Rule:**
   When a teaching media studio has a paired companion worksheet:
   - Media: `thumbnail_url = '/games/{subject}/{slug}/cover.png'`
   - Worksheet: `thumbnail_url = '/games/{subject}/{slug}/cover.png'`
   *(Replace any temporary placeholder like `/games/media-lab-assets/learning-scene.svg`).*
2. **Database Migration:**
   Include the thumbnail update in the next sequential migration in `supabase/migrations/NNN_...sql`.
3. **Commit & Version History:**
   Record cover generation and database synchronization in `src/components/admin/system/SystemOverview.tsx` (`versionHistory`).
