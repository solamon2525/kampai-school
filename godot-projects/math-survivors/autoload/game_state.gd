extends Node

signal hud_updated
signal toast_requested(message: String, tone: String, speak_word: String)
signal question_updated(q_data: Dictionary)
signal levelup_opened(payload: Dictionary)
signal chest_opened(q_data: Dictionary)
signal round_ended(won: bool, cause: String)

const RUN_DURATION_SOLO: float = 180.0
const RUN_DURATION_RIVAL: float = 120.0
const ARENA_TILES: int = 80
const TILE_PX: float = 24.0
const ARENA_PX: float = ARENA_TILES * TILE_PX

const MAPS: Dictionary = {
	"arcane_temple": {"id": "arcane_temple", "name": "วิหารรูนโบราณ", "row": 0, "bgm": "arena", "score_mult": 1.0, "pillar": "pillar"},
	"crystal_forest": {"id": "crystal_forest", "name": "ป่าคริสตัลคณิต", "row": 1, "bgm": "forest", "score_mult": 1.1, "pillar": "crystal_pillar"},
	"lava_citadel": {"id": "lava_citadel", "name": "ปราสาทลาวาสมการ", "row": 2, "bgm": "lava", "score_mult": 1.25, "pillar": "lava_pillar"},
}

# 7 Balanced Classes — Every class totals EXACTLY 25 stat points (VIT+SPD+ATK+MAG+AGI = 25)
const HEROES: Dictionary = {
	"mage": {"id": "mage", "name": "จอมเวทดาวฤกษ์", "icon": "✨", "starter": true, "weapon": "wand", "vit": 4, "spd": 5, "atk": 3, "mag": 8, "agi": 5, "trait": "Arcane Echo: ระเบิดลูกแก้วกว้าง +30% + ดาวตกเสริม 2 นัด"},
	"knight": {"id": "knight", "name": "อัศวินโล่พาย", "icon": "🛡️", "starter": true, "weapon": "orbs", "vit": 8, "spd": 4, "atk": 7, "mag": 2, "agi": 4, "trait": "Fortress Guard: เกราะบล็อกดาเมจ 1 ครั้งทุก 6 วิ"},
	"ranger": {"id": "ranger", "name": "พรานความเร็ว", "icon": "🏹", "starter": true, "weapon": "boomerang", "vit": 3, "spd": 8, "atk": 6, "mag": 1, "agi": 7, "trait": "Wind Runner: Dash ไว 2 วิ + ยิงรัว +35% หลังพุ่ง"},
	"inventor": {"id": "inventor", "name": "นักประดิษฐ์สายฟ้า", "icon": "⚡", "starter": false, "weapon": "lightning", "vit": 3, "spd": 6, "atk": 3, "mag": 7, "agi": 6, "trait": "Overcharge: ทุก 4 สายฟ้าวางเสาเทสลาช็อต 5 วิ"},
	"alchemist": {"id": "alchemist", "name": "หมอยาพฤกษา", "icon": "💚", "starter": false, "weapon": "nova", "vit": 6, "spd": 5, "atk": 2, "mag": 7, "agi": 5, "trait": "Math Elixir: รีเจน +2 HP/5วิ · โคออฟฮีลเพื่อน +25 & ชุบไว x2"},
	"berserker": {"id": "berserker", "name": "นักรบคลั่งสมการ", "icon": "⚔️", "starter": false, "weapon": "orbs", "vit": 6, "spd": 5, "atk": 9, "mag": 1, "agi": 4, "trait": "Blood Math: เลือดยิ่งต่ำยิ่งตีแรง (+55%) + ดูดเลือดทุก 15 ตัว"},
	"chronomancer": {"id": "chronomancer", "name": "ปราชญ์กาลเวลา", "icon": "🌌", "starter": false, "weapon": "wand", "vit": 4, "spd": 5, "atk": 2, "mag": 8, "agi": 6, "trait": "Time Dilation: Dash หน่วงศัตรู -50% นาน 2.5 วิ + Fever นานขึ้น"},
}

