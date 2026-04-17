/** UTF-8 BOM so Excel opens Thai correctly */
const BOM = '\uFEFF';

/** Download a CSV file. headers + rows are plain strings (no quoting needed). */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers, ...rows].map(row => row.map(escape).join(','));
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Open a print window with a simple styled table. */
export function printTable(title: string, subtitle: string, tableHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Sarabun', sans-serif; padding: 24px; color: #111; font-size: 13px; }
    h2 { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #555; text-align: center; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; }
    th { background: #f0f0f0; font-weight: 700; text-align: center; }
    td { text-align: left; }
    td.num { text-align: right; }
    td.ctr { text-align: center; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 16px; font-size: 11px; color: #888; text-align: right; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <div class="subtitle">${subtitle}</div>
  ${tableHtml}
  <div class="footer">พิมพ์เมื่อ ${new Date().toLocaleString('th-TH')}</div>
</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}
