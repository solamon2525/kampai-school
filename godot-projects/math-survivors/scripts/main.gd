extends Node2D

const ARENA_TILESET: TileSet = preload("res://tiles/arena_tileset.tres")
const THAI_FONT: Font = preload("res://assets/fonts/thai_bold.ttf")

@onready var floor_layer: TileMapLayer = $FloorLayer
@onready var wall_layer: TileMapLayer = $WallLayer
@onready var props_root: Node2D = $PropsContainer
@onready var world_root: Node2D = $WorldContainer
@onready var hero: MathHero = $Hero
@onready var cam: Camera2D = $Hero/Camera2D
@onready var radar_layer: CanvasLayer = $RadarLayer

var _spawn_acc: float = 0.0
var _math_cd: float = 1.1
var _active_q: Dictionary = {}
var _orbs: Array[MathOrb] = []
var _enemies: Array[ArenaEnemy] = []
var _projectiles: Array[Dictionary] = []
var _pi_orbs: Array[Sprite2D] = []
var _orb_angle: float = 0.0
var _cd: Dictionary = {"wand": 0.25, "lightning": 0.8, "boomerang": 1.0, "nova": 1.6}
var _bosses_spawned: Dictionary = {}

var _trauma: float = 0.0
var _trauma_t: float = 0.0
var _hit_stop_id: int = 0
var _hud_acc: float = 0.0

func _ready() -> void:
	floor_layer.tile_set = ARENA_TILESET
	wall_layer.tile_set = ARENA_TILESET
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(GameState.ARENA_PX)
	cam.limit_bottom = int(GameState.ARENA_PX)

	KampaiBridge.external_start_requested.connect(_on_external_start)
	KampaiBridge.external_draft_picked.connect(_on_external_draft)
	KampaiBridge.external_pause_changed.connect(_on_external_pause)
	hero.hit_by_enemy.connect(_on_hero_hurt)

	_build_arena_map()
	_spawn_ambient_particles()

	if not OS.has_feature("web") and not GameState.is_active:
		_start_round(1337, "normal")
	else:
		hero.global_position = Vector2(GameState.ARENA_PX * 0.5, GameState.ARENA_PX * 0.5)
		hero.controls_locked = true

func _build_arena_map() -> void:
	floor_layer.clear()
	wall_layer.clear()
	for child: Node in props_root.get_children():
		child.queue_free()

	var n: int = GameState.ARENA_TILES
	var map_rng := RandomNumberGenerator.new()
	map_rng.seed = 20261127
	for y: int in range(n):
		for x: int in range(n):
			if x == 0 or y == 0 or x == n - 1 or y == n - 1:
				wall_layer.set_cell(Vector2i(x, y), 0, Vector2i(4, 0))
			else:
				var r: float = map_rng.randf()
				var tile_coord := Vector2i(0 if (x + y) % 2 == 0 else 1, 0)
				if r < 0.06:
					tile_coord = Vector2i(2, 0)
				elif r < 0.11:
					tile_coord = Vector2i(3, 0)
				floor_layer.set_cell(Vector2i(x, y), 0, tile_coord)

	# Decorative Torches & Arcane Rune Pillars
	var step: int = 10
	for ty: int in range(8, n - 6, step):
		for tx: int in range(8, n - 6, step):
			if abs(tx - n / 2) <= 3 and abs(ty - n / 2) <= 3:
				continue
			var world_p := Vector2(float(tx) * GameState.TILE_PX + 12.0, float(ty) * GameState.TILE_PX + 12.0)
			if ((tx + ty) / step) % 2 == 0:
				var torch := AnimatedSprite2D.new()
				torch.sprite_frames = PixelArt.make_frames({"burn": ["torch_0", "torch_1"]}, 6.0)
				torch.play("burn")
				torch.position = world_p
				props_root.add_child(torch)
			else:
				var pil := Sprite2D.new()
				pil.texture = PixelArt.get_tex("pillar")
				pil.position = world_p
				props_root.add_child(pil)

