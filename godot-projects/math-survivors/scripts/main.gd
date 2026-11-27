extends Node2D

const ARENA_TILESET: TileSet = preload("res://tiles/arena_tileset.tres")
const THAI_FONT: Font = preload("res://assets/fonts/thai_bold.ttf")
const HERO_SCENE: PackedScene = preload("res://scenes/player.tscn")

@onready var floor_layer: TileMapLayer = $FloorLayer
@onready var wall_layer: TileMapLayer = $WallLayer
@onready var props_root: Node2D = $PropsContainer
@onready var world_root: Node2D = $WorldContainer
@onready var heroes_root: Node2D = $HeroesContainer
@onready var cam: Camera2D = $SharedCamera
@onready var radar_layer: CanvasLayer = $RadarLayer

var _heroes: Array[MathHero] = []
var _spawn_acc: float = 0.0
var _math_cd: float = 1.1
var _lava_cd: float = 5.5
var _active_q: Dictionary = {}
var _orbs: Array[MathOrb] = []
var _enemies: Array[ArenaEnemy] = []
var _gems: Array[XpGem] = []
var _projectiles: Array[Dictionary] = []
var _enemy_shots: Array[Dictionary] = []
var _turrets: Array[Dictionary] = []
var _speed_pads: Array[Vector2] = []
var _active_chest: BossChest = null

var _pi_orbs_by_p: Array = []
var _orb_angles: Array[float] = []
var _orb_hits: Array[int] = []
var _lightning_casts: Array[int] = []
var _cds: Array = []
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
	KampaiBridge.external_chest_answered.connect(_on_external_chest_answered)
	KampaiBridge.external_dash_requested.connect(_on_external_dash)
	KampaiBridge.external_pause_changed.connect(_on_external_pause)

	_build_arena_map("arcane_temple")
	_spawn_ambient_particles()

	if not OS.has_feature("web") and not GameState.is_active:
		_start_round(1337, "normal", "arcane_temple", "mage", "knight")
	else:
		GameState.start_new_round(1337, "normal", "arcane_temple", "mage", "knight")
		GameState.is_active = false
		_spawn_heroes("mage", "knight")
		for h: MathHero in _heroes:
			h.controls_locked = true

func _build_arena_map(map_id: String) -> void:
	floor_layer.clear()
	wall_layer.clear()
	_speed_pads.clear()
	for child: Node in props_root.get_children():
		child.queue_free()

	var mcfg: Dictionary = GameState.MAPS.get(map_id, GameState.MAPS["arcane_temple"])
	var row_y: int = int(mcfg["row"])
	var pillar_key: String = str(mcfg["pillar"])
	var n: int = GameState.ARENA_TILES
	var map_rng := RandomNumberGenerator.new()
	map_rng.seed = GameState.hash_seed(20261127, map_id)

	for y: int in range(n):
		for x: int in range(n):
			if x == 0 or y == 0 or x == n - 1 or y == n - 1:
				wall_layer.set_cell(Vector2i(x, y), 0, Vector2i(4, row_y))
			else:
				var r: float = map_rng.randf()
				var tile_col: int = 0 if (x + y) % 2 == 0 else 1
				if r < 0.06:
					tile_col = 2
				elif r < 0.11 and map_id != "crystal_forest":
					tile_col = 3
				floor_layer.set_cell(Vector2i(x, y), 0, Vector2i(tile_col, row_y))

	var step: int = 10
	for ty: int in range(8, n - 6, step):
		for tx: int in range(8, n - 6, step):
			if abs(tx - n / 2) <= 4 and abs(ty - n / 2) <= 4:
				continue
			var world_p := Vector2(float(tx) * GameState.TILE_PX + 12.0, float(ty) * GameState.TILE_PX + 12.0)
			if map_id == "crystal_forest" and ((tx + ty) / step) % 2 == 0:
				floor_layer.set_cell(Vector2i(tx, ty), 0, Vector2i(3, row_y))
				_speed_pads.append(world_p)
			elif ((tx + ty) / step) % 2 == 0:
				var torch := AnimatedSprite2D.new()
				torch.sprite_frames = PixelArt.make_frames({"burn": ["torch_0", "torch_1"]}, 6.0)
				torch.play("burn")
				torch.position = world_p
				props_root.add_child(torch)
			else:
				var pil_body := StaticBody2D.new()
				pil_body.collision_layer = 1
				pil_body.collision_mask = 0
				pil_body.position = world_p
				var psp := Sprite2D.new()
				psp.texture = PixelArt.get_tex(pillar_key)
				pil_body.add_child(psp)
				var pcol := CollisionShape2D.new()
				var prect := RectangleShape2D.new()
				prect.size = Vector2(14, 14)
				pcol.shape = prect
				pil_body.add_child(pcol)
				props_root.add_child(pil_body)

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

func _spawn_heroes(p1_hero: String, p2_hero: String) -> void:
	for c: Node in heroes_root.get_children():
		c.queue_free()
	_heroes.clear()
	_pi_orbs_by_p.clear()
	_orb_angles.clear()
	_orb_hits.clear()
	_lightning_casts.clear()
	_cds.clear()

	var center := Vector2(GameState.ARENA_PX * 0.5, GameState.ARENA_PX * 0.5)
	var count: int = GameState.players.size()
	for idx: int in range(count):
		var h: MathHero = HERO_SCENE.instantiate() as MathHero
		var hid: String = p1_hero if idx == 0 else p2_hero
		heroes_root.add_child(h)
		h.configure(idx, hid)
		var spawn_pos: Vector2 = center if count == 1 else (center + Vector2(-38.0 if idx == 0 else 38.0, 0.0))
		h.reset_at(spawn_pos)
		h.hit_by_enemy.connect(_on_hero_hurt)
		h.dashed.connect(_on_hero_dashed)
		_heroes.append(h)
		_pi_orbs_by_p.append([])
		_orb_angles.append(float(idx) * PI)
		_orb_hits.append(0)
		_lightning_casts.append(0)
		_cds.append({"wand": 0.2, "lightning": 0.7, "boomerang": 0.9, "nova": 1.4})

	cam.position = center
	cam.zoom = Vector2.ONE

func _on_external_start(seed_val: int, mode_name: String, map_id: String, p1_hero: String, p2_hero: String) -> void:
	_start_round(seed_val, mode_name, map_id, p1_hero, p2_hero)

func _on_external_draft(player_idx: int, card_idx: int) -> void:
	var all_done: bool = GameState.pick_draft(player_idx, card_idx)
	_sync_all_pi_orbs()
	if all_done:
		get_tree().paused = false
		for h: MathHero in _heroes:
			if is_instance_valid(h):
				h.controls_locked = false

