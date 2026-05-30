import { Html5Qrcode } from 'html5-qrcode';

/** ตีความ error จาก html5-qrcode/getUserMedia เป็นข้อความภาษาไทย (shared ระหว่าง scanner ทุกตัว) */
export function describeCameraError(err: unknown): string {
    const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    const lower = raw.toLowerCase();
    if (lower.includes('permission') || lower.includes('notallowed') || lower.includes('denied')) {
        return 'เบราว์เซอร์ไม่อนุญาตให้ใช้กล้อง — ตรวจสอบการตั้งค่า permission แล้วลองใหม่ (ดูวิธีด้านล่าง)';
    }
    if (lower.includes('notfound') || lower.includes('devicesnotfound') || lower.includes('no camera')) {
        return 'ไม่พบกล้องบนอุปกรณ์นี้';
    }
    if (lower.includes('notreadable') || lower.includes('in use') || lower.includes('trackstart')) {
        return 'กล้องถูกใช้งานโดยแอปอื่น — ปิดแอปกล้อง/วิดีโอคอลแล้วลองใหม่';
    }
    if (lower.includes('overconstrained')) {
        return 'กล้องไม่รองรับการตั้งค่าที่ขอ — ลองสลับเป็นกล้องหน้าหรือเบราว์เซอร์อื่น';
    }
    if (lower.includes('secure') || lower.includes('https')) {
        return 'ต้องเปิดผ่าน HTTPS เท่านั้น (ไม่ใช่ http://)';
    }
    return `เปิดกล้องไม่สำเร็จ: ${raw}`;
}

const SCAN_CONFIG = { fps: 10, qrbox: { width: 240, height: 240 } } as const;

/**
 * เริ่มสแกนด้วยกล้องหลังก่อน (`facingMode: 'environment'`) — ถ้าล้มเหลว fallback ไป
 * enumerate กล้องจริงด้วย Html5Qrcode.getCameras() แล้วเลือกตัวที่เป็นกล้องหลัง
 * (บางอุปกรณ์ Android ไม่ยอมรับ constraint facingMode ตรง ๆ ต้องระบุ deviceId).
 */
export async function startRearScanner(
    html5: Html5Qrcode,
    onDecode: (decodedText: string) => void,
): Promise<void> {
    try {
        await html5.start({ facingMode: 'environment' }, SCAN_CONFIG, onDecode, () => {/* ignore decode errors */});
    } catch (primaryErr) {
        // fallback: ถ้า permission granted แล้วแต่ facingMode ไม่ work → ลองด้วย deviceId
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) throw primaryErr;
        const rear = cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];
        await html5.start(rear.id, SCAN_CONFIG, onDecode, () => {/* ignore decode errors */});
    }
}
