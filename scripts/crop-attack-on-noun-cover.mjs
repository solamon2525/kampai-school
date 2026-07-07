import sharp from 'sharp';

const src = 'C:/Users/Administrator/.gemini/antigravity/brain/f474221a-d78b-479b-a491-516f18d8b664/attack_on_noun_cover_1783414102949.png';
const dest = 'd:/kampai-school-main/public/games/thai/attack-on-noun/cover.png';

async function processCover() {
  try {
    // 1. Create a blurred 1280x720 background
    const bgBuffer = await sharp(src)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .blur(35)
      .toBuffer();

    // 2. Create the centered main artwork (height 680px, with 20px top/bottom padding)
    const artBuffer = await sharp(src)
      .resize(680, 680, { fit: 'contain' })
      .toBuffer();

    // 3. Composite them together
    await sharp(bgBuffer)
      .composite([{ input: artBuffer, gravity: 'center' }])
      .toFile(dest);

    console.log('Successfully created blurred-background 16:9 composite cover for attack-on-noun!');
  } catch (err) {
    console.error('Error processing cover:', err);
  }
}

processCover();
