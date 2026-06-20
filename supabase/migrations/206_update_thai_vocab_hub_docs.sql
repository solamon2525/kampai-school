-- ============================================================================
-- Migration 206: Update game_docs for "Thai Vocab Hub" (thai-vocab-hub)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- เหตุผล: ขยายคลังคำศัพท์ ป.4 → ป.4-6 เป็น 15 หมวด ~596 คำ (เดิม 10 หมวด ~169 คำ)
--         เพิ่ม 5 หมวดใหม่: มาตราตัวสะกด, คำพ้องความหมาย, คำตรงข้าม,
--         คำเป็น-คำตาย, คำซ้ำ-คำซ้อน  → bump v1.0.0 → v1.1.0
-- Idempotent: re-run keeps specification updated (ON CONFLICT DO UPDATE)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_item_id   UUID;
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve item
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'thai-vocab-hub';

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item "thai-vocab-hub" not found';
  END IF;

  -- 3. Upsert game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'การ์ดคำศัพท์ภาษาไทย ป.4-6 ทบทวนสะกดคำ ความหมาย และหลักภาษา',
    ARRAY[
      'คลังคำศัพท์ 15 หมวด ~596 คำ (ป.4-6)',
      '10 หมวดเดิม: มักเขียนผิด, พ้องรูปพ้องเสียง, ลักษณนาม, ราชาศัพท์, สำนวน, ควบกล้ำ, อักษรนำ, ภาษาพาที, คำยาก, คำต่างประเทศ',
      '5 หมวดใหม่: มาตราตัวสะกด, คำพ้องความหมาย (ไวพจน์), คำตรงข้าม, คำเป็น-คำตาย, คำซ้ำ-คำซ้อน',
      'ทบทวนคำศัพท์ + เขียนตามคำบอกด้วยเสียงอ่าน TTS',
      'ทายความหมายจากนิยาม + จับคู่คำกับคำอ่าน',
      'สังเคราะห์เสียงพูดภาษาไทยผ่าน Web Speech API'
    ],
    'v1.1.0',
    'ขยายเป็น 15 หมวด ~596 คำ (ป.4-6) — เพิ่ม 5 หมวดหลักภาษา และเติมคำหมวดเดิมเป็นหมวดละ ~40 คำ'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

  -- 4. Sync item title ป.4 → ป.4-6
  UPDATE public.educational_hub_items
  SET title = '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
      updated_at = now()
  WHERE id = v_item_id;
END $$;
