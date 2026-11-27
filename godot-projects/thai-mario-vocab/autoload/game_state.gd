extends Node

signal hud_updated
signal toast_requested(message: String, is_good: bool, speak_word: String)
signal stage_cleared(bonus: int, won_all: bool, next_stage_index: int)
signal round_finished(won_all: bool)
signal round_started(stage_index: int)

const MAX_LIVES: int = 5
const CORRECT_WORD_POINTS: int = 100
const STREAK_BONUS: int = 25
const COIN_POINTS: int = 20
const STOMP_POINTS: int = 50
const STAGE_CLEAR_BONUS: int = 250
const HEART_BONUS_POINTS: int = 80

var score: int = 0
var lives: int = MAX_LIVES
var correct_count: int = 0
var wrong_count: int = 0
var coins: int = 0
var streak: int = 0
var best_streak: int = 0
var stage_index: int = 0
var is_active: bool = false
var is_game_over: bool = false
var won_all: bool = false
var seed_value: int = 1337
var rng: RandomNumberGenerator = RandomNumberGenerator.new()

const WORLDS: Array[Dictionary] = [
	{
		"id": "1-1",
		"name": "ด่าน 1-1: ทุ่งคำวิสรรชนีย์",
		"theme": "overworld",
		"sky_top": Color(0.24, 0.50, 0.96),
		"sky_bottom": Color(0.45, 0.72, 1.0),
		"bgm": "overworld",
		"length_tiles": 96,
		"pits": [[22, 23], [45, 47], [70, 71]],
		"pipes": [
			{"x": 14, "h": 2},
			{"x": 33, "h": 3},
			{"x": 57, "h": 2},
			{"x": 79, "h": 3},
		],
		"blocks": [
			{"x": 9, "y": 9, "type": "q_coin"},
			{"x": 10, "y": 9, "type": "brick"},
			{"x": 11, "y": 9, "type": "q_coin"},
			{"x": 12, "y": 9, "type": "brick"},
			{"x": 26, "y": 9, "type": "brick"},
			{"x": 27, "y": 9, "type": "q_heart"},
			{"x": 28, "y": 9, "type": "brick"},
			{"x": 39, "y": 9, "type": "brick"},
			{"x": 40, "y": 9, "type": "q_coin"},
			{"x": 41, "y": 9, "type": "brick"},
			{"x": 40, "y": 5, "type": "q_coin"},
			{"x": 63, "y": 9, "type": "brick"},
			{"x": 64, "y": 9, "type": "q_coin"},
			{"x": 65, "y": 9, "type": "brick"},
			{"x": 84, "y": 9, "type": "brick"},
			{"x": 85, "y": 9, "type": "q_coin"},
			{"x": 86, "y": 9, "type": "brick"},
		],
		"word_zones": [
			{"x": 10, "high_y": 6.5, "low_y": 11.4},
			{"x": 19, "high_y": 8.4, "low_y": 11.4},
			{"x": 29, "high_y": 6.5, "low_y": 11.4},
			{"x": 40, "high_y": 7.0, "low_y": 11.4},
			{"x": 51, "high_y": 8.4, "low_y": 11.4},
			{"x": 64, "high_y": 6.5, "low_y": 11.4},
			{"x": 74, "high_y": 8.4, "low_y": 11.4},
			{"x": 85, "high_y": 6.5, "low_y": 11.4},
		],
		"enemies": [17, 30, 43, 60, 76, 82],
		"checkpoint_x": 50,
		"flag_x": 90,
		"pairs": [
			{"correct": "กะเพรา", "wrong": "กระเพรา", "hint": "กะเพรา ไม่มี ร.เรือ ควบกล้ำที่ตัว ก"},
			{"correct": "กะทิ", "wrong": "กระทิ", "hint": "กะทิ ไม่มี ร.เรือ ควบกล้ำที่ตัว ก"},
			{"correct": "ปะการัง", "wrong": "ประการัง", "hint": "ปะการัง ไม่มี ร.เรือ ควบกล้ำที่ตัว ป"},
			{"correct": "กะทัดรัด", "wrong": "กระทัดรัด", "hint": "กะทัดรัด ไม่มี ร.เรือ ที่คำว่า กะ"},
			{"correct": "กะหล่ำ", "wrong": "กระหล่ำ", "hint": "กะหล่ำปลี ไม่มี ร.เรือ ควบกล้ำ"},
			{"correct": "กะทันหัน", "wrong": "กระทันหัน", "hint": "กะทันหัน ไม่มี ร.เรือ ควบกล้ำ"},
			{"correct": "ตะกร้า", "wrong": "ตระกร้า", "hint": "ตะกร้า ไม่มี ร.เรือ ที่ตัว ต"},
			{"correct": "ตะไคร้", "wrong": "ตระไคร้", "hint": "ตะไคร้ คำว่า ตะ ไม่มี ร.เรือ"},
			{"correct": "ตะหลิว", "wrong": "ตระหลิว", "hint": "ตะหลิว ไม่มี ร.เรือ"},
			{"correct": "สะพาน", "wrong": "สระพาน", "hint": "ข้ามสะพาน ไม่มี ร.เรือ"},
			{"correct": "สะดุด", "wrong": "สระดุด", "hint": "สะดุดล้ม ไม่มี ร.เรือ"},
			{"correct": "ขะมักเขม้น", "wrong": "ขมักเขม้น", "hint": "ขะมักเขม้น ต้องมีสระอะที่ตัว ข"},
		],
	},
	{
		"id": "1-2",
		"name": "ด่าน 1-2: ถ้ำคำสมาสและตัวสะกด",
		"theme": "underground",
		"sky_top": Color(0.04, 0.07, 0.16),
		"sky_bottom": Color(0.09, 0.14, 0.30),
		"bgm": "underground",
		"length_tiles": 98,
		"pits": [[20, 22], [43, 45], [66, 68], [83, 84]],
		"pipes": [
			{"x": 14, "h": 2},
			{"x": 35, "h": 3},
			{"x": 58, "h": 2},
			{"x": 77, "h": 3},
		],
		"blocks": [
			{"x": 8, "y": 9, "type": "brick"},
			{"x": 9, "y": 9, "type": "q_coin"},
			{"x": 10, "y": 9, "type": "brick"},
			{"x": 26, "y": 9, "type": "brick"},
			{"x": 27, "y": 9, "type": "q_coin"},
			{"x": 28, "y": 9, "type": "q_heart"},
			{"x": 29, "y": 9, "type": "brick"},
			{"x": 49, "y": 9, "type": "brick"},
			{"x": 50, "y": 9, "type": "q_coin"},
			{"x": 51, "y": 9, "type": "brick"},
			{"x": 71, "y": 9, "type": "brick"},
			{"x": 72, "y": 9, "type": "q_coin"},
			{"x": 73, "y": 9, "type": "brick"},
			{"x": 72, "y": 5, "type": "q_coin"},
		],
		"word_zones": [
			{"x": 9, "high_y": 6.5, "low_y": 11.4},
			{"x": 18, "high_y": 8.4, "low_y": 11.4},
			{"x": 28, "high_y": 6.5, "low_y": 11.4},
			{"x": 39, "high_y": 8.4, "low_y": 11.4},
			{"x": 50, "high_y": 6.5, "low_y": 11.4},
			{"x": 62, "high_y": 8.4, "low_y": 11.4},
			{"x": 72, "high_y": 7.0, "low_y": 11.4},
			{"x": 87, "high_y": 8.4, "low_y": 11.4},
		],
		"enemies": [16, 25, 40, 54, 63, 74, 80],
		"checkpoint_x": 52,
		"flag_x": 92,
		"pairs": [
			{"correct": "อนุญาต", "wrong": "อนุญาติ", "hint": "อนุญาต ไม่มีสระอิ (ญาติพี่น้อง ถึงมีสระอิ)"},
			{"correct": "สังเกต", "wrong": "สังเกตุ", "hint": "สังเกต ไม่มีสระอุ (แต่ สาเหตุ มีสระอุ)"},
			{"correct": "โอกาส", "wrong": "โอกาศ", "hint": "โอกาส ใช้ ส.เสือ สะกด (อากาศ ใช้ ศ.ศาลา)"},
			{"correct": "กาลเทศะ", "wrong": "กาละเทศะ", "hint": "กาลเทศะ เขียนติดกัน ไม่มีสระอะตรงกลาง"},
			{"correct": "ภารกิจ", "wrong": "ภาระกิจ", "hint": "ภารกิจ เขียนติดกัน ไม่ประวิสรรชนีย์"},
			{"correct": "อิสรภาพ", "wrong": "อิสระภาพ", "hint": "อิสรภาพ ไม่ประวิสรรชนีย์ตรงกลาง"},
			{"correct": "สุขภาพ", "wrong": "สุขะภาพ", "hint": "สุขภาพ ไม่ประวิสรรชนีย์ตรงกลาง"},
			{"correct": "วัฒนธรรม", "wrong": "วัฒนะธรรม", "hint": "วัฒนธรรม เขียนติดกันไม่มีสระอะตรงกลาง"},
			{"correct": "คมนาคม", "wrong": "คมมะนาคม", "hint": "คมนาคม ไม่มีสระอะตรงกลาง"},
			{"correct": "พยาบาล", "wrong": "พะยาบาล", "hint": "พยาบาล ไม่ประวิสรรชนีย์ที่ตัว พ"},
			{"correct": "มังคุด", "wrong": "มังขุด", "hint": "มังคุด ใช้ ค.ควาย สะกด"},
			{"correct": "พะยูน", "wrong": "พยูร", "hint": "พะยูน ใช้ น.หนู สะกด"},
		],
	},
	{
		"id": "1-3",
		"name": "ด่าน 1-3: ปราสาทตัวการันต์และคำพ้อง",
		"theme": "castle",
		"sky_top": Color(0.18, 0.16, 0.42),
		"sky_bottom": Color(0.55, 0.31, 0.48),
		"bgm": "castle",
		"length_tiles": 100,
		"pits": [[19, 21], [39, 41], [60, 62], [81, 83]],
		"pipes": [
			{"x": 13, "h": 2},
			{"x": 33, "h": 3},
			{"x": 54, "h": 3},
			{"x": 75, "h": 2},
		],
		"blocks": [
			{"x": 8, "y": 9, "type": "q_coin"},
			{"x": 9, "y": 9, "type": "brick"},
			{"x": 10, "y": 9, "type": "q_coin"},
			{"x": 25, "y": 9, "type": "brick"},
			{"x": 26, "y": 9, "type": "q_heart"},
			{"x": 27, "y": 9, "type": "brick"},
			{"x": 45, "y": 9, "type": "brick"},
			{"x": 46, "y": 9, "type": "q_coin"},
			{"x": 47, "y": 9, "type": "brick"},
			{"x": 46, "y": 5, "type": "q_coin"},
			{"x": 67, "y": 9, "type": "brick"},
			{"x": 68, "y": 9, "type": "q_coin"},
			{"x": 69, "y": 9, "type": "brick"},
		],
		"word_zones": [
			{"x": 9, "high_y": 6.5, "low_y": 11.4},
			{"x": 16, "high_y": 8.4, "low_y": 11.4},
			{"x": 26, "high_y": 6.5, "low_y": 11.4},
			{"x": 37, "high_y": 8.4, "low_y": 11.4},
			{"x": 46, "high_y": 7.0, "low_y": 11.4},
			{"x": 57, "high_y": 8.4, "low_y": 11.4},
			{"x": 68, "high_y": 6.5, "low_y": 11.4},
			{"x": 86, "high_y": 8.4, "low_y": 11.4},
		],
		"enemies": [15, 24, 36, 50, 64, 72, 85],
		"checkpoint_x": 55,
		"flag_x": 94,
		"pairs": [
			{"correct": "คำนวณ", "wrong": "คำนวน", "hint": "คำนวณ ใช้ ณ.เณร สะกด"},
			{"correct": "ลายเซ็น", "wrong": "ลายเซ็นต์", "hint": "ลายเซ็น ไม่มี ต์ การันต์"},
			{"correct": "รางวัล", "wrong": "รางวัลย์", "hint": "รางวัล ไม่มี ย์ การันต์"},
			{"correct": "เครื่องสำอาง", "wrong": "เครื่องสำอางค์", "hint": "เครื่องสำอาง ไม่มี ค์ การันต์"},
			{"correct": "โควตา", "wrong": "โควต้า", "hint": "โควตา คำทับศัพท์ ไม่ต้องใส่ไม้โท"},
			{"correct": "ประณีต", "wrong": "ปราณีต", "hint": "ประณีตบรรจง ใช้ ปร สระอะ ไม่ใช่ ปรา"},
			{"correct": "ทัศนคติ", "wrong": "ทรรศนคติ", "hint": "ทัศนคติ ใช้ ศ.ศาลา สระอะกึ่งมาตรา"},
			{"correct": "พรรณนา", "wrong": "พันนา", "hint": "พรรณนา ใช้ รร และ ณ.เณร"},
			{"correct": "จำนง", "wrong": "จำนงค์", "hint": "ความจำนง ไม่มี ค์ การันต์"},
			{"correct": "ประวัติศาสตร์", "wrong": "ประวัติศาสตร์ย์", "hint": "ประวัติศาสตร์ จบที่ ตร์ การันต์"},
			{"correct": "สูจิบัตร", "wrong": "สูจิบัตรย์", "hint": "สูจิบัตร ไม่มี ย์ การันต์"},
			{"correct": "ละเอียด", "wrong": "ละเอีด", "hint": "ละเอียด ต้องมี ย.ยักษ์ ในสระเอีย"},
		],
	},
]

