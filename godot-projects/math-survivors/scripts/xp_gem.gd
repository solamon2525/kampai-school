class_name XpGem
extends Area2D

signal collected(amount: int, collector_idx: int)

var xp_amount: int = 10
var is_big: bool = false
var target_heroes: Array[MathHero] = []
var _collected: bool = false

func setup(p_xp: int, p_big: bool, p_heroes: Array[MathHero]) -> void:
	xp_amount = p_xp
	is_big = p_big
	target_heroes = p_heroes

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
	if _collected:
		return
	var pull_hero: MathHero = null
	var best_d: float = 1e9
	for h: MathHero in target_heroes:
		if not is_instance_valid(h) or not h.is_alive_active():
			continue
		var d: float = global_position.distance_to(h.global_position)
		if d < GameState.get_pickup_radius(h.player_idx) and d < best_d:
			best_d = d
			pull_hero = h
	if pull_hero != null:
		var dir: Vector2 = (pull_hero.global_position - global_position).normalized()
		global_position += dir * 295.0 * delta

func _on_body_entered(body: Node2D) -> void:
	if _collected or not (body is MathHero):
		return
	var h: MathHero = body as MathHero
	if not h.is_alive_active():
		return
	_collected = true
	set_deferred("monitoring", false)
	collected.emit(xp_amount, h.player_idx)
	queue_free()
