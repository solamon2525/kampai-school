-- 208_local_versus_matches.sql
-- โหมด 2 คนเครื่องเดียว (Local Versus) ของ multiply-race — เก็บสถิติแมตช์
-- Reuse โครง online_matches (migration 162): wrapper บันทึก 2 session (mode='versus' + room ร่วม)
--   → trigger สร้างแมตช์เข้า online_matches โดยตั้ง source='local'
-- best-of-N: ตัดสินด้วย rounds_won (เก็บใน participants) ก่อน แล้ว score
-- ห้ามแก้ 162 — ไฟล์นี้ใช้ ALTER ADD / CREATE OR REPLACE เพิ่มเติมเท่านั้น

-- ════════════════════════════════════════════════════════════════════════
-- 1) ขยาย schema (idempotent)
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public.online_matches
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online';   -- 'online' | 'local'
ALTER TABLE public.online_match_participants
  ADD COLUMN IF NOT EXISTS rounds_won int;                          -- best-of-N (NULL = ไม่ใช้)

CREATE INDEX IF NOT EXISTS idx_online_matches_source ON public.online_matches (source);

-- ════════════════════════════════════════════════════════════════════════
-- 2) recompute เฉพาะ versus (rank by rounds_won → score → correct)
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recompute_versus_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_count  int;
  v_top    int;
  v_bottom int;
  v_winner uuid;
BEGIN
  WITH ranked AS (
    SELECT student_id,
           ROW_NUMBER() OVER (ORDER BY COALESCE(rounds_won,0) DESC, score DESC, correct DESC) AS rn
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

  -- winner = rank 1 เฉพาะเมื่อ >= 2 คน และ top ไม่เสมอ (rounds_won, score)
  SELECT p1.student_id INTO v_winner
  FROM public.online_match_participants p1
  WHERE p1.match_id = p_match_id AND p1.rank = 1
    AND NOT EXISTS (
      SELECT 1 FROM public.online_match_participants p2
      WHERE p2.match_id = p_match_id AND p2.student_id <> p1.student_id
        AND COALESCE(p2.rounds_won,0) = COALESCE(p1.rounds_won,0)
        AND p2.score = p1.score
    );
  IF v_count < 2 THEN v_winner := NULL; END IF;

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
-- 3) Trigger: จับแมตช์ตอน insert session แบบ versus (room = unique ต่อ series)
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.process_versus_match()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_room    text;
  v_match   uuid;
  v_correct int;
  v_rounds  int;
BEGIN
  IF NEW.mode IS DISTINCT FROM 'versus' THEN
    RETURN NEW;
  END IF;
  v_room := NEW.metadata->>'room';
  IF v_room IS NULL OR v_room = '' THEN
    RETURN NEW;
  END IF;

  v_correct := COALESCE((NEW.metadata->>'correct')::int, 0);
  v_rounds  := NULLIF(NEW.metadata->>'roundsWon', '')::int;

  -- หาแมตช์ของ room นี้ (unique ต่อ series; เผื่อ window 30 นาที)
  SELECT id INTO v_match
  FROM public.online_matches
  WHERE source = 'local' AND game_slug = NEW.game_slug AND room_code = v_room
    AND NEW.created_at - finished_at <= interval '30 minutes'
  ORDER BY finished_at DESC LIMIT 1;

  IF v_match IS NULL THEN
    INSERT INTO public.online_matches
      (game_slug, room_code, source, started_at, finished_at)
    VALUES (NEW.game_slug, v_room, 'local', NEW.created_at, NEW.created_at)
    RETURNING id INTO v_match;
  ELSE
    UPDATE public.online_matches
       SET finished_at = GREATEST(finished_at, NEW.created_at)
     WHERE id = v_match;
  END IF;

  INSERT INTO public.online_match_participants
    (match_id, student_id, score, correct, rounds_won, session_id)
  VALUES (v_match, NEW.student_id, NEW.score, v_correct, v_rounds, NEW.id)
  ON CONFLICT (match_id, student_id) DO UPDATE SET
    score      = EXCLUDED.score,
    correct    = EXCLUDED.correct,
    rounds_won = EXCLUDED.rounds_won,
    session_id = EXCLUDED.session_id;

  PERFORM public.recompute_versus_match(v_match);
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.process_versus_match()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_versus_match(uuid)  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_process_versus_match ON public.game_sessions;
CREATE TRIGGER trg_process_versus_match
AFTER INSERT ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.process_versus_match();

-- ════════════════════════════════════════════════════════════════════════
-- 4) RPCs (filter source='local')
-- ════════════════════════════════════════════════════════════════════════