func _on_external_chest_answered(answer_val: int) -> void:
	var res: Dictionary = GameState.resolve_boss_chest(answer_val)
	get_tree().paused = false
	for h: MathHero in _heroes:
		if is_instance_valid(h):
			h.controls_locked = false
	_sync_all_pi_orbs()
	var rewards: Array = res.get("rewards", [])
	var r_txt: String = ", ".join(rewards) if not rewards.is_empty() else "โบนัสพิเศษ"
	if bool(res.get("correct", false)):
		AudioSynth.play_sfx("chest")
		GameState.toast_requested.emit("🎁 เปิดหีบสำเร็จ! ได้รับ " + r_txt + " (+300)", "good", str(res.get("answer", "")))
	else:
		AudioSynth.play_sfx("math_bad")
		GameState.toast_requested.emit("📦 หีบปลอบใจ: ได้ " + r_txt + " (คำตอบคือ %s)" % str(res.get("answer", "")), "info", "")

func _on_external_dash(player_idx: int) -> void:
	if GameState.is_active and not GameState.is_levelup and not GameState.is_chest_open:
		if player_idx >= 0 and player_idx < _heroes.size() and is_instance_valid(_heroes[player_idx]):
			_heroes[player_idx].request_dash()

func _on_external_pause(paused: bool) -> void:
	if not GameState.is_levelup and not GameState.is_chest_open:
		get_tree().paused = paused

func _start_round(seed_val: int, mode_name: String, map_id: String, p1_hero: String, p2_hero: String) -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	_clear_dynamic_world()
	GameState.start_new_round(seed_val, mode_name, map_id, p1_hero, p2_hero)
	_build_arena_map(GameState.map_id)
	_spawn_heroes(p1_hero, p2_hero)

	_spawn_acc = 0.0
	_math_cd = 1.0
	_lava_cd = 4.5
	_active_q = {}
	_active_chest = null
	_bosses_spawned.clear()
	floor_layer.modulate = Color("#ffffff")

	_sync_all_pi_orbs()
	AudioSynth.start_bgm(str(GameState.get_map_cfg()["bgm"]))

func _clear_dynamic_world() -> void:
	for c: Node in world_root.get_children():
		c.queue_free()
	for r: Node in radar_layer.get_children():
		r.queue_free()
	_pi_orbs_by_p.clear()
	_orbs.clear()
	_enemies.clear()
	_gems.clear()
	_projectiles.clear()
	_enemy_shots.clear()
	_turrets.clear()
	_active_chest = null

func _sync_all_pi_orbs() -> void:
	for idx: int in range(GameState.players.size()):
		if idx >= _pi_orbs_by_p.size():
			continue
		var arr: Array = _pi_orbs_by_p[idx]
		for o: Variant in arr:
			if is_instance_valid(o):
				(o as Node).queue_free()
		arr.clear()
		var p: Dictionary = GameState.players[idx]
		var lv: int = int(p["weapons"].get("orbs", 0))
		if lv <= 0:
			continue
		var cnt: int = 6 if lv >= 6 else (5 if lv >= 5 else (4 if lv >= 4 else (3 if lv >= 2 else 2)))
		var tex_key: String = "evo_orb" if lv >= 6 else "pi_orb"
		for _i: int in range(cnt):
			var sp := Sprite2D.new()
			sp.texture = PixelArt.get_tex(tex_key)
			sp.z_index = 9
			world_root.add_child(sp)
			arr.append(sp)

func _get_focus_center() -> Vector2:
	var sum := Vector2.ZERO
	var cnt: int = 0
	for h: MathHero in _heroes:
		if is_instance_valid(h) and h.is_alive_active():
			sum += h.global_position
			cnt += 1
	if cnt > 0:
		return sum / float(cnt)
	if not _heroes.is_empty() and is_instance_valid(_heroes[0]):
		return _heroes[0].global_position
	return Vector2(GameState.ARENA_PX * 0.5, GameState.ARENA_PX * 0.5)

func _update_shared_camera(delta: float) -> void:
	if _heroes.is_empty():
		return
	var target_pos: Vector2 = _get_focus_center()
	var target_zoom: float = 1.0

	if GameState.is_two_player() and _heroes.size() >= 2 and is_instance_valid(_heroes[0]) and is_instance_valid(_heroes[1]):
		var h0: MathHero = _heroes[0]
		var h1: MathHero = _heroes[1]
		var both_active: bool = h0.is_alive_active() and h1.is_alive_active()
		var sep_vec: Vector2 = h1.global_position - h0.global_position
		var sep: float = sep_vec.length()
		if both_active and sep > 540.0:
			var excess: float = (sep - 540.0) * 0.5
			var nrm: Vector2 = sep_vec / maxf(1.0, sep)
			h0.global_position += nrm * excess
			h1.global_position -= nrm * excess
			sep = 540.0
		target_pos = (h0.global_position + h1.global_position) * 0.5
		target_zoom = clampf(1.0 - maxf(0.0, sep - 190.0) / 980.0, 0.72, 1.0)

	var follow_a: float = 1.0 - exp(-8.5 * delta)
	var zoom_a: float = 1.0 - exp(-6.0 * delta)
	cam.position = cam.position.lerp(target_pos, follow_a)
	var z: float = lerpf(cam.zoom.x, target_zoom, zoom_a)
	cam.zoom = Vector2(z, z)

