/**
 * ResearchPlay — หน้าบ้านสาธารณะสำหรับงานวิจัยเกม
 * Route: /research/:studyId
 * นักเรียนกรอกรหัสยืนยันตัวเอง → เข้าเล่นเกมโหมดที่ครูกำหนดทันที
 */
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FlaskConical, Gamepad2, Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { gamePlayService } from '@/services/game-play.service';
import {
  gameResearchService,
  modeLabel,
  researchPhaseLabel,
  researchUrlMode,
  type ResearchPhase,
} from '@/services/game-research.service';

const isResearchPhase = (value: string | null): value is ResearchPhase =>
  value === 'pretest' || value === 'posttest';

export default function ResearchPlay() {
  const { studyId = '' } = useParams<{ studyId: string }>();
  const [searchParams] = useSearchParams();
  const phaseParam = searchParams.get('phase');
  const urlPhase = isResearchPhase(phaseParam) ? phaseParam : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    photoUrl: string | null;
    classLabel: string | null;
    remaining: number;
    maxRounds: number;
  } | null>(null);

  const studyQuery = useQuery({
    queryKey: ['research-study-public', studyId],
    queryFn: () => gameResearchService.getStudyPublic(studyId),
    enabled: !!studyId,
  });

  const study = studyQuery.data?.ok ? studyQuery.data : null;

  const checkCode = async () => {
    const trimmed = code.trim();
    if (!trimmed || !study?.id || !study.game_slug || !study.game_mode) return;
    setLoading(true);
    setPreview(null);
    try {
      const found = await gamePlayService.lookupStudent(trimmed);
      if (!found) {
        toast({ title: 'ไม่พบรหัสนักเรียน', description: 'ตรวจสอบรหัสแล้วลองใหม่', variant: 'destructive' });
        return;
      }
      if (study.class_name && found.class_label !== study.class_name) {
        toast({
          title: 'ชั้นเรียนไม่ตรง',
          description: `งานวิจัยนี้สำหรับชั้น ${study.class_name} เท่านั้น`,
          variant: 'destructive',
        });
        return;
      }
      const rounds = await gameResearchService.countRoundsToday(study.id, trimmed);
      if (!rounds.ok) {
        toast({ title: 'ไม่สามารถตรวจสอบรอบได้', variant: 'destructive' });
        return;
      }
      if ((rounds.remaining ?? 0) <= 0) {
        toast({
          title: 'ครบจำนวนรอบวันนี้แล้ว',
          description: `เล่นได้ ${rounds.max_rounds} รอบ/วัน — กลับมาใหม่พรุ่งนี้`,
          variant: 'destructive',
        });
        return;
      }
      setPreview({
        name: found.display_name,
        photoUrl: found.photo_url,
        classLabel: found.class_label,
        remaining: rounds.remaining ?? 0,
        maxRounds: rounds.max_rounds ?? study.max_rounds_per_day ?? 3,
      });
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'โปรดลองใหม่', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startPlay = (phase: ResearchPhase) => {
    if (!study?.id || !study.game_slug || !study.game_mode || !code.trim()) return;
    localStorage.setItem('kampai_student_code', code.trim());
    const qs = new URLSearchParams({
      study: study.id,
      mode: researchUrlMode(study.game_slug, study.game_mode),
      autostart: '1',
      phase,
    });
    navigate(`/play/${study.game_slug}?${qs.toString()}`);
  };

  if (studyQuery.isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!study) {
    return (
      <Shell>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">ไม่พบโครงการวิจัยนี้ หรือปิดใช้งานแล้ว</p>
            <Button asChild variant="outline">
              <Link to="/">กลับหน้าแรก</Link>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const modeText = modeLabel(study.game_slug, study.game_mode);

  return (
    <Shell>
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> หน้าแรก
          </Link>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <FlaskConical className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">งานวิจัยในชั้นเรียน</span>
            </div>
            <h1 className="text-xl font-bold text-foreground leading-snug">{study.title}</h1>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary" className="gap-1">
                <Gamepad2 className="h-3 w-3" />
                {study.game_title}
              </Badge>
              <Badge variant="outline">{modeText}</Badge>
              <Badge variant="outline">ชั้น {study.class_name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              เล่นได้วันละ {study.max_rounds_per_day} รอบ · กรอกรหัสนักเรียนเพื่อยืนยันตัวตน
            </p>
          </div>

          {!preview ? (
            <div className="space-y-3">
              <Input
                placeholder="รหัสนักเรียน"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkCode()}
                autoComplete="off"
                autoFocus
                className="text-center text-lg tracking-widest"
              />
              <Button className="w-full" size="lg" onClick={checkCode} disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                ตรวจสอบรหัส
              </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <PersonAvatar name={preview.name} photoUrl={preview.photoUrl} size="md" />
                <div>
                  <p className="font-semibold text-foreground">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.classLabel ?? '—'} · เหลือ {preview.remaining}/{preview.maxRounds} รอบวันนี้
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                โหมด <strong className="text-foreground">{modeText}</strong> — เลือกช่วงวิจัยแล้วเข้าเกมทันที
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(urlPhase ? [urlPhase] : ['pretest', 'posttest'] as ResearchPhase[]).map((phase) => (
                  <Button
                    key={phase}
                    className="h-11"
                    variant={phase === 'pretest' ? 'default' : 'outline'}
                    onClick={() => startPlay(phase)}
                  >
                    {researchPhaseLabel(phase)}
                  </Button>
                ))}
              </div>
              <div className="flex">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
                  เปลี่ยนรหัส
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      {children}
    </div>
  );
}
