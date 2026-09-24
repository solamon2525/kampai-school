-- 440: Point 11 SVG-only media thumbnails to rasterized PNG covers (1280x720)
UPDATE educational_hub_items
SET thumbnail_url = '/games/arts/symmetry-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/arts/symmetry-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/english/grammar-vocab-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/grammar-vocab-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/english/past-tense-mini-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/past-tense-mini-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/english/phonics-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/phonics-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/english/sight-words-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/sight-words-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/health/exercise-care-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/health/exercise-care-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/health/first-aid-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/health/first-aid-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/math/clock-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/math/clock-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/math/money-change-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/math/money-change-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/science/light-sort-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/science/light-sort-media.html';

UPDATE educational_hub_items
SET thumbnail_url = '/games/tech/coding-social-media-cover.png',
    updated_at = now()
WHERE external_url = '/games/tech/coding-social-media.html';
