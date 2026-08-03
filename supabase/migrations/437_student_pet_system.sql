-- 437_student_pet_system.sql
-- Student pet MVP: spendable Star Coins, deterministic pet shop, owned pets, and one equipped companion.
-- Student game identity currently uses student_code (same boundary as record_game_session).

CREATE TABLE IF NOT EXISTS public.pet_catalog (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9-]{2,40}$'),
  name_th      text NOT NULL,
  species_th   text NOT NULL,
  description  text NOT NULL DEFAULT '',
  visual_key   text NOT NULL,
  rarity       text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic')),
  price        int NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_starter   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_catalog_one_starter
  ON public.pet_catalog (is_starter) WHERE is_starter;

CREATE TABLE IF NOT EXISTS public.student_pet_wallets (
  student_id       uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  balance          int NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned  int NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent   int NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_coin_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount         int NOT NULL CHECK (amount <> 0),
  balance_after  int NOT NULL CHECK (balance_after >= 0),
  kind           text NOT NULL CHECK (kind IN ('welcome', 'game_reward', 'daily_quest', 'purchase', 'admin_adjustment')),
  source_key     text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_coin_transactions_source
  ON public.pet_coin_transactions (student_id, source_key)
  WHERE source_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_coin_transactions_student_time
  ON public.pet_coin_transactions (student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.student_pets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pet_id       uuid NOT NULL REFERENCES public.pet_catalog(id) ON DELETE RESTRICT,
  nickname     text CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 1 AND 24),
  bond_xp      int NOT NULL DEFAULT 0 CHECK (bond_xp >= 0),
  is_equipped  boolean NOT NULL DEFAULT false,
  acquired_at  timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, pet_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_pets_one_equipped
  ON public.student_pets (student_id) WHERE is_equipped;
CREATE INDEX IF NOT EXISTS idx_student_pets_student
  ON public.student_pets (student_id, acquired_at);

ALTER TABLE public.pet_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_pet_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pet_catalog_public_read ON public.pet_catalog;
CREATE POLICY pet_catalog_public_read ON public.pet_catalog
  FOR SELECT TO anon, authenticated
  USING (is_active OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS pet_catalog_admin_write ON public.pet_catalog;
CREATE POLICY pet_catalog_admin_write ON public.pet_catalog
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS student_pet_wallets_admin_all ON public.student_pet_wallets;
CREATE POLICY student_pet_wallets_admin_all ON public.student_pet_wallets
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS pet_coin_transactions_admin_all ON public.pet_coin_transactions;
CREATE POLICY pet_coin_transactions_admin_all ON public.pet_coin_transactions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS student_pets_admin_all ON public.student_pets;
CREATE POLICY student_pets_admin_all ON public.student_pets
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Explicit grants support projects where new Data API tables are no longer auto-exposed.
GRANT SELECT ON public.pet_catalog TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_pet_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_coin_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_pets TO authenticated;

INSERT INTO public.pet_catalog
  (code, name_th, species_th, description, visual_key, rarity, price, is_starter, sort_order)
VALUES
  ('chang-noi', 'à¸™à¹‰à¸­à¸‡à¸ à¸¹à¸œà¸²', 'à¸Šà¹‰à¸²à¸‡à¹„à¸—à¸¢', 'à¸„à¸¹à¹ˆà¸«à¸¹à¹ƒà¸ˆà¸”à¸µ à¸žà¸£à¹‰à¸­à¸¡à¹€à¸£à¸´à¹ˆà¸¡à¸à¸²à¸£à¸œà¸ˆà¸à¸ à¸±à¸¢à¹„à¸›à¸à¸±à¸šà¸—à¸¸à¸à¸„à¸™', 'elephant', 'common', 0, true, 1),
  ('wichian-cat', 'à¸™à¹‰à¸­à¸‡à¸¡à¸°à¸¥à¸´', 'à¹à¸¡à¸§à¸§à¸´à¹€à¸Šà¸µà¸¢à¸£à¸¡à¸²à¸¨', 'à¸Šà¹ˆà¸²à¸‡à¸ªà¸±à¸‡à¹€à¸à¸•à¹à¸¥à¸°à¸Šà¸­à¸šà¸„à¹‰à¸™à¸«à¸²à¸„à¸³à¸•à¸­à¸šà¹ƒà¸«à¸¡à¹ˆ à¹†', 'cat', 'common', 180, false, 2),
  ('field-rabbit', 'à¸™à¹‰à¸­à¸‡à¸›à¸¸à¸¢à¹€à¸¡à¸†', 'à¸à¸£à¸°à¸•à¹ˆà¸²à¸¢à¸™à¸²', 'à¸„à¸¥à¹ˆà¸­à¸‡à¹à¸„à¸¥à¹ˆà¸§ à¸ªà¸”à¹ƒà¸ª à¹à¸¥à¸°à¹„à¸¡à¹ˆà¸¢à¸­à¸¡à¹à¸žà¹‰à¸‡à¹ˆà¸²à¸¢ à¹†', 'rabbit', 'common', 260, false, 3),
  ('thai-buffalo', 'à¸™à¹‰à¸­à¸‡à¸à¸¥à¹‰à¸²', 'à¸„à¸§à¸²à¸¢à¹„à¸—à¸¢', 'à¸‚à¸¢à¸±à¸™ à¸­à¸”à¸—à¸™ à¹à¸¥à¸°à¸žà¸£à¹‰à¸­à¸¡à¸à¸¶à¸à¸à¸™à¸—à¸¸à¸à¸§à¸±à¸™', 'buffalo', 'rare', 350, false, 4),
  ('hornbill', 'à¸™à¹‰à¸­à¸‡à¸ªà¸²à¸¢à¸£à¸¸à¹‰à¸‡', 'à¸™à¸à¹€à¸‡à¸·à¸­à¸', 'à¸™à¸±à¸à¸ªà¸³à¸£à¸§à¸ˆà¸œà¸¹à¹‰à¸£à¸±à¸à¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´à¹à¸¥à¸°à¸§à¸´à¸—à¸¢à¸²à¸¨à¸²à¸ªà¸•à¸£à¹Œ', 'hornbill', 'rare', 480, false, 5),
  ('betta-fish', 'à¸™à¹‰à¸­à¸‡à¸›à¸£à¸°à¸à¸²à¸¢', 'à¸›à¸¥à¸²à¸à¸±à¸”à¹„à¸—à¸¢', 'à¸„à¸¹à¹ˆà¸«à¸¹à¸ªà¸µà¸ªà¸§à¸¢à¸ªà¸³à¸«à¸£à¸±à¸šà¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¸œà¸¹à¹‰à¸¡à¸¸à¹ˆà¸‡à¸¡à¸±à¹ˆà¸™', 'betta', 'epic', 650, false, 6)
ON CONFLICT (code) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  species_th = EXCLUDED.species_th,
  description = EXCLUDED.description,
  visual_key = EXCLUDED.visual_key,
  rarity = EXCLUDED.rarity,
  price = EXCLUDED.price,
  is_starter = EXCLUDED.is_starter,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.ensure_student_pet_profile(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_created uuid;
BEGIN
  INSERT INTO public.student_pet_wallets (student_id, balance, lifetime_earned)
  VALUES (p_student_id, 200, 200)
  ON CONFLICT (student_id) DO NOTHING
  RETURNING student_id INTO v_created;

  IF v_created IS NOT NULL THEN
    INSERT INTO public.pet_coin_transactions
      (student_id, amount, balance_after, kind, source_key, metadata)
    VALUES
      (p_student_id, 200, 200, 'welcome', 'welcome', jsonb_build_object('label', 'ของขวัญเริ่มต้น'))
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.student_pets (student_id, pet_id, is_equipped)
  SELECT p_student_id, p.id,
    NOT EXISTS (SELECT 1 FROM public.student_pets x WHERE x.student_id = p_student_id AND x.is_equipped)
  FROM public.pet_catalog p
  WHERE p.is_starter AND p.is_active
  ON CONFLICT (student_id, pet_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION private.build_student_pet_state(p_student_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'student_id', p_student_id,
    'balance', w.balance,
    'lifetime_earned', w.lifetime_earned,
    'lifetime_spent', w.lifetime_spent,
    'equipped', (
      SELECT jsonb_build_object(
        'code', p.code,
        'name_th', p.name_th,
        'species_th', p.species_th,
        'visual_key', p.visual_key,
        'rarity', p.rarity,
        'nickname', sp.nickname,
        'bond_xp', sp.bond_xp
      )
      FROM public.student_pets sp
      JOIN public.pet_catalog p ON p.id = sp.pet_id
      WHERE sp.student_id = p_student_id AND sp.is_equipped
      LIMIT 1
    ),
    'catalog', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', p.code,
        'name_th', p.name_th,
        'species_th', p.species_th,
        'description', p.description,
        'visual_key', p.visual_key,
        'rarity', p.rarity,
        'price', p.price,
        'owned', (sp.id IS NOT NULL),
        'equipped', COALESCE(sp.is_equipped, false),
        'nickname', sp.nickname,
        'bond_xp', COALESCE(sp.bond_xp, 0)
      ) ORDER BY p.sort_order, p.price, p.name_th)
      FROM public.pet_catalog p
      LEFT JOIN public.student_pets sp
        ON sp.pet_id = p.id AND sp.student_id = p_student_id
      WHERE p.is_active
    ), '[]'::jsonb)
  )
  FROM public.student_pet_wallets w
  WHERE w.student_id = p_student_id;
