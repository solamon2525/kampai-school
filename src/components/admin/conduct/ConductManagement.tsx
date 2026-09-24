import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { studentsService, conductService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Star, Plus, Minus, Trophy, History, Search, Trash2, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '../shared/RecorderSelect';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
    PointsConfirmationDialog,
    type PointsConfirmation,
} from '@/components/admin/shared/PointsConfirmationDialog';
import { getFirstName, speakThai, stopThaiSpeech, thaiNumberToWords } from '@/lib/thaiSpeech';
import {
    playConductChime,
    stopConductChime,
    formatConductRecordSpeech,
    formatConductBulkSpeech,
} from '@/lib/conductSound';
import { cn } from '@/lib/utils';

// ===== Constants =====
const CLASS_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const currentYear = (new Date().getFullYear() + 543).toString();

// Sentinel สำหรับ <Select> ของ radix v2.2+ ที่ห้าม value=""
const ALL = '__all__';

const QUICK_SCORES = [1, 2, 5, 10];

const getCategoryMeta = (cat: string) => conductService.getConductCategoryMeta(cat);

const PRESET_REASONS: Record<'add' | 'deduct', { category: string; reasons: string[] }[]> = {
    add: [
        {
            category: 'publicMind',
            reasons: [
                'ช่วยเก็บขยะและดูแลความสะอาดโรงเรียน 🌱',
                'อาสาช่วยงานคุณครูและกิจกรรมส่วนรวม 🏫',
                'จัดระเบียบโต๊ะเก้าอี้และแถวชั้นเรียน 🪑',
                'บำเพ็ญประโยชน์เพื่อโรงเรียนและชุมชน 🤝',
                'ช่วยดูแลรุ่นน้องหรือเพื่อนร่วมชั้น 🎒',
            ],
        },
        {
            category: 'responsibility',
            reasons: [
                'ส่งการบ้านและภาระงานตรงเวลาครบถ้วน 📘',
                'ปฏิบัติหน้าที่เวรประจำวันอย่างดีเยี่ยม 🧹',
                'ตั้งใจเรียนและมีส่วนร่วมในกิจกรรมการเรียน 💡',
                'ปฏิบัติภารกิจที่ได้รับมอบหมายจนสำเร็จ 🎯',
                'เตรียมอุปกรณ์การเรียนครบถ้วนพร้อมเรียน ✏️',
            ],
        },
        {
            category: 'discipline',
            reasons: [
                'เข้าแถวเคารพธงชาติตอนเช้าตรงเวลา ⏰',
                'แต่งกายถูกต้องตามระเบียบเรียบร้อย 👔',
                'เข้าห้องเรียนตรงเวลาทุกคาบเรียน 🚪',
                'ปฏิบัติตามกฎระเบียบและข้อตกลงห้องเรียน 📜',
                'เดินแถวอย่างเป็นระเบียบและสำรวม 🚶',
            ],
        },
        {
            category: 'honesty',
            reasons: [
                'เก็บของมีค่าหรือเงินตกหล่นส่งคืนเจ้าของ 🪙',
                'ซื่อสัตย์สุจริต ไม่ลอกการบ้านหรือข้อสอบ 📝',
                'ยอมรับความจริงอย่างตรงไปตรงมาและกล้าหาญ 👤',
                'มีความจริงใจและรักษาคำพูดต่อผู้อื่น 🌟',
                'ซื่อตรงต่อหน้าที่แม้ไม่มีใครมอง 👁️',
            ],
        },
        {
            category: 'kindness',
            reasons: [
                'ช่วยเหลือเพื่อนสอนการบ้านและอธิบายบทเรียน 📖',
                'มีน้ำใจแบ่งปันขนม ของใช้ หรืออุปกรณ์ ❤️',
                'ช่วยคุณครูถือของและยกสิ่งของหนัก 🛍️',
                'ดูแลเพื่อนที่ไม่สบายหรือต้องการความช่วยเหลือ 🩹',
                'ปลอบโยนและให้กำลังใจเพื่อนเสมอ 🫂',
            ],
        },
        {
            category: 'manners',
            reasons: [
                'ไหว้ทักทายคุณครูและผู้ใหญ่ด้วยความนอบน้อม 🙏',
                'พูดจาสุภาพ ไพเราะ มีหางเสียงเสมอ 🗣️',
                'กล่าวคำขอบคุณและขอโทษอย่างจริงใจ ✨',
                'มีสัมมาคารวะและกิริยามารยาทเรียบร้อย 🙇',
                'รับฟังผู้อื่นอย่างตั้งใจและให้เกียรติผู้พูด 👂',
            ],
        },
        {
            category: 'leadership',
            reasons: [
                'เป็นผู้นำกลุ่มและประสานงานเพื่อนร่วมงานสำเร็จ 👑',
                'ให้ความร่วมมือในการทำงานกลุ่มอย่างเต็มที่ 🤝',
                'ช่วยไกล่เกลี่ยและแก้ปัญหาความขัดแย้งในกลุ่ม 🕊️',
                'กล้าแสดงออกในทางที่ถูกต้องและสร้างสรรค์ 🎤',
                'เสียสละเพื่อความสำเร็จของทีมและห้องเรียน 🌟',
            ],
        },
        {
            category: 'hygiene',
            reasons: [
                'ล้างมือถูกสุขอนามัยก่อนทานอาหารและหลังเข้าห้องน้ำ 🧼',
                'รักษาความสะอาดโต๊ะเรียนและพื้นที่ของตนเอง 🧽',
                'คัดแยกและทิ้งขยะลงถังอย่างถูกต้อง 🗑️',
                'แต่งกายสะอาด ผม เล็บ มือถูกสุขลักษณะ ✂️',
                'ช่วยดูแลความสะอาดโรงอาหารและพื้นที่ส่วนกลาง 🍽️',
            ],
        },
        {
            category: 'property',
            reasons: [
                'ช่วยซ่อมแซมหรือจัดเก็บอุปกรณ์ของโรงเรียนเข้าที่ 🧱',
                'แจ้งคุณครูทันทีเมื่อพบสิ่งของหรืออุปกรณ์ชำรุด 📢',
                'ช่วยประหยัดพลังงาน ปิดไฟ พัดลม และแอร์เมื่อเลิกใช้ 💡',
                'ใช้อุปกรณ์ส่วนรวมอย่างทะนุถนอมและถูกวิธี 🔨',
                'ช่วยดูแลรักษาทรัพย์สินห้องเรียนให้อยู่ในสภาพดี 🪑',
            ],
        },
        {
            category: 'device',
            reasons: [
                'ใช้อุปกรณ์สื่อสารค้นคว้าหาความรู้เชิงสร้างสรรค์ 📱',
                'ปฏิบัติตามกฎการใช้อุปกรณ์ดิจิทัลในห้องเรียนอย่างเคร่งครัด 🔒',
                'ช่วยคุณครูดูแลและจัดเก็บแท็บเล็ต/คอมพิวเตอร์เข้าที่ 💻',
                'ปิดเสียงและเก็บอุปกรณ์สื่อสารอย่างมีวินัยตรงเวลา 🔇',
                'เป็นแบบอย่างในการใช้สื่อออนไลน์อย่างสร้างสรรค์และปลอดภัย 🌐',
            ],
        },
    ],
    deduct: [
        {
            category: 'discipline',
            reasons: [
                'มาสาย / ไม่ทันเข้าแถวเคารพธงชาติ ⏰',
                'หนีเรียน / ขาดเรียนโดยไม่มีเหตุผลจำเป็น 🚫',
                'เข้าห้องเรียนช้าหลังหมดเวลาพัก 🏃',
                'แต่งกายผิดระเบียบ / ทรงผมไม่ถูกระเบียบ 👔',
                'ออกนอกบริเวณโรงเรียนโดยไม่ได้รับอนุญาต 🚪',
            ],
        },
        {
            category: 'device',
            reasons: [
                'ใช้โทรศัพท์หรือแอบเล่นเกมในเวลาเรียน 📱',
                'ไม่ฝากโทรศัพท์มือถือตามระเบียบของโรงเรียน 📵',
                'สวมหูฟังหรือเล่นโซเชียลมีเดียขณะครูกำลังสอน 🎧',
                'ถ่ายภาพหรือวิดีโอล้อเลียนผู้อื่นในโรงเรียน 📸',
                'ใช้อุปกรณ์สื่อสารเปิดสื่อที่ไม่เหมาะสม 🚫',
            ],
        },
        {
            category: 'responsibility',
            reasons: [
                'ไม่ทำการบ้าน / ไม่ส่งงานตามกำหนด 📘',
                'หลบเลี่ยงไม่ทำหน้าที่เวรทำความสะอาดประจำวัน 🧹',
                'ไม่นำสมุด หนังสือ หรืออุปกรณ์การเรียนมา 🎒',
                'ละเลยหน้าที่และความรับผิดชอบในงานกลุ่ม 👥',
                'นอนหลับหรือไม่สนใจบทเรียนในห้องเรียน 💤',
            ],
        },
        {
            category: 'property',
            reasons: [
                'ทำลายข้าวของหรืออุปกรณ์ของโรงเรียนเสียหาย 🧱',
                'ขีดเขียนโต๊ะ เก้าอี้ ประตู หรือผนังห้องเรียน 🖍️',
                'เล่นอุปกรณ์กีฬาหรือสิ่งของส่วนรวมอย่างไม่ระวัง ⚽',
                'เปิดน้ำหรือเปิดไฟทิ้งไว้โดยไม่ปิด 💡',
                'ทำสิ่งของส่วนรวมชำรุดเสียหายแล้วไม่แจ้ง 🔨',
            ],
        },
        {
            category: 'manners',
            reasons: [
                'พูดจาหยาบคาย ไม่สุภาพ หรือขึ้นเสียง 🤬',
                'แสดงกิริยาก้าวร้าวหรือไม่เคารพครูและบุคลากร 🙅',
                'ส่งเสียงดังรบกวนสมาธิผู้อื่นในเวลาเรียน 📣',
                'พูดแทรกขณะที่ครูหรือเพื่อนกำลังพูด 🗣️',
                'ล้อเลียนหรือเรียกชื่อบุพการีเพื่อน 🤐',
            ],
        },
        {
            category: 'honesty',
            reasons: [
                'ลอกการบ้าน รายงาน หรือทุจริตการสอบ 📝',
                'พูดปดหรือโกหกคุณครู 🤥',
                'ขโมยหรือหยิบสิ่งของผู้อื่นโดยไม่ได้รับอนุญาต 🔒',
                'ปลอมแปลงลายเซ็นผู้ปกครองหรือครู ✍️',
                'ปกปิดความผิดของตนเองหรือใส่ร้ายผู้อื่น 👤',
            ],
        },
        {
            category: 'kindness',
            reasons: [
                'ทะเลาะวิวาทหรือใช้กำลังทำร้ายร่างกายเพื่อน 🥊',
                'กลั่นแกล้ง รังแก หรือข่มขู่เพื่อน (Bullying) 😢',
                'กีดกันเพื่อน ไม่ยอมให้ร่วมกลุ่ม 🙅‍♂️',
                'ล้อเลียนปมด้อยหรือรูปร่างหน้าตาผู้อื่น 👥',
                'แกล้งซ่อนหรือทำลายสิ่งของของเพื่อน 🎒',
            ],
        },
        {
            category: 'hygiene',
            reasons: [
                'ทิ้งขยะเกลื่อนกลาด ไม่ทิ้งลงถัง 🚯',
                'ไม่รักษาความสะอาดในการใช้ห้องน้ำ 🚽',
                'รับประทานอาหารหรือขนมในห้องเรียนโดยไม่ได้รับอนุญาต 🍬',
                'ทำอาหารหรือน้ำหกเลอะเทอะแล้วไม่ทำความสะอาด 🧽',
                'ไม่ดูแลสุขอนามัยส่วนบุคคลจนรบกวนผู้อื่น 😷',
            ],
        },
        {
            category: 'leadership',
            reasons: [
                'ใช้อำนาจหน้าที่ในกลุ่มในทางที่ไม่ถูกต้อง 👑',
                'ไม่รับฟังความคิดเห็นของสมาชิกในกลุ่ม 🗣️',
                'ไม่ช่วยประสานงานหรือทิ้งงานกลุ่มให้เพื่อนทำ 👥',
                'ชักชวนเพื่อนทำกิจกรรมที่ไม่เหมาะสมหรือไม่ถูกระเบียบ 🚫',
                'เอาแต่ใจตนเอง ไม่ประนีประนอมในการทำงานเป็นทีม 🙅',
            ],
        },
        {
            category: 'publicMind',
            reasons: [
                'เพิกเฉย ไม่ช่วยกิจกรรมส่วนรวมของโรงเรียน 🌱',
                'ทำให้พื้นที่ส่วนรวมหรือโรงอาหารสกปรกเลอะเทอะ 🍽️',
                'ทำลายหรือเหยียบย่ำแปลงผักหรือต้นไม้ของโรงเรียน 🌿',
                'ไม่ให้ความร่วมมือในการบำเพ็ญประโยชน์ 🧹',
                'ทิ้งขยะในพื้นที่สาธารณะของโรงเรียน 🗑️',
            ],
        },
    ],
};

