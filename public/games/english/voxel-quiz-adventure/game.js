/* game.js — Voxel Quiz Adventure (Three.js + KAMPAI SDK) — Phase 3 */
(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var DATA = window.GAME_DATA;
  var TOPICS = window.GAME_TOPICS || [];
  var $ = function (id) { return document.getElementById(id); };

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm(CFG.BGM);
  KAMPAI.sound.mountToggles();
  KAMPAI.controls.mount({ dpad: true, buttons: [] });

  // ── SDK UI ──
  function renderPlayer() {
    var s = KAMPAI.student, chip = $('player-chip');
    if (!s || !chip) return;
    var av = s.photoUrl
      ? '<img src="' + s.photoUrl + '" alt="">'
      : '<div class="ini">' + (s.displayName || '?')[0] + '</div>';
    chip.innerHTML = av + '<span>' + s.displayName + '</span>';
  }

  function renderMyStats() {
    var st = KAMPAI.stats, box = $('my-stats');
    if (!st || !box) return;
    $('ms-best').textContent = (st.personalBest || 0).toLocaleString();
    $('ms-plays').textContent = (st.playsCount || 0).toLocaleString();
    box.style.display = 'flex';
  }

  function renderLeaderboard(listId) {
    var el = $(listId), rows = KAMPAI.leaderboard || [];
    if (!el) return;
    var box = listId === 'score-list' ? $('leaderboard-box') : null;
    if (!rows.length) {
      if (box) box.style.display = 'none';
      return;
    }
    if (box) box.style.display = 'block';
    var medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      var av = r.photoUrl
        ? '<img class="lb-avatar" src="' + r.photoUrl + '" alt="">'
        : '<div class="lb-avatar-init">' + (r.displayName || '?')[0] + '</div>';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
        '<span class="lb-rank">' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
        '<div class="lb-info"><div class="lb-name">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</div>' +
        '<div class="lb-sub">' + (r.personalBest || 0).toLocaleString() + ' คะแนน · ' + (r.classLabel || '') + '</div></div></li>';
    }).join('');
  }

  KAMPAI.onReady(function () {
    renderPlayer();
    renderMyStats();
    renderLeaderboard('score-list');
  });

  // ── Game state ──
  var scene, camera, renderer, player, clock;
  var enemies = [], scoreBoxes = [], quizBoxes = [], powerUps = [];
  var worldMeshes = [], obstacles = [];
  var playerParts = {}, walkAnim = 0, jumpY = 0;
  var score = 0, stars = 0, lives = CFG.LIVES;
  var gameRunning = false, paused = false;
  var usedQuestions = [], currentQuestion = null;
  var activeQuestions = [];
  var playerName = 'Player';
  var gameRng = Math.random;
  var threeReady = false;
  var selectedTopic = null;
  var selectedGrade = null;
  var invincibleUntil = 0;
  var speedBoostUntil = 0;
  var freezeUntil = 0;
  var pendingRng = null;
  var versusPending = false;
  var toastTimer = null;
  var minimapCtx = null;

  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    if (id) $(id).classList.add('active');
  }

  function playerDisplayName() {
    return (KAMPAI.student && KAMPAI.student.displayName) || 'Player';
  }

  function topicMeta(slug) {
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].slug === slug) return TOPICS[i];
    }
    return { slug: slug, title: slug, icon: '📚' };
  }

  function questionsForTopicGrade(topic, grade) {
    var list = DATA[topic] || [];
    return list.filter(function (q) {
      return !q.grades || q.grades.indexOf(grade) >= 0;
    });
  }

  function initTopicGrid() {
    var grid = $('topic-grid');
    if (!grid) return;
    grid.innerHTML = '';
    TOPICS.forEach(function (t) {
      var count = (DATA[t.slug] || []).length;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-btn';
      btn.innerHTML = '<span class="topic-icon">' + t.icon + '</span>' +
        '<span class="topic-name">' + t.title + '<br><small style="color:#9ca3af;font-weight:400">' + count + ' ข้อ</small></span>';
      btn.addEventListener('click', function () {
        selectedTopic = t.slug;
        showGradeScreen();
      });
      grid.appendChild(btn);
    });
  }

  function showGradeScreen() {
    var meta = topicMeta(selectedTopic);
    $('grade-topic-label').textContent = meta.icon + ' ' + meta.title;
    var grid = $('grade-grid');
    grid.innerHTML = '';
    CFG.GRADES.forEach(function (g) {
      var count = questionsForTopicGrade(selectedTopic, g.id).length;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'grade-btn';
      btn.textContent = g.label;
      btn.title = count + ' ข้อ';
      if (!count) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
      } else {
        btn.addEventListener('click', function () {
          selectedGrade = g.id;
          startGame(pendingRng);
          pendingRng = null;
        });
      }
      grid.appendChild(btn);
    });
    showScreen('grade-screen');
  }

  function openCategoryFlow(rng, forVersus) {
    pendingRng = rng || null;
    versusPending = !!forVersus;
    try { KAMPAI.sound.unlock(); } catch (_) {}
    showScreen('category-screen');
  }

  // ── Juice / FX ──
  function worldToScreen(wx, wy, wz) {
    if (!camera) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var v = new THREE.Vector3(wx, wy || 1.5, wz);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function burst(wx, wz, color) {
    var p = worldToScreen(wx, 1.8, wz);
    var layer = $('fx-layer');
    if (!layer) return;
    for (var i = 0; i < 10; i++) {
      var el = document.createElement('div');
      el.className = 'particle';
      var a = (Math.PI * 2 / 10) * i;
      var d = 28 + gameRng() * 32;
      var sz = 5 + gameRng() * 6;
      el.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + color +
        ';--dx:' + (Math.cos(a) * d | 0) + 'px;--dy:' + (Math.sin(a) * d | 0) + 'px;';
      layer.appendChild(el);
      el.addEventListener('animationend', function () { el.remove(); });
    }
  }

  function scorePop(wx, wz, text, color) {
    var p = worldToScreen(wx, 2.2, wz);
    var el = document.createElement('div');
    el.className = 'score-pop';
    el.textContent = text;
    el.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;color:' + color + ';font-size:22px;';
    $('fx-layer').appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
  }

  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function bouncePlayer() {
    jumpY = 0.45;
  }

  function speakForQuestion(q) {
    var text = q.speak;
    if (!text && q.choices && q.choices[q.answer]) {
      var c = q.choices[q.answer];
      if (/^[A-Za-z\s'-]+$/.test(c)) text = c;
    }
    if (text) try { KAMPAI.sound.speak(text, 'en-US'); } catch (_) {}
  }

  function getPlayerSpeed() {
    return Date.now() < speedBoostUntil
      ? CFG.PLAYER_SPEED * CFG.SPEED_BOOST_MULT
      : CFG.PLAYER_SPEED;
  }

  function enemiesFrozen() {
    return Date.now() < freezeUntil;
  }

  // ── Minimap ──
  function initMinimap() {
    var c = $('minimap');
    if (c) minimapCtx = c.getContext('2d');
  }

  function mapToMinimap(x, z, size) {
    var half = CFG.MAP_HALF;
    return {
      x: ((x + half) / (half * 2)) * size,
      y: ((z + half) / (half * 2)) * size,
    };
  }

  function drawMinimapDot(x, z, color, radius) {
    if (!minimapCtx) return;
    var s = CFG.MINIMAP_SIZE;
    var p = mapToMinimap(x, z, s);
    minimapCtx.fillStyle = color;
    minimapCtx.beginPath();
    minimapCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  function updateMinimap() {
    if (!minimapCtx || !player || !gameRunning) return;
    var s = CFG.MINIMAP_SIZE;
    minimapCtx.clearRect(0, 0, s, s);
    minimapCtx.fillStyle = 'rgba(22,163,74,0.9)';
    minimapCtx.fillRect(0, 0, s, s);
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    minimapCtx.lineWidth = 1;
    var i;
    for (i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var p = mapToMinimap(o.x, o.z, s);
      minimapCtx.fillStyle = 'rgba(0,0,0,0.35)';
      minimapCtx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    for (i = 0; i < scoreBoxes.length; i++) {
      drawMinimapDot(scoreBoxes[i].position.x, scoreBoxes[i].position.z, '#f97316', 2.5);
    }
    for (i = 0; i < quizBoxes.length; i++) {
      drawMinimapDot(quizBoxes[i].position.x, quizBoxes[i].position.z, '#fbbf24', 2.5);
    }
    for (i = 0; i < powerUps.length; i++) {
      var pu = powerUps[i];
      drawMinimapDot(pu.mesh.position.x, pu.mesh.position.z,
        pu.type === 'speed' ? '#60a5fa' : '#c084fc', 3);
    }
    for (i = 0; i < enemies.length; i++) {
      drawMinimapDot(enemies[i].position.x, enemies[i].position.z, '#ef4444', 3);
    }
    drawMinimapDot(player.position.x, player.position.z, '#3b82f6', 4);
    minimapCtx.strokeStyle = '#fff';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.strokeRect(0.5, 0.5, s - 1, s - 1);
  }

  function updatePowerupStatus() {
    var el = $('powerup-status');
    if (!el) return;
    var parts = [];
    var now = Date.now();
    if (now < speedBoostUntil) parts.push('⚡ ' + Math.ceil((speedBoostUntil - now) / 1000) + 's');
    if (now < freezeUntil) parts.push('❄️ ' + Math.ceil((freezeUntil - now) / 1000) + 's');
    el.textContent = parts.join(' · ');
  }

  // ── Collision / bounds ──
  function clampMap(x, z) {
    var h = CFG.MAP_HALF;
    return {
      x: Math.max(-h, Math.min(h, x)),
      z: Math.max(-h, Math.min(h, z)),
    };
  }

  function circleHitsObstacle(x, z, radius) {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var dx = Math.abs(x - o.x);
      var dz = Math.abs(z - o.z);
      if (dx < o.halfW + radius && dz < o.halfD + radius) return true;
    }
    return false;
  }

  function isSpawnClear(x, z) {
    if (circleHitsObstacle(x, z, CFG.PLAYER_RADIUS + 0.3)) return false;
    var c = clampMap(x, z);
    return c.x === x && c.z === z;
  }

  function tryMove(nx, nz) {
    var c = clampMap(nx, nz);
    nx = c.x; nz = c.z;
    var r = CFG.PLAYER_RADIUS;
    if (!circleHitsObstacle(nx, player.position.z, r)) {
      player.position.x = nx;
    }
    if (!circleHitsObstacle(player.position.x, nz, r)) {
      player.position.z = nz;
    }
  }

  function randPos() {
    var tries = 0;
    while (tries < 40) {
      var x = (gameRng() - 0.5) * (CFG.MAP_HALF * 2 - 6);
      var z = (gameRng() - 0.5) * (CFG.MAP_HALF * 2 - 6);
      if (isSpawnClear(x, z) && Math.abs(x) > 2 && Math.abs(z) > 2) {
        return { x: x, z: z };
      }
      tries++;
    }
    return { x: (gameRng() - 0.5) * 20, z: (gameRng() - 0.5) * 20 };
  }

  function addObstacle(x, z, halfW, halfD) {
    obstacles.push({ x: x, z: z, halfW: halfW, halfD: halfD });
  }

  function clearWorldMeshes() {
    var i;
    for (i = 0; i < worldMeshes.length; i++) scene.remove(worldMeshes[i]);
    worldMeshes = [];
    obstacles = [];
  }

  function buildWorld() {
    clearWorldMeshes();
    var i;
    for (i = 0; i < 20; i++) {
      var h = gameRng() * 6 + 2;
      var bx = (gameRng() - 0.5) * 60;
      var bz = (gameRng() - 0.5) * 60;
      if (Math.abs(bx) < 4 && Math.abs(bz) < 4) continue;
      var b = new THREE.Mesh(
        new THREE.BoxGeometry(2, h, 2),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      b.position.set(bx, h / 2, bz);
      scene.add(b); worldMeshes.push(b);
      addObstacle(bx, bz, 1.1, 1.1);
    }
    for (i = 0; i < 15; i++) {
      var tx = (gameRng() - 0.5) * 50;
      var tz = (gameRng() - 0.5) * 50;
      if (Math.abs(tx) < 3 && Math.abs(tz) < 3) continue;
      var trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 3, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x92400e })
      );
      var leaves = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshLambertMaterial({ color: 0x16a34a })
      );
      var g = new THREE.Group();
      g.add(trunk); trunk.position.y = 1.5;
      g.add(leaves); leaves.position.y = 3.5;
      g.position.set(tx, 0, tz);
      scene.add(g); worldMeshes.push(g);
      addObstacle(tx, tz, 1.2, 1.2);
    }
  }

  // ── Three.js world ──
  function init3D() {
    if (threeReady) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf97316);
    scene.fog = new THREE.Fog(0xf97316, 30, 60);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    $('app').insertBefore(renderer.domElement, $('app').firstChild);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dir = new THREE.DirectionalLight(0xfff0d0, 0.8);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    var ground = new THREE.Mesh(
      new THREE.BoxGeometry(80, 1, 80),
      new THREE.MeshLambertMaterial({ color: 0x4ade80 })
    );
    ground.position.y = -0.5;
    scene.add(ground);

    createPlayer();
    buildWorld();
    spawnItems();
    spawnEnemies();
    clock = new THREE.Clock();
    threeReady = true;
    animate();
  }

  function createPlayer() {
    player = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x3b82f6 })
    );
    body.position.y = 1.5; player.add(body);
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    head.position.y = 2.3; player.add(head);
    playerParts.armL = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    playerParts.armL.position.set(-0.55, 1.5, 0); player.add(playerParts.armL);
    playerParts.armR = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
    );
    playerParts.armR.position.set(0.55, 1.5, 0); player.add(playerParts.armR);
    playerParts.legL = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x1e3a5f })
    );
    playerParts.legL.position.set(-0.2, 0.4, 0); player.add(playerParts.legL);
    playerParts.legR = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x1e3a5f })
    );
    playerParts.legR.position.set(0.2, 0.4, 0); player.add(playerParts.legR);
    player.position.set(0, 0, 0);
    scene.add(player);
  }

  function spawnItems() {
    var i;
    for (i = 0; i < scoreBoxes.length; i++) scene.remove(scoreBoxes[i]);
    for (i = 0; i < quizBoxes.length; i++) scene.remove(quizBoxes[i]);
    for (i = 0; i < powerUps.length; i++) scene.remove(powerUps[i].mesh);
    scoreBoxes = []; quizBoxes = []; powerUps = [];
    for (i = 0; i < CFG.SCORE_BOX_COUNT; i++) {
      var p = randPos();
      var box = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xf97316 })
      );
      box.position.set(p.x, 1.5, p.z);
      scene.add(box); scoreBoxes.push(box);
    }
    for (i = 0; i < CFG.QUIZ_BOX_COUNT; i++) {
      p = randPos();
      var qbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
      );
      qbox.position.set(p.x, 1.5, p.z);
      scene.add(qbox); quizBoxes.push(qbox);
    }
    spawnPowerUps();
  }

  function spawnPowerUps() {
    var i, types = ['speed', 'freeze'];
    for (i = 0; i < CFG.POWERUP_COUNT; i++) {
      var type = types[i % 2];
      var color = type === 'speed' ? 0x3b82f6 : 0xa855f7;
      var pos = randPos();
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.65, 0.65),
        new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.25 })
      );
      mesh.position.set(pos.x, 1.5, pos.z);
      scene.add(mesh);
      powerUps.push({ mesh: mesh, type: type });
    }
  }

  function respawnPowerUp(idx) {
    var type = powerUps[idx].type;
    var color = type === 'speed' ? 0x3b82f6 : 0xa855f7;
    var pos = randPos();
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.65, 0.65),
      new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.25 })
    );
    mesh.position.set(pos.x, 1.5, pos.z);
    scene.add(mesh);
    powerUps[idx] = { mesh: mesh, type: type };
  }

  function collectPowerUp(idx) {
    var pu = powerUps[idx];
    var px = pu.mesh.position.x, pz = pu.mesh.position.z;
    var color = pu.type === 'speed' ? '#60a5fa' : '#c084fc';
    burst(px, pz, color);
    bouncePlayer();
    if (pu.type === 'speed') {
      speedBoostUntil = Date.now() + CFG.SPEED_BOOST_MS;
      toast('⚡ วิ่งเร็ว ' + (CFG.SPEED_BOOST_MS / 1000) + ' วิ!');
      try { KAMPAI.sound.correct(); } catch (_) {}
    } else {
      freezeUntil = Date.now() + CFG.FREEZE_MS;
      toast('❄️ ศัตรูหยุด ' + (CFG.FREEZE_MS / 1000) + ' วิ!');
      try { KAMPAI.sound.correct(); } catch (_) {}
    }
    respawnPowerUp(idx);
    updatePowerupStatus();
  }

  function spawnEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) scene.remove(enemies[i]);
    enemies = [];
    for (i = 0; i < CFG.ENEMY_COUNT; i++) {
      var e = new THREE.Group();
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1.2, 1),
        new THREE.MeshLambertMaterial({ color: 0x1f2937 })
      );
      body.position.y = 0.6; e.add(body);
      var eyeL = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      eyeL.position.set(-0.2, 0.8, 0.5); e.add(eyeL);
      var eyeR = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      eyeR.position.set(0.2, 0.8, 0.5); e.add(eyeR);
      var ep = randPos();
      e.position.set(ep.x, 0, ep.z);
      scene.add(e); enemies.push(e);
    }
  }

  function readInput() {
    var inp = KAMPAI.input || {};
    var dx = 0, dz = 0;
    if (inp.up) dz -= 1;
    if (inp.down) dz += 1;
    if (inp.left) dx -= 1;
    if (inp.right) dx += 1;
    return { dx: dx, dz: dz };
  }

  function playerHit() {
    if (Date.now() < invincibleUntil) return;
    lives--;
    updateHUD();
    try { KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false); } catch (_) {}
    invincibleUntil = Date.now() + CFG.INVINCIBLE_MS;

    // ผลักศัตรูถอย + ผู้เล่นเด้งถอย
    var j;
    for (j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      var away = new THREE.Vector3().subVectors(e.position, player.position).normalize();
      e.position.x += away.x * 4;
      e.position.z += away.z * 4;
      var ec = clampMap(e.position.x, e.position.z);
      e.position.x = ec.x; e.position.z = ec.z;
    }
    var back = new THREE.Vector3().subVectors(player.position, enemies[0] ? enemies[0].position : player.position);
    if (back.length() < 0.01) back.set(1, 0, 0);
    back.normalize();
    tryMove(player.position.x + back.x * 2, player.position.z + back.z * 2);

    if (lives <= 0) endGame(false);
  }

  function setPlayerVisible(v) {
    player.visible = v;
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!threeReady) return;
    renderer.render(scene, camera);
    updateNametag();
    if (gameRunning) {
      updateMinimap();
      updatePowerupStatus();
    }

    if (jumpY > 0.01) {
      jumpY *= 0.82;
    } else {
      jumpY = 0;
    }
    if (player) player.position.y = jumpY;

    // กระพริบตอนไม่สะเทือน
    if (Date.now() < invincibleUntil && player) {
      setPlayerVisible(Math.floor(Date.now() / 120) % 2 === 0);
    } else if (player) {
      setPlayerVisible(true);
    }

    if (!gameRunning || paused) return;

    var move = readInput();
    var dx = move.dx, dz = move.dz;
    var moving = dx !== 0 || dz !== 0;

    if (moving) {
      var angle = Math.atan2(dx, dz);
      player.rotation.y = angle;
      var nx = player.position.x + Math.sin(angle) * getPlayerSpeed();
      var nz = player.position.z + Math.cos(angle) * getPlayerSpeed();
      tryMove(nx, nz);
      walkAnim += 0.15;
      var swing = Math.sin(walkAnim) * 0.5;
      playerParts.armL.rotation.x = swing;
      playerParts.armR.rotation.x = -swing;
      playerParts.legL.rotation.x = -swing;
      playerParts.legR.rotation.x = swing;
    } else {
      playerParts.armL.rotation.x = 0;
      playerParts.armR.rotation.x = 0;
      playerParts.legL.rotation.x = 0;
      playerParts.legR.rotation.x = 0;
    }

    var j;
    var frozen = enemiesFrozen();
    for (j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (!frozen) {
        var dir = new THREE.Vector3().subVectors(player.position, e.position).normalize();
        var ex = e.position.x + dir.x * CFG.ENEMY_SPEED;
        var ez = e.position.z + dir.z * CFG.ENEMY_SPEED;
        if (!circleHitsObstacle(ex, e.position.z, 0.6)) e.position.x = ex;
        if (!circleHitsObstacle(e.position.x, ez, 0.6)) e.position.z = ez;
        var ec = clampMap(e.position.x, e.position.z);
        e.position.x = ec.x; e.position.z = ec.z;
      }
      e.lookAt(player.position.x, 0, player.position.z);
      if (e.position.distanceTo(player.position) < CFG.COLLECT_RADIUS) {
        playerHit();
      }
    }

    var t = Date.now() * 0.003;
    for (j = 0; j < scoreBoxes.length; j++) {
      scoreBoxes[j].rotation.y += 0.03;
      scoreBoxes[j].position.y = 1.5 + Math.sin(t) * 0.3;
    }
    for (j = 0; j < quizBoxes.length; j++) {
      quizBoxes[j].rotation.y += 0.03;
      quizBoxes[j].position.y = 1.5 + Math.sin(t + 1) * 0.3;
    }
    for (j = 0; j < powerUps.length; j++) {
      powerUps[j].mesh.rotation.y += 0.04;
      powerUps[j].mesh.position.y = 1.5 + Math.sin(t + j) * 0.25;
    }

    for (j = scoreBoxes.length - 1; j >= 0; j--) {
      if (player.position.distanceTo(scoreBoxes[j].position) < CFG.COLLECT_RADIUS) {
        var sx = scoreBoxes[j].position.x, sz = scoreBoxes[j].position.z;
        scene.remove(scoreBoxes[j]); scoreBoxes.splice(j, 1);
        score += CFG.SCORE_PER_BOX;
        updateHUD();
        burst(sx, sz, '#f97316');
        scorePop(sx, sz, '+' + CFG.SCORE_PER_BOX, '#fb923c');
        bouncePlayer();
        try { KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true); } catch (_) {}
        var np = randPos();
        var nb = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.7),
          new THREE.MeshLambertMaterial({ color: 0xf97316 })
        );
        nb.position.set(np.x, 1.5, np.z);
        scene.add(nb); scoreBoxes.push(nb);
      }
    }

    for (j = quizBoxes.length - 1; j >= 0; j--) {
      if (player.position.distanceTo(quizBoxes[j].position) < CFG.COLLECT_RADIUS) {
        var qx = quizBoxes[j].position.x, qz = quizBoxes[j].position.z;
        scene.remove(quizBoxes[j]); quizBoxes.splice(j, 1);
        burst(qx, qz, '#fbbf24');
        bouncePlayer();
        openQuiz();
        var qp = randPos();
        var nqb = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.7),
          new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
        );
        nqb.position.set(qp.x, 1.5, qp.z);
        scene.add(nqb); quizBoxes.push(nqb);
        break;
      }
    }

    for (j = 0; j < powerUps.length; j++) {
      if (player.position.distanceTo(powerUps[j].mesh.position) < CFG.COLLECT_RADIUS) {
        collectPowerUp(j);
      }
    }

    var ideal = new THREE.Vector3(player.position.x, player.position.y + 5, player.position.z + 8);
    camera.position.lerp(ideal, 0.05);
    camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
  }

  function updateNametag() {
    var tag = $('nametag');
    if (!player || !camera || !tag) return;
    var pos = new THREE.Vector3(player.position.x, 3.2, player.position.z);
    pos.project(camera);
    tag.style.left = ((pos.x * 0.5 + 0.5) * window.innerWidth) + 'px';
    tag.style.top = ((-pos.y * 0.5 + 0.5) * window.innerHeight) + 'px';
    tag.textContent = playerName;
  }

  function updateHUD() {
    var hearts = '';
    for (var i = 0; i < CFG.LIVES; i++) hearts += (i < lives) ? '❤️' : '🖤';
    $('hudLives').textContent = hearts;
    $('hudScore').textContent = 'คะแนน: ' + score;
    $('hudStars').textContent = '⭐ ' + stars + ' / ' + CFG.STAR_GOAL;
  }

  function pickQuestion() {
    if (!activeQuestions.length) {
      activeQuestions = questionsForTopicGrade(selectedTopic, selectedGrade);
    }
    var available = activeQuestions.filter(function (_, i) { return usedQuestions.indexOf(i) < 0; });
    if (!available.length) usedQuestions = [];
    var pool = available.length ? available : activeQuestions.slice();
    if (!pool.length) {
      return { q: 'No questions', choices: ['A', 'B', 'C', 'D'], answer: 0 };
    }
    var picked = pool[Math.floor(gameRng() * pool.length)];
    var idx = activeQuestions.indexOf(picked);
    usedQuestions.push(idx);
    return picked;
  }

  function openQuiz() {
    paused = true;
    currentQuestion = pickQuestion();
    $('quizQuestion').textContent = currentQuestion.q;
    $('quizFeedback').textContent = '';
    $('quizFeedback').className = '';
    var choicesDiv = $('quizChoices');
    choicesDiv.innerHTML = '';
    try { speakForQuestion(currentQuestion); } catch (_) {}
    currentQuestion.choices.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-choice';
      btn.textContent = c;
      btn.onclick = function () { answerQuiz(i); };
      choicesDiv.appendChild(btn);
    });
    $('quizModal').classList.add('open');
  }

  function answerQuiz(selected) {
    var correct = currentQuestion.answer;
    var btns = $('quizChoices').querySelectorAll('.quiz-choice');
    for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
    var fb = $('quizFeedback');
    if (selected === correct) {
      btns[selected].classList.add('correct');
      fb.textContent = '✅ ถูกต้อง! +' + CFG.SCORE_PER_QUIZ + ' คะแนน +1 ดาว';
      fb.style.color = '#16a34a';
      score += CFG.SCORE_PER_QUIZ;
      stars++;
      updateHUD();
      try { KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true); } catch (_) {}
      if (stars >= CFG.STAR_GOAL) {
        setTimeout(function () { closeQuiz(); endGame(true); }, 1500);
        return;
      }
    } else {
      btns[selected].classList.add('wrong');
      btns[correct].classList.add('correct');
      fb.textContent = '❌ ผิด! คำตอบคือ: ' + currentQuestion.choices[correct];
      fb.style.color = '#dc2626';
      try { KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false); } catch (_) {}
    }
    setTimeout(function () { closeQuiz(); }, 2000);
  }

  function closeQuiz() {
    $('quizModal').classList.remove('open');
    paused = false;
  }

  function endGame(won) {
    gameRunning = false;
    try { KAMPAI.sound.bgmStop(); } catch (_) {}
    $('hud').style.display = 'none';
    $('minimap-wrap').style.display = 'none';
    $('nametag').style.display = 'none';
    $('player-chip').style.display = 'none';
    setPlayerVisible(true);

    var meta = {
      mode: 'adventure',
      stars: stars,
      won: won,
      topic: selectedTopic,
      grade: selectedGrade,
    };

    if (won) {
      showScreen('win-screen');
      $('winScore').textContent = 'คะแนน: ' + score + ' · ดาว: ' + stars + '/' + CFG.STAR_GOAL;
      KAMPAI.submitScore(score, meta);
    } else {
      try { KAMPAI.sound.gameOver(); } catch (_) {}
      showScreen('gameover-screen');
      $('goScore').textContent = 'คะแนน: ' + score;
      $('goStars').textContent = 'ดาว: ' + stars + ' / ' + CFG.STAR_GOAL + ' · ชีวิตหมด';
      renderLeaderboard('score-list-go');
      KAMPAI.submitScore(score, meta);
    }
  }

  function startGame(rng) {
    if (!selectedTopic || !selectedGrade) return;
    gameRng = rng || Math.random;
    playerName = playerDisplayName();
    score = 0; stars = 0; lives = CFG.LIVES;
    usedQuestions = [];
    invincibleUntil = 0;
    speedBoostUntil = 0;
    freezeUntil = 0;
    jumpY = 0;
    activeQuestions = questionsForTopicGrade(selectedTopic, selectedGrade);
    if (!activeQuestions.length) {
      alert('ไม่มีโจทย์สำหรับหมวด/ชั้นนี้');
      showGradeScreen();
      return;
    }

    showScreen(null);
    $('gameover-screen').classList.remove('active');
    $('win-screen').classList.remove('active');
    $('hud').style.display = 'block';
    $('minimap-wrap').style.display = 'block';
    $('nametag').style.display = 'block';
    $('player-chip').style.display = 'flex';
    renderPlayer();
    updateHUD();

    if (!threeReady) init3D();
    else {
      buildWorld();
      player.position.set(0, 0, 0);
      spawnItems();
      spawnEnemies();
    }
    gameRunning = true;
    paused = false;
    try { KAMPAI.sound.bgmStart(); } catch (_) {}
  }

  // ── Versus ──
  var vs = KampaiVersus.create({
    duration: CFG.VERSUS_DURATION,
    title: 'Voxel Quiz Adventure',
    rankBy: 'score',
    onPlay: function (ctx) {
      if (!selectedTopic || !selectedGrade) {
        openCategoryFlow(ctx.rng, true);
        pendingRng = ctx.rng;
        return;
      }
      startGame(ctx.rng);
    },
    onEnd: function () {
      gameRunning = false;
      paused = true;
      try { KAMPAI.sound.bgmStop(); } catch (_) {}
    }
  });

  initTopicGrid();
  initMinimap();

  $('startBtn').addEventListener('click', function () { openCategoryFlow(); });
  $('replayBtn').addEventListener('click', function () { openCategoryFlow(); });
  $('winReplayBtn').addEventListener('click', function () { openCategoryFlow(); });
  $('btn-cat-back').addEventListener('click', function () { showScreen('blocker'); });
  $('btn-grade-back').addEventListener('click', function () { showScreen('category-screen'); });
  $('btn-versus').addEventListener('click', function () {
    try { KAMPAI.sound.unlock(); } catch (_) {}
    if (!selectedTopic || !selectedGrade) {
      openCategoryFlow(null, true);
      return;
    }
    vs.openMenu();
  });
  $('btn-home').addEventListener('click', function () { KAMPAI.goHome(); });
  $('btn-home-win').addEventListener('click', function () { KAMPAI.goHome(); });

  window.addEventListener('resize', function () {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  init3D();
})();
