/**
 * edu-hub-subjects.ts
 *
 * Single source of truth สำหรับ:
 * - SUBJECT_OPTIONS: 8 กลุ่มสาระตามหลักสูตรประถมศึกษาขั้นพื้นฐาน
 *   (ใช้ใน Select ของ EduHubItemForm + Combobox flow ที่ admin พิมพ์เพิ่มเองได้)
 * - SUBJECT_TAGS: tag suggestions per-วิชา — admin click toggle เลือก
 *   หรือพิมพ์ custom tag เพิ่มเองได้ใน TagPicker
 *
 * ไม่ผูกกับ DB schema (subject = TEXT free-text) — เปลี่ยน list ทำได้
 * โดยไม่ต้อง migration. ค่าเดิมจาก migration 062 ("คณิตศาสตร์", "เทคโนโลยี",
 * "ภาษาไทย") ยังคงเก็บได้เพราะ flow Combobox ยอมรับค่านอก list.
 */

export type SubjectOption = {
    value: string; // ค่าที่ save ลง DB
    label: string; // ที่แสดงใน UI
};

export const SUBJECT_OPTIONS: SubjectOption[] = [
    { value: 'ภาษาไทย', label: 'ภาษาไทย' },
    { value: 'คณิตศาสตร์', label: 'คณิตศาสตร์' },
    { value: 'วิทยาศาสตร์และเทคโนโลยี', label: 'วิทยาศาสตร์และเทคโนโลยี' },
    { value: 'สังคมศึกษา ศาสนา และวัฒนธรรม', label: 'สังคมศึกษา ศาสนา และวัฒนธรรม' },
    { value: 'สุขศึกษาและพลศึกษา', label: 'สุขศึกษาและพลศึกษา' },
    { value: 'ศิลปะ', label: 'ศิลปะ' },
    { value: 'การงานอาชีพ', label: 'การงานอาชีพ' },
    { value: 'ภาษาต่างประเทศ (อังกฤษ)', label: 'ภาษาต่างประเทศ (อังกฤษ)' },
];

/**
 * Tag suggestions per-วิชา — รวมคำที่ใช้บ่อยในระดับประถม
 * Admin สามารถเพิ่ม custom tag ผ่าน TagPicker ได้ (เก็บใน DB array)
 */
export const SUBJECT_TAGS: Record<string, string[]> = {
    'ภาษาไทย': [
        'สะกดคำ', 'มาตราตัวสะกด', 'ไวพจน์', 'อ่านจับใจความ', 'แต่งประโยค',
        'คำควบกล้ำ', 'พยัญชนะ', 'สระ', 'วรรณยุกต์', 'คำคล้องจอง',
        'คำราชาศัพท์', 'อักษรนำ', 'อักษรกลาง สูง ต่ำ',
    ],
    'คณิตศาสตร์': [
        'บวก', 'ลบ', 'คูณ', 'หาร', 'จำนวน', 'นับ',
        'รูปทรง', 'เศษส่วน', 'ทศนิยม', 'มาตราชั่งตวงวัด',
        'เวลา', 'เงิน', 'สถิติ', 'พีชคณิตเบื้องต้น',
    ],
    'วิทยาศาสตร์และเทคโนโลยี': [
        'สิ่งมีชีวิต', 'พลังงาน', 'แรง', 'การเปลี่ยนแปลง',
        'ระบบสุริยะ', 'การทดลอง', 'โค้ดดิ้ง', 'พิมพ์ดีด',
        'คอมพิวเตอร์', 'เทคโนโลยี', 'ดิน หิน แร่', 'สสาร',
    ],
    'สังคมศึกษา ศาสนา และวัฒนธรรม': [
        'ประวัติศาสตร์', 'ภูมิศาสตร์', 'หน้าที่พลเมือง',
        'ศาสนา', 'เศรษฐศาสตร์', 'อาเซียน', 'วัฒนธรรมไทย',
    ],
    'สุขศึกษาและพลศึกษา': [
        'สุขภาพ', 'โภชนาการ', 'การออกกำลังกาย', 'กีฬา',
        'ปฐมพยาบาล', 'สุขลักษณะ',
    ],
    'ศิลปะ': [
        'ทัศนศิลป์', 'ดนตรี', 'นาฏศิลป์', 'การวาด', 'สีสัน', 'พื้นบ้าน',
    ],
    'การงานอาชีพ': [
        'งานบ้าน', 'งานเกษตร', 'งานช่าง', 'อาชีพ', 'การประดิษฐ์',
    ],
    'ภาษาต่างประเทศ (อังกฤษ)': [
        'vocabulary', 'grammar', 'reading', 'listening', 'writing',
        'phonics', 'A-Z', 'numbers', 'conversation',
    ],
};

/** Flat list of all default tags — fallback เมื่อยังไม่เลือก subject */
export const ALL_TAGS: string[] = Array.from(
    new Set(Object.values(SUBJECT_TAGS).flat()),
);

/** Helper: ตรวจว่า subject value อยู่ใน 8 กลุ่มสาระมาตรฐานไหม */
export const isStandardSubject = (value: string | null | undefined): boolean =>
    !!value && SUBJECT_OPTIONS.some((s) => s.value === value);
