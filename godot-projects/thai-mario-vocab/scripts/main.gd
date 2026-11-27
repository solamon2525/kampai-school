extends Node2D

const TILE: float = 24.0
const GROUND_TOP_ROW: int = 13 # y = 312 px ในความสูง 360 px
const THAI_FONT: Font = preload("res://assets/fonts/thai_bold.ttf")

@onready var sky_rect: ColorRect = $SkyLayer/SkyRect
@onready var world_root: Node2D = $WorldContainer
@onready var player: MarioPlayer = $Player
@onready var cam: Camera2D = $Player/Camera2D

var _checkpoint_pos: Vector2 = Vector2(64.0, 280.0)
var _checkpoint_reached: bool = false
var _cp_banner: ColorRect
var _flag_banner: Sprite2D
var _stage_clearing: bool = false
var _zone_cards: Dictionary = {}
var _trauma: float = 0.0
var _trauma_t: float = 0.0

func _ready() -> void:
	KampaiBridge.external_start_requested.connect(_on_external_start)
	KampaiBridge.external_pause_changed.connect(_on_external_pause)
	player.hit_block_from_below.connect(_on_player_hit_block)
	player.touched_enemy.connect(_on_player_touched_enemy)
	player.fell_in_pit.connect(_on_player_fell)

	if not OS.has_feature("web") and not GameState.is_active:
		# เปิดเล่นตรงจาก Godot Editor ได้ทันที
		_start_round(1337)
	else:
		_load_stage(0, false)

func _on_external_start(seed_val: int) -> void:
	_start_round(seed_val)

func _on_external_pause(paused: bool) -> void:
	get_tree().paused = paused

func _start_round(seed_val: int) -> void:
	_stage_clearing = false
	GameState.start_new_round(seed_val)
	_load_stage(0, true)

func _clear_world() -> void:
	_zone_cards.clear()
	_cp_banner = null
	_flag_banner = null
	for child: Node in world_root.get_children():
		child.queue_free()

func _load_stage(idx: int, start_audio: bool) -> void:
	_stage_clearing = false
	_checkpoint_reached = false
	GameState.stage_index = idx
	_clear_world()

	var world: Dictionary = GameState.get_current_world()
	var length_tiles: int = int(world.get("length_tiles", 96))
	var world_px_w: float = float(length_tiles) * TILE
	var theme_name: String = str(world.get("theme", "overworld"))

	if sky_rect:
		sky_rect.color = world.get("sky_top", Color(0.24, 0.50, 0.96))
	if cam:
		cam.limit_right = int(world_px_w)
		cam.limit_top = 0
		cam.limit_bottom = 360
		cam.limit_left = 0

	_build_scenery(world, world_px_w, theme_name)
	_build_terrain(world, length_tiles, theme_name)
	_build_pipes(world)
	_build_blocks(world, theme_name)
	_build_word_zones(world)
	_build_enemies(world, world_px_w)
	_build_checkpoint_and_flag(world)

	_checkpoint_pos = Vector2(3.0 * TILE, float(GROUND_TOP_ROW - 1) * TILE - 8.0)
	player.reset_at(_checkpoint_pos)
	if cam:
		cam.reset_smoothing()

	GameState.hud_updated.emit()
	if start_audio:
		_show_stage_banner(str(world.get("name", "ด่าน 1-1")))
		AudioSynth.start_bgm(str(world.get("bgm", "overworld")))

func _is_pit(world: Dictionary, tx: int) -> bool:
	var pits: Array = world.get("pits", [])
	for r: Variant in pits:
		if tx >= int(r[0]) and tx <= int(r[1]):
			return true
	return false

