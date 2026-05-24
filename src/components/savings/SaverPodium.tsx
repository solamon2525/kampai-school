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
    photoClass: 'w-12 h-12 xs:w-16 xs:h-16 md:w-[72px] md:h-[72px]',
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
    photoClass: 'w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14',
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
    photoClass: 'w-8 h-8 xs:w-10 xs:h-10 md:w-12 md:h-12',
    showCrown: false,
  },
];

function StudentAvatar({
  name,
  photoUrl,
  ringClass,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  ringClass: string;
  className?: string;
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
        className={cn(
          'rounded-full object-cover flex-shrink-0 ring-4 shadow-lg bg-slate-100',
          ringClass,
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 ring-4 shadow-lg bg-gradient-to-br text-white font-extrabold text-lg xs:text-xl md:text-2xl',
        color,
        ringClass,
        className,
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
              'relative rounded-t-2xl border border-black/5 p-2 xs:p-3 md:p-5 text-center flex flex-col items-center justify-end shadow-xl',
              style.bg,
              style.height,
            )}
          >
            {/* Crown for #1 */}
            {style.showCrown && (
              <Crown className="absolute -top-6 xs:-top-7 left-1/2 -translate-x-1/2 w-8 h-8 xs:w-10 xs:h-10 text-amber-500 drop-shadow-md fill-amber-400" />
            )}

            {/* Medal floating */}
            <div className="absolute -top-5 xs:-top-6 right-1.5 xs:right-3 text-2xl xs:text-3xl md:text-4xl drop-shadow-lg">
              {style.medal}
            </div>

            {/* Avatar floating top */}
            <div className="absolute -top-8 xs:-top-10 left-1/2 -translate-x-1/2">
              <StudentAvatar
                name={s.full_name ?? '?'}
                photoUrl={s.photo_url}
                className={style.photoClass}
                ringClass={style.ring}
              />
            </div>

            {/* Content */}
            <div className="mt-5 xs:mt-8 md:mt-10 space-y-0.5 xs:space-y-1 w-full">
              <div className={cn('font-bold truncate text-[10px] xs:text-xs md:text-base', style.text)}>
                {s.full_name ?? '—'}
              </div>
              <div className={cn('text-[9px] xs:text-xs font-medium', style.label)}>
                {s.class_name ?? ''}
              </div>
              <div
                className={cn(
                  'font-extrabold tabular-nums tracking-tight text-xs xs:text-sm md:text-2xl',
                  style.text,
                )}
              >
                {Number(s.deposit_count ?? 0).toLocaleString('th-TH')}
                <span className={cn('text-[9px] xs:text-xs font-medium ml-0.5 xs:ml-1', style.label)}>ครั้ง</span>
              </div>
              <div className="flex justify-center pt-0.5 xs:pt-1">
                <SaverTierBadge depositCount={s.deposit_count} size="sm" className="hidden xs:inline-flex" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
