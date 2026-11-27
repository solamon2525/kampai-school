extends Node

signal external_start_requested(seed_val: int)
signal external_pause_changed(paused: bool)

var touch_left: bool = false
var touch_right: bool = false
var touch_jump_held: bool = false
var _touch_jump_just: bool = false
var _last_start_seq: int = 0
var _last_pause_state: bool = false

func _ready() -> void:
	GameState.hud_updated.connect(_on_hud_updated)
	GameState.toast_requested.connect(_on_toast_requested)
	GameState.round_finished.connect(_on_round_finished)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.KAMPAI_GODOT_READY = true;", true)

func _process(_delta: float) -> void:
	if not OS.has_feature("web"):
		return
	var cmd_raw: Variant = JavaScriptBridge.eval("""
		(function(){
			var b = window.KAMPAI_BRIDGE_IN;
			if (!b) return "";
			var out = JSON.stringify({
				startSeq: b.startSeq || 0,
				seed: b.seed || 1337,
				paused: !!b.paused,
				sfxOn: b.sfxOn !== false,
				bgmOn: b.bgmOn !== false,
				tLeft: !!b.tLeft,
				tRight: !!b.tRight,
				tJump: !!b.tJump,
				tJumpJust: !!b.tJumpJust
			});
			b.tJumpJust = false;
			return out;
		})()
	""", true)
	if typeof(cmd_raw) != TYPE_STRING or (cmd_raw as String).is_empty():
		return
	var parsed: Variant = JSON.parse_string(cmd_raw as String)
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var d: Dictionary = parsed as Dictionary
	touch_left = bool(d.get("tLeft", false))
	touch_right = bool(d.get("tRight", false))
	touch_jump_held = bool(d.get("tJump", false))
	if bool(d.get("tJumpJust", false)):
		_touch_jump_just = true

	AudioSynth.set_bus_enabled(&"SFX", bool(d.get("sfxOn", true)))
	AudioSynth.set_bus_enabled(&"Music", bool(d.get("bgmOn", true)))

	var paused: bool = bool(d.get("paused", false))
	if paused != _last_pause_state:
		_last_pause_state = paused
		external_pause_changed.emit(paused)

	var seq: int = int(d.get("startSeq", 0))
	if seq > _last_start_seq:
		_last_start_seq = seq
		external_start_requested.emit(int(d.get("seed", 1337)))

func consume_touch_jump_just_pressed() -> bool:
	var v: bool = _touch_jump_just
	_touch_jump_just = false
	return v

func _on_hud_updated() -> void:
	if not OS.has_feature("web"):
		return
	var world: Dictionary = GameState.get_current_world()
	var payload: String = JSON.stringify({
		"score": GameState.score,
		"lives": GameState.lives,
		"maxLives": GameState.MAX_LIVES,
		"correct": GameState.correct_count,
		"wrong": GameState.wrong_count,
		"stageName": str(world.get("name", "ด่าน 1-1")),
	})
	JavaScriptBridge.eval("if(window.KAMPAI_BRIDGE_OUT&&window.KAMPAI_BRIDGE_OUT.onHud)window.KAMPAI_BRIDGE_OUT.onHud(" + payload + ");", true)

func _on_toast_requested(message: String, is_good: bool, speak_word: String) -> void:
	if not OS.has_feature("web"):
		return
	var payload: String = JSON.stringify({
		"message": message,
		"good": is_good,
		"speakWord": speak_word,
	})
	JavaScriptBridge.eval("if(window.KAMPAI_BRIDGE_OUT&&window.KAMPAI_BRIDGE_OUT.onToast)window.KAMPAI_BRIDGE_OUT.onToast(" + payload + ");", true)

func _on_round_finished(won_all: bool) -> void:
	if not OS.has_feature("web"):
		return
	var payload: String = JSON.stringify({
		"wonAll": won_all,
		"score": GameState.score,
		"correct": GameState.correct_count,
		"wrong": GameState.wrong_count,
		"lives": GameState.lives,
	})
	JavaScriptBridge.eval("if(window.KAMPAI_BRIDGE_OUT&&window.KAMPAI_BRIDGE_OUT.onRoundEnd)window.KAMPAI_BRIDGE_OUT.onRoundEnd(" + payload + ");", true)