const ACTS: Array = [
	{"id": 1, "name": "องก์ 1 · ป.4 บวกลบคูณหาร", "start": 0.0, "spawn_rate": 0.72, "hp_mult": 1.0, "spd_mult": 1.0, "boss_at": 52.0, "boss_name": "👑 ราชาสไลม์บวกลบ"},
	{"id": 2, "name": "องก์ 2 · ป.5 คูณหารระคน", "start": 60.0, "spawn_rate": 0.56, "hp_mult": 1.55, "spd_mult": 1.15, "boss_at": 112.0, "boss_name": "🛡️ อัศวินคูณหาร"},
	{"id": 3, "name": "องก์ 3 · ป.6 สมการมังกร", "start": 120.0, "spawn_rate": 0.42, "hp_mult": 2.25, "spd_mult": 1.28, "boss_at": 168.0, "boss_name": "🐉 มังกรสมการป.6"},
]

const WEAPONS: Dictionary = {
	"wand": {"name": "คทาประกายดาว", "icon": "✨", "stat": "mag", "max": 5, "pair": "haste", "evo_name": "ฝนดาวตกจักรวาล", "evo_icon": "🌟", "evo_desc": "วิวัฒนาการ! ยิงดาวตก 5 นัดรัวเจาะทะลุ", "desc": ["ยิงลำแสงดาวอัตโนมัติ", "ยิงเพิ่ม 2 นัดต่อชุด", "ความเสียหาย +35% ยิงไวขึ้น", "ยิงกระจาย 3 นัด เจาะทะลุ", "ดาวตก 4 นัด (พร้อมวิวัฒนาการคู่ ⏱️)"]},
	"orbs": {"name": "วงแหวนพาย (π)", "icon": "🛡️", "stat": "atk", "max": 5, "pair": "vitality", "evo_name": "โล่สุริยะอมตะ", "evo_icon": "☀️", "evo_desc": "วิวัฒนาการ! วงแหวนสุริยะ 6 ดวง + ดูดเลือด", "desc": ["ลูกแก้วโล่ 2 ดวงหมุนรอบตัว", "เพิ่มเป็น 3 ดวง หมุนไวขึ้น", "ขยายรัศมี + ความเสียหาย +30%", "เพิ่มเป็น 4 ดวง กวาดรอบทิศ", "วงแหวน 5 ดวง (พร้อมวิวัฒนาการคู่ ❤️)"]},
	"lightning": {"name": "สายฟ้าสมการ", "icon": "⚡", "stat": "mag", "max": 5, "pair": "magnet", "evo_name": "พายุแม่เหล็กไฟฟ้า", "evo_icon": "🌩️", "evo_desc": "วิวัฒนาการ! สายฟ้าชิ่ง 8 ตัว + ดูดเพชร", "desc": ["ฟาดสายฟ้าชิ่งศัตรู 2 ตัว", "ชิ่ง 3 ตัว + คูลดาวน์ไวขึ้น", "พลังโจมตี +40% ระยะกว้างขึ้น", "ชิ่ง 4 ตัว พร้อมประกายไฟ", "สายฟ้าชิ่ง 6 ตัว (พร้อมวิวัฒนาการคู่ 🧲)"]},
	"boomerang": {"name": "จักรเศษส่วน", "icon": "🌀", "stat": "atk", "max": 5, "pair": "boots", "evo_name": "กงจักรเวลา", "evo_icon": "💫", "evo_desc": "วิวัฒนาการ! จักรยักษ์ 6 ทิศลดความเร็วศัตรู 40%", "desc": ["ขว้างจักรเวทพุ่งทะลุแล้วย้อนกลับ", "เพิ่มขนาด + ขว้าง 2 ทิศทาง", "ความเร็วหมุนและพลังทำลาย +35%", "ขว้าง 3 แฉก กวาดหน้า-หลัง", "จักรสุริยะ 4 ทิศ (พร้อมวิวัฒนาการคู่ 👟)"]},
	"nova": {"name": "คลื่นระเบิดคูณสิบ", "icon": "💥", "stat": "mag", "max": 5, "pair": "haste", "evo_name": "คลื่นซูเปอร์โนวา", "evo_icon": "☄️", "evo_desc": "วิวัฒนาการ! ระเบิดวงเวท 2 จังหวะทั้งจอ", "desc": ["คลื่นวงเวทรอบตัวผลักศัตรู", "รัศมีระเบิดกว้างขึ้น +25%", "คูลดาวน์สั้นลง 20% ผลักแรงขึ้น", "ความเสียหาย +45% รัศมีกว้างมาก", "คลื่นคูณร้อย (พร้อมวิวัฒนาการคู่ ⏱️)"]},
}

