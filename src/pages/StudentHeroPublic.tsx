import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Sparkles, Award, Lock, Shield, 
  Check, ArrowRight, Heart, BookOpen, Clock, 
  UserCheck, Flame, Star, Target, RefreshCw, 
  Smile, AlertCircle, X, Zap, Search, ArrowLeft, Share2, QrCode, Download, HeartHandshake,
  ChevronLeft, ChevronRight, Crown, Medal
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { conductService, studentsService } from '@/services';
import { calculateHeroLevel, type ConductRecord } from '@/services/conduct.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { cn } from '@/lib/utils';

// ─── Virtue style map (Light-mode only — strict contrast) ───
const VIRTUE_METRICS = {
  publicMind: { 
    label: 'จิตสาธารณะ 🌱', 
    accentBorder: 'border-l-emerald-500', 
    badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    gradient: 'from-emerald-400 to-teal-500',
    feedback: 'ความดีด้านจิตสาธารณะของหนู ช่วยให้โรงเรียนและเพื่อนๆ มีสิ่งแวดล้อมที่น่าอยู่และน่าเรียนรู้ยิ่งขึ้น 🌱'
  },
  responsibility: { 
    label: 'ความรับผิดชอบ 📘', 
    accentBorder: 'border-l-blue-500', 
    badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300',
    gradient: 'from-blue-400 to-indigo-500',
    feedback: 'ความรับผิดชอบและการทำหน้าที่ของหนูอย่างเต็มความสามารถ เป็นเรื่องที่น่ายกย่องและเป็นแบบอย่างที่ดีเยี่ยม 📘'
  },
  discipline: { 
    label: 'วินัย ⏰', 
    accentBorder: 'border-l-purple-500', 
    badgeBg: 'bg-purple-100 text-purple-900 border border-purple-300',
    gradient: 'from-purple-400 to-pink-500',
    feedback: 'ความมีระเบียบวินัยและการตรงต่อเวลาของหนู เป็นรากฐานสำคัญของผู้นำที่ดีในอนาคต ⏰'
  },
  honesty: { 
    label: 'ซื่อสัตย์ 🤝', 
    accentBorder: 'border-l-amber-500', 
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
    gradient: 'from-amber-400 to-orange-500',
    feedback: 'ความซื่อสัตย์สุจริตของหนูเป็นเรื่องที่ประเสริฐสุด นำพาความเชื่อมั่นและเกียรติยศที่น่าภูมิใจมาสู่ตนเอง 🤝'
  },
  kindness: { 
    label: 'น้ำใจ ❤️', 
    accentBorder: 'border-l-pink-500', 
    badgeBg: 'bg-pink-100 text-pink-900 border border-pink-300',
    gradient: 'from-pink-400 to-rose-500',
    feedback: 'ความมีน้ำใจและการช่วยเหลือแบ่งปันของหนู เติมเต็มรอยยิ้มและความอบอุ่นให้สังคมรอบตัวมีความสุข ❤️'
  },
};

const LEVELS_INFO = [
  { level: 1, title: 'เมล็ดพันธุ์แห่งความดี 🌱', desc: 'เริ่มต้นก้าวแรกของการสะสมพลังความดีในโรงเรียน' },
  { level: 2, title: 'ผู้ช่วยตัวน้อย 🤝', desc: 'เริ่มช่วยเหลือคุณครูและเพื่อนร่วมห้องด้วยความสมัครใจ' },
  { level: 3, title: 'ฮีโร่ประจำห้อง ⭐', desc: 'เป็นแบบอย่างที่ดีและได้รับการไว้วางใจจากคุณครูประจำชั้น' },
  { level: 4, title: 'ผู้พิทักษ์โรงเรียน 🛡️', desc: 'สร้างคุณงามความดีให้กับโรงเรียนในภาพรวมอย่างโดดเด่น' },
  { level: 5, title: 'ต้นแบบแห่งความดี 👑', desc: 'ระดับสูงสุดของการอุทิศตนเพื่อคุณธรรมความดีและแบบอย่างผู้นำ' }
];

