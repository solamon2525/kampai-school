import { useMemo } from 'react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

/** จังหวะปก ↔ วิดีโอเดโมบนการ์ดเกม (จาก school_settings) */
export function useGamePreviewTiming() {
    const { settings } = useSchoolSettings();

    return useMemo(() => {
        const coverSec = Number(settings.game_preview_cover_seconds);
        const videoSec = Number(settings.game_preview_video_seconds);
        const coverRound2MinSec = Number(settings.game_preview_cover_round2_min_seconds);
        const coverRound2MaxSec = Number(settings.game_preview_cover_round2_max_seconds);

        const coverMs =
            (Number.isFinite(coverSec) && coverSec >= 0 ? coverSec : 2) * 1000;
        const videoMs =
            (Number.isFinite(videoSec) && videoSec >= 0 ? videoSec : 5) * 1000;

        const round2MinMs =
            (Number.isFinite(coverRound2MinSec) && coverRound2MinSec >= 0
                ? coverRound2MinSec
                : 3) * 1000;
        const round2MaxMs =
            (Number.isFinite(coverRound2MaxSec) && coverRound2MaxSec >= 0
                ? coverRound2MaxSec
                : 5) * 1000;

        const safeRound2MinMs = Math.min(round2MinMs, round2MaxMs);
        const safeRound2MaxMs = Math.max(round2MinMs, round2MaxMs);

        return {
            /** ms — โชว์ปกก่อนเริ่มคลิป / ระหว่างรอบ */
            coverMs,
            /** ms — โชว์วิดีโอ · 0 = เล่นค้างไม่สลับกลับปก */
            videoMs,
            /** ms — หลังวิดีโอรอบแรกแล้ว ปกจะสุ่มช่วงนี้ (วนซ้ำทุกครั้ง) */
            coverRound2MinMs: safeRound2MinMs,
            coverRound2MaxMs: safeRound2MaxMs,
        };
    }, [
        settings.game_preview_cover_seconds,
        settings.game_preview_video_seconds,
        settings.game_preview_cover_round2_min_seconds,
        settings.game_preview_cover_round2_max_seconds,
    ]);
}
