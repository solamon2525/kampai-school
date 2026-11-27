class_name WordPickup
extends Area2D

signal picked(pickup: WordPickup)

var word_text: String = ""
var is_correct: bool = true
var pair_data: Dictionary = {}
var zone_id: int = 0
var consumed: bool = false

var _panel: PanelContainer
var _base_y: float = 0.0
var _bob_phase: float = 0.0

func setup(p_word: String, p_correct: bool, p_pair: Dictionary, p_zone_id: int, font_res: Font) -> void:
	word_text = p_word
	is_correct = p_correct
	pair_data = p_pair
	zone_id = p_zone_id
	_bob_phase = float(p_zone_id) * 0.9 + (0.0 if p_correct else 1.4)

	collision_layer = 8
	collision_mask = 2

	_panel = PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#fffbeb")
	sb.border_color = Color("#d97706")
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(5)
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 3
	sb.content_margin_bottom = 3
	sb.shadow_color = Color(0, 0, 0, 0.35)
	sb.shadow_size = 2
	sb.shadow_offset = Vector2(0, 2)
	_panel.add_theme_stylebox_override("panel", sb)
	_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var lbl := Label.new()
	lbl.text = word_text
	if font_res:
		lbl.add_theme_font_override("font", font_res)
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.add_theme_color_override("font_color", Color("#1e1b18"))
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_panel.add_child(lbl)
	add_child(_panel)

	var est_w: float = maxf(60.0, float(word_text.length()) * 9.5 + 18.0)
	_panel.custom_minimum_size = Vector2(est_w, 26.0)
	_panel.position = Vector2(-est_w * 0.5, -13.0)

	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(est_w, 26.0)
	col.shape = rect
	add_child(col)

func _ready() -> void:
	_base_y = position.y
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if consumed:
		return
	_bob_phase += delta * 2.8
	position.y = _base_y + sin(_bob_phase) * 3.0

func _on_body_entered(body: Node2D) -> void:
	if consumed or not body.is_in_group("player"):
		return
	consumed = true
	picked.emit(self)

func vanish(collected_glow: bool) -> void:
	consumed = true
	set_deferred("monitoring", false)
	var tw: Tween = create_tween().set_parallel(true)
	if collected_glow:
		tw.tween_property(self, "scale", Vector2(1.25, 1.25), 0.2)
	else:
		tw.tween_property(self, "scale", Vector2(0.7, 0.7), 0.2)
	tw.tween_property(self, "modulate:a", 0.0, 0.2)
	tw.chain().tween_callback(queue_free)
