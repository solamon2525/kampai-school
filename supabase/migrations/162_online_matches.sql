-- 162_online_matches.sql
-- สถิติแข่งออนไลน์ (Win/Loss) — reconstruct แมตช์จาก game_sessions (mode='online')
-- จับกลุ่มด้วย (game_slug, room, time-cluster ≤30 นาที) จัดอันดับด้วย score
-- ทำงานกับข้อมูลเก่าได้ทันที + ไม่ต้องแก้เกม/SDK/framework
--
-- Pattern เดียวกับ process_daily_quest (migration 161): AFTER INSERT trigger บน game_sessions

-- ════════════════════════════════════════════════════════════════════════
-- 1) ตารางเก็บแมตช์
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.online_matches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug         text NOT NULL,
  room_code         text NOT NULL,
  player_count      int  NOT NULL DEFAULT 0,
  winner_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  is_tournament     boolean NOT NULL DEFAULT false,
  top_score         int NOT NULL DEFAULT 0,
  score_spread      int NOT NULL DEFAULT 0,      -- top - bottom (ความสูสี: น้อย = สูสี)
  is_decisive       boolean NOT NULL DEFAULT false,  -- player_count >= 2
  started_at        timestamptz NOT NULL,
  finished_at       timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.online_match_participants (
  match_id    uuid NOT NULL REFERENCES public.online_matches(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score       int NOT NULL DEFAULT 0,
  correct     int NOT NULL DEFAULT 0,
  rank        int NOT NULL DEFAULT 0,
  is_winner   boolean NOT NULL DEFAULT false,
  session_id  uuid REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  PRIMARY KEY (match_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_online_matches_game     ON public.online_matches (game_slug);
CREATE INDEX IF NOT EXISTS idx_online_matches_finished ON public.online_matches (finished_at);
CREATE INDEX IF NOT EXISTS idx_omp_student             ON public.online_match_participants (student_id);

-- ════════════════════════════════════════════════════════════════════════
-- 2) Helper: recompute aggregate ของแมตช์ (ranks/winner/spread/...)
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recompute_online_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_count   int;
  v_top     int;
  v_bottom  int;
  v_winner  uuid;
  v_tie     boolean;
BEGIN
  -- re-rank ตาม score desc (tie-break: correct desc)
  WITH ranked AS (
    SELECT student_id,
           ROW_NUMBER() OVER (ORDER BY score DESC, correct DESC) AS rn
    FROM public.online_match_participants
    WHERE match_id = p_match_id
  )
  UPDATE public.online_match_participants p
     SET rank = r.rn
  FROM ranked r
  WHERE p.match_id = p_match_id AND p.student_id = r.student_id;

  SELECT count(*), max(score), min(score)
    INTO v_count, v_top, v_bottom
  FROM public.online_match_participants WHERE match_id = p_match_id;

  -- winner = rank 1 เฉพาะเมื่อ >= 2 คน และ top score ไม่เสมอ
  SELECT (count(*) = 1) INTO v_tie
  FROM public.online_match_participants
  WHERE match_id = p_match_id AND score = v_top;

  IF v_count >= 2 AND v_tie THEN
    SELECT student_id INTO v_winner
    FROM public.online_match_participants
    WHERE match_id = p_match_id AND rank = 1;
  ELSE
    v_winner := NULL;
  END IF;

  UPDATE public.online_match_participants
     SET is_winner = (v_winner IS NOT NULL AND student_id = v_winner)
   WHERE match_id = p_match_id;

  UPDATE public.online_matches
     SET player_count      = v_count,
         top_score         = COALESCE(v_top, 0),
         score_spread      = COALESCE(v_top, 0) - COALESCE(v_bottom, 0),
         is_decisive       = (v_count >= 2),
         winner_student_id = v_winner
   WHERE id = p_match_id;
END;
$function$;

-- ════════════════════════════════════════════════════════════════════════
-- 3) Trigger: จับแมตช์ตอน insert session ออนไลน์
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.process_online_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_room    text;
  v_match   uuid;
  v_correct int;
  v_tour    boolean;
BEGIN
  IF NEW.mode IS DISTINCT FROM 'online' THEN
    RETURN NEW;
  END IF;
  v_room := NEW.metadata->>'room';
  IF v_room IS NULL OR v_room = '' THEN
    RETURN NEW;
  END IF;

  v_correct := COALESCE((NEW.metadata->>'correct')::int, 0);
  v_tour    := COALESCE(NEW.metadata->>'tournament', 'false') IN ('true', '1');

  -- หาแมตช์เปิดของ (game_slug, room) ภายใน 30 นาที
  SELECT id INTO v_match
  FROM public.online_matches
  WHERE game_slug = NEW.game_slug
    AND room_code = v_room
    AND NEW.created_at - finished_at <= interval '30 minutes'
  ORDER BY finished_at DESC
  LIMIT 1;

  IF v_match IS NULL THEN
    INSERT INTO public.online_matches
      (game_slug, room_code, is_tournament, started_at, finished_at)
    VALUES (NEW.game_slug, v_room, v_tour, NEW.created_at, NEW.created_at)
    RETURNING id INTO v_match;
  ELSE
    UPDATE public.online_matches
       SET finished_at   = GREATEST(finished_at, NEW.created_at),
           is_tournament = is_tournament OR v_tour
     WHERE id = v_match;
  END IF;

  INSERT INTO public.online_match_participants
    (match_id, student_id, score, correct, session_id)
  VALUES (v_match, NEW.student_id, NEW.score, v_correct, NEW.id)
  ON CONFLICT (match_id, student_id) DO UPDATE SET
    score      = GREATEST(public.online_match_participants.score, EXCLUDED.score),
    correct    = GREATEST(public.online_match_participants.correct, EXCLUDED.correct),
    session_id = EXCLUDED.session_id;

  PERFORM public.recompute_online_match(v_match);
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.process_online_match()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_online_match(uuid)    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_process_online_match ON public.game_sessions;
CREATE TRIGGER trg_process_online_match
AFTER INSERT ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.process_online_match();

-- ════════════════════════════════════════════════════════════════════════
-- 4) Backfill ข้อมูลเก่า (set-based — gap-based sessionization)
-- ════════════════════════════════════════════════════════════════════════

