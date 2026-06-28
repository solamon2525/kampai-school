import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ScanSearch } from 'lucide-react';
import { analyzeSpriteSheetFromUrl, type SpriteAutoFitResult } from '@/lib/sprite-frame-autofit';
import { cn } from '@/lib/utils';

export type AutoFitApplyPayload = {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    cols?: number;
    rows?: number;
    analysis: SpriteAutoFitResult;
};

type Props = {
    sheetUrl: string;
    frameCount?: number;
    cols?: number;
    rows?: number;
    onApply: (payload: AutoFitApplyPayload) => void;
    className?: string;
    size?: 'sm' | 'default';
};

export function CharacterSheetAutoFitButton({
    sheetUrl,
    frameCount,
    cols,
    rows,
    onApply,
    className,
    size = 'sm',
}: Props) {
    const [busy, setBusy] = useState(false);
    const [lastSummary, setLastSummary] = useState<string | null>(null);

    const handleAutoFit = async () => {
        setBusy(true);
        try {
            const result = await analyzeSpriteSheetFromUrl(sheetUrl, {
                cols,
                rows,
                frameCount,
            });
            if (!result) {
                setLastSummary('วิเคราะห์ไม่สำเร็จ');
                return;
            }
            setLastSummary(result.summary);
            onApply({
                frameWidth: result.frameWidth,
                frameHeight: result.frameHeight,
                frameCount: result.frameCount,
                cols: result.cols,
                rows: result.rows,
                analysis: result,
            });
        } catch {
            setLastSummary('โหลดรูปไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={cn('space-y-1', className)}>
            <Button
                type="button"
                size={size}
                variant="outline"
                className="h-8 text-xs w-full"
                disabled={busy || !sheetUrl}
                onClick={handleAutoFit}
            >
                {busy
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> กำลังวิเคราะห์…</>
                    : <><ScanSearch className="h-3 w-3 mr-1" /> Auto fit — หา W×H พอดีตัว</>}
            </Button>
            {lastSummary && (
                <p className={cn(
                    'text-[10px] leading-snug',
                    lastSummary.includes('⚠') ? 'text-destructive' : 'text-muted-foreground',
                )}>
                    {lastSummary}
                </p>
            )}
        </div>
    );
}
