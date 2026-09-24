/**
 * test-conduct-sound-feedback.mjs
 * Verification script for Conduct Management Instant Sound & Speech Summary
 */

import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

console.log('--- Starting Conduct Sound & Speech Verification ---');

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
    import { formatConductRecordSpeech, formatConductBulkSpeech } from '/src/lib/conductSound.ts';
    import { getFirstName } from '/src/lib/thaiSpeech.ts';

    window.__formatConductRecordSpeech = formatConductRecordSpeech;
    window.__formatConductBulkSpeech = formatConductBulkSpeech;
    window.__getFirstName = getFirstName;

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
  server: { host: '127.0.0.1', port: 4193, strictPort: true },
  plugins: [{
    name: 'conduct-sound-test-page',
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(30000);

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Install test spies on Web Audio API and SpeechSynthesis
  await page.addInitScript(() => {
    window.__conductSpy = {
      oscillatorsCreated: [],
      speechesSpoken: [],
      speechCancels: 0,
    };

    // Spy on Web Speech API
    if (window.speechSynthesis) {
      const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (utterance) {
        window.__conductSpy.speechesSpoken.push({
          text: utterance.text,
          lang: utterance.lang,
          time: performance.now(),
        });
        setTimeout(() => {
          if (typeof utterance.onend === 'function') utterance.onend(new Event('end'));
        }, 50);
      };

      const origCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);
      window.speechSynthesis.cancel = function () {
        window.__conductSpy.speechCancels += 1;
        return origCancel.apply(this, arguments);
      };
    }

    // Spy on Web Audio API createOscillator
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      const origCreateOsc = AudioCtxClass.prototype.createOscillator;
      AudioCtxClass.prototype.createOscillator = function () {
        const osc = origCreateOsc.apply(this, arguments);
        const origSetValueAtTime = osc.frequency.setValueAtTime;
        osc.frequency.setValueAtTime = function (freq, time) {
          window.__conductSpy.oscillatorsCreated.push({ freq, time, type: osc.type });
          return origSetValueAtTime.apply(this, arguments);
        };
        return osc;
      };
    }
  });

  const mockStudents = [
    { id: 'stu-1', name: 'สมชาย รักดี', class: 'ป.1', photo_url: null, class_number: 1 },
    { id: 'stu-2', name: 'สมหญิง จริงใจ', class: 'ป.1', photo_url: null, class_number: 2 },
  ];

  const mockRecords = [
    {
      id: 'rec-1',
      student_id: 'stu-1',
      type: 'add',
      score: 10,
      category: 'manners',
      reason: 'ไหว้ทักทายคุณครู',
      recorded_by: 'ครูใจดี',
      academic_year: '2569',
      created_at: new Date().toISOString(),
      students: { name: 'สมชาย รักดี', class: 'ป.1', photo_url: null },
    },
  ];

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
        if (route.request().method() === 'POST') {
          // Delay response to simulate network latency and verify optimistic response
          await new Promise(r => setTimeout(r, 400));
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'rec-new' }),
            headers: { 'access-control-allow-origin': '*' },
          });
        }
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

  await page.goto('http://127.0.0.1:4193/__test/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('text=ระบบธนาคารความดี');

  // 1. Unit Tests for Speech Formatters
  console.log('1. Testing Speech Formatters and Thai Name Resolution...');
  const unitResults = await page.evaluate(() => {
    return {
      addRecord: window.__formatConductRecordSpeech('add', 'สมชาย รักดี', 5, 15),
      deductRecord: window.__formatConductRecordSpeech('deduct', 'สมหญิง จริงใจ', 2, 8),
      addBulk: window.__formatConductBulkSpeech('add', 5, 2),
      deductBulk: window.__formatConductBulkSpeech('deduct', 3, 1),
      fnBoyAttached: window.__getFirstName('ด.ช.พชรพร จรุงพันธ์'),
      fnBoySpaced: window.__getFirstName('ด.ช. สมชาย รักดี'),
      fnBoyFull: window.__getFirstName('เด็กชายสมชาย รักดี'),
      fnGirlAttached: window.__getFirstName('ด.ญ.สมหญิง จริงใจ'),
      fnGirlFull: window.__getFirstName('เด็กหญิง สมหญิง จริงใจ'),
      fnMiss: window.__getFirstName('นางสาว ปวีณา เปจะโป๊ะ'),
      fnMr: window.__getFirstName('นาย ธวัชชัย นิโม'),
      fnMrs: window.__getFirstName('นาง สมปอง ดียิ่ง'),
      fnMissShort: window.__getFirstName('น.ส.มาลี บุญส่ง'),
      formattedWithPrefix: window.__formatConductRecordSpeech('add', 'ด.ช.พชรพร จรุงพันธ์', 10, 50),
      safeUndefinedRecord: window.__formatConductRecordSpeech('deduct', 'สมชาย รักดี', undefined, undefined),
      safeUndefinedBulk: window.__formatConductBulkSpeech('add', undefined, undefined),
      safeNegativeAccumulated: window.__formatConductRecordSpeech('deduct', 'สมชาย', 2, -10),
    };
  });

  assert.equal(
    unitResults.addRecord,
    'เพิ่มคะแนนความดีสำเร็จ ชื่อ สมชาย เพิ่ม ห้า คะแนน คะแนนคงเหลือ สิบห้า คะแนน',
    'formatConductRecordSpeech add should match exact Thai phrasing'
  );
  assert.equal(
    unitResults.deductRecord,
    'หักคะแนนความดีสำเร็จ ชื่อ สมหญิง หัก สอง คะแนน คะแนนคงเหลือ แปด คะแนน',
    'formatConductRecordSpeech deduct should match exact Thai phrasing'
  );
  assert.equal(
    unitResults.addBulk,
    'บันทึกคะแนนความดีสำเร็จ ห้า คน บวกคนละ สอง คะแนน',
    'formatConductBulkSpeech add should match exact Thai phrasing'
  );
  assert.equal(
    unitResults.deductBulk,
    'บันทึกคะแนนความดีสำเร็จ สาม คน หักคนละ หนึ่ง คะแนน',
    'formatConductBulkSpeech deduct should match exact Thai phrasing'
  );

  // Assert Thai prefix stripping
  assert.equal(unitResults.fnBoyAttached, 'พชรพร', 'Should strip attached ด.ช.');
  assert.equal(unitResults.fnBoySpaced, 'สมชาย', 'Should strip spaced ด.ช.');
  assert.equal(unitResults.fnBoyFull, 'สมชาย', 'Should strip เด็กชาย');
  assert.equal(unitResults.fnGirlAttached, 'สมหญิง', 'Should strip attached ด.ญ.');
  assert.equal(unitResults.fnGirlFull, 'สมหญิง', 'Should strip เด็กหญิง');
  assert.equal(unitResults.fnMiss, 'ปวีณา', 'Should strip นางสาว');
  assert.equal(unitResults.fnMissShort, 'มาลี', 'Should strip น.ส.');
  assert.equal(unitResults.fnMrs, 'สมปอง', 'Should strip นาง');
  assert.equal(unitResults.fnMr, 'ธวัชชัย', 'Should strip นาย');
  assert.equal(
    unitResults.formattedWithPrefix,
    'เพิ่มคะแนนความดีสำเร็จ ชื่อ พชรพร เพิ่ม สิบ คะแนน คะแนนคงเหลือ ห้าสิบ คะแนน',
    'Speech summary must address student by real first name without honorific prefix'
  );

  // Assert NaN/undefined resilience
  assert.ok(!unitResults.safeUndefinedRecord.includes('NaN'), 'Speech summary must never contain NaN');
  assert.ok(!unitResults.safeUndefinedBulk.includes('NaN'), 'Bulk speech summary must never contain NaN');
  assert.equal(
    unitResults.safeUndefinedRecord,
    'หักคะแนนความดีสำเร็จ ชื่อ สมชาย หัก หนึ่ง คะแนน คะแนนคงเหลือ ศูนย์ คะแนน',
    'Undefined record points must safely default without NaN'
  );
  assert.equal(
    unitResults.safeUndefinedBulk,
    'บันทึกคะแนนความดีสำเร็จ หนึ่ง คน บวกคนละ หนึ่ง คะแนน',
    'Undefined bulk points must safely default without NaN'
  );
  assert.equal(
    unitResults.safeNegativeAccumulated,
    'หักคะแนนความดีสำเร็จ ชื่อ สมชาย หัก สอง คะแนน คะแนนคงเหลือ ศูนย์ คะแนน',
    'Negative accumulated points must clamp to 0 (ศูนย์)'
  );
  console.log('  ✓ All speech formatting rules, Thai honorific prefix stripping, and NaN resilience match requirements R2 perfectly');

  // 2. Test RecordTab Sound & Speech
  console.log('\n2. Testing RecordTab Sound & Speech...');
  // Select class "ป.1"
  await page.locator('button:has-text("เลือกชั้น")').first().click();
  await page.locator('div[role="option"]:has-text("ป.1")').click();

  // Wait for student options
  await page.waitForSelector('button:has-text("เลือกนักเรียน")');
  await page.locator('button:has-text("เลือกนักเรียน")').click();
  await page.locator('div[role="option"]:has-text("สมชาย รักดี")').click();

  // Select Quick Score +5
  await page.locator('button:has-text("+5")').first().click();

  // Select category and preset reason
  await page.getByText('มารยาทและการพูดจา').first().click();
  await page.getByText('ไหว้ทักทายคุณครู').first().click();

  // Clear spy before click
  await page.evaluate(() => {
    window.__conductSpy.oscillatorsCreated = [];
    window.__conductSpy.speechesSpoken = [];
  });

  // Click Save button
  const saveBtn = page.locator('button:has-text("บวก 5 คะแนน")').first();
  await saveBtn.click();

  // Immediately check that chime (Web Audio) and speech were fired WITHOUT waiting for network
  const spyResult = await page.evaluate(() => window.__conductSpy);
  assert.ok(spyResult.oscillatorsCreated.length >= 2, 'playConductChime must create oscillators immediately upon save click');
  assert.equal(spyResult.speechesSpoken.length, 1, 'speakThai must fire immediately upon save click');
  assert.ok(
    spyResult.speechesSpoken[0].text.includes('เพิ่มคะแนนความดีสำเร็จ'),
    'Speech must start with เพิ่มคะแนนความดีสำเร็จ'
  );
  assert.ok(
    spyResult.speechesSpoken[0].text.includes('ชื่อ สมชาย'),
    'Speech must include student name'
  );
  console.log('  ✓ RecordTab: Zero-latency Web Audio chime and optimistic Thai speech verified on click');

  // Check PointsConfirmationDialog is visible immediately
  await page.waitForSelector('text=เพิ่มคะแนนความดีสำเร็จ', { state: 'visible' });
  console.log('  ✓ RecordTab: PointsConfirmationDialog displayed immediately');

  // Dismiss modal
  const dismissBtn = page.locator('button:has-text("ปิดหน้าต่าง")');
  await dismissBtn.click();

  // Verify speech cancel was called
  const stopSpy = await page.evaluate(() => window.__conductSpy.speechCancels);
  assert.ok(stopSpy >= 1, 'stopThaiSpeech must be called on modal dismiss');
  console.log('  ✓ Modal dismissal cancels active speech immediately');

  // 2.1 Test RecordTab Deduct Mode Sound & Speech
  console.log('\n2.1 Testing RecordTab Deduct Mode Sound & Speech...');
  await page.locator('button:has-text("หักคะแนน")').first().click();
  await page.getByText('วินัย/ตรงต่อเวลา').first().click();
  await page.getByText('มาสาย').first().click();

  await page.evaluate(() => {
    window.__conductSpy.oscillatorsCreated = [];
    window.__conductSpy.speechesSpoken = [];
    window.__conductSpy.speechCancels = 0;
  });

  const deductSaveBtn = page.locator('button:has-text("หัก 1 คะแนน")').first();
  await deductSaveBtn.click();

  const deductSpyResult = await page.evaluate(() => window.__conductSpy);
  assert.ok(deductSpyResult.oscillatorsCreated.length >= 2, 'Deduct chime must fire immediately');
  assert.ok(
    deductSpyResult.oscillatorsCreated.some(o => o.type === 'sine'),
    'Deduct chime must use gentle sine wave'
  );
  assert.equal(deductSpyResult.speechesSpoken.length, 1, 'Deduct speech must fire immediately');
  assert.ok(
    deductSpyResult.speechesSpoken[0].text.includes('หักคะแนนความดีสำเร็จ'),
    'Speech must start with หักคะแนนความดีสำเร็จ'
  );

  await page.waitForSelector('text=หักคะแนนความดีสำเร็จ', { state: 'visible' });
  const deductCard = page.locator('.text-destructive');
  assert.ok(await deductCard.count() >= 1, 'Deduction points card must have text-destructive styling');
  console.log('  ✓ RecordTab Deduct Mode: Gentle sine chime, Thai deduct speech, and destructive styling verified');

  await page.locator('button:has-text("ปิดหน้าต่าง")').click();

  // 3. Test BulkRecordTab Sound & Speech
  console.log('\n3. Testing BulkRecordTab Sound & Speech...');
  const bulkTab = page.locator('button[role="tab"]:has-text("หลายคน")');
  await bulkTab.click();
  await page.waitForSelector('text=ชั้น/ห้อง');

  // Select class in BulkRecordTab
  const bulkPanel = page.locator('[role="tabpanel"][data-state="active"]');
  await bulkPanel.locator('button:has-text("เลือกชั้น")').click();
  await page.locator('div[role="option"]:has-text("ป.1")').click();
  await page.waitForSelector('text=เลือกทั้งห้อง');
  await page.waitForSelector('text=สมชาย รักดี');

  // Select both students
  await page.locator('text=เลือกทั้งห้อง').click();

  // Select quick score +2
  await page.locator('button:has-text("+2")').first().click();

  // Select category and preset reason
  await page.getByText('มารยาทและการพูดจา').first().click();
  await page.getByText('ไหว้ทักทายคุณครู').first().click();

  // Reset spy
  await page.evaluate(() => {
    window.__conductSpy.oscillatorsCreated = [];
    window.__conductSpy.speechesSpoken = [];
  });

  // Click Bulk Save button
  const bulkSaveBtn = page.locator('button:has-text("บวก 2 คะแนน · 2 คน")').first();
  await bulkSaveBtn.click();

  const bulkSpyResult = await page.evaluate(() => window.__conductSpy);
  assert.ok(bulkSpyResult.oscillatorsCreated.length >= 2, 'Bulk save must fire chime immediately');
  assert.equal(bulkSpyResult.speechesSpoken.length, 1, 'Bulk save must fire Thai speech immediately');
  assert.equal(
    bulkSpyResult.speechesSpoken[0].text,
    'บันทึกคะแนนความดีสำเร็จ สอง คน บวกคนละ สอง คะแนน',
    'Bulk speech text must match exact phrasing'
  );
  console.log('  ✓ BulkRecordTab: Instant chime and Thai speech summary verified on save');

  // 4. Test Tab Switch stops audio
  await page.evaluate(() => {
    window.__conductSpy.speechCancels = 0;
  });
  const recordTab = page.locator('button[role="tab"]:has-text("ทีละคน")');
  await recordTab.click();

  const tabSwitchCancels = await page.evaluate(() => window.__conductSpy.speechCancels);
  assert.ok(tabSwitchCancels >= 1, 'Switching tabs must cancel Thai speech');
  console.log('  ✓ Tab switching stops active audio and speech immediately');

  assert.equal(consoleErrors.length, 0, `Zero console errors expected, got: ${JSON.stringify(consoleErrors)}`);
  console.log('  ✓ Zero browser console errors during sound & speech execution');

  await page.close();
  console.log('\nALL CONDUCT SOUND & SPEECH VERIFICATION CHECKS PASSED SUCCESSFULLY!');
} finally {
  if (browser) await browser.close();
  await server.close();
}
