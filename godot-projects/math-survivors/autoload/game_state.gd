extends Node

signal hud_updated
signal toast_requested(message: String, tone: String, speak_word: String)
signal question_updated(q_data: Dictionary)
signal levelup_opened(options: Array)
signal chest_opened(q_data: Dictionary)
signal round_ended(won: bool, cause: String)

const RUN_DURATION_SEC: float = 180.0
const ARENA_TILES: int = 80
const TILE_PX: float = 24.0
const ARENA_PX: float = ARENA_TILES * TILE_PX

const MAPS: Dictionary = {
	"arcane_temple": {"id": "arcane_temple", "name": "วิหารรูนโบราณ", "row": 0, "bgm": "arena", "score_mult": 1.0, "pillar": "pillar"},
	"crystal_forest": {"id": "crystal_forest", "name": "ป่าคริสตัลคณิต", "row": 1, "bgm": "forest", "score_mult": 1.1, "pillar": "crystal_pillar"},
	"lava_citadel": {"id": "lava_citadel", "name": "ปราสาทลาวาสมการ", "row": 2, "bgm": "lava", "score_mult": 1.25, "pillar": "lava_pillar"},
}

const HEROES: Dictionary = {
	"mage": {"id": "mage", "name": "จอมเวทดาวฤกษ์", "weapon": "wand", "hp_bonus": 0.0, "spd_mult": 1.0, "cd_mult": 1.0},
	"knight": {"id": "knight", "name": "อัศวินพาย", "weapon": "orbs", "hp_bonus": 25.0, "spd_mult": 1.0, "cd_mult": 1.0},
	"inventor": {"id": "inventor", "name": "นักประดิษฐ์สายฟ้า", "weapon": "lightning", "hp_bonus": 0.0, "spd_mult": 1.12, "cd_mult": 0.90},
}

const ACTS: Array = [
	{"id": 1, "name": "องก์ 1 · ป.4 บวกลบคูณหาร", "start": 0.0, "spawn_rate": 0.72, "hp_mult": 1.0, "spd_mult": 1.0, "boss_at": 52.0, "boss_name": "👑 ราชาสไลม์บวกลบ"},
	{"id": 2, "name": "องก์ 2 · ป.5 คูณหารระคน", "start": 60.0, "spawn_rate": 0.56, "hp_mult": 1.55, "spd_mult": 1.15, "boss_at": 112.0, "boss_name": "🛡️ อัศวินคูณหาร"},
	{"id": 3, "name": "องก์ 3 · ป.6 สมการมังกร", "start": 120.0, "spawn_rate": 0.42, "hp_mult": 2.25, "spd_mult": 1.28, "boss_at": 168.0, "boss_name": "🐉 มังกรสมการป.6"},
]

