-- 428: Phase 7B — ฝึกสั้น MCQ บนสื่อ leftover 5 ชิ้น

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/math/rect-area-media.html',
     'ห้องทดลองพื้นที่',
     ARRAY['รูปทรงและสูตร','กริดนับช่อง','โจทย์เรื่อง','พื้นที่ vs เส้นรอบ','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/career/community-jobs-media.html',
     'อาชีพในชุมชน',
     ARRAY['การ์ดอาชีพ','จัดกลุ่มภาค','ใครทำอะไร','สำรวจตัวเอง','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/science/plant-parts-media.html',
     'ส่วนต่าง ๆ ของพืช',
     ARRAY['แผนภาพ','จับคู่หน้าที่','กินส่วนไหน','เรียงเติบโต','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/social/sufficiency-media.html',
     'เศรษฐกิจพอเพียง',
     ARRAY['เรียนรู้','จับคู่','สถานการณ์','แผนของฉัน','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/health/bone-muscle-media.html',
     'กระดูกและกล้ามเนื้อ',
     ARRAY['เรียนรู้','แยกประเภท','ดูแลร่างกาย','ทายตำแหน่ง','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();
