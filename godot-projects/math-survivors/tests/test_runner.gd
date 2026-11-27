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
		"test_tileset_and_collision",
		"test_shaders_compile",
		"test_audio_buses",
		"test_roguelite_round_state"
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
	_check(rejects == 0, "1800 math questions zero rejects (got %d)" % rejects)

	var r1 := RandomNumberGenerator.new()
	r1.seed = 98765
	var r2 := RandomNumberGenerator.new()
	r2.seed = 98765
	_check(gs.call("generate_question", 2, r1)["prompt"] == gs.call("generate_question", 2, r2)["prompt"], "identical seed identical math question")
	return true

func test_tileset_and_collision() -> bool:
	var layer := TileMapLayer.new()
	var ts := load("res://tiles/arena_tileset.tres") as TileSet
	_check(ts != null, "arena_tileset.tres loads")
	layer.tile_set = ts
	root.add_child(layer)
	layer.set_cell(Vector2i(0, 0), 0, Vector2i(4, 0))
	var td: TileData = layer.get_cell_tile_data(Vector2i(0, 0))
	_check(td != null and td.get_collision_polygons_count(0) > 0, "wall tile has physics polygon")
	layer.queue_free()
	return true

func test_shaders_compile() -> bool:
	for p: String in ["res://shaders/hit_flash.gdshader", "res://shaders/arcane_aura.gdshader"]:
		var sh := load(p) as Shader
		_check(sh != null, "shader loads: " + p)
		if sh:
			_check(sh.get_shader_uniform_list().size() >= 1, "shader uniforms compile: " + p)
	return true

func test_audio_buses() -> bool:
	_check(AudioServer.get_bus_index("Master") >= 0, "Master bus exists")
	_check(AudioServer.get_bus_index("Music") >= 0, "Music bus exists")
	_check(AudioServer.get_bus_index("SFX") >= 0, "SFX bus exists")
	return true

func test_roguelite_round_state() -> bool:
	var gs: Node = root.get_node("GameState")
	gs.call("start_new_round", 1337, "normal")
	_check(gs.get("weapons").get("wand", 0) == 1, "hero starts with wand Lv.1")
	var leveled: bool = gs.call("add_xp", 70)
	_check(leveled and bool(gs.get("is_levelup")), "xp triggers level up draft")
	_check(gs.get("draft_options").size() == 3, "draft produces 3 options")
	gs.call("pick_draft", 0)
	_check(not bool(gs.get("is_levelup")), "picking draft closes level up")
	return true
