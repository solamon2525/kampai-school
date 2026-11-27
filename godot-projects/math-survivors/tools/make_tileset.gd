# tools/make_tileset.gd
# Generates multi-biome 5x3 TileSet (arcane_temple, crystal_forest, lava_citadel)
# Run: godot --headless --path . --script res://tools/make_tileset.gd
extends SceneTree

const TILE_PX: int = 24
const COLS: int = 5
const ROWS: int = 3

func _initialize() -> void:
	var img := Image.create_empty(TILE_PX * COLS, TILE_PX * ROWS, false, Image.FORMAT_RGBA8)
	img.fill(Color("#0f172a"))

	# Row 0: Arcane Temple
	_paint_floor(img, 0, 0, Color("#111936"), Color("#18244b"), Color("#38bdf8"), false)
	_paint_floor(img, 1, 0, Color("#0d142c"), Color("#141f42"), Color("#38bdf8"), false)
	_paint_floor(img, 2, 0, Color("#131d3d"), Color("#1d2c59"), Color("#38bdf8"), true)
	_paint_cracked(img, 3, 0, Color("#111936"), Color("#18244b"), Color("#070b1a"))
	_paint_wall(img, 4, 0, Color("#31102f"), Color("#f43f5e"), Color("#881337"))

	# Row 1: Crystal Forest
	_paint_floor(img, 0, 1, Color("#0b2924"), Color("#113e36"), Color("#2dd4bf"), false)
	_paint_floor(img, 1, 1, Color("#08221e"), Color("#0f352e"), Color("#2dd4bf"), false)
	_paint_floor(img, 2, 1, Color("#0d332d"), Color("#154a41"), Color("#5eead4"), true)
	_paint_speed_pad(img, 3, 1)
	_paint_wall(img, 4, 1, Color("#115e59"), Color("#2dd4bf"), Color("#0f766e"))

	# Row 2: Lava Citadel
	_paint_floor(img, 0, 2, Color("#241118"), Color("#381924"), Color("#fb923c"), false)
	_paint_floor(img, 1, 2, Color("#1c0d13"), Color("#2e151e"), Color("#fb923c"), false)
	_paint_floor(img, 2, 2, Color("#2c141d"), Color("#421d2a"), Color("#f97316"), true)
	_paint_cracked(img, 3, 2, Color("#241118"), Color("#381924"), Color("#f97316"))
	_paint_wall(img, 4, 2, Color("#450a0a"), Color("#fb923c"), Color("#991b1b"))

	var atlas_path := "res://tiles/arena_atlas.png"
	var err_img := img.save_png(atlas_path)
	if err_img != OK:
		push_error("Failed saving arena_atlas.png: " + error_string(err_img))
		quit(1)
		return

	var atlas_tex := ImageTexture.create_from_image(img)
	var ts := TileSet.new()
	ts.tile_size = Vector2i(TILE_PX, TILE_PX)
	ts.add_physics_layer()
	ts.set_physics_layer_collision_layer(0, 1)

	var source := TileSetAtlasSource.new()
	source.texture = atlas_tex
	source.texture_region_size = Vector2i(TILE_PX, TILE_PX)
	ts.add_source(source, 0)

	for ry: int in range(ROWS):
		for tx: int in range(COLS):
			source.create_tile(Vector2i(tx, ry))
		# Solid perimeter wall collider on col 4 of every biome row
		var wall_data := source.get_tile_data(Vector2i(4, ry), 0)
		wall_data.add_collision_polygon(0)
		wall_data.set_collision_polygon_points(0, 0, PackedVector2Array([
			Vector2(-12, -12), Vector2(12, -12), Vector2(12, 12), Vector2(-12, 12)
		]))

	var err_res := ResourceSaver.save(ts, "res://tiles/arena_tileset.tres")
	print("Saved multi-biome arena_tileset.tres: ", error_string(err_res))
	quit(0 if err_res == OK else 1)

func _paint_floor(img: Image, cx: int, cy: int, base: Color, bevel: Color, accent: Color, rune: bool) -> void:
	var ox: int = cx * TILE_PX
	var oy: int = cy * TILE_PX
	for y: int in range(TILE_PX):
		for x: int in range(TILE_PX):
			var col: Color = base
			if x == 0 or y == 0:
				col = bevel
			elif x == TILE_PX - 1 or y == TILE_PX - 1:
				col = base.darkened(0.25)
			elif ((x + y) % 7 == 0) and (x % 3 == 0):
				col = base.lightened(0.09)
			img.set_pixel(ox + x, oy + y, col)
	if rune:
		for k: int in range(6, 18):
			img.set_pixel(ox + k, oy + 6, accent)
			img.set_pixel(ox + k, oy + 17, accent)
			img.set_pixel(ox + 6, oy + k, accent)
			img.set_pixel(ox + 17, oy + k, accent)
		img.set_pixel(ox + 11, oy + 11, Color("#fde047"))
		img.set_pixel(ox + 12, oy + 12, Color("#fde047"))

func _paint_cracked(img: Image, cx: int, cy: int, base: Color, bevel: Color, crack_col: Color) -> void:
	_paint_floor(img, cx, cy, base, bevel, crack_col, false)
	var ox: int = cx * TILE_PX
	var oy: int = cy * TILE_PX
	for p: Vector2i in [Vector2i(5, 6), Vector2i(6, 7), Vector2i(7, 8), Vector2i(8, 8), Vector2i(9, 9), Vector2i(10, 10), Vector2i(10, 11), Vector2i(11, 12), Vector2i(14, 15), Vector2i(15, 16)]:
		img.set_pixel(ox + p.x, oy + p.y, crack_col)

func _paint_speed_pad(img: Image, cx: int, cy: int) -> void:
	_paint_floor(img, cx, cy, Color("#0d332d"), Color("#154a41"), Color("#38bdf8"), false)
	var ox: int = cx * TILE_PX
	var oy: int = cy * TILE_PX
	for y: int in range(4, 20):
		for x: int in range(4, 20):
			if abs(x - 12) + abs(y - 12) <= 7:
				var c := Color("#22d3ee") if (x + y) % 2 == 0 else Color("#a5f3fc")
				img.set_pixel(ox + x, oy + y, c)

func _paint_wall(img: Image, cx: int, cy: int, body: Color, rim: Color, mid: Color) -> void:
	var ox: int = cx * TILE_PX
	var oy: int = cy * TILE_PX
	for y: int in range(TILE_PX):
		for x: int in range(TILE_PX):
			var col: Color = body
			if y < 3 or x < 2:
				col = rim
			elif y < 6:
				col = mid
			elif (x + y) % 4 == 0:
				col = body.darkened(0.28)
			img.set_pixel(ox + x, oy + y, col)
