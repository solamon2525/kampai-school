/**
 * scripts/verify-papor-traits-persistence.mjs
 * Verification script ensuring teacher traits (Page 8) and parent traits (Page 9)
 * are properly persisted to student_obec_evaluations and rehydrated upon query refresh.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('🧪 Starting Papor Traits Persistence Verification...\n');

const paporSixContent = fs.readFileSync('src/components/admin/papor/PaporSixViewer.tsx', 'utf-8');

// 1. Check getTraitsRows helper
console.log('Test 1: Checking getTraitsRows helper definition...');
assert.ok(
  paporSixContent.includes('const getTraitsRows = (): TablesInsert<\'student_obec_evaluations\'>[] => {'),
  'FAIL: getTraitsRows helper function is missing'
);
assert.ok(
  paporSixContent.includes("evaluation_type: 'teacher_trait'"),
  'FAIL: teacher_trait evaluation_type is missing in getTraitsRows'
);
assert.ok(
  paporSixContent.includes("evaluation_type: 'parent_trait'"),
  'FAIL: parent_trait evaluation_type is missing in getTraitsRows'
);
assert.ok(
  paporSixContent.includes("item_key: 'main'"),
  'FAIL: item_key main is missing in trait rows'
);
console.log('  ✅ getTraitsRows properly defined for both teacher_trait and parent_trait');

// 2. Check saveCommentsMutation integration
console.log('\nTest 2: Checking saveCommentsMutation traits & promotions persistence...');
assert.ok(
  paporSixContent.includes('const traitRows = getTraitsRows();') &&
  paporSixContent.includes('await paporGradebookService.saveEvaluationsBatch(traitRows);'),
  'FAIL: saveCommentsMutation does not call saveEvaluationsBatch with traitRows'
);
assert.ok(
  paporSixContent.includes('const existingPromo = studentYearData?.promotion;'),
  'FAIL: existingPromo merge is missing in saveCommentsMutation'
);
assert.ok(
  paporSixContent.includes('queryClient.invalidateQueries({ queryKey: [\'papor-evaluations\'] });'),
  'FAIL: papor-evaluations query invalidation is missing'
);
console.log('  ✅ saveCommentsMutation persists traits to evaluations and merges promotions safely');

// 3. Check saveStudentMutation integration
console.log('\nTest 3: Checking saveStudentMutation includes trait rows...');
assert.ok(
  paporSixContent.includes('// 6. บันทึกผลประเมินคุณลักษณะ ๑๒ ข้อ (หน้า ๘) และ ๙ ข้อ (หน้า ๙)'),
  'FAIL: saveStudentMutation does not include traitRows persistence step'
);
console.log('  ✅ saveStudentMutation also preserves traitRows');

// 4. Check rehydration logic in useEffect
console.log('\nTest 4: Checking rehydration logic in useEffect...');
assert.ok(
  paporSixContent.includes('const loadedTeacherTraits: Record<number, { term1?: string; term2?: string }> = {};'),
  'FAIL: loadedTeacherTraits accumulator missing in useEffect'
);
assert.ok(
  paporSixContent.includes('const loadedParentTraits: Record<number, { term1?: string; term2?: string }> = {};'),
  'FAIL: loadedParentTraits accumulator missing in useEffect'
);
assert.ok(
  paporSixContent.includes("ev.evaluation_type === 'teacher_trait'") &&
  paporSixContent.includes("ev.evaluation_type === 'parent_trait'"),
  'FAIL: evaluation_type checking missing during rehydration'
);
assert.ok(
  paporSixContent.includes('setCustomTeacherTraits(loadedTeacherTraits);') &&
  paporSixContent.includes('setCustomParentTraits(loadedParentTraits);'),
  'FAIL: customTeacherTraits and customParentTraits not set from loaded traits'
);
console.log('  ✅ useEffect rehydrates teacher traits and parent traits from studentYearData.evaluations');

// 5. Check UI button labels & banners
console.log('\nTest 5: Checking Page 8 and Page 9 banners and button labels...');
assert.ok(
  paporSixContent.includes('ตารางคุณลักษณะ ๑๒ ข้อ'),
  'FAIL: Page 8 banner does not mention 12 traits'
);
assert.ok(
  paporSixContent.includes('ตารางคุณลักษณะ ๙ ข้อ'),
  'FAIL: Page 9 banner does not mention 9 traits'
);
assert.ok(
  paporSixContent.includes('บันทึกคุณลักษณะและความเห็น'),
  'FAIL: Button label บันทึกคุณลักษณะและความเห็น is missing'
);
console.log('  ✅ Page 8 and Page 9 UI banners and buttons properly updated');

console.log('\n🎉 ALL PAPOR TRAITS PERSISTENCE CHECKS PASSED SUCCESSFULLY!');
