class_name PatrolEnemy
extends CharacterBody2D

signal stomped_or_touched(enemy: PatrolEnemy, is_stomp: bool)

const SPEED: float = 52.0
const GRAVITY: float = 1100.0

var dir: float = -1.0
var alive: bool = true
var min_x: float = 24.0
var max_x: float = 2000.0
var pit_ranges: Array = []

var _sprite: Sprite2D
var _hitbox: Area2D
var _anim_t: float = 0.0

func _ready() -> void:
	add_to_group("enemies")
	collision_layer = 4
	collision_mask = 1

	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(20, 20)
	col.shape = rect
	add_child(col)

	_sprite = Sprite2D.new()
	_sprite.texture = PixelArt.get_tex("enemy_0")
	add_child(_sprite)

	_hitbox = Area2D.new()
	_hitbox.collision_layer = 0
	_hitbox.collision_mask = 2
	var area_col := CollisionShape2D.new()
	var area_rect := RectangleShape2D.new()
	area_rect.size = Vector2(24, 22)
	area_col.shape = area_rect
	_hitbox.add_child(area_col)
	_hitbox.body_entered.connect(_on_body_entered)
	add_child(_hitbox)

func _physics_process(delta: float) -> void:
	if not alive:
		return
	velocity.y += GRAVITY * delta
	velocity.x = dir * SPEED
	move_and_slide()

	if is_on_wall():
		dir *= -1.0
	else:
		var ahead_tx: int = int((global_position.x + dir * 14.0) / 24.0)
		if ahead_tx <= 1 or _is_pit(ahead_tx) or global_position.x < min_x or global_position.x > max_x:
			dir *= -1.0

	_anim_t += delta * 5.0
	if _sprite:
		_sprite.texture = PixelArt.get_tex("enemy_0" if int(_anim_t) % 2 == 0 else "enemy_1")

func _is_pit(tx: int) -> bool:
	for r: Variant in pit_ranges:
		if tx >= int(r[0]) and tx <= int(r[1]):
			return true
	return false

func _on_body_entered(body: Node2D) -> void:
	if not alive or not body.is_in_group("player"):
		return
	var p: MarioPlayer = body as MarioPlayer
	if p == null:
		return
	var is_stomp: bool = p.velocity.y > 15.0 and p.global_position.y < global_position.y - 6.0
	stomped_or_touched.emit(self, is_stomp)

func squish() -> void:
	if not alive:
		return
	alive = false
	velocity = Vector2.ZERO
	set_physics_process(false)
	if _sprite:
		_sprite.texture = PixelArt.get_tex("enemy_squish")
		_sprite.position.y += 6.0
	var tw: Tween = create_tween()
	tw.tween_interval(0.35)
	tw.tween_property(self, "modulate:a", 0.0, 0.2)
	tw.tween_callback(queue_free)
