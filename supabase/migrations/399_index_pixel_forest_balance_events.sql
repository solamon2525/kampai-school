-- 399_index_pixel_forest_balance_events.sql
-- Cover the telemetry student FK used by deletes and per-player balance audits.

CREATE INDEX IF NOT EXISTS idx_pixel_forest_events_student_time
  ON public.pixel_forest_balance_events (student_id, created_at DESC);

COMMENT ON FUNCTION public.get_pixel_forest_rpg_state(text) IS
  'Intentional anonymous student-code game boundary; direct profile table remains admin-only through RLS.';
COMMENT ON FUNCTION public.save_pixel_forest_rpg_state(text, int, text, jsonb, jsonb) IS
  'Intentional anonymous student-code game boundary with strict state, economy, telemetry, version and idempotency validation.';

UPDATE public.educational_hub_items SET
  build_version = '3.0.2',
  build_updated_at = now(),
  updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

UPDATE public.game_docs SET
  version = '3.0.2',
  notes = 'RPG Vertical Slice รุ่น 1: persistent save RPC hardened; admin-only balance rollup; indexed telemetry audit path; intentional student-code boundary; original pixel art assets',
  updated_at = now()
WHERE item_id = (
  SELECT id FROM public.educational_hub_items
  WHERE game_slug = 'pixel-forest-explorer' LIMIT 1
);
