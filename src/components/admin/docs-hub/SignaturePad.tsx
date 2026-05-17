import { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';

export interface SignaturePadHandle {
    isEmpty: () => boolean;
    clear: () => void;
    /** export เป็น PNG Blob (transparent bg ถ้า trim=true) */
    toBlob: (trim?: boolean) => Promise<Blob | null>;
}

interface SignaturePadProps {
    width?: number;
    height?: number;
    className?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
    ({ width = 480, height = 160, className }, ref) => {
        const sigRef = useRef<SignatureCanvas>(null);

        useImperativeHandle(ref, () => ({
            isEmpty: () => sigRef.current?.isEmpty() ?? true,
            clear: () => sigRef.current?.clear(),
            toBlob: (trim = true) =>
                new Promise((resolve) => {
                    const inst = sigRef.current;
                    if (!inst || inst.isEmpty()) return resolve(null);
                    const canvas = trim ? inst.getTrimmedCanvas() : inst.getCanvas();
                    canvas.toBlob((b) => resolve(b), 'image/png');
                }),
        }));

        return (
            <div
                className={cn(
                    'border-2 border-dashed border-border rounded-lg bg-background',
                    'overflow-hidden',
                    className,
                )}
            >
                <SignatureCanvas
                    ref={sigRef}
                    penColor="hsl(var(--foreground))"
                    canvasProps={{
                        width,
                        height,
                        className: 'block w-full',
                        'aria-label': 'พื้นที่ลงลายเซ็น',
                    }}
                />
            </div>
        );
    },
);
SignaturePad.displayName = 'SignaturePad';