func _process(delta: float) -> void:
	var real_dt: float = delta / maxf(Engine.time_scale, 0.0001)
	if _trauma > 0.0 and not GameState.reduce_shake:
		_trauma = maxf(0.0, _trauma - 1.8 * real_dt)
		_trauma_t += real_dt * 34.0
		var s: float = _trauma * _trauma
		cam.offset = Vector2(sin(_trauma_t * 1.7) * 8.0 * s, cos(_trauma_t * 2.3) * 6.0 * s)
	else:
		_trauma = maxf(0.0, _trauma - 2.5 * real_dt)
		cam.offset = Vector2.ZERO

	_update_shared_camera(real_dt)

	if not GameState.is_active or GameState.is_ended or GameState.is_levelup or GameState.is_chest_open:
		return

	GameState.elapsed += delta
	for i: int in range(GameState.players.size()):
		var p: Dictionary = GameState.players[i]
		if float(p["fever_timer"]) > 0.0:
			p["fever_timer"] = maxf(0.0, float(p["fever_timer"]) - delta)
		if float(p["speed_boost_timer"]) > 0.0:
			p["speed_boost_timer"] = maxf(0.0, float(p["speed_boost_timer"]) - delta)
		if float(p["slow_debuff_timer"]) > 0.0:
			p["slow_debuff_timer"] = maxf(0.0, float(p["slow_debuff_timer"]) - delta)
		if float(p["rapid_buff_timer"]) > 0.0:
			p["rapid_buff_timer"] = maxf(0.0, float(p["rapid_buff_timer"]) - delta)
		if float(p["respawn_timer"]) > 0.0:
			p["respawn_timer"] = maxf(0.0, float(p["respawn_timer"]) - delta)
			if float(p["respawn_timer"]) <= 0.0 and i < _heroes.size() and is_instance_valid(_heroes[i]):
				p["hp"] = float(p["max_hp"])
				_heroes[i].invuln_timer = 1.8
				_spawn_burst(_heroes[i].global_position, Color("#38bdf8") if i == 0 else Color("#fb923c"), 14)
				_spawn_popup(_heroes[i].global_position + Vector2(0, -24), "⚡ P%d เกิดใหม่!" % [i + 1], Color("#4ade80"))

	# Co-op Team Revive Ring logic
	if GameState.mode == "coop_team" and _heroes.size() >= 2:
		_update_coop_revive(delta)

	if GameState.elapsed >= GameState.run_duration:
		AudioSynth.stop_bgm()
		if GameState.mode == "coop_rival" and GameState.players.size() >= 2:
			var s1: int = int(GameState.players[0]["score"])
			var s2: int = int(GameState.players[1]["score"])
			var msg: String = "🏆 P1 ชนะขาด (%d vs %d)!" % [s1, s2] if s1 > s2 else ("🏆 P2 ชนะขาด (%d vs %d)!" % [s2, s1] if s2 > s1 else "🤝 เสมอกันสุดมันส์ (%d vs %d)!" % [s1, s2])
			GameState.finish_round(true, msg)
		else:
			GameState.finish_round(true, "เอาชีวิตรอดครบ 3 องก์!")
		return

	# Crystal Forest Speed Pads
	if GameState.map_id == "crystal_forest":
		for i: int in range(_heroes.size()):
			var h: MathHero = _heroes[i]
			if not is_instance_valid(h) or not h.is_alive_active():
				continue
			if float(GameState.players[i]["speed_boost_timer"]) <= 0.2:
				for pad: Vector2 in _speed_pads:
					if h.global_position.distance_to(pad) < 18.0:
						GameState.players[i]["speed_boost_timer"] = 2.2
						_spawn_burst(pad, Color("#22d3ee"), 8)
						_spawn_popup(h.global_position + Vector2(0, -18), "💨 SPEED +45%!", Color("#22d3ee"))
						break

	# Lava Citadel Telegraphed Lava Vents
	if GameState.map_id == "lava_citadel":
		_lava_cd -= delta
		if _lava_cd <= 0.0:
			_lava_cd = 5.2
			var base_p: Vector2 = _get_focus_center()
			var vent_pos := base_p + Vector2(GameState.wave_rng.randf_range(-100.0, 100.0), GameState.wave_rng.randf_range(-100.0, 100.0))
			vent_pos.x = clampf(vent_pos.x, 60.0, GameState.ARENA_PX - 60.0)
			vent_pos.y = clampf(vent_pos.y, 60.0, GameState.ARENA_PX - 60.0)
			_trigger_telegraphed_hazard(vent_pos, 42.0, 1.0, 12.0, "ลาวาปะทุ")

	for a: int in range(GameState.ACTS.size() - 1, -1, -1):
		var act_d: Dictionary = GameState.ACTS[a]
		if GameState.elapsed >= float(act_d["start"]):
			if GameState.act_index != a:
				GameState.act_index = a
				GameState.toast_requested.emit("🔥 เข้าสู่ " + str(act_d["name"]), "info", "")
			break

	var cur_act: Dictionary = GameState.ACTS[GameState.act_index]
	if not _bosses_spawned.has(cur_act["id"]) and GameState.elapsed >= float(cur_act["boss_at"]):
		_bosses_spawned[cur_act["id"]] = true
		AudioSynth.play_sfx("boss")
		AudioSynth.start_bgm("boss")
		GameState.toast_requested.emit("⚠️ " + str(cur_act["boss_name"]) + " ปรากฏตัว!", "bad", "")
		_spawn_enemy("boss", true, str(cur_act["boss_name"]))

	_spawn_acc += delta
	if _spawn_acc >= float(cur_act["spawn_rate"]):
		_spawn_acc = 0.0
		var max_mobs: int = 96 if GameState.mode == "coop_team" else 68
		var burst: int = (2 if GameState.act_index == 0 else 3) + (1 if GameState.mode == "coop_team" else 0)
		for _k: int in range(burst):
			if _enemies.size() >= max_mobs:
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

	if _active_q.is_empty():
		_math_cd -= delta
		if _math_cd <= 0.0:
			_spawn_math_challenge()

	for i: int in range(_heroes.size()):
		if is_instance_valid(_heroes[i]) and _heroes[i].is_alive_active():
			_update_weapons_for(i, _heroes[i], delta)
	_update_turrets(delta)
	_update_projectiles(delta)
	_update_enemy_shots(delta)

	_hud_acc += delta
	if _hud_acc >= 0.20:
		_hud_acc = 0.0
		_sync_boss_and_minimap()
		GameState.hud_updated.emit()

func _update_coop_revive(delta: float) -> void:
	for downed_idx: int in range(2):
		var dp: Dictionary = GameState.players[downed_idx]
		if not bool(dp["downed"]):
			continue
		var helper_idx: int = 1 - downed_idx
		var dh: MathHero = _heroes[downed_idx]
		var hh: MathHero = _heroes[helper_idx]
		if not is_instance_valid(dh) or not is_instance_valid(hh) or not hh.is_alive_active():
			continue
		if hh.global_position.distance_to(dh.global_position) <= MathHero.REVIVE_RADIUS + 10.0:
			var speed_sec: float = 1.25 if hh.hero_id == "alchemist" else 2.5
			dp["revive_progress"] = float(dp["revive_progress"]) + delta / speed_sec
			if float(dp["revive_progress"]) >= 1.0:
				_revive_player(downed_idx)
		else:
			dp["revive_progress"] = maxf(0.0, float(dp["revive_progress"]) - delta * 0.25)

