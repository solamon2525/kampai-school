/**
 * sdqScoring.ts — Thai SDQ (Strengths and Difficulties Questionnaire) 25-item
 *
 * Domains (5 ข้อต่อหมวด):
 *   - emotional   (อาการทางอารมณ์)
 *   - conduct     (พฤติกรรมเกเร)
 *   - hyperact    (ไม่อยู่นิ่ง/สมาธิสั้น)
 *   - peer        (ปัญหากับเพื่อน)
 *   - prosocial   (สัมพันธภาพทางสังคม) — strength, ไม่รวมใน total difficulty
 *
 * Total Difficulty = emotional + conduct + hyperact + peer (0–40)
 *
 * Likert 0 = ไม่จริง, 1 = ค่อนข้างจริง, 2 = จริง
 * บางข้อ reverse-coded (2 → 0, 1 → 1, 0 → 2)
 */

export type SdqQuestion = {
    id: number;             // 1..25
    text: string;
    domain: 'emotional' | 'conduct' | 'hyperact' | 'peer' | 'prosocial';
    reverse?: boolean;
};

export const SDQ_QUESTIONS: SdqQuestion[] = [
    { id: 1,  text: 'ใส่ใจความรู้สึกของคนอื่น',                                   domain: 'prosocial' },
    { id: 2,  text: 'อยู่นิ่งไม่ได้ กระสับกระส่ายตลอดเวลา',                       domain: 'hyperact' },
    { id: 3,  text: 'มักบ่นว่าปวดศีรษะ ปวดท้อง หรือไม่สบายบ่อยๆ',                  domain: 'emotional' },
    { id: 4,  text: 'แบ่งของให้คนอื่น (ขนม ของเล่น ดินสอ ฯลฯ)',                   domain: 'prosocial' },
    { id: 5,  text: 'อาละวาดบ่อย หรืออารมณ์เสียง่าย',                              domain: 'conduct' },
    { id: 6,  text: 'มักอยู่คนเดียว ชอบเล่นคนเดียว ออกห่างจากคนอื่น',              domain: 'peer' },
    { id: 7,  text: 'เชื่อฟัง โดยทั่วไปทำตามที่ผู้ใหญ่บอก',                         domain: 'conduct', reverse: true },
    { id: 8,  text: 'กังวลใจหลายเรื่อง ดูเหมือนกังวลตลอดเวลา',                     domain: 'emotional' },
    { id: 9,  text: 'ช่วยเหลือผู้อื่นเมื่อเขาเจ็บปวด หรือเสียใจ',                  domain: 'prosocial' },
    { id: 10, text: 'อยู่ไม่สุข นั่งนิ่งๆ ไม่ได้',                                domain: 'hyperact' },
    { id: 11, text: 'มีเพื่อนสนิทอย่างน้อย 1 คน',                                 domain: 'peer', reverse: true },
    { id: 12, text: 'ทะเลาะกับเด็กอื่นบ่อย หรือรังแกเด็กอื่น',                    domain: 'conduct' },
    { id: 13, text: 'รู้สึกไม่มีความสุข ท้อแท้ ร้องไห้บ่อย',                       domain: 'emotional' },
    { id: 14, text: 'เด็กอื่นชอบเล่นด้วย',                                       domain: 'peer', reverse: true },
    { id: 15, text: 'วอกแวกง่าย สมาธิสั้น',                                       domain: 'hyperact' },
    { id: 16, text: 'ขี้กังวล ติดผู้ใหญ่ ขาดความมั่นใจ',                          domain: 'emotional' },
    { id: 17, text: 'อ่อนโยน เมตตาเด็กที่เล็กกว่า',                                domain: 'prosocial' },
    { id: 18, text: 'โกหก โกง หรือขโมยของบ่อยๆ',                                  domain: 'conduct' },
    { id: 19, text: 'เด็กอื่นล้อเลียน หรือรังแก',                                  domain: 'peer' },
    { id: 20, text: 'อาสาช่วยเหลือคนอื่นบ่อย (ผู้ปกครอง ครู เด็กอื่น)',           domain: 'prosocial' },
    { id: 21, text: 'คิดก่อนทำ ใช้สมาธิทำงานได้',                                 domain: 'hyperact', reverse: true },
    { id: 22, text: 'ขโมยของที่บ้าน โรงเรียน หรือที่อื่น',                         domain: 'conduct' },
    { id: 23, text: 'เข้ากับผู้ใหญ่ได้ดีกว่ากับเด็กรุ่นเดียวกัน',                domain: 'peer' },
    { id: 24, text: 'กลัวง่ายๆ ตกใจง่าย',                                         domain: 'emotional' },
    { id: 25, text: 'ทำงานที่ได้รับมอบหมายจนจบ ทำดี ตั้งใจทำ',                    domain: 'hyperact', reverse: true },
];

export type SdqDomainScore = {
    emotional: number;
    conduct: number;
    hyperact: number;
    peer: number;
    prosocial: number;
};

/** Compute domain scores จาก raw responses (0|1|2 ต่อข้อ) */
export const computeSdqScores = (
    responses: Record<number, number>,
): { domain: SdqDomainScore; totalDifficulty: number } => {
    const domain: SdqDomainScore = {
        emotional: 0, conduct: 0, hyperact: 0, peer: 0, prosocial: 0,
    };
    for (const q of SDQ_QUESTIONS) {
        const raw = responses[q.id] ?? 0;
        const v = q.reverse ? 2 - raw : raw;
        domain[q.domain] += v;
    }
    const totalDifficulty = domain.emotional + domain.conduct + domain.hyperact + domain.peer;
    return { domain, totalDifficulty };
};

/**
 * Interpretation — Thai SDQ cutoffs (parent/teacher report, ages 4-16)
 * 0-15 = ปกติ
 * 16-19 = เสี่ยงต่อปัญหาพฤติกรรม
 * 20-40 = มีปัญหาพฤติกรรมชัดเจน
 */
export const interpretSdqTotal = (total: number): string => {
    if (total <= 15) return 'ปกติ';
    if (total <= 19) return 'เสี่ยงต่อปัญหาพฤติกรรม';
    return 'มีปัญหาพฤติกรรมชัดเจน';
};

/** Interpretation per domain (cutoffs Thai SDQ) */
export const interpretDomain = (domain: keyof SdqDomainScore, score: number): 'ปกติ' | 'เสี่ยง' | 'มีปัญหา' => {
    const cutoffs: Record<keyof SdqDomainScore, [number, number]> = {
        emotional: [5, 6],
        conduct:   [3, 4],
        hyperact:  [5, 6],
        peer:      [3, 4],
        prosocial: [5, 4], // strength: low score = problem
    };
    const [normalMax, riskMax] = cutoffs[domain];
    if (domain === 'prosocial') {
        if (score >= 6) return 'ปกติ';
        if (score === 5) return 'เสี่ยง';
        return 'มีปัญหา';
    }
    if (score <= normalMax) return 'ปกติ';
    if (score <= riskMax) return 'เสี่ยง';
    return 'มีปัญหา';
};

export const DOMAIN_LABEL: Record<keyof SdqDomainScore, string> = {
    emotional: 'อารมณ์',
    conduct:   'พฤติกรรมเกเร',
    hyperact:  'สมาธิสั้น/ไม่อยู่นิ่ง',
    peer:      'ปัญหากับเพื่อน',
    prosocial: 'สัมพันธภาพทางสังคม',
};
