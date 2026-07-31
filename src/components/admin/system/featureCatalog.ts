/**
 * featureCatalog.ts — SoT บทสรุปฟีเจอร์ทั้งระบบ (System Overview)
 * ใช้ใน Section D + export MD/JSON — อย่าสร้าง FEATURES.md ซ้ำ
 */

export type FeatureStatus = 'live' | 'partial' | 'deferred';

export type FeatureEntry = {
    name: string;
    purpose: string;
    canExtend: boolean;
    extendNote?: string;
    ideas12m: string[];
    ideas24m?: string[];
    status?: FeatureStatus;
};

export type FeatureDomain = {
    id: string;
    label: string;
    /** Tailwind classes for badge — light mode only */
    color: string;
    summary: string;
    features: FeatureEntry[];
};

export type LongTermHorizon = {
    id: string;
    label: string;
    themes: { title: string; items: string[] }[];
};

export const featureCatalog: FeatureDomain[] = [
    {
        id: 'public-cms',
        label: 'เว็บสาธารณะ / CMS',
        color: 'bg-sky-500/10 text-sky-800 border-sky-200',
        summary:
            'หน้าเว็บโรงเรียนที่ผู้ปกครองและชุมชนเปิดดูได้ + หลังบ้านแก้เนื้อหาโดยไม่ต้องแก้โค้ด',
        features: [
            {
                name: 'หน้าหลัก + Homepage Layout',
                purpose: 'โชว์อัตลักษณ์โรงเรียน ข่าวเด่น กิจกรรม และโซนที่ลากจัดลำดับได้',
                canExtend: true,
                extendNote: 'เพิ่มบล็อกใหม่ได้ผ่าน Page Builder / Homepage Manager',
                ideas12m: ['A/B ทดสอบ hero ตามฤดูกาลเปิดเทอม', 'โซน “สัปดาห์นี้” จากปฏิทินอัตโนมัติ'],
                ideas24m: ['ธีมหน้าแรกตามภาคเรียนโดยไม่กระทบ SEO'],
                status: 'live',
            },
            {
                name: 'ข่าว / แกลเลอรี่ / กิจกรรม',
                purpose: 'เผยแพร่ข่าวสาร รูปกิจกรรม และปฏิทินกิจกรรมสาธารณะ',
                canExtend: true,
                ideas12m: ['แท็กหมวดข่าว + กรองบนมือถือ', 'แชร์ LINE OA อัตโนมัติเมื่อเผยแพร่'],
                status: 'live',
            },
            {
                name: 'เกี่ยวกับโรงเรียน / บุคลากร / ผู้บริหาร',
                purpose: 'แนะนำอัตลักษณ์ ครู และโครงสร้างบริหาร พร้อมรูปโปรไฟล์',
                canExtend: true,
                ideas12m: ['หน้าประวัติโรงเรียนแบบไทม์ไลน์', 'QR ไปโปรไฟล์ครูรายคน'],
                status: 'live',
            },
            {
                name: 'เอกสารดาวน์โหลด + FAQ + ติดต่อ',
                purpose: 'ให้ผู้ปกครองโหลดแบบฟอร์ม และติดต่อโรงเรียนได้',
                canExtend: true,
                ideas12m: ['นับยอดดาวน์โหลดต่อไฟล์', 'FAQ ค้นหาภาษาพูด'],
                status: 'live',
            },
            {
                name: 'รับสมัครนักเรียนออนไลน์',
                purpose: 'รับใบสมัครเข้าเรียนผ่านเว็บ ลดคิวที่ รร.',
                canExtend: true,
                ideas12m: ['สถานะใบสมัครแจ้งผู้ปกครองทาง LINE', 'พิมพ์ใบนัดสัมภาษณ์'],
                status: 'live',
            },
            {
                name: 'ศิษย์เก่า + แบบสอบถามสาธารณะ',
                purpose: 'เครือข่ายศิษย์เก่าและเก็บความคิดเห็นชุมชน',
                canExtend: true,
                ideas12m: ['งานคืนสู่เหย้า RSVP', 'แดชบอร์ดสรุปแบบสอบถาม'],
                status: 'live',
            },
            {
                name: 'PWA ติดตั้งบนมือถือ',
                purpose: 'เปิดเว็บแบบแอป + ใช้ได้เมื่อเน็ตไม่เสถียรเบื้องต้น',
                canExtend: true,
                ideas12m: ['ออฟไลน์หน้า portal ครูที่ใช้บ่อย', 'เตือนอัปเดต SW ชัดขึ้น'],
                status: 'live',
            },
            {
                name: 'Page Builder / Theme / เมนู',
                purpose: 'ปรับหน้า About/Contact ธีมสี และเมนูโดยแอดมิน',
                canExtend: true,
                ideas12m: ['เทมเพลตหน้ากิจกรรมสำเร็จรูป', 'พรีวิวมือถือในตัว builder'],
                status: 'live',
            },
        ],
    },
    {
        id: 'academic',
        label: 'งานวิชาการ / ปพ. / DMC / ตัวชี้วัด',
        color: 'bg-emerald-500/10 text-emerald-800 border-emerald-200',
        summary:
            'ข้อมูลการเรียน การมาเรียน คะแนน และรายงานราชการ — ฐานความน่าเชื่อถือก่อนส่ง ปพ./DMC',
        features: [
            {
                name: 'เช็คชื่อ (Attendance) offline-first',
                purpose: 'ครูเช็คชื่อชั้นเรียนได้แม้เน็ตหลุด แล้วคิวซิงค์ทีหลัง',
                canExtend: true,
                ideas12m: ['แดชบอร์ดคิว sync ของครู', 'drill รายเดือนก่อนปิดภาค'],
                ideas24m: ['สรุปการมาเรียนรายบุคคลให้ผู้ปกครองแบบกราฟ'],
                status: 'live',
            },
            {
                name: 'คะแนน / เกรด',
                purpose: 'บันทึกคะแนนเก็บและใช้ประกอบ ปพ.5/6',
                canExtend: true,
                ideas12m: ['เตือนช่องว่างคะแนนก่อนปิดภาค (มีแบนเนอร์แล้ว → ขยายรายชั้น)'],
                status: 'live',
            },
            {
                name: 'ตารางสอน + แผนการสอน + สื่อการสอน',
                purpose: 'จัดคาบสอน แผนรายสัปดาห์ และผูก lesson pack ได้',
                canExtend: true,
                ideas12m: ['แผนสอนแนะนำ pack จากตัวชี้วัดอัตโนมัติ'],
                status: 'live',
            },
            {
                name: 'ตัวชี้วัดหลักสูตร + coverage',
                purpose:
                    'ผูกเกม/สื่อ/ใบงานกับตัวชี้วัด สพฐ. — map ตัวชี้วัดใช้งาน ≈100% แล้ว (RPC) โฟกัสคุณภาพ soft-gap',
                canExtend: true,
                extendNote: 'จำนวนครบแล้ว — รีวิวคุณภาพต่อเนื่อง ไม่ใช่เติม map มั่ว',
                ideas12m: ['รีวิว soft-gap รายวิชาเป็นสปรินต์', 'รายงาน coverage ต่อครูประจำชั้น'],
                status: 'live',
            },
            {
                name: 'ปพ.5 / ปพ.6 PDF',
                purpose: 'ออกใบรายงานผลการเรียนตามแบบราชการ',
                canExtend: true,
                ideas12m: ['ตรวจ completeness ก่อนพิมพ์เป็นเช็คลิสต์บังคับ'],
                status: 'live',
            },
            {
                name: 'DMC Export (Excel)',
                purpose: 'ส่งออกข้อมูลตามสคีมา สพฐ. เพื่ออัปโหลด DMC',
                canExtend: true,
                extendNote: 'ยังไม่ใช่ SIS sync สองทาง',
                ideas12m: ['คู่มือฤดูกาลส่ง DMC ในระบบ', 'validate แถวก่อน export'],
                ideas24m: ['พิจารณา API EMIS/DMC ถ้ามีสเปกชัด'],
                status: 'partial',
            },
            {
                name: 'นักเรียนพิเศษ / แนะแนว / นิเทศ',
                purpose: 'ติดตาม SEN คำปรึกษา และการนิเทศการสอน',
                canExtend: true,
                ideas12m: ['ลิงก์ไป Student 360° จากบันทึกแต่ละประเภท'],
                status: 'live',
            },
            {
                name: 'สุขภาพนักเรียน',
                purpose: 'เก็บบันทึกสุขภาพพื้นฐานเพื่อฉุกเฉินและรายงาน',
                canExtend: true,
                ideas12m: ['แจ้งเตือนวัคซีน/แพ้ยาให้ครูประจำชั้น'],
                status: 'live',
            },
            {
                name: 'MoE SIS / EMIS sync เต็มระบบ',
                purpose: 'ซิงค์ทะเบียนนักเรียนสองทางกับระบบส่วนกลาง',
                canExtend: false,
                extendNote: 'รอสเปก/API ทางการ — ตอนนี้ใช้ export เท่านั้น',
                ideas12m: ['คง DMC export ให้เสถียร'],
                ideas24m: ['ตัดสินใจ integrate หรืออยู่โหมด export-only'],
                status: 'deferred',
            },
        ],
    },
    {
        id: 'banks-game',
        label: 'ธนาคารโรงเรียน + เกมมิฟิเคชัน',
        color: 'bg-amber-500/10 text-amber-900 border-amber-200',
        summary:
            'สร้างนิสัยพอเพียงและแรงจูงใจผ่านแต้ม รางวัล ธนาคารขยะ/ออมทรัพย์ และเกม',
        features: [
            {
                name: 'ธนาคารขยะ + แต้ม',
                purpose: 'ฝากขยะรีไซเคิลได้แต้ม แลกรางวัล และดูสถิติสาธารณะ',
                canExtend: true,
                ideas12m: ['แคมเปญรายเดือนระดับชั้น', 'รายงานคาร์บอนแบบง่าย'],
                status: 'live',
            },
            {
                name: 'แคตตาล็อกรางวัล + สต็อก',
                purpose: 'แลกของรางวัล มีสต็อกและอนุมัติโดยครู',
                canExtend: true,
                ideas12m: ['แถบ drift สต็อก (มีแล้ว) → แจ้งเตือนไลน์ครูคลัง'],
                status: 'live',
            },
            {
                name: 'ธนาคารพอเพียง (ออมทรัพย์)',
                purpose: 'ฝึกออมเงินนักเรียน มี ledger และสรุปยอด',
                canExtend: true,
                ideas12m: ['เป้าหมายออมรายภาค', 'ใบเสร็จรายการฝากถอนพิมพ์ได้'],
                status: 'live',
            },
            {
                name: 'Kampai Hero / ความประพฤติ',
                purpose: 'บันทึกพฤติกรรมเชิงบวกและโปรไฟล์ฮีโร่สาธารณะ',
                canExtend: true,
                ideas12m: ['บอร์ดฮีโร่ประจำสัปดาห์บนหน้าหลัก'],
                status: 'live',
            },
            {
                name: 'XP / แบดจ์ / สัตว์เลี้ยง',
                purpose: 'สะสมความก้าวหน้าจากการเล่นเกมและภารกิจ',
                canExtend: true,
                ideas12m: ['เควสผูกกับตัวชี้วัด', 'สัตว์เลี้ยง stage จากความสม่ำเสมอ'],
                status: 'live',
            },
            {
                name: 'Daily Quest + Online Arena + Hall of Fame',
                purpose: 'ภารกิจรายวัน การแข่งออนไลน์ และโชว์คนเก่ง',
                canExtend: true,
                ideas12m: ['Arena ตามชั้นเรียน', 'Hall of Fame กรองรายเดือน'],
                status: 'live',
            },
        ],
    },
    {
        id: 'edu-hub',
        label: 'คลังสื่อ / เกม / ใบงาน / packs',
        color: 'bg-violet-500/10 text-violet-800 border-violet-200',
        summary:
            'ห้องสมุดดิจิทัลสำหรับสอนบนโปรเจคเตอร์ — สื่อ ใบงานพิมพ์ เกม และชุดเรียน',
        features: [
            {
                name: 'Educational Hub สาธารณะ + หน้าครู',
                purpose: 'เปิดดูคลังสื่อของครู และลิงก์สั้น /h/:id',
                canExtend: true,
                ideas12m: ['คอลเลกชันตามหน่วยการเรียนรู้', 'แนะนำตาม mastery'],
                status: 'live',
            },
            {
                name: 'ครูอัปสื่อเอง (/teacher/edu-hub)',
                purpose: 'ครูเผยแพร่ไฟล์/ลิงก์/YouTube/ข้อความเองได้',
                canExtend: true,
                extendNote: 'KPI มีแล้ว — รอ adoption ครู non-admin',
                ideas12m: ['เวิร์กช็อป 5 นาทีในระบบ', 'ชวนอัปรายสัปดาห์'],
                status: 'partial',
            },
            {
                name: 'เกมการศึกษา + KAMPAI SDK',
                purpose: 'เล่นเกมใน /play พร้อมคะแนน เสียง ลีดเดอร์บอร์ด',
                canExtend: true,
                ideas12m: ['เกมเติมช่องว่างหลักสูตรที่ soft-gap ชี้', 'BGM คลังเพลงต่อ'],
                status: 'live',
            },
            {
                name: 'ใบงานพิมพ์ + lesson packs',
                purpose: 'ชุดสอน สื่อ→พิมพ์→เกม และมอบหมายบ้าน (แนบไฟล์ได้)',
                canExtend: true,
                ideas12m: [
                    'ปิด Phase 16 ด้วยหลักฐานครู non-admin อัปจริง',
                    'ทำให้ลูป pack → มอบหมาย → ส่ง → ตรวจ เป็นกิจวัตร',
                ],
                status: 'live',
            },
            {
                name: 'จับคู่ตัวชี้วัด (BatchMapper + soft-gap)',
                purpose: 'รีวิวและแก้ mapping เกม/สื่อ/ใบงานกับตัวชี้วัด',
                canExtend: true,
                ideas12m: ['สปรินต์รีวิวคุณภาพรายสาระ'],
                status: 'live',
            },
            {
                name: 'AI ปก / Game builder / วิจัยในชั้น',
                purpose: 'เร่งสร้างปกเกม โครงเกม และเก็บข้อมูลวิจัยครู',
                canExtend: true,
                ideas12m: ['เทมเพลตวิจัย 7 วันสำเร็จรูป'],
                status: 'live',
            },
        ],
    },
    {
        id: 'comms',
        label: 'การสื่อสาร (Chat / LINE / Push / ประชุม)',
        color: 'bg-rose-500/10 text-rose-800 border-rose-200',
        summary:
            'ช่องทางคุยและแจ้งเตือนระหว่างโรงเรียน ครู และผู้ปกครอง',
        features: [
            {
                name: 'แชทในระบบ + แนบไฟล์',
                purpose: 'คุยครู–ผู้ปกครองแบบ thread พร้อมรูป/PDF',
                canExtend: true,
                ideas12m: ['ค้นหาข้อความเก่า', 'ปักหมุดประกาศชั้น'],
                status: 'live',
            },
            {
                name: 'Web Push (PWA)',
                purpose: 'แจ้งเตือนขาดเรียน คะแนน ข่าว ฉุกเฉิน บนมือถือ',
                canExtend: true,
                ideas12m: ['แดชบอร์ดอัตราเปิดอ่าน', 'ทดสอบฉุกเฉินรายเทอม'],
                status: 'live',
            },
            {
                name: 'LINE OA เชื่อมผู้ปกครอง',
                purpose: 'ผูกบัญชี LINE และส่งข้อความผ่าน OA',
                canExtend: true,
                extendNote: 'ขึ้นกับโควต้า LINE และสถานะเชื่อมต่อ',
                ideas12m: ['เตือนโควต้าใกล้หมด', 'เทมเพลตข้อความมาตรฐาน'],
                status: 'partial',
            },
            {
                name: 'แจ้งเตือนฉุกเฉิน',
                purpose: 'ประกาศด่วนตามระดับความรุนแรงถึงกลุ่มเป้าหมาย',
                canExtend: true,
                ideas12m: ['ซ้อมแผนฉุกเฉินปีละ 1 ครั้งในระบบ'],
                status: 'live',
            },
            {
                name: 'นัดประชุมผู้ปกครอง',
                purpose: 'จอง/ยกเลิกสล็อตพบครู พร้อม push',
                canExtend: true,
                ideas12m: ['สรุปรายสัปดาห์ให้ฝ่ายบริหาร'],
                status: 'live',
            },
            {
                name: 'SMS Gateway จริง',
                purpose: 'ส่ง SMS เมื่อไม่มี LINE/Push',
                canExtend: false,
                extendNote: 'ตอนนี้มีแค่เทมเพลตคัดลอก — ยังไม่ต่อผู้ให้บริการ',
                ideas12m: ['ตัดสินใจใช้ LINE+Push เป็นหลัก หรือเลือกผู้ให้บริการ SMS'],
                ideas24m: ['เชื่อม ThaiBulkSMS/Twilio ถ้าจำเป็น'],
                status: 'deferred',
            },
            {
                name: 'Google Calendar sync สองทาง',
                purpose: 'ซิงค์ปฏิทินกิจกรรมกับ Google',
                canExtend: false,
                extendNote: 'ยังไม่วางในผลิตภัณฑ์',
                ideas24m: ['iCal export ก่อน แล้วค่อย OAuth sync'],
                status: 'deferred',
            },
        ],
    },
    {
        id: 'portals',
        label: 'Portal ครู–ผู้ปกครอง–นักเรียน',
        color: 'bg-pink-500/10 text-pink-800 border-pink-200',
        summary:
            'พื้นที่ทำงานตามบทบาท — ครูสอน/บันทึก ผู้ปกครองติดตามลูก นักเรียนเรียน',
        features: [
            {
                name: 'Portal ครู',
                purpose: 'เช็คชื่อ คะแนน อนุมัติรางวัล คลังสื่อ CCTV QR สแกน',
                canExtend: true,
                ideas12m: ['แดชบอร์ด “งานค้างวันนี้” รวมการบ้าน+รางวัล'],
                status: 'live',
            },
            {
                name: 'Portal ผู้ปกครอง (หลายลูก)',
                purpose: 'ดูการมาเรียน คะแนน ความประพฤติ ธนาคาร ใบงานบ้าน',
                canExtend: true,
                ideas12m: ['สรุปรายสัปดาห์อัตโนมัติ', 'PDPA self-view ให้ชัดขึ้น'],
                status: 'live',
            },
            {
                name: 'การบ้าน (มอบหมาย / ส่ง / ตรวจ)',
                purpose: 'ลูปงานบ้านครบวงจร รวมแนบรูป/PDF และ push ครู',
                canExtend: true,
                ideas12m: ['รูบริกให้คะแนนเร็ว', 'แจ้งผู้ปกครองเมื่อได้คะแนน'],
                status: 'live',
            },
            {
                name: 'Mastery / คำศัพท์ / My Learning',
                purpose: 'เห็นความก้าวหน้าตัวชี้วัดและเส้นทางการเรียน',
                canExtend: true,
                ideas12m: ['แนะนำเกมจากจุดอ่อน'],
                status: 'live',
            },
            {
                name: 'รับ–ส่งนักเรียน (Dismissal)',
                purpose: 'บันทึกการรับตัวและแจ้งผู้ปกครอง',
                canExtend: true,
                ideas12m: ['คิวรับช่วงเร่งด่วนบนมือถือ'],
                status: 'live',
            },
            {
                name: 'รูปห้องเรียน + แท็กใบหน้า (PDPA)',
                purpose: 'ผู้ปกครองเห็นเฉพาะรูปที่เกี่ยวกับลูก',
                canExtend: true,
                ideas12m: ['ขอความยินยอมก่อนเผยแพร่อัลบั้มชั้น'],
                status: 'live',
            },
            {
                name: 'LanguageSwitcher ใน portal',
                purpose: 'สลับภาษาไทย/อังกฤษตาม Rule 14.34',
                canExtend: true,
                ideas12m: ['แปลสตริง portal ให้ครบชุด'],
                ideas24m: ['i18n ครบทั้งแอดมิน'],
                status: 'partial',
            },
        ],
    },
    {
        id: 'ops',
        label: 'งานธุรการ (สารบรรณ / Docs Hub / HR)',
        color: 'bg-slate-500/10 text-slate-800 border-slate-200',
        summary:
            'งานเอกสารภายในโรงเรียน งบประมาณ แผน และงานบุคคล',
        features: [
            {
                name: 'สารบรรณ',
                purpose: 'หนังสือรับ–ส่ง คำสั่ง ประชุม และติดตามสถานะ',
                canExtend: true,
                ideas12m: ['SLA ตอบหนังสือ', 'ค้นหาเต็มข้อความ'],
                status: 'live',
            },
            {
                name: 'Docs Hub (งบ / SAR / ICS / แผนปฏิบัติ)',
                purpose: 'คลังเอกสารเชิงแผนและรายงานคุณภาพ',
                canExtend: true,
                ideas12m: ['เช็คลิสต์ปิดปีงบ', 'ลิงก์จาก SAR ไปหลักฐาน'],
                status: 'live',
            },
            {
                name: 'เทมเพลตเอกสาร + ลายเซ็น',
                purpose: 'สร้างเอกสารมาตรฐานและลงนามดิจิทัล',
                canExtend: true,
                ideas12m: ['ชุดคำสั่งแต่งตั้งสำเร็จรูป'],
                status: 'live',
            },
            {
                name: 'HR: ลา / อบรม / PA',
                purpose: 'จัดการการลา เกียรติบัตรอบรม และประเมินผลงาน',
                canExtend: true,
                ideas12m: ['สรุปชั่วโมงพัฒนาตนเองรายปี'],
                status: 'live',
            },
            {
                name: 'พัสดุ / วัสดุพื้นฐาน',
                purpose: 'ทะเบียนวัสดุ คำขอเบิกของครู อนุมัติตัดสต็อก และแจ้งเตือนของใกล้หมด',
                canExtend: true,
                ideas12m: ['QR เบิกของ', 'ผูกงบประมาณตอนจัดซื้อ'],
                ideas24m: ['ครุภัณฑ์ + บาร์โค้ด'],
                status: 'live',
            },
            {
                name: 'Digital Ops / ลดภาระครู',
                purpose: 'แดชบอร์ด PDCA ตัวชี้วัดเวลา–กระดาษ Role Model และรายงานนวัตกรรมดิจิทัล',
                canExtend: true,
                ideas12m: ['ส่งออกรายงาน DOCX', 'กราฟเปรียบเทียบรายภาค'],
                status: 'live',
            },
            {
                name: 'CRUD บุคลากร / นักเรียน / สิทธิ์เมนู',
                purpose: 'บริหารข้อมูลคนและสิทธิ์เข้าเมนูหลังบ้าน',
                canExtend: true,
                ideas12m: ['ออนบอร์ดครูใหม่เช็คลิสต์ในระบบ'],
                status: 'live',
            },
            {
                name: 'Analytics + System Overview',
                purpose: 'สถิติเข้าชมและแคตตาล็อกระบบ/เวอร์ชัน',
                canExtend: true,
                ideas12m: ['ใช้บทสรุปฟีเจอร์นี้วางแผนสปรินต์รายไตรมาส'],
                status: 'live',
            },
            {
                name: 'AI Assist (แผน/ความเห็น)',
                purpose: 'ช่วยร่างแผนการสอนและความเห็นพร้อม audit log',
                canExtend: true,
                ideas12m: ['เทมเพลตความเห็นปพ. ภาษาครู'],
                status: 'live',
            },
        ],
    },
    {
        id: 'trust',
        label: 'ความเชื่อถือ / PDPA / บริจาค',
        color: 'bg-teal-500/10 text-teal-800 border-teal-200',
        summary:
            'ความโปร่งใส ความยินยอม และการระดมทุนที่ตรวจสอบได้',
        features: [
            {
                name: 'PDPA dashboard + /privacy',
                purpose: 'จัดการความยินยอม สิทธิ์ลบข้อมูล และนโยบายความเป็นส่วนตัว',
                canExtend: true,
                ideas12m: ['SLA ลบข้อมูลติดตามสถานะ', 'ทบทวนความยินยอมรายปี'],
                status: 'live',
            },
            {
                name: 'บันทึกการเข้าถึงข้อมูลอ่อนไหว',
                purpose: 'audit เมื่อเปิดข้อมูลสุขภาพ/อ่อนไหว',
                canExtend: true,
                ideas12m: ['รายงาน audit รายเดือนให้ผอ.'],
                status: 'live',
            },
            {
                name: 'บริจาค PromptPay + ตรวจสลิป',
                purpose: 'แคมเปญระดมทุน อัปเดตยอดเมื่อยืนยันแล้ว',
                canExtend: true,
                ideas12m: ['หน้ารายงานความโปร่งใสสาธารณะ'],
                status: 'live',
            },
            {
                name: 'ใบเสร็จบริจาคเบา (พิมพ์ได้)',
                purpose: 'ออกเลข KP-พ.ศ. และพิมพ์หลักฐานเบื้องต้น',
                canExtend: true,
                extendNote: 'ยังไม่ใช่ใบเสร็จภาษี e-Donation',
                ideas12m: ['ส่งใบเสร็จทางอีเมลอัตโนมัติ'],
                status: 'partial',
            },
            {
                name: 'e-Donation กรมสรรพากร',
                purpose: 'ใบเสร็จลดหย่อนภาษีตามระบบราชการ',
                canExtend: false,
                extendNote: 'ต้องเชื่อม API/กระบวนการกรมสรรพากร',
                ideas12m: ['รวบรวมความต้องการผู้บริจาค'],
                ideas24m: ['เชื่อม e-Donation เมื่อพร้อมเอกสาร'],
                status: 'deferred',
            },
        ],
    },
];