func _revive_player(idx: int) -> void:
	var p: Dictionary = GameState.players[idx]
	p["downed"] = false
	p["revive_progress"] = 0.0
	p["hp"] = float(p["max_hp"]) * 0.5
	if idx < _heroes.size() and is_instance_valid(_heroes[idx]):
		_heroes[idx].invuln_timer = 2.0
		_spawn_ring(_heroes[idx].global_position, 72.0, Color("#4ade80"))
		_spawn_popup(_heroes[idx].global_position + Vector2(0, -24), "💚 ชุบชีวิต P%d!" % [idx + 1], Color("#4ade80"))
	AudioSynth.play_sfx("math_ok")
	GameState.toast_requested.emit("💚 ชุบชีวิต P%d กลับมาลุยต่อ (50%% HP)!" % [idx + 1], "good", "")

func _on_hero_dashed(player_idx: int, from_pos: Vector2) -> void:
	var p: Dictionary = GameState.get_player(player_idx)
	if str(p["hero_id"]) == "chronomancer":
		_spawn_ring(from_pos, 135.0, Color("#818cf8"))
		for e: ArenaEnemy in _enemies:
			if is_instance_valid(e) and e.alive and e.global_position.distance_to(from_pos) <= 135.0:
				e.apply_slow(2.5)
		_spawn_popup(from_pos + Vector2(0, -20), "⏳ TIME SLOW!", Color("#a5b4fc"))

func _sync_boss_and_minimap() -> void:
	var active_boss: ArenaEnemy = null
	for e: ArenaEnemy in _enemies:
		if is_instance_valid(e) and e.alive and e.is_boss:
			active_boss = e
			break
	if active_boss:
		GameState.boss_info = {"name": active_boss.display_name, "hp": int(ceil(active_boss.hp)), "maxHp": int(ceil(active_boss.max_hp))}
	else:
		GameState.boss_info = {}

	var orb_pts: Array = []
	for o: MathOrb in _orbs:
		if is_instance_valid(o) and not o.consumed:
			orb_pts.append({"x": o.global_position.x, "y": o.global_position.y})
	var h0: Vector2 = _heroes[0].global_position if not _heroes.is_empty() and is_instance_valid(_heroes[0]) else Vector2(960, 960)
	var h2: Variant = {"x": _heroes[1].global_position.x, "y": _heroes[1].global_position.y} if _heroes.size() > 1 and is_instance_valid(_heroes[1]) else null
	GameState.minimap_info = {
		"arena": GameState.ARENA_PX,
		"hx": h0.x,
		"hy": h0.y,
		"p2": h2,
		"orbs": orb_pts,
		"boss": {"x": active_boss.global_position.x, "y": active_boss.global_position.y} if active_boss else null,
		"chest": {"x": _active_chest.global_position.x, "y": _active_chest.global_position.y} if is_instance_valid(_active_chest) else null,
	}

func _trigger_telegraphed_hazard(at: Vector2, rad: float, warn_sec: float, dmg: float, label: String) -> void:
	var warn := Polygon2D.new()
	var pts := PackedVector2Array()
	for k: int in range(20):
		var a: float = float(k) * (TAU / 20.0)
		pts.append(Vector2(cos(a), sin(a)) * rad)
	warn.polygon = pts
	warn.color = Color(0.94, 0.27, 0.27, 0.30)
	warn.position = at
	warn.z_index = 3
	world_root.add_child(warn)
	var tw: Tween = warn.create_tween()
	tw.tween_property(warn, "color:a", 0.65, warn_sec)
	tw.chain().tween_callback(func() -> void:
		if is_instance_valid(warn):
			warn.queue_free()
		if not GameState.is_active or GameState.is_ended:
			return
		_spawn_ring(at, rad, Color("#f97316"))
		_spawn_burst(at, Color("#fb923c"), 10)
		for h: MathHero in _heroes:
			if is_instance_valid(h) and h.is_alive_active() and h.global_position.distance_to(at) <= rad + 8.0:
				h.trigger_hurt(dmg, label)
	)

func _on_boss_attack(boss: ArenaEnemy, target_pos: Vector2) -> void:
	if not is_instance_valid(boss) or not boss.alive:
		return
	if boss.boss_act == 0:
		_trigger_telegraphed_hazard(target_pos, 52.0, 0.85, 14.0, boss.display_name)
	else:
		var count: int = 4 if boss.boss_act == 1 else 8
		var base_a: float = (target_pos - boss.global_position).angle()
		_spawn_ring(boss.global_position, 44.0, Color("#ef4444"))
		for i: int in range(count):
			var ang: float = base_a + float(i) * (TAU / float(count))
			var sp := Sprite2D.new()
			sp.texture = PixelArt.get_tex("boss_shot")
			sp.position = boss.global_position
			sp.z_index = 10
			world_root.add_child(sp)
			_enemy_shots.append({"node": sp, "vel": Vector2.RIGHT.rotated(ang) * 145.0, "life": 2.4, "dmg": 13.0, "src": boss.display_name})

func _update_enemy_shots(delta: float) -> void:
	for i: int in range(_enemy_shots.size() - 1, -1, -1):
		var s: Dictionary = _enemy_shots[i]
		var sp: Sprite2D = s["node"]
		if not is_instance_valid(sp):
			_enemy_shots.remove_at(i)
			continue
		sp.position += (s["vel"] as Vector2) * delta
		s["life"] = float(s["life"]) - delta
		for h: MathHero in _heroes:
			if is_instance_valid(h) and h.is_alive_active() and sp.global_position.distance_to(h.global_position) < 15.0:
				h.trigger_hurt(float(s["dmg"]), str(s["src"]))
				s["life"] = 0.0
				break
		if float(s["life"]) <= 0.0:
			sp.queue_free()
			_enemy_shots.remove_at(i)

func _spawn_enemy(p_type: String, p_boss: bool, p_name: String) -> void:
	var act_d: Dictionary = GameState.ACTS[GameState.act_index]
	var center: Vector2 = _get_focus_center()
	var ang: float = GameState.wave_rng.randf() * TAU
	var dist: float = GameState.wave_rng.randf_range(240.0, 380.0)
	var pos := Vector2(
		clampf(center.x + cos(ang) * dist, 50.0, GameState.ARENA_PX - 50.0),
		clampf(center.y + sin(ang) * dist, 50.0, GameState.ARENA_PX - 50.0)
	)
	var en := ArenaEnemy.new()
	en.setup(p_type, float(act_d["hp_mult"]), float(act_d["spd_mult"]), p_boss, p_name, GameState.act_index)
	en.target_heroes = _heroes
	en.position = pos
	en.defeated.connect(_on_enemy_defeated)
	if p_boss:
		en.boss_attack_requested.connect(_on_boss_attack)
	world_root.add_child(en)
	_enemies.append(en)

