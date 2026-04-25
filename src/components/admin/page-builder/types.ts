export type BlockType = 'text' | 'image' | 'banner' | 'stats' | 'map';

export interface StatItem {
    value: string;
    label: string;
}

export interface PageBlock {
    id: string;
    type: BlockType;
    props: {
        // text block
        title?: string;
        content?: string;
        // image block
        image_url?: string;
        caption?: string;
        // banner block
        subtitle?: string;
        cta_text?: string;
        cta_url?: string;
        // stats block
        stats?: StatItem[];
        // map block
        embed_url?: string;
        map_title?: string;
    };
}

export const PAGE_KEYS = {
    about: 'page_layout_about',
    contact: 'page_layout_contact',
} as const;

export type PageId = keyof typeof PAGE_KEYS;

export const PAGE_LABELS: Record<PageId, string> = {
    about: 'หน้าเกี่ยวกับเรา',
    contact: 'หน้าติดต่อเรา',
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
    text: 'ข้อความ',
    image: 'รูปภาพ',
    banner: 'Banner',
    stats: 'สถิติ',
    map: 'แผนที่',
};

export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
    text: '📝',
    image: '🖼️',
    banner: '📢',
    stats: '📊',
    map: '🗺️',
};
