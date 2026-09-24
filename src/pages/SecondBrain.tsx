import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { CheckCircle2, Clock, Circle, Rocket, Database, Gamepad2, BookOpen, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { roadmapMilestones } from '@/data/second-brain/roadmap';
import { featureGroups, projectStats } from '@/data/second-brain/features';

const statusConfig = {
  done: { label: 'เสร็จแล้ว', icon: CheckCircle2, cls: 'text-emerald-600' },
  'in-progress': { label: 'กำลังทำ', icon: Clock, cls: 'text-amber-500' },
  planned: { label: 'แผนต่อไป', icon: Circle, cls: 'text-slate-400' },
};

const statIcons: Record<string, typeof Rocket> = {
  '📊': Database,
  '🗄': Database,
  '🎮': Gamepad2,
  '📚': BookOpen,
  '🇹🇭': BookOpen,
  '🗺️': Rocket,
};

export default function SecondBrain() {
  return (
    <>
      <Helmet>
        <title>ภาพรวมระบบ — โรงเรียนบ้านคำไผ่</title>
        <meta name="description" content="ภาพรวมการพัฒนาระบบสารสนเทศโรงเรียนบ้านคำไผ่ — roadmap, features, tech stack" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <Badge variant="outline" className="text-primary border-primary/40 text-sm">
                Second Brain — ภาพรวมระบบ
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                ระบบสารสนเทศ
                <span className="text-primary"> โรงเรียนบ้านคำไผ่</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                แพลตฟอร์มบริหารจัดการโรงเรียนแบบครบวงจร — จาก CMS ไปจนถึงคลังเกมการศึกษา 100+ เกม
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  v1.209+ · Live
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  React + Supabase
                </Badge>
                <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                  kampai-school.vercel.app
                </Badge>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-10 px-4 border-b border-border bg-card">
            <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {projectStats.map((s) => (
                <div key={s.label} className="text-center space-y-1">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section className="py-14 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-2xl font-bold text-foreground">🗺 Roadmap การพัฒนา</h2>
                <p className="text-muted-foreground">จาก v1.0 ถึงปัจจุบัน และแผนต่อไป</p>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

                <div className="space-y-6">
                  {roadmapMilestones.map((m) => {
                    const cfg = statusConfig[m.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={m.version} className="flex gap-4 md:gap-6 items-start">
                        {/* Timeline dot */}
                        <div className={cn(
                          'hidden md:flex w-12 h-12 rounded-full items-center justify-center border-2 bg-background shrink-0 text-lg',
                          m.status === 'done' ? 'border-emerald-400' :
                          m.status === 'in-progress' ? 'border-amber-400' :
                          'border-border'
                        )}>
                          {m.icon}
                        </div>

                        <Card className={cn(
                          'flex-1 transition-shadow hover:shadow-sm',
                          m.status === 'in-progress' && 'border-amber-200 bg-amber-50/30'
                        )}>
                          <CardHeader className="pb-2 pt-4 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="md:hidden text-lg">{m.icon}</span>
                              <Badge variant="secondary" className="font-mono text-xs">
                                {m.version}
                              </Badge>
                              <CardTitle className="text-base font-semibold">{m.title}</CardTitle>
                              <span className={cn('flex items-center gap-1 text-xs ml-auto', cfg.cls)}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-4">
                            <ul className="space-y-1">
                              {m.highlights.map((h) => (
                                <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary mt-0.5 shrink-0">•</span>
                                  {h}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-14 px-4 bg-muted/30 border-y border-border">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-2xl font-bold text-foreground">✨ ฟีเจอร์ระบบ</h2>
                <p className="text-muted-foreground">ครอบคลุมทุกมิติของโรงเรียน</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureGroups.map((g) => (
                  <Card key={g.id} className={cn('border', g.color)}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{g.icon}</span>
                        {g.title}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {g.features.length} รายการ
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {g.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="py-14 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-2xl font-bold text-foreground">🛠 Tech Stack</h2>
                <p className="text-muted-foreground">เทคโนโลยีที่ใช้ในการพัฒนา</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Frontend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'React 18', 'TypeScript 5.8', 'Vite', 'TailwindCSS 3',
                        'shadcn/ui', 'React Router v6', 'TanStack Query v5',
                        'Framer Motion', 'Recharts', 'dnd-kit', 'Zod',
                        'React Hook Form', 'i18next', 'Lucide',
                      ].map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Backend & Deploy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Supabase', 'PostgreSQL', 'Row Level Security',
                        'Edge Functions (Deno)', 'Supabase Auth',
                        'Supabase Storage', 'Supabase Realtime',
                        'Resend (Email)', 'web-push', 'Vercel',
                      ].map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Games & Media</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'KAMPAI SDK', 'MediaPipe (AR)', 'kampai-hands.js',
                        'kampai-ar.js', 'HTML5 Canvas', 'Web Audio API',
                        'TTS (SpeechSynthesis)', 'Tesseract.js (OCR)',
                        'hls.js (Video)', 'Leaflet (Maps)',
                      ].map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Developer Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'pnpm', 'ESLint', 'vite-plugin-pwa', 'Workbox',
                        'react-pdf', 'xlsx', 'Uppy', 'cmdk + fuse.js',
                        'DOMPurify', 'date-fns (Thai locale)',
                        'Supabase CLI', 'sharp (image)',
                      ].map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
