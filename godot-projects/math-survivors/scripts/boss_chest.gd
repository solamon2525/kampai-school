class_name BossChest
extends Area2D

signal opened(chest: BossChest)

var _opened: bool = false

func _ready() -> void:
	collision_layer = 16
	collision_mask = 2

	var anim := AnimatedSprite2D.new()
	anim.sprite_frames = PixelArt.make_frames({"glow": ["chest_0", "chest_1"]}, 5.0)
	anim.play("glow")
	add_child(anim)

	var col := CollisionShape2D.new()
	var circ := CircleShape2D.new()
	circ.radius = 18.0
	col.shape = circ
	add_child(col)

	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if _opened or not body.is_in_group("hero"):
		return
	_opened = true
	set_deferred("monitoring", false)
	opened.emit(self)
	queue_free()
