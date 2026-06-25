// featuredBlocks.ts — โลจิกตำแหน่ง auto-inject ของบล็อก featured_hero / featured_games
//
// บล็อก 2 ตัวนี้เพิ่มทีหลัง (migration 213 ฯลฯ) จึงมักไม่อยู่ใน homepage_layout ที่บันทึกไว้ →
// ต้อง inject ตอน render. โลจิกตำแหน่ง "ต้องตรงกัน" ทั้งหน้าเว็บจริง (Index.tsx) และตัวแก้หลังบ้าน
// (HomepageManager.tsx) ไม่งั้นบล็อกจะอยู่คนละที่ → หาไม่เจอ/เซฟแล้วเด้งตำแหน่ง. รวมไว้ที่นี่ที่เดียว.

interface Zone {
    blocks: string[];
    hidden: string[];
}

interface LayoutLike {
    header?: Zone;
    left?: Zone;
    main?: Zone;
    right?: Zone;
    footer?: Zone;
}

// แทรก featured_games หลัง featured_hero (ถ้าไม่มี → หลัง hero → ไม่มีอีก → ต้นสุด)
function insertFeaturedGames(blocks: string[]): void {
    const fhIndex = blocks.indexOf('featured_hero');
    const hIndex = blocks.indexOf('hero');
    const at = fhIndex !== -1 ? fhIndex + 1 : hIndex !== -1 ? hIndex + 1 : 0;
    blocks.splice(at, 0, 'featured_games');
}

/**
 * เดสก์ท็อป (เลย์เอาท์ 5 โซน): แทรก featured_hero + featured_games ลงโซน main "เฉพาะเมื่อไม่มีอยู่ที่ใดเลย"
 * (เช็คทั้ง blocks + hidden ทุกโซน — กันแทรกซ้ำถ้าแอดมินย้ายไปโซนอื่น/ซ่อนไว้). mutate layout.main แล้วคืน layout.
 */
export function injectFeaturedMainBlocks<T extends LayoutLike>(layout: T): T {
    const zones = [layout.header, layout.left, layout.main, layout.right, layout.footer];
    const has = (id: string) => zones.some((z) => z && (z.blocks.includes(id) || z.hidden.includes(id)));

    if (!layout.main) layout.main = { blocks: [], hidden: [] } as Zone;
    const main = layout.main;

    if (!has('featured_hero')) {
        const heroIndex = main.blocks.indexOf('hero');
        if (heroIndex !== -1) main.blocks.splice(heroIndex + 1, 0, 'featured_hero');
        else main.blocks.unshift('featured_hero');
    }
    if (!has('featured_games')) {
        insertFeaturedGames(main.blocks);
    }
    return layout;
}

/**
 * มือถือ (เลย์เอาท์ flat array): แทรก featured_hero + featured_games "เฉพาะเมื่อไม่มีใน blocks/hidden".
 * mutate blocks แล้วคืน blocks.
 */
export function injectFeaturedMobileBlocks(blocks: string[], hidden: string[] = []): string[] {
    const has = (id: string) => blocks.includes(id) || hidden.includes(id);

    if (!has('featured_hero')) {
        const heroIndex = blocks.indexOf('hero');
        if (heroIndex !== -1) blocks.splice(heroIndex + 1, 0, 'featured_hero');
        else blocks.unshift('featured_hero');
    }
    if (!has('featured_games')) {
        insertFeaturedGames(blocks);
    }
    return blocks;
}
