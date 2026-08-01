/**
 * coverPresets.ts â€” config à¹€à¸Šà¹‡à¸à¸¥à¸´à¸ªà¸•à¹Œà¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸›à¸ªà¸³à¸«à¸£à¸±à¸š "à¸›à¸ AI" (GameCoverAiDialog)
 *
 * à¹à¸™à¸§à¸„à¸´à¸”: à¸„à¸£à¸¹à¹€à¸¥à¸·à¸­à¸à¸ˆà¸²à¸à¸Šà¸´à¸› (à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸žà¸´à¸¡à¸žà¹Œ) â†’ à¸›à¸£à¸°à¸à¸­à¸š prompt à¸­à¸±à¸‡à¸à¸¤à¸©à¹ƒà¸«à¹‰à¹€à¸­à¸‡
 * - à¹à¸•à¹ˆà¸¥à¸°à¸Šà¸´à¸› = { id, label(à¹„à¸—à¸¢), fragment(à¸­à¸±à¸‡à¸à¸¤à¸©) } Â· fragment à¸§à¹ˆà¸²à¸‡ = "à¸›à¸¥à¹ˆà¸­à¸¢à¹ƒà¸«à¹‰ AI à¹€à¸”à¸²"
 * - COVER_GROUPS = à¹à¸à¸™à¹€à¸¥à¸·à¸­à¸à¸—à¸µà¸¥à¸°à¸”à¹‰à¸²à¸™ (single/multi) â€” à¹€à¸žà¸´à¹ˆà¸¡à¸à¸¥à¸¸à¹ˆà¸¡/à¸Šà¸´à¸›à¸—à¸µà¹ˆà¸™à¸µà¹ˆ Dialog à¹€à¸”à¹‰à¸‡à¸‚à¸¶à¹‰à¸™à¹€à¸­à¸‡
 * - STYLE_PACKS  = à¸Šà¸¸à¸”à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸› à¸„à¸¥à¸´à¸à¹€à¸”à¸µà¸¢à¸§à¹€à¸‹à¹‡à¸•à¸—à¸¸à¸à¹à¸à¸™
 * - TITLE_STYLES = à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸¥à¹‚à¸à¹‰à¸Šà¸·à¹ˆà¸­à¹€à¸à¸¡à¸—à¸µà¹ˆ overlay à¸à¸±à¹ˆà¸‡ client (à¸”à¸¹ drawCover à¹ƒà¸™ GameCoverAiDialog)
 *
 * à¹€à¸žà¸´à¹ˆà¸¡/à¹à¸à¹‰à¸ªà¹„à¸•à¸¥à¹Œà¸—à¸µà¹ˆà¹„à¸Ÿà¸¥à¹Œà¸™à¸µà¹‰à¸—à¸µà¹ˆà¹€à¸”à¸µà¸¢à¸§ â€” à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹à¸•à¸° edge function (api/generate-cover.ts
 * à¸£à¸±à¸š parts[] à¹à¸¥à¹‰à¸§à¸„à¸£à¸­à¸š invariant: à¸ à¸²à¸žà¸¥à¹‰à¸§à¸™à¹„à¸¡à¹ˆà¸¡à¸µà¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£ + à¹€à¸§à¹‰à¸™à¸—à¸µà¹ˆà¸”à¹‰à¸²à¸™à¸šà¸™à¹€à¸­à¸‡)
 */

export type CoverChip = { id: string; label: string; fragment: string };
export type CoverGroup = { key: string; label: string; multi: boolean; options: CoverChip[] };

/** à¸„à¹ˆà¸²à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸à¸­à¸¢à¸¹à¹ˆ: single-select = string id Â· multi-select = string[] */
export type CoverSelection = Record<string, string | string[]>;