const PASSIVES: Dictionary = {
	"haste": {"name": "นาฬิกาความเร็ว", "icon": "⏱️", "max": 4, "desc": "ลดคูลดาวน์อาวุธทุกชนิด -12%"},
	"boots": {"name": "รองเท้าลมกรด", "icon": "👟", "max": 4, "desc": "วิ่งเร็วขึ้น +14%"},
	"magnet": {"name": "แม่เหล็กเพชร EXP", "icon": "🧲", "max": 4, "desc": "ดูดเพชร EXP กว้างขึ้น +45%"},
	"vitality": {"name": "หัวใจศิลา", "icon": "❤️", "max": 4, "desc": "Max HP +25 และฮีลทันที +30 HP"},
}

var is_active: bool = false
var is_ended: bool = false
var is_levelup: bool = false
var is_chest_open: bool = false
var mode: String = "normal" # normal | practice | online | coop_team | coop_rival
var map_id: String = "arcane_temple"
var run_seed: int = 1337
var run_duration: float = RUN_DURATION_SOLO
var elapsed: float = 0.0
var act_index: int = 0
var reduce_shake: bool = false

# Players array: [p1] in 1P, [p1, p2] in 2P Co-op / Rival
var players: Array[Dictionary] = []
var team_xp: int = 0
var team_xp_need: int = 60
var team_level: int = 1
var team_streak: int = 0
var best_streak: int = 0
var boss_kills: int = 0
var min_hp_ratio_act1: float = 1.0

var active_chest_q: Dictionary = {}
var chest_opener_idx: int = 0
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

static func get_hero_cfg(hid: String) -> Dictionary:
	return HEROES.get(hid, HEROES["mage"])

static func compute_class_metrics(hid: String) -> Dictionary:
	var c: Dictionary = get_hero_cfg(hid)
	var vit: int = int(c["vit"])
	var spd: int = int(c["spd"])
	var atk: int = int(c["atk"])
	var mag: int = int(c["mag"])
	var agi: int = int(c["agi"])
	var max_hp: float = 85.0 + float(vit) * 11.0
	var defense: float = float(vit) * 4.5
	var ehp: float = max_hp * (100.0 + defense) / 100.0
	var phys_mult: float = 0.76 + float(atk) * 0.08
	var mag_mult: float = 0.76 + float(mag) * 0.08
	var area_mult: float = 0.85 + float(mag) * 0.05
	var cd_mult: float = clampf(1.24 - float(agi) * 0.06, 0.45, 1.5)
	var move_spd: float = 122.0 + float(spd) * 9.0
	var w_stat: String = str(WEAPONS[str(c["weapon"])]["stat"])
	var primary_mult: float = phys_mult if w_stat == "atk" else (mag_mult * (1.0 + (area_mult - 1.0) * 0.3))
	var power_index: float = (ehp / 175.0) * 0.35 + (primary_mult / cd_mult) * 0.45 + (move_spd / 167.0) * 0.20
	return {
		"total_pts": vit + spd + atk + mag + agi,
		"max_hp": max_hp,
		"defense": defense,
		"ehp": ehp,
		"phys_mult": phys_mult,
		"mag_mult": mag_mult,
		"area_mult": area_mult,
		"cd_mult": cd_mult,
		"move_spd": move_spd,
		"power_index": power_index,
	}

func is_two_player() -> bool:
	return mode == "coop_team" or mode == "coop_rival"

func get_map_cfg() -> Dictionary:
	return MAPS.get(map_id, MAPS["arcane_temple"])

