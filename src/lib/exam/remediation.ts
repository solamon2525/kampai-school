/**
 * remediation.ts
 * Smart Remediation Knowledge Base and Matcher for Kampai School Exam System
 * 
 * Maps student weaknesses (weak topics / missed learning objectives) to 
 * authentic interactive games, media, and worksheets in Kampai School.
 */

import type { TopicDiagnostic } from './diagnostic';

export type RemediationResourceType = 'game' | 'media' | 'worksheet';

export interface RemediationResource {
  id: string;
  title: string;
  subject: string;
  type: RemediationResourceType;
  url: string;
  description: string;
  thumbnailUrl?: string;
  badgeText: string;
  keywords: string[];
  suggestedActionText: string;
}

export interface RemediationQuest {
  topic: string;
  studentScorePct: number;
  questTitle: string;
  learningGoal: string;
  resource: RemediationResource;
  teacherTip: string;
}

/**
 * Kampai School's authentic educational media and game knowledge repository
 */
export const KAMPAI_LEARNING_CATALOG: RemediationResource[] = [
  // ── คณิตศาสตร์ (Math) ──
  {
    id: 'math-fraction-media',
    title: 'เศษส่วนรูปธรรม (Fraction Pieces & Visual Model)',
    subject: 'คณิตศาสตร์',
    type: 'media',
    url: '/games/math/fraction-pieces-media.html',
    description: 'เรียนรู้เศษส่วนแท้ เศษเกิน และการบวกลบเศษส่วนด้วยแบบจำลองวงกลมและแถบเศษส่วนแบบรูปธรรม',
    badgeText: 'สื่อปฏิสัมพันธ์ (Interactive)',
    keywords: ['เศษส่วน', 'fraction', 'บวกเศษส่วน', 'เศษเกิน', 'จำนวนคละ'],
    suggestedActionText: 'เปิดสื่อทดลองเศษส่วน',
  },
  {
    id: 'math-fraction-ws',
    title: 'ใบงานฝึกคิด: เศษส่วนและการเปรียบเทียบ',
    subject: 'คณิตศาสตร์',
    type: 'worksheet',
    url: '/games/math/fraction-pieces-worksheet.html',
    description: 'ชุดใบงานระบายสีเศษส่วนและเปรียบเทียบค่าเศษส่วน เหมาะสำหรับฝึกทบทวนหลังเรียน',
    badgeText: 'ใบงานฝึกทักษะ (Printable)',
    keywords: ['เศษส่วน', 'fraction', 'เปรียบเทียบเศษส่วน'],
    suggestedActionText: 'พิมพ์ใบงานทบทวน',
  },
  {
    id: 'math-equation-balance',
    title: 'สมการอย่างง่าย & ตาชั่งสมดุล (Balance Scale & Model)',
    subject: 'คณิตศาสตร์',
    type: 'media',
    url: '/games/math/simple-equation-media.html',
    description: 'ฝึกการแก้สมการตัวแปรเดียวด้วยตาชั่งฟิสิกส์จำลองและบาร์โมเดล Singapore Math',
    badgeText: 'สื่อปฏิสัมพันธ์ (Interactive)',
    keywords: ['สมการ', 'equation', 'ตัวไม่ทราบค่า', 'ตาชั่ง', 'หาค่าตัวแปร'],
    suggestedActionText: 'ทดลองแก้สมการบนตาชั่ง',
  },
  {
    id: 'math-multiplication-game',
    title: 'คณิตคิดเร็ว 24 & ตารางสูตรคูณ (Math 24 & Multiplication)',
    subject: 'คณิตศาสตร์',
    type: 'game',
    url: '/games/math/math24-worksheet.html',
    description: 'ฝึกความแม่นยำในการคูณและหารจำนวนนับ พร้อมแก้โจทย์ปัญหาตัวเลขระคน',
    badgeText: 'เกมและโจทย์ท้าทาย',
    keywords: ['คูณ', 'หาร', 'สูตรคูณ', 'คำนวณ', 'การคูณ', 'การหาร', 'ระคน'],
    suggestedActionText: 'เข้าเล่นเกมคำนวณเร็ว',
  },
  {
    id: 'math-geometry-shapes',
    title: 'เรขาคณิต 2 มิติ & 3 มิติ (Geometry 2D & 3D Explorer)',
    subject: 'คณิตศาสตร์',
    type: 'media',
    url: '/games/math/geometry-2d3d-media.html',
    description: 'สำรวจคุณสมบัติมุม ด้าน เส้นขนาน และรูปทรงเรขาคณิตหลากหลายมิติ',
    badgeText: 'สื่อจำลอง 3 มิติ',
    keywords: ['เรขาคณิต', 'มุม', 'สี่เหลี่ยม', 'สามเหลี่ยม', 'เส้นขนาน', 'พื้นที่', 'ความยาวรอบรูป'],
    suggestedActionText: 'สำรวจรูปทรงเรขาคณิต',
  },
  {
    id: 'math-decimal-media',
    title: 'ทศนิยมแสนสนุก (Decimal Visualizer)',
    subject: 'คณิตศาสตร์',
    type: 'media',
    url: '/games/math/decimal-media.html',
    description: 'ทำความเข้าใจความสัมพันธ์ของทศนิยม 1 ตำแหน่งและ 2 ตำแหน่งผ่านตารางสิบและตารางร้อย',
    badgeText: 'สื่อปฏิสัมพันธ์',
    keywords: ['ทศนิยม', 'decimal', 'เปรียบเทียบทศนิยม', 'ค่าประจำหลัก'],
    suggestedActionText: 'เปิดสื่อแสดงค่าทศนิยม',
  },

  // ── วิทยาศาสตร์และเทคโนโลยี (Science & Tech) ──
  {
    id: 'sci-electric-circuits',
    title: 'ห้องทดลองวงจรไฟฟ้าอัจฉริยะ (Circuit Builder & Lab)',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    type: 'media',
    url: '/games/science/circuit-media.html',
    description: 'ต่อวงจรไฟฟ้าจำลอง วงจรเปิด วงจรปิด ตัวนำ และฉนวนไฟฟ้าอย่างปลอดภัยในห้องแล็บเสมือนจริง',
    badgeText: 'ห้องทดลองเสมือน (Virtual Lab)',
    keywords: ['ไฟฟ้า', 'วงจรไฟฟ้า', 'ตัวนำไฟฟ้า', 'ฉนวน', 'สวิตช์', 'เซลล์ไฟฟ้า'],
    suggestedActionText: 'เข้าห้องทดลองต่อวงจรไฟฟ้า',
  },
  {
    id: 'sci-solar-system',
    title: 'ท่องอวกาศระบบสุริยะ (Solar System Exploration)',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    type: 'media',
    url: '/games/science/solar-system-media.html',
    description: 'ศึกษาดาวเคราะห์และดวงอาทิตย์ในระบบสุริยะ การโคจร และคาบการหมุนรอบตัวเอง',
    badgeText: 'สื่อดาราศาสตร์ 3 มิติ',
    keywords: ['ระบบสุริยะ', 'ดาวเคราะห์', 'ดวงอาทิตย์', 'โลก', 'อวกาศ', 'ดวงจันทร์'],
    suggestedActionText: 'ท่องแบบจำลองระบบสุริยะ',
  },
  {
    id: 'sci-force-motion',
    title: 'แรงและการเคลื่อนที่ (Forces & Motion Simulation)',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    type: 'media',
    url: '/games/science/force-motion-media.html',
    description: 'จำลองแรงเสียดทาน แรงโน้มถ่วง และการเคลื่อนที่ของวัตถุบนพื้นผิวแบบต่าง ๆ',
    badgeText: 'สื่อฟิสิกส์จำลอง',
    keywords: ['แรง', 'การเคลื่อนที่', 'แรงเสียดทาน', 'แรงดึงดูด', 'ความเร็ว', 'น้ำหนัก'],
    suggestedActionText: 'ทดสอบแรงเสียดทาน',
  },
  {
    id: 'sci-plants-cells',
    title: 'กายวิภาคพืชและหน้าที่ของส่วนต่าง ๆ (Plant Parts & Functions)',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    type: 'media',
    url: '/games/science/plant-parts-media.html',
    description: 'ส่องราก ลำต้น ใบ ดอก และกระบวนการสังเคราะห์ด้วยแสงของพืช',
    badgeText: 'สื่อชีววิทยาปฏิสัมพันธ์',
    keywords: ['พืช', 'สังเคราะห์ด้วยแสง', 'ราก', 'ลำต้น', 'ใบ', 'ดอก', 'การสืบพันธุ์'],
    suggestedActionText: 'สำรวจกายวิภาคพืช',
  },

  // ── ภาษาไทย (Thai) ──
  {
    id: 'thai-idiom-hub',
    title: 'คลังสำนวนไทยอัจฉริยะ ป.4–6 (Smart Idiom Hub)',
    subject: 'ภาษาไทย',
    type: 'media',
    url: '/games/thai/thai-idiom-hub.html',
    description: 'เรียนรู้ 24 สำนวน สุภาษิต คำพังเพย ผ่านภาพประกอบจิบิและแบบทดสอบจำลองสถานการณ์จริง',
    badgeText: 'สื่อการสอน 5 โหมด',
    keywords: ['สำนวน', 'สุภาษิต', 'คำพังเพย', 'ความหมายตรง', 'ความหมายแฝง'],
    suggestedActionText: 'เปิดคลังสำนวนไทย',
  },
  {
    id: 'thai-word-types-noun',
    title: 'นินจาตัดคำนาม & ชนิดของคำ (Word Ninja Noun)',
    subject: 'ภาษาไทย',
    type: 'game',
    url: '/games/thai/word-ninja-noun/index.html',
    description: 'เกมฝึกทักษะจำแนกคำนาม สรรพนาม กริยา และคำวิเศษณ์อย่างสนุกสนานด้วยจังหวะแอ็กชัน',
    badgeText: 'เกมการศึกษา (Game)',
    keywords: ['คำนาม', 'คำสรรพนาม', 'คำกริยา', 'ชนิดของคำ', 'ไวยากรณ์', 'คำวิเศษณ์'],
    suggestedActionText: 'เล่นเกมนินจาตัดคำ',
  },
  {
    id: 'thai-reading-comprehension',
    title: 'การอ่านจับใจความและสรุปความ ป.4 (Reading Comprehension)',
    subject: 'ภาษาไทย',
    type: 'media',
    url: '/games/thai/thai-reading-p4-media.html',
    description: 'ฝึกเทคนิคการอ่าน ใคร ทำอะไร ที่ไหน เมื่อไหร่ อย่างไร และการวิเคราะห์ข้อเท็จจริง/ข้อคิดเห็น',
    badgeText: 'สื่อการอ่านปฏิสัมพันธ์',
    keywords: ['อ่านจับใจความ', 'ใจความสำคัญ', 'ข้อคิดเห็น', 'ข้อเท็จจริง', 'นิทาน', 'บทความ'],
    suggestedActionText: 'ฝึกอ่านจับใจความ',
  },
  {
    id: 'thai-punctuation-marks',
    title: 'เครื่องหมายวรรคตอนและการเขียน (Thai Punctuation Studio)',
    subject: 'ภาษาไทย',
    type: 'media',
    url: '/games/thai/thai-punctuation-media.html',
    description: 'ทบทวนการใช้ไม้ยมก อัศเจรีย์ ปรัศนี นขลิขิต และเครื่องหมายวรรคตอนในภาษาไทย',
    badgeText: 'สื่อฝึกวรรคตอน',
    keywords: ['เครื่องหมายวรรคตอน', 'ไม้ยมก', 'อัศเจรีย์', 'ปรัศนี', 'นขลิขิต', 'อัญประกาศ'],
    suggestedActionText: 'ฝึกใช้เครื่องหมายวรรคตอน',
  },

  // ── ภาษาอังกฤษ (English) ──
  {
    id: 'eng-phonics-studio',
    title: 'ออกเสียงเป๊ะ Phonics & Vowels Studio',
    subject: 'ภาษาอังกฤษ',
    type: 'media',
    url: '/games/english/phonics-media.html',
    description: 'ฝึกออกเสียงสระและพยัญชนะภาษาอังกฤษ ระบบสัทศาสตร์ และการสะกดคำแบบ Phonics',
    badgeText: 'สื่อระบบเสียง (Audio-Interactive)',
    keywords: ['phonics', 'การออกเสียง', 'vowels', 'พยัญชนะ', 'สระ', 'สะกดคำ'],
    suggestedActionText: 'ฝึกออกเสียงโฟนิกส์',
  },
  {
    id: 'eng-everyday-convo',
    title: 'บทสนทนาประจำวันภาษาอังกฤษ ป.4 (Everyday Conversation)',
    subject: 'ภาษาอังกฤษ',
    type: 'media',
    url: '/games/english/everyday-conversation-p4-media.html',
    description: 'สถานการณ์จำลองการทักทาย ถามทิศทาง การสั่งอาหาร และบทสนทนาในห้องเรียน',
    badgeText: 'สื่อบทสนทนาจำลอง',
    keywords: ['บทสนทนา', 'conversation', 'greeting', 'asking', 'classroom', 'คำทักทาย'],
    suggestedActionText: 'ฝึกสนทนาภาษาอังกฤษ',
  },
  {
    id: 'eng-grammar-tenses',
    title: 'คลังไวยากรณ์ & Tenses ภาษาอังกฤษ (Grammar Hub)',
    subject: 'ภาษาอังกฤษ',
    type: 'media',
    url: '/games/english/grammar-mini-media.html',
    description: 'สรุป Present Simple, Past Simple และโครงสร้างประโยคไวยากรณ์พื้นฐานแบบเข้าใจง่าย',
    badgeText: 'สื่อไวยากรณ์',
    keywords: ['grammar', 'tense', 'present simple', 'past simple', 'verb', 'ไวยากรณ์'],
    suggestedActionText: 'ทบทวนไวยากรณ์และ Tenses',
  },

  // ── สังคมศึกษาและประวัติศาสตร์ (Social & History) ──
  {
    id: 'social-thai-history',
    title: 'ประวัติศาสตร์ชาติไทยและแหล่งอารยธรรม (Thai History & Heritage)',
    subject: 'ประวัติศาสตร์',
    type: 'media',
    url: '/games/social/thai-history-media.html',
    description: 'ศึกษาพัฒนาการของอาณาจักรสุโขทัย อยุธยา ธนบุรี และบุคคลสำคัญของชาติไทย',
    badgeText: 'สื่อไทม์ไลน์ประวัติศาสตร์',
    keywords: ['ประวัติศาสตร์', 'สุโขทัย', 'อยุธยา', 'บุคคลสำคัญ', 'โบราณสถาน', 'ประเพณี'],
    suggestedActionText: 'เปิดดูไทม์ไลน์ประวัติศาสตร์',
  },
  {
    id: 'social-buddhism-virtue',
    title: 'หลักธรรมทางศาสนาและการทำความดี (Moral & Buddhist Values)',
    subject: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    type: 'media',
    url: '/games/social/buddhist-principles-media.html',
    description: 'เรียนรู้พุทธประวัติ เบญจศีล เบญจธรรม และการปฏิบัติตนตามหลักศาสนาในชีวิตประจำวัน',
    badgeText: 'สื่อจริยธรรม',
    keywords: ['ศาสนา', 'พุทธประวัติ', 'เบญจศีล', 'หลักธรรม', 'วันสำคัญ', 'ศีลธรรม'],
    suggestedActionText: 'ทบทวนหลักธรรมคำสอน',
  },
];