func start_new_round(p_seed: int = 1337) -> void:
	seed_value = p_seed
	rng.seed = seed_value
	score = 0
	lives = MAX_LIVES
	correct_count = 0
	wrong_count = 0
	coins = 0
	streak = 0
	best_streak = 0
	stage_index = 0
	is_active = true
	is_game_over = false
	won_all = false
	hud_updated.emit()
	round_started.emit(stage_index)

func get_current_world() -> Dictionary:
	var idx: int = clampi(stage_index, 0, WORLDS.size() - 1)
	return WORLDS[idx]

func build_stage_word_slots(world: Dictionary) -> Array[Dictionary]:
	var pairs_raw: Array = world.get("pairs", [])
	var shuffled: Array = pairs_raw.duplicate()
	var stage_rng := RandomNumberGenerator.new()
	stage_rng.seed = seed_value + stage_index * 7919
	for i: int in range(shuffled.size() - 1, 0, -1):
		var j: int = stage_rng.randi_range(0, i)
		var tmp: Variant = shuffled[i]
		shuffled[i] = shuffled[j]
		shuffled[j] = tmp

	var zones_raw: Array = world.get("word_zones", [])
	var out: Array[Dictionary] = []
	for idx: int in range(zones_raw.size()):
		var zone: Dictionary = zones_raw[idx]
		var pair: Dictionary = shuffled[idx % shuffled.size()]
		var correct_on_high: bool = stage_rng.randf() >= 0.5
		out.append({
			"zone_id": idx,
			"x": zone.get("x", 10),
			"high_y": zone.get("high_y", 6.5),
			"low_y": zone.get("low_y", 11.4),
			"correct_on_high": correct_on_high,
			"pair": pair,
		})
	return out

