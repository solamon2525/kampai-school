import type { Reward, StudentBalanceLookup } from '@/services/waste-bank.service';

export const totalRewardCost = (reward: Reward) =>
  Number(reward.waste_points_cost ?? reward.points_cost ?? 0) + Number(reward.virtue_points_cost ?? 0);

export const canAffordReward = (reward: Reward, student: StudentBalanceLookup, quantity = 1) =>
  student.waste_points_available >= reward.waste_points_cost * quantity
  && student.virtue_points_available >= reward.virtue_points_cost * quantity;

export const maxAffordableQuantity = (reward: Reward, student: StudentBalanceLookup) => {
  const wasteMax = reward.waste_points_cost > 0
    ? Math.floor(student.waste_points_available / reward.waste_points_cost)
    : Infinity;
  const virtueMax = reward.virtue_points_cost > 0
    ? Math.floor(student.virtue_points_available / reward.virtue_points_cost)
    : Infinity;
  return Math.max(0, Math.min(wasteMax, virtueMax, reward.stock ?? Infinity));
};
