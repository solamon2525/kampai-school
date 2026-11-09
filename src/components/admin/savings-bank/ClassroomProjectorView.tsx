import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  PiggyBank,
  Users,
  CheckCircle2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { getSaverTier } from '@/services/savings.service';

export interface ProjectorStudent {
  id: string;
  name: string;
  class_number: number | null;
  photo_url: string | null;
  amount: string; // empty string means not deposited today
  current_balance: number;
}

interface Props {
  className: string;
  transactionDate: string;
  students: ProjectorStudent[];
  onClose: () => void;
}

// Simple Web Audio API sound generator (Zero external dependencies)
class ProjectorAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public playCoin() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public playFanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.1);
        osc.stop(this.ctx.currentTime + i * 0.1 + 0.4);
      });
    } catch {
      // AudioContext unavailable
    }
  }
}

const audio = new ProjectorAudio();

export const ClassroomProjectorView = ({
  className: classroomName,
  transactionDate,
  students,
  onClose,
}: Props) => {
  const [soundOn, setSoundOn] = useState(true);
  const [privacyMode, setPrivacyMode] = useState<'discipline' | 'amount'>('discipline');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync sound preference
  useEffect(() => {
    audio.enabled = soundOn;
  }, [soundOn]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Derived calculations
  const depositedList = useMemo(() => {
    return students.filter((s) => {
      const amt = parseInt(s.amount, 10);
      return !isNaN(amt) && amt > 0;
    });
  }, [students]);

  const totalAmount = useMemo(() => {
    return depositedList.reduce((sum, s) => sum + parseInt(s.amount, 10), 0);
  }, [depositedList]);

  const participationPct = students.length > 0 ? Math.round((depositedList.length / students.length) * 100) : 0;

  // Sound trigger when deposit count reaches 100% or high milestone
  useEffect(() => {
    if (participationPct >= 100 && students.length > 0) {
      audio.playFanfare();
    }
  }, [participationPct, students.length]);

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden select-none">
      {/* ─── Top Projector Header ───────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-border bg-card shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-600 flex items-center justify-center shadow-xs">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                ธนาคารพอเพียง — ห้อง {classroomName}
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-bold">
                โหมดฉายจอห้องเรียน 🖥️
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              วันที่ {formatThaiDateFull(transactionDate)} · ปลูกฝังวินัยการออมเพื่ออนาคต
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Privacy Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrivacyMode(prev => prev === 'discipline' ? 'amount' : 'discipline')}
            className={cn(
              "text-xs font-bold gap-1.5 border-border",
              privacyMode === 'discipline' ? "bg-emerald-500/10 text-emerald-700 border-emerald-300" : "bg-card text-foreground"
            )}
            title="สลับการแสดงผลระหว่างเน้นวินัยการออม (ไม่โชว์ยอดเงิน) กับโชว์ยอดเงิน"
          >
            {privacyMode === 'discipline' ? (
              <>
                <EyeOff className="w-4 h-4 text-emerald-600" />
                โหมดเน้นวินัย (Streak)
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-primary" />
                โหมดแสดงยอดเงิน (฿)
              </>
            )}
          </Button>

          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundOn(prev => !prev);
              if (!soundOn) audio.playCoin();
            }}
            className="text-xs font-bold gap-1 border-border"
          >
            {soundOn ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-500" />
                เปิดเสียง
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                ปิดเสียง
              </>
            )}
          </Button>

          {/* Fullscreen Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-xs font-bold gap-1 border-border hidden sm:inline-flex"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                ย่อจอ
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                เต็มจอ
              </>
            )}
          </Button>

          {/* Close Projector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ─── Main Classroom Projector Content ──────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Milestone Banner (Readable from across classroom) */}
        <section className="bg-card border-2 border-amber-400/30 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
          {/* Subtle gold glow background */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 items-center">
            {/* Left: Progress info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🪙</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                    ยอดออมประจำวันห้อง {classroomName}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    ร่วมสร้างวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
                  </p>
                </div>
              </div>

              {/* Big Stats Row */}
              <div className="flex flex-wrap items-baseline gap-6 pt-2">
                <div>
                  <span className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider block">
                    ออมแล้ววันนี้
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-black text-amber-600 tabular-nums">
                      {depositedList.length}
                    </span>
                    <span className="text-base font-bold text-muted-foreground">
                      / {students.length} คน
                    </span>
                  </div>
                </div>

                <div className="border-l border-border pl-6">
                  <span className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider block">
                    การมีส่วนร่วม
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-black text-emerald-600 tabular-nums">
                      {participationPct}%
                    </span>
                  </div>
                </div>

                {privacyMode === 'amount' && (
                  <div className="border-l border-border pl-6">
                    <span className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider block">
                      ยอดรวมทั้งห้อง
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-black text-foreground tabular-nums">
                        {totalAmount.toLocaleString('th-TH')}
                      </span>
                      <span className="text-base font-bold text-muted-foreground">บาท</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar with Milestones */}
              <div className="space-y-2 pt-2">
                <div className="w-full bg-muted rounded-full h-5 p-1 overflow-hidden shadow-inner flex items-center">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(5, Math.min(100, participationPct))}%` }}
                  >
                    {participationPct > 15 && (
                      <span className="text-[10px] font-black text-white drop-shadow-xs">
                        {participationPct}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-xs font-bold text-muted-foreground px-1">
                  <span>เริ่มออม 🌱</span>
                  <span>50% ก้าวหน้า 🌟</span>
                  <span>80% ยอดเยี่ยม 🏆</span>
                  <span>100% ครบทั้งห้อง! 🎉</span>
                </div>
              </div>
            </div>

            {/* Right: Cute Illustrated Piggy Jar Visual */}
            <div className="bg-amber-500/10 border border-amber-300/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full bg-amber-400/20 flex items-center justify-center text-5xl shadow-inner animate-pulse">
                  🐷
                </div>
                {depositedList.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 shadow-md">
                    <Coins className="w-5 h-5" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-foreground">
                {participationPct === 100
                  ? '🎉 ครบทุกคนแล้ว ยอดเยี่ยมที่สุด!'
                  : participationPct >= 80
                  ? '🏆 ออมเกิน 80% พลังความพอเพียงเข้มแข็ง!'
                  : '🌱 ค่อยๆ ออม สะสมวันละนิด'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                "การออมเงินมิใช่เพียงเพื่อมีเงิน แต่เพื่อสร้างความมั่นคงและวินัยในจิตใจ"
              </p>
            </div>
          </div>
        </section>

        {/* ─── Classroom Students Grid ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              นักเรียนประจำชั้น ({students.length} คน)
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">
              แสดงสถานะการออมเช้านี้
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {students.map((st) => {
              const amt = parseInt(st.amount, 10);
              const hasDeposited = !isNaN(amt) && amt > 0;
              const tier = getSaverTier(st.current_balance > 0 ? 10 : 0);

              return (
                <div
                  key={st.id}
                  className={cn(
                    "rounded-2xl border p-3.5 flex flex-col items-center text-center transition-all duration-300 relative",
                    hasDeposited
                      ? "bg-amber-500/10 border-amber-400/60 shadow-md ring-2 ring-amber-400/20 scale-[1.02]"
                      : "bg-card border-border/80 opacity-75 hover:opacity-100"
                  )}
                >
                  {/* Roll Number Top Pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="w-6 h-6 rounded-full bg-muted text-foreground text-[11px] font-black flex items-center justify-center tabular-nums shadow-xs">
                      {st.class_number ?? '—'}
                    </span>
                  </div>

                  {/* Sparkle Icon on deposit */}
                  {hasDeposited && (
                    <div className="absolute top-2.5 right-2.5 text-amber-500">
                      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                  )}

                  {/* Student Photo */}
                  <div className="mt-2 mb-2">
                    <PersonAvatar
                      name={st.name}
                      photoUrl={st.photo_url}
                      size="lg"
                    />
                  </div>

                  {/* Student Name */}
                  <p className="font-extrabold text-xs md:text-sm text-foreground line-clamp-1 w-full" title={st.name}>
                    {st.name}
                  </p>

                  {/* Status & Amount Badge */}
                  <div className="mt-2 w-full">
                    {hasDeposited ? (
                      <div className="space-y-1">
                        <Badge className="w-full justify-center bg-amber-500 hover:bg-amber-500 text-slate-950 font-black text-xs py-0.5 shadow-xs">
                          {privacyMode === 'amount' ? (
                            `+${amt} ฿`
                          ) : (
                            'ฝากแล้ว ✨'
                          )}
                        </Badge>
                        <p className="text-[10px] text-amber-800 font-bold">
                          นักออม {tier}
                        </p>
                      </div>
                    ) : (
                      <div className="py-1">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          รอฝาก
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
