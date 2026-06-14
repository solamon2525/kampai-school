/**
 * curriculumSubjects.ts — แหล่งเดียวของ 8 กลุ่มสาระ (subject_key ↔ label) + helper แปลง
 * ใช้ร่วมใน GameIndicatorsDialog / IndicatorMasteryTab / LessonPlanIndicatorsDialog / Coverage
 * subject_key ตรงกับ curriculum_indicators.subject_key (mig 158/170)
 */

export type CurriculumSubject = { key: string; label: string };

/** 8 กลุ่มสาระการเรียนรู้ (หลักสูตรแกนกลาง 2551) — มีตัวชี้วัด ป.1-6 ครบในระบบ */
export const CURRICULUM_SUBJECTS: CurriculumSubject[] = [
    { key: 'thai', label: 'ภาษาไทย' },
    { key: 'math', label: 'คณิตศาสตร์' },
    { key: 'science', label: 'วิทยาศาสตร์และเทคโนโลยี' },
    { key: 'social', label: 'สังคมศึกษา ศาสนา และวัฒนธรรม' },
    { key: 'health', label: 'สุขศึกษาและพลศึกษา' },
    { key: 'arts', label: 'ศิลปะ' },
    { key: 'career', label: 'การงานอาชีพ' },
    { key: 'english', label: 'ภาษาอังกฤษ' },
];

export const GRADE_OPTIONS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

/** educational_hub_items.subject (folder) → curriculum subject_key */
const FOLDER_TO_KEY: Record<string, string> = {
    thai: 'thai',
    math: 'math',
    science: 'science',
    tech: 'science',
    social: 'social',
    health: 'health',
    arts: 'arts',
    art: 'arts',
    career: 'career',
    english: 'english',
};

export const subjectKeyFromFolder = (folder?: string | null): string =>
    FOLDER_TO_KEY[(folder ?? '').toLowerCase()] ?? 'thai';

/** label ไทย (เต็มหรือบางส่วน) → subject_key (เผื่อ lesson plan เก็บเป็นชื่อวิชา) */
export const subjectKeyFromLabel = (label?: string | null): string => {
    const l = (label ?? '').trim();
    if (!l) return 'thai';
    const exact = CURRICULUM_SUBJECTS.find((s) => s.label === l);
    if (exact) return exact.key;
    const partial = CURRICULUM_SUBJECTS.find((s) => l.includes(s.label) || s.label.includes(l));
    return partial?.key ?? 'thai';
};

export const subjectLabel = (key: string): string =>
    CURRICULUM_SUBJECTS.find((s) => s.key === key)?.label ?? key;