func collect_correct_word(pair: Dictionary) -> int:
	if is_game_over:
		return 0
	correct_count += 1
	streak += 1
	best_streak = maxi(best_streak, streak)
	var bonus: int = mini(streak - 1, 4) * STREAK_BONUS
	var gained: int = CORRECT_WORD_POINTS + bonus
	score += gained
	var word_txt: String = str(pair.get("correct", ""))
	var hint_txt: String = str(pair.get("hint", ""))
	hud_updated.emit()
	toast_requested.emit("✅ %s (+%d) — %s" % [word_txt, gained, hint_txt], true, word_txt)
	return gained

func collect_wrong_word(pair: Dictionary) -> bool:
	if is_game_over:
		return true
	wrong_count += 1
	streak = 0
	lives = maxi(0, lives - 1)
	var wrong_txt: String = str(pair.get("wrong", ""))
	var right_txt: String = str(pair.get("correct", ""))
	var hint_txt: String = str(pair.get("hint", ""))
	if lives <= 0:
		is_game_over = true
		is_active = false
	hud_updated.emit()
	toast_requested.emit("❌ %s → ที่ถูก: ✅ %s (%s)" % [wrong_txt, right_txt, hint_txt], false, "")
	return is_game_over

func apply_hazard_hit(reason: String) -> bool:
	if is_game_over:
		return true
	streak = 0
	lives = maxi(0, lives - 1)
	if lives <= 0:
		is_game_over = true
		is_active = false
	hud_updated.emit()
	toast_requested.emit("%s (หัวใจเหลือ %d/%d)" % [reason, lives, MAX_LIVES], false, "")
	return is_game_over