export const COVER_GROUPS: CoverGroup[] = [
    {
        key: 'style',
        label: 'à¸ªà¹„à¸•à¸¥à¹Œà¸ à¸²à¸ž',
        multi: false,
        options: [
            { id: 'chibi', label: 'à¸à¸²à¸£à¹Œà¸•à¸¹à¸™ chibi à¸™à¹ˆà¸²à¸£à¸±à¸', fragment: 'cute chibi kawaii flat cartoon style, clean bold outlines, bright cheerful colors, friendly for young kids' },
            { id: 'anime', label: 'à¸­à¸™à¸´à¹€à¸¡à¸°à¹à¸­à¹‡à¸à¸Šà¸±à¸™', fragment: 'dynamic 2D anime action illustration, bold cel-shading, energetic dramatic poses, motion-packed' },
            { id: 'glossy3d', label: 'à¹€à¸à¸¡ 3D à¸¡à¸±à¸™à¸§à¸²à¸§', fragment: 'glossy 3D mobile-game cover art, soft Pixar-like rendering, shiny highlights, rounded polished shapes' },
            { id: 'poster', label: 'à¸¥à¹‰à¸­à¹‚à¸›à¸ªà¹€à¸•à¸­à¸£à¹Œà¸­à¸™à¸´à¹€à¸¡à¸°', fragment: 'epic anime movie-poster style composition, dramatic cinematic lighting, heroic larger-than-life characters' },
            { id: 'storybook', label: 'à¸ªà¸¡à¸¸à¸”à¸™à¸´à¸—à¸²à¸™à¸ªà¸µà¸™à¹‰à¸³', fragment: 'soft watercolor storybook illustration, gentle warm pastel palette, cozy hand-painted texture' },
            { id: 'pixel', label: 'à¸žà¸´à¸à¹€à¸‹à¸¥à¹€à¸£à¹‚à¸—à¸£', fragment: 'retro 16-bit pixel-art game scene, crisp pixels, vibrant arcade palette' },
            { id: 'comic', label: 'à¸„à¸­à¸¡à¸¡à¸´à¸„à¸›à¹Šà¸­à¸›à¸­à¸²à¸£à¹Œà¸•', fragment: 'bold american comic-book pop-art style, thick ink outlines, halftone dots, dynamic panels feel' },
            { id: 'clay', label: 'à¸”à¸´à¸™à¸›à¸±à¹‰à¸™ (claymation)', fragment: 'cute claymation stop-motion style, soft moldable clay textures, chunky rounded shapes' },
            { id: 'papercut', label: 'à¸à¸£à¸°à¸”à¸²à¸©à¸•à¸±à¸”à¸‹à¹‰à¸­à¸™à¸Šà¸±à¹‰à¸™', fragment: 'layered paper-cut craft illustration, stacked cardstock layers, soft drop shadows' },
            { id: 'voxel', label: '3D à¸§à¸­à¸à¹€à¸‹à¸¥ (à¸šà¸¥à¹‡à¸­à¸)', fragment: 'cute isometric 3D voxel art, blocky cubes, playful Minecraft-like world' },
            { id: 'crayon', label: 'à¸ªà¸µà¹€à¸—à¸µà¸¢à¸™à¹€à¸”à¹‡à¸à¸§à¸²à¸”', fragment: 'playful crayon and colored-pencil childlike drawing, hand-drawn doodle charm' },
            { id: 'vector', label: 'à¹€à¸§à¸à¹€à¸•à¸­à¸£à¹Œà¹à¸Ÿà¸¥à¸•à¹‚à¸¡à¹€à¸”à¸´à¸£à¹Œà¸™', fragment: 'modern flat vector illustration, clean geometric shapes, smooth gradients, minimal lines' },
            { id: 'edu_poster', label: 'à¹‚à¸›à¸ªà¹€à¸•à¸­à¸£à¹Œà¸ªà¸·à¹ˆà¸­à¸à¸²à¸£à¸ªà¸­à¸™', fragment: 'clean educational classroom poster illustration, polished teaching-media style, NOT arcade game art, bright but calm, whiteboard and learning tools visible, friendly for elementary school, professional textbook-cover quality' },
        ],
    },

    {
        key: 'mood',
        label: 'à¸­à¸²à¸£à¸¡à¸“à¹Œà¸ à¸²à¸ž',
        multi: false,
        options: [
            { id: 'cheerful', label: 'à¸ªà¸™à¸¸à¸à¸ªà¸”à¹ƒà¸ª', fragment: 'cheerful joyful upbeat mood' },
            { id: 'epic', label: 'à¸•à¸·à¹ˆà¸™à¹€à¸•à¹‰à¸™à¹€à¸£à¹‰à¸²à¹ƒà¸ˆ', fragment: 'epic exciting high-stakes mood' },
            { id: 'cozy', label: 'à¸­à¸šà¸­à¸¸à¹ˆà¸™à¸ªà¸‡à¸š', fragment: 'warm cozy calm gentle mood' },
            { id: 'mysterious', label: 'à¸¥à¸¶à¸à¸¥à¸±à¸šà¸œà¸ˆà¸à¸ à¸±à¸¢', fragment: 'mysterious adventurous discovery mood' },
            { id: 'funny', label: 'à¸®à¸²à¸‚à¸³à¸‚à¸±à¸™', fragment: 'silly funny comedic playful mood' },
            { id: 'dreamy', label: 'à¸à¸±à¸™à¸¥à¸°à¸¡à¸¸à¸™', fragment: 'soft dreamy whimsical magical mood' },
        ],
    },
    {
        key: 'colors',
        label: 'à¹‚à¸—à¸™à¸ªà¸µ',
        multi: false,
        options: [
            { id: 'auto', label: 'à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´à¸•à¸²à¸¡à¸§à¸´à¸Šà¸²', fragment: '' },
            { id: 'blue_navy', label: 'à¸Ÿà¹‰à¸²-à¸à¸£à¸¡à¸—à¹ˆà¸²', fragment: 'main color tone: bright blue and navy' },
            { id: 'purple_gold', label: 'à¸¡à¹ˆà¸§à¸‡-à¸—à¸­à¸‡', fragment: 'main color tone: royal purple and gold' },
            { id: 'green_fresh', label: 'à¹€à¸‚à¸µà¸¢à¸§à¸ªà¸”', fragment: 'main color tone: fresh vivid green' },
            { id: 'orange_red', label: 'à¸ªà¹‰à¸¡-à¹à¸”à¸‡ (à¹à¸­à¹‡à¸à¸Šà¸±à¸™)', fragment: 'main color tone: fiery orange and red, high-energy' },
            { id: 'pink_pastel', label: 'à¸Šà¸¡à¸žà¸¹à¸žà¸²à¸ªà¹€à¸—à¸¥', fragment: 'main color tone: soft pastel pink and lavender' },
            { id: 'mint_cyan', label: 'à¸Ÿà¹‰à¸²-à¸¡à¸´à¹‰à¸™à¸•à¹Œ', fragment: 'main color tone: cyan and mint green' },
            { id: 'rainbow', label: 'à¸£à¸¸à¹‰à¸‡à¸«à¸¥à¸²à¸à¸ªà¸µ', fragment: 'main color tone: bright multicolored rainbow palette' },
            { id: 'red_gold', label: 'à¹à¸”à¸‡-à¸—à¸­à¸‡ (à¹„à¸—à¸¢à¸¡à¸‡à¸„à¸¥)', fragment: 'main color tone: auspicious Thai red and gold' },
            { id: 'galaxy', label: 'à¸¡à¹ˆà¸§à¸‡-à¸Šà¸¡à¸žà¸¹ à¸à¸²à¹à¸¥à¹‡à¸à¸‹à¸µ', fragment: 'main color tone: deep purple and pink galaxy gradient' },
            { id: 'earth', label: 'à¹€à¸‚à¸µà¸¢à¸§-à¸™à¹‰à¸³à¸•à¸²à¸¥ à¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´', fragment: 'main color tone: earthy green and warm brown nature palette' },
            { id: 'candy_bright', label: 'à¸¥à¸¹à¸à¸­à¸¡à¸ªà¸”à¹ƒà¸ª', fragment: 'main color tone: bright candy colors, high saturation' },
        ],
    },
    {
        key: 'character',
        label: 'à¸•à¸±à¸§à¹€à¸­à¸',
        multi: false,
        options: [
            { id: 'thai_student', label: 'à¹€à¸”à¹‡à¸à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¹„à¸—à¸¢ chibi', fragment: 'main character: a cute chibi Thai student in a white school shirt and navy-blue Thai uniform, smiling' },
            { id: 'boy_hero', label: 'à¸®à¸µà¹‚à¸£à¹ˆà¹€à¸”à¹‡à¸à¸Šà¸²à¸¢', fragment: 'main character: a brave young boy hero, confident heroic pose' },
            { id: 'girl_hero', label: 'à¸®à¸µà¹‚à¸£à¹ˆà¹€à¸”à¹‡à¸à¸«à¸à¸´à¸‡', fragment: 'main character: a brave young girl hero, confident heroic pose' },
            { id: 'duo', label: 'à¸„à¸¹à¹ˆà¸«à¸¹à¸Šà¸²à¸¢-à¸«à¸à¸´à¸‡', fragment: 'main characters: a cheerful boy-and-girl duo adventuring together' },
            { id: 'group', label: 'à¸à¸¥à¸¸à¹ˆà¸¡à¹€à¸”à¹‡à¸ 3-4 à¸„à¸™', fragment: 'main characters: a cheerful group of 3-4 diverse kids as a team' },
            { id: 'robot', label: 'à¸¡à¸²à¸ªà¸„à¸­à¸•à¸«à¸¸à¹ˆà¸™à¸¢à¸™à¸•à¹Œ', fragment: 'main character: a friendly cute robot mascot with big glowing eyes' },
            { id: 'animal', label: 'à¸¡à¸²à¸ªà¸„à¸­à¸•à¸ªà¸±à¸•à¸§à¹Œà¸™à¹ˆà¸²à¸£à¸±à¸', fragment: 'main character: an adorable animal mascot with a big head and expressive eyes' },
            { id: 'teacher', label: 'à¸„à¸£à¸¹à¹ƒà¸ˆà¸”à¸µ', fragment: 'main character: a kind cheerful teacher guiding students' },
            { id: 'male_teacher_thai', label: 'à¸„à¸£à¸¹à¸œà¸¹à¹‰à¸Šà¸²à¸¢à¹„à¸—à¸¢', fragment: 'main character: a friendly male Thai elementary school teacher, short neat hair, light blue polo shirt with dark trousers, warm smile, pointing at whiteboard with marker â€” clearly male, NOT female' },
            { id: 'thai_costume', label: 'à¹€à¸”à¹‡à¸à¸Šà¸¸à¸”à¹„à¸—à¸¢/à¹‚à¸‚à¸™', fragment: 'main character: a child in traditional Thai costume, cultural and proud' },
            { id: 'scientist', label: 'à¸™à¸±à¸à¸§à¸´à¸—à¸¢à¸²à¸¨à¸²à¸ªà¸•à¸£à¹Œà¸™à¹‰à¸­à¸¢', fragment: 'main character: a curious little scientist in a lab coat and goggles' },
            { id: 'wizard', label: 'à¸žà¹ˆà¸­à¸¡à¸”/à¹à¸¡à¹ˆà¸¡à¸”à¸™à¹‰à¸­à¸¢', fragment: 'main character: a tiny wizard with a hat and a glowing magic staff' },
            { id: 'dragon', label: 'à¸¡à¸±à¸‡à¸à¸£à¸™à¹ˆà¸²à¸£à¸±à¸', fragment: 'main character: a cute friendly baby dragon companion' },
            { id: 'maker', label: 'à¹€à¸”à¹‡à¸à¸™à¸±à¸à¸›à¸£à¸°à¸”à¸´à¸©à¸à¹Œ/à¹€à¸¡à¸à¹€à¸à¸­à¸£à¹Œ', fragment: 'main character: a young maker/inventor kid building gadgets with tools and gears' },
            { id: 'programmer', label: 'à¹‚à¸›à¸£à¹à¸à¸£à¸¡à¹€à¸¡à¸­à¸£à¹Œà¸™à¹‰à¸­à¸¢', fragment: 'main character: a young programmer kid with a laptop and floating code blocks' },
            { id: 'artist', label: 'à¸¨à¸´à¸¥à¸›à¸´à¸™/à¸™à¸±à¸à¸­à¸­à¸à¹à¸šà¸šà¸™à¹‰à¸­à¸¢', fragment: 'main character: a young artist/designer kid with a drawing tablet and brush' },
            { id: 'mascot', label: 'à¸•à¸±à¸§à¸à¸²à¸£à¹Œà¸•à¸¹à¸™à¸¡à¸²à¸ªà¸„à¸­à¸•à¸à¸¥à¸¡', fragment: 'main character: a simple cute round cartoon mascot blob with a big smile' },
            { id: 'object', label: 'à¸ªà¸´à¹ˆà¸‡à¸‚à¸­à¸‡à¸¡à¸µà¸Šà¸µà¸§à¸´à¸• (à¸”à¸´à¸™à¸ªà¸­/à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­)', fragment: 'main character: a friendly anthropomorphic school object (pencil or book) with a cute cartoon face' },
            { id: 'superhero', label: 'à¸®à¸µà¹‚à¸£à¹ˆà¸ˆà¸´à¹‹à¸§à¹ƒà¸ªà¹ˆà¸œà¹‰à¸²à¸„à¸¥à¸¸à¸¡', fragment: 'main character: a tiny caped superhero kid striking a heroic pose' },
        ],
    },
    {
        key: 'charsize',
        label: 'à¸‚à¸™à¸²à¸”à¸•à¸±à¸§à¸¥à¸°à¸„à¸£',
        multi: false,
        options: [
            { id: 'small', label: 'à¹€à¸¥à¹‡à¸ (à¹€à¸™à¹‰à¸™à¸‰à¸²à¸)', fragment: 'the character is small in the frame, the scene and environment dominate' },
            { id: 'medium', label: 'à¸à¸¥à¸²à¸‡ (à¸ªà¸¡à¸”à¸¸à¸¥)', fragment: 'the character is medium-sized, balanced with the scene' },
            { id: 'large', label: 'à¹ƒà¸«à¸à¹ˆ/à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™', fragment: 'the character is large and prominent, hero front and center' },
        ],
    },
    {
        key: 'scene',
        label: 'à¸‰à¸²à¸ / à¸à¸´à¸ˆà¸à¸£à¸£à¸¡',
        multi: true,
        options: [
            { id: 'math', label: 'à¹à¸à¹‰à¹‚à¸ˆà¸—à¸¢à¹Œà¹€à¸¥à¸‚', fragment: 'solving floating math problems with glowing numbers and symbols' },
            { id: 'spell', label: 'à¸ªà¸°à¸à¸”à¸„à¸³', fragment: 'arranging letter blocks to spell words' },
            { id: 'reading', label: 'à¸­à¹ˆà¸²à¸™à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­/à¸«à¹‰à¸­à¸‡à¸ªà¸¡à¸¸à¸”', fragment: 'happily reading a big glowing storybook' },
            { id: 'icon_card', label: 'การ์ดไอคอนเรียบ', fragment: 'single centered educational icon card, no people, no classroom scene, one clear symbol or learning object on a clean gradient background' },
            { id: 'science', label: 'à¸—à¸”à¸¥à¸­à¸‡à¸§à¸´à¸—à¸¢à¸²à¸¨à¸²à¸ªà¸•à¸£à¹Œ', fragment: 'doing a fun science experiment with bubbling flasks and sparks' },
            { id: 'astronomy', label: 'à¸”à¸¹à¸”à¸²à¸§/à¸”à¸²à¸£à¸²à¸¨à¸²à¸ªà¸•à¸£à¹Œ', fragment: 'looking through a telescope at planets and stars' },
            { id: 'art', label: 'à¸§à¸²à¸”à¸£à¸¹à¸›/à¸¨à¸´à¸¥à¸›à¸°', fragment: 'painting a colorful picture on an easel' },
            { id: 'music', label: 'à¸”à¸™à¸•à¸£à¸µà¹„à¸—à¸¢/à¸”à¸™à¸•à¸£à¸µ', fragment: 'playing cheerful musical instruments with floating notes' },
            { id: 'sports', label: 'à¸à¸µà¸¬à¸²/à¸žà¸¥à¸°', fragment: 'playing energetic sports with a ball and trophy' },
            { id: 'farming', label: 'à¸›à¸¥à¸¹à¸à¸•à¹‰à¸™à¹„à¸¡à¹‰/à¹€à¸à¸©à¸•à¸£', fragment: 'planting and growing happy little plants in a garden' },
            { id: 'map', label: 'à¹à¸œà¸™à¸—à¸µà¹ˆ/à¸ à¸¹à¸¡à¸´à¸¨à¸²à¸ªà¸•à¸£à¹Œ', fragment: 'exploring a big colorful world map with a compass' },
            { id: 'history', label: 'à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸¨à¸²à¸ªà¸•à¸£à¹Œ/à¸¢à¹‰à¸­à¸™à¸¢à¸¸à¸„', fragment: 'time-traveling into an ancient historical scene' },
            { id: 'coding', label: 'à¹€à¸‚à¸µà¸¢à¸™à¹‚à¸„à¹‰à¸”/à¸«à¸¸à¹ˆà¸™à¸¢à¸™à¸•à¹Œ', fragment: 'coding and commanding cute robots with block commands' },
            { id: 'race', label: 'à¹à¸‚à¹ˆà¸‡à¸§à¸´à¹ˆà¸‡ / à¸„à¸§à¸²à¸¡à¹€à¸£à¹‡à¸§', fragment: 'racing forward at high speed with motion lines' },
            { id: 'battle', label: 'à¸ªà¸±à¸‡à¹€à¸§à¸µà¸¢à¸™à¸•à¹ˆà¸­à¸ªà¸¹à¹‰', fragment: 'facing off in an epic battle arena, ready to duel' },
            { id: 'quiz', label: 'à¸•à¸­à¸šà¸„à¸§à¸´à¸‹/à¸¢à¸à¸¡à¸·à¸­', fragment: 'excitedly answering a quiz, raising hand among answer choices' },
            { id: 'teaching_demo', label: 'à¸ªà¸²à¸˜à¸´à¸•à¸šà¸™à¸à¸£à¸°à¸”à¸²à¸™', fragment: 'demonstrating a clear lesson on a whiteboard with diagrams, charts, and teaching aids, calm classroom focus' },
            { id: 'match', label: 'à¸ˆà¸±à¸šà¸„à¸¹à¹ˆ/à¹€à¸£à¸µà¸¢à¸‡à¸à¸²à¸£à¹Œà¸”', fragment: 'matching and sorting glowing cards in a puzzle' },
            { id: 'cooking', label: 'à¸—à¸³à¸­à¸²à¸«à¸²à¸£ / à¸„à¸£à¸±à¸§', fragment: 'cooking happily in a busy kitchen' },
            { id: 'market', label: 'à¸•à¸¥à¸²à¸”/à¸‹à¸·à¹‰à¸­à¸‚à¸²à¸¢', fragment: 'running a cheerful little market shop, counting coins' },
            { id: 'adventure', label: 'à¸œà¸ˆà¸à¸ à¸±à¸¢à¹ƒà¸™à¸›à¹ˆà¸²', fragment: 'exploring a lush adventurous jungle world' },
            { id: 'underwater', label: 'à¸œà¸ˆà¸à¸ à¸±à¸¢à¹ƒà¸•à¹‰à¸™à¹‰à¸³', fragment: 'diving on an underwater adventure among fish and coral' },
            { id: 'space', label: 'à¸­à¸§à¸à¸²à¸¨', fragment: 'flying through outer space among planets and stars' },
        ],
    },
    {
        key: 'background',
        label: 'à¸‰à¸²à¸à¸«à¸¥à¸±à¸‡',
        multi: false,
        options: [
            { id: 'classroom', label: 'à¸«à¹‰à¸­à¸‡à¹€à¸£à¸µà¸¢à¸™', fragment: 'background: a bright cheerful classroom' },
            { id: 'library', label: 'à¸«à¹‰à¸­à¸‡à¸ªà¸¡à¸¸à¸”', fragment: 'background: a cozy colorful library full of books' },
            { id: 'lab', label: 'à¸«à¹‰à¸­à¸‡à¹à¸¥à¹‡à¸š', fragment: 'background: a fun science laboratory with equipment' },
            { id: 'fantasy', label: 'à¹‚à¸¥à¸à¹à¸Ÿà¸™à¸•à¸²à¸‹à¸µ', fragment: 'background: a colorful magical fantasy world' },
            { id: 'castle', label: 'à¸›à¸£à¸²à¸ªà¸²à¸—', fragment: 'background: a grand fairytale castle' },
            { id: 'space_bg', label: 'à¸­à¸§à¸à¸²à¸¨', fragment: 'background: a starry outer-space galaxy' },
            { id: 'underwater_bg', label: 'à¹ƒà¸•à¹‰à¸—à¸°à¹€à¸¥', fragment: 'background: a vibrant underwater coral reef' },
            { id: 'city', label: 'à¹€à¸¡à¸·à¸­à¸‡', fragment: 'background: a playful cartoon city skyline' },
            { id: 'nature', label: 'à¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´', fragment: 'background: sunny nature with hills, trees and blue sky' },
            { id: 'thai_temple', label: 'à¸§à¸±à¸”/à¸•à¸¥à¸²à¸”à¹„à¸—à¸¢', fragment: 'background: a charming Thai temple and market scene' },
            { id: 'stadium', label: 'à¸ªà¸™à¸²à¸¡à¸à¸µà¸¬à¸²', fragment: 'background: a lively sports stadium' },
            { id: 'candyland', label: 'à¹‚à¸¥à¸à¸‚à¸™à¸¡à¸«à¸§à¸²à¸™', fragment: 'background: a whimsical candy land of sweets' },
            { id: 'night_sky', label: 'à¸à¸¥à¸²à¸‡à¸„à¸·à¸™à¸”à¸²à¸§à¹€à¸•à¹‡à¸¡à¸Ÿà¹‰à¸²', fragment: 'background: a magical starry night sky' },
            { id: 'gradient', label: 'à¸žà¸·à¹‰à¸™à¹„à¸¥à¹ˆà¸ªà¸µà¸™à¸²à¸¡à¸˜à¸£à¸£à¸¡', fragment: 'background: a clean abstract bright gradient with floating shapes' },
        ],
    },
    {
        key: 'composition',
        label: 'à¸¡à¸¸à¸¡à¸¡à¸­à¸‡à¸à¸¥à¹‰à¸­à¸‡',
        multi: false,
        options: [
            { id: 'front', label: 'à¸«à¸™à¹‰à¸²à¸•à¸£à¸‡à¸ªà¸¡à¸”à¸¸à¸¥', fragment: 'centered balanced front-facing composition' },
            { id: 'hero', label: 'à¸¡à¸¸à¸¡à¹€à¸‡à¸¢à¸®à¸µà¹‚à¸£à¹ˆ', fragment: 'dramatic low-angle hero shot, character looking powerful' },
            { id: 'wide', label: 'à¸žà¸²à¹‚à¸™à¸£à¸²à¸¡à¸²à¸à¸§à¹‰à¸²à¸‡', fragment: 'wide panoramic establishing shot showing the whole world' },
            { id: 'closeup', label: 'à¹‚à¸„à¸¥à¸ªà¸­à¸±à¸žà¸•à¸±à¸§à¸¥à¸°à¸„à¸£', fragment: 'close-up framing on the expressive main character' },
            { id: 'dynamic', label: 'à¹„à¸”à¸™à¸²à¸¡à¸´à¸à¹€à¸‰à¸µà¸¢à¸‡', fragment: 'dynamic diagonal action composition with depth' },
        ],
    },
    {
        key: 'effects',
        label: 'à¹€à¸­à¸Ÿà¹€à¸Ÿà¸à¸•à¹Œ / à¸šà¸£à¸£à¸¢à¸²à¸à¸²à¸¨',
        multi: true,
        options: [
            { id: 'sparkle', label: 'à¸›à¸£à¸°à¸à¸²à¸¢à¸”à¸²à¸§', fragment: 'sprinkled with sparkles and twinkling stars' },
            { id: 'glow', label: 'à¹à¸ªà¸‡à¹€à¸£à¸·à¸­à¸‡', fragment: 'with soft glowing light effects' },
            { id: 'speed', label: 'à¹€à¸ªà¹‰à¸™à¸ªà¸›à¸µà¸”à¹à¸­à¹‡à¸à¸Šà¸±à¸™', fragment: 'with dynamic speed-lines and motion blur' },
            { id: 'burst', label: 'à¸£à¸°à¹€à¸šà¸´à¸”à¸žà¸¥à¸±à¸‡', fragment: 'with an energetic power burst and impact effects' },
            { id: 'magic', label: 'à¹€à¸§à¸—à¸¡à¸™à¸•à¸£à¹Œ', fragment: 'with swirling magical particles' },
            { id: 'lightning', label: 'à¸Ÿà¹‰à¸²à¸œà¹ˆà¸²à¸žà¸¥à¸±à¸‡', fragment: 'with crackling energy lightning bolts' },
            { id: 'rainbow_fx', label: 'à¸£à¸¸à¹‰à¸‡à¸à¸´à¸™à¸™à¹‰à¸³', fragment: 'with a bright rainbow arc' },
            { id: 'fireworks', label: 'à¸”à¸­à¸à¹„à¸¡à¹‰à¹„à¸Ÿ', fragment: 'with celebratory fireworks bursting' },
            { id: 'confetti', label: 'à¸à¸£à¸°à¸”à¸²à¸©à¹‚à¸›à¸£à¸¢', fragment: 'with colorful confetti falling' },
            { id: 'leaves', label: 'à¹ƒà¸šà¹„à¸¡à¹‰/à¸à¸¥à¸µà¸šà¸”à¸­à¸à¸›à¸¥à¸´à¸§', fragment: 'with leaves and flower petals drifting in the breeze' },
            { id: 'snow', label: 'à¸«à¸´à¸¡à¸°/à¸™à¹‰à¸³à¹à¸‚à¹‡à¸‡', fragment: 'with gentle snow and icy sparkles' },
            { id: 'candy', label: 'à¸Ÿà¸­à¸‡à¸ªà¸šà¸¹à¹ˆ / à¸¥à¸¹à¸à¸­à¸¡', fragment: 'with floating bubbles and candy decorations' },
        ],
    },
    {
        key: 'detail',
        label: 'à¸„à¸§à¸²à¸¡à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”',
        multi: true,
        options: [
            { id: 'detailed', label: 'à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸ªà¸¹à¸‡', fragment: 'highly detailed, sharp focus, polished professional finish' },
            { id: 'minimal', label: 'à¹€à¸£à¸µà¸¢à¸šà¸ªà¸°à¸­à¸²à¸”', fragment: 'clean minimal composition with simple uncluttered background' },
            { id: 'depth', label: 'à¸¡à¸´à¸•à¸´à¸¥à¸¶à¸ (à¹€à¸šà¸¥à¸­à¸«à¸¥à¸±à¸‡)', fragment: 'soft depth of field, blurred bokeh background' },
            { id: 'vibrant', label: 'à¸ªà¸µà¸ˆà¸±à¸”à¸ªà¸”à¹ƒà¸ª', fragment: 'extra vibrant saturated colors, high contrast, eye-catching' },
        ],
    },
];