func _make_player_state(idx: int, hid: String) -> Dictionary:
	var hcfg: Dictionary = get_hero_cfg(hid)
	var m: Dictionary = compute_class_metrics(hid)
	return {
		"idx": idx,
		"hero_id": str(hcfg["id"]),
		"name": str(hcfg["name"]),
		"icon": str(hcfg["icon"]),
		"hp": float(m["max_hp"]),
		"max_hp": float(m["max_hp"]),
		"defense": float(m["defense"]),
		"base_spd": float(m["move_spd"]),
		"phys_mult": float(m["phys_mult"]),
		"mag_mult": float(m["mag_mult"]),
		"area_mult": float(m["area_mult"]),
		"base_cd_mult": float(m["cd_mult"]),
		"weapons": {str(hcfg["weapon"]): 1},
		"passives": {},
		"score": 0,
		"kills": 0,
		"correct": 0,
		"wrong": 0,
		"evolutions": 0,
		"fever_timer": 0.0,
		"speed_boost_timer": 0.0,
		"slow_debuff_timer": 0.0,
		"rapid_buff_timer": 0.0,
		"guard_ready": str(hcfg["id"]) == "knight",
		"guard_cd": 0.0,
		"dash_ratio": 1.0,
		"downed": false,
		"revive_progress": 0.0,
		"respawn_timer": 0.0,
		"draft_options": [],
		"draft_picked": false,
	}

func start_new_round(p_seed: int, p_mode: String = "normal", p_map: String = "arcane_temple", p1_hero: String = "mage", p2_hero: String = "knight") -> void:
	run_seed = maxi(1, p_seed)
	mode = p_mode
	map_id = p_map if MAPS.has(p_map) else "arcane_temple"
	run_duration = RUN_DURATION_RIVAL if mode == "coop_rival" else RUN_DURATION_SOLO

	is_active = true
	is_ended = false
	is_levelup = false
	is_chest_open = false
	elapsed = 0.0
	act_index = 0

	team_xp = 0
	team_xp_need = 75 if is_two_player() else 60
	team_level = 1
	team_streak = 0
	best_streak = 0
	boss_kills = 0
	min_hp_ratio_act1 = 1.0

	players.clear()
	players.append(_make_player_state(0, p1_hero))
	if is_two_player():
		players.append(_make_player_state(1, p2_hero))

	active_chest_q = {}
	boss_info = {}
	minimap_info = {}

	wave_rng.seed = hash_seed(run_seed, "wave")
	math_rng.seed = hash_seed(run_seed, "math")
	draft_rng.seed = hash_seed(run_seed, "draft")
	hud_updated.emit()

func get_player(idx: int) -> Dictionary:
	return players[clampi(idx, 0, players.size() - 1)]

func get_cooldown_mult(idx: int) -> float:
	var p: Dictionary = get_player(idx)
	var h: int = int(p["passives"].get("haste", 0))
	var mult: float = float(p["base_cd_mult"]) * pow(0.88, float(h))
	if float(p["fever_timer"]) > 0.0:
		mult *= 0.75
	if float(p["rapid_buff_timer"]) > 0.0:
		mult *= 0.65
	return clampf(mult, 0.35, 1.5)

func get_move_speed(idx: int) -> float:
	var p: Dictionary = get_player(idx)
	var b: int = int(p["passives"].get("boots", 0))
	var spd: float = float(p["base_spd"]) * (1.0 + float(b) * 0.14)
	if float(p["speed_boost_timer"]) > 0.0:
		spd *= 1.45
	if float(p["slow_debuff_timer"]) > 0.0:
		spd *= 0.78
	return spd

func get_pickup_radius(idx: int) -> float:
	var p: Dictionary = get_player(idx)
	if float(p["fever_timer"]) > 0.0:
		return 1400.0
	var m: int = int(p["passives"].get("magnet", 0))
	return 78.0 * (1.0 + float(m) * 0.45)

func get_damage_mult(idx: int, weapon_id: String) -> float:
	var p: Dictionary = get_player(idx)
	var stat_kind: String = str(WEAPONS.get(weapon_id, {"stat": "mag"})["stat"])
	var mult: float = float(p["phys_mult"]) if stat_kind == "atk" else float(p["mag_mult"])
	# Berserker Blood Math: up to +55% dmg as HP drops below 40%
	if str(p["hero_id"]) == "berserker":
		var ratio: float = clampf(float(p["hp"]) / maxf(1.0, float(p["max_hp"])), 0.0, 1.0)
		var missing: float = clampf(1.0 - ratio, 0.0, 0.6) / 0.6
		mult *= (1.0 + missing * 0.55)
	return mult

