class_name MathHero
extends CharacterBody2D

signal hit_by_enemy(enemy_name: String, dmg: float)

const HIT_FLASH_SHADER: Shader = preload("res://shaders/hit_flash.gdshader")

@onready var anim: AnimatedSprite2D = $AnimatedSprite2D
@onready var shadow: Sprite2D = $Shadow
@onready var col_shape: CollisionShape2D = $CollisionShape2D

var invuln_timer: float = 0.0
var controls_locked: bool = false
var _flash_val: float = 0.0
var _mat: ShaderMaterial
var _squash_tw: Tween

func _ready() -> void:
	add_to_group("hero")
	collision_layer = 2
	collision_mask = 1

	if shadow:
		shadow.texture = PixelArt.get_tex("shadow")

	if anim:
		anim.sprite_frames = PixelArt.make_frames({
			"idle": ["hero_idle_0", "hero_idle_1"],
			"run": ["hero_run_0", "hero_run_1"],
		}, 7.0)
		anim.play("idle")
		_mat = ShaderMaterial.new()
		_mat.shader = HIT_FLASH_SHADER
		anim.material = _mat

func reset_at(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	invuln_timer = 0.0
	controls_locked = false
	_flash_val = 0.0
	if _mat:
		_mat.set_shader_parameter("flash_amount", 0.0)
	if anim:
		anim.modulate.a = 1.0
		anim.scale = Vector2.ONE
		anim.play("idle")

func trigger_hurt(dmg: float, source_name: String) -> void:
	if invuln_timer > 0.0 or controls_locked:
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

func _physics_process(delta: float) -> void:
	if invuln_timer > 0.0:
		invuln_timer = maxf(0.0, invuln_timer - delta)
		if anim:
			anim.modulate.a = 0.42 if int(invuln_timer * 18.0) % 2 == 0 else 1.0
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

	velocity = input_vec * GameState.get_move_speed()
	move_and_slide()

	global_position.x = clampf(global_position.x, 42.0, GameState.ARENA_PX - 42.0)
	global_position.y = clampf(global_position.y, 42.0, GameState.ARENA_PX - 42.0)

	if anim:
		if absf(input_vec.x) > 0.05:
			anim.flip_h = input_vec.x < 0.0
		if input_vec.length_squared() > 0.02:
			if anim.animation != &"run":
				anim.play(&"run")
		else:
			if anim.animation != &"idle":
				anim.play(&"idle")
