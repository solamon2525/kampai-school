import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getPassbookTransactionMeta, PASSBOOK_SCHOOL_TITLE } from '../src/lib/passbookDisplay.ts';

const ROOT = path.resolve(import.meta.dirname, '..');

test('PASSBOOK_SCHOOL_TITLE uses สพป.อุดรธานี เขต 2', () => {
  assert.equal(PASSBOOK_SCHOOL_TITLE, 'โรงเรียนบ้านคำไผ่ สพป.อุดรธานี เขต 2');
  assert.equal(PASSBOOK_SCHOOL_TITLE.includes('ยโสธร'), false);
});

test('getPassbookTransactionMeta separates deposit and withdraw stamps', () => {
  const dep = getPassbookTransactionMeta('deposit');
  assert.equal(dep.stampLabel, 'รับฝากแล้ว');
  assert.equal(dep.amountPrefix, '+');
  assert.equal(dep.isWithdrawal, false);

  const wdr = getPassbookTransactionMeta('withdraw');
  assert.equal(wdr.stampLabel, 'ถอนเงินแล้ว');
  assert.equal(wdr.amountPrefix, '-');
  assert.equal(wdr.isWithdrawal, true);
});

test('DigitalPassbook.tsx uses PASSBOOK_SCHOOL_TITLE, getPassbookTransactionMeta, and light-mode styling', () => {
  const passbookSource = fs.readFileSync(
    path.join(ROOT, 'src/components/savings/DigitalPassbook.tsx'),
    'utf-8',
  );
  assert.equal(passbookSource.includes('ยโสธร'), false);
  assert.equal(passbookSource.includes('PASSBOOK_SCHOOL_TITLE'), true);
  assert.equal(passbookSource.includes('getPassbookTransactionMeta'), true);
  assert.equal(passbookSource.includes('dark:'), false);
  assert.equal(passbookSource.includes('bg-white'), false);
  assert.equal(passbookSource.includes('text-black'), false);
});

test('ClassroomBatchDepositTab.tsx does not call getCurrentTerm(', () => {
  const batchTabSource = fs.readFileSync(
    path.join(ROOT, 'src/components/admin/savings-bank/ClassroomBatchDepositTab.tsx'),
    'utf-8',
  );
  assert.equal(batchTabSource.includes('getCurrentTerm('), false);
});

test('savingsBackupsService exists in savings.service.ts and selects photo_url on staff/administrators queries', () => {
  const savingsServiceSource = fs.readFileSync(
    path.join(ROOT, 'src/services/savings.service.ts'),
    'utf-8',
  );
  const startIdx = savingsServiceSource.indexOf('export const savingsBackupsService');
  assert.notEqual(startIdx, -1, 'savingsBackupsService must be exported from savings.service.ts');

  const backupsBlock = savingsServiceSource.slice(startIdx);
  assert.equal(backupsBlock.includes("from('school_settings')"), true);
  assert.equal(backupsBlock.includes("from('savings_backups')"), true);

  const staffSelectMatch = backupsBlock.match(/from\('staff'\)[\s\S]*?\.select\(([^)]+)\)/g) ?? [];
  assert.ok(staffSelectMatch.length > 0, 'savingsBackupsService should query staff with photo_url');
  for (const call of staffSelectMatch) {
    assert.equal(call.includes('photo_url'), true, `staff query must select photo_url: ${call}`);
  }

  const adminSelectMatch = backupsBlock.match(/from\('administrators'\)[\s\S]*?\.select\(([^)]+)\)/g) ?? [];
  assert.ok(adminSelectMatch.length > 0, 'savingsBackupsService should query administrators with photo_url');
  for (const call of adminSelectMatch) {
    assert.equal(call.includes('photo_url'), true, `administrators query must select photo_url: ${call}`);
  }
});

test('BackupsTabContent.tsx centralizes queries via savingsBackupsService, uses TanStack Query + ConfirmDialog + light-mode tokens', () => {
  const backupsTabSource = fs.readFileSync(
    path.join(ROOT, 'src/components/admin/savings-bank/BackupsTabContent.tsx'),
    'utf-8',
  );
  assert.equal(backupsTabSource.includes('supabase.from('), false);
  assert.equal(backupsTabSource.includes('@/integrations/supabase/client'), false);
  assert.equal(/\bconfirm\s*\(/.test(backupsTabSource), false);
  assert.equal(backupsTabSource.includes('dark:'), false);
  assert.equal(backupsTabSource.includes('bg-white'), false);
  assert.equal(backupsTabSource.includes('text-black'), false);
  assert.equal(backupsTabSource.includes('bg-slate-'), false);
  assert.equal(backupsTabSource.includes('text-white'), false);
  assert.equal(backupsTabSource.includes('savingsBackupsService'), true);
  assert.equal(backupsTabSource.includes('useQuery'), true);
  assert.equal(backupsTabSource.includes('useMutation'), true);
  assert.equal(backupsTabSource.includes('ConfirmDialog'), true);
  assert.equal(backupsTabSource.includes('PersonAvatar'), true);
});

test('SavingsBankManagement.tsx replaces raw img, confirm(), and hardcoded light-mode violations', () => {
  const mgmtSource = fs.readFileSync(
    path.join(ROOT, 'src/components/admin/savings-bank/SavingsBankManagement.tsx'),
    'utf-8',
  );
  assert.equal(/\bconfirm\s*\(/.test(mgmtSource), false);
  assert.equal(/<img\b/.test(mgmtSource), false);
  assert.equal(mgmtSource.includes('dark:'), false);
  assert.equal(mgmtSource.includes('bg-white'), false);
  assert.equal(mgmtSource.includes('text-black'), false);
  assert.equal(mgmtSource.includes('bg-slate-'), false);
  assert.equal(mgmtSource.includes('text-white'), false);
  assert.equal(mgmtSource.includes('ConfirmDialog'), true);
  assert.equal(mgmtSource.includes('PersonAvatar'), true);
});
