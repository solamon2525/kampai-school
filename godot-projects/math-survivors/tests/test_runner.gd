extends SceneTree

var passed: int = 0
var failed: int = 0

func _check(cond: bool, label: String) -> void:
	if cond:
		passed += 1
	else:
		failed += 1
		push_error("FAIL: " + label)

func _initialize() -> void:
	for test_name: String in [
		"test_math_determinism_600_seeds",
		"test_multi_biome_tileset_and_walls",
		"test_shaders_compile",
		"test_audio_buses_and_volumes",
		"test_7_class_balance_and_defense",
		"test_coop_team_dual_draft_and_rival",
		"test_evolutions_and_boss_chest"
	]:
		if call(test_name) != true:
			failed += 1
			push_error("FAIL runtime error in " + test_name)

	print("Godot Tests: %d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)

func test_math_determinism_600_seeds() -> bool:
	var gs: Node = root.get_node("GameState")
	var rejects: int = 0
	for act: int in range(1, 4):
		for s: int in range(1, 601):
			var rng := RandomNumberGenerator.new()
			rng.seed = gs.call("hash_seed", s * 97 + act, "math")
			var q: Dictionary = gs.call("generate_question", act, rng)
			var ans: int = int(q["answer"])
			var ch: Array = q["choices"]
			var uniq: Array = []
			for c: Variant in ch:
				if int(c) > 0 and not uniq.has(int(c)):
					uniq.append(int(c))
			if ans <= 0 or ch.size() != 3 or uniq.size() != 3 or not uniq.has(ans):
				rejects += 1
	_check(rejects == 0, "1800 math questions zero rejects")
	return true

func test_multi_biome_tileset_and_walls() -> bool:
	var layer := TileMapLayer.new()
	var ts := load("res://tiles/arena_tileset.tres") as TileSet
	_check(ts != null, "multi-biome arena_tileset.tres loads")
	layer.tile_set = ts
	root.add_child(layer)
	for row_y: int in range(3):
		layer.set_cell(Vector2i(row_y, 0), 0, Vector2i(4, row_y))
		var td: TileData = layer.get_cell_tile_data(Vector2i(row_y, 0))
		_check(td != null and td.get_collision_polygons_count(0) > 0, "biome row %d wall has physics polygon" % row_y)
	layer.queue_free()
	return true

func test_shaders_compile() -> bool:
	for p: String in ["res://shaders/hit_flash.gdshader", "res://shaders/arcane_aura.gdshader"]:
		var sh := load(p) as Shader
		_check(sh != null and sh.get_shader_uniform_list().size() >= 1, "shader compiles: " + p)
	return true

func test_audio_buses_and_volumes() -> bool:
	var synth: Node = root.get_node("AudioSynth")
	_check(AudioServer.get_bus_index("Master") >= 0, "Master bus exists")
	_check(AudioServer.get_bus_index("Music") >= 0, "Music bus exists")
	_check(AudioServer.get_bus_index("SFX") >= 0, "SFX bus exists")
	synth.set("bgm_volume", 0.5)
	synth.set("sfx_volume", 0.0)
	_check(AudioServer.is_bus_mute(AudioServer.get_bus_index("SFX")), "SFX muted cleanly at 0.0 linear")
	synth.set("sfx_volume", 1.0)
	_check(not AudioServer.is_bus_mute(AudioServer.get_bus_index("SFX")), "SFX unmuted at 1.0 linear")
	return true

func test_7_class_balance_and_defense() -> bool:
	var gs: Node = root.get_node("GameState")
	var heroes_dict: Dictionary = gs.get("HEROES")
	_check(heroes_dict.size() == 7, "exactly 7 hero classes defined")

	var indices: Array[float] = []
	var sum_idx: float = 0.0
	for hid: String in heroes_dict.keys():
		var m: Dictionary = gs.call("compute_class_metrics", hid)
		_check(int(m["total_pts"]) == 25, "class %s has exact 25 stat budget" % hid)
		var pidx: float = float(m["power_index"])
		indices.append(pidx)
		sum_idx += pidx
	var mean_idx: float = sum_idx / maxf(1.0, float(indices.size()))
	for i: int in range(indices.size()):
		var dev: float = absf(indices[i] - mean_idx) / maxf(0.001, mean_idx)
		_check(dev <= 0.16, "class power index within 16%% of mean (dev=%.3f)" % dev)

	# Ratio defense + Knight Fortress Guard check
	gs.call("start_new_round", 1337, "normal", "arcane_temple", "knight", "mage")
	var first_hit: float = float(gs.call("apply_damage_to_player", 0, 20.0))
	_check(first_hit == -1.0, "knight Fortress Guard blocks 1st hit")
	var second_hit: float = float(gs.call("apply_damage_to_player", 0, 20.0))
	_check(second_hit > 0.0 and second_hit < 20.0, "knight Ratio DEF mitigates 2nd hit without immunity (dmg=%.1f)" % second_hit)
	return true

func test_coop_team_dual_draft_and_rival() -> bool:
	var gs: Node = root.get_node("GameState")
	gs.call("start_new_round", 1337, "coop_team", "crystal_forest", "mage", "alchemist")
	var pls: Array = gs.get("players")
	_check(pls.size() == 2, "coop_team initializes 2 players")
	_check(bool(gs.call("add_xp", 0, 100)), "team XP triggers dual level-up draft")
	_check(bool(gs.get("is_levelup")), "level-up active")
	var done_after_p1: bool = bool(gs.call("pick_draft", 0, 0))
	_check(not done_after_p1 and bool(gs.get("is_levelup")), "dual draft stays open until P2 picks")
	var done_after_p2: bool = bool(gs.call("pick_draft", 1, 0))
	_check(done_after_p2 and not bool(gs.get("is_levelup")), "dual draft closes once both pick")

	gs.call("start_new_round", 1337, "coop_rival", "lava_citadel", "ranger", "berserker")
	_check(float(gs.get("run_duration")) == 120.0, "coop_rival runs 120s duration")
	gs.call("add_score", 0, 200)
	gs.call("add_score", 1, 100)
	var hud: Dictionary = gs.call("build_hud_payload")
	_check(int(hud["p1Score"]) > int(hud["p2Score"]), "coop_rival tracks separate P1 & P2 scores")
	return true

func test_evolutions_and_boss_chest() -> bool:
	var gs: Node = root.get_node("GameState")
	gs.call("start_new_round", 1337, "normal", "lava_citadel", "knight", "mage")
	var p0: Dictionary = gs.call("get_player", 0)
	_check(int(p0["weapons"].get("orbs", 0)) == 1, "knight hero starts with orbs Lv.1")
	p0["weapons"]["orbs"] = 5
	p0["passives"]["vitality"] = 1
	_check(bool(gs.call("can_evolve", 0, "orbs")), "orbs Lv.5 + vitality Lv.1 unlocks evolution")

	gs.call("open_boss_chest", 0)
	_check(bool(gs.get("is_chest_open")), "boss chest opens")
	var chest_q: Dictionary = gs.get("active_chest_q")
	var res: Dictionary = gs.call("resolve_boss_chest", int(chest_q["answer"]))
	_check(bool(res["correct"]), "correct boss chest answer resolves true")
	_check(int(p0["weapons"]["orbs"]) == 6, "boss chest evolves ready Lv.5 weapon to Lv.6")
	return true
