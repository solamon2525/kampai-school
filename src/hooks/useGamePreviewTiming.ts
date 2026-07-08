import { useMemo } from 'react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

/** จังหวะปก ↔ วิดีโอเดโมบนการ์ดเกม (จาก school_settings) */
export function useGamePreviewTiming() {
    const { settings } = useSchoolSettings();

    return useMemo(() => {
        const coverSec = Number(settings.game_preview_cover_seconds);
        const videoSec = Number(settings.game_preview_video_seconds);
        return {
            /** ms — โชว์ปกก่อนเริ่มคลิป / ระหว่างรอบ */
            coverMs: (Number.isFinite(coverSec) && coverSec >= 0 ? coverSec : 2) * 1000,
            /** ms — โชว์วิดีโอ · 0 = เล่นค้างไม่สลับกลับปก */
            videoMs: (Number.isFinite(videoSec) && videoSec >= 0 ? videoSec : 5) * 1000,
        };
    }, [settings.game_preview_cover_seconds, settings.game_preview_video_seconds]);
}