/**
 * Searches the catalog for the best matching learning resources given a topic name
 */
export function findMatchingResources(
  topicText: string,
  subject?: string,
  limit: number = 2
): RemediationResource[] {
  const cleanTopic = topicText.toLowerCase();
  const cleanSubject = (subject || '').toLowerCase();

  const scored = KAMPAI_LEARNING_CATALOG.map((res) => {
    let score = 0;
    // Subject match boosts relevance
    if (cleanSubject && res.subject.toLowerCase().includes(cleanSubject)) {
      score += 15;
    }

    // Keyword exact/partial matches
    res.keywords.forEach((kw) => {
      const lowerKw = kw.toLowerCase();
      if (cleanTopic.includes(lowerKw)) {
        score += 25;
      } else if (lowerKw.split(' ').some((word) => cleanTopic.includes(word))) {
        score += 10;
      }
    });

    // Title / Description matches
    if (res.title.toLowerCase().includes(cleanTopic)) score += 20;
    if (res.description.toLowerCase().includes(cleanTopic)) score += 10;

    return { resource: res, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return highest scored items, or fallback if score is zero
  const results = scored.filter((s) => s.score > 10).slice(0, limit);
  if (results.length > 0) {
    return results.map((r) => r.resource);
  }

  // Fallback: match by subject if available
  const subjectFallbacks = KAMPAI_LEARNING_CATALOG.filter(
    (res) => cleanSubject && res.subject.toLowerCase().includes(cleanSubject)
  );

  return (subjectFallbacks.length > 0 ? subjectFallbacks : KAMPAI_LEARNING_CATALOG).slice(0, limit);
}

/**
 * Generates personalized remediation quests for weak topics
 */
export function generateRemediationQuests(
  weakTopics: TopicDiagnostic[],
  subject?: string
): RemediationQuest[] {
  return weakTopics.map((wt) => {
    const resources = findMatchingResources(wt.topic, subject, 1);
    const chosenResource = resources[0] || KAMPAI_LEARNING_CATALOG[0];

    let teacherTip = `แนะนำให้นักเรียนทำความเข้าใจเนื้อหาพื้นฐานในหัวข้อ "${wt.topic}" อีกครั้ง โดยสังเกตตัวอย่างและลองลงมือทำแบบฝึกหัดจริง`;
    if (wt.scorePercentage < 30) {
      teacherTip = `หัวข้อนี้จำเป็นต้องปูพื้นฐานใหม่ แนะนำให้เริ่มจากสื่อจำลองแบบรูปธรรม (Interactive Model) เพื่อให้เห็นภาพชัดเจนก่อน`;
    } else if (wt.scorePercentage < 50) {
      teacherTip = `นักเรียนเข้าใจแนวคิดบางส่วน แต่ยังสับสนในขั้นตอนการวิเคราะห์หรือการคำนวณ แนะนำให้ทบทวนข้อผิดพลาดผ่านแบบฝึกหัด`;
    }

    return {
      topic: wt.topic,
      studentScorePct: wt.scorePercentage,
      questTitle: `ภารกิจพิชิต: ${wt.topic}`,
      learningGoal: `ยกระดับความเข้าใจจาก ${wt.scorePercentage}% ให้ผ่านเกณฑ์มาตรฐาน (≥ 70%)`,
      resource: chosenResource,
      teacherTip,
    };
  });
}