func _spawn_ambient_particles() -> void:
	var dust := CPUParticles2D.new()
	dust.position = Vector2(GameState.ARENA_PX * 0.5, GameState.ARENA_PX * 0.5)
	dust.texture = PixelArt.get_tex("spark")
	dust.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	dust.emission_rect_extents = Vector2(GameState.ARENA_PX * 0.45, GameState.ARENA_PX * 0.45)
	dust.amount = 65
	dust.lifetime = 3.0
	dust.gravity = Vector2(0.0, -10.0)
	dust.initial_velocity_min = 4.0
	dust.initial_velocity_max = 14.0
	dust.color = Color(0.56, 0.78, 1.0, 0.35)
	add_child(dust)

func _on_external_start(seed_val: int, mode_name: String) -> void:
	_start_round(seed_val, mode_name)

func _on_external_draft(idx: int) -> void:
	GameState.pick_draft(idx)
	get_tree().paused = false
	hero.controls_locked = false
	_sync_pi_orbs()

func _on_external_pause(paused: bool) -> void:
	if not GameState.is_levelup:
		get_tree().paused = paused

func _start_round(seed_val: int, mode_name: String) -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	_clear_dynamic_world()
	GameState.start_new_round(seed_val, mode_name)
	_spawn_acc = 0.0
	_math_cd = 1.0
	_active_q = {}
	_bosses_spawned.clear()
	_cd = {"wand": 0.2, "lightning": 0.7, "boomerang": 0.9, "nova": 1.4}
	floor_layer.modulate = Color("#ffffff")

	var center := Vector2(GameState.ARENA_PX * 0.5, GameState.ARENA_PX * 0.5)
	hero.reset_at(center)
	cam.reset_smoothing()
	_sync_pi_orbs()
	AudioSynth.start_bgm("arena")

func _clear_dynamic_world() -> void:
	for c: Node in world_root.get_children():
		c.queue_free()
	for r: Node in radar_layer.get_children():
		r.queue_free()
	for orb: Sprite2D in _pi_orbs:
		if is_instance_valid(orb):
			orb.queue_free()
	_pi_orbs.clear()
	_orbs.clear()
	_enemies.clear()
	_projectiles.clear()

func _sync_pi_orbs() -> void:
	for o: Sprite2D in _pi_orbs:
		if is_instance_valid(o):
			o.queue_free()
	_pi_orbs.clear()
	var lv: int = int(GameState.weapons.get("orbs", 0))
	if lv <= 0:
		return
	var cnt: int = 5 if lv >= 5 else (4 if lv >= 4 else (3 if lv >= 2 else 2))
	for i: int in range(cnt):
		var sp := Sprite2D.new()
		sp.texture = PixelArt.get_tex("pi_orb")
		sp.z_index = 9
		world_root.add_child(sp)
		_pi_orbs.append(sp)

func _process(delta: float) -> void:
	var real_dt: float = delta / maxf(Engine.time_scale, 0.0001)
	if _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - 1.8 * real_dt)
		_trauma_t += real_dt * 34.0
		var s: float = _trauma * _trauma
		cam.offset = Vector2(sin(_trauma_t * 1.7) * 8.0 * s, cos(_trauma_t * 2.3) * 6.0 * s)
	else:
		cam.offset = Vector2.ZERO

	if not GameState.is_active or GameState.is_ended or GameState.is_levelup:
		return

	GameState.elapsed += delta
	if GameState.elapsed >= GameState.RUN_DURATION_SEC:
		AudioSynth.stop_bgm()
		GameState.finish_round(true, "เอาชีวิตรอดครบ 3 องก์!")
		return

	_hud_acc += delta
	if _hud_acc >= 0.25:
		_hud_acc = 0.0
		GameState.hud_updated.emit()

	for a: int in range(GameState.ACTS.size() - 1, -1, -1):
		var act_d: Dictionary = GameState.ACTS[a]
		if GameState.elapsed >= float(act_d["start"]):
			if GameState.act_index != a:
				GameState.act_index = a
				floor_layer.modulate = Color("#c4b5fd") if a == 1 else (Color("#fca5a5") if a == 2 else Color("#ffffff"))
				GameState.toast_requested.emit("🔥 เข้าสู่ " + str(act_d["name"]), "info", "")
			break

	var cur_act: Dictionary = GameState.ACTS[GameState.act_index]
	if not _bosses_spawned.has(cur_act["id"]) and GameState.elapsed >= float(cur_act["boss_at"]):
		_bosses_spawned[cur_act["id"]] = true
		AudioSynth.play_sfx("boss")
		AudioSynth.start_bgm("boss")
		GameState.toast_requested.emit("⚠️ " + str(cur_act["boss_name"]) + " ปรากฏตัว!", "bad", "")
		_spawn_enemy("boss", true, str(cur_act["boss_name"]))

	# Enemy waves
	_spawn_acc += delta
	if _spawn_acc >= float(cur_act["spawn_rate"]):
		_spawn_acc = 0.0
		var burst: int = 2 if GameState.act_index == 0 else 3
		for _k: int in range(burst):
			if _enemies.size() >= 68:
				break
			var r: float = GameState.wave_rng.randf()
			var t: String = "slime"
			if GameState.act_index == 0:
				t = "slime" if r < 0.72 else "bat"
			elif GameState.act_index == 1:
				t = "slime" if r < 0.36 else ("bat" if r < 0.74 else "golem")
			else:
				t = "bat" if r < 0.25 else ("golem" if r < 0.65 else "knight")
			_spawn_enemy(t, false, "")

	# Math Answer Orbs
	if _active_q.is_empty():
		_math_cd -= delta
		if _math_cd <= 0.0:
			_spawn_math_challenge()
	_update_radar()

	# Weapons & Projectiles
	_update_weapons(delta)
	_update_projectiles(delta)

