-- 031_news_show_in_ticker.sql
-- เพิ่ม flag ให้ admin เลือกข่าวที่จะวิ่งใน NewsTicker (สูงสุด 5 ข่าว enforce ที่ client/UI)

alter table public.news
  add column if not exists show_in_ticker boolean not null default false,
  add column if not exists ticker_order integer;

create index if not exists idx_news_ticker
  on public.news (ticker_order asc nulls last, published_at desc)
  where show_in_ticker = true and published = true;

comment on column public.news.show_in_ticker is 'true = ข่าวนี้แสดงใน NewsTicker (จำกัด 5 ข่าว enforce ที่ client/UI)';
comment on column public.news.ticker_order is 'ลำดับใน ticker (asc) — null = แทรกท้าย';
