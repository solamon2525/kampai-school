-- 223_seed_english_quest_content.sql
-- เนื้อหาหลักสูตร English Quest ป.4–6 (ชุดเริ่มต้น: 3 โลก × 2 บท × 10 คำ = 60 คำ)
-- ครูตรวจ/แก้คำ-คำแปล-ตัวอย่างได้ · idempotent (re-run ได้ — words ใช้ delete+insert ต่อโลก)

-- ── โลก ──
INSERT INTO public.english_quest_worlds (world_key, title_th, title_en, theme, icon_emoji, color, sort_order) VALUES
  ('animals','โลกสัตว์','Animals','animals','🐾','amber',1),
  ('food',   'โลกอาหาร','Food',   'food',   '🍎','rose', 2),
  ('school', 'โลกโรงเรียน','School','school','🏫','sky',  3)
ON CONFLICT (world_key) DO UPDATE SET
  title_th=EXCLUDED.title_th, title_en=EXCLUDED.title_en, theme=EXCLUDED.theme,
  icon_emoji=EXCLUDED.icon_emoji, color=EXCLUDED.color, sort_order=EXCLUDED.sort_order;

-- ── บทเรียน ──
INSERT INTO public.english_quest_lessons (world_id, lesson_no, title_th, sort_order)
SELECT w.id, v.lesson_no, v.title_th, v.lesson_no
FROM (VALUES
  ('animals',1,'สัตว์ในฟาร์ม'), ('animals',2,'สัตว์ป่า'),
  ('food',   1,'ผลไม้'),        ('food',   2,'อาหารและเครื่องดื่ม'),
  ('school', 1,'ของใช้ในห้องเรียน'), ('school',2,'วิชาและกิจกรรม')
) AS v(world_key, lesson_no, title_th)
JOIN public.english_quest_worlds w ON w.world_key = v.world_key
ON CONFLICT (world_id, lesson_no) DO UPDATE SET title_th=EXCLUDED.title_th, sort_order=EXCLUDED.sort_order;

-- ── คำศัพท์ (delete+insert ต่อโลก = idempotent) ──
DELETE FROM public.english_quest_words WHERE lesson_id IN (
  SELECT l.id FROM public.english_quest_lessons l
  JOIN public.english_quest_worlds w ON w.id = l.world_id
  WHERE w.world_key IN ('animals','food','school')
);