func _spawn_enemy(p_type: String, p_boss: bool, p_name: String) -> void:
	var act_d: Dictionary = GameState.ACTS[GameState.act_index]
	var ang: float = GameState.wave_rng.randf() * TAU
	var dist: float = GameState.wave_rng.randf_range(220.0, 340.0)
	var pos := Vector2(
		clampf(hero.global_position.x + cos(ang) * dist, 50.0, GameState.ARENA_PX - 50.0),
		clampf(hero.global_position.y + sin(ang) * dist, 50.0, GameState.ARENA_PX - 50.0)
	)
	var en := ArenaEnemy.new()
	en.setup(p_type, float(act_d["hp_mult"]), float(act_d["spd_mult"]), p_boss, p_name, GameState.act_index)
	en.target_hero = hero
	en.position = pos
	en.defeated.connect(_on_enemy_defeated)
	world_root.add_child(en)
	_enemies.append(en)

func _on_enemy_defeated(en: ArenaEnemy) -> void:
	_enemies.erase(en)
	GameState.kills += 1
	GameState.add_score(en.score_reward)
	AudioSynth.play_sfx("hit")
	_spawn_burst(en.global_position, en.burst_color, 18 if en.is_boss else 7)

	var gems_n: int = 7 if en.is_boss else 1
	for i: int in range(gems_n):
		var g := XpGem.new()
		var offset := Vector2((GameState.wave_rng.randf() - 0.5) * 32.0, (GameState.wave_rng.randf() - 0.5) * 32.0) if gems_n > 1 else Vector2.ZERO
		g.setup(int(ceil(float(en.xp_reward) / float(gems_n))), en.is_boss or en.xp_reward >= 25, hero)
		g.position = en.global_position + offset
		g.collected.connect(_on_gem_collected)
		world_root.add_child(g)

	if en.is_boss:
		GameState.boss_kills += 1
		_trauma = minf(1.0, _trauma + 0.55)
		_hit_stop(0.08, 0.08)
		AudioSynth.start_bgm("arena")
		GameState.toast_requested.emit("👑 โค่น " + en.display_name + " สำเร็จ! ได้รับ EXP มหาศาล", "good", "")

func _on_gem_collected(amt: int) -> void:
	AudioSynth.play_gem(GameState.streak)
	if GameState.add_xp(amt):
		AudioSynth.play_sfx("levelup")
		hero.controls_locked = true
		get_tree().paused = true

func _on_hero_hurt(source_name: String, dmg: float) -> void:
	GameState.hp = maxf(0.0, GameState.hp - dmg)
	_trauma = minf(1.0, _trauma + 0.42)
	AudioSynth.play_sfx("hurt")
	_spawn_popup(hero.global_position + Vector2(0, -22), "-%d HP" % int(dmg), Color("#f87171"))
	GameState.hud_updated.emit()
	if GameState.hp <= 0.0:
		AudioSynth.stop_bgm()
		GameState.finish_round(false, "ถูก " + source_name + " โจมตี")