/** à¸Šà¸¸à¸”à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸£à¸¹à¸›: à¸„à¸¥à¸´à¸à¹€à¸”à¸µà¸¢à¸§à¹€à¸‹à¹‡à¸•à¸—à¸¸à¸à¹à¸à¸™ */
export const STYLE_PACKS: { id: string; label: string; pick: CoverSelection }[] = [
    {
        id: 'teaching',
        label: 'ðŸ“š à¸ªà¸·à¹ˆà¸­à¸à¸²à¸£à¸ªà¸­à¸™',
        pick: {
            style: 'edu_poster',
            mood: 'cozy',
            colors: 'blue_navy',
            character: 'male_teacher_thai',
            charsize: 'medium',
            scene: ['teaching_demo'],
            background: 'classroom',
            composition: 'front',
            effects: ['sparkle'],
            detail: ['minimal', 'vibrant'],
        },
    },
    {
        id: 'cute',
        label: 'ðŸ§¸ à¸à¸²à¸£à¹Œà¸•à¸¹à¸™à¸™à¹ˆà¸²à¸£à¸±à¸',
        pick: { style: 'chibi', mood: 'cheerful', colors: 'auto', character: 'thai_student', charsize: 'medium', background: 'gradient', composition: 'front', effects: ['sparkle', 'candy'], detail: ['vibrant'] },
    },
    {
        id: 'card',
        label: '🪪 การ์ดไอคอน',
        pick: { style: 'vector', mood: 'cheerful', colors: 'blue_navy', scene: ['icon_card'], background: 'gradient', composition: 'front', effects: ['sparkle'], detail: ['minimal', 'vibrant'] },
    },
    {
        id: 'action',
        label: '⚔️ แอ็กชัน',
        pick: { style: 'anime', mood: 'epic', colors: 'orange_red', character: 'boy_hero', charsize: 'large', background: 'fantasy', composition: 'hero', effects: ['speed', 'burst'], detail: ['detailed'] },
    },
    {
        id: 'game3d',
        label: 'âœ¨ à¹€à¸à¸¡ 3D à¸¡à¸±à¸™à¸§à¸²à¸§',
        pick: { style: 'glossy3d', mood: 'cheerful', colors: 'blue_navy', character: 'robot', charsize: 'medium', background: 'gradient', composition: 'dynamic', effects: ['glow', 'sparkle'], detail: ['detailed', 'depth'] },
    },
    {
        id: 'epic',
        label: 'ðŸ† à¹‚à¸›à¸ªà¹€à¸•à¸­à¸£à¹Œà¸­à¸´à¸‡à¹€à¸à¸¡',
        pick: { style: 'poster', mood: 'epic', colors: 'purple_gold', character: 'duo', charsize: 'large', background: 'castle', composition: 'hero', effects: ['glow', 'magic'], detail: ['detailed'] },
    },
    {
        id: 'storybook',
        label: 'ðŸ“– à¸™à¸´à¸—à¸²à¸™à¸ªà¸µà¸™à¹‰à¸³',
        pick: { style: 'storybook', mood: 'cozy', colors: 'pink_pastel', character: 'animal', charsize: 'small', background: 'nature', composition: 'wide', effects: ['sparkle', 'leaves'], detail: ['depth'] },
    },
    {
        id: 'ocean',
        label: 'ðŸ  à¸œà¸ˆà¸à¸ à¸±à¸¢à¹ƒà¸•à¹‰à¸—à¸°à¹€à¸¥',
        pick: { style: 'glossy3d', mood: 'mysterious', colors: 'mint_cyan', character: 'duo', charsize: 'small', scene: ['underwater'], background: 'underwater_bg', composition: 'wide', effects: ['glow', 'sparkle'], detail: ['depth'] },
    },
    {
        id: 'space',
        label: 'ðŸš€ à¸•à¸°à¸¥à¸¸à¸¢à¸­à¸§à¸à¸²à¸¨',
        pick: { style: 'glossy3d', mood: 'epic', colors: 'galaxy', character: 'robot', charsize: 'medium', scene: ['space'], background: 'space_bg', composition: 'dynamic', effects: ['glow', 'sparkle'], detail: ['detailed'] },
    },
    {
        id: 'thai',
        label: 'ðŸ‡¹ðŸ‡­ à¹„à¸—à¸¢à¸¡à¸‡à¸„à¸¥',
        pick: { style: 'vector', mood: 'cheerful', colors: 'red_gold', character: 'thai_costume', charsize: 'medium', background: 'thai_temple', composition: 'front', effects: ['sparkle'], detail: ['vibrant'] },
    },
    {
        id: 'lab',
        label: 'ðŸ”¬ à¹à¸¥à¹‡à¸šà¸§à¸´à¸—à¸¢à¸²à¸¨à¸²à¸ªà¸•à¸£à¹Œ',
        pick: { style: 'chibi', mood: 'cheerful', colors: 'green_fresh', character: 'scientist', charsize: 'medium', scene: ['science'], background: 'lab', composition: 'closeup', effects: ['glow', 'sparkle'], detail: ['detailed'] },
    },
    {
        id: 'sport',
        label: 'ðŸ… à¸à¸µà¸¬à¸²à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™',
        pick: { style: 'anime', mood: 'epic', colors: 'orange_red', character: 'group', charsize: 'medium', scene: ['sports'], background: 'stadium', composition: 'dynamic', effects: ['speed', 'confetti'], detail: ['vibrant'] },
    },
    {
        id: 'candy',
        label: 'ðŸ¬ à¹‚à¸¥à¸à¸‚à¸™à¸¡à¸«à¸§à¸²à¸™',
        pick: { style: 'clay', mood: 'funny', colors: 'candy_bright', character: 'animal', charsize: 'medium', background: 'candyland', composition: 'front', effects: ['candy', 'confetti'], detail: ['vibrant'] },
    },
    {
        id: 'magic',
        label: 'ðŸª„ à¹€à¸§à¸—à¸¡à¸™à¸•à¸£à¹Œà¸›à¸£à¸´à¸¨à¸™à¸²',
        pick: { style: 'poster', mood: 'dreamy', colors: 'galaxy', character: 'wizard', charsize: 'large', background: 'night_sky', composition: 'hero', effects: ['magic', 'glow'], detail: ['depth'] },
    },
];

