class_name HeartPickup
extends CharacterBody2D

signal collected(pickup: HeartPickup)

const MOVE_SPEED: float = 65.0
const GRAVITY: float = 950.0

var dir: float = 1.0
var _collected: bool = false

func _ready() -> void:
	collision_layer = 0
	collision_mask = 1

	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(18, 16)
	col.shape = rect
	add_child(col)

	var sp := Sprite2D.new()
	sp.texture = PixelArt.get_tex("heart_item")
	add_child(sp)

	var area := Area2D.new()
	area.collision_layer = 0
	area.collision_mask = 2
	var ac := CollisionShape2D.new()
	var ar := RectangleShape2D.new()
	ar.size = Vector2(22, 20)
	ac.shape = ar
	area.add_child(ac)
	area.body_entered.connect(_on_body_entered)
	add_child(area)

	velocity = Vector2(MOVE_SPEED, -180.0)

func _physics_process(delta: float) -> void:
	if _collected:
		return
	velocity.y += GRAVITY * delta
	velocity.x = dir * MOVE_SPEED
	move_and_slide()
	if is_on_wall():
		dir *= -1.0
	if global_position.y > 400.0:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if _collected or not body.is_in_group("player"):
		return
	_collected = true
	collected.emit(self)
	queue_free()