const WEAPONS: Dictionary = {
	"wand": {"name": "คทาประกายดาว", "icon": "✨", "max": 5, "pair": "haste", "evo_name": "ฝนดาวตกจักรวาล", "evo_icon": "🌟", "evo_desc": "วิวัฒนาการ! ยิงดาวตก 5 นัดรัวพร้อมเจาะทะลุและระเบิดประกาย", "desc": [
		"ยิงลำแสงดาวใส่มอนสเตอร์ใกล้ที่สุดอัตโนมัติ",
		"ยิงเพิ่มเป็น 2 นัดต่อชุด + รวดเร็วขึ้น",
		"ความเสียหาย +35% และยิงเร็วขึ้น 15%",
		"ยิงกระจาย 3 นัด + เจาะทะลุเป้าหมาย",
		"ดาวตก 4 นัดต่อเนื่อง (พร้อมวิวัฒนาการคู่ ⏱️)"
	]},
	"orbs": {"name": "วงแหวนพาย (π)", "icon": "🛡️", "max": 5, "pair": "vitality", "evo_name": "โล่สุริยะอมตะ", "evo_icon": "☀️", "evo_desc": "วิวัฒนาการ! วงแหวนสุริยะ 6 ดวงหมุนไว + ดูดเลือด +1 HP ทุก 10 ฮิต", "desc": [
		"อัญเชิญลูกแก้วโล่ 2 ดวงหมุนป้องกันรอบตัว",
		"เพิ่มจำนวนลูกแก้วเป็น 3 ดวง หมุนเร็วขึ้น",
		"ขยายรัศมีวงแหวน + ความเสียหาย +30%",
		"เพิ่มเป็น 4 ดวง กวาดฝูงสไลม์รอบทิศ",
		"วงแหวนแสงทอง 5 ดวง (พร้อมวิวัฒนาการคู่ ❤️)"
	]},
	"lightning": {"name": "สายฟ้าสมการ", "icon": "⚡", "max": 5, "pair": "magnet", "evo_name": "พายุแม่เหล็กไฟฟ้า", "evo_icon": "🌩️", "evo_desc": "วิวัฒนาการ! สายฟ้าชิ่ง 8 ตัวพร้อมดูดเพชร EXP รอบจุดฟ้าผ่า", "desc": [
		"ฟาดสายฟ้าสีทองชิ่งศัตรู 2 ตัวใกล้เคียง",
		"ชิ่งได้ 3 ตัว + คูลดาวน์ไวขึ้น",
		"พลังโจมตี +40% ระยะฟาดกว้างขึ้น",
		"ชิ่งได้ 4 ตัว พร้อมสะเก็ดประกาย",
		"พายุสายฟ้าชิ่ง 6 ตัว (พร้อมวิวัฒนาการคู่ 🧲)"
	]},
	"boomerang": {"name": "จักรเศษส่วน", "icon": "🌀", "max": 5, "pair": "boots", "evo_name": "กงจักรเวลา", "evo_icon": "💫", "evo_desc": "วิวัฒนาการ! จักรยักษ์ 6 ทิศทางลดความเร็วศัตรู 40%", "desc": [
		"ขว้างจักรเวทพุ่งทะลุศัตรูแล้วหมุนย้อนกลับ",
		"เพิ่มขนาดใบจักร + ขว้าง 2 ทิศทาง",
		"ความเร็วหมุนและพลังทำลาย +35%",
		"ขว้าง 3 แฉก กวาดแนวหน้าและหลัง",
		"จักรสุริยะ 4 ทิศ (พร้อมวิวัฒนาการคู่ 👟)"
	]},
	"nova": {"name": "คลื่นระเบิดคูณสิบ", "icon": "💥", "max": 5, "pair": "haste", "evo_name": "คลื่นซูเปอร์โนวา", "evo_icon": "☄️", "evo_desc": "วิวัฒนาการ! ระเบิดวงเวท 2 จังหวะครอบคลุมทั้งจอ + ผลักบอส", "desc": [
		"ปล่อยคลื่นวงเวทรอบตัวผลักและทำลายศัตรูเป็นระยะ",
		"รัศมีระเบิดกว้างขึ้น +25%",
		"คูลดาวน์สั้นลง 20% + ผลักแรงขึ้น",
		"ความเสียหาย +45% + รัศมีกว้างมาก",
		"คลื่นคูณร้อย (พร้อมวิวัฒนาการคู่ ⏱️)"
	]},
}

const PASSIVES: Dictionary = {
	"haste": {"name": "นาฬิกาความเร็ว", "icon": "⏱️", "max": 4, "desc": "ลดเวลาคูลดาวน์ทุกอาวุธลงอีก 12%"},
	"boots": {"name": "รองเท้าลมกรด", "icon": "👟", "max": 4, "desc": "วิ่งหลบฝูงมอนสเตอร์เร็วขึ้น +14%"},
	"magnet": {"name": "แม่เหล็กเพชร EXP", "icon": "🧲", "max": 4, "desc": "ระยะดูดเพชร EXP กว้างขึ้น +45%"},
	"vitality": {"name": "หัวใจศิลา", "icon": "❤️", "max": 4, "desc": "เพิ่ม Max HP +25 และฟื้นฟูทันที +30 HP"},
}

var is_active: bool = false
var is_ended: bool = false
var is_levelup: bool = false
var is_chest_open: bool = false
var mode: String = "normal"
var map_id: String = "arcane_temple"
var hero_id: String = "mage"
var run_seed: int = 1337
var elapsed: float = 0.0
var act_index: int = 0
var reduce_shake: bool = false

var score: int = 0
var kills: int = 0
var correct_math: int = 0
var wrong_math: int = 0
var streak: int = 0
var best_streak: int = 0
var boss_kills: int = 0
var evolutions_count: int = 0
var fever_timer: float = 0.0
var speed_boost_timer: float = 0.0
var dash_ratio: float = 1.0

var level: int = 1
var xp: int = 0
var xp_need: int = 60
var hp: float = 100.0
var max_hp: float = 100.0

var weapons: Dictionary = {"wand": 1}
var passives: Dictionary = {}
var draft_options: Array = []
var active_chest_q: Dictionary = {}

