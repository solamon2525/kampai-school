import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Database, Download, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { dmcExportService } from '@/services/dmc-export.service';
import { studentsService } from '@/services/students.service';

const ALL = '__all__';

export const DmcExportPanel = () => {
  const [classFilter, setClassFilter] = useState<string>(ALL);

  const { data: students = [] } = useQuery({
    queryKey: ['students-active-mini'],
    queryFn: async () => {
      const r = await studentsService.getActive();
      return r.data ?? [];
    },
  });

  const classList = Array.from(new Set(students.map((s: any) => s.class).filter(Boolean))).sort();
  const filteredCount = classFilter === ALL ? students.length : students.filter((s: any) => s.class === classFilter).length;

  const exportMut = useMutation({
    mutationFn: () => dmcExportService.downloadExcel(classFilter === ALL ? undefined : classFilter),
    onSuccess: (count) => toast.success(`Export สำเร็จ ${count} รายการ`),
    onError: (e: Error) => toast.error(e.message),
  });

  // Preview rows
  const { data: previewRows = [] } = useQuery({
    queryKey: ['dmc-preview', classFilter],
    queryFn: () => dmcExportService.fetchRows(classFilter === ALL ? undefined : classFilter),
    staleTime: 60_000,
  });

  // Completeness audit
  const missing = previewRows.reduce(
    (acc, r) => {
      if (!r.เลขประจำตัวประชาชน) acc.id++;
      if (!r.น้ำหนัก_kg) acc.weight++;
      if (!r.ส่วนสูง_cm) acc.height++;
      if (!r.กรุ๊ปเลือด) acc.blood++;
      if (!r.วันเกิด) acc.birth++;
      return acc;
    },
    { id: 0, weight: 0, height: 0, blood: 0, birth: 0 },
  );

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" />
          DMC Export (Data Management Center)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export ข้อมูลนักเรียนเป็น Excel ตามรูปแบบ DMC ของ สพฐ. — ส่งภาคเรียนละ 1 ครั้ง (มิ.ย. + พ.ย.)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">ชั้น:</span>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกชั้น</SelectItem>
                {classList.map((c) => (
                  <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">{filteredCount} คน</Badge>
          </div>

          <Button onClick={() => exportMut.mutate()} disabled={!filteredCount || exportMut.isPending}>
            {exportMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            ดาวน์โหลด Excel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            ตรวจความครบของข้อมูล ({previewRows.length} ระเบียน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'ขาดเลขปชช.', value: missing.id },
              { label: 'ขาดวันเกิด', value: missing.birth },
              { label: 'ขาดน้ำหนัก', value: missing.weight },
              { label: 'ขาดส่วนสูง', value: missing.height },
              { label: 'ขาดกรุ๊ปเลือด', value: missing.blood },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg border border-border bg-card text-center">
                <p className={`text-2xl font-bold ${s.value === 0 ? 'text-green-600' : 'text-amber-600'}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {(missing.weight > 0 || missing.height > 0 || missing.blood > 0) && (
            <p className="text-xs text-amber-700 mt-3">
              💡 กรอกข้อมูลที่ขาดในหน้า <strong>"ข้อมูลสุขภาพนักเรียน"</strong> ก่อน export
              (น้ำหนัก/ส่วนสูง/กรุ๊ปเลือด เป็น field บังคับของ DMC)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ตัวอย่างข้อมูล (5 ระเบียนแรก)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border">
                {['ลำดับ', 'รหัสนักเรียน', 'ชั้น/ห้อง/เลขที่', 'ชื่อ-นามสกุล', 'เลขปชช.', 'น้ำหนัก/ส่วนสูง', 'กรุ๊ปเลือด'].map((h) => (
                  <th key={h} className="py-2 pr-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(0, 5).map((r) => (
                <tr key={r.รหัสนักเรียน || `${r.ลำดับ}`} className="border-b border-border/50">
                  <td className="py-2 pr-3">{r.ลำดับ}</td>
                  <td className="py-2 pr-3 font-mono">{r.รหัสนักเรียน}</td>
                  <td className="py-2 pr-3">{[r.ชั้น, r.ห้อง, r.เลขที่].filter(Boolean).join('/')}</td>
                  <td className="py-2 pr-3">{[r.คำนำหน้า, r.ชื่อ, r.นามสกุล].filter(Boolean).join(' ')}</td>
                  <td className="py-2 pr-3 font-mono">{r.เลขประจำตัวประชาชน || '—'}</td>
                  <td className="py-2 pr-3">{r.น้ำหนัก_kg || '—'} / {r.ส่วนสูง_cm || '—'}</td>
                  <td className="py-2 pr-3">{r.กรุ๊ปเลือด || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!previewRows.length && (
            <p className="text-center text-sm text-muted-foreground py-8">ไม่พบข้อมูล</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
