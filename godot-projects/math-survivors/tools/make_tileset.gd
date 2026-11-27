# tools/make_tileset.gd
# Run: godot --headless --path . --script res://tools/make_tileset.gd
extends SceneTree

const TILE_PX: int = 24
const COLS: int = 5
const ROWS: int = 1

func _initialize() -> void:
	var img := Image.create_empty(TILE_PX * COLS, TILE_PX * ROWS, false, Image.FORMAT_RGBA8)
	img.fill(Color("#0f172a"))

	# Tile (0,0): Dark Arcane Slate Floor
	_paint_floor(img, 0, Color("#111936"), Color("#18244b"), Color("#1e2d5c"), false)
	# Tile (1,0): Alternate Floor Checker
	_paint_floor(img, 1, Color("#0d142c"), Color("#141f42"), Color("#1b2852"), false)
	# Tile (2,0): Glowing Arcane Rune Floor
	_paint_floor(img, 2, Color("#131d3d"), Color("#1d2c59"), Color("#38bdf8"), true)
	# Tile (3,0): Cracked Arena Tile
	_paint_cracked_floor(img, 3)
	# Tile (4,0): Solid Outer Boundary Wall (with physics collider)
	_paint_wall(img, 4)

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

	for tx: int in range(COLS):
		source.create_tile(Vector2i(tx, 0))

	# Wall physics box on tile (4,0)
	var wall_data := source.get_tile_data(Vector2i(4, 0), 0)
	wall_data.add_collision_polygon(0)
	wall_data.set_collision_polygon_points(0, 0, PackedVector2Array([
		Vector2(-12, -12), Vector2(12, -12), Vector2(12, 12), Vector2(-12, 12)
	]))

	var err_res := ResourceSaver.save(ts, "res://tiles/arena_tileset.tres")
	print("Saved arena_tileset.tres: ", error_string(err_res))
	quit(0 if err_res == OK else 1)

func _paint_floor(img: Image, idx: int, base: Color, bevel: Color, accent: Color, rune: bool) -> void:
	var ox: int = idx * TILE_PX
	for y: int in range(TILE_PX):
		for x: int in range(TILE_PX):
			var col: Color = base
			if x == 0 or y == 0:
				col = bevel
			elif x == TILE_PX - 1 or y == TILE_PX - 1:
				col = base.darkened(0.25)
			elif ((x + y) % 7 == 0) and (x % 3 == 0):
				col = base.lightened(0.08)
			img.set_pixel(ox + x, y, col)
	if rune:
		for k: int in range(6, 18):
			img.set_pixel(ox + k, 6, accent)
			img.set_pixel(ox + k, 17, accent)
			img.set_pixel(ox + 6, k, accent)
			img.set_pixel(ox + 17, k, accent)
		img.set_pixel(ox + 11, 11, Color("#fde047"))
		img.set_pixel(ox + 12, 12, Color("#fde047"))

func _paint_cracked_floor(img: Image, idx: int) -> void:
	_paint_floor(img, idx, Color("#111936"), Color("#18244b"), Color("#1e2d5c"), false)
	var ox: int = idx * TILE_PX
	var crack := Color("#070b1a")
	for p: Vector2i in [Vector2i(5, 6), Vector2i(6, 7), Vector2i(7, 8), Vector2i(8, 8), Vector2i(9, 9), Vector2i(10, 10), Vector2i(10, 11), Vector2i(11, 12), Vector2i(14, 15), Vector2i(15, 16)]:
		img.set_pixel(ox + p.x, p.y, crack)

func _paint_wall(img: Image, idx: int) -> void:
	var ox: int = idx * TILE_PX
	for y: int in range(TILE_PX):
		for x: int in range(TILE_PX):
			var col: Color = Color("#31102f")
			if y < 3 or x < 2:
				col = Color("#f43f5e")
			elif y < 6:
				col = Color("#881337")
			elif (x + y) % 4 == 0:
				col = Color("#4c0519")
			img.set_pixel(ox + x, y, col)