func _build_scenery(world: Dictionary, world_px_w: float, theme_name: String) -> void:
	var ground_y: float = float(GROUND_TOP_ROW) * TILE
	var pbg := ParallaxBackground.new()
	pbg.layer = -5
	pbg.scroll_ignore_camera_zoom = true
	world_root.add_child(pbg)

	# ชั้นไล่เฉดสีท้องฟ้าด้านล่าง
	var sky_grad_layer := ParallaxLayer.new()
	sky_grad_layer.motion_scale = Vector2.ZERO
	var lower_sky := ColorRect.new()
	lower_sky.color = world.get("sky_bottom", Color(0.45, 0.72, 1.0))
	lower_sky.color.a = 0.55
	lower_sky.position = Vector2(0.0, 150.0)
	lower_sky.size = Vector2(960.0, 230.0)
	sky_grad_layer.add_child(lower_sky)
	pbg.add_child(sky_grad_layer)

	if theme_name == "underground":
		return

	# ก้อนเมฆ (scroll ช้า)
	var cloud_layer := ParallaxLayer.new()
	cloud_layer.motion_scale = Vector2(0.35, 0.0)
	var cx: float = 80.0
	while cx < world_px_w:
		var cl := Sprite2D.new()
		cl.texture = PixelArt.get_tex("cloud")
		cl.position = Vector2(cx, 52.0 + float(int(cx) % 48))
		cloud_layer.add_child(cl)
		cx += 210.0
	pbg.add_child(cloud_layer)

	# ภูเขา (scroll กลาง)
	var hill_layer := ParallaxLayer.new()
	hill_layer.motion_scale = Vector2(0.55, 0.0)
	var hx: float = 90.0
	while hx < world_px_w:
		var hl := Sprite2D.new()
		hl.texture = PixelArt.get_tex("hill")
		hl.position = Vector2(hx, ground_y - 28.0)
		hill_layer.add_child(hl)
		hx += 320.0
	pbg.add_child(hill_layer)

	# พุ่มไม้ (ด้านหลังท่อ)
	var bush_layer := Node2D.new()
	bush_layer.z_index = 0
	var bx: float = 160.0
	while bx < world_px_w - 180.0:
		var tx: int = int(bx / TILE)
		if not _is_pit(world, tx):
			var bs := Sprite2D.new()
			bs.texture = PixelArt.get_tex("bush")
			bs.position = Vector2(bx, ground_y - 12.0)
			bush_layer.add_child(bs)
		bx += 260.0
	world_root.add_child(bush_layer)

func _build_terrain(world: Dictionary, length_tiles: int, theme_name: String) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	body.z_index = 2
	world_root.add_child(body)

	var top_tex: ImageTexture = PixelArt.get_tex("ground_" + theme_name)
	var dirt_tex: ImageTexture = PixelArt.get_tex("dirt_" + theme_name)

	# รวม collision ต่อเนื่องตามช่วงที่ไม่ใช่หลุม เพื่อกันเสี้ยน tile seam
	var seg_start: int = -1
	for tx: int in range(length_tiles + 1):
		var solid: bool = tx < length_tiles and not _is_pit(world, tx)
		if solid:
			for ty: int in range(GROUND_TOP_ROW, 16):
				var sp := Sprite2D.new()
				sp.texture = top_tex if ty == GROUND_TOP_ROW else dirt_tex
				sp.position = Vector2(float(tx) * TILE + TILE * 0.5, float(ty) * TILE + TILE * 0.5)
				body.add_child(sp)
			if seg_start == -1:
				seg_start = tx
		elif seg_start != -1:
			var seg_len: float = float(tx - seg_start) * TILE
			var col := CollisionShape2D.new()
			var rect := RectangleShape2D.new()
			rect.size = Vector2(seg_len, 3.0 * TILE)
			col.shape = rect
			col.position = Vector2(float(seg_start) * TILE + seg_len * 0.5, float(GROUND_TOP_ROW) * TILE + 1.5 * TILE)
			body.add_child(col)
			seg_start = -1