$function$;

REVOKE ALL ON FUNCTION private.ensure_student_pet_profile(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.build_student_pet_state(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_student_pet_state(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_student_id uuid;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'PET_STUDENT_NOT_FOUND';
  END IF;

  PERFORM private.ensure_student_pet_profile(v_student_id);
  RETURN private.build_student_pet_state(v_student_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.buy_student_pet(p_student_code text, p_pet_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_student_id uuid;
  v_pet public.pet_catalog%ROWTYPE;
  v_balance int;
BEGIN
  IF p_pet_code IS NULL OR p_pet_code !~ '^[a-z0-9-]{2,40}$' THEN
    RAISE EXCEPTION 'PET_INVALID_CODE';
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1
  FOR UPDATE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'PET_STUDENT_NOT_FOUND';
  END IF;

  SELECT * INTO v_pet
  FROM public.pet_catalog
  WHERE code = p_pet_code AND is_active
  LIMIT 1;

  IF v_pet.id IS NULL THEN
    RAISE EXCEPTION 'PET_NOT_FOUND';
  END IF;

  PERFORM private.ensure_student_pet_profile(v_student_id);

  IF EXISTS (
    SELECT 1 FROM public.student_pets
    WHERE student_id = v_student_id AND pet_id = v_pet.id
  ) THEN
    RETURN private.build_student_pet_state(v_student_id)
      || jsonb_build_object('action', 'already_owned');
  END IF;

  SELECT balance INTO v_balance
  FROM public.student_pet_wallets
  WHERE student_id = v_student_id
  FOR UPDATE;

  IF v_balance < v_pet.price THEN
    RAISE EXCEPTION 'PET_INSUFFICIENT_COINS';
  END IF;

  UPDATE public.student_pet_wallets
  SET balance = balance - v_pet.price,
      lifetime_spent = lifetime_spent + v_pet.price,
      updated_at = now()
  WHERE student_id = v_student_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.pet_coin_transactions
    (student_id, amount, balance_after, kind, source_key, metadata)
  VALUES
    (v_student_id, -v_pet.price, v_balance, 'purchase', 'purchase:' || v_pet.code,
     jsonb_build_object('pet_code', v_pet.code, 'pet_name', v_pet.name_th));

  INSERT INTO public.student_pets (student_id, pet_id, is_equipped)
  VALUES (v_student_id, v_pet.id, false);

  RETURN private.build_student_pet_state(v_student_id)
    || jsonb_build_object('action', 'purchased', 'pet_code', v_pet.code);
END;
$function$;

CREATE OR REPLACE FUNCTION public.equip_student_pet(p_student_code text, p_pet_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_student_id uuid;
  v_pet_id uuid;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1
  FOR UPDATE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'PET_STUDENT_NOT_FOUND';
  END IF;

  PERFORM private.ensure_student_pet_profile(v_student_id);

  SELECT sp.pet_id INTO v_pet_id
  FROM public.student_pets sp
  JOIN public.pet_catalog p ON p.id = sp.pet_id
  WHERE sp.student_id = v_student_id
    AND p.code = p_pet_code
    AND p.is_active
  LIMIT 1;

  IF v_pet_id IS NULL THEN
    RAISE EXCEPTION 'PET_NOT_OWNED';
  END IF;

  UPDATE public.student_pets
  SET is_equipped = false, updated_at = now()
  WHERE student_id = v_student_id AND is_equipped;

  UPDATE public.student_pets
  SET is_equipped = true, updated_at = now()
  WHERE student_id = v_student_id AND pet_id = v_pet_id;

  RETURN private.build_student_pet_state(v_student_id)
    || jsonb_build_object('action', 'equipped', 'pet_code', p_pet_code);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_student_pet_state(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.buy_student_pet(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.equip_student_pet(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_pet_state(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buy_student_pet(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.equip_student_pet(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.award_pet_coins_from_game_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_today_count int;
  v_amount int;
  v_balance int;
BEGIN
  SELECT count(*) INTO v_today_count
  FROM public.game_sessions gs
  WHERE gs.student_id = NEW.student_id
    AND (gs.created_at AT TIME ZONE 'Asia/Bangkok')::date =
        (NEW.created_at AT TIME ZONE 'Asia/Bangkok')::date;

  -- Reward only the first three recorded rounds per Bangkok day to limit farming.
  IF v_today_count > 3 THEN
    RETURN NEW;
  END IF;

  v_amount := LEAST(20, GREATEST(5, COALESCE(NEW.xp_earned, 0) / 2));
  PERFORM private.ensure_student_pet_profile(NEW.student_id);

  UPDATE public.student_pet_wallets
  SET balance = balance + v_amount,
      lifetime_earned = lifetime_earned + v_amount,
      updated_at = now()
  WHERE student_id = NEW.student_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.pet_coin_transactions
    (student_id, amount, balance_after, kind, source_key, metadata)
  VALUES
    (NEW.student_id, v_amount, v_balance, 'game_reward', 'game_session:' || NEW.id::text,
     jsonb_build_object('game_slug', NEW.game_slug, 'session_id', NEW.id));

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.award_pet_coins_from_daily_quest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_amount int;
  v_balance int;
BEGIN
  IF NOT NEW.all_complete OR COALESCE(NEW.bonus_points, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.all_complete, false) THEN
    RETURN NEW;
  END IF;

  v_amount := NEW.bonus_points;
  PERFORM private.ensure_student_pet_profile(NEW.student_id);

  IF EXISTS (
    SELECT 1 FROM public.pet_coin_transactions
    WHERE student_id = NEW.student_id
      AND source_key = 'daily_quest:' || NEW.challenge_date::text
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.student_pet_wallets
  SET balance = balance + v_amount,
      lifetime_earned = lifetime_earned + v_amount,
      updated_at = now()
  WHERE student_id = NEW.student_id
  RETURNING balance INTO v_balance;

  INSERT INTO public.pet_coin_transactions
    (student_id, amount, balance_after, kind, source_key, metadata)
  VALUES
    (NEW.student_id, v_amount, v_balance, 'daily_quest', 'daily_quest:' || NEW.challenge_date::text,
     jsonb_build_object('challenge_date', NEW.challenge_date));

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.award_pet_coins_from_game_session() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.award_pet_coins_from_daily_quest() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_award_pet_coins_game_session ON public.game_sessions;
CREATE TRIGGER trg_award_pet_coins_game_session
AFTER INSERT ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION private.award_pet_coins_from_game_session();

DROP TRIGGER IF EXISTS trg_award_pet_coins_daily_quest ON public.daily_quest_days;
CREATE TRIGGER trg_award_pet_coins_daily_quest
AFTER INSERT OR UPDATE OF all_complete, bonus_points ON public.daily_quest_days
FOR EACH ROW EXECUTE FUNCTION private.award_pet_coins_from_daily_quest();

-- Existing active students receive a starter companion, a 200-coin welcome grant,
-- and retain already-earned daily quest points as spendable Star Coins.
WITH quest_totals AS (
  SELECT student_id, COALESCE(sum(bonus_points), 0)::int AS points
  FROM public.daily_quest_days
  WHERE all_complete
  GROUP BY student_id
)
INSERT INTO public.student_pet_wallets (student_id, balance, lifetime_earned)
SELECT s.id, 200 + COALESCE(q.points, 0), 200 + COALESCE(q.points, 0)
FROM public.students s
LEFT JOIN quest_totals q ON q.student_id = s.id
WHERE s.is_active IS NOT FALSE
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.pet_coin_transactions
  (student_id, amount, balance_after, kind, source_key, metadata)
SELECT w.student_id, 200, 200, 'welcome', 'welcome', jsonb_build_object('label', 'ของขวัญเริ่มต้น')
FROM public.student_pet_wallets w
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_coin_transactions
  (student_id, amount, balance_after, kind, source_key, metadata)
SELECT q.student_id, q.points, 200 + q.points, 'daily_quest', 'daily_quest:history',
       jsonb_build_object('label', 'คะแนนภารกิจสะสมก่อนเปิดระบบ')
FROM (
  SELECT student_id, COALESCE(sum(bonus_points), 0)::int AS points
  FROM public.daily_quest_days
  WHERE all_complete
  GROUP BY student_id
) q
WHERE q.points > 0
ON CONFLICT DO NOTHING;

INSERT INTO public.student_pets (student_id, pet_id, is_equipped)
SELECT w.student_id, p.id, true
FROM public.student_pet_wallets w
CROSS JOIN public.pet_catalog p
WHERE p.is_starter AND p.is_active
ON CONFLICT (student_id, pet_id) DO NOTHING;
