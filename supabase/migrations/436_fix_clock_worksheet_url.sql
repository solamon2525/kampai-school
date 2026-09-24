-- 436: fix wrong clock worksheet URL (/games/math/clock-media-worksheet.html -> clock-worksheet.html)
-- and remove duplicate hub row if dual-track seed already inserted the correct URL.

UPDATE public.educational_hub_items
SET external_url = '/games/math/clock-worksheet.html'
WHERE external_url = '/games/math/clock-media-worksheet.html';

DELETE FROM public.educational_hub_items
WHERE external_url = '/games/math/clock-worksheet.html'
  AND title = '📝 ใบงานนาฬิกาบอกเวลา'
  AND EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/clock-worksheet.html'
      AND title = 'ใบงานอ่านนาฬิกาเข็ม'
  );
