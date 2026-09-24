import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

console.log('--- Starting Dual-Viewport Browser E2E Conduct Test ---');

const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/src/index.css">
</head>
<body class="bg-background text-foreground">
  <div id="root"></div>
  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { ConductManagement } from '/src/components/admin/conduct/ConductManagement.tsx';

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } }
    });

    createRoot(document.getElementById('root')).render(
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(BrowserRouter, null,
          React.createElement('div', { className: 'p-4 max-w-7xl mx-auto' },
            React.createElement(Routes, null,
              React.createElement(Route, { path: '*', element: React.createElement(ConductManagement) })
            )
          )
        )
      )
    );
  </script>
</body>
</html>`;

const server = await createServer({
  optimizeDeps: {
    entries: ['src/components/admin/conduct/ConductManagement.tsx'],
    include: ['react', 'react-dom/client', 'react-router-dom', '@tanstack/react-query']
  },
  server: { host: '127.0.0.1', port: 4192, strictPort: true },
  plugins: [{
    name: 'conduct-e2e-test-page',
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/__test/')) {
          s.transformIndexHtml(req.url, html)
            .then(body => {
              res.setHeader('Content-Type', 'text/html');
              res.end(body);
            })
            .catch(next);
        } else {
          next();
        }
      });
    },
  }],
});

let browser;
try {
  await server.listen();
  browser = await chromium.launch();

  const mockStudents = [
    { id: 'stu-1', name: 'สมชาย รักดี', class: 'ป.1', photo_url: null, class_number: 1 },
    { id: 'stu-2', name: 'สมหญิง จริงใจ', class: 'ป.1', photo_url: null, class_number: 2 },
  ];

  const mockRecords = [
    {
      id: 'rec-1',
      student_id: 'stu-1',
      type: 'add',
      score: 5,
      category: 'manners',
      reason: 'ไหว้ทักทายคุณครูและผู้ใหญ่ด้วยความนอบน้อม 🙏',
      recorded_by: 'ครูใจดี',
      created_at: new Date().toISOString(),
      students: { name: 'สมชาย รักดี', class: 'ป.1', photo_url: null },
    },
    {
      id: 'rec-2',
      student_id: 'stu-2',
      type: 'deduct',
      score: 2,
      category: 'device',
      reason: 'ใช้โทรศัพท์ในเวลาเรียน 📱',
      recorded_by: 'ครูเข้มงวด',
      created_at: new Date().toISOString(),
      students: { name: 'สมหญิง จริงใจ', class: 'ป.1', photo_url: null },
    },
  ];

  for (const { width, height, name } of [
    { width: 360, height: 800, name: 'Mobile (360x800)' },
    { width: 1280, height: 720, name: 'Desktop (1280x720)' },
  ]) {
    console.log(`\nTesting ${name}...`);
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultTimeout(30000);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Intercept Supabase network requests with mock data
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1') {
        const path = url.pathname;
        if (path.includes('students')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStudents),
            headers: { 'access-control-allow-origin': '*' },
          });
        }
        if (path.includes('conduct_scores')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockRecords),
            headers: { 'access-control-allow-origin': '*' },
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
          headers: { 'access-control-allow-origin': '*' },
        });
      }
      return route.continue();
    });

    await page.goto('http://127.0.0.1:4192/__test/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('text=ระบบธนาคารความดี');
    console.log(`  ✓ Page header loaded`);

    // 1. Verify Quick Score Buttons in RecordTab
    for (const q of [1, 2, 5, 10]) {
      const qBtn = page.locator(`button:has-text("+${q}")`).first();
      await qBtn.click();
      const scoreInput = page.locator('input[type="number"]').first();
      const val = await scoreInput.inputValue();
      assert.equal(val, String(q), `Quick score button +${q} should set score input to ${q}`);
    }
    console.log(`  ✓ Quick score buttons [1, 2, 5, 10] working correctly in RecordTab`);

    // 2. Test Presets in RecordTab
    // Click 'มารยาทและการพูดจา 🙏'
    const mannersBadge = page.getByText('มารยาทและการพูดจา').first();
    await mannersBadge.click();

    // Click a preset reason
    const presetBtn = page.getByText('ไหว้ทักทายคุณครู').first();
    await presetBtn.waitFor({ state: 'visible' });
    await presetBtn.click();

    const textarea = page.locator('textarea').first();
    const reasonVal = await textarea.inputValue();
    assert.ok(reasonVal.includes('ไหว้ทักทายคุณครู'), 'Preset reason click should populate textarea');
    console.log(`  ✓ Preset reasons auto-populating reason textarea in RecordTab`);

    // 3. Switch to deduct mode
    const deductBtn = page.locator('button:has-text("หักคะแนน")').first();
    await deductBtn.click();

    // Verify negative quick score button text
    const neg10Btn = page.locator('button:has-text("-10")').first();
    await neg10Btn.click();
    const deductScoreVal = await page.locator('input[type="number"]').first().inputValue();
    assert.equal(deductScoreVal, '10', 'Deduct quick score button -10 should set score to 10');
    console.log(`  ✓ Deduct mode quick score buttons working correctly`);

    // 4. Test BulkRecordTab (หลายคน)
    const bulkTabTrigger = page.locator('button[role="tab"]:has-text("หลายคน")');
    await bulkTabTrigger.click();
    await page.waitForSelector('text=ชั้น/ห้อง');

    // Quick scores in BulkRecordTab
    const bulkQ5 = page.locator('button:has-text("+5")').first();
    await bulkQ5.click();
    console.log(`  ✓ BulkRecordTab loaded and quick score buttons clickable`);

    // 5. Test HistoryTab (ประวัติ)
    const historyTabTrigger = page.locator('button[role="tab"]:has-text("ประวัติ")');
    await historyTabTrigger.click();
    await page.waitForSelector('text=ประวัติการบันทึก');
    // Verify badge rendered for mock record
    await page.waitForSelector('text=มารยาทและการพูดจา');
    console.log(`  ✓ HistoryTab loaded and category badge rendered with correct label`);

    assert.equal(consoleErrors.length, 0, `Zero console errors expected, got: ${JSON.stringify(consoleErrors)}`);
    console.log(`  ✓ Zero browser console errors in ${name}`);
    await page.close();
  }

  console.log('\nALL BROWSER E2E TESTS PASSED ACROSS BOTH VIEWPORTS!');
} finally {
  if (browser) await browser.close();
  await server.close();
}
