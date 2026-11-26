import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSaleSummary,
  computeEggStockSummary,
  aggregateEggReport,
  buildEggExportSheets,
} from '../src/lib/eggFarmHelpers.ts';

test('calculateSaleSummary_per_egg_and_per_tray', () => {
  const traySale = calculateSaleSummary({
    unitType: 'แผง',
    quantity: 2,
    pricePerEgg: 5,
    pricePerTray: 150,
    eggsPerTray: 30,
  });
  assert.deepEqual(traySale, { eggsCount: 60, unitPrice: 150, totalAmount: 300 });

  const eggSale = calculateSaleSummary({
    unitType: 'ฟอง',
    quantity: 10,
    pricePerEgg: 5,
    pricePerTray: 150,
    eggsPerTray: 30,
  });
  assert.deepEqual(eggSale, { eggsCount: 10, unitPrice: 5, totalAmount: 50 });
});

test('calculateSaleSummary_override_price_and_zero_guard', () => {
  const custom = calculateSaleSummary({
    unitType: 'แผง',
    quantity: 3,
    pricePerEgg: 5,
    pricePerTray: 150,
    eggsPerTray: 30,
    overrideUnitPrice: 140,
  });
  assert.deepEqual(custom, { eggsCount: 90, unitPrice: 140, totalAmount: 420 });

  assert.throws(
    () =>
      calculateSaleSummary({
        unitType: 'ฟอง',
        quantity: 0,
        pricePerEgg: 5,
        pricePerTray: 150,
      }),
    /จำนวน/,
  );

  assert.throws(
    () =>
      calculateSaleSummary({
        unitType: 'ฟอง',
        quantity: 5,
        pricePerEgg: 5,
        pricePerTray: 150,
        overrideUnitPrice: -10,
      }),
    /ราคา/,
  );
});

test('computeEggStockSummary_handles_deficit_and_price_snapshot', () => {
  const collections = [
    { collected_date: '2026-11-25', good_eggs: 40, cracked_eggs: 2, spoiled_eggs: 1 },
    { collected_date: '2026-11-26', good_eggs: 20, cracked_eggs: 0, spoiled_eggs: 0 },
  ];
  const sales = [
    { sale_date: '2026-11-25', eggs_count: 30, total_amount: 150 },
    { sale_date: '2026-11-26', eggs_count: 45, total_amount: 210 },
  ];
  const summary = computeEggStockSummary(collections, sales);
  assert.deepEqual(summary, {
    totalGood: 60,
    totalCracked: 2,
    totalSpoiled: 1,
    totalAll: 63,
    totalSoldEggs: 75,
    remainingGoodEggs: -15,
    totalRevenue: 360,
  });
});

test('aggregateEggReport_daily_weekly_monthly', () => {
  const collections = [
    { collected_date: '2026-11-23', good_eggs: 30, cracked_eggs: 1, spoiled_eggs: 0 },
    { collected_date: '2026-11-26', good_eggs: 25, cracked_eggs: 2, spoiled_eggs: 1 },
  ];
  const sales = [
    { sale_date: '2026-11-23', eggs_count: 15, total_amount: 75 },
    { sale_date: '2026-11-26', eggs_count: 30, total_amount: 150 },
  ];

  const daily = aggregateEggReport(collections, sales, 'daily');
  assert.equal(daily.rows.length, 2);
  assert.equal(daily.totals.goodEggs, 55);
  assert.equal(daily.totals.soldEggs, 45);
  assert.equal(daily.totals.revenue, 225);

  const weekly = aggregateEggReport(collections, sales, 'weekly');
  assert.equal(weekly.rows.length, 1);
  assert.equal(weekly.rows[0].goodEggs, 55);
  assert.equal(weekly.rows[0].soldEggs, 45);
  assert.equal(weekly.rows[0].revenue, 225);

  const monthly = aggregateEggReport(collections, sales, 'monthly');
  assert.equal(monthly.rows.length, 1);
  assert.equal(monthly.rows[0].periodKey, '2026-11');
  assert.equal(monthly.rows[0].periodLabel, 'พ.ย. 2569');

  const filtered = aggregateEggReport(collections, sales, 'daily', '2026-11-25', '2026-11-26');
  assert.equal(filtered.rows.length, 1);
  assert.equal(filtered.rows[0].periodKey, '2026-11-26');
});

test('buildEggExportSheets_empty_dataset', () => {
  const sheets = buildEggExportSheets([], [], []);
  assert.equal(sheets.summarySheet.length, 0);
  assert.equal(sheets.collectionsSheet.length, 0);
  assert.equal(sheets.salesSheet.length, 0);
});
