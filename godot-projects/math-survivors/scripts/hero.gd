class_name MathHero
extends CharacterBody2D

signal hit_by_enemy(player_idx: int, enemy_name: String, dmg: float)
signal dashed(player_idx: int, from_pos: Vector2)

const HIT_FLASH_SHADER: Shader = preload("res://shaders/hit_flash.gdshader")
const THAI_FONT: Font = preload("res://assets/fonts/thai_bold.ttf")
const DASH_DURATION: float = 0.24
const DASH_SPEED: float = 430.0
const REVIVE_RADIUS: float = 42.0

@onready var anim: AnimatedSprite2D = $AnimatedSprite2D
@onready var shadow: Sprite2D = $Shadow
@onready var col_shape: CollisionShape2D = $CollisionShape2D

var player_idx: int = 0
var hero_id: String = "mage"
var invuln_timer: float = 0.0
var controls_locked: bool = false

var _flash_val: float = 0.0
var _mat: ShaderMaterial
var _squash_tw: Tween
var _dash_timer: float = 0.0
var _dash_cd: float = 0.0
var _dash_dir: Vector2 = Vector2.RIGHT
var _last_move_dir: Vector2 = Vector2.RIGHT
var _ghost_acc: float = 0.0
var _regen_acc: float = 0.0

var _cd_bg: ColorRect
var _cd_fill: ColorRect
var _fever_ring: Polygon2D
var _player_ring: Polygon2D
var _guard_ring: Polygon2D
var _revive_ring: Polygon2D
var _revive_bg: ColorRect
var _revive_fill: ColorRect
var _tag_lbl: Label

func _ready() -> void:
	add_to_group("hero")
	collision_layer = 2
	collision_mask = 1

	if shadow:
		shadow.texture = PixelArt.get_tex("shadow")

	_player_ring = _make_circle_poly(14.0, Color(0.22, 0.74, 0.97, 0.38))
	_player_ring.position = Vector2(0, 10)
	_player_ring.scale = Vector2(1.0, 0.52)
	_player_ring.z_index = -2
	_player_ring.visible = false
	add_child(_player_ring)

	_fever_ring = _make_circle_poly(19.0, Color(0.98, 0.80, 0.08, 0.28))
	_fever_ring.visible = false
	_fever_ring.z_index = -1
	add_child(_fever_ring)

	_guard_ring = _make_circle_poly(16.0, Color(0.38, 0.82, 1.0, 0.24))
	_guard_ring.visible = false
	_guard_ring.z_index = -1
	add_child(_guard_ring)

	_revive_ring = _make_circle_poly(REVIVE_RADIUS, Color(0.29, 0.87, 0.50, 0.26))
	_revive_ring.visible = false
	_revive_ring.z_index = -1
	add_child(_revive_ring)

	_revive_bg = ColorRect.new()
	_revive_bg.color = Color(0.06, 0.09, 0.16, 0.88)
	_revive_bg.position = Vector2(-18, -28)
	_revive_bg.size = Vector2(36, 5)
	_revive_bg.visible = false
	add_child(_revive_bg)

	_revive_fill = ColorRect.new()
	_revive_fill.color = Color("#4ade80")
	_revive_fill.position = Vector2(-17, -27)
	_revive_fill.size = Vector2(0, 3)
	_revive_fill.visible = false
	add_child(_revive_fill)

	_cd_bg = ColorRect.new()
	_cd_bg.color = Color(0.06, 0.09, 0.16, 0.8)
	_cd_bg.position = Vector2(-12, 18)
	_cd_bg.size = Vector2(24, 3)
	_cd_bg.visible = false
	add_child(_cd_bg)

	_cd_fill = ColorRect.new()
	_cd_fill.color = Color("#38bdf8")
	_cd_fill.position = Vector2(-12, 18)
	_cd_fill.size = Vector2(24, 3)
	_cd_fill.visible = false
	add_child(_cd_fill)

	_tag_lbl = Label.new()
	_tag_lbl.position = Vector2(-16, -28)
	_tag_lbl.custom_minimum_size = Vector2(32, 14)
	_tag_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_tag_lbl.add_theme_font_override("font", THAI_FONT)
	_tag_lbl.add_theme_font_size_override("font_size", 10)
	_tag_lbl.add_theme_color_override("font_outline_color", Color("#0f172a"))
	_tag_lbl.add_theme_constant_override("outline_size", 3)
	_tag_lbl.visible = false
	add_child(_tag_lbl)

	if anim:
		_mat = ShaderMaterial.new()
		_mat.shader = HIT_FLASH_SHADER
		anim.material = _mat
	configure(player_idx, hero_id)

