class_name QuestionBlock
extends StaticBody2D

signal triggered(block: QuestionBlock, block_type: String, spawn_pos: Vector2)

var block_type: String = "q_coin"
var theme_name: String = "overworld"
var used: bool = false

var _sprite: Sprite2D
var _anim_t: float = 0.0
var _last_hit_ms: int = 0

func setup(p_type: String, p_theme: String) -> void:
	block_type = p_type
	theme_name = p_theme

func _ready() -> void:
	collision_layer = 1
	collision_mask = 0
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(24, 24)
	col.shape = rect
	add_child(col)

	_sprite = Sprite2D.new()
	_sprite.texture = PixelArt.get_tex("brick_" + theme_name if block_type == "brick" else "qblock_0")
	add_child(_sprite)

func _process(delta: float) -> void:
	if block_type == "brick" or used or _sprite == null:
		return
	_anim_t += delta * 5.0
	var frame: int = int(_anim_t) % 3
	_sprite.texture = PixelArt.get_tex("qblock_%d" % frame)

func bonk() -> void:
	var now: int = Time.get_ticks_msec()
	if now - _last_hit_ms < 180:
		return
	_last_hit_ms = now
	AudioSynth.play_sfx("bump")

	if _sprite:
		var tw: Tween = create_tween()
		tw.tween_property(_sprite, "position:y", -7.0, 0.065).set_ease(Tween.EASE_OUT)
		tw.tween_property(_sprite, "position:y", 0.0, 0.075).set_ease(Tween.EASE_IN)

	if block_type != "brick" and not used:
		used = true
		if _sprite:
			_sprite.texture = PixelArt.get_tex("qblock_used")
		triggered.emit(self, block_type, global_position + Vector2(0.0, -24.0))
