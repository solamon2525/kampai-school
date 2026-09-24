-- Live classroom competitions: isolated two-team MVP for P4 mathematics.
-- Team devices never receive Data API grants; they communicate through Edge Functions.

BEGIN;

CREATE TYPE public.classroom_competition_status AS ENUM (
  'draft', 'waiting_devices', 'live', 'paused', 'tiebreak', 'finished', 'cancelled'
);
CREATE TYPE public.classroom_competition_device_status AS ENUM (
  'pending', 'approved', 'rejected', 'revoked'
);
CREATE TYPE public.classroom_competition_outcome AS ENUM ('winner', 'loser');

CREATE TABLE public.classroom_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  room_code text NOT NULL UNIQUE CHECK (room_code ~ '^[A-Z0-9]{6}$'),
  class_name text NOT NULL,
  grade_level text NOT NULL DEFAULT 'ป.4',
  subject_key text NOT NULL DEFAULT 'math' CHECK (subject_key = 'math'),
  activity_key text NOT NULL CHECK (activity_key IN (
    'math24', 'improper_to_mixed', 'mixed_to_improper', 'fraction_add_sub', 'mixed'
  )),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_distribution text NOT NULL CHECK (question_distribution IN ('shared', 'equivalent')),
  question_count integer NOT NULL CHECK (question_count IN (10, 20, 30)),
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 60 AND 7200),
  attempt_limit integer NOT NULL DEFAULT 2 CHECK (attempt_limit = 2),
  seed bigint NOT NULL,
  engine_version text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.classroom_competition_status NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  ends_at timestamptz,
  paused_at timestamptz,
  paused_remaining_seconds integer,
  finished_at timestamptz,
  cancelled_at timestamptz,
  winner_team_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_competition_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  color_key text NOT NULL CHECK (color_key IN ('navy', 'gold')),
  sort_order smallint NOT NULL CHECK (sort_order IN (1, 2)),
  current_question_index integer NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  wrong_count integer NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  locked_count integer NOT NULL DEFAULT 0 CHECK (locked_count >= 0),
  response_ms_total bigint NOT NULL DEFAULT 0 CHECK (response_ms_total >= 0),
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, sort_order),
  UNIQUE (competition_id, name),
  UNIQUE (id, competition_id)
);

ALTER TABLE public.classroom_competitions
  ADD CONSTRAINT classroom_competitions_winner_team_fk
  FOREIGN KEY (winner_team_id, id)
  REFERENCES public.classroom_competition_teams(id, competition_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.classroom_competition_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  roster_order integer NOT NULL DEFAULT 0 CHECK (roster_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, competition_id)
    REFERENCES public.classroom_competition_teams(id, competition_id) ON DELETE CASCADE,
  UNIQUE (competition_id, student_id)
);

CREATE TABLE public.classroom_competition_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  team_id uuid,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status public.classroom_competition_device_status NOT NULL DEFAULT 'pending',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, competition_id)
    REFERENCES public.classroom_competition_teams(id, competition_id) ON DELETE SET NULL
);

CREATE TABLE public.classroom_competition_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  team_id uuid,
  sequence_no integer NOT NULL CHECK (sequence_no >= 0),
  activity_key text NOT NULL,
  prompt jsonb NOT NULL,
  answer_key jsonb NOT NULL,
  validator_version text NOT NULL,
  difficulty text NOT NULL,
  canonical_key text NOT NULL,
  is_tiebreak boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, competition_id)
    REFERENCES public.classroom_competition_teams(id, competition_id) ON DELETE CASCADE,
  UNIQUE NULLS NOT DISTINCT (competition_id, team_id, sequence_no),
  UNIQUE (competition_id, team_id, canonical_key)
);

CREATE TABLE public.classroom_competition_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.classroom_competition_questions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  device_id uuid NOT NULL REFERENCES public.classroom_competition_devices(id) ON DELETE RESTRICT,
  attempt_no smallint NOT NULL CHECK (attempt_no IN (1, 2)),
  response jsonb NOT NULL,
  is_correct boolean NOT NULL,
  response_ms integer NOT NULL CHECK (response_ms >= 0),
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, competition_id)
    REFERENCES public.classroom_competition_teams(id, competition_id) ON DELETE CASCADE,
  UNIQUE (question_id, team_id, attempt_no),
  UNIQUE (device_id, idempotency_key)
);

