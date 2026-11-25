import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  canAffordDualWalletReward,
  computeRowPromotionPoints,
  hasPromotionTargetScope,
  isPromotionActiveAt,
} from '../src/lib/wasteBankHelpers.ts';

const milkCat = 'milk-cat-id';
const bottleCat = 'bottle-cat-id';

const milkPromo = {
  id: 'promo-milk',
  title: 'Milk Carton Week',
  badge_text: 'x3 กล่องนม',
  multiplier: 3,
  bonus_points: 0,
  category_ids: [milkCat],
  days_of_week: null,
  start_date: null,
  end_date: null,
  start_time: null,
  end_time: null,
  is_active: true,
};

test('isPromotionActiveAt restricts category_ids strictly', () => {
  const mondayMorning = new Date('2026-11-23T08:00:00+07:00');
  assert.equal(isPromotionActiveAt(milkPromo, mondayMorning, milkCat), true);
  assert.equal(isPromotionActiveAt(milkPromo, mondayMorning, bottleCat), false);
});

test('isPromotionActiveAt evaluates Bangkok weekday, date, and time windows', () => {
  const fridayEarlyMorningBkk = new Date('2026-11-27T02:00:00+07:00'); // Still Thursday in UTC
  const greenFriday = {
    id: 'promo-friday',
    title: 'Green Friday',
    multiplier: 2,
    bonus_points: 0,
    category_ids: null,
    days_of_week: [5],
    start_date: '2026-11-01',
    end_date: '2026-11-30',
    start_time: '07:30',
    end_time: '16:00',
    is_active: true,
  };
  assert.equal(isPromotionActiveAt(greenFriday, fridayEarlyMorningBkk, bottleCat), false);

  const fridaySchoolMorning = new Date('2026-11-27T08:00:00+07:00');
  assert.equal(isPromotionActiveAt(greenFriday, fridaySchoolMorning, bottleCat), true);
  assert.equal(isPromotionActiveAt({ ...greenFriday, is_active: false }, fridaySchoolMorning, bottleCat), false);

  const fridayLunchEnd = new Date('2026-11-27T16:00:00+07:00');
  const fridayAfterHours = new Date('2026-11-27T16:00:01+07:00');
  assert.equal(isPromotionActiveAt(greenFriday, fridayLunchEnd, bottleCat), true);
  assert.equal(isPromotionActiveAt(greenFriday, fridayAfterHours, bottleCat), false);
});

test('computeRowPromotionPoints only multiplies matching category row', () => {
  const now = new Date('2026-11-23T08:00:00+07:00');
  const milkResult = computeRowPromotionPoints({
    quantity: 5,
    pointsPerItem: 1,
    categoryId: milkCat,
    promotions: [milkPromo],
    now,
  });
  const bottleResult = computeRowPromotionPoints({
    quantity: 5,
    pointsPerItem: 2,
    categoryId: bottleCat,
    promotions: [milkPromo],
    now,
  });
  assert.equal(milkResult.finalPoints, 15);
  assert.equal(milkResult.appliedPromotions.length, 1);
  assert.equal(bottleResult.finalPoints, 10);
  assert.equal(bottleResult.appliedPromotions.length, 0);
});

test('computeRowPromotionPoints combines max multiplier and matching bonus points', () => {
  const now = new Date('2026-11-27T12:15:00+07:00'); // Friday lunch
  const fridayPromo = {
    id: 'promo-friday',
    title: 'Green Friday',
    multiplier: 2,
    bonus_points: 0,
    category_ids: null,
    days_of_week: [5],
    start_date: null,
    end_date: null,
    start_time: null,
    end_time: null,
    is_active: true,
  };
  const lunchBonusPromo = {
    id: 'promo-lunch',
    title: 'Lunch Bonus',
    multiplier: 1,
    bonus_points: 5,
    category_ids: [milkCat],
    days_of_week: [1, 2, 3, 4, 5],
    start_date: null,
    end_date: null,
    start_time: '12:00:00',
    end_time: '12:45:00',
    is_active: true,
  };
  const milkRes = computeRowPromotionPoints({
    quantity: 4,
    pointsPerItem: 1,
    categoryId: milkCat,
    promotions: [milkPromo, fridayPromo, lunchBonusPromo],
    now,
  });
  assert.equal(milkRes.finalPoints, 17); // max(3, 2, 1) * 4 + 5
  assert.equal(milkRes.appliedPromotions.length, 3);

  const bottleRes = computeRowPromotionPoints({
    quantity: 4,
    pointsPerItem: 2,
    categoryId: bottleCat,
    promotions: [milkPromo, fridayPromo, lunchBonusPromo],
    now,
  });
  assert.equal(bottleRes.finalPoints, 16); // only fridayPromo (x2), no milk x3 or lunch bonus
  assert.equal(bottleRes.appliedPromotions.length, 1);
});

