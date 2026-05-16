/**
 * CertOCR — Thai/English OCR สำหรับใบประกาศ (Tesseract.js lazy-loaded)
 *
 * ⚠️ ห้าม import ตรง — Tesseract.js ใหญ่ (~3MB JS + 7MB trained data)
 *    ใช้ `await import()` เท่านั้น เรียกตอนกดปุ่มเท่านั้น
 */

export interface ParsedCert {
    courseName?: string;
    startDate?: string; // ISO YYYY-MM-DD
    hours?: number;
}

export interface OCRResult {
    text: string;
    parsed: ParsedCert;
}

const THAI_MONTHS: Record<string, number> = {
    'มกราคม': 1, 'มกรา': 1, 'ม.ค.': 1, 'มค.': 1,
    'กุมภาพันธ์': 2, 'กุมภา': 2, 'ก.พ.': 2, 'กพ.': 2,
    'มีนาคม': 3, 'มีนา': 3, 'มี.ค.': 3, 'มีค.': 3,
    'เมษายน': 4, 'เมษา': 4, 'เม.ย.': 4, 'เมย.': 4,
    'พฤษภาคม': 5, 'พฤษภา': 5, 'พ.ค.': 5, 'พค.': 5,
    'มิถุนายน': 6, 'มิถุนา': 6, 'มิ.ย.': 6, 'มิย.': 6,
    'กรกฎาคม': 7, 'กรกฎา': 7, 'ก.ค.': 7, 'กค.': 7,
    'สิงหาคม': 8, 'สิงหา': 8, 'ส.ค.': 8, 'สค.': 8,
    'กันยายน': 9, 'กันยา': 9, 'ก.ย.': 9, 'กย.': 9,
    'ตุลาคม': 10, 'ตุลา': 10, 'ต.ค.': 10, 'ตค.': 10,
    'พฤศจิกายน': 11, 'พฤศจิกา': 11, 'พ.ย.': 11, 'พย.': 11,
    'ธันวาคม': 12, 'ธันวา': 12, 'ธ.ค.': 12, 'ธค.': 12,
};

/** เดาวันที่ — รองรับ:
 *   - "15 มี.ค. 2568"
 *   - "วันที่ 15 มีนาคม 2568"
 *   - "15/3/2568"  →  ISO
 *   - "2025-03-15"  →  ISO (เก็บไว้ตามนั้น)
 *
 * คืน ISO YYYY-MM-DD (ค.ศ.) — ถ้าเจอปี พ.ศ. แปลง −543
 */
function extractDate(text: string): string | undefined {
    // ISO date ก่อน (YYYY-MM-DD)
    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // "วันที่ DD MMMM YYYY" หรือ "DD MMMM YYYY"
    const monthPattern = Object.keys(THAI_MONTHS).join('|');
    const reThai = new RegExp(`(\\d{1,2})\\s*(${monthPattern})\\s*(\\d{4})`);
    const thaiMatch = text.match(reThai);
    if (thaiMatch) {
        const day = parseInt(thaiMatch[1], 10);
        const month = THAI_MONTHS[thaiMatch[2]];
        let year = parseInt(thaiMatch[3], 10);
        if (year > 2400) year -= 543; // พ.ศ. → ค.ศ.
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // "DD/MM/YYYY" หรือ "DD-MM-YYYY"
    const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10);
        let year = parseInt(slashMatch[3], 10);
        if (year > 2400) year -= 543;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return undefined;
}

/** เดาชั่วโมง — match `(\d+) ชั่วโมง` หรือ `(\d+) ชม.` */
function extractHours(text: string): number | undefined {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:ชั่วโมง|ชม\.|ชม|hr|hours?)/i);
    if (!m) return undefined;
    const v = parseFloat(m[1]);
    if (isNaN(v) || v <= 0 || v > 9999) return undefined;
    return v;
}

/** เดาชื่อหลักสูตร — บรรทัดที่ "เป็นชื่อ" มักอยู่ใกล้คำว่า "หลักสูตร" / "อบรม" / "สัมมนา" / "เรื่อง"
 *  หรือบรรทัดยาวสุดในต้นไฟล์ ที่ไม่ใช่ชื่อโรงเรียน/หน่วยงาน
 */
function extractCourseName(text: string): string | undefined {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3);
    if (lines.length === 0) return undefined;

    // Strategy 1: บรรทัดที่ขึ้นต้นด้วย "เรื่อง" หรือ "หลักสูตร"
    for (const line of lines) {
        const m = line.match(/(?:เรื่อง|หลักสูตร|หัวข้อ|รายวิชา)[\s:]+(.+)/);
        if (m && m[1].trim().length >= 5) {
            return m[1].trim().replace(/^["“'']|["”'']$/g, '').slice(0, 200);
        }
    }

    // Strategy 2: บรรทัดที่อยู่ระหว่าง keyword "ได้เข้ารับการอบรม/สัมมนา" + "ระหว่างวันที่"
    const fullText = lines.join(' ');
    const between = fullText.match(/(?:เข้ารับการอบรม|เข้าร่วม(?:การ)?สัมมนา|ผ่านการอบรม|อบรม)[\s\S]{0,15}["“'']?(.+?)["”'']?\s*(?:ระหว่าง|ตั้งแต่|วันที่|จัดโดย|เมื่อ)/);
    if (between && between[1].trim().length >= 5) {
        return between[1].trim().slice(0, 200);
    }

    // Strategy 3: บรรทัดยาวสุดใน 5 บรรทัดแรก (ที่ไม่มี keyword โรงเรียน/หน่วยงาน)
    const candidates = lines.slice(0, 6).filter((l) =>
        !/(โรงเรียน|มหาวิทยาลัย|สถาบัน|กระทรวง|สำนัก|ใบประกาศ|วุฒิบัตร|certificate)/i.test(l)
    );
    if (candidates.length > 0) {
        const longest = candidates.reduce((a, b) => (b.length > a.length ? b : a));
        if (longest.length >= 8) return longest.slice(0, 200);
    }

    return undefined;
}

function parseCertText(text: string): ParsedCert {
    return {
        courseName: extractCourseName(text),
        startDate: extractDate(text),
        hours: extractHours(text),
    };
}

/**
 * Run OCR on a cert image file
 * @param file image File object (JPG/PNG/WebP)
 * @param onProgress optional progress callback (0-1)
 */
export async function runCertOCR(
    file: File,
    onProgress?: (p: number) => void,
): Promise<OCRResult> {
    // Lazy import — โหลด tesseract.js เฉพาะตอนเรียก
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['tha', 'eng'], 1, {
        logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
                onProgress(m.progress);
            }
        },
    });
    try {
        const { data } = await worker.recognize(file);
        return {
            text: data.text,
            parsed: parseCertText(data.text),
        };
    } finally {
        await worker.terminate();
    }
}
