extends Node

const MIX_RATE: int = 22050

var _bgm_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _bgm_streams: Dictionary = {}
var _sfx_streams: Dictionary = {}
var _sfx_idx: int = 0
var _current_theme: String = "overworld"
var _bgm_playing: bool = false

func _ready() -> void:
	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.bus = &"Music"
	_bgm_player.volume_db = -8.0
	add_child(_bgm_player)

	for i: int in range(6):
		var p := AudioStreamPlayer.new()
		p.bus = &"SFX"
		p.volume_db = -4.0
		p.max_polyphony = 4
		add_child(p)
		_sfx_players.append(p)

	_build_all_streams()

func _build_all_streams() -> void:
	_sfx_streams["jump"] = _synth_sweep(210.0, 560.0, 0.14, 0.35, "square")
	_sfx_streams["coin"] = _synth_notes([[987.77, 0.075], [1318.51, 0.22]], 0.38, "square")
	_sfx_streams["bump"] = _synth_sweep(155.0, 88.0, 0.08, 0.38, "triangle")
	_sfx_streams["stomp"] = _synth_sweep(390.0, 105.0, 0.10, 0.38, "square")
	_sfx_streams["powerup"] = _synth_notes([
		[523.25, 0.06], [659.25, 0.06], [783.99, 0.06],
		[1046.5, 0.06], [1318.51, 0.08], [1567.98, 0.16]
	], 0.34, "square")
	_sfx_streams["lose_heart"] = _synth_notes([
		[493.88, 0.10], [349.23, 0.10], [349.23, 0.09],
		[329.63, 0.10], [293.66, 0.11], [261.63, 0.24]
	], 0.38, "square")
	_sfx_streams["flagpole"] = _synth_sweep(784.0, 392.0, 0.38, 0.34, "square")
	_sfx_streams["stage_clear"] = _synth_notes([
		[523.25, 0.10], [659.25, 0.10], [783.99, 0.10],
		[1046.5, 0.14], [783.99, 0.10], [1046.5, 0.36]
	], 0.38, "square")

	_bgm_streams["overworld"] = _synth_bgm_loop(0.145, [
		76, 76, 0, 76, 0, 72, 76, 0, 79, 0, 0, 0, 67, 0, 0, 0,
		72, 0, 0, 67, 0, 0, 64, 0, 69, 0, 71, 0, 70, 69, 0, 0,
		67, 76, 79, 81, 0, 77, 79, 0, 76, 0, 72, 74, 71, 0, 0, 0
	], [
		50, 50, 0, 50, 0, 50, 50, 0, 55, 0, 0, 0, 43, 0, 0, 0,
		48, 0, 0, 43, 0, 0, 40, 0, 45, 0, 47, 0, 46, 45, 0, 0,
		43, 52, 55, 57, 0, 53, 55, 0, 52, 0, 48, 50, 47, 0, 43, 0
	])
	_bgm_streams["underground"] = _synth_bgm_loop(0.155, [
		60, 72, 57, 69, 58, 70, 0, 0, 60, 72, 57, 69, 58, 70, 0, 0,
		53, 65, 50, 62, 51, 63, 0, 0, 53, 65, 50, 62, 51, 63, 0, 0
	], [
		48, 0, 45, 0, 46, 0, 0, 0, 48, 0, 45, 0, 46, 0, 0, 0,
		41, 0, 38, 0, 39, 0, 0, 0, 41, 0, 38, 0, 39, 0, 43, 0
	])
	_bgm_streams["castle"] = _synth_bgm_loop(0.135, [
		64, 67, 71, 76, 71, 67, 64, 0, 62, 65, 69, 74, 69, 65, 62, 0,
		60, 64, 67, 72, 71, 69, 67, 65, 64, 67, 71, 74, 76, 0, 79, 0
	], [
		40, 40, 52, 40, 40, 52, 40, 47, 38, 38, 50, 38, 38, 50, 38, 45,
		36, 36, 48, 36, 43, 43, 55, 43, 40, 43, 47, 50, 52, 0, 47, 0
	])

func _midi_to_hz(note: int) -> float:
	if note <= 0:
		return 0.0
	return 440.0 * pow(2.0, float(note - 69) / 12.0)

func _sample_wave(phase: float, wave: String) -> float:
	var p: float = phase - floorf(phase)
	if wave == "triangle":
		return 1.0 - 4.0 * absf(p - 0.5)
	if wave == "pulse25":
		return 1.0 if p < 0.25 else -1.0
	return 1.0 if p < 0.5 else -1.0

func _make_wav(samples: PackedFloat32Array, loop: bool) -> AudioStreamWAV:
	var n: int = samples.size()
	var bytes := PackedByteArray()
	bytes.resize(n * 2)
	for i: int in range(n):
		var v: int = clampi(int(samples[i] * 32767.0), -32768, 32767)
		bytes.encode_s16(i * 2, v)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = MIX_RATE
	wav.stereo = false
	wav.data = bytes
	if loop:
		wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
		wav.loop_begin = 0
		wav.loop_end = n
	return wav