// ===== Interfaces =====
interface Student {
    id: string;
    student_code: string | null;
    name: string;
    class: string;
    room: string | null;
    class_number: number | null;
    gender: string | null;
    photo_url: string | null;
}

interface ConductRecord {
    id: string;
    student_id: string;
    type: 'add' | 'deduct';
    score: number;
    category: string;
    reason: string;
    recorded_by: string | null;
    academic_year: string;
    semester: string;
    created_at: string;
    students?: { name: string; class: string; photo_url?: string | null } | null;
}

// ===== Main Component =====
export const ConductManagement = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('record');

    useEffect(() => {
        return () => {
            stopConductChime();
            stopThaiSpeech();
        };
    }, []);

    const handleTabChange = (val: string) => {
        stopConductChime();
        stopThaiSpeech();
        setActiveTab(val);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">ระบบธนาคารความดี</h2>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="record" className="gap-1 text-xs sm:text-sm px-1">
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" /> ทีละคน
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="gap-1 text-xs sm:text-sm px-1">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" /> หลายคน
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="gap-1 text-xs sm:text-sm px-1">
                        <Trophy className="w-3.5 h-3.5 flex-shrink-0" /> อันดับ
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm px-1">
                        <History className="w-3.5 h-3.5 flex-shrink-0" /> ประวัติ
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record"><RecordTab toast={toast} /></TabsContent>
                <TabsContent value="bulk"><BulkRecordTab toast={toast} /></TabsContent>
                <TabsContent value="leaderboard"><LeaderboardTab /></TabsContent>
                <TabsContent value="history"><HistoryTab toast={toast} /></TabsContent>
            </Tabs>
        </div>
    );
};

