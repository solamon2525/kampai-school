/**
 * conduct.service.ts
 * Supabase queries สำหรับ conduct_scores table
 * และโมเดลการประมวลผลระบบธนาคารความดี
 */
import { supabase } from '@/integrations/supabase/client';

export type ConductType = 'add' | 'deduct';

export type ConductRecord = {
  id: string;
  student_id: string;
  type: ConductType;
  score: number;
  category: string;
  reason: string;
  recorded_by: string | null;
  academic_year: string;
  semester: string;
  created_at: string;
  students?: { name: string; class: string; room?: string | null; photo_url?: string | null } | null;
};

export type ConductInsert = {
  student_id: string;
  type: ConductType;
  score: number;
  category: string;
  reason: string;
  recorded_by?: string | null;
  recorded_by_staff_id?: string | null;
  recorded_by_administrator_id?: string | null;
  academic_year: string;
  semester: string;
};

export type HeroBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

export type HeroProfile = {
  studentId: string;
  totalXp: number;
  level: number;
  heroTitle: string;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  virtues: {
    publicMind: number;
    responsibility: number;
    discipline: number;
    honesty: number;
    kindness: number;
  };
  badges: HeroBadge[];
  timeline: {
    id: string;
    date: string;
    title: string;
    category: string;
    xp: number;
    type: 'add' | 'deduct';
    message: string;
  }[];
};

export type ClassroomGoal = {
  id: string;
  class: string;
  room: string;
  target_xp: number;
  reward: string;
  is_active: boolean;
};

export type CoreVirtue = 'publicMind' | 'responsibility' | 'discipline' | 'honesty' | 'kindness';

export type ConductCategoryMeta = {
  key: string;
  label: string;
  virtue: CoreVirtue;
  color: string;
};

export const CONDUCT_CATEGORIES: Record<string, ConductCategoryMeta> = {
  publicMind: {
    key: 'publicMind',
    label: 'จิตสาธารณะ 🌱',
    virtue: 'publicMind',
    color: 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
  },
  responsibility: {
    key: 'responsibility',
    label: 'ความรับผิดชอบ 📘',
    virtue: 'responsibility',
    color: 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100',
  },
  discipline: {
    key: 'discipline',
    label: 'วินัย/ตรงต่อเวลา ⏰',
    virtue: 'discipline',
    color: 'border-purple-500 text-purple-700 bg-purple-50 hover:bg-purple-100',
  },
  honesty: {
    key: 'honesty',
    label: 'ซื่อสัตย์สุจริต 🤝',
    virtue: 'honesty',
    color: 'border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100',
  },
  kindness: {
    key: 'kindness',
    label: 'น้ำใจ/ช่วยเหลือ ❤️',
    virtue: 'kindness',
    color: 'border-pink-500 text-pink-700 bg-pink-50 hover:bg-pink-100',
  },
  manners: {
    key: 'manners',
    label: 'มารยาทและการพูดจา 🙏',
    virtue: 'kindness',
    color: 'border-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100',
  },
  leadership: {
    key: 'leadership',
    label: 'ความเป็นผู้นำ/ทีม 👑',
    virtue: 'responsibility',
    color: 'border-cyan-600 text-cyan-800 bg-cyan-50 hover:bg-cyan-100',
  },
  hygiene: {
    key: 'hygiene',
    label: 'สุขอนามัย/ความสะอาด 🧼',
    virtue: 'publicMind',
    color: 'border-teal-500 text-teal-700 bg-teal-50 hover:bg-teal-100',
  },
  property: {
    key: 'property',
    label: 'การดูแลทรัพย์สิน 🧱',
    virtue: 'responsibility',
    color: 'border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100',
  },
  device: {
    key: 'device',
    label: 'การใช้อุปกรณ์สื่อสาร 📱',
    virtue: 'discipline',
    color: 'border-violet-500 text-violet-700 bg-violet-50 hover:bg-violet-100',
  },
};

export interface TopHeroRpcRow {
  student_id: string;
  name: string;
  class: string;
  photo_url?: string | null;
  total_xp: number | string;
  deeds_count: number | string;
}

