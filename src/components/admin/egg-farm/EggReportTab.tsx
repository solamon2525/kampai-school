import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { getBangkokTodayIso } from '@/lib/thaiDate';
import {
  aggregateEggReport,
  buildEggExportSheets,
  type ReportGranularity,
} from '@/lib/eggFarmHelpers';
import type { EggCollection, EggSale } from '@/services/egg-farm.service';
import { cn } from '@/lib/utils';

interface EggReportTabProps {
  collections: EggCollection[];
  sales: EggSale[];
}

const GRANULARITY_OPTIONS: { value: ReportGranularity; label: string }[] = [
  { value: 'daily', label: 'รายวัน' },
  { value: 'weekly', label: 'รายสัปดาห์' },
  { value: 'monthly', label: 'รายเดือน' },
];

export function EggReportTab({ collections, sales }: EggReportTabProps) {
  const [granularity, setGranularity] = useState<ReportGranularity>('daily');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { rows, totals } = useMemo(
    () =>
      aggregateEggReport(
        collections,
        sales,
        granularity,
        dateFrom || undefined,
        dateTo || undefined,
      ),
    [collections, sales, granularity, dateFrom, dateTo],
  );

  const filteredCollections = useMemo(
    () =>
      collections.filter((c) => {
        if (dateFrom && c.collected_date < dateFrom) return false;
        if (dateTo && c.collected_date > dateTo) return false;
        return true;
      }),
    [collections, dateFrom, dateTo],
  );

  const filteredSales = useMemo(
    () =>
      sales.filter((s) => {
        if (dateFrom && s.sale_date < dateFrom) return false;
        if (dateTo && s.sale_date > dateTo) return false;
        return true;
      }),
    [sales, dateFrom, dateTo],
  );

  const applyPreset = (preset: '7d' | 'month' | 'all') => {
    const today = getBangkokTodayIso();
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }
    if (preset === 'month') {
      setDateFrom(`${today.slice(0, 7)}-01`);
      setDateTo(today);
      return;
    }
    const base = new Date(`${today}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() - 6);
    setDateFrom(base.toISOString().slice(0, 10));
    setDateTo(today);
  };

  const handleExportExcel = () => {
    const { summarySheet, collectionsSheet, salesSheet } = buildEggExportSheets(
      filteredCollections,
      filteredSales,
      rows,
    );

    const wb = XLSX.utils.book_new();

    const wsSummary =
      summarySheet.length > 0
        ? XLSX.utils.json_to_sheet(summarySheet)
        : XLSX.utils.aoa_to_sheet([
            [
              'ช่วงเวลา',
              'ไข่ดี (ฟอง)',
              'ไข่ร้าว (ฟอง)',
              'ไข่เสีย (ฟอง)',
              'รวมเก็บ (ฟอง)',
              'ขายแล้ว (ฟอง)',
              'ยอดขาย (บาท)',
            ],
          ]);

    const wsCollections =
      collectionsSheet.length > 0
        ? XLSX.utils.json_to_sheet(collectionsSheet)
        : XLSX.utils.aoa_to_sheet([
            ['วันที่เก็บ', 'ช่วงเวลา', 'ไข่ดี (ฟอง)', 'ไข่ร้าว (ฟอง)', 'ไข่เสีย (ฟอง)', 'รวมทั้งหมด (ฟอง)', 'ผู้บันทึก', 'หมายเหตุ'],
          ]);

    const wsSales =
      salesSheet.length > 0
        ? XLSX.utils.json_to_sheet(salesSheet)
        : XLSX.utils.aoa_to_sheet([
            ['วันที่ขาย', 'หน่วยขาย', 'จำนวนหน่วย', 'รวมจำนวนฟอง', 'ราคาต่อหน่วย (บาท)', 'ยอดขายรวม (บาท)', 'ผู้ซื้อ', 'วิธีชำระเงิน', 'ผู้บันทึก', 'หมายเหตุ'],
          ]);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปรายงาน');
    XLSX.utils.book_append_sheet(wb, wsCollections, 'บันทึกเก็บไข่');
    XLSX.utils.book_append_sheet(wb, wsSales, 'บันทึกขายไข่');

    const granularityLabel =
      GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label ?? granularity;
    const today = getBangkokTodayIso();
    XLSX.writeFile(wb, `รายงานฟาร์มไก่ไข่_${granularityLabel}_${today}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">รูปแบบรายงาน</Label>
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGranularity(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    granularity === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ตั้งแต่วันที่</Label>
              <ThaiDatePicker value={dateFrom} onChange={setDateFrom} placeholder="ทั้งหมด" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ถึงวันที่</Label>
              <ThaiDatePicker value={dateTo} onChange={setDateTo} placeholder="ทั้งหมด" />
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('7d')}>
                7 วันล่าสุด
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('month')}>
                เดือนนี้
              </Button>
              {(dateFrom || dateTo) && (
                <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset('all')}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  ล้าง
                </Button>
              )}
            </div>
          </div>

          <Button type="button" onClick={handleExportExcel} className="shrink-0">
            <Download className="w-4 h-4 mr-2" />
            Export Excel (.xlsx)
          </Button>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">กราฟเปรียบเทียบผลผลิตและยอดขาย</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="goodEggs" name="ไข่ดี (ฟอง)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="soldEggs" name="ขายแล้ว (ฟอง)" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            ตารางสรุปผล ({GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label})
          </CardTitle>
          <span className="text-xs text-muted-foreground">{rows.length} ช่วงเวลา</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-muted-foreground">
                  <th className="text-left font-medium py-2.5 px-4">ช่วงเวลา</th>
                  <th className="text-right font-medium py-2.5 px-3">ไข่ดี (ฟอง)</th>
                  <th className="text-right font-medium py-2.5 px-3">ไข่ร้าว</th>
                  <th className="text-right font-medium py-2.5 px-3">ไข่เสีย</th>
                  <th className="text-right font-medium py-2.5 px-3">รวมเก็บ</th>
                  <th className="text-right font-medium py-2.5 px-3">ขายแล้ว (ฟอง)</th>
                  <th className="text-right font-medium py-2.5 px-4">ยอดขาย (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.periodKey} className="border-b border-border hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-medium text-foreground">{r.periodLabel}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                      {r.goodEggs.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700">
                      {r.crackedEggs.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-destructive">
                      {r.spoiledEggs.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {r.totalEggs.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {r.soldEggs.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-primary">
                      ฿{r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold border-t border-border">
                  <td className="py-2.5 px-4">รวมทั้งหมด</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {totals.goodEggs.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    {totals.crackedEggs.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-destructive">
                    {totals.spoiledEggs.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">{totals.totalEggs.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">{totals.soldEggs.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-primary">
                    ฿{totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
