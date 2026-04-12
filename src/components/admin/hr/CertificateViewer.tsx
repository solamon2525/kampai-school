import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface TrainingRecord {
  id: string;
  course_name: string;
  provider: string | null;
  training_type: string;
  start_date: string;
  end_date: string | null;
  hours: number;
  location: string | null;
  staff?: { name: string } | null;
}

interface Props {
  record: TrainingRecord | null;
  open: boolean;
  onClose: () => void;
}

function formatThaiDate(dateStr: string) {
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateRange(start: string, end: string | null) {
  if (!end || start === end) return formatThaiDate(start);
  return `${formatThaiDate(start)} – ${formatThaiDate(end)}`;
}

export default function CertificateViewer({ record, open, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const { settings } = useSchoolSettings();

  const schoolName = settings?.school_name || 'โรงเรียนกำปั่ยวิทยาคม';
  const logoUrl = settings?.school_logo_url || null;
  const address = settings?.contact_address || '';

  function handlePrint() {
    const printContent = certRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>วุฒิบัตร</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Sarabun', sans-serif; background: white; }
          @page { size: A4 landscape; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  if (!record) return null;

  const typeLabel: Record<string, string> = {
    'อบรม': 'การอบรม',
    'สัมมนา': 'การสัมมนา',
    'ศึกษาดูงาน': 'การศึกษาดูงาน',
    'ประชุมวิชาการ': 'การประชุมวิชาการ',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden [&>button:last-child]:hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted border-b">
          <span className="font-medium text-sm">วุฒิบัตร — {record.course_name}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> พิมพ์
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="overflow-auto bg-gray-100 p-6 flex justify-center">
          <div
            ref={certRef}
            style={{
              width: '842px',
              height: '595px',
              background: 'white',
              position: 'relative',
              fontFamily: "'Sarabun', 'Prompt', sans-serif",
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Outer decorative border */}
            <div style={{
              position: 'absolute', inset: '12px',
              border: '3px solid #c8a96e',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 10,
            }} />
            <div style={{
              position: 'absolute', inset: '18px',
              border: '1px solid #c8a96e',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 10,
            }} />

            {/* Corner ornaments */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                ...(pos.includes('top') ? { top: '6px' } : { bottom: '6px' }),
                ...(pos.includes('left') ? { left: '6px' } : { right: '6px' }),
                width: '32px', height: '32px',
                borderTop: pos.includes('top') ? '3px solid #9b7a3b' : 'none',
                borderBottom: pos.includes('bottom') ? '3px solid #9b7a3b' : 'none',
                borderLeft: pos.includes('left') ? '3px solid #9b7a3b' : 'none',
                borderRight: pos.includes('right') ? '3px solid #9b7a3b' : 'none',
                zIndex: 11,
              }} />
            ))}

            {/* Background gradient */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #fffef5 0%, #fdf8ec 50%, #fffef5 100%)',
            }} />

            {/* Top decorative stripe */}
            <div style={{
              position: 'absolute', top: '28px', left: '28px', right: '28px',
              height: '6px',
              background: 'linear-gradient(90deg, transparent, #c8a96e 20%, #9b7a3b 50%, #c8a96e 80%, transparent)',
              borderRadius: '3px',
            }} />
            <div style={{
              position: 'absolute', bottom: '28px', left: '28px', right: '28px',
              height: '6px',
              background: 'linear-gradient(90deg, transparent, #c8a96e 20%, #9b7a3b 50%, #c8a96e 80%, transparent)',
              borderRadius: '3px',
            }} />

            {/* Main content */}
            <div style={{
              position: 'relative', zIndex: 5,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '40px 60px 30px',
              height: '100%',
            }}>
              {/* Header: Logo + School name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                {logoUrl && (
                  <img src={logoUrl} alt="logo" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#5a3e1b', letterSpacing: '0.5px' }}>
                    {schoolName}
                  </div>
                  {address && (
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>{address}</div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: '300px', height: '1px', background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)', margin: '8px 0' }} />

              {/* Certificate title */}
              <div style={{
                fontSize: '36px', fontWeight: '700',
                color: '#7a5520',
                letterSpacing: '6px',
                textShadow: '1px 1px 2px rgba(200,169,110,0.3)',
                marginBottom: '2px',
              }}>
                วุฒิบัตร
              </div>
              <div style={{ fontSize: '13px', color: '#9b7a3b', letterSpacing: '3px', marginBottom: '16px' }}>
                CERTIFICATE OF COMPLETION
              </div>

              {/* Body */}
              <div style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>
                ขอมอบวุฒิบัตรนี้ให้แก่
              </div>

              {/* Name */}
              <div style={{
                fontSize: '26px', fontWeight: '700', color: '#2c2c2c',
                borderBottom: '2px solid #c8a96e',
                paddingBottom: '4px', marginBottom: '10px',
                minWidth: '300px', textAlign: 'center',
              }}>
                {(record.staff as any)?.name || '...'}
              </div>

              <div style={{ fontSize: '13px', color: '#444', marginBottom: '4px', textAlign: 'center' }}>
                ได้ผ่าน{typeLabel[record.training_type] || record.training_type}
              </div>

              {/* Course name */}
              <div style={{
                fontSize: '17px', fontWeight: '600', color: '#3a2a10',
                textAlign: 'center', maxWidth: '600px',
                background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.15), transparent)',
                padding: '6px 24px', borderRadius: '4px',
                marginBottom: '6px',
              }}>
                {record.course_name}
              </div>

              {/* Details row */}
              <div style={{ display: 'flex', gap: '32px', fontSize: '12px', color: '#666', marginBottom: '14px' }}>
                {record.provider && <span>จัดโดย: <strong style={{ color: '#444' }}>{record.provider}</strong></span>}
                {record.hours > 0 && <span>จำนวน: <strong style={{ color: '#444' }}>{record.hours} ชั่วโมง</strong></span>}
                <span>วันที่: <strong style={{ color: '#444' }}>{formatDateRange(record.start_date, record.end_date)}</strong></span>
                {record.location && <span>สถานที่: <strong style={{ color: '#444' }}>{record.location}</strong></span>}
              </div>

              {/* Signature area */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', width: '100%',
                borderTop: '1px dashed #ddd', paddingTop: '12px', marginTop: 'auto',
              }}>
                <div style={{ textAlign: 'center', minWidth: '160px' }}>
                  <div style={{ height: '36px', borderBottom: '1.5px solid #555', marginBottom: '4px', marginLeft: '20px', marginRight: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#555' }}>ผู้อำนวยการโรงเรียน</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{schoolName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
