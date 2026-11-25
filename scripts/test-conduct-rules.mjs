import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { computeVirtueSummary, isRewardDeductionRecord } from '../src/lib/conductHelpers.ts';

test('isRewardDeductionRecord uses category & reward_claim_id, not Thai substrings', () => {
  assert.equal(isRewardDeductionRecord({ category: 'reward', reward_claim_id: null }), true);
  assert.equal(isRewardDeductionRecord({ category: 'discipline', reward_claim_id: 'claim-1' }), true);
  assert.equal(
    isRewardDeductionRecord({ category: 'discipline', reward_claim_id: null, reason: 'รับรางวัลอะไรสักอย่าง' }),
    false,
  );
  assert.equal(
    isRewardDeductionRecord({ category: 'discipline', reward_claim_id: undefined, reason: 'แลกรางวัลอะไรสักอย่าง' }),
    false,
  );
});

test('computeVirtueSummary separates honor XP, spent virtue, and negative behavior balance', () => {
  const rows = [
    { type: 'add', score: 20, category: 'publicMind', reward_claim_id: null },
    { type: 'deduct', score: 5, category: 'discipline', reward_claim_id: null },
    { type: 'deduct', score: 5, category: 'reward', reward_claim_id: null },
  ];
  const summary = computeVirtueSummary(rows, 3);
  assert.equal(summary.honorXp, 15);
  assert.equal(summary.spentVirtue, 8);
  assert.equal(summary.availablePoints, 7);
  assert.equal(summary.rawNetXp, 15);
  assert.equal(summary.hasNegativeBalance, false);

  const negativeSummary = computeVirtueSummary([
    { type: 'add', score: 5, category: 'kindness', reward_claim_id: null },
    { type: 'deduct', score: 20, category: 'discipline', reward_claim_id: null },
  ], 0);
  assert.equal(negativeSummary.rawNetXp, -15);
  assert.equal(negativeSummary.honorXp, 0);
  assert.equal(negativeSummary.availablePoints, 0);
  assert.equal(negativeSummary.hasNegativeBalance, true);
});

test('conduct.service.ts contains zero Thai substring reward heuristics and conductHelpers has zero @/ imports', async () => {
  const [serviceSource, helpersSource] = await Promise.all([
    readFile(new URL('../src/services/conduct.service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/conductHelpers.ts', import.meta.url), 'utf8'),
  ]);

  assert.equal(serviceSource.includes(".includes('รับรางวัล')"), false, 'conduct.service.ts must not use .includes(\'รับรางวัล\')');
  assert.equal(serviceSource.includes(".includes('แลกรางวัล')"), false, 'conduct.service.ts must not use .includes(\'แลกรางวัล\')');
  assert.equal(serviceSource.includes('supabase.rpc as any'), false, 'conduct.service.ts must not cast supabase.rpc as any');
  assert.equal(helpersSource.includes("'@/"), false, 'conductHelpers.ts must have zero @/ imports');
  assert.equal(helpersSource.includes('"@/'), false, 'conductHelpers.ts must have zero @/ imports');
});