# Minimap & Boss live snapshot filled by main.gd
var boss_info: Dictionary = {}
var minimap_info: Dictionary = {}

var wave_rng := RandomNumberGenerator.new()
var math_rng := RandomNumberGenerator.new()
var draft_rng := RandomNumberGenerator.new()

static func hash_seed(base_seed: int, tag: String) -> int:
	var h: int = (base_seed & 0x7fffffff) ^ 0x45d9f3b
	for i: int in range(tag.length()):
		h = int((h * 33 + tag.unicode_at(i)) & 0x7fffffff)
	return maxi(1, h)

func get_map_cfg() -> Dictionary:
	return MAPS.get(map_id, MAPS["arcane_temple"])

func get_hero_cfg() -> Dictionary:
	return HEROES.get(hero_id, HEROES["mage"])

func start_new_round(p_seed: int, p_mode: String = "normal", p_map: String = "arcane_temple", p_hero: String = "mage") -> void:
	run_seed = maxi(1, p_seed)
	mode = p_mode
	map_id = p_map if MAPS.has(p_map) else "arcane_temple"
	hero_id = p_hero if HEROES.has(p_hero) else "mage"
	var hcfg: Dictionary = get_hero_cfg()

	is_active = true
	is_ended = false
	is_levelup = false
	is_chest_open = false
	elapsed = 0.0
	act_index = 0

	score = 0
	kills = 0
	correct_math = 0
	wrong_math = 0
	streak = 0
	best_streak = 0
	boss_kills = 0
	evolutions_count = 0
	fever_timer = 0.0
	speed_boost_timer = 0.0
	dash_ratio = 1.0

	level = 1
	xp = 0
	xp_need = 60
	max_hp = 100.0 + float(hcfg["hp_bonus"])
	hp = max_hp

	weapons = {str(hcfg["weapon"]): 1}
	passives = {}
	draft_options = []
	active_chest_q = {}
	boss_info = {}
	minimap_info = {}

	wave_rng.seed = hash_seed(run_seed, "wave")
	math_rng.seed = hash_seed(run_seed, "math")
	draft_rng.seed = hash_seed(run_seed, "draft")
	hud_updated.emit()

func get_cooldown_mult() -> float:
	var h: int = int(passives.get("haste", 0))
	var mult: float = pow(0.88, float(h)) * float(get_hero_cfg()["cd_mult"])
	if fever_timer > 0.0:
		mult *= 0.75
	return mult

func get_move_speed() -> float:
	var b: int = int(passives.get("boots", 0))
	var spd: float = 158.0 * (1.0 + float(b) * 0.14) * float(get_hero_cfg()["spd_mult"])
	if speed_boost_timer > 0.0:
		spd *= 1.45
	return spd

func get_pickup_radius() -> float:
	if fever_timer > 0.0:
		return 1400.0
	var m: int = int(passives.get("magnet", 0))
	return 78.0 * (1.0 + float(m) * 0.45)

func add_score(pts: int) -> void:
	var mult: float = float(get_map_cfg()["score_mult"])
	score = maxi(0, score + int(round(float(pts) * mult)))
	hud_updated.emit()

func can_evolve(weapon_id: String) -> bool:
	if not WEAPONS.has(weapon_id):
		return false
	var cur: int = int(weapons.get(weapon_id, 0))
	if cur != 5:
		return false
	var pair_id: String = str(WEAPONS[weapon_id]["pair"])
	return int(passives.get(pair_id, 0)) >= 1

func add_xp(amount: int) -> bool:
	xp += amount
	add_score(3)
	if xp >= xp_need:
		xp -= xp_need
		level += 1
		xp_need = int(round(float(xp_need) * 1.32 + 25.0))
		_prepare_draft()
		return true
	hud_updated.emit()
	return false

