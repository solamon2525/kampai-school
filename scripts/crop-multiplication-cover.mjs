import sharp from 'sharp';

const src = 'C:/Users/Administrator/.gemini/antigravity/brain/e2036f11-9387-4f6d-8a5c-723d35dba4c6/multiplication_rpg_cover_1782916072385.png';
const dest = 'd:/kampai-school-main/public/games/math/multiplication-rpg/cover.png';

sharp(src)
  .resize(1280, 720, {
    fit: 'cover',
    position: 'center'
  })
  .toFile(dest)
  .then(() => console.log('Successfully resized and cropped multiplication-rpg cover to 1280x720!'))
  .catch(err => console.error('Error resizing:', err));