func _spawn_math_challenge() -> void:
	_active_q = GameState.generate_question(GameState.act_index + 1)
	_orbs.clear()
	var base_ang: float = GameState.math_rng.randf() * TAU
	var choices: Array = _active_q["choices"]
	var ans: int = int(_active_q["answer"])
	for i: int in range(choices.size()):
		var ang: float = base_ang + float(i) * (TAU / 3.0)
		var ox: float = clampf(hero.global_position.x + cos(ang) * 145.0, 68.0, GameState.ARENA_PX - 68.0)
		var oy: float = clampf(hero.global_position.y + sin(ang) * 145.0, 68.0, GameState.ARENA_PX - 68.0)
		var orb := MathOrb.new()
		orb.setup(int(choices[i]), int(choices[i]) == ans, float(i) * 1.4)
		orb.position = Vector2(ox, oy)
		orb.picked.connect(_on_math_orb_picked)
		world_root.add_child(orb)
		_orbs.append(orb)
	GameState.question_updated.emit(_active_q)

func _on_math_orb_picked(orb: MathOrb) -> void:
	if _active_q.is_empty():
		return
	var q := _active_q.duplicate()
	_active_q = {}
	for o: MathOrb in _orbs:
		if is_instance_valid(o):
			o.queue_free()
	_orbs.clear()
	GameState.question_updated.emit({})

	if orb.is_correct:
		GameState.correct_math += 1
		GameState.streak += 1
		GameState.best_streak = maxi(GameState.best_streak, GameState.streak)
		var bonus: int = 150 + mini(4, GameState.streak - 1) * 25
		GameState.add_score(bonus)
		GameState.hp = minf(GameState.max_hp, GameState.hp + 15.0)
		_trauma = minf(1.0, _trauma + 0.45)
		_hit_stop(0.06, 0.08)
		AudioSynth.play_sfx("math_ok")
		GameState.toast_requested.emit("✅ ถูกต้อง! %s (+%d & ฮีล +15 HP)" % [str(q["explain"]), bonus], "good", str(q["answer"]))
		_spawn_ring(hero.global_position, 240.0, Color("#38bdf8"))
		_spawn_popup(hero.global_position + Vector2(0, -28), "SUPER MATH +%d!" % bonus, Color("#4ade80"))
		for e: ArenaEnemy in _enemies.duplicate():
			if is_instance_valid(e) and e.global_position.distance_to(hero.global_position) < 250.0:
				var dmg: float = 140.0 if e.is_boss else 9999.0
				_spawn_popup(e.global_position, str(int(dmg)), Color("#38bdf8"))
				e.take_damage(dmg)
		_math_cd = 1.8
	else:
		GameState.wrong_math += 1
		GameState.streak = 0
		AudioSynth.play_sfx("math_bad")
		GameState.hp = maxf(0.0, GameState.hp - 12.0)
		_trauma = minf(1.0, _trauma + 0.35)
		GameState.toast_requested.emit("❌ %d ยังไม่ถูก → ที่ถูก: %s (%s)" % [orb.value, str(q["answer"]), str(q["explain"])], "bad", "")
		_spawn_popup(hero.global_position + Vector2(0, -22), "-12 HP", Color("#f87171"))
		if GameState.hp <= 0.0:
			AudioSynth.stop_bgm()
			GameState.finish_round(false, "ชนลูกแก้วคำตอบผิด (%d)" % orb.value)
			return
		_math_cd = 2.4
	GameState.hud_updated.emit()

func _find_nearest(max_dist: float) -> ArenaEnemy:
	var best: ArenaEnemy = null
	var bd: float = max_dist
	for e: ArenaEnemy in _enemies:
		if not is_instance_valid(e) or not e.alive:
			continue
		var d: float = e.global_position.distance_to(hero.global_position)
		if d < bd:
			bd = d
			best = e
	return best