func _make_circle_poly(rad: float, col: Color) -> Polygon2D:
	var poly := Polygon2D.new()
	var pts := PackedVector2Array()
	for i: int in range(24):
		var a: float = float(i) * (TAU / 24.0)
		pts.append(Vector2(cos(a), sin(a)) * rad)
	poly.polygon = pts
	poly.color = col
	return poly

func configure(p_idx: int, p_hero_id: String) -> void:
	player_idx = p_idx
	hero_id = p_hero_id
	var p_col: Color = Color("#38bdf8") if player_idx == 0 else Color("#fb923c")
	if _player_ring:
		_player_ring.color = Color(p_col.r, p_col.g, p_col.b, 0.48)
		_player_ring.visible = GameState.is_two_player()
	if _cd_fill:
		_cd_fill.color = p_col
	if _tag_lbl:
		_tag_lbl.text = "P1" if player_idx == 0 else "P2"
		_tag_lbl.add_theme_color_override("font_color", p_col)
		_tag_lbl.visible = GameState.is_two_player()
	apply_hero_skin(hero_id)

func apply_hero_skin(p_hero_id: String) -> void:
	hero_id = p_hero_id
	if anim == null:
		return
	var prefix: String = "hero_" + hero_id + "_"
	anim.sprite_frames = PixelArt.make_frames({
		"idle": [prefix + "idle_0", prefix + "idle_1"],
		"run": [prefix + "run_0", prefix + "run_1"],
	}, 7.0)
	anim.play("idle")