func _build_pipes(world: Dictionary) -> void:
	var ground_y: float = float(GROUND_TOP_ROW) * TILE
	var pipes: Array = world.get("pipes", [])
	for p: Variant in pipes:
		var px: float = float(p["x"]) * TILE + TILE
		var h_tiles: int = int(p["h"])
		var total_h: float = float(h_tiles) * TILE

		var pipe_body := StaticBody2D.new()
		pipe_body.collision_layer = 1
		pipe_body.collision_mask = 0
		pipe_body.z_index = 3

		var col := CollisionShape2D.new()
		var rect := RectangleShape2D.new()
		rect.size = Vector2(40.0, total_h)
		col.shape = rect
		col.position = Vector2(px, ground_y - total_h * 0.5)
		pipe_body.add_child(col)

		var seg_y: float = ground_y - 12.0
		while seg_y >= ground_y - total_h + 18.0:
			var seg := Sprite2D.new()
			seg.texture = PixelArt.get_tex("pipe_body")
			seg.position = Vector2(px, seg_y)
			pipe_body.add_child(seg)
			seg_y -= TILE

		var top_sp := Sprite2D.new()
		top_sp.texture = PixelArt.get_tex("pipe_top")
		top_sp.position = Vector2(px, ground_y - total_h + 10.0)
		pipe_body.add_child(top_sp)

		world_root.add_child(pipe_body)

func _build_blocks(world: Dictionary, theme_name: String) -> void:
	var blocks: Array = world.get("blocks", [])
	for b: Variant in blocks:
		var qb := QuestionBlock.new()
		qb.setup(str(b["type"]), theme_name)
		qb.position = Vector2(float(b["x"]) * TILE + TILE * 0.5, float(b["y"]) * TILE + TILE * 0.5)
		qb.z_index = 4
		qb.triggered.connect(_on_question_block_triggered)
		world_root.add_child(qb)

func _build_word_zones(world: Dictionary) -> void:
	var slots: Array[Dictionary] = GameState.build_stage_word_slots(world)
	for slot: Dictionary in slots:
		var zid: int = int(slot["zone_id"])
		var x_pos: float = float(slot["x"]) * TILE + TILE * 0.5
		var high_y: float = float(slot["high_y"]) * TILE
		var low_y: float = float(slot["low_y"]) * TILE
		var pair: Dictionary = slot["pair"]
		var correct_on_high: bool = bool(slot["correct_on_high"])

		var cards_in_zone: Array[WordPickup] = []
		var card_top := WordPickup.new()
		card_top.position = Vector2(x_pos, high_y)
		card_top.z_index = 5
		card_top.setup(str(pair["correct"] if correct_on_high else pair["wrong"]), correct_on_high, pair, zid, THAI_FONT)
		card_top.picked.connect(_on_word_picked)
		world_root.add_child(card_top)
		cards_in_zone.append(card_top)

		var card_low := WordPickup.new()
		card_low.position = Vector2(x_pos, low_y)
		card_low.z_index = 5
		card_low.setup(str(pair["wrong"] if correct_on_high else pair["correct"]), not correct_on_high, pair, zid, THAI_FONT)
		card_low.picked.connect(_on_word_picked)
		world_root.add_child(card_low)
		cards_in_zone.append(card_low)

		_zone_cards[zid] = cards_in_zone

func _build_enemies(world: Dictionary, world_px_w: float) -> void:
	var enemies: Array = world.get("enemies", [])
	var pits: Array = world.get("pits", [])
	for idx: int in range(enemies.size()):
		var tx: int = int(enemies[idx])
		var e := PatrolEnemy.new()
		e.position = Vector2(float(tx) * TILE + TILE * 0.5, float(GROUND_TOP_ROW - 1) * TILE)
		e.z_index = 6
		e.dir = -1.0 if idx % 2 == 0 else 1.0
		e.max_x = world_px_w - 48.0
		e.pit_ranges = pits
		e.stomped_or_touched.connect(_on_enemy_contact)
		world_root.add_child(e)

