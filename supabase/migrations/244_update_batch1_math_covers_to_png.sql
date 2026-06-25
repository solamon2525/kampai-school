-- ============================================================================
-- Migration 244: Update Batch 1 Math Game Covers to Chibi PNG (1280x720)
-- ============================================================================
-- Updates covers for: coin-exchange, farm-adventure, jump-even-odd, math-move-quiz, math-racer
-- ============================================================================

DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = CASE 
    WHEN game_slug = 'coin-exchange' THEN '/games/math/coin-exchange/cover.png'
    WHEN game_slug = 'farm-adventure' THEN '/games/math/farm-adventure/cover.png'
    WHEN game_slug = 'jump-even-odd' THEN '/games/math/jump-even-odd/cover.png'
    WHEN game_slug = 'math-move-quiz' THEN '/games/math/math-move-quiz/cover.png'
    WHEN game_slug = 'math-racer' THEN '/games/math/math-racer/cover.png'
    ELSE thumbnail_url
  END,
  updated_at = now()
  WHERE game_slug IN ('coin-exchange', 'farm-adventure', 'jump-even-odd', 'math-move-quiz', 'math-racer');
END $$;