DO $backfill$
DECLARE
  v_rec   record;
  v_match uuid;
BEGIN
  FOR v_rec IN
    WITH base AS (
      SELECT id, student_id, game_slug, score, created_at,
             metadata->>'room' AS room,
             COALESCE((metadata->>'correct')::int, 0) AS correct,
             COALESCE(metadata->>'tournament','false') IN ('true','1') AS tour
      FROM public.game_sessions
      WHERE mode = 'online' AND metadata ? 'room'
    ),
    flagged AS (
      SELECT *,
             LAG(created_at) OVER (PARTITION BY game_slug, room ORDER BY created_at) AS prev_at
      FROM base
    ),
    grouped AS (
      SELECT *,
             SUM(CASE WHEN prev_at IS NULL OR created_at - prev_at > interval '30 minutes'
                      THEN 1 ELSE 0 END)
               OVER (PARTITION BY game_slug, room ORDER BY created_at
                     ROWS UNBOUNDED PRECEDING) AS grp
      FROM flagged
    )
    SELECT * FROM grouped ORDER BY game_slug, room, grp, created_at
  LOOP
    -- หาแมตช์ของกลุ่มนี้ (game_slug, room) ที่ยังอยู่ใน 30 นาที
    SELECT id INTO v_match
    FROM public.online_matches
    WHERE game_slug = v_rec.game_slug
      AND room_code = v_rec.room
      AND v_rec.created_at - finished_at <= interval '30 minutes'
    ORDER BY finished_at DESC LIMIT 1;

    IF v_match IS NULL THEN
      INSERT INTO public.online_matches (game_slug, room_code, is_tournament, started_at, finished_at)
      VALUES (v_rec.game_slug, v_rec.room, v_rec.tour, v_rec.created_at, v_rec.created_at)
      RETURNING id INTO v_match;
    ELSE
      UPDATE public.online_matches
         SET finished_at = GREATEST(finished_at, v_rec.created_at),
             is_tournament = is_tournament OR v_rec.tour
       WHERE id = v_match;
    END IF;

    INSERT INTO public.online_match_participants (match_id, student_id, score, correct, session_id)
    VALUES (v_match, v_rec.student_id, v_rec.score, v_rec.correct, v_rec.id)
    ON CONFLICT (match_id, student_id) DO UPDATE SET
      score = GREATEST(public.online_match_participants.score, EXCLUDED.score),
      correct = GREATEST(public.online_match_participants.correct, EXCLUDED.correct);

    PERFORM public.recompute_online_match(v_match);
  END LOOP;
END;
$backfill$;

-- ════════════════════════════════════════════════════════════════════════
-- 5) RPCs
-- ════════════════════════════════════════════════════════════════════════

