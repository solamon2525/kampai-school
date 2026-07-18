(function () {
  'use strict';
  const CFG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ZONE_KEYS = ['village', 'mosswood', 'swamp', 'ruins'];
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function defaultProgress() {
    return {
      schema_version: 1,
      hero_class: null,
      hero_level: 1,
      hero_xp: 0,
      skill_points: 0,
      skill_levels: { blade: 0, heart: 0, boots: 0, crit: 0 },
      gold: 150,
      gems: 0,
      chapter: 1,
      zone: 'village',
      unlocked_zones: ['village'],
      quest: { chapter: 1, kills: 0, boss_defeated: false },
      equipment: { weapon: { code: 'training-weapon', enhance: 0, rune: null, runes: [] } },
      inventory: { moss: 0, wood: 0, slime_core: 0, swamp_ore: 0, ancient_shard: 0, rune_dust: 0, heal_potion: 0 },
      rare_items: [],
      runes: [],
      companions: [],
      active_companion: null,
      bosses: {},
      dungeons: { root_cavern: { clears: 0, best_time: null }, mist_labyrinth: { clears: 0, best_time: null } },
      play_seconds: 0,
      campaign_complete: false
    };
  }

  const state = {
    running: false, timed: false, versus: false, skillOpen: false, campOpen: false,
    score: 0, time: CFG.CHALLENGE_SECONDS, last: 0, anim: 0, rng: Math.random,
    shake: 0, activeCooldown: 0, pendingMode: 'explore', campTab: 'inventory',
    lights: [], monsters: [], projectiles: [], drops: [], particles: [], chests: [],
    keys: { up: false, down: false, left: false, right: false }, camera: { x: 0, y: 0 },
    player: {}, progress: defaultProgress(), saveVersion: 1, savePending: false,
    saveQueued: false, saveSeq: 0, eventQueue: [], saveInFlightEvents: [],
    boss: null, dungeon: null, dungeonClock: 0, companionClock: 0, vitalityClock: 0, zone: 'village', lockedToastAt: 0, playStartedAt: 0
  };

  function sanitizeProgress(raw) {
    const base = defaultProgress();
    if (!raw || raw.schema_version !== 1) return base;
    const heroClass = DATA.classes[raw.hero_class] ? raw.hero_class : null;
    const chapter = clamp(Number(raw.chapter) || 1, 1, 4);
    const zone = DATA.zones[raw.zone] ? raw.zone : 'village';
    const unlocked = Array.isArray(raw.unlocked_zones)
      ? raw.unlocked_zones.filter((z) => DATA.zones[z])
      : ['village'];
    if (!unlocked.includes('village')) unlocked.unshift('village');
    const inventory = { ...base.inventory };
    Object.keys(inventory).forEach((key) => { inventory[key] = clamp(Number(raw.inventory?.[key]) || 0, 0, 9999); });
    const legacyRune = DATA.runes[raw.equipment?.weapon?.rune] ? raw.equipment.weapon.rune : null;
    const equippedRunes = Array.isArray(raw.equipment?.weapon?.runes)
      ? raw.equipment.weapon.runes.filter((r) => DATA.runes[r]).slice(0, 2)
      : (legacyRune ? [legacyRune] : []);
    const dungeons = {};
    Object.keys(DATA.dungeons).forEach((code) => {
      dungeons[code] = {
        clears: clamp(Number(raw.dungeons?.[code]?.clears) || 0, 0, 9999),
        best_time: raw.dungeons?.[code]?.best_time == null ? null : clamp(Number(raw.dungeons[code].best_time) || 0, 1, 9999)
      };
    });
    const companions = Array.isArray(raw.companions) ? raw.companions.filter((code) => DATA.companions[code]) : [];
    return {
      ...base,
      hero_class: heroClass,
      hero_level: clamp(Number(raw.hero_level) || 1, 1, 50),
      hero_xp: clamp(Number(raw.hero_xp) || 0, 0, 10000000),
      skill_points: clamp(Number(raw.skill_points) || 0, 0, 999),
      skill_levels: { ...base.skill_levels, ...(raw.skill_levels || {}) },
      gold: clamp(Number(raw.gold) || 0, 0, 10000000),
      gems: clamp(Number(raw.gems) || 0, 0, 1000000),
      chapter, zone, unlocked_zones: unlocked,
      quest: { chapter, kills: clamp(Number(raw.quest?.kills) || 0, 0, 999), boss_defeated: !!raw.quest?.boss_defeated },
      equipment: { weapon: { ...base.equipment.weapon, ...(raw.equipment?.weapon || {}), rune: equippedRunes[0] || null, runes: equippedRunes } },
      inventory,
      rare_items: Array.isArray(raw.rare_items) ? raw.rare_items.filter((code) => DATA.rareItems[code]) : [],
      runes: Array.isArray(raw.runes) ? raw.runes.filter((r) => DATA.runes[r]) : [],
      companions,
      active_companion: companions.includes(raw.active_companion) ? raw.active_companion : null,
      bosses: raw.bosses && typeof raw.bosses === 'object' ? raw.bosses : {},
      dungeons,
      play_seconds: clamp(Number(raw.play_seconds) || 0, 0, 100000000),
      campaign_complete: !!raw.campaign_complete
    };
  }

  function currentClass() { return DATA.classes[state.progress.hero_class] || DATA.classes.swordsman; }
  function currentChapter() { return DATA.chapters[state.progress.chapter - 1]; }
  function directionVector() { return DIRS[state.player.dir] || DIRS.down; }
  function weaponRecipe() { return DATA.recipes.find((r) => r.code === state.progress.equipment.weapon.code) || DATA.rareItems[state.progress.equipment.weapon.code]; }
  function equippedRunes() { const w = state.progress.equipment.weapon; return Array.isArray(w.runes) ? w.runes : (w.rune ? [w.rune] : []); }
  function hasRune(code) { return equippedRunes().includes(code); }
  function enhanceBonus() { const level = state.progress.equipment.weapon.enhance; return Math.min(level, 5) * 2 + Math.max(0, level - 5) * 3; }
  function weaponBonus() { return (weaponRecipe()?.damage || 0) + enhanceBonus() + (hasRune('fury') ? 5 : 0); }

  function resetPlayer() {
    const cls = currentClass();
    const skills = state.progress.skill_levels;
    state.player = {
      x: CFG.MAP_WIDTH * CFG.TILE_SIZE / 2,
      y: CFG.MAP_HEIGHT * CFG.TILE_SIZE / 2 + 8,
      dir: 'down', moving: false,
      hp: cls.hp + (state.progress.hero_level - 1) * 4 + skills.heart * 12 + (hasRune('guardian') ? 18 : 0),
      maxHp: cls.hp + (state.progress.hero_level - 1) * 4 + skills.heart * 12 + (hasRune('guardian') ? 18 : 0),
      level: state.progress.hero_level,
      xp: state.progress.hero_xp,
      nextXp: xpNeeded(state.progress.hero_level),
      skillPoints: state.progress.skill_points,
      damage: cls.damage + (state.progress.hero_level - 1) * 2 + skills.blade * 3 + weaponBonus(),
      speed: cls.speed + skills.boots * 6,
      crit: CFG.PLAYER_CRIT + skills.crit * .05 + (hasRune('hunter') ? .08 : 0),
      attackTimer: 0, attackCooldown: 0, attackId: 0, invuln: 0, kills: 0,
      skills: { ...skills }
    };
  }

  function xpNeeded(level) { return Math.round(40 * Math.pow(1.32, Math.max(0, level - 1))); }
  function hash(x, y, salt) {
    let n = (x * 374761393 + y * 668265263 + salt * 69069) | 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  const riverX = (y) => Math.floor(CFG.MAP_WIDTH / 2 + Math.sin(y * .17) * 5 + Math.sin(y * .047) * 3);
  const isBridge = (x, y) => y >= 46 && y <= 50 && Math.abs(x - riverX(y)) <= 5;
  const isPath = (x, y) => Math.abs(x - (28 + Math.round(Math.sin(y * .11) * 2))) <= 1 || Math.abs(y - (48 + Math.round(Math.sin(x * .08) * 2))) <= 1;
  function zoneAt(px, py) {
    const tx = px / CFG.TILE_SIZE, ty = py / CFG.TILE_SIZE;
    if (Math.hypot(tx - CFG.MAP_WIDTH / 2, ty - CFG.MAP_HEIGHT / 2) <= 12) return 'village';
    if (tx < CFG.MAP_WIDTH / 2) return 'mosswood';
    if (ty > CFG.MAP_HEIGHT / 2) return 'swamp';
    return 'ruins';
  }
  function tileType(x, y) {
    if (x < 0 || y < 0 || x >= CFG.MAP_WIDTH || y >= CFG.MAP_HEIGHT) return 'tree';
    if (isBridge(x, y)) return 'bridge';
    if (Math.abs(x - riverX(y)) <= 3) return 'water';
    if (isPath(x, y)) return 'path';
    if (hash(x, y, 7) < .17 && Math.hypot(x - CFG.MAP_WIDTH / 2, y - CFG.MAP_HEIGHT / 2) > 6) return 'tree';
    return 'grass';
  }
  function solidAt(px, py) {
    const type = tileType(Math.floor(px / CFG.TILE_SIZE), Math.floor(py / CFG.TILE_SIZE));
    return type === 'water' || type === 'tree';
  }
  function canMove(nx, ny, radius) {
    const r = radius || 5;
    return !solidAt(nx - r, ny - r) && !solidAt(nx + r, ny - r) && !solidAt(nx - r, ny + r) && !solidAt(nx + r, ny + r);
  }
  function randomOpenTile(zone, minDistance) {
    for (let tries = 0; tries < 1200; tries++) {
      const x = 3 + Math.floor(state.rng() * (CFG.MAP_WIDTH - 6));
      const y = 3 + Math.floor(state.rng() * (CFG.MAP_HEIGHT - 6));
      const type = tileType(x, y), px = x * CFG.TILE_SIZE + 8, py = y * CFG.TILE_SIZE + 8;
      if ((type !== 'grass' && type !== 'path') || (zone && zoneAt(px, py) !== zone)) continue;
      if (minDistance && Math.hypot(px - state.player.x, py - state.player.y) < minDistance) continue;
      return { x: px, y: py };
    }
    return { x: CFG.MAP_WIDTH * 8, y: CFG.MAP_HEIGHT * 8 };
  }
  function resize() {
    const pixelScale = innerWidth < 700 ? 2 : 3;
    canvas.width = Math.ceil(innerWidth / pixelScale); canvas.height = Math.ceil(innerHeight / pixelScale);
    ctx.imageSmoothingEnabled = false;
  }

  function monsterTypeForZone(zone) {
    const roll = state.rng();
    if (zone === 'village') return roll < .75 ? 'slime' : 'boar';
    if (zone === 'mosswood') return roll < .38 ? 'slime' : roll < .72 ? 'boar' : 'thornling';
    if (zone === 'swamp') return roll < .28 ? 'slime' : roll < .58 ? 'shaman' : 'mireling';
    return roll < .3 ? 'boar' : roll < .6 ? 'shaman' : 'sentinel';
  }
  function spawnMonster(existing, requestedZone, requestedType) {
    const zone = requestedZone || ZONE_KEYS[Math.floor(state.rng() * ZONE_KEYS.length)];
    const p = randomOpenTile(zone, 70), zoneLevel = DATA.zones[zone].chapter;
    const level = clamp(zoneLevel + Math.floor((state.player.level - 1) / 2) + Math.floor(state.rng() * 2), 1, 15);
    const type = requestedType || monsterTypeForZone(zone), base = DATA.monsters[type], monster = existing || {};
    Object.assign(monster, {
      x: p.x, y: p.y, zone, type, level, maxHp: base.hp + level * 8, hp: base.hp + level * 8,
      damage: base.damage + Math.floor(level * 1.5), speed: base.speed + level * .7,
      xp: base.xp + level * 4, cooldown: state.rng() * 1.5, charge: 0, vx: 0, vy: 0,
      invuln: 0, hitAttack: -1, dead: false, respawn: 0, flash: 0, boss: false, dungeon: false
    });
    if (!existing) state.monsters.push(monster);
  }
  function spawnLight() { const p = randomOpenTile(null, 35); state.lights.push({ x: p.x, y: p.y, phase: state.rng() * 8 }); }
  function spawnChest() { const zone = ZONE_KEYS[Math.floor(state.rng() * ZONE_KEYS.length)], p = randomOpenTile(zone, 80); state.chests.push({ x: p.x, y: p.y, zone, open: false }); }
  function resetWorld(rng) {
    state.rng = rng || Math.random; state.score = 0; state.time = CFG.CHALLENGE_SECONDS;
    state.lights = []; state.monsters = []; state.projectiles = []; state.drops = []; state.particles = []; state.chests = []; state.boss = null; state.dungeon = null;
    resetPlayer();
    for (let i = 0; i < CFG.LIGHT_COUNT; i++) spawnLight();
    for (let i = 0; i < CFG.MONSTER_COUNT; i++) spawnMonster(null, ZONE_KEYS[i % ZONE_KEYS.length]);
    for (let i = 0; i < CFG.CHEST_COUNT; i++) spawnChest();
    const training = state.monsters.find((m) => m.zone === 'village');
    if (training) Object.assign(training, { x: state.player.x + 24, y: state.player.y, type: 'slime', level: 1, hp: 26, maxHp: 26, damage: 5, speed: 20, xp: 18 });
    state.zone = 'village'; updateHud();
    if (!state.progress.quest.boss_defeated && state.progress.quest.kills >= currentChapter().quota) spawnBoss();
  }

  function drawGround(type, sx, sy, tx, ty, now) {
    const s = CFG.TILE_SIZE, zone = zoneAt(tx * s + 8, ty * s + 8), zoneData = DATA.zones[zone];
    if (type === 'water') {
      const water = zone === 'swamp' ? ['#557f70', '#638f76', '#789d78'] : DATA.water;
      ctx.fillStyle = water[(tx + ty) % water.length]; ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = water[2]; const wave = ((now / 260 + tx * 3 + ty) | 0) % 8;
      ctx.fillRect(sx + wave, sy + 5, 5, 1); ctx.fillRect(sx + ((wave + 7) % 12), sy + 12, 4, 1); return;
    }
    if (type === 'bridge') {
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(sx, sy, s, s); ctx.fillStyle = '#c08a4d'; ctx.fillRect(sx, sy + 2, s, 5); ctx.fillRect(sx, sy + 9, s, 5); ctx.fillStyle = '#5d3b27'; ctx.fillRect(sx, sy, 1, s); return;
    }
    if (type === 'path') {
      ctx.fillStyle = DATA.path[(tx + ty) & 1]; ctx.fillRect(sx, sy, s, s); ctx.fillStyle = '#927047'; if (hash(tx, ty, 2) > .5) ctx.fillRect(sx + 4, sy + 9, 2, 1); return;
    }
    ctx.fillStyle = zoneData.grass[(tx * 3 + ty) % zoneData.grass.length]; ctx.fillRect(sx, sy, s, s);
    if (hash(tx, ty, 11) < .22) { ctx.fillStyle = zone === 'ruins' ? '#8e998f' : DATA.deepGrass; ctx.fillRect(sx + 3, sy + 11, 1, 3); ctx.fillRect(sx + 5, sy + 10, 1, 4); }
    if (hash(tx, ty, 19) < .09) { ctx.fillStyle = zoneData.accent; ctx.fillRect(sx + 8, sy + 7, 2, 2); ctx.fillStyle = '#256d35'; ctx.fillRect(sx + 9, sy + 9, 1, 3); }
    if (zone === 'ruins' && hash(tx, ty, 31) < .045) { ctx.fillStyle = '#8a918b'; ctx.fillRect(sx + 2, sy + 3, 11, 9); ctx.fillStyle = '#59645d'; ctx.fillRect(sx + 3, sy + 4, 9, 1); }
  }
  function drawTree(sx, sy, tx, ty) {
    const zone = zoneAt(tx * 16 + 8, ty * 16 + 8), leaves = zone === 'swamp' ? ['#426b45', '#4d7650', '#587f55'] : DATA.treeLeaf;
    ctx.fillStyle = DATA.treeDark; ctx.fillRect(sx + 2, sy + 5, 14, 11); ctx.fillStyle = DATA.trunk[0]; ctx.fillRect(sx + 7, sy + 10, 5, 8);
    ctx.fillStyle = DATA.trunk[1]; ctx.fillRect(sx + 8, sy + 10, 2, 8); ctx.fillStyle = leaves[(tx + ty) % 3]; ctx.fillRect(sx + 1, sy + 1, 14, 10);
    ctx.fillRect(sx + 4, sy - 3, 8, 6); ctx.fillStyle = zone === 'ruins' ? '#a89bc2' : '#62ad55'; ctx.fillRect(sx + 4, sy, 3, 2);
  }
  function drawHero(x, y) {
    const p = state.player, cls = currentClass(), h = DATA.hero, step = p.moving ? ((state.anim / 110) | 0) % 2 : 0;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (p.invuln > 0 && ((p.invuln * 12) | 0) % 2) ctx.globalAlpha = .35;
    ctx.fillStyle = '#173d2e66'; ctx.fillRect(-6, 6, 12, 4); ctx.fillStyle = h.cape; if (p.dir === 'up') ctx.fillRect(-6, -2, 12, 10); else ctx.fillRect(p.dir === 'left' ? 2 : -6, -1, 4, 9);
    ctx.fillStyle = h.boot; if (p.dir === 'left' || p.dir === 'right') { ctx.fillRect(-4 + step * 4, 6, 4, 5); ctx.fillRect(1 - step * 4, 5, 4, 5); } else { ctx.fillRect(-5, 5 + step, 4, 5); ctx.fillRect(1, 6 - step, 4, 5); }
    ctx.fillStyle = cls.color; ctx.fillRect(-5, -3, 10, 10); ctx.fillStyle = '#f2d34f'; ctx.fillRect(-1, -2, 2, 5); ctx.fillStyle = h.skin; ctx.fillRect(-5, -11, 10, 8); ctx.fillStyle = h.hair; ctx.fillRect(-5, -12, 10, 4); ctx.fillRect(-6, -10, 2, 4);
    if (p.dir !== 'up') { ctx.fillStyle = '#242126'; if (p.dir === 'left') ctx.fillRect(-5, -7, 1, 1); else if (p.dir === 'right') ctx.fillRect(4, -7, 1, 1); else { ctx.fillRect(-3, -7, 1, 1); ctx.fillRect(2, -7, 1, 1); } }
    ctx.restore(); if (p.attackTimer > 0 && state.progress.hero_class === 'swordsman') drawSlash(x, y);
  }
  function drawSlash(x, y) {
    const p = state.player, progress = 1 - p.attackTimer / .18, dir = directionVector(); ctx.save(); ctx.translate(Math.round(x + dir[0] * 12), Math.round(y + dir[1] * 12));
    ctx.rotate(Math.atan2(dir[1], dir[0]) + (progress - .5) * 1.8); ctx.fillStyle = '#fff5bd'; ctx.fillRect(3, -2, 19, 4); ctx.fillStyle = DATA.hero.sword; ctx.fillRect(7, -1, 18, 2); ctx.fillStyle = '#70472c'; ctx.fillRect(0, -3, 7, 6); ctx.restore();
  }
  function drawMonster(m, x, y) {
    if (m.boss) { drawBoss(m, x, y); return; }
    const d = DATA.monsters[m.type]; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (m.flash > 0) ctx.globalAlpha = ((m.flash * 20) | 0) % 2 ? .35 : 1;
    ctx.fillStyle = '#173d2e66'; ctx.fillRect(-7, 6, 14, 3);
    if (m.type === 'slime') { const bounce = ((state.anim / 180 + m.x) | 0) % 2; ctx.fillStyle = d.dark; ctx.fillRect(-7, -3 + bounce, 14, 10 - bounce); ctx.fillStyle = d.color; ctx.fillRect(-5, -6 + bounce, 10, 9); ctx.fillStyle = '#fff'; ctx.fillRect(-4, -2 + bounce, 3, 3); ctx.fillRect(2, -2 + bounce, 3, 3); ctx.fillStyle = '#18231b'; ctx.fillRect(-3, -1 + bounce, 1, 1); ctx.fillRect(3, -1 + bounce, 1, 1); }
    else if (m.type === 'boar') { ctx.fillStyle = d.dark; ctx.fillRect(-8, -5, 16, 12); ctx.fillStyle = d.color; ctx.fillRect(-7, -7, 12, 12); ctx.fillStyle = '#f0d2a0'; ctx.fillRect(4, -2, 6, 5); ctx.fillStyle = '#fff5bd'; ctx.fillRect(7, 2, 3, 3); ctx.fillStyle = '#251c19'; ctx.fillRect(1, -4, 2, 2); }
    else if (m.type === 'thornling') { ctx.fillStyle = d.dark; ctx.fillRect(-6, -5, 12, 13); ctx.fillStyle = d.color; ctx.fillRect(-9, -9, 6, 8); ctx.fillRect(3, -9, 6, 8); ctx.fillRect(-5, -12, 10, 8); ctx.fillStyle = '#f4f0b3'; ctx.fillRect(-3, -5, 2, 2); ctx.fillRect(2, -5, 2, 2); ctx.fillStyle = '#315f32'; ctx.fillRect(-10, -12, 3, 3); ctx.fillRect(7, -12, 3, 3); }
    else if (m.type === 'mireling') { ctx.fillStyle = d.dark; ctx.fillRect(-9, 0, 18, 8); ctx.fillStyle = d.color; ctx.fillRect(-7, -7, 14, 10); ctx.fillRect(-10, 3, 5, 5); ctx.fillRect(5, 3, 5, 5); ctx.fillStyle = '#fff'; ctx.fillRect(-5, -6, 4, 4); ctx.fillRect(2, -6, 4, 4); ctx.fillStyle = '#26331f'; ctx.fillRect(-4, -5, 2, 2); ctx.fillRect(3, -5, 2, 2); }
    else if (m.type === 'sentinel') { ctx.fillStyle = d.dark; ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = d.color; ctx.fillRect(-6, -12, 12, 19); ctx.fillStyle = '#b9a5ff'; ctx.fillRect(-2, -8, 4, 8); ctx.fillStyle = '#fff'; ctx.fillRect(-4, -9, 2, 2); ctx.fillRect(3, -9, 2, 2); ctx.fillStyle = '#4d5263'; ctx.fillRect(-10, -4, 4, 12); ctx.fillRect(6, -4, 4, 12); }
    else { ctx.fillStyle = d.dark; ctx.fillRect(-6, -3, 12, 11); ctx.fillStyle = '#e6c996'; ctx.fillRect(-4, -7, 8, 7); ctx.fillStyle = d.color; ctx.fillRect(-8, -11, 16, 5); ctx.fillRect(-5, -14, 10, 5); ctx.fillStyle = '#fff'; ctx.fillRect(-3, -5, 2, 2); ctx.fillRect(2, -5, 2, 2); ctx.fillStyle = '#6e412d'; ctx.fillRect(7, -4, 2, 13); }
    ctx.restore(); drawHealthBar(m, x, y, 18);
  }
  function drawBoss(m, x, y) {
    const d = DATA.bosses[m.bossCode]; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (m.flash > 0) ctx.globalAlpha = ((m.flash * 20) | 0) % 2 ? .35 : 1;
    ctx.fillStyle = '#102a2077'; ctx.fillRect(-15, 12, 30, 6); ctx.fillStyle = d.dark; ctx.fillRect(-14, -10, 28, 23); ctx.fillStyle = d.color; ctx.fillRect(-11, -16, 22, 23); ctx.fillRect(-16, -8, 7, 15); ctx.fillRect(9, -8, 7, 15); ctx.fillStyle = '#fff5bd'; ctx.fillRect(-7, -8, 4, 4); ctx.fillRect(4, -8, 4, 4); ctx.fillStyle = '#251c19'; ctx.fillRect(-6, -7, 2, 2); ctx.fillRect(5, -7, 2, 2); ctx.restore();
    drawHealthBar(m, x, y, 34);
  }
  function drawHealthBar(m, x, y, width) {
    const ratio = Math.max(0, m.hp / m.maxHp); ctx.fillStyle = '#102a20'; ctx.fillRect(Math.round(x - width / 2), Math.round(y - (m.boss ? 25 : 18)), width, 4); ctx.fillStyle = m.boss ? '#b98cff' : '#d9493f'; ctx.fillRect(Math.round(x - width / 2 + 1), Math.round(y - (m.boss ? 24 : 17)), Math.floor((width - 2) * ratio), 2); ctx.fillStyle = '#fff5bd'; ctx.font = '5px Sarabun'; ctx.textAlign = 'center'; ctx.fillText(m.boss ? DATA.bosses[m.bossCode].name : 'LV' + m.level, Math.round(x), Math.round(y - (m.boss ? 28 : 20)));
  }
  function drawChest(c, x, y) { ctx.fillStyle = '#4b2e26'; ctx.fillRect(x - 8, y - 6, 16, 13); ctx.fillStyle = c.open ? '#6e4a35' : '#b9782b'; ctx.fillRect(x - 7, y - 5, 14, c.open ? 4 : 10); ctx.fillStyle = '#f2d34f'; ctx.fillRect(x - 1, y - 3, 3, 5); }
  function drawLight(l, now) { const x = l.x - state.camera.x, y = l.y - state.camera.y + Math.sin(now / 240 + l.phase) * 2; ctx.fillStyle = '#fff6a6'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); ctx.fillStyle = '#ffe24c'; ctx.fillRect(Math.round(x) - 4, Math.round(y), 9, 1); ctx.fillRect(Math.round(x), Math.round(y) - 4, 1, 9); }
  function drawProjectile(p) { const x = p.x - state.camera.x, y = p.y - state.camera.y; ctx.fillStyle = p.friendly ? (p.kind === 'arrow' ? '#fff4a8' : '#b9a5ff') : (p.kind === 'root' ? '#85ce5d' : '#f1a7ff'); ctx.fillRect(x - 3, y - 3, 7, 7); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
  function drawDrop(d) { const x = d.x - state.camera.x, y = d.y - state.camera.y; ctx.fillStyle = '#ff6b6b'; ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillRect(x - 2, y - 5, 4, 10); }
  function drawParticle(p) { ctx.globalAlpha = clamp(p.life * 4, 0, 1); ctx.fillStyle = p.color; ctx.fillRect(p.x - state.camera.x, p.y - state.camera.y, p.size, p.size); ctx.globalAlpha = 1; }
  function drawCompanion(now) {
    const code = state.progress.active_companion, data = DATA.companions[code]; if (!data) return;
    const side = state.player.dir === 'left' ? 1 : -1, x = state.player.x - state.camera.x + side * 13, y = state.player.y - state.camera.y + 3 + Math.sin(now / 220) * 2;
    ctx.fillStyle = data.color; ctx.fillRect(Math.round(x) - 4, Math.round(y) - 4, 9, 8); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2); ctx.fillStyle = '#173d2e'; ctx.fillRect(Math.round(x) + 1, Math.round(y) - 2, 2, 2);
  }

  function render(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); if (state.shake > 0) ctx.translate((Math.random() - .5) * 4, (Math.random() - .5) * 4);
    const s = CFG.TILE_SIZE, x0 = Math.floor(state.camera.x / s) - 1, y0 = Math.floor(state.camera.y / s) - 1, x1 = x0 + Math.ceil(canvas.width / s) + 3, y1 = y0 + Math.ceil(canvas.height / s) + 3, drawables = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const type = tileType(x, y), sx = x * s - state.camera.x, sy = y * s - state.camera.y; drawGround(type === 'tree' ? 'grass' : type, Math.floor(sx), Math.floor(sy), x, y, now); if (type === 'tree') drawables.push({ depth: y * s + 14, draw: () => drawTree(sx, sy, x, y) }); }
    state.lights.forEach((l) => drawLight(l, now)); state.projectiles.forEach(drawProjectile); state.drops.forEach(drawDrop);
    state.chests.forEach((c) => { if (Math.abs(c.x - state.player.x) < canvas.width && Math.abs(c.y - state.player.y) < canvas.height) drawables.push({ depth: c.y + 7, draw: () => drawChest(c, c.x - state.camera.x, c.y - state.camera.y) }); });
    state.monsters.forEach((m) => { if (!m.dead && Math.abs(m.x - state.player.x) < canvas.width && Math.abs(m.y - state.player.y) < canvas.height) drawables.push({ depth: m.y + (m.boss ? 14 : 7), draw: () => drawMonster(m, m.x - state.camera.x, m.y - state.camera.y) }); });
    drawables.push({ depth: state.player.y + 6, draw: () => drawCompanion(now) }); drawables.push({ depth: state.player.y + 7, draw: () => drawHero(state.player.x - state.camera.x, state.player.y - state.camera.y) }); drawables.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw()); state.particles.forEach(drawParticle); ctx.restore();
  }

  function moveEntity(entity, dx, dy, dt, speed, isPlayer) {
    const nx = entity.x + dx * speed * dt, ny = entity.y + dy * speed * dt;
    if (canMove(nx, entity.y, 5) && (!isPlayer || zoneAllowed(zoneAt(nx, entity.y)))) entity.x = nx;
    if (canMove(entity.x, ny, 5) && (!isPlayer || zoneAllowed(zoneAt(entity.x, ny)))) entity.y = ny;
  }
  function zoneAllowed(zone) {
    if (state.dungeon) return zone === DATA.dungeons[state.dungeon.code].zone;
    if (state.progress.unlocked_zones.includes(zone)) return true;
    if (Date.now() - state.lockedToastAt > 1800) { state.lockedToastAt = Date.now(); toast('🔒 ผ่านบทก่อนหน้าเพื่อปลดล็อก ' + DATA.zones[zone].short); }
    return false;
  }
  function updatePlayer(dt) {
    const p = state.player, sdk = KAMPAI.input || {}, k = state.keys; p.attackTimer = Math.max(0, p.attackTimer - dt); p.attackCooldown = Math.max(0, p.attackCooldown - dt); p.invuln = Math.max(0, p.invuln - dt); state.activeCooldown = Math.max(0, state.activeCooldown - dt);
    let dx = (k.right || sdk.right ? 1 : 0) - (k.left || sdk.left ? 1 : 0), dy = (k.down || sdk.down ? 1 : 0) - (k.up || sdk.up ? 1 : 0);
    if (dx || dy) { if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'; else p.dir = dy > 0 ? 'down' : 'up'; const length = Math.hypot(dx, dy); dx /= length; dy /= length; moveEntity(p, dx, dy, dt, p.speed, true); p.moving = true; state.anim += dt * 1000; } else p.moving = false;
    const newZone = zoneAt(p.x, p.y); if (newZone !== state.zone) { state.zone = newZone; state.progress.zone = newZone; queueEvent('zone_enter', null, { zone: newZone }); toast(DATA.zones[newZone].name); updateHud(); }
    const targetX = p.x - canvas.width / 2, targetY = p.y - canvas.height / 2; state.camera.x += (targetX - state.camera.x) * Math.min(1, dt * 7); state.camera.y += (targetY - state.camera.y) * Math.min(1, dt * 7); state.camera.x = clamp(state.camera.x, 0, CFG.MAP_WIDTH * CFG.TILE_SIZE - canvas.width); state.camera.y = clamp(state.camera.y, 0, CFG.MAP_HEIGHT * CFG.TILE_SIZE - canvas.height);
    $('active-skill-label').textContent = state.activeCooldown > 0 ? state.activeCooldown.toFixed(1) : currentClass().active;
  }
  function updateMonsters(dt) {
    const p = state.player;
    state.monsters.forEach((m) => {
      if (m.dead) { if (m.boss || m.dungeon) return; m.respawn -= dt; if (m.respawn <= 0) spawnMonster(m, m.zone); return; }
      m.cooldown -= dt; m.invuln = Math.max(0, m.invuln - dt); m.flash = Math.max(0, m.flash - dt); let dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy) || 1; dx /= dist; dy /= dist;
      if (m.boss) { updateBoss(m, dx, dy, dist, dt); return; }
      if (!state.progress.unlocked_zones.includes(m.zone) && m.zone !== 'village') return;
      if (m.type === 'slime' && dist < 150) moveEntity(m, dx, dy, dt, m.speed, false);
      if (m.type === 'boar') { if (m.charge > 0) { m.charge -= dt; moveEntity(m, m.vx, m.vy, dt, m.speed * 3.1, false); } else if (dist < 125 && m.cooldown <= 0) { m.charge = .48; m.vx = dx; m.vy = dy; m.cooldown = 2.6; } else if (dist < 155) moveEntity(m, dx, dy, dt, m.speed * .65, false); }
      if (m.type === 'shaman') { if (dist < 58) moveEntity(m, -dx, -dy, dt, m.speed, false); else if (dist > 95 && dist < 175) moveEntity(m, dx, dy, dt, m.speed * .55, false); if (dist < 170 && m.cooldown <= 0) { hostileShot(m.x, m.y - 4, dx, dy, m.damage, 'magic'); m.cooldown = Math.max(1.2, 2.4 - m.level * .05); } }
      if (m.type === 'thornling') { if (dist < 68) moveEntity(m, -dx, -dy, dt, m.speed, false); else if (dist > 105 && dist < 175) moveEntity(m, dx, dy, dt, m.speed * .5, false); if (dist < 165 && m.cooldown <= 0) { state.projectiles.push({ x: state.player.x, y: state.player.y, vx: 0, vy: 0, damage: m.damage, life: 1.15, warmup: .52, kind: 'root', friendly: false }); m.cooldown = 2.2; } }
      if (m.type === 'mireling') { if (m.charge > 0) { m.charge -= dt; moveEntity(m, m.vx, m.vy, dt, m.speed * 3.4, false); } else if (dist < 145 && m.cooldown <= 0) { m.charge = .36; m.vx = dx; m.vy = dy; m.cooldown = 2.8; radialShots(m, 4, 34, 'poison'); } else if (dist < 150) moveEntity(m, dx, dy, dt, m.speed * .55, false); }
      if (m.type === 'sentinel') { if (dist < 165) moveEntity(m, dx, dy, dt, m.speed * .7, false); if (dist < 120 && m.cooldown <= 0) { radialShots(m, 6, 42, 'rune'); m.cooldown = 2.6; } }
      if (dist < 13) damagePlayer(m.damage, dx, dy);
    });
  }
  function updateBoss(m, dx, dy, dist, dt) {
    const bossData = DATA.bosses[m.bossCode], enraged = m.hp <= m.maxHp * .5;
    if (enraged && !m.enraged) { m.enraged = true; m.speed *= 1.22; burst(m.x, m.y, bossData.color, 28); toast('🔥 ' + bossData.phaseSkill); }
    if (m.charge > 0) { m.charge -= dt; moveEntity(m, m.vx, m.vy, dt, m.speed * 3.2, false); }
    else if (dist < 180) moveEntity(m, dx, dy, dt, m.speed, false); if (dist < 19) damagePlayer(m.damage, dx, dy);
    if (m.cooldown > 0 || dist > 210) return; const code = m.bossCode;
    if (code === 'training-golem') { radialShots(m, enraged ? 12 : 8, enraged ? 45 : 34, 'shock'); if (enraged) { m.charge = .3; m.vx = dx; m.vy = dy; } }
    if (code === 'moss-ancient') for (let i = 0; i < (enraged ? 11 : 7); i++) state.projectiles.push({ x: state.player.x + (Math.random() - .5) * (enraged ? 120 : 90), y: state.player.y + (Math.random() - .5) * (enraged ? 120 : 90), vx: 0, vy: 0, damage: m.damage, life: 1.2, warmup: .55, kind: 'root', friendly: false });
    if (code === 'mire-hydra') { radialShots(m, enraged ? 16 : 12, enraged ? 58 : 48, 'poison'); if (enraged) [-.18, 0, .18].forEach((offset) => hostileShot(m.x, m.y, Math.cos(Math.atan2(dy, dx) + offset), Math.sin(Math.atan2(dy, dx) + offset), m.damage, 'poison', 70)); }
    if (code === 'rune-warden') { const p = randomOpenNearPlayer(m.zone, 65); m.x = p.x; m.y = p.y; const angle = Math.atan2(state.player.y - m.y, state.player.x - m.x); (enraged ? [-.5, -.25, 0, .25, .5] : [-.28, 0, .28]).forEach((offset) => hostileShot(m.x, m.y, Math.cos(angle + offset), Math.sin(angle + offset), m.damage, 'rune')); }
    if (code === 'root-devourer') { for (let i = 0; i < (enraged ? 10 : 6); i++) state.projectiles.push({ x: state.player.x + (Math.random() - .5) * 115, y: state.player.y + (Math.random() - .5) * 115, vx: 0, vy: 0, damage: m.damage, life: 1.25, warmup: .48, kind: 'root', friendly: false }); if (enraged) radialShots(m, 8, 48, 'poison'); }
    if (code === 'mist-matriarch') { radialShots(m, enraged ? 18 : 10, enraged ? 62 : 48, 'poison'); if (enraged) for (let i = 0; i < 6; i++) state.projectiles.push({ x: state.player.x + (Math.random() - .5) * 105, y: state.player.y + (Math.random() - .5) * 105, vx: 0, vy: 0, damage: m.damage, life: 1.1, warmup: .42, kind: 'root', friendly: false }); }
    toast((enraged ? bossData.phaseSkill : bossData.skill) + '!'); m.cooldown = enraged ? 1.45 : (code === 'rune-warden' ? 1.7 : 2.5);
  }
  function randomOpenNearPlayer(zone, radius) {
    for (let i = 0; i < 80; i++) { const angle = Math.random() * Math.PI * 2, r = 35 + Math.random() * radius, x = state.player.x + Math.cos(angle) * r, y = state.player.y + Math.sin(angle) * r; if (zoneAt(x, y) === zone && canMove(x, y, 10)) return { x, y }; }
    return randomOpenTile(zone, 30);
  }
  function radialShots(m, count, speed, kind) { for (let i = 0; i < count; i++) { const angle = Math.PI * 2 * i / count; hostileShot(m.x, m.y, Math.cos(angle), Math.sin(angle), m.damage, kind, speed); } }
  function hostileShot(x, y, dx, dy, damage, kind, speed) { state.projectiles.push({ x, y, vx: dx * (speed || 58), vy: dy * (speed || 58), damage, life: 3, kind, friendly: false }); }
  function friendlyShot(kind, angleOffset) { const p = state.player, dir = directionVector(), angle = Math.atan2(dir[1], dir[0]) + (angleOffset || 0), speed = kind === 'arrow' ? 145 : 105; state.projectiles.push({ x: p.x + Math.cos(angle) * 9, y: p.y + Math.sin(angle) * 9, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: p.damage, life: 1.7, kind, friendly: true, hit: [] }); }
  function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const shot = state.projectiles[i]; shot.life -= dt; if (shot.warmup > 0) { shot.warmup -= dt; if (shot.warmup > 0) continue; }
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      if (shot.life <= 0 || (shot.kind !== 'root' && solidAt(shot.x, shot.y))) { state.projectiles.splice(i, 1); continue; }
      if (shot.friendly) {
        let consumed = false;
        state.monsters.forEach((m) => { if (m.dead || consumed || shot.hit.includes(m)) return; if (Math.hypot(shot.x - m.x, shot.y - m.y) < (m.boss ? 17 : 10)) { shot.hit.push(m); hitMonster(m, shot.damage, shot.kind === 'magic'); consumed = true; } });
        if (consumed) state.projectiles.splice(i, 1);
      } else if (Math.hypot(shot.x - state.player.x, shot.y - state.player.y) < 10) { damagePlayer(shot.damage, shot.vx, shot.vy); state.projectiles.splice(i, 1); }
    }
  }
  function updateCollectibles() {
    for (let i = state.lights.length - 1; i >= 0; i--) if (Math.hypot(state.player.x - state.lights[i].x, state.player.y - state.lights[i].y) < 13) { state.lights.splice(i, 1); addScore(CFG.LIGHT_POINTS); gainXp(6); spawnLight(); KAMPAI.sound.correct(); }
    for (let i = state.drops.length - 1; i >= 0; i--) if (Math.hypot(state.player.x - state.drops[i].x, state.player.y - state.drops[i].y) < 14) { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 14); state.drops.splice(i, 1); toast('+14 HP'); updateHud(); }
  }
  function updateParticles(dt) { state.shake = Math.max(0, state.shake - dt); for (let i = state.particles.length - 1; i >= 0; i--) { const p = state.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) state.particles.splice(i, 1); } }
  function updateCompanion(dt) {
    if (hasRune('vitality')) { state.vitalityClock -= dt; if (state.vitalityClock <= 0) { state.vitalityClock = 5; state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2); updateHud(); } }
    const data = DATA.companions[state.progress.active_companion]; if (!data) return; state.companionClock -= dt;
    if (state.companionClock > 0) return;
    if (data.kind === 'heal') { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5); state.companionClock = 7; toast(data.icon + ' ฟื้น HP +5'); updateHud(); return; }
    const living = state.monsters.filter((m) => !m.dead && Math.hypot(m.x - state.player.x, m.y - state.player.y) < 150).sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y));
    if (!living.length) { state.companionClock = 1; return; }
    const targets = data.kind === 'burst' ? living.filter((m) => Math.hypot(m.x - state.player.x, m.y - state.player.y) < 72) : living.slice(0, 1), damage = Math.max(5, Math.round(state.player.damage * (data.kind === 'burst' ? .25 : .4)));
    targets.forEach((m) => { m.hp -= damage; burst(m.x, m.y, data.color, 8); queueEvent('damage_dealt', damage, { target: m.boss ? m.bossCode : m.type, companion: state.progress.active_companion }); if (m.hp <= 0) defeatMonster(m); }); state.companionClock = data.kind === 'burst' ? 4 : 2.4;
  }
  function update(dt) { if (!state.running || state.skillOpen || state.campOpen) return; updatePlayer(dt); updateMonsters(dt); updateProjectiles(dt); updateCollectibles(); updateCompanion(dt); updateParticles(dt); state.progress.play_seconds += dt; if (state.dungeon) { state.dungeonClock = Math.max(0, state.dungeonClock - dt); updateQuestHud(); if (state.dungeonClock <= 0) leaveDungeon(false); } }
  function loop(now) { const dt = Math.min(.033, (now - (state.last || now)) / 1000); state.last = now; update(dt); render(now); requestAnimationFrame(loop); }

  function burst(x, y, color, count) { for (let i = 0; i < count; i++) state.particles.push({ x, y, vx: (Math.random() - .5) * 45, vy: (Math.random() - .5) * 45, life: .25 + Math.random() * .25, color, size: 1 + Math.floor(Math.random() * 3) }); }
  function tryAttack() {
    const p = state.player; if (!state.running || state.skillOpen || state.campOpen || p.attackCooldown > 0) return; p.attackCooldown = CFG.SWORD_COOLDOWN; p.attackTimer = .18; p.attackId++;
    const dir = directionVector();
    state.chests.forEach((c) => { if (c.open) return; const dx = c.x - p.x, dy = c.y - p.y, dist = Math.hypot(dx, dy) || 1; if (dist <= CFG.SWORD_RANGE && (dx / dist * dir[0] + dy / dist * dir[1]) > -.05) openChest(c); });
    if (state.progress.hero_class === 'ranger') { friendlyShot('arrow'); return; }
    if (state.progress.hero_class === 'mage') { friendlyShot('magic'); return; }
    state.monsters.forEach((m) => { if (m.dead || m.hitAttack === p.attackId) return; const dx = m.x - p.x, dy = m.y - p.y, dist = Math.hypot(dx, dy) || 1, facing = dx / dist * dir[0] + dy / dist * dir[1]; if (dist <= CFG.SWORD_RANGE + (m.boss ? 8 : 0) && facing > -.05) hitMonster(m); });
  }
  function tryActiveSkill() {
    if (!state.running || state.skillOpen || state.campOpen || state.activeCooldown > 0) return; const cls = state.progress.hero_class, p = state.player;
    if (cls === 'swordsman') state.monsters.forEach((m) => { if (!m.dead && Math.hypot(m.x - p.x, m.y - p.y) < 48) hitMonster(m, Math.round(p.damage * 1.35)); });
    if (cls === 'ranger') [-.24, 0, .24].forEach((angle) => friendlyShot('arrow', angle));
    if (cls === 'mage') { state.monsters.forEach((m) => { if (!m.dead && Math.hypot(m.x - p.x, m.y - p.y) < 66) hitMonster(m, Math.round(p.damage * 1.2), true); }); burst(p.x, p.y, '#b9a5ff', 28); }
    state.activeCooldown = hasRune('arcane') ? 5.25 : 7; toast(currentClass().active + '!');
  }
  function hitMonster(m, fixedDamage, splash) {
    const p = state.player, crit = !fixedDamage && Math.random() < p.crit, rawDamage = fixedDamage || Math.round(p.damage * (crit ? 1.75 : 1)), damage = m.type === 'sentinel' && !splash ? Math.max(1, Math.round(rawDamage * .72)) : rawDamage; m.hp -= damage; m.hitAttack = p.attackId; m.invuln = .15; m.flash = .16;
    if (!m.boss) { const dir = directionVector(); if (canMove(m.x + dir[0] * 7, m.y + dir[1] * 7, 5)) { m.x += dir[0] * 7; m.y += dir[1] * 7; } }
    burst(m.x, m.y, crit ? '#fff07a' : (splash ? '#b9a5ff' : '#ffffff'), crit ? 9 : 5); if (crit) toast('คริติคอล ' + damage + '!'); queueEvent('damage_dealt', damage, { target: m.boss ? m.bossCode : m.type }); if (m.hp <= 0) defeatMonster(m);
  }
  function defeatMonster(m) {
    if (m.boss) { defeatBoss(m); return; }
    const base = DATA.monsters[m.type]; m.dead = true; m.respawn = 5 + Math.random() * 4; state.player.kills++;
    const gold = Math.round((4 + m.level * 1.6) * (hasRune('fortune') ? 1.2 : 1)); state.progress.gold += gold;
    const material = DATA.zones[m.zone].material; if (Math.random() < .68) state.progress.inventory[material] = (state.progress.inventory[material] || 0) + 1;
    const table = DATA.dropTables[m.type] || {}; Object.keys(table).forEach((key) => { if (Math.random() < table[key]) state.progress.inventory[key] = (state.progress.inventory[key] || 0) + 1; });
    rollRareDrop(m);
    addScore(18 + m.level * 5); gainXp(m.xp); burst(m.x, m.y, base.color, 14); if (Math.random() < .25) state.drops.push({ x: m.x, y: m.y }); KAMPAI.sound.correct();
    queueEvent('monster_kill', m.level, { monster: m.type, zone: m.zone, gold, dungeon: m.dungeon ? state.dungeon?.code : null }); if (m.dungeon) advanceDungeonWave(); else updateQuestAfterKill(m.zone); vs.report(state.score, { correct: state.player.kills }); updateHud();
  }
  function rollRareDrop(monster) {
    Object.keys(DATA.rareItems).forEach((code) => {
      const item = DATA.rareItems[code]; if (item.zone !== monster.zone || state.progress.rare_items.includes(code) || Math.random() >= item.chance) return;
      state.progress.rare_items.push(code); toast('🌟 ดรอป' + DATA.rarities[item.rarity].name + ': ' + item.name); queueEvent('item_craft', item.damage, { item: code, source: 'rare_drop', rarity: item.rarity }); saveProgress('rare-drop');
    });
  }
  function updateQuestAfterKill(zone) {
    const chapter = currentChapter(), quest = state.progress.quest; if (zone !== chapter.zone || quest.boss_defeated) return; quest.kills = Math.min(chapter.quota, (quest.kills || 0) + 1); updateQuestHud(); if (quest.kills >= chapter.quota && !state.boss) spawnBoss();
  }
  function spawnBoss() {
    const chapter = currentChapter(); if (state.progress.bosses[chapter.boss]) return; const d = DATA.bosses[chapter.boss], p = randomOpenNearPlayer(chapter.zone, 85);
    const boss = { x: p.x, y: p.y, zone: chapter.zone, boss: true, bossCode: chapter.boss, type: 'boss', level: chapter.id * 3, maxHp: d.hp, hp: d.hp, damage: d.damage, speed: 11 + chapter.id, xp: 70 * chapter.id, cooldown: 1.5, charge: 0, invuln: 0, hitAttack: -1, dead: false, respawn: 0, flash: 0 };
    state.monsters.push(boss); state.boss = boss; queueEvent('boss_start', null, { boss: chapter.boss }); toast('⚠️ บอสปรากฏ: ' + d.name); saveProgress('boss-start');
  }
  function defeatBoss(m) {
    if (m.dungeonBoss) { defeatDungeonBoss(m); return; }
    const chapter = currentChapter(), bossData = DATA.bosses[m.bossCode]; m.dead = true; state.boss = null; state.progress.bosses[m.bossCode] = true; state.progress.quest.boss_defeated = true;
    if (!state.progress.runes.includes(bossData.rune)) state.progress.runes.push(bossData.rune); state.progress.gold += 100 * chapter.id; state.progress.gems += 3 + chapter.id * 2; gainXp(m.xp); addScore(250 * chapter.id); burst(m.x, m.y, bossData.color, 40);
    queueEvent('boss_clear', chapter.id, { boss: m.bossCode, skill: bossData.skill }); queueEvent('chapter_complete', chapter.id, {}); toast('🏆 ได้รับ ' + DATA.runes[bossData.rune].name);
    if (chapter.unlock) {
      if (!state.progress.unlocked_zones.includes(chapter.unlock)) state.progress.unlocked_zones.push(chapter.unlock);
      state.progress.chapter++; state.progress.quest = { chapter: state.progress.chapter, kills: 0, boss_defeated: false }; setTimeout(() => toast('ปลดล็อก ' + DATA.zones[chapter.unlock].name), 1200);
    } else { state.progress.campaign_complete = true; setTimeout(() => toast('✨ จบแคมเปญรุ่น 1!'), 1200); }
    refreshCompanionUnlocks(); updateHud(); saveProgress('boss-clear');
  }
  function spawnDungeonWave() {
    if (!state.dungeon) return; const dungeon = DATA.dungeons[state.dungeon.code], wave = dungeon.waves[state.dungeon.wave - 1]; state.dungeon.kills = 0; state.dungeon.advancing = false; state.monsters = []; state.projectiles = [];
    if (wave.boss) {
      const data = DATA.bosses[wave.boss], point = randomOpenNearPlayer(dungeon.zone, 82), boss = { x: point.x, y: point.y, zone: dungeon.zone, boss: true, dungeon: true, dungeonBoss: true, bossCode: wave.boss, type: 'boss', level: Math.max(6, state.player.level + 2), maxHp: data.hp + state.player.level * 10, hp: data.hp + state.player.level * 10, damage: data.damage + Math.floor(state.player.level / 3), speed: 14, xp: 180, cooldown: 1.4, charge: 0, invuln: 0, hitAttack: -1, dead: false, respawn: 0, flash: 0, enraged: false };
      state.monsters.push(boss); state.boss = boss; queueEvent('boss_start', null, { boss: wave.boss, dungeon: state.dungeon.code }); toast('⚠️ ห้องสุดท้าย: ' + data.name); updateQuestHud(); return;
    }
    state.dungeon.needed = wave.count;
    for (let i = 0; i < wave.count; i++) { const type = wave.types[i % wave.types.length]; spawnMonster(null, dungeon.zone, type); const monster = state.monsters[state.monsters.length - 1], point = randomOpenNearPlayer(dungeon.zone, 60 + i * 8); monster.x = point.x; monster.y = point.y; monster.dungeon = true; monster.respawn = 9999; }
    toast('🚪 ห้อง ' + state.dungeon.wave + ': ' + wave.name); updateQuestHud();
  }
  function advanceDungeonWave() {
    if (!state.dungeon || state.dungeon.advancing) return; state.dungeon.kills++;
    if (state.dungeon.kills < state.dungeon.needed) { updateQuestHud(); return; }
    state.dungeon.advancing = true; state.dungeon.wave++; toast('✨ เปิดประตูห้องถัดไป'); setTimeout(spawnDungeonWave, 850);
  }
  function defeatDungeonBoss(m) {
    if (!state.dungeon) return; const dungeon = DATA.dungeons[state.dungeon.code], record = state.progress.dungeons[state.dungeon.code], elapsed = Math.max(1, Math.round(dungeon.seconds - state.dungeonClock)); m.dead = true; state.boss = null;
    record.clears++; record.best_time = record.best_time == null ? elapsed : Math.min(record.best_time, elapsed); state.progress.gold += dungeon.rewards.gold; state.progress.gems += dungeon.rewards.gems; Object.keys(dungeon.rewards).filter((key) => key !== 'gold' && key !== 'gems').forEach((key) => { state.progress.inventory[key] = (state.progress.inventory[key] || 0) + dungeon.rewards[key]; }); gainXp(m.xp); addScore(600); burst(m.x, m.y, DATA.bosses[m.bossCode].color, 48); refreshCompanionUnlocks();
    queueEvent('boss_clear', elapsed, { boss: m.bossCode, dungeon: state.dungeon.code, clear: record.clears }); toast('🏆 พิชิตถ้ำ! ' + elapsed + ' วินาที · ทอง +' + dungeon.rewards.gold); saveProgress('dungeon-clear'); setTimeout(() => leaveDungeon(true), 1300);
  }
  function leaveDungeon(cleared) {
    if (!state.dungeon) return; const name = DATA.dungeons[state.dungeon.code].name; queueEvent('session_end', state.score, { mode: 'dungeon', dungeon: state.dungeon.code, cleared: !!cleared }); state.dungeon = null; state.dungeonClock = 0; resetWorld(state.rng); state.running = true; toast(cleared ? 'กลับจาก ' + name + ' พร้อมสมบัติ' : 'ถอนตัวจาก ' + name); updateHud();
  }
  window.startDungeon = (code) => {
    const dungeon = DATA.dungeons[code]; if (!state.running || !dungeon || state.timed || state.dungeon) return; if (!state.progress.bosses[dungeon.unlockBoss]) { toast('🔒 ปราบ' + DATA.bosses[dungeon.unlockBoss].name + 'ก่อน'); return; }
    state.campOpen = false; $('camp-screen').classList.add('is-hidden'); state.dungeon = { code, wave: 1, kills: 0, needed: 0, advancing: false }; state.dungeonClock = dungeon.seconds; state.monsters = []; state.projectiles = []; state.lights = []; state.chests = []; state.drops = []; state.boss = null;
    const entrance = randomOpenTile(dungeon.zone, 0); state.player.x = entrance.x; state.player.y = entrance.y; state.player.hp = state.player.maxHp; state.zone = dungeon.zone; state.progress.zone = dungeon.zone; queueEvent('session_start', null, { mode: 'dungeon', dungeon: code }); saveProgress('dungeon-start'); spawnDungeonWave(); updateHud();
  };
  function damagePlayer(amount, dx, dy) {
    const p = state.player; if (p.invuln > 0 || !state.running) return; p.hp = Math.max(0, p.hp - amount); p.invuln = .85; state.shake = .22; burst(p.x, p.y, '#ff6b6b', 10); KAMPAI.sound.wrong(); const len = Math.hypot(dx, dy) || 1, nx = p.x + dx / len * 9, ny = p.y + dy / len * 9; if (canMove(nx, ny, 5)) { p.x = nx; p.y = ny; } queueEvent('damage_taken', amount, {}); updateHud(); if (p.hp <= 0) { queueEvent('player_death', state.progress.chapter, { zone: state.zone, dungeon: state.dungeon?.code || null }); if (state.dungeon) leaveDungeon(false); else endRun(true); }
  }
  function gainXp(amount) {
    const p = state.player; p.xp += amount; while (p.xp >= p.nextXp && p.level < 50) { p.xp -= p.nextXp; p.level++; p.nextXp = xpNeeded(p.level); p.maxHp += 4; p.hp = p.maxHp; p.damage += 2; p.skillPoints++; toast('LEVEL UP!  LV ' + p.level); burst(p.x, p.y, '#fff07a', 24); }
    state.progress.hero_level = p.level; state.progress.hero_xp = p.xp; state.progress.skill_points = p.skillPoints; updateHud();
  }
  function addScore(points) { state.score += points; $('score-value').textContent = state.score; }
  function openChest(chest) { chest.open = true; const p = state.player, material = DATA.zones[chest.zone].material; p.skillPoints++; state.progress.skill_points = p.skillPoints; state.progress.gold += 35; state.progress.inventory[material] = (state.progress.inventory[material] || 0) + 3; p.hp = Math.min(p.maxHp, p.hp + 20); addScore(35); toast('หีบ: แต้มสกิล +1 · ' + DATA.materials[material] + ' +3'); burst(chest.x, chest.y, '#fff07a', 18); updateHud(); saveProgress('chest'); }
  function toast(message) { const node = $('combat-toast'); node.textContent = message; node.classList.remove('show'); void node.offsetWidth; node.classList.add('show'); }

  function updateHud() {
    const p = state.player; if (!p || !p.maxHp) return; $('player-level').textContent = p.level; $('hp-text').textContent = Math.round(p.hp) + ' / ' + p.maxHp; $('xp-text').textContent = 'XP ' + p.xp + ' / ' + p.nextXp; $('hp-fill').style.width = (p.hp / p.maxHp * 100) + '%'; $('xp-fill').style.width = (p.xp / p.nextXp * 100) + '%'; $('skill-points').textContent = p.skillPoints; $('skill-modal-points').textContent = p.skillPoints; $('score-value').textContent = state.score; $('gold-value').textContent = state.progress.gold; $('gem-value').textContent = state.progress.gems; $('zone-name').textContent = DATA.zones[state.zone]?.short || 'หมู่บ้าน'; updateQuestHud();
  }
  function updateQuestHud() {
    if (state.dungeon) { const dungeon = DATA.dungeons[state.dungeon.code], wave = dungeon.waves[state.dungeon.wave - 1]; $('quest-title').textContent = '🕳️ ' + dungeon.name + ' · ' + Math.ceil(state.dungeonClock) + ' วิ'; $('quest-progress').textContent = wave?.boss ? 'บอส: ' + DATA.bosses[wave.boss].name : 'ห้อง ' + state.dungeon.wave + '/' + dungeon.waves.length + ' · ' + (wave?.name || 'กำลังเปิดประตู') + ' ' + state.dungeon.kills + '/' + state.dungeon.needed; return; }
    const chapter = currentChapter(), quest = state.progress.quest; $('quest-title').textContent = chapter.title; $('quest-progress').textContent = state.progress.campaign_complete ? 'จบแคมเปญรุ่น 1 แล้ว' : quest.boss_defeated ? 'ภารกิจสำเร็จ' : (quest.kills >= chapter.quota ? 'บอส: ' + DATA.bosses[chapter.boss].name : 'กำจัดศัตรูใน' + DATA.zones[chapter.zone].short + ' ' + quest.kills + '/' + chapter.quota);
  }
  function renderSkills() { const p = state.player; $('skill-modal-points').textContent = p.skillPoints; $('skill-grid').innerHTML = DATA.skills.map((skill) => '<button class="skill-card" onclick="upgradeSkill(\'' + skill.id + '\')" ' + (p.skillPoints < 1 ? 'disabled' : '') + '><em>LV ' + p.skills[skill.id] + '</em><span class="icon">' + skill.icon + '</span><strong>' + skill.name + '</strong><span>' + skill.desc + '</span></button>').join(''); }
  window.toggleSkills = (force) => { if (!state.running) return; state.skillOpen = typeof force === 'boolean' ? force : !state.skillOpen; $('skill-screen').classList.toggle('is-hidden', !state.skillOpen); if (state.skillOpen) renderSkills(); };
  window.upgradeSkill = (id) => { const p = state.player; if (!p.skillPoints || !Object.prototype.hasOwnProperty.call(p.skills, id)) return; p.skillPoints--; p.skills[id]++; state.progress.skill_points = p.skillPoints; state.progress.skill_levels = { ...p.skills }; if (id === 'blade') p.damage += 3; if (id === 'heart') { p.maxHp += 12; p.hp = p.maxHp; } if (id === 'boots') p.speed += 6; if (id === 'crit') p.crit = Math.min(.55, p.crit + .05); updateHud(); renderSkills(); toast('อัปเกรด ' + DATA.skills.find((s) => s.id === id).name); saveProgress('skill'); };

  function renderClassGrid() { $('class-grid').innerHTML = Object.keys(DATA.classes).map((id) => { const cls = DATA.classes[id]; return '<button class="class-card" onclick="selectHeroClass(\'' + id + '\')"><span class="class-icon">' + cls.icon + '</span><strong>' + cls.name + '</strong><span>HP ' + cls.hp + ' · ATK ' + cls.damage + '</span><span>' + cls.attack + '</span><span>สกิล: ' + cls.active + '</span></button>'; }).join(''); }
  function requestStart(mode) { state.pendingMode = mode; if (!state.progress.hero_class) { renderClassGrid(); $('class-screen').classList.remove('is-hidden'); return; } showGame(mode === 'challenge', Math.random, false); }
  window.selectHeroClass = (id) => { if (!DATA.classes[id] || state.progress.hero_class) return; state.progress.hero_class = id; state.progress.equipment.weapon.code = 'training-weapon'; queueEvent('class_selected', null, { hero_class: id }); $('class-screen').classList.add('is-hidden'); saveProgress('class-select'); showGame(state.pendingMode === 'challenge', Math.random, false); };
  window.cancelClassSelect = () => $('class-screen').classList.add('is-hidden');
  window.startExplore = () => requestStart('explore');
  window.startChallenge = () => requestStart('challenge');

  window.toggleCamp = (force) => { if (!state.running) return; state.campOpen = typeof force === 'boolean' ? force : !state.campOpen; $('camp-screen').classList.toggle('is-hidden', !state.campOpen); if (state.campOpen) renderCamp(); };
  window.setCampTab = (tab) => { state.campTab = tab; renderCamp(); };
  function renderCamp() {
    const p = state.progress, cls = currentClass(); $('camp-class').textContent = cls.icon + ' ' + cls.name + ' LV ' + p.hero_level; $('camp-gold').textContent = p.gold; $('camp-gems').textContent = p.gems; const content = $('camp-content');
    if (state.campTab === 'inventory') {
      const rare = p.rare_items.length ? '<h3>คลังอาวุธหายาก</h3><div class="camp-list">' + p.rare_items.map((code) => { const item = DATA.rareItems[code], rarity = DATA.rarities[item.rarity]; return '<div class="camp-item rarity-' + item.rarity + '"><button onclick="equipRareWeapon(\'' + code + '\')">' + (p.equipment.weapon.code === code ? 'ใช้อยู่' : 'สวมใส่') + '</button><strong style="color:' + rarity.color + '">' + item.name + '</strong><small>' + rarity.name + ' · ATK +' + item.damage + '</small></div>'; }).join('') + '</div>' : '<p class="empty-note">อาวุธหายากดรอปจากมอนสเตอร์ประจำโซน</p>';
      content.innerHTML = '<div class="camp-list">' + Object.keys(DATA.materials).map((key) => '<div class="camp-item"><strong>' + DATA.materials[key] + '</strong><span> × ' + (p.inventory[key] || 0) + '</span>' + (key === 'heal_potion' ? '<button ' + (p.inventory[key] ? '' : 'disabled') + ' onclick="usePotion()">ใช้</button>' : '') + '</div>').join('') + '</div><p>อาวุธ: <b>' + weaponName() + '</b> +' + p.equipment.weapon.enhance + ' · ATK โบนัส ' + weaponBonus() + '</p>' + rare;
    }
    if (state.campTab === 'shop') { content.innerHTML = '<div class="camp-list">' + DATA.shop.map((item) => '<div class="camp-item"><button ' + (p.gold >= item.cost ? '' : 'disabled') + ' onclick="buyShopItem(\'' + item.code + '\')">ซื้อ</button><strong>' + item.name + '</strong><small>' + item.desc + '</small><small>ราคา 🪙 ' + item.cost + '</small></div>').join('') + '</div>'; }
    if (state.campTab === 'craft') {
      const weapons = DATA.recipes.map((r) => { const can = canCraft(r), rarity = DATA.rarities[r.rarity]; return '<div class="camp-item rarity-' + r.rarity + '"><button ' + (can ? '' : 'disabled') + ' onclick="craftWeapon(\'' + r.code + '\')">คราฟ</button><strong style="color:' + rarity.color + '">' + r.name + '</strong><small>' + rarity.name + ' · ATK +' + r.damage + ' · 🪙 ' + r.cost + '</small><small>' + materialCostText(r.materials) + '</small></div>'; }).join('');
      const runes = Object.keys(DATA.runes).filter((code) => DATA.runes[code].craft).map((code) => { const rune = DATA.runes[code], can = !p.runes.includes(code) && hasMaterials(rune.craft); return '<div class="camp-item"><button ' + (can ? '' : 'disabled') + ' onclick="craftRune(\'' + code + '\')">คราฟรูน</button><strong>' + rune.name + '</strong><small>' + rune.desc + '</small><small>' + materialCostText(rune.craft) + '</small></div>'; }).join('');
      content.innerHTML = '<h3>อาวุธ</h3><div class="camp-list">' + weapons + '</div><h3>รูน</h3><div class="camp-list">' + runes + '</div>';
    }
    if (state.campTab === 'smith') { const level = p.equipment.weapon.enhance, cost = DATA.enhanceCosts[level] || 0; content.innerHTML = '<div class="camp-item smith-card"><button ' + (p.gold >= cost && level < 10 ? '' : 'disabled') + ' onclick="enhanceWeapon()">ตีบวก</button><strong>' + weaponName() + ' +' + level + '</strong><small>ATK จากตีบวก +' + enhanceBonus() + ' · ระดับ 6–10 ได้ +3 ต่อระดับ</small><small>' + (level < 10 ? 'ค่าใช้จ่าย 🪙 ' + cost + ' · สำเร็จแน่นอน' : 'ถึงระดับสูงสุดแล้ว') + '</small></div>'; }
    if (state.campTab === 'rune') { content.innerHTML = p.runes.length ? '<p>ช่องรูน 1: <b>' + runeSlotName(0) + '</b> · ช่องรูน 2: <b>' + runeSlotName(1) + '</b></p><div class="camp-list">' + p.runes.map((code) => '<div class="camp-item"><strong>' + DATA.runes[code].name + '</strong><small>' + DATA.runes[code].desc + '</small><div class="slot-actions"><button onclick="equipRune(\'' + code + '\',0)">ช่อง 1</button><button onclick="equipRune(\'' + code + '\',1)">ช่อง 2</button></div></div>').join('') + '</div>' : '<p>ปราบบอสหรือคราฟรูนเพื่อเริ่มสร้างบิลด์</p>'; }
    if (state.campTab === 'dungeon') { content.innerHTML = Object.keys(DATA.dungeons).map((code) => { const dungeon = DATA.dungeons[code], record = p.dungeons[code], unlocked = !!p.bosses[dungeon.unlockBoss], boss = DATA.bosses[dungeon.waves[dungeon.waves.length - 1].boss]; return '<div class="dungeon-card"><span class="dungeon-icon">🕳️</span><div><strong>' + dungeon.name + '</strong><small>' + dungeon.waves.length + ' ห้อง · ' + dungeon.seconds + ' วินาที · บอส' + boss.name + '</small><small>รางวัล: 🪙 ' + dungeon.rewards.gold + ' · 💎 ' + dungeon.rewards.gems + '</small><small>ผ่านแล้ว ' + record.clears + ' ครั้ง' + (record.best_time ? ' · ดีที่สุด ' + record.best_time + ' วินาที' : '') + '</small></div><button ' + (unlocked && !state.timed ? '' : 'disabled') + ' onclick="startDungeon(\'' + code + '\')">' + (unlocked ? (state.timed ? 'ออกจากโหมดจับเวลาก่อน' : 'เข้าดันเจี้ยน') : '🔒 ปราบ' + DATA.bosses[dungeon.unlockBoss].name) + '</button></div>'; }).join(''); }
    if (state.campTab === 'companion') { refreshCompanionUnlocks(); content.innerHTML = '<div class="camp-list">' + Object.keys(DATA.companions).map((code) => { const pet = DATA.companions[code], owned = p.companions.includes(code); return '<div class="camp-item companion-card"><span class="companion-icon">' + pet.icon + '</span><button ' + (owned ? '' : 'disabled') + ' onclick="equipCompanion(\'' + code + '\')">' + (p.active_companion === code ? 'ติดตามอยู่' : owned ? 'เลือกคู่หู' : 'ยังไม่ปลดล็อก') + '</button><strong>' + pet.name + '</strong><small>' + pet.desc + '</small></div>'; }).join('') + '</div>'; }
    if (state.campTab === 'story') { content.innerHTML = DATA.chapters.map((chapter) => '<div class="story-row ' + (p.bosses[chapter.boss] ? 'done' : chapter.id === p.chapter ? 'current' : '') + '"><strong>' + chapter.title + '</strong><small>' + chapter.story + '</small></div>').join(''); }
  }
  function weaponName() { if (state.progress.equipment.weapon.code === 'training-weapon') return 'อาวุธฝึกหัด'; return weaponRecipe()?.name || 'อาวุธฝึกหัด'; }
  function materialCostText(materials) { return Object.keys(materials).map((key) => DATA.materials[key] + ' ' + (state.progress.inventory[key] || 0) + '/' + materials[key]).join(' · '); }
  function hasMaterials(materials) { return Object.keys(materials).every((key) => (state.progress.inventory[key] || 0) >= materials[key]); }
  function spendMaterials(materials) { Object.keys(materials).forEach((key) => { state.progress.inventory[key] -= materials[key]; }); }
  function canCraft(recipe) { return state.progress.gold >= recipe.cost && Object.keys(recipe.materials).every((key) => state.progress.inventory[key] >= recipe.materials[key]); }
  window.craftWeapon = (code) => { const r = DATA.recipes.find((x) => x.code === code); if (!r || !canCraft(r)) return; state.progress.gold -= r.cost; spendMaterials(r.materials); state.progress.equipment.weapon.code = r.code; applyEquipmentStats(); queueEvent('item_craft', r.damage, { item: r.code, cost: r.cost, rarity: r.rarity }); toast('คราฟ ' + r.name + ' สำเร็จ'); renderCamp(); updateHud(); saveProgress('craft'); };
  window.craftRune = (code) => { const rune = DATA.runes[code]; if (!rune?.craft || state.progress.runes.includes(code) || !hasMaterials(rune.craft)) return; spendMaterials(rune.craft); state.progress.runes.push(code); queueEvent('item_craft', null, { item: code, kind: 'rune' }); toast('คราฟ ' + rune.name + ' สำเร็จ'); renderCamp(); saveProgress('craft-rune'); };
  window.buyShopItem = (code) => { const item = DATA.shop.find((x) => x.code === code); if (!item || state.progress.gold < item.cost) return; state.progress.gold -= item.cost; if (item.kind === 'potion') state.progress.inventory.heal_potion++; else Object.keys(item.items).forEach((key) => { state.progress.inventory[key] = (state.progress.inventory[key] || 0) + item.items[key]; }); queueEvent('item_craft', null, { item: code, kind: 'shop', cost: item.cost }); toast('ซื้อ ' + item.name); renderCamp(); updateHud(); saveProgress('shop'); };
  window.usePotion = () => { if (!state.progress.inventory.heal_potion || state.player.hp >= state.player.maxHp) return; state.progress.inventory.heal_potion--; state.player.hp = Math.min(state.player.maxHp, state.player.hp + 35); toast('ฟื้น HP +35'); renderCamp(); updateHud(); saveProgress('potion'); };
  window.equipRareWeapon = (code) => { if (!state.progress.rare_items.includes(code) || !DATA.rareItems[code]) return; state.progress.equipment.weapon.code = code; applyEquipmentStats(); toast('สวมใส่ ' + DATA.rareItems[code].name); renderCamp(); updateHud(); saveProgress('rare-equip'); };
  window.enhanceWeapon = () => { const w = state.progress.equipment.weapon, cost = DATA.enhanceCosts[w.enhance] || 0; if (w.enhance >= 10 || state.progress.gold < cost) return; state.progress.gold -= cost; w.enhance++; applyEquipmentStats(); queueEvent('weapon_enhance', w.enhance, { cost, bonus: enhanceBonus() }); toast('ตีบวกสำเร็จ +' + w.enhance); renderCamp(); updateHud(); saveProgress('enhance'); };
  function runeSlotName(slot) { const code = equippedRunes()[slot]; return code ? DATA.runes[code].name : 'ว่าง'; }
  window.equipRune = (code, slot) => { if (!state.progress.runes.includes(code) || !DATA.runes[code] || slot < 0 || slot > 1) return; const slots = equippedRunes().slice(0, 2); const oldIndex = slots.indexOf(code); if (oldIndex >= 0) slots[oldIndex] = null; slots[slot] = code; state.progress.equipment.weapon.runes = slots.filter(Boolean); state.progress.equipment.weapon.rune = state.progress.equipment.weapon.runes[0] || null; applyEquipmentStats(); queueEvent('rune_equip', slot, { rune: code }); toast('ติดตั้ง ' + DATA.runes[code].name + ' ช่อง ' + (slot + 1)); renderCamp(); updateHud(); saveProgress('rune'); };
  function refreshCompanionUnlocks() { Object.keys(DATA.companions).forEach((code) => { const pet = DATA.companions[code], unlocked = (pet.unlock && state.progress.dungeons[pet.unlock]?.clears > 0) || (pet.unlockBoss && state.progress.bosses[pet.unlockBoss]); if (unlocked && !state.progress.companions.includes(code)) state.progress.companions.push(code); }); if (!state.progress.active_companion && state.progress.companions.length) state.progress.active_companion = state.progress.companions[0]; }
  window.equipCompanion = (code) => { if (!state.progress.companions.includes(code)) return; state.progress.active_companion = code; state.companionClock = 0; toast(DATA.companions[code].icon + ' ' + DATA.companions[code].name + ' ร่วมทีม'); renderCamp(); saveProgress('companion'); };
  function applyEquipmentStats() { const cls = currentClass(), p = state.player, skills = state.progress.skill_levels; p.maxHp = cls.hp + (p.level - 1) * 4 + skills.heart * 12 + (hasRune('guardian') ? 18 : 0); p.hp = Math.min(p.hp, p.maxHp); p.damage = cls.damage + (p.level - 1) * 2 + skills.blade * 3 + weaponBonus(); p.crit = Math.min(.63, CFG.PLAYER_CRIT + skills.crit * .05 + (hasRune('hunter') ? .08 : 0)); }

  function queueEvent(type, value, metadata) { state.eventQueue.push({ type, value: value == null ? undefined : value, metadata: metadata || {} }); if (state.eventQueue.length > 30) state.eventQueue.shift(); }
  function snapshotProgress() { state.progress.hero_level = state.player.level ?? state.progress.hero_level; state.progress.hero_xp = state.player.xp ?? state.progress.hero_xp; state.progress.skill_points = state.player.skillPoints ?? state.progress.skill_points; state.progress.zone = state.zone; return JSON.parse(JSON.stringify(state.progress)); }
  function saveProgress(reason) {
    if (!state.progress.hero_class) return; if (state.savePending) { state.saveQueued = true; return; }
    const events = state.eventQueue.splice(0, 30); state.saveInFlightEvents = events; state.savePending = true; const key = 'rpg:' + Date.now() + ':' + (++state.saveSeq) + ':' + String(reason || 'auto').replace(/[^a-z0-9_-]/gi, '');
    const ok = KAMPAI.rpg.save(snapshotProgress(), state.saveVersion, key, events); if (!ok) { state.savePending = false; state.eventQueue.unshift(...events); }
  }
  KAMPAI.rpg.onSaved((ok, result) => {
    state.savePending = false;
    if (result?.state_version) state.saveVersion = result.state_version;
    if (!ok) { state.eventQueue.unshift(...state.saveInFlightEvents); if (result?.state_version) state.saveQueued = true; toast('เซฟขัดแย้ง — กำลังลองใหม่'); }
    else toast('บันทึกแล้ว');
    state.saveInFlightEvents = []; if (state.saveQueued) { state.saveQueued = false; setTimeout(() => saveProgress('queued'), 50); }
  });

  function showGame(timed, rng, versus) {
    refreshCompanionUnlocks(); resetWorld(rng); state.running = true; state.timed = timed; state.versus = versus; state.skillOpen = false; state.campOpen = false; state.companionClock = 0; state.vitalityClock = 0; state.last = 0; state.playStartedAt = Date.now();
    $('start-screen').classList.add('is-hidden'); $('class-screen').classList.add('is-hidden'); $('gameover-screen').classList.add('is-hidden'); $('skill-screen').classList.add('is-hidden'); $('camp-screen').classList.add('is-hidden'); $('hud').classList.remove('is-hidden'); $('attack-button').classList.remove('is-hidden'); $('active-skill-button').classList.remove('is-hidden'); $('timer-card').classList.toggle('is-hidden', !timed); KAMPAI.sound.defaultBgm(CFG.BGM); clearInterval(state.timerId); queueEvent('session_start', null, { mode: timed ? 'challenge' : 'campaign' });
    if (timed) state.timerId = setInterval(() => { state.time--; $('timer-value').textContent = state.time; if (state.time <= 0) endRun(false); }, 1000);
    clearInterval(state.autoSaveId); state.autoSaveId = setInterval(() => saveProgress('auto'), 20000);
  }
  function endRun(defeated) {
    if (!state.running) return; state.running = false; state.skillOpen = false; state.campOpen = false; clearInterval(state.timerId); clearInterval(state.autoSaveId); KAMPAI.sound.bgmStop(); $('skill-screen').classList.add('is-hidden'); $('camp-screen').classList.add('is-hidden'); $('attack-button').classList.add('is-hidden'); $('active-skill-button').classList.add('is-hidden'); queueEvent('session_end', state.score, { defeated: !!defeated, kills: state.player.kills }); saveProgress('session-end');
    if (vs.finish(state.score, { correct: state.player.kills, level: state.player.level })) return; KAMPAI.submitScore(state.score, { mode: 'forest-campaign', kills: state.player.kills, heroLevel: state.player.level, heroClass: state.progress.hero_class, chapter: state.progress.chapter, defeated: !!defeated }); KAMPAI.sound.gameOver(); $('result-title').textContent = defeated ? 'ฮีโร่พ่ายแพ้…' : 'จบการล่ามอนสเตอร์!'; $('final-score').textContent = state.score; $('result-summary').textContent = 'ปราบมอนสเตอร์ ' + state.player.kills + ' ตัว · ' + currentClass().name + ' เลเวล ' + state.player.level + ' · บท ' + state.progress.chapter; $('gameover-screen').classList.remove('is-hidden');
  }
  const vs = window.vs = KampaiVersus.create({ duration: CFG.CHALLENGE_SECONDS, title: CFG.TITLE, rankBy: 'score', rounds: 1, onPlay: ({ rng }) => { if (!state.progress.hero_class) state.progress.hero_class = 'swordsman'; showGame(true, rng, true); }, onEnd: () => { state.running = false; clearInterval(state.timerId); clearInterval(state.autoSaveId); } });

  const keyMap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  addEventListener('keydown', (e) => { const key = keyMap[e.code]; if (key) { state.keys[key] = true; e.preventDefault(); } if ((e.code === 'Space' || e.code === 'KeyJ') && !e.repeat) { tryAttack(); e.preventDefault(); } if (e.code === 'KeyQ' && !e.repeat) { tryActiveSkill(); e.preventDefault(); } if (e.code === 'KeyK' && !e.repeat) { window.toggleSkills(); e.preventDefault(); } if (e.code === 'KeyI' && !e.repeat) { window.toggleCamp(); e.preventDefault(); } });
  addEventListener('keyup', (e) => { const key = keyMap[e.code]; if (key) { state.keys[key] = false; e.preventDefault(); } });
  document.querySelectorAll('#touch-controls button').forEach((button) => { const key = button.dataset.key; button.addEventListener('pointerdown', (e) => { e.preventDefault(); state.keys[key] = true; button.setPointerCapture(e.pointerId); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => button.addEventListener(name, () => { state.keys[key] = false; })); });
  $('attack-button').addEventListener('pointerdown', (e) => { e.preventDefault(); tryAttack(); }); $('active-skill-button').addEventListener('pointerdown', (e) => { e.preventDefault(); tryActiveSkill(); });

  KAMPAI.setSlug(CFG.SLUG).onReady((k) => {
    KAMPAI.sound.mountToggles();
    const saved = k.rpg?.state; if (saved?.save_state) { state.progress = sanitizeProgress(saved.save_state); state.saveVersion = Math.max(1, Number(saved.state_version) || 1); }
    refreshCompanionUnlocks(); resetPlayer(); state.zone = state.progress.zone || 'village'; updateHud(); renderClassGrid();
    if (k.stats) { $('my-stats').classList.remove('is-hidden'); $('best-score').textContent = k.stats.personalBest || 0; $('play-count').textContent = k.stats.playsCount || 0; }
    const list = Array.isArray(k.leaderboard) ? k.leaderboard.slice(0, 5) : []; $('leaderboard').innerHTML = list.length ? list.map((row, i) => '<li class="' + (row.isMe ? 'me' : '') + '">' + (i + 1) + '. ' + (row.displayName || 'นักผจญภัย') + ' — ' + (row.score || 0) + '</li>').join('') : '<li>ยังไม่มีคะแนน — มาเป็นฮีโร่คนแรก!</li>';
  });
  resetPlayer(); resize(); addEventListener('resize', resize); requestAnimationFrame(loop);
})();
