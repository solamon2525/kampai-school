import { cn } from '@/lib/utils';

export type MascotMood = 'idle' | 'happy' | 'celebrate' | 'sad' | 'wave';

type Props = {
  name?: string | null;
  mood?: MascotMood;
  /** ขนาดรูป (px) */
  size?: number;
  className?: string;
  /** โชว์ป้ายชื่อใต้รูป */
  showName?: boolean;
};

/**
 * MascotCompanion — เพื่อนจิ้งจอกประจำตัว (inline SVG, currentColor + Tailwind fill)
 * เปลี่ยนสีหน้าตามอารมณ์: ดีใจ/ฉลอง/เสียใจ/โบกมือ. ตั้งชื่อเองได้ (เก็บฝั่ง server)
 */
export function MascotCompanion({ name, mood = 'idle', size = 120, className, showName = false }: Props) {
  const bouncing = mood === 'happy' || mood === 'celebrate' || mood === 'wave';
  return (
    <div className={cn('flex flex-col items-center select-none', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className={cn('drop-shadow-sm', bouncing && 'animate-bounce')}
        role="img"
        aria-label={`มาสคอต${name ? ` ${name}` : ''}`}
      >
        {/* หาง */}
        <path d="M92 78c14 2 20 14 16 24-10 2-22-4-26-16z" className="fill-orange-400" />
        <path d="M96 92c6 1 9 6 7 11-5 1-10-2-12-8z" className="fill-orange-100" />
        {/* ตัว */}
        <ellipse cx="60" cy="84" rx="26" ry="24" className="fill-orange-400" />
        <ellipse cx="60" cy="92" rx="16" ry="15" className="fill-orange-50" />
        {/* หู */}
        <path d="M38 40l-6-20 22 12z" className="fill-orange-400" />
        <path d="M82 40l6-20-22 12z" className="fill-orange-400" />
        <path d="M40 36l-3-11 12 7z" className="fill-orange-200" />
        <path d="M80 36l3-11-12 7z" className="fill-orange-200" />
        {/* หัว */}
        <circle cx="60" cy="50" r="28" className="fill-orange-400" />
        {/* แก้ม/หน้า */}
        <path d="M60 30c-16 0-24 12-24 22 0 8 10 16 24 16s24-8 24-16c0-10-8-22-24-22z" className="fill-orange-50" />
        {/* จมูก */}
        <circle cx="60" cy="56" r="4" className="fill-slate-800" />
        <path d="M60 60v5" className="stroke-slate-700" strokeWidth={2} strokeLinecap="round" fill="none" />

        {/* ตา + ปาก ตามอารมณ์ */}
        {mood === 'sad' ? (
          <>
            <path d="M44 46c2-3 7-3 9 0" className="stroke-slate-800" strokeWidth={3} strokeLinecap="round" fill="none" />
            <path d="M67 46c2-3 7-3 9 0" className="stroke-slate-800" strokeWidth={3} strokeLinecap="round" fill="none" />
            <path d="M52 70c4-4 12-4 16 0" className="stroke-slate-700" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx="49" cy="47" r="3.6" className="fill-slate-800" />
            <circle cx="71" cy="47" r="3.6" className="fill-slate-800" />
            <circle cx="50.2" cy="45.8" r="1.1" className="fill-white" />
            <circle cx="72.2" cy="45.8" r="1.1" className="fill-white" />
            {mood === 'celebrate' || mood === 'happy' ? (
              <path d="M50 66c5 6 15 6 20 0" className="stroke-slate-700" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            ) : (
              <path d="M53 66c4 3 10 3 14 0" className="stroke-slate-700" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            )}
          </>
        )}

        {/* มือโบก */}
        {mood === 'wave' && (
          <g className="origin-[34px_70px]">
            <ellipse cx="32" cy="66" rx="7" ry="9" className="fill-orange-400" transform="rotate(-20 32 66)" />
          </g>
        )}
        {/* ดาวฉลอง */}
        {mood === 'celebrate' && (
          <g className="fill-amber-300">
            <path d="M26 26l2 5 5 1-4 4 1 5-4-3-5 3 1-5-4-4 5-1z" />
            <path d="M96 22l1.5 4 4 .7-3 3 .8 4-3.3-2-3.4 2 .8-4-3-3 4-.7z" />
          </g>
        )}
      </svg>
      {showName && name && (
        <span className="mt-1 text-sm font-semibold text-foreground">{name}</span>
      )}
    </div>
  );
}