func _prepare_draft() -> void:
	var evo_pool: Array = []
	var pool: Array = []
	for id: String in WEAPONS.keys():
		var w: Dictionary = WEAPONS[id]
		var cur: int = int(weapons.get(id, 0))
		if can_evolve(id):
			evo_pool.append({
				"kind": "evolution", "id": id, "icon": w["evo_icon"], "name": w["evo_name"],
				"nextLv": 6, "isNew": false, "isEvo": true,
				"desc": str(w["evo_desc"]), "synergy": "🌟 วิวัฒนาการขั้นสุดยอด!"
			})
		elif cur < int(w["max"]):
			var descs: Array = w["desc"]
			var pair_id: String = str(w["pair"])
			var p_info: Dictionary = PASSIVES[pair_id]
			pool.append({
				"kind": "weapon", "id": id, "icon": w["icon"], "name": w["name"],
				"nextLv": cur + 1, "isNew": cur == 0, "isEvo": false,
				"desc": str(descs[mini(cur, descs.size() - 1)]),
				"synergy": "คู่ผสม: %s %s → %s" % [str(p_info["icon"]), str(p_info["name"]), str(w["evo_name"])]
			})
	for id: String in PASSIVES.keys():
		var p: Dictionary = PASSIVES[id]
		var cur: int = int(passives.get(id, 0))
		if cur < int(p["max"]):
			pool.append({
				"kind": "passive", "id": id, "icon": p["icon"], "name": p["name"],
				"nextLv": cur + 1, "isNew": cur == 0, "isEvo": false,
				"desc": str(p["desc"]), "synergy": ""
			})
	_shuffle_with(draft_rng, pool)
	var chosen: Array = []
	for e: Variant in evo_pool:
		if chosen.size() < 3:
			chosen.append(e)
	for item: Variant in pool:
		if chosen.size() < 3:
			chosen.append(item)
	if chosen.is_empty():
		chosen = [{"kind": "heal", "id": "heal", "icon": "💖", "name": "ฟื้นฟูพลัง & โบนัส", "nextLv": 1, "isNew": false, "isEvo": false, "desc": "ฟื้นฟู +35 HP และรับคะแนน +120", "synergy": ""}]
	draft_options = chosen
	is_levelup = true
	levelup_opened.emit(draft_options)
	hud_updated.emit()

func pick_draft(idx: int) -> void:
	if not is_levelup or draft_options.is_empty():
		return
	var opt: Dictionary = draft_options[clampi(idx, 0, draft_options.size() - 1)]
	_apply_upgrade_item(opt)
	is_levelup = false
	hud_updated.emit()

func _apply_upgrade_item(opt: Dictionary) -> void:
	var kind: String = str(opt.get("kind", "heal"))
	var id: String = str(opt.get("id", ""))
	if kind == "evolution":
		weapons[id] = 6
		evolutions_count += 1
		add_score(250)
	elif kind == "weapon":
		weapons[id] = int(weapons.get(id, 0)) + 1
	elif kind == "passive":
		passives[id] = int(passives.get(id, 0)) + 1
		if id == "vitality":
			max_hp += 25.0
			hp = minf(max_hp, hp + 30.0)
	else:
		hp = minf(max_hp, hp + 35.0)
		add_score(120)

func open_boss_chest() -> void:
	active_chest_q = generate_question(act_index + 1)
	is_chest_open = true
	chest_opened.emit(active_chest_q)

func resolve_boss_chest(picked_answer: int) -> Dictionary:
	if not is_chest_open or active_chest_q.is_empty():
		return {"correct": false, "summary": ""}
	var ans: int = int(active_chest_q["answer"])
	var ok: bool = picked_answer == ans
	var exp_txt: String = str(active_chest_q["explain"])
	is_chest_open = false
	active_chest_q = {}

	var rewards: Array[String] = []
	if ok:
		correct_math += 1
		streak += 1
		best_streak = maxi(best_streak, streak)
		add_score(300)
		hp = minf(max_hp, hp + 30.0)
		# Grant instant Evolution if any ready, else 2 upgrades
		var evolved_any: bool = false
		for wid: String in WEAPONS.keys():
			if can_evolve(wid):
				weapons[wid] = 6
				evolutions_count += 1
				rewards.append("%s %s (Lv.6)" % [str(WEAPONS[wid]["evo_icon"]), str(WEAPONS[wid]["evo_name"])])
				evolved_any = true
				break
		if not evolved_any:
			for _k: int in range(2):
				var granted: String = _grant_random_upgrade()
				if not granted.is_empty():
					rewards.append(granted)
	else:
		wrong_math += 1
		streak = 0
		var cons: String = _grant_random_upgrade()
		if not cons.is_empty():
			rewards.append(cons)

	hud_updated.emit()
	return {"correct": ok, "answer": ans, "explain": exp_txt, "rewards": rewards}

