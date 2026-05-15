import { Gem, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSaverTier, type SaverTier } from '@/services/savings.service';

interface Props {
  depositCount: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const TIER_STYLE: Record<SaverTier, { color: string; ring: string; icon: React.ReactNode; label: string }> = {
  Diamond: {
    color: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/40 border-sky-300/60',
    ring: 'ring-sky-400/40',
    icon: <Gem className="w-3 h-3" />,
    label: 'Diamond',
  },
  Platinum: {
    color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border-slate-300/60',
    ring: 'ring-slate-400/40',
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Platinum',
  },
  Gold: {
    color: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 border-amber-300/60',
    ring: 'ring-amber-400/40',
    icon: <Award className="w-3 h-3" />,
    label: 'Gold',
  },
  Silver: {
    color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300/60',
    ring: 'ring-zinc-400/40',
    icon: <Award className="w-3 h-3" />,
    label: 'Silver',
  },
  Bronze: {
    color: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/40 border-orange-300/60',
    ring: 'ring-orange-400/40',
    icon: <Award className="w-3 h-3" />,
    label: 'Bronze',
  },
  Beginner: {
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300/60',
    ring: 'ring-emerald-400/40',
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Beginner',
  },
};

export const SaverTierBadge = ({ depositCount, size = 'md', className, showLabel = true }: Props) => {
  const tier = getSaverTier(depositCount);
  if (!tier) return null;
  const style = TIER_STYLE[tier];

  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
      : size === 'lg'
        ? 'text-sm px-2.5 py-1 gap-1'
        : 'text-xs px-2 py-0.5 gap-1';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        style.color,
        sizeClass,
        className,
      )}
    >
      {style.icon}
      {showLabel && <span>{style.label}</span>}
    </span>
  );
};
