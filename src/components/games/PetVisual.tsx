import { cn } from '@/lib/utils';

type Props = {
  visualKey: string;
  className?: string;
  label?: string;
};

const Face = () => (
  <g className="text-foreground">
    <circle cx="38" cy="48" r="3" fill="currentColor" />
    <circle cx="58" cy="48" r="3" fill="currentColor" />
    <path d="M43 59 Q48 63 53 59" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </g>
);

export const PetVisual = ({ visualKey, className, label = 'สัตว์เลี้ยงคู่หู' }: Props) => {
  const body = (() => {
    switch (visualKey) {
      case 'cat':
        return (
          <>
            <path d="M24 35 29 14 42 29ZM72 35 67 14 54 29Z" fill="currentColor" />
            <circle cx="48" cy="50" r="28" fill="currentColor" />
            <path d="M45 55 48 58 51 55 48 53Z" className="text-card" fill="currentColor" />
            <Face />
          </>
        );
      case 'rabbit':
        return (
          <>
            <ellipse cx="35" cy="23" rx="9" ry="22" transform="rotate(-8 35 23)" fill="currentColor" />
            <ellipse cx="61" cy="23" rx="9" ry="22" transform="rotate(8 61 23)" fill="currentColor" />
            <circle cx="48" cy="54" r="27" fill="currentColor" />
            <Face />
          </>
        );
      case 'buffalo':
        return (
          <>
            <path d="M31 34C14 34 11 24 14 15c4 9 12 10 24 13M65 34c17 0 20-10 17-19-4 9-12 10-24 13" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="48" cy="53" rx="29" ry="27" fill="currentColor" />
            <ellipse cx="48" cy="65" rx="15" ry="10" className="text-card" fill="currentColor" />
            <Face />
          </>
        );
      case 'hornbill':
        return (
          <>
            <ellipse cx="42" cy="54" rx="25" ry="29" fill="currentColor" />
            <path d="M59 40c17-5 27 2 30 10-13 3-23 4-33 1Z" className="text-accent-foreground" fill="currentColor" />
            <path d="M55 35c9-11 20-10 25-4-8 2-14 4-21 10Z" className="text-muted-foreground" fill="currentColor" />
            <g className="text-foreground"><circle cx="48" cy="42" r="3" fill="currentColor" /></g>
            <path d="M28 67q14 10 28 0" className="text-card" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 'betta':
        return (
          <>
            <path d="M69 48c13-17 21-14 20-4-1 4-5 7-9 9 6 3 9 7 8 12-3 8-12 5-20-7Z" fill="currentColor" opacity=".65" />
            <ellipse cx="45" cy="52" rx="29" ry="21" fill="currentColor" />
            <path d="M38 69c10 11 24 8 31-4-13 4-21 2-31 4Z" fill="currentColor" opacity=".65" />
            <g className="text-foreground"><circle cx="31" cy="47" r="3" fill="currentColor" /></g>
            <path d="M18 54q6 4 12 0" className="text-card" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <ellipse cx="24" cy="49" rx="18" ry="23" fill="currentColor" opacity=".65" />
            <ellipse cx="72" cy="49" rx="18" ry="23" fill="currentColor" opacity=".65" />
            <circle cx="48" cy="48" r="27" fill="currentColor" />
            <path d="M50 60c1 9-1 17-7 19-7 2-10-4-6-8 3-3 7 0 8-8V53" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <Face />
          </>
        );
    }
  })();

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex aspect-square items-center justify-center rounded-full bg-primary/10 text-primary', className)}
    >
      <svg viewBox="0 0 96 96" className="h-[82%] w-[82%]" aria-hidden="true">
        {body}
      </svg>
    </div>
  );
};