func _build_checkpoint_and_flag(world: Dictionary) -> void:
	var ground_y: float = float(GROUND_TOP_ROW) * TILE

	# Checkpoint
	var cp_x: float = float(world.get("checkpoint_x", 50)) * TILE
	var pole_cp := ColorRect.new()
	pole_cp.color = Color("#e2e8f0")
	pole_cp.position = Vector2(cp_x - 1.5, ground_y - 52.0)
	pole_cp.size = Vector2(3.0, 52.0)
	pole_cp.z_index = 3
	world_root.add_child(pole_cp)

	_cp_banner = ColorRect.new()
	_cp_banner.color = Color("#94a3b8")
	_cp_banner.position = Vector2(cp_x + 1.5, ground_y - 46.0)
	_cp_banner.size = Vector2(18.0, 12.0)
	_cp_banner.z_index = 3
	world_root.add_child(_cp_banner)

	var cp_area := Area2D.new()
	cp_area.collision_layer = 0
	cp_area.collision_mask = 2
	cp_area.position = Vector2(cp_x, ground_y - 26.0)
	var cp_col := CollisionShape2D.new()
	var cp_rect := RectangleShape2D.new()
	cp_rect.size = Vector2(24.0, 52.0)
	cp_col.shape = cp_rect
	cp_area.add_child(cp_col)
	cp_area.body_entered.connect(_on_checkpoint_entered)
	world_root.add_child(cp_area)

	# Flagpole & Castle
	var fx: float = float(world.get("flag_x", 90)) * TILE
	var f_pole := ColorRect.new()
	f_pole.color = Color("#f1f5f9")
	f_pole.position = Vector2(fx - 2.0, ground_y - 168.0)
	f_pole.size = Vector2(4.0, 168.0)
	f_pole.z_index = 3
	world_root.add_child(f_pole)

	var knob := ColorRect.new()
	knob.color = Color("#facc15")
	knob.position = Vector2(fx - 5.0, ground_y - 174.0)
	knob.size = Vector2(10.0, 10.0)
	knob.z_index = 4
	world_root.add_child(knob)

	_flag_banner = Sprite2D.new()
	_flag_banner.texture = PixelArt.get_tex("flag_banner")
	_flag_banner.position = Vector2(fx - 14.0, ground_y - 150.0)
	_flag_banner.z_index = 4
	world_root.add_child(_flag_banner)

	var castle := Sprite2D.new()
	castle.texture = PixelArt.get_tex("castle")
	castle.position = Vector2(fx + 82.0, ground_y - 54.0)
	castle.z_index = 2
	world_root.add_child(castle)

	var f_area := Area2D.new()
	f_area.collision_layer = 0
	f_area.collision_mask = 2
	f_area.position = Vector2(fx, ground_y - 84.0)
	var f_col := CollisionShape2D.new()
	var f_rect := RectangleShape2D.new()
	f_rect.size = Vector2(20.0, 168.0)
	f_col.shape = f_rect
	f_area.add_child(f_col)
	f_area.body_entered.connect(_on_flagpole_entered)
	world_root.add_child(f_area)

func _on_player_hit_block(collider: Object) -> void:
	if collider is QuestionBlock:
		(collider as QuestionBlock).bonk()

func _on_question_block_triggered(_block: QuestionBlock, b_type: String, spawn_pos: Vector2) -> void:
	if b_type == "q_heart":
		var heart := HeartPickup.new()
		heart.position = spawn_pos
		heart.z_index = 6
		heart.collected.connect(_on_heart_collected)
		world_root.add_child(heart)
		AudioSynth.play_sfx("powerup")
	else:
		var coin_sp := Sprite2D.new()
		coin_sp.texture = PixelArt.get_tex("coin_0")
		coin_sp.position = spawn_pos
		coin_sp.z_index = 8
		world_root.add_child(coin_sp)
		var tw: Tween = create_tween()
		tw.tween_property(coin_sp, "position:y", spawn_pos.y - 34.0, 0.25).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(coin_sp, "modulate:a", 0.0, 0.25)
		tw.chain().tween_callback(coin_sp.queue_free)
		var pts: int = GameState.collect_coin()
		AudioSynth.play_sfx("coin")
		_spawn_popup(spawn_pos, "+%d" % pts, Color("#fde047"))

