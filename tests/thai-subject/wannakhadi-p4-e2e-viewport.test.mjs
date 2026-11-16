import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('public/games/thai/wannakhadi-p4-media.html');
const systemOverviewPath = path.resolve('src/components/admin/system/SystemOverview.tsx');

test('Task 6: wannakhadi-p4-media has responsive layout rules and registered versionHistory', () => {
  assert.ok(fs.existsSync(htmlPath), 'wannakhadi-p4-media.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Viewport and responsive check
  assert.ok(html.includes('@media (max-width: 960px)'), 'Must include 960px breakpoint for tablets/compact view');
  assert.ok(html.includes('@media (max-width: 600px)'), 'Must include 600px breakpoint for mobile phones');
  assert.ok(html.includes('min-height: 44px') || html.includes('min-height:44px'), 'Buttons must follow 44px touch target rule');
  assert.ok(!html.includes('overflow-x: scroll'), 'Root layout must not create intentional horizontal overflow');

  // Documentation discipline check (DESIGN.md Rule 14.9)
  assert.ok(fs.existsSync(systemOverviewPath), 'SystemOverview.tsx must exist');
  const systemOverview = fs.readFileSync(systemOverviewPath, 'utf8');
  assert.ok(systemOverview.includes('วรรณคดีลำนำ ป.4') || systemOverview.includes('wannakhadi-p4'),
    'SystemOverview versionHistory must register Wannakhadi P4 media release');
});
