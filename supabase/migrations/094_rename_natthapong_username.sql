-- Rename hub username: natthapong → nattapong (correct spelling)
UPDATE educational_hub_profiles
SET username = 'nattapong'
WHERE username = 'natthapong';
