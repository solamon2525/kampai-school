-- Migration 572: Normalize Educational Hub Media and Worksheet Thumbnails
-- Replaces all legacy learning-scene.svg placeholders, converts SVG covers to 16:9 PNGs,
-- and populates missing thumbnails for worksheets and media.

-- 1. Replace learning-scene.svg for worksheets with their exact companion media/hub covers
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/tech/ai-data-literacy-media-cover.png'
WHERE id = '553cd44f-a2ca-4f73-865a-d5068ea91664';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/thai-instruments-media-cover.png'
WHERE id = '60ba9c04-a425-445e-88e5-391a79d50e1f';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/budget-planning-media-cover.png'
WHERE id = '160d6f3c-ef3f-405f-a736-75d7fcc5f66c';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/workplace-safety-media-cover.png'
WHERE id = '1f6f633e-30d7-4f3d-9fc8-adbc17e7bf81';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/art-critique-media-cover.png'
WHERE id = 'e39c6397-aafd-4331-b3ca-35c8efc4df02';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/emotional-wellbeing-media-cover.png'
WHERE id = 'bb070f1b-87a3-4396-9c08-4eb832a47b23';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/emotional-wellbeing-media-cover.png'
WHERE id = 'e91c7d34-868e-4304-a4a0-e85cb2be25c3';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/safety-help-media-cover.png'
WHERE id = 'df9e855e-4341-4360-b751-faf46948363e';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/weather-seasons-media-cover.png'
WHERE id = 'e509fa02-0f4c-4516-96a5-908fbbf7596b';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/clock-media-cover.png'
WHERE id = 'd99e7efc-e73f-4069-b057-ceb8355511e6';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-data-hub/cover.png'
WHERE id = 'b19175de-2a99-4175-a52d-9f31199fb296';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-geometry-hub/cover.png'
WHERE id = '1cfb5729-3633-418b-b238-69a087527fd7';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/science-p45-hub/cover.png'
WHERE id = 'ef1beb90-cc06-4f5f-a856-1c735df1ccb4';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/map-directions-media-cover.png'
WHERE id = 'af30ac90-f372-467d-88a4-48996cdbb59f';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-idiom-hub/cover.png'
WHERE id = 'c9a418de-fdfc-4e44-8d19-030b0682ec09';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/homophone-context-media-cover.png'
WHERE id = '03da4458-1df2-4e51-9c03-ff7bbb92044a';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/social-thailand-hub/cover.png'
WHERE id = '95ad32ba-1f6c-4c02-9578-f46f2b0f5b1e';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-literature-hub/cover.png'
WHERE id = '76d87bac-ca7a-415b-9b58-786032670589';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-script-hub/cover.png'
WHERE id = '766106a5-51ce-43e4-8034-43a38af18fa1';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-sentence-hub/cover.png'
WHERE id = 'a3d6b3ef-f883-44c0-993a-59028fc876b0';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-vocab-hub/cover.png'
WHERE id = 'ad3baff2-5890-42c2-bb42-b79f50679006';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-writing-hub/cover.png'
WHERE id = 'fa86cd0f-36b1-4a58-aeb4-f9fe8b97b961';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-poetry-hub/cover.png'
WHERE id = '8b651920-af19-41b6-b263-a4e916286ef9';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/everyday-conversation-p4-media-cover.png'
WHERE id = '206cb781-7689-490c-9d28-4efff10e4f63';

-- 2. Convert SVG covers to 16:9 PNG covers
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/mixed-number-media-cover.png'
WHERE thumbnail_url = '/games/math/mixed-number-media-cover.svg';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/states-of-matter-cover.png'
WHERE thumbnail_url = '/games/science/states-of-matter-media-cover.svg';

UPDATE public.educational_hub_items
SET thumbnail_url = '/training/construct2-ban-khamphai/cover.png'
WHERE thumbnail_url = '/training/construct2-ban-khamphai/cover.svg'
   OR thumbnail_url = '/training/construct2-learning/manual-steps/l2-s8-b.svg';

-- 3. Populate missing thumbnails for media and worksheets (NULL thumbnails)
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/tech/online-safety-cover.png'
WHERE id = '91227a42-1054-48a8-b16d-35168315e7e1' OR id = 'a2692438-b458-4376-87b2-2c47474fa882';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/symmetry-media-cover.png'
WHERE id = '51e3cf6d-9fd4-4141-ab24-a5898a33e92f';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/color-mix-media-cover.png'
WHERE id = 'e9076eea-ce9b-45da-a1b1-373a12dd45b3' OR id = 'd0900de4-99d4-481b-9713-d1830a86fcc9';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/exercise-care-media-cover.png'
WHERE id = '06131d35-66e9-41b4-9dea-5448fbaa188e';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/money-change-media-cover.png'
WHERE id = 'd26c6fb5-abbc-4320-9859-514bf740ce13';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/clock-media-cover.png'
WHERE id = '1d407370-ed96-424c-b741-a1c397078698';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/light-sort-media-cover.png'
WHERE id = '1dc3bf0c-18f0-4595-a89f-be393119c8c2';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/health/first-aid-media-cover.png'
WHERE id = '7cdb8d75-2b4d-45d8-9f4c-3db4089a096f';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/rhythm-music-media-cover.png'
WHERE id = '6c26fb70-93ca-4487-9b8a-038411487207';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/arts/dance-basics-media-cover.png'
WHERE id = '2bd55b41-46c4-4993-b3c0-404149978112';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/school-garden-media-cover.png'
WHERE id = '2ff4a6de-d193-4a9f-be24-edae99725371';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/food-nutrition-media-cover.png'
WHERE id = '077a3aae-b060-49df-9438-f03225f96da7';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/home-crafts-media-cover.png'
WHERE id = '6f3b9d2f-663b-4a93-a008-d758c6b26293';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/civic-duty-media-cover.png'
WHERE id = '7b8b1fa4-4b13-457b-be05-787d63c078de';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/thai-regions-media-cover.png'
WHERE id = '83eead6e-d897-4f46-87d4-000ca28354b4';

UPDATE public.educational_hub_items
SET thumbnail_url = '/training/construct2-ban-khamphai/cover.png'
WHERE id = '61ba9668-6f04-4985-9b91-502b39abf3fd';

-- 4. Clean up duplicate starter knowledge notes and assign clean thumbnails
UPDATE public.educational_hub_items
SET is_published = false
WHERE id IN (
  'a6314dfe-f035-4a56-a0a2-a9b7bc5a68b8', -- duplicate thai vowel note
  '006ff7df-1c43-4df7-a5a2-b781bd4d046c', -- duplicate math place value note
  '93906519-c9e5-4992-b227-c9d62f5aa618', -- duplicate english greetings note
  '0512fa82-e913-47f4-a676-fb415be29b69', -- duplicate water cycle note
  '88940941-f6bc-422f-886e-1c0c20e6edc0'  -- duplicate teacher upload media guide
);

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-sara-chart-cover.png'
WHERE id = 'b7782d45-c296-49e2-9068-eb360990505d';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/numbers-1-100-media-cover.png'
WHERE id = '3d94c57c-c742-4d1f-aedf-b33107886fad';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/classroom-english-media-cover.png'
WHERE id = '152202d8-8749-47b6-ab9c-caa7b9f1f485';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/water-cycle-cover.png'
WHERE id = '2c3b33e0-970c-46ec-8e78-3ba4f437ad7e';

UPDATE public.educational_hub_items
SET thumbnail_url = '/training/construct2-ban-khamphai/cover.png'
WHERE id = '98746bde-98c3-455f-9f6d-163d68148bd4';