const CATEGORY_ALIAS_MAP: Record<string, string> = {
  publicmind: 'publicMind',
  responsibility: 'responsibility',
  discipline: 'discipline',
  honesty: 'honesty',
  kindness: 'kindness',
  manners: 'manners',
  leadership: 'leadership',
  hygiene: 'hygiene',
  property: 'property',
  device: 'device',

  'จิตสาธารณะ': 'publicMind',
  'จิตอาสา': 'publicMind',
  'ความรับผิดชอบ': 'responsibility',
  'วิชาการ': 'responsibility',
  'กีฬา': 'responsibility',
  'วินัย': 'discipline',
  'ระเบียบวินัย': 'discipline',
  'ตรงต่อเวลา': 'discipline',
  'วินัยและตรงต่อเวลา': 'discipline',
  'วินัย/ตรงต่อเวลา': 'discipline',
  'มาสาย': 'discipline',
  'ขาดเรียน': 'discipline',
  'หนีเรียน': 'discipline',
  'แต่งกาย': 'discipline',
  'การบ้าน': 'responsibility',
  'เวร': 'responsibility',
  'เวรประจำวัน': 'responsibility',
  'ซื่อสัตย์': 'honesty',
  'ซื่อสัตย์สุจริต': 'honesty',
  'ทุจริต': 'honesty',
  'โกหก': 'honesty',
  'ขโมย': 'honesty',
  'น้ำใจ': 'kindness',
  'ความดี': 'kindness',
  'ช่วยเหลือ': 'kindness',
  'น้ำใจ/ช่วยเหลือ': 'kindness',
  'ทะเลาะวิวาท': 'kindness',
  'มารยาท': 'manners',
  'มารยาทและการพูดจา': 'manners',
  'กิริยามารยาท': 'manners',
  'ความเป็นผู้นำ': 'leadership',
  'ความเป็นผู้นำและการทำงานเป็นทีม': 'leadership',
  'ความเป็นผู้นำ/ทีม': 'leadership',
  'สุขอนามัย': 'hygiene',
  'สุขอนามัยและความสะอาด': 'hygiene',
  'สุขอนามัย/ความสะอาด': 'hygiene',
  'ความสะอาด': 'hygiene',
  'ทรัพย์สิน': 'property',
  'การดูแลรักษาทรัพย์สิน': 'property',
  'การดูแลทรัพย์สิน': 'property',
  'การใช้อุปกรณ์สื่อสาร': 'device',
  'อุปกรณ์สื่อสาร': 'device',
  'โทรศัพท์': 'device',
};

const cleanCategoryString = (cat: string) =>
  (cat || '')
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

/** แผนที่แปลงหมวดหมู่ภาษาไทย/ดั้งเดิม/หมวดหมู่ใหม่ เข้ากับ 5 มิติคุณธรรมหลักภาษาอังกฤษ */
export const mapCategoryToVirtue = (cat: string): CoreVirtue => {
  const norm = (cat || '').trim();
  const clean = cleanCategoryString(norm);
  const lower = norm.toLowerCase();
  const cleanLower = clean.toLowerCase();

  const matchedKey =
    CATEGORY_ALIAS_MAP[norm] ||
    CATEGORY_ALIAS_MAP[clean] ||
    CATEGORY_ALIAS_MAP[lower] ||
    CATEGORY_ALIAS_MAP[cleanLower];

  if (matchedKey && CONDUCT_CATEGORIES[matchedKey]) {
    return CONDUCT_CATEGORIES[matchedKey].virtue;
  }

  // Fallbacks for partial matches
  if (
    clean.includes('จิตสาธารณะ') ||
    clean.includes('จิตอาสา') ||
    clean.includes('สุขอนามัย') ||
    clean.includes('ความสะอาด')
  ) {
    return 'publicMind';
  }
  if (
    clean.includes('ความรับผิดชอบ') ||
    clean.includes('วิชาการ') ||
    clean.includes('กีฬา') ||
    clean.includes('ผู้นำ') ||
    clean.includes('ทรัพย์สิน') ||
    clean.includes('การบ้าน') ||
    clean.includes('เวร')
  ) {
    return 'responsibility';
  }
  if (
    clean.includes('วินัย') ||
    clean.includes('ตรงต่อเวลา') ||
    clean.includes('อุปกรณ์สื่อสาร') ||
    clean.includes('โทรศัพท์') ||
    clean.includes('การเรียน') ||
    clean.includes('มาสาย') ||
    clean.includes('ขาดเรียน') ||
    clean.includes('หนีเรียน') ||
    clean.includes('แต่งกาย')
  ) {
    return 'discipline';
  }
  if (
    clean.includes('ซื่อสัตย์') ||
    clean.includes('ทุจริต') ||
    clean.includes('โกหก') ||
    clean.includes('ขโมย')
  ) {
    return 'honesty';
  }
  if (
    clean.includes('น้ำใจ') ||
    clean.includes('ช่วยเหลือ') ||
    clean.includes('มารยาท') ||
    clean.includes('ความดี') ||
    clean.includes('ทะเลาะ')
  ) {
    return 'kindness';
  }

  return 'kindness'; // default fallback
};

