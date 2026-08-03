import {
    CHARACTER_ANIM_PRESET_UNIVERSAL_LPC,
    type CharacterAnimationConfig,
} from '@/lib/character-animation';

export const LPC_GENERATOR_URL =
    'https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/';

export const LPC_SOURCE_KIND = 'universal-lpc' as const;
export const LPC_COLUMNS = 13;
export const LPC_CLASSIC_ROWS = 21;

export type LpcSheetAnalysis = {
    width: number;
    height: number;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    frameCount: number;
    animationConfig: CharacterAnimationConfig;
};

export type LpcImportMetadata = {
    sourceJson: Record<string, unknown>;
    sourceJsonFilename: string;
    creditsText: string;
    creditsFilename: string;
    licenseSummary: string[];
};

/**
 * Universal LPC classic layout: 13 columns × 21 rows.
 * Rows 8–11 are walk (up, left, down, right); the first 21 rows remain
 * compatible when a generator export contains additional LPC Expanded rows.
 */
export function createLpcAnimationConfig(rows = LPC_CLASSIC_ROWS): CharacterAnimationConfig {
    return {
        ...CHARACTER_ANIM_PRESET_UNIVERSAL_LPC,
        rows,
    };
}

export function analyzeLpcDimensions(width: number, height: number): LpcSheetAnalysis {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
        throw new Error('ไม่สามารถอ่านขนาดภาพ spritesheet ได้');
    }
    if (width % LPC_COLUMNS !== 0) {
        throw new Error(`ภาพ LPC ต้องมี ${LPC_COLUMNS} คอลัมน์ แต่ความกว้าง ${width}px หารไม่ลงตัว`);
    }

    const frameWidth = width / LPC_COLUMNS;
    if (height % frameWidth !== 0) {
        throw new Error('เฟรม LPC ต้องเป็นสี่เหลี่ยมจัตุรัสและเรียงเต็มแถว');
    }

    const rows = height / frameWidth;
    if (!Number.isInteger(rows) || rows < LPC_CLASSIC_ROWS) {
        throw new Error(`ต้องเป็น Complete LPC sheet อย่างน้อย ${LPC_CLASSIC_ROWS} แถว`);
    }
    if (frameWidth < 16 || frameWidth > 256) {
        throw new Error(`ขนาดเฟรม ${frameWidth}px อยู่นอกช่วงที่รองรับ (16–256px)`);
    }

    return {
        width,
        height,
        frameWidth,
        frameHeight: frameWidth,
        columns: LPC_COLUMNS,
        rows,
        frameCount: LPC_COLUMNS * rows,
        animationConfig: createLpcAnimationConfig(rows),
    };
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('เปิดไฟล์ภาพไม่สำเร็จ กรุณาใช้ PNG ที่ดาวน์โหลดจาก LPC Generator'));
        };
        image.src = url;
    });
}

export function detectLpcLicenses(creditsText: string): string[] {
    const matches: Array<[RegExp, string]> = [
        [/\bCC0\b/i, 'CC0'],
        [/CC[- ]?BY[- ]?SA(?:\s*3\.0|\s*4\.0)?/i, 'CC-BY-SA'],
        [/OGA[- ]?BY/i, 'OGA-BY'],
        [/CC[- ]?BY(?![- ]?SA)(?:\s*3\.0|\s*4\.0)?/i, 'CC-BY'],
        [/\bGPL(?:v?3(?:\.0)?)?\b/i, 'GPL-3.0'],
    ];
    return matches.filter(([pattern]) => pattern.test(creditsText)).map(([, label]) => label);
}

export function parseLpcMetadata(
    sourceJsonText: string,
    sourceJsonFilename: string,
    creditsText: string,
    creditsFilename: string,
): LpcImportMetadata {
    let parsed: unknown;
    try {
        parsed = JSON.parse(sourceJsonText);
    } catch {
        throw new Error('ไฟล์ JSON จาก LPC Generator ไม่ถูกต้อง');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON ต้องเป็นข้อมูลตัวละครที่ export จาก LPC Generator');
    }

    const normalizedCredits = creditsText.trim();
    if (normalizedCredits.length < 20) {
        throw new Error('ไฟล์ Credits ว่างหรือสั้นเกินไป กรุณาดาวน์โหลด Credits จาก Generator');
    }

    const licenseSummary = detectLpcLicenses(normalizedCredits);
    return {
        sourceJson: parsed as Record<string, unknown>,
        sourceJsonFilename,
        creditsText: normalizedCredits,
        creditsFilename,
        licenseSummary: licenseSummary.length ? licenseSummary : ['ตามไฟล์ Credits ที่แนบ'],
    };
}

export function downloadCharacterMetadata(filename: string, text: string, type = 'text/plain') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