CREATE TABLE public.classroom_competition_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.classroom_competitions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  rank smallint NOT NULL CHECK (rank IN (1, 2)),
  outcome public.classroom_competition_outcome NOT NULL,
  final_score integer NOT NULL CHECK (final_score >= 0),
  wrong_count integer NOT NULL CHECK (wrong_count >= 0),
  locked_count integer NOT NULL CHECK (locked_count >= 0),
  response_ms_total bigint NOT NULL CHECK (response_ms_total >= 0),
  league_points smallint NOT NULL CHECK (league_points IN (1, 3)),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, competition_id)
    REFERENCES public.classroom_competition_teams(id, competition_id) ON DELETE CASCADE,
  UNIQUE (competition_id, team_id),
  UNIQUE (competition_id, rank)
);

CREATE INDEX classroom_competitions_owner_created_idx
  ON public.classroom_competitions(owner_user_id, created_at DESC);
CREATE INDEX classroom_competitions_room_status_idx
  ON public.classroom_competitions(room_code, status);
CREATE INDEX classroom_competition_devices_comp_status_idx
  ON public.classroom_competition_devices(competition_id, status, last_seen_at DESC);
CREATE INDEX classroom_competition_attempts_comp_team_idx
  ON public.classroom_competition_attempts(competition_id, team_id, created_at);
CREATE INDEX classroom_competition_members_student_idx
  ON public.classroom_competition_members(student_id, competition_id);

CREATE OR REPLACE FUNCTION public.touch_classroom_competition_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER classroom_competitions_touch_updated_at
BEFORE UPDATE ON public.classroom_competitions
FOR EACH ROW EXECUTE FUNCTION public.touch_classroom_competition_updated_at();

