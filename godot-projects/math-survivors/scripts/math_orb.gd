class_name MathOrb
extends Area2D

signal picked(orb: MathOrb, picker_idx: int)

const AURA_SHADER: Shader = preload("res://shaders/arcane_aura.gdshader")
const THAI_FONT: Font = preload("res://assets/fonts/thai_bold.ttf")

var value: int = 0
var is_correct: bool = false
var consumed: bool = false

var _base_y: float = 0.0
var _t: float = 0.0

func setup(p_value: int, p_correct: bool, phase_offset: float) -> void:
	value = p_value
	is_correct = p_correct
	_t = phase_offset

func _ready() -> void:
	collision_layer = 8
	collision_mask = 2
	_base_y = position.y

	var col := CollisionShape2D.new()
	var circ := CircleShape2D.new()
	circ.radius = 22.0
	col.shape = circ
	add_child(col)

	var ring := Sprite2D.new()
	ring.texture = PixelArt.get_tex("orb_frame")
	var mat := ShaderMaterial.new()
	mat.shader = AURA_SHADER
	ring.material = mat
	add_child(ring)

	var lbl := Label.new()
	lbl.text = str(value)
	lbl.position = Vector2(-28, -13)
	lbl.custom_minimum_size = Vector2(56, 26)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.add_theme_font_override("font", THAI_FONT)
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.add_theme_color_override("font_color", Color("#fef08a"))
	lbl.add_theme_color_override("font_outline_color", Color("#0f172a"))
	lbl.add_theme_constant_override("outline_size", 4)
	add_child(lbl)

	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if consumed:
		return
	_t += delta * 3.4
	position.y = _base_y + sin(_t) * 3.0

func _on_body_entered(body: Node2D) -> void:
	if consumed or not (body is MathHero):
		return
	var h: MathHero = body as MathHero
	if not h.is_alive_active():
		return
	consumed = true
	set_deferred("monitoring", false)
	picked.emit(self, h.player_idx)
