import { Recycle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardCostDisplayProps {
  waste: number;
  virtue: number;
  multiplier?: number;
  className?: string;
}

export const RewardCostDisplay = ({ waste, virtue, multiplier = 1, className }: RewardCostDisplayProps) => (
  <span className={cn('inline-flex flex-wrap items-center gap-2 text-sm font-bold tabular-nums', className)}>
    {waste > 0 ? (
      <span className="inline-flex items-center gap-1 text-emerald-800">
        <Recycle className="h-4 w-4" /> ขยะ {waste * multiplier}
      </span>
    ) : null}
    {virtue > 0 ? (
      <span className="inline-flex items-center gap-1 text-amber-800">
        <Star className="h-4 w-4" /> ความดี {virtue * multiplier}
      </span>
    ) : null}
  </span>
);
