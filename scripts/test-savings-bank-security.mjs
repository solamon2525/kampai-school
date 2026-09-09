import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = ['493_secure_savings_bank_access_and_ledger.sql', '494_activate_savings_bank_rpc_only_access.sql']
  .map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n');
const service = readFileSync('src/services/savings.service.ts', 'utf8');
const parent = readFileSync('src/components/parent/SavingsBankParentView.tsx', 'utf8');
const publicPage = readFileSync('src/pages/SavingsBank.tsx', 'utf8');

for (const marker of [
  'REVOKE ALL ON public.savings_transactions FROM PUBLIC, anon, authenticated',
  'ALTER VIEW public.savings_student_summary SET (security_invoker = true)',
  'CREATE OR REPLACE FUNCTION public.record_savings_transaction',
  'CREATE OR REPLACE FUNCTION public.delete_savings_transaction',
  'CREATE OR REPLACE FUNCTION public.get_parent_savings_summary',
  'CREATE OR REPLACE FUNCTION public.get_parent_savings_history',
  'CREATE OR REPLACE FUNCTION public.get_public_savings_leaderboard',
]) assert.match(migration, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

assert.match(service, /record_savings_transaction/);
assert.match(service, /get_public_savings_overview/);
assert.match(service, /delete_savings_transaction/);
assert.match(parent, /getForParent/);
assert.match(parent, /savingsParentService\.getHistory/);
assert.match(publicPage, /savingsTransactionsService\.getRecent/);
assert.match(publicPage, /savingsSummaryService\.getLeaderboard/);
assert.doesNotMatch(publicPage, /savingsSummaryService\.getAll/);
const leaderboard = migration.split('CREATE OR REPLACE FUNCTION public.get_public_savings_leaderboard')[1].split('CREATE OR REPLACE FUNCTION')[0];
assert.doesNotMatch(leaderboard, /student_code|current_balance|total_deposits|total_withdrawals/);
assert.doesNotMatch(migration, /DROP POLICY[^;]+ON public\.savings_student_summary/);
for (const path of ['src/components/admin/savings-bank/SavingsBankManagement.tsx', 'src/pages/admin/ScanRecorder.tsx']) {
  const source = readFileSync(path, 'utf8');
  assert.match(source, /Number\((?:form\.)?amount\)/);
  assert.match(source, /saved\[0\]\.balance_after/);
}
assert.doesNotMatch(publicPage, /\.from\(['"]savings_transactions['"]\)/);
console.log('PASS savings bank security contract: RPC access, protected view, ledger writes, parent authorization, public-safe reads');
