/* textures.js — สร้าง Pixel Art Sprites & Tiles สไตล์มาริโอ 8-bit/16-bit ด้วย Canvas Matrix */
(function (root) {
  'use strict';

  function drawGrid(scene, key, grid, palette, pixelScale) {
    if (scene.textures.exists(key)) return;
    const h = grid.length;
    const w = grid[0].length;
    const tex = scene.textures.createCanvas(key, w * pixelScale, h * pixelScale);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        const col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
      }
    }
    tex.refresh();
  }

  function makeTileCanvas(scene, key, w, h, fn) {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    fn(ctx, w, h);
    tex.refresh();
  }

  const HERO_PAL = {
    '.': null,
    'R': '#e52521', // หมวก/เสื้อแดง
    'D': '#9e1310', // เงาแดง
    'W': '#ffffff', // ตราสีขาว/ถุงมือ
    'S': '#ffcc99', // ผิว
    'H': '#5c3317', // ผม/หนวด/รองเท้า
    'E': '#1a1a1a', // ตา
    'B': '#1e50d8', // เอี๊ยมน้ำเงิน
    'N': '#10318a', // เงาเอี๊ยม
    'Y': '#ffd700'  // กระดุมทอง
  };

  const HERO_IDLE = [
    '....RRRRRR......',
    '...RRRRRWRR.....',
    '...HHHHHHHH.....',
    '..HHSSHSHSS.....',
    '..HSHHHSHSSS....',
    '..HHSSSSHHHH....',
    '....SSSSSSS.....',
    '...RRRRBBRR.....',
    '..RRRRBBBBBR....',
    '..WW.BYBBYB.WW..',
    '..WW.BBBBBB.WW..',
    '.....BBBBBB.....',
    '.....BBN.BB.....',
    '....HHH..HHH....',
    '...HHHH..HHHH...',
    '................'
  ];

  const HERO_RUN1 = [
    '....RRRRRR......',
    '...RRRRRWRR.....',
    '...HHHHHHHH.....',
    '..HHSSHSHSS.....',
    '..HSHHHSHSSS....',
    '..HHSSSSHHHH....',
    '....SSSSSSS.....',
    '...RRRRBBRR.....',
    '..RRRRBBBBBR....',
    '...WWBYBBYBWW...',
    '.....BBBBBB.....',
    '....BBBN.BBB....',
    '...HHH....HHH...',
    '..HHHH.....HHH..',
    '................',
    '................'
  ];

  const HERO_RUN2 = [
    '................',
    '....RRRRRR......',
    '...RRRRRWRR.....',
    '...HHHHHHHH.....',
    '..HHSSHSHSS.....',
    '..HSHHHSHSSS....',
    '..HHSSSSHHHH....',
    '....SSSSSSS.....',
    '...RRRRBBRR.....',
    '...RBBBBBBWR....',
    '....WBYBBYB.....',
    '.....BBBBBB.....',
    '....HHH.HHHH....',
    '....HHH.........',
    '................',
    '................'
  ];

  const HERO_JUMP = [
    '....RRRRRR...WW.',
    '...RRRRRWRR..WW.',
    '...HHHHHHHH.RR..',
    '..HHSSHSHSS.RR..',
    '..HSHHHSHSSSR...',
    '..HHSSSSHHHH....',
    '....SSSSSSS.....',
    '..WW.RRBBRR.....',
    '..WW.BBBBBR.....',
    '....BYBBYBB.....',
    '....BBBBBBB.....',
    '...BBN...BBB....',
    '..HHH.....HHH...',
    '..........HHHH..',
    '................',
    '................'
  ];

  const HERO_HURT = [
    '....RRRRRR......',
    '...RRRRRWRR.....',
    '...HHHHHHHH.....',
    '..HHSSHSHSS.....',
    '..HSHHHSHSSS....',
    '..HHSSSSHHHH....',
    '....SSSSSSS.....',
    '..WW.RRRRRR.WW..',
    '..WW.BBBBBB.WW..',
    '.....BYBBYB.....',
    '....BBBBBBBB....',
    '...HHH....HHH...',
    '..HHHH....HHHH..',
    '................',
    '................',
    '................'
  ];

  const ENEMY_PAL = {
    '.': null,
    'K': '#231815',
    'M': '#9c4a1a', // หมวกเห็ดน้ำตาลส้ม
    'L': '#c86a2e', // ไฮไลต์
    'C': '#f7d5a8', // หน้า
    'W': '#ffffff',
    'B': '#4a2511'  // เท้า
  };

  const ENEMY_0 = [
    '.....MMMMMM.....',
    '...MMLLMMMMMM...',
    '..MLLMMMMMMMMM..',
    '.MMMLMMMMMMMLMM.',
    '.MMKKMMMMMMKKMM.',
    'MMMWWKKMMKKWWMMM',
    'MMMWKMMMMMMKWMMM',
    'MMMMMMMMMMMMMMMM',
    '..CCCCCCCCCCCC..',
    '...CCCCCCCCCC...',
    '....CCCCCCCC....',
    '...BBB....BBB...',
    '..BBBB....BBBB..',
    '................'
  ];

  const ENEMY_1 = [
    '.....MMMMMM.....',
    '...MMLLMMMMMM...',
    '..MLLMMMMMMMMM..',
    '.MMMLMMMMMMMLMM.',
    '.MMKKMMMMMMKKMM.',
    'MMMWWKKMMKKWWMMM',
    'MMMWKMMMMMMKWMMM',
    'MMMMMMMMMMMMMMMM',
    '..CCCCCCCCCCCC..',
    '...CCCCCCCCCC...',
    '....CCCCCCCC....',
    '....BBB..BBB....',
    '...BBBB..BBBB...',
    '................'
  ];

  const HEART_GRID = [
    '..RRRR....RRRR..',
    '.RRRRRR..RRRRRR.',
    'RRWWRRRRRRRRRRRR',
    'RRWRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRDD',
    'RRRRRRRRRRRRRRDD',
    '.RRRRRRRRRRRRDD.',
    '..RRRRRRRRRRDD..',
    '...RRRRRRRRDD...',
    '....RRRRRRDD....',
    '.....RRRRDD.....',
    '......RRDD......',
    '.......DD.......'
  ];

  function generateAll(scene) {
    // 1) ตัวละครหลัก (16x16 * 2.5 = 40x40 แต่ใช้ scale 2 -> 32x32 หรือ 2.5 -> 40x40; ใช้ scale 3 แล้ว display 38x38 เพื่อคมกริบ)
    drawGrid(scene, 'hero_idle', HERO_IDLE, HERO_PAL, 3);
    drawGrid(scene, 'hero_run1', HERO_RUN1, HERO_PAL, 3);
    drawGrid(scene, 'hero_run2', HERO_RUN2, HERO_PAL, 3);
    drawGrid(scene, 'hero_jump', HERO_JUMP, HERO_PAL, 3);
    drawGrid(scene, 'hero_hurt', HERO_HURT, HERO_PAL, 3);

    // 2) ศัตรู
    drawGrid(scene, 'enemy_0', ENEMY_0, ENEMY_PAL, 2.5);
    drawGrid(scene, 'enemy_1', ENEMY_1, ENEMY_PAL, 2.5);
    makeTileCanvas(scene, 'enemy_squish', 40, 16, function (ctx) {
      ctx.fillStyle = '#9c4a1a';
      ctx.fillRect(2, 4, 36, 10);
      ctx.fillStyle = '#4a2511';
      ctx.fillRect(6, 12, 28, 4);
    });

    // 3) หัวใจ 1-UP
    drawGrid(scene, 'heart_item', HEART_GRID, { '.': null, R: '#ff2e54', W: '#ffd6de', D: '#9e0b2a' }, 2);

    // 4) พื้นดิน 3 ธีม (40x40: แถวบนมีหญ้า/ขอบ, แถวล่างเป็นดินล้วน)
    makeGroundTile(scene, 'ground_overworld', '#28b428', '#56e856', '#c84c0c', '#8e3204');
    makeDirtTile(scene, 'dirt_overworld', '#c84c0c', '#8e3204');
    makeGroundTile(scene, 'ground_underground', '#2563eb', '#60a5fa', '#1e3a8a', '#172554');
    makeDirtTile(scene, 'dirt_underground', '#1e3a8a', '#172554');
    makeGroundTile(scene, 'ground_castle', '#94a3b8', '#cbd5e1', '#475569', '#334155');
    makeDirtTile(scene, 'dirt_castle', '#475569', '#334155');

    // 5) อิฐบล็อก (40x40)
    makeBrickTile(scene, 'brick_overworld', '#c84c0c', '#e67e45', '#5a1e04');
    makeBrickTile(scene, 'brick_underground', '#1d4ed8', '#3b82f6', '#0f172a');
    makeBrickTile(scene, 'brick_castle', '#64748b', '#94a3b8', '#1e293b');

    // 6) บล็อก ? สีทอง (3 เฟรม + ใช้แล้ว)
    ['#fbbf24', '#fde047', '#f59e0b'].forEach(function (bg, idx) {
      makeTileCanvas(scene, 'qblock_' + idx, 40, 40, function (ctx) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, 40, 40);
        ctx.fillStyle = bg;
        ctx.fillRect(2, 2, 36, 36);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(2, 2, 36, 3);
        ctx.fillRect(2, 2, 3, 36);
        // หมุดมุม
        ctx.fillStyle = '#78350f';
        ctx.fillRect(5, 5, 3, 3); ctx.fillRect(32, 5, 3, 3);
        ctx.fillRect(5, 32, 3, 3); ctx.fillRect(32, 32, 3, 3);
        // เครื่องหมาย ?
        ctx.fillStyle = '#78350f';
        ctx.fillRect(14, 10, 14, 4);
        ctx.fillRect(24, 14, 5, 6);
        ctx.fillRect(17, 19, 8, 4);
        ctx.fillRect(17, 23, 5, 4);
        ctx.fillRect(17, 29, 5, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 8, 14, 4);
        ctx.fillRect(22, 12, 5, 6);
        ctx.fillRect(15, 17, 8, 4);
        ctx.fillRect(15, 21, 5, 4);
        ctx.fillRect(15, 27, 5, 4);
      });
    });

    makeTileCanvas(scene, 'qblock_used', 40, 40, function (ctx) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, 40, 40);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(3, 3, 34, 34);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 6, 3, 3); ctx.fillRect(31, 6, 3, 3);
      ctx.fillRect(6, 31, 3, 3); ctx.fillRect(31, 31, 3, 3);
    });

    // 7) ท่อเขียว (Pipe)
    makeTileCanvas(scene, 'pipe_top', 72, 32, function (ctx) {
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(0, 0, 72, 32);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(3, 3, 66, 26);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(8, 3, 10, 26);
      ctx.fillRect(22, 3, 4, 26);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(48, 3, 21, 26);
    });

    makeTileCanvas(scene, 'pipe_body', 64, 40, function (ctx) {
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(0, 0, 64, 40);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(3, 0, 58, 40);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(8, 0, 9, 40);
      ctx.fillRect(20, 0, 3, 40);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(44, 0, 17, 40);
    });

    // 8) เหรียญหมุน 4 เฟรม
    [20, 14, 6, 14].forEach(function (cw, i) {
      makeTileCanvas(scene, 'coin_' + i, 24, 28, function (ctx) {
        const x = Math.floor((24 - cw) / 2);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x, 2, cw, 24);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 2, 4, Math.max(2, cw - 4), 20);
        if (cw >= 14) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 4, 7, 3, 14);
        }
      });
    });

    // 9) เมฆ ภูเขา พุ่มไม้ ปราสาท เสาธง
    makeTileCanvas(scene, 'bg_cloud', 96, 48, function (ctx) {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(16, 26, 64, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 18, 68, 22);
      ctx.fillRect(26, 8, 44, 18);
      ctx.fillRect(38, 2, 22, 12);
    });

    makeTileCanvas(scene, 'bg_hill', 160, 88, function (ctx) {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, 88);
      ctx.quadraticCurveTo(80, -35, 160, 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(12, 88);
      ctx.quadraticCurveTo(80, -18, 148, 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#166534';
      ctx.fillRect(64, 34, 6, 14);
      ctx.fillRect(88, 34, 6, 14);
    });

    makeTileCanvas(scene, 'bg_bush', 96, 36, function (ctx) {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(10, 14, 76, 22);
      ctx.fillRect(22, 4, 52, 16);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(18, 16, 20, 8);
      ctx.fillRect(46, 8, 18, 8);
    });

    makeTileCanvas(scene, 'castle', 140, 160, function (ctx) {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(10, 40, 120, 120);
      ctx.fillStyle = '#6b7280';
      for (let y = 40; y < 160; y += 16) {
        ctx.fillRect(10, y, 120, 2);
      }
      // เชิงเทินบน
      for (let x = 10; x < 130; x += 24) {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(x, 24, 14, 16);
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(35, 68, 70, 32);
      // ประตูโค้งดำ
      ctx.fillStyle = '#111827';
      ctx.fillRect(52, 112, 36, 48);
      ctx.beginPath();
      ctx.arc(70, 112, 18, Math.PI, 0);
      ctx.fill();
    });

    makeTileCanvas(scene, 'flag_banner', 32, 24, function (ctx) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(32, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(18, 9, 6, 6);
    });

    makeTileCanvas(scene, 'particle_spark', 8, 8, function (ctx) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(2, 0, 4, 8);
      ctx.fillRect(0, 2, 8, 4);
    });
  }

  function makeDirtTile(scene, key, dirt, dirtDark) {
    makeTileCanvas(scene, key, 40, 40, function (ctx) {
      ctx.fillStyle = dirt;
      ctx.fillRect(0, 0, 40, 40);
      ctx.fillStyle = dirtDark;
      ctx.fillRect(4, 6, 10, 8);
      ctx.fillRect(22, 12, 12, 10);
      ctx.fillRect(8, 24, 11, 8);
      ctx.fillRect(26, 28, 9, 7);
    });
  }

  function makeGroundTile(scene, key, topMain, topLight, dirt, dirtDark) {
    makeTileCanvas(scene, key, 40, 40, function (ctx) {
      ctx.fillStyle = dirt;
      ctx.fillRect(0, 0, 40, 40);
      // ลายก้อนหินพื้นดิน
      ctx.fillStyle = dirtDark;
      ctx.fillRect(4, 18, 10, 8);
      ctx.fillRect(22, 24, 12, 10);
      ctx.fillRect(10, 31, 8, 6);
      // ชั้นหญ้าด้านบน
      ctx.fillStyle = topMain;
      ctx.fillRect(0, 0, 40, 12);
      ctx.fillStyle = topLight;
      ctx.fillRect(0, 0, 40, 4);
      ctx.fillStyle = topMain;
      ctx.fillRect(6, 12, 6, 4);
      ctx.fillRect(24, 12, 8, 4);
    });
  }

  function makeBrickTile(scene, key, main, light, dark) {
    makeTileCanvas(scene, key, 40, 40, function (ctx) {
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, 40, 40);
      ctx.fillStyle = main;
      ctx.fillRect(1, 1, 18, 17);
      ctx.fillRect(21, 1, 18, 17);
      ctx.fillRect(1, 21, 9, 17);
      ctx.fillRect(12, 21, 17, 17);
      ctx.fillRect(31, 21, 8, 17);
      ctx.fillStyle = light;
      ctx.fillRect(1, 1, 18, 2);
      ctx.fillRect(21, 1, 18, 2);
      ctx.fillRect(12, 21, 17, 2);
    });
  }

  root.ThaiMarioTextures = { generateAll: generateAll };
})(typeof window !== 'undefined' ? window : globalThis);
