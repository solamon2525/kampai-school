extends Node

signal hud_updated
signal toast_requested(message: String, tone: String, speak_word: String)
signal question_updated(q_data: Dictionary)
signal levelup_opened(options: Array)
signal round_ended(won: bool, cause: String)

const RUN_DURATION_SEC: float = 180.0
const ARENA_TILES: int = 80
const TILE_PX: float = 24.0
const ARENA_PX: float = ARENA_TILES * TILE_PX # 1920 x 1920

const ACTS: Array = [
	{"id": 1, "name": "องก์ 1 · ป่าสไลม์บวกลบ (ป.4)", "start": 0.0, "spawn_rate": 0.72, "hp_mult": 1.0, "spd_mult": 1.0, "boss_at": 52.0, "boss_name": "👑 ราชาสไลม์บวกลบ", "tint": Color("#111936")},
	{"id": 2, "name": "องก์ 2 · ป้อมคูณหารสายฟ้า (ป.5)", "start": 60.0, "spawn_rate": 0.56, "hp_mult": 1.55, "spd_mult": 1.15, "boss_at": 112.0, "boss_name": "🛡️ อัศวินคูณหาร", "tint": Color("#1b133a")},
	{"id": 3, "name": "องก์ 3 · บัลลังก์สมการมังกร (ป.6)", "start": 120.0, "spawn_rate": 0.42, "hp_mult": 2.25, "spd_mult": 1.28, "boss_at": 168.0, "boss_name": "🐉 มังกรสมการป.6", "tint": Color("#2a1026")},
]

