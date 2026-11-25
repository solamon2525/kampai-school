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

test('Conduct UI components do not hardcode semester 1, Thai reward heuristics, or invalid PersonAvatar size', async () => {
  const [conductMgmt, hallOfFame, passportModal, heroDashboard] = await Promise.all([
    readFile(new URL('../src/components/admin/conduct/ConductManagement.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/HallOfFame.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/conduct/VirtuePassportModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/conduct/KampaiHeroDashboard.tsx', import.meta.url), 'utf8'),
  ]);

  assert.equal(
    /\[(?:filter)?[sS]emester[^\]]*\]\s*=\s*useState(?:<[^>]+>)?\(\s*['"]1['"]\s*\)/.test(conductMgmt),
    false,
    'ConductManagement.tsx must not hardcode semester useState(\'1\')',
  );
  assert.equal(conductMgmt.includes(".includes('รับรางวัล')"), false, 'ConductManagement.tsx must not use .includes(\'รับรางวัล\')');
  assert.equal(conductMgmt.includes(".includes('แลกรางวัล')"), false, 'ConductManagement.tsx must not use .includes(\'แลกรางวัล\')');
  assert.equal(conductMgmt.includes('ilike.%รับรางวัล%'), false, 'ConductManagement.tsx must not filter rewards via reason.ilike.%รับรางวัล%');
  assert.equal(conductMgmt.includes('ilike.%แลกรางวัล%'), false, 'ConductManagement.tsx must not filter rewards via reason.ilike.%แลกรางวัล%');

  assert.equal(
    /useState(?:<string>)?\(\s*['"]1['"]\s*\)/.test(hallOfFame),
    false,
    'HallOfFame.tsx must not hardcode useState(\'1\') or useState<string>(\'1\')',
  );
  assert.equal(
    /semester\s*=\s*['"]1['"]/.test(passportModal),
    false,
    'VirtuePassportModal.tsx must not hardcode semester = \'1\'',
  );
  assert.equal(
    /<PersonAvatar[^>]*\bsize=["']xl["']/.test(heroDashboard),
    false,
    'KampaiHeroDashboard.tsx must not pass invalid size="xl" to <PersonAvatar>',
  );
});
