class_name ArenaEnemy
extends CharacterBody2D

signal defeated(enemy: ArenaEnemy)
signal boss_attack_requested(boss: ArenaEnemy, target_pos: Vector2)

const HIT_FLASH_SHADER: Shader = preload("res://shaders/hit_flash.gdshader")
const ARCHETYPES: Dictionary = {
	"slime": {"name": "สไลม์ตัวเลข", "hp": 22.0, "speed": 56.0, "radius": 11.0, "dmg": 8.0, "xp": 10, "score": 12, "color": Color("#38bdf8"), "frames": ["slime_0", "slime_1"]},
	"bat": {"name": "ค้างคาวลบเลข", "hp": 16.0, "speed": 88.0, "radius": 10.0, "dmg": 9.0, "xp": 14, "score": 16, "color": Color("#c084fc"), "frames": ["bat_0", "bat_1"]},
	"golem": {"name": "โกเลมสูตรคูณ", "hp": 58.0, "speed": 42.0, "radius": 14.0, "dmg": 14.0, "xp": 28, "score": 30, "color": Color("#f59e0b"), "frames": ["golem_0", "golem_1"]},
	"knight": {"name": "อัศวินตัวหาร", "hp": 82.0, "speed": 66.0, "radius": 13.0, "dmg": 15.0, "xp": 36, "score": 40, "color": Color("#f43f5e"), "frames": ["knight_0", "knight_1"]},
	"boss": {"name": "บอสสมการ", "hp": 420.0, "speed": 60.0, "radius": 20.0, "dmg": 22.0, "xp": 160, "score": 350, "color": Color("#fbbf24"), "frames": ["boss_0", "boss_1"]},
}

var enemy_type: String = "slime"
var display_name: String = "สไลม์ตัวเลข"
var boss_act: int = 0
var hp: float = 22.0
var max_hp: float = 22.0
var move_speed: float = 56.0
var hit_radius: float = 11.0
var contact_dmg: float = 8.0
var xp_reward: int = 10
var score_reward: int = 12
var burst_color: Color = Color("#38bdf8")
var is_boss: bool = false
var alive: bool = true
var orb_cd: float = 0.0
var slow_timer: float = 0.0
var target_hero: Node2D

var _anim: AnimatedSprite2D
var _mat: ShaderMaterial
var _hp_fill: ColorRect
var _flash: float = 0.0
var _boss_atk_cd: float = 3.8

func setup(p_type: String, act_hp_mult: float, act_spd_mult: float, p_boss: bool = false, p_custom_name: String = "", p_act_idx: int = 0) -> void:
	enemy_type = p_type
	is_boss = p_boss
	boss_act = p_act_idx
	var def: Dictionary = ARCHETYPES.get(p_type, ARCHETYPES["slime"])
	display_name = p_custom_name if not p_custom_name.is_empty() else str(def["name"])
	max_hp = float(def["hp"]) * act_hp_mult * ((1.0 + float(p_act_idx) * 0.45) if p_boss else 1.0)
	hp = max_hp
	move_speed = float(def["speed"]) * act_spd_mult
	hit_radius = float(def["radius"])
	contact_dmg = float(def["dmg"])
	xp_reward = int(def["xp"])
	score_reward = int(def["score"])
	burst_color = def["color"]

func _ready() -> void:
	add_to_group("enemies")
	collision_layer = 4
	collision_mask = 1

	var sh := Sprite2D.new()
	sh.texture = PixelArt.get_tex("shadow")
	sh.position = Vector2(0, hit_radius * 0.85)
	sh.scale = Vector2(1.4, 1.2) if is_boss else Vector2(0.9, 0.9)
	add_child(sh)

	_anim = AnimatedSprite2D.new()
	var def: Dictionary = ARCHETYPES.get(enemy_type, ARCHETYPES["slime"])
	_anim.sprite_frames = PixelArt.make_frames({"move": def["frames"]}, 6.5)
	_anim.play("move")
	_mat = ShaderMaterial.new()
	_mat.shader = HIT_FLASH_SHADER
	_anim.material = _mat
	add_child(_anim)

	var col := CollisionShape2D.new()
	var circ := CircleShape2D.new()
	circ.radius = hit_radius
	col.shape = circ
	add_child(col)

	if is_boss:
		var bg := ColorRect.new()
		bg.color = Color("#0f172a")
		bg.position = Vector2(-24, -hit_radius - 12)
		bg.size = Vector2(48, 5)
		add_child(bg)
		_hp_fill = ColorRect.new()
		_hp_fill.color = Color("#ef4444")
		_hp_fill.position = Vector2(-23, -hit_radius - 11)
		_hp_fill.size = Vector2(46, 3)
		add_child(_hp_fill)

func apply_slow(sec: float) -> void:
	slow_timer = maxf(slow_timer, sec)

func _physics_process(delta: float) -> void:
	if not alive:
		return
	if orb_cd > 0.0:
		orb_cd = maxf(0.0, orb_cd - delta)
	if slow_timer > 0.0:
		slow_timer = maxf(0.0, slow_timer - delta)
		if _anim:
			_anim.modulate = Color("#67e8f9")
	elif _anim:
		_anim.modulate = Color.WHITE

	if _flash > 0.0:
		_flash = maxf(0.0, _flash - delta * 7.5)
		if _mat:
			_mat.set_shader_parameter("flash_amount", _flash)

	if target_hero == null or not is_instance_valid(target_hero):
		return
	var dir: Vector2 = target_hero.global_position - global_position
	var dist: float = dir.length()
	var eff_spd: float = move_speed * (0.6 if slow_timer > 0.0 else 1.0)
	if dist > 1.0:
		var v: Vector2 = (dir / dist) * eff_spd
		velocity = v
		if _anim:
			_anim.flip_h = v.x < 0.0
	else:
		velocity = Vector2.ZERO
	move_and_slide()

	if is_boss:
		_boss_atk_cd -= delta
		if _boss_atk_cd <= 0.0 and dist < 340.0:
			_boss_atk_cd = 4.4
			boss_attack_requested.emit(self, target_hero.global_position)

	if dist < hit_radius + 11.0 and target_hero is MathHero:
		(target_hero as MathHero).trigger_hurt(contact_dmg, display_name)
		global_position -= (dir / maxf(1.0, dist)) * 12.0

func take_damage(amount: float) -> bool:
	if not alive:
		return false
	hp -= amount
	_flash = 1.0
	if _mat:
		_mat.set_shader_parameter("flash_amount", 1.0)
	if _hp_fill:
		_hp_fill.size.x = 46.0 * clampf(hp / maxf(1.0, max_hp), 0.0, 1.0)
	if hp <= 0.0:
		alive = false
		defeated.emit(self)
		queue_free()
		return true
	return false
