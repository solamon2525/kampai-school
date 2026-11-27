class_name PixelArt
extends RefCounted

static var _cache: Dictionary = {}

static func get_tex(key: String) -> ImageTexture:
	if _cache.has(key):
		return _cache[key] as ImageTexture
	var tex: ImageTexture = _build(key)
	_cache[key] = tex
	return tex

static func make_frames(anim_map: Dictionary, fps: float = 7.0) -> SpriteFrames:
	var sf := SpriteFrames.new()
	if sf.has_animation("default"):
		sf.remove_animation("default")
	for anim_name: String in anim_map.keys():
		sf.add_animation(anim_name)
		sf.set_animation_speed(anim_name, fps)
		sf.set_animation_loop(anim_name, true)
		var keys: Array = anim_map[anim_name]
		for k: Variant in keys:
			sf.add_frame(anim_name, get_tex(str(k)))
	return sf

static func _from_grid(grid: Array[String], pal: Dictionary, px_scale: int = 2) -> ImageTexture:
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

static func _hero_pal(hero_id: String) -> Dictionary:
	match hero_id:
		"knight":
			return {"K": Color("#0f172a"), "B": Color("#0ea5e9"), "D": Color("#0369a1"), "I": Color("#94a3b8"), "Y": Color("#fde047"), "G": Color("#f59e0b"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#e2e8f0")}
		"ranger":
			return {"K": Color("#0f172a"), "B": Color("#16a34a"), "D": Color("#14532d"), "I": Color("#22c55e"), "Y": Color("#fef08a"), "G": Color("#854d0e"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#86efac")}
		"inventor":
			return {"K": Color("#0f172a"), "B": Color("#7c3aed"), "D": Color("#4c1d95"), "I": Color("#d97706"), "Y": Color("#38bdf8"), "G": Color("#facc15"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#f472b6")}
		"alchemist":
			return {"K": Color("#0f172a"), "B": Color("#10b981"), "D": Color("#065f46"), "I": Color("#059669"), "Y": Color("#a7f3d0"), "G": Color("#34d399"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#6ee7b7")}
		"berserker":
			return {"K": Color("#0f172a"), "B": Color("#dc2626"), "D": Color("#7f1d1d"), "I": Color("#991b1b"), "Y": Color("#fb923c"), "G": Color("#fde047"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#fca5a5")}
		"chronomancer":
			return {"K": Color("#0f172a"), "B": Color("#312e81"), "D": Color("#1e1b4b"), "I": Color("#6366f1"), "Y": Color("#22d3ee"), "G": Color("#facc15"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#a5f3fc")}
		_:
			return {"K": Color("#0f172a"), "B": Color("#2563eb"), "D": Color("#1e3a8a"), "I": Color("#4338ca"), "Y": Color("#facc15"), "G": Color("#f59e0b"), "S": Color("#fed7aa"), "W": Color("#ffffff"), "C": Color("#38bdf8")}

static func _build(key: String) -> ImageTexture:
	if key.begins_with("hero_"):
		var parts: PackedStringArray = key.split("_")
		var hid: String = "mage"
		var pose: String = "idle_0"
		if parts.size() >= 4:
			hid = parts[1]
			pose = parts[2] + "_" + parts[3]
		elif parts.size() == 3:
			pose = parts[1] + "_" + parts[2]
		var pal: Dictionary = _hero_pal(hid)
		if hid == "knight" or hid == "berserker":
			# Armored horned / plumed helm silhouette
			match pose:
				"idle_0":
					return _from_grid([
						"....K......K....",
						"...KIKKKKKKIK...",
						"...KIIIIIIIIK...",
						"...KIYYYYYYIK...",
						"...KISWKKWSIK...",
						"...KIIIIIIIIK...",
						"..KKDBBBBBBDKK..",
						".KYYDBBBBBBDYYK.",
						".KYYBBBBBBBBYYK.",
						"..KKBBBBBBBBKK..",
						"...KDBBKKBBDK...",
						"...KDDK..KDDK...",
						"...KKK....KKK...",
						"................",
					], pal, 2)
				"idle_1":
					return _from_grid([
						"................",
						"....K......K....",
						"...KIKKKKKKIK...",
						"...KIIIIIIIIK...",
						"...KIYYYYYYIK...",
						"...KISWKKWSIK...",
						"...KIIIIIIIIK...",
						"..KKDBBBBBBDKK..",
						".KYYDBBBBBBDYYK.",
						".KYYBBBBBBBBYYK.",
						"..KKBBBBBBBBKK..",
						"...KDDK..KDDK...",
						"...KKK....KKK...",
						"................",
					], pal, 2)
				"run_0":
					return _from_grid([
						"...K......K.....",
						"..KIKKKKKKIK....",
						"..KIIIIIIIIK....",
						"..KIYYYYYYIK....",
						"..KISWKKWSIK....",
						"..KIIIIIIIIK....",
						".KKDBBBBBBDKK...",
						"KYYDBBBBBBDYYK..",
						".KKBBBBBBBBKK...",
						"..KBBBK..KBBK...",
						".KDDK......KDDK.",
						".KKK........KKK.",
						"................",
						"................",
					], pal, 2)
				_:
					return _from_grid([
						"....K......K....",
						"...KIKKKKKKIK...",
						"...KIIIIIIIIK...",
						"...KIYYYYYYIK...",
						"...KISWKKWSIK...",
						"...KIIIIIIIIK...",
						"..KKDBBBBBBDKK..",
						".KYYDBBBBBBDYYK.",
						"..KKBBBBBBBBKK..",
						"....KBBKKBBK....",
						"....KDDKKDDK....",
						"....KKK..KKK....",
						"................",
						"................",
					], pal, 2)

		match pose:
			"idle_0":
				return _from_grid([
					".......KK.......",
					"......KIIK......",
					".....KIYYIK.....",
					"....KIIIIIIK....",
					"...KIIIIIIIIK...",
					"..KYYYYYYYYYYK..",
					".KKKKKSSSSKKKKK.",
					"....KSSKKSSK....",
					"....KSSSSSSK....",
					"...KDBBBBBBDK...",
					"..KDBBBYYBBBDK..",
					"..KDBBBBBBBBDKYK",
					"...KBBBBBBBBKGY.",
					"...KDBBKKBBDK.K.",
					"...KDDK..KDDK...",
					"...KKK....KKK...",
				], pal, 2)
			"idle_1":
				return _from_grid([
					"................",
					".......KK.......",
					"......KIIK......",
					".....KIYYIK.....",
					"....KIIIIIIK....",
					"...KIIIIIIIIK...",
					"..KYYYYYYYYYYK..",
					".KKKKKSSSSKKKKK.",
					"....KSSKKSSK....",
					"....KSSSSSSK....",
					"...KDBBBBBBDK.YK",
					"..KDBBBYYBBBDKGY",
					"..KDBBBBBBBBDKK.",
					"...KBBBBBBBBK...",
					"...KDDK..KDDK...",
					"...KKK....KKK...",
				], pal, 2)
			"run_0":
				return _from_grid([
					"......KK........",
					".....KIIK.......",
					"....KIYYIK......",
					"...KIIIIIIK.....",
					"..KIIIIIIIIK....",
					".KYYYYYYYYYYK...",
					"KKKKKSSSSKKKKK..",
					"...KSSKKSSK.....",
					"...KSSSSSSK.....",
					"..KDBBBBBBDK....",
					".KDBBBYYBBBDKYK.",
					"..KBBBBBBBBKGY..",
					"..KBBBK..KBBK...",
					".KDDK......KDDK.",
					".KKK........KKK.",
					"................",
				], pal, 2)
			_:
				return _from_grid([
					".......KK.......",
					"......KIIK......",
					".....KIYYIK.....",
					"....KIIIIIIK....",
					"...KIIIIIIIIK...",
					"..KYYYYYYYYYYK..",
					".KKKKKSSSSKKKKK.",
					"....KSSKKSSK....",
					"....KSSSSSSK....",
					"...KDBBBBBBDK...",
					"..KDBBBYYBBBDKYK",
					"...KBBBBBBBBKGY.",
					"....KBBKKBBK.K..",
					"....KDDKKDDK....",
					"....KKK..KKK....",
					"................",
				], pal, 2)

	match key:
		"tesla_coil":
			return _from_grid([
				"..KKKK..",
				".KCCCCK.",
				"KCWWWWCK",
				".KCCCCK.",
				"..KYYK..",
				"..KDDK..",
				".KDDDDK.",
				"KKKKKKKK",
			], {"K": Color("#0f172a"), "C": Color("#38bdf8"), "W": Color("#ffffff"), "Y": Color("#facc15"), "D": Color("#475569")}, 2)
		"slime_0":
			var p := {"K": Color("#0f172a"), "C": Color("#38bdf8"), "L": Color("#bae6fd"), "D": Color("#0284c7"), "W": Color("#ffffff")}
			return _from_grid(["....KKKKKK....","..KKCCCCCCKK..",".KCLLCCCCCCCK.","KCLWWCCCCCCCCK","KCCWKCCCCCCWKK","KCCCKCCCCCCCK.","KCCCCCCCCCCDK.","KCCDDDDDDDDDK.",".KKKKKKKKKKK.."], p, 2)
		"slime_1":
			var p2 := {"K": Color("#0f172a"), "C": Color("#38bdf8"), "L": Color("#bae6fd"), "D": Color("#0284c7"), "W": Color("#ffffff")}
			return _from_grid(["..............","...KKKKKKKK...",".KKCLLCCCCCKK.","KCCLWWCCCCCCCK","KCCCWKCCCCWKCK","KCCCCCCCCCCCDK","KCCDDDDDDDDDDK",".KKKKKKKKKKKK.",".............."], p2, 2)
		"bat_0":
			var bp := {"K": Color("#0f172a"), "P": Color("#a855f7"), "L": Color("#d8b4fe"), "D": Color("#6b21a8"), "R": Color("#f43f5e")}
			return _from_grid(["K............K","KPK........KPK","KPPKK.KK.KKPPK","KPPDPPPPPPDppK".to_upper().substr(0,14),".KDDPRPPPRDDK.","..KPPPPPPPPK..","...KDDDDDDK...","....KK..KK...."], bp, 2)
		"bat_1":
			var bp2 := {"K": Color("#0f172a"), "P": Color("#a855f7"), "L": Color("#d8b4fe"), "D": Color("#6b21a8"), "R": Color("#f43f5e")}
			return _from_grid(["....KK..KK....","...KPPPPPPK...","..KPPRPPPRPK..",".KDDPPPPPPDDK.","KPPKDDDDDDKPPK","KPK........KPK","KK..........KK",".............."], bp2, 2)
		"golem_0":
			var gp := {"K": Color("#0f172a"), "G": Color("#f59e0b"), "L": Color("#fde047"), "D": Color("#92400e"), "R": Color("#ef4444")}
			return _from_grid(["...KKKKKKKK...","..KGGGGGGGGK..",".KGGLLGGLLGGK.",".KGRRGGGGGRGK.","KKGGGGGGGGGGKK","KDDGGGGGGGGDDK","KDDGDDDDDDGDDK","KDDKDDDDDDKDDK",".KK.KDDDDK.KK.","....KDDKDDK...","....KKK.KKK..."], gp, 2)
		"golem_1":
			var gp2 := {"K": Color("#0f172a"), "G": Color("#f59e0b"), "L": Color("#fde047"), "D": Color("#92400e"), "R": Color("#ef4444")}
			return _from_grid(["...KKKKKKKK...","..KGGGGGGGGK..",".KGGLLGGLLGGK.",".KGRRGGGGGRGK.","KKGGGGGGGGGGKK","KDDGGGGGGGGDDK","KDDGDDDDDDGDDK",".KK.KDDDDK.KK.","...KDDKKDDK...","...KKK..KKK...",".............."], gp2, 2)
		"knight_0":
			var kp := {"K": Color("#0f172a"), "R": Color("#f43f5e"), "L": Color("#fda4af"), "D": Color("#9f1239"), "Y": Color("#fde047")}
			return _from_grid([".K..........K.","KRK.KKKKKK.KRK",".KKRRRRRRRRKK.","..KRRRRRRRRK..","..KRYYKKYYRK..","..KRRRRRRRRK..",".KDRRRRRRRRDK.","KDRRDDDDDDRRDK",".KK.KDDDDK.KK.","....KDDKDDK...","....KKK.KKK..."], kp, 2)
		"knight_1":
			var kp2 := {"K": Color("#0f172a"), "R": Color("#f43f5e"), "L": Color("#fda4af"), "D": Color("#9f1239"), "Y": Color("#fde047")}
			return _from_grid([".K..........K.","KRK.KKKKKK.KRK",".KKRRRRRRRRKK.","..KRRRRRRRRK..","..KRYYKKYYRK..","..KRRRRRRRRK..",".KDRRRRRRRRDK.",".KKRDDDDDDRKK.","...KDDDDDDK...","...KDDKKDDK...","...KKK..KKK..."], kp2, 2)
		"boss_0":
			var bsp := {"K": Color("#0f172a"), "Y": Color("#facc15"), "O": Color("#f97316"), "D": Color("#9a3412"), "R": Color("#ef4444"), "W": Color("#ffffff")}
			return _from_grid(["..KY......YK..","..KYY.KK.YYK..","...KYYYYYYK...",".KKOOOOOOOOOKK".substr(0,14),"KOOYYOOOOYYOOK","KOOWROOOORWOOK","KOOOOOOOOOOOOK","KOOYYYYYYYYOOK","KDDDDDDDDDDDDK",".KDDDKKKKDDDK.",".KDDK....KDDK.",".KKK......KKK."], bsp, 3)
		"boss_1":
			var bsp2 := {"K": Color("#0f172a"), "Y": Color("#facc15"), "O": Color("#f97316"), "D": Color("#9a3412"), "R": Color("#ef4444"), "W": Color("#ffffff")}
			return _from_grid(["..............","..KY......YK..","..KYY.KK.YYK..","...KYYYYYYK...",".KKOOOOOOOOOKK".substr(0,14),"KOOYYOOOOYYOOK","KOOWROOOORWOOK","KOOOOOOOOOOOOK","KOOYYYYYYYYOOK","KDDDDDDDDDDDDK","..KDDKKKKDDK..","..KKK....KKK.."], bsp2, 3)
		"chest_0":
			return _from_grid([".KKKKKKKKKK.","KYYYYYYYYYYK","KYBBBBBBBBYK","KYBBYYYYBBYK","KYYYYWWYYYYK","KYBBYYYYBBYK","KYBBBBBBBBYK","KYYYYYYYYYYK",".KKKKKKKKKK."], {"K": Color("#0f172a"), "Y": Color("#facc15"), "B": Color("#92400e"), "W": Color("#ffffff")}, 2)
		"chest_1":
			return _from_grid(["....W..W....",".KKKKKKKKKK.","KYYYYYYYYYYK","KYBBBBBBBBYK","KYYYYWWYYYYK","KYBBYYYYBBYK","KYBBBBBBBBYK","KYYYYYYYYYYK",".KKKKKKKKKK."], {"K": Color("#0f172a"), "Y": Color("#fde047"), "B": Color("#b45309"), "W": Color("#ffffff")}, 2)
		"wand_bolt":
			return _from_grid(["..WW..",".WCCW.","WCYYCW","WCYYCW",".WCCW.","..WW.."], {"W": Color("#ffffff"), "C": Color("#38bdf8"), "Y": Color("#fde047")}, 2)
		"evo_bolt":
			return _from_grid(["...WW...","..WPPW..",".WPYYPW.","WPYWWYPW","WPYWWYPW",".WPYYPW.","..WPPW..","...WW..."], {"W": Color("#ffffff"), "P": Color("#f472b6"), "Y": Color("#fde047")}, 2)
		"pi_orb":
			return _from_grid([".KKKKK.","KYYYYYK","KYWWWYK","KYWKYWK","KYYYYYK",".KKKKK."], {"K": Color("#0f172a"), "Y": Color("#facc15"), "W": Color("#ffffff")}, 2)
		"evo_orb":
			return _from_grid([".KKKKKK.","KOOOOOOK","KOYYYYOK","KOYWWYOK","KOYYYYOK","KOOOOOOK",".KKKKKK."], {"K": Color("#0f172a"), "O": Color("#fb923c"), "Y": Color("#fde047"), "W": Color("#ffffff")}, 2)
		"boomerang":
			return _from_grid(["...KK...","..KPPK..",".KPWWPK.","KPWYYWPK","KPWYYWPK",".KPWWPK.","..KPPK..","...KK..."], {"K": Color("#0f172a"), "P": Color("#c084fc"), "W": Color("#ffffff"), "Y": Color("#fde047")}, 2)
		"evo_disc":
			return _from_grid(["...KK...","..KCCK..",".KCWWCK.","KCWYYWCK","KCWYYWCK",".KCWWCK.","..KCCK..","...KK..."], {"K": Color("#0f172a"), "C": Color("#22d3ee"), "W": Color("#ffffff"), "Y": Color("#fde047")}, 3)
		"boss_shot":
			return _from_grid([".KKKK.","KRRRRK","KRWWKR","KRRRRK",".KKKK."], {"K": Color("#0f172a"), "R": Color("#ef4444"), "W": Color("#fef08a")}, 2)
		"xp_gem_small":
			return _from_grid(["..KK..",".KCCK.","KCWWCK","KCCCCK",".KDDK.","..KK.."], {"K": Color("#0f172a"), "C": Color("#38bdf8"), "W": Color("#ffffff"), "D": Color("#0284c7")}, 2)
		"xp_gem_big":
			return _from_grid(["..KK..",".KYYK.","KYWWYK","KYYYYK",".KGGK.","..KK.."], {"K": Color("#0f172a"), "Y": Color("#facc15"), "W": Color("#ffffff"), "G": Color("#d97706")}, 3)
		"torch_0":
			return _from_grid(["...Y...","..YYO..",".YOOOY.",".OOROO.","..KKK..","..KDK..","..KDK..","..KKK.."], {"Y": Color("#fef08a"), "O": Color("#fb923c"), "R": Color("#ef4444"), "K": Color("#1e293b"), "D": Color("#64748b")}, 2)
		"torch_1":
			return _from_grid(["..Y....",".YYY...",".OYYYO.",".OOROO.","..KKK..","..KDK..","..KDK..","..KKK.."], {"Y": Color("#fef08a"), "O": Color("#fb923c"), "R": Color("#ef4444"), "K": Color("#1e293b"), "D": Color("#64748b")}, 2)
		"pillar":
			return _from_grid(["KKKKKKKK","KLLLLLLK","KCCCCCCK",".KDDDDK.",".KDYYDK.",".KDDDDK.",".KDCCDK.",".KDDDDK.","KLLLLLLK","KKKKKKKK"], {"K": Color("#0f172a"), "L": Color("#64748b"), "C": Color("#475569"), "D": Color("#334155"), "Y": Color("#38bdf8")}, 2)
		"crystal_pillar":
			return _from_grid(["...KK...","..KCCK..",".KCLCCK.","KCLWWCCK","KCLCCCDK",".KCCDDK.",".KDDDDK.","..KKKK.."], {"K": Color("#0f172a"), "C": Color("#2dd4bf"), "L": Color("#99f6e4"), "W": Color("#ffffff"), "D": Color("#0f766e")}, 2)
		"lava_pillar":
			return _from_grid(["KKKKKKKK","KRRRRRRK","KDDDDDDK",".KDOODK.",".KDYYDK.",".KDOODK.",".KDDDDK.","KRRRRRRK","KKKKKKKK"], {"K": Color("#0f172a"), "R": Color("#991b1b"), "D": Color("#450a0a"), "O": Color("#f97316"), "Y": Color("#fde047")}, 2)
		"orb_frame":
			var img := Image.create_empty(48, 48, false, Image.FORMAT_RGBA8)
			img.fill(Color(0, 0, 0, 0))
			for y: int in range(48):
				for x: int in range(48):
					var dx: float = float(x) - 23.5
					var dy: float = float(y) - 23.5
					var d: float = sqrt(dx * dx + dy * dy)
					if d <= 22.0 and d >= 18.5:
						img.set_pixel(x, y, Color("#facc15"))
					elif d < 18.5:
						img.set_pixel(x, y, Color(0.11, 0.10, 0.29, 0.92))
			return ImageTexture.create_from_image(img)
		"spark":
			var si := Image.create_empty(4, 4, false, Image.FORMAT_RGBA8)
			si.fill(Color.WHITE)
			return ImageTexture.create_from_image(si)
		"shadow":
			var sh := Image.create_empty(20, 8, false, Image.FORMAT_RGBA8)
			sh.fill(Color(0, 0, 0, 0))
			for y: int in range(8):
				for x: int in range(20):
					var nx: float = (float(x) - 9.5) / 9.5
					var ny: float = (float(y) - 3.5) / 3.5
					if nx * nx + ny * ny <= 1.0:
						sh.set_pixel(x, y, Color(0, 0, 0, 0.42))
			return ImageTexture.create_from_image(sh)
		_:
			return get_tex("spark")
