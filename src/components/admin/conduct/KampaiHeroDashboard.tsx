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

// Virtue translation mapping with styles
const VIRTUE_METRICS = {
  publicMind: { label: 'จิตสาธารณะ 🌱', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/50', gradient: 'from-emerald-400 to-teal-500' },
  responsibility: { label: 'ความรับผิดชอบ 📘', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/50', gradient: 'from-blue-400 to-indigo-500' },
  discipline: { label: 'วินัย ⏰', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-100 dark:border-purple-900/50', gradient: 'from-purple-400 to-pink-500' },
  honesty: { label: 'ซื่อสัตย์ 🤝', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/50', gradient: 'from-amber-400 to-orange-500' },
  kindness: { label: 'น้ำใจ ❤️', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-100 dark:border-pink-900/50', gradient: 'from-pink-400 to-rose-500' },
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
      
      {/* 1. Header Profile Box */}
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

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="space-y-0.5">
              <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Kampai Hero Profile</span>
              <h2 className="text-2xl font-black tracking-tight">{student.name}</h2>
              <p className="text-sm text-slate-300">
                ชั้นเรียน {student.class}{student.room ? `/${student.room}` : ''} 
                {student.class_number ? ` · เลขที่ ${student.class_number}` : ''}
              </p>
            </div>

            {/* Title / Badge */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-white/10">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                {profile.heroTitle}
              </span>
              <span className="bg-yellow-500/20 backdrop-blur-md text-yellow-300 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-yellow-500/30">
                <Trophy className="w-3.5 h-3.5" />
                {profile.totalXp} Hero XP
              </span>
            </div>
          </div>

          {/* XP Progress Engine */}
          <div className="w-full md:w-80 space-y-2 bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">เลเวลเติบโต</span>
              <span className="text-indigo-400">
                {profile.xpNeededForNextLevel > 0 
                  ? `${profile.xpInLevel}/${profile.xpNeededForNextLevel} XP`
                  : 'MAX LEVEL 🏆'}
              </span>
            </div>
            
            {/* Elegant Custom Animated Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3.5 overflow-hidden border border-slate-700/50">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profile.progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>

            {profile.xpNeededForNextLevel > 0 ? (
              <p className="text-[10px] text-slate-400 text-center md:text-left">
                อีก <span className="text-white font-bold">{profile.xpNeededForNextLevel - profile.xpInLevel} XP</span> เพื่อเลื่อนเป็นขั้นถัดไป!
              </p>
            ) : (
              <p className="text-[10px] text-yellow-400 font-semibold text-center md:text-left flex items-center justify-center md:justify-start gap-1">
                <Sparkles className="w-3 h-3" /> คุณได้รับการเติบโตระดับสูงสุดแล้ว!
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* 2. Visual Dashboards Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side: Radar Virtues Score (3 cols) */}
        <Card className="lg:col-span-3 border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-extrabold flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-indigo-500" /> 
                  5 มิติคุณธรรมฮีโร่
                </CardTitle>
                <CardDescription className="text-xs">
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
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, maxVirtue]} 
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                  />
                  <Radar
                    name="คะแนนพลังความดี"
                    dataKey="score"
                    stroke="#6366f1"
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
                  <div key={key} className={cn("p-2.5 rounded-xl border flex items-center justify-between gap-4 transition-all hover:translate-x-1", metric.bg, metric.border)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("text-xs font-black", metric.color)}>
                          {metric.label}
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {val} XP
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
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
        <Card className="lg:col-span-2 border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/20">
            <CardTitle className="text-lg font-extrabold flex items-center gap-1.5">
              <Award className="w-5 h-5 text-yellow-500" />
              เข็มกลัดเกียรติยศ (Badges)
            </CardTitle>
            <CardDescription className="text-xs">
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
                      ? "bg-gradient-to-r from-yellow-50/50 to-amber-50/30 border-amber-200 dark:from-amber-950/20 dark:border-amber-900/40" 
                      : "bg-slate-50/50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/50 opacity-70"
                  )}
                >
                  {/* Badge Icon Frame */}
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner border",
                      badge.unlocked 
                        ? "bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700" 
                        : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    )}>
                      {badge.unlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
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
                      <h4 className={cn("text-xs font-bold truncate", badge.unlocked ? "text-amber-800 dark:text-amber-300" : "text-slate-600 dark:text-slate-400")}>
                        {badge.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500">
                        {badge.progress}/{badge.target} ครั้ง
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      {badge.description}
                    </p>
                    
                    {/* Linear Micro Progress for locked badges */}
                    {!badge.unlocked && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-1 overflow-hidden mt-1">
                        <div 
                          className="h-full bg-slate-400 dark:bg-slate-500 rounded-full" 
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

      {/* 3. Bottom Row Grid: Classroom Goal & Timeline */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Side Classroom Goal (2 cols) */}
        <Card className="lg:col-span-2 border border-indigo-200/60 dark:border-indigo-950 shadow-sm overflow-hidden flex flex-col bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950">
          <CardHeader className="pb-2 bg-gradient-to-b from-indigo-100/30 to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-extrabold text-indigo-900 dark:text-indigo-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  เป้าหมายฮีโร่ทั้งห้อง 🎉
                </CardTitle>
                <CardDescription className="text-xs text-indigo-700/60 dark:text-indigo-400/60">
                  ห้อง {student.class}{student.room ? `/${student.room}` : ''}
                </CardDescription>
              </div>
              {!isParentView && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                  className="space-y-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border"
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">เป้าหมายคะแนนรวมทั้งห้อง (XP)</Label>
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
                    <Label className="text-xs font-bold">รางวัลฉลองเมื่อทำสำเร็จ 🏆</Label>
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
                  <div className="bg-gradient-to-r from-yellow-100/50 to-amber-100/30 dark:from-yellow-950/20 dark:to-transparent border border-yellow-200/50 p-4.5 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">ของรางวัลที่จะได้รับร่วมกัน</span>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-yellow-100">{classroomReward}</h3>
                  </div>

                  {/* Meter visual */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">สะสมปัจจุบัน</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{classXp} / {goalTargetNum} XP</span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-4 overflow-hidden relative border border-slate-200/30">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500 rounded-full"
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

                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
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
        <Card className="lg:col-span-3 border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/20">
            <CardTitle className="text-base font-extrabold flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-emerald-500" />
              บันทึกการเดินทางของฮีโร่ (Timeline)
            </CardTitle>
            <CardDescription className="text-xs">
              บันทึกพฤติกรรมและการเติบโตทางจิตวิทยาเชิงบวก
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {profile.timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full min-h-[150px]">
                <Heart className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs">ยังไม่มีบันทึกพฤติกรรมสะสม</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">พฤติกรรมเชิงบวกก้าวแรกจะปูทางให้เริ่มมีพลังสะสม!</p>
              </div>
            ) : (
              <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-5 py-2">
                {profile.timeline.map((item) => {
                  const isAdd = item.type === 'add';
                  const metric = VIRTUE_METRICS[conductService.mapCategoryToVirtue(item.category) as keyof typeof VIRTUE_METRICS];
                  
                  return (
                    <div key={item.id} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className={cn(
                        "absolute -left-[22.5px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-sm",
                        isAdd ? "bg-emerald-500" : "bg-red-500"
                      )} />

                      <div className="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900/40 p-3 rounded-2xl">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(item.date).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn(
                            "text-xs font-black",
                            isAdd ? "text-green-600" : "text-red-500"
                          )}>
                            {isAdd ? `+${item.xp}` : `-${item.xp}`} XP
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {item.title}
                        </h4>

                        {/* Positive psychology supportive words */}
                        <div className="flex gap-2 items-center flex-wrap pt-0.5">
                          {metric && (
                            <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5", metric.color, metric.bg, metric.border)}>
                              {metric.label}
                            </Badge>
                          )}
                          <p className="text-[10px] italic font-semibold text-indigo-500/80 dark:text-indigo-400/80">
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
