class_name MarioPlayer
extends CharacterBody2D

signal hit_block_from_below(collider: Object)
signal touched_enemy(enemy: Node2D, is_stomp: bool)
signal fell_in_pit

const TILE_SIZE: float = 24.0
const RUN_SPEED: float = 175.0
const SPRINT_SPEED: float = 230.0
const GROUND_ACCEL: float = 1400.0
const GROUND_DECEL: float = 1250.0
const AIR_ACCEL: float = 950.0
const AIR_DECEL: float = 360.0

const JUMP_VELOCITY: float = -490.0
const RISE_GRAVITY: float = 1400.0
const FALL_GRAVITY: float = 2450.0
const MAX_FALL_SPEED: float = 560.0
const APEX_THRESHOLD: float = 95.0
const APEX_GRAVITY_MULT: float = 0.55
const JUMP_CUT: float = 0.48

const COYOTE_TICKS: int = 6
const BUFFER_TICKS: int = 7
const INVULN_SEC: float = 1.7

@onready var sprite: Sprite2D = $Sprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

var controls_locked: bool = false
var is_dead_anim: bool = false
var invuln_timer: float = 0.0
var _tick: int = 0
var _last_ground_tick: int = -999999
var _last_press_tick: int = -999999
var _anim_time: float = 0.0
var _was_on_floor: bool = false

func _ready() -> void:
	add_to_group("player")
	if sprite:
		sprite.texture = PixelArt.get_tex("hero_idle")

func reset_at(pos: Vector2) -> void:
	global_position = pos
	velocity = Vector2.ZERO
	controls_locked = false
	is_dead_anim = false
	invuln_timer = 0.0
	_last_ground_tick = -999999
	_last_press_tick = -999999
	if collision_shape:
		collision_shape.set_deferred("disabled", false)
	if sprite:
		sprite.modulate.a = 1.0
		sprite.scale = Vector2.ONE
		sprite.texture = PixelArt.get_tex("hero_idle")

func trigger_hurt(is_fatal: bool) -> void:
	if is_fatal:
		is_dead_anim = true
		controls_locked = true
		velocity = Vector2(0.0, -340.0)
		if collision_shape:
			collision_shape.set_deferred("disabled", true)
		if sprite:
			sprite.texture = PixelArt.get_tex("hero_hurt")
	else:
		invuln_timer = INVULN_SEC
		velocity.y = -240.0
		if sprite:
			sprite.texture = PixelArt.get_tex("hero_hurt")

func bounce_stomp() -> void:
	velocity.y = -290.0
	_play_squash(Vector2(0.84, 1.18))

func is_invulnerable() -> bool:
	return invuln_timer > 0.0 or is_dead_anim or controls_locked

func _physics_process(delta: float) -> void:
	if is_dead_anim:
		velocity.y += RISE_GRAVITY * delta
		global_position += velocity * delta
		return

	if controls_locked:
		return

	_tick += 1
	if invuln_timer > 0.0:
		invuln_timer = maxf(0.0, invuln_timer - delta)
		if sprite:
			sprite.modulate.a = 0.35 if int(invuln_timer * 15.0) % 2 == 0 else 1.0
	elif sprite:
		sprite.modulate.a = 1.0

	var on_floor_now: bool = is_on_floor()
	if on_floor_now and not _was_on_floor:
		_play_squash(Vector2(1.20, 0.82))
	_was_on_floor = on_floor_now

	# Input (Keyboard + Touch bridge)
	var left_held: bool = Input.is_action_pressed("move_left") or KampaiBridge.touch_left
	var right_held: bool = Input.is_action_pressed("move_right") or KampaiBridge.touch_right
	var dir: float = (1.0 if right_held else 0.0) - (1.0 if left_held else 0.0)
	var sprinting: bool = Input.is_action_pressed("sprint")
	var max_spd: float = SPRINT_SPEED if sprinting else RUN_SPEED

	var accel: float = GROUND_ACCEL if on_floor_now else AIR_ACCEL
	var decel: float = GROUND_DECEL if on_floor_now else AIR_DECEL
	if dir != 0.0:
		velocity.x = move_toward(velocity.x, dir * max_spd, accel * delta)
		if sprite:
			sprite.flip_h = dir < 0.0
	else:
		velocity.x = move_toward(velocity.x, 0.0, decel * delta)

	# Coyote time & Jump buffer (in whole ticks)
	if on_floor_now and velocity.y >= 0.0:
		_last_ground_tick = _tick
	var jump_just: bool = Input.is_action_just_pressed("jump") or KampaiBridge.consume_touch_jump_just_pressed()
	var jump_held: bool = Input.is_action_pressed("jump") or KampaiBridge.touch_jump_held
	if jump_just:
		_last_press_tick = _tick

	if _tick - _last_press_tick <= BUFFER_TICKS and _tick - _last_ground_tick <= COYOTE_TICKS:
		velocity.y = JUMP_VELOCITY
		_last_press_tick = -999999
		_last_ground_tick = -999999
		if not jump_held:
			velocity.y *= JUMP_CUT
		AudioSynth.play_sfx("jump")
		_play_squash(Vector2(0.80, 1.24))

	if not jump_held and velocity.y < -80.0:
		velocity.y *= pow(JUMP_CUT, delta * 18.0)

	var grav: float = FALL_GRAVITY if velocity.y > 0.0 else RISE_GRAVITY
	if jump_held and absf(velocity.y) < APEX_THRESHOLD:
		grav *= APEX_GRAVITY_MULT
	velocity.y = minf(velocity.y + grav * delta, MAX_FALL_SPEED)

	move_and_slide()

	if global_position.x < 12.0:
		global_position.x = 12.0
		if velocity.x < 0.0:
			velocity.x = 0.0

	# ตรวจการชนบล็อกจากด้านล่าง / ชนศัตรู
	for i: int in range(get_slide_collision_count()):
		var col: KinematicCollision2D = get_slide_collision(i)
		var collider: Object = col.get_collider()
		if collider == null:
			continue
		if collider is Node and (collider as Node).is_in_group("enemies"):
			var is_stomp: bool = velocity.y >= 0.0 and col.get_normal().y < -0.5
			touched_enemy.emit(collider as Node2D, is_stomp)
		elif col.get_normal().y > 0.65:
			hit_block_from_below.emit(collider)

	if global_position.y > 390.0:
		fell_in_pit.emit()

	_update_sprite(delta, on_floor_now)

func _update_sprite(delta: float, on_floor_now: bool) -> void:
	if sprite == null:
		return
	if invuln_timer > 0.0 and velocity.y < 0.0:
		sprite.texture = PixelArt.get_tex("hero_hurt")
		return
	if not on_floor_now:
		sprite.texture = PixelArt.get_tex("hero_jump")
	elif absf(velocity.x) > 18.0:
		_anim_time += delta * (10.0 if absf(velocity.x) > 180.0 else 7.5)
		sprite.texture = PixelArt.get_tex("hero_run1" if int(_anim_time) % 2 == 0 else "hero_run2")
	else:
		sprite.texture = PixelArt.get_tex("hero_idle")

func _play_squash(target_scale: Vector2) -> void:
	if sprite == null:
		return
	sprite.scale = target_scale
	var tw: Tween = sprite.create_tween()
	tw.tween_property(sprite, "scale", Vector2.ONE, 0.14).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