/** ดึงข้อมูล metadata หมวดหมู่พร้อม label และ badge styling */
export const getConductCategoryMeta = (cat: string): ConductCategoryMeta => {
  const norm = (cat || '').trim();
  const clean = cleanCategoryString(norm);
  const lower = norm.toLowerCase();
  const cleanLower = clean.toLowerCase();

  const matchedKey =
    CATEGORY_ALIAS_MAP[norm] ||
    CATEGORY_ALIAS_MAP[clean] ||
    CATEGORY_ALIAS_MAP[lower] ||
    CATEGORY_ALIAS_MAP[cleanLower] ||
    norm;

  if (CONDUCT_CATEGORIES[matchedKey]) {
    return CONDUCT_CATEGORIES[matchedKey];
  }
  const virtue = mapCategoryToVirtue(norm);
  const base = CONDUCT_CATEGORIES[virtue] || CONDUCT_CATEGORIES.kindness;
  return {
    ...base,
    label: norm || base.label,
  };
};

/** คำนวณเลเวล และยศฮีโร่ตามค่า XP สะสม */
export const calculateHeroLevel = (rawXp: number) => {
  const xp = Math.max(0, rawXp);
  if (xp < 100) {
    return { level: 1, title: 'เมล็ดพันธุ์แห่งความดี 🌱', xpInLevel: xp, xpNeededForNextLevel: 100, progressPercent: xp };
  } else if (xp < 200) {
    const xpInLevel = xp - 100;
    return { level: 2, title: 'ผู้ช่วยตัวน้อย 🤝', xpInLevel, xpNeededForNextLevel: 100, progressPercent: xpInLevel };
  } else if (xp < 400) {
    const xpInLevel = xp - 200;
    return { level: 3, title: 'ฮีโร่ประจำห้อง ⭐', xpInLevel, xpNeededForNextLevel: 200, progressPercent: Math.round((xpInLevel / 200) * 100) };
  } else if (xp < 700) {
    const xpInLevel = xp - 400;
    return { level: 4, title: 'ผู้พิทักษ์โรงเรียน 🛡️', xpInLevel, xpNeededForNextLevel: 300, progressPercent: Math.round((xpInLevel / 300) * 100) };
  } else {
    const xpInLevel = xp - 700;
    return { level: 5, title: 'ต้นแบบแห่งความดี 👑', xpInLevel, xpNeededForNextLevel: 0, progressPercent: 100 };
  }
};

