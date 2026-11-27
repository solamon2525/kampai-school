extends Node

const SAMPLE_RATE: int = 22050

var sfx_enabled: bool = true:
	set(val):
		sfx_enabled = val
		_apply_bus("SFX", sfx_enabled, sfx_volume)

var bgm_enabled: bool = true:
	set(val):
		bgm_enabled = val
		_apply_bus("Music", bgm_enabled, bgm_volume)

var sfx_volume: float = 1.0:
	set(val):
		sfx_volume = clampf(val, 0.0, 1.0)
		_apply_bus("SFX", sfx_enabled, sfx_volume)

var bgm_volume: float = 0.8:
	set(val):
		bgm_volume = clampf(val, 0.0, 1.0)
		_apply_bus("Music", bgm_enabled, bgm_volume)

var _sfx_player: AudioStreamPlayer
var _bgm_player: AudioStreamPlayer
var _streams: Dictionary = {}
var _current_bgm: String = ""

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_sfx_player = AudioStreamPlayer.new()
	_sfx_player.bus = &"SFX"
	_sfx_player.max_polyphony = 8
	add_child(_sfx_player)

	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.bus = &"Music"
	_bgm_player.volume_db = -8.0
	add_child(_bgm_player)

	_build_sfx()
	_build_bgm("arena")

func _apply_bus(bus_name: StringName, enabled: bool, linear_vol: float) -> void:
	var idx: int = AudioServer.get_bus_index(bus_name)
	if idx < 0:
		return
	var should_mute: bool = (not enabled) or linear_vol <= 0.001
	AudioServer.set_bus_mute(idx, should_mute)
	if not should_mute:
		AudioServer.set_bus_volume_linear(idx, linear_vol)

func play_sfx(key: String, pitch_var: float = 0.05) -> void:
	if not sfx_enabled or sfx_volume <= 0.001 or not _streams.has(key):
		return
	_sfx_player.stream = _streams[key]
	_sfx_player.pitch_scale = randf_range(1.0 - pitch_var, 1.0 + pitch_var)
	_sfx_player.play()

func play_gem(streak_cnt: int) -> void:
	if not sfx_enabled or sfx_volume <= 0.001 or not _streams.has("gem"):
		return
	_sfx_player.stream = _streams["gem"]
	_sfx_player.pitch_scale = minf(1.65, 1.0 + float(streak_cnt) * 0.06)
	_sfx_player.play()

func start_bgm(theme: String = "arena") -> void:
	if _current_bgm == theme and _bgm_player.playing:
		return
	_current_bgm = theme
	if not _streams.has("bgm_" + theme):
		_build_bgm(theme)
	_bgm_player.stream = _streams.get("bgm_" + theme, _streams.get("bgm_arena"))
	if bgm_enabled and bgm_volume > 0.001 and _bgm_player.stream:
		_bgm_player.play()

func stop_bgm() -> void:
	_current_bgm = ""
	if _bgm_player.playing:
		_bgm_player.stop()

func _build_sfx() -> void:
	_streams["shoot"] = _synth_sweep(720.0, 340.0, 0.055, "triangle", 0.35)
	_streams["hit"] = _synth_sweep(210.0, 105.0, 0.05, "square", 0.28)
	_streams["lightning"] = _synth_sweep(1080.0, 260.0, 0.11, "sawtooth", 0.36)
	_streams["dash"] = _synth_sweep(340.0, 960.0, 0.11, "sine", 0.42)
	_streams["gem"] = _synth_sweep(587.33, 880.0, 0.065, "sine", 0.42)
	_streams["hurt"] = _synth_sweep(170.0, 82.0, 0.16, "sawtooth", 0.50)
	_streams["math_ok"] = _synth_notes([523.25, 659.25, 783.99, 1046.50], 0.085, "triangle", 0.55)
	_streams["math_bad"] = _synth_notes([220.0, 155.56], 0.14, "sawtooth", 0.48)
	_streams["levelup"] = _synth_notes([587.33, 739.99, 880.0, 1174.66], 0.095, "triangle", 0.55)
	_streams["chest"] = _synth_notes([523.25, 659.25, 783.99, 987.77, 1318.51], 0.09, "triangle", 0.58)
	_streams["boss"] = _synth_notes([220.0, 196.0, 220.0, 164.81], 0.14, "sawtooth", 0.52)

