-- 426: เพิ่มโหมดฝึกสั้น (MCQ) ในสื่อ food-chain / digestive / handwash — sync game_docs

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/science/food-chain-media.html',
     'ห่วงโซ่อาหาร',
     ARRAY['อธิบายผู้ผลิต/ผู้บริโภค/ผู้ล่า', 'ตัวอย่างระบบนิเวศไทย', 'เรียงโซ่ตามพลังงาน', 'ฝึกสั้น MCQ บทบาท+ทิศพลังงาน', 'คู่ food-chain'],
     'v1.1.0',
     'S4 · ว 1.1 ป.5/3 · เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/science/digestive-system-media.html',
     'ระบบย่อยอาหาร',
     ARRAY['แผนภาพคลิก', 'เรียงเส้นทาง', 'ฝึกสั้น MCQ ลำดับ+หน้าที่อวัยวะ', 'ป.4-6'],
     'v1.1.0',
     'S2 · ว 1.2 ป.6/4 · เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/health/handwash-media.html',
     'ล้างมือ 7 ขั้น',
     ARRAY['สไลด์เรียน', 'เรียงขั้นตอน', 'ฝึกสั้น MCQ ขั้นถัดไป+เหตุผลสบู่', 'ป.1-3'],
     'v1.1.0',
     'O3 · พ 4.1 · เพิ่มโหมดฝึกสั้น MCQ')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();
