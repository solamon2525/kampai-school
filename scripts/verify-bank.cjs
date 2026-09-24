// Run with node scripts/verify-bank.cjs; uses the project's TypeScript compiler.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function load(relative) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(filename, module); mod.filename = filename; mod.paths = module.paths; mod._compile(compiled, filename); return mod.exports;
}
const { readBankPages } = load('src/lib/bank-pagination.ts');
const { thaiBankToday, bankTotals, bankTrend, filterBankActivities, bankNumber } = load('src/lib/bank-dashboard.ts');
async function main() {
  const source = Array.from({ length: 2137 }, (_, i) => i);
  for (const cap of [1000, 500]) {
    const actual = await readBankPages(async (from, to) => ({ data: source.slice(from, Math.min(to + 1, from + cap)), error: null }));
    assert.deepEqual(actual, source, `complete ledger with server cap ${cap}`);
  }
  await assert.rejects(readBankPages(async from => from === 0 ? { data: [1], error: null } : { data: null, error: new Error('offline') }), /offline/);
  assert.equal(thaiBankToday(new Date('2026-08-31T18:00:00Z')), '2026-09-01');
  assert.equal(bankNumber(null), '—');
  assert.equal(bankNumber(0), '0');
  const students = [{ student_id: 'a', full_name: 'เด็กทดสอบ', class_name: 'ป.1', student_code: '0001', photo_url: null }, { student_id: 'b', full_name: 'เด็กอีกคน', class_name: 'ป.2', student_code: '0002', photo_url: null }];
  const base = { className: 'ป.1', category: 'ฝาก', categoryId: 'deposit', color: null, outgoing: 0, points: 0, count: 1 };
  const rows = [
    { ...base, id: '1', studentId: 'a', date: '2026-08-31', incoming: 100 },
    { ...base, id: '2', studentId: 'a', date: '2026-09-01', incoming: 20 },
    { ...base, id: '3', studentId: 'a', date: '2026-09-03', incoming: 0, outgoing: 5, count: 0 },
    { ...base, id: '4', studentId: 'b', date: '2026-09-03', className: 'ป.2', incoming: 50 },
  ];
  const filter = { period: 'custom', start: '2026-09-01', end: '2026-09-03', className: 'all', category: 'all', search: '' };
  const filtered = filterBankActivities(rows, students, filter);
  assert.deepEqual(bankTotals(filtered), { incoming: 70, outgoing: 5, points: 0, count: 2 });
  assert.equal(filterBankActivities(rows, students, { ...filter, search: '0001' }).length, 2);
  assert.equal(filterBankActivities(rows, students, { ...filter, className: 'ป.2' }).length, 1);
  assert.equal(filterBankActivities(rows, students, { ...filter, category: 'missing' }).length, 0);
  const trend = bankTrend(filtered, filter);
  assert.equal(trend.length, 3); assert.equal(trend[1].incoming, 0);
  assert.deepEqual(bankTotals(trend), bankTotals(filtered));
  assert.equal(bankTrend([], { ...filter, period: 'all' }).length, 0);
  assert.equal(bankTrend(rows, { ...filter, start: '2026-01-01', end: '2026-12-31' }).length, 12);
  const large = Array.from({ length: 1101 }, (_, i) => ({ ...rows[1], id: String(i) }));
  assert.equal(bankTotals(filterBankActivities(large, students, filter)).incoming, 22020);
  console.log('PASS: pagination 2,137 rows / server caps / errors / Thai month boundary / unknown values / search / class / category / zero-fill / monthly aggregation / full totals');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
