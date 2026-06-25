-- ============================================================================
-- Migration 243: Update Converted Game Cover Thumbnails (.svg to .png)
-- ============================================================================
-- Updates all game covers that were converted from SVG to chibi-style PNG
-- ============================================================================

DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = CASE 
    WHEN game_slug = 'ai-hand-gesture-game' THEN '/games/thai/ai-hand-gesture-game-cover.png'
    WHEN game_slug = 'binary-bits' THEN '/games/tech/binary-bits-cover.png'
    WHEN game_slug = 'block-3d' THEN '/games/math/block-3d-cover.png'
    WHEN game_slug = 'catch-numbers' THEN '/games/math/catch-numbers/cover.png'
    WHEN game_slug = 'color-mix' THEN '/games/arts/color-mix-cover.png'
    WHEN game_slug = 'coord-3d' THEN '/games/math/coord-3d-cover.png'
    WHEN game_slug = 'debug-it' THEN '/games/tech/debug-it-cover.png'
    WHEN game_slug = 'english-quest' THEN '/games/english/english-quest-cover.png'
    WHEN game_slug = 'food-chain' THEN '/games/science/food-chain-cover.png'
    WHEN game_slug = 'globe-3d' THEN '/games/social/globe-3d-cover.png'
    WHEN game_slug = 'logic-gates' THEN '/games/tech/logic-gates-cover.png'
    WHEN game_slug = 'multiply-race' THEN '/games/math/multiply-race-cover.png'
    WHEN game_slug = 'net-3d' THEN '/games/math/net-3d-cover.png'
    WHEN game_slug = 'online-safety' THEN '/games/tech/online-safety-cover.png'
    WHEN game_slug = 'robot-path' THEN '/games/tech/robot-path-cover.png'
    WHEN game_slug = 'room-3d' THEN '/games/english/room-3d-cover.png'
    WHEN game_slug = 'sci-sort' THEN '/games/science/sci-sort-cover.png'
    WHEN game_slug = 'social-quiz' THEN '/games/social/social-quiz-cover.png'
    WHEN game_slug = 'solid-3d' THEN '/games/math/solid-3d-cover.png'
    WHEN game_slug = 'thai-edu-rpg' THEN '/games/thai/thai-edu-rpg-cover.png'
    WHEN game_slug = 'thai-spelling' THEN '/games/thai/thai-spelling-cover.png'
    WHEN game_slug = 'thai-spelling-moto' THEN '/games/thai/spelling-moto-cover.png'
    WHEN game_slug = 'tug-of-war' THEN '/games/thai/tug-of-war-cover.png'
    WHEN game_slug = 'vocab-move' THEN '/games/english/vocab-move-cover.png'
    WHEN game_slug = 'wipod' THEN '/games/thai/wipod-cover.png'
    ELSE thumbnail_url
  END,
  updated_at = now()
  WHERE game_slug IN (
    'ai-hand-gesture-game', 'binary-bits', 'block-3d', 'catch-numbers', 'color-mix', 
    'coord-3d', 'debug-it', 'english-quest', 'food-chain', 'globe-3d', 
    'logic-gates', 'multiply-race', 'net-3d', 'online-safety', 'robot-path', 
    'room-3d', 'sci-sort', 'social-quiz', 'solid-3d', 'thai-edu-rpg', 
    'thai-spelling', 'thai-spelling-moto', 'tug-of-war', 'vocab-move', 'wipod'
  );

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/vocab-hub-cover.png',
      updated_at = now()
  WHERE thumbnail_url = '/games/english/vocab-hub-cover.svg';
END $$;
