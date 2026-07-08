-- 378: default school_settings for game card preview cover↔ video cycle

INSERT INTO public.school_settings (key, value)
VALUES
  ('game_preview_cover_seconds', '2'),
  ('game_preview_video_seconds', '5')
ON CONFLICT (key) DO NOTHING;
