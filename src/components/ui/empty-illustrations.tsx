/**
 * Inline SVG empty-state illustrations.
 * All use `currentColor` + `text-primary` so they auto-adapt to light/dark themes.
 * Simple geometric style inspired by unDraw, but zero HTTP requests.
 */

interface IllustrationProps {
  className?: string;
}

const base = "w-full h-auto text-primary";

/** Generic empty state — box with a smile */
export function EmptyBoxIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* ground shadow */}
      <ellipse cx="120" cy="160" rx="80" ry="6" className="fill-muted-foreground/20" />
      {/* box */}
      <rect x="60" y="70" width="120" height="80" rx="6" className="fill-current opacity-20" />
      <rect x="60" y="70" width="120" height="20" rx="4" className="fill-current opacity-40" />
      <path d="M60 90h120" stroke="currentColor" strokeWidth="2" className="opacity-60" />
      {/* lid lines */}
      <path d="M108 70v20M132 70v20" stroke="currentColor" strokeWidth="2" className="opacity-70" />
      {/* sparkle on top */}
      <circle cx="100" cy="58" r="3" className="fill-current opacity-70" />
      <circle cx="140" cy="52" r="4" className="fill-current" />
      <circle cx="160" cy="62" r="2" className="fill-current opacity-50" />
    </svg>
  );
}

/** No tabular data */
export function NoDataIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      <ellipse cx="120" cy="160" rx="80" ry="6" className="fill-muted-foreground/20" />
      {/* chart paper */}
      <rect x="50" y="40" width="140" height="110" rx="8" className="fill-current opacity-10" stroke="currentColor" strokeWidth="2" />
      {/* header bar */}
      <rect x="60" y="52" width="60" height="6" rx="3" className="fill-current opacity-60" />
      {/* rows */}
      <rect x="60" y="72" width="120" height="4" rx="2" className="fill-current opacity-30" />
      <rect x="60" y="88" width="100" height="4" rx="2" className="fill-current opacity-30" />
      <rect x="60" y="104" width="110" height="4" rx="2" className="fill-current opacity-30" />
      <rect x="60" y="120" width="80" height="4" rx="2" className="fill-current opacity-30" />
      {/* magnifying glass */}
      <circle cx="160" cy="120" r="22" className="fill-background" stroke="currentColor" strokeWidth="3" />
      <path d="M176 136l12 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 120a10 10 0 0110-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
    </svg>
  );
}

/** No search results */
export function NoSearchIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      <ellipse cx="120" cy="160" rx="70" ry="5" className="fill-muted-foreground/20" />
      <circle cx="105" cy="85" r="42" className="fill-current opacity-10" stroke="currentColor" strokeWidth="3" />
      <path d="M138 117l24 24" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* sad face inside */}
      <circle cx="92" cy="78" r="3" className="fill-current" />
      <circle cx="118" cy="78" r="3" className="fill-current" />
      <path d="M92 100c5-5 13-5 18 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* floating question marks */}
      <text x="55" y="50" fontSize="16" className="fill-current opacity-50">?</text>
      <text x="175" y="75" fontSize="20" className="fill-current opacity-40">?</text>
    </svg>
  );
}

/** No students/people */
export function NoPeopleIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      <ellipse cx="120" cy="160" rx="80" ry="6" className="fill-muted-foreground/20" />
      {/* 3 silhouettes with dashed borders = empty roster */}
      {[60, 110, 160].map((x, i) => (
        <g key={i} className={`opacity-${60 - i * 15}`}>
          <circle cx={x} cy="68" r="14" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="fill-background" />
          <path d={`M${x - 20} 148c0-15 9-28 20-28s20 13 20 28`} stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="fill-background" />
        </g>
      ))}
      {/* plus icon hinting to add */}
      <circle cx="200" cy="40" r="14" className="fill-current opacity-80" />
      <path d="M200 32v16M192 40h16" stroke="hsl(var(--background))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** No documents */
export function NoDocumentsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      <ellipse cx="120" cy="160" rx="75" ry="6" className="fill-muted-foreground/20" />
      {/* back doc */}
      <path d="M82 30h60l20 20v100H82z" className="fill-current opacity-20" />
      <path d="M142 30v20h20" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* front doc */}
      <path d="M62 50h60l20 20v100H62z" className="fill-current opacity-10" stroke="currentColor" strokeWidth="2" />
      <path d="M122 50v20h20" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* text lines */}
      <rect x="74" y="90" width="52" height="4" rx="2" className="fill-current opacity-50" />
      <rect x="74" y="104" width="70" height="4" rx="2" className="fill-current opacity-50" />
      <rect x="74" y="118" width="44" height="4" rx="2" className="fill-current opacity-50" />
    </svg>
  );
}

/** No messages */
export function NoMessagesIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${base} ${className ?? ""}`}
      aria-hidden="true"
    >
      <ellipse cx="120" cy="160" rx="80" ry="6" className="fill-muted-foreground/20" />
      {/* envelope */}
      <rect x="50" y="55" width="140" height="90" rx="6" className="fill-current opacity-15" stroke="currentColor" strokeWidth="2" />
      <path d="M50 60l70 55 70-55" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* "0" badge */}
      <circle cx="180" cy="60" r="16" className="fill-current" />
      <text x="180" y="66" textAnchor="middle" fontSize="16" fontWeight="bold" className="fill-background">0</text>
      {/* z z z sleeping */}
      <text x="75" y="45" fontSize="10" className="fill-current opacity-60">z</text>
      <text x="85" y="35" fontSize="14" className="fill-current opacity-70">z</text>
      <text x="98" y="22" fontSize="18" className="fill-current opacity-80">z</text>
    </svg>
  );
}
