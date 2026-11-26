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

  assert.match(
    backupsBlock,
    /from\('user_roles'\)[\s\S]*?\.limit\(1\)\s*\.maybeSingle\(\)/,
    'createSnapshot user_roles lookup must call .limit(1) before .maybeSingle()',
  );
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

  const invalidateIdx = backupsTabSource.indexOf("queryClient.invalidateQueries({ queryKey: ['savings-backups', 'settings'] })");
  const clearDraftIdx = backupsTabSource.indexOf('setSettingsDraft({})');
  assert.notEqual(invalidateIdx, -1, 'must invalidate savings-backups settings query');
  assert.notEqual(clearDraftIdx, -1, 'must clear settingsDraft after invalidation');
  assert.ok(
    invalidateIdx < clearDraftIdx,
    'invalidateQueries must run before setSettingsDraft({}) to prevent settings state flicker',
  );
  assert.ok(
    backupsTabSource.includes('isError') && backupsTabSource.includes('backupsError'),
    'BackupsTabContent must handle backupsQuery error state explicitly',
  );
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

test('savingsSummaryService.getForStudentCode delegates to lookupStudent + getByStudentCode and maps goal RPC errors', () => {
  const savingsServiceSource = fs.readFileSync(
    path.join(ROOT, 'src/services/savings.service.ts'),
    'utf-8',
  );
  assert.match(savingsServiceSource, /getForStudentCode\s*:/);
  const summaryStart = savingsServiceSource.indexOf('export const savingsSummaryService');
  const summaryEnd = savingsServiceSource.indexOf('export const savingsParentService');
  assert.notEqual(summaryStart, -1);
  assert.notEqual(summaryEnd, -1);
  const summaryBlock = savingsServiceSource.slice(summaryStart, summaryEnd);
  assert.equal(summaryBlock.includes('savingsLookupService.lookupStudent'), true);
  assert.equal(summaryBlock.includes('savingsGoalsService.getByStudentCode'), true);
  assert.equal(savingsServiceSource.includes('STUDENT_CODE_VERIFICATION_REQUIRED'), true);
  assert.equal(savingsServiceSource.includes('UNAUTHORIZED'), true);
});

test('SavingsBank.tsx passes studentCode={verifiedCode} to DigitalPassbook and formats errors with savingsErrorMessage', () => {
  const savingsPageSource = fs.readFileSync(
    path.join(ROOT, 'src/pages/SavingsBank.tsx'),
    'utf-8',
  );
  assert.match(savingsPageSource, /<DigitalPassbook[\s\S]*?studentCode=\{verifiedCode\}/);
  assert.equal(savingsPageSource.includes('savingsErrorMessage('), true);
});

test('SavingsBankParentView.tsx renders explicit goal CTA and handles goal mutation errors with toast', () => {
  const parentViewSource = fs.readFileSync(
    path.join(ROOT, 'src/components/parent/SavingsBankParentView.tsx'),
    'utf-8',
  );
  assert.equal(parentViewSource.includes('ตั้งเป้าหมายออมเงินใหม่'), true);
  assert.equal(parentViewSource.includes('useToast'), true);
  assert.equal(parentViewSource.includes('savingsErrorMessage'), true);
  assert.match(parentViewSource, /onStatusChange=\{async[\s\S]*?if\s*\(\s*error\s*\)/);
  assert.match(parentViewSource, /onDelete=\{async[\s\S]*?if\s*\(\s*error\s*\)/);
});

test('StudentThreeBanksCard.tsx exists, queries both services, links 3 banks cleanly, and complies with light-mode rules', () => {
  const cardPath = path.join(ROOT, 'src/components/student/StudentThreeBanksCard.tsx');
  assert.equal(fs.existsSync(cardPath), true, 'StudentThreeBanksCard.tsx must exist');
  const cardSource = fs.readFileSync(cardPath, 'utf-8');
  assert.equal(cardSource.includes("'student-three-banks'"), true);
  assert.equal(cardSource.includes('rewardClaimsService.lookupStudent'), true);
  assert.equal(cardSource.includes('savingsSummaryService.getForStudentCode'), true);
  assert.equal(cardSource.includes('ธนาคารขยะ'), true);
  assert.equal(cardSource.includes('ธนาคารความดี'), true);
  assert.equal(cardSource.includes('ธนาคารพอเพียง'), true);
  assert.equal(cardSource.includes('/waste-bank'), true);
  assert.equal(cardSource.includes('/virtue-bank/${studentCode}'), true);
  assert.equal(cardSource.includes('/savings-bank'), true);
  assert.equal(cardSource.includes('dark:'), false);
  assert.equal(cardSource.includes('bg-white'), false);
  assert.equal(cardSource.includes('text-black'), false);
  assert.equal(/#[0-9a-fA-F]{3,8}/.test(cardSource), false, 'must not contain raw hex colors');
  assert.equal(cardSource.includes('cn('), true);
});

test('MyLearning.tsx mounts StudentThreeBanksCard inside DashboardView', () => {
  const myLearningSource = fs.readFileSync(
    path.join(ROOT, 'src/pages/student/MyLearning.tsx'),
    'utf-8',
  );
  assert.equal(myLearningSource.includes('StudentThreeBanksCard'), true);
  assert.match(myLearningSource, /<StudentThreeBanksCard\s+studentCode=\{studentCode\}/);
});

test('SystemOverview.tsx prepends v2.8.28 dated 26 พ.ย. 2569 with zero banned virtue naming', () => {
  const overviewSource = fs.readFileSync(
    path.join(ROOT, 'src/components/admin/system/SystemOverview.tsx'),
    'utf-8',
  );
  const idx28 = overviewSource.indexOf("version: 'v2.8.28'");
  const idx27 = overviewSource.indexOf("version: 'v2.8.27'");
  assert.notEqual(idx28, -1, 'v2.8.28 must exist in SystemOverview.tsx');
  assert.notEqual(idx27, -1, 'v2.8.27 must exist in SystemOverview.tsx');
  assert.ok(idx28 < idx27, 'v2.8.28 must be prepended before v2.8.27');
  assert.equal(overviewSource.includes("date: '26 พ.ย. 2569'"), true);
  assert.equal(overviewSource.includes('Kampai Hero'), false);
  assert.equal(overviewSource.includes('Hero XP'), false);
});