func _build_bgm(theme: String) -> void:
	var lead: Array[float] = [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 392.0, 293.66, 349.23, 440.0, 587.33, 523.25, 440.0, 392.0, 329.63]
	var bass: Array[float] = [146.83, 146.83, 174.61, 174.61, 130.81, 130.81, 196.00, 196.00]
	var step_sec: float = 0.17
	if theme == "forest":
		lead = [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 493.88, 392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 440.0]
		bass = [196.0, 196.0, 246.94, 246.94, 164.81, 164.81, 220.0, 220.0]
		step_sec = 0.165
	elif theme == "lava":
		lead = [329.63, 392.0, 493.88, 466.16, 392.0, 329.63, 293.66, 329.63, 329.63, 392.0, 587.33, 493.88, 466.16, 392.0, 329.63, 246.94]
		bass = [164.81, 164.81, 146.83, 146.83, 130.81, 130.81, 123.47, 146.83]
		step_sec = 0.155
	elif theme == "boss":
		lead = [329.63, 440.0, 493.88, 523.25, 493.88, 440.0, 392.0, 329.63, 329.63, 440.0, 523.25, 659.25, 587.33, 523.25, 493.88, 392.0]
		bass = [110.0, 110.0, 130.81, 130.81, 146.83, 146.83, 123.47, 123.47]
		step_sec = 0.145
	var total_samples: int = int(float(SAMPLE_RATE) * step_sec * float(lead.size()))
	var buf := PackedByteArray()
	buf.resize(total_samples * 2)
	var ph_l: float = 0.0
	var ph_b: float = 0.0
	for i: int in range(total_samples):
		var step: int = clampi(int(float(i) / (float(SAMPLE_RATE) * step_sec)), 0, lead.size() - 1)
		var local_t: float = fmod(float(i) / float(SAMPLE_RATE), step_sec) / step_sec
		var fl: float = lead[step]
		var fb: float = bass[int(step / 2) % bass.size()]
		ph_l = fmod(ph_l + fl / float(SAMPLE_RATE), 1.0)
		ph_b = fmod(ph_b + fb / float(SAMPLE_RATE), 1.0)
		var w_l: float = (1.0 - absf(ph_l * 4.0 - 2.0) - 0.5) * 0.30 * maxf(0.2, 1.0 - local_t * 0.7)
		var w_b: float = (0.22 if ph_b < 0.35 else -0.22) * maxf(0.25, 1.0 - local_t * 0.5)
		var s: int = clampi(int((w_l + w_b) * 32767.0), -32768, 32767)
		buf[i * 2] = s & 0xff
		buf[i * 2 + 1] = (s >> 8) & 0xff
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.stereo = false
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	wav.loop_begin = 0
	wav.loop_end = total_samples
	wav.data = buf
	_streams["bgm_" + theme] = wav

func _synth_sweep(f0: float, f1: float, dur: float, wave: String, vol: float) -> AudioStreamWAV:
	var n: int = maxi(1, int(float(SAMPLE_RATE) * dur))
	var buf := PackedByteArray()
	buf.resize(n * 2)
	var ph: float = 0.0
	for i: int in range(n):
		var p: float = float(i) / float(n)
		var freq: float = lerpf(f0, f1, p)
		ph = fmod(ph + freq / float(SAMPLE_RATE), 1.0)
		var sample: float = 0.0
		match wave:
			"square": sample = 1.0 if ph < 0.5 else -1.0
			"sawtooth": sample = 2.0 * ph - 1.0
			"triangle": sample = 1.0 - 4.0 * absf(ph - 0.5)
			_: sample = sin(ph * TAU)
		var env: float = (1.0 - p) * vol
		var v: int = clampi(int(sample * env * 32767.0), -32768, 32767)
		buf[i * 2] = v & 0xff
		buf[i * 2 + 1] = (v >> 8) & 0xff
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.data = buf
	return wav

func _synth_notes(freqs: Array[float], note_dur: float, wave: String, vol: float) -> AudioStreamWAV:
	var note_samples: int = maxi(1, int(float(SAMPLE_RATE) * note_dur))
	var total: int = note_samples * freqs.size()
	var buf := PackedByteArray()
	buf.resize(total * 2)
	var ph: float = 0.0
	for idx: int in range(freqs.size()):
		var f: float = freqs[idx]
		for i: int in range(note_samples):
			var p: float = float(i) / float(note_samples)
			ph = fmod(ph + f / float(SAMPLE_RATE), 1.0)
			var sample: float = (1.0 - 4.0 * absf(ph - 0.5)) if wave == "triangle" else (2.0 * ph - 1.0 if wave == "sawtooth" else sin(ph * TAU))
			var env: float = (1.0 - p * 0.8) * vol
			var pos: int = (idx * note_samples + i) * 2
			var v: int = clampi(int(sample * env * 32767.0), -32768, 32767)
			buf[pos] = v & 0xff
			buf[pos + 1] = (v >> 8) & 0xff
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.data = buf
	return wav
