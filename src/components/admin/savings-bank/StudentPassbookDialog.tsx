import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { BookOpen, Printer, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { savingsStatementService } from '@/services/savings.service';
import { buildSavingsStatement, safeStatementCell } from '@/lib/savings-statement';
import { downloadCSV } from '@/lib/export';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const money = (value: number) =>
  value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const date = (value: string | null) => {
  if (!value || !isValid(parseISO(value))) return '—';
  return format(parseISO(value), 'd MMM yyyy', { locale: th });
};

const dateShort = (value: string | null) => {
  if (!value || !isValid(parseISO(value))) return '—';
  return format(parseISO(value), 'dd/MM/yy', { locale: th });
};

interface Props {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentPassbookDialog({ studentId, open, onOpenChange }: Props) {
  const [printError, setPrintError] = useState('');

  const query = useQuery({
    queryKey: ['savings-statement', studentId],
    queryFn: ({ signal }) => savingsStatementService.get(studentId, signal),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnMount: 'always',
  });

  const statement = useMemo(() => {
    return query.data ? buildSavingsStatement(query.data.rows) : null;
  }, [query.data]);

  const ready = Boolean(statement && query.data && !query.isFetching && !query.isError);
  const student = query.data?.student;
  const rows = statement?.rows ?? [];

  const handlePrintPassbook = () => {
    if (!ready || !student) return;

    const popup = window.open('', '_blank', 'width=1100,height=800');
    if (!popup) {
      setPrintError('เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาตป๊อปอัปแล้วลองใหม่อีกครั้ง');
      return;
    }
    setPrintError('');

    const doc = popup.document;
    doc.title = `สมุดคู่ฝากธนาคารพอเพียง_${student.full_name ?? studentId}`;
    doc.documentElement.lang = 'th';

    const style = doc.createElement('style');
    style.textContent = `
      @page {
        size: A4 landscape;
        margin: 8mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
        color: #111;
        background: #fff;
        margin: 0;
        padding: 0;
        font-size: 11px;
        line-height: 1.3;
      }
      .passbook-sheet {
        display: flex;
        width: 100%;
        min-height: 190mm;
        border: 2px solid #333;
        border-radius: 6px;
        overflow: hidden;
      }
      .page-half {
        flex: 1;
        padding: 14mm 10mm;
        display: flex;
        flex-direction: column;
      }
      .left-cover {
        border-right: 2px dashed #999;
        background: #fafaf8;
        position: relative;
      }
      .right-ledger {
        background: #ffffff;
      }
      .header-logo {
        text-align: center;
        border-bottom: 2px solid #b45309;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .school-name {
        font-size: 14px;
        font-weight: bold;
        color: #1e293b;
      }
      .passbook-title {
        font-size: 18px;
        font-weight: 800;
        color: #b45309;
        margin: 4px 0;
      }
      .sub-title {
        font-size: 10px;
        color: #64748b;
      }
      .info-box {
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 12px;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 11px;
      }
      .info-label {
        color: #475569;
        font-weight: bold;
      }
      .info-val {
        color: #0f172a;
        font-weight: 600;
      }
      .sufficiency-box {
        margin-top: auto;
        border: 1px dashed #d97706;
        background: #fffbeb;
        border-radius: 6px;
        padding: 8px;
        font-size: 9.5px;
        color: #92400e;
        line-height: 1.4;
      }
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        text-align: center;
        font-size: 10px;
      }
      .sig-line {
        border-top: 1px solid #666;
        width: 110px;
        margin: 24px auto 4px;
      }
      /* Right ledger table */
      .ledger-title {
        font-size: 13px;
        font-weight: bold;
        color: #0f172a;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      table.ledger-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5px;
      }
      table.ledger-table th, table.ledger-table td {
        border: 1px solid #cbd5e1;
        padding: 4px 5px;
        text-align: left;
      }
      table.ledger-table th {
        background: #f1f5f9;
        font-weight: bold;
        color: #334155;
        text-align: center;
      }
      table.ledger-table td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      table.ledger-table tr:nth-child(even) {
        background: #f8fafc;
      }
      .fold-hint {
        position: absolute;
        top: 2mm;
        right: -15px;
        background: #fff;
        padding: 0 4px;
        font-size: 8px;
        color: #94a3b8;
        transform: rotate(90deg);
      }
      .print-btn-bar {
        padding: 10px 0;
        text-align: right;
      }
      button.print-btn {
        background: #b45309;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
      }
      @media print {
        .print-btn-bar { display: none; }
        body { padding: 0; }
        .passbook-sheet { border: 1.5px solid #000; }
      }
    `;
    doc.head.append(style);

    // Print Bar
    const btnBar = doc.createElement('div');
    btnBar.className = 'print-btn-bar';
    const btn = doc.createElement('button');
    btn.className = 'print-btn';
    btn.textContent = 'พิมพ์สมุดคู่ฝาก (Print / Save PDF)';
    btn.onclick = () => popup.print();
    btnBar.append(btn);
    doc.body.append(btnBar);

    // Sheet container
    const sheet = doc.createElement('div');
    sheet.className = 'passbook-sheet';

    // ── Left Page (Cover & Student Profile) ──────────────────────
    const left = doc.createElement('div');
    left.className = 'page-half left-cover';

    left.innerHTML = `
      <div class="header-logo">
        <div class="school-name">โรงเรียนบ้านคำไผ่</div>
        <div class="passbook-title">สมุดบัญชีเงินฝากคู่ฝาก</div>
        <div class="sub-title">โครงการธนาคารพอเพียง ปลูกฝังวินัยการออมเพื่ออนาคต</div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">ชื่อ–นามสกุล:</span>
          <span class="info-val">${student.full_name ?? '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">รหัสประจำตัว:</span>
          <span class="info-val">${student.student_code ?? '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ระดับชั้น:</span>
          <span class="info-val">ชั้น ${student.class_name ?? '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">วันที่ออกเล่ม:</span>
          <span class="info-val">${date(new Date().toISOString())}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ยอดเงินคงเหลือปัจจุบัน:</span>
          <span class="info-val" style="color: #b45309; font-size: 13px; font-weight: 800;">
            ${money(Number(student.current_balance ?? 0))} บาท
          </span>
        </div>
      </div>

      <div class="sufficiency-box">
        <strong>หลักปรัชญาเศรษฐกิจพอเพียงในการออม:</strong><br>
        • <strong>พอประมาณ:</strong> ออมตามกำลัง ไม่เดือดร้อนตนเองและครอบครัว<br>
        • <strong>มีเหตุผล:</strong> รู้จักจัดสรรเงินเพื่อเป้าหมายและการศึกษา<br>
        • <strong>มีภูมิคุ้มกัน:</strong> มีเงินสำรองไว้ใช้ในยามจำเป็นและฉุกเฉิน
      </div>

      <div class="signatures">
        <div>
          <div class="sig-line"></div>
          <div>(......................................................)</div>
          <div>เจ้าของบัญชี (นักเรียน)</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div>(......................................................)</div>
          <div>ครูประจำชั้น / ผู้รับฝาก</div>
        </div>
      </div>
    `;
    sheet.append(left);

    // ── Right Page (Ledger Entries) ─────────────────────────────
    const right = doc.createElement('div');
    right.className = 'page-half right-ledger';

    const recentRows = rows.slice(-18); // fit up to 18 rows on one A4 page nicely
    const trs = recentRows
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${dateShort(r.transaction_date)}</td>
          <td style="text-align:center;">${r.transaction_type === 'deposit' ? 'ฝาก' : 'ถอน'}</td>
          <td class="num" style="color: ${r.transaction_type === 'deposit' ? '#047857' : '#b91c1c'}; font-weight:bold;">
            ${money(r.amount)}
          </td>
          <td class="num" style="font-weight:bold; color: #1e293b;">
            ${money(r.ledgerBalance)}
          </td>
          <td style="font-size:8px; text-align:center;">
            ${r.recorded_by ? r.recorded_by.split(' ')[0] : 'จนท.'}
          </td>
        </tr>
      `,
      )
      .join('');

    // Empty blank lines up to 18
    const emptyCount = Math.max(0, 18 - recentRows.length);
    const blanks = Array.from({ length: emptyCount })
      .map(
        (_, i) => `
        <tr>
          <td style="text-align:center; color:#ccc;">${recentRows.length + i + 1}</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `,
      )
      .join('');

    right.innerHTML = `
      <div class="ledger-title">
        <span>รายการเดินบัญชี (Passbook Ledger)</span>
        <span style="font-size: 10px; font-weight: normal; color: #64748b;">
          รวมฝาก ${Number(student.deposit_count ?? 0)} ครั้ง · ถอน ${Number(student.withdraw_count ?? 0)} ครั้ง
        </span>
      </div>

      <table class="ledger-table">
        <thead>
          <tr>
            <th style="width: 25px;">ที่</th>
            <th style="width: 60px;">วันที่</th>
            <th style="width: 40px;">รายการ</th>
            <th style="width: 65px;">จำนวนเงิน</th>
            <th style="width: 75px;">คงเหลือ</th>
            <th style="width: 55px;">ผู้ตรวจ</th>
          </tr>
        </thead>
        <tbody>
          ${trs}
          ${blanks}
        </tbody>
      </table>
    `;
    sheet.append(right);

    doc.body.append(sheet);
    popup.focus();
  };

  const exportCSV = () => {
    if (!ready || !student) return;
    const headers = ['ลำดับ', 'วันที่', 'ประเภท', 'จำนวนเงิน', 'ยอดคงเหลือ', 'ผู้บันทึก', 'หมายเหตุ'];
    const dataRows = rows.map((r, i) => [
      i + 1,
      date(r.transaction_date),
      r.transaction_type === 'deposit' ? 'ฝาก' : 'ถอน',
      r.amount,
      r.ledgerBalance,
      r.recorded_by ?? '',
      r.notes ?? '',
    ]);

    downloadCSV(
      `passbook-${student.student_code || studentId}.csv`,
      [`สมุดบัญชีเงินฝาก ธนาคารพอเพียง - ${student.full_name}`],
      [headers, ...dataRows].map((row) => row.map(safeStatementCell)),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-4xl flex flex-col overflow-hidden p-4 sm:p-6 bg-card">
        <DialogHeader className="text-left border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <DialogTitle className="text-foreground">
              สมุดบัญชีเงินฝากพับคู่ A4 (Foldable Passbook)
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            ออกแบบสำหรับพิมพ์ลงกระดาษ A4 แนวนอน แล้วพับครึ่งเป็นสมุดคู่ฝากประจำตัวนักเรียน
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {query.isFetching && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลสมุดบัญชี...</p>}

          {query.isError && (
            <div className="p-3 border border-destructive/40 bg-destructive/10 rounded-lg text-sm text-destructive">
              โหลดข้อมูลไม่สำเร็จ: {query.error instanceof Error ? query.error.message : 'กรุณาลองใหม่'}
            </div>
          )}

          {printError && (
            <div className="p-3 border border-amber-400 bg-amber-500/10 rounded-lg text-xs text-amber-900">
              {printError}
            </div>
          )}

          {ready && student && (
            <>
              {/* Profile Bar */}
              <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    name={student.full_name ?? 'นักเรียน'}
                    photoUrl={student.photo_url}
                    size="md"
                  />
                  <div>
                    <p className="font-bold text-sm text-foreground">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      รหัส: {student.student_code ?? '—'} · ชั้น {student.class_name ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">ยอดเงินคงเหลือ</p>
                  <p className="text-lg font-extrabold text-amber-600 tabular-nums">
                    {money(Number(student.current_balance ?? 0))} ฿
                  </p>
                </div>
              </div>

              {/* Passbook Visual Preview Card */}
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    พรีวิวเลย์เอาต์ A4 แนวนอน (พับครึ่งซ้าย-ขวา)
                  </span>
                  <span>{rows.length} ธุรกรรมทั้งหมด</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-card rounded-lg border border-border">
                  {/* Left preview */}
                  <div className="border border-border/80 rounded-lg p-3 bg-muted/20 space-y-2 text-xs">
                    <div className="font-bold text-center text-foreground border-b border-border/60 pb-1">
                      [หน้าซ้าย: ปกหน้า & ข้อมูลผู้ถือบัญชี]
                    </div>
                    <p className="text-muted-foreground">
                      • ตราและชื่อโรงเรียนบ้านคำไผ่<br />
                      • ชื่อ-รหัส-ชั้นของนักเรียน<br />
                      • สรุปยอดเงินและหลักปรัชญาเศรษฐกิจพอเพียง<br />
                      • ช่องลงลายมือชื่อนักเรียนและครูประจำชั้น
                    </p>
                  </div>

                  {/* Right preview */}
                  <div className="border border-border/80 rounded-lg p-3 bg-muted/20 space-y-2 text-xs">
                    <div className="font-bold text-center text-foreground border-b border-border/60 pb-1">
                      [หน้าขวา: ตารางบันทึกการฝาก-ถอน]
                    </div>
                    <p className="text-muted-foreground">
                      • ตาราง 18 บรรทัดมาตรฐาน (พิมพ์รายการล่าสุดอัตโนมัติ)<br />
                      • บันทึกวันที่, รายการ, จำนวนเงิน, ยอดคงเหลือ, และช่องเซ็น<br />
                      • มีเส้นประตรงกลางแผ่นสำหรับพับเป็นเล่มสมุดพก
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!ready}>
            <Download className="w-4 h-4 mr-1.5" />
            ดาวน์โหลด CSV
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              onClick={handlePrintPassbook}
              disabled={!ready}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              พิมพ์สมุดคู่ฝาก A4 (Passbook)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
