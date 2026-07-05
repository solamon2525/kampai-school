-- 342: game_docs สำหรับสื่อการสอน (ชิ้นที่ยังไม่มี)

DO $$
DECLARE
  v_staff_id UUID;
  rec RECORD;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  FOR rec IN
    SELECT * FROM (VALUES
      ('/games/math/rounding.html', 'สื่อค่าประมาณ', ARRAY['โหมดหลักสิบ/ร้อย/พัน/ทศนิยม','แสดงเฉลยพร้อมคำอธิบาย','ไม่เก็บคะแนน'], 'v1.1.0', 'เพิ่มโหมดทศนิยม ป.4'),
      ('/games/math/fraction-pieces.html', 'สื่อเศษส่วนชิ้น', ARRAY['แท่งเศษส่วน','เทียบเศษส่วน','โหมดฝึก'], 'v1.0.0', 'media'),
      ('/games/math/times-table.html', 'ตารางสูตรคูณ', ARRAY['ตาราง 2-12','โหมดฝึกจำ','TTS'], 'v1.0.0', 'media'),
      ('/games/thai/thai-sara-chart.html', 'แผนภาพสระไทย', ARRAY['สระทั้งหมด','แตะฟัง','ป.1-2'], 'v1.0.0', 'media'),
      ('/games/thai/thai-matra-chart.html', 'มาตราตัวสะกด', ARRAY['กฎมาตรา','ตัวอย่างคำ','ป.1-3'], 'v1.0.0', 'media'),
      ('/games/thai/thai-word-types.html', 'ชนิดของคำ ป.3-4', ARRAY['นาม กริยา คุณศัพท์','โหมดฝึก/จัดกล่อง','โหมดสำนวน'], 'v1.1.0', 'เพิ่มสำนวน'),
      ('/games/english/phonics-chart.html', 'Phonics chart', ARRAY['เสียงตัวอักษร','แตะฟัง','ป.1-3'], 'v1.0.0', 'media'),
      ('/games/english/grammar-mini.html', 'Grammar mini', ARRAY['is/are','a/an','this/that/these/those'], 'v1.1.0', 'E3 demonstratives'),
      ('/games/science/water-cycle.html', 'วัฏจักรน้ำ', ARRAY['ขั้นคลิก','เรียงลำดับ','ป.3-5'], 'v1.0.0', 'media'),
      ('/games/math/decimal-media.html', 'ทศนิยมสาธิต', ARRAY['อ่าน/เปรียบเทียบ/บวกลบ','โหมดฝึก','ป.4'], 'v1.0.0', 'batch1'),
      ('/games/science/states-of-matter.html', 'สสาร 3 สถานะ', ARRAY['ของแข็ง/ของเหลว/แก๊ส','สไลเดอร์อุณหภูมิ','ป.4'], 'v1.0.0', 'batch1'),
      ('/games/social/thailand-map.html', 'แผนที่จังหวัด', ARRAY['แตะภาค','จังหวัดตัวอย่าง','ป.4'], 'v1.0.0', 'batch1'),
      ('/games/english/sight-words-p4.html', 'Sight Words ป.4', ARRAY['24 คำ','แฟลชการ์ด','ป.4'], 'v1.0.0', 'batch1'),
      ('/games/thai/fact-opinion.html', 'ข้อเท็จจริง vs ความคิดเห็น', ARRAY['จำแนก','โหมดฝึก','ป.4'], 'v1.0.0', 'batch2'),
      ('/games/math/bar-chart-media.html', 'แผนภูมิแท่ง', ARRAY['กรอกข้อมูล','อ่านกราฟ','ป.4'], 'v1.0.0', 'batch2'),
      ('/games/social/good-citizen-media.html', 'พลเมืองดี', ARRAY['สถานการณ์','เลือกพฤติกรรม','ป.4'], 'v1.0.0', 'batch2'),
      ('/games/science/vertebrate-sort.html', 'จำแนกสัตว์', ARRAY['มี/ไม่มีกระดูกสันหลัง','จัดกลุ่ม','ป.4'], 'v1.0.0', 'batch2'),
      ('/games/math/angle-media.html', 'มุม', ARRAY['แหลม/ฉาก/ป้าน','โพรแทรกเตอร์','ป.4'], 'v1.0.0', 'batch3'),
      ('/games/social/sukhothai-timeline.html', 'สมัยสุโขทัย', ARRAY['ไทม์ไลน์','บุคคลสำคัญ','ป.4'], 'v1.0.0', 'batch3'),
      ('/games/health/food-label-media.html', 'อ่านฉลากอาหาร', ARRAY['สารอาหาร','วันหมดอายุ','ป.4'], 'v1.0.0', 'batch3'),
      ('/games/english/follow-instructions.html', 'Follow Instructions', ARRAY['ฟัง/อ่านคำสั่ง','เลือกภาพ','ป.4'], 'v1.0.0', 'batch3'),
      ('/games/math/number-line-media.html', 'เส้นจำนวน', ARRAY['ลากจุด','เปรียบเทียบ','ป.1-3'], 'v1.0.0', 'M1'),
      ('/games/science/digestive-system-media.html', 'ระบบย่อยอาหาร', ARRAY['แผนภาพคลิก','เรียงลำดับ','ป.4-6'], 'v1.0.0', 'S2'),
      ('/games/health/handwash-media.html', 'ล้างมือ 7 ขั้น', ARRAY['เรียงขั้นตอน','สไลด์เรียน','ป.1-3'], 'v1.0.0', 'O3')
    ) AS t(url, fmt, feats, ver, notes)
  LOOP
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    SELECT ehi.id, v_staff_id, rec.fmt, rec.feats, rec.ver, rec.notes
    FROM public.educational_hub_items ehi
    WHERE ehi.external_url = rec.url AND ehi.owner_staff_id = v_staff_id
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features = EXCLUDED.features,
          version = EXCLUDED.version,
          notes = EXCLUDED.notes,
          updated_at = now();
  END LOOP;
END $$;