func _synth_sweep(f0: float, f1: float, dur: float, vol: float, wave: String) -> AudioStreamWAV:
	var n: int = maxi(1, int(dur * float(MIX_RATE)))
	var buf := PackedFloat32Array()
	buf.resize(n)
	var phase: float = 0.0
	for i: int in range(n):
		var t: float = float(i) / float(n)
		var freq: float = lerpf(f0, f1, t)
		phase += freq / float(MIX_RATE)
		var env: float = (1.0 - t) * minf(1.0, t * 20.0)
		buf[i] = _sample_wave(phase, wave) * vol * env
	return _make_wav(buf, false)

func _synth_notes(notes: Array, vol: float, wave: String) -> AudioStreamWAV:
	var total_dur: float = 0.0
	for item: Variant in notes:
		total_dur += float(item[1])
	var total_n: int = maxi(1, int(total_dur * float(MIX_RATE)))
	var buf := PackedFloat32Array()
	buf.resize(total_n)
	var cursor: int = 0
	var phase: float = 0.0
	for item: Variant in notes:
		var freq: float = float(item[0])
		var dur: float = float(item[1])
		var seg_n: int = int(dur * float(MIX_RATE))
		for j: int in range(seg_n):
			if cursor >= total_n:
				break
			var t: float = float(j) / float(maxi(1, seg_n))
			phase += freq / float(MIX_RATE)
			var env: float = (1.0 - t * 0.75) * minf(1.0, t * 25.0)
			buf[cursor] = _sample_wave(phase, wave) * vol * env
			cursor += 1
	return _make_wav(buf, false)

func _synth_bgm_loop(step_sec: float, lead: Array[int], bass: Array[int]) -> AudioStreamWAV:
	var steps: int = lead.size()
	var step_samples: int = int(step_sec * float(MIX_RATE))
	var total_n: int = steps * step_samples
	var buf := PackedFloat32Array()
	buf.resize(total_n)
	var p_lead: float = 0.0
	var p_bass: float = 0.0
	var noise_state: int = 2463534242

	for s: int in range(steps):
		var f_lead: float = _midi_to_hz(lead[s])
		var f_bass: float = _midi_to_hz(bass[s])
		var is_hat: bool = (s % 4) == 0
		var is_snare: bool = (s % 8) == 4
		for j: int in range(step_samples):
			var idx: int = s * step_samples + j
			var t: float = float(j) / float(step_samples)
			var val: float = 0.0
			if f_lead > 0.0:
				p_lead += f_lead / float(MIX_RATE)
				var env_l: float = maxf(0.0, 1.0 - t * 1.15) * minf(1.0, t * 30.0)
				val += _sample_wave(p_lead, "pulse25") * 0.16 * env_l
			if f_bass > 0.0:
				p_bass += f_bass / float(MIX_RATE)
				var env_b: float = maxf(0.0, 1.0 - t * 0.9) * minf(1.0, t * 25.0)
				val += _sample_wave(p_bass, "triangle") * 0.24 * env_b
			if is_hat or is_snare:
				noise_state ^= (noise_state << 13) & 0x7FFFFFFF
				noise_state ^= (noise_state >> 17)
				noise_state ^= (noise_state << 5) & 0x7FFFFFFF
				var rnd: float = float(noise_state & 0xFFFF) / 32768.0 - 1.0
				var drum_dur: float = 0.45 if is_snare else 0.20
				if t < drum_dur:
					var d_env: float = 1.0 - (t / drum_dur)
					val += rnd * (0.09 if is_snare else 0.045) * d_env
			buf[idx] = clampf(val, -0.95, 0.95)
	return _make_wav(buf, true)

func play_sfx(sfx_name: String) -> void:
	if not _sfx_streams.has(sfx_name):
		return
	var player: AudioStreamPlayer = _sfx_players[_sfx_idx]
	_sfx_idx = (_sfx_idx + 1) % _sfx_players.size()
	player.stream = _sfx_streams[sfx_name]
	player.play()

func start_bgm(theme_name: String) -> void:
	_current_theme = theme_name if _bgm_streams.has(theme_name) else "overworld"
	_bgm_playing = true
	var stream: AudioStreamWAV = _bgm_streams[_current_theme]
	if _bgm_player.stream != stream or not _bgm_player.playing:
		_bgm_player.stream = stream
		_bgm_player.play()

func stop_bgm() -> void:
	_bgm_playing = false
	_bgm_player.stop()

func set_bus_enabled(bus_name: StringName, enabled: bool) -> void:
	var idx: int = AudioServer.get_bus_index(bus_name)
	if idx == -1:
		return
	AudioServer.set_bus_mute(idx, not enabled)
	if bus_name == &"Music" and enabled and _bgm_playing and not _bgm_player.playing:
		_bgm_player.play()
