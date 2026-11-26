import assert from 'node:assert/strict';
import test from 'node:test';
import { auditHtmlFile, classifyArchetype } from './audit-platform-adoption.mjs';

test('classifyArchetype classifies vocab-concept for English sight words vocab media', () => {
  const html = `<!doctype html><html lang="th"><head><title>Sight Words Vocab</title></head><body><h1>English vocab & sight words</h1></body></html>`;
  assert.equal(
    classifyArchetype('public/games/english/sight-words-p4-media.html', html),
    'vocab-concept',
  );
});

test('classifyArchetype classifies visual-lab for Science water cycle diagram media', () => {
  const html = `<!doctype html><html lang="th"><head><title>วัฏจักรน้ำ</title></head><body><svg aria-label="water cycle diagram"></svg><p>diagram การระเหยและควบแน่น</p></body></html>`;
  assert.equal(
    classifyArchetype('public/games/science/water-cycle-media.html', html),
    'visual-lab',
  );
});

test('classifyArchetype classifies classify-sort for Career waste sort media', () => {
  const html = `<!doctype html><html lang="th"><head><title>แยกขยะ</title></head><body><p>กิจกรรมจำแนกประเภทขยะ sort into bins</p></body></html>`;
  assert.equal(
    classifyArchetype('public/games/career/waste-sort-media.html', html),
    'classify-sort',
  );
});

test('classifyArchetype classifies math-scaffold for Math division worksheet', () => {
  const html = `<!doctype html><html lang="th"><head><title>ใบงานการหารยาว</title></head><body><div class="step-row">หารทีละหลัก</div></body></html>`;
  assert.equal(
    classifyArchetype('public/games/math/division-worksheet.html', html),
    'math-scaffold',
  );
});

test('classifyArchetype classifies reading-story for Thai literature reading media', () => {
  const html = `<!doctype html><html lang="th"><head><title>วรรณคดี ป.4</title></head><body><article>อ่านเรื่องราววรรณคดีไทยและตอบคำถาม</article></body></html>`;
  assert.equal(
    classifyArchetype('public/games/thai/wannakhadi-p4-media.html', html),
    'reading-story',
  );
});

test('auditHtmlFile detects kind, subject, sharedRuntimes, and media gaps', () => {
  const nonCompliantMedia = `<!doctype html>
  <html lang="th">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>คำศัพท์</title></head>
  <body>
    <script src="/games/kampai-sdk.js?v=1.181.0"></script>
    <script src="/games/shared-classroom-tools.js"></script>
    <script>
      function finish() { KAMPAI.submitScore(100); }
    </script>
  </body>
  </html>`;

  const result = auditHtmlFile('public/games/english/sight-words-p4-media.html', nonCompliantMedia);
  assert.equal(result.kind, 'media');
  assert.equal(result.subject, 'english');
  assert.equal(result.archetype, 'vocab-concept');
  assert.deepEqual(result.sharedRuntimes, {
    hasKampaiSdk: true,
    hasMediaLabRuntime: false,
    hasWorksheetRuntime: false,
    hasWorksheetTopic: false,
    hasWorksheetModes: false,
    hasClassroomTools: true,
  });
  assert.ok(result.gaps.includes('missing-reduced-motion'));
  assert.ok(result.gaps.includes('missing-speak-api'));
  assert.ok(result.gaps.includes('media-has-submitScore'));
  assert.ok(result.gaps.includes('missing-getState'));
});

test('auditHtmlFile detects worksheet runtimes and missing-paired-media-meta', () => {
  const worksheetHtml = `<!doctype html>
  <html lang="th">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>ใบงานการหาร</title></head>
  <body>
    <script src="/games/worksheet-runtime.js?v=2.0.0"></script>
    <script src="/games/worksheet-topic.js?v=2.0.0"></script>
    <script src="/games/worksheet-modes.js?v=2.0.0"></script>
  </body>
  </html>`;

  const result = auditHtmlFile('public/games/math/division-worksheet.html', worksheetHtml);
  assert.equal(result.kind, 'worksheet');
  assert.equal(result.subject, 'math');
  assert.equal(result.archetype, 'math-scaffold');
  assert.deepEqual(result.sharedRuntimes, {
    hasKampaiSdk: false,
    hasMediaLabRuntime: false,
    hasWorksheetRuntime: true,
    hasWorksheetTopic: true,
    hasWorksheetModes: true,
    hasClassroomTools: false,
  });
  assert.ok(result.gaps.includes('missing-paired-media-meta'));
});

test('auditHtmlFile reports zero gaps for compliant media-lab-runtime file and paired worksheet', () => {
  const compliantMedia = `<!doctype html>
  <html lang="th">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Water Cycle</title></head>
  <body>
    <div id="media-root"></div>
    <script src="/games/kampai-sdk.js?v=1.181.0"></script>
    <script src="/games/media-lab-runtime.js"></script>
  </body>
  </html>`;

  const mediaRes = auditHtmlFile('public/games/science/water-cycle-media.html', compliantMedia);
  assert.equal(mediaRes.kind, 'media');
  assert.equal(mediaRes.sharedRuntimes.hasMediaLabRuntime, true);
  assert.equal(mediaRes.gaps.length, 0);

  const compliantWorksheet = `<!doctype html>
  <html lang="th">
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="worksheet-source-media" content="/games/math/long-division-thinking-media.html">
    <meta name="curriculum-indicators" content="ค 1.1 ป.4/9">
    <title>ใบงานการหาร</title>
  </head>
  <body>
    <script src="/games/worksheet-runtime.js?v=2.0.0"></script>
    <script src="/games/worksheet-modes.js?v=2.0.0"></script>
  </body>
  </html>`;

  const wsRes = auditHtmlFile('public/games/math/division-worksheet.html', compliantWorksheet);
  assert.equal(wsRes.kind, 'worksheet');
  assert.equal(wsRes.gaps.length, 0);
});

test('auditHtmlFile detects game kind and gaps', () => {
  const gameHtml = `<!doctype html>
  <html lang="th">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Math Blaster</title></head>
  <body><script src="/games/kampai-sdk.js"></script></body>
  </html>`;

  const res = auditHtmlFile('public/games/math/math-blaster.html', gameHtml);
  assert.equal(res.kind, 'game');
  assert.equal(res.subject, 'math');
  assert.ok(res.gaps.includes('missing-reduced-motion'));
  assert.ok(!res.gaps.includes('media-has-submitScore'));
});
