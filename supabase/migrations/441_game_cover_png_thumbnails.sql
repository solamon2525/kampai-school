-- 441: Phase 9 game covers — thumbnail_url SVG → PNG 1280×720 (hub cards)

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/clock-quest-cover.png',
    updated_at = now()
WHERE external_url = '/games/math/clock-quest.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/moon-phases-race-cover.png',
    updated_at = now()
WHERE external_url = '/games/science/moon-phases-race.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/light-sort-cover.png',
    updated_at = now()
WHERE external_url = '/games/science/light-sort.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/bone-muscle-quest-cover.png',
    updated_at = now()
WHERE external_url = '/games/health/bone-muscle-quest.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/first-aid-rush-cover.png',
    updated_at = now()
WHERE external_url = '/games/health/first-aid-rush.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/sufficiency-sim-cover.png',
    updated_at = now()
WHERE external_url = '/games/social/sufficiency-sim.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/community-jobs-match-cover.png',
    updated_at = now()
WHERE external_url = '/games/career/community-jobs-match.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/past-tense-run-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/past-tense-run.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/follow-instructions-lab-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/follow-instructions-lab.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/fact-opinion-duel-cover.png',
    updated_at = now()
WHERE external_url = '/games/thai/fact-opinion-duel.html';
