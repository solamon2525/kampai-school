/**
 * GameShowcaseSection — โซนหน้าแรก: ลิงก์ไปหน้าสรุปเกมและสื่อสำหรับนำเสนอ
 */
import { LayoutGrid, ExternalLink, BookOpen, Gamepad2 } from 'lucide-react';

const SHOWCASE_URL = '/catalog/game-showcase.html';

const HIGHLIGHTS = [
  { icon: Gamepad2, label: 'เกมฝึกทักษะ', desc: 'สูตรคูณ · สะกดคำ · วิทย์' },
  { icon: BookOpen, label: 'สื่อการสอน', desc: 'Hub · แผนภาพ · สาธิต' },
  { icon: LayoutGrid, label: 'จัดตามวิชา', desc: '8 สาระ · ตัวชี้วัด ป.4' },
];

export default function GameShowcaseSection() {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="font-semibold text-sm flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          คลังเกมและสื่อการเรียนรู้
        </span>
        <a
          href={SHOWCASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          ดูทั้งหมด
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">
          สรุปเกมและสื่อที่พัฒนาแล้ว โรงเรียนบ้านคำไผ่ — จัดทำโดย ครูณัฐพงศ์ สิงห์ชมภู ครูผู้ช่วย
          จัดกริดตามวิชา พร้อมปกและตัวชี้วัด เหมาะสำหรับนำเสนอในห้องเรียน
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href={SHOWCASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-sm py-2.5 transition-colors"
        >
          <LayoutGrid className="h-4 w-4" />
          เปิดหน้าสรุปเกมและสื่อ (สไลด์นำเสนอ)
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