INSERT INTO public.english_quest_words (lesson_id, word_en, meaning_th, part_of_speech, example_en, emoji, sort_order)
SELECT l.id, v.word_en, v.meaning_th, v.pos, v.example_en, v.emoji, v.ord
FROM (VALUES
  -- ANIMALS · บท 1 สัตว์ในฟาร์ม
  ('animals',1,'cow','วัว','noun','The cow gives us milk.','🐄',1),
  ('animals',1,'pig','หมู','noun','The pig is pink and fat.','🐖',2),
  ('animals',1,'duck','เป็ด','noun','The duck swims in the pond.','🦆',3),
  ('animals',1,'hen','แม่ไก่','noun','The hen lays an egg.','🐔',4),
  ('animals',1,'horse','ม้า','noun','The horse runs very fast.','🐴',5),
  ('animals',1,'sheep','แกะ','noun','The sheep has soft wool.','🐑',6),
  ('animals',1,'goat','แพะ','noun','The goat eats the grass.','🐐',7),
  ('animals',1,'rabbit','กระต่าย','noun','The rabbit likes carrots.','🐰',8),
  ('animals',1,'dog','สุนัข','noun','My dog is my best friend.','🐶',9),
  ('animals',1,'cat','แมว','noun','The cat sleeps all day.','🐱',10),
  -- ANIMALS · บท 2 สัตว์ป่า
  ('animals',2,'lion','สิงโต','noun','The lion is the king of animals.','🦁',1),
  ('animals',2,'tiger','เสือ','noun','The tiger has orange stripes.','🐯',2),
  ('animals',2,'elephant','ช้าง','noun','The elephant has a long nose.','🐘',3),
  ('animals',2,'monkey','ลิง','noun','The monkey climbs the tree.','🐵',4),
  ('animals',2,'bear','หมี','noun','The bear lives in the forest.','🐻',5),
  ('animals',2,'snake','งู','noun','The snake is very long.','🐍',6),
  ('animals',2,'crocodile','จระเข้','noun','The crocodile lives in the river.','🐊',7),
  ('animals',2,'giraffe','ยีราฟ','noun','The giraffe has a long neck.','🦒',8),
  ('animals',2,'zebra','ม้าลาย','noun','The zebra is black and white.','🦓',9),
  ('animals',2,'deer','กวาง','noun','The deer runs in the field.','🦌',10),
  -- FOOD · บท 1 ผลไม้
  ('food',1,'apple','แอปเปิล','noun','I eat a red apple.','🍎',1),
  ('food',1,'banana','กล้วย','noun','The banana is yellow.','🍌',2),
  ('food',1,'orange','ส้ม','noun','The orange is sweet.','🍊',3),
  ('food',1,'mango','มะม่วง','noun','I like ripe mango.','🥭',4),
  ('food',1,'grape','องุ่น','noun','Grapes are small and round.','🍇',5),
  ('food',1,'watermelon','แตงโม','noun','Watermelon is cool and sweet.','🍉',6),
  ('food',1,'pineapple','สับปะรด','noun','The pineapple is sour.','🍍',7),
  ('food',1,'papaya','มะละกอ','noun','I eat papaya salad.','🫐',8),
  ('food',1,'strawberry','สตรอว์เบอร์รี','noun','The strawberry is red.','🍓',9),
  ('food',1,'coconut','มะพร้าว','noun','Coconut water is fresh.','🥥',10),
  -- FOOD · บท 2 อาหารและเครื่องดื่ม
  ('food',2,'rice','ข้าว','noun','I eat rice every day.','🍚',1),
  ('food',2,'noodle','ก๋วยเตี๋ยว','noun','The noodle soup is hot.','🍜',2),
  ('food',2,'egg','ไข่','noun','I eat a fried egg.','🥚',3),
  ('food',2,'bread','ขนมปัง','noun','I eat bread for breakfast.','🍞',4),
  ('food',2,'soup','ซุป','noun','The soup is warm.','🍲',5),
  ('food',2,'chicken','ไก่','noun','I like fried chicken.','🍗',6),
  ('food',2,'fish','ปลา','noun','The fish is on the plate.','🐟',7),
  ('food',2,'milk','นม','noun','I drink milk in the morning.','🥛',8),
  ('food',2,'water','น้ำ','noun','I drink a glass of water.','💧',9),
  ('food',2,'juice','น้ำผลไม้','noun','Orange juice is sweet.','🧃',10),
  -- SCHOOL · บท 1 ของใช้ในห้องเรียน
  ('school',1,'book','หนังสือ','noun','I read a good book.','📖',1),
  ('school',1,'pen','ปากกา','noun','I write with a pen.','🖊️',2),
  ('school',1,'pencil','ดินสอ','noun','My pencil is yellow.','✏️',3),
  ('school',1,'ruler','ไม้บรรทัด','noun','I draw a line with a ruler.','📏',4),
  ('school',1,'eraser','ยางลบ','noun','I use an eraser to erase.','🧽',5),
  ('school',1,'bag','กระเป๋า','noun','My bag is heavy.','🎒',6),
  ('school',1,'desk','โต๊ะเรียน','noun','My book is on the desk.','🪑',7),
  ('school',1,'chair','เก้าอี้','noun','I sit on the chair.','💺',8),
  ('school',1,'board','กระดาน','noun','The teacher writes on the board.','📋',9),
  ('school',1,'clock','นาฬิกา','noun','The clock is on the wall.','🕐',10),
  -- SCHOOL · บท 2 วิชาและกิจกรรม
  ('school',2,'read','อ่าน','verb','I read every night.','📚',1),
  ('school',2,'write','เขียน','verb','I write my name.','✍️',2),
  ('school',2,'listen','ฟัง','verb','Please listen to the teacher.','👂',3),
  ('school',2,'speak','พูด','verb','I speak English.','🗣️',4),
  ('school',2,'draw','วาด','verb','I draw a picture.','🎨',5),
  ('school',2,'study','เรียน','verb','We study math today.','🧠',6),
  ('school',2,'teacher','ครู','noun','My teacher is kind.','👩‍🏫',7),
  ('school',2,'student','นักเรียน','noun','I am a student.','🧑‍🎓',8),
  ('school',2,'homework','การบ้าน','noun','I do my homework.','📝',9),
  ('school',2,'test','การทดสอบ','noun','We have a test on Friday.','🧪',10)
) AS v(world_key, lesson_no, word_en, meaning_th, pos, example_en, emoji, ord)
JOIN public.english_quest_worlds w ON w.world_key = v.world_key
JOIN public.english_quest_lessons l ON l.world_id = w.id AND l.lesson_no = v.lesson_no;
