import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\9b915b9a-e625-4b2d-9637-153455794c0f\\ar_calibration_cover_1782894269117.png';
const destPath = resolve(__dirname, '../public/games/ar-calibration/cover.png');

async function main() {
    console.log(`Source path exists: ${existsSync(srcPath)}`);
    console.log(`Resizing ${srcPath} to ${destPath}...`);
    try {
        await sharp(srcPath)
            .resize(1280, 720, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(destPath);
        console.log('Successfully resized cover image!');
    } catch (err) {
        console.error('Error resizing cover image:', err);
        process.exit(1);
    }
}

main();
