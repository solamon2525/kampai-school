/**
 * coverPresets.ts — config เช็กลิสต์สำเร็จรูปสำหรับ "ปก AI" (GameCoverAiDialog)
 *
 * แนวคิด: ครูเลือกจากชิป (ไม่ต้องพิมพ์) → ประกอบ prompt อังกฤษให้เอง
 * - แต่ละชิป = { id, label(ไทย), fragment(อังกฤษ) } · fragment ว่าง = "ปล่อยให้ AI เดา"
 * - COVER_GROUPS = แกนเลือกทีละด้าน (single/multi) — เพิ่มกลุ่ม/ชิปที่นี่ Dialog เด้งขึ้นเอง
 * - STYLE_PACKS  = ชุดสำเร็จรูป คลิกเดียวเซ็ตทุกแกน
 * - TITLE_STYLES = สไตล์โลโก้ชื่อเกมที่ overlay ฝั่ง client (ดู drawCover ใน GameCoverAiDialog)
 *
 * เพิ่ม/แก้สไตล์ที่ไฟล์นี้ที่เดียว — ไม่ต้องแตะ edge function (api/generate-cover.ts
 * รับ parts[] แล้วครอบ invariant: ภาพล้วนไม่มีตัวอักษร + เว้นที่ด้านบนเอง)
 */

export type CoverChip = { id: string; label: string; fragment: string };
export type CoverGroup = { key: string; label: string; multi: boolean; options: CoverChip[] };

/** ค่าที่เลือกอยู่: single-select = string id · multi-select = string[] */
export type CoverSelection = Record<string, string | string[]>;

