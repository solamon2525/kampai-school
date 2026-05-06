-- ลบตาราง ticker_items legacy (ไม่มีโค้ดใช้แล้ว หลัง migration 031 ย้ายไปเก็บใน news.show_in_ticker)
drop table if exists public.ticker_items cascade;