func _grant_random_upgrade() -> String:
	var cands: Array = []
	for wid: String in weapons.keys():
		var lv: int = int(weapons[wid])
		if lv < 5:
			cands.append({"kind": "weapon", "id": wid, "label": str(WEAPONS[wid]["name"]) + " Lv." + str(lv + 1)})
	for pid: String in PASSIVES.keys():
		var lv2: int = int(passives.get(pid, 0))
		if lv2 < int(PASSIVES[pid]["max"]):
			cands.append({"kind": "passive", "id": pid, "label": str(PASSIVES[pid]["name"]) + " Lv." + str(lv2 + 1)})
	if cands.is_empty():
		hp = minf(max_hp, hp + 25.0)
		add_score(150)
		return "ฟื้นฟู +25 HP & +150 คะแนน"
	var pick: Dictionary = cands[draft_rng.randi() % cands.size()]
	_apply_upgrade_item(pick)
	return str(pick["label"])

func finish_round(won: bool, cause: String) -> void:
	if is_ended:
		return
	is_ended = true
	is_active = false
	is_levelup = false
	is_chest_open = false
	hud_updated.emit()
	round_ended.emit(won, cause)

func generate_question(act: int, rng: RandomNumberGenerator = null) -> Dictionary:
	var r := rng if rng != null else math_rng
	var pick: float = r.randf()
	var prompt: String = ""
	var answer: int = 0
	var op: String = "add"
	var explain: String = ""
	var grade: String = "ป.4"

	if act <= 1:
		grade = "ป.4"
		if pick < 0.28:
			var a: int = r.randi_range(12, 68) * 10 + r.randi_range(1, 9)
			var b: int = r.randi_range(11, 45) * 10 + r.randi_range(1, 9)
			answer = a + b
			op = "add"
			prompt = "%d + %d = ?" % [a, b]
			explain = "%d + %d = %d" % [a, b, answer]
		elif pick < 0.56:
			var b2: int = r.randi_range(120, 480)
			var ans2: int = r.randi_range(130, 520)
			var a2: int = b2 + ans2
			answer = ans2
			op = "sub"
			prompt = "%d − %d = ?" % [a2, b2]
			explain = "%d − %d = %d" % [a2, b2, answer]
		elif pick < 0.80:
			var a3: int = r.randi_range(12, 36)
			var b3: int = r.randi_range(4, 9)
			answer = a3 * b3
			op = "mul"
			prompt = "%d × %d = ?" % [a3, b3]
			explain = "%d × %d = %d" % [a3, b3, answer]
		else:
			var b4: int = r.randi_range(4, 12)
			var ans4: int = r.randi_range(6, 18)
			var a4: int = b4 * ans4
			answer = ans4
			op = "div"
			prompt = "%d ÷ %d = ?" % [a4, b4]
			explain = "%d × %d = %d ดังนั้นตอบ %d" % [b4, ans4, a4, ans4]
	elif act == 2:
		grade = "ป.5"
		if pick < 0.30:
			var a5: int = r.randi_range(14, 38)
			var b5: int = r.randi_range(11, 19)
			answer = a5 * b5
			op = "mul"
			prompt = "%d × %d = ?" % [a5, b5]
			explain = "%d × %d = %d" % [a5, b5, answer]
		elif pick < 0.58:
			var b6: int = r.randi_range(11, 25)
			var ans6: int = r.randi_range(8, 24)
			var a6: int = b6 * ans6
			answer = ans6
			op = "div"
			prompt = "%d ÷ %d = ?" % [a6, b6]
			explain = "%d ÷ %d = %d" % [a6, b6, ans6]
		elif pick < 0.80:
			var a7: int = r.randi_range(18, 52)
			var b7: int = r.randi_range(12, 38)
			var c7: int = r.randi_range(3, 7)
			answer = (a7 + b7) * c7
			op = "mix"
			prompt = "(%d + %d) × %d = ?" % [a7, b7, c7]
			explain = "ทำในวงเล็บก่อน: %d × %d = %d" % [a7 + b7, c7, answer]
		else:
			var a8: int = r.randi_range(8, 16)
			var b8: int = r.randi_range(5, 9)
			var c8: int = r.randi_range(25, 95)
			answer = a8 * b8 + c8
			op = "mix"
			prompt = "%d × %d + %d = ?" % [a8, b8, c8]
			explain = "คูณก่อนบวก: %d + %d = %d" % [a8 * b8, c8, answer]
	else:
		grade = "ป.6"
		if pick < 0.28:
			var x9: int = r.randi_range(9, 26)
			var k9: int = r.randi_range(8, 16)
			var rhs: int = x9 * k9
			answer = x9
			op = "eq"
			prompt = "□ × %d = %d (หา □)" % [k9, rhs]
			explain = "%d ÷ %d = %d" % [rhs, k9, x9]
		elif pick < 0.56:
			var a10: int = r.randi_range(150, 320)
			var b10: int = r.randi_range(6, 15)
			var c10: int = r.randi_range(4, 12)
			var prod: int = b10 * c10
			if a10 > prod:
				answer = a10 - prod
				op = "mix"
				prompt = "%d − %d × %d = ?" % [a10, b10, c10]
				explain = "คูณก่อนลบ: %d − %d = %d" % [a10, prod, answer]
			else:
				answer = prod + a10
				op = "mix"
				prompt = "%d × %d + %d = ?" % [b10, c10, a10]
				explain = "%d + %d = %d" % [prod, a10, answer]
		elif pick < 0.80:
			var p11: int = r.randi_range(4, 15)
			var q11: int = r.randi_range(3, 12)
			var ans11: int = r.randi_range(5, 18)
			var total11: int = (p11 + q11) * ans11
			answer = ans11
			op = "div"
			prompt = "%d ÷ (%d + %d) = ?" % [total11, p11, q11]
			explain = "%d ÷ %d = %d" % [total11, p11 + q11, ans11]
		else:
			var pct_list: Array = [10, 20, 25, 50]
			var pct: int = int(pct_list[r.randi() % pct_list.size()])
			var base: int = r.randi_range(2, 16) * 20
			answer = int(round(float(pct * base) / 100.0))
			op = "pct"
			prompt = "%d%% ของ %d = ?" % [pct, base]
			explain = "(%d × %d) ÷ 100 = %d" % [pct, base, answer]

	var choices: Array[int] = _build_choices(r, answer, op)
	return {"grade": grade, "op": op, "prompt": prompt, "answer": answer, "choices": choices, "explain": explain}