func _update_weapons(delta: float) -> void:
	var cd_mult: float = GameState.get_cooldown_mult()

	# 1. Star Wand
	var w_lv: int = int(GameState.weapons.get("wand", 0))
	if w_lv > 0:
		_cd["wand"] = float(_cd["wand"]) - delta
		if float(_cd["wand"]) <= 0.0:
			var target: ArenaEnemy = _find_nearest(360.0)
			if target:
				var base_ang: float = (target.global_position - hero.global_position).angle()
				var shots: int = 4 if w_lv >= 5 else (3 if w_lv >= 4 else (2 if w_lv >= 2 else 1))
				var dmg: float = 16.0 + float(w_lv) * 7.0
				for s: int in range(shots):
					var spread: float = 0.0 if shots == 1 else (float(s) - float(shots - 1) * 0.5) * 0.16
					var ang: float = base_ang + spread
					var sp := Sprite2D.new()
					sp.texture = PixelArt.get_tex("wand_bolt")
					sp.position = hero.global_position
					sp.z_index = 8
					world_root.add_child(sp)
					_projectiles.append({
						"kind": "bolt", "node": sp, "vel": Vector2.RIGHT.rotated(ang) * 340.0,
						"dmg": dmg, "pierce": 2 if w_lv >= 4 else 1, "hit": [], "life": 1.25
					})
				AudioSynth.play_sfx("shoot")
				_cd["wand"] = (0.50 if w_lv >= 3 else 0.64) * cd_mult
			else:
				_cd["wand"] = 0.15

	# 2. Orbiting Pi Orbs
	var orb_lv: int = int(GameState.weapons.get("orbs", 0))
	if orb_lv > 0 and not _pi_orbs.is_empty():
		var radius: float = 46.0 if orb_lv < 3 else 56.0
		_orb_angle = fmod(_orb_angle + (3.1 + float(orb_lv) * 0.35) * delta, TAU)
		var dmg2: float = 13.0 + float(orb_lv) * 5.0
		for i: int in range(_pi_orbs.size()):
			var sp2: Sprite2D = _pi_orbs[i]
			if not is_instance_valid(sp2):
				continue
			var ang2: float = _orb_angle + float(i) * (TAU / float(_pi_orbs.size()))
			sp2.position = hero.global_position + Vector2(cos(ang2), sin(ang2)) * radius
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive and e.orb_cd <= 0.0:
					if e.global_position.distance_to(sp2.position) < e.hit_radius + 10.0:
						e.orb_cd = 0.36
						_spawn_popup(e.global_position, str(int(dmg2)), Color("#fde047"))
						e.take_damage(dmg2)

	# 3. Chain Lightning
	var l_lv: int = int(GameState.weapons.get("lightning", 0))
	if l_lv > 0:
		_cd["lightning"] = float(_cd["lightning"]) - delta
		if float(_cd["lightning"]) <= 0.0:
			var first: ArenaEnemy = _find_nearest(300.0)
			if first:
				var chains: int = 6 if l_lv >= 5 else (4 if l_lv >= 4 else (3 if l_lv >= 2 else 2))
				var dmg3: float = 22.0 + float(l_lv) * 9.0
				var line := Line2D.new()
				line.width = 3.0
				line.default_color = Color("#fde047")
				line.z_index = 11
				line.add_point(hero.global_position)
				var hit_list: Array[ArenaEnemy] = []
				var cur: ArenaEnemy = first
				for _c: int in range(chains):
					if cur == null or not is_instance_valid(cur):
						break
					hit_list.append(cur)
					line.add_point(cur.global_position)
					_spawn_popup(cur.global_position, str(int(dmg3)), Color("#fde047"))
					var next_e: ArenaEnemy = null
					var nd: float = 150.0
					for cand: ArenaEnemy in _enemies:
						if is_instance_valid(cand) and cand.alive and not hit_list.has(cand):
							var d: float = cand.global_position.distance_to(cur.global_position)
							if d < nd:
								nd = d
								next_e = cand
					cur.take_damage(dmg3)
					cur = next_e
				world_root.add_child(line)
				var ltw: Tween = line.create_tween()
				ltw.tween_property(line, "modulate:a", 0.0, 0.22)
				ltw.chain().tween_callback(line.queue_free)
				AudioSynth.play_sfx("lightning")
				_cd["lightning"] = (1.5 if l_lv >= 2 else 1.9) * cd_mult
			else:
				_cd["lightning"] = 0.25

	# 4. Boomerang Disc
	var b_lv: int = int(GameState.weapons.get("boomerang", 0))
	if b_lv > 0:
		_cd["boomerang"] = float(_cd["boomerang"]) - delta
		if float(_cd["boomerang"]) <= 0.0:
			var blades: int = 4 if b_lv >= 5 else (3 if b_lv >= 4 else (2 if b_lv >= 2 else 1))
			var near: ArenaEnemy = _find_nearest(340.0)
			var base_a: float = (near.global_position - hero.global_position).angle() if near else 0.0
			var dmg4: float = 20.0 + float(b_lv) * 8.0
			for b: int in range(blades):
				var ang4: float = base_a + float(b) * (TAU / float(blades))
				var sp4 := Sprite2D.new()
				sp4.texture = PixelArt.get_tex("boomerang")
				sp4.position = hero.global_position
				sp4.z_index = 9
				world_root.add_child(sp4)
				_projectiles.append({
					"kind": "boomerang", "node": sp4, "dir": Vector2.RIGHT.rotated(ang4),
					"speed": 250.0 + float(b_lv) * 20.0, "age": 0.0, "max_age": 1.5, "dmg": dmg4, "cd_map": {}
				})
			AudioSynth.play_sfx("shoot")
			_cd["boomerang"] = 2.0 * cd_mult

	# 5. Nova Burst
	var n_lv: int = int(GameState.weapons.get("nova", 0))
	if n_lv > 0:
		_cd["nova"] = float(_cd["nova"]) - delta
		if float(_cd["nova"]) <= 0.0:
			var rad: float = 95.0 + float(n_lv) * 20.0
			var dmg5: float = 24.0 + float(n_lv) * 12.0
			_spawn_ring(hero.global_position, rad, Color("#fb923c"))
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive and e.global_position.distance_to(hero.global_position) <= rad + e.hit_radius:
					e.global_position += (e.global_position - hero.global_position).normalized() * 18.0
					_spawn_popup(e.global_position, str(int(dmg5)), Color("#fb923c"))
					e.take_damage(dmg5)
			_cd["nova"] = (2.3 if n_lv >= 3 else 2.9) * cd_mult

