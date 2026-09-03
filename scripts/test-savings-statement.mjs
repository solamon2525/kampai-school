import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in imports)) throw Error(name); return imports[name]; } });
  return exports;
}
const utils = load('src/lib/savings-statement.ts');
const row = (id, type, amount, day) => ({ id, student_id: 'student-a', student_name: 'ชื่อซ้ำ', transaction_type: type, amount,
  transaction_date: day, created_at: `${day}T00:00:00Z`, balance_after: 9999 });
const data = [row('3', 'deposit', 0.2, '2026-09-03'), row('1', 'deposit', 1300.1, '2026-09-01'), row('2', 'withdraw', 300, '2026-09-02')];
const full = utils.buildSavingsStatement(data);
assert.equal(full.current, 1000.3);
assert.equal(full.rows[0].ledgerBalance, 1300.1);
assert.equal(full.depositCount, 2);
assert.equal(full.withdrawCount, 1);
const filtered = utils.buildSavingsStatement(data, '2026-09-02', '2026-09-02');
assert.equal(filtered.opening, 1300.1); assert.equal(filtered.closing, 1000.1); assert.equal(filtered.current, 1000.3);
const empty = utils.buildSavingsStatement(data, '2026-10-01', '2026-10-02');
assert.equal(empty.rows.length, 0); assert.equal(empty.opening, 1000.3); assert.equal(empty.closing, 1000.3);
assert.equal(utils.buildSavingsStatement([]).current, 0);
assert.equal(utils.safeStatementCell(' =SUM(A1)'), "' =SUM(A1)");
assert.equal(utils.safeStatementCell(-12), -12);
assert.throws(() => utils.buildSavingsStatement([row('bad', 'invalid', 10, '2026-09-01')]));

const many = Array.from({ length: 1051 }, (_, i) => row(String(i).padStart(4, '0'), 'deposit', 1, '2026-09-01'));
let mode = 'ok'; let pages = 0; const orders = [];
const supabase = { from(table) {
  let range = [0, 999];
  const builder = { select() { return this; }, eq(key, id) { assert.equal(key, 'student_id'); assert.equal(id, 'student-a'); return this; },
    order(key) { orders.push(key); return this; }, range(a, b) { range = [a, b]; return this; }, abortSignal() { return this; }, single() { return this; },
    then(resolve) {
      if (table === 'savings_transactions') { pages++; return Promise.resolve(resolve(mode === 'error' && range[0] > 0 ? { error: new Error('denied') } : { data: many.slice(range[0], range[1] + 1), error: null })); }
      return Promise.resolve(resolve({ data: { current_balance: mode === 'mismatch' ? 10 : 1051, total_deposits: 1051, total_withdrawals: 0, total_transactions: 1051 }, error: null }));
    } };
  return builder;
} };
const service = load('src/services/savings.service.ts', { '@/integrations/supabase/client': { supabase }, '@/lib/savings-statement': utils }).savingsStatementService;
assert.equal((await service.get('student-a')).rows.length, 1051); assert.equal(pages, 2);
assert.deepEqual(orders.slice(0, 3), ['transaction_date', 'created_at', 'id']);
mode = 'mismatch'; await assert.rejects(service.get('student-a'), /ยอดประวัติไม่ตรง/);
mode = 'error'; await assert.rejects(service.get('student-a'), /denied/);
console.log('PASS savings statement: balances, dates, empty, CSV safety, stable paging >1000, ID isolation, mismatch and failed page');