const WEAPONS: Dictionary = {
	"wand": {"name": "คทาประกายดาว", "icon": "✨", "max": 5, "desc": [
		"ยิงลำแสงดาวใส่มอนสเตอร์ใกล้ที่สุดอัตโนมัติ",
		"ยิงเพิ่มเป็น 2 นัดต่อชุด + รวดเร็วขึ้น",
		"ความเสียหาย +35% และยิงเร็วขึ้น 15%",
		"ยิงกระจาย 3 นัด + เจาะทะลุเป้าหมาย",
		"ปลุกพลัง! ดาวตก 4 นัดต่อเนื่อง (Star Storm)"
	]},
	"orbs": {"name": "วงแหวนพาย (π)", "icon": "🛡️", "max": 5, "desc": [
		"อัญเชิญลูกแก้วโล่ 2 ดวงหมุนป้องกันรอบตัว",
		"เพิ่มจำนวนลูกแก้วเป็น 3 ดวง หมุนเร็วขึ้น",
		"ขยายรัศมีวงแหวน + ความเสียหาย +30%",
		"เพิ่มเป็น 4 ดวง กวาดฝูงสไลม์รอบทิศ",
		"ปลุกพลัง! วงแหวนแสงทอง 5 ดวงอมตะ (Pi Halo)"
	]},
	"lightning": {"name": "สายฟ้าสมการ", "icon": "⚡", "max": 5, "desc": [
		"ฟาดสายฟ้าสีทองชิ่งศัตรู 2 ตัวใกล้เคียง",
		"ชิ่งได้ 3 ตัว + คูลดาวน์ไวขึ้น",
		"พลังโจมตี +40% ระยะฟาดกว้างขึ้น",
		"ชิ่งได้ 4 ตัว พร้อมสะเก็ดประกาย",
		"ปลุกพลัง! พายุสายฟ้าชิ่ง 6 ตัว (Thunder Theorem)"
	]},
	"boomerang": {"name": "จักรเศษส่วน", "icon": "🌀", "max": 5, "desc": [
		"ขว้างจักรเวทพุ่งทะลุศัตรูแล้วหมุนย้อนกลับ",
		"เพิ่มขนาดใบจักร + ขว้าง 2 ทิศทาง",
		"ความเร็วหมุนและพลังทำลาย +35%",
		"ขว้าง 3 แฉก กวาดแนวหน้าและหลัง",
		"ปลุกพลัง! จักรสุริยะยักษ์ 4 ทิศ (Fraction Nova)"
	]},
	"nova": {"name": "คลื่นระเบิดคูณสิบ", "icon": "💥", "max": 5, "desc": [
		"ปล่อยคลื่นวงเวทรอบตัวผลักและทำลายศัตรูเป็นระยะ",
		"รัศมีระเบิดกว้างขึ้น +25%",
		"คูลดาวน์สั้นลง 20% + ผลักแรงขึ้น",
		"ความเสียหาย +45% + รัศมีกว้างมาก",
		"ปลุกพลัง! คลื่นอัลติเมทคูณร้อย (Deca Shock)"
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
var mode: String = "normal"
var run_seed: int = 1337
var elapsed: float = 0.0
var act_index: int = 0

var score: int = 0
var kills: int = 0
var correct_math: int = 0
var wrong_math: int = 0
var streak: int = 0
var best_streak: int = 0
var boss_kills: int = 0

var level: int = 1
var xp: int = 0
var xp_need: int = 60
var hp: float = 100.0
var max_hp: float = 100.0

var weapons: Dictionary = {"wand": 1}
var passives: Dictionary = {}
var draft_options: Array = []

var wave_rng := RandomNumberGenerator.new()
var math_rng := RandomNumberGenerator.new()
var draft_rng := RandomNumberGenerator.new()

static func hash_seed(base_seed: int, tag: String) -> int:
	var h: int = (base_seed & 0x7fffffff) ^ 0x45d9f3b
	for i: int in range(tag.length()):
		h = int((h * 33 + tag.unicode_at(i)) & 0x7fffffff)
	return maxi(1, h)

func start_new_round(p_seed: int, p_mode: String = "normal") -> void:
	run_seed = maxi(1, p_seed)
	mode = p_mode
	is_active = true
	is_ended = false
	is_levelup = false
	elapsed = 0.0
	act_index = 0

	score = 0
	kills = 0
	correct_math = 0
	wrong_math = 0
	streak = 0
	best_streak = 0
	boss_kills = 0

	level = 1
	xp = 0
	xp_need = 60
	hp = 100.0
	max_hp = 100.0

	weapons = {"wand": 1}
	passives = {}
	draft_options = []

	wave_rng.seed = hash_seed(run_seed, "wave")
	math_rng.seed = hash_seed(run_seed, "math")
	draft_rng.seed = hash_seed(run_seed, "draft")
	hud_updated.emit()

func get_cooldown_mult() -> float:
	var h: int = int(passives.get("haste", 0))
	return pow(0.88, float(h))

func get_move_speed() -> float:
	var b: int = int(passives.get("boots", 0))
	return 155.0 * (1.0 + float(b) * 0.14)

func get_pickup_radius() -> float:
	var m: int = int(passives.get("magnet", 0))
	return 76.0 * (1.0 + float(m) * 0.45)

func add_score(pts: int) -> void:
	score = maxi(0, score + pts)
	hud_updated.emit()

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
	var pool: Array = []
	for id: String in WEAPONS.keys():
		var w: Dictionary = WEAPONS[id]
		var cur: int = int(weapons.get(id, 0))
		if cur < int(w["max"]):
			var descs: Array = w["desc"]
			pool.append({
				"kind": "weapon", "id": id, "icon": w["icon"], "name": w["name"],
				"nextLv": cur + 1, "isNew": cur == 0,
				"desc": str(descs[mini(cur, descs.size() - 1)])
			})
	for id: String in PASSIVES.keys():
		var p: Dictionary = PASSIVES[id]
		var cur: int = int(passives.get(id, 0))
		if cur < int(p["max"]):
			pool.append({
				"kind": "passive", "id": id, "icon": p["icon"], "name": p["name"],
				"nextLv": cur + 1, "isNew": cur == 0,
				"desc": str(p["desc"])
			})
	_shuffle_with(draft_rng, pool)
	if pool.is_empty():
		draft_options = [{"kind": "heal", "id": "heal", "icon": "💖", "name": "ฟื้นฟูพลัง & โบนัส", "nextLv": 1, "isNew": false, "desc": "ฟื้นฟู +35 HP และรับคะแนน +120"}]
	else:
		draft_options = pool.slice(0, mini(3, pool.size()))
	is_levelup = true
	levelup_opened.emit(draft_options)
	hud_updated.emit()

func pick_draft(idx: int) -> void:
	if not is_levelup or draft_options.is_empty():
		return
	var opt: Dictionary = draft_options[clampi(idx, 0, draft_options.size() - 1)]
	var kind: String = str(opt.get("kind", "heal"))
	var id: String = str(opt.get("id", ""))
	if kind == "weapon":
		weapons[id] = int(weapons.get(id, 0)) + 1
	elif kind == "passive":
		passives[id] = int(passives.get(id, 0)) + 1
		if id == "vitality":
			max_hp += 25.0
			hp = minf(max_hp, hp + 30.0)
	else:
		hp = minf(max_hp, hp + 35.0)
		score += 120
	is_levelup = false
	hud_updated.emit()

func finish_round(won: bool, cause: String) -> void:
	if is_ended:
		return
	is_ended = true
	is_active = false
	is_levelup = false
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
			var pct_list: Array[int] = [10, 20, 25, 50]
			var pct: int = pct_list[r.randi() % pct_list.size()]
			var base: int = r.randi_range(2, 16) * 20
			answer = int(round(float(pct * base) / 100.0))
			op = "pct"
			prompt = "%d%% ของ %d = ?" % [pct, base]
			explain = "(%d × %d) ÷ 100 = %d" % [pct, base, answer]

	var choices: Array[int] = _build_choices(r, answer, op)
	return {
		"grade": grade,
		"op": op,
		"prompt": prompt,
		"answer": answer,
		"choices": choices,
		"explain": explain,
	}

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
	var w_list: Array = []
	for id: String in weapons.keys():
		var w: Dictionary = WEAPONS[id]
		w_list.append({"icon": w["icon"], "name": w["name"], "lv": weapons[id]})
	for id: String in passives.keys():
		var p: Dictionary = PASSIVES[id]
		w_list.append({"icon": p["icon"], "name": p["name"], "lv": passives[id]})
	return {
		"score": score,
		"elapsed": elapsed,
		"remaining": maxf(0.0, RUN_DURATION_SEC - elapsed),
		"actIndex": act_index,
		"actName": act["name"],
		"hp": int(ceil(maxf(0.0, hp))),
		"maxHp": int(max_hp),
		"level": level,
		"xp": xp,
		"xpNeed": xp_need,
		"kills": kills,
		"correct": correct_math,
		"wrong": wrong_math,
		"bestStreak": best_streak,
		"bossKills": boss_kills,
		"seed": run_seed,
		"weapons": w_list,
	}
