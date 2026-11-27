extends Node

signal external_start_requested(seed_val: int, mode_name: String, map_id: String, p1_hero: String, p2_hero: String)
signal external_draft_picked(player_idx: int, card_idx: int)
signal external_chest_answered(answer_val: int)
signal external_dash_requested(player_idx: int)
signal external_pause_changed(paused: bool)

var joy_dirs: Array[Vector2] = [Vector2.ZERO, Vector2.ZERO]
var _last_start_seq: int = 0
var _last_draft_seq: int = 0
var _last_p1_draft_seq: int = 0
var _last_p2_draft_seq: int = 0
var _last_chest_seq: int = 0
var _last_dash_seq: int = 0
var _last_dash2_seq: int = 0
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
	joy_dirs[0] = Vector2(float(d.get("joyDx", 0.0)), float(d.get("joyDy", 0.0)))
	joy_dirs[1] = Vector2(float(d.get("joy2Dx", 0.0)), float(d.get("joy2Dy", 0.0)))

	var p_flag: bool = bool(d.get("paused", false))
	if p_flag != _last_paused:
		_last_paused = p_flag
		external_pause_changed.emit(p_flag)

	var s_seq: int = int(d.get("startSeq", 0))
	if s_seq != _last_start_seq:
		_last_start_seq = s_seq
		var p1_h: String = str(d.get("p1Hero", d.get("heroId", "mage")))
		var p2_h: String = str(d.get("p2Hero", "knight"))
		external_start_requested.emit(
			int(d.get("seed", 1337)),
			str(d.get("mode", "normal")),
			str(d.get("mapId", "arcane_temple")),
			p1_h,
			p2_h
		)

	var dr_seq: int = int(d.get("draftSeq", 0))
	if dr_seq != _last_draft_seq:
		_last_draft_seq = dr_seq
		external_draft_picked.emit(int(d.get("draftPlayerIdx", 0)), int(d.get("draftIdx", 0)))

	var p1_dr: int = int(d.get("p1DraftSeq", 0))
	if p1_dr != _last_p1_draft_seq:
		_last_p1_draft_seq = p1_dr
		external_draft_picked.emit(0, int(d.get("p1DraftIdx", 0)))

	var p2_dr: int = int(d.get("p2DraftSeq", 0))
	if p2_dr != _last_p2_draft_seq:
		_last_p2_draft_seq = p2_dr
		external_draft_picked.emit(1, int(d.get("p2DraftIdx", 0)))

	var ch_seq: int = int(d.get("chestSeq", 0))
	if ch_seq != _last_chest_seq:
		_last_chest_seq = ch_seq
		external_chest_answered.emit(int(d.get("chestAnswer", 0)))

	var da_seq: int = int(d.get("dashSeq", 0))
	if da_seq != _last_dash_seq:
		_last_dash_seq = da_seq
		external_dash_requested.emit(0)

	var da2_seq: int = int(d.get("dash2Seq", 0))
	if da2_seq != _last_dash2_seq:
		_last_dash2_seq = da2_seq
		external_dash_requested.emit(1)

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

func _push_levelup(payload: Dictionary) -> void:
	var out: Dictionary = payload.duplicate(true)
	var p_opts: Array = out.get("playerOptions", [])
	out["options"] = p_opts[0] if not p_opts.is_empty() else []
	_emit_web("onLevelUp", out)

func _push_chest(q_data: Dictionary) -> void:
	_emit_web("onChest", q_data)

func _push_round_end(won: bool, cause: String) -> void:
	var payload: Dictionary = GameState.build_hud_payload()
	payload["won"] = won
	payload["cause"] = cause
	_emit_web("onRoundEnd", payload)