export const COVER_GROUPS: CoverGroup[] = [
    {
        key: 'style',
        label: 'สไตล์ภาพ',
        multi: false,
        options: [
            { id: 'chibi', label: 'การ์ตูน chibi น่ารัก', fragment: 'cute chibi kawaii flat cartoon style, clean bold outlines, bright cheerful colors, friendly for young kids' },
            { id: 'anime', label: 'อนิเมะแอ็กชัน', fragment: 'dynamic 2D anime action illustration, bold cel-shading, energetic dramatic poses, motion-packed' },
            { id: 'glossy3d', label: 'เกม 3D มันวาว', fragment: 'glossy 3D mobile-game cover art, soft Pixar-like rendering, shiny highlights, rounded polished shapes' },
            { id: 'poster', label: 'ล้อโปสเตอร์อนิเมะ', fragment: 'epic anime movie-poster style composition, dramatic cinematic lighting, heroic larger-than-life characters' },
            { id: 'storybook', label: 'สมุดนิทานสีน้ำ', fragment: 'soft watercolor storybook illustration, gentle warm pastel palette, cozy hand-painted texture' },
            { id: 'pixel', label: 'พิกเซลเรโทร', fragment: 'retro 16-bit pixel-art game scene, crisp pixels, vibrant arcade palette' },
            { id: 'comic', label: 'คอมมิคป๊อปอาร์ต', fragment: 'bold american comic-book pop-art style, thick ink outlines, halftone dots, dynamic panels feel' },
            { id: 'clay', label: 'ดินปั้น (claymation)', fragment: 'cute claymation stop-motion style, soft moldable clay textures, chunky rounded shapes' },
            { id: 'papercut', label: 'กระดาษตัดซ้อนชั้น', fragment: 'layered paper-cut craft illustration, stacked cardstock layers, soft drop shadows' },
            { id: 'voxel', label: '3D วอกเซล (บล็อก)', fragment: 'cute isometric 3D voxel art, blocky cubes, playful Minecraft-like world' },
            { id: 'crayon', label: 'สีเทียนเด็กวาด', fragment: 'playful crayon and colored-pencil childlike drawing, hand-drawn doodle charm' },
            { id: 'vector', label: 'เวกเตอร์แฟลตโมเดิร์น', fragment: 'modern flat vector illustration, clean geometric shapes, smooth gradients, minimal lines' },
        ],
    },
    {
        key: 'mood',
        label: 'อารมณ์ภาพ',
        multi: false,
        options: [
            { id: 'cheerful', label: 'สนุกสดใส', fragment: 'cheerful joyful upbeat mood' },
            { id: 'epic', label: 'ตื่นเต้นเร้าใจ', fragment: 'epic exciting high-stakes mood' },
            { id: 'cozy', label: 'อบอุ่นสงบ', fragment: 'warm cozy calm gentle mood' },
            { id: 'mysterious', label: 'ลึกลับผจญภัย', fragment: 'mysterious adventurous discovery mood' },
            { id: 'funny', label: 'ฮาขำขัน', fragment: 'silly funny comedic playful mood' },
            { id: 'dreamy', label: 'ฝันละมุน', fragment: 'soft dreamy whimsical magical mood' },
        ],
    },
    {
        key: 'colors',
        label: 'โทนสี',
        multi: false,
        options: [
            { id: 'auto', label: 'อัตโนมัติตามวิชา', fragment: '' },
            { id: 'blue_navy', label: 'ฟ้า-กรมท่า', fragment: 'main color tone: bright blue and navy' },
            { id: 'purple_gold', label: 'ม่วง-ทอง', fragment: 'main color tone: royal purple and gold' },
            { id: 'green_fresh', label: 'เขียวสด', fragment: 'main color tone: fresh vivid green' },
            { id: 'orange_red', label: 'ส้ม-แดง (แอ็กชัน)', fragment: 'main color tone: fiery orange and red, high-energy' },
            { id: 'pink_pastel', label: 'ชมพูพาสเทล', fragment: 'main color tone: soft pastel pink and lavender' },
            { id: 'mint_cyan', label: 'ฟ้า-มิ้นต์', fragment: 'main color tone: cyan and mint green' },
            { id: 'rainbow', label: 'รุ้งหลากสี', fragment: 'main color tone: bright multicolored rainbow palette' },
            { id: 'red_gold', label: 'แดง-ทอง (ไทยมงคล)', fragment: 'main color tone: auspicious Thai red and gold' },
            { id: 'galaxy', label: 'ม่วง-ชมพู กาแล็กซี', fragment: 'main color tone: deep purple and pink galaxy gradient' },
            { id: 'earth', label: 'เขียว-น้ำตาล ธรรมชาติ', fragment: 'main color tone: earthy green and warm brown nature palette' },
            { id: 'candy_bright', label: 'ลูกอมสดใส', fragment: 'main color tone: bright candy colors, high saturation' },
        ],
    },
    {
        key: 'character',
        label: 'ตัวเอก',
        multi: false,
        options: [
            { id: 'thai_student', label: 'เด็กนักเรียนไทย chibi', fragment: 'main character: a cute chibi Thai student in a white school shirt and navy-blue Thai uniform, smiling' },
            { id: 'boy_hero', label: 'ฮีโร่เด็กชาย', fragment: 'main character: a brave young boy hero, confident heroic pose' },
            { id: 'girl_hero', label: 'ฮีโร่เด็กหญิง', fragment: 'main character: a brave young girl hero, confident heroic pose' },
            { id: 'duo', label: 'คู่หูชาย-หญิง', fragment: 'main characters: a cheerful boy-and-girl duo adventuring together' },
            { id: 'group', label: 'กลุ่มเด็ก 3-4 คน', fragment: 'main characters: a cheerful group of 3-4 diverse kids as a team' },
            { id: 'robot', label: 'มาสคอตหุ่นยนต์', fragment: 'main character: a friendly cute robot mascot with big glowing eyes' },
            { id: 'animal', label: 'มาสคอตสัตว์น่ารัก', fragment: 'main character: an adorable animal mascot with a big head and expressive eyes' },
            { id: 'teacher', label: 'ครูใจดี', fragment: 'main character: a kind cheerful teacher guiding students' },
            { id: 'thai_costume', label: 'เด็กชุดไทย/โขน', fragment: 'main character: a child in traditional Thai costume, cultural and proud' },
            { id: 'scientist', label: 'นักวิทยาศาสตร์น้อย', fragment: 'main character: a curious little scientist in a lab coat and goggles' },
            { id: 'wizard', label: 'พ่อมด/แม่มดน้อย', fragment: 'main character: a tiny wizard with a hat and a glowing magic staff' },
            { id: 'dragon', label: 'มังกรน่ารัก', fragment: 'main character: a cute friendly baby dragon companion' },
            { id: 'maker', label: 'เด็กนักประดิษฐ์/เมกเกอร์', fragment: 'main character: a young maker/inventor kid building gadgets with tools and gears' },
            { id: 'programmer', label: 'โปรแกรมเมอร์น้อย', fragment: 'main character: a young programmer kid with a laptop and floating code blocks' },
            { id: 'artist', label: 'ศิลปิน/นักออกแบบน้อย', fragment: 'main character: a young artist/designer kid with a drawing tablet and brush' },
            { id: 'mascot', label: 'ตัวการ์ตูนมาสคอตกลม', fragment: 'main character: a simple cute round cartoon mascot blob with a big smile' },
            { id: 'object', label: 'สิ่งของมีชีวิต (ดินสอ/หนังสือ)', fragment: 'main character: a friendly anthropomorphic school object (pencil or book) with a cute cartoon face' },
            { id: 'superhero', label: 'ฮีโร่จิ๋วใส่ผ้าคลุม', fragment: 'main character: a tiny caped superhero kid striking a heroic pose' },
        ],
    },
    {
        key: 'charsize',
        label: 'ขนาดตัวละคร',
        multi: false,
        options: [
            { id: 'small', label: 'เล็ก (เน้นฉาก)', fragment: 'the character is small in the frame, the scene and environment dominate' },
            { id: 'medium', label: 'กลาง (สมดุล)', fragment: 'the character is medium-sized, balanced with the scene' },
            { id: 'large', label: 'ใหญ่/โดดเด่น', fragment: 'the character is large and prominent, hero front and center' },
        ],
    },
    {
        key: 'scene',
        label: 'ฉาก / กิจกรรม',
        multi: true,
        options: [
            { id: 'math', label: 'แก้โจทย์เลข', fragment: 'solving floating math problems with glowing numbers and symbols' },
            { id: 'spell', label: 'สะกดคำ', fragment: 'arranging letter blocks to spell words' },
            { id: 'reading', label: 'อ่านหนังสือ/ห้องสมุด', fragment: 'happily reading a big glowing storybook' },
            { id: 'science', label: 'ทดลองวิทยาศาสตร์', fragment: 'doing a fun science experiment with bubbling flasks and sparks' },
            { id: 'astronomy', label: 'ดูดาว/ดาราศาสตร์', fragment: 'looking through a telescope at planets and stars' },
            { id: 'art', label: 'วาดรูป/ศิลปะ', fragment: 'painting a colorful picture on an easel' },
            { id: 'music', label: 'ดนตรีไทย/ดนตรี', fragment: 'playing cheerful musical instruments with floating notes' },
            { id: 'sports', label: 'กีฬา/พละ', fragment: 'playing energetic sports with a ball and trophy' },
            { id: 'farming', label: 'ปลูกต้นไม้/เกษตร', fragment: 'planting and growing happy little plants in a garden' },
            { id: 'map', label: 'แผนที่/ภูมิศาสตร์', fragment: 'exploring a big colorful world map with a compass' },
            { id: 'history', label: 'ประวัติศาสตร์/ย้อนยุค', fragment: 'time-traveling into an ancient historical scene' },
            { id: 'coding', label: 'เขียนโค้ด/หุ่นยนต์', fragment: 'coding and commanding cute robots with block commands' },
            { id: 'race', label: 'แข่งวิ่ง / ความเร็ว', fragment: 'racing forward at high speed with motion lines' },
            { id: 'battle', label: 'สังเวียนต่อสู้', fragment: 'facing off in an epic battle arena, ready to duel' },
            { id: 'quiz', label: 'ตอบควิซ/ยกมือ', fragment: 'excitedly answering a quiz, raising hand among answer choices' },
            { id: 'match', label: 'จับคู่/เรียงการ์ด', fragment: 'matching and sorting glowing cards in a puzzle' },
            { id: 'cooking', label: 'ทำอาหาร / ครัว', fragment: 'cooking happily in a busy kitchen' },
            { id: 'market', label: 'ตลาด/ซื้อขาย', fragment: 'running a cheerful little market shop, counting coins' },
            { id: 'adventure', label: 'ผจญภัยในป่า', fragment: 'exploring a lush adventurous jungle world' },
            { id: 'underwater', label: 'ผจญภัยใต้น้ำ', fragment: 'diving on an underwater adventure among fish and coral' },
            { id: 'space', label: 'อวกาศ', fragment: 'flying through outer space among planets and stars' },
        ],
    },
    {
        key: 'background',
        label: 'ฉากหลัง',
        multi: false,
        options: [
            { id: 'classroom', label: 'ห้องเรียน', fragment: 'background: a bright cheerful classroom' },
            { id: 'library', label: 'ห้องสมุด', fragment: 'background: a cozy colorful library full of books' },
            { id: 'lab', label: 'ห้องแล็บ', fragment: 'background: a fun science laboratory with equipment' },
            { id: 'fantasy', label: 'โลกแฟนตาซี', fragment: 'background: a colorful magical fantasy world' },
            { id: 'castle', label: 'ปราสาท', fragment: 'background: a grand fairytale castle' },
            { id: 'space_bg', label: 'อวกาศ', fragment: 'background: a starry outer-space galaxy' },
            { id: 'underwater_bg', label: 'ใต้ทะเล', fragment: 'background: a vibrant underwater coral reef' },
            { id: 'city', label: 'เมือง', fragment: 'background: a playful cartoon city skyline' },
            { id: 'nature', label: 'ธรรมชาติ', fragment: 'background: sunny nature with hills, trees and blue sky' },
            { id: 'thai_temple', label: 'วัด/ตลาดไทย', fragment: 'background: a charming Thai temple and market scene' },
            { id: 'stadium', label: 'สนามกีฬา', fragment: 'background: a lively sports stadium' },
            { id: 'candyland', label: 'โลกขนมหวาน', fragment: 'background: a whimsical candy land of sweets' },
            { id: 'night_sky', label: 'กลางคืนดาวเต็มฟ้า', fragment: 'background: a magical starry night sky' },
            { id: 'gradient', label: 'พื้นไล่สีนามธรรม', fragment: 'background: a clean abstract bright gradient with floating shapes' },
        ],
    },
    {
        key: 'composition',
        label: 'มุมมองกล้อง',
        multi: false,
        options: [
            { id: 'front', label: 'หน้าตรงสมดุล', fragment: 'centered balanced front-facing composition' },
            { id: 'hero', label: 'มุมเงยฮีโร่', fragment: 'dramatic low-angle hero shot, character looking powerful' },
            { id: 'wide', label: 'พาโนรามากว้าง', fragment: 'wide panoramic establishing shot showing the whole world' },
            { id: 'closeup', label: 'โคลสอัพตัวละคร', fragment: 'close-up framing on the expressive main character' },
            { id: 'dynamic', label: 'ไดนามิกเฉียง', fragment: 'dynamic diagonal action composition with depth' },
        ],
    },
    {
        key: 'effects',
        label: 'เอฟเฟกต์ / บรรยากาศ',
        multi: true,
        options: [
            { id: 'sparkle', label: 'ประกายดาว', fragment: 'sprinkled with sparkles and twinkling stars' },
            { id: 'glow', label: 'แสงเรือง', fragment: 'with soft glowing light effects' },
            { id: 'speed', label: 'เส้นสปีดแอ็กชัน', fragment: 'with dynamic speed-lines and motion blur' },
            { id: 'burst', label: 'ระเบิดพลัง', fragment: 'with an energetic power burst and impact effects' },
            { id: 'magic', label: 'เวทมนตร์', fragment: 'with swirling magical particles' },
            { id: 'lightning', label: 'ฟ้าผ่าพลัง', fragment: 'with crackling energy lightning bolts' },
            { id: 'rainbow_fx', label: 'รุ้งกินน้ำ', fragment: 'with a bright rainbow arc' },
            { id: 'fireworks', label: 'ดอกไม้ไฟ', fragment: 'with celebratory fireworks bursting' },
            { id: 'confetti', label: 'กระดาษโปรย', fragment: 'with colorful confetti falling' },
            { id: 'leaves', label: 'ใบไม้/กลีบดอกปลิว', fragment: 'with leaves and flower petals drifting in the breeze' },
            { id: 'snow', label: 'หิมะ/น้ำแข็ง', fragment: 'with gentle snow and icy sparkles' },
            { id: 'candy', label: 'ฟองสบู่ / ลูกอม', fragment: 'with floating bubbles and candy decorations' },
        ],
    },
    {
        key: 'detail',
        label: 'ความละเอียด',
        multi: true,
        options: [
            { id: 'detailed', label: 'รายละเอียดสูง', fragment: 'highly detailed, sharp focus, polished professional finish' },
            { id: 'minimal', label: 'เรียบสะอาด', fragment: 'clean minimal composition with simple uncluttered background' },
            { id: 'depth', label: 'มิติลึก (เบลอหลัง)', fragment: 'soft depth of field, blurred bokeh background' },
            { id: 'vibrant', label: 'สีจัดสดใส', fragment: 'extra vibrant saturated colors, high contrast, eye-catching' },
        ],
    },
];