func _update_projectiles(delta: float) -> void:
	for i: int in range(_projectiles.size() - 1, -1, -1):
		var p: Dictionary = _projectiles[i]
		var sp: Sprite2D = p["node"]
		if not is_instance_valid(sp):
			_projectiles.remove_at(i)
			continue
		if p["kind"] == "bolt":
			sp.position += (p["vel"] as Vector2) * delta
			p["life"] = float(p["life"]) - delta
			var hit_arr: Array = p["hit"]
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive and not hit_arr.has(e):
					if e.global_position.distance_to(sp.position) < e.hit_radius + 8.0:
						hit_arr.append(e)
						_spawn_popup(e.global_position, str(int(p["dmg"])), Color("#38bdf8"))
						e.take_damage(float(p["dmg"]))
						p["pierce"] = int(p["pierce"]) - 1
						if int(p["pierce"]) <= 0:
							p["life"] = 0.0
							break
			if float(p["life"]) <= 0.0:
				sp.queue_free()
				_projectiles.remove_at(i)
		else:
			p["age"] = float(p["age"]) + delta
			sp.rotation += 14.0 * delta
			var factor: float = 1.0 if float(p["age"]) < float(p["max_age"]) * 0.48 else -1.15
			sp.position += (p["dir"] as Vector2) * float(p["speed"]) * factor * delta
			var cd_map: Dictionary = p["cd_map"]
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive:
					var eid: int = e.get_instance_id()
					var prev_t: float = float(cd_map.get(eid, -1.0))
					if float(p["age"]) - prev_t > 0.35 and e.global_position.distance_to(sp.position) < e.hit_radius + 12.0:
						cd_map[eid] = float(p["age"])
						_spawn_popup(e.global_position, str(int(p["dmg"])), Color("#c084fc"))
						e.take_damage(float(p["dmg"]))
			if float(p["age"]) >= float(p["max_age"]):
				sp.queue_free()
				_projectiles.remove_at(i)