test('hasPromotionTargetScope rejects boosted promo with zero constraints', () => {
  assert.equal(hasPromotionTargetScope({ ...milkPromo, category_ids: null }), false);
  assert.equal(hasPromotionTargetScope({ ...milkPromo, category_ids: [] }), false);
  assert.equal(hasPromotionTargetScope(milkPromo), true);
  assert.equal(hasPromotionTargetScope({ ...milkPromo, category_ids: null, days_of_week: [5] }), true);
  assert.equal(hasPromotionTargetScope({ ...milkPromo, category_ids: null, start_date: '2026-11-01' }), true);
  assert.equal(hasPromotionTargetScope({ ...milkPromo, category_ids: null, start_time: '12:00' }), true);
});

test('canAffordDualWalletReward checks both wallets and stock', () => {
  const reward = { waste_points_cost: 20, virtue_points_cost: 5, stock: 2, is_active: true };
  assert.deepEqual(
    canAffordDualWalletReward({ wasteAvailable: 20, virtueAvailable: 4 }, reward, 1),
    {
      eligible: false,
      reason: 'insufficient_virtue',
      wasteCost: 20,
      virtueCost: 5,
      missingWaste: 0,
      missingVirtue: 1,
    },
  );
  assert.equal(
    canAffordDualWalletReward({ wasteAvailable: 100, virtueAvailable: 50 }, reward, 3).reason,
    'out_of_stock',
  );
  assert.equal(
    canAffordDualWalletReward({ wasteAvailable: 25, virtueAvailable: 10 }, reward, 1).eligible,
    true,
  );
  assert.equal(
    canAffordDualWalletReward({ wasteAvailable: 10, virtueAvailable: 2 }, reward, 1).reason,
    'insufficient_both',
  );
  assert.equal(
    canAffordDualWalletReward({ wasteAvailable: 10, virtueAvailable: 10 }, reward, 1).reason,
    'insufficient_waste',
  );
  assert.equal(
    canAffordDualWalletReward({ wasteAvailable: 100, virtueAvailable: 50 }, { ...reward, is_active: false }, 1).reason,
    'inactive',
  );
});

