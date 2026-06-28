-- 266_character_animation_docs.sql
-- game_docs: animation config + KAMPAI.pickCharacterFrame

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id,
       'HTML5 Canvas Platformer — สระไทย ป.1-6 · sprite + animation config จากคลัง',
       ARRAY[
         'กระต่าย sprite sheet 128×128 · KAMPAI.pickCharacterFrame (idle/walk/run/jump)',
         'คลังตัวละคร admin: preset platformer-12 · preview animation · auto-detect ขนาดเฟรม',
         'KampaiVersus · co-op sheet P2 · fallback bundled git'
       ],
       'v1.2.0',
       'thai-sara-run — animation_config (migration 265/266)'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
