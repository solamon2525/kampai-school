/**
 * ResearchPlayIndex — รายการงานวิจัยสาธารณะ (หน้าบ้าน)
 * Route: /research
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FlaskConical, Gamepad2, Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { gameResearchService, modeLabel } from '@/services/game-research.service';

export default function ResearchPlayIndex() {
  const { data: studies, isLoading } = useQuery({
    queryKey: ['research-studies-public'],
    queryFn: async () => {
      const { data, error } = await gameResearchService.listPublic();
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> หน้าแรก
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary" />
            งานวิจัยเกมในชั้นเรียน
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            เลือกโครงการของชั้นเรียนคุณ → กรอกรหัสนักเรียนเพื่อยืนยันตัวตน → เล่นเกมทันที
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !studies?.length ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              ยังไม่มีงานวิจัยที่เปิดให้เล่นผ่านหน้าเว็บในขณะนี้
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {studies.map((s) => (
              <Card key={s.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h2 className="font-semibold text-foreground leading-snug">{s.title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.game_title} · {modeLabel(s.game_slug, s.game_mode)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">ชั้น {s.class_name}</Badge>
                        <Badge variant="outline">{s.max_rounds_per_day} รอบ/วัน</Badge>
                      </div>
                      <Button asChild size="sm" className="mt-1">
                        <Link to={`/research/${s.id}`}>
                          <LogIn className="h-4 w-4 mr-1.5" />
                          เข้าเล่น — กรอกรหัสนักเรียน
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
