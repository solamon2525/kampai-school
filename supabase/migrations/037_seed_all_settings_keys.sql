-- Migration 037: Seed ALL settings keys expected by useSchoolSettings.ts
-- Many keys were missing from the DB causing INSERT vs UPDATE RLS issues on save.
-- Uses ON CONFLICT (key) DO NOTHING to preserve existing user-configured values.

INSERT INTO public.school_settings (key, value, category, description) VALUES
  -- General
  ('school_logo_url',              '',                                          'general',  'URL ของ Logo โรงเรียน'),
  ('school_name',                  'โรงเรียนบ้านคำไผ่',                         'general',  'ชื่อโรงเรียน'),
  ('school_tagline',               'เรียนดี มีคุณธรรม',                         'general',  'คำขวัญ'),
  ('school_description',           'สถาบันการศึกษาชั้นประถมศึกษา',              'general',  'คำอธิบายโรงเรียน'),
  ('school_vision',                '',                                          'general',  'วิสัยทัศน์'),
  ('school_mission',               '',                                          'general',  'พันธกิจ'),
  ('school_values',                '',                                          'general',  'ค่านิยม'),
  ('school_history',               '',                                          'general',  'ประวัติโรงเรียน'),
  ('school_philosophy',            '',                                          'general',  'ปรัชญาโรงเรียน'),
  ('school_philosophy_translation','',                                          'general',  'คำแปลปรัชญา'),
  ('school_motto',                 '',                                          'general',  'คำขวัญโรงเรียน'),
  ('school_identity',              '',                                          'general',  'อัตลักษณ์โรงเรียน'),
  ('school_excellence',            '',                                          'general',  'เอกลักษณ์โรงเรียน'),
  ('academic_year',                '2568',                                      'general',  'ปีการศึกษาปัจจุบัน'),

  -- Hero
  ('hero_image_url',               '',                                          'hero',     'รูป Hero banner'),
  ('hero_badge',                   '',                                          'hero',     'ข้อความ badge'),
  ('hero_title_1',                 '',                                          'hero',     'หัวข้อ 1'),
  ('hero_title_2',                 '',                                          'hero',     'หัวข้อ 2'),
  ('hero_slide_interval',          '5',                                         'hero',     'ความเร็ว slideshow (วินาที)'),

  -- Stats
  ('stat_students',                '0',                                         'stats',    'จำนวนนักเรียน'),
  ('stat_students_label',          'นักเรียน',                                   'stats',    'ป้ายกำกับนักเรียน'),
  ('stat_university',              '0%',                                        'stats',    'อัตราผ่านมหาวิทยาลัย'),
  ('stat_university_label',        'ผ่านเข้ามหาวิทยาลัย',                       'stats',    'ป้ายกำกับมหาวิทยาลัย'),
  ('stat_years',                   '0+',                                        'stats',    'จำนวนปี'),
  ('stat_years_label',             'ปีแห่งความเป็นเลิศ',                        'stats',    'ป้ายกำกับปี'),

  -- About
  ('about_title_1',                '',                                          'about',    'หัวข้อ about 1'),
  ('about_title_2',                '',                                          'about',    'หัวข้อ about 2'),
  ('about_stat_1',                 '',                                          'about',    'สถิติ 1'),
  ('about_stat_1_label',           '',                                          'about',    'ป้ายกำกับสถิติ 1'),
  ('about_stat_2',                 '',                                          'about',    'สถิติ 2'),
  ('about_stat_2_label',           '',                                          'about',    'ป้ายกำกับสถิติ 2'),
  ('about_stat_3',                 '',                                          'about',    'สถิติ 3'),
  ('about_stat_3_label',           '',                                          'about',    'ป้ายกำกับสถิติ 3'),
  ('about_stat_4',                 '',                                          'about',    'สถิติ 4'),
  ('about_stat_4_label',           '',                                          'about',    'ป้ายกำกับสถิติ 4'),

  -- Curriculum
  ('curriculum_title_1',           '',                                          'curriculum','หัวข้อหลักสูตร 1'),
  ('curriculum_title_2',           '',                                          'curriculum','หัวข้อหลักสูตร 2'),
  ('curriculum_description',       '',                                          'curriculum','คำอธิบายหลักสูตร'),
  ('curriculum_study_time',        '',                                          'curriculum','เวลาเรียน'),
  ('curriculum_class_size',        '',                                          'curriculum','ขนาดห้องเรียน'),
  ('curriculum_duration',          '',                                          'curriculum','ระยะเวลาหลักสูตร'),
  ('curriculum_duration_label',    '',                                          'curriculum','ป้ายกำกับระยะเวลา'),

  -- Contact
  ('contact_address',              '',                                          'contact',  'ที่อยู่'),
  ('contact_phone',                '',                                          'contact',  'เบอร์โทรศัพท์'),
  ('contact_email',                '',                                          'contact',  'อีเมล'),
  ('contact_hours',                '',                                          'contact',  'เวลาทำการ'),
  ('google_maps_embed',            '',                                          'contact',  'Google Maps embed URL'),

  -- Social
  ('social_links',                 '[]',                                        'social',   'Social media links (JSON)'),

  -- Footer services
  ('footer_service_1_name',        '',                                          'footer',   'ชื่อบริการ 1'),
  ('footer_service_1_url',         '',                                          'footer',   'URL บริการ 1'),
  ('footer_service_2_name',        '',                                          'footer',   'ชื่อบริการ 2'),
  ('footer_service_2_url',         '',                                          'footer',   'URL บริการ 2'),
  ('footer_service_3_name',        '',                                          'footer',   'ชื่อบริการ 3'),
  ('footer_service_3_url',         '',                                          'footer',   'URL บริการ 3'),
  ('footer_service_4_name',        '',                                          'footer',   'ชื่อบริการ 4'),
  ('footer_service_4_url',         '',                                          'footer',   'URL บริการ 4'),
  ('academic_calendar_url',        '',                                          'footer',   'URL ปฏิทินการศึกษา'),

  -- Homepage layout
  ('homepage_layout',              '',                                          'homepage', 'Homepage layout JSON'),
  ('homepage_mobile_layout',       '',                                          'homepage', 'Mobile layout JSON'),
  ('homepage_main_sections',       '["hero","news","about"]',                   'homepage', 'Main sections'),
  ('homepage_right_widgets',       '["categories","gallery","services","social","stats"]', 'homepage', 'Right widgets'),

  -- Homepage content
  ('intro_video_url',              '',                                          'homepage', 'URL วิดีโอแนะนำ'),
  ('intro_video_thumbnail',        '',                                          'homepage', 'Thumbnail วิดีโอ'),
  ('quicklinks_json',              '',                                          'homepage', 'Quick links JSON'),
  ('obec_links_visible',           '',                                          'homepage', 'แสดง OBEC links'),

  -- About page images
  ('vision_image_url',             '',                                          'about',    'รูปวิสัยทัศน์'),
  ('vision_text_align',            'left',                                      'about',    'การจัดข้อความวิสัยทัศน์'),
  ('vision_bg_color',              '',                                          'about',    'สีพื้นหลังวิสัยทัศน์'),
  ('mission_image_url',            '',                                          'about',    'รูปพันธกิจ'),
  ('mission_text_align',           'left',                                      'about',    'การจัดข้อความพันธกิจ'),
  ('mission_bg_color',             '',                                          'about',    'สีพื้นหลังพันธกิจ'),
  ('values_image_url',             '',                                          'about',    'รูปค่านิยม'),
  ('values_text_align',            'left',                                      'about',    'การจัดข้อความค่านิยม'),
  ('values_bg_color',              '',                                          'about',    'สีพื้นหลังค่านิยม'),
  ('excellence_image_url',         '',                                          'about',    'รูปเอกลักษณ์'),
  ('excellence_text_align',        'left',                                      'about',    'การจัดข้อความเอกลักษณ์'),
  ('excellence_bg_color',          '',                                          'about',    'สีพื้นหลังเอกลักษณ์'),

  -- News ticker
  ('ticker_speed_seconds',         '30',                                        'general',  'ความเร็ว ticker (วินาที)'),
  ('ticker_gap_px',                '60',                                        'general',  'ช่องว่าง ticker (px)'),
  ('ticker_pause_on_hover',        'true',                                      'general',  'หยุด ticker เมื่อ hover')

ON CONFLICT (key) DO NOTHING;