func apply_damage_to_player(idx: int, raw_dmg: float) -> float:
	var p: Dictionary = get_player(idx)
	if bool(p["downed"]) or float(p["respawn_timer"]) > 0.0:
		return 0.0
	if str(p["hero_id"]) == "knight" and bool(p["guard_ready"]):
		p["guard_ready"] = false
		p["guard_cd"] = 6.0
		return -1.0 # Blocked!
	var def_val: float = float(p["defense"])
	var mitigated: float = maxf(1.0, round(raw_dmg * 100.0 / (100.0 + def_val)))
	p["hp"] = maxf(0.0, float(p["hp"]) - mitigated)
	if act_index == 0:
		min_hp_ratio_act1 = minf(min_hp_ratio_act1, float(p["hp"]) / maxf(1.0, float(p["max_hp"])))
	hud_updated.emit()
	return mitigated

func add_score(idx: int, pts: int) -> void:
	var p: Dictionary = get_player(idx)
	var mult: float = float(get_map_cfg()["score_mult"])
	p["score"] = maxi(0, int(p["score"]) + int(round(float(pts) * mult)))
	hud_updated.emit()

func total_score() -> int:
	var s: int = 0
	for p: Dictionary in players:
		s += int(p["score"])
	return s

func can_evolve(idx: int, weapon_id: String) -> bool:
	var p: Dictionary = get_player(idx)
	if not WEAPONS.has(weapon_id):
		return false
	if int(p["weapons"].get(weapon_id, 0)) != 5:
		return false
	var pair_id: String = str(WEAPONS[weapon_id]["pair"])
	return int(p["passives"].get(pair_id, 0)) >= 1

func add_xp(idx: int, amount: int) -> bool:
	team_xp += amount
	add_score(idx, 3)
	if team_xp >= team_xp_need:
		team_xp -= team_xp_need
		team_level += 1
		team_xp_need = int(round(float(team_xp_need) * 1.32 + 25.0))
		_prepare_drafts()
		return true
	hud_updated.emit()
	return false

func _build_draft_for(idx: int) -> Array:
	var p: Dictionary = get_player(idx)
	var evo_pool: Array = []
	var pool: Array = []
	for id: String in WEAPONS.keys():
		var w: Dictionary = WEAPONS[id]
		var cur: int = int(p["weapons"].get(id, 0))
		if can_evolve(idx, id):
			evo_pool.append({"kind": "evolution", "id": id, "icon": w["evo_icon"], "name": w["evo_name"], "nextLv": 6, "isNew": false, "isEvo": true, "desc": str(w["evo_desc"]), "synergy": "🌟 วิวัฒนาการขั้นสุดยอด!"})
		elif cur < int(w["max"]):
			var descs: Array = w["desc"]
			var p_info: Dictionary = PASSIVES[str(w["pair"])]
			pool.append({"kind": "weapon", "id": id, "icon": w["icon"], "name": w["name"], "nextLv": cur + 1, "isNew": cur == 0, "isEvo": false, "desc": str(descs[mini(cur, descs.size() - 1)]), "synergy": "คู่ผสม: %s %s → %s" % [str(p_info["icon"]), str(p_info["name"]), str(w["evo_name"])]})
	for id: String in PASSIVES.keys():
		var pv: Dictionary = PASSIVES[id]
		var cur2: int = int(p["passives"].get(id, 0))
		if cur2 < int(pv["max"]):
			pool.append({"kind": "passive", "id": id, "icon": pv["icon"], "name": pv["name"], "nextLv": cur2 + 1, "isNew": cur2 == 0, "isEvo": false, "desc": str(pv["desc"]), "synergy": ""})
	_shuffle_with(draft_rng, pool)
	var chosen: Array = []
	for e: Variant in evo_pool:
		if chosen.size() < 3:
			chosen.append(e)
	for item: Variant in pool:
		if chosen.size() < 3:
			chosen.append(item)
	if chosen.is_empty():
		chosen = [{"kind": "heal", "id": "heal", "icon": "💖", "name": "ฟื้นฟูพลัง & โบนัส", "nextLv": 1, "isNew": false, "isEvo": false, "desc": "ฟื้นฟู +35 HP และรับ +120", "synergy": ""}]
	return chosen

