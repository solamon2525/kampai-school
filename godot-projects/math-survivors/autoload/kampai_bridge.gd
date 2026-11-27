extends Node

signal external_start_requested(seed_val: int, mode_name: String, map_id: String, hero_id: String)
signal external_draft_picked(idx: int)
signal external_chest_answered(answer_val: int)
signal external_dash_requested
signal external_pause_changed(paused: bool)

var joy_dir: Vector2 = Vector2.ZERO
var _last_start_seq: int = 0
var _last_draft_seq: int = 0
var _last_chest_seq: int = 0
var _last_dash_seq: int = 0
var _last_paused: bool = false
var _is_web: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_is_web = OS.has_feature("web") and Engine.has_singleton("JavaScriptBridge")

	GameState.hud_updated.connect(_push_hud)
	GameState.toast_requested.connect(_push_toast)
	GameState.question_updated.connect(_push_question)
	GameState.levelup_opened.connect(_push_levelup)
	GameState.chest_opened.connect(_push_chest)
	GameState.round_ended.connect(_push_round_end)

	if _is_web:
		JavaScriptBridge.eval("window.KAMPAI_GODOT_READY = true;", true)

func _process(_delta: float) -> void:
	if not _is_web:
		return
	var raw: Variant = JavaScriptBridge.eval("window.KAMPAI_BRIDGE_IN ? JSON.stringify(window.KAMPAI_BRIDGE_IN) : ''", true)
	if typeof(raw) != TYPE_STRING or str(raw).is_empty():
		return
	var data: Variant = JSON.parse_string(str(raw))
	if typeof(data) != TYPE_DICTIONARY:
		return
	var d: Dictionary = data

	AudioSynth.sfx_enabled = bool(d.get("sfxOn", true))
	AudioSynth.bgm_enabled = bool(d.get("bgmOn", true))
	AudioSynth.sfx_volume = float(d.get("sfxVol", 1.0))
	AudioSynth.bgm_volume = float(d.get("bgmVol", 0.8))
	GameState.reduce_shake = bool(d.get("reduceShake", false))
	joy_dir = Vector2(float(d.get("joyDx", 0.0)), float(d.get("joyDy", 0.0)))

	var p_flag: bool = bool(d.get("paused", false))
	if p_flag != _last_paused:
		_last_paused = p_flag
		external_pause_changed.emit(p_flag)

	var s_seq: int = int(d.get("startSeq", 0))
	if s_seq != _last_start_seq:
		_last_start_seq = s_seq
		external_start_requested.emit(
			int(d.get("seed", 1337)),
			str(d.get("mode", "normal")),
			str(d.get("mapId", "arcane_temple")),
			str(d.get("heroId", "mage"))
		)

	var dr_seq: int = int(d.get("draftSeq", 0))
	if dr_seq != _last_draft_seq:
		_last_draft_seq = dr_seq
		external_draft_picked.emit(int(d.get("draftIdx", 0)))

	var ch_seq: int = int(d.get("chestSeq", 0))
	if ch_seq != _last_chest_seq:
		_last_chest_seq = ch_seq
		external_chest_answered.emit(int(d.get("chestAnswer", 0)))

	var da_seq: int = int(d.get("dashSeq", 0))
	if da_seq != _last_dash_seq:
		_last_dash_seq = da_seq
		external_dash_requested.emit()

func _emit_web(fn_name: String, payload: Dictionary) -> void:
	if not _is_web:
		return
	var js: String = "if(window.KAMPAI_BRIDGE_OUT && typeof window.KAMPAI_BRIDGE_OUT.%s==='function'){window.KAMPAI_BRIDGE_OUT.%s(%s);}" % [fn_name, fn_name, JSON.stringify(payload)]
	JavaScriptBridge.eval(js, true)

func _push_hud() -> void:
	_emit_web("onHud", GameState.build_hud_payload())

func _push_toast(message: String, tone: String, speak_word: String) -> void:
	_emit_web("onToast", {"message": message, "tone": tone, "speakWord": speak_word})

func _push_question(q_data: Dictionary) -> void:
	_emit_web("onQuestion", q_data)

func _push_levelup(options: Array) -> void:
	_emit_web("onLevelUp", {"options": options})

func _push_chest(q_data: Dictionary) -> void:
	_emit_web("onChest", q_data)

func _push_round_end(won: bool, cause: String) -> void:
	var payload: Dictionary = GameState.build_hud_payload()
	payload["won"] = won
	payload["cause"] = cause
	_emit_web("onRoundEnd", payload)
