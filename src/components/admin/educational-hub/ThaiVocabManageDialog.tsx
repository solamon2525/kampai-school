/**
 * ThaiVocabManageDialog — จัดการคลังคำศัพท์ Thai Vocab Hub (เฟส D)
 * นำเข้า/ส่งออก CSV + สถิติหมวด (admin เท่านั้น — GamesTab)
 */
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  thaiVocabService,
  parseVocabCsv,
  vocabRowsToCsv,
} from '@/services/thai-vocab.service';
import type { EduHubItem } from '@/services/educational-hub.service';

export const ThaiVocabManageDialog = ({
  item,
  onClose,
}: {
  item: EduHubItem;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['thai-vocab-stats'],
    queryFn: () => thaiVocabService.getStats(),
  });

  const totalItems = (stats ?? []).reduce((s, c) => s + c.item_count, 0);
  const totalIndicators = (stats ?? []).reduce((s, c) => s + c.with_indicator, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await thaiVocabService.fetchAllItemsForExport();
      if (rows.length === 0) {
        toast({
          title: 'ยังไม่มีข้อมูลใน DB',
          description: 'รัน node scripts/seed-thai-vocab-db.mjs ก่อน หรือนำเข้า CSV',
          variant: 'destructive',
        });
        return;
      }
      const csv = vocabRowsToCsv(rows);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thai-vocab-hub-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'ส่งออก CSV สำเร็จ', description: `${rows.length} แถว` });
    } catch (err) {
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseVocabCsv(text);
      if (rows.length === 0) {
        toast({ title: 'ไฟล์ว่างหรือรูปแบบไม่ถูกต้อง', variant: 'destructive' });
        return;
      }

      const BATCH = 200;
      for (let i = 0; i < rows.length; i += BATCH) {
        await thaiVocabService.upsertItems(rows.slice(i, i + BATCH));
      }

      queryClient.invalidateQueries({ queryKey: ['thai-vocab-stats'] });
      queryClient.invalidateQueries({ queryKey: ['thai-vocab-catalog'] });
      toast({ title: 'นำเข้าสำเร็จ', description: `อัปเดต ${rows.length} คำ` });
    } catch (err) {
      toast({
        title: 'นำเข้าไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>จัดการคำศัพท์ — {item.title}</DialogTitle>
        <DialogDescription>
          คลังคำศัพท์ใน Supabase (migration 278) — นำเข้า/ส่งออก CSV
          คอลัมน์: category_slug, word, reading, meaning, emoji, grade, difficulty, indicator_code
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 mx-auto animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-md border border-border bg-card px-3 py-1.5">
              รวม <strong>{totalItems}</strong> คำ
            </span>
            <span className="rounded-md border border-border bg-card px-3 py-1.5">
              ผูกตัวชี้วัด <strong>{totalIndicators}</strong> คำ
            </span>
            <span className="rounded-md border border-border bg-card px-3 py-1.5">
              <strong>{(stats ?? []).length}</strong> หมวด
            </span>
          </div>

          {(stats ?? []).length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">หมวด</th>
                    <th className="text-right px-2 py-1.5 font-medium">คำ</th>
                    <th className="text-right px-2 py-1.5 font-medium">ตัวชี้วัด</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats ?? []).map((c) => (
                    <tr key={c.slug} className="border-t border-border">
                      <td className="px-2 py-1">{c.title}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{c.item_count}</td>
                      <td className={cn(
                        'px-2 py-1 text-right tabular-nums',
                        c.with_indicator < c.item_count && 'text-muted-foreground',
                      )}>
                        {c.with_indicator}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(stats ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border p-3">
              ยังไม่มีข้อมูลใน DB — รัน{' '}
              <code className="text-xs bg-muted px-1 rounded">node scripts/seed-thai-vocab-db.mjs</code>{' '}
              หลัง apply migration 278
            </p>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      )}

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onClose} disabled={importing || exporting}>
          ปิด
        </Button>
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={importing || exporting || isLoading}
        >
          {importing ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> นำเข้า...</>
          ) : (
            <><Upload className="h-4 w-4 mr-1" /> นำเข้า CSV</>
          )}
        </Button>
        <Button onClick={handleExport} disabled={importing || exporting || isLoading}>
          {exporting ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> ส่งออก...</>
          ) : (
            <><Download className="h-4 w-4 mr-1" /> ส่งออก CSV</>
          )}
        </Button>
      </DialogFooter>
    </>
  );
};
