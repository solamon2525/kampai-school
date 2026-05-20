import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaverTierBadge } from './SaverTierBadge';

interface PodiumEntry {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  photo_url: string | null;
  deposit_count: number | null;
}

interface Props {
  entries: PodiumEntry[]; // top 3
}

// Solid saturated panels — high contrast, premium feel
const PODIUM_STYLE = [
  // 1st place — gold
  {
    bg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
    text: 'text-amber-950',
    label: 'text-amber-900',
    ring: 'ring-amber-300',
    medal: '🥇',
    height: 'h-36 md:h-44',
    photoSize: 72,
    showCrown: true,
  },
  // 2nd place — silver
  {
    bg: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400',
    text: 'text-slate-900',
    label: 'text-slate-700',
    ring: 'ring-slate-300',
    medal: '🥈',
    height: 'h-28 md:h-34',
    photoSize: 56,
    showCrown: false,
  },
  // 3rd place — bronze
  {
    bg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700',
    text: 'text-white',
    label: 'text-orange-100',
    ring: 'ring-orange-300',
    medal: '🥉',
    height: 'h-24 md:h-28',
    photoSize: 48,
    showCrown: false,
  },
];

function StudentAvatar({
  name,
  size,
  photoUrl,
  ringClass,
}: {
  name: string;
  size: number;
  photoUrl?: string | null;
  ringClass: string;
}) {
  const colors = [
    'from-amber-400 to-yellow-500',
    'from-emerald-400 to-emerald-600',
    'from-sky-400 to-blue-600',
    'from-orange-400 to-amber-500',
    'from-rose-400 to-pink-500',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        style={{ width: size, height: size }}
        className={cn(
          'rounded-full object-cover flex-shrink-0 ring-4 shadow-lg',
          ringClass,
        )}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 ring-4 shadow-lg bg-gradient-to-br text-white font-extrabold text-2xl',
        color,
        ringClass,
      )}
    >
      {(name || '?').charAt(0)}
    </div>
  );
}

export const SaverPodium = ({ entries }: Props) => {
  if (entries.length === 0) return null;

  // Visual order: 2nd-1st-3rd (1st in middle, tallest)
  const visualOrder = [
    { entry: entries[1], rank: 1 },
    { entry: entries[0], rank: 0 },
    { entry: entries[2], rank: 2 },
  ].filter((x) => x.entry);

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-3xl mx-auto items-end pt-6 md:pt-8">
      {visualOrder.map(({ entry, rank }) => {
        const style = PODIUM_STYLE[rank];
        const s = entry as PodiumEntry;
        const isFirst = rank === 0;

        return (
          <div
            key={s.student_id ?? rank}
            className={cn(
              'relative rounded-t-2xl border border-black/5 p-4 md:p-5 text-center flex flex-col items-center justify-end shadow-xl',
              style.bg,
              style.height,
            )}
          >
            {/* Crown for #1 */}
            {style.showCrown && (
              <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 w-10 h-10 text-amber-500 drop-shadow-md fill-amber-400" />
            )}

            {/* Medal floating */}
            <div className="absolute -top-6 right-3 text-3xl md:text-4xl drop-shadow-lg">
              {style.medal}
            </div>

            {/* Avatar floating top */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <StudentAvatar
                name={s.full_name ?? '?'}
                photoUrl={s.photo_url}
                size={style.photoSize}
                ringClass={style.ring}
              />
            </div>

            {/* Content */}
            <div className="mt-8 md:mt-10 space-y-1 w-full">
              <div className={cn('font-bold truncate text-sm md:text-base', style.text)}>
                {s.full_name ?? '—'}
              </div>
              <div className={cn('text-xs font-medium', style.label)}>
                {s.class_name ?? ''}
              </div>
              <div
                className={cn(
                  'font-extrabold tabular-nums tracking-tight',
                  isFirst ? 'text-xl md:text-2xl' : 'text-lg md:text-xl',
                  style.text,
                )}
              >
                {Number(s.deposit_count ?? 0).toLocaleString('th-TH')}
                <span className={cn('text-xs font-medium ml-1', style.label)}>ครั้ง</span>
              </div>
              <div className="flex justify-center pt-1">
                <SaverTierBadge depositCount={s.deposit_count} size="sm" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
