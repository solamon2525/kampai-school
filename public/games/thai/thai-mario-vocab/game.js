/* game.js — Phaser 4.2.1 2D Mario-style Thai Vocabulary Platformer + KAMPAI Integration */
(function () {
  'use strict';

  const CFG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;
  const RULES = window.ThaiMarioRules;
  const SFX = window.ThaiMarioAudio;
  const TEX = window.ThaiMarioTextures;

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm('none');
  KAMPAI.sound.mountToggles();

  // ── Shared runtime state ──
  let phaserGame = null;
  let activeRng = Math.random;
  let roundState = RULES.createRoundState(CFG);
  let gameActive = false;
  let toastTimer = null;
  let reducedMotion = false;

  try {
    reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) {}

  // ── KampaiOrient ──
  KampaiOrient.init({
    prefer: CFG.ORIENTATION || 'landscape',
    lockOnStart: !!CFG.LOCK_ORIENTATION_ON_START,
    overlayLandscape: 'กรุณาหมุนเครื่องเป็น<b>แนวนอน</b><br>มาริโอตะลุยคำไทยเล่นถนัดที่สุดในแนวนอน',
    overlayPortrait: 'กรุณาหมุนเครื่องเป็น<b>แนวตั้ง</b>',
    onChange: function () {
      if (phaserGame && phaserGame.scale) {
        const v = KampaiOrient.getViewportSize();
        phaserGame.scale.resize(Math.max(320, Math.floor(v.w)), Math.max(240, Math.floor(v.h)));
      }
    },
    onPauseChange: function (paused) {
      if (!phaserGame) return;
      const scene = phaserGame.scene.getScene('MarioStage');
      if (scene && scene.sys && scene.sys.isActive()) {
        if (paused) {
          scene.physics.pause();
          SFX.stopBgm();
        } else if (gameActive) {
          scene.physics.resume();
          const world = DATA.WORLDS[roundState.stageIndex] || DATA.WORLDS[0];
          SFX.startBgm(world.bgmTheme);
        }
      }
    }
  });

  // ── Touch Controls ──
  const touchState = { left: false, right: false, jumpDown: false, jumpJustPressed: false };
  function updateTouchVisibility() {
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 900;
    document.body.classList.toggle('show-touch', isTouchDevice);
  }
  updateTouchVisibility();
  window.addEventListener('resize', updateTouchVisibility);

  function bindTouchBtn(id, onDown, onUp) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      el.classList.add('active');
      SFX.unlock();
      onDown();
    };
    const up = function (e) {
      if (e) e.preventDefault();
      el.classList.remove('active');
      onUp();
    };
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointerup', up, { passive: false });
    el.addEventListener('pointercancel', up, { passive: false });
    el.addEventListener('pointerleave', up, { passive: false });
  }
  bindTouchBtn('tbtn-left', function () { touchState.left = true; }, function () { touchState.left = false; });
  bindTouchBtn('tbtn-right', function () { touchState.right = true; }, function () { touchState.right = false; });
  bindTouchBtn('tbtn-jump', function () {
    if (!touchState.jumpDown) touchState.jumpJustPressed = true;
    touchState.jumpDown = true;
  }, function () {
    touchState.jumpDown = false;
  });

  // ── HUD & Menu Helpers ──
  function renderPlayer() {
    const s = KAMPAI.student;
    const st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    if (!chip) return;
    const av = s.photoUrl
      ? '<img src="' + s.photoUrl + '" alt="" style="object-fit:cover">'
      : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
    const best = st ? ' · <span class="pc-best">สถิติ ' + (st.personalBest || 0).toLocaleString() + '</span>' : '';
    chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
    chip.style.display = 'flex';
  }

  function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    const bestEl = document.getElementById('ms-best');
    const playsEl = document.getElementById('ms-plays');
    const boxEl = document.getElementById('my-stats');
    if (bestEl) bestEl.innerText = (st.personalBest || 0).toLocaleString();
    if (playsEl) playsEl.innerText = (st.playsCount || 0).toLocaleString();
    if (boxEl) boxEl.style.display = 'flex';
  }

  function renderLeaderboard(listId) {
    const el = document.getElementById(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) {
      el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      const av = r.photoUrl
        ? '<img class="lb-avatar" src="' + r.photoUrl + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">'
        : '';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
        '<span>' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
        '<span>' + r.displayName + (r.isMe ? ' (คุณ)' : '') + ' · ' + (r.personalBest || 0).toLocaleString() + '</span>' +
      '</li>';
    }).join('');
  }

  function bootMenu() {
    const tips = document.getElementById('tips-list');
    if (tips && !tips.children.length) {
      (DATA.tips || []).forEach(function (t) {
        const li = document.createElement('li');
        li.textContent = t;
        tips.appendChild(li);
      });
    }
  }

  function updateHud() {
    const scoreEl = document.getElementById('score-value');
    const wordEl = document.getElementById('word-count');
    const centerEl = document.getElementById('hud-center');
    const lifeEl = document.getElementById('life-container');
    if (scoreEl) scoreEl.textContent = String(roundState.score);
    if (wordEl) wordEl.textContent = String(roundState.correct);
    const world = DATA.WORLDS[roundState.stageIndex] || DATA.WORLDS[0];
    if (centerEl) centerEl.textContent = world.name;
    if (lifeEl) {
      let hearts = '';
      for (let i = 0; i < roundState.maxLives; i++) {
        hearts += i < roundState.lives ? '❤️' : '🖤';
      }
      lifeEl.textContent = hearts;
    }
  }

  function popScorePill() {
    const el = document.getElementById('score-container');
    if (!el) return;
    el.classList.add('pop');
    setTimeout(function () { el.classList.remove('pop'); }, 140);
  }

  function showToast(text, good) {
    const el = document.getElementById('lesson-toast');
    if (!el) return;
    el.textContent = text;
    el.className = good ? 'good' : 'bad';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'hidden';
    }, good ? 2200 : 3400);
  }

  KAMPAI.onReady(function () {
    renderPlayer();
    renderMyStats();
    renderLeaderboard('score-list');
  });
  bootMenu();
  updateHud();

  // ── KampaiVersus (3 โหมดมาตรฐาน) ──
  const vs = window.KampaiVersus ? KampaiVersus.create({
    duration: CFG.TIME_SECONDS,
    title: DATA.title || 'มาริโอตะลุยคำไทย',
    rankBy: 'score',
    onPlay: function (opts) {
      startGame(opts && opts.rng ? opts.rng : Math.random);
    },
    onEnd: function () {
      endGame(false, true);
    }
  }) : null;

  window.openVersus = function () {
    if (vs) vs.openMenu();
  };

  // ── Pause when tab hidden ──
  document.addEventListener('visibilitychange', function () {
    if (!phaserGame) return;
    const scene = phaserGame.scene.getScene('MarioStage');
    if (!scene || !scene.sys || !scene.sys.isActive()) return;
    if (document.hidden) {
      scene.physics.pause();
      SFX.stopBgm();
    } else if (gameActive && !KampaiOrient.isPaused()) {
      scene.physics.resume();
      const world = DATA.WORLDS[roundState.stageIndex] || DATA.WORLDS[0];
      SFX.startBgm(world.bgmTheme);
    }
  });

  // ── Phaser 4 Scene: MarioStageScene ──
  function createMarioSceneClass() {
    return class MarioStageScene extends Phaser.Scene {
      constructor() {
        super('MarioStage');
      }

      init(data) {
        this.stageIndex = (data && typeof data.stageIndex === 'number') ? data.stageIndex : roundState.stageIndex;
        this.worldCfg = DATA.WORLDS[this.stageIndex] || DATA.WORLDS[0];
        this.tileSize = CFG.TILE_SIZE;
        this.worldWidth = this.worldCfg.lengthTiles * this.tileSize;
        this.worldHeight = 14 * this.tileSize; // 560 px virtual height
        this.lastGroundTick = -999999;
        this.lastPressTick = -999999;
        this.tickCount = 0;
        this.invulnUntil = 0;
        this.hitStopUntil = 0;
        this.trauma = 0;
        this.traumaT = 0;
        this.stageClearing = false;
        this.playerDeadAnim = false;
        this.checkpointX = 3 * this.tileSize;
        this.checkpointY = 10 * this.tileSize;
        this.checkpointReached = false;
        this.qBlockCooldowns = new WeakMap();
        this.wordCardTweens = [];
        this.enemiesList = [];
      }

      create() {
        TEX.generateAll(this);

        // พื้นหลังสีตามด่าน
        this.cameras.main.setBackgroundColor(this.worldCfg.skyColor || '#5c94fc');
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight + 160);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // จัด Zoom อัตโนมัติให้โลกสูง 560px พอดีหน้าจอทุกขนาด (360x800, 768x1024, 1280x720)
        this.updateCameraZoom();
        this.scale.on('resize', this.updateCameraZoom, this);

        // ฉากหลัง Parallax (เมฆ ภูเขา พุ่มไม้)
        this.buildParallaxScenery();

        // กลุ่ม Physics
        this.solids = this.physics.add.staticGroup();
        this.blocks = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.wordTriggers = this.physics.add.group({ allowGravity: false, immovable: true });

        this.buildTerrain();
        this.buildPipes();
        this.buildBlocks();
        this.buildWordZones();
        this.buildEnemies();
        this.buildCheckpointAndGoal();

        // สร้างผู้เล่น
        this.player = this.physics.add.sprite(this.checkpointX, this.checkpointY, 'hero_idle');
        this.player.setDisplaySize(38, 38);
        this.player.body.setSize(24, 34, true);
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);

        // ชนพื้น / ท่อ / อิฐ
        this.physics.add.collider(this.player, this.solids);
        this.physics.add.collider(this.player, this.blocks, this.onHitBlock, null, this);
        this.physics.add.collider(this.enemies, this.solids);
        this.physics.add.collider(this.enemies, this.blocks);
        this.physics.add.collider(this.pickups, this.solids);
        this.physics.add.collider(this.pickups, this.blocks);

        // Overlap ศัตรู / ไอเทม / คำศัพท์ / checkpoint / เส้นชัย
        this.physics.add.overlap(this.player, this.enemies, this.onTouchEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.onTouchPickup, null, this);
        this.physics.add.overlap(this.player, this.wordTriggers, this.onTouchWord, null, this);
        this.physics.add.overlap(this.player, this.checkpointZone, this.onReachCheckpoint, null, this);
        this.physics.add.overlap(this.player, this.flagZone, this.onReachFlagpole, null, this);

        // กล้องติดตามผู้เล่น
        this.cameras.main.startFollow(this.player, true, 0.14, 0.14);

        // คีย์บอร์ด
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
          a: Phaser.Input.Keyboard.KeyCodes.A,
          d: Phaser.Input.Keyboard.KeyCodes.D,
          w: Phaser.Input.Keyboard.KeyCodes.W,
          space: Phaser.Input.Keyboard.KeyCodes.SPACE,
          shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // แสดงชื่อด่านกลางจอตอนเริ่ม
        this.showStageBanner(this.worldCfg.name);

        // เริ่มเพลง Chiptune
        if (gameActive) {
          SFX.startBgm(this.worldCfg.bgmTheme);
        }

        // Cleanup listeners on shutdown
        this.events.once('shutdown', () => {
          this.scale.off('resize', this.updateCameraZoom, this);
          this.wordCardTweens.forEach(function (tw) { if (tw && tw.stop) tw.stop(); });
          this.wordCardTweens = [];
        });
      }

      updateCameraZoom() {
        if (!this.cameras || !this.cameras.main) return;
        const h = this.scale.height || 560;
        const zoom = Math.max(0.55, Math.min(1.6, h / this.worldHeight));
        this.cameras.main.setZoom(zoom);
      }

      showStageBanner(titleText) {
        const cam = this.cameras.main;
        const cx = cam.width / 2;
        const cy = Math.max(76, cam.height * 0.19);
        const banner = this.add.text(cx, cy, titleText, {
          fontFamily: 'Sarabun, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#fde047',
          stroke: '#0f172a',
          strokeThickness: 5,
          backgroundColor: 'rgba(15,23,42,0.78)',
          padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30);

        this.tweens.add({
          targets: banner,
          alpha: 0,
          y: cy - 16,
          delay: 950,
          duration: 380,
          onComplete: function () { banner.destroy(); }
        });
      }

      buildParallaxScenery() {
        const groundTop = 12 * this.tileSize;
        if (this.worldCfg.theme !== 'underground') {
          for (let x = 120; x < this.worldWidth; x += 380) {
            this.add.image(x, 85 + (x % 90), 'bg_cloud').setScrollFactor(0.35).setDepth(0).setAlpha(0.92);
          }
          for (let x = 80; x < this.worldWidth; x += 520) {
            this.add.image(x, groundTop - 42, 'bg_hill').setScrollFactor(0.65).setDepth(0);
          }
          for (let x = 260; x < this.worldWidth; x += 420) {
            this.add.image(x, groundTop - 16, 'bg_bush').setScrollFactor(0.85).setDepth(0);
          }
        }
      }

      isPit(tileX) {
        return this.worldCfg.pits.some(function (range) {
          return tileX >= range[0] && tileX <= range[1];
        });
      }

      buildTerrain() {
        const T = this.tileSize;
        const theme = this.worldCfg.theme || 'overworld';
        const topKey = 'ground_' + theme;
        const dirtKey = 'dirt_' + theme;
        for (let tx = 0; tx < this.worldCfg.lengthTiles; tx++) {
          if (this.isPit(tx)) continue;
          for (let ty = 12; ty < 14; ty++) {
            const tile = this.solids.create(tx * T + T / 2, ty * T + T / 2, ty === 12 ? topKey : dirtKey);
            tile.setDisplaySize(T, T).setDepth(2).refreshBody();
          }
        }
      }

      buildPipes() {
        const T = this.tileSize;
        const groundTop = 12 * T;
        this.worldCfg.pipes.forEach((p) => {
          const px = p.tileX * T + T;
          const totalH = p.heightTiles * T;
          const bodyTop = groundTop - totalH + 32;
          for (let y = groundTop - 20; y >= bodyTop; y -= T) {
            const seg = this.solids.create(px, y, 'pipe_body');
            seg.setDisplaySize(64, T).setDepth(2).refreshBody();
          }
          const top = this.solids.create(px, groundTop - totalH + 16, 'pipe_top');
          top.setDisplaySize(72, 32).setDepth(2).refreshBody();
        });
      }

      buildBlocks() {
        const T = this.tileSize;
        const brickKey = 'brick_' + (this.worldCfg.theme || 'overworld');
        this.qBlockSprites = [];

        this.worldCfg.blocks.forEach((b) => {
          const bx = b.tileX * T + T / 2;
          const by = b.tileY * T + T / 2;
          const texKey = b.type === 'brick' ? brickKey : 'qblock_0';
          // ตัวชน static (โปร่งใส) + ภาพแสดงผลแยก เพื่อให้เด้งโดยไม่กวนฟิสิกส์
          const collider = this.blocks.create(bx, by, texKey);
          collider.setDisplaySize(T, T).refreshBody();
          collider.setAlpha(0);
          collider.setData('blockType', b.type);
          collider.setData('used', false);

          const vis = this.add.image(bx, by, texKey).setDisplaySize(T, T).setDepth(4);
          collider.setData('visual', vis);
          if (b.type !== 'brick') {
            this.qBlockSprites.push({ collider: collider, visual: vis });
          }
        });
      }

      buildWordZones() {
        const T = this.tileSize;
        const slots = RULES.buildStageWordSlots(this.worldCfg, activeRng);

        slots.forEach((slot) => {
          const x = slot.tileX * T + T / 2;
          const highY = slot.highY * T;
          const lowY = slot.lowY * T;
          const zoneState = { resolved: false, cards: [] };

          const makeCard = (yPos, wordText, isCorrect) => {
            const container = this.add.container(x, yPos).setDepth(6);
            const padX = Math.max(88, wordText.length * 14 + 28);
            const bg = this.add.rectangle(0, 0, padX, 40, 0xfffbeb, 0.97)
              .setStrokeStyle(3, 0xd97706);
            const inner = this.add.rectangle(0, 0, padX - 6, 34, 0xfef3c7, 0.55);
            const label = this.add.text(0, 0, wordText, {
              fontFamily: 'Sarabun, sans-serif',
              fontSize: '21px',
              fontStyle: 'bold',
              color: '#1e293b'
            }).setOrigin(0.5);

            container.add([bg, inner, label]);

            if (!reducedMotion) {
              const tw = this.tweens.add({
                targets: container,
                y: yPos - 6,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
              });
              this.wordCardTweens.push(tw);
            }

            const trigger = this.wordTriggers.create(x, yPos, 'particle_spark');
            trigger.setAlpha(0);
            trigger.body.setSize(padX, 40);
            trigger.setData('zoneState', zoneState);
            trigger.setData('container', container);
            trigger.setData('pair', slot.pair);
            trigger.setData('isCorrect', isCorrect);
            trigger.setData('consumed', false);
            zoneState.cards.push({ trigger: trigger, container: container });
          };

          makeCard(highY, slot.correctOnHigh ? slot.pair.correct : slot.pair.wrong, slot.correctOnHigh);
          makeCard(lowY, slot.correctOnHigh ? slot.pair.wrong : slot.pair.correct, !slot.correctOnHigh);
        });
      }

      buildEnemies() {
        const T = this.tileSize;
        this.worldCfg.enemies.forEach((tx, idx) => {
          const ex = tx * T + T / 2;
          const ey = 11 * T;
          const e = this.enemies.create(ex, ey, 'enemy_0');
          e.setDisplaySize(36, 34);
          e.body.setSize(28, 28, true);
          e.body.setAllowGravity(true);
          e.body.setGravityY(1600);
          e.setVelocityX(idx % 2 === 0 ? -72 : 72);
          e.setData('alive', true);
          e.setData('dir', idx % 2 === 0 ? -1 : 1);
          e.setDepth(8);
          this.enemiesList.push(e);
        });
      }

      buildCheckpointAndGoal() {
        const T = this.tileSize;
        const groundTop = 12 * T;

        // Checkpoint flag
        const cpX = this.worldCfg.checkpointTileX * T;
        this.add.rectangle(cpX, groundTop - 36, 4, 72, 0xe2e8f0).setDepth(3);
        this.cpBanner = this.add.rectangle(cpX + 14, groundTop - 58, 24, 16, 0x94a3b8).setDepth(3);
        this.checkpointZone = this.add.zone(cpX, groundTop - 40, 32, 80);
        this.physics.add.existing(this.checkpointZone, true);

        // Flagpole & Castle
        const fx = this.worldCfg.flagTileX * T;
        this.add.rectangle(fx, groundTop - 130, 8, 260, 0xe2e8f0).setDepth(3);
        this.add.circle(fx, groundTop - 262, 10, 0xfacc15).setDepth(4);
        this.goalFlag = this.add.image(fx - 18, groundTop - 230, 'flag_banner').setDepth(4);
        this.flagZone = this.add.zone(fx, groundTop - 130, 28, 260);
        this.physics.add.existing(this.flagZone, true);

        this.add.image((this.worldCfg.flagTileX + 4.2) * T, groundTop - 80, 'castle').setDepth(2);
      }

      onHitBlock(player, block) {
        if (this.playerDeadAnim || this.stageClearing) return;
        const hitFromBelow = player.body.blocked.up || (player.y > block.y && player.body.velocity.y <= 30);
        if (!hitFromBelow) return;

        const now = this.time.now;
        const last = this.qBlockCooldowns.get(block) || 0;
        if (now - last < 180) return;
        this.qBlockCooldowns.set(block, now);

        const vis = block.getData('visual');
        const bType = block.getData('blockType');
        const used = block.getData('used');

        SFX.bump();

        if (vis && !reducedMotion) {
          this.tweens.add({
            targets: vis,
            y: block.y - 10,
            duration: 70,
            yoyo: true,
            ease: 'Quad.easeOut'
          });
        }

        if (bType !== 'brick' && !used) {
          block.setData('used', true);
          if (vis) vis.setTexture('qblock_used');

          if (bType === 'q_heart') {
            this.spawnHeartPickup(block.x, block.y - 42);
            SFX.powerupHeart();
          } else {
            this.spawnCoinPop(block.x, block.y - 36);
            const pts = RULES.applyCoin(roundState, CFG);
            SFX.coinWord();
            this.floatScoreText(block.x, block.y - 44, '+' + pts, '#fde047');
            updateHud();
            popScorePill();
            if (vs) vs.report(roundState.score, { correct: roundState.correct });
          }
        }
      }

      spawnCoinPop(x, y) {
        const c = this.add.image(x, y, 'coin_0').setDepth(12);
        this.tweens.add({
          targets: c,
          y: y - 48,
          alpha: 0,
          duration: 420,
          ease: 'Quad.easeOut',
          onComplete: function () { c.destroy(); }
        });
      }

      spawnHeartPickup(x, y) {
        const h = this.pickups.create(x, y, 'heart_item');
        h.setDisplaySize(30, 26);
        h.body.setAllowGravity(true);
        h.body.setGravityY(900);
        h.setVelocity(95, -240);
        h.setBounce(0.35);
        h.setDepth(9);
      }

      onTouchPickup(_player, pickup) {
        if (!pickup.active) return;
        pickup.destroy();
        const res = RULES.applyExtraHeart(roundState, CFG);
        SFX.powerupHeart();
        if (res.gained) {
          showToast('❤️ 1-UP! ได้หัวใจเพิ่ม +1 ดวง', true);
          this.floatScoreText(this.player.x, this.player.y - 30, '+1 ❤️', '#fb7185');
        } else {
          showToast('❤️ หัวใจเต็มแล้ว! โบนัส +' + res.bonusPoints, true);
          this.floatScoreText(this.player.x, this.player.y - 30, '+' + res.bonusPoints, '#fde047');
        }
        updateHud();
        if (vs) vs.report(roundState.score, { correct: roundState.correct });
      }

      onTouchWord(_player, trigger) {
        if (this.playerDeadAnim || this.stageClearing) return;
        if (trigger.getData('consumed')) return;
        const zoneState = trigger.getData('zoneState');
        if (zoneState && zoneState.resolved) return;

        const isCorrect = trigger.getData('isCorrect');
        const pair = trigger.getData('pair');
        const container = trigger.getData('container');
        trigger.setData('consumed', true);

        if (isCorrect) {
          if (zoneState) zoneState.resolved = true;
          // ซ่อนทั้งคู่ในโซนเมื่อเก็บคำถูกแล้ว
          if (zoneState && zoneState.cards) {
            zoneState.cards.forEach((c) => {
              c.trigger.setData('consumed', true);
              if (c.trigger.body) c.trigger.body.enable = false;
              if (c.container && c.container.active) {
                this.tweens.add({
                  targets: c.container,
                  scale: c.container === container ? 1.28 : 0.6,
                  alpha: 0,
                  duration: 240,
                  onComplete: function () { c.container.destroy(); }
                });
              }
            });
          }

          const res = RULES.applyCorrectWord(roundState, pair, CFG);
          SFX.coinWord();
          KAMPAI.sound.fxFlash(true);
          KAMPAI.sound.speak(pair.correct, 'th-TH', true);
          this.spawnSparks(trigger.x, trigger.y, 10, 0xfde047);
          this.floatScoreText(trigger.x, trigger.y - 24, '+' + res.pointsAdded, '#4ade80');
          showToast('✅ ' + pair.correct + ' (+' + res.pointsAdded + ') — ' + pair.hint, true);
          updateHud();
          popScorePill();
          if (vs) vs.report(roundState.score, { correct: roundState.correct });
        } else {
          // เก็บคำผิด -> เสียหัวใจ 1 ดวง + ท่าพลาดแบบมาริโอ
          if (trigger.body) trigger.body.enable = false;
          if (container && container.active) {
            this.tweens.add({
              targets: container,
              y: container.y + 24,
              alpha: 0,
              duration: 260,
              onComplete: function () { container.destroy(); }
            });
          }
          const res = RULES.applyWrongWord(roundState, pair);
          showToast('❌ ' + pair.wrong + ' → ที่ถูก: ✅ ' + pair.correct + ' (' + pair.hint + ')', false);
          this.handlePlayerHurt(res.isGameOver);
        }
      }

      onTouchEnemy(player, enemy) {
        if (this.playerDeadAnim || this.stageClearing || !enemy.getData('alive')) return;

        const isStomp = player.body.velocity.y > 40 && player.body.bottom <= enemy.body.top + 18;
        if (isStomp) {
          enemy.setData('alive', false);
          enemy.body.enable = false;
          enemy.setTexture('enemy_squish');
          enemy.setDisplaySize(38, 16);
          enemy.y += 8;
          player.setVelocityY(-460);
          const pts = RULES.applyStomp(roundState, CFG);
          SFX.stomp();
          this.floatScoreText(enemy.x, enemy.y - 24, '+' + pts, '#fde047');
          updateHud();
          popScorePill();
          if (vs) vs.report(roundState.score, { correct: roundState.correct });
          this.time.delayedCall(450, function () {
            if (enemy && enemy.active) enemy.destroy();
          });
          return;
        }

        if (this.time.now < this.invulnUntil) return;
        const res = RULES.applyHazardHit(roundState);
        showToast('💥 ชนเจ้าเห็ด! เสียหัวใจ 1 ดวง (เหลือ ' + res.lives + ' ดวง)', false);
        this.handlePlayerHurt(res.isGameOver);
      }

      handlePlayerHurt(isGameOver) {
        updateHud();
        SFX.loseHeart();
        KAMPAI.sound.fxFlash(false);

        if (!reducedMotion) {
          this.hitStopUntil = this.time.now + 55;
          this.trauma = Math.min(1, this.trauma + 0.55);
        }

        if (isGameOver) {
          // แอนิเมชันมาริโอตายร่วงลงด้านล่าง
          this.playerDeadAnim = true;
          SFX.stopBgm();
          this.player.setTexture('hero_hurt');
          this.player.body.checkCollision.none = true;
          this.player.setVelocity(0, -540);
          this.time.delayedCall(1100, function () {
            endGame(false, false);
          });
        } else {
          // สะดุ้ง + กะพริบอมตะชั่วคราว
          this.invulnUntil = this.time.now + CFG.INVULN_MS;
          this.player.setVelocityY(-380);
          this.player.setTexture('hero_hurt');
        }
      }

      onReachCheckpoint() {
        if (this.checkpointReached) return;
        this.checkpointReached = true;
        this.checkpointX = this.worldCfg.checkpointTileX * this.tileSize;
        this.checkpointY = 10 * this.tileSize;
        if (this.cpBanner) this.cpBanner.setFillStyle(0x22c55e);
        SFX.powerupHeart();
        showToast('🚩 ถึงจุดเซฟกลางด่านแล้ว!', true);
      }

      onReachFlagpole() {
        if (this.stageClearing || this.playerDeadAnim) return;
        this.stageClearing = true;
        SFX.stopBgm();
        SFX.flagpole();
        this.player.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);

        const groundTop = 12 * this.tileSize;
        if (this.goalFlag && !reducedMotion) {
          this.tweens.add({
            targets: this.goalFlag,
            y: groundTop - 36,
            duration: 600,
            ease: 'Linear'
          });
        }

        this.tweens.add({
          targets: this.player,
          y: groundTop - 22,
          duration: 550,
          onComplete: () => {
            SFX.stageClear();
            const res = RULES.applyStageClear(roundState, CFG, DATA.WORLDS.length);
            updateHud();
            if (vs) vs.report(roundState.score, { correct: roundState.correct });
            showToast('🏰 ผ่าน ' + this.worldCfg.name + ' (+' + res.bonus + ' โบนัส)', true);
            this.time.delayedCall(1350, () => {
              if (res.wonAll) {
                endGame(true, false);
              } else {
                this.scene.restart({ stageIndex: res.nextStageIndex });
              }
            });
          }
        });
      }

      spawnSparks(x, y, count, colorHex) {
        if (reducedMotion) return;
        for (let i = 0; i < count; i++) {
          const p = this.add.rectangle(x, y, 6, 6, colorHex || 0xfde047).setDepth(14);
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const dist = 26 + Math.random() * 34;
          this.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist - 14,
            alpha: 0,
            duration: 360,
            onComplete: function () { p.destroy(); }
          });
        }
      }

      floatScoreText(x, y, txt, color) {
        const label = this.add.text(x, y, txt, {
          fontFamily: 'Sarabun, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: color || '#fde047',
          stroke: '#0f172a',
          strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
          targets: label,
          y: y - 34,
          alpha: 0,
          duration: 650,
          onComplete: function () { label.destroy(); }
        });
      }

      update(time, delta) {
        if (!gameActive) return;
        if (KampaiOrient.isPaused()) return;

        // อัปเดตอนิเมชันบล็อก ?
        if (this.qBlockSprites && this.qBlockSprites.length) {
          const qFrame = Math.floor(time / 220) % 3;
          this.qBlockSprites.forEach(function (q) {
            if (!q.collider.getData('used')) {
              q.visual.setTexture('qblock_' + qFrame);
            }
          });
        }

        // Hit-stop
        if (time < this.hitStopUntil) return;

        // Camera trauma shake (visual offset only)
        if (this.trauma > 0 && !reducedMotion) {
          const dtSec = Math.min(0.05, delta / 1000);
          this.trauma = Math.max(0, this.trauma - 2.2 * dtSec);
          this.traumaT += dtSec * 36;
          const shake = this.trauma * this.trauma;
          this.cameras.main.setFollowOffset(
            Math.sin(this.traumaT * 1.7) * 9 * shake,
            Math.sin(this.traumaT * 2.3) * 6 * shake
          );
        } else {
          this.cameras.main.setFollowOffset(0, 0);
        }

        if (this.stageClearing) return;

        if (this.playerDeadAnim) {
          this.player.body.velocity.y += CFG.RISE_GRAVITY * (delta / 1000);
          return;
        }

        const dt = Math.min(0.05, delta / 1000);
        this.tickCount += 1;

        const body = this.player.body;
        const onFloor = body.blocked.down || body.onFloor();

        // ตกเหว -> เสียหัวใจ 1 ดวงแล้วกลับมาที่จุดเซฟ
        if (this.player.y > this.worldHeight + 48) {
          const res = RULES.applyHazardHit(roundState);
          showToast('🕳️ ตกเหว! เสียหัวใจ 1 ดวง (เหลือ ' + res.lives + ' ดวง)', false);
          if (res.isGameOver) {
            this.handlePlayerHurt(true);
          } else {
            updateHud();
            SFX.loseHeart();
            KAMPAI.sound.fxFlash(false);
            this.player.setPosition(this.checkpointX, this.checkpointY);
            this.player.setVelocity(0, 0);
            this.invulnUntil = this.time.now + CFG.INVULN_MS;
          }
          return;
        }

        // อ่าน Input (Keyboard + Touch)
        const leftDown = this.cursors.left.isDown || this.keys.a.isDown || touchState.left;
        const rightDown = this.cursors.right.isDown || this.keys.d.isDown || touchState.right;
        const jumpHeld = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown || touchState.jumpDown;
        const jumpJustPressed =
          Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
          Phaser.Input.Keyboard.JustDown(this.keys.w) ||
          Phaser.Input.Keyboard.JustDown(this.keys.space) ||
          touchState.jumpJustPressed;
        touchState.jumpJustPressed = false;

        const sprinting = this.keys.shift.isDown;
        const maxSpeed = sprinting ? CFG.SPRINT_SPEED : CFG.RUN_SPEED;
        const dir = (rightDown ? 1 : 0) - (leftDown ? 1 : 0);

        // เคลื่อนที่แนวนอนแบบมาริโอ (acceleration + deceleration)
        const accel = onFloor ? CFG.GROUND_ACCEL : CFG.AIR_ACCEL;
        const decel = onFloor ? CFG.GROUND_DECEL : CFG.AIR_DECEL;
        let vx = body.velocity.x;
        if (dir !== 0) {
          vx += dir * accel * dt;
          if (Math.abs(vx) > maxSpeed) vx = dir * maxSpeed;
          this.player.setFlipX(dir < 0);
        } else {
          if (Math.abs(vx) <= decel * dt) vx = 0;
          else vx -= Math.sign(vx) * decel * dt;
        }
        body.setVelocityX(vx);

        // Coyote Time & Jump Buffer (นับเป็น tick)
        const coyoteTicks = Math.round((CFG.COYOTE_MS / 1000) * 60);
        const bufferTicks = Math.round((CFG.BUFFER_MS / 1000) * 60);

        if (onFloor && body.velocity.y >= 0) {
          this.lastGroundTick = this.tickCount;
        }
        if (jumpJustPressed) {
          this.lastPressTick = this.tickCount;
        }

        let vy = body.velocity.y;
        if (this.tickCount - this.lastPressTick <= bufferTicks && this.tickCount - this.lastGroundTick <= coyoteTicks) {
          vy = CFG.JUMP_VELOCITY;
          this.lastPressTick = -999999;
          this.lastGroundTick = -999999;
          if (!jumpHeld) vy *= CFG.JUMP_CUT;
          SFX.jump();
          if (!reducedMotion) {
            this.tweens.killTweensOf(this.player);
            this.player.setDisplaySize(32, 44);
            this.tweens.add({ targets: this.player, displayWidth: 38, displayHeight: 38, duration: 140 });
          }
        }

        // Variable jump height (ปล่อยปุ่มระหว่างลอยขึ้น)
        if (!jumpHeld && vy < -120) {
          vy *= Math.pow(CFG.JUMP_CUT, dt * 18);
        }

        // Asymmetric rise/fall gravity + apex hang
        let g = vy > 0 ? CFG.FALL_GRAVITY : CFG.RISE_GRAVITY;
        if (jumpHeld && Math.abs(vy) < CFG.APEX_THRESHOLD) {
          g *= CFG.APEX_GRAVITY_MULT;
        }
        vy = Math.min(vy + g * dt, CFG.MAX_FALL_SPEED);
        body.setVelocityY(vy);

        // ป้องกันชนขอบโลกซ้าย
        if (this.player.x < 20) {
          this.player.x = 20;
          if (body.velocity.x < 0) body.setVelocityX(0);
        }

        // อัปเดตสไปรต์ท่าทางตัวละคร
        if (time < this.invulnUntil) {
          this.player.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
        } else {
          this.player.setAlpha(1);
        }

        if (!onFloor) {
          this.player.setTexture('hero_jump');
        } else if (Math.abs(vx) > 25) {
          const f = Math.floor(time / 110) % 2;
          this.player.setTexture(f === 0 ? 'hero_run1' : 'hero_run2');
        } else {
          this.player.setTexture('hero_idle');
        }

        // อัปเดตการเดินลาดตระเวนของศัตรู
        this.enemiesList.forEach((e) => {
          if (!e.active || !e.getData('alive')) return;
          if (e.body.blocked.left) e.setData('dir', 1);
          else if (e.body.blocked.right) e.setData('dir', -1);
          else {
            // ตรวจข้างหน้าว่ามีเหวหรือไม่ เพื่อไม่ให้ศัตรูเดินตกเหวหมด
            const dirE = e.getData('dir');
            const lookAheadTx = Math.floor((e.x + dirE * 22) / this.tileSize);
            if (lookAheadTx <= 1 || lookAheadTx >= this.worldCfg.lengthTiles - 2 || this.isPit(lookAheadTx)) {
              e.setData('dir', -dirE);
            }
          }
          e.setVelocityX(e.getData('dir') * 72);
          e.setTexture(Math.floor(time / 220) % 2 === 0 ? 'enemy_0' : 'enemy_1');
        });
      }
    };
  }

  function ensurePhaserGame() {
    if (typeof Phaser === 'undefined') {
      showToast('⚠️ ไม่พบไลบรารี Phaser กรุณารีโหลดหน้าเว็บ', false);
      return false;
    }
    if (phaserGame) return true;
    const v = KampaiOrient.getViewportSize();
    const SceneClass = createMarioSceneClass();
    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width: Math.max(320, Math.floor(v.w)),
      height: Math.max(240, Math.floor(v.h)),
      backgroundColor: '#5c94fc',
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          fixedStep: true,
          debug: false
        }
      },
      scene: [SceneClass]
    });
    window.game = phaserGame;
    return true;
  }

  // ── Lifecycle: Start / End / Restart ──
  window.startGame = function (rngOpt) {
    if (!KampaiOrient.canStart()) return;
    activeRng = typeof rngOpt === 'function' ? rngOpt : Math.random;
    roundState = RULES.createRoundState(CFG);
    gameActive = true;

    KAMPAI.beginRound();
    KampaiOrient.notifyGameStart();
    KampaiOrient.setPlaying(true);
    SFX.unlock();

    document.body.classList.add('is-playing');
    document.getElementById('blocker').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    updateHud();

    const wasCreated = !!phaserGame;
    if (ensurePhaserGame() && wasCreated) {
      const scene = phaserGame.scene.getScene('MarioStage');
      if (scene) {
        phaserGame.scene.start('MarioStage', { stageIndex: 0 });
      }
    }
  };

  window.endGame = function (wonAll, fromVersus) {
    if (!gameActive && !fromVersus) return;
    gameActive = false;
    document.body.classList.remove('is-playing');
    KampaiOrient.setPlaying(false);
    SFX.stopBgm();

    if (wonAll) {
      SFX.stageClear();
      KAMPAI.sound.gameOver();
    } else {
      SFX.gameOver();
    }

    if (!fromVersus && vs && vs.finish(roundState.score, { correct: roundState.correct })) {
      return;
    }

    const stars = RULES.calcStars(roundState.score, CFG);
    KAMPAI.submitScore(roundState.score, {
      mode: 'normal',
      stars: stars,
      correct: roundState.correct,
      wrong: roundState.wrong
    });

    const goTitle = document.getElementById('go-title');
    if (goTitle) {
      goTitle.textContent = wonAll ? '🏆 พิชิตครบ 3 ด่าน!' : 'จบการผจญภัย!';
    }
    const goSummary = document.getElementById('go-summary');
    if (goSummary) {
      goSummary.textContent = 'เก็บคำถูก ' + roundState.correct + ' คำ · พลาด ' + roundState.wrong + ' ครั้ง · หัวใจเหลือ ' + roundState.lives + '/' + roundState.maxLives;
    }
    document.getElementById('final-score').innerText = roundState.score.toLocaleString();
    document.getElementById('go-stars').innerText = '☆☆☆'.split('').map(function (_s, i) {
      return i < stars ? '★' : '☆';
    }).join('');
    document.getElementById('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
  };

  window.finishForTest = function () {
    if (!gameActive) window.startGame();
    endGame(false, false);
  };

  window.restartGame = function () {
    document.getElementById('gameover-screen').style.display = 'none';
    window.startGame(activeRng);
  };
})();
