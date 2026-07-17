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
      equipment: { weapon: { code: 'training-weapon', enhance: 0, rune: null } },
      inventory: { moss: 0, wood: 0, slime_core: 0, swamp_ore: 0, ancient_shard: 0 },
      runes: [],
      bosses: {},
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
    boss: null, zone: 'village', lockedToastAt: 0, playStartedAt: 0
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
      equipment: { weapon: { ...base.equipment.weapon, ...(raw.equipment?.weapon || {}) } },
      inventory,
      runes: Array.isArray(raw.runes) ? raw.runes.filter((r) => DATA.runes[r]) : [],
      bosses: raw.bosses && typeof raw.bosses === 'object' ? raw.bosses : {},
      play_seconds: clamp(Number(raw.play_seconds) || 0, 0, 100000000),
      campaign_complete: !!raw.campaign_complete
    };
  }

  function currentClass() { return DATA.classes[state.progress.hero_class] || DATA.classes.swordsman; }
  function currentChapter() { return DATA.chapters[state.progress.chapter - 1]; }
  function directionVector() { return DIRS[state.player.dir] || DIRS.down; }
  function weaponRecipe() { return DATA.recipes.find((r) => r.code === state.progress.equipment.weapon.code); }
  function hasRune(code) { return state.progress.equipment.weapon.rune === code; }
  function weaponBonus() { return (weaponRecipe()?.damage || 0) + state.progress.equipment.weapon.enhance * 2 + (hasRune('fury') ? 5 : 0); }

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
      crit: CFG.PLAYER_CRIT + skills.crit * .05,
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
    if (zone === 'mosswood') return roll < .55 ? 'slime' : 'boar';
    if (zone === 'swamp') return roll < .4 ? 'slime' : 'shaman';
    return roll < .45 ? 'boar' : 'shaman';
  }
  function spawnMonster(existing, requestedZone) {
    const zone = requestedZone || ZONE_KEYS[Math.floor(state.rng() * ZONE_KEYS.length)];
    const p = randomOpenTile(zone, 70), zoneLevel = DATA.zones[zone].chapter;
    const level = clamp(zoneLevel + Math.floor((state.player.level - 1) / 2) + Math.floor(state.rng() * 2), 1, 15);
    const type = monsterTypeForZone(zone), base = DATA.monsters[type], monster = existing || {};
    Object.assign(monster, {
      x: p.x, y: p.y, zone, type, level, maxHp: base.hp + level * 8, hp: base.hp + level * 8,
      damage: base.damage + Math.floor(level * 1.5), speed: base.speed + level * .7,
      xp: base.xp + level * 4, cooldown: state.rng() * 1.5, charge: 0, vx: 0, vy: 0,
      invuln: 0, hitAttack: -1, dead: false, respawn: 0, flash: 0, boss: false
    });
    if (!existing) state.monsters.push(monster);
  }
  function spawnLight() { const p = randomOpenTile(null, 35); state.lights.push({ x: p.x, y: p.y, phase: state.rng() * 8 }); }
  function spawnChest() { const zone = ZONE_KEYS[Math.floor(state.rng() * ZONE_KEYS.length)], p = randomOpenTile(zone, 80); state.chests.push({ x: p.x, y: p.y, zone, open: false }); }
  function resetWorld(rng) {
    state.rng = rng || Math.random; state.score = 0; state.time = CFG.CHALLENGE_SECONDS;
    state.lights = []; state.monsters = []; state.projectiles = []; state.drops = []; state.particles = []; state.chests = []; state.boss = null;
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

  function render(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); if (state.shake > 0) ctx.translate((Math.random() - .5) * 4, (Math.random() - .5) * 4);
    const s = CFG.TILE_SIZE, x0 = Math.floor(state.camera.x / s) - 1, y0 = Math.floor(state.camera.y / s) - 1, x1 = x0 + Math.ceil(canvas.width / s) + 3, y1 = y0 + Math.ceil(canvas.height / s) + 3, drawables = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const type = tileType(x, y), sx = x * s - state.camera.x, sy = y * s - state.camera.y; drawGround(type === 'tree' ? 'grass' : type, Math.floor(sx), Math.floor(sy), x, y, now); if (type === 'tree') drawables.push({ depth: y * s + 14, draw: () => drawTree(sx, sy, x, y) }); }
    state.lights.forEach((l) => drawLight(l, now)); state.projectiles.forEach(drawProjectile); state.drops.forEach(drawDrop);
    state.chests.forEach((c) => { if (Math.abs(c.x - state.player.x) < canvas.width && Math.abs(c.y - state.player.y) < canvas.height) drawables.push({ depth: c.y + 7, draw: () => drawChest(c, c.x - state.camera.x, c.y - state.camera.y) }); });
    state.monsters.forEach((m) => { if (!m.dead && Math.abs(m.x - state.player.x) < canvas.width && Math.abs(m.y - state.player.y) < canvas.height) drawables.push({ depth: m.y + (m.boss ? 14 : 7), draw: () => drawMonster(m, m.x - state.camera.x, m.y - state.camera.y) }); });
    drawables.push({ depth: state.player.y + 7, draw: () => drawHero(state.player.x - state.camera.x, state.player.y - state.camera.y) }); drawables.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw()); state.particles.forEach(drawParticle); ctx.restore();
  }

  function moveEntity(entity, dx, dy, dt, speed, isPlayer) {
    const nx = entity.x + dx * speed * dt, ny = entity.y + dy * speed * dt;
    if (canMove(nx, entity.y, 5) && (!isPlayer || zoneAllowed(zoneAt(nx, entity.y)))) entity.x = nx;
    if (canMove(entity.x, ny, 5) && (!isPlayer || zoneAllowed(zoneAt(entity.x, ny)))) entity.y = ny;
  }
  function zoneAllowed(zone) {
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
      if (m.dead) { if (m.boss) return; m.respawn -= dt; if (m.respawn <= 0) spawnMonster(m, m.zone); return; }
      m.cooldown -= dt; m.invuln = Math.max(0, m.invuln - dt); m.flash = Math.max(0, m.flash - dt); let dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy) || 1; dx /= dist; dy /= dist;
      if (m.boss) { updateBoss(m, dx, dy, dist, dt); return; }
      if (!state.progress.unlocked_zones.includes(m.zone) && m.zone !== 'village') return;
      if (m.type === 'slime' && dist < 150) moveEntity(m, dx, dy, dt, m.speed, false);
      if (m.type === 'boar') { if (m.charge > 0) { m.charge -= dt; moveEntity(m, m.vx, m.vy, dt, m.speed * 3.1, false); } else if (dist < 125 && m.cooldown <= 0) { m.charge = .48; m.vx = dx; m.vy = dy; m.cooldown = 2.6; } else if (dist < 155) moveEntity(m, dx, dy, dt, m.speed * .65, false); }
      if (m.type === 'shaman') { if (dist < 58) moveEntity(m, -dx, -dy, dt, m.speed, false); else if (dist > 95 && dist < 175) moveEntity(m, dx, dy, dt, m.speed * .55, false); if (dist < 170 && m.cooldown <= 0) { hostileShot(m.x, m.y - 4, dx, dy, m.damage, 'magic'); m.cooldown = Math.max(1.2, 2.4 - m.level * .05); } }
      if (dist < 13) damagePlayer(m.damage, dx, dy);
    });
  }
  function updateBoss(m, dx, dy, dist, dt) {
    if (dist < 180) moveEntity(m, dx, dy, dt, m.speed, false); if (dist < 19) damagePlayer(m.damage, dx, dy);
    if (m.cooldown > 0 || dist > 210) return; const code = m.bossCode;
    if (code === 'training-golem') radialShots(m, 8, 34, 'shock');
    if (code === 'moss-ancient') for (let i = 0; i < 7; i++) state.projectiles.push({ x: state.player.x + (Math.random() - .5) * 90, y: state.player.y + (Math.random() - .5) * 90, vx: 0, vy: 0, damage: m.damage, life: 1.2, warmup: .55, kind: 'root', friendly: false });
    if (code === 'mire-hydra') radialShots(m, 12, 48, 'poison');
    if (code === 'rune-warden') { const p = randomOpenNearPlayer(m.zone, 65); m.x = p.x; m.y = p.y; const angle = Math.atan2(state.player.y - m.y, state.player.x - m.x); [-.28, 0, .28].forEach((offset) => hostileShot(m.x, m.y, Math.cos(angle + offset), Math.sin(angle + offset), m.damage, 'rune')); }
    toast(DATA.bosses[code].skill + '!'); m.cooldown = code === 'rune-warden' ? 1.7 : 2.5;
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
  function update(dt) { if (!state.running || state.skillOpen || state.campOpen) return; updatePlayer(dt); updateMonsters(dt); updateProjectiles(dt); updateCollectibles(); updateParticles(dt); state.progress.play_seconds += dt; }
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
    const p = state.player, crit = !fixedDamage && Math.random() < p.crit, damage = fixedDamage || Math.round(p.damage * (crit ? 1.75 : 1)); m.hp -= damage; m.hitAttack = p.attackId; m.invuln = .15; m.flash = .16;
    if (!m.boss) { const dir = directionVector(); if (canMove(m.x + dir[0] * 7, m.y + dir[1] * 7, 5)) { m.x += dir[0] * 7; m.y += dir[1] * 7; } }
    burst(m.x, m.y, crit ? '#fff07a' : (splash ? '#b9a5ff' : '#ffffff'), crit ? 9 : 5); if (crit) toast('คริติคอล ' + damage + '!'); queueEvent('damage_dealt', damage, { target: m.boss ? m.bossCode : m.type }); if (m.hp <= 0) defeatMonster(m);
  }
  function defeatMonster(m) {
    if (m.boss) { defeatBoss(m); return; }
    const base = DATA.monsters[m.type]; m.dead = true; m.respawn = 5 + Math.random() * 4; state.player.kills++;
    const gold = Math.round((5 + m.level * 2) * (hasRune('fortune') ? 1.25 : 1)); state.progress.gold += gold;
    const material = DATA.zones[m.zone].material; state.progress.inventory[material] = (state.progress.inventory[material] || 0) + 1; if (m.type === 'slime' && Math.random() < .65) state.progress.inventory.slime_core++;
    addScore(18 + m.level * 5); gainXp(m.xp); burst(m.x, m.y, base.color, 14); if (Math.random() < .25) state.drops.push({ x: m.x, y: m.y }); KAMPAI.sound.correct();
    queueEvent('monster_kill', m.level, { monster: m.type, zone: m.zone, gold }); updateQuestAfterKill(m.zone); vs.report(state.score, { correct: state.player.kills }); updateHud();
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
    const chapter = currentChapter(), bossData = DATA.bosses[m.bossCode]; m.dead = true; state.boss = null; state.progress.bosses[m.bossCode] = true; state.progress.quest.boss_defeated = true;
    if (!state.progress.runes.includes(bossData.rune)) state.progress.runes.push(bossData.rune); state.progress.gold += 100 * chapter.id; state.progress.gems += 3 + chapter.id * 2; gainXp(m.xp); addScore(250 * chapter.id); burst(m.x, m.y, bossData.color, 40);
    queueEvent('boss_clear', chapter.id, { boss: m.bossCode, skill: bossData.skill }); queueEvent('chapter_complete', chapter.id, {}); toast('🏆 ได้รับ ' + DATA.runes[bossData.rune].name);
    if (chapter.unlock) {
      if (!state.progress.unlocked_zones.includes(chapter.unlock)) state.progress.unlocked_zones.push(chapter.unlock);
      state.progress.chapter++; state.progress.quest = { chapter: state.progress.chapter, kills: 0, boss_defeated: false }; setTimeout(() => toast('ปลดล็อก ' + DATA.zones[chapter.unlock].name), 1200);
    } else { state.progress.campaign_complete = true; setTimeout(() => toast('✨ จบแคมเปญรุ่น 1!'), 1200); }
    updateHud(); saveProgress('boss-clear');
  }
  function damagePlayer(amount, dx, dy) {
    const p = state.player; if (p.invuln > 0 || !state.running) return; p.hp = Math.max(0, p.hp - amount); p.invuln = .85; state.shake = .22; burst(p.x, p.y, '#ff6b6b', 10); KAMPAI.sound.wrong(); const len = Math.hypot(dx, dy) || 1, nx = p.x + dx / len * 9, ny = p.y + dy / len * 9; if (canMove(nx, ny, 5)) { p.x = nx; p.y = ny; } queueEvent('damage_taken', amount, {}); updateHud(); if (p.hp <= 0) { queueEvent('player_death', state.progress.chapter, { zone: state.zone }); endRun(true); }
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
    if (state.campTab === 'inventory') { content.innerHTML = '<div class="camp-list">' + Object.keys(DATA.materials).map((key) => '<div class="camp-item"><strong>' + DATA.materials[key] + '</strong><span> × ' + p.inventory[key] + '</span></div>').join('') + '</div><p>อาวุธ: <b>' + weaponName() + '</b> +' + p.equipment.weapon.enhance + ' · ATK โบนัส ' + weaponBonus() + '</p>'; }
    if (state.campTab === 'craft') { content.innerHTML = '<div class="camp-list">' + DATA.recipes.map((r) => { const can = canCraft(r); return '<div class="camp-item"><button ' + (can ? '' : 'disabled') + ' onclick="craftWeapon(\'' + r.code + '\')">คราฟ</button><strong>' + r.name + '</strong><small>ATK +' + r.damage + ' · 🪙 ' + r.cost + '</small><small>' + Object.keys(r.materials).map((k) => DATA.materials[k] + ' ' + p.inventory[k] + '/' + r.materials[k]).join(' · ') + '</small></div>'; }).join('') + '</div>'; }
    if (state.campTab === 'smith') { const level = p.equipment.weapon.enhance, cost = 60 * (level + 1); content.innerHTML = '<div class="camp-item"><button ' + (p.gold >= cost && level < 10 ? '' : 'disabled') + ' onclick="enhanceWeapon()">ตีบวก</button><strong>' + weaponName() + ' +' + level + '</strong><small>เพิ่ม ATK +2 ต่อระดับ · สูงสุด +10</small><small>ค่าใช้จ่าย 🪙 ' + cost + '</small></div>'; }
    if (state.campTab === 'rune') { content.innerHTML = p.runes.length ? '<div class="camp-list">' + p.runes.map((code) => '<div class="camp-item"><button onclick="equipRune(\'' + code + '\')">' + (p.equipment.weapon.rune === code ? 'ติดตั้งแล้ว' : 'ติดตั้ง') + '</button><strong>' + DATA.runes[code].name + '</strong><small>' + DATA.runes[code].desc + '</small></div>').join('') + '</div>' : '<p>ปราบบอสแต่ละบทเพื่อรับรูนเฉพาะตัว</p>'; }
    if (state.campTab === 'story') { content.innerHTML = DATA.chapters.map((chapter) => '<div class="story-row ' + (p.bosses[chapter.boss] ? 'done' : chapter.id === p.chapter ? 'current' : '') + '"><strong>' + chapter.title + '</strong><small>' + chapter.story + '</small></div>').join(''); }
  }
  function weaponName() { if (state.progress.equipment.weapon.code === 'training-weapon') return 'อาวุธฝึกหัด'; return weaponRecipe()?.name || 'อาวุธฝึกหัด'; }
  function canCraft(recipe) { return state.progress.gold >= recipe.cost && Object.keys(recipe.materials).every((key) => state.progress.inventory[key] >= recipe.materials[key]); }
  window.craftWeapon = (code) => { const r = DATA.recipes.find((x) => x.code === code); if (!r || !canCraft(r)) return; state.progress.gold -= r.cost; Object.keys(r.materials).forEach((key) => { state.progress.inventory[key] -= r.materials[key]; }); state.progress.equipment.weapon.code = r.code; applyEquipmentStats(); queueEvent('item_craft', r.damage, { item: r.code, cost: r.cost }); toast('คราฟ ' + r.name + ' สำเร็จ'); renderCamp(); updateHud(); saveProgress('craft'); };
  window.enhanceWeapon = () => { const w = state.progress.equipment.weapon, cost = 60 * (w.enhance + 1); if (w.enhance >= 10 || state.progress.gold < cost) return; state.progress.gold -= cost; w.enhance++; applyEquipmentStats(); queueEvent('weapon_enhance', w.enhance, { cost }); toast('ตีบวกสำเร็จ +' + w.enhance); renderCamp(); updateHud(); saveProgress('enhance'); };
  window.equipRune = (code) => { if (!state.progress.runes.includes(code) || !DATA.runes[code]) return; state.progress.equipment.weapon.rune = code; applyEquipmentStats(); queueEvent('rune_equip', null, { rune: code }); toast('ติดตั้ง ' + DATA.runes[code].name); renderCamp(); updateHud(); saveProgress('rune'); };
  function applyEquipmentStats() { const cls = currentClass(), p = state.player, skills = state.progress.skill_levels; p.maxHp = cls.hp + (p.level - 1) * 4 + skills.heart * 12 + (hasRune('guardian') ? 18 : 0); p.hp = Math.min(p.hp, p.maxHp); p.damage = cls.damage + (p.level - 1) * 2 + skills.blade * 3 + weaponBonus(); }

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
    resetWorld(rng); state.running = true; state.timed = timed; state.versus = versus; state.skillOpen = false; state.campOpen = false; state.last = 0; state.playStartedAt = Date.now();
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
    resetPlayer(); state.zone = state.progress.zone || 'village'; updateHud(); renderClassGrid();
    if (k.stats) { $('my-stats').classList.remove('is-hidden'); $('best-score').textContent = k.stats.personalBest || 0; $('play-count').textContent = k.stats.playsCount || 0; }
    const list = Array.isArray(k.leaderboard) ? k.leaderboard.slice(0, 5) : []; $('leaderboard').innerHTML = list.length ? list.map((row, i) => '<li class="' + (row.isMe ? 'me' : '') + '">' + (i + 1) + '. ' + (row.displayName || 'นักผจญภัย') + ' — ' + (row.score || 0) + '</li>').join('') : '<li>ยังไม่มีคะแนน — มาเป็นฮีโร่คนแรก!</li>';
  });
  resetPlayer(); resize(); addEventListener('resize', resize); requestAnimationFrame(loop);
})();