test('Task 2 component contracts: per-row promos, Zod target scoping, ConfirmDialog, light-only', async () => {
  const [wasteBankSrc, promosSrc] = await Promise.all([
    readFile(new URL('../src/components/admin/waste-bank/WasteBankManagement.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/PromotionsManagement.tsx', import.meta.url), 'utf8'),
  ]);

  assert.equal(wasteBankSrc.includes('computeRowPromotionPoints'), true);
  assert.equal(wasteBankSrc.includes('activeBonusPoints'), false);

  assert.equal(/\b(?:confirm|prompt)\s*\(/.test(promosSrc), false);
  assert.equal(promosSrc.includes('hasPromotionTargetScope'), true);
  assert.equal(promosSrc.includes('ConfirmDialog'), true);
  assert.equal(promosSrc.includes('zodResolver'), true);
  assert.equal(/\bdark:/.test(promosSrc), false);
});

test('Task 3 parent view contracts: dual-wallet RPC, helper, RewardCostDisplay, ConfirmDialog, light-only', async () => {
  const parentSrc = await readFile(
    new URL('../src/components/parent/WasteBankParentView.tsx', import.meta.url),
    'utf8',
  );

  assert.equal(/\bdark:/.test(parentSrc), false);
  assert.equal(/\bbg-white\b/.test(parentSrc), false);
  assert.equal(/\btext-black\b/.test(parentSrc), false);
  assert.equal(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.test(parentSrc), false);
  assert.equal(/\b(?:confirm|prompt)\s*\(/.test(parentSrc), false);
  assert.equal(parentSrc.includes('supabase.from('), false);
  assert.equal(parentSrc.includes('rewardClaimsService.create('), false);

  assert.equal(parentSrc.includes('rewardClaimsService.lookupStudent'), true);
  assert.equal(parentSrc.includes('rewardClaimsService.claimByCode'), true);
  assert.equal(parentSrc.includes('canAffordDualWalletReward'), true);
  assert.equal(parentSrc.includes('RewardCostDisplay'), true);
  assert.equal(parentSrc.includes('ConfirmDialog'), true);
  assert.equal(parentSrc.includes('PersonAvatar'), true);
  assert.equal(parentSrc.includes("['parent-waste-balance'"), true);
  assert.equal(parentSrc.includes("['waste-student-summaries']"), true);
  assert.equal(parentSrc.includes("['rewards']"), true);
  assert.equal(parentSrc.includes("['top-heroes']"), true);
});

test('Task 4 component contracts: TermBanner copy, dialog replacements, HomeRightSidebar service & PersonAvatar, light-only', async () => {
  const [termBannerSrc, rewardsSrc, claimsSrc, sidebarSrc] = await Promise.all([
    readFile(new URL('../src/components/admin/waste-bank/TermBanner.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/RewardsManagement.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/ClaimsApproval.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/home/HomeRightSidebar.tsx', import.meta.url), 'utf8'),
  ]);

  // TermBanner carry-over copy
  assert.equal(termBannerSrc.includes('เริ่มนับใหม่จาก 0'), false);
  assert.equal(termBannerSrc.includes('แต้ม + คะแนนนับเฉพาะเทอมนี้'), false);
  assert.equal(termBannerSrc.includes('แต้มและคะแนนเริ่มนับใหม่'), false);
  assert.equal(termBannerSrc.includes('ยกยอด'), true);
  assert.equal(/\bdark:/.test(termBannerSrc), false);

  // RewardsManagement & ClaimsApproval native dialogs removed
  assert.equal(/\b(?:confirm|prompt)\s*\(/.test(rewardsSrc), false);
  assert.equal(rewardsSrc.includes('ConfirmDialog'), true);
  assert.equal(rewardsSrc.includes('deleteTarget'), true);
  assert.equal(/\bdark:/.test(rewardsSrc), false);

  assert.equal(/\b(?:confirm|prompt)\s*\(/.test(claimsSrc), false);
  assert.equal(claimsSrc.includes('rejectTarget'), true);
  assert.equal(claimsSrc.includes('rejectReason'), true);
  assert.equal(/\bdark:/.test(claimsSrc), false);

  // HomeRightSidebar service + PersonAvatar
  assert.equal(sidebarSrc.includes(".from('waste_student_summary')"), false);
  assert.equal(sidebarSrc.includes('wasteSummaryService.getTopPublic(5)'), true);
  assert.equal(sidebarSrc.includes('<PersonAvatar'), true);
  assert.equal(/<img\b[^>]*photo_url/.test(sidebarSrc), false);
  const wasteWidgetMatch = sidebarSrc.match(/const WasteBankWidget[\s\S]*?(?=\n\/\/ ─── SavingsBank Widget)/);
  const savingsWidgetMatch = sidebarSrc.match(/const SavingsBankWidget[\s\S]*?(?=\n\/\/ ─── VirtueBank Widget)/);
  assert.ok(wasteWidgetMatch && !/<img\b/.test(wasteWidgetMatch[0]), 'WasteBankWidget must not contain raw <img>');
  assert.ok(savingsWidgetMatch && !/<img\b/.test(savingsWidgetMatch[0]), 'SavingsBankWidget must not contain raw <img>');
  assert.equal(/\bdark:/.test(sidebarSrc), false);
});

test('Task 5 component contracts: ClassroomWasteBatchTab, WasteStatementDialog, WasteStudentSummaryTab, WasteBankManagement', async () => {
  const [batchSrc, statementSrc, summaryTabSrc, mgmtSrc] = await Promise.all([
    readFile(new URL('../src/components/admin/waste-bank/ClassroomWasteBatchTab.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/WasteStatementDialog.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/WasteStudentSummaryTab.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/WasteBankManagement.tsx', import.meta.url), 'utf8'),
  ]);

  for (const [label, src] of [
    ['ClassroomWasteBatchTab', batchSrc],
    ['WasteStatementDialog', statementSrc],
    ['WasteStudentSummaryTab', summaryTabSrc],
    ['WasteBankManagement', mgmtSrc],
  ]) {
    assert.equal(/\bdark:/.test(src), false, `${label} must not contain dark:`);
    assert.equal(/\bbg-white\b/.test(src), false, `${label} must not contain bg-white`);
    assert.equal(/\btext-black\b/.test(src), false, `${label} must not contain text-black`);
    assert.equal(
      /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.test(src),
      false,
      `${label} must not contain hardcoded hex colors`,
    );
    assert.equal(/\b(?:confirm|prompt)\s*\(/.test(src), false, `${label} must not call confirm()/prompt()`);
    assert.equal(src.includes('supabase.from('), false, `${label} must not call supabase.from()`);
    assert.equal(/<img\b[^>]*photo_url/.test(src), false, `${label} must not use raw <img> on photo_url`);
  }

  // ClassroomWasteBatchTab contracts
  assert.equal(batchSrc.includes('studentsService.getByClass'), true);
  assert.equal(batchSrc.includes('wasteTransactionsService.insertMany'), true);
  assert.equal(batchSrc.includes('computeRowPromotionPoints'), true);
  assert.equal(batchSrc.includes('<PersonAvatar'), true);
  assert.equal(batchSrc.includes('<RecorderSelect'), true);
  assert.equal(batchSrc.includes('<ThaiDatePicker'), true);
  assert.equal(batchSrc.includes('speakThai'), true);
  assert.equal(batchSrc.includes("['waste-student-summaries']"), true);
  assert.equal(batchSrc.includes("['waste-transactions']"), true);
  assert.equal(batchSrc.includes("['waste-classroom-league']"), true);
  assert.equal(batchSrc.includes('md:hidden'), true);
  assert.equal(batchSrc.includes('hidden md:block'), true);

  // WasteStatementDialog contracts
  assert.equal(statementSrc.includes('wasteTransactionsService.getByStudent'), true);
  assert.equal(statementSrc.includes('rewardClaimsService.listForStudent'), true);
  assert.equal(statementSrc.includes("['waste-student-statement'"), true);
  assert.equal(statementSrc.includes('carried_over_points'), true);
  assert.equal(statementSrc.includes('current_term_points_earned'), true);
  assert.equal(statementSrc.includes('current_term_points_spent'), true);
  assert.equal(statementSrc.includes('available_points'), true);
  assert.equal(statementSrc.includes('โรงเรียนบ้านคำไผ่ สพป.อุดรธานี เขต 2'), true);
  assert.equal(statementSrc.includes('ยกยอดจากเทอมก่อน'), true);
  assert.equal(statementSrc.includes('ได้เทอมนี้'), true);
  assert.equal(statementSrc.includes('ใช้แลกแล้ว'), true);
  assert.equal(statementSrc.includes('คงเหลือพร้อมแลก'), true);
  assert.equal(statementSrc.includes('print:p-0'), true);
  assert.equal(statementSrc.includes('print:hidden'), true);
  assert.equal(statementSrc.includes('<PersonAvatar'), true);
  assert.equal(statementSrc.includes('photoUrl={student.photo_url}'), true);

  // WasteStudentSummaryTab contracts
  assert.equal(summaryTabSrc.includes('WasteStatementDialog'), true);
  assert.equal(summaryTabSrc.includes('พิมพ์สรุป'), true);

  // WasteBankManagement contracts
  assert.equal(mgmtSrc.includes("id: 'batch'"), true);
  assert.equal(mgmtSrc.includes('บันทึกทั้งห้อง'), true);
  assert.equal(mgmtSrc.includes('ClassroomWasteBatchTab'), true);
  assert.equal(mgmtSrc.includes('ConfirmDialog'), true);
  const promoCalls = mgmtSrc.match(/fetchActivePromos\(\)/g) ?? [];
  assert.equal(promoCalls.length, 1, 'fetchActivePromos() should only be triggered from the activeTab effect');
});

test('Task 5 Fix Round 1 contracts: batch mobile layout, multi-page print, sort tiebreaker, zero guard & cache invalidation', async () => {
  const [batchSrc, statementSrc, mgmtSrc] = await Promise.all([
    readFile(new URL('../src/components/admin/waste-bank/ClassroomWasteBatchTab.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/WasteStatementDialog.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/admin/waste-bank/WasteBankManagement.tsx', import.meta.url), 'utf8'),
  ]);

  // 1. ClassroomWasteBatchTab responsive submit cell + categoriesLoading + statement invalidation
  assert.equal(batchSrc.includes('col-span-2 lg:col-span-1'), true);
  assert.equal(batchSrc.includes('whitespace-normal'), true);
  assert.equal(batchSrc.includes('categoriesLoading'), true);
  assert.equal(batchSrc.includes("['waste-student-statement']"), true);

  // 2. WasteStatementDialog multi-page print + chronological dateIso/created_at tiebreaker + -0 guard
  assert.equal(statementSrc.includes('print:block'), true);
  assert.equal(statementSrc.includes('print:overflow-visible'), true);
  assert.equal(statementSrc.includes('wasteUsed === 0 ? 0 : -wasteUsed'), true);
  assert.equal(statementSrc.includes('sortDateKey'), true);

  // 3. WasteBankManagement cache sync + categoriesLoading prop
  assert.equal(mgmtSrc.includes('categoriesLoading={loadingCategories}'), true);
  const summariesInvalCount = (mgmtSrc.match(/\['waste-student-summaries'\]/g) ?? []).length;
  const statementInvalCount = (mgmtSrc.match(/\['waste-student-statement'\]/g) ?? []).length;
  assert.ok(summariesInvalCount >= 2, 'WasteBankManagement should invalidate waste-student-summaries on submit and delete');
  assert.ok(statementInvalCount >= 2, 'WasteBankManagement should invalidate waste-student-statement on submit and delete');
});