func _prepare_drafts() -> void:
	var all_opts: Array = []
	for i: int in range(players.size()):
		players[i]["draft_options"] = _build_draft_for(i)
		players[i]["draft_picked"] = false
		all_opts.append(players[i]["draft_options"])
	is_levelup = true
	levelup_opened.emit({"twoPlayer": is_two_player(), "playerOptions": all_opts})
	hud_updated.emit()

func pick_draft(player_idx: int, card_idx: int) -> bool:
	if not is_levelup:
		return false
	var p: Dictionary = get_player(player_idx)
	if bool(p["draft_picked"]) or (p["draft_options"] as Array).is_empty():
		return _all_drafts_picked()
	var opts: Array = p["draft_options"]
	var opt: Dictionary = opts[clampi(card_idx, 0, opts.size() - 1)]
	_apply_upgrade_item(player_idx, opt)
	p["draft_picked"] = true
	if _all_drafts_picked():
		is_levelup = false
	hud_updated.emit()
	return not is_levelup

func _all_drafts_picked() -> bool:
	for p: Dictionary in players:
		if not bool(p["draft_picked"]):
			return false
	return true

func _apply_upgrade_item(idx: int, opt: Dictionary) -> void:
	var p: Dictionary = get_player(idx)
	var kind: String = str(opt.get("kind", "heal"))
	var id: String = str(opt.get("id", ""))
	if kind == "evolution":
		p["weapons"][id] = 6
		p["evolutions"] = int(p["evolutions"]) + 1
		add_score(idx, 250)
	elif kind == "weapon":
		p["weapons"][id] = int(p["weapons"].get(id, 0)) + 1
	elif kind == "passive":
		p["passives"][id] = int(p["passives"].get(id, 0)) + 1
		if id == "vitality":
			p["max_hp"] = float(p["max_hp"]) + 25.0
			p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 30.0)
	else:
		p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 35.0)
		add_score(idx, 120)

func open_boss_chest(opener_idx: int) -> void:
	chest_opener_idx = clampi(opener_idx, 0, players.size() - 1)
	active_chest_q = generate_question(act_index + 1)
	is_chest_open = true
	chest_opened.emit(active_chest_q)

func resolve_boss_chest(picked_answer: int) -> Dictionary:
	if not is_chest_open or active_chest_q.is_empty():
		return {"correct": false, "rewards": []}
	var ans: int = int(active_chest_q["answer"])
	var ok: bool = picked_answer == ans
	var exp_txt: String = str(active_chest_q["explain"])
	is_chest_open = false
	active_chest_q = {}

	var rewards: Array[String] = []
	var targets: Array = [0, 1] if mode == "coop_team" else [chest_opener_idx]
	for idx_v: Variant in targets:
		var idx: int = int(idx_v)
		var p: Dictionary = get_player(idx)
		if ok:
			p["correct"] = int(p["correct"]) + 1
			add_score(idx, 300)
			p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 30.0)
			var evolved: bool = false
			for wid: String in WEAPONS.keys():
				if can_evolve(idx, wid):
					p["weapons"][wid] = 6
					p["evolutions"] = int(p["evolutions"]) + 1
					rewards.append("P%d: %s %s" % [idx + 1, str(WEAPONS[wid]["evo_icon"]), str(WEAPONS[wid]["evo_name"])])
					evolved = true
					break
			if not evolved:
				for _k: int in range(2):
					rewards.append("P%d: %s" % [idx + 1, _grant_random_upgrade(idx)])
		else:
			p["wrong"] = int(p["wrong"]) + 1
			rewards.append("P%d: %s" % [idx + 1, _grant_random_upgrade(idx)])
	if ok:
		team_streak += 1
		best_streak = maxi(best_streak, team_streak)
	else:
		team_streak = 0
	hud_updated.emit()
	return {"correct": ok, "answer": ans, "explain": exp_txt, "rewards": rewards}

