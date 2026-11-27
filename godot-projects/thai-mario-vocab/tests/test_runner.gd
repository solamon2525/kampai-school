# res://tests/test_runner.gd
# godot --headless --path . --script res://tests/test_runner.gd
extends SceneTree

var passed: int = 0
var failed: int = 0

func _initialize() -> void:
	await _run_all()
	print("Godot Tests: %d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)

func _check(cond: bool, label: String) -> void:
	if cond:
		passed += 1
	else:
		failed += 1
		push_error("FAIL: %s" % label)

func _run_all() -> void:
	await process_frame
	var gs: Node = root.get_node_or_null("GameState")
	_check(gs != null, "GameState autoload loaded")
	if gs == null:
		return

	gs.call("start_new_round", 4242)
	_check(int(gs.get("lives")) == 5, "initial lives == 5")
	_check(int(gs.get("score")) == 0, "initial score == 0")

	var w: Dictionary = gs.call("get_current_world")
	var slots_a: Array = gs.call("build_stage_word_slots", w)
	var slots_b: Array = gs.call("build_stage_word_slots", w)
	_check(slots_a.size() == 8 and slots_a == slots_b, "seeded word slots deterministic")

	var gained: int = gs.call("collect_correct_word", {"correct": "กะเพรา", "hint": "ok"})
	_check(gained == 100 and int(gs.get("score")) == 100, "correct word adds 100")

	for i: int in range(4):
		var over: bool = gs.call("collect_wrong_word", {"correct": "กะเพรา", "wrong": "กระเพรา", "hint": "h"})
		_check(not over and int(gs.get("lives")) == 4 - i, "wrong word decrements heart %d" % (i + 1))

	var final_over: bool = gs.call("collect_wrong_word", {"correct": "อนุญาต", "wrong": "อนุญาติ", "hint": "h"})
	_check(final_over and int(gs.get("lives")) == 0, "5th wrong word triggers game over")

	# Test Main scene loads & player lands on floor
	var main_packed: PackedScene = load("res://scenes/main.tscn")
	_check(main_packed != null, "main.tscn loads")
	if main_packed:
		var main_inst: Node = main_packed.instantiate()
		root.add_child(main_inst)
		for _f: int in range(40):
			await physics_frame
		var player_node: CharacterBody2D = main_inst.get_node_or_null("Player") as CharacterBody2D
		_check(player_node != null and player_node.is_on_floor(), "player lands on floor in main.tscn")
		main_inst.queue_free()
		await process_frame
