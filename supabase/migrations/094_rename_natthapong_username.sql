-- Rename hub username: natthapong → nattapong (correct spelling)
UPDATE staff
SET username = 'nattapong'
WHERE username = 'natthapong';
