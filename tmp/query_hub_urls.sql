SELECT external_url, title, is_published, COUNT(*) OVER (PARTITION BY external_url) AS url_count
FROM educational_hub_items
WHERE external_url LIKE '%clock%'
   OR external_url LIKE '%light-sort%'
   OR external_url LIKE '%first-aid%'
ORDER BY external_url, title;
