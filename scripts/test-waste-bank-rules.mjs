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
