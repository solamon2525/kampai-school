class_name XpGem
extends Area2D

signal collected(amount: int)

var xp_amount: int = 10
var is_big: bool = false
var target_hero: Node2D
var _collected: bool = false

func setup(p_xp: int, p_big: bool, p_hero: Node2D) -> void:
	xp_amount = p_xp
	is_big = p_big
	target_hero = p_hero

func _ready() -> void:
	collision_layer = 16
	collision_mask = 2

	var sp := Sprite2D.new()
	sp.texture = PixelArt.get_tex("xp_gem_big" if is_big else "xp_gem_small")
	add_child(sp)

	var col := CollisionShape2D.new()
	var circ := CircleShape2D.new()
	circ.radius = 12.0
	col.shape = circ
	add_child(col)

	body_entered.connect(_on_body_entered)

func _physics_process(delta: float) -> void:
	if _collected or target_hero == null or not is_instance_valid(target_hero):
		return
	var d: float = global_position.distance_to(target_hero.global_position)
	if d < GameState.get_pickup_radius():
		var dir: Vector2 = (target_hero.global_position - global_position).normalized()
		global_position += dir * 290.0 * delta

func _on_body_entered(body: Node2D) -> void:
	if _collected or not body.is_in_group("hero"):
		return
	_collected = true
	set_deferred("monitoring", false)
	collected.emit(xp_amount)
	queue_free()