func _grant_random_upgrade(idx: int) -> String:
	var p: Dictionary = get_player(idx)
	var cands: Array = []
	for wid: String in p["weapons"].keys():
		var lv: int = int(p["weapons"][wid])
		if lv < 5:
			cands.append({"kind": "weapon", "id": wid, "label": str(WEAPONS[wid]["name"]) + " Lv." + str(lv + 1)})
	for pid: String in PASSIVES.keys():
		var lv2: int = int(p["passives"].get(pid, 0))
		if lv2 < int(PASSIVES[pid]["max"]):
			cands.append({"kind": "passive", "id": pid, "label": str(PASSIVES[pid]["name"]) + " Lv." + str(lv2 + 1)})
	if cands.is_empty():
		p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 25.0)
		add_score(idx, 150)
		return "+25 HP & +150"
	var pick: Dictionary = cands[draft_rng.randi() % cands.size()]
	_apply_upgrade_item(idx, pick)
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
			answer = a + b; op = "add"; prompt = "%d + %d = ?" % [a, b]; explain = "%d + %d = %d" % [a, b, answer]
		elif pick < 0.56:
			var b2: int = r.randi_range(120, 480); var ans2: int = r.randi_range(130, 520); var a2: int = b2 + ans2
			answer = ans2; op = "sub"; prompt = "%d − %d = ?" % [a2, b2]; explain = "%d − %d = %d" % [a2, b2, answer]
		elif pick < 0.80:
			var a3: int = r.randi_range(12, 36); var b3: int = r.randi_range(4, 9)
			answer = a3 * b3; op = "mul"; prompt = "%d × %d = ?" % [a3, b3]; explain = "%d × %d = %d" % [a3, b3, answer]
		else:
			var b4: int = r.randi_range(4, 12); var ans4: int = r.randi_range(6, 18); var a4: int = b4 * ans4
			answer = ans4; op = "div"; prompt = "%d ÷ %d = ?" % [a4, b4]; explain = "%d × %d = %d ดังนั้นตอบ %d" % [b4, ans4, a4, ans4]
	elif act == 2:
		grade = "ป.5"
		if pick < 0.30:
			var a5: int = r.randi_range(14, 38); var b5: int = r.randi_range(11, 19)
			answer = a5 * b5; op = "mul"; prompt = "%d × %d = ?" % [a5, b5]; explain = "%d × %d = %d" % [a5, b5, answer]
		elif pick < 0.58:
			var b6: int = r.randi_range(11, 25); var ans6: int = r.randi_range(8, 24); var a6: int = b6 * ans6
			answer = ans6; op = "div"; prompt = "%d ÷ %d = ?" % [a6, b6]; explain = "%d ÷ %d = %d" % [a6, b6, ans6]
		elif pick < 0.80:
			var a7: int = r.randi_range(18, 52); var b7: int = r.randi_range(12, 38); var c7: int = r.randi_range(3, 7)
			answer = (a7 + b7) * c7; op = "mix"; prompt = "(%d + %d) × %d = ?" % [a7, b7, c7]; explain = "ในวงเล็บก่อน: %d × %d = %d" % [a7 + b7, c7, answer]
		else:
			var a8: int = r.randi_range(8, 16); var b8: int = r.randi_range(5, 9); var c8: int = r.randi_range(25, 95)
			answer = a8 * b8 + c8; op = "mix"; prompt = "%d × %d + %d = ?" % [a8, b8, c8]; explain = "คูณก่อนบวก: %d + %d = %d" % [a8 * b8, c8, answer]
	else:
		grade = "ป.6"
		if pick < 0.28:
			var x9: int = r.randi_range(9, 26); var k9: int = r.randi_range(8, 16); var rhs: int = x9 * k9
			answer = x9; op = "eq"; prompt = "□ × %d = %d (หา □)" % [k9, rhs]; explain = "%d ÷ %d = %d" % [rhs, k9, x9]
		elif pick < 0.56:
			var a10: int = r.randi_range(150, 320); var b10: int = r.randi_range(6, 15); var c10: int = r.randi_range(4, 12); var prod: int = b10 * c10
			if a10 > prod:
				answer = a10 - prod; op = "mix"; prompt = "%d − %d × %d = ?" % [a10, b10, c10]; explain = "คูณก่อนลบ: %d − %d = %d" % [a10, prod, answer]
			else:
				answer = prod + a10; op = "mix"; prompt = "%d × %d + %d = ?" % [b10, c10, a10]; explain = "%d + %d = %d" % [prod, a10, answer]
		elif pick < 0.80:
			var p11: int = r.randi_range(4, 15); var q11: int = r.randi_range(3, 12); var ans11: int = r.randi_range(5, 18); var total11: int = (p11 + q11) * ans11
			answer = ans11; op = "div"; prompt = "%d ÷ (%d + %d) = ?" % [total11, p11, q11]; explain = "%d ÷ %d = %d" % [total11, p11 + q11, ans11]
		else:
			var pct_list: Array = [10, 20, 25, 50]; var pct: int = int(pct_list[r.randi() % pct_list.size()]); var base: int = r.randi_range(2, 16) * 20
			answer = int(round(float(pct * base) / 100.0)); op = "pct"; prompt = "%d%% ของ %d = ?" % [pct, base]; explain = "(%d × %d) ÷ 100 = %d" % [pct, base, answer]

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
		var tmp: Variant = arr[i]; arr[i] = arr[j]; arr[j] = tmp

