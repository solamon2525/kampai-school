class_name PixelArt
extends RefCounted

static var _cache: Dictionary = {}

static func get_tex(key: String) -> ImageTexture:
	if _cache.has(key):
		return _cache[key] as ImageTexture
	var tex: ImageTexture = _build(key)
	_cache[key] = tex
	return tex

static func _make_from_grid(grid: Array[String], pal: Dictionary, px_scale: int) -> ImageTexture:
	var h: int = grid.size()
	var w: int = grid[0].length()
	var img := Image.create_empty(w * px_scale, h * px_scale, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	for y: int in range(h):
		var row: String = grid[y]
		for x: int in range(w):
			var ch: String = row[x]
			if not pal.has(ch):
				continue
			var col: Color = pal[ch]
			for dy: int in range(px_scale):
				for dx: int in range(px_scale):
					img.set_pixel(x * px_scale + dx, y * px_scale + dy, col)
	return ImageTexture.create_from_image(img)

static func _make_canvas(w: int, h: int, fill_col: Color) -> Image:
	var img := Image.create_empty(w, h, false, Image.FORMAT_RGBA8)
	img.fill(fill_col)
	return img

static func _rect(img: Image, x: int, y: int, w: int, h: int, col: Color) -> void:
	for py: int in range(maxi(0, y), mini(img.get_height(), y + h)):
		for px: int in range(maxi(0, x), mini(img.get_width(), x + w)):
			img.set_pixel(px, py, col)

static func _build(key: String) -> ImageTexture:
	var hero_pal: Dictionary = {
		"K": Color("#1b1310"),
		"R": Color("#e52521"),
		"D": Color("#a1120e"),
		"W": Color("#ffffff"),
		"S": Color("#ffcc99"),
		"T": Color("#e8a87c"),
		"H": Color("#5c3317"),
		"B": Color("#1e50d8"),
		"N": Color("#102e82"),
		"Y": Color("#ffd700"),
	}
	match key:
		"hero_idle":
			return _make_from_grid([
				"....KKKKKK......",
				"...KRRRRRRK.....",
				"..KRRRRWWRRRK...",
				"..KHHHHHHHHK....",
				".KHSSKHSHSSK....",
				".KSHHKHSHSSSK...",
				".KHHSSSSHHHHK...",
				"...KSSSSSSSK....",
				"..KRRRRBBRRRK...",
				".KRRRRBBBBBRRK..",
				".KWWKBYBBYBKWWK.",
				".KWWKBBBBBBKWWK.",
				"..KK.KBBBBBBK...",
				".....KBBNBBK....",
				"....KHHHKHHHK...",
				"...KHHHHKKHHHHK.",
				"...KKKKK..KKKKK.",
				"................",
			], hero_pal, 2)
		"hero_run1":
			return _make_from_grid([
				"....KKKKKK......",
				"...KRRRRRRK.....",
				"..KRRRRWWRRRK...",
				"..KHHHHHHHHK....",
				".KHSSKHSHSSK....",
				".KSHHKHSHSSSK...",
				".KHHSSSSHHHHK...",
				"...KSSSSSSSK....",
				"..KRRRRBBRRRK...",
				".KRRRRBBBBBRRK..",
				"..KWWBYBBYBKWWK.",
				"...KKBBBBBBKK...",
				"...KBBBNKBBBK...",
				"..KHHHK..KHHHK..",
				".KHHHHK...KHHHK.",
				".KKKKK.....KKKK.",
				"................",
				"................",
			], hero_pal, 2)
		"hero_run2":
			return _make_from_grid([
				"................",
				"....KKKKKK......",
				"...KRRRRRRK.....",
				"..KRRRRWWRRRK...",
				"..KHHHHHHHHK....",
				".KHSSKHSHSSK....",
				".KSHHKHSHSSSK...",
				".KHHSSSSHHHHK...",
				"...KSSSSSSSK....",
				"..KRRRRBBRRK....",
				"..KRBBBBBBWRK...",
				"...KWBYBBYBK....",
				"....KBBBBBBK....",
				"...KHHHKHHHHK...",
				"...KHHHK.KKKK...",
				"...KKKK.........",
				"................",
				"................",
			], hero_pal, 2)
		"hero_jump":
			return _make_from_grid([
				"....KKKKKK..KK..",
				"...KRRRRRRKKWWK.",
				"..KRRRRWWRRRKWK.",
				"..KHHHHHHHHKRRK.",
				".KHSSKHSHSSKRRK.",
				".KSHHKHSHSSSRK..",
				".KHHSSSSHHHHKK..",
				"...KSSSSSSSK....",
				".KKKRRBBRRRK....",
				"KWWKBBBBBRK.....",
				"KWWKBYBBYBK.....",
				".KKKBBBBBBK.....",
				"..KBBBNKBBBK....",
				".KHHHK..KHHHK...",
				".KKKK....KHHHHK.",
				"..........KKKKK.",
				"................",
				"................",
			], hero_pal, 2)
		"hero_hurt":
			return _make_from_grid([
				"....KKKKKK......",
				"...KRRRRRRK.....",
				"..KRRRRWWRRRK...",
				"..KHHHHHHHHK....",
				".KHSSKHSHSSK....",
				".KSHHKHSHSSSK...",
				".KHHSSSSHHHHK...",
				"...KSSSSSSSK....",
				".KKRRRRRRRRKK...",
				"KWWKBBBBBBKWWK..",
				"KWWKBYBBYBKWWK..",
				".KKKBBBBBBKKK...",
				"..KHHHK.KHHHK...",
				".KHHHHK.KHHHHK..",
				".KKKKK...KKKKK..",
				"................",
				"................",
				"................",
			], hero_pal, 2)
		"enemy_0":
			return _make_from_grid([
				"....KKKKKK....",
				"..KKMMMMMMKK..",
				".KMLLMMMMMMMK.",
				"KMLLMMMMMMMMMK",
				"KMKKMMMMMMKKMK",
				"KMWWKKMMKKWWMK",
				"KMWKMMMMMMKWMK",
				"KMMMMMMMMMMMMK",
				".KCCCCCCCCCCK.",
				"..KCCCCCCCCK..",
				"..KBBBK.KBBBK.",
				".KBBBBK.KBBBBK",
				".KKKKK...KKKKK",
			], {
				"K": Color("#1b1310"),
				"M": Color("#a94b19"),
				"L": Color("#d86f2c"),
				"C": Color("#f9d6aa"),
				"W": Color("#ffffff"),
				"B": Color("#4a2511"),
			}, 2)
		"enemy_1":
			return _make_from_grid([
				"....KKKKKK....",
				"..KKMMMMMMKK..",
				".KMLLMMMMMMMK.",
				"KMLLMMMMMMMMMK",
				"KMKKMMMMMMKKMK",
				"KMWWKKMMKKWWMK",
				"KMWKMMMMMMKWMK",
				"KMMMMMMMMMMMMK",
				".KCCCCCCCCCCK.",
				"..KCCCCCCCCK..",
				"...KBBBK.KBBBK",
				"..KBBBBK.KBBBK",
				"..KKKKK..KKKKK",
			], {
				"K": Color("#1b1310"),
				"M": Color("#a94b19"),
				"L": Color("#d86f2c"),
				"C": Color("#f9d6aa"),
				"W": Color("#ffffff"),
				"B": Color("#4a2511"),
			}, 2)
		"enemy_squish":
			var es := _make_canvas(28, 12, Color(0, 0, 0, 0))
			_rect(es, 2, 3, 24, 7, Color("#1b1310"))
			_rect(es, 3, 4, 22, 5, Color("#a94b19"))
			_rect(es, 6, 9, 16, 3, Color("#4a2511"))
			return ImageTexture.create_from_image(es)
		"heart_item":
			return _make_from_grid([
				"..KKK....KKK..",
				".KRRRK..KRRRK.",
				"KRWWRRKKRRRRDK",
				"KRWRRRRRRRRRDK",
				"KRRRRRRRRRRRDK",
				".KRRRRRRRRRDK.",
				"..KRRRRRRRDK..",
				"...KRRRRRDK...",
				"....KRRRDK....",
				".....KRDK.....",
				"......KK......",
			], {
				"K": Color("#1b1310"),
				"R": Color("#ff2e54"),
				"W": Color("#ffd6de"),
				"D": Color("#a80b2d"),
			}, 2)
		"coin_0", "coin_1", "coin_2", "coin_3":
			var widths: Array[int] = [14, 10, 4, 10]
			var idx: int = int(key.substr(5, 1))
			var cw: int = widths[idx]
			var img := _make_canvas(18, 20, Color(0, 0, 0, 0))
			var x0: int = int((18 - cw) / 2.0)
			_rect(img, x0, 1, cw, 18, Color("#78350f"))
			_rect(img, x0 + 1, 2, maxi(2, cw - 2), 16, Color("#facc15"))
			if cw >= 10:
				_rect(img, x0 + 3, 4, 2, 12, Color("#fef08a"))
			return ImageTexture.create_from_image(img)
		"ground_overworld":
			return _ground_tile(Color("#22b14c"), Color("#63e659"), Color("#c84c0c"), Color("#8e3204"))
		"dirt_overworld":
			return _dirt_tile(Color("#c84c0c"), Color("#8e3204"))
		"ground_underground":
			return _ground_tile(Color("#2563eb"), Color("#60a5fa"), Color("#1e3a8a"), Color("#172554"))
		"dirt_underground":
			return _dirt_tile(Color("#1e3a8a"), Color("#172554"))
		"ground_castle":
			return _ground_tile(Color("#94a3b8"), Color("#e2e8f0"), Color("#475569"), Color("#334155"))
		"dirt_castle":
			return _dirt_tile(Color("#475569"), Color("#334155"))
		"brick_overworld":
			return _brick_tile(Color("#c84c0c"), Color("#ec8247"), Color("#451a03"))
		"brick_underground":
			return _brick_tile(Color("#1d4ed8"), Color("#60a5fa"), Color("#0f172a"))
		"brick_castle":
			return _brick_tile(Color("#64748b"), Color("#cbd5e1"), Color("#1e293b"))
		"qblock_0", "qblock_1", "qblock_2":
			var bgs: Array[Color] = [Color("#f59e0b"), Color("#fbbf24"), Color("#fde047")]
			var qi: int = int(key.substr(7, 1))
			var img := _make_canvas(24, 24, Color("#451a03"))
			_rect(img, 1, 1, 22, 22, bgs[qi])
			_rect(img, 1, 1, 22, 2, Color("#fef3c7"))
			_rect(img, 1, 1, 2, 22, Color("#fef3c7"))
			_rect(img, 3, 3, 2, 2, Color("#78350f"))
			_rect(img, 19, 3, 2, 2, Color("#78350f"))
			_rect(img, 3, 19, 2, 2, Color("#78350f"))
			_rect(img, 19, 19, 2, 2, Color("#78350f"))
			# ? mark shadow + white
			_rect(img, 8, 6, 9, 2, Color("#78350f"))
			_rect(img, 15, 8, 2, 4, Color("#78350f"))
			_rect(img, 11, 11, 5, 2, Color("#78350f"))
			_rect(img, 11, 13, 2, 2, Color("#78350f"))
			_rect(img, 11, 17, 2, 2, Color("#78350f"))
			_rect(img, 7, 5, 9, 2, Color("#ffffff"))
			_rect(img, 14, 7, 2, 4, Color("#ffffff"))
			_rect(img, 10, 10, 5, 2, Color("#ffffff"))
			_rect(img, 10, 12, 2, 2, Color("#ffffff"))
			_rect(img, 10, 16, 2, 2, Color("#ffffff"))
			return ImageTexture.create_from_image(img)
		"qblock_used":
			var img := _make_canvas(24, 24, Color("#291002"))
			_rect(img, 2, 2, 20, 20, Color("#92400e"))
			_rect(img, 4, 4, 2, 2, Color("#451a03"))
			_rect(img, 18, 4, 2, 2, Color("#451a03"))
			_rect(img, 4, 18, 2, 2, Color("#451a03"))
			_rect(img, 18, 18, 2, 2, Color("#451a03"))
			return ImageTexture.create_from_image(img)
		"pipe_top":
			var img := _make_canvas(46, 20, Color("#0b2c0b"))
			_rect(img, 2, 2, 42, 16, Color("#22c55e"))
			_rect(img, 5, 2, 7, 16, Color("#86efac"))
			_rect(img, 14, 2, 3, 16, Color("#bbf7d0"))
			_rect(img, 30, 2, 14, 16, Color("#15803d"))
			return ImageTexture.create_from_image(img)
		"pipe_body":
			var img := _make_canvas(40, 24, Color("#0b2c0b"))
			_rect(img, 2, 0, 36, 24, Color("#22c55e"))
			_rect(img, 5, 0, 6, 24, Color("#86efac"))
			_rect(img, 13, 0, 2, 24, Color("#bbf7d0"))
			_rect(img, 27, 0, 11, 24, Color("#15803d"))
			return ImageTexture.create_from_image(img)
		"cloud":
			var img := _make_canvas(64, 32, Color(0, 0, 0, 0))
			_rect(img, 8, 15, 48, 14, Color("#cbd5e1"))
			_rect(img, 10, 12, 44, 15, Color("#ffffff"))
			_rect(img, 18, 6, 28, 12, Color("#ffffff"))
			_rect(img, 24, 2, 16, 8, Color("#ffffff"))
			_rect(img, 22, 14, 3, 5, Color("#64748b"))
			_rect(img, 38, 14, 3, 5, Color("#64748b"))
			return ImageTexture.create_from_image(img)
		"hill":
			var img := _make_canvas(112, 56, Color(0, 0, 0, 0))
			for y: int in range(56):
				var half_w: int = int((float(y) / 56.0) * 54.0) + 4
				var x_start: int = 56 - half_w
				_rect(img, x_start, y, half_w * 2, 1, Color("#15803d"))
				if half_w > 6:
					_rect(img, x_start + 3, y, half_w * 2 - 6, 1, Color("#22c55e"))
			_rect(img, 45, 22, 4, 9, Color("#14532d"))
			_rect(img, 62, 22, 4, 9, Color("#14532d"))
			return ImageTexture.create_from_image(img)
		"bush":
			var img := _make_canvas(64, 24, Color(0, 0, 0, 0))
			_rect(img, 6, 10, 52, 14, Color("#15803d"))
			_rect(img, 14, 4, 36, 14, Color("#16a34a"))
			_rect(img, 18, 6, 12, 6, Color("#4ade80"))
			_rect(img, 34, 10, 14, 6, Color("#4ade80"))
			return ImageTexture.create_from_image(img)
		"castle":
			var img := _make_canvas(96, 108, Color(0, 0, 0, 0))
			_rect(img, 8, 28, 80, 80, Color("#9ca3af"))
			for y: int in range(28, 108, 10):
				_rect(img, 8, y, 80, 1, Color("#4b5563"))
			for x: int in range(8, 86, 16):
				_rect(img, x, 16, 10, 12, Color("#9ca3af"))
			_rect(img, 24, 46, 48, 22, Color("#d1d5db"))
			_rect(img, 36, 72, 24, 36, Color("#111827"))
			return ImageTexture.create_from_image(img)
		"flag_banner":
			var img := _make_canvas(24, 18, Color(0, 0, 0, 0))
			for y: int in range(18):
				var w: int = int(absf(float(y) - 8.5) * 2.4)
				_rect(img, 24 - maxi(2, 22 - w), y, maxi(2, 22 - w), 1, Color("#22c55e"))
			_rect(img, 14, 7, 4, 4, Color("#fde047"))
			return ImageTexture.create_from_image(img)
		"spark":
			var img := _make_canvas(6, 6, Color(0, 0, 0, 0))
			_rect(img, 2, 0, 2, 6, Color("#fde047"))
			_rect(img, 0, 2, 6, 2, Color("#fde047"))
			return ImageTexture.create_from_image(img)
		_:
			var fallback := _make_canvas(16, 16, Color.MAGENTA)
			return ImageTexture.create_from_image(fallback)

static func _ground_tile(top_main: Color, top_light: Color, dirt: Color, dirt_dark: Color) -> ImageTexture:
	var img := _make_canvas(24, 24, dirt)
	_rect(img, 3, 11, 6, 5, dirt_dark)
	_rect(img, 13, 15, 7, 6, dirt_dark)
	_rect(img, 5, 19, 5, 4, dirt_dark)
	_rect(img, 0, 0, 24, 7, top_main)
	_rect(img, 0, 0, 24, 2, top_light)
	_rect(img, 4, 7, 4, 2, top_main)
	_rect(img, 15, 7, 5, 2, top_main)
	return ImageTexture.create_from_image(img)

static func _dirt_tile(dirt: Color, dirt_dark: Color) -> ImageTexture:
	var img := _make_canvas(24, 24, dirt)
	_rect(img, 2, 4, 6, 5, dirt_dark)
	_rect(img, 13, 8, 7, 6, dirt_dark)
	_rect(img, 5, 15, 6, 5, dirt_dark)
	_rect(img, 16, 17, 5, 5, dirt_dark)
	return ImageTexture.create_from_image(img)

static func _brick_tile(main: Color, light: Color, dark: Color) -> ImageTexture:
	var img := _make_canvas(24, 24, dark)
	_rect(img, 1, 1, 10, 10, main)
	_rect(img, 13, 1, 10, 10, main)
	_rect(img, 1, 13, 5, 10, main)
	_rect(img, 8, 13, 10, 10, main)
	_rect(img, 20, 13, 3, 10, main)
	_rect(img, 1, 1, 10, 1, light)
	_rect(img, 13, 1, 10, 1, light)
	_rect(img, 8, 13, 10, 1, light)
	return ImageTexture.create_from_image(img)
