/**
 * eggFarmHelpers.ts — Pure calculation, stock summary, report aggregation & Excel export helpers
 * for the School Egg Farm Management system.
 */

export type EggUnitType = 'ฟอง' | 'แผง';
export type ReportGranularity = 'daily' | 'weekly' | 'monthly';

export interface EggCollectionLike {
  collected_date: string;
  period?: string;
  good_eggs: number;
  cracked_eggs: number;
  spoiled_eggs: number;
  total_eggs?: number;
  recorder_name?: string;
  note?: string | null;
}

export interface EggSaleLike {
  sale_date: string;
  unit_type?: EggUnitType | string;
  quantity?: number;
  eggs_count: number;
  unit_price?: number;
  total_amount: number;
  buyer_name?: string | null;
  payment_method?: string;
  recorder_name?: string;
  note?: string | null;
}

export interface SaleSummaryResult {
  eggsCount: number;
  unitPrice: number;
  totalAmount: number;
}

export interface EggStockSummary {
  totalGood: number;
  totalCracked: number;
  totalSpoiled: number;
  totalAll: number;
  totalSoldEggs: number;
  remainingGoodEggs: number;
  totalRevenue: number;
}

export interface EggReportPeriodRow {
  periodKey: string;
  periodLabel: string;
  goodEggs: number;
  crackedEggs: number;
  spoiledEggs: number;
  totalEggs: number;
  soldEggs: number;
  revenue: number;
  collectionCount: number;
  saleCount: number;
}