func _build_choices(r: RandomNumberGenerator, ans: int, op: String) -> Array[int]:
	var out: Array[int] = [ans]
	var deltas: Array = [1, -1, 2, -2, 10, -10, 5, -5, 4, -4, 12, -12] if (op == "mul" or op == "div") else [10, -10, 1, -1, 20, -20, 2, -2, 100, -100, 5, -5]
	var guard: int = 0
	while out.size() < 3 and guard < 40:
		guard += 1
		var cand: int = ans + int(deltas[r.randi() % deltas.size()])
		if cand > 0 and not out.has(cand):
			out.append(cand)
	while out.size() < 3:
		out.append(ans + out.size() * 3)
	_shuffle_with(r, out)
	var typed: Array[int] = []
	for v: Variant in out:
		typed.append(int(v))
	return typed

func _shuffle_with(r: RandomNumberGenerator, arr: Array) -> void:
	for i: int in range(arr.size() - 1, 0, -1):
		var j: int = r.randi() % (i + 1)
		var tmp: Variant = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp

func build_hud_payload() -> Dictionary:
	var act: Dictionary = ACTS[clampi(act_index, 0, ACTS.size() - 1)]
	var mcfg: Dictionary = get_map_cfg()
	var w_list: Array = []
	for id: String in weapons.keys():
		var w: Dictionary = WEAPONS[id]
		var lv: int = int(weapons[id])
		if lv >= 6:
			w_list.append({"icon": w["evo_icon"], "name": w["evo_name"], "lv": "MAX", "evo": true})
		else:
			w_list.append({"icon": w["icon"], "name": w["name"], "lv": lv, "evo": false})
	for id: String in passives.keys():
		var p: Dictionary = PASSIVES[id]
		w_list.append({"icon": p["icon"], "name": p["name"], "lv": passives[id], "evo": false})
	return {
		"score": score,
		"elapsed": elapsed,
		"remaining": maxf(0.0, RUN_DURATION_SEC - elapsed),
		"actIndex": act_index,
		"actName": str(mcfg["name"]) + " · " + str(act["name"]),
		"mapId": map_id,
		"heroId": hero_id,
		"hp": int(ceil(maxf(0.0, hp))),
		"maxHp": int(max_hp),
		"level": level,
		"xp": xp,
		"xpNeed": xp_need,
		"kills": kills,
		"correct": correct_math,
		"wrong": wrong_math,
		"streak": streak,
		"bestStreak": best_streak,
		"bossKills": boss_kills,
		"evolutions": evolutions_count,
		"feverSec": maxf(0.0, fever_timer),
		"dashRatio": clampf(dash_ratio, 0.0, 1.0),
		"boss": boss_info,
		"minimap": minimap_info,
		"seed": run_seed,
		"weapons": w_list,
	}