func collect_coin() -> int:
	coins += 1
	score += COIN_POINTS
	hud_updated.emit()
	return COIN_POINTS

func collect_stomp() -> int:
	score += STOMP_POINTS
	hud_updated.emit()
	return STOMP_POINTS

func collect_extra_heart() -> Dictionary:
	if lives < MAX_LIVES:
		lives += 1
		hud_updated.emit()
		toast_requested.emit("❤️ 1-UP! ได้หัวใจเพิ่ม +1 ดวง", true, "")
		return {"gained": true, "bonus": 0}
	score += HEART_BONUS_POINTS
	hud_updated.emit()
	toast_requested.emit("❤️ หัวใจเต็มแล้ว! โบนัส +%d" % HEART_BONUS_POINTS, true, "")
	return {"gained": false, "bonus": HEART_BONUS_POINTS}

func complete_stage() -> Dictionary:
	var bonus: int = STAGE_CLEAR_BONUS + lives * 30
	score += bonus
	var next_idx: int = stage_index + 1
	if next_idx >= WORLDS.size():
		won_all = true
		is_game_over = true
		is_active = false
	else:
		stage_index = next_idx
	hud_updated.emit()
	stage_cleared.emit(bonus, won_all, stage_index)
	return {"bonus": bonus, "won_all": won_all, "next_stage": stage_index}

func finish_round(p_won: bool) -> void:
	won_all = p_won
	is_game_over = true
	is_active = false
	hud_updated.emit()
	round_finished.emit(won_all)
