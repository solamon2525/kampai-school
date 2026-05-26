import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Sparkles, Award, Lock, Shield, 
  Check, ArrowRight, Heart, BookOpen, Clock, 
  UserCheck, Flame, Star, Target, RefreshCw, 
  Smile, AlertCircle, Edit3, X, Zap
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { conductService, studentsService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import type { HeroProfile, ClassroomGoal } from '@/services/conduct.service';
import { cn } from '@/lib/utils';

// ─── Virtue style map (Light-mode only — NO dark: prefixes) ───
const VIRTUE_METRICS = {
  publicMind: { 
    label: 'จิตสาธารณะ 🌱', 
    accentBorder: 'border-l-emerald-500', 
    badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    gradient: 'from-emerald-400 to-teal-500' 
  },
  responsibility: { 
    label: 'ความรับผิดชอบ 📘', 
    accentBorder: 'border-l-blue-500', 
    badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300',
    gradient: 'from-blue-400 to-indigo-500' 
  },
  discipline: { 
    label: 'วินัย ⏰', 
    accentBorder: 'border-l-purple-500', 
    badgeBg: 'bg-purple-100 text-purple-900 border border-purple-300',
    gradient: 'from-purple-400 to-pink-500' 
  },
  honesty: { 
    label: 'ซื่อสัตย์ 🤝', 
    accentBorder: 'border-l-amber-500', 
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
    gradient: 'from-amber-400 to-orange-500' 
  },
  kindness: { 
    label: 'น้ำใจ ❤️', 
    accentBorder: 'border-l-pink-500', 
    badgeBg: 'bg-pink-100 text-pink-900 border border-pink-300',
    gradient: 'from-pink-400 to-rose-500' 
  },
};

interface KampaiHeroDashboardProps {
  studentId: string;
  isParentView?: boolean;
}

export const KampaiHeroDashboard: React.FC<KampaiHeroDashboardProps> = ({ 
  studentId, 
  isParentView = false 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [profile, setProfile] = useState<HeroProfile | null>(null);
  const [classGoal, setClassGoal] = useState<ClassroomGoal | null>(null);
  const [classXp, setClassXp] = useState<number>(0);
  
  // States for Editing Classroom Goal
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTarget, setGoalTarget] = useState('500');
  const [goalReward, setGoalReward] = useState('ปาร์ตี้พิซซ่าฉลองชัย 🍕');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Student Details
      const studentRes = await studentsService.getById(studentId);
      if (studentRes.error) throw studentRes.error;
      const sData = studentRes.data;
      setStudent(sData);

      // 2. Fetch Calculated Hero Profile
      const heroProf = await conductService.getHeroProfile(studentId);
      setProfile(heroProf);

      // 3. Fetch Classroom Goal & Xp Sum if Student has Class
      if (sData?.class) {
        const roomName = sData.room || '';
        const goal = await conductService.getClassroomGoal(sData.class, roomName);
        setClassGoal(goal);
        if (goal) {
          setGoalTarget(String(goal.target_xp));
          setGoalReward(goal.reward);
        }
        
        // Sum current classroom XP
        const xpSum = await conductService.getClassroomXpSum(sData.class, roomName);
        setClassXp(xpSum);
      }

    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลล้มเหลว',
        description: err.message || 'กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const handleSaveClassroomGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.class) return;
    
    try {
      setIsSavingGoal(true);
      const targetVal = parseInt(goalTarget) || 500;
      const roomName = student.room || '';
      
      const { error } = await conductService.upsertClassroomGoal(
        student.class,
        roomName,
        targetVal,
        goalReward.trim()
      );

      if (error) throw error;

      toast({
        title: 'อัปเดตเป้าหมายสำเร็จ 🎉',
        description: `เป้าหมายของห้อง ${student.class}${student.room ? '/' + student.room : ''} ถูกปรับเปลี่ยนเรียบร้อย`
      });

      // Refresh Classroom Goal data
      const goal = await conductService.getClassroomGoal(student.class, roomName);
      setClassGoal(goal);
      setIsEditingGoal(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึกเป้าหมาย',
        description: err.message
      });
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">กำลังประมวลผลพลังฮีโร่...</p>
      </div>
    );
  }

  if (!student || !profile) {
    return (
      <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg">ไม่พบข้อมูล Kampai Hero</h3>
        <p className="text-muted-foreground text-sm max-w-xs mt-1">
          นักเรียนคนนี้อาจยังไม่มีคะแนนหรือประวัติความประพฤติบันทึกไว้ในระบบ
        </p>
      </Card>
    );
  }

  // Calculate Radar Chart dynamic data range max value
  const values = Object.values(profile.virtues);
  const maxVirtue = Math.max(...values, 10);

  const radarData = [
    { name: 'จิตสาธารณะ 🌱', score: profile.virtues.publicMind, fullMark: maxVirtue },
    { name: 'ความรับผิดชอบ 📘', score: profile.virtues.responsibility, fullMark: maxVirtue },
    { name: 'วินัย ⏰', score: profile.virtues.discipline, fullMark: maxVirtue },
    { name: 'ซื่อสัตย์ 🤝', score: profile.virtues.honesty, fullMark: maxVirtue },
    { name: 'น้ำใจ ❤️', score: profile.virtues.kindness, fullMark: maxVirtue },
  ];

  // Classroom goal calculation
  const goalTargetNum = classGoal?.target_xp || 500;
  const classroomReward = classGoal?.reward || 'ปาร์ตี้พิซซ่าฉลองชัย 🍕';
  const goalProgressPercent = goalTargetNum > 0 ? Math.min(100, Math.round((classXp / goalTargetNum) * 100)) : 0;

  return (
    <div className="space-y-6 pt-2 pb-10">
      
      {/* ════════════════════════════════════════════════════════════
          1. HERO HEADER — dark bg → ALL text must be white/bright
         ════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 shadow-xl border border-indigo-900/30"
      >
        {/* Glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 opacity-75 blur animate-pulse" />
            <div className="relative bg-slate-950 p-1.5 rounded-full">
              <PersonAvatar name={student.name} photoUrl={student.photo_url} size="xl" className="h-24 w-24 border-2 border-white/20" />
            </div>
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-950 font-extrabold px-3 py-1 rounded-full text-xs shadow-md border border-slate-950"
            >
              LV.{profile.level}
            </motion.div>
          </div>

          {/* Core Info — ALL white on dark bg */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 text-white border border-white/20 shadow-inner uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                Kampai Hero Profile
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">{student.name}</h2>
              <p className="text-sm text-white/80">
                ชั้นเรียน {student.class}{student.room ? `/${student.room}` : ''} 
                {student.class_number ? ` · เลขที่ ${student.class_number}` : ''}
              </p>
            </div>

            {/* Title / Badge */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-white/20 text-white">
                <Shield className="w-3.5 h-3.5 text-yellow-300" />
                {profile.heroTitle}
              </span>
              <span className="bg-yellow-400/20 backdrop-blur-md text-yellow-300 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-yellow-400/30">
                <Trophy className="w-3.5 h-3.5" />
                {profile.totalXp} Hero XP
              </span>
            </div>
          </div>

          {/* XP Progress Engine — nested dark panel */}
          <div className="w-full md:w-80 space-y-2 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-white">เลเวลเติบโต</span>
              <span className="text-yellow-300">
                {profile.xpNeededForNextLevel > 0 
                  ? `${profile.xpInLevel}/${profile.xpNeededForNextLevel} XP`
                  : 'MAX LEVEL 🏆'}
              </span>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden border border-white/10">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profile.progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>

            {profile.xpNeededForNextLevel > 0 ? (
              <p className="text-[10px] text-white/70 text-center md:text-left">
                อีก <span className="text-yellow-300 font-bold">{profile.xpNeededForNextLevel - profile.xpInLevel} XP</span> เพื่อเลื่อนเป็นขั้นถัดไป!
              </p>
            ) : (
              <p className="text-[10px] text-yellow-300 font-semibold text-center md:text-left flex items-center justify-center md:justify-start gap-1">
                <Sparkles className="w-3 h-3" /> คุณได้รับการเติบโตระดับสูงสุดแล้ว!
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          2. VISUAL DASHBOARDS — light bg → dark text
         ════════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side: Radar Virtues Score (3 cols) */}
        <Card className="lg:col-span-3 border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2 bg-gradient-to-b from-slate-50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-extrabold flex items-center gap-1.5 text-slate-800">
                  <Zap className="w-5 h-5 text-indigo-600" /> 
                  5 มิติคุณธรรมฮีโร่
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  คะแนนสะสมเชิงบวกจำแนกตามกลุ่มพฤติกรรมคุณลักษณะ
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col md:flex-row items-center gap-6 py-6">
            {/* Radar chart container */}
            <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, maxVirtue]} 
                    tick={{ fill: '#64748b', fontSize: 9 }}
                  />
                  <Radar
                    name="คะแนนพลังความดี"
                    dataKey="score"
                    stroke="#4f46e5"
                    fill="#818cf8"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Scores breakdown sidepanel */}
            <div className="flex-1 w-full space-y-3">
              {Object.entries(profile.virtues).map(([key, val]) => {
                const metric = VIRTUE_METRICS[key as keyof typeof VIRTUE_METRICS];
                if (!metric) return null;
                const ratio = maxVirtue > 0 ? (val / maxVirtue) * 100 : 0;
                
                return (
                  <div 
                    key={key} 
                    className={cn(
                      "p-2.5 rounded-xl border border-border bg-card flex items-center justify-between gap-4 transition-all hover:translate-x-1 border-l-4", 
                      metric.accentBorder
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-700">
                          {metric.label}
                        </span>
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm", metric.badgeBg)}>
                          {val} XP
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          className={cn("h-full bg-gradient-to-r rounded-full", metric.gradient)}
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Badges & Achievements (2 cols) */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-b from-amber-50/60 to-transparent">
            <CardTitle className="text-lg font-extrabold flex items-center gap-1.5 text-slate-800">
              <Award className="w-5 h-5 text-amber-500" />
              เข็มกลัดเกียรติยศ (Badges)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              รางวัลเหรียญความดีที่คำนวณตามบันทึกพฤติกรรมสะสม
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[340px] space-y-3.5 pr-2">
            {profile.badges.map((badge) => {
              return (
                <div 
                  key={badge.id} 
                  className={cn(
                    "flex items-center gap-4.5 p-3 rounded-2xl border transition-all duration-300",
                    badge.unlocked 
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300" 
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  {/* Badge Icon Frame */}
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner border",
                      badge.unlocked 
                        ? "bg-amber-100 border-amber-300" 
                        : "bg-slate-100 border-slate-200"
                    )}>
                      {badge.unlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>
                    {badge.unlocked && (
                      <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-[9px] font-black px-1.5 py-0.5 rounded-full text-slate-900 shadow border border-white">
                        PASS
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={cn("text-xs font-bold truncate", badge.unlocked ? "text-amber-900" : "text-slate-600")}>
                        {badge.name}
                      </h4>
                      <span className={cn("text-[10px] font-bold", badge.unlocked ? "text-amber-700" : "text-slate-500")}>
                        {badge.progress}/{badge.target} ครั้ง
                      </span>
                    </div>
                    <p className={cn("text-[10px] leading-tight", badge.unlocked ? "text-amber-800" : "text-slate-500")}>
                      {badge.description}
                    </p>
                    
                    {/* Linear Micro Progress for locked badges */}
                    {!badge.unlocked && (
                      <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden mt-1">
                        <div 
                          className="h-full bg-slate-400 rounded-full" 
                          style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          3. BOTTOM ROW: Classroom Goal & Timeline — light bg
         ════════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side Classroom Goal (2 cols) */}
        <Card className="lg:col-span-2 border border-emerald-200 shadow-sm overflow-hidden flex flex-col bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <CardHeader className="pb-2 bg-gradient-to-b from-emerald-100/40 to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  เป้าหมายฮีโร่ทั้งห้อง 🎉
                </CardTitle>
                <CardDescription className="text-xs text-emerald-700/70">
                  ห้อง {student.class}{student.room ? `/${student.room}` : ''}
                </CardDescription>
              </div>
              {!isParentView && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                >
                  {isEditingGoal ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col justify-between p-5 space-y-4">
            
            {/* Setup / Edit Form Triggered inside the panel */}
            <AnimatePresence mode="wait">
              {isEditingGoal ? (
                <motion.form 
                  key="edit-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveClassroomGoal} 
                  className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-200"
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">เป้าหมายคะแนนรวมทั้งห้อง (XP)</Label>
                    <Input 
                      type="number" 
                      value={goalTarget} 
                      onChange={e => setGoalTarget(e.target.value)} 
                      placeholder="เช่น 500" 
                      className="h-9" 
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">รางวัลฉลองเมื่อทำสำเร็จ 🏆</Label>
                    <Input 
                      value={goalReward} 
                      onChange={e => setGoalReward(e.target.value)} 
                      placeholder="เช่น เลี้ยงขนม, เล่นบอร์ดเกม 1 คาบ" 
                      className="h-9" 
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" className="flex-1" disabled={isSavingGoal}>
                      {isSavingGoal ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingGoal(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="goal-display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Reward Card */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4.5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">ของรางวัลที่จะได้รับร่วมกัน</span>
                    <h3 className="text-base font-extrabold text-slate-800">{classroomReward}</h3>
                  </div>

                  {/* Meter visual */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">สะสมปัจจุบัน</span>
                      <span className="text-emerald-700">{classXp} / {goalTargetNum} XP</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden relative border border-slate-300/50">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgressPercent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                      {goalProgressPercent >= 100 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white animate-pulse">
                          GOAL REACHED! 🏆🎉
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                      {goalProgressPercent >= 100 
                        ? 'สุดยอดไปเลยทุกคน! เป้าหมายความร่วมมือสำเร็จแล้ว เตรียมรับของรางวัลร่วมกันได้เลย!'
                        : `พวกเราต้องช่วยกันอีก ${goalTargetNum - classXp} XP เพื่อปลดล็อคของรางวัลสุดพิเศษ!`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Right Side Good Deeds Timeline (3 cols) */}
        <Card className="lg:col-span-3 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-b from-slate-50 to-transparent">
            <CardTitle className="text-base font-extrabold flex items-center gap-1.5 text-slate-800">
              <Smile className="w-4 h-4 text-emerald-600" />
              บันทึกการเดินทางของฮีโร่ (Timeline)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              บันทึกพฤติกรรมและการเติบโตทางจิตวิทยาเชิงบวก
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {profile.timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full min-h-[150px]">
                <Heart className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs text-slate-500">ยังไม่มีบันทึกพฤติกรรมสะสม</p>
                <p className="text-[10px] text-slate-400 mt-0.5">พฤติกรรมเชิงบวกก้าวแรกจะปูทางให้เริ่มมีพลังสะสม!</p>
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-5 py-2">
                {profile.timeline.map((item) => {
                  const isAdd = item.type === 'add';
                  const metric = VIRTUE_METRICS[conductService.mapCategoryToVirtue(item.category) as keyof typeof VIRTUE_METRICS];
                  
                  return (
                    <div key={item.id} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={cn(
                        "absolute -left-[22.5px] top-1 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                        isAdd ? "bg-emerald-500" : "bg-red-500"
                      )} />

                      <div className="space-y-1 bg-card border border-border p-3 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(item.date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn(
                            "text-xs font-black",
                            isAdd ? "text-emerald-600" : "text-red-500"
                          )}>
                            {isAdd ? `+${item.xp}` : `-${item.xp}`} XP
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800">
                          {item.title}
                        </h4>

                        {/* Positive psychology supportive words */}
                        <div className="flex gap-2 items-center flex-wrap pt-0.5">
                          {metric && (
                            <Badge className={cn("text-[9px] py-0.5 px-2 border-none font-bold", metric.badgeBg)}>
                              {metric.label}
                            </Badge>
                          )}
                          <p className="text-[10px] italic font-medium text-slate-500">
                            "{item.message}"
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