// ===== Tab 1: บันทึกคะแนน =====
function RecordTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [studentAccumulatedMap, setStudentAccumulatedMap] = useState<Record<string, number>>({});
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [category, setCategory] = useState('publicMind');
    const [reason, setReason] = useState('');
    const [score, setScore] = useState('1');
    const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
    const [semester, setSemester] = useState('1');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [isSaving, setIsSaving] = useState(false);
    const [pointsConfirmation, setPointsConfirmation] = useState<PointsConfirmation | null>(null);
    const [speechComplete, setSpeechComplete] = useState(false);
    const speechRequestRef = useRef(0);
    const closePointsConfirmation = useCallback(() => {
        speechRequestRef.current += 1;
        stopConductChime();
        stopThaiSpeech();
        setPointsConfirmation(null);
    }, []);

    useEffect(() => {
        return () => {
            stopConductChime();
            stopThaiSpeech();
        };
    }, []);

    // โหลดรายชื่อนักเรียนเมื่อเปลี่ยนห้องเรียน
    useEffect(() => {
        setStudents([]);
        setSelectedStudentId('');
        setStudentAccumulatedMap({});
        if (!selectedClass) return;

        let active = true;
        studentsService.getByClass(selectedClass).then(({ data }) => {
            if (!active) return;
            setStudents((data || []) as Student[]);
        });

        return () => {
            active = false;
        };
    }, [selectedClass]);

    // Pre-fetch คะแนนสะสมล่วงหน้าสำหรับนักเรียนทุกคนในห้องเมื่อได้รายชื่อหรือเปลี่ยนปีการศึกษา
    useEffect(() => {
        if (students.length === 0) return;
        let active = true;
        const ids = students.map(s => s.id);
        conductService.getAccumulatedScoresForStudents(ids, academicYear).then(scoresMap => {
            if (active) {
                setStudentAccumulatedMap(scoresMap);
            }
        }).catch(() => {});

        return () => {
            active = false;
        };
    }, [students, academicYear]);

    // ดึงคะแนนสะสมเจาะจงรายนักเรียนที่เลือกเพื่อความแม่นยำสูงสุด
    useEffect(() => {
        if (!selectedStudentId) return;
        let active = true;
        conductService.getAccumulatedScore(selectedStudentId, academicYear).then(accScore => {
            if (active) {
                setStudentAccumulatedMap(prev => ({ ...prev, [selectedStudentId]: accScore }));
            }
        }).catch(() => {});

        return () => {
            active = false;
        };
    }, [selectedStudentId, academicYear]);

    const parsedScore = Math.max(1, Math.min(100, parseInt(score, 10) || 1));
    const activeCategory = category || (type === 'add' ? 'publicMind' : 'discipline');
    const presets = PRESET_REASONS[type];
    const categoryPreset = presets.find(p => p.category === activeCategory);

    const handleSave = async () => {
        if (isSaving) return;
        if (!selectedStudentId || !reason.trim()) {
            toast({ variant: 'destructive', title: 'กรุณาเลือกนักเรียนและกรอกเหตุผล' });
            return;
        }
        const studentExists = students.some(s => s.id === selectedStudentId);
        if (!studentExists) {
            toast({ variant: 'destructive', title: 'นักเรียนที่เลือกไม่อยู่ในชั้นเรียนปัจจุบัน' });
            return;
        }
        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        // ล็อกสถานะบันทึกทันทีเพื่อป้องกัน double-submit
        setIsSaving(true);

        try {
            // หยุดเสียงสังเคราะห์หรือเสียงพูดก่อนหน้าทันทีเพื่อให้ตอบสนองใน 0 วินาที
            stopConductChime();
            stopThaiSpeech();

            // R1: ส่งเสียงเอฟเฟกต์ Chime สังเคราะห์ทันทีในเสี้ยววินาที (Zero Latency)
            playConductChime(type);

            // R2: คำนวณคะแนนสะสมล่วงหน้า (Optimistic Calculation) ทันที
            const isAdd = type === 'add';
            const accumulatedBefore = studentAccumulatedMap[selectedStudentId] ?? 0;
            const accumulatedPoints = Math.max(0, accumulatedBefore + (isAdd ? parsedScore : -parsedScore));

            // อัปเดตแคชคะแนนสะสมทันที
            setStudentAccumulatedMap(prev => ({ ...prev, [selectedStudentId]: accumulatedPoints }));

            // เปิดหน้าต่างยืนยันคะแนนทันที
            setPointsConfirmation({
                studentName: student.name,
                photoUrl: student.photo_url,
                latestPoints: parsedScore,
                accumulatedPoints,
                latestSign: isAdd ? '+' : '-',
            });
            setSpeechComplete(false);

            // R2: เริ่มเล่นเสียงพูดสรุปภาษาไทยทันทีแบบต่อเนื่องไม่สะดุด
            const speechRequest = ++speechRequestRef.current;
            const speechSummary = formatConductRecordSpeech(type, student.name, parsedScore, accumulatedPoints);

            // Safety watchdog timer คำนวณตามความยาวประโยค ป้องกันการตัดจบก่อนพูดจบ
            const safetyDuration = Math.max(7000, Math.ceil(speechSummary.length * 120));
            const safetyTimer = window.setTimeout(() => {
                if (speechRequest === speechRequestRef.current) setSpeechComplete(true);
            }, safetyDuration);

            void speakThai(speechSummary).then(({ spoken }) => {
                window.clearTimeout(safetyTimer);
                if (speechRequest !== speechRequestRef.current) return;
                if (spoken) setSpeechComplete(true);
                else window.setTimeout(() => {
                    if (speechRequest === speechRequestRef.current) setSpeechComplete(true);
                }, 1000);
            }).catch(() => {
                window.clearTimeout(safetyTimer);
                if (speechRequest === speechRequestRef.current) setSpeechComplete(true);
            });

            // ดำเนินการบันทึกลงฐานข้อมูลในเบื้องหลัง
            const insertRes = await conductService.insert({
                student_id: selectedStudentId,
                type,
                score: parsedScore,
                category: activeCategory,
                reason: reason.trim(),
                recorded_by: recorder.name || null,
                recorded_by_staff_id: recorder.staffId,
                recorded_by_administrator_id: recorder.administratorId,
                academic_year: academicYear,
                semester,
            });

            if (insertRes.error) {
                // คืนค่าเดิมเมื่อบันทึกไม่สำเร็จ พร้อมหยุดเสียงและปิดหน้าต่าง
                setStudentAccumulatedMap(prev => ({ ...prev, [selectedStudentId]: accumulatedBefore }));
                stopConductChime();
                stopThaiSpeech();
                setPointsConfirmation(null);
                toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: insertRes.error.message });
                return;
            }

            toast({
                title: type === 'add' ? '+ บวกคะแนนสำเร็จ' : '- หักคะแนนสำเร็จ',
                description: `${student.name} ${type === 'add' ? '+' : '-'}${parsedScore} คะแนน · ${reason}`,
            });

            setReason('');
            setScore('1');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
                {/* เลือกนักเรียน */}
                <Card>
                    <CardHeader><CardTitle className="text-base">เลือกนักเรียน</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label>ชั้น/ห้อง</Label>
                            <Select value={selectedClass || undefined} onValueChange={v => { setSelectedClass(v); setSelectedStudentId(''); }} disabled={isSaving}>
                                <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                                <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>นักเรียน</Label>
                            <Select value={selectedStudentId || undefined} onValueChange={setSelectedStudentId} disabled={isSaving || students.length === 0}>
                                <SelectTrigger><SelectValue placeholder={students.length === 0 ? 'เลือกชั้นก่อน' : 'เลือกนักเรียน'} /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            <div className="flex items-center gap-2">
                                                <PersonAvatar name={s.name} photoUrl={s.photo_url} size="xs" />
                                                <span>
                                                    {s.name}
                                                    {s.class_number ? ` (เลขที่ ${s.class_number})` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedStudentId && studentAccumulatedMap[selectedStudentId] !== undefined && (
                                <div className="flex items-center justify-between text-xs px-1 text-muted-foreground pt-0.5">
                                    <span>คะแนนสะสมปี {academicYear}:</span>
                                    <span className="font-semibold text-foreground">
                                        {studentAccumulatedMap[selectedStudentId]} คะแนน
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label>ภาคเรียน</Label>
                                <Select value={semester} onValueChange={setSemester} disabled={isSaving}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>ปีการศึกษา</Label>
                                <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} disabled={isSaving} />
                            </div>
                        </div>
                        <RecorderSelect label="ผู้บันทึก (ครู/ผอ.)" value={recorder} onChange={setRecorder} />
                    </CardContent>
                </Card>

                {/* บันทึกคะแนน */}
                <Card>
                    <CardHeader><CardTitle className="text-base">รายละเอียดคะแนน</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {/* ประเภท: บวก/หัก */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={type === 'add' ? 'default' : 'outline'}
                                className={`gap-1 ${type === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                onClick={() => { setType('add'); setCategory('publicMind'); setReason(''); }}
                                disabled={isSaving}
                            >
                                <Plus className="w-4 h-4" /> บวกคะแนน
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'deduct' ? 'default' : 'outline'}
                                className={`gap-1 ${type === 'deduct' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                onClick={() => { setType('deduct'); setCategory('discipline'); setReason(''); }}
                                disabled={isSaving}
                            >
                                <Minus className="w-4 h-4" /> หักคะแนน
                            </Button>
                        </div>

                        {/* หมวดหมู่ */}
                        <div className="space-y-1">
                            <Label>หมวดหมู่</Label>
                            <div className="flex flex-wrap gap-1">
                                {presets.map(p => {
                                    const isSelected = activeCategory === p.category;
                                    const meta = getCategoryMeta(p.category);
                                    return (
                                        <Badge
                                            key={p.category}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer transition-colors py-1 px-2.5",
                                                isSelected 
                                                    ? meta.color 
                                                    : 'border-muted-foreground/20 text-muted-foreground hover:bg-muted',
                                                isSaving && "opacity-50 pointer-events-none"
                                            )}
                                            onClick={() => !isSaving && setCategory(p.category)}
                                        >
                                            {meta.label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        {/* เหตุผลสำเร็จรูป */}
                        {categoryPreset && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">เหตุผลสำเร็จรูป — กดเพื่อเลือก</Label>
                                <div className="flex flex-wrap gap-1">
                                    {categoryPreset.reasons.map(r => (
                                        <Badge
                                            key={r}
                                            variant={reason === r ? 'default' : 'secondary'}
                                            className={cn(
                                                "cursor-pointer text-xs",
                                                isSaving && "opacity-50 pointer-events-none"
                                            )}
                                            onClick={() => !isSaving && setReason(r)}
                                        >
                                            {r}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* เหตุผล (กรอกเอง) */}
                        <div className="space-y-1">
                            <Label>เหตุผล *</Label>
                            <Textarea
                                placeholder="ระบุเหตุผล..."
                                rows={2}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>

                        {/* จำนวนคะแนน */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>จำนวนคะแนน</Label>
                                <span className="text-xs text-muted-foreground">คะแนนด่วน:</span>
                            </div>

                            {/* Quick score buttons [1, 2, 5, 10] */}
                            <div className="grid grid-cols-4 gap-1.5">
                                {QUICK_SCORES.map(q => {
                                    const isSelected = parsedScore === q && score.trim() === String(q);
                                    return (
                                        <Button
                                            key={q}
                                            type="button"
                                            variant={isSelected ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "h-9 font-bold transition-all text-xs sm:text-sm",
                                                isSelected
                                                    ? (type === 'add'
                                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm'
                                                        : 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm')
                                                    : 'hover:bg-muted text-foreground'
                                            )}
                                            onClick={() => setScore(String(q))}
                                            disabled={isSaving}
                                        >
                                            {type === 'add' ? `+${q}` : `-${q}`}
                                        </Button>
                                    );
                                })}
                            </div>

                            {/* Manual +/- and input */}
                            <div className="flex items-center gap-2 pt-0.5">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10 flex-shrink-0"
                                    onClick={() => setScore(s => {
                                        const cur = parseInt(s, 10);
                                        if (isNaN(cur) || cur <= 1) return '1';
                                        if (cur > 100) return '100';
                                        return String(cur - 1);
                                    })}
                                    disabled={isSaving}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <Input 
                                    type="number" 
                                    min={1} 
                                    max={100} 
                                    className="w-20 text-center font-bold text-base h-10" 
                                    value={score} 
                                    onChange={e => setScore(e.target.value)}
                                    onBlur={() => {
                                        const val = parseInt(score, 10);
                                        if (isNaN(val) || val < 1) setScore('1');
                                        else if (val > 100) setScore('100');
                                        else setScore(String(val));
                                    }}
                                    disabled={isSaving}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10 flex-shrink-0"
                                    onClick={() => setScore(s => {
                                        const cur = parseInt(s, 10);
                                        if (isNaN(cur) || cur < 1) return '1';
                                        if (cur >= 100) return '100';
                                        return String(cur + 1);
                                    })}
                                    disabled={isSaving}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground ml-1">คะแนน (1–100)</span>
                            </div>
                        </div>

                        <Button
                            className={`w-full gap-1 mt-2 ${type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleSave}
                            disabled={isSaving || !selectedStudentId}
                        >
                            {type === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            {isSaving ? 'กำลังบันทึก...' : `${type === 'add' ? 'บวก' : 'หัก'} ${parsedScore} คะแนน`}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <PointsConfirmationDialog
                confirmation={pointsConfirmation}
                title={`${pointsConfirmation?.latestSign === '-' ? 'หัก' : 'เพิ่ม'}คะแนนความดีสำเร็จ`}
                latestLabel="คะแนนความดีล่าสุด"
                accumulatedLabel="คะแนนความดีสะสม"
                speechComplete={speechComplete}
                onClose={closePointsConfirmation}
            />
        </div>
    );
}

// ===== Tab 2: อันดับธนาคารความดี =====
function LeaderboardTab() {
    const [filterClass, setFilterClass] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [records, setRecords] = useState<ConductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const { data } = await conductService.getAll(filterSemester, filterYear);
            setRecords((data || []) as ConductRecord[]);
            setIsLoading(false);
        };
        load();
    }, [filterSemester, filterYear]);

    // รวมคะแนนรายนักเรียน
    const leaderboard = useMemo(() => {
        const map: Record<string, { studentId: string; name: string; class: string; photoUrl: string | null; total: number; added: number; deducted: number }> = {};
        records.forEach(r => {
            if (!r.students) return;
            if (filterClass && r.students.class !== filterClass) return;
            if (!map[r.student_id]) {
                map[r.student_id] = { studentId: r.student_id, name: r.students.name, class: r.students.class, photoUrl: r.students.photo_url ?? null, total: 0, added: 0, deducted: 0 };
            }
            if (r.type === 'add') { map[r.student_id].total += r.score; map[r.student_id].added += r.score; }
            else { map[r.student_id].total -= r.score; map[r.student_id].deducted += r.score; }
        });
        return Object.values(map).sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            if (b.added !== a.added) return b.added - a.added;
            return a.name.localeCompare(b.name, 'th');
        });
    }, [records, filterClass]);

    return (
        <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-3">
                <Select value={filterClass || ALL} onValueChange={v => setFilterClass(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกชั้น</SelectItem>
                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                    </SelectContent>
                </Select>
                <Input className="w-28" value={filterYear} onChange={e => setFilterYear(e.target.value)} placeholder={currentYear} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        อันดับธนาคารความดี ({leaderboard.length} คน)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton rows={6} cols={4} className="py-4" />
                    ) : leaderboard.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูลธนาคารความดี</p>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((s, idx) => (
                                <div key={s.studentId} className={`flex items-center gap-3 p-3 rounded-lg border ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : idx === 1 ? 'bg-gray-50 border-gray-200' : idx === 2 ? 'bg-amber-50 border-amber-200' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {idx + 1}
                                    </div>
                                    <PersonAvatar name={s.name} photoUrl={s.photoUrl} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.class}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-lg font-bold ${s.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {s.total >= 0 ? '+' : ''}{s.total}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="text-green-600">+{s.added}</span>
                                            {' / '}
                                            <span className="text-red-500">-{s.deducted}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ===== Tab 3: ประวัติคะแนน =====
function HistoryTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [filterClass, setFilterClass] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [searchName, setSearchName] = useState('');
    const [records, setRecords] = useState<ConductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        let q = conductService.getAll(filterSemester, filterYear);
        if (filterType) q = q.eq('type', filterType);
        const { data } = await q;
        setRecords((data || []) as ConductRecord[]);
        setIsLoading(false);
    }, [filterSemester, filterYear, filterType]);

    useEffect(() => { load(); }, [load]);

    const filteredRecords = useMemo(() => {
        let result = records;
        if (filterClass) result = result.filter(r => r.students?.class === filterClass);
        if (searchName) {
            const normSearch = searchName.toLowerCase().trim();
            result = result.filter(r => (r.students?.name || '').toLowerCase().includes(normSearch));
        }
        return result;
    }, [records, filterClass, searchName]);

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await conductService.delete(deleteId);
        if (error) toast({ variant: 'destructive', title: 'ลบไม่สำเร็จ' });
        else { toast({ title: 'ลบรายการสำเร็จ' }); load(); }
        setDeleteId(null);
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-3">
                <Select value={filterClass || ALL} onValueChange={v => setFilterClass(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกชั้น</SelectItem>
                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType || ALL} onValueChange={v => setFilterType(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="ทุกประเภท" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกประเภท</SelectItem>
                        <SelectItem value="add">บวกคะแนน</SelectItem>
                        <SelectItem value="deduct">หักคะแนน</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                    </SelectContent>
                </Select>
                <Input className="w-24" value={filterYear} onChange={e => setFilterYear(e.target.value)} placeholder={currentYear} />
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="ค้นหาชื่อ..." value={searchName} onChange={e => setSearchName(e.target.value)} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">ประวัติการบันทึก ({filteredRecords.length} รายการ)</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton rows={6} cols={4} className="py-4" />
                    ) : filteredRecords.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</p>
                    ) : (
                        <div className="space-y-2">
                            {filteredRecords.map(r => (
                                <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${r.type === 'add' ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${r.type === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {r.type === 'add' ? `+${r.score}` : `-${r.score}`}
                                    </div>
                                    <PersonAvatar name={r.students?.name ?? '—'} photoUrl={r.students?.photo_url} size="sm" className="flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{r.students?.name ?? '—'}</span>
                                            <Badge variant="outline" className="text-xs">{r.students?.class}</Badge>
                                            {(() => {
                                                const meta = getCategoryMeta(r.category);
                                                return (
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn("text-xs font-medium", meta.color)}
                                                    >
                                                        {meta.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-sm mt-0.5">{r.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {r.recorded_by && `บันทึกโดย ${r.recorded_by} · `}
                                            {new Date(r.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="flex-shrink-0" onClick={() => setDeleteId(r.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="ลบรายการคะแนนนี้?"
                description="รายการที่ลบแล้วจะไม่สามารถกู้คืนได้"
            />
        </div>
    );
}

// ===== Tab Bulk: บันทึกคะแนนหลายคนพร้อมกัน =====
function BulkRecordTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [category, setCategory] = useState('publicMind');
    const [reason, setReason] = useState('');
    const [score, setScore] = useState('1');
    const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
    const [semester, setSemester] = useState('1');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    useEffect(() => {
        setStudents([]);
        setSelectedIds(new Set());
        if (!selectedClass) return;

        let active = true;
        setIsLoadingStudents(true);
        studentsService.getByClass(selectedClass).then(({ data }) => {
            if (!active) return;
            setStudents((data || []) as Student[]);
            setIsLoadingStudents(false);
        });

        return () => {
            active = false;
        };
    }, [selectedClass]);

    useEffect(() => {
        return () => {
            stopConductChime();
            stopThaiSpeech();
        };
    }, []);

    const toggleStudent = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allSelected = students.length > 0 && selectedIds.size === students.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < students.length;

    const toggleAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(students.map(s => s.id)));
    };

    const parsedScore = Math.max(1, Math.min(100, parseInt(score, 10) || 1));
    const activeCategory = category || (type === 'add' ? 'publicMind' : 'discipline');
    const presets = PRESET_REASONS[type];
    const categoryPreset = presets.find(p => p.category === activeCategory);

    const handleBulkSave = async () => {
        if (isSaving) return;
        const currentStudentIds = new Set(students.map(s => s.id));
        const validSelectedIds = Array.from(selectedIds).filter(id => currentStudentIds.has(id));

        if (validSelectedIds.length === 0) {
            toast({ variant: 'destructive', title: 'กรุณาเลือกนักเรียนอย่างน้อย 1 คน' });
            return;
        }
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'กรุณาระบุเหตุผล' });
            return;
        }

        // หยุดเสียงสังเคราะห์หรือเสียงพูดก่อนหน้าทันทีเพื่อให้ตอบสนองใน 0 วินาที
        stopConductChime();
        stopThaiSpeech();

        // R1: ส่งเสียงเอฟเฟกต์ Chime สังเคราะห์ทันทีในเสี้ยววินาที (Zero Latency)
        playConductChime(type);

        // R2: เริ่มเล่นเสียงสรุปภาษาไทยทันทีเมื่อกดบันทึก
        const bulkSpeech = formatConductBulkSpeech(type, validSelectedIds.length, parsedScore);
        void speakThai(bulkSpeech);

        const records = validSelectedIds.map(student_id => ({
            student_id,
            type,
            score: parsedScore,
            category: activeCategory,
            reason: reason.trim(),
            recorded_by: recorder.name || null,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
            academic_year: academicYear,
            semester,
        }));
        setIsSaving(true);
        try {
            const { error } = await conductService.insertBulk(records);
            if (error) {
                stopConductChime();
                stopThaiSpeech();
                toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: error.message });
                return;
            }
            toast({
                title: `${type === 'add' ? '+ บวก' : '− หัก'}คะแนนสำเร็จ`,
                description: `${validSelectedIds.length} คน · ${parsedScore} คะแนน · ${reason}`,
            });
            // reset selection + reason; keep class/type/category for quick re-use
            setSelectedIds(new Set());
            setReason('');
            setScore('1');
        } finally {
            setIsSaving(false);
        }
    };

    const saveLabel = selectedIds.size === 0
        ? 'เลือกนักเรียนก่อน'
        : `${type === 'add' ? 'บวก' : 'หัก'} ${parsedScore} คะแนน · ${selectedIds.size} คน`;

    const saveBtnClass = type === 'add'
        ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
        : 'bg-red-600 hover:bg-red-700 active:bg-red-800';

    return (
        /* Mobile: single column + sticky save bar
           Desktop (md+): 2-column side-by-side, save button inside Step-2 card */
        <div className="pt-4 pb-28 md:pb-4">
            <div className="grid md:grid-cols-2 md:items-start gap-4">

            {/* ──────────── ขั้นที่ 1: เลือกนักเรียน ──────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                        เลือกนักเรียน
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* ชั้น + ภาคเรียน */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label>ชั้น/ห้อง *</Label>
                            <Select value={selectedClass || undefined} onValueChange={setSelectedClass} disabled={isSaving}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="เลือกชั้น" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ภาคเรียน</Label>
                            <Select value={semester} onValueChange={setSemester} disabled={isSaving}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">ภาคเรียน 1</SelectItem>
                                    <SelectItem value="2">ภาคเรียน 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* รายชื่อนักเรียน */}
                    {selectedClass && (
                        <div className="space-y-2">
                            {/* Select-all bar — full-width tappable */}
                            <button
                                type="button"
                                onClick={toggleAll}
                                disabled={isSaving}
                                className={cn(
                                    "w-full flex items-center justify-between bg-muted/60 hover:bg-muted active:bg-muted rounded-xl px-4 py-3 transition-colors",
                                    isSaving && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Custom checkbox */}
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        allSelected ? 'bg-primary border-primary' : someSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/50'
                                    }`}>
                                        {allSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                                        {someSelected && <div className="w-2.5 h-0.5 bg-primary rounded" />}
                                    </div>
                                    <span className="font-semibold text-sm">เลือกทั้งห้อง</span>
                                </div>
                                <Badge variant={selectedIds.size > 0 ? 'default' : 'secondary'} className="text-sm font-bold">
                                    {selectedIds.size} / {students.length} คน
                                </Badge>
                            </button>

                            {/* Student rows */}
                            {isLoadingStudents ? (
                                <TableSkeleton rows={5} cols={2} className="py-2" />
                            ) : students.length === 0 ? (
                                <p className="text-center py-6 text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นนี้</p>
                            ) : (
                                <div className="divide-y rounded-xl border overflow-hidden">
                                    {students.map(s => {
                                        const isSelected = selectedIds.has(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => toggleStudent(s.id)}
                                                disabled={isSaving}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                                                    isSelected ? 'bg-primary/10' : 'bg-background hover:bg-muted/40',
                                                    isSaving && "opacity-60 cursor-not-allowed"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected ? 'bg-primary border-primary scale-110' : 'border-muted-foreground/40'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                                                </div>
                                                {/* Avatar */}
                                                <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                                                {/* Name + class number */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                                                        {s.name}
                                                    </p>
                                                    {s.class_number && (
                                                        <p className="text-xs text-muted-foreground">เลขที่ {s.class_number}</p>
                                                    )}
                                                </div>
                                                {/* Gender dot */}
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                                    s.gender === 'male' ? 'bg-blue-400' : 'bg-amber-400'
                                                }`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ──────────── ขั้นที่ 2: รายละเอียดคะแนน ──────────── */}
            {/* md:sticky md:top-4 — stays in view while scrolling the student list */}
            <Card className="md:sticky md:top-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                        รายละเอียดคะแนน
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* บวก / หัก */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant={type === 'add' ? 'default' : 'outline'}
                            className={`h-12 gap-2 text-base font-semibold ${
                                type === 'add'
                                    ? 'bg-green-600 hover:bg-green-700 border-green-600'
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                            onClick={() => { setType('add'); setCategory('publicMind'); setReason(''); }}
                            disabled={isSaving}
                        >
                            <Plus className="w-5 h-5" /> บวกคะแนน
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'deduct' ? 'default' : 'outline'}
                            className={`h-12 gap-2 text-base font-semibold ${
                                type === 'deduct'
                                    ? 'bg-red-600 hover:bg-red-700 border-red-600'
                                    : 'border-red-300 text-red-700 hover:bg-red-50'
                            }`}
                            onClick={() => { setType('deduct'); setCategory('discipline'); setReason(''); }}
                            disabled={isSaving}
                        >
                            <Minus className="w-5 h-5" /> หักคะแนน
                        </Button>
                    </div>

                    {/* หมวดหมู่ */}
                    <div className="space-y-2">
                        <Label>หมวดหมู่</Label>
                        <div className="flex flex-wrap gap-2">
                            {presets.map(p => {
                                const isSelected = activeCategory === p.category;
                                const meta = getCategoryMeta(p.category);
                                return (
                                    <Badge
                                        key={p.category}
                                        variant="outline"
                                        className={cn(
                                            "cursor-pointer transition-colors py-1.5 px-3 text-sm",
                                            isSelected 
                                                ? meta.color 
                                                : 'border-muted-foreground/20 text-muted-foreground hover:bg-muted',
                                            isSaving && "opacity-50 pointer-events-none"
                                        )}
                                        onClick={() => !isSaving && setCategory(p.category)}
                                    >
                                        {meta.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    {/* เหตุผลสำเร็จรูป */}
                    {categoryPreset && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">เหตุผลสำเร็จรูป — กดเพื่อเลือก</Label>
                            <div className="flex flex-wrap gap-2">
                                {categoryPreset.reasons.map(r => (
                                    <Badge
                                        key={r}
                                        variant={reason === r ? 'default' : 'secondary'}
                                        className={cn(
                                            "cursor-pointer py-1.5 px-3 text-sm",
                                            isSaving && "opacity-50 pointer-events-none"
                                        )}
                                        onClick={() => !isSaving && setReason(r)}
                                    >
                                        {r}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* เหตุผล (กรอกเอง) */}
                    <div className="space-y-1">
                        <Label>เหตุผล *</Label>
                        <Textarea
                            placeholder="ระบุเหตุผล..."
                            rows={2}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="text-base resize-none"
                            disabled={isSaving}
                        />
                    </div>

                    {/* จำนวนคะแนน — large tap targets */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>จำนวนคะแนน</Label>
                            <span className="text-xs text-muted-foreground">คะแนนด่วน:</span>
                        </div>

                        {/* Quick score buttons [1, 2, 5, 10] */}
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_SCORES.map(q => {
                                const isSelected = parsedScore === q && score.trim() === String(q);
                                return (
                                    <Button
                                        key={q}
                                        type="button"
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={cn(
                                            "h-11 font-bold text-base transition-all",
                                            isSelected
                                                ? (type === 'add'
                                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm'
                                                    : 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm')
                                                : 'hover:bg-muted text-foreground'
                                        )}
                                        onClick={() => setScore(String(q))}
                                        disabled={isSaving}
                                    >
                                        {type === 'add' ? `+${q}` : `-${q}`}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Manual +/- and input */}
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                type="button" variant="outline" size="icon"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => setScore(s => {
                                    const cur = parseInt(s, 10);
                                    if (isNaN(cur) || cur <= 1) return '1';
                                    if (cur > 100) return '100';
                                    return String(cur - 1);
                                })}
                                disabled={isSaving}
                            >
                                <Minus className="w-5 h-5" />
                            </Button>
                            <Input
                                type="number" min={1} max={100}
                                className="h-12 text-center text-xl font-bold w-24"
                                value={score}
                                onChange={e => setScore(e.target.value)}
                                onBlur={() => {
                                    const val = parseInt(score, 10);
                                    if (isNaN(val) || val < 1) setScore('1');
                                    else if (val > 100) setScore('100');
                                    else setScore(String(val));
                                }}
                                disabled={isSaving}
                            />
                            <Button
                                type="button" variant="outline" size="icon"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => setScore(s => {
                                    const cur = parseInt(s, 10);
                                    if (isNaN(cur) || cur < 1) return '1';
                                    if (cur >= 100) return '100';
                                    return String(cur + 1);
                                })}
                                disabled={isSaving}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                            <span className="text-sm text-muted-foreground">คะแนน (1–100)</span>
                        </div>
                    </div>

                    {/* ผู้บันทึก */}
                    <RecorderSelect label="ผู้บันทึก (ครู/ผอ.)" value={recorder} onChange={setRecorder} />

                    {/* ปีการศึกษา */}
                    <div className="space-y-1">
                        <Label>ปีการศึกษา</Label>
                        <Input className="max-w-xs" value={academicYear} onChange={e => setAcademicYear(e.target.value)} disabled={isSaving} />
                    </div>

                    {/* Desktop: save button inside card */}
                    <Button
                        className={`w-full h-12 text-base gap-2 font-semibold hidden md:flex ${saveBtnClass}`}
                        onClick={handleBulkSave}
                        disabled={isSaving || isLoadingStudents || selectedIds.size === 0}
                    >
                        {type === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        {isSaving ? 'กำลังบันทึก...' : saveLabel}
                    </Button>
                </CardContent>
            </Card>

            {/* ──────── Mobile sticky save bar (hidden on md+) ──────── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t p-3">
                <Button
                    className={`w-full h-14 text-base gap-2 font-semibold rounded-xl ${saveBtnClass}`}
                    onClick={handleBulkSave}
                    disabled={isSaving || isLoadingStudents || selectedIds.size === 0}
                >
                    {isSaving ? (
                        'กำลังบันทึก...'
                    ) : (
                        <>
                            {type === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                            {saveLabel}
                        </>
                    )}
                </Button>
            </div>
        </div>
    </div>
);
}
