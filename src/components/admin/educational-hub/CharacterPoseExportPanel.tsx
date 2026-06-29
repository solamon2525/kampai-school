import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import type { CharacterAnimationConfig, CharacterPoseKey } from '@/lib/character-animation';
import type { CharacterColorConfig } from '@/lib/character-color';
import {
    EXPORT_POSE_OPTIONS,
    exportPoseStripPng,
    downloadBlob,
} from '@/lib/character-pose-export';
import { listMappedPoses } from '@/lib/character-animation';
import { cn } from '@/lib/utils';

// re-export helper if we add to export file - actually listMappedPoses is enough

type Props = {
    sheetUrl: string;
    title: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig: CharacterAnimationConfig;
    colorConfig?: CharacterColorConfig | null;
    className?: string;
};

export function CharacterPoseExportPanel({
    sheetUrl,
    title,
    frameWidth,
    frameHeight,
    frameCount,
    animationConfig,
    colorConfig,
    className,
}: Props) {
    const [busyPose, setBusyPose] = useState<CharacterPoseKey | null>(null);
    const mapped = listMappedPoses(animationConfig);

    const handleExport = async (pose: CharacterPoseKey) => {
        setBusyPose(pose);
        try {
            const blob = await exportPoseStripPng({
                sheetUrl,
                frameWidth,
                frameHeight,
                frameCount,
                animationConfig,
                colorConfig,
                pose,
            });
            if (!blob) return;
            const safe = title.replace(/[^\w\u0E00-\u0E7F-]+/g, '-').slice(0, 40) || 'character';
            downloadBlob(blob, `${safe}-${pose}.png`);
        } finally {
            setBusyPose(null);
        }
    };

    return (
        <div className={cn('space-y-2 rounded-md border border-border p-3', className)}>
            <p className="text-xs font-medium text-muted-foreground">📥 Export PNG แยกท่า</p>
            <p className="text-[10px] text-muted-foreground">
                ดาวน์โหลด strip แนวนอน (ทุกเฟรมของท่านั้น) — ใช้สีที่ตั้งใน palette
            </p>
            <div className="flex flex-wrap gap-1">
                {EXPORT_POSE_OPTIONS.map(({ key, label }) => {
                    const hasFrames = mapped.includes(key);
                    return (
                        <Button
                            key={key}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={!hasFrames || busyPose != null}
                            onClick={() => void handleExport(key)}
                        >
                            {busyPose === key ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Download className="h-3 w-3 mr-1" />
                            )}
                            {label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
