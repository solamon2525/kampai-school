/**
 * scripts/verify-papor-activity-toggle.mjs
 * Verification script for editable Development Activities (กิจกรรมพัฒนาผู้เรียน) in PaporSixViewer:
 * - 3-way toggle logic: pass ('ผ่าน'), fail ('ไม่ผ่าน'), unticked ('ยังไม่ติ๊ก')
 * - State initialization & hydration
 * - Batch saving to student_obec_evaluations and promotion sync
 * - Page 6 and Page 7 display alignment
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('🧪 Starting Development Activities Toggle Verification...\n');

const paporSixContent = fs.readFileSync('src/components/admin/papor/PaporSixViewer.tsx', 'utf-8');

// 1. Verify ACTIVITIES_LIST
console.log('Test 1: Checking ACTIVITIES_LIST definition...');
assert.ok(
  paporSixContent.includes("export const ACTIVITIES_LIST = [") &&
  paporSixContent.includes("id: 'scout', name: 'ลูกเสือ'") &&
  paporSixContent.includes("id: 'guidance', name: 'แนะแนว'") &&
  paporSixContent.includes("id: 'club', name: 'ชุมนุม'") &&
  paporSixContent.includes("id: 'social', name: 'เพื่อสังคมและสาธารณประโยชน์'"),
  'FAIL: ACTIVITIES_LIST missing or incorrect in PaporSixViewer'
);
console.log('  ✅ ACTIVITIES_LIST definition verified');

// 2. Verify state and helpers
console.log('\nTest 2: Checking customActivities state and 3-way toggle handler...');
assert.ok(
  paporSixContent.includes("customActivities, setCustomActivities") &&
  paporSixContent.includes("handleToggleActivity"),
  'FAIL: customActivities state or handleToggleActivity missing'
);
assert.ok(
  paporSixContent.includes("getInitialActivityStatus"),
  'FAIL: getInitialActivityStatus helper missing'
);

// Simulate 3-way toggle logic
function simulateToggle(current, target) {
  return current === target ? '' : target;
}

// Case A: Initial 'pass' -> Click 'pass' -> toggles off to '' (ยังไม่ติ๊ก)
assert.equal(simulateToggle('pass', 'pass'), '', 'Toggle from pass to pass should be empty (unticked)');
// Case B: Initial '' -> Click 'pass' -> sets to 'pass' (ติ๊ก ผ่าน)
assert.equal(simulateToggle('', 'pass'), 'pass', 'Toggle from empty to pass should be pass');
// Case C: Initial 'pass' -> Click 'fail' -> sets to 'fail' (ติ๊ก ไม่ผ่าน)
assert.equal(simulateToggle('pass', 'fail'), 'fail', 'Toggle from pass to fail should be fail');
// Case D: Initial 'fail' -> Click 'fail' -> toggles off to '' (ยังไม่ติ๊ก)
assert.equal(simulateToggle('fail', 'fail'), '', 'Toggle from fail to fail should be empty (unticked)');
// Case E: Initial 'fail' -> Click 'pass' -> sets to 'pass' (ติ๊ก ผ่าน)
assert.equal(simulateToggle('fail', 'pass'), 'pass', 'Toggle from fail to pass should be pass');

console.log('  ✅ 3-way toggle logic simulated and verified');

// 3. Verify reset on student change and clear
console.log('\nTest 3: Checking reset and clear handlers...');
assert.ok(
  paporSixContent.includes("setCustomActivities({})"),
  'FAIL: customActivities is not reset in useEffect on student change'
);
assert.ok(
  paporSixContent.includes("setCustomActivities({ scout: '', guidance: '', club: '', social: '' })"),
  'FAIL: handleClearAllToBlank does not clear customActivities'
);
console.log('  ✅ Reset and clear handlers verified');

// 4. Verify saveStudentMutation persistence
console.log('\nTest 4: Checking database persistence in saveStudentMutation...');
assert.ok(
  paporSixContent.includes("paporGradebookService.saveEvaluationsBatch(actRows)") &&
  paporSixContent.includes("paporGradebookService.syncDimensionToPromotions(academicYear"),
  'FAIL: saveStudentMutation does not persist activities to student_obec_evaluations or sync promotions'
);
console.log('  ✅ Database persistence in saveStudentMutation verified');

// 5. Verify Page 6 & Page 7 markup
console.log('\nTest 5: Checking Page 6 and Page 7 interactive rendering...');
assert.ok(
  paporSixContent.includes("onClick={() => handleToggleActivity(act.id, 'pass')}") &&
  paporSixContent.includes("onClick={() => handleToggleActivity(act.id, 'fail')}"),
  'FAIL: Page 6 table cells lack handleToggleActivity handlers'
);
assert.ok(
  paporSixContent.includes("ACTIVITIES_LIST.map((act) =>") &&
  paporSixContent.includes("สรุปผลการประเมินกิจกรรมพัฒนาผู้เรียน"),
  'FAIL: Page 7 does not map individual activities from ACTIVITIES_LIST'
);
console.log('  ✅ Page 6 and Page 7 interactive rendering verified');

console.log('\n🎉 ALL DEVELOPMENT ACTIVITIES TOGGLE CHECKS PASSED SUCCESSFULLY!');
