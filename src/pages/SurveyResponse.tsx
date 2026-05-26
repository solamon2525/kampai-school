import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { surveysService } from '@/services/surveys.service';
import { cn } from '@/lib/utils';

const SurveyResponse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [done, setDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['survey-public', id],
    enabled: !!id,
    queryFn: () => surveysService.getById(id!),
  });

  const submit = useMutation({
    mutationFn: () => surveysService.submit(id!, answers),
    onSuccess: () => {
      setDone(true);
      toast.success('ส่งคำตอบเรียบร้อย ขอบคุณค่ะ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">ไม่พบแบบสำรวจ</CardContent></Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { survey, questions } = data;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <Check className="w-12 h-12 mx-auto text-green-600" />
              <p className="font-medium">ส่งคำตอบเรียบร้อย</p>
              <p className="text-sm text-muted-foreground">ขอบคุณที่ร่วมตอบแบบสำรวจ ความเห็นของท่านมีค่ามากสำหรับโรงเรียน</p>
              <Button onClick={() => navigate('/')}>กลับหน้าแรก</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const missingRequired = questions.some((q) => q.is_required && (answers[q.id] === undefined || answers[q.id] === ''));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-8 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{survey.title}</h1>
          {survey.description && <p className="text-muted-foreground mt-2">{survey.description}</p>}
          {survey.is_anonymous && (
            <p className="text-xs text-muted-foreground mt-2">🔒 คำตอบของท่านจะเป็นแบบไม่ระบุตัวตน</p>
          )}
        </div>

        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                {q.question_text}
                {q.is_required && <span className="text-red-500 ml-1">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.type === 'text' && (
                <Textarea
                  rows={3}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="พิมพ์คำตอบ..."
                />
              )}
              {q.type === 'radio' && (
                <RadioGroup value={answers[q.id] ?? ''} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                  {(q.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                      <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === 'checkbox' && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, i) => {
                    const checked = ((answers[q.id] as string[]) ?? []).includes(opt);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox
                          id={`${q.id}-${i}`}
                          checked={checked}
                          onCheckedChange={(v) => {
                            const current: string[] = answers[q.id] ?? [];
                            setAnswers({
                              ...answers,
                              [q.id]: v ? [...current, opt] : current.filter((x) => x !== opt),
                            });
                          }}
                        />
                        <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer">{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}
              {(q.type === 'rating_5' || q.type === 'rating_10' || q.type === 'nps') && (
                <div className="flex flex-wrap gap-1">
                  {Array.from(
                    { length: q.type === 'rating_5' ? 5 : q.type === 'nps' ? 11 : 10 },
                    (_, i) => (q.type === 'nps' ? i : i + 1),
                  ).map((n) => {
                    const selected = answers[q.id] === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setAnswers({ ...answers, [q.id]: n })}
                        className={cn(
                          'w-10 h-10 rounded-md border text-sm font-medium transition',
                          selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary',
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4">
            <Button
              className="w-full"
              onClick={() => submit.mutate()}
              disabled={missingRequired || submit.isPending}
            >
              {submit.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              ส่งคำตอบ
            </Button>
            {missingRequired && (
              <p className="text-xs text-red-500 text-center mt-2">กรุณาตอบคำถามที่มีเครื่องหมาย * ให้ครบ</p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SurveyResponse;
