import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const failures = [];

function assert(condition, message) {
    if (!condition) failures.push(message);
}

function assertFile(relativePath) {
    assert(fs.existsSync(path.join(root, relativePath)), `missing file: ${relativePath}`);
}

const teacherHub = read('src/pages/EducationalHubTeacher.tsx');
const publicHub = read('src/pages/EducationalHub.tsx');
const card = read('src/components/educational-hub/EduHubItemCard.tsx');
const service = read('src/services/lesson-packs.service.ts');
const curriculumService = read('src/services/curriculum.service.ts');
const migration = read('supabase/migrations/501_unify_teaching_media_units.sql');

assert(!teacherHub.includes('LessonPacksSection'), 'teacher hub still renders the duplicate lesson-pack section');
assert(!publicHub.includes('LessonPacksSection'), 'public hub still renders the duplicate lesson-pack section');
assert(teacherHub.includes("deepLinkCat === 'lesson-packs' ? 'media'"), 'legacy lesson-packs deep link is not redirected');
assert(teacherHub.includes("filter((category) => category.category_key !== 'lesson-packs')"), 'lesson-packs remains visible in category navigation');

for (const label of ['เปิดสื่อ', 'เปิดใบงาน', 'เล่นเกม']) {
    assert(card.includes(label), `media card is missing action: ${label}`);
}
assert(card.includes('resourceItem.file_url || resourceItem.external_url'), 'unit resources do not support downloadable worksheet files');
assert(card.includes("navigate(`/play/${resourceItem.game_slug}`)"), 'tracked games do not open through the game route');
assert(service.includes('listTeachingUnitsForMediaIds'), 'teaching units are not resolved for media cards');
assert(service.includes('save_teaching_media_unit'), 'single-screen unit editor does not use the atomic save RPC');
assert(service.includes('p_worksheet_item_ids'), 'unit editor contract cannot preserve multiple worksheets');
assert(service.includes('p_game_item_ids'), 'unit editor contract cannot preserve multiple games');
assert(curriculumService.includes("mapping_role: index === 0 ? 'primary' : 'supporting'"), 'primary indicator role is not persisted');
assert(curriculumService.includes(".order('sort_order'"), 'indicator mappings are not restored in saved order');

for (const marker of [
    "legacy-fraction-pieces",
    "legacy-water-cycle",
    "legacy-digestive",
    "/games/math/math-word-problem-media.html",
    "educational_hub_usage_daily",
    "list_ehi_usage_60d",
    "save_teaching_media_unit",
    'CREATE POLICY educational_hub_usage_owner_read',
]) {
    assert(migration.includes(marker), `migration is missing: ${marker}`);
}
assert(migration.includes('NOT item.library_pinned'), 'pinned resources can incorrectly enter the low-usage review queue');
assert(migration.includes("MIN(usage.usage_date) <= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59"), 'review queue does not wait for a 60-day observation window');
assert(migration.includes('), 0) <= 2'), 'review queue threshold is not limited to two opens');
assert(migration.includes('INSERT INTO public.lesson_pack_items'), 'duplicate merge does not transfer lesson-pack references');
assert(migration.includes('INSERT INTO public.indicator_games'), 'duplicate merge does not transfer curriculum mappings');
assert(migration.includes('UPDATE public.game_sessions'), 'duplicate merge does not transfer usage sessions');
assert(migration.includes('DELETE FROM public.educational_hub_items'), 'duplicate rows are not removed after references transfer');
assert(migration.includes("category.category_key = 'worksheets'"), 'unit editor does not validate worksheet ownership and category');
assert(migration.includes("category.category_key = 'games'"), 'unit editor does not validate game ownership and category');
assert(migration.includes('WHERE owner_staff_id IS NOT NULL'), 'usage baseline does not protect legacy ownerless records');
assert(migration.includes("SELECT unit_id, resource_id, 'worksheet'"), 'unit save does not preserve multiple worksheet resources');
assert(migration.includes("SELECT unit_id, resource_id, 'game'"), 'unit save does not preserve multiple game resources');
assert(migration.includes('UPDATE public.educational_hub_items\n  SET title = trim(p_title)'), 'unit metadata is not reflected on the primary media card');

for (const target of [
    'public/games/math/fraction-pieces-media.html',
    'public/games/science/water-cycle-media.html',
    'public/games/science/digestive-worksheet.html',
    'public/games/math/math-word-problem-hub/index.html',
]) {
    assertFile(target);
}

if (failures.length > 0) {
    console.error(`Teaching media unification verification failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}

console.log('Teaching media unification verification passed (36 checks).');
