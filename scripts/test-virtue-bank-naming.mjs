import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = [
  'src/pages/StudentHeroPublic.tsx',
  'src/pages/HallOfFame.tsx',
  'src/components/home/HomeMainContent.tsx',
  'src/components/admin/conduct/ConductManagement.tsx',
  'src/components/admin/conduct/KampaiHeroDashboard.tsx',
  'src/components/admin/shared/AdminLayout.tsx',
  'src/components/admin/student-docs/Student360Detail.tsx',
  'src/lib/quickMenuCatalog.ts',
  'src/lib/commands/registry.ts',
  'src/components/admin/system/featureCatalog.ts',
  'src/components/admin/system/SystemOverview.tsx',
];

const contents = await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')]));

for (const [file, content] of contents) {
  assert.equal(content.includes('Kampai Hero'), false, `${file} still exposes Kampai Hero`);
  assert.equal(content.includes('Hero XP'), false, `${file} still exposes Hero XP`);
}

const app = await readFile('src/App.tsx', 'utf8');
assert.match(app, /path="\/virtue-bank"/);
assert.match(app, /path="\/virtue-bank\/:studentId"/);
assert.match(app, /path="\/hero"/);
assert.match(app, /path="\/hero\/:studentId"/);
assert.match(app, /Navigate/);

const publicPage = await readFile('src/pages/StudentHeroPublic.tsx', 'utf8');
assert.equal(publicPage.includes('`/virtue-bank/${'), true, 'public links should use virtue-bank');
assert.equal(publicPage.includes('window.location.origin}/virtue-bank/'), true, 'QR links should use virtue-bank');

console.log(`virtue-bank naming checks passed for ${files.length} UI files`);
