import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface Student {
    id: string;
    student_code: string | null;
    name: string;
    class: string;
    class_number: number | null;
    gender: string | null;
    photo_url: string | null;
}

interface Props {
    student?: Student;
    students?: Student[];
    open: boolean;
    onClose: () => void;
    printAll?: boolean;
}

function CardFace({ student, schoolName, logoUrl, academicYear }: {
    student: Student;
    schoolName: string;
    logoUrl: string | null;
    academicYear: string;
}) {
    const bgColor = student.gender === 'female' ? '#fce7f3' : '#dbeafe';
    const accentColor = student.gender === 'female' ? '#db2777' : '#1d4ed8';

    return (
        <div style={{
            width: '340px', height: '214px',
            background: `linear-gradient(135deg, white 60%, ${bgColor} 100%)`,
            borderRadius: '12px',
            border: `2px solid ${accentColor}20`,
            fontFamily: "'Sarabun','Prompt',sans-serif",
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            flexShrink: 0,
            pageBreakInside: 'avoid',
        }}>
            {/* Accent bar top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: accentColor }} />

            {/* Decorative circle */}
            <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '120px', height: '120px',
                borderRadius: '50%',
                background: `${accentColor}10`,
            }} />

            <div style={{ padding: '14px 14px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {logoUrl && <img src={logoUrl} alt="logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />}
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: accentColor, lineHeight: 1.2 }}>{schoolName}</div>
                        <div style={{ fontSize: '8px', color: '#888' }}>บัตรประจำตัวนักเรียน • ปีการศึกษา {academicYear}</div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    {/* Photo */}
                    <div style={{ flexShrink: 0 }}>
                        {student.photo_url ? (
                            <img src={student.photo_url} alt={student.name}
                                style={{ width: '72px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${accentColor}40` }} />
                        ) : (
                            <div style={{
                                width: '72px', height: '90px', borderRadius: '8px',
                                background: `${accentColor}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', color: accentColor, fontWeight: '700',
                                border: `2px solid ${accentColor}30`,
                            }}>
                                {student.name.slice(0, 1)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', lineHeight: 1.3, marginBottom: '4px' }}>
                                {student.name}
                            </div>
                            {student.student_code && (
                                <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px' }}>
                                    รหัส: <span style={{ fontFamily: 'monospace', color: accentColor }}>{student.student_code}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                                <div style={{ background: `${accentColor}15`, padding: '2px 8px', borderRadius: '4px', color: accentColor, fontWeight: '600' }}>
                                    ชั้น {student.class}
                                </div>
                                {student.class_number && (
                                    <div style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', color: '#555' }}>
                                        เลขที่ {student.class_number}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QR */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <div style={{ background: 'white', padding: '5px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                                <QRCode value={`kampai-student:${student.id}`} size={84} level="M" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom accent */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        </div>
    );
}

export default function StudentCard({ student, students, open, onClose, printAll = false }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const { settings } = useSchoolSettings();

    const schoolName = settings?.school_name || 'โรงเรียน';
    const logoUrl = settings?.school_logo_url || null;
    const academicYear = settings?.academic_year || '2568';

    const list = printAll && students ? students : student ? [student] : [];

    function handlePrint() {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:'Sarabun',sans-serif;background:white;padding:16px;}
          @page{size:A4;margin:10mm;}
          @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
          .grid{display:grid;grid-template-columns:repeat(2,340px);gap:16px;justify-content:center;}
        </style></head><body>${content}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    }

    if (list.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden [&>button:last-child]:hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted border-b">
                    <span className="font-medium text-sm">
                        {printAll ? `บัตรนักเรียน — ${list[0]?.class} (${list.length} คน)` : `บัตรนักเรียน — ${list[0]?.name}`}
                    </span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-1" /> พิมพ์
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* Preview */}
                <div className="overflow-auto bg-gray-100 p-6 max-h-[75vh]">
                    <div ref={printRef} className={printAll ? 'grid grid-cols-2 gap-4 justify-items-center' : 'flex justify-center'}>
                        {list.map(s => (
                            <CardFace key={s.id} student={s} schoolName={schoolName} logoUrl={logoUrl} academicYear={academicYear} />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
