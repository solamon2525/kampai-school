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

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_BG = [
  'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20',
  'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/40',
  'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/20',
];
const MEDAL_TEXT = [
  'text-amber-900 dark:text-amber-200',
  'text-slate-800 dark:text-slate-200',
  'text-orange-900 dark:text-orange-200',
];

function StudentAvatar({
  name,
  size = 64,
  photoUrl,
}: {
  name: string;
  size?: number;
  photoUrl?: string | null;
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
        className="rounded-full object-cover flex-shrink-0 border-2 border-card shadow-sm bg-muted"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 border-2 border-card shadow-sm bg-gradient-to-br text-white font-bold',
        color,
      )}
    >
      {(name || '?').charAt(0)}
    </div>
  );
}

export const SaverPodium = ({ entries }: Props) => {
  // ลำดับการแสดง: 2-1-3 (อันดับ 1 อยู่กลางสูงสุด)
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean) as PodiumEntry[];
  const visualRanks = [1, 0, 2]; // index ใน entries สำหรับ medal

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto items-end">
      {podiumOrder.map((s, idx) => {
        const rank = visualRanks[idx];
        const isFirst = rank === 0;
        return (
          <div
            key={s.student_id ?? idx}
            className={cn(
              'rounded-xl border-2 p-4 text-center space-y-2',
              MEDAL_BG[rank],
              isFirst ? 'md:py-6' : '',
            )}
          >
            <div className="text-3xl md:text-4xl">{MEDALS[rank]}</div>
            <div className="flex justify-center">
              <StudentAvatar
                name={s.full_name ?? '?'}
                photoUrl={s.photo_url}
                size={isFirst ? 80 : 60}
              />
            </div>
            <div className={cn('font-semibold truncate text-sm md:text-base', MEDAL_TEXT[rank])}>
              {s.full_name ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">{s.class_name ?? ''}</div>
            <div className={cn('font-bold tabular-nums text-base md:text-lg', MEDAL_TEXT[rank])}>
              ฝาก {Number(s.deposit_count ?? 0).toLocaleString('th-TH')} ครั้ง
            </div>
            <div className="flex justify-center pt-1">
              <SaverTierBadge depositCount={s.deposit_count} size="sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
