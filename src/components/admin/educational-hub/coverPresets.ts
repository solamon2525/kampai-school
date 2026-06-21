/**
 * coverPresets.ts — config เช็กลิสต์สำเร็จรูปสำหรับ "ปก AI" (GameCoverAiDialog)
 *
 * แนวคิด: ครูเลือกจากชิป (ไม่ต้องพิมพ์) → ประกอบ prompt อังกฤษให้เอง
 * - แต่ละชิป = { id, label(ไทย), fragment(อังกฤษ) } · fragment ว่าง = "ปล่อยให้ AI เดา"
 * - COVER_GROUPS = แกนเลือกทีละด้าน (single/multi)
 * - STYLE_PACKS  = ชุดสำเร็จรูป คลิกเดียวเซ็ตทุกแกน
 * - TITLE_STYLES = สไตล์โลโก้ชื่อเกมที่ overlay ฝั่ง client (ดู drawCover ใน GameCoverAiDialog)
 *
 * เพิ่ม/แก้สไตล์ที่ไฟล์นี้ที่เดียว — ไม่ต้องแตะ edit edge function (api/generate-cover.ts
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
            { id: 'robot', label: 'มาสคอตหุ่นยนต์', fragment: 'main character: a friendly cute robot mascot with big glowing eyes' },
            { id: 'animal', label: 'มาสคอตสัตว์น่ารัก', fragment: 'main character: an adorable animal mascot with a big head and expressive eyes' },
        ],
    },
    {
        key: 'scene',
        label: 'ฉาก / กิจกรรม',
        multi: true,
        options: [
            { id: 'math', label: 'แก้โจทย์เลข', fragment: 'solving floating math problems with glowing numbers and symbols' },
            { id: 'spell', label: 'สะกดคำ', fragment: 'arranging letter blocks to spell words' },
            { id: 'science', label: 'ทดลองวิทยาศาสตร์', fragment: 'doing a fun science experiment with bubbling flasks and sparks' },
            { id: 'race', label: 'แข่งวิ่ง / ความเร็ว', fragment: 'racing forward at high speed with motion lines' },
            { id: 'battle', label: 'สังเวียนต่อสู้', fragment: 'facing off in an epic battle arena, ready to duel' },
            { id: 'cooking', label: 'ทำอาหาร / ครัว', fragment: 'cooking happily in a busy kitchen' },
            { id: 'adventure', label: 'ผจญภัยในป่า', fragment: 'exploring a lush adventurous jungle world' },
            { id: 'space', label: 'อวกาศ', fragment: 'flying through outer space among planets and stars' },
        ],
    },
    {
        key: 'background',
        label: 'ฉากหลัง',
        multi: false,
        options: [
            { id: 'classroom', label: 'ห้องเรียน', fragment: 'background: a bright cheerful classroom' },
            { id: 'fantasy', label: 'โลกแฟนตาซี', fragment: 'background: a colorful magical fantasy world' },
            { id: 'space_bg', label: 'อวกาศ', fragment: 'background: a starry outer-space galaxy' },
            { id: 'city', label: 'เมือง', fragment: 'background: a playful cartoon city skyline' },
            { id: 'nature', label: 'ธรรมชาติ', fragment: 'background: sunny nature with hills, trees and blue sky' },
            { id: 'gradient', label: 'พื้นไล่สีนามธรรม', fragment: 'background: a clean abstract bright gradient with floating shapes' },
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
            { id: 'candy', label: 'ฟองสบู่ / ลูกอม', fragment: 'with floating bubbles and candy decorations' },
        ],
    },
];

/** ชุดสำเร็จรูป: คลิกเดียวเซ็ตทุกแกน */
export const STYLE_PACKS: { id: string; label: string; pick: CoverSelection }[] = [
    {
        id: 'cute',
        label: '🧸 การ์ตูนน่ารัก',
        pick: { style: 'chibi', colors: 'auto', character: 'thai_student', background: 'gradient', effects: ['sparkle', 'candy'] },
    },
    {
        id: 'action',
        label: '⚔️ อนิเมะแอ็กชัน',
        pick: { style: 'anime', colors: 'orange_red', character: 'boy_hero', background: 'fantasy', effects: ['speed', 'burst'] },
    },
    {
        id: 'game3d',
        label: '✨ เกม 3D มันวาว',
        pick: { style: 'glossy3d', colors: 'blue_navy', character: 'robot', background: 'gradient', effects: ['glow', 'sparkle'] },
    },
    {
        id: 'epic',
        label: '🏆 โปสเตอร์อิงเกม',
        pick: { style: 'poster', colors: 'purple_gold', character: 'duo', background: 'fantasy', effects: ['glow', 'magic'] },
    },
    {
        id: 'storybook',
        label: '📖 นิทานสีน้ำ',
        pick: { style: 'storybook', colors: 'pink_pastel', character: 'animal', background: 'nature', effects: ['sparkle'] },
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