/** ข้อความสนับสนุนทางจิตวิทยาเชิงบวกตามมิติคุณธรรม */
export const getEmotionalFeedback = (category: string, reason: string): string => {
  const norm = (category || '').trim();
  const clean = cleanCategoryString(norm);
  const lower = norm.toLowerCase();
  const cleanLower = clean.toLowerCase();

  const matchedKey =
    CATEGORY_ALIAS_MAP[norm] ||
    CATEGORY_ALIAS_MAP[clean] ||
    CATEGORY_ALIAS_MAP[lower] ||
    CATEGORY_ALIAS_MAP[cleanLower] ||
    cleanLower;

  if (matchedKey === 'manners') {
    return 'การมีกิริยามารยาทและการพูดจาสุภาพไพเราะ เป็นเสน่ห์ที่น่าชื่นชมอย่างยิ่ง 🙏';
  }
  if (matchedKey === 'leadership') {
    return 'ความเป็นผู้นำและการร่วมมือกับผู้อื่นเป็นพลังสำคัญในการสร้างสรรค์สิ่งดีๆ 👑';
  }
  if (matchedKey === 'hygiene') {
    return 'การดูแลสุขอนามัยและความสะอาดทำให้ตนเองและส่วนรวมมีสุขภาวะที่ดี 🧼';
  }
  if (matchedKey === 'property') {
    return 'การช่วยดูแลรักษาทรัพย์สินส่วนรวมแสดงถึงความรับผิดชอบที่ยอดเยี่ยม 🧱';
  }
  if (matchedKey === 'device') {
    return 'การมีวินัยในการใช้อุปกรณ์สื่อสารช่วยให้การเรียนรู้มีประสิทธิภาพยิ่งขึ้น 📱';
  }

  const virtue = mapCategoryToVirtue(category);
  switch (virtue) {
    case 'publicMind':
      return 'หนูช่วยให้โรงเรียนน่าอยู่และน่าเรียนรู้ยิ่งขึ้น 🌱';
    case 'responsibility':
      return 'ความรับผิดชอบและการทำหน้าที่ของหนูเป็นเรื่องที่น่ายกย่อง 📘';
    case 'discipline':
      if (reason.includes('ตรงเวลา')) {
        return 'การตรงต่อเวลาของหนูแสดงถึงความเป็นผู้ใหญ่อย่างยอดเยี่ยม ⏰';
      }
      return 'ความมีระเบียบวินัยเป็นรากฐานที่สำคัญของผู้นำที่ดี ⏰';
    case 'honesty':
      return 'ความซื่อสัตย์ของหนูเป็นแบบอย่างที่งดงามและน่าชื่นชม 🤝';
    case 'kindness':
      return 'การมีน้ำใจช่วยเหลือผู้อื่นทำให้สิ่งแวดล้อมรอบตัวเต็มไปด้วยรอยยิ้ม ❤️';
    default:
      return 'หนูยอดเยี่ยมมาก และมีพัฒนาการที่ดีขึ้นในทุกๆ วัน ✨';
  }
};