export interface EggReportTotals {
  goodEggs: number;
  crackedEggs: number;
  spoiledEggs: number;
  totalEggs: number;
  soldEggs: number;
  revenue: number;
  collectionCount: number;
  saleCount: number;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

function parseIsoDateParts(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function formatThaiShortFromIso(iso: string): string {
  const parts = parseIsoDateParts(iso);
  if (!parts) return iso;
  return `${parts.day} ${THAI_MONTHS_SHORT[parts.month - 1]} ${parts.year + 543}`;
}

function getMondayWeekRange(iso: string): { weekKey: string; label: string } {
  const parts = parseIsoDateParts(iso);
  if (!parts) return { weekKey: iso, label: iso };
  // Use UTC noon to avoid any local/DST day-boundary shift
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  const monday = new Date(d.getTime() - dow * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const monIso = monday.toISOString().slice(0, 10);
  const sunIso = sunday.toISOString().slice(0, 10);
  return {
    weekKey: monIso,
    label: `${formatThaiShortFromIso(monIso)} - ${formatThaiShortFromIso(sunIso)}`,
  };
}

function getPeriodBucket(
  iso: string,
  granularity: ReportGranularity,
): { periodKey: string; periodLabel: string } {
  if (granularity === 'daily') {
    const key = iso.slice(0, 10);
    return { periodKey: key, periodLabel: formatThaiShortFromIso(key) };
  }
  if (granularity === 'weekly') {
    const { weekKey, label } = getMondayWeekRange(iso);
    return { periodKey: weekKey, periodLabel: label };
  }
  const parts = parseIsoDateParts(iso);
  if (!parts) return { periodKey: iso.slice(0, 7), periodLabel: iso.slice(0, 7) };
  const key = `${parts.year}-${String(parts.month).padStart(2, '0')}`;
  const label = `${THAI_MONTHS_SHORT[parts.month - 1]} ${parts.year + 543}`;
  return { periodKey: key, periodLabel: label };
}

export function calculateSaleSummary(params: {
  unitType: EggUnitType;
  quantity: number;
  pricePerEgg: number;
  pricePerTray: number;
  eggsPerTray?: number;
  overrideUnitPrice?: number;
}): SaleSummaryResult {
  const { unitType, quantity, pricePerEgg, pricePerTray, eggsPerTray = 30, overrideUnitPrice } = params;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('จำนวนที่ขายต้องมากกว่า 0');
  }

  const defaultPrice = unitType === 'แผง' ? pricePerTray : pricePerEgg;
  const unitPrice = overrideUnitPrice !== undefined ? overrideUnitPrice : defaultPrice;

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error('ราคาต่อหน่วยต้องไม่ติดลบ');
  }

  const perUnitEggs = unitType === 'แผง' ? Math.max(1, Math.trunc(eggsPerTray)) : 1;
  const eggsCount = Math.trunc(quantity) * perUnitEggs;
  const totalAmount = Math.round(Math.trunc(quantity) * unitPrice * 100) / 100;

  return { eggsCount, unitPrice, totalAmount };
}

export function computeEggStockSummary(
  collections: EggCollectionLike[],
  sales: EggSaleLike[],
): EggStockSummary {
  let totalGood = 0;
  let totalCracked = 0;
  let totalSpoiled = 0;

  for (const c of collections) {
    totalGood += Number(c.good_eggs) || 0;
    totalCracked += Number(c.cracked_eggs) || 0;
    totalSpoiled += Number(c.spoiled_eggs) || 0;
  }

  let totalSoldEggs = 0;
  let totalRevenue = 0;

  for (const s of sales) {
    totalSoldEggs += Number(s.eggs_count) || 0;
    totalRevenue += Number(s.total_amount) || 0;
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100;

  return {
    totalGood,
    totalCracked,
    totalSpoiled,
    totalAll: totalGood + totalCracked + totalSpoiled,
    totalSoldEggs,
    remainingGoodEggs: totalGood - totalSoldEggs,
    totalRevenue,
  };
}

export function aggregateEggReport(
  collections: EggCollectionLike[],
  sales: EggSaleLike[],
  granularity: ReportGranularity,
  dateFrom?: string,
  dateTo?: string,
): { rows: EggReportPeriodRow[]; totals: EggReportTotals } {
  const inRange = (iso: string) => {
    const d = iso.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const buckets = new Map<string, EggReportPeriodRow>();

  const getOrCreate = (iso: string): EggReportPeriodRow => {
    const { periodKey, periodLabel } = getPeriodBucket(iso, granularity);
    let row = buckets.get(periodKey);
    if (!row) {
      row = {
        periodKey,
        periodLabel,
        goodEggs: 0,
        crackedEggs: 0,
        spoiledEggs: 0,
        totalEggs: 0,
        soldEggs: 0,
        revenue: 0,
        collectionCount: 0,
        saleCount: 0,
      };
      buckets.set(periodKey, row);
    }
    return row;
  };

  for (const c of collections) {
    if (!inRange(c.collected_date)) continue;
    const row = getOrCreate(c.collected_date);
    const good = Number(c.good_eggs) || 0;
    const cracked = Number(c.cracked_eggs) || 0;
    const spoiled = Number(c.spoiled_eggs) || 0;
    row.goodEggs += good;
    row.crackedEggs += cracked;
    row.spoiledEggs += spoiled;
    row.totalEggs += good + cracked + spoiled;
    row.collectionCount += 1;
  }

  for (const s of sales) {
    if (!inRange(s.sale_date)) continue;
    const row = getOrCreate(s.sale_date);
    row.soldEggs += Number(s.eggs_count) || 0;
    row.revenue = Math.round((row.revenue + (Number(s.total_amount) || 0)) * 100) / 100;
    row.saleCount += 1;
  }

  const rows = Array.from(buckets.values()).sort((a, b) => a.periodKey.localeCompare(b.periodKey));

  const totals: EggReportTotals = rows.reduce(
    (acc, r) => ({
      goodEggs: acc.goodEggs + r.goodEggs,
      crackedEggs: acc.crackedEggs + r.crackedEggs,
      spoiledEggs: acc.spoiledEggs + r.spoiledEggs,
      totalEggs: acc.totalEggs + r.totalEggs,
      soldEggs: acc.soldEggs + r.soldEggs,
      revenue: Math.round((acc.revenue + r.revenue) * 100) / 100,
      collectionCount: acc.collectionCount + r.collectionCount,
      saleCount: acc.saleCount + r.saleCount,
    }),
    {
      goodEggs: 0,
      crackedEggs: 0,
      spoiledEggs: 0,
      totalEggs: 0,
      soldEggs: 0,
      revenue: 0,
      collectionCount: 0,
      saleCount: 0,
    },
  );

  return { rows, totals };
}

export function buildEggExportSheets(
  collections: EggCollectionLike[],
  sales: EggSaleLike[],
  reportRows: EggReportPeriodRow[],
): {
  summarySheet: Record<string, unknown>[];
  collectionsSheet: Record<string, unknown>[];
  salesSheet: Record<string, unknown>[];
} {
  const summarySheet = reportRows.map((r) => ({
    ช่วงเวลา: r.periodLabel,
    'ไข่ดี (ฟอง)': r.goodEggs,
    'ไข่ร้าว (ฟอง)': r.crackedEggs,
    'ไข่เสีย (ฟอง)': r.spoiledEggs,
    'รวมเก็บ (ฟอง)': r.totalEggs,
    'ขายแล้ว (ฟอง)': r.soldEggs,
    'ยอดขาย (บาท)': r.revenue,
    'จำนวนครั้งเก็บ': r.collectionCount,
    'จำนวนรายการขาย': r.saleCount,
  }));

  const collectionsSheet = collections.map((c) => ({
    วันที่เก็บ: formatThaiShortFromIso(c.collected_date),
    ช่วงเวลา: c.period ?? '-',
    'ไข่ดี (ฟอง)': c.good_eggs,
    'ไข่ร้าว (ฟอง)': c.cracked_eggs,
    'ไข่เสีย (ฟอง)': c.spoiled_eggs,
    'รวมทั้งหมด (ฟอง)': (c.good_eggs || 0) + (c.cracked_eggs || 0) + (c.spoiled_eggs || 0),
    ผู้บันทึก: c.recorder_name ?? '-',
    หมายเหตุ: c.note ?? '',
  }));

  const salesSheet = sales.map((s) => ({
    วันที่ขาย: formatThaiShortFromIso(s.sale_date),
    หน่วยขาย: s.unit_type ?? 'ฟอง',
    จำนวนหน่วย: s.quantity ?? s.eggs_count,
    'รวมจำนวนฟอง': s.eggs_count,
    'ราคาต่อหน่วย (บาท)': s.unit_price ?? 0,
    'ยอดขายรวม (บาท)': s.total_amount,
    ผู้ซื้อ: s.buyer_name ?? '-',
    วิธีชำระเงิน: s.payment_method ?? '-',
    ผู้บันทึก: s.recorder_name ?? '-',
    หมายเหตุ: s.note ?? '',
  }));

  return { summarySheet, collectionsSheet, salesSheet };
}