func _serialize_weapons(p: Dictionary) -> Array:
	var w_list: Array = []
	for id: String in p["weapons"].keys():
		var w: Dictionary = WEAPONS[id]
		var lv: int = int(p["weapons"][id])
		if lv >= 6:
			w_list.append({"icon": w["evo_icon"], "name": w["evo_name"], "lv": "MAX", "evo": true})
		else:
			w_list.append({"icon": w["icon"], "name": w["name"], "lv": lv, "evo": false})
	for id: String in p["passives"].keys():
		var pv: Dictionary = PASSIVES[id]
		w_list.append({"icon": pv["icon"], "name": pv["name"], "lv": p["passives"][id], "evo": false})
	return w_list

func build_hud_payload() -> Dictionary:
	var act: Dictionary = ACTS[clampi(act_index, 0, ACTS.size() - 1)]
	var mcfg: Dictionary = get_map_cfg()
	var p1: Dictionary = players[0] if not players.is_empty() else _make_player_state(0, "mage")
	var p_arr: Array = []
	var tot_kills: int = 0
	var tot_correct: int = 0
	var tot_wrong: int = 0
	var tot_evo: int = 0
	for p: Dictionary in players:
		tot_kills += int(p["kills"])
		tot_correct += int(p["correct"])
		tot_wrong += int(p["wrong"])
		tot_evo += int(p["evolutions"])
		p_arr.append({
			"idx": int(p["idx"]),
			"heroId": str(p["hero_id"]),
			"name": str(p["name"]),
			"icon": str(p["icon"]),
			"hp": int(ceil(maxf(0.0, float(p["hp"])))),
			"maxHp": int(ceil(float(p["max_hp"]))),
			"score": int(p["score"]),
			"correct": int(p["correct"]),
			"wrong": int(p["wrong"]),
			"kills": int(p["kills"]),
			"downed": bool(p["downed"]),
			"respawnSec": maxf(0.0, float(p["respawn_timer"])),
			"dashRatio": float(p["dash_ratio"]),
			"guardReady": bool(p["guard_ready"]),
			"weapons": _serialize_weapons(p),
		})
	return {
		"mode": mode,
		"twoPlayer": is_two_player(),
		"score": int(p1["score"]) if mode == "coop_rival" else total_score(),
		"p1Score": int(p1["score"]),
		"p2Score": int(players[1]["score"]) if players.size() > 1 else 0,
		"elapsed": elapsed,
		"remaining": maxf(0.0, run_duration - elapsed),
		"actIndex": act_index,
		"actName": str(mcfg["name"]) + " · " + str(act["name"]),
		"mapId": map_id,
		"hp": int(ceil(maxf(0.0, float(p1["hp"])))),
		"maxHp": int(ceil(float(p1["max_hp"]))),
		"level": team_level,
		"xp": team_xp,
		"xpNeed": team_xp_need,
		"kills": tot_kills,
		"correct": tot_correct,
		"wrong": tot_wrong,
		"streak": team_streak,
		"bestStreak": best_streak,
		"bossKills": boss_kills,
		"evolutions": tot_evo,
		"alchemistUnlockEligible": elapsed >= 60.0 and min_hp_ratio_act1 >= 0.5,
		"feverSec": maxf(0.0, float(p1["fever_timer"])),
		"dashRatio": float(p1["dash_ratio"]),
		"boss": boss_info,
		"minimap": minimap_info,
		"seed": run_seed,
		"weapons": _serialize_weapons(p1),
		"players": p_arr,
	}
