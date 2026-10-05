-- 570_student_pet_v2.sql
-- Upgrades student pet companion: nickname customization, pet interactions (feed/pet), bond XP, and cross-platform companion display

-- 1. Helper function to calculate friendship tier
CREATE OR REPLACE FUNCTION public.pet_friendship_level(p_bond_xp INT)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_bond_xp, 0) >= 1000 THEN jsonb_build_object('level', 5, 'title', 'สหายตลอดกาล 👑', 'progress', 1.0, 'next_xp', 1000)
    WHEN COALESCE(p_bond_xp, 0) >= 600  THEN jsonb_build_object('level', 4, 'title', 'ยอดคู่หูผู้พิทักษ์ 🛡️', 'progress', (COALESCE(p_bond_xp, 0) - 600)::float / 400.0, 'next_xp', 1000)
    WHEN COALESCE(p_bond_xp, 0) >= 300  THEN jsonb_build_object('level', 3, 'title', 'คู่หูรู้ใจ ⭐', 'progress', (COALESCE(p_bond_xp, 0) - 300)::float / 300.0, 'next_xp', 600)
    WHEN COALESCE(p_bond_xp, 0) >= 100  THEN jsonb_build_object('level', 2, 'title', 'เพื่อนสนิท 🤝', 'progress', (COALESCE(p_bond_xp, 0) - 100)::float / 200.0, 'next_xp', 300)
    ELSE jsonb_build_object('level', 1, 'title', 'เพื่อนใหม่ 🌱', 'progress', COALESCE(p_bond_xp, 0)::float / 100.0, 'next_xp', 100)
  END;
$$;

-- 2. Upgrade private.build_student_pet_state to include friendship info
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
        'bond_xp', sp.bond_xp,
        'friendship', public.pet_friendship_level(sp.bond_xp)
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
        'bond_xp', COALESCE(sp.bond_xp, 0),
        'friendship', public.pet_friendship_level(COALESCE(sp.bond_xp, 0))
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

-- 3. Set Pet Nickname RPC
CREATE OR REPLACE FUNCTION public.set_student_pet_nickname(
  p_student_code TEXT,
  p_pet_code TEXT,
  p_nickname TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_id UUID;
  v_pet_id UUID;
  v_clean_nick TEXT;
BEGIN
  v_clean_nick := NULLIF(btrim(p_nickname), '');
  IF v_clean_nick IS NOT NULL AND char_length(v_clean_nick) > 24 THEN
    RAISE EXCEPTION 'PET_NICKNAME_TOO_LONG';
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'PET_STUDENT_NOT_FOUND';
  END IF;

  SELECT sp.pet_id INTO v_pet_id
  FROM public.student_pets sp
  JOIN public.pet_catalog p ON p.id = sp.pet_id
  WHERE sp.student_id = v_student_id
    AND p.code = p_pet_code
  LIMIT 1;

  IF v_pet_id IS NULL THEN
    RAISE EXCEPTION 'PET_NOT_OWNED';
  END IF;

  UPDATE public.student_pets
  SET nickname = v_clean_nick, updated_at = NOW()
  WHERE student_id = v_student_id AND pet_id = v_pet_id;

  RETURN private.build_student_pet_state(v_student_id)
    || jsonb_build_object('action', 'nickname_updated', 'nickname', v_clean_nick);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_student_pet_nickname(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. Pet Interaction RPC (Feed, Pet, Cheer)
CREATE OR REPLACE FUNCTION public.interact_student_pet(
  p_student_code TEXT,
  p_action TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_id UUID;
  v_xp_gain INT := 5;
  v_equipped_pet RECORD;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'PET_STUDENT_NOT_FOUND';
  END IF;

  SELECT sp.id, sp.bond_xp, p.name_th, COALESCE(sp.nickname, p.name_th) AS display_name
  INTO v_equipped_pet
  FROM public.student_pets sp
  JOIN public.pet_catalog p ON p.id = sp.pet_id
  WHERE sp.student_id = v_student_id AND sp.is_equipped = true
  LIMIT 1;

  IF v_equipped_pet.id IS NULL THEN
    RAISE EXCEPTION 'PET_NOT_EQUIPPED';
  END IF;

  IF p_action = 'feed' THEN
    v_xp_gain := 15;
  ELSIF p_action = 'pet' THEN
    v_xp_gain := 5;
  ELSIF p_action = 'cheer' THEN
    v_xp_gain := 8;
  ELSE
    v_xp_gain := 5;
  END IF;

  UPDATE public.student_pets
  SET bond_xp = bond_xp + v_xp_gain, updated_at = NOW()
  WHERE id = v_equipped_pet.id;

  RETURN private.build_student_pet_state(v_student_id)
    || jsonb_build_object('action', 'interacted', 'xp_gained', v_xp_gain, 'action_type', p_action);
END;
$$;

GRANT EXECUTE ON FUNCTION public.interact_student_pet(TEXT, TEXT) TO anon, authenticated;

-- 5. Cross-platform RPC: Get equipped pet for a student (by UUID or student_code)
CREATE OR REPLACE FUNCTION public.get_student_companion(p_identifier TEXT)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_id UUID;
  v_result jsonb;
BEGIN
  IF p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := p_identifier::UUID;
  ELSE
    SELECT id INTO v_student_id
    FROM public.students
    WHERE btrim(student_code) = btrim(p_identifier)
    LIMIT 1;
  END IF;

  IF v_student_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'code', p.code,
    'name_th', p.name_th,
    'species_th', p.species_th,
    'visual_key', p.visual_key,
    'rarity', p.rarity,
    'nickname', sp.nickname,
    'display_name', COALESCE(sp.nickname, p.name_th),
    'bond_xp', sp.bond_xp,
    'friendship', public.pet_friendship_level(sp.bond_xp)
  )
  INTO v_result
  FROM public.student_pets sp
  JOIN public.pet_catalog p ON p.id = sp.pet_id
  WHERE sp.student_id = v_student_id AND sp.is_equipped = true
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_companion(TEXT) TO anon, authenticated;
