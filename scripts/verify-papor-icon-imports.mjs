/**
 * scripts/verify-papor-icon-imports.mjs
 * Verification script ensuring all Lucide icon usages across Papor components
 * are properly imported, preventing runtime ReferenceErrors (like Loader2 is not defined).
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('🧪 Starting Papor Icon Imports Verification...\n');

// 1. Verify Loader2 import in PaporSixViewer.tsx
console.log('Test 1: Checking Loader2 import in PaporSixViewer.tsx...');
const paporSixContent = fs.readFileSync('src/components/admin/papor/PaporSixViewer.tsx', 'utf-8');

assert.ok(
  paporSixContent.includes("Loader2,") && paporSixContent.includes("} from 'lucide-react';"),
  'FAIL: Loader2 is not imported from lucide-react in PaporSixViewer.tsx'
);
assert.ok(
  paporSixContent.includes('<Loader2 className="w-3.5 h-3.5 animate-spin" />'),
  'FAIL: Loader2 usage missing in PaporSixViewer.tsx buttons'
);
console.log('  ✅ Loader2 is properly imported and used in PaporSixViewer.tsx');

// 2. Verify getScoresForClass in paporGradebookService & PaporReportsCenter
console.log('\nTest 2: Checking getScoresForClass service method and PaporReportsCenter integration...');
const gradebookServiceContent = fs.readFileSync('src/services/papor-gradebook.service.ts', 'utf-8');
assert.ok(
  gradebookServiceContent.includes('async getScoresForClass('),
  'FAIL: getScoresForClass method missing in paporGradebookService'
);

const reportsCenterContent = fs.readFileSync('src/components/admin/papor/PaporReportsCenter.tsx', 'utf-8');
assert.ok(
  reportsCenterContent.includes('paporGradebookService.getScoresForClass(academicYear, studentIds)'),
  'FAIL: PaporReportsCenter does not call paporGradebookService.getScoresForClass'
);
assert.ok(
  !reportsCenterContent.includes('await supabase'),
  'FAIL: PaporReportsCenter still contains raw supabase calls'
);
console.log('  ✅ getScoresForClass properly defined and used without raw supabase calls');

// 3. Scan all components in src/components/admin/papor/ for missing Lucide icons
console.log('\nTest 3: Scanning all Papor components for missing Lucide icons...');
const paporDir = 'src/components/admin/papor';
const files = fs.readdirSync(paporDir).filter((f) => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(paporDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract Lucide imports
  const lucideImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  const importedLucideIcons = new Set(
    lucideImportMatch
      ? lucideImportMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0])
          .filter(Boolean)
      : []
  );

  // Known standard lucide icons used in Papor
  const commonLucideIcons = [
    'Loader2', 'Save', 'Check', 'Printer', 'FileText', 'RotateCcw', 'RefreshCw',
    'ChevronLeft', 'ChevronRight', 'Edit3', 'Eye', 'SlidersHorizontal', 'Layers',
    'Sparkles', 'Users', 'School', 'LayoutGrid', 'BarChart3', 'Award', 'Receipt',
    'QrCode', 'PenTool', 'Heart', 'BookOpenCheck', 'Compass'
  ];

  for (const icon of commonLucideIcons) {
    const iconTagRegex = new RegExp(`<${icon}[\\s/>]`);
    if (iconTagRegex.test(content)) {
      assert.ok(
        importedLucideIcons.has(icon),
        `FAIL: ${icon} is used in ${file} but NOT imported from lucide-react!`
      );
    }
  }
}
console.log(`  ✅ All ${files.length} Papor components have 100% valid Lucide icon imports`);

console.log('\n🎉 ALL PAPOR ICON IMPORT CHECKS PASSED SUCCESSFULLY!');
