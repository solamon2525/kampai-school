import { Gem, Award, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSaverTier, type SaverTier } from '@/services/savings.service';

interface Props {
  depositCount: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

// Saturated solid gradients — distinct from theme green, high contrast WCAG AA+
const TIER_STYLE: Record<SaverTier, {
  bg: string;
  text: string;
  icon: React.ReactNode;
  label: string;
}> = {
  Diamond: {
    bg: 'bg-gradient-to-br from-sky-400 to-blue-700 shadow-blue-500/30',
    text: 'text-white',
    icon: <Gem className="w-3 h-3" />,
    label: 'Diamond',
  },
  Platinum: {
    bg: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 shadow-slate-400/30',
    text: 'text-slate-900',
    icon: <Star className="w-3 h-3" />,
    label: 'Platinum',
  },
  Gold: {
    bg: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-amber-500/30',
    text: 'text-amber-950',
    icon: <Award className="w-3 h-3" />,
    label: 'Gold',
  },
  Silver: {
    bg: 'bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-500 shadow-zinc-400/30',
    text: 'text-slate-900',
    icon: <Award className="w-3 h-3" />,
    label: 'Silver',
  },
  Bronze: {
    bg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-800 shadow-orange-500/30',
    text: 'text-white',
    icon: <Award className="w-3 h-3" />,
    label: 'Bronze',
  },
  Beginner: {
    bg: 'bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-emerald-500/30',
    text: 'text-white',
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Beginner',
  },
};

export const SaverTierBadge = ({
  depositCount,
  size = 'md',
  className,
  showLabel = true,
}: Props) => {
  const tier = getSaverTier(depositCount);
  if (!tier) return null;
  const style = TIER_STYLE[tier];

  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : size === 'lg'
        ? 'text-sm px-3 py-1.5 gap-1.5'
        : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold shadow-md tracking-wide',
        style.bg,
        style.text,
        sizeClass,
        className,
      )}
    >
      {style.icon}
      {showLabel && <span>{style.label}</span>}
    </span>
  );
};
