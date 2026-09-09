import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Supply a locally installed PGlite module; no connection to production is made.
const { PGlite } = await import(process.env.SAVINGS_PGLITE_MODULE
  ? pathToFileURL(process.env.SAVINGS_PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE FUNCTION public.is_teacher() RETURNS boolean LANGUAGE sql STABLE AS
      $$ SELECT coalesce(current_setting('test.staff', true), '') = 'yes' $$;
    CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
    CREATE TABLE students (id uuid PRIMARY KEY, name text, class text, photo_url text, student_code text, is_active boolean DEFAULT true);
    CREATE TABLE staff (id uuid PRIMARY KEY); CREATE TABLE administrators (id uuid PRIMARY KEY);
    CREATE TABLE parent_student_links (user_id uuid, student_id uuid);
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT SELECT ON students TO authenticated;
  `);
  for (const file of ['045_savings_bank.sql', '046_savings_summary_deposit_count.sql', '103_savings_whole_baht.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  }
  // Reproduce Supabase's existing explicit grants, not only PUBLIC inheritance.
  await db.exec('GRANT ALL ON savings_transactions, savings_student_summary TO anon, authenticated');
  await db.exec(readFileSync('supabase/migrations/20260903074254_secure_savings_bank_access_and_ledger.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/20260909003859_activate_savings_bank_rpc_only_access.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/20260909004057_revoke_savings_mutation_anon_execute.sql', 'utf8'));
  const a = '10000000-0000-0000-0000-000000000001';
  const b = '10000000-0000-0000-0000-000000000002';
  const parent = '20000000-0000-0000-0000-000000000001';
  await db.query(`INSERT INTO students(id,name,class,student_code) VALUES ($1,'Test A','P1','A'),($2,'Test B','P2','B')`, [a,b]);
  await db.query('INSERT INTO parent_student_links VALUES ($1,$2)', [parent,a]);
  await db.exec("SET test.staff='yes'; SET ROLE authenticated");
  const record = async (id, type, amount, date = '2026-09-03') =>
    (await db.query('SELECT * FROM record_savings_transaction($1,$2,$3,$4)', [id,type,amount,date])).rows[0];
  const deposit = await record(a,'deposit',100);
  assert.equal(Number(deposit.balance_after),100);
  const withdrawal = await record(a,'withdraw',100);
  assert.equal(Number(withdrawal.balance_after),0);
  await assert.rejects(record(a,'withdraw',1), /INSUFFICIENT_BALANCE/);
  await assert.rejects(record(a,'deposit',19.98), /INVALID_AMOUNT/);
  await assert.rejects(record(a,'deposit',0), /INVALID_AMOUNT/);
  await assert.rejects(record(a,'deposit','NaN'), /INVALID_AMOUNT/);
  await assert.rejects(db.query('DELETE FROM savings_transactions WHERE id=$1',[deposit.transaction_id]), /permission denied/);
  await assert.rejects(db.query('SELECT * FROM delete_savings_transaction($1)',[deposit.transaction_id]), /INSUFFICIENT_BALANCE/);
  await assert.rejects(db.query('SELECT * FROM update_savings_transaction($1,p_amount=>50)',[deposit.transaction_id]), /INSUFFICIENT_BALANCE/);
  await record(a,'deposit',30,'2026-09-01');
  await db.query('SELECT * FROM update_savings_transaction($1,p_amount=>120)',[deposit.transaction_id]);
  const ledger = (await db.query('SELECT balance_after FROM savings_transactions WHERE student_id=$1 ORDER BY transaction_date,created_at,id',[a])).rows;
  assert.deepEqual(ledger.map(r=>Number(r.balance_after)),[30,150,50]);
  await db.query('SELECT * FROM delete_savings_transaction($1)',[withdrawal.transaction_id]);
  assert.equal(Number((await db.query('SELECT current_balance FROM savings_student_summary WHERE student_id=$1',[a])).rows[0].current_balance),150);
  await record(b,'deposit',25);
  await db.exec('RESET ROLE; SET test.staff=\'no\'; SET ROLE anon');
  await assert.rejects(db.query('SELECT * FROM savings_transactions'),/permission denied/);
  await assert.rejects(db.query('SELECT * FROM savings_student_summary'),/permission denied/);
  await assert.rejects(record(a,'deposit',5),/permission denied/);
  const publicRows = (await db.query('SELECT * FROM get_public_savings_leaderboard()')).rows;
  assert.equal(publicRows.length,2);
  for (const row of publicRows) for (const key of ['student_code','current_balance','total_deposits','total_withdrawals']) assert.ok(!(key in row),key);
  const recent = (await db.query('SELECT * FROM get_public_savings_overview()')).rows;
  assert.ok(recent.length > 0);
  for (const row of recent) for (const key of ['amount','notes','recorded_by','student_code']) assert.ok(!(key in row),key);
  const lookup = (await db.query("SELECT * FROM lookup_savings_balance('A')")).rows;
  assert.equal(lookup.length,1);
  assert.equal(lookup[0].student_id,a);
  await db.exec("RESET ROLE; SET ROLE authenticated");
  await db.query("SELECT set_config('test.uid',$1,false)",[parent]);
  assert.equal((await db.query('SELECT * FROM get_parent_savings_summary($1)',[a])).rows.length,1);
  assert.equal((await db.query('SELECT * FROM get_parent_savings_summary($1)',[b])).rows.length,0);
  assert.equal((await db.query('SELECT * FROM get_parent_savings_history($1)',[b])).rows.length,0);
  assert.equal((await db.query('SELECT * FROM savings_transactions')).rows.length,0);
  await assert.rejects(record(b,'deposit',5),/NOT_AUTHORIZED/);
  console.log('PASS SQL migration: whole baht, deposits, withdrawals, backdated rebuild/rollback, direct-write denial, anon privacy, scoped lookup and parent authorization');
  console.log('LIMITATION: PGlite is single-connection; multi-session concurrency needs PostgreSQL integration verification.');
} finally {
  await db.close();
}
