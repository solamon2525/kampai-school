-- 439: Phase 10 — remap legacy worksheet hub URLs + unpublish orphans (no file in repo)

-- Remap known alias URLs → canonical repo paths
UPDATE public.educational_hub_items AS ehi
SET external_url = m.new_url,
    updated_at = now()
FROM (
  VALUES
    ('/games/thai/thai-reading-hub-worksheet.html', '/games/thai/reading-hub-worksheet.html'),
    ('/games/thai/thai-idiom-hub-worksheet.html', '/games/thai/idiom-hub-worksheet.html'),
    ('/games/thai/thai-literature-hub-worksheet.html', '/games/thai/literature-hub-worksheet.html'),
    ('/games/thai/thai-grammar-hub-worksheet.html', '/games/thai/grammar-hub-worksheet.html'),
    ('/games/thai/thai-script-hub-worksheet.html', '/games/thai/script-hub-worksheet.html'),
    ('/games/thai/thai-punctuation-hub-worksheet.html', '/games/thai/punctuation-hub-worksheet.html'),
    ('/games/thai/thai-sentence-hub-worksheet.html', '/games/thai/sentence-hub-worksheet.html'),
    ('/games/thai/thai-poetry-hub-worksheet.html', '/games/thai/poetry-hub-worksheet.html'),
    ('/games/thai/thai-writing-hub-worksheet.html', '/games/thai/writing-hub-worksheet.html'),
    ('/games/thai/thai-vocab-hub-worksheet.html', '/games/thai/vocab-grammar-worksheet.html'),
    ('/games/thai/thai-implied-meaning-worksheet.html', '/games/thai/implied-meaning-worksheet.html'),
    ('/games/thai/thai-narration-style-worksheet.html', '/games/thai/narration-style-worksheet.html'),
    ('/games/math/math-fraction-hub-worksheet.html', '/games/math/fraction-hub-worksheet.html'),
    ('/games/math/math-decimal-hub-worksheet.html', '/games/math/decimal-hub-worksheet.html'),
    ('/games/math/math-geometry-hub-worksheet.html', '/games/math/geometry-hub-worksheet.html'),
    ('/games/math/math-word-problem-worksheet.html', '/games/math/word-problem-hub-worksheet.html'),
    ('/games/math/math-data-hub-worksheet.html', '/games/math/data-chart-worksheet.html'),
    ('/games/math/math-24-thinking-worksheet.html', '/games/math/math-24-worksheet.html'),
    ('/games/science/digestive-system-worksheet.html', '/games/science/digestive-worksheet.html'),
    ('/games/science/science-p45-hub-worksheet.html', '/games/science/science-explorer-worksheet.html'),
    ('/games/social/social-thailand-hub-worksheet.html', '/games/social/thailand-hub-worksheet.html')
) AS m(old_url, new_url)
WHERE ehi.external_url = m.old_url;

-- Unpublish remaining worksheet rows that are not real repo files (orphans / never shipped)
UPDATE public.educational_hub_items AS ehi
SET is_published = false,
    updated_at = now()
FROM public.educational_hub_categories AS cat
WHERE ehi.category_id = cat.id
  AND cat.category_key = 'worksheets'
  AND ehi.is_published = true
  AND ehi.external_url IN (
    '/games/english/classroom-english-media-worksheet.html',
    '/games/english/english-grammar-p45-hub-worksheet.html',
    '/games/english/sight-words-p123-media-worksheet.html',
    '/games/english/sight-words-p4-worksheet.html',
    '/games/health/brush-teeth-media-worksheet.html',
    '/games/math/geometry-3d-media-worksheet.html',
    '/games/math/rounding-worksheet.html',
    '/games/math/thai-money-media-worksheet.html',
    '/games/math/times-table-worksheet.html',
    '/games/science/human-organs-media-worksheet.html',
    '/games/science/light-properties-media-worksheet.html',
    '/games/social/thai-calendar-media-worksheet.html',
    '/games/thai/literature-short-media-worksheet.html',
    '/games/thai/thai-matra-chart-worksheet.html',
    '/games/thai/thai-sara-chart-worksheet.html'
  );
