import { useState } from 'react';
import { Sparkles, Loader2, Copy, RotateCcw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { aiAssistService, type AiMode, type AiAssistResponse } from '@/services/ai-assist.service';

type FieldKey = string;
type FieldDef = { key: FieldKey; label: string; placeholder?: string; multiline?: boolean };

const FIELDS: Record<Exclude<AiMode, 'free'>, FieldDef[]> = {
  lesson_plan: [
    { key: 'subject', label: 'รายวิชา', placeholder: 'เช่น คณิตศาสตร์' },
    { key: 'grade', label: 'ระดับชั้น', placeholder: 'เช่น ป.4' },
    { key: 'topic', label: 'หัวข้อที่จะสอน', placeholder: 'เช่น การบวกเลขสองหลัก' },
    { key: 'duration', label: 'ระยะเวลา (นาที)', placeholder: '60' },
  ],
  exam_questions: [
    { key: 'subject', label: 'รายวิชา', placeholder: 'เช่น วิทยาศาสตร์' },
    { key: 'grade', label: 'ระดับชั้น', placeholder: 'เช่น ป.6' },
    { key: 'topic', label: 'หัวข้อ/บทเรียน', placeholder: 'เช่น ระบบสุริยจักรวาล' },
    { key: 'count', label: 'จำนวนข้อ', placeholder: '10' },
    { key: 'difficulty', label: 'ระดับความยาก', placeholder: 'ง่าย / ปานกลาง / ยาก' },
  ],
  report_comment: [
    { key: 'studentName', label: 'ชื่อนักเรียน', placeholder: 'เช่น เด็กชายสมหมาย' },
    { key: 'grade', label: 'ระดับชั้น', placeholder: 'ป.3' },
    { key: 'strengths', label: 'จุดเด่น/ความสามารถ', multiline: true, placeholder: 'อ่านคล่อง, ตอบคำถามชัดเจน, ช่วยเพื่อนเสมอ' },
    { key: 'improvements', label: 'จุดที่ควรพัฒนา', multiline: true, placeholder: 'การคำนวณยังต้องฝึก, ไม่ค่อยกล้าตอบหน้าห้อง' },
    { key: 'conduct', label: 'ความประพฤติ/คุณลักษณะ', multiline: true, placeholder: 'มาเรียนสม่ำเสมอ, สุภาพ, เคารพครู' },
  ],
};

const MODE_LABELS: Record<AiMode, string> = {
  lesson_plan: 'แผนการสอน',
  exam_questions: 'ข้อสอบ',
  report_comment: 'ความเห็นในสมุดพก',
  free: 'อิสระ',
};

export const AiAssistPanel = () => {
  const [mode, setMode] = useState<AiMode>('lesson_plan');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<AiAssistResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => aiAssistService.generate({ mode, input: inputs, notes: notes || undefined }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const reset = () => {
    setInputs({});
    setNotes('');
    setResult(null);
  };

  const onModeChange = (m: string) => {
    setMode(m as AiMode);
    setInputs({});
    setResult(null);
  };

  const fields = mode === 'free' ? [] : FIELDS[mode];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          AI ผู้ช่วยครู
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ใช้ Claude AI สร้างแผนการสอน, ข้อสอบ, และความเห็นในสมุดพก — ปรับแก้ต่อก่อนใช้งานจริง
        </p>
      </div>

      <Tabs value={mode} onValueChange={onModeChange}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="lesson_plan">แผนการสอน</TabsTrigger>
          <TabsTrigger value="exam_questions">ข้อสอบ</TabsTrigger>
          <TabsTrigger value="report_comment">สมุดพก</TabsTrigger>
          <TabsTrigger value="free">อิสระ</TabsTrigger>
        </TabsList>

        {(['lesson_plan', 'exam_questions', 'report_comment', 'free'] as AiMode[]).map((m) => (
          <TabsContent key={m} value={m} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ป้อนข้อมูล</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {m === 'free' ? (
                  <div className="space-y-2">
                    <Label>คำถาม / สิ่งที่ต้องการให้ช่วย</Label>
                    <Textarea
                      rows={6}
                      placeholder="เช่น ช่วยสรุปประวัติพระบาทสมเด็จพระจุลจอมเกล้าฯ เป็นภาษาที่ ป.4 เข้าใจง่าย"
                      value={inputs.prompt ?? ''}
                      onChange={(e) => setInputs({ ...inputs, prompt: e.target.value })}
                    />
                  </div>
                ) : (
                  fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={f.key}>{f.label}</Label>
                      {f.multiline ? (
                        <Textarea
                          id={f.key}
                          rows={3}
                          placeholder={f.placeholder}
                          value={inputs[f.key] ?? ''}
                          onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
                        />
                      ) : (
                        <Input
                          id={f.key}
                          placeholder={f.placeholder}
                          value={inputs[f.key] ?? ''}
                          onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))
                )}

                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="notes">หมายเหตุเพิ่มเติม (ไม่บังคับ)</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="เช่น เน้นกิจกรรมกลุ่ม / รวมตัวอย่างจากชีวิตประจำวัน"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1">
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        สร้างด้วย AI
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={mutation.isPending}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">ผลลัพธ์ ({MODE_LABELS[m]})</CardTitle>
                {result && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(result.text);
                      toast.success('คัดลอกแล้ว');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    คัดลอก
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {result ? (
                  <>
                    <pre className="whitespace-pre-wrap text-sm bg-muted/40 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-border font-sans">
                      {result.text}
                    </pre>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {result.model} · {result.usage.input_tokens ?? '?'} in / {result.usage.output_tokens ?? '?'} out
                      {result.usage.cached ? ` · ${result.usage.cached} cached` : ''} · {result.duration_ms} ms
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    กรอกข้อมูลแล้วกด "สร้างด้วย AI" เพื่อเริ่ม
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