// ─── Rank badge color helper ───
const rankMedalStyle = (rank: number): { bg: string; text: string; ring: string } => {
  if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: 'text-slate-900', ring: 'ring-yellow-300' };
  if (rank === 2) return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-slate-900', ring: 'ring-slate-300' };
  if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', text: 'text-white', ring: 'ring-amber-400' };
  return { bg: 'bg-gradient-to-br from-primary/80 to-primary', text: 'text-white', ring: 'ring-primary/40' };
};

type TopHeroRow = {
  studentId: string;
  name: string;
  class: string;
  photoUrl: string | null;
  total: number;
  count: number;
};

// ════════════════════════════════════════════════════════════
//  TOP HERO CAROUSEL  (อันดับ 1-10 สลับอัตโนมัติ)
// ════════════════════════════════════════════════════════════
function TopHeroCarousel({ heroes, onSelect }: { heroes: TopHeroRow[]; onSelect: (id: string) => void }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const INTERVAL_MS = 4500;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (heroes.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent(p => (p + 1) % heroes.length);
    }, INTERVAL_MS);
  }, [heroes.length]);

  useEffect(() => {
    if (!paused) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, startTimer]);

  const go = (dir: 1 | -1) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(p => (p + dir + heroes.length) % heroes.length);
    if (!paused) startTimer();
  };

  if (heroes.length === 0) return null;

  const hero = heroes[current];
  const rank = current + 1;
  const levelInfo = calculateHeroLevel(hero.total);
  const medal = rankMedalStyle(rank);

  return (
    <div
      className="w-full rounded-3xl overflow-hidden relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Dark cinematic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 z-0" />

      {/* Decorative glow orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* Header label */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-[11px] font-black text-yellow-400/90 uppercase tracking-widest">Kampai Hero Showcase</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          {current + 1} / {heroes.length}
        </span>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center px-5 pb-5 pt-2 gap-4"
        >
          {/* Rank badge + avatar */}
          <div className="relative mt-1">
            {/* Glow ring */}
            <div className={cn(
              'absolute -inset-3 rounded-full blur-xl opacity-60',
              rank === 1 ? 'bg-yellow-400/50' : rank === 2 ? 'bg-slate-300/30' : rank === 3 ? 'bg-amber-600/40' : 'bg-primary/30'
            )} />
            {/* Avatar ring */}
            <div className={cn('relative rounded-full p-[3px] ring-4', medal.ring,
              rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-500'
              : rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400'
              : rank === 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-gradient-to-br from-primary/60 to-primary'
            )}>
              <div className="rounded-full overflow-hidden w-24 h-24 border-2 border-slate-900">
                {hero.photoUrl ? (
                  <img src={hero.photoUrl} alt={hero.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-2xl font-black">
                    {hero.name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง)\s*/, '').slice(0, 2)}
                  </div>
                )}
              </div>
            </div>
            {/* Floating rank badge */}
            <div className={cn(
              'absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 border-slate-900 shadow-lg z-10',
              medal.bg, medal.text
            )}>
              {rank}
            </div>
          </div>

          {/* Name & class */}
          <div className="text-center space-y-1">
            <p className="text-white font-black text-xl leading-tight tracking-tight">{hero.name}</p>
            <p className="text-slate-400 text-xs font-semibold">ห้องเรียน {hero.class}</p>
          </div>

          {/* XP + title badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 px-3 py-1 rounded-full text-xs font-black">
              <Trophy className="w-3.5 h-3.5" />
              {hero.total} Hero XP
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-slate-200 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              {levelInfo.title}
            </span>
          </div>

          {/* CTA button */}
          <button
            onClick={() => onSelect(hero.studentId)}
            className="w-full max-w-[280px] h-11 rounded-2xl font-black text-sm bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 hover:from-yellow-300 hover:to-amber-400 transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Zap className="w-4 h-4" />
            ดูประวัติฮีโร่ความดี
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next buttons */}
      {heroes.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="ก่อนหน้า"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="ถัดไป"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {heroes.length > 1 && (
        <div className="relative z-10 flex justify-center gap-1.5 pb-4">
          {heroes.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setCurrent(i); if (!paused) startTimer(); }}
              aria-label={`ไปยังอันดับที่ ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current ? 'bg-yellow-400 w-5 h-2' : 'bg-white/30 hover:bg-white/50 w-2 h-2'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentHeroPublic() {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(studentId || null);
  const [showCertDialog, setShowCertDialog] = useState(false);

  // Sync state if URL param changes
  useEffect(() => {
    if (studentId) {
      setSelectedStudentId(studentId);
    } else {
      setSelectedStudentId(null);
    }
  }, [studentId]);

  // 1. Fetch Student Info if ID selected
  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['public-student', selectedStudentId],
    enabled: !!selectedStudentId,
    queryFn: async () => {
      const { data, error } = await studentsService.getById(selectedStudentId!);
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Hero Profile calculation if ID selected
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['public-hero-profile', selectedStudentId],
    enabled: !!selectedStudentId,
    queryFn: async () => {
      return await conductService.getHeroProfile(selectedStudentId!);
    }
  });

  // 3. Fetch Classroom Goal synergy
  const { data: classGoal } = useQuery({
    queryKey: ['public-class-goal', student?.class, student?.room],
    enabled: !!student?.class,
    queryFn: async () => {
      const roomName = student.room || '';
      return await conductService.getClassroomGoal(student.class, roomName);
    }
  });

  // 4. Fetch Classroom XP Sum for synergy percent
  const { data: classXp = 0 } = useQuery({
    queryKey: ['public-class-xp-sum', student?.class, student?.room],
    enabled: !!student?.class,
    queryFn: async () => {
      const roomName = student.room || '';
      return await conductService.getClassroomXpSum(student.class, roomName);
    }
  });

  // 5. Fetch Top-10 Heroes for Carousel (always loaded on search page)
  const { data: topHeroes = [] } = useQuery<TopHeroRow[]>({
    queryKey: ['public-top-heroes'],
    staleTime: 5 * 60 * 1000, // 5 min cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conduct_scores')
        .select('student_id, score, type, students(id, name, class, photo_url)')
        .eq('type', 'add');
      if (error) throw error;
      if (!data) return [];

      const map = new Map<string, TopHeroRow>();
      (data as any[]).forEach((r) => {
        const stu = r.students;
        if (!stu) return;
        const cur = map.get(r.student_id) ?? {
          studentId: r.student_id,
          name: stu.name,
          class: stu.class,
          photoUrl: stu.photo_url ?? null,
          total: 0,
          count: 0,
        };
        cur.total += r.score;
        cur.count += 1;
        map.set(r.student_id, cur);
      });

      return Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
  });

  // Handle Lookup by Student Code
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', searchCode.trim())
        .maybeSingle();

      if (error) throw error;

      if (data?.id) {
        toast({
          title: 'ค้นหาสำเร็จ 🎉',
          description: 'พบประวัติฮีโร่ความดีของนักเรียนแล้ว'
        });
        navigate(`/hero/${data.id}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'ไม่พบรหัสนักเรียน',
          description: 'กรุณาตรวจสอบรหัสประจำตัวนักเรียนและลองใหม่อีกครั้ง'
        });
      }
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการค้นหา',
        description: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Determine highest virtue for bubble feedback
  const highestVirtueInfo = useMemo(() => {
    if (!profile?.virtues) return null;
    const virtues = profile.virtues;
    let highestKey: keyof typeof virtues = 'publicMind';
    let highestVal = -1;

    Object.entries(virtues).forEach(([key, val]) => {
      if (val > highestVal) {
        highestVal = val;
        highestKey = key as keyof typeof virtues;
      }
    });

    return {
      key: highestKey,
      val: highestVal,
      meta: VIRTUE_METRICS[highestKey]
    };
  }, [profile]);

  // Dynamic Radar Chart Calculation
  const radarData = useMemo(() => {
    if (!profile?.virtues) return [];
    const values = Object.values(profile.virtues);
    const maxVal = Math.max(...values, 10);
    return [
      { name: 'จิตสาธารณะ 🌱', score: profile.virtues.publicMind, fullMark: maxVal },
      { name: 'ความรับผิดชอบ 📘', score: profile.virtues.responsibility, fullMark: maxVal },
      { name: 'วินัย ⏰', score: profile.virtues.discipline, fullMark: maxVal },
      { name: 'ซื่อสัตย์ 🤝', score: profile.virtues.honesty, fullMark: maxVal },
      { name: 'น้ำใจ ❤️', score: profile.virtues.kindness, fullMark: maxVal },
    ];
  }, [profile]);

  const maxVirtueScore = useMemo(() => {
    if (!profile?.virtues) return 10;
    return Math.max(...Object.values(profile.virtues), 10);
  }, [profile]);

  // Classroom synergy math
  const synergyContributionPercent = useMemo(() => {
    if (!profile || classXp <= 0) return 0;
    return Math.min(100, Math.round((profile.totalXp / classXp) * 100));
  }, [profile, classXp]);

  const isLoading = isStudentLoading || isProfileLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sarabun antialiased">
      <SEOHead 
        title={student ? `Kampai Hero: ${student.name}` : "Kampai Hero System - ตรวจสอบพลังความดีฮีโร่"} 
        description="ดึงพลังความดีฮีโร่นักเรียนเดี่ยวแบบ 3 บล็อกโชว์เด่น เพิ่มความภูมิใจและชูหอเกียรติยศคนดีโรงเรียนคำไผ่" 
      />
      <SiteHeader />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          
          {/* ════════════════════════════════════════════════════════════
              1. SEARCH INTERFACE (If no student is selected/loaded)
             ════════════════════════════════════════════════════════════ */}
          {!selectedStudentId ? (
            <motion.div
              key="search-box"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-md mx-auto my-8 space-y-5"
            >
              {/* ══════════════════════════════════════════
                  TOP 10 HERO CAROUSEL
                 ══════════════════════════════════════════ */}
              {topHeroes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-center">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                      10 อันดับฮีโร่ความดีแห่งปี
                    </p>
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <TopHeroCarousel
                    heroes={topHeroes}
                    onSelect={(id) => navigate(`/hero/${id}`)}
                  />
                </div>
              )}
              <Card className="border border-slate-200 shadow-xl overflow-hidden bg-white rounded-3xl">
                <div className="bg-gradient-to-br from-primary via-primary-light to-primary-deep text-primary-foreground p-8 text-center relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
                  
                  <div className="inline-flex items-center justify-center p-3.5 bg-white/15 rounded-full border border-white/20 shadow-inner mb-4 animate-bounce">
                    <Trophy className="w-8 h-8 text-yellow-300" />
                  </div>
                  
                  <h1 className="text-2xl font-black tracking-tight">Kampai Hero System</h1>
                  <p className="text-xs text-primary-foreground/80 mt-1.5 font-medium leading-relaxed">
                    ตรวจสอบประวัติความประพฤติ เกียรติยศความดี <br />
                    และพลังฮีโร่ 5 มิติ ของนักเรียนคนดีบ้านคำไผ่
                  </p>
                </div>
                
                <CardContent className="p-8 space-y-5">
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="student-code" className="text-xs font-black text-slate-700">
                        รหัสประจำตัวนักเรียน
                      </Label>
                      <div className="relative">
                        <Input
                          id="student-code"
                          type="text"
                          placeholder="กรุณากรอกรหัสนักเรียน (เช่น 12345)"
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value)}
                          className="pl-10 h-12 rounded-2xl border-slate-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 text-slate-800 font-bold"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSearching}
                      className="w-full h-12 rounded-2xl font-black bg-primary hover:bg-primary-deep text-white shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          กำลังตรวจสอบประวัติ...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                          เปิดดูหน้าประวัติฮีโร่
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : isLoading ? (
            
            // ─── Loading State ───
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[450px] gap-3"
            >
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              <p className="text-slate-600 text-sm font-semibold animate-pulse">
                กำลังดึงประวัติความประพฤติและวิเคราะห์มิติฮีโร่...
              </p>
            </motion.div>
          ) : !student || !profile ? (
            
            // ─── Error State ───
            <motion.div
              key="error-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto my-12"
            >
              <Card className="border-dashed border-2 border-slate-300 p-8 text-center rounded-3xl bg-white space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-slate-800">ไม่พบประวัติฮีโร่ของคุณธรรม</h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                  อาจยังไม่พบข้อมูลคะแนนของนักเรียน หรือนักเรียนคนนี้ยังไม่ได้รับการบันทึกคะแนนสะสมพลังความดีในระบบ
                </p>
                <Button 
                  onClick={() => navigate('/hero')} 
                  variant="outline" 
                  className="rounded-xl font-bold flex items-center justify-center gap-1.5 mx-auto text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปค้นหา
                </Button>
              </Card>
            </motion.div>
          ) : (
            
            // ════════════════════════════════════════════════════════════
            // 2. HERO SHOWCASE LAYOUT (3 columns: Left - Center - Right)
            // ════════════════════════════════════════════════════════════
            <motion.div
              key="hero-showcase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              {/* Back to search action bar */}
              <div className="flex items-center justify-between pb-2">
                <Button 
                  onClick={() => navigate('/hero')} 
                  variant="ghost" 
                  className="rounded-xl font-bold flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปหน้าค้นหา
                </Button>
                <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
                  Kampai School Proudly Presents
                </span>
              </div>

              {/* 3-Column Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ──────────────────────────────────────────────────────────
                    LEFT BLOCK: Progress & Score (lg:col-span-3)
                   ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Card 1: Level Progression Timeline */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-transparent">
                      <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        พัฒนาการความเติบโต
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        เส้นทางการเดินทางของพลังความดี
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Timeline steps */}
                      <div className="relative pl-5 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                        {LEVELS_INFO.map((step) => {
                          const isReached = profile.level >= step.level;
                          const isCurrent = profile.level === step.level;
                          
                          return (
                            <div key={step.level} className="relative group">
                              {/* Step circle */}
                              <div className={cn(
                                "absolute -left-[23px] top-1.5 w-[12px] h-[12px] rounded-full border-2 transition-all duration-300",
                                isCurrent 
                                  ? "bg-yellow-400 border-yellow-500 scale-125 ring-2 ring-yellow-300" 
                                  : isReached 
                                    ? "bg-primary border-primary" 
                                    : "bg-white border-slate-300"
                              )} />
                              
                              <div className="space-y-0.5">
                                <h4 className={cn(
                                  "text-xs font-black",
                                  isCurrent 
                                    ? "text-yellow-600" 
                                    : isReached 
                                      ? "text-slate-800" 
                                      : "text-slate-400"
                                )}>
                                  LV.{step.level} {step.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* XP Progress Slider */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-[11px] font-black text-slate-600">
                          <span>ความก้าวหน้าเลเวล</span>
                          <span className="text-primary">
                            {profile.xpNeededForNextLevel > 0 
                              ? `${profile.xpInLevel}/${profile.xpNeededForNextLevel} XP`
                              : 'สูงสุดระดับแบบอย่าง 🏆'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000"
                            style={{ width: `${profile.progressPercent}%` }}
                          />
                        </div>
                        {profile.xpNeededForNextLevel > 0 && (
                          <p className="text-[9px] text-slate-500 text-center">
                            ต้องการอีก <span className="font-extrabold text-slate-700">{profile.xpNeededForNextLevel - profile.xpInLevel} XP</span> เพื่อเลื่อนระดับถัดไป
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Micro-bars Virtue Metrics */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-transparent">
                      <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
                        สถิติพลังความดีเดี่ยว
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        คะแนนสะสมแยกประเภทความประพฤติ
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(profile.virtues).map(([key, val]) => {
                        const metric = VIRTUE_METRICS[key as keyof typeof VIRTUE_METRICS];
                        if (!metric) return null;
                        const ratio = maxVirtueScore > 0 ? (val / maxVirtueScore) * 100 : 0;
                        
                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-slate-700">{metric.label}</span>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-md", metric.badgeBg)}>
                                {val} XP
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                              <motion.div 
                                className={cn("h-full bg-gradient-to-r rounded-full", metric.gradient)}
                                initial={{ width: 0 }}
                                animate={{ width: `${ratio}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* ──────────────────────────────────────────────────────────
                    CENTER BLOCK: Pride & Radar Chart (lg:col-span-6)
                   ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Card 3: Main Profile Showcase Frame */}
                  <Card className="border border-slate-200 shadow-lg rounded-3xl overflow-hidden bg-white relative">
                    
                    {/* Golden decorative bar top */}
                    <div className="h-2 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary-deep" />

                    <div className="p-6 md:p-8 space-y-6 flex flex-col items-center">
                      
                      {/* Avatar Frame - Glowing Premium Champion look */}
                      <div className="relative group pt-4">
                        {/* Glow backdrops */}
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 opacity-75 blur-md animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
                        <div className="relative bg-slate-900 p-2 rounded-full border border-white/20">
                          <PersonAvatar 
                            name={student.name} 
                            photoUrl={student.photo_url} 
                            size="lg" 
                            className="h-28 w-28 border-4 border-yellow-400/90 shadow-inner rounded-full" 
                          />
                        </div>
                        {/* Floating Level Badge */}
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs shadow-lg border-2 border-white"
                        >
                          LV.{profile.level}
                        </motion.div>
                      </div>

                      {/* Header Core Details */}
                      <div className="text-center space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shadow-inner uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                          Kampai Virtuous Hero
                        </span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{student.name}</h2>
                        <p className="text-sm font-bold text-slate-500">
                          ห้องเรียน {student.class}{student.room ? `/${student.room}` : ''} 
                          {student.class_number ? ` · เลขที่ ${student.class_number}` : ''}
                        </p>
                        
                        {/* Title Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <span className="bg-slate-900 text-yellow-400 px-4 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border border-slate-800 shadow-md">
                            <Shield className="w-4 h-4 text-yellow-400" />
                            {profile.heroTitle}
                          </span>
                          <span className="bg-primary text-white px-4 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md">
                            <Trophy className="w-4 h-4 text-yellow-300" />
                            {profile.totalXp} XP
                          </span>
                        </div>
                      </div>

                      {/* 5-Virtues Dimension Radar Chart inside the center */}
                      <div className="w-full bg-slate-50/70 rounded-3xl border border-slate-200/50 p-4">
                        <h3 className="text-xs font-black text-slate-700 text-center uppercase tracking-wider mb-2">
                          แผนผังพลังคุณธรรม 5 มิติฮีโร่
                        </h3>
                        <div className="h-60 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                              <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                              <PolarAngleAxis 
                                dataKey="name" 
                                tick={{ fill: '#334155', fontSize: 10, fontWeight: 800 }}
                              />
                              <PolarRadiusAxis 
                                angle={30} 
                                domain={[0, maxVirtueScore]} 
                                tick={{ fill: '#94a3b8', fontSize: 9 }}
                              />
                              <Radar
                                name="คะแนนพลังความดี"
                                dataKey="score"
                                stroke="#15803d"
                                fill="#22c55e"
                                fillOpacity={0.35}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Psychological positive feedback message bubble */}
                      {highestVirtueInfo && (
                        <div className="w-full relative bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 p-4.5 rounded-2xl flex items-start gap-3 shadow-inner">
                          <div className="p-2 bg-white rounded-xl border border-emerald-200 shadow-sm text-lg">
                            💬
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-emerald-800">
                              พลังเด่นวันนี้: {highestVirtueInfo.meta.label}
                            </h4>
                            <p className="text-xs font-medium text-emerald-950 leading-relaxed">
                              "{highestVirtueInfo.meta.feedback}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Interactive Share Button to trigger Certificate */}
                      <div className="w-full pt-2">
                        <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
                          <DialogTrigger asChild>
                            <Button className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-md hover:from-yellow-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                              <QrCode className="w-5 h-5 text-slate-950 animate-pulse" />
                              สร้างใบเกียรติบัตร & คิวอาร์โค้ดแชร์ความภูมิใจ ✨
                            </Button>
                          </DialogTrigger>
                          
                          {/* 📜 CERTIFICATE DIALOG CONTENT */}
                          <DialogContent className="sm:max-w-[480px] rounded-3xl bg-white p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-black text-slate-800 text-center">
                                ใบเกียรติบัตรความดีดิจิทัล
                              </DialogTitle>
                              <DialogDescription className="text-xs text-center text-slate-500">
                                แคปหน้าจอนี้เพื่อนำส่งแชร์เข้าไลน์กลุ่มครอบครัวหรือบันทึกไว้ในพอร์ต
                              </DialogDescription>
                            </DialogHeader>
                            
                            {/* Certificate Canvas Mockup */}
                            <div className="border-[8px] border-amber-400 bg-emerald-50 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center space-y-4 shadow-md">
                              {/* Background school logo silhouette/watermark */}
                              <div className="absolute inset-0 bg-no-repeat bg-center opacity-5 pointer-events-none" />
                              
                              <div className="absolute top-2 right-2 opacity-20">🛡️</div>
                              <div className="absolute bottom-2 left-2 opacity-20">🌱</div>

                              <div className="space-y-0.5 pt-2">
                                <span className="text-[10px] font-black text-emerald-800 tracking-widest uppercase">
                                  KAMPAI HERO CERTIFICATE
                                </span>
                                <h3 className="text-xl font-black text-slate-800">เกียรติบัตรทำความดี</h3>
                                <p className="text-[9px] text-slate-500">โรงเรียนบ้านคำไผ่ สพป.กาฬสินธุ์ เขต 3</p>
                              </div>

                              <div className="w-16 h-16 rounded-full border-2 border-amber-300 p-1 bg-white shadow">
                                <PersonAvatar name={student.name} photoUrl={student.photo_url} size="md" className="rounded-full" />
                              </div>

                              <div className="space-y-1">
                                <p className="text-[9px] text-slate-500">ขอมอบเกียรติบัตรเกียรติยศใบนี้ให้แก่</p>
                                <h4 className="text-base font-extrabold text-slate-900">{student.name}</h4>
                                <p className="text-[10px] font-bold text-slate-600">ชั้น {student.class}{student.room ? `/${student.room}` : ''}</p>
                              </div>

                              <div className="py-2.5 px-4 bg-white/70 backdrop-blur rounded-xl border border-amber-200/50 space-y-1">
                                <p className="text-[9px] text-slate-500">ได้รับการรับรองเป็นผู้มีเกียรติยศระดับคุณธรรมสูงสุด</p>
                                <span className="inline-block text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                                  👑 {profile.heroTitle}
                                </span>
                              </div>

                              {/* Virtual QR code link */}
                              <div className="flex flex-col items-center space-y-1 pt-1">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                  {/* Custom QR representation */}
                                  <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold p-1 rounded">
                                    <span className="border-4 border-white p-0.5 text-center leading-none text-[7px]">
                                      KAMPAI<br />HERO<br />QR
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[8px] text-slate-400 font-bold">
                                  สแกนรหัสตรวจสอบประวัติความประพฤติสาธารณะ
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 justify-center pt-2">
                              <Button 
                                onClick={() => {
                                  toast({
                                    title: 'แชร์เกียรติบัตรสำเร็จ 🌟',
                                    description: 'คัดลอกลิงก์ประวัติของนักเรียนไปยังคลิปบอร์ดแล้ว'
                                  });
                                  navigator.clipboard.writeText(window.location.href);
                                }}
                                className="flex-1 rounded-2xl font-bold bg-primary hover:bg-primary-deep text-white"
                              >
                                <Share2 className="w-4 h-4 mr-1.5" /> คัดลอกลิงก์แชร์
                              </Button>
                              <Button 
                                onClick={() => setShowCertDialog(false)} 
                                variant="outline" 
                                className="rounded-2xl font-bold text-slate-700"
                              >
                                ปิดหน้าจอ
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ──────────────────────────────────────────────────────────
                    RIGHT BLOCK: Badges & Synergy (lg:col-span-3)
                   ────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Card 4: Unlocked/Locked Badges Wall */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-transparent">
                      <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        เข็มกลัดรางวัลความดี
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        เหรียญที่ปลดล็อคตามภารกิจสำเร็จ
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {profile.badges.map((badge) => {
                        return (
                          <div 
                            key={badge.id}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                              badge.unlocked 
                                ? "bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-200" 
                                : "bg-slate-50/50 border-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-lg border shadow-inner",
                              badge.unlocked 
                                ? "bg-amber-100 border-amber-300" 
                                : "bg-slate-200/50 border-slate-200 text-slate-400"
                            )}>
                              {badge.unlocked ? badge.icon : <Lock className="w-4 h-4" />}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex justify-between items-center">
                                <h4 className={cn("text-[11px] font-black truncate", badge.unlocked ? "text-amber-950" : "text-slate-500")}>
                                  {badge.name}
                                </h4>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {badge.progress}/{badge.target}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">
                                {badge.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Card 5: Classroom Synergy Goal */}
                  <Card className="border border-emerald-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 bg-gradient-to-b from-emerald-50/30 to-transparent">
                      <CardTitle className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-emerald-600 animate-pulse" />
                        ความสามัคคีห้องเรียน
                      </CardTitle>
                      <CardDescription className="text-[11px] text-emerald-700/80">
                        คุณค่าความร่วมมือกับเพื่อนร่วมชั้น
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {classGoal ? (
                        <div className="space-y-3">
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                            <span className="text-[9px] font-black text-emerald-700 block">รางวัลเป้าหมายร่วมกัน:</span>
                            <span className="text-xs font-black text-slate-800">
                              {classGoal.reward || 'รางวัลฉลองชัยความประพฤติ 🏆'}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black text-slate-600">
                              <span>ความคืบหน้าห้อง:</span>
                              <span className="text-emerald-700">
                                {classXp}/{classGoal.target_xp} XP
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full" 
                                style={{ width: `${Math.min(100, Math.round((classXp / classGoal.target_xp) * 100))}%` }}
                              />
                            </div>
                          </div>

                          {/* Personal contribution */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-500">พลังส่วนร่วมของฉัน:</span>
                            <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              บริจาค {synergyContributionPercent}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 space-y-2">
                          <span className="text-xl">🤝</span>
                          <p className="text-[10px] text-slate-400 font-bold leading-normal">
                            คุณครูประจำชั้นของห้องนี้ <br /> ยังไม่ได้ตั้งเป้าหมายคะแนนความดีร่วมกัน
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 6: Recent Deeds merit feed */}
                  <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-transparent">
                      <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-pink-500" />
                        ความดีล่าสุด
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        3 บันทึกความประพฤติล่าสุด
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {profile.timeline && profile.timeline.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {profile.timeline.slice(0, 3).map((item) => {
                            const metric = VIRTUE_METRICS[item.category as keyof typeof VIRTUE_METRICS];
                            return (
                              <div key={item.id} className="p-3 hover:bg-slate-50/50 transition-colors space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                  <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded-md", 
                                    metric?.badgeBg || "bg-slate-100 text-slate-700"
                                  )}>
                                    {metric?.label || item.category}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">
                                    {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">
                                  {item.title || 'ทำความดีสนับสนุนโรงเรียน'}
                                </p>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-[9px] text-slate-400 font-medium">บันทึกความประพฤติ</span>
                                  <span className="text-emerald-700 font-black">+{item.xp} XP</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs font-bold">
                          ยังไม่มีบันทึกการทำความดีในช่วงนี้
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

              </div>

            </motion.div>
          )}
          
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