func reset_at(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	invuln_timer = 0.0
	controls_locked = false
	_flash_val = 0.0
	_dash_timer = 0.0
	_dash_cd = 0.0
	_regen_acc = 0.0
	_last_move_dir = Vector2.RIGHT if player_idx == 0 else Vector2.LEFT
	if player_idx < GameState.players.size():
		GameState.players[player_idx]["dash_ratio"] = 1.0
	if _mat:
		_mat.set_shader_parameter("flash_amount", 0.0)
	if anim:
		anim.modulate = Color.WHITE
		anim.scale = Vector2.ONE
		anim.play("idle")
	if _cd_bg:
		_cd_bg.visible = false
	if _cd_fill:
		_cd_fill.visible = false
	if _revive_ring:
		_revive_ring.visible = false
	if _revive_bg:
		_revive_bg.visible = false
	if _revive_fill:
		_revive_fill.visible = false

func is_alive_active() -> bool:
	if player_idx >= GameState.players.size():
		return false
	var p: Dictionary = GameState.players[player_idx]
	return not bool(p["downed"]) and float(p["respawn_timer"]) <= 0.0

func _get_dash_cd_max() -> float:
	return 2.0 if hero_id == "ranger" else 3.0

func request_dash() -> bool:
	if controls_locked or not is_alive_active() or _dash_cd > 0.0 or _dash_timer > 0.0:
		return false
	var cd_max: float = _get_dash_cd_max()
	_dash_timer = DASH_DURATION
	_dash_cd = cd_max
	invuln_timer = maxf(invuln_timer, DASH_DURATION + 0.08)
	_dash_dir = _last_move_dir.normalized()
	_ghost_acc = 0.0
	var p: Dictionary = GameState.get_player(player_idx)
	p["dash_ratio"] = 0.0
	if hero_id == "ranger":
		p["rapid_buff_timer"] = 2.0
	_play_squash(Vector2(1.32, 0.72))
	AudioSynth.play_sfx("dash")
	dashed.emit(player_idx, global_position)
	return true

func trigger_hurt(dmg: float, source_name: String) -> void:
	if invuln_timer > 0.0 or controls_locked or _dash_timer > 0.0 or not is_alive_active():
		return
	invuln_timer = 0.65
	_flash_val = 1.0
	_play_squash(Vector2(1.26, 0.76))
	hit_by_enemy.emit(player_idx, source_name, dmg)

func _play_squash(target_scale: Vector2) -> void:
	if anim == null:
		return
	if _squash_tw and _squash_tw.is_valid():
		_squash_tw.kill()
	anim.scale = target_scale
	_squash_tw = anim.create_tween()
	_squash_tw.tween_property(anim, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _spawn_afterimage() -> void:
	if anim == null or get_parent() == null:
		return
	var g := Sprite2D.new()
	g.texture = anim.sprite_frames.get_frame_texture(anim.animation, anim.frame)
	g.global_position = global_position
	g.flip_h = anim.flip_h
	g.modulate = Color(0.22, 0.74, 0.97, 0.65) if player_idx == 0 else Color(0.98, 0.57, 0.24, 0.65)
	g.z_index = z_index - 1
	get_parent().add_child(g)
	var tw: Tween = g.create_tween()
	tw.tween_property(g, "modulate:a", 0.0, 0.22)
	tw.chain().tween_callback(g.queue_free)

func _read_input_vec() -> Vector2:
	var v := Vector2.ZERO
	if player_idx == 0:
		v.x = (1.0 if Input.is_action_pressed("p1_right") else 0.0) - (1.0 if Input.is_action_pressed("p1_left") else 0.0)
		v.y = (1.0 if Input.is_action_pressed("p1_down") else 0.0) - (1.0 if Input.is_action_pressed("p1_up") else 0.0)
		if not GameState.is_two_player() and v.length_squared() < 0.01:
			v.x = (1.0 if Input.is_action_pressed("p2_right") else 0.0) - (1.0 if Input.is_action_pressed("p2_left") else 0.0)
			v.y = (1.0 if Input.is_action_pressed("p2_down") else 0.0) - (1.0 if Input.is_action_pressed("p2_up") else 0.0)
	else:
		v.x = (1.0 if Input.is_action_pressed("p2_right") else 0.0) - (1.0 if Input.is_action_pressed("p2_left") else 0.0)
		v.y = (1.0 if Input.is_action_pressed("p2_down") else 0.0) - (1.0 if Input.is_action_pressed("p2_up") else 0.0)
	if v.length_squared() > 0.01:
		return v.normalized()
	var joy: Vector2 = KampaiBridge.joy_dirs[player_idx] if player_idx < KampaiBridge.joy_dirs.size() else Vector2.ZERO
	if joy.length_squared() > 0.01:
		return joy.limit_length(1.0)
	return Vector2.ZERO

func _physics_process(delta: float) -> void:
	if player_idx >= GameState.players.size():
		return
	var p: Dictionary = GameState.players[player_idx]

	# Knight Fortress Guard recharge
	if hero_id == "knight" and not bool(p["guard_ready"]) and is_alive_active():
		p["guard_cd"] = maxf(0.0, float(p["guard_cd"]) - delta)
		if float(p["guard_cd"]) <= 0.0:
			p["guard_ready"] = true

	# Alchemist passive Math Elixir regen (+2 HP every 5s)
	if hero_id == "alchemist" and is_alive_active() and not controls_locked:
		_regen_acc += delta
		if _regen_acc >= 5.0:
			_regen_acc = 0.0
			if float(p["hp"]) < float(p["max_hp"]):
				p["hp"] = minf(float(p["max_hp"]), float(p["hp"]) + 2.0)

	# Visual indicators
	if _fever_ring:
		_fever_ring.visible = float(p["fever_timer"]) > 0.0 and is_alive_active()
		if _fever_ring.visible:
			_fever_ring.rotation += delta * 2.5
	if _guard_ring:
		_guard_ring.visible = hero_id == "knight" and bool(p["guard_ready"]) and is_alive_active()

	var is_downed: bool = bool(p["downed"])
	var is_respawning: bool = float(p["respawn_timer"]) > 0.0
	if _revive_ring:
		_revive_ring.visible = is_downed and GameState.mode == "coop_team"
	if _revive_bg and _revive_fill:
		_revive_bg.visible = is_downed and GameState.mode == "coop_team"
		_revive_fill.visible = is_downed and GameState.mode == "coop_team"
		_revive_fill.size.x = 34.0 * clampf(float(p["revive_progress"]), 0.0, 1.0)
	if _tag_lbl and GameState.is_two_player():
		if is_downed:
			_tag_lbl.text = "ชุบ!"
		elif is_respawning:
			_tag_lbl.text = "%.1fs" % float(p["respawn_timer"])
		else:
			_tag_lbl.text = "P1" if player_idx == 0 else "P2"

	var cd_max: float = _get_dash_cd_max()
	if _dash_cd > 0.0:
		_dash_cd = maxf(0.0, _dash_cd - delta)
		p["dash_ratio"] = 1.0 - (_dash_cd / cd_max)
		if _cd_bg and _cd_fill:
			_cd_bg.visible = is_alive_active()
			_cd_fill.visible = is_alive_active()
			_cd_fill.size.x = 24.0 * float(p["dash_ratio"])
	else:
		p["dash_ratio"] = 1.0
		if _cd_bg and _cd_fill:
			_cd_bg.visible = false
			_cd_fill.visible = false

	if _flash_val > 0.0:
		_flash_val = maxf(0.0, _flash_val - delta * 5.0)
		if _mat:
			_mat.set_shader_parameter("flash_amount", _flash_val)

	if is_downed or is_respawning:
		velocity = Vector2.ZERO
		if anim:
			anim.modulate = Color(0.65, 0.72, 0.85, 0.42)
			anim.play(&"idle")
		return

	if invuln_timer > 0.0:
		invuln_timer = maxf(0.0, invuln_timer - delta)
		if anim:
			anim.modulate = Color(1.0, 1.0, 1.0, 0.48 if int(invuln_timer * 18.0) % 2 == 0 else 1.0)
	elif anim:
		anim.modulate = Color("#67e8f9") if float(p["slow_debuff_timer"]) > 0.0 else Color.WHITE

	if controls_locked:
		velocity = Vector2.ZERO
		return

	var input_vec: Vector2 = _read_input_vec()
	if input_vec.length_squared() > 0.02:
		_last_move_dir = input_vec

	var dash_pressed: bool = Input.is_action_just_pressed("p1_dash") if player_idx == 0 else Input.is_action_just_pressed("p2_dash")
	if dash_pressed:
		request_dash()

	if _dash_timer > 0.0:
		_dash_timer = maxf(0.0, _dash_timer - delta)
		velocity = _dash_dir * DASH_SPEED
		_ghost_acc += delta
		if _ghost_acc >= 0.055:
			_ghost_acc = 0.0
			_spawn_afterimage()
	else:
		velocity = input_vec * GameState.get_move_speed(player_idx)

	move_and_slide()
	global_position.x = clampf(global_position.x, 42.0, GameState.ARENA_PX - 42.0)
	global_position.y = clampf(global_position.y, 42.0, GameState.ARENA_PX - 42.0)

	if anim:
		if absf(velocity.x) > 8.0:
			anim.flip_h = velocity.x < 0.0
		if velocity.length_squared() > 16.0:
			if anim.animation != &"run":
				anim.play(&"run")
		else:
			if anim.animation != &"idle":
				anim.play(&"idle")
