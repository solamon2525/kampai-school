export interface PromotionRule {
  id: string;
  title: string;
  badge_text?: string | null;
  multiplier: number;
  bonus_points: number;
  category_ids: string[] | null;
  days_of_week: number[] | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
}

export interface WalletBalanceInput {
  wasteAvailable: number;
  virtueAvailable: number;
}

export interface DualWalletRewardCost {
  points_cost?: number | null;
  waste_points_cost?: number | null;
  virtue_points_cost?: number | null;
  stock?: number | null;
  is_active?: boolean | null;
}

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function toBangkokParts(now: Date): { dayOfWeek: number; dateIso: string; hhmmss: string } {
  const shifted = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const dateIso = shifted.toISOString().slice(0, 10);
  const hhmmss = shifted.toISOString().slice(11, 19);
  const dayOfWeek = shifted.getUTCDay();
  return { dayOfWeek, dateIso, hhmmss };
}

function normalizeTimeString(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

export function hasPromotionTargetScope(
  promo: Pick<PromotionRule, 'category_ids' | 'days_of_week' | 'start_date' | 'end_date' | 'start_time'>,
): boolean {
  return Boolean(
    (promo.category_ids && promo.category_ids.length > 0) ||
      (promo.days_of_week && promo.days_of_week.length > 0) ||
      promo.start_date ||
      promo.end_date ||
      promo.start_time,
  );
}

export function isPromotionActiveAt(
  promo: PromotionRule,
  now: Date = new Date(),
  categoryId?: string | null,
): boolean {
  if (!promo.is_active) return false;
  if (promo.category_ids && promo.category_ids.length > 0) {
    if (!categoryId || !promo.category_ids.includes(categoryId)) return false;
  }
  const { dayOfWeek, dateIso, hhmmss } = toBangkokParts(now);
  if (promo.days_of_week && promo.days_of_week.length > 0 && !promo.days_of_week.includes(dayOfWeek)) {
    return false;
  }
  if (promo.start_date && dateIso < promo.start_date) return false;
  if (promo.end_date && dateIso > promo.end_date) return false;
  const startTime = normalizeTimeString(promo.start_time);
  const endTime = normalizeTimeString(promo.end_time);
  if (startTime && hhmmss < startTime) return false;
  if (endTime && hhmmss > endTime) return false;
  return true;
}

export function computeRowPromotionPoints(params: {
  quantity: number;
  pointsPerItem: number;
  categoryId: string;
  promotions: PromotionRule[];
  now?: Date;
}) {
  const basePoints = Math.max(0, Math.round(params.quantity * params.pointsPerItem));
  const now = params.now ?? new Date();
  const matched = params.promotions.filter((p) => isPromotionActiveAt(p, now, params.categoryId));
  if (matched.length === 0 || basePoints <= 0) {
    return { basePoints, finalPoints: basePoints, appliedPromotions: [] as PromotionRule[] };
  }
  const maxMultiplier = Math.max(...matched.map((p) => Number(p.multiplier) || 1), 1);
  const bonusSum = matched.reduce((acc, p) => acc + Math.max(0, Number(p.bonus_points) || 0), 0);
  return {
    basePoints,
    finalPoints: Math.round(basePoints * maxMultiplier) + bonusSum,
    appliedPromotions: matched,
  };
}

export function canAffordDualWalletReward(
  balance: WalletBalanceInput,
  reward: DualWalletRewardCost,
  quantity: number = 1,
) {
  const qty = Math.max(1, Math.floor(quantity));
  const wastePerItem = Number(reward.waste_points_cost ?? reward.points_cost ?? 0);
  const virtuePerItem = Number(reward.virtue_points_cost ?? 0);
  const wasteCost = wastePerItem * qty;
  const virtueCost = virtuePerItem * qty;

  if (reward.is_active === false) {
    return { eligible: false, reason: 'inactive' as const, wasteCost, virtueCost, missingWaste: 0, missingVirtue: 0 };
  }
  if (reward.stock !== null && reward.stock !== undefined && reward.stock < qty) {
    return { eligible: false, reason: 'out_of_stock' as const, wasteCost, virtueCost, missingWaste: 0, missingVirtue: 0 };
  }
  const missingWaste = Math.max(0, wasteCost - Math.max(0, balance.wasteAvailable));
  const missingVirtue = Math.max(0, virtueCost - Math.max(0, balance.virtueAvailable));
  if (missingWaste > 0 && missingVirtue > 0) {
    return { eligible: false, reason: 'insufficient_both' as const, wasteCost, virtueCost, missingWaste, missingVirtue };
  }
  if (missingWaste > 0) {
    return { eligible: false, reason: 'insufficient_waste' as const, wasteCost, virtueCost, missingWaste, missingVirtue };
  }
  if (missingVirtue > 0) {
    return { eligible: false, reason: 'insufficient_virtue' as const, wasteCost, virtueCost, missingWaste, missingVirtue };
  }
  return { eligible: true, reason: 'ok' as const, wasteCost, virtueCost, missingWaste: 0, missingVirtue: 0 };
}
