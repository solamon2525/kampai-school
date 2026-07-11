-- 393_seed_archery_verb_game.sql
-- เกม AR ยิงธนูสู้คำกริยา (archery-verb)
-- ใช้ KampaiHands · 15 รอบ · มือซ้ายถือคันธนู · มือขวาดึงสายปล่อย

-- ── INSERT educational_hub_items ──
INSERT INTO educational_hub_items (
    title, description, type, subject, grade_level,
    game_slug, tracked_game, external_url, thumbnail_url,
    is_published, created_by
)
SELECT
    'AR ยิงธนูสู้คำกริยา',
    'เกมยิงธนู AR ใช้กล้อง+มือจริง ดึงสายธนูยิงไปที่คำกริยาภาษาไทย 15 ข้อ ยิงถูกได้คะแนน ยิงผิดหรือคำกริยาตกพื้นเสียคะแนน',
    'game',
    'thai',
    'p4',
    'archery-verb',
    true,
    '/games/thai/archery-verb/index.html',
    '/games/thai/archery-verb/cover.png',
    true,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM educational_hub_items WHERE game_slug = 'archery-verb'
);

-- ── UPDATE ถ้ามีอยู่แล้ว ──
UPDATE educational_hub_items SET
    title = 'AR ยิงธนูสู้คำกริยา',
    description = 'เกมยิงธนู AR ใช้กล้อง+มือจริง ดึงสายธนูยิงไปที่คำกริยาภาษาไทย 15 ข้อ ยิงถูกได้คะแนน ยิงผิดหรือคำกริยาตกพื้นเสียคะแนน',
    tracked_game = true,
    external_url = '/games/thai/archery-verb/index.html',
    thumbnail_url = '/games/thai/archery-verb/cover.png'
WHERE game_slug = 'archery-verb';

-- ── INSERT/UPDATE game_docs ──
INSERT INTO game_docs (item_id, game_format, features, build_version, notes)
SELECT
    ehi.id,
    'AR Finger Tracking (KampaiHands) — Canvas 2D bow-draw mechanic',
    'มือซ้ายถือคันธนู · มือขวาดึงสาย+ปล่อย · 15 รอบ (1 กริยา + 2 คำนามหลอก) · ลูกธนูพุ่ง+แรงโน้มถ่วง · power gauge · tap fallback · versus online · leaderboard',
    '1.0.0',
    'ดัดแปลงจากเกม education-code-dev AR_Archery_Game_Battling_Verbs · ใช้ Canvas 2D แทน THREE.js · คำกริยา/คำนามภาษาไทยระดับประถม'
FROM educational_hub_items ehi
WHERE ehi.game_slug = 'archery-verb'
ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    build_version = EXCLUDED.build_version,
    notes = EXCLUDED.notes,
    updated_at = now();
