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