func _on_enemy_defeated(en: ArenaEnemy, killer_idx: int) -> void:
	_enemies.erase(en)
	var k_idx: int = clampi(killer_idx, 0, GameState.players.size() - 1)
	var kp: Dictionary = GameState.players[k_idx]
	kp["kills"] = int(kp["kills"]) + 1
	GameState.add_score(k_idx, en.score_reward)
	# Berserker Blood Math: +2 HP lifesteal every 15 kills
	if str(kp["hero_id"]) == "berserker" and int(kp["kills"]) % 15 == 0 and not bool(kp["downed"]):
		kp["hp"] = minf(float(kp["max_hp"]), float(kp["hp"]) + 2.0)
		if k_idx < _heroes.size() and is_instance_valid(_heroes[k_idx]):
			_spawn_popup(_heroes[k_idx].global_position + Vector2(0, -18), "+2 HP 🩸", Color("#fb7185"))

	AudioSynth.play_sfx("hit")
	_spawn_burst(en.global_position, en.burst_color, 18 if en.is_boss else 7)

	var gems_n: int = 7 if en.is_boss else 1
	for _i: int in range(gems_n):
		var g := XpGem.new()
		var offset := Vector2((GameState.wave_rng.randf() - 0.5) * 32.0, (GameState.wave_rng.randf() - 0.5) * 32.0) if gems_n > 1 else Vector2.ZERO
		g.setup(int(ceil(float(en.xp_reward) / float(gems_n))), en.is_boss or en.xp_reward >= 25, _heroes)
		g.position = en.global_position + offset
		g.collected.connect(_on_gem_collected)
		world_root.add_child(g)
		_gems.append(g)

	if en.is_boss:
		GameState.boss_kills += 1
		_trauma = minf(1.0, _trauma + 0.55)
		_hit_stop(0.08, 0.08)
		AudioSynth.start_bgm(str(GameState.get_map_cfg()["bgm"]))
		var chest := BossChest.new()
		chest.position = en.global_position
		chest.opened.connect(_on_boss_chest_opened)
		world_root.add_child(chest)
		_active_chest = chest
		GameState.toast_requested.emit("👑 โค่น %s สำเร็จ! เก็บหีบสมบัติทองคำ!" % en.display_name, "good", "")

func _on_boss_chest_opened(_chest: BossChest, opener_idx: int) -> void:
	_active_chest = null
	AudioSynth.play_sfx("chest")
	for h: MathHero in _heroes:
		if is_instance_valid(h):
			h.controls_locked = true
	get_tree().paused = true
	GameState.open_boss_chest(opener_idx)

func _on_gem_collected(amt: int, collector_idx: int) -> void:
	AudioSynth.play_gem(GameState.team_streak)
	if GameState.add_xp(collector_idx, amt):
		AudioSynth.play_sfx("levelup")
		for h: MathHero in _heroes:
			if is_instance_valid(h):
				h.controls_locked = true
		get_tree().paused = true

func _on_hero_hurt(player_idx: int, source_name: String, raw_dmg: float) -> void:
	var actual: float = GameState.apply_damage_to_player(player_idx, raw_dmg)
	var h: MathHero = _heroes[player_idx] if player_idx < _heroes.size() else null
	if actual < 0.0:
		# Knight Fortress Guard blocked!
		if is_instance_valid(h):
			_spawn_ring(h.global_position, 56.0, Color("#38bdf8"))
			_spawn_popup(h.global_position + Vector2(0, -24), "🛡️ BLOCKED!", Color("#38bdf8"))
			for e: ArenaEnemy in _enemies:
				if is_instance_valid(e) and e.alive and e.global_position.distance_to(h.global_position) < 68.0:
					e.global_position += (e.global_position - h.global_position).normalized() * 34.0
		AudioSynth.play_sfx("dash")
		return
	if actual <= 0.0:
		return

	_trauma = minf(1.0, _trauma + 0.36)
	AudioSynth.play_sfx("hurt")
	if is_instance_valid(h):
		_spawn_popup(h.global_position + Vector2(0, -22), "-%d HP" % int(actual), Color("#f87171"))
	_handle_player_hp_check(player_idx, "ถูก " + source_name + " โจมตี")

func _handle_player_hp_check(player_idx: int, cause: String) -> void:
	var p: Dictionary = GameState.get_player(player_idx)
	if float(p["hp"]) > 0.0:
		return
	if GameState.mode == "coop_rival":
		p["score"] = maxi(0, int(p["score"]) - 80)
		p["respawn_timer"] = 2.5
		if player_idx < _heroes.size() and is_instance_valid(_heroes[player_idx]):
			_spawn_popup(_heroes[player_idx].global_position + Vector2(0, -24), "-80 · เกิดใหม่ 2.5วิ", Color("#f87171"))
		GameState.toast_requested.emit("💥 P%d พลาดท่า! หัก -80 คะแนน (เกิดใหม่ใน 2.5 วิ)" % [player_idx + 1], "bad", "")
		GameState.hud_updated.emit()
		return
	if GameState.mode == "coop_team":
		p["downed"] = true
		p["revive_progress"] = 0.0
		var any_alive: bool = false
		for pl: Dictionary in GameState.players:
			if not bool(pl["downed"]):
				any_alive = true
		if any_alive:
			GameState.toast_requested.emit("🆘 P%d ล้มลง! เดินเข้าวงเขียวเพื่อชุบ หรือเก็บลูกแก้วคำตอบถูก!" % [player_idx + 1], "bad", "")
			GameState.hud_updated.emit()
			return
		AudioSynth.stop_bgm()
		GameState.finish_round(false, "ทีมล้มลงทั้งคู่ (" + cause + ")")
		return
	AudioSynth.stop_bgm()
	GameState.finish_round(false, cause)

func _spawn_math_challenge() -> void:
	_active_q = GameState.generate_question(GameState.act_index + 1)
	_orbs.clear()
	var center: Vector2 = _get_focus_center()
	var base_ang: float = GameState.math_rng.randf() * TAU
	var choices: Array = _active_q["choices"]
	var ans: int = int(_active_q["answer"])
	var radius: float = 135.0 if GameState.is_two_player() else 145.0
	for i: int in range(choices.size()):
		var ang: float = base_ang + float(i) * (TAU / 3.0)
		var ox: float = clampf(center.x + cos(ang) * radius, 68.0, GameState.ARENA_PX - 68.0)
		var oy: float = clampf(center.y + sin(ang) * radius, 68.0, GameState.ARENA_PX - 68.0)
		var orb := MathOrb.new()
		orb.setup(int(choices[i]), int(choices[i]) == ans, float(i) * 1.4)
		orb.position = Vector2(ox, oy)
		orb.picked.connect(_on_math_orb_picked)
		world_root.add_child(orb)
		_orbs.append(orb)
	GameState.question_updated.emit(_active_q)