/** ชุดสำเร็จรูป: คลิกเดียวเซ็ตทุกแกน */
export const STYLE_PACKS: { id: string; label: string; pick: CoverSelection }[] = [
    {
        id: 'cute',
        label: '🧸 การ์ตูนน่ารัก',
        pick: { style: 'chibi', mood: 'cheerful', colors: 'auto', character: 'thai_student', charsize: 'medium', background: 'gradient', composition: 'front', effects: ['sparkle', 'candy'], detail: ['vibrant'] },
    },
    {
        id: 'action',
        label: '⚔️ อนิเมะแอ็กชัน',
        pick: { style: 'anime', mood: 'epic', colors: 'orange_red', character: 'boy_hero', charsize: 'large', background: 'fantasy', composition: 'hero', effects: ['speed', 'burst'], detail: ['detailed'] },
    },
    {
        id: 'game3d',
        label: '✨ เกม 3D มันวาว',
        pick: { style: 'glossy3d', mood: 'cheerful', colors: 'blue_navy', character: 'robot', charsize: 'medium', background: 'gradient', composition: 'dynamic', effects: ['glow', 'sparkle'], detail: ['detailed', 'depth'] },
    },
    {
        id: 'epic',
        label: '🏆 โปสเตอร์อิงเกม',
        pick: { style: 'poster', mood: 'epic', colors: 'purple_gold', character: 'duo', charsize: 'large', background: 'castle', composition: 'hero', effects: ['glow', 'magic'], detail: ['detailed'] },
    },
    {
        id: 'storybook',
        label: '📖 นิทานสีน้ำ',
        pick: { style: 'storybook', mood: 'cozy', colors: 'pink_pastel', character: 'animal', charsize: 'small', background: 'nature', composition: 'wide', effects: ['sparkle', 'leaves'], detail: ['depth'] },
    },
    {
        id: 'ocean',
        label: '🐠 ผจญภัยใต้ทะเล',
        pick: { style: 'glossy3d', mood: 'mysterious', colors: 'mint_cyan', character: 'duo', charsize: 'small', scene: ['underwater'], background: 'underwater_bg', composition: 'wide', effects: ['glow', 'sparkle'], detail: ['depth'] },
    },
    {
        id: 'space',
        label: '🚀 ตะลุยอวกาศ',
        pick: { style: 'glossy3d', mood: 'epic', colors: 'galaxy', character: 'robot', charsize: 'medium', scene: ['space'], background: 'space_bg', composition: 'dynamic', effects: ['glow', 'sparkle'], detail: ['detailed'] },
    },
    {
        id: 'thai',
        label: '🇹🇭 ไทยมงคล',
        pick: { style: 'vector', mood: 'cheerful', colors: 'red_gold', character: 'thai_costume', charsize: 'medium', background: 'thai_temple', composition: 'front', effects: ['sparkle'], detail: ['vibrant'] },
    },
    {
        id: 'lab',
        label: '🔬 แล็บวิทยาศาสตร์',
        pick: { style: 'chibi', mood: 'cheerful', colors: 'green_fresh', character: 'scientist', charsize: 'medium', scene: ['science'], background: 'lab', composition: 'closeup', effects: ['glow', 'sparkle'], detail: ['detailed'] },
    },
    {
        id: 'sport',
        label: '🏅 กีฬาแข่งขัน',
        pick: { style: 'anime', mood: 'epic', colors: 'orange_red', character: 'group', charsize: 'medium', scene: ['sports'], background: 'stadium', composition: 'dynamic', effects: ['speed', 'confetti'], detail: ['vibrant'] },
    },
    {
        id: 'candy',
        label: '🍬 โลกขนมหวาน',
        pick: { style: 'clay', mood: 'funny', colors: 'candy_bright', character: 'animal', charsize: 'medium', background: 'candyland', composition: 'front', effects: ['candy', 'confetti'], detail: ['vibrant'] },
    },
    {
        id: 'magic',
        label: '🪄 เวทมนตร์ปริศนา',
        pick: { style: 'poster', mood: 'dreamy', colors: 'galaxy', character: 'wizard', charsize: 'large', background: 'night_sky', composition: 'hero', effects: ['magic', 'glow'], detail: ['depth'] },
    },
];