func _update_radar() -> void:
	for r: Node in radar_layer.get_children():
		r.queue_free()
	if _orbs.is_empty():
		return
	var vp_size: Vector2 = get_viewport_rect().size
	var cam_center: Vector2 = cam.get_screen_center_position()
	for orb: MathOrb in _orbs:
		if not is_instance_valid(orb) or orb.consumed:
			continue
		var screen_pos: Vector2 = (orb.global_position - cam_center) + vp_size * 0.5
		if screen_pos.x < 24.0 or screen_pos.x > vp_size.x - 24.0 or screen_pos.y < 60.0 or screen_pos.y > vp_size.y - 24.0:
			var ang: float = (orb.global_position - cam_center).angle()
			var marker := Label.new()
			marker.text = "● %d" % orb.value
			marker.add_theme_font_override("font", THAI_FONT)
			marker.add_theme_font_size_override("font_size", 11)
			marker.add_theme_color_override("font_color", Color("#facc15"))
			marker.add_theme_color_override("font_outline_color", Color("#0f172a"))
			marker.add_theme_constant_override("outline_size", 3)
			marker.position = Vector2(
				clampf(vp_size.x * 0.5 + cos(ang) * (vp_size.x * 0.40), 16.0, vp_size.x - 56.0),
				clampf(vp_size.y * 0.5 + sin(ang) * (vp_size.y * 0.34), 56.0, vp_size.y - 32.0)
			)
			radar_layer.add_child(marker)

func _spawn_burst(at: Vector2, col: Color, amt: int) -> void:
	var p := CPUParticles2D.new()
	p.position = at
	p.texture = PixelArt.get_tex("spark")
	p.amount = amt
	p.one_shot = true
	p.explosiveness = 1.0
	p.lifetime = 0.42
	p.spread = 180.0
	p.initial_velocity_min = 40.0
	p.initial_velocity_max = 115.0
	p.color = col
	p.z_index = 10
	world_root.add_child(p)
	p.emitting = true
	get_tree().create_timer(0.55).timeout.connect(func() -> void:
		if is_instance_valid(p):
			p.queue_free()
	)

func _spawn_ring(at: Vector2, max_rad: float, col: Color) -> void:
	var poly := Polygon2D.new()
	var pts := PackedVector2Array()
	for k: int in range(24):
		var a: float = float(k) * (TAU / 24.0)
		pts.append(Vector2(cos(a), sin(a)) * 12.0)
	poly.polygon = pts
	poly.color = Color(col.r, col.g, col.b, 0.38)
	poly.position = at
	poly.z_index = 7
	world_root.add_child(poly)
	var tw: Tween = poly.create_tween().set_parallel(true)
	var target_sc: float = max_rad / 12.0
	tw.tween_property(poly, "scale", Vector2(target_sc, target_sc), 0.36).set_ease(Tween.EASE_OUT)
	tw.tween_property(poly, "modulate:a", 0.0, 0.36)
	tw.chain().tween_callback(poly.queue_free)

func _spawn_popup(at: Vector2, text: String, col: Color) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.position = at + Vector2(-16.0, -10.0)
	lbl.z_index = 14
	lbl.add_theme_font_override("font", THAI_FONT)
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color", col)
	lbl.add_theme_color_override("font_outline_color", Color("#0f172a"))
	lbl.add_theme_constant_override("outline_size", 3)
	world_root.add_child(lbl)
	var tw: Tween = lbl.create_tween()
	tw.tween_property(lbl, "position:y", lbl.position.y - 18.0, 0.5)
	tw.parallel().tween_property(lbl, "modulate:a", 0.0, 0.3).set_delay(0.2)
	tw.chain().tween_callback(lbl.queue_free)

func _hit_stop(dur: float, slow: float) -> void:
	_hit_stop_id += 1
	var my_id: int = _hit_stop_id
	Engine.time_scale = slow
	await get_tree().create_timer(dur, true, false, true).timeout
	if my_id == _hit_stop_id:
		Engine.time_scale = 1.0