func _on_math_orb_picked(orb: MathOrb, picker_idx: int) -> void:
	if _active_q.is_empty():
		return
	var q := _active_q.duplicate()
	_active_q = {}
	for o: MathOrb in _orbs:
		if is_instance_valid(o):
			o.queue_free()
	_orbs.clear()
	GameState.question_updated.emit({})

	var p_idx: int = clampi(picker_idx, 0, GameState.players.size() - 1)
	var p: Dictionary = GameState.players[p_idx]
	var h: MathHero = _heroes[p_idx]
	var tag: String = ("P%d " % [p_idx + 1]) if GameState.is_two_player() else ""

	if orb.is_correct:
		p["correct"] = int(p["correct"]) + 1
		GameState.team_streak += 1
		GameState.best_streak = maxi(GameState.best_streak, GameState.team_streak)
		if GameState.team_streak >= 3:
			var f_dur: float = 12.0 if str(p["hero_id"]) == "chronomancer" else 8.0
			if GameState.mode == "coop_team":
				for pl: Dictionary in GameState.players:
					pl["fever_timer"] = maxf(float(pl["fever_timer"]), f_dur)
			else:
				p["fever_timer"] = maxf(float(p["fever_timer"]), f_dur)

		var base_pts: int = 200 if GameState.mode == "coop_rival" else 150
		var bonus: int = base_pts + mini(4, GameState.team_streak - 1) * 25
		GameState.add_score(p_idx, bonus)

		var heal_amt: float = 25.0 if (str(p["hero_id"]) == "alchemist" and GameState.mode == "coop_team") else 15.0
		if GameState.mode == "coop_team":
			for idx2: int in range(GameState.players.size()):
				var pl2: Dictionary = GameState.players[idx2]
				if bool(pl2["downed"]):
					_revive_player(idx2)
				else:
					pl2["hp"] = minf(float(pl2["max_hp"]), float(pl2["hp"]) + heal_amt)
		else:
			p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + heal_amt)

		# Rival mode: slow rival for 2.0s!
		if GameState.mode == "coop_rival" and GameState.players.size() >= 2:
			var rival_idx: int = 1 - p_idx
			GameState.players[rival_idx]["slow_debuff_timer"] = 2.0
			if rival_idx < _heroes.size() and is_instance_valid(_heroes[rival_idx]):
				_spawn_popup(_heroes[rival_idx].global_position + Vector2(0, -24), "❄️ โดนหน่วง 2 วิ!", Color("#38bdf8"))

		_trauma = minf(1.0, _trauma + 0.45)
		_hit_stop(0.06, 0.08)
		AudioSynth.play_sfx("math_ok")
		var fever_tag: String = " 🔥 FEVER!" if float(p["fever_timer"]) > 0.0 else ""
		GameState.toast_requested.emit("✅ %sตอบถูก! %s (+%d & ฮีล +%d HP)%s" % [tag, str(q["explain"]), bonus, int(heal_amt), fever_tag], "good", str(q["answer"]))

		var blast_rad: float = 240.0 * (1.3 if str(p["hero_id"]) == "mage" else 1.0)
		var blast_centers: Array[Vector2] = []
		if GameState.mode == "coop_team":
			for hh: MathHero in _heroes:
				if is_instance_valid(hh) and hh.is_alive_active():
					blast_centers.append(hh.global_position)
		else:
			blast_centers.append(h.global_position)

		for c_pos: Vector2 in blast_centers:
			_spawn_ring(c_pos, blast_rad, Color("#38bdf8"))
		_spawn_popup(h.global_position + Vector2(0, -28), "%sSUPER MATH +%d!" % [tag, bonus], Color("#4ade80"))

		for e: ArenaEnemy in _enemies.duplicate():
			if not is_instance_valid(e) or not e.alive:
				continue
			for c_pos: Vector2 in blast_centers:
				if e.global_position.distance_to(c_pos) < blast_rad + 10.0:
					var dmg: float = 150.0 if e.is_boss else 9999.0
					_spawn_popup(e.global_position, str(int(dmg)), Color("#38bdf8"))
					e.take_damage(dmg, p_idx)
					break

		# Mage Arcane Echo: 2 extra piercing star bolts!
		if str(p["hero_id"]) == "mage":
			var near_e: ArenaEnemy = _find_nearest_from(h.global_position, 420.0)
			var b_ang: float = (near_e.global_position - h.global_position).angle() if near_e else 0.0
			for s_i: int in range(2):
				var sp := Sprite2D.new()
				sp.texture = PixelArt.get_tex("evo_bolt")
				sp.position = h.global_position
				sp.z_index = 8
				world_root.add_child(sp)
				_projectiles.append({
					"kind": "bolt", "owner": p_idx, "node": sp,
					"vel": Vector2.RIGHT.rotated(b_ang + (-0.18 if s_i == 0 else 0.18)) * 390.0,
					"dmg": 55.0 * GameState.get_damage_mult(p_idx, "wand"), "pierce": 3, "hit": [], "life": 1.3, "evo": true
				})
		_math_cd = 1.8
	else:
		p["wrong"] = int(p["wrong"]) + 1
		GameState.team_streak = 0
		p["fever_timer"] = 0.0
		AudioSynth.play_sfx("math_bad")
		p["hp"] = maxf(0.0, float(p["hp"]) - 12.0)
		if GameState.mode == "coop_rival":
			p["score"] = maxi(0, int(p["score"]) - 40)
		_trauma = minf(1.0, _trauma + 0.35)
		GameState.toast_requested.emit("❌ %sชน %d (ที่ถูก: %s · %s)" % [tag, orb.value, str(q["answer"]), str(q["explain"])], "bad", "")
		_spawn_popup(h.global_position + Vector2(0, -22), "-12 HP", Color("#f87171"))
		_handle_player_hp_check(p_idx, "ชนลูกแก้วคำตอบผิด (%d)" % orb.value)
		_math_cd = 2.4
	GameState.hud_updated.emit()

func _find_nearest_from(origin: Vector2, max_dist: float) -> ArenaEnemy:
	var best: ArenaEnemy = null
	var bd: float = max_dist
	for e: ArenaEnemy in _enemies:
		if not is_instance_valid(e) or not e.alive:
			continue
		var d: float = e.global_position.distance_to(origin)
		if d < bd:
			bd = d
			best = e
	return best

