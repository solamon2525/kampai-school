class_name MathHero
extends CharacterBody2D

signal hit_by_enemy(enemy_name: String, dmg: float)
signal dashed(from_pos: Vector2)

const HIT_FLASH_SHADER: Shader = preload("res://shaders/hit_flash.gdshader")
const DASH_DURATION: float = 0.24
const DASH_COOLDOWN: float = 3.0
const DASH_SPEED: float = 420.0

@onready var anim: AnimatedSprite2D = $AnimatedSprite2D
@onready var shadow: Sprite2D = $Shadow
@onready var col_shape: CollisionShape2D = $CollisionShape2D

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
var _cd_bg: ColorRect
var _cd_fill: ColorRect
var _fever_ring: Polygon2D

func _ready() -> void:
	add_to_group("hero")
	collision_layer = 2
	collision_mask = 1

	if shadow:
		shadow.texture = PixelArt.get_tex("shadow")

	_fever_ring = Polygon2D.new()
	var pts := PackedVector2Array()
	for i: int in range(20):
		var a: float = float(i) * (TAU / 20.0)
		pts.append(Vector2(cos(a), sin(a)) * 18.0)
	_fever_ring.polygon = pts
	_fever_ring.color = Color(0.98, 0.80, 0.08, 0.28)
	_fever_ring.visible = false
	_fever_ring.z_index = -1
	add_child(_fever_ring)

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

	if anim:
		_mat = ShaderMaterial.new()
		_mat.shader = HIT_FLASH_SHADER
		anim.material = _mat
	apply_hero_skin("mage")

func apply_hero_skin(hero_id: String) -> void:
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
	_last_move_dir = Vector2.RIGHT
	GameState.dash_ratio = 1.0
	if _mat:
		_mat.set_shader_parameter("flash_amount", 0.0)
	if anim:
		anim.modulate.a = 1.0
		anim.scale = Vector2.ONE
		anim.play("idle")
	if _cd_bg:
		_cd_bg.visible = false
	if _cd_fill:
		_cd_fill.visible = false

func request_dash() -> bool:
	if controls_locked or _dash_cd > 0.0 or _dash_timer > 0.0:
		return false
	_dash_timer = DASH_DURATION
	_dash_cd = DASH_COOLDOWN
	invuln_timer = maxf(invuln_timer, DASH_DURATION + 0.06)
	_dash_dir = _last_move_dir.normalized()
	_ghost_acc = 0.0
	GameState.dash_ratio = 0.0
	_play_squash(Vector2(1.32, 0.72))
	AudioSynth.play_sfx("dash")
	dashed.emit(global_position)
	return true

func trigger_hurt(dmg: float, source_name: String) -> void:
	if invuln_timer > 0.0 or controls_locked or _dash_timer > 0.0:
		return
	invuln_timer = 0.65
	_flash_val = 1.0
	_play_squash(Vector2(1.26, 0.76))
	hit_by_enemy.emit(source_name, dmg)

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
	g.modulate = Color(0.22, 0.74, 0.97, 0.65)
	g.z_index = z_index - 1
	get_parent().add_child(g)
	var tw: Tween = g.create_tween()
	tw.tween_property(g, "modulate:a", 0.0, 0.22)
	tw.chain().tween_callback(g.queue_free)

func _physics_process(delta: float) -> void:
	if _fever_ring:
		_fever_ring.visible = GameState.fever_timer > 0.0
		if _fever_ring.visible:
			_fever_ring.rotation += delta * 2.5

	if _dash_cd > 0.0:
		_dash_cd = maxf(0.0, _dash_cd - delta)
		GameState.dash_ratio = 1.0 - (_dash_cd / DASH_COOLDOWN)
		if _cd_bg and _cd_fill:
			_cd_bg.visible = true
			_cd_fill.visible = true
			_cd_fill.size.x = 24.0 * GameState.dash_ratio
	else:
		GameState.dash_ratio = 1.0
		if _cd_bg and _cd_fill:
			_cd_bg.visible = false
			_cd_fill.visible = false

	if invuln_timer > 0.0:
		invuln_timer = maxf(0.0, invuln_timer - delta)
		if anim:
			anim.modulate.a = 0.48 if int(invuln_timer * 18.0) % 2 == 0 else 1.0
	elif anim:
		anim.modulate.a = 1.0

	if _flash_val > 0.0:
		_flash_val = maxf(0.0, _flash_val - delta * 5.0)
		if _mat:
			_mat.set_shader_parameter("flash_amount", _flash_val)

	if controls_locked:
		velocity = Vector2.ZERO
		return

	var input_vec := Vector2(
		(1.0 if Input.is_action_pressed("move_right") else 0.0) - (1.0 if Input.is_action_pressed("move_left") else 0.0),
		(1.0 if Input.is_action_pressed("move_down") else 0.0) - (1.0 if Input.is_action_pressed("move_up") else 0.0)
	)
	if input_vec.length_squared() > 0.01:
		input_vec = input_vec.normalized()
	elif KampaiBridge.joy_dir.length_squared() > 0.01:
		input_vec = KampaiBridge.joy_dir.limit_length(1.0)

	if input_vec.length_squared() > 0.02:
		_last_move_dir = input_vec

	if Input.is_action_just_pressed("dash"):
		request_dash()

	if _dash_timer > 0.0:
		_dash_timer = maxf(0.0, _dash_timer - delta)
		velocity = _dash_dir * DASH_SPEED
		_ghost_acc += delta
		if _ghost_acc >= 0.055:
			_ghost_acc = 0.0
			_spawn_afterimage()
	else:
		velocity = input_vec * GameState.get_move_speed()

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