-- KPI ภาพรวม versus ในห้อง
CREATE OR REPLACE FUNCTION public.get_versus_overview(p_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH m AS (
    SELECT * FROM public.online_matches
    WHERE source = 'local' AND finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  )
  SELECT jsonb_build_object(
    'total_matches',     (SELECT count(*) FROM m),
    'decisive_matches',  (SELECT count(*) FROM m WHERE is_decisive),
    'distinct_players',  (SELECT count(DISTINCT p.student_id)
                            FROM public.online_match_participants p JOIN m ON m.id = p.match_id),
    'last_played_at',    (SELECT max(finished_at) FROM m)
  );
$function$;

-- แชมป์ห้อง (W/L รายคน) — กรองห้องได้
CREATE OR REPLACE FUNCTION public.get_versus_student_leaderboard(
  p_class text DEFAULT NULL, p_days int DEFAULT 90, p_limit int DEFAULT 20)
RETURNS TABLE(
  student_id uuid, name text, class text, photo_url text,
  matches int, wins int, losses int, win_rate numeric, last_played timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH dm AS (
    SELECT id FROM public.online_matches
    WHERE source = 'local' AND is_decisive
      AND finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  ),
  pp AS (
    SELECT p.*, m.finished_at FROM public.online_match_participants p
    JOIN dm ON dm.id = p.match_id
    JOIN public.online_matches m ON m.id = p.match_id
  )
  SELECT
    st.id, st.name, st.class, st.photo_url,
    count(*)::int AS matches,
    count(*) FILTER (WHERE pp.is_winner)::int AS wins,
    count(*) FILTER (WHERE NOT pp.is_winner)::int AS losses,
    round(100.0 * count(*) FILTER (WHERE pp.is_winner) / NULLIF(count(*),0), 1) AS win_rate,
    max(pp.finished_at) AS last_played
  FROM pp
  JOIN public.students st ON st.id = pp.student_id
  WHERE (p_class IS NULL OR st.class = p_class)
  GROUP BY st.id, st.name, st.class, st.photo_url
  ORDER BY wins DESC, win_rate DESC NULLS LAST, matches DESC
  LIMIT GREATEST(p_limit, 1);
$function$;

-- head-to-head: A เทียบ B (มุมของ A)
CREATE OR REPLACE FUNCTION public.get_versus_head_to_head(p_a uuid, p_b uuid)
RETURNS TABLE(matches int, wins int, losses int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH shared AS (
    SELECT a.match_id, a.is_winner AS a_win, b.is_winner AS b_win
    FROM public.online_match_participants a
    JOIN public.online_match_participants b ON b.match_id = a.match_id AND b.student_id = p_b
    JOIN public.online_matches m ON m.id = a.match_id AND m.source = 'local' AND m.is_decisive
    WHERE a.student_id = p_a
  )
  SELECT count(*)::int AS matches,
         count(*) FILTER (WHERE a_win)::int AS wins,
         count(*) FILTER (WHERE b_win)::int AS losses
  FROM shared;
$function$;

-- ประวัติแมตช์ในห้อง + standings
CREATE OR REPLACE FUNCTION public.get_versus_match_log(p_days int DEFAULT 30, p_limit int DEFAULT 50)
RETURNS TABLE(
  match_id uuid, game_slug text, title text,
  player_count int, finished_at timestamptz, standings jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT
    m.id, m.game_slug, COALESCE(i.title, m.game_slug),
    m.player_count, m.finished_at,
    (SELECT jsonb_agg(jsonb_build_object(
        'name', st.name, 'class', st.class, 'photo_url', st.photo_url,
        'rank', p.rank, 'score', p.score, 'rounds_won', p.rounds_won, 'is_winner', p.is_winner
      ) ORDER BY p.rank)
      FROM public.online_match_participants p
      JOIN public.students st ON st.id = p.student_id
      WHERE p.match_id = m.id) AS standings
  FROM public.online_matches m
  LEFT JOIN public.educational_hub_items i ON i.game_slug = m.game_slug AND i.tracked_game = true
  WHERE m.source = 'local'
    AND m.finished_at >= now() - (GREATEST(p_days,1) || ' days')::interval
  ORDER BY m.finished_at DESC
  LIMIT GREATEST(p_limit, 1);
$function$;

GRANT EXECUTE ON FUNCTION public.get_versus_overview(int)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_versus_student_leaderboard(text, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_versus_head_to_head(uuid, uuid)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_versus_match_log(int, int)                 TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 5) game_docs — บังคับ (อัปเดต + เด้งเวอร์ชันทุกครั้งที่แก้เกม)
-- ════════════════════════════════════════════════════════════════════════
DO $docs$
DECLARE
  v_staff_id UUID;
  v_url TEXT := '/games/math/multiply-race.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE NOTICE 'staff multiply-race owner not found — skip game_docs'; RETURN; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ตอบคำถามสูตรคูณ (quiz) — เดี่ยว + 2 คนจอเดียว',
         ARRAY[
           'โหมด 2 คน split-screen บน PC (P1 ลูกศร / P2 WASD)',
           'รองรับจอยแพด + หน้าตั้งค่า remap',
           'เลือกคู่แข่งจากรายชื่อห้องเดียวกัน',
           'แข่งเวลา 60 วิ · Best-of-3/5 (ระบบยก)',
           'เก็บสถิติแมตช์ในห้อง + head-to-head + แชมป์ห้อง',
           'โหมดเดิม: แข่งเร็ว/ไม่จำกัด/ฝึกแม่/ออนไลน์/ชาเลนจ์วันนี้ + adaptive + mastery'
         ],
         'v1.1.0',
         'เพิ่มโหมด 2 คน split-screen + ระบบสถิติแมตช์ในห้อง (reuse online_matches source=local, migration 208)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $docs$;
