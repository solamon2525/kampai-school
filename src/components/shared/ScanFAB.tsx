import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

const SCAN_PATH = '/admin/dashboard/scan';

/**
 * ScanFAB — Floating Action Button สำหรับเข้าสแกน QR จากทุกหน้า admin
 *
 * - แสดงเฉพาะมือถือ/แท็บเล็ต (lg:hidden)
 * - ซ่อนเมื่ออยู่หน้า /scan แล้ว (avoid redundant)
 * - bg-amber-500 + Camera icon + shadow + pulse hint
 * - 1 tap → navigate ไป /admin/dashboard/scan → กล้องเปิดอัตโนมัติ
 */
export const ScanFAB = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useAuth();

    if (!session) return null;
    if (location.pathname.startsWith(SCAN_PATH)) return null;

    return (
        <button
            type="button"
            onClick={() => navigate(SCAN_PATH)}
            aria-label="สแกน QR นักเรียน"
            className="lg:hidden fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-amber-500 text-white shadow-2xl ring-4 ring-amber-500/30 flex items-center justify-center active:scale-95 transition-transform hover:bg-amber-600"
        >
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40 animate-ping" aria-hidden />
            <QrCode className="relative w-7 h-7" />
        </button>
    );
};
