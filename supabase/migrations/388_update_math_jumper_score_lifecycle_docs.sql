-- 388: Math Jumper score lifecycle + cover + game_docs v1.0.1
-- Note: do not restore game_slug on the legacy static row; migration 095 intentionally
-- untracked that row to avoid duplicate math-jumper tracking records.
DO $$
DECLARE
  v_url   TEXT := '/games/math/math-jumper.html';
  v_thumb TEXT := '/games/math/math-jumper-cover.svg';
  v_item  RECORD;
BEGIN
  UPDATE public.educational_hub_items
  SET
    thumbnail_url = v_thumb,
    description = COALESCE(
      NULLIF(description, ''),
      'เกมกระโดดเลือกคำตอบคณิตศาสตร์ บวก ลบ คูณ หาร พร้อม leaderboard และผลลัพธ์คะแนนในพอร์ทัล'
    ),
    updated_at = now()
  WHERE external_url = v_url;

  FOR v_item IN
    SELECT id, owner_staff_id
    FROM public.educational_hub_items
    WHERE external_url = v_url
  LOOP
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item.id,
      v_item.owner_staff_id,
      'เกม platform jumper คณิตศาสตร์ — กระโดดเลือกแพลตฟอร์มคำตอบให้ตรงโจทย์',
      ARRAY[
        'แก้ lifecycle คะแนน: เรียก KAMPAI.setSlug + beginRound ทุกครั้งก่อนเริ่มรอบ เพื่อให้เล่นซ้ำแล้วยังส่งคะแนนได้',
        'เพิ่ม #kampai-result ในจอจบเกมเพื่อให้ wrapper แสดง XP/ผลลัพธ์จากพอร์ทัล',
        'แก้บั๊กโจทย์รอบแรก: สุ่มโจทย์ก่อนสร้างแพลตฟอร์ม เพื่อให้คำตอบบนแถวแรกตรงกับโจทย์บนจอ',
        'ส่ง metadata คะแนน: duration, height, difficulty, correctAnswers, wrongAnswers, itemsCollected',
        'เพิ่ม KampaiVersus พื้นฐานสำหรับแข่ง 2 คน พร้อม seeded RNG สำหรับโจทย์และแพลตฟอร์ม'
      ],
      'v1.0.1',
      'Bugfix pass: gameplay answer sync + scoring lifecycle + score submission guard (migration 388)'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END LOOP;
END $$;
