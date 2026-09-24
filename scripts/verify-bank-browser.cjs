// Preview must be running. All fixture traffic is intercepted; no real transactions are written.
// BANK_PLAYWRIGHT_PATH may point to an existing Playwright installation.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { build } = createRequire(require.resolve('vite'))('esbuild');
const { chromium } = require(process.env.BANK_PLAYWRIGHT_PATH || 'playwright');
const base = process.env.BANK_PREVIEW_URL || 'http://127.0.0.1:4173';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const people = Array.from({ length: 31 }, (_, i) => ({ student_id: id(i + 1), full_name: `นักเรียนทดสอบ ${String(i + 1).padStart(2, '0')}`, class_name: i < 16 ? 'ป.1' : 'ป.2', photo_url: null, student_code: String(i + 1).padStart(4, '0'), current_balance: 100, available_points: 80, total_points_spent: 20, total_transactions: 40, total_deposits: 120, total_withdrawals: 20, deposit_count: 30, withdraw_count: 10 }));
const savings = Array.from({ length: 1101 }, (_, i) => ({ id: id(i + 100), student_id: people[i % 31].student_id, student_name: people[i % 31].full_name, student_class: people[i % 31].class_name, transaction_date: today, transaction_type: i % 5 === 0 ? 'withdraw' : 'deposit', amount: 10, created_at: today + 'T01:00:00Z' }));
const waste = savings.map((t, i) => ({ ...t, category_id: id(i % 2 + 9000), quantity: 2, points_earned: 4, waste_categories: { name: i % 2 ? 'กระดาษ' : 'ขวดพลาสติก', color: i % 2 ? 'blue' : 'emerald' } }));
async function main() {
  const entry = `import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom'; import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; import { BankDashboard } from './src/components/bank/BankDashboard'; import { SavingsBankManagement } from './src/components/admin/savings-bank/SavingsBankManagement'; import { WasteBankManagement } from './src/components/admin/waste-bank/WasteBankManagement'; import { Toaster } from './src/components/ui/toaster'; const p=new URLSearchParams(location.search); const kind=p.get('kind')==='waste'?'waste':'savings'; const q=new QueryClient({defaultOptions:{queries:{retry:false}}}); createRoot(document.getElementById('root')).render(<BrowserRouter><QueryClientProvider client={q}><div className="max-w-7xl mx-auto p-4"><h1>ข้อมูลจำลองสำหรับตรวจรับ</h1>{p.get('surface')==='form' ? kind==='savings'?<SavingsBankManagement/>:<WasteBankManagement/> : <BankDashboard kind={kind} audience={p.get('audience')==='public'?'public':'admin'} />}</div><Toaster/></QueryClientProvider></BrowserRouter>);`;
  await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, outfile: 'dist/bank-qa.js', format: 'esm', jsx: 'automatic', alias: { '@': path.resolve('src') }, define: { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://bank-test.invalid'), 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('fixture-only-key'), 'import.meta.env.DEV': 'false', 'process.env.NODE_ENV': '"production"' } });
  const styles = fs.readdirSync('dist/assets').filter(n => /^index-.*\.css$/.test(n));
  fs.writeFileSync('dist/bank-qa.html', `<html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(n => `<link rel="stylesheet" href="/assets/${n}">`).join('')}<link rel="stylesheet" href="/bank-qa.css"><div id="root"></div><script type="module" src="/bank-qa.js"></script></html>`);
  const browser = await chromium.launch({ headless: true, channel: process.env.BANK_BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; const requests = []; const writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  let fail = false;
  await page.route('https://bank-test.invalid/**', async route => {
    const req = route.request(), url = new URL(req.url()); requests.push(url);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) { writes.push({ path: url.pathname, data: req.postDataJSON() }); return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' }); }
    if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"fixture offline"}' });
    let rows = url.pathname.endsWith('savings_student_summary') || url.pathname.endsWith('waste_student_summary') ? people
      : url.pathname.endsWith('savings_transactions') ? savings : url.pathname.endsWith('waste_transactions') ? waste
        : url.pathname.endsWith('students') ? people.map(s => ({ id: s.student_id, name: s.full_name, class: s.class_name, photo_url: null, is_active: true }))
          : url.pathname.endsWith('waste_categories') ? [{ id: id(9000), name: 'ขวดพลาสติก', points_per_item: 2, color: 'emerald', is_active: true, order_position: 1 }, { id: id(9001), name: 'กระดาษ', points_per_item: 2, color: 'blue', is_active: true, order_position: 2 }]
            : url.pathname.endsWith('staff') ? [{ id: id(8000), name: 'ครูทดสอบ', photo_url: null, position: 'ครู', is_active: true }]
              : url.pathname.endsWith('school_settings') ? [] : [];
    for (const [key, value] of url.searchParams) if (value.startsWith('eq.')) rows = rows.filter(r => String(r[key]) === value.slice(3));
    const count = rows.length;
    rows = rows.slice(Number(url.searchParams.get('offset') || 0), Number(url.searchParams.get('offset') || 0) + Math.min(Number(url.searchParams.get('limit') || 1000), 500));
    const select = url.searchParams.get('select');
    if (select && !select.includes('*') && !select.includes('(')) rows = rows.map(r => Object.fromEntries(select.split(',').map(k => [k, r[k]])));
    const single = req.headers().accept?.includes('vnd.pgrst.object');
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${count}` }, body: req.method() === 'HEAD' ? '' : JSON.stringify(single ? rows[0] ?? null : rows) });
  });
  try {
    for (const kind of ['savings', 'waste']) {
      await page.goto(`${base}/bank-qa.html?kind=${kind}`);
      await page.getByRole('heading', { name: 'สรุปรายบุคคล', exact: true }).waitFor();
      assert.equal(await page.locator('.bank-table tbody tr').count(), 25);
      await page.getByRole('button', { name: 'ถัดไป', exact: true }).first().click();
      assert.equal(await page.locator('.bank-table tbody tr').count(), 6);
      await page.getByPlaceholder('ชื่อหรือรหัสนักเรียน').fill('0001');
      assert.equal(await page.locator('.bank-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'ดูรายละเอียด', exact: true }).first().click();
      await page.getByRole('dialog').getByRole('heading', { name: 'สรุปกิจกรรมรายบุคคล' }).waitFor();
      await page.getByRole('dialog').getByRole('heading', { name: 'นักเรียนทดสอบ 01', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.getByPlaceholder('ชื่อหรือรหัสนักเรียน').inputValue(), '0001');
      await page.getByRole('button', { name: 'ล้างตัวกรอง', exact: true }).click();
      await page.screenshot({ path: `.bank-${kind}-dashboard.png`, fullPage: true });
      for (const width of [768, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${kind} overflow at ${width}`);
      }
      await page.screenshot({ path: `.bank-${kind}-mobile.png`, fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log(`PASS ${kind}: pagination, search, detail, close preserves search, desktop/tablet/mobile, no overflow`);
    }
    requests.length = 0;
    await page.goto(`${base}/bank-qa.html?audience=public`);
    await page.getByRole('heading', { name: 'อันดับกิจกรรมในช่วงที่เลือก' }).waitFor();
    assert.ok(requests.filter(u => u.pathname.includes('savings')).every(u => !/amount|balance|student_code|notes/.test(u.searchParams.get('select') || '')));
    assert.equal(await page.getByRole('button', { name: 'ดูรายละเอียด', exact: true }).count(), 0);
    fail = true;
    await page.getByRole('button', { name: 'รีเฟรชข้อมูล' }).click();
    await page.getByRole('alert').waitFor();
    fail = false;
    await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
    await page.getByRole('heading', { name: 'อันดับกิจกรรมในช่วงที่เลือก' }).waitFor();
    console.log('PASS public: no private fields requested, no individual drill-down, error and retry');
    for (const kind of ['savings', 'waste']) {
      await page.goto(`${base}/bank-qa.html?kind=${kind}&surface=form`);
      await page.getByRole('heading', { name: 'สรุปรายบุคคล', exact: true }).waitFor();
      const buttons = page.getByRole('button', { name: kind === 'savings' ? 'บันทึกรายการ' : 'บันทึกรายการ', exact: true });
      await buttons.last().click();
      await page.getByText(kind === 'savings' ? 'บันทึกฝาก/ถอนเงิน' : 'บันทึกรายการรับขยะ', { exact: true }).waitFor();
      await page.screenshot({ path: `.bank-${kind}-form.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    assert.equal(writes.length, 0);
    console.log('PASS admin forms load, no JavaScript errors, no live writes');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
