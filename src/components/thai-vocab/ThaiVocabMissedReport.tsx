/**
 * ThaiVocabMissedReport — รายงานคำที่พลาด (เฟส E)
 */
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { thaiVocabService, type ThaiVocabMissedReportRow, type ThaiVocabClassMissedRow } from '@/services/thai-vocab.service';
import { paporService } from '@/services/papor.service';
import { cn } from '@/lib/utils';

export function ThaiVocabMissedReportStudent({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['thai-vocab-missed-report', studentId],
    queryFn: () => thaiVocabService.getMissedReport(studentId),
    enabled: !!studentId,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-600" />
          คำที่ควรทบทวน
          {studentName ? ` — ${studentName}` : ''}
        </CardTitle>
        <CardDescription>
          จากเกม Thai Vocab Hub — เรียงตามครั้งที่พลาดล่าสุด
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            ยังไม่มีคำที่บันทึกว่าพลาด — เล่นโหมดฝึกแล้วตอบผิดจะขึ้นที่นี่
          </p>
        ) : (
          <MissedTable rows={data} />
        )}
      </CardContent>
    </Card>
  );
}

export function ThaiVocabMissedReportClass() {
  const [classLabel, setClassLabel] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['papor-classes'],
    queryFn: () => paporService.listClasses(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['thai-vocab-class-missed', classLabel],
    queryFn: () => thaiVocabService.getClassMissedReport(classLabel),
    enabled: !!classLabel,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">ชั้นเรียน</span>
        <Select value={classLabel} onValueChange={setClassLabel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="เลือกชั้น" />
          </SelectTrigger>
          <SelectContent>
            {(classes ?? []).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      )}

      {!isLoading && classLabel && (!data || data.length === 0) && (
        <p className="text-sm text-muted-foreground">ชั้นนี้ยังไม่มีคำพลาดบันทึกไว้</p>
      )}

      {(data ?? []).map((row) => (
        <Card key={row.student_id}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">
                {row.student_name}
                {row.class_number != null && (
                  <span className="text-muted-foreground font-normal ml-1">เลขที่ {row.class_number}</span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{row.unique_words} คำ</Badge>
                <Badge variant="secondary">พลาดรวม {row.total_misses}</Badge>
              </div>
            </div>
          </CardHeader>
          {row.recent?.length > 0 && (
            <CardContent className="pt-0 px-4 pb-4">
              <ul className="text-sm space-y-1">
                {row.recent.map((w, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-border/50 py-1 last:border-0">
                    <span><strong>{w.word}</strong> [{w.reading}]</span>
                    <span className="text-muted-foreground shrink-0">×{w.miss_count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function MissedTable({ rows }: { rows: ThaiVocabMissedReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="text-left px-3 py-2 font-medium">คำ</th>
            <th className="text-left px-3 py-2 font-medium">หมวด</th>
            <th className="text-right px-3 py-2 font-medium">ครั้ง</th>
            <th className="text-right px-3 py-2 font-medium">ล่าสุด</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.category_slug}-${r.word}-${i}`} className="border-t border-border">
              <td className="px-3 py-2">
                <p className="font-medium">{r.word}</p>
                <p className="text-xs text-muted-foreground">[{r.reading}] {r.meaning}</p>
                {r.indicator_code && (
                  <Badge variant="outline" className="text-[10px] mt-1">{r.indicator_code}</Badge>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{r.category_title}</td>
              <td className="px-3 py-2 text-right tabular-nums">{r.miss_count}</td>
              <td className={cn('px-3 py-2 text-right text-xs text-muted-foreground whitespace-nowrap')}>
                {formatDistanceToNow(new Date(r.last_missed_at), { addSuffix: true, locale: th })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