func _on_heart_collected(pickup: HeartPickup) -> void:
	AudioSynth.play_sfx("powerup")
	var res: Dictionary = GameState.collect_extra_heart()
	if bool(res["gained"]):
		_spawn_popup(pickup.global_position, "+1 ❤️", Color("#fb7185"))
	else:
		_spawn_popup(pickup.global_position, "+%d" % int(res["bonus"]), Color("#fde047"))

func _on_word_picked(pickup: WordPickup) -> void:
	if _stage_clearing or player.is_dead_anim or GameState.is_game_over:
		return
	if pickup.is_correct:
		var siblings: Array = _zone_cards.get(pickup.zone_id, [])
		for card: Variant in siblings:
			if is_instance_valid(card):
				(card as WordPickup).vanish(card == pickup)
		var gained: int = GameState.collect_correct_word(pickup.pair_data)
		AudioSynth.play_sfx("coin")
		_spawn_sparks(pickup.global_position, Color("#fde047"))
		_spawn_popup(pickup.global_position + Vector2(0.0, -14.0), "+%d" % gained, Color("#4ade80"))
	else:
		pickup.vanish(false)
		var game_over: bool = GameState.collect_wrong_word(pickup.pair_data)
		_handle_hurt(game_over)

func _on_player_touched_enemy(enemy: Node2D, is_stomp: bool) -> void:
	_on_enemy_contact(enemy as PatrolEnemy, is_stomp)

func _on_enemy_contact(enemy: PatrolEnemy, is_stomp: bool) -> void:
	if enemy == null or not enemy.alive or _stage_clearing or GameState.is_game_over:
		return
	if is_stomp:
		enemy.squish()
		player.bounce_stomp()
		var pts: int = GameState.collect_stomp()
		AudioSynth.play_sfx("stomp")
		_spawn_popup(enemy.global_position + Vector2(0.0, -16.0), "+%d" % pts, Color("#fde047"))
		return
	if player.is_invulnerable():
		return
	var game_over: bool = GameState.apply_hazard_hit("💥 ชนเจ้าเห็ด! เสียหัวใจ 1 ดวง")
	_handle_hurt(game_over)

func _on_player_fell() -> void:
	if _stage_clearing or player.is_dead_anim or GameState.is_game_over:
		return
	var game_over: bool = GameState.apply_hazard_hit("🕳️ ตกเหว! เสียหัวใจ 1 ดวง")
	AudioSynth.play_sfx("lose_heart")
	_trauma = minf(1.0, _trauma + 0.55)
	if game_over:
		_finish_after_delay(true)
	else:
		player.reset_at(_checkpoint_pos)
		player.invuln_timer = 1.6

func _handle_hurt(is_game_over: bool) -> void:
	AudioSynth.play_sfx("lose_heart")
	_trauma = minf(1.0, _trauma + 0.55)
	player.trigger_hurt(is_game_over)
	if is_game_over:
		AudioSynth.stop_bgm()
		_finish_after_delay(false)

func _finish_after_delay(immediate: bool) -> void:
	if not immediate:
		await get_tree().create_timer(1.15).timeout
	if is_inside_tree():
		GameState.finish_round(false)

func _on_checkpoint_entered(body: Node2D) -> void:
	if _checkpoint_reached or not body.is_in_group("player"):
		return
	_checkpoint_reached = true
	var world: Dictionary = GameState.get_current_world()
	_checkpoint_pos = Vector2(float(world.get("checkpoint_x", 50)) * TILE, float(GROUND_TOP_ROW - 1) * TILE - 8.0)
	if _cp_banner:
		_cp_banner.color = Color("#22c55e")
	AudioSynth.play_sfx("powerup")
	GameState.toast_requested.emit("🚩 ถึงจุดเซฟกลางด่านแล้ว!", true, "")