export const conductService = {
  mapCategoryToVirtue,
  getConductCategoryMeta,
  CONDUCT_CATEGORIES,
  /** ดึงประวัติคะแนนความดีทั้งหมด (พร้อม join ชื่อ+รูปนักเรียน) */
  getAll: (semester?: string, academicYear?: string) => {
    let q = supabase
      .from('conduct_scores')
      .select('*, students(name, class, photo_url)')
      .order('created_at', { ascending: false });
    if (semester) q = q.eq('semester', semester);
    if (academicYear) q = q.eq('academic_year', academicYear);
    return q;
  },

  /** ดึงคะแนนของนักเรียนคนเดียว */
  getByStudentId: (studentId: string) =>
    supabase
      .from('conduct_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),

  /** คำนวณคะแนนสะสมความดีของนักเรียนคนเดียวตามปีการศึกษา (Optimistic / Pre-fetch) */
  getAccumulatedScore: async (studentId: string, academicYear: string): Promise<number> => {
    const { data, error } = await supabase
      .from('conduct_scores')
      .select('score, type, academic_year')
      .eq('student_id', studentId);
    if (error || !data) return 0;
    const total = data
      .filter(r => r.academic_year === academicYear)
      .reduce((sum, r) => sum + (r.type === 'add' ? r.score : -r.score), 0);
    return Math.max(0, total);
  },

  /** คำนวณคะแนนสะสมความดีของกลุ่มนักเรียนตามปีการศึกษาล่วงหน้า (Pre-fetch สำหรับชั้นเรียน) */
  getAccumulatedScoresForStudents: async (studentIds: string[], academicYear: string): Promise<Record<string, number>> => {
    if (studentIds.length === 0) return {};
    const { data, error } = await supabase
      .from('conduct_scores')
      .select('student_id, score, type, academic_year')
      .in('student_id', studentIds);
    const scoreMap: Record<string, number> = {};
    studentIds.forEach(id => { scoreMap[id] = 0; });
    if (!error && data) {
      data.forEach(r => {
        if (r.academic_year === academicYear) {
          scoreMap[r.student_id] = (scoreMap[r.student_id] || 0) + (r.type === 'add' ? r.score : -r.score);
        }
      });
      studentIds.forEach(id => {
        scoreMap[id] = Math.max(0, scoreMap[id] || 0);
      });
    }
    return scoreMap;
  },

  /** ดึงเฉพาะคะแนน "บวก" สำหรับหน้าสาธารณะ (hall of fame) — รวม photo_url */
  getPublicPositive: (semester?: string, academicYear?: string) => {
    let q = supabase
      .from('conduct_scores')
      .select('*, students(name, class, photo_url)')
      .eq('type', 'add')
      .order('created_at', { ascending: false });
    if (semester) q = q.eq('semester', semester);
    if (academicYear) q = q.eq('academic_year', academicYear);
    return q;
  },

  /** บันทึกคะแนนความดี */
  insert: (record: ConductInsert) =>
    supabase.from('conduct_scores').insert(record as never),

  /** บันทึกคะแนนความดีหลายคนพร้อมกัน (batch insert with chunking and transient retry for network resiliency) */
  insertBulk: async (records: ConductInsert[]) => {
    if (records.length === 0) return { data: null, error: null };
    const CHUNK_SIZE = 50;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      let res = await supabase.from('conduct_scores').insert(chunk as never[]);
      if (res.error) {
        // Retry once after brief pause on transient school Wi-Fi glitch
        await new Promise(r => setTimeout(r, 600));
        res = await supabase.from('conduct_scores').insert(chunk as never[]);
        if (res.error) return res;
      }
    }
    return { data: null, error: null };
  },

  /** ลบประวัติคะแนน */
  delete: (id: string) =>
    supabase.from('conduct_scores').delete().eq('id', id),

  /** ดึงข้อมูล 10 อันดับสุดยอดฮีโร่ความดีผ่าน RPC (High Performance) */
  getTop10Heroes: async (limitVal: number = 10) => {
    return supabase.rpc('get_top_heroes', { limit_val: limitVal }) as unknown as Promise<{
      data: TopHeroRpcRow[] | null;
      error: { message: string } | null;
    }>;
  },

  /** ดึงคะแนนสะสมห้องเรียนด้วย RPC (High Performance) */
  getClassroomXpSumOptimized: async (className: string, roomName: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_classroom_xp_sum', {
      class_name: className,
      room_name: roomName
    });
    if (error) {
      console.error('Error fetching classroom XP sum via RPC:', error);
      return 0;
    }
    return Number(data || 0);
  },

  // =========================================================
  // ฟีเจอร์เพิ่มเติมสำหรับธนาคารความดี (Backend Ledger Calculation)
  // =========================================================

  /** คำนวณประมวลผลโปรไฟล์ฮีโร่ของนักเรียน */
  getHeroProfile: async (studentId: string): Promise<HeroProfile> => {
    // 1. คิวรีข้อมูลความดี, สรุปแต้มขยะ, สรุปการออมเงิน และประวัติเข้าเรียน ร่วมกันแบบรวดเร็ว
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const startISO = oneYearAgo.toISOString().slice(0, 10);
    const endISO = today.toISOString().slice(0, 10);

    const [
      conductRes,
      wasteRes,
      savingsRes,
      attendanceRes
    ] = await Promise.all([
      supabase
        .from('conduct_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('waste_student_summary')
        .select('total_points_earned')
        .eq('student_id', studentId)
        .maybeSingle(),
      supabase
        .rpc('get_savings_deposit_count' as never, { p_student_id: studentId } as never),
      supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId)
        .gte('attendance_date', startISO)
        .lte('attendance_date', endISO)
    ]);

    if (conductRes.error) throw conductRes.error;
    const list = (conductRes.data || []) as ConductRecord[];

    // 2. คำนวณคะแนนความดีพื้นฐานและจำนวนครั้งพฤติกรรม
    let totalXp = 0;
    const virtues = { publicMind: 0, responsibility: 0, discipline: 0, honesty: 0, kindness: 0 };

    // เก็บประวัติจำนวนครั้งเพื่อวิเคราะห์ Badge
    const counts = { publicMind: 0, responsibility: 0, discipline: 0, honesty: 0, kindness: 0, punctuality: 0 };

    // เพื่อการคำนวณที่ถูกต้องตามลำดับเวลา (Chronological) เราจะกลับรายการข้อมูลจากเก่าไปใหม่ก่อนประมวลผล
    const chronologicalList = [...list].reverse();

    chronologicalList.forEach(r => {
      const v = mapCategoryToVirtue(r.category);
      if (r.type === 'add') {
        totalXp += r.score;
        virtues[v] += r.score;
        counts[v] += 1;
        if (v === 'discipline' && (r.reason.includes('ตรงเวลา') || r.reason.includes('เข้าแถว'))) {
          counts.punctuality += 1;
        }
      } else {
        totalXp = Math.max(0, totalXp - r.score);
        // การหักคะแนนส่งผลลดมิติเรดาร์ย่อย
        virtues[v] = Math.max(0, virtues[v] - r.score);
      }
    });

    // 3. คำนวณคะแนนโบนัสภายนอก (ตามสูตรที่สมดุลและปลอดภัย)
    
    // 🌱 จิตสาธารณะ (publicMind) ⬅️ ธนาคารขยะ (Waste Bank)
    const wastePoints = wasteRes.data?.total_points_earned || 0;
    const wasteBonus = Math.min(50, Math.floor(wastePoints / 10));

    // ⏰ วินัย (discipline) ⬅️ ธนาคารพอเพียง (Savings Bank)
    const depositCount = Number(savingsRes.data || 0);
    const savingsBonus = Math.min(40, depositCount * 2);

    // 📘 ความรับผิดชอบ (responsibility) ⬅️ เวลามาเรียน (Attendance - ย้อนหลัง 12 เดือนล่าสุด)
    const attendanceRecords = attendanceRes.data || [];
    let attendanceBonus = 50; // ค่าเริ่มต้นเต็ม 50 ในช่วงไม่มีข้อมูลหรือข้อมูลน้อย (< 5 วัน) ป้องกันความเหวี่ยงต้นเทอม
    if (attendanceRecords.length >= 5) {
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const attendanceRate = presentCount / attendanceRecords.length;
      attendanceBonus = Math.round(attendanceRate * 50);
    }

    // 4. บวกรวมโบนัสเข้าสู่คุณลักษณะหลัก และ XP สะสม
    virtues.publicMind += wasteBonus;
    virtues.discipline += savingsBonus;
    virtues.responsibility += attendanceBonus;

    totalXp += wasteBonus + savingsBonus + attendanceBonus;

    // 5. คำนวณเลเวลหลังจากเพิ่มโบนัสเรียบร้อย
    const levelInfo = calculateHeroLevel(totalXp);

    // 6. คำนวณสถานะ Badge
    const badges: HeroBadge[] = [
      {
        id: 'clean_hero',
        name: 'ผู้รักษาความสะอาด 🌱',
        icon: '🌱',
        description: 'มีจิตสาธารณะช่วยงานส่วนรวมและรักษาสิ่งแวดล้อม 5 ครั้ง',
        progress: Math.min(5, counts.publicMind),
        target: 5,
        unlocked: counts.publicMind >= 5
      },
      {
        id: 'kind_friend',
        name: 'เพื่อนที่แสนดี ❤️',
        icon: '❤️',
        description: 'มีน้ำใจและช่วยเหลือเพื่อนฝูงบ่อยครั้ง 5 ครั้ง',
        progress: Math.min(5, counts.kindness),
        target: 5,
        unlocked: counts.kindness >= 5
      },
      {
        id: 'responsible_hero',
        name: 'นักรับผิดชอบ 📘',
        icon: '📘',
        description: 'มีความรับผิดชอบส่งงานหรือทำภาระหน้าที่ 3 ครั้ง',
        progress: Math.min(3, counts.responsibility),
        target: 3,
        unlocked: counts.responsibility >= 3
      },
      {
        id: 'on_time_hero',
        name: 'ตรงต่อเวลา ⏰',
        icon: '⏰',
        description: 'รักษาเวลา เข้าแถว หรือมาเรียนตรงเวลา 3 ครั้ง',
        progress: Math.min(3, counts.punctuality),
        target: 3,
        unlocked: counts.punctuality >= 3
      },
      {
        id: 'honest_hero',
        name: 'น้ำใจงาม & ซื่อสัตย์ 🤝',
        icon: '🤝',
        description: 'ซื่อสัตย์สุจริต เก็บของได้ส่งคืน หรือพูดความจริง 2 ครั้ง',
        progress: Math.min(2, counts.honesty),
        target: 2,
        unlocked: counts.honesty >= 2
      }
    ];

    // 7. สร้าง Timeline แบบสร้างแรงบันดาลใจ
    const timeline = list.map(r => ({
      id: r.id,
      date: r.created_at,
      title: r.reason,
      category: r.category,
      xp: r.score,
      type: r.type,
      message: r.type === 'add' ? getEmotionalFeedback(r.category, r.reason) : 'ทบทวนตนเองเพื่อเติบโตเป็นฮีโร่ที่ดีขึ้น 🛡️'
    }));

    return {
      studentId,
      totalXp,
      level: levelInfo.level,
      heroTitle: levelInfo.title,
      xpInLevel: levelInfo.xpInLevel,
      xpNeededForNextLevel: levelInfo.xpNeededForNextLevel,
      progressPercent: levelInfo.progressPercent,
      virtues,
      badges,
      timeline
    };
  },

  /** ดึงเป้าหมายกลุ่มของห้องเรียน */
  getClassroomGoal: async (className: string, roomName: string): Promise<ClassroomGoal | null> => {
    const { data, error } = await supabase
      .from('classroom_goals')
      .select('*')
      .eq('class', className)
      .eq('room', roomName)
      .maybeSingle();

    if (error) return null;
    return data as ClassroomGoal;
  },

  /** อัปเดตหรือสร้างเป้าหมายของห้องเรียน */
  upsertClassroomGoal: async (className: string, roomName: string, targetXp: number, reward: string) => {
    return supabase
      .from('classroom_goals')
      .upsert({
        class: className,
        room: roomName,
        target_xp: targetXp,
        reward,
        updated_at: new Date().toISOString()
      }, { onConflict: 'class,room' });
  },

  /** รวมคะแนน XP ทั้งหมดของห้องเรียนในปัจจุบัน */
  getClassroomXpSum: async (className: string, roomName: string, semester?: string, academicYear?: string): Promise<number> => {
    // 1. ดึง ID นักเรียนทั้งหมดในห้องเรียนนี้
    let studentQuery = supabase
      .from('students')
      .select('id')
      .eq('class', className)
      .eq('is_active', true);
    
    if (roomName) {
      studentQuery = studentQuery.eq('room', roomName);
    }
    
    const { data: studentIds, error: studentError } = await studentQuery;
    if (studentError || !studentIds || studentIds.length === 0) return 0;
    
    const ids = studentIds.map(s => s.id);

    // 2. ดึงประวัติและคำนวณ XP สุทธิของแต่ละคนตามลำดับเวลา แล้วนำมารวมกัน (ป้องกันการหักลบข้ามคน และคำนวณ clamping ที่ถูกต้อง)
    let conductQuery = supabase
      .from('conduct_scores')
      .select('student_id, score, type')
      .in('student_id', ids)
      .order('created_at', { ascending: true });

    let activeSem = semester;
    let activeYear = academicYear;
    
    if (!activeSem || !activeYear) {
      const { data: settingsData } = await supabase
        .from('school_settings')
        .select('key, value')
        .in('key', ['active_academic_year', 'active_semester']);
      
      if (settingsData) {
        const settingsMap = Object.fromEntries(settingsData.map(r => [r.key, r.value]));
        if (!activeSem) activeSem = settingsMap.active_semester;
        if (!activeYear) activeYear = settingsMap.active_academic_year;
      }
      
      if (!activeSem) activeSem = '1';
      if (!activeYear) activeYear = (new Date().getFullYear() + 543).toString();
    }

    conductQuery = conductQuery.eq('semester', activeSem);
    conductQuery = conductQuery.eq('academic_year', activeYear);

    const { data: scores, error: conductError } = await conductQuery;
    if (conductError || !scores) return 0;

    const studentXpMap: Record<string, number> = {};
    ids.forEach(id => {
      studentXpMap[id] = 0;
    });

    scores.forEach(s => {
      const current = studentXpMap[s.student_id] || 0;
      if (s.type === 'add') {
        studentXpMap[s.student_id] = current + s.score;
      } else {
        studentXpMap[s.student_id] = Math.max(0, current - s.score);
      }
    });

    return Object.values(studentXpMap).reduce((acc, val) => acc + val, 0);
  }
};
