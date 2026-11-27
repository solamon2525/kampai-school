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
		"test_heroes_evolutions_and_chest"
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

func test_heroes_evolutions_and_chest() -> bool:
	var gs: Node = root.get_node("GameState")
	gs.call("start_new_round", 1337, "normal", "lava_citadel", "knight")
	_check(gs.get("weapons").get("orbs", 0) == 1, "knight hero starts with orbs Lv.1")
	_check(float(gs.get("max_hp")) == 125.0, "knight hero gets +25 max HP")
	gs.get("weapons")["orbs"] = 5
	gs.get("passives")["vitality"] = 1
	_check(bool(gs.call("can_evolve", "orbs")), "orbs Lv.5 + vitality Lv.1 unlocks evolution")

	gs.call("open_boss_chest")
	_check(bool(gs.get("is_chest_open")), "boss chest opens")
	var chest_q: Dictionary = gs.get("active_chest_q")
	var res: Dictionary = gs.call("resolve_boss_chest", int(chest_q["answer"]))
	_check(bool(res["correct"]), "correct boss chest answer resolves true")
	_check(int(gs.get("weapons")["orbs"]) == 6, "boss chest evolves ready Lv.5 weapon to Lv.6")
	return true