func _update_weapons_for(idx: int, hero: MathHero, delta: float) -> void:
	var p: Dictionary = GameState.players[idx]
	var cd_map: Dictionary = _cds[idx]
	var cd_mult: float = GameState.get_cooldown_mult(idx)
	var area_mult: float = float(p["area_mult"])

	# 1. Star Wand / Cosmic Barrage
	var w_lv: int = int(p["weapons"].get("wand", 0))
	if w_lv > 0:
		cd_map["wand"] = float(cd_map["wand"]) - delta
		if float(cd_map["wand"]) <= 0.0:
			var target: ArenaEnemy = _find_nearest_from(hero.global_position, 390.0)
			if target:
				var evo: bool = w_lv >= 6
				var base_ang: float = (target.global_position - hero.global_position).angle()
				var shots: int = 5 if evo else (4 if w_lv >= 5 else (3 if w_lv >= 4 else (2 if w_lv >= 2 else 1)))
				var dmg: float = (64.0 if evo else (16.0 + float(w_lv) * 7.0)) * GameState.get_damage_mult(idx, "wand")
				for s: int in range(shots):
					var spread: float = 0.0 if shots == 1 else (float(s) - float(shots - 1) * 0.5) * 0.14
					var ang: float = base_ang + spread
					var sp := Sprite2D.new()
					sp.texture = PixelArt.get_tex("evo_bolt" if evo else "wand_bolt")
					sp.position = hero.global_position
					sp.z_index = 8
					world_root.add_child(sp)
					_projectiles.append({
						"kind": "bolt", "owner": idx, "node": sp, "vel": Vector2.RIGHT.rotated(ang) * (410.0 if evo else 340.0),
						"dmg": dmg, "pierce": 4 if evo else (2 if w_lv >= 4 else 1), "hit": [], "life": 1.3, "evo": evo
					})
				AudioSynth.play_sfx("shoot")
				cd_map["wand"] = (0.34 if evo else (0.50 if w_lv >= 3 else 0.64)) * cd_mult
			else:
				cd_map["wand"] = 0.14

	# 2. Orbiting Pi Orbs / Solar Halo
	var orb_lv: int = int(p["weapons"].get("orbs", 0))
	var pi_orbs: Array = _pi_orbs_by_p[idx]
	if orb_lv > 0 and not pi_orbs.is_empty():
		var evo2: bool = orb_lv >= 6
		var radius: float = (64.0 if evo2 else (46.0 if orb_lv < 3 else 56.0)) * clampf(area_mult, 0.9, 1.3)
		_orb_angles[idx] = fmod(_orb_angles[idx] + (5.2 if evo2 else (3.1 + float(orb_lv) * 0.35)) * delta, TAU)
		var dmg2: float = (48.0 if evo2 else (13.0 + float(orb_lv) * 5.0)) * GameState.get_damage_mult(idx, "orbs")
		for i: int in range(pi_orbs.size()):
			var sp2: Sprite2D = pi_orbs[i]
			if not is_instance_valid(sp2):
				continue
			var ang2: float = _orb_angles[idx] + float(i) * (TAU / float(pi_orbs.size()))
			sp2.position = hero.global_position + Vector2(cos(ang2), sin(ang2)) * radius
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive and e.orb_cd <= 0.0:
					if e.global_position.distance_to(sp2.position) < e.hit_radius + (13.0 if evo2 else 10.0):
						e.orb_cd = 0.28 if evo2 else 0.36
						_spawn_popup(e.global_position, str(int(dmg2)), Color("#fb923c") if evo2 else Color("#fde047"))
						e.take_damage(dmg2, idx)
						if evo2:
							_orb_hits[idx] += 1
							if _orb_hits[idx] >= 10:
								_orb_hits[idx] = 0
								p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 1.0)

	# 3. Chain Lightning / Tesla Storm (+ Inventor Tesla Coil Turret)
	var l_lv: int = int(p["weapons"].get("lightning", 0))
	if l_lv > 0:
		cd_map["lightning"] = float(cd_map["lightning"]) - delta
		if float(cd_map["lightning"]) <= 0.0:
			var first: ArenaEnemy = _find_nearest_from(hero.global_position, 340.0)
			if first:
				var evo3: bool = l_lv >= 6
				var chains: int = 8 if evo3 else (6 if l_lv >= 5 else (4 if l_lv >= 4 else (3 if l_lv >= 2 else 2)))
				var dmg3: float = (82.0 if evo3 else (22.0 + float(l_lv) * 9.0)) * GameState.get_damage_mult(idx, "lightning")
				var line := Line2D.new()
				line.width = 4.0 if evo3 else 3.0
				line.default_color = Color("#38bdf8") if evo3 else Color("#fde047")
				line.z_index = 11
				line.add_point(hero.global_position)
				var hit_list: Array[ArenaEnemy] = []
				var cur: ArenaEnemy = first
				for _c: int in range(chains):
					if cur == null or not is_instance_valid(cur):
						break
					hit_list.append(cur)
					line.add_point(cur.global_position)
					_spawn_popup(cur.global_position, str(int(dmg3)), Color("#38bdf8") if evo3 else Color("#fde047"))
					if evo3:
						for g: XpGem in _gems:
							if is_instance_valid(g) and g.global_position.distance_to(cur.global_position) < 90.0:
								g.global_position = g.global_position.lerp(hero.global_position, 0.55)
					var next_e: ArenaEnemy = null
					var nd: float = 175.0
					for cand: ArenaEnemy in _enemies:
						if is_instance_valid(cand) and cand.alive and not hit_list.has(cand):
							var d: float = cand.global_position.distance_to(cur.global_position)
							if d < nd:
								nd = d
								next_e = cand
					cur.take_damage(dmg3, idx)
					cur = next_e
				world_root.add_child(line)
				var ltw: Tween = line.create_tween()
				ltw.tween_property(line, "modulate:a", 0.0, 0.24)
				ltw.chain().tween_callback(line.queue_free)
				AudioSynth.play_sfx("lightning")

				if str(p["hero_id"]) == "inventor":
					_lightning_casts[idx] += 1
					if _lightning_casts[idx] >= 4:
						_lightning_casts[idx] = 0
						_spawn_tesla_turret(idx, hero.global_position, 24.0 * GameState.get_damage_mult(idx, "lightning"))

				cd_map["lightning"] = (1.15 if evo3 else (1.5 if l_lv >= 2 else 1.9)) * cd_mult
			else:
				cd_map["lightning"] = 0.24

	# 4. Boomerang Disc / Chrono Discs
	var b_lv: int = int(p["weapons"].get("boomerang", 0))
	if b_lv > 0:
		cd_map["boomerang"] = float(cd_map["boomerang"]) - delta
		if float(cd_map["boomerang"]) <= 0.0:
			var evo4: bool = b_lv >= 6
			var blades: int = 6 if evo4 else (4 if b_lv >= 5 else (3 if b_lv >= 4 else (2 if b_lv >= 2 else 1)))
			var near: ArenaEnemy = _find_nearest_from(hero.global_position, 360.0)
			var base_a: float = (near.global_position - hero.global_position).angle() if near else 0.0
			var dmg4: float = (72.0 if evo4 else (20.0 + float(b_lv) * 8.0)) * GameState.get_damage_mult(idx, "boomerang")
			for b: int in range(blades):
				var ang4: float = base_a + float(b) * (TAU / float(blades))
				var sp4 := Sprite2D.new()
				sp4.texture = PixelArt.get_tex("evo_disc" if evo4 else "boomerang")
				sp4.position = hero.global_position
				sp4.z_index = 9
				world_root.add_child(sp4)
				_projectiles.append({
					"kind": "boomerang", "owner": idx, "node": sp4, "dir": Vector2.RIGHT.rotated(ang4),
					"speed": 310.0 if evo4 else (250.0 + float(b_lv) * 20.0), "age": 0.0, "max_age": 1.6, "dmg": dmg4, "cd_map": {}, "evo": evo4
				})
			AudioSynth.play_sfx("shoot")
			cd_map["boomerang"] = (1.55 if evo4 else 2.0) * cd_mult

	# 5. Nova Burst / Omega Nova
	var n_lv: int = int(p["weapons"].get("nova", 0))
	if n_lv > 0:
		cd_map["nova"] = float(cd_map["nova"]) - delta
		if float(cd_map["nova"]) <= 0.0:
			var evo5: bool = n_lv >= 6
			var rad: float = (230.0 if evo5 else (95.0 + float(n_lv) * 20.0)) * area_mult
			var dmg5: float = (95.0 if evo5 else (24.0 + float(n_lv) * 12.0)) * GameState.get_damage_mult(idx, "nova")
			_spawn_ring(hero.global_position, rad, Color("#f43f5e") if evo5 else Color("#fb923c"))
			if evo5:
				_spawn_ring(hero.global_position, rad * 0.65, Color("#fde047"))
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive and e.global_position.distance_to(hero.global_position) <= rad + e.hit_radius:
					e.global_position += (e.global_position - hero.global_position).normalized() * (28.0 if evo5 else 18.0)
					_spawn_popup(e.global_position, str(int(dmg5)), Color("#f43f5e") if evo5 else Color("#fb923c"))
					e.take_damage(dmg5, idx)
			cd_map["nova"] = (1.85 if evo5 else (2.3 if n_lv >= 3 else 2.9)) * cd_mult