/** Derive badge groups จาก catalog (SoT เดียว) */
export const featureGroupsFromCatalog = featureCatalog.map((d) => ({
    label: d.label,
    color: d.color,
    features: d.features.map((f) => f.name),
}));

export const longTermPlan: LongTermHorizon[] = [
    {
        id: 'year-1',
        label: 'ปีที่ 1 — ทำให้ของที่มี “ใช้จริงทุกวัน”',
        themes: [
            {
                title: 'Harden daily ops',
                items: [
                    'เช็คชื่อ/คะแนนครบก่อนปิดภาค · คุณภาพ ปพ./DMC',
                    'PDPA: ความยินยอม + การลบข้อมูลตาม SLA',
                    'ซ้อมแจ้งเตือนฉุกเฉิน + ความเสถียร Push/LINE',
                ],
            },
            {
                title: 'Learning loop',
                items: [
                    'ปิด Phase 16 ด้วยหลักฐานครู non-admin อัปสื่อ (โค้ด KPI พร้อมแล้ว)',
                    'รีวิวคุณภาพ map ตัวชี้วัดด้วย soft-gap (coverage จำนวนครบแล้ว)',
                    'ลูป pack → มอบหมาย → ส่งงานบ้าน → ตรวจ ให้เป็นกิจวัตร',
                ],
            },
            {
                title: 'Comms ที่พึ่งได้',
                items: [
                    'เลือกหลัก LINE+Push (หรือตัดสินใจ SMS)',
                    'แดชบอร์ดงานค้างของครู (การบ้าน/รางวัล/นัดพบ)',
                ],
            },
        ],
    },
    {
        id: 'year-2',
        label: 'ปีที่ 2 — ขยายความลึกและเชื่อมภายนอกเท่าที่จำเป็น',
        themes: [
            {
                title: 'Compliance & เงิน',
                items: [
                    'e-Donation กรมสรรพากร ถ้ามีความต้องการจริง',
                    'หน้ารายงานบริจาคโปร่งใสต่อเนื่อง',
                ],
            },
            {
                title: 'ระบบภายนอก',
                items: [
                    'ตัดสินใจ: DMC export-only หรือ SIS/EMIS sync',
                    'iCal/ปฏิทินภายนอกก่อน Google OAuth เต็มรูปแบบ',
                ],
            },
            {
                title: 'Scale & polish',
                items: [
                    'i18n ครบ portal + แอดมินที่ใช้บ่อย',
                    'Cmd+K / ค้นหาทั่วระบบสำหรับครูอำนวยการ',
                    'Newsletter หรือบอร์ดสรุปรายเดือนถ้ายังต้องการ',
                ],
            },
        ],
    },
];

export const featureCatalogStats = {
    domains: featureCatalog.length,
    features: featureCatalog.reduce((n, d) => n + d.features.length, 0),
    live: featureCatalog.reduce(
        (n, d) => n + d.features.filter((f) => (f.status ?? 'live') === 'live').length,
        0,
    ),
    partial: featureCatalog.reduce(
        (n, d) => n + d.features.filter((f) => f.status === 'partial').length,
        0,
    ),
    deferred: featureCatalog.reduce(
        (n, d) => n + d.features.filter((f) => f.status === 'deferred').length,
        0,
    ),
};
