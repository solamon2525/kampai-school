/**
 * scripts/verify-papor-page8-handwriting-lines.mjs
 * Verification script for Teacher Comments 7-Row Handwriting Lines in PaporSixViewer (Page 8)
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('🧪 Starting Teacher Comments Handwriting Lines Verification...\n');

const paporSixContent = fs.readFileSync('src/components/admin/papor/PaporSixViewer.tsx', 'utf-8');

// 1. Locate renderTeacherCommentsPage
const startIdx = paporSixContent.indexOf('function renderTeacherCommentsPage()');
const endIdx = paporSixContent.indexOf('function renderParentCommentsPage()');
assert.ok(startIdx !== -1 && endIdx !== -1, 'FAIL: renderTeacherCommentsPage function not found');
const page8Content = paporSixContent.substring(startIdx, endIdx);

// 2. Verify 7-row handwriting lines for Term 1 and Term 2
console.log('Test 1: Checking handwriting lines definition in Term 1 and Term 2...');
assert.ok(
  page8Content.includes('[1, 2, 3, 4, 5, 6, 7].map((lineNum) =>'),
  'FAIL: 7 handwriting lines loop missing'
);
const occurrences = (page8Content.match(/\[1, 2, 3, 4, 5, 6, 7\]\.map/g) || []).length;
assert.equal(occurrences, 2, 'FAIL: 7-row loop must be present in both Term 1 and Term 2 boxes');
console.log('  ✅ 7 handwriting lines present in both Term 1 and Term 2');

// 3. Verify CSS classes for handwriting rows
console.log('\nTest 2: Checking CSS classes for handwriting rows...');
assert.ok(
  page8Content.includes('border-b border-dotted border-black/70 h-7 w-full flex items-end'),
  'FAIL: Handwriting line styling classes missing or incorrect'
);
console.log('  ✅ CSS classes (border-dotted, h-7, full width) verified');

// 4. Verify conditional rendering (text vs empty handwriting lines)
console.log('\nTest 3: Checking conditional rendering logic...');
assert.ok(
  page8Content.includes('customTeacherComments.term1 ? (') &&
  page8Content.includes('customTeacherComments.term2 ? ('),
  'FAIL: Conditional rendering checking customTeacherComments.term1/term2 missing'
);
assert.ok(
  page8Content.includes('text-sm leading-relaxed italic text-neutral-800 flex-1 whitespace-pre-wrap'),
  'FAIL: Typed text display format missing'
);
console.log('  ✅ Conditional rendering (text when filled, 7 lines when empty) verified');

// 5. Verify textarea placeholders
console.log('\nTest 4: Checking updated textarea placeholders...');
assert.ok(
  page8Content.includes('placeholder="พิมพ์ความคิดเห็นของครูประจำชั้น... (หากเว้นว่าง ระบบจะแสดงเส้นบรรทัด ๗ แถวสำหรับเขียนด้วยลายมือ)"'),
  'FAIL: Textarea placeholder does not guide user about automatic handwriting lines'
);
console.log('  ✅ Helpful textarea placeholder verified');

console.log('\n🎉 ALL TEACHER COMMENTS HANDWRITING LINES CHECKS PASSED SUCCESSFULLY!');
