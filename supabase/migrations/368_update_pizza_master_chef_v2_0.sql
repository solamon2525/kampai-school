-- 368: Pizza Master Chef v2.0.0 — โหมดภารกิจเชฟ + ฝึกซ้ำอัตโนมัติ + ออเดอร์คำไทย
DO $$
DECLARE
  v_url TEXT := '/games/thai/pizza-master-chef.html';
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT id, owner_staff_id FROM public.educational_hub_items WHERE external_url = v_url
  LOOP
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item.id,
      v_item.owner_staff_id,
      'เกมเศษส่วนสไตล์ร้านพิซซ่า — แตะชิ้นให้ตรงออเดอร์ หลายโหมด + ภารกิจสลับแบบ',
      ARRAY[
        'โหมดภารกิจเชฟ (แนะนำ): สลับ 4 แบบ — หั่นตามสั่ง / เติมให้เต็มถาด / เทียบเศษส่วน / สมมูล',
        'โหมดคลาสสิก: ออเดอร์เป็นคำไทย (ครึ่งถาด ฯลฯ) + ฝึกซ้ำเศษที่เคยพลาดอัตโนมัติ',
        'โหมดอื่น: คลาสสิก, หน้าฮาล์ฟ, ส่งด่วน, สปีด, จำนวนคละ, สมมูล, เทียบ, Daily',
        'ระดับชั้น ป.1-3 / ป.4-6 · โหมดฝึก (ไม่จับเวลา) · รูปเศษส่วนวงกลม',
        'Wave + บอส · VIP/ลูกค้าโกรธ/กลุ่ม · Fever combo · เฉลยสีเขียวเมื่อพลาด',
        'Diagnostic จบเกม · KAMPAI.beginRound + submitScore'
      ],
      'v2.0.0',
      'Phase 2 engagement: mission mode + adaptive spaced repetition + Thai word orders (migration 368)'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END LOOP;
END $$;
