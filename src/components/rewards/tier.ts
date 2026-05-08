// Auto-bucket reward into a tier based on points_cost.
// Used by RewardsCatalog to group + RewardCard to color-code.

export type RewardTierKey = 'starter' | 'good' | 'great' | 'elite';

export interface RewardTier {
  key: RewardTierKey;
  emoji: string;
  label: string;
  range: string;
  // Tailwind classes (LIGHT default — DESIGN.md uses CSS vars elsewhere; tier
  // ribbons get a fixed palette for visual hierarchy)
  badge: string;
  ring: string;
  gradient: string;
}

export const TIERS: RewardTier[] = [
  {
    key: 'starter',
    emoji: '🌱',
    label: 'ระดับเริ่มต้น',
    range: '0–50 แต้ม',
    badge: 'bg-lime-100 text-lime-700 border-lime-200',
    ring: 'ring-lime-200',
    gradient: 'from-lime-50 to-emerald-50',
  },
  {
    key: 'good',
    emoji: '🌿',
    label: 'ระดับดี',
    range: '51–150 แต้ม',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'ring-emerald-200',
    gradient: 'from-emerald-50 to-teal-50',
  },
  {
    key: 'great',
    emoji: '🌳',
    label: 'ระดับเยี่ยม',
    range: '151–300 แต้ม',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    ring: 'ring-teal-300',
    gradient: 'from-teal-50 to-cyan-50',
  },
  {
    key: 'elite',
    emoji: '🏆',
    label: 'ระดับเลิศ',
    range: '301+ แต้ม',
    badge: 'bg-amber-100 text-amber-700 border-amber-300',
    ring: 'ring-amber-300',
    gradient: 'from-amber-50 via-yellow-50 to-orange-50',
  },
];

export function tierFor(points: number): RewardTier {
  if (points <= 50) return TIERS[0];
  if (points <= 150) return TIERS[1];
  if (points <= 300) return TIERS[2];
  return TIERS[3];
}
