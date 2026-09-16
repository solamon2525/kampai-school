-- Migration 523: Update game_docs for energy-rocket and ar-calibration
-- Records v1.1.0 upgrades with Quality Contract hooks, energy meter balance tuning, and AR smoothing visualizer

DO $$
BEGIN
  UPDATE public.game_docs gd
  SET version = 'v1.1.0',
      notes = 'จรวดพลังงาน — ปรับสมดุลชาร์จพลังงาน (CHARGE_K/TAP_K/DRAIN), เอฟเฟกต์การสั่นและไอพ่นเรืองแสง, รองรับ Quality Contract (v1.1.0)',
      updated_at = now()
  FROM public.educational_hub_items ehi
  WHERE gd.item_id = ehi.id AND ehi.game_slug = 'energy-rocket';

  UPDATE public.game_docs gd
  SET version = 'v1.1.0',
      notes = 'AR Calibration Tool — เครื่องมือสอบเทียบการเคลื่อนไหว OneEuroFilter/EMA แบบเรียลไทม์, รองรับ Quality Contract (v1.1.0)',
      updated_at = now()
  FROM public.educational_hub_items ehi
  WHERE gd.item_id = ehi.id AND ehi.game_slug = 'ar-calibration';
END $$;
