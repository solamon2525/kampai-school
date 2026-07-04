import { cn } from '@/lib/utils';

interface GameCoverThumbProps {
    src: string;
    alt: string;
    className?: string;
    imgClassName?: string;
}

/** ปกเกม 16:9 — object-contain + padding กัน tone mark ไทยโดนตัด (GAME.md) */
export const GameCoverThumb = ({ src, alt, className, imgClassName }: GameCoverThumbProps) => (
    <div className={cn('aspect-video w-full overflow-hidden bg-muted p-2', className)}>
        <img
            src={src}
            alt={alt}
            loading="lazy"
            className={cn('w-full h-full object-contain', imgClassName)}
        />
    </div>
);