func _on_flagpole_entered(body: Node2D) -> void:
	if _stage_clearing or player.is_dead_anim or not body.is_in_group("player"):
		return
	_stage_clearing = true
	player.controls_locked = true
	player.velocity = Vector2.ZERO
	AudioSynth.stop_bgm()
	AudioSynth.play_sfx("flagpole")

	var ground_y: float = float(GROUND_TOP_ROW) * TILE
	var tw: Tween = create_tween().set_parallel(true)
	if _flag_banner:
		tw.tween_property(_flag_banner, "position:y", ground_y - 24.0, 0.55)
	tw.tween_property(player, "global_position:y", ground_y - 16.0, 0.55)
	await tw.finished
	if not is_inside_tree():
		return

	AudioSynth.play_sfx("stage_clear")
	var res: Dictionary = GameState.complete_stage()
	var world: Dictionary = GameState.get_current_world()
	_spawn_sparks(player.global_position + Vector2(0.0, -30.0), Color("#facc15"))
	GameState.toast_requested.emit("🏰 ผ่านด่าน! โบนัส +%d คะแนน" % int(res["bonus"]), true, "")

	await get_tree().create_timer(1.35).timeout
	if not is_inside_tree():
		return
	if bool(res["won_all"]):
		GameState.finish_round(true)
	else:
		_load_stage(int(res["next_stage"]), true)

func _spawn_sparks(at: Vector2, col: Color) -> void:
	var p := CPUParticles2D.new()
	p.position = at
	p.texture = PixelArt.get_tex("spark")
	p.amount = 10
	p.one_shot = true
	p.explosiveness = 1.0
	p.lifetime = 0.45
	p.spread = 180.0
	p.initial_velocity_min = 45.0
	p.initial_velocity_max = 110.0
	p.gravity = Vector2(0.0, 260.0)
	p.color = col
	p.z_index = 12
	world_root.add_child(p)
	p.emitting = true
	get_tree().create_timer(0.6).timeout.connect(func() -> void:
		if is_instance_valid(p):
			p.queue_free()
	)

func _spawn_popup(at: Vector2, text: String, col: Color) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.position = at - Vector2(24.0, 10.0)
	lbl.z_index = 15
	lbl.add_theme_font_override("font", THAI_FONT)
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", col)
	lbl.add_theme_color_override("font_outline_color", Color("#0f172a"))
	lbl.add_theme_constant_override("outline_size", 4)
	world_root.add_child(lbl)

	var tw: Tween = lbl.create_tween()
	tw.tween_property(lbl, "position:y", lbl.position.y - 26.0, 0.6)
	tw.parallel().tween_property(lbl, "modulate:a", 0.0, 0.35).set_delay(0.25)
	tw.chain().tween_callback(lbl.queue_free)

func _show_stage_banner(stage_name: String) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 10
	var lbl := Label.new()
	lbl.text = stage_name
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	lbl.offset_top = 48.0
	lbl.add_theme_font_override("font", THAI_FONT)
	lbl.add_theme_font_size_override("font_size", 18)
	lbl.add_theme_color_override("font_color", Color("#fde047"))
	lbl.add_theme_color_override("font_outline_color", Color("#0f172a"))
	lbl.add_theme_constant_override("outline_size", 5)
	layer.add_child(lbl)
	world_root.add_child(layer)

	var tw: Tween = lbl.create_tween()
	tw.tween_interval(1.0)
	tw.tween_property(lbl, "modulate:a", 0.0, 0.4)
	tw.chain().tween_callback(layer.queue_free)

func _process(delta: float) -> void:
	if cam == null:
		return
	if _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - 2.4 * delta)
		_trauma_t += delta * 38.0
		var s: float = _trauma * _trauma
		cam.offset = Vector2(sin(_trauma_t * 1.7) * 6.0 * s, sin(_trauma_t * 2.3) * 4.0 * s)
	else:
		cam.offset = Vector2.ZERO
