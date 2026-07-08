-- 379: default school_settings for random cover seconds

INSERT INTO public.school_settings (key, value)
VALUES
  ('game_preview_cover_round2_min_seconds', '3'),
  ('game_preview_cover_round2_max_seconds', '5')
ON CONFLICT (key) DO NOTHING;

