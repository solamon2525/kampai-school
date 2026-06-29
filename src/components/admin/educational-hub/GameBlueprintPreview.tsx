import { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type { PlatformerBlueprintV1 } from '@/lib/game-blueprint';

type Props = {
    open: boolean;
    onClose: () => void;
    engineUrl: string;
    blueprint: PlatformerBlueprintV1;
};

export function GameBlueprintPreview({ open, onClose, engineUrl, blueprint }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!open) return;
        const iframe = iframeRef.current;
        if (!iframe) return;

        const send = () => {
            iframe.contentWindow?.postMessage(
                { type: 'blueprintPreview', blueprint },
                '*',
            );
        };

        iframe.addEventListener('load', send);
        const t = window.setTimeout(send, 400);
        return () => {
            iframe.removeEventListener('load', send);
            window.clearTimeout(t);
        };
    }, [open, blueprint, engineUrl]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-5xl p-2 sm:p-4">
                <DialogHeader className="px-2">
                    <DialogTitle>ทดสอบด่าน (Preview)</DialogTitle>
                    <DialogDescription>
                        ลองเล่นด่านก่อนบันทึก — ใช้ลูกศร / ปุ่มบนมือถือ
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <iframe
                        ref={iframeRef}
                        title="Blueprint preview"
                        src={engineUrl}
                        className="h-full w-full border-0"
                        allow="autoplay"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
