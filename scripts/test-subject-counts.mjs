// scripts/test-subject-counts.mjs
// Verifies that all 10 subjects in Grade 4 have exactly 150 questions (total 1,500 questions)
// and tests the server-side RPC get_exam_question_counts.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_SUBJECTS = [
  'คณิตศาสตร์',
  'ภาษาไทย',
  'วิทยาศาสตร์',
  'ภาษาอังกฤษ',
  'สังคมศึกษา',
  'ประวัติศาสตร์',
  'สุขศึกษา',
  'ศิลปะ',
  'การงานอาชีพ',
  'ต้านทุจริต'
];

async function runVerification() {
  console.log('--- Step 1: Testing RPC get_exam_question_counts ---');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_exam_question_counts', {
    p_grade: 'ป.4'
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
    process.exit(1);
  }

  console.log('RPC Results:', rpcData);

  const countsMap = {};
  rpcData.forEach((row) => {
    countsMap[row.subject] = Number(row.count);
  });

  let totalQuestions = 0;
  let allPass = true;

  console.log('\n--- Step 2: Checking Subject Breakdown ---');
  for (const subj of EXPECTED_SUBJECTS) {
    const count = countsMap[subj] || 0;
    totalQuestions += count;
    const status = count === 150 ? 'PASS (150)' : `FAIL (${count} != 150)`;
    console.log(`[${status}] ${subj}`);
    if (count !== 150) {
      allPass = false;
    }
  }

  console.log(`\nTotal questions in Grade 4: ${totalQuestions} (Expected: 1500)`);
  if (totalQuestions !== 1500) {
    allPass = false;
  }

  console.log('\n--- Step 3: Verifying "ต้านทุจริต" Migration File & Structure Integrity ---');
  const migrationFile = path.resolve(__dirname, '../supabase/migrations/546_seed_grade4_anti_corruption_exams.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file 546 not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(migrationFile, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().startsWith("('ต้านทุจริต'"));
  console.log(`Verified ${lines.length} SQL insert rows in migration 546.`);

  if (lines.length !== 150) {
    console.error(`Expected 150 SQL rows, got ${lines.length}`);
    allPass = false;
  }

  // Also check RPC for all subjects combined
  const { data: allRpcData, error: allRpcErr } = await supabase.rpc('get_exam_question_counts', {
    p_grade: 'all'
  });
  if (allRpcErr) {
    console.error('RPC error for grade=all:', allRpcErr);
    allPass = false;
  } else {
    console.log(`RPC with grade='all' returned ${allRpcData.length} subjects successfully.`);
  }

  if (allPass) {
    console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY! 🎉\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME CHECKS FAILED! ❌\n');
    process.exit(1);
  }
}

runVerification();
