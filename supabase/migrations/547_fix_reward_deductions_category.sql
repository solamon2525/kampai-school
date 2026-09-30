-- ===============================================================
-- Migration 547: Fix Reward Deductions Category and Honor Score Calculations
-- 1. Correct misclassified manual reward deductions (category = 'reward')
-- 2. Update claim_reward, lookup_student_balance, get_top_heroes to exclude category = 'reward' from honor demerits
-- ===============================================================

-- 1. อัปเดตรายการหักคะแนนที่ระบุเหตุผลว่า รับรางวัล / แลกรางวัล ให้เป็น category = 'reward'
UPDATE public.conduct_scores
SET category = 'reward'
WHERE category != 'reward'
  AND (
    reason ILIKE '%รับรางวัล%'
    OR reason ILIKE '%แลกรางวัล%'
    OR reason ILIKE '%แลกของรางวัล%'
  );

-- 2. ปรับปรุง claim_reward ให้คำนวณคะแนนเกียรติยศและคะแนนแลกของรางวัลอย่างถูกต้อง
CREATE OR REPLACE FUNCTION public.claim_reward(p_code text, p_reward_id uuid, p_quantity integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id uuid;
  v_reward record;
  v_claim_id uuid;
  v_year text;
  v_sem text;
  v_waste_balance integer;
  v_virtue_earned integer;
  v_virtue_spent integer;
  v_virtue_balance integer;
  v_waste_total integer;
  v_virtue_total integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
  END IF;

  SELECT year, sem INTO v_year, v_sem FROM public.active_term();

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = p_code AND s.is_active = true
  FOR UPDATE;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT r.id, r.name, r.waste_points_cost, r.virtue_points_cost, r.stock, r.is_active
  INTO v_reward
  FROM public.rewards r
  WHERE r.id = p_reward_id
  FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT GREATEST(0, COALESCE(w.available_points, 0))::integer
  INTO v_waste_balance
  FROM public.waste_student_summary w
  WHERE w.student_id = v_student_id;

  -- 1. คะแนนความดีสะสมเกียรติยศ (หักเฉพาะพฤติกรรม ไม่หักการแลกของรางวัล)
  SELECT GREATEST(0, COALESCE(SUM(
    CASE 
      WHEN cs.type = 'add' THEN cs.score 
      WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score 
      ELSE 0 
    END
  ), 0))::integer
  INTO v_virtue_earned
  FROM public.conduct_scores cs
  WHERE cs.student_id = v_student_id AND cs.academic_year = v_year;

  -- 2. คะแนนความดีที่ใช้แลกของรางวัลไปแล้วทั้งหมด (ทั้ง approved ใน conduct_scores และ pending ใน reward_claims)
  SELECT (
    COALESCE((
      SELECT SUM(cs.score)
      FROM public.conduct_scores cs
      WHERE cs.student_id = v_student_id
        AND cs.academic_year = v_year
        AND (cs.reward_claim_id IS NOT NULL OR cs.category = 'reward')
    ), 0) +
    COALESCE((
      SELECT SUM(rc.virtue_points_used)
      FROM public.reward_claims rc
      WHERE rc.student_id = v_student_id
        AND rc.academic_year = v_year
        AND rc.status = 'pending'::public.reward_claim_status
    ), 0)
  )::integer
  INTO v_virtue_spent;

  v_waste_balance := COALESCE(v_waste_balance, 0);
  v_virtue_balance := GREATEST(0, v_virtue_earned - v_virtue_spent);
  v_waste_total := v_reward.waste_points_cost * p_quantity;
  v_virtue_total := v_reward.virtue_points_cost * p_quantity;

  IF v_waste_balance < v_waste_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_WASTE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_virtue_balance < v_virtue_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_VIRTUE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_reward.stock IS NOT NULL AND v_reward.stock < p_quantity THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reward_claims (
    student_id, reward_id, reward_name, points_used, quantity, status,
    academic_year, semester, balance_after,
    waste_points_used, virtue_points_used, waste_balance_after, virtue_balance_after
  ) VALUES (
    v_student_id, v_reward.id, v_reward.name, v_waste_total, p_quantity, 'pending',
    v_year, v_sem, v_waste_balance - v_waste_total,
    v_waste_total, v_virtue_total, v_waste_balance - v_waste_total,
    v_virtue_balance - v_virtue_total
  ) RETURNING id INTO v_claim_id;

  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards
    SET stock = v_reward.stock - p_quantity, updated_at = now()
    WHERE id = p_reward_id;
  END IF;

  RETURN v_claim_id;
END;
$function$;

-- 3. ปรับปรุง lookup_student_balance ให้ส่งคืนคะแนนสะสมเกียรติยศและคะแนนพร้อมแลกอย่างถูกต้อง
CREATE OR REPLACE FUNCTION public.lookup_student_balance(p_code text)
 RETURNS TABLE(
   student_id uuid, full_name text, class_name text, photo_url text, 
   waste_points_earned integer, waste_points_available integer, 
   virtue_points_earned integer, virtue_points_spent integer, 
   virtue_points_available integer, virtue_academic_year text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH term AS (SELECT year FROM public.active_term()),
  virtue AS (
    SELECT
      s.id AS student_id,
      GREATEST(0, COALESCE(SUM(
        CASE 
          WHEN cs.type = 'add' THEN cs.score 
          WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score 
          ELSE 0 
        END
      ), 0))::integer AS earned
    FROM public.students s
    CROSS JOIN term t
    LEFT JOIN public.conduct_scores cs
      ON cs.student_id = s.id AND cs.academic_year = t.year
    WHERE s.student_code = p_code AND s.is_active = true
    GROUP BY s.id
  ), spent_rewards AS (
    SELECT
      s.id AS student_id,
      (
        COALESCE((
          SELECT SUM(cs.score)
          FROM public.conduct_scores cs
          WHERE cs.student_id = s.id
            AND cs.academic_year = t.year
            AND (cs.reward_claim_id IS NOT NULL OR cs.category = 'reward')
        ), 0) +
        COALESCE((
          SELECT SUM(rc.virtue_points_used)
          FROM public.reward_claims rc
          WHERE rc.student_id = s.id
            AND rc.academic_year = t.year
            AND rc.status = 'pending'::public.reward_claim_status
        ), 0)
      )::integer AS spent
    FROM public.students s
    CROSS JOIN term t
    WHERE s.student_code = p_code AND s.is_active = true
  )
  SELECT
    w.student_id,
    w.full_name,
    w.class_name,
    w.photo_url,
    COALESCE(w.total_points_earned, 0)::integer,
    GREATEST(0, COALESCE(w.available_points, 0))::integer,
    v.earned,
    sr.spent,
    GREATEST(0, v.earned - sr.spent)::integer,
    t.year
  FROM public.waste_student_summary w
  JOIN virtue v ON v.student_id = w.student_id
  JOIN spent_rewards sr ON sr.student_id = w.student_id
  CROSS JOIN term t
  WHERE w.student_code = p_code
  LIMIT 1
$function$;

-- 4. ปรับปรุง RPC get_top_heroes:
-- total_xp คำนวณเฉพาะคะแนนเกียรติยศ (ไม่หักรายการแลกของรางวัล reward)
CREATE OR REPLACE FUNCTION public.get_top_heroes(
  limit_val int DEFAULT 10,
  p_academic_year text DEFAULT NULL,
  p_semester text DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  name TEXT,
  class TEXT,
  photo_url TEXT,
  total_xp BIGINT,
  deeds_count BIGINT,
  available_points BIGINT
) SECURITY DEFINER AS $$
DECLARE
  v_year TEXT := p_academic_year;
BEGIN
  IF v_year IS NULL THEN
    SELECT year INTO v_year FROM public.active_term();
    v_year := COALESCE(v_year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
  END IF;

  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name,
    s.class,
    s.photo_url,
    -- 1. คะแนนความดีสะสมเกียรติยศ (หักเฉพาะพฤติกรรม ไม่หักการแลกของรางวัล)
    COALESCE(SUM(
      CASE 
        WHEN cs.type = 'add' THEN cs.score 
        WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score 
        ELSE 0 
      END
    ), 0)::BIGINT as total_xp,
    
    -- จำนวนครั้งที่ทำความดี
    COALESCE(COUNT(cs.id) FILTER (WHERE cs.type = 'add'), 0)::BIGINT as deeds_count,
    
    -- 2. คะแนนคงเหลือพร้อมแลกจริง (หักทั้งพฤติกรรมและการแลกของรางวัล)
    GREATEST(0, COALESCE(SUM(
      CASE 
        WHEN cs.type = 'add' THEN cs.score 
        ELSE -cs.score 
      END
    ), 0))::BIGINT as available_points
  FROM public.students s
  LEFT JOIN public.conduct_scores cs ON s.id = cs.student_id 
    AND cs.academic_year = v_year
    AND (p_semester IS NULL OR cs.semester = p_semester)
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.class, s.photo_url
  HAVING COALESCE(SUM(
    CASE 
      WHEN cs.type = 'add' THEN cs.score 
      WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score 
      ELSE 0 
    END
  ), 0) > 0
  ORDER BY total_xp DESC, deeds_count DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_top_heroes(int, text, text) TO anon, authenticated;
