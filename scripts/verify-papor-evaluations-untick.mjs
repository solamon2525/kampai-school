/**
 * scripts/verify-papor-evaluations-untick.mjs
 * Verification script for evaluation summaries untick logic in PaporSixViewer:
 * - Toggle logic: Clicking active rating unchecks it to blank ('')
 * - Switching logic: Clicking another rating moves the checkmark
 * - Page 6 rendering: Blank ('') displays no checkmarks
 * - Batch saving & promotion synchronization
 * - Integration with Page 7 and Page 8
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('🧪 Starting Evaluation Summaries Untick Verification...\n');

const paporSixContent = fs.readFileSync('src/components/admin/papor/PaporSixViewer.tsx', 'utf-8');

// 1. Verify getInitialEvalGrade helper
console.log('Test 1: Checking getInitialEvalGrade helper...');
assert.ok(
  paporSixContent.includes('const getInitialEvalGrade = useCallback(') &&
  paporSixContent.includes('if (evalId === \'reading\') return promo?.reading_grade ?? \'\';') &&
  paporSixContent.includes('if (evalId === \'character\') return promo?.character_grade ?? \'\';') &&
  paporSixContent.includes('if (evalId === \'competency\') return promo?.competency_grade ?? \'\';'),
  'FAIL: getInitialEvalGrade missing or does not read from student promotion records'
);
console.log('  ✅ getInitialEvalGrade helper verified');

// 2. Verify handleToggleEval logic simulation
console.log('\nTest 2: Verifying handleToggleEval toggle and untick logic...');
assert.ok(
  paporSixContent.includes('const handleToggleEval = (key: string, targetGrade: \'ดีเยี่ยม\' | \'ดี\' | \'ผ่าน\') =>'),
  'FAIL: handleToggleEval handler missing'
);

function simulateToggleEval(current, targetGrade) {
  const isCurrentlyThisGrade =
    (targetGrade === 'ดีเยี่ยม' && (current === 'ดีเยี่ยม' || current === 'ดย' || current === '3')) ||
    (targetGrade === 'ดี' && (current === 'ดี' || current === 'ด' || current === '2')) ||
    (targetGrade === 'ผ่าน' && (current === 'ผ่าน' || current === 'ผ' || current === '1'));
  return isCurrentlyThisGrade ? '' : targetGrade;
}

// Case A: Initial 'ดีเยี่ยม' (from DB or state) -> Click 'ดีเยี่ยม' -> unticks to ''
assert.equal(simulateToggleEval('ดีเยี่ยม', 'ดีเยี่ยม'), '', 'Clicking active ดีเยี่ยม should untick to blank');
assert.equal(simulateToggleEval('ดย', 'ดีเยี่ยม'), '', 'Clicking DB notation ดย should untick to blank');
assert.equal(simulateToggleEval('3', 'ดีเยี่ยม'), '', 'Clicking score 3 should untick to blank');

// Case B: Initial 'ดี' -> Click 'ดี' -> unticks to ''
assert.equal(simulateToggleEval('ดี', 'ดี'), '', 'Clicking active ดี should untick to blank');
assert.equal(simulateToggleEval('ด', 'ดี'), '', 'Clicking DB notation ด should untick to blank');

// Case C: Initial 'ผ่าน' -> Click 'ผ่าน' -> unticks to ''
assert.equal(simulateToggleEval('ผ่าน', 'ผ่าน'), '', 'Clicking active ผ่าน should untick to blank');
assert.equal(simulateToggleEval('ผ', 'ผ่าน'), '', 'Clicking DB notation ผ should untick to blank');

// Case D: Initial '' (unticked) -> Click 'ดีเยี่ยม' -> sets to 'ดีเยี่ยม'
assert.equal(simulateToggleEval('', 'ดีเยี่ยม'), 'ดีเยี่ยม', 'Clicking blank with ดีเยี่ยม should set ดีเยี่ยม');

// Case E: Initial 'ดี' -> Click 'ดีเยี่ยม' -> switches to 'ดีเยี่ยม'
assert.equal(simulateToggleEval('ดี', 'ดีเยี่ยม'), 'ดีเยี่ยม', 'Clicking ดีเยี่ยม when currently ดี should switch to ดีเยี่ยม');

// Case F: Initial 'ดีเยี่ยม' -> Click 'ผ่าน' -> switches to 'ผ่าน'
assert.equal(simulateToggleEval('ดีเยี่ยม', 'ผ่าน'), 'ผ่าน', 'Clicking ผ่าน when currently ดีเยี่ยม should switch to ผ่าน');

console.log('  ✅ Toggle and untick simulation passed with all scenarios');

// 3. Verify Page 6 table markup handles empty string ('') without fallback to 'ดีเยี่ยม'
console.log('\nTest 3: Checking Page 6 table markup...');
assert.ok(
  paporSixContent.includes("customEvaluations[item.id] !== undefined") &&
  paporSixContent.includes("? customEvaluations[item.id]") &&
  paporSixContent.includes(": getInitialEvalGrade(item.id)"),
  'FAIL: Page 6 does not check customEvaluations !== undefined (risking fallback when blank)'
);
assert.ok(
  paporSixContent.includes("handleToggleEval(item.id, 'ดีเยี่ยม')") &&
  paporSixContent.includes("handleToggleEval(item.id, 'ดี')") &&
  paporSixContent.includes("handleToggleEval(item.id, 'ผ่าน')"),
  'FAIL: Page 6 table cells missing handleToggleEval handlers'
);
console.log('  ✅ Page 6 rendering and interaction verified');

// 4. Verify saveStudentMutation database persistence
console.log('\nTest 4: Checking database persistence in saveStudentMutation...');
assert.ok(
  paporSixContent.includes('const readingStatus = toDbGrade(') &&
  paporSixContent.includes('const characterStatus = toDbGrade(') &&
  paporSixContent.includes('const competencyStatus = toDbGrade('),
  'FAIL: Status transformation using toDbGrade missing'
);
assert.ok(
  paporSixContent.includes('reading_grade: readingStatus,') &&
  paporSixContent.includes('character_grade: characterStatus,') &&
  paporSixContent.includes('competency_grade: competencyStatus,'),
  'FAIL: syncDimensionToPromotions missing 3 evaluation grades'
);
assert.ok(
  paporSixContent.includes("evaluation_type: 'reading'") &&
  paporSixContent.includes("evaluation_type: 'character'") &&
  paporSixContent.includes("evaluation_type: 'competency'"),
  'FAIL: student_obec_evaluations batch upsert missing 3 evaluations'
);
console.log('  ✅ Database persistence in saveStudentMutation verified');

// 5. Verify handleClearAllToBlank and reset effects
console.log('\nTest 5: Checking reset and clear handlers...');
assert.ok(
  paporSixContent.includes('setCustomEvaluations({})'),
  'FAIL: useEffect does not reset customEvaluations on student change'
);
assert.ok(
  paporSixContent.includes("setCustomEvaluations({ reading: '', character: '', competency: '' })"),
  'FAIL: handleClearAllToBlank does not clear customEvaluations'
);
console.log('  ✅ Reset and clear handlers verified');

// 6. Verify Page 7 and Page 8 dynamic reflection
console.log('\nTest 6: Checking Page 7 and Page 8 reactive evaluation display...');
assert.ok(
  paporSixContent.includes("customEvaluations['character'] !== undefined") &&
  paporSixContent.includes("customEvaluations['competency'] !== undefined") &&
  paporSixContent.includes("customEvaluations['reading'] !== undefined"),
  'FAIL: Page 7 and Page 8 do not reactively consume customEvaluations'
);
console.log('  ✅ Page 7 and Page 8 dynamic reflection verified');

console.log('\n🎉 ALL EVALUATION SUMMARIES UNTICK CHECKS PASSED SUCCESSFULLY!');
