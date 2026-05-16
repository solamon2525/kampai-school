import { useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Printer, X, QrCode } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface Student {
    id: string;
    name: string;
    class: string;
    class_number: number | null;
}

interface Props {
    students: Student[];
    open: boolean;
    onClose: () => void;
}

const CLASS_OPTIONS = [
    'อ.1', 'อ.2', 'อ.3',
    'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
    'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
];

/**
 * StudentQRSheet — พิมพ์ QR แจกนักเรียนทั้งห้อง (A4 grid 4×8 = 32 QR/หน้า)
 *
 * QR payload = `kampai-student:<uuid>` — สแกนได้กับทั้งธนาคารขยะและธนาคารพอเพียง
 */
export default function StudentQRSheet({ students, open, onClose }: Props) {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const printRef = useRef<HTMLDivElement>(null);
    const { settings } = useSchoolSettings();
    const schoolName = settings?.school_name || 'โรงเรียน';
    const academicYear = settings?.academic_year || '2568';

    const classmates = useMemo(() => {
        if (!selectedClass) return [] as Student[];
        return students
            .filter((s) => s.class === selectedClass)
            .sort((a, b) => (a.class_number ?? 999) - (b.class_number ?? 999));
    }, [students, selectedClass]);

    const classOptions = useMemo(() => {
        const have = new Set(students.map((s) => s.class));
        return CLASS_OPTIONS.filter((c) => have.has(c));
    }, [students]);

    function handlePrint() {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>QR นักเรียน — ${selectedClass}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:'Sarabun',sans-serif;background:white;color:#111;}
          @page{size:A4 portrait;margin:8mm;}
          @media print{
            body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
            div[style*="dashed"]{page-break-inside:avoid;break-inside:avoid;}
          }
        </style></head><body>${content}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden [&>button:last-child]:hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted border-b">
                    <span className="font-medium text-sm flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-700" />
                        พิมพ์ QR นักเรียนทั้งห้อง
                        {selectedClass && ` — ${selectedClass} (${classmates.length} คน)`}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrint}
                            disabled={classmates.length === 0}
                        >
                            <Printer className="w-4 h-4 mr-1" /> พิมพ์
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Class picker */}
                <div className="px-4 py-3 border-b bg-background space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        เลือกชั้น
                    </Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="เลือกชั้นที่จะพิมพ์" />
                        </SelectTrigger>
                        <SelectContent>
                            {classOptions.length === 0 ? (
                                <div className="px-2 py-2 text-xs text-muted-foreground">ยังไม่มีนักเรียน</div>
                            ) : (
                                classOptions.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c} ({students.filter((s) => s.class === c).length} คน)
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Preview */}
                <div className="overflow-auto bg-gray-100 p-6 max-h-[70vh]">
                    {classmates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            {selectedClass ? 'ไม่มีนักเรียนในชั้นนี้' : 'เลือกชั้นเพื่อดูตัวอย่าง'}
                        </div>
                    ) : (
                        <div ref={printRef} style={{ background: 'white', padding: '16px', maxWidth: '794px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
                                <h1 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                    QR นักเรียน — ชั้น {selectedClass}
                                </h1>
                                <p style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                    {schoolName} · ปีการศึกษา {academicYear} · สำหรับฝากขยะ / ฝากเงิน — ตัดตามเส้นประ
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                {classmates.map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            border: '1px dashed #cbd5e1',
                                            borderRadius: '4px',
                                            padding: '10px 6px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <div style={{ background: 'white', padding: '2px' }}>
                                            <QRCode value={`kampai-student:${s.id}`} size={80} />
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                textAlign: 'center',
                                                lineHeight: 1.2,
                                                color: '#0f172a',
                                                maxWidth: '100%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {s.name}
                                        </div>
                                        <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 500 }}>
                                            เลขที่ {s.class_number ?? '—'} · {s.class}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
