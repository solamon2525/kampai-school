-- Migration 032: Fix broken partner logos

UPDATE partners
SET logo_url = '/logos/moe.png'
WHERE name = 'กระทรวงศึกษาธิการ';

UPDATE partners
SET logo_url = '/logos/obec.png'
WHERE name = 'สพฐ.';

UPDATE partners
SET logo_url = '/logos/garuda.png'
WHERE name IN ('สพท.', 'ท้องถิ่น');