export type TitleStyle = 'classic' | 'gold' | 'banner' | 'pop' | 'neon';

export const TITLE_STYLES: { id: TitleStyle; label: string }[] = [
    { id: 'classic', label: 'คลาสสิก (ขาว-ขอบกรมท่า)' },
    { id: 'gold', label: 'ทองนูน (โลโก้เกม)' },
    { id: 'banner', label: 'ป้ายแบนเนอร์' },
    { id: 'pop', label: 'การ์ตูนป๊อป' },
    { id: 'neon', label: 'นีออนเรืองแสง' },
];

/** ประกอบ fragment ของแกนที่เลือก → parts[] (กรองค่าว่าง) ส่งให้ /api/generate-cover */
export function buildParts(selection: CoverSelection): string[] {
    const parts: string[] = [];
    for (const group of COVER_GROUPS) {
        const sel = selection[group.key];
        const ids = Array.isArray(sel) ? sel : sel ? [sel] : [];
        for (const id of ids) {
            const opt = group.options.find((o) => o.id === id);
            if (opt && opt.fragment.trim()) parts.push(opt.fragment.trim());
        }
    }
    return parts;
}

/** สุ่มเลือกทุกแกน (single = 1 ตัว, multi = 1-2 ตัว) สำหรับปุ่ม 🎲 */
export function randomSelection(): CoverSelection {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const out: CoverSelection = {};
    for (const group of COVER_GROUPS) {
        if (group.multi) {
            const shuffled = [...group.options].sort(() => Math.random() - 0.5);
            const n = 1 + Math.floor(Math.random() * 2); // 1-2 ตัว
            out[group.key] = shuffled.slice(0, n).map((o) => o.id);
        } else {
            out[group.key] = pick(group.options).id;
        }
    }
    return out;
}