func _spawn_tesla_turret(owner_idx: int, pos: Vector2, dmg: float) -> void:
	var sp := Sprite2D.new()
	sp.texture = PixelArt.get_tex("tesla_coil")
	sp.position = pos
	sp.z_index = 5
	world_root.add_child(sp)
	_turrets.append({"owner": owner_idx, "node": sp, "life": 5.0, "cd": 0.25, "dmg": dmg})
	_spawn_popup(pos + Vector2(0, -18), "⚡ เสาเทสลา!", Color("#38bdf8"))

func _update_turrets(delta: float) -> void:
	for i: int in range(_turrets.size() - 1, -1, -1):
		var t: Dictionary = _turrets[i]
		var sp: Sprite2D = t["node"]
		if not is_instance_valid(sp):
			_turrets.remove_at(i)
			continue
		t["life"] = float(t["life"]) - delta
		t["cd"] = float(t["cd"]) - delta
		if float(t["cd"]) <= 0.0:
			var target: ArenaEnemy = _find_nearest_from(sp.global_position, 165.0)
			if target:
				t["cd"] = 0.65
				var line := Line2D.new()
				line.width = 2.5
				line.default_color = Color("#38bdf8")
				line.z_index = 11
				line.add_point(sp.global_position + Vector2(0, -6))
				line.add_point(target.global_position)
				world_root.add_child(line)
				var ltw: Tween = line.create_tween()
				ltw.tween_property(line, "modulate:a", 0.0, 0.18)
				ltw.chain().tween_callback(line.queue_free)
				_spawn_popup(target.global_position, str(int(t["dmg"])), Color("#38bdf8"))
				target.take_damage(float(t["dmg"]), int(t["owner"]))
			else:
				t["cd"] = 0.2
		if float(t["life"]) <= 0.0:
			sp.queue_free()
			_turrets.remove_at(i)

func _update_projectiles(delta: float) -> void:
	for i: int in range(_projectiles.size() - 1, -1, -1):
		var p: Dictionary = _projectiles[i]
		var sp: Sprite2D = p["node"]
		var owner_idx: int = int(p.get("owner", 0))
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
						_spawn_popup(e.global_position, str(int(p["dmg"])), Color("#f472b6") if bool(p.get("evo", false)) else Color("#38bdf8"))
						e.take_damage(float(p["dmg"]), owner_idx)
						if bool(p.get("evo", false)):
							_spawn_burst(sp.position, Color("#f472b6"), 5)
						p["pierce"] = int(p["pierce"]) - 1
						if int(p["pierce"]) <= 0:
							p["life"] = 0.0
							break
			if float(p["life"]) <= 0.0:
				sp.queue_free()
				_projectiles.remove_at(i)
		else:
			p["age"] = float(p["age"]) + delta
			sp.rotation += 15.0 * delta
			var factor: float = 1.0 if float(p["age"]) < float(p["max_age"]) * 0.48 else -1.15
			sp.position += (p["dir"] as Vector2) * float(p["speed"]) * factor * delta
			var cd_map: Dictionary = p["cd_map"]
			for e: ArenaEnemy in _enemies.duplicate():
				if is_instance_valid(e) and e.alive:
					var eid: int = e.get_instance_id()
					var prev_t: float = float(cd_map.get(eid, -1.0))
					if float(p["age"]) - prev_t > 0.35 and e.global_position.distance_to(sp.position) < e.hit_radius + 14.0:
						cd_map[eid] = float(p["age"])
						_spawn_popup(e.global_position, str(int(p["dmg"])), Color("#22d3ee") if bool(p.get("evo", false)) else Color("#c084fc"))
						if bool(p.get("evo", false)):
							e.apply_slow(2.0)
						e.take_damage(float(p["dmg"]), owner_idx)
			if float(p["age"]) >= float(p["max_age"]):
				sp.queue_free()
				_projectiles.remove_at(i)

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
