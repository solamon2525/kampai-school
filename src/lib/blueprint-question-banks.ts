/** คลังโจทย์สำหรับ Blueprint Editor — แชร์กับเกม platformer */

export type BlueprintQuestionBankEntry = {
    id: string;
    prompt: string;
    options: string[];
    answer: string;
    /** คำเต็ม (TTS / แสดงเสริม) */
    word?: string;
    subject?: string;
    tags?: string[];
};

/** โจทย์จาก thai-sara-run.html — sync กับ QUESTIONS ในเกม */
export const THAI_SARA_RUN_QUESTION_BANK: BlueprintQuestionBankEntry[] = [
    { id: 'tsr-1', prompt: 'ป _', word: 'ปู', answer: 'ู', options: ['ู', 'า', 'ิ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-2', prompt: 'ต _', word: 'ตา', answer: 'า', options: ['า', 'ี', 'ุ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-3', prompt: 'ล _ ง', word: 'ลิง', answer: 'ิ', options: ['ิ', 'ึ', 'ื'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-4', prompt: 'โรงเร _ ยน', word: 'โรงเรียน', answer: 'ี', options: ['ี', 'ิ', 'ื'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-5', prompt: 'ม _ า', word: 'ม้า', answer: '้', options: ['้', '๊', '่'], subject: 'thai', tags: ['วรรณยุกต์'] },
    { id: 'tsr-6', prompt: 'หม _', word: 'หมา', answer: 'า', options: ['า', 'ิ', 'ำ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-7', prompt: 'น _ ก', word: 'นัก', answer: 'ั', options: ['ั', 'ุ', 'ึ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-8', prompt: 'ไก _', word: 'ไก่', answer: '่', options: ['่', '้', '๊'], subject: 'thai', tags: ['วรรณยุกต์'] },
    { id: 'tsr-9', prompt: 'หม _', word: 'หมู', answer: 'ู', options: ['ู', 'ุ', 'า'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-10', prompt: 'แม _', word: 'แม่', answer: '่', options: ['่', '้', 'า'], subject: 'thai', tags: ['วรรณยุกต์'] },
    { id: 'tsr-11', prompt: 'ด _ น', word: 'ดิน', answer: 'ิ', options: ['ิ', 'ี', 'ึ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-12', prompt: 'ม _ ด', word: 'มัด', answer: 'ั', options: ['ั', 'า', 'ิ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-13', prompt: 'เร _', word: 'เรา', answer: 'า', options: ['า', 'ิ', 'ุ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-14', prompt: 'เด _ ก', word: 'เด็ก', answer: '็', options: ['็', '่', '้'], subject: 'thai', tags: ['ไม้ยักก์'] },
    { id: 'tsr-15', prompt: 'ปล _', word: 'ปลา', answer: 'า', options: ['า', 'ิ', 'ุ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-16', prompt: 'ช _ าง', word: 'ช้าง', answer: '้', options: ['้', '่', '๊'], subject: 'thai', tags: ['วรรณยุกต์'] },
    { id: 'tsr-17', prompt: 'ฟ _ น', word: 'ฟัน', answer: 'ั', options: ['ั', 'า', 'ิ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-18', prompt: 'ร _ น', word: 'รัน', answer: 'ั', options: ['ั', 'ิ', 'ุ'], subject: 'thai', tags: ['สระ'] },
    { id: 'tsr-19', prompt: 'ส _ ต', word: 'สัตว์', answer: 'ั', options: ['ั', 'า', 'ิ'], subject: 'thai', tags: ['สระ'] },
];

/** โจทย์ทั่วไป (เกม platformer อื่น) */
export const GENERIC_MATH_QUESTION_BANK: BlueprintQuestionBankEntry[] = [
    { id: 'math-1', prompt: '2 + 3 = ?', answer: '5', options: ['4', '5', '6'], subject: 'math' },
    { id: 'math-2', prompt: '7 − 4 = ?', answer: '3', options: ['2', '3', '4'], subject: 'math' },
    { id: 'math-3', prompt: '3 × 2 = ?', answer: '6', options: ['5', '6', '8'], subject: 'math' },
];

const BANK_BY_SLUG: Record<string, BlueprintQuestionBankEntry[]> = {
    'thai-sara-run': THAI_SARA_RUN_QUESTION_BANK,
    'platformer-blueprint': [...THAI_SARA_RUN_QUESTION_BANK, ...GENERIC_MATH_QUESTION_BANK],
};

export function getQuestionBankForGame(gameSlug?: string | null): BlueprintQuestionBankEntry[] {
    if (gameSlug && BANK_BY_SLUG[gameSlug]) return BANK_BY_SLUG[gameSlug];
    return GENERIC_MATH_QUESTION_BANK;
}

export function mergeQuestionBanks(
    builtIn: BlueprintQuestionBankEntry[],
    imported: BlueprintQuestionBankEntry[],
): BlueprintQuestionBankEntry[] {
    const seen = new Set<string>();
    const out: BlueprintQuestionBankEntry[] = [];
    for (const e of [...imported, ...builtIn]) {
        const key = `${e.prompt}::${e.answer}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(e);
    }
    return out;
}

export function bankEntryToQuestionFields(entry: BlueprintQuestionBankEntry) {
    return {
        prompt: entry.prompt,
        options: entry.options.slice(0, 4),
        answer: entry.answer,
    };
}

/** CSV: prompt,answer,option1,option2[,option3[,option4]] — แถวแรกเป็น header ได้ */
export function parseBlueprintQuestionsCsv(text: string): {
    entries: BlueprintQuestionBankEntry[];
    errors: string[];
} {
    const errors: string[] = [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { entries: [], errors: ['ไฟล์ว่าง'] };

    const entries: BlueprintQuestionBankEntry[] = [];
    let start = 0;
    const first = splitCsvLine(lines[0]);
    if (/prompt|โจทย์/i.test(first[0] ?? '')) start = 1;

    for (let i = start; i < lines.length; i++) {
        const cols = splitCsvLine(lines[i]);
        if (cols.length < 4) {
            errors.push(`แถว ${i + 1}: ต้องมีอย่างน้อย prompt, answer, option1, option2`);
            continue;
        }
        const [prompt, answer, ...options] = cols;
        const trimmedOpts = options.map((o) => o.trim()).filter(Boolean);
        if (!prompt.trim()) {
            errors.push(`แถว ${i + 1}: ไม่มีโจทย์`);
            continue;
        }
        if (!answer.trim()) {
            errors.push(`แถว ${i + 1}: ไม่มีคำตอบ`);
            continue;
        }
        if (trimmedOpts.length < 2) {
            errors.push(`แถว ${i + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`);
            continue;
        }
        if (!trimmedOpts.includes(answer.trim())) {
            errors.push(`แถว ${i + 1}: คำตอบ "${answer}" ไม่อยู่ในตัวเลือก`);
            continue;
        }
        entries.push({
            id: `csv-${i}-${crypto.randomUUID().slice(0, 6)}`,
            prompt: prompt.trim(),
            answer: answer.trim(),
            options: trimmedOpts.slice(0, 4),
            subject: 'imported',
            tags: ['csv'],
        });
    }
    return { entries, errors };
}

function splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQ = !inQ;
            continue;
        }
        if ((c === ',' && !inQ) || c === '\t') {
            out.push(cur.trim());
            cur = '';
            continue;
        }
        cur += c;
    }
    out.push(cur.trim());
    return out;
}

export const BLUEPRINT_QUESTION_CSV_TEMPLATE = `prompt,answer,option1,option2,option3
ป _,ู,ู,า,ิ
ต _,า,า,ี,ุ
2 + 3 = ?,5,4,5,6`;