export type TitleStyle = 'classic' | 'gold' | 'banner' | 'pop' | 'neon' | 'card';

export const TITLE_STYLES: { id: TitleStyle; label: string }[] = [
    { id: 'classic', label: 'à¸„à¸¥à¸²à¸ªà¸ªà¸´à¸ (à¸‚à¸²à¸§-à¸‚à¸­à¸šà¸à¸£à¸¡à¸—à¹ˆà¸²)' },
    { id: 'gold', label: 'à¸—à¸­à¸‡à¸™à¸¹à¸™ (à¹‚à¸¥à¹‚à¸à¹‰à¹€à¸à¸¡)' },
    { id: 'banner', label: 'à¸›à¹‰à¸²à¸¢à¹à¸šà¸™à¹€à¸™à¸­à¸£à¹Œ' },
    { id: 'pop', label: 'à¸à¸²à¸£à¹Œà¸•à¸¹à¸™à¸›à¹Šà¸­à¸›' },
    { id: 'neon', label: 'à¸™à¸µà¸­à¸­à¸™à¹€à¸£à¸·à¸­à¸‡à¹à¸ªà¸‡' },
    { id: 'card', label: 'การ์ดมินิมอล' },
];

/** à¸›à¸£à¸°à¸à¸­à¸š fragment à¸‚à¸­à¸‡à¹à¸à¸™à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ â†’ parts[] (à¸à¸£à¸­à¸‡à¸„à¹ˆà¸²à¸§à¹ˆà¸²à¸‡) à¸ªà¹ˆà¸‡à¹ƒà¸«à¹‰ /api/generate-cover */
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

/** à¸ªà¸¸à¹ˆà¸¡à¹€à¸¥à¸·à¸­à¸à¸—à¸¸à¸à¹à¸à¸™ (single = 1 à¸•à¸±à¸§, multi = 1-2 à¸•à¸±à¸§) à¸ªà¸³à¸«à¸£à¸±à¸šà¸›à¸¸à¹ˆà¸¡ ðŸŽ² */
export function randomSelection(): CoverSelection {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const out: CoverSelection = {};
    for (const group of COVER_GROUPS) {
        if (group.multi) {
            const shuffled = [...group.options].sort(() => Math.random() - 0.5);
            const n = 1 + Math.floor(Math.random() * 2); // 1-2 à¸•à¸±à¸§
            out[group.key] = shuffled.slice(0, n).map((o) => o.id);
        } else {
            out[group.key] = pick(group.options).id;
        }
    }
    return out;
}