CREATE OR REPLACE FUNCTION public.finalize_classroom_competition(
  p_competition_id uuid,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_comp public.classroom_competitions%ROWTYPE;
  v_first public.classroom_competition_teams%ROWTYPE;
  v_second public.classroom_competition_teams%ROWTYPE;
  v_is_exact_tie boolean;
BEGIN
  SELECT * INTO v_comp FROM public.classroom_competitions
  WHERE id = p_competition_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'competition_not_found'; END IF;

  IF v_comp.status = 'finished' THEN
    RETURN jsonb_build_object('status', 'finished', 'winnerTeamId', v_comp.winner_team_id);
  END IF;
  IF v_comp.status = 'cancelled' THEN RAISE EXCEPTION 'competition_cancelled'; END IF;
  IF NOT p_force AND v_comp.ends_at IS NOT NULL AND now() < v_comp.ends_at THEN
    RAISE EXCEPTION 'competition_not_expired';
  END IF;

  SELECT * INTO v_first
  FROM public.classroom_competition_teams
  WHERE competition_id = p_competition_id
  ORDER BY score DESC, wrong_count ASC, response_ms_total ASC, sort_order ASC
  LIMIT 1;
  SELECT * INTO v_second
  FROM public.classroom_competition_teams
  WHERE competition_id = p_competition_id AND id <> v_first.id
  ORDER BY score DESC, wrong_count ASC, response_ms_total ASC, sort_order ASC
  LIMIT 1;

  v_is_exact_tie := v_first.score = v_second.score
    AND v_first.wrong_count = v_second.wrong_count
    AND v_first.response_ms_total = v_second.response_ms_total;

  IF v_is_exact_tie THEN
    UPDATE public.classroom_competitions
    SET status = 'tiebreak', ends_at = NULL, paused_at = NULL, paused_remaining_seconds = NULL
    WHERE id = p_competition_id;
    RETURN jsonb_build_object('status', 'tiebreak');
  END IF;

  INSERT INTO public.classroom_competition_results (
    competition_id, team_id, rank, outcome, final_score, wrong_count,
    locked_count, response_ms_total, league_points
  ) VALUES
    (p_competition_id, v_first.id, 1, 'winner', v_first.score, v_first.wrong_count,
      v_first.locked_count, v_first.response_ms_total, 3),
    (p_competition_id, v_second.id, 2, 'loser', v_second.score, v_second.wrong_count,
      v_second.locked_count, v_second.response_ms_total, 1)
  ON CONFLICT (competition_id, team_id) DO NOTHING;

  UPDATE public.classroom_competitions
  SET status = 'finished', winner_team_id = v_first.id, finished_at = now(), ends_at = LEAST(COALESCE(ends_at, now()), now())
  WHERE id = p_competition_id;

  RETURN jsonb_build_object('status', 'finished', 'winnerTeamId', v_first.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_classroom_competition_attempt(
  p_competition_id uuid,
  p_team_id uuid,
  p_device_id uuid,
  p_question_id uuid,
  p_response jsonb,
  p_is_correct boolean,
  p_idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_comp public.classroom_competitions%ROWTYPE;
  v_team public.classroom_competition_teams%ROWTYPE;
  v_question public.classroom_competition_questions%ROWTYPE;
  v_existing public.classroom_competition_attempts%ROWTYPE;
  v_attempt_no integer;
  v_response_ms integer;
  v_advance boolean;
  v_finished jsonb;
BEGIN
  SELECT * INTO v_existing FROM public.classroom_competition_attempts
  WHERE device_id = p_device_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'duplicate', true, 'correct', v_existing.is_correct,
      'attemptNo', v_existing.attempt_no
    );
  END IF;

  SELECT * INTO v_comp FROM public.classroom_competitions
  WHERE id = p_competition_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'competition_not_found'; END IF;
  IF v_comp.status = 'live' AND v_comp.ends_at <= now() THEN
    v_finished := public.finalize_classroom_competition(p_competition_id, true);
    RETURN v_finished || jsonb_build_object('expired', true);
  END IF;
  IF v_comp.status NOT IN ('live', 'tiebreak') THEN RAISE EXCEPTION 'competition_not_live'; END IF;

  SELECT * INTO v_team FROM public.classroom_competition_teams
  WHERE id = p_team_id AND competition_id = p_competition_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'team_not_found'; END IF;

  SELECT * INTO v_question FROM public.classroom_competition_questions
  WHERE id = p_question_id
    AND competition_id = p_competition_id
    AND (team_id IS NULL OR team_id = p_team_id)
    AND sequence_no = v_team.current_question_index;
  IF NOT FOUND THEN RAISE EXCEPTION 'question_not_current'; END IF;
  IF v_comp.status = 'tiebreak' AND NOT v_question.is_tiebreak THEN
    RAISE EXCEPTION 'tiebreak_question_required';
  END IF;

  SELECT count(*) + 1 INTO v_attempt_no
  FROM public.classroom_competition_attempts
  WHERE question_id = p_question_id AND team_id = p_team_id;
  IF v_attempt_no > v_comp.attempt_limit THEN RAISE EXCEPTION 'attempt_limit_reached'; END IF;

  v_response_ms := GREATEST(0, LEAST(2147483647,
    floor(extract(epoch FROM (now() - COALESCE(v_team.question_started_at, v_comp.started_at, now()))) * 1000)::bigint
  ))::integer;
  v_advance := p_is_correct OR v_attempt_no = v_comp.attempt_limit;

  INSERT INTO public.classroom_competition_attempts (
    competition_id, question_id, team_id, device_id, attempt_no,
    response, is_correct, response_ms, idempotency_key
  ) VALUES (
    p_competition_id, p_question_id, p_team_id, p_device_id, v_attempt_no,
    p_response, p_is_correct, v_response_ms, p_idempotency_key
  );

  UPDATE public.classroom_competition_teams
  SET score = score + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      wrong_count = wrong_count + CASE WHEN p_is_correct THEN 0 ELSE 1 END,
      locked_count = locked_count + CASE WHEN NOT p_is_correct AND v_attempt_no = v_comp.attempt_limit THEN 1 ELSE 0 END,
      response_ms_total = response_ms_total + v_response_ms,
      current_question_index = current_question_index + CASE WHEN v_advance THEN 1 ELSE 0 END,
      question_started_at = now()
  WHERE id = p_team_id;

  IF v_comp.status = 'tiebreak' AND p_is_correct THEN
    INSERT INTO public.classroom_competition_results (
      competition_id, team_id, rank, outcome, final_score, wrong_count,
      locked_count, response_ms_total, league_points
    )
    SELECT p_competition_id, t.id,
      CASE WHEN t.id = p_team_id THEN 1 ELSE 2 END,
      CASE WHEN t.id = p_team_id THEN 'winner'::public.classroom_competition_outcome ELSE 'loser'::public.classroom_competition_outcome END,
      t.score,
      t.wrong_count, t.locked_count, t.response_ms_total,
      CASE WHEN t.id = p_team_id THEN 3 ELSE 1 END
    FROM public.classroom_competition_teams t
    WHERE t.competition_id = p_competition_id
    ON CONFLICT (competition_id, team_id) DO NOTHING;
    UPDATE public.classroom_competitions
    SET status = 'finished', winner_team_id = p_team_id, finished_at = now()
    WHERE id = p_competition_id;
  ELSIF v_comp.status = 'live' AND v_advance
    AND NOT EXISTS (
      SELECT 1 FROM public.classroom_competition_teams
      WHERE competition_id = p_competition_id
        AND id <> p_team_id
        AND current_question_index < v_comp.question_count
    )
    AND v_team.current_question_index + 1 >= v_comp.question_count THEN
    v_finished := public.finalize_classroom_competition(p_competition_id, true);
  END IF;

  RETURN jsonb_build_object(
    'duplicate', false,
    'correct', p_is_correct,
    'attemptNo', v_attempt_no,
    'remainingAttempts', CASE WHEN v_advance THEN 0 ELSE v_comp.attempt_limit - v_attempt_no END,
    'advanced', v_advance,
    'locked', NOT p_is_correct AND v_attempt_no = v_comp.attempt_limit,
    'competitionStatus', COALESCE(v_finished->>'status', v_comp.status::text)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_classroom_competition(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_classroom_competition_attempt(uuid, uuid, uuid, uuid, jsonb, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_classroom_competition(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_classroom_competition_attempt(uuid, uuid, uuid, uuid, jsonb, boolean, uuid) TO service_role;

ALTER TABLE public.classroom_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_competition_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY classroom_competitions_owner_read ON public.classroom_competitions
FOR SELECT TO authenticated USING (owner_user_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY classroom_competitions_owner_write ON public.classroom_competitions
FOR ALL TO authenticated USING (owner_user_id = (SELECT auth.uid()) OR public.is_admin())
WITH CHECK (owner_user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY classroom_competition_teams_owner_all ON public.classroom_competition_teams
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY classroom_competition_members_owner_all ON public.classroom_competition_members
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY classroom_competition_devices_owner_all ON public.classroom_competition_devices
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())))
WITH CHECK (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY classroom_competition_questions_owner_read ON public.classroom_competition_questions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY classroom_competition_attempts_owner_read ON public.classroom_competition_attempts
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));
CREATE POLICY classroom_competition_results_owner_read ON public.classroom_competition_results
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classroom_competitions c WHERE c.id = competition_id AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())));

-- Explicit grants: authenticated teachers use RLS; team devices have no anon Data API access.
REVOKE ALL ON TABLE public.classroom_competitions,
  public.classroom_competition_teams,
  public.classroom_competition_members,
  public.classroom_competition_devices,
  public.classroom_competition_questions,
  public.classroom_competition_attempts,
  public.classroom_competition_results FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.classroom_competitions,
  public.classroom_competition_teams,
  public.classroom_competition_members,
  public.classroom_competition_devices TO authenticated;
GRANT SELECT ON TABLE public.classroom_competition_questions,
  public.classroom_competition_attempts,
  public.classroom_competition_results TO authenticated;
GRANT ALL ON TABLE public.classroom_competitions,
  public.classroom_competition_teams,
  public.classroom_competition_members,
  public.classroom_competition_devices,
  public.classroom_competition_questions,
  public.classroom_competition_attempts,
  public.classroom_competition_results TO service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.classroom_competitions,
  public.classroom_competition_teams,
  public.classroom_competition_devices,
  public.classroom_competition_attempts,
  public.classroom_competition_results;

CREATE POLICY classroom_competition_host_private_read
ON realtime.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_competitions c
    WHERE c.id = CASE
      WHEN realtime.topic() ~ '^classroom-competition:[0-9a-f-]{36}$'
      THEN split_part(realtime.topic(), ':', 2)::uuid
      ELSE NULL
    END
      AND (c.owner_user_id = (SELECT auth.uid()) OR public.is_admin())
  )
);

COMMENT ON TABLE public.classroom_competition_questions IS
  'Prompts and server-only answer keys for deterministic classroom competition questions.';
COMMENT ON FUNCTION public.record_classroom_competition_attempt IS
  'Atomic service-role-only attempt recording and team progression; validation happens in the trusted Team Edge Function.';

COMMIT;