-- KPI ภาพรวม
CREATE OR REPLACE FUNCTION public.get_online_overview(p_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH m AS (
    SELECT * FROM public.online_matches
    WHERE finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  )
  SELECT jsonb_build_object(
    'total_matches',        (SELECT count(*) FROM m),
    'decisive_matches',     (SELECT count(*) FROM m WHERE is_decisive),
    'distinct_players',     (SELECT count(DISTINCT p.student_id)
                              FROM public.online_match_participants p JOIN m ON m.id = p.match_id),
    'distinct_games',       (SELECT count(DISTINCT game_slug) FROM m WHERE is_decisive),
    'avg_players_per_match',(SELECT COALESCE(round(avg(player_count)::numeric, 1), 0) FROM m WHERE is_decisive),
    'solo_rate',            (SELECT CASE WHEN count(*) = 0 THEN 0
                              ELSE round(100.0 * count(*) FILTER (WHERE NOT is_decisive) / count(*), 1) END FROM m),
    'most_popular_game',    (SELECT game_slug FROM m WHERE is_decisive
                              GROUP BY game_slug ORDER BY count(*) DESC LIMIT 1)
  );
$function$;

-- สถิติต่อเกม (วิเคราะห์เกมไหนนิยม/ควรปรับปรุง)
CREATE OR REPLACE FUNCTION public.get_online_game_stats(p_days int DEFAULT 30)
RETURNS TABLE(
  game_slug text, title text, matches int, decisive_matches int,
  unique_players int, total_participants int, avg_players numeric,
  solo_rate numeric, avg_score_spread numeric, blowout_rate numeric,
  repeat_rate numeric, last_played_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH m AS (
    SELECT * FROM public.online_matches
    WHERE finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  ),
  blow AS (  -- แมตช์ที่ผู้ชนะทิ้งห่าง: top >= 2x ที่สอง
    SELECT mm.id, mm.game_slug,
      (SELECT score FROM public.online_match_participants WHERE match_id = mm.id ORDER BY rank LIMIT 1) AS s1,
      (SELECT score FROM public.online_match_participants WHERE match_id = mm.id ORDER BY rank OFFSET 1 LIMIT 1) AS s2
    FROM m mm WHERE mm.is_decisive
  )
  SELECT
    m.game_slug,
    COALESCE(i.title, m.game_slug) AS title,
    count(*)::int AS matches,
    count(*) FILTER (WHERE m.is_decisive)::int AS decisive_matches,
    (SELECT count(DISTINCT p.student_id)::int FROM public.online_match_participants p
       JOIN m m2 ON m2.id = p.match_id WHERE m2.game_slug = m.game_slug) AS unique_players,
    (SELECT count(*)::int FROM public.online_match_participants p
       JOIN m m2 ON m2.id = p.match_id WHERE m2.game_slug = m.game_slug) AS total_participants,
    COALESCE(round(avg(m.player_count) FILTER (WHERE m.is_decisive)::numeric, 1), 0) AS avg_players,
    CASE WHEN count(*) = 0 THEN 0
         ELSE round(100.0 * count(*) FILTER (WHERE NOT m.is_decisive) / count(*), 1) END AS solo_rate,
    COALESCE(round(avg(m.score_spread) FILTER (WHERE m.is_decisive)::numeric, 1), 0) AS avg_score_spread,
    COALESCE((SELECT round(100.0 * count(*) FILTER (WHERE s1 >= s2 * 2 AND s2 > 0)
                / NULLIF(count(*),0), 1) FROM blow WHERE blow.game_slug = m.game_slug), 0) AS blowout_rate,
    round(count(*) FILTER (WHERE m.is_decisive)::numeric
      / NULLIF((SELECT count(DISTINCT p.student_id) FROM public.online_match_participants p
                JOIN m m2 ON m2.id = p.match_id WHERE m2.game_slug = m.game_slug), 0), 2) AS repeat_rate,
    max(m.finished_at) AS last_played_at
  FROM m
  LEFT JOIN public.educational_hub_items i ON i.game_slug = m.game_slug AND i.tracked_game = true
  GROUP BY m.game_slug, i.title
  ORDER BY decisive_matches DESC, matches DESC;
$function$;

-- Leaderboard นักเรียน (W/L)
CREATE OR REPLACE FUNCTION public.get_online_student_leaderboard(p_days int DEFAULT 30, p_limit int DEFAULT 20)
RETURNS TABLE(
  student_id uuid, name text, class text, photo_url text,
  matches int, wins int, losses int, win_rate numeric,
  distinct_opponents int, last_played timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH dm AS (  -- decisive matches ในช่วงเวลา
    SELECT id FROM public.online_matches
    WHERE is_decisive AND finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  ),
  pp AS (
    SELECT p.* FROM public.online_match_participants p JOIN dm ON dm.id = p.match_id
  )
  SELECT
    st.id, st.name, st.class, st.photo_url,
    count(*)::int AS matches,
    count(*) FILTER (WHERE pp.is_winner)::int AS wins,
    count(*) FILTER (WHERE NOT pp.is_winner)::int AS losses,
    round(100.0 * count(*) FILTER (WHERE pp.is_winner) / NULLIF(count(*),0), 1) AS win_rate,
    (SELECT count(DISTINCT o.student_id)::int
       FROM public.online_match_participants o
       WHERE o.match_id IN (SELECT match_id FROM pp p2 WHERE p2.student_id = st.id)
         AND o.student_id <> st.id) AS distinct_opponents,
    max(m.finished_at) AS last_played
  FROM pp
  JOIN public.students st ON st.id = pp.student_id
  JOIN public.online_matches m ON m.id = pp.match_id
  GROUP BY st.id, st.name, st.class, st.photo_url
  ORDER BY wins DESC, win_rate DESC NULLS LAST, matches DESC
  LIMIT GREATEST(p_limit, 1);
$function$;

-- Head-to-head รายคู่ (สำหรับนักเรียนคนหนึ่ง vs คู่แข่งทุกคน)
CREATE OR REPLACE FUNCTION public.get_online_head_to_head(p_student_id uuid)
RETURNS TABLE(
  opponent_id uuid, name text, class text, photo_url text,
  matches int, wins int, losses int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH my AS (  -- decisive matches + อันดับของฉัน
    SELECT p.match_id, p.rank AS my_rank
    FROM public.online_match_participants p
    JOIN public.online_matches m ON m.id = p.match_id AND m.is_decisive
    WHERE p.student_id = p_student_id
  ),
  vs AS (
    SELECT o.student_id AS opponent_id,
           count(*)::int AS matches,
           count(*) FILTER (WHERE my.my_rank < o.rank)::int AS wins,
           count(*) FILTER (WHERE my.my_rank > o.rank)::int AS losses
    FROM my
    JOIN public.online_match_participants o ON o.match_id = my.match_id AND o.student_id <> p_student_id
    GROUP BY o.student_id
  )
  SELECT vs.opponent_id, st.name, st.class, st.photo_url, vs.matches, vs.wins, vs.losses
  FROM vs JOIN public.students st ON st.id = vs.opponent_id
  ORDER BY vs.matches DESC, vs.wins DESC;
$function$;

-- ประวัติแมตช์ + standings
CREATE OR REPLACE FUNCTION public.get_online_match_log(p_game_slug text DEFAULT NULL, p_limit int DEFAULT 50)
RETURNS TABLE(
  match_id uuid, game_slug text, title text, room_code text,
  player_count int, is_decisive boolean, is_tournament boolean,
  finished_at timestamptz, standings jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT
    m.id, m.game_slug, COALESCE(i.title, m.game_slug), m.room_code,
    m.player_count, m.is_decisive, m.is_tournament, m.finished_at,
    (SELECT jsonb_agg(jsonb_build_object(
        'name', st.name, 'class', st.class, 'photo_url', st.photo_url,
        'rank', p.rank, 'score', p.score, 'is_winner', p.is_winner
      ) ORDER BY p.rank)
      FROM public.online_match_participants p
      JOIN public.students st ON st.id = p.student_id
      WHERE p.match_id = m.id) AS standings
  FROM public.online_matches m
  LEFT JOIN public.educational_hub_items i ON i.game_slug = m.game_slug AND i.tracked_game = true
  WHERE (p_game_slug IS NULL OR m.game_slug = p_game_slug)
  ORDER BY m.finished_at DESC
  LIMIT GREATEST(p_limit, 1);
$function$;

-- ════════════════════════════════════════════════════════════════════════
-- 6) RLS + Grants
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.online_matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_match_participants  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS om_read  ON public.online_matches;
DROP POLICY IF EXISTS omp_read ON public.online_match_participants;
CREATE POLICY om_read  ON public.online_matches            FOR SELECT USING (true);
CREATE POLICY omp_read ON public.online_match_participants FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION public.get_online_overview(int)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_online_game_stats(int)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_online_student_leaderboard(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_online_head_to_head(uuid)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_online_match_log(text, int)          TO anon, authenticated;
