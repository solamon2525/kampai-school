/**
 * game.js — Mini Farm Island 🌴
 * เกมจำลองฟาร์ม 3 มิติ ฝึกคิดเรื่องต้นทุน-กำไร (คณิตศาสตร์ ป.4)
 *
 * Three.js r128 (global) + OrbitControls
 * KAMPAI SDK + KampaiVersus (2 ผู้เล่น)
 */
(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var DATA = window.GAME_DATA;

  /* ========== KAMPAI SDK ========== */
  if (window.KAMPAI && KAMPAI.setSlug) KAMPAI.setSlug(CFG.SLUG);
  if (window.KAMPAI && KAMPAI.sound) {
    try { KAMPAI.sound.defaultBgm(CFG.BGM); } catch (e) { /* */ }
  }

  /* ========== DOM References ========== */
  var containerEl  = document.getElementById('game');
  var loadingEl    = document.getElementById('loading');
  var blockerEl    = document.getElementById('blocker');
  var hudEl        = document.getElementById('hud');
  var moneyEl      = document.getElementById('money');
  var cropsEl      = document.getElementById('crops');
  var sellBtn      = document.getElementById('sellBtn');
  var versusBtn    = document.getElementById('versus-btn');
  var startBtn     = document.getElementById('start-btn');
  var hintEl       = document.getElementById('hint');
  var toastsEl     = document.getElementById('toasts');
  var timerHudEl   = document.getElementById('timer-hud');
  var timerValueEl = document.getElementById('timer-value');
  var gameOverEl   = document.getElementById('game-over');
  var finalScoreEl = document.getElementById('final-score');
  var playAgainBtn = document.getElementById('play-again-btn');
  var playerChipEl = document.getElementById('player-chip');
  var myStatsEl    = document.getElementById('my-stats');
  var msBestEl     = document.getElementById('ms-best');
  var msPlaysEl    = document.getElementById('ms-plays');

  /* ========== Game State ========== */
  var money = CFG.START_MONEY;
  var crops = { carrot: 0, corn: 0, melon: 0, egg: 0, milk: 0 };
  var selectedCropId = 'carrot';
  var totalEarned = 0;         // total money earned (score)
  var shownMoney = money;      // for count-up animation
  var isPlaying = false;
  var isVersus = false;
  var versusTimeLeft = 0;
  var versusTimerId = null;
  var animFrameId = null;
  var ledgerTransactions = [];
  var upgrades = {
    sprinkler: false,
    scarecrow: false,
    fertilizer: 0,
    coop: false,
    barn: false,
    chickenFeed: 0,
    cowFeed: 0
  };
  var pendingWorms = [];       // store active 3D worm objects
  var chickensList = [];       // store active chicken 3D objects
  var cowsList = [];           // store active cow 3D objects

  // Phase 2 New States
  var bankBalance = 0;
  var shownBankBalance = 0;
  var cropPrices = { carrot: 25, corn: 75, melon: 210, egg: 25, milk: 65 };
  var marketTimer = 30.0;
  var bankInterestTimer = 30.0;
  var weatherState = 'sunny'; // 'sunny', 'rainy', 'drought'
  var weatherTimer = 45.0;

  /* ========== Versus ========== */
  var vs = null;
  if (window.KampaiVersus) {
    vs = KampaiVersus.create({
      duration: CFG.VERSUS_DURATION,
      title: CFG.VERSUS_TITLE,
      rankBy: 'score',
      onPlay: function (o) {
        startGame(true, o.rng);
      },
      onEnd: function () {
        endGame();
      }
    });
    if (versusBtn) versusBtn.style.display = '';
  }

  /* ========== SDK Ready ========== */
  if (window.KAMPAI && KAMPAI.onReady) {
    KAMPAI.onReady(function (k) {
      if (k.student && playerChipEl) {
        var photo = k.student.photoUrl
          ? '<img src="' + k.student.photoUrl + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover">'
          : '👤';
        playerChipEl.innerHTML = photo + ' ' + (k.student.displayName || '');
        playerChipEl.style.display = 'flex';
      }
      if (k.stats && myStatsEl) {
        if (msBestEl) msBestEl.textContent = k.stats.personalBest || 0;
        if (msPlaysEl) msPlaysEl.textContent = k.stats.playsCount || 0;
        myStatsEl.style.display = 'flex';
      }
    });
  }

  /* ========== Toast ========== */
  function toast(msg, kind) {
    if (!toastsEl) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    toastsEl.appendChild(el);
    setTimeout(function () {
      el.classList.add('leave');
      setTimeout(function () { el.remove(); }, 320);
    }, 1900);
    while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
  }

  /* ========== Ledger Logging Helper ========== */
  function addLedgerEntry(cropName, type, amount) {
    var timeSec = Math.round(clock.elapsedTime);
    ledgerTransactions.push({
      time: timeSec,
      item: cropName,
      type: type,
      amount: amount
    });
    updateLedgerUI();
  }

  function updateLedgerUI() {
    var body = document.getElementById('ledgerBody');
    if (!body) return;
    body.innerHTML = '';
    var totalRev = 0;
    var totalExp = 0;
    ledgerTransactions.forEach(function (tx) {
      var rowEl = document.createElement('tr');
      var colTime = document.createElement('td'); colTime.textContent = tx.time;
      var colItem = document.createElement('td'); colItem.textContent = tx.item;
      var colType = document.createElement('td');
      colType.textContent = tx.type === 'expense' ? 'รายจ่าย 🟥' : 'รายรับ 🟩';
      colType.className = tx.type === 'expense' ? 'red-text' : 'green-text';
      var colAmt = document.createElement('td');
      colAmt.textContent = tx.amount + ' 🪙';
      colAmt.style.fontWeight = 'bold';
      if (tx.type === 'expense') {
        colAmt.className = 'red-text';
        totalExp += tx.amount;
      } else {
        colAmt.className = 'gold-text';
        totalRev += tx.amount;
      }
      rowEl.appendChild(colTime);
      rowEl.appendChild(colItem);
      rowEl.appendChild(colType);
      rowEl.appendChild(colAmt);
      body.appendChild(rowEl);
    });
    var netProfit = totalRev - totalExp;
    var revEl = document.getElementById('ledgerRevenue');
    var expEl = document.getElementById('ledgerExpenses');
    var profitEl = document.getElementById('ledgerProfit');
    if (revEl) revEl.textContent = totalRev;
    if (expEl) expEl.textContent = totalExp;
    if (profitEl) {
      profitEl.textContent = netProfit;
      profitEl.className = netProfit >= 0 ? 'green-text' : 'red-text';
    }
  }

  /* ========== Crop Selection Listener ========== */
  var cropOptions = document.querySelectorAll('.crop-option');
  cropOptions.forEach(function (opt) {
    opt.addEventListener('click', function () {
      cropOptions.forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
      selectedCropId = opt.getAttribute('data-crop');
    });
  });

  /* ========== Modals Toggle Buttons ========== */
  var ledgerBtn = document.getElementById('ledgerBtn');
  var ledgerModal = document.getElementById('ledgerModal');
  var closeLedgerBtn = document.getElementById('closeLedgerBtn');
  if (ledgerBtn && ledgerModal) {
    ledgerBtn.addEventListener('click', function () {
      updateLedgerUI();
      ledgerModal.style.display = 'flex';
    });
  }
  if (closeLedgerBtn && ledgerModal) {
    closeLedgerBtn.addEventListener('click', function () {
      ledgerModal.style.display = 'none';
    });
  }

  var shopBtn = document.getElementById('shopBtn');
  var shopModal = document.getElementById('shopModal');
  var closeShopBtn = document.getElementById('closeShopBtn');
  if (shopBtn && shopModal) {
    shopBtn.addEventListener('click', function () {
      refreshShopUI();
      shopModal.style.display = 'flex';
    });
  }
  if (closeShopBtn && shopModal) {
    closeShopBtn.addEventListener('click', function () {
      shopModal.style.display = 'none';
    });
  }

  /* ========== Market Modal Triggers ========== */
  var marketBtn = document.getElementById('marketBtn');
  var marketModal = document.getElementById('marketModal');
  var closeMarketBtn = document.getElementById('closeMarketBtn');
  if (marketBtn && marketModal) {
    marketBtn.addEventListener('click', function () {
      updateMarketUI();
      marketModal.style.display = 'flex';
    });
  }
  if (closeMarketBtn && marketModal) {
    closeMarketBtn.addEventListener('click', function () {
      marketModal.style.display = 'none';
    });
  }

  function updateMarketPrices() {
    var carrotDiff = Math.floor(getRandom() * 11) - 5; // -5 to +5
    cropPrices.carrot = Math.max(12, Math.min(38, cropPrices.carrot + carrotDiff));
    
    var cornDiff = Math.floor(getRandom() * 25) - 12; // -12 to +12
    cropPrices.corn = Math.max(40, Math.min(110, cropPrices.corn + cornDiff));
    
    var melonDiff = Math.floor(getRandom() * 71) - 35; // -35 to +35
    cropPrices.melon = Math.max(110, Math.min(310, cropPrices.melon + melonDiff));
    
    toast("📈 ตลาดผันผวน! ราคากลางปรับตามกลไกตลาด", "info");
    updateMarketUI();
  }

  function updateMarketUI() {
    var carrotBar = document.getElementById('carrotBar');
    var cornBar = document.getElementById('cornBar');
    var melonBar = document.getElementById('melonBar');
    var carrotPriceVal = document.getElementById('carrotPriceVal');
    var cornPriceVal = document.getElementById('cornPriceVal');
    var melonPriceVal = document.getElementById('melonPriceVal');
    
    if (carrotPriceVal) carrotPriceVal.textContent = cropPrices.carrot;
    if (cornPriceVal) cornPriceVal.textContent = cropPrices.corn;
    if (melonPriceVal) melonPriceVal.textContent = cropPrices.melon;

    if (carrotBar) carrotBar.style.height = Math.round((cropPrices.carrot / 40) * 100) + '%';
    if (cornBar) cornBar.style.height = Math.round((cropPrices.corn / 120) * 100) + '%';
    if (melonBar) melonBar.style.height = Math.round((cropPrices.melon / 320) * 100) + '%';
  }

  function updateWeather(newWeather) {
    weatherState = newWeather;
    
    if (newWeather === 'sunny') {
      scene.fog.color.setHex(0xffd9a8);
      if (sun) sun.intensity = 2.4;
      if (rainPoints) rainPoints.visible = false;
      toast("☀️ สภาพอากาศวันนี้: ท้องฟ้าแจ่มใส ปลูกพืชได้ดี!", "good");
    } else if (newWeather === 'rainy') {
      scene.fog.color.setHex(0x475569);
      if (sun) sun.intensity = 1.0;
      if (rainPoints) rainPoints.visible = true;
      toast("🌧️ สภาพอากาศวันนี้: ฝนตกชุ่มฉ่ำ! พืชทุกชนิดโตเร็วขึ้น 50%", "good");
    } else if (newWeather === 'drought') {
      scene.fog.color.setHex(0xd97706);
      if (sun) sun.intensity = 2.9;
      if (rainPoints) rainPoints.visible = false;
      toast("🍂 สภาพอากาศวันนี้: ภัยแล้ง! พืชหยุดโตชั่วคราว ต้องรดน้ำแปลงดิน", "warn");
    }
    
    plots.forEach(function (g) {
      var d = g.userData;
      d.isWatered = false;
      d.wateredAt = 0;
      d.soilMat.emissive.setHex(0x000000);
    });
  }

  /* ========== Bank Modal Triggers ========== */
  var bankBtn = document.getElementById('bankBtn');
  var bankModal = document.getElementById('bankModal');
  var closeBankBtn = document.getElementById('closeBankBtn');
  if (bankBtn && bankModal) {
    bankBtn.addEventListener('click', function () {
      document.getElementById('bankBalanceVal').textContent = bankBalance;
      bankModal.style.display = 'flex';
    });
  }
  if (closeBankBtn && bankModal) {
    closeBankBtn.addEventListener('click', function () {
      bankModal.style.display = 'none';
    });
  }

  function triggerBankQuiz(amount, type, callback) {
    var quizOverlay = document.getElementById('quizModal');
    var quizQuestionEl = document.getElementById('quizQuestion');
    var quizChoicesEl = document.getElementById('quizChoices');
    var quizTimerEl = document.getElementById('quizTimer');
    if (!quizOverlay || !quizQuestionEl || !quizChoicesEl) return;

    var a = amount;
    var rate = 5;
    var answer = 0;
    var qText = "";
    
    if (type === 'deposit') {
      answer = Math.round(a * (rate / 100));
      qText = "🏦 บริการฝากเงิน " + a + " เหรียญ: หากธนาคารให้อัตราดอกเบี้ยร้อยละ " + rate + " ต่อปี เมื่อฝากครบ 1 ปีจะได้รับดอกเบี้ยกี่เหรียญ?";
    } else {
      rate = 10;
      answer = Math.round(a * (rate / 100));
      qText = "🏦 บริการถอนเงิน " + a + " เหรียญ: หากต้องเสียภาษีค่าธรรมเนียมถอนเงินร้อยละ " + rate + " จะต้องจ่ายค่าธรรมเนียมกี่เหรียญ?";
    }

    quizQuestionEl.textContent = qText;
    quizChoicesEl.innerHTML = '';

    var quizTimeLeft = 15;
    if (quizTimerEl) quizTimerEl.textContent = '⏱/ คิดเงินร้อยละ: ' + quizTimeLeft + ' วินาที';

    if (quizIntervalId) clearInterval(quizIntervalId);
    quizIntervalId = setInterval(function () {
      quizTimeLeft--;
      if (quizTimerEl) quizTimerEl.textContent = '⏱/ คิดเงินร้อยละ: ' + quizTimeLeft + ' วินาที';
      if (quizTimeLeft <= 0) {
        handleBankAnswer(false);
      }
    }, 1000);

    function handleBankAnswer(isCorrect) {
      if (quizIntervalId) {
        clearInterval(quizIntervalId);
        quizIntervalId = null;
      }
      quizOverlay.style.display = 'none';
      callback(isCorrect);
    }

    var choices = getQuizChoices(answer, 'medium');
    choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = choice;
      btn.addEventListener('click', function () {
        handleBankAnswer(choice === answer);
      });
      quizChoicesEl.appendChild(btn);
    });

    quizOverlay.style.display = 'flex';
  }

  var depositBtn = document.getElementById('depositBtn');
  var depositAllBtn = document.getElementById('depositAllBtn');
  var withdrawBtn = document.getElementById('withdrawBtn');
  var withdrawAllBtn = document.getElementById('withdrawAllBtn');

  if (depositBtn) {
    depositBtn.addEventListener('click', function () {
      var amt = Math.min(50, money);
      if (amt <= 0) {
        toast("เงินสดไม่เพียงพอ", "warn");
        return;
      }
      triggerBankQuiz(amt, 'deposit', function (isCorrect) {
        if (isCorrect) {
          money -= amt;
          bankBalance += amt;
          toast("ฝากเงินสำเร็จ +" + amt + " เหรียญ (ตอบถูก ฟรีค่าธรรมเนียม)", "good");
          addLedgerEntry("ฝากเงินเข้าธนาคาร", "expense", amt);
        } else {
          var fee = Math.max(1, Math.round(amt * 0.1));
          money -= (amt + fee);
          bankBalance += amt;
          toast("ฝากเงินสำเร็จ แต่โดนปรับ " + fee + " เหรียญ เนื่องจากคิดเลขผิด", "warn");
          addLedgerEntry("ฝากเงินเข้าธนาคาร (โดนปรับ " + fee + ")", "expense", amt + fee);
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
        }
        refreshHud();
        document.getElementById('bankBalanceVal').textContent = bankBalance;
      });
    });
  }

  if (depositAllBtn) {
    depositAllBtn.addEventListener('click', function () {
      var amt = money;
      if (amt <= 0) {
        toast("เงินสดไม่เพียงพอ", "warn");
        return;
      }
      triggerBankQuiz(amt, 'deposit', function (isCorrect) {
        if (isCorrect) {
          money -= amt;
          bankBalance += amt;
          toast("ฝากเงินสำเร็จ +" + amt + " เหรียญ (ตอบถูก ฟรีค่าธรรมเนียม)", "good");
          addLedgerEntry("ฝากเงินเข้าธนาคารทั้งหมด", "expense", amt);
        } else {
          var fee = Math.max(1, Math.round(amt * 0.1));
          money -= (amt + fee);
          bankBalance += amt;
          toast("ฝากเงินสำเร็จ แต่โดนปรับ " + fee + " เหรียญ เนื่องจากคิดเลขผิด", "warn");
          addLedgerEntry("ฝากเงินเข้าธนาคารทั้งหมด (โดนปรับ " + fee + ")", "expense", amt + fee);
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
        }
        refreshHud();
        document.getElementById('bankBalanceVal').textContent = bankBalance;
      });
    });
  }

  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', function () {
      var amt = Math.min(50, bankBalance);
      if (amt <= 0) {
        toast("ไม่มีเงินฝากในตู้เซฟ", "warn");
        return;
      }
      triggerBankQuiz(amt, 'withdraw', function (isCorrect) {
        if (isCorrect) {
          bankBalance -= amt;
          money += amt;
          toast("ถอนเงินสำเร็จ +" + amt + " เหรียญ (ตอบถูก ฟรีค่าธรรมเนียม)", "good");
          addLedgerEntry("ถอนเงินออกจากธนาคาร", "revenue", amt);
        } else {
          var fee = Math.max(1, Math.round(amt * 0.1));
          bankBalance -= amt;
          money += (amt - fee);
          toast("ถอนเงินสำเร็จ แต่โดนหักภาษีถอน " + fee + " เหรียญ เนื่องจากคิดเลขผิด", "warn");
          addLedgerEntry("ถอนเงินออกจากธนาคาร (โดนปรับ " + fee + ")", "revenue", amt - fee);
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
        }
        refreshHud();
        document.getElementById('bankBalanceVal').textContent = bankBalance;
      });
    });
  }

  if (withdrawAllBtn) {
    withdrawAllBtn.addEventListener('click', function () {
      var amt = bankBalance;
      if (amt <= 0) {
        toast("ไม่มีเงินฝากในตู้เซฟ", "warn");
        return;
      }
      triggerBankQuiz(amt, 'withdraw', function (isCorrect) {
        if (isCorrect) {
          bankBalance -= amt;
          money += amt;
          toast("ถอนเงินสำเร็จ +" + amt + " เหรียญ (ตอบถูก ฟรีค่าธรรมเนียม)", "good");
          addLedgerEntry("ถอนเงินทั้งหมดออกจากธนาคาร", "revenue", amt);
        } else {
          var fee = Math.max(1, Math.round(amt * 0.1));
          bankBalance -= amt;
          money += (amt - fee);
          toast("ถอนเงินสำเร็จ แต่โดนหักภาษีถอน " + fee + " เหรียญ เนื่องจากคิดเลขผิด", "warn");
          addLedgerEntry("ถอนเงินทั้งหมดออกจากธนาคาร (โดนปรับ " + fee + ")", "revenue", amt - fee);
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
        }
        refreshHud();
        document.getElementById('bankBalanceVal').textContent = bankBalance;
      });
    });
  }

  var coopMesh = null;
  var barnMesh = null;
  var scarecrowMesh = null;
  function spawnScarecrowMesh() {
    if (scarecrowMesh) return;
    scarecrowMesh = new THREE.Group();
    scarecrowMesh.position.set(0.7, GROUND_Y, -1.5);
    scarecrowMesh.scale.set(0.001, 0.001, 0.001);
    
    // Wooden pole
    var poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    var woodMat = new THREE.MeshStandardMaterial({ color: '#8a5a34', roughness: 0.9 });
    var pole = new THREE.Mesh(poleGeo, woodMat);
    pole.position.y = 0.4;
    pole.castShadow = true;
    scarecrowMesh.add(pole);

    // Cross bar
    var cross = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), woodMat);
    cross.position.y = 0.58;
    cross.castShadow = true;
    scarecrowMesh.add(cross);

    // Clothes (ragged blue shirt)
    var shirtMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.8 });
    var shirt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.15), shirtMat);
    shirt.position.y = 0.5;
    shirt.castShadow = true;
    scarecrowMesh.add(shirt);

    // Straw hat
    var strawMat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.9 });
    var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), strawMat);
    brim.position.y = 0.72;
    var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.1, 8), strawMat);
    crown.position.y = 0.77;
    brim.castShadow = true; crown.castShadow = true;
    scarecrowMesh.add(brim, crown);

    // Face / head
    var headMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.8 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), headMat);
    head.position.y = 0.68;
    head.castShadow = true;
    scarecrowMesh.add(head);

    islandGroup.add(scarecrowMesh);

    // Animate scale up
    var startTime = clock.elapsedTime;
    var scaleInterval = setInterval(function () {
      var elapsed = clock.elapsedTime - startTime;
      var pct = Math.min(1.0, elapsed / 0.5);
      var sc = easeOut(pct) * 1.0;
      if (scarecrowMesh) scarecrowMesh.scale.set(sc, sc, sc);
      if (pct >= 1.0) clearInterval(scaleInterval);
    }, 16);
  }

  function spawnCoopMesh() {
    if (coopMesh) return;
    coopMesh = new THREE.Group();
    coopMesh.position.set(-2.2, GROUND_Y, 1.8);
    coopMesh.scale.set(0.001, 0.001, 0.001);
    
    var poleMat = new THREE.MeshStandardMaterial({ color: '#7c4a25', roughness: 0.9 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), poleMat);
    base.position.y = 0.05;
    coopMesh.add(base);
    
    var wallMat = new THREE.MeshStandardMaterial({ color: '#c65b3b', roughness: 0.8 });
    var wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), wallMat);
    wall.position.y = 0.35;
    wall.castShadow = true; wall.receiveShadow = true;
    coopMesh.add(wall);
    
    var roofMat = new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.9 });
    var roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), roofMat);
    roof.position.y = 0.75;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    coopMesh.add(roof);
    
    var ramp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.4), poleMat);
    ramp.position.set(0, 0.1, 0.45);
    ramp.rotation.x = 0.4;
    coopMesh.add(ramp);
    
    islandGroup.add(coopMesh);
    
    var startTime = clock.elapsedTime;
    var scaleInterval = setInterval(function () {
      var elapsed = clock.elapsedTime - startTime;
      var pct = Math.min(1.0, elapsed / 0.5);
      var sc = easeOut(pct) * 1.0;
      if (coopMesh) coopMesh.scale.set(sc, sc, sc);
      if (pct >= 1.0) clearInterval(scaleInterval);
    }, 16);
  }

  function spawnBarnMesh() {
    if (barnMesh) return;
    barnMesh = new THREE.Group();
    barnMesh.position.set(2.2, GROUND_Y, 1.8);
    barnMesh.scale.set(0.001, 0.001, 0.001);
    
    var wallMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.8 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.9), wallMat);
    body.position.y = 0.35;
    body.castShadow = true; body.receiveShadow = true;
    barnMesh.add(body);
    
    var roofMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });
    var roof = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.0), roofMat);
    roof.position.y = 0.75;
    roof.rotation.z = 0.15;
    roof.castShadow = true;
    barnMesh.add(roof);
    
    var doorMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.04), doorMat);
    door.position.set(0, 0.225, 0.46);
    barnMesh.add(door);
    
    var crossMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.9 });
    var cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.02), crossMat);
    cross1.rotation.z = 0.7;
    cross1.position.set(0, 0.225, 0.485);
    barnMesh.add(cross1);
    
    islandGroup.add(barnMesh);
    
    var startTime = clock.elapsedTime;
    var scaleInterval = setInterval(function () {
      var elapsed = clock.elapsedTime - startTime;
      var pct = Math.min(1.0, elapsed / 0.5);
      var sc = easeOut(pct) * 1.0;
      if (barnMesh) barnMesh.scale.set(sc, sc, sc);
      if (pct >= 1.0) clearInterval(scaleInterval);
    }, 16);
  }

  /* ========== Phase 3: Animal Husbandry Spawning & Balloons ========== */
  function createAnimalBalloon(emoji) {
    var canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    var ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 28, 22, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(32, 50);
    ctx.lineTo(26, 42);
    ctx.lineTo(38, 42);
    ctx.closePath();
    ctx.fill();
    
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 28);
    
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.48, 0.48, 0.48);
    sprite.position.y = 0.48;
    return sprite;
  }

  function updateBalloonEmoji(sprite, emoji) {
    var canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    var ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 28, 22, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(32, 50);
    ctx.lineTo(26, 42);
    ctx.lineTo(38, 42);
    ctx.closePath();
    ctx.fill();
    
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 28);
    
    if (sprite.material.map) sprite.material.map.dispose();
    sprite.material.map = new THREE.CanvasTexture(canvas);
    sprite.material.map.needsUpdate = true;
    sprite.material.needsUpdate = true;
  }

  function spawnChicken() {
    var mesh = new THREE.Group();
    mesh.position.set(-2.2 + (getRandom() - 0.5) * 0.5, GROUND_Y, 1.8 + (getRandom() - 0.5) * 0.5);
    
    var bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.15), bodyMat);
    body.position.y = 0.06;
    body.castShadow = true;
    mesh.add(body);
    
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), bodyMat);
    head.position.set(0, 0.14, 0.04);
    head.castShadow = true;
    mesh.add(head);
    
    var beakMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.5 });
    var beak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), beakMat);
    beak.position.set(0, 0.14, 0.09);
    mesh.add(beak);
    
    var combMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.9 });
    var comb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), combMat);
    comb.position.set(0, 0.19, 0.03);
    mesh.add(comb);
    
    islandGroup.add(mesh);
    
    var balloon = createAnimalBalloon('😋');
    mesh.add(balloon);
    
    var ch = {
      mesh: mesh,
      state: 'hungry', // 'hungry', 'growing', 'ready', 'idle'
      fedAt: 0,
      targetPos: mesh.position.clone(),
      basePos: new THREE.Vector3(-2.2, GROUND_Y, 1.8),
      wanderTimer: 0,
      type: 'chicken',
      progress: 0,
      idleTimer: 0,
      balloon: balloon
    };
    chickensList.push(ch);
    
    var wp = new THREE.Vector3();
    mesh.getWorldPosition(wp);
    burst(wp, ['#f8fafc', '#f1f5f9'], 8, { up: 1.2, spread: 1.0 });
  }

  function spawnCow() {
    var mesh = new THREE.Group();
    mesh.position.set(2.2 + (getRandom() - 0.5) * 0.6, GROUND_Y, 1.8 + (getRandom() - 0.5) * 0.6);
    
    var bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.35), bodyMat);
    body.position.y = 0.16;
    body.castShadow = true;
    mesh.add(body);
    
    var spotMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
    var spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), spotMat);
    spot1.position.set(0.121, 0.18, 0.05);
    mesh.add(spot1);
    var spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), spotMat);
    spot2.position.set(-0.121, 0.14, -0.05);
    mesh.add(spot2);
    
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), bodyMat);
    head.position.set(0, 0.28, 0.14);
    head.castShadow = true;
    mesh.add(head);
    
    var snoutMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.7 });
    var snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), snoutMat);
    snout.position.set(0, 0.24, 0.22);
    mesh.add(snout);
    
    var hornMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 });
    var hornL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), hornMat);
    hornL.position.set(0.06, 0.36, 0.14);
    mesh.add(hornL);
    var hornR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), hornMat);
    hornR.position.set(-0.06, 0.36, 0.14);
    mesh.add(hornR);
    
    islandGroup.add(mesh);
    
    var balloon = createAnimalBalloon('😋');
    mesh.add(balloon);
    
    var cw = {
      mesh: mesh,
      state: 'hungry', // 'hungry', 'growing', 'ready', 'idle'
      fedAt: 0,
      targetPos: mesh.position.clone(),
      basePos: new THREE.Vector3(2.2, GROUND_Y, 1.8),
      wanderTimer: 0,
      type: 'cow',
      progress: 0,
      idleTimer: 0,
      balloon: balloon
    };
    cowsList.push(cw);
    
    var wp = new THREE.Vector3();
    mesh.getWorldPosition(wp);
    burst(wp, ['#f8fafc', '#fda4af'], 8, { up: 1.2, spread: 1.0 });
  }

  function updateAnimalState(animal, dt) {
    if (animal.state === 'growing') {
      var growSpeed = weatherState === 'rainy' ? 1.5 : 1.0;
      animal.progress += (dt / (animal.type === 'chicken' ? 15.0 : 25.0)) * growSpeed;
      
      // Update balloon with fraction progress clock emoji
      var clockEmojis = ['🕐', '🕒', '🕕', '🕘', '🕛'];
      var emojiIdx = Math.min(clockEmojis.length - 1, Math.floor(animal.progress * clockEmojis.length));
      updateBalloonEmoji(animal.balloon, clockEmojis[emojiIdx]);

      if (animal.progress >= 1.0) {
        animal.state = 'ready';
        animal.progress = 0;
        updateBalloonEmoji(animal.balloon, animal.type === 'chicken' ? '🥚' : '🥛');
        toast(animal.type === 'chicken' ? "🐔 แม่ไก่ไข่พร้อมเก็บเกี่ยวแล้ว! 🥚" : "🐄 แม่วัวนมพร้อมรีดนมแล้ว! 🥛", "info");
      }
    } else if (animal.state === 'idle') {
      animal.idleTimer -= dt;
      if (animal.idleTimer <= 0) {
        animal.state = 'hungry';
        updateBalloonEmoji(animal.balloon, '😋');
      }
    }
  }

  function triggerRatioQuiz(animal, callback) {
    var quizOverlay = document.getElementById('quizModal');
    var quizQuestionEl = document.getElementById('quizQuestion');
    var quizChoicesEl = document.getElementById('quizChoices');
    var quizTimerEl = document.getElementById('quizTimer');
    if (!quizOverlay || !quizQuestionEl || !quizChoicesEl) return;

    var answer = 0;
    var qText = "";
    
    if (animal.type === 'chicken') {
      var n = Math.floor(getRandom() * 6) + 2; // 2 to 7
      if (n === 3) n = 8;
      answer = n * 20;
      qText = "🐔 โจทย์สัดส่วน: ไก่ 3 ตัว กินอาหาร 60 กรัมต่อวัน ถ้ามีไก่ " + n + " ตัว ต้องเตรียมอาหารกี่กรัม?";
    } else {
      var x = Math.floor(getRandom() * 5) + 2; // 2 to 6
      answer = x * 2;
      var water = x * 8;
      qText = "🐄 โจทย์สัดส่วน: นมผงชงลูกวัวใช้อัตราส่วน นมผง 2 ช้อน ต่อน้ำ 8 ออนซ์ หากมีน้ำ " + water + " ออนซ์ ต้องใช้นมผงกี่ช้อน?";
    }

    quizQuestionEl.textContent = qText;
    quizChoicesEl.innerHTML = '';

    var quizTimeLeft = 15;
    if (quizTimerEl) quizTimerEl.textContent = '⏱️ เวลาคิดสัดส่วน: ' + quizTimeLeft + ' วินาที';

    if (quizIntervalId) clearInterval(quizIntervalId);
    quizIntervalId = setInterval(function () {
      quizTimeLeft--;
      if (quizTimerEl) quizTimerEl.textContent = '⏱️ เวลาคิดสัดส่วน: ' + quizTimeLeft + ' วินาที';
      if (quizTimeLeft <= 0) {
        handleRatioAnswer(false);
      }
    }, 1000);

    function handleRatioAnswer(isCorrect) {
      if (quizIntervalId) {
        clearInterval(quizIntervalId);
        quizIntervalId = null;
      }
      quizOverlay.style.display = 'none';
      callback(isCorrect);
    }

    var choices = getQuizChoices(answer, 'medium');
    choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = choice;
      btn.addEventListener('click', function () {
        handleRatioAnswer(choice === answer);
      });
      quizChoicesEl.appendChild(btn);
    });

    quizOverlay.style.display = 'flex';
  }

  function handleAnimalClick(animal) {
    if (!animal) return;
    
    if (animal.state === 'hungry') {
      var hasFeed = animal.type === 'chicken' ? (upgrades.chickenFeed > 0) : (upgrades.cowFeed > 0);
      if (!hasFeed) {
        toast("❌ ไม่มีอาหารในสต็อก! ซื้ออาหารที่ร้านค้า 🛒", "warn");
        return;
      }
      
      triggerRatioQuiz(animal, function (isCorrect) {
        if (isCorrect) {
          if (animal.type === 'chicken') upgrades.chickenFeed--;
          else upgrades.cowFeed--;
          
          animal.state = 'growing';
          animal.progress = 0;
          updateBalloonEmoji(animal.balloon, '⏳');
          toast("ให้อาหารสำเร็จ! สัตว์เริ่มผลิตสินค้า 😋", "good");
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
            try { KAMPAI.sound.correct(); } catch (e) { /* */ }
          }
        } else {
          if (animal.type === 'chicken') upgrades.chickenFeed--;
          else upgrades.cowFeed--;
          toast("ให้อาหารพลาด! อาหารร่วงหกเสียหาย เนื่องจากกะสัดส่วนผิด ❌", "warn");
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
        }
        refreshShopUI();
      });
    } else if (animal.state === 'growing') {
      var sec = Math.ceil((1.0 - animal.progress) * (animal.type === 'chicken' ? 15.0 : 25.0));
      toast("⏳ สัตว์เลี้ยงกำลังเติบโต/ผลิตสินค้า (เหลืออีก " + sec + " วินาที)", "info");
    } else if (animal.state === 'ready') {
      if (animal.type === 'chicken') {
        crops.egg++;
        toast("เก็บเกี่ยว ไข่ไก่ 🥚 สำเร็จ! เก็บในโรงฉางแล้ว", "good");
      } else {
        crops.milk++;
        toast("เก็บเกี่ยว นมสด 🥛 สำเร็จ! เก็บในโรงฉางแล้ว", "good");
      }
      
      animal.state = 'idle';
      animal.idleTimer = 15.0;
      updateBalloonEmoji(animal.balloon, '💤');
      refreshHud();
      
      var wp = new THREE.Vector3();
      animal.mesh.getWorldPosition(wp);
      wp.y += 0.3;
      burst(wp, animal.type === 'chicken' ? ['#fbbf24', '#f1f5f9'] : ['#fda4af', '#f1f5f9'], 8, { up: 1.3, spread: 1.1 });
      
      if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
        try { KAMPAI.sound.correct(); } catch (e) { /* */ }
      }
    } else if (animal.state === 'idle') {
      toast("💤 สัตว์เลี้ยงอิ่มแล้วและกำลังพักผ่อนนอนหลับ", "info");
    }
  }

  function refreshShopUI() {
    var fertCountEl = document.getElementById('fertilizerCount');
    if (fertCountEl) fertCountEl.textContent = upgrades.fertilizer;
    
    // Phase 3 Inventory Labels
    var chickenFeedCountEl = document.getElementById('chickenFeedCount');
    if (chickenFeedCountEl) chickenFeedCountEl.textContent = upgrades.chickenFeed;
    var cowFeedCountEl = document.getElementById('cowFeedCount');
    if (cowFeedCountEl) cowFeedCountEl.textContent = upgrades.cowFeed;
    var chickenCountEl = document.getElementById('chickenCount');
    if (chickenCountEl) chickenCountEl.textContent = chickensList.length;
    var cowCountEl = document.getElementById('cowCount');
    if (cowCountEl) cowCountEl.textContent = cowsList.length;

    var buySprinklerBtn = document.getElementById('buySprinklerBtn');
    var buyScarecrowBtn = document.getElementById('buyScarecrowBtn');
    var buyFertilizerBtn = document.getElementById('buyFertilizerBtn');
    
    var buyCoopBtn = document.getElementById('buyCoopBtn');
    var buyBarnBtn = document.getElementById('buyBarnBtn');
    var buyChickenBtn = document.getElementById('buyChickenBtn');
    var buyCowBtn = document.getElementById('buyCowBtn');
    var buyChickenFeedBtn = document.getElementById('buyChickenFeedBtn');
    var buyCowFeedBtn = document.getElementById('buyCowFeedBtn');

    if (buySprinklerBtn) {
      buySprinklerBtn.disabled = upgrades.sprinkler || money < 200;
      if (upgrades.sprinkler) buySprinklerBtn.textContent = 'เป็นเจ้าของแล้ว ✅';
      else buySprinklerBtn.textContent = 'ซื้อราคา 200 🪙';
    }
    if (buyScarecrowBtn) {
      buyScarecrowBtn.disabled = upgrades.scarecrow || money < 350;
      if (upgrades.scarecrow) buyScarecrowBtn.textContent = 'เป็นเจ้าของแล้ว ✅';
      else buyScarecrowBtn.textContent = 'ซื้อราคา 350 🪙';
    }
    if (buyFertilizerBtn) {
      buyFertilizerBtn.disabled = money < 50;
    }

    if (buyCoopBtn) {
      buyCoopBtn.disabled = upgrades.coop || money < 150;
      if (upgrades.coop) buyCoopBtn.textContent = 'สร้างเสร็จแล้ว ✅';
      else buyCoopBtn.textContent = 'ซื้อราคา 150 🪙';
    }
    if (buyBarnBtn) {
      buyBarnBtn.disabled = upgrades.barn || money < 300;
      if (upgrades.barn) buyBarnBtn.textContent = 'สร้างเสร็จแล้ว ✅';
      else buyBarnBtn.textContent = 'ซื้อราคา 300 🪙';
    }
    if (buyChickenBtn) {
      buyChickenBtn.disabled = !upgrades.coop || chickensList.length >= 3 || money < 50;
      if (chickensList.length >= 3) buyChickenBtn.textContent = 'เต็มความจุ ❌';
      else buyChickenBtn.textContent = 'ซื้อราคา 50 🪙';
    }
    if (buyCowBtn) {
      buyCowBtn.disabled = !upgrades.barn || cowsList.length >= 2 || money < 100;
      if (cowsList.length >= 2) buyCowBtn.textContent = 'เต็มความจุ ❌';
      else buyCowBtn.textContent = 'ซื้อราคา 100 🪙';
    }
    if (buyChickenFeedBtn) {
      buyChickenFeedBtn.disabled = money < 10;
    }
    if (buyCowFeedBtn) {
      buyCowFeedBtn.disabled = money < 20;
    }
  }

  /* ========== Shop Buying Listeners ========== */
  var buySprinklerBtn = document.getElementById('buySprinklerBtn');
  var buyScarecrowBtn = document.getElementById('buyScarecrowBtn');
  var buyFertilizerBtn = document.getElementById('buyFertilizerBtn');
  
  if (buySprinklerBtn) {
    buySprinklerBtn.addEventListener('click', function () {
      if (money >= 200 && !upgrades.sprinkler) {
        money -= 200;
        upgrades.sprinkler = true;
        addLedgerEntry(DATA.MSG.upgradeWater, 'expense', 200);
        toast(DATA.MSG.buySuccess.replace('{item}', DATA.MSG.upgradeWater), 'good');
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyScarecrowBtn) {
    buyScarecrowBtn.addEventListener('click', function () {
      if (money >= 350 && !upgrades.scarecrow) {
        money -= 350;
        upgrades.scarecrow = true;
        addLedgerEntry(DATA.MSG.upgradeScarecrow, 'expense', 350);
        toast(DATA.MSG.buySuccess.replace('{item}', DATA.MSG.upgradeScarecrow), 'good');
        refreshShopUI();
        refreshHud();
        spawnScarecrowMesh();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyFertilizerBtn) {
    buyFertilizerBtn.addEventListener('click', function () {
      if (money >= 50) {
        money -= 50;
        upgrades.fertilizer++;
        addLedgerEntry(DATA.MSG.upgradeFertilizer, 'expense', 50);
        toast(DATA.MSG.buySuccess.replace('{item}', DATA.MSG.upgradeFertilizer), 'good');
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  /* ========== Phase 3: Animal Upgrades Buying Listeners ========== */
  var buyCoopBtn = document.getElementById('buyCoopBtn');
  var buyBarnBtn = document.getElementById('buyBarnBtn');
  var buyChickenBtn = document.getElementById('buyChickenBtn');
  var buyCowBtn = document.getElementById('buyCowBtn');
  var buyChickenFeedBtn = document.getElementById('buyChickenFeedBtn');
  var buyCowFeedBtn = document.getElementById('buyCowFeedBtn');

  if (buyCoopBtn) {
    buyCoopBtn.addEventListener('click', function () {
      if (money >= 150 && !upgrades.coop) {
        money -= 150;
        upgrades.coop = true;
        addLedgerEntry("สร้างเล้าไก่ไข่", "expense", 150);
        toast("สร้างเล้าไก่ไข่สำเร็จ! 🏠🐔", "good");
        spawnCoopMesh();
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyBarnBtn) {
    buyBarnBtn.addEventListener('click', function () {
      if (money >= 300 && !upgrades.barn) {
        money -= 300;
        upgrades.barn = true;
        addLedgerEntry("สร้างคอกวัวนม", "expense", 300);
        toast("สร้างคอกวัวนมสำเร็จ! 🏠🐄", "good");
        spawnBarnMesh();
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyChickenBtn) {
    buyChickenBtn.addEventListener('click', function () {
      if (money >= 50 && upgrades.coop && chickensList.length < 3) {
        money -= 50;
        addLedgerEntry("ซื้อแม่ไก่พันธุ์ไข่", "expense", 50);
        toast("ซื้อแม่ไก่สำเร็จ! 🐔", "good");
        spawnChicken();
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyCowBtn) {
    buyCowBtn.addEventListener('click', function () {
      if (money >= 100 && upgrades.barn && cowsList.length < 2) {
        money -= 100;
        addLedgerEntry("ซื้อแม่วัวนม", "expense", 100);
        toast("ซื้อแม่วัวนมสำเร็จ! 🐄", "good");
        spawnCow();
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyChickenFeedBtn) {
    buyChickenFeedBtn.addEventListener('click', function () {
      if (money >= 10) {
        money -= 10;
        upgrades.chickenFeed++;
        addLedgerEntry("ซื้ออาหารไก่ (1 ถุง)", "expense", 10);
        toast("ซื้ออาหารไก่สำเร็จ! 🌾🎒", "good");
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  if (buyCowFeedBtn) {
    buyCowFeedBtn.addEventListener('click', function () {
      if (money >= 20) {
        money -= 20;
        upgrades.cowFeed++;
        addLedgerEntry("ซื้ออาหารวัว (1 ถุง)", "expense", 20);
        toast("ซื้ออาหารวัวสำเร็จ! 🍀🎒", "good");
        refreshShopUI();
        refreshHud();
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
      }
    });
  }

  /* ========== HUD Update ========== */
  function refreshHud() {
    var moneyEl = document.getElementById('money');
    var bankMoneyEl = document.getElementById('bank-money');
    if (moneyEl) moneyEl.textContent = Math.round(shownMoney);
    if (bankMoneyEl) bankMoneyEl.textContent = Math.round(shownBankBalance);

    var carrotCountEl = document.getElementById('crop-carrot');
    var cornCountEl = document.getElementById('crop-corn');
    var melonCountEl = document.getElementById('crop-melon');
    var eggCountEl = document.getElementById('crop-egg');
    var milkCountEl = document.getElementById('crop-milk');
    if (carrotCountEl) carrotCountEl.textContent = crops.carrot;
    if (cornCountEl) cornCountEl.textContent = crops.corn;
    if (melonCountEl) melonCountEl.textContent = crops.melon;
    if (eggCountEl) eggCountEl.textContent = crops.egg;
    if (milkCountEl) milkCountEl.textContent = crops.milk;
    var totalCrops = crops.carrot + crops.corn + crops.melon + crops.egg + crops.milk;
    if (sellBtn) sellBtn.disabled = totalCrops <= 0;
  }

  /* ========== Three.js Detection ========== */
  // JSDOM / headless fallback
  if (!window.THREE || typeof THREE.WebGLRenderer !== 'function') {
    // Mock mode for verify:game smoke test
    if (startBtn) startBtn.addEventListener('click', function () { if (blockerEl) blockerEl.style.display = 'none'; });
    if (loadingEl) loadingEl.classList.add('hide');
    return;
  }

  /* ========== Renderer / Scene ========== */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  containerEl.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffd9a8, 22, 55);

  /* ========== Rain Particles ========== */
  var rainGeo = new THREE.BufferGeometry();
  var rainCount = 180;
  var rainPositions = new Float32Array(rainCount * 3);
  for (var i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 16.0;      // x
    rainPositions[i * 3 + 1] = GROUND_Y + Math.random() * 6.0; // y
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 16.0;  // z
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  var rainMat = new THREE.PointsMaterial({
    color: '#93c5fd',
    size: 0.08,
    transparent: true,
    opacity: 0.65
  });
  var rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.visible = false;
  scene.add(rainPoints);

  var camera = new THREE.PerspectiveCamera(CFG.CAM_FOV, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(CFG.CAM_POS.x, CFG.CAM_POS.y, CFG.CAM_POS.z);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(CFG.CAM_TARGET.x, CFG.CAM_TARGET.y, CFG.CAM_TARGET.z);
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minPolarAngle = Math.PI / 6;
  controls.minDistance = CFG.CAM_MIN_DIST;
  controls.maxDistance = CFG.CAM_MAX_DIST;
  controls.enablePan = false;

  /* ========== Sky ========== */
  var sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top:    { value: new THREE.Color(CFG.COLORS.skyTop) },
        mid:    { value: new THREE.Color(CFG.COLORS.skyMid) },
        bottom: { value: new THREE.Color(CFG.COLORS.skyBot) }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: [
        'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;',
        'void main(){',
        '  float h = normalize(vP).y * 0.5 + 0.5;',
        '  vec3 c = h < 0.5 ? mix(bottom, mid, h*2.0) : mix(mid, top, (h-0.5)*2.0);',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    })
  );
  scene.add(sky);

  /* ========== Lights ========== */
  scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x6b8f5a, 0.75));
  scene.add(new THREE.AmbientLight(0xfff2df, 0.35));

  var sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
  sun.position.set(8, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  var fill = new THREE.DirectionalLight(0xffcaa0, 0.5);
  fill.position.set(-6, 4, -5);
  scene.add(fill);

  /* ========== Water ========== */
  var waterSeg = REDUCED ? CFG.WATER_SEG_REDUCED : CFG.WATER_SEG_NORMAL;
  var waterGeo = new THREE.PlaneGeometry(120, 120, waterSeg, waterSeg);
  var waterMat = new THREE.MeshStandardMaterial({
    color: CFG.COLORS.water, roughness: 0.25, metalness: 0.1,
    transparent: true, opacity: 0.9, flatShading: true
  });
  var water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.35;
  water.receiveShadow = true;
  scene.add(water);
  var waterBase = waterGeo.attributes.position.array.slice();

  var deep = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshBasicMaterial({ color: CFG.COLORS.deepSea })
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = -1.4;
  scene.add(deep);

  /* ========== Island ========== */
  var islandGroup = new THREE.Group();
  scene.add(islandGroup);

  var sand = new THREE.Mesh(
    new THREE.CylinderGeometry(5.0, 5.2, 0.5, 48),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.sand, roughness: 1 })
  );
  sand.position.y = -0.05;
  sand.receiveShadow = true;
  islandGroup.add(sand);

  var rock = new THREE.Mesh(
    new THREE.CylinderGeometry(4.9, 3.2, 1.6, 48),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.rock, roughness: 1, flatShading: true })
  );
  rock.position.y = -1.0;
  rock.receiveShadow = true;
  islandGroup.add(rock);

  var grass = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.7, 0.55, 48),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.grass, roughness: 0.95, flatShading: true })
  );
  grass.position.y = 0.28;
  grass.receiveShadow = true;
  grass.castShadow = true;
  islandGroup.add(grass);

  var GROUND_Y = CFG.GROUND_Y;

  /* ========== Cozy House ========== */
  var house = new THREE.Group();
  house.position.set(-2.3, GROUND_Y, -1.9);
  islandGroup.add(house);

  var wallMat = new THREE.MeshStandardMaterial({ color: CFG.COLORS.wall, roughness: 0.85 });
  var walls = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.4), wallMat);
  walls.position.y = 0.52;
  walls.castShadow = true; walls.receiveShadow = true;
  house.add(walls);

  var roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.28, 0.85, 4),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.roof, roughness: 0.7, flatShading: true })
  );
  roof.position.y = 1.42;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  var door = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.62, 0.06),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.door, roughness: 0.8 })
  );
  door.position.set(0, 0.31, 0.72);
  house.add(door);

  var winMat = new THREE.MeshStandardMaterial({
    color: 0xbfe6ff, emissive: 0x8fd0ff, emissiveIntensity: 0.3, roughness: 0.4
  });
  var win = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.06), winMat);
  win.position.set(0.45, 0.62, 0.72);
  house.add(win);

  var chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.5, 0.22),
    new THREE.MeshStandardMaterial({ color: CFG.COLORS.chimney, roughness: 0.8 })
  );
  chimney.position.set(-0.45, 1.35, -0.3);
  chimney.castShadow = true;
  house.add(chimney);
  var chimneyTop = new THREE.Vector3(-2.3 - 0.45, GROUND_Y + 1.6, -1.9 - 0.3);

  /* ========== Trees / Rocks / Flowers ========== */
  var trunkMat = new THREE.MeshStandardMaterial({ color: CFG.COLORS.trunk, roughness: 1 });
  var leafMats = DATA.LEAF_COLORS.map(function (c) {
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
  });
  var swayers = [];

  function makeTree(x, z, s) {
    s = s || 1;
    var g = new THREE.Group();
    g.position.set(x, GROUND_Y, z);
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 0.6 * s, 8), trunkMat);
    trunk.position.y = 0.3 * s; trunk.castShadow = true;
    g.add(trunk);
    var y = 0.55 * s;
    for (var i = 0; i < 3; i++) {
      var r = (0.55 - i * 0.13) * s;
      var cone = new THREE.Mesh(new THREE.ConeGeometry(r, 0.55 * s, 8), leafMats[i % 3]);
      cone.position.y = y; cone.castShadow = true;
      g.add(cone);
      y += 0.34 * s;
    }
    islandGroup.add(g);
    swayers.push({ obj: g, phase: Math.random() * 6.28, amp: 0.03 + Math.random() * 0.02 });
  }

  DATA.TREES.forEach(function (t) { makeTree(t.x, t.z, t.s); });

  var rockMat = new THREE.MeshStandardMaterial({ color: '#9a938a', roughness: 1, flatShading: true });
  DATA.PEBBLES.forEach(function (p) {
    var m = new THREE.Mesh(new THREE.DodecahedronGeometry(p.s), rockMat);
    m.position.set(p.x, GROUND_Y + p.s * 0.4, p.z);
    m.rotation.set(Math.random(), Math.random(), Math.random());
    m.castShadow = true; m.receiveShadow = true;
    islandGroup.add(m);
  });

  for (var fi = 0; fi < DATA.FLOWER_COUNT; fi++) {
    var a = Math.random() * Math.PI * 2;
    var r = DATA.FLOWER_RADIUS_MIN + Math.random() * (DATA.FLOWER_RADIUS_MAX - DATA.FLOWER_RADIUS_MIN);
    var fx = Math.cos(a) * r;
    var fz = Math.sin(a) * r + 0.5;
    var fc = DATA.FLOWER_COLORS[(Math.random() * DATA.FLOWER_COLORS.length) | 0];
    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.18, 5),
      new THREE.MeshStandardMaterial({ color: '#3f8f3a' })
    );
    stem.position.set(fx, GROUND_Y + 0.09, fz);
    var bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.15 })
    );
    bud.position.set(fx, GROUND_Y + 0.2, fz);
    islandGroup.add(stem);
    islandGroup.add(bud);
  }

  /* ========== Farm Plots ========== */
  var plots = [];
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var clock = new THREE.Clock();
  var dirtColor = new THREE.Color(CFG.COLORS.dirt);

  function createPlantMesh(cropId) {
    var plant = new THREE.Group();
    plant.position.y = 0.12;

    if (cropId === 'carrot') {
      // Carrot: Orange root sticking down + green leaves
      var rootGeo = new THREE.CylinderGeometry(0.01, 0.07, 0.28, 8);
      var rootMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.6 }); // Orange
      var root = new THREE.Mesh(rootGeo, rootMat);
      root.position.y = 0.14;
      plant.add(root);

      var leafMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 });
      for (var i = 0; i < 3; i++) {
        var leaf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), leafMat);
        leaf.position.y = 0.28;
        leaf.rotation.z = (i - 1) * 0.25 + (Math.random() - 0.5) * 0.1;
        leaf.rotation.x = (Math.random() - 0.5) * 0.2;
        plant.add(leaf);
      }
    } else if (cropId === 'corn') {
      // Corn: Tall green stalk + yellow cobs
      var stalkGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.55, 6);
      var stalkMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8 });
      var stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.y = 0.27;
      plant.add(stalk);

      var leafMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
      for (var i = 0; i < 2; i++) {
        var leaf = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.08), leafMat);
        leaf.position.set(i === 0 ? 0.08 : -0.08, 0.35, 0);
        leaf.rotation.z = i === 0 ? -0.4 : 0.4;
        plant.add(leaf);
      }

      var cobMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.5 });
      var cob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), cobMat);
      cob1.position.set(0.07, 0.28, 0.04);
      cob1.rotation.z = -0.3;
      var cob2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), cobMat);
      cob2.position.set(-0.07, 0.38, -0.04);
      cob2.rotation.z = 0.3;
      plant.add(cob1, cob2);
    } else if (cropId === 'melon') {
      // Melon: Dark green vine crawling + big round melon
      var vineMat = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.9 });
      var vine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.08), vineMat);
      vine.position.y = 0.02;
      vine.rotation.y = 0.5;
      plant.add(vine);

      var melonMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 });
      var melon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), melonMat);
      melon.position.set(0.08, 0.14, 0.04);
      plant.add(melon);
    }

    plant.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    plant.scale.setScalar(0.001);
    plant.visible = false;
    return plant;
  }

  function makePlot(x, z, row, col) {
    var g = new THREE.Group();
    g.position.set(x, GROUND_Y, z);
    g.userData.baseY = GROUND_Y;

    var isLoamy = (row + col) % 2 === 0;
    var soilType = isLoamy ? 'loamy' : 'sandy';
    var soilCol = isLoamy ? '#52361b' : '#cda775';
    var frameCol = isLoamy ? '#704825' : '#bfa58a';

    var soilMat = new THREE.MeshStandardMaterial({ color: soilCol, roughness: 1, emissive: 0x000000 });
    var soil = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.95), soilMat);
    soil.position.y = 0.02;
    soil.receiveShadow = true; soil.castShadow = true;
    soil.userData.group = g;
    g.add(soil);

    // Wooden frame
    var frameMat = new THREE.MeshStandardMaterial({ color: frameCol, roughness: 0.9 });
    var framePositions = [[0, 0.5], [0, -0.5], [0.5, 0], [-0.5, 0]];
    for (var i = 0; i < framePositions.length; i++) {
      var fPos = framePositions[i];
      var horiz = i < 2;
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? 1.0 : 0.08, 0.14, horiz ? 0.08 : 1.0), frameMat
      );
      bar.position.set(fPos[0], 0.06, fPos[1]);
      bar.castShadow = true;
      g.add(bar);
    }

    // Pre-create plants for all types
    var plantCarrot = createPlantMesh('carrot');
    var plantCorn = createPlantMesh('corn');
    var plantMelon = createPlantMesh('melon');
    g.add(plantCarrot, plantCorn, plantMelon);

    // Ready glow ring
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.46, 0.56, 32),
      new THREE.MeshBasicMaterial({ color: '#ffe07a', transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    g.add(ring);

    // Progress bar (billboard)
    var barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.1),
      new THREE.MeshBasicMaterial({ color: '#2b2113', transparent: true, opacity: 0.55 })
    );
    var barFillMat = new THREE.MeshBasicMaterial({ color: '#7fe06a' });
    var barFill = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.06), barFillMat);
    var progressBar = new THREE.Group();
    progressBar.add(barBg, barFill);
    progressBar.position.y = 1.0;
    progressBar.visible = false;
    g.add(progressBar);

    g.userData = {
      baseY: g.userData.baseY,
      state: 'empty',
      soil: soil,
      soilMat: soilMat,
      soilType: soilType,
      plants: {
        carrot: plantCarrot,
        corn: plantCorn,
        melon: plantMelon
      },
      activePlant: null,
      plantedCropId: null,
      ring: ring,
      bar: progressBar,
      barFill: barFill,
      barFillMat: barFillMat,
      plantedAt: 0,
      hover: 0,
      isWatered: false,
      wateredAt: 0
    };
    islandGroup.add(g);
    plots.push(g);
  }

  // Create plot grid
  var ox = CFG.PLOT_OFFSET_X, oz = CFG.PLOT_OFFSET_Z;
  for (var row = 0; row < CFG.PLOT_ROWS; row++) {
    for (var col = 0; col < CFG.PLOT_COLS; col++) {
      makePlot(ox + col * CFG.PLOT_GAP, oz + row * CFG.PLOT_GAP - 0.56, row, col);
    }
  }

  /* ========== Particles ========== */
  var particles = [];
  var pGeo = new THREE.SphereGeometry(0.06, 6, 6);

  function burst(pos, colors, count, opts) {
    opts = opts || {};
    var spread = opts.spread != null ? opts.spread : 2.2;
    var up = opts.up != null ? opts.up : 2.2;
    var grav = opts.grav != null ? opts.grav : 4.5;
    var life = opts.life != null ? opts.life : 0.9;
    for (var i = 0; i < count; i++) {
      var c = Array.isArray(colors) ? colors[(Math.random() * colors.length) | 0] : colors;
      var m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({
        color: c, transparent: true
      }));
      m.position.copy(pos);
      m.scale.setScalar(0.4 + Math.random() * 0.8);
      scene.add(m);
      particles.push({
        m: m,
        v: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          up * (0.6 + Math.random() * 0.6),
          (Math.random() - 0.5) * spread
        ),
        life: life * (0.7 + Math.random() * 0.6),
        max: life,
        grav: grav,
        grow: opts.grow || 0
      });
    }
  }

  var smokeTimer = 0;
  function smoke() {
    var m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: '#efe6da', transparent: true, opacity: 0.6 }));
    m.position.copy(chimneyTop);
    m.position.x += (Math.random() - 0.5) * 0.1;
    m.position.z += (Math.random() - 0.5) * 0.1;
    m.scale.setScalar(1.1);
    scene.add(m);
    particles.push({
      m: m,
      v: new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.7, (Math.random() - 0.5) * 0.3),
      life: 2.4, max: 2.4, grav: -0.2, grow: 1.6
    });
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.m);
        if (p.m.material && p.m.material.dispose) p.m.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.v.y -= p.grav * dt;
      p.m.position.addScaledVector(p.v, dt);
      var t = p.life / p.max;
      p.m.material.opacity = Math.min(1, t * 1.4);
      if (p.grow) p.m.scale.addScalar(p.grow * dt);
    }
  }

  /* ========== Interaction ========== */
  function soilMeshes() {
    return plots.map(function (p) { return p.userData.soil; });
  }
  var hovered = null;

  function setPointer(e) {
    var touch = e.touches ? e.touches[0] : e;
    pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('pointermove', function (e) {
    if (!isPlaying) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    var hit = raycaster.intersectObjects(soilMeshes())[0];
    var g = hit ? hit.object.userData.group : null;
    if (g !== hovered) {
      hovered = g;
      renderer.domElement.style.cursor = g ? 'pointer' : 'grab';
      
      var legendPEl = document.getElementById('legend-p');
      if (legendPEl) {
        if (g) {
          var d = g.userData;
          if (d.soilType === 'sandy') {
            legendPEl.textContent = "🏜️ แปลงดินทราย: ปลูกแตงโม 🍉 โตเร็ว 30% / พืชอื่นโตช้า";
            legendPEl.style.color = "#bfa58a";
          } else {
            legendPEl.textContent = "🟫 แปลงดินร่วน: ปลูกแครอท 🥕 ข้าวโพด 🌽 โตเร็ว 30% / แตงโมโตช้า";
            legendPEl.style.color = "#eab308";
          }
        } else {
          legendPEl.textContent = "คลิกแปลงดินปลูกผักตามที่เลือก";
          legendPEl.style.color = "";
        }
      }
    }
  });

  var downPos = null;
  renderer.domElement.addEventListener('pointerdown', function (e) {
    if (!isPlaying) return;
    downPos = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', function (e) {
    if (!isPlaying || !downPos) return;
    var moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;
    if (moved > 6) return; // drag, not click
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);

    var animalMeshes = [];
    chickensList.forEach(function (c) {
      c.mesh.traverse(function (o) { if (o.isMesh) { o.userData.animal = c; animalMeshes.push(o); } });
    });
    cowsList.forEach(function (c) {
      c.mesh.traverse(function (o) { if (o.isMesh) { o.userData.animal = c; animalMeshes.push(o); } });
    });
    
    var animHit = raycaster.intersectObjects(animalMeshes)[0];
    if (animHit) {
      handleAnimalClick(animHit.object.userData.animal);
      return;
    }

    var hit = raycaster.intersectObjects(soilMeshes())[0];
    if (hit) handlePlot(hit.object.userData.group);
  });

  function handlePlot(g) {
    var d = g.userData;
    
    // Check if there is an active worm on this plot!
    if (d.wormObj) {
      triggerWormQuiz(g);
      return;
    }

    if (d.state === 'empty') {
      var cropConfig = CFG.CROP_TYPES[selectedCropId];
      if (money < cropConfig.cost) {
        toast(DATA.MSG.notEnough.replace('10', cropConfig.cost), 'warn');
        return;
      }
      money -= cropConfig.cost;
      addLedgerEntry('เมล็ดพันธุ์' + cropConfig.name, 'expense', cropConfig.cost);

      d.state = 'growing';
      d.plantedCropId = selectedCropId;
      d.plantedAt = clock.elapsedTime;
      
      // Make the selected crop plant visible
      d.activePlant = d.plants[selectedCropId];
      d.activePlant.visible = true;
      d.activePlant.scale.setScalar(0.001);
      d.bar.visible = true;
      
      var wp = new THREE.Vector3();
      g.getWorldPosition(wp);
      wp.y += 0.2;
      burst(wp, DATA.PLANT_BURST, 10, { up: 1.4, spread: 1.6, life: 0.6 });
      toast(DATA.MSG.planted, 'good');
      if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
        try { KAMPAI.sound.correct(); } catch (e) { /* */ }
      }
    } else if (d.state === 'growing') {
      if (weatherState === 'drought' && !d.isWatered) {
        d.isWatered = true;
        d.wateredAt = clock.elapsedTime;
        toast("💧 รดน้ำพืชสำเร็จ! ดินชุ่มชื้นพืชโตต่อได้แล้ว", "good");
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
        return;
      }
      
      // Check if user has instant fertilizer
      if (upgrades.fertilizer > 0) {
        var useFert = confirm("ต้องการใช้ ปุ๋ยชีวภาพเร่งโต เพื่อให้พืชโตทันทีหรือไม่? (เหลือ " + upgrades.fertilizer + " ถุง)");
        if (useFert) {
          upgrades.fertilizer--;
          d.plantedAt = clock.elapsedTime - 999; // force mature
          var fertCountEl = document.getElementById('fertilizerCount');
          if (fertCountEl) fertCountEl.textContent = upgrades.fertilizer;
          toast("ใช้ปุ๋ยเร่งโตสำเร็จ! พืชโตเต็มที่แล้ว 🌱✨", "good");
          return;
        }
      }
      
      var cropConfig = CFG.CROP_TYPES[d.plantedCropId];
      var totalGrowTime = cropConfig.growTime * (upgrades.sprinkler ? 0.75 : 1.0);
      if (d.soilType === 'sandy') {
        if (d.plantedCropId === 'melon') totalGrowTime *= 0.7;
        else totalGrowTime *= 1.3;
      } else if (d.soilType === 'loamy') {
        if (d.plantedCropId !== 'melon') totalGrowTime *= 0.7;
        else totalGrowTime *= 1.3;
      }
      var left = Math.max(0, totalGrowTime - (clock.elapsedTime - d.plantedAt));
      toast(DATA.MSG.growing.replace('{n}', left.toFixed(0)), 'warn');
    } else if (d.state === 'ready') {
      var cropId = d.plantedCropId;
      var cropConfig = CFG.CROP_TYPES[cropId];
      crops[cropId] += 1;
      
      d.state = 'empty';
      d.activePlant.visible = false;
      d.activePlant.scale.setScalar(0.001);
      d.activePlant = null;
      d.plantedCropId = null;
      
      d.bar.visible = false;
      d.ring.material.opacity = 0;
      d.soilMat.emissive.setHex(0x000000);
      refreshHud();
      
      var wp2 = new THREE.Vector3();
      g.getWorldPosition(wp2);
      wp2.y += 0.6;
      burst(wp2, DATA.HARVEST_BURST, 18, { up: 3, spread: 2.6, life: 1.0 });
      toast(DATA.MSG.harvested.replace('{emoji}', cropConfig.emoji).replace('{name}', cropConfig.name), 'good');
      if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
        try { KAMPAI.sound.correct(); } catch (e) { /* */ }
      }
    }
  }

  /* ========== Quiz Generator & Helpers ========== */
  var activeRng = null;
  var quizIntervalId = null;

  function getRandom() {
    if (isVersus && typeof activeRng === 'function') {
      return activeRng();
    }
    return Math.random();
  }

  function generateQuizQuestion(difficulty) {
    var templates = DATA.MSG.mathTemplates[difficulty];
    var template = templates[Math.floor(getRandom() * templates.length)];
    
    var a = 0, b = 0, c = 0;
    if (difficulty === 'easy') {
      a = Math.floor(getRandom() * 8) + 2;   // 2 to 9
      b = Math.floor(getRandom() * 8) + 2;   // 2 to 9
    } else if (difficulty === 'medium') {
      a = Math.floor(getRandom() * 8) + 3;   // 3 to 10
      b = Math.floor(getRandom() * 8) + 5;   // 5 to 12
    } else if (difficulty === 'hard') {
      a = Math.floor(getRandom() * 5) + 2;   // 2 to 6
      b = Math.floor(getRandom() * 6) + 10;  // 10 to 15
      c = Math.floor(getRandom() * 20) + 10; // 10 to 29
    }
    
    var qText = template.q.replace('{a}', a).replace('{b}', b).replace('{c}', c);
    var evalStr = template.a.replace('{a}', a).replace('{b}', b).replace('{c}', c);
    var answer = 0;
    try {
      answer = eval(evalStr);
    } catch (e) {
      answer = a * b; // fallback
    }
    
    return {
      question: qText,
      answer: answer,
      difficulty: difficulty
    };
  }

  function getQuizChoices(correctAnswer, difficulty) {
    var choices = [correctAnswer];
    var attempts = 0;
    while (choices.length < 4 && attempts < 100) {
      attempts++;
      var offset = 0;
      if (difficulty === 'easy') {
        offset = (Math.floor(getRandom() * 7) + 1) * (getRandom() < 0.5 ? -1 : 1);
      } else if (difficulty === 'medium') {
        offset = (Math.floor(getRandom() * 10) + 1) * (getRandom() < 0.5 ? -1 : 1);
      } else {
        offset = (Math.floor(getRandom() * 20) + 2) * (getRandom() < 0.5 ? -1 : 1);
      }
      var wrongAns = correctAnswer + offset;
      if (wrongAns > 0 && choices.indexOf(wrongAns) === -1) {
        choices.push(wrongAns);
      }
    }
    choices.sort(function() { return getRandom() - 0.5; });
    return choices;
  }

  /* ========== Worm Spawning & Quiz ========== */
  var wormSpawnTimer = 25.0;

  function spawnWorm() {
    var growingPlots = plots.filter(function (g) {
      return g.userData.state === 'growing' && !g.userData.wormObj;
    });
    
    if (growingPlots.length === 0) {
      wormSpawnTimer = 5.0;
      return;
    }
    
    var g = growingPlots[Math.floor(getRandom() * growingPlots.length)];
    var d = g.userData;
    
    // Create cute pink worm
    var worm = new THREE.Group();
    var wormMat = new THREE.MeshStandardMaterial({ color: '#ff85a2', roughness: 0.6 });
    for (var i = 0; i < 3; i++) {
      var segment = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), wormMat);
      segment.position.x = (i - 1) * 0.08;
      segment.position.y = Math.sin(i * 1.5) * 0.04;
      segment.castShadow = true;
      worm.add(segment);
    }
    worm.position.set(0, 0.12, 0);
    g.add(worm);
    d.wormObj = worm;
    
    d.soilMat.emissive.setHex(0xff3333);
    
    toast(DATA.MSG.wormAlert, 'warn');
    if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
      try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
    }
  }

  function triggerWormQuiz(g) {
    var d = g.userData;
    var quizOverlay = document.getElementById('quizModal');
    var quizQuestionEl = document.getElementById('quizQuestion');
    var quizChoicesEl = document.getElementById('quizChoices');
    var quizTimerEl = document.getElementById('quizTimer');
    if (!quizOverlay || !quizQuestionEl || !quizChoicesEl) return;
    
    var a = 0, b = 0, answer = 0;
    var qText = "";
    if (getRandom() < 0.5) {
      b = Math.floor(getRandom() * 7) + 3;  // 3 to 9
      answer = Math.floor(getRandom() * 8) + 2; // 2 to 9
      a = b * answer;
      qText = "กำจัดหนอนบุกแปลงผัก: " + a + " ÷ " + b + " = ?";
    } else {
      a = Math.floor(getRandom() * 50) + 40; // 40 to 89
      b = Math.floor(getRandom() * 30) + 10; // 10 to 39
      answer = a - b;
      qText = "กำจัดหนอนบุกแปลงผัก: " + a + " − " + b + " = ?";
    }
    
    quizQuestionEl.textContent = qText;
    quizChoicesEl.innerHTML = '';
    
    var quizTimeLeft = 10;
    if (quizTimerEl) quizTimerEl.textContent = '⏱️ กำจัดหนอน: ' + quizTimeLeft + ' วินาที';
    
    if (quizIntervalId) clearInterval(quizIntervalId);
    quizIntervalId = setInterval(function () {
      quizTimeLeft--;
      if (quizTimerEl) quizTimerEl.textContent = '⏱️ กำจัดหนอน: ' + quizTimeLeft + ' วินาที';
      if (quizTimeLeft <= 0) {
        handleWormAnswer(false);
      }
    }, 1000);
    
    function handleWormAnswer(isCorrect) {
      if (quizIntervalId) {
        clearInterval(quizIntervalId);
        quizIntervalId = null;
      }
      quizOverlay.style.display = 'none';
      
      if (isCorrect) {
        if (d.wormObj) {
          g.remove(d.wormObj);
          d.wormObj = null;
        }
        d.soilMat.emissive.setHex(0x000000);
        
        var reward = 20;
        money += reward;
        totalEarned += reward;
        
        toast(DATA.MSG.wormCleared.replace('{n}', reward), 'good');
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
          try { KAMPAI.sound.correct(); } catch (e) { /* */ }
        }
        addLedgerEntry('กำจัดศัตรูพืชสำเร็จ', 'revenue', reward);
      } else {
        if (d.wormObj) {
          g.remove(d.wormObj);
          d.wormObj = null;
        }
        d.soilMat.emissive.setHex(0x000000);
        
        var cropName = CFG.CROP_TYPES[d.plantedCropId].name;
        d.state = 'empty';
        if (d.activePlant) {
          d.activePlant.visible = false;
          d.activePlant.scale.setScalar(0.001);
          d.activePlant = null;
        }
        d.plantedCropId = null;
        d.bar.visible = false;
        
        toast("หนอนกัดกินต้น" + cropName + "จนเสียหาย! 😢", 'warn');
        if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
          try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
        }
      }
      
      refreshHud();
    }
    
    var choices = getQuizChoices(answer, 'easy');
    choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = choice;
      btn.addEventListener('click', function () {
        handleWormAnswer(choice === answer);
      });
      quizChoicesEl.appendChild(btn);
    });
    
    quizOverlay.style.display = 'flex';
  }

  /* ========== Sell ========== */
  if (sellBtn) {
    sellBtn.addEventListener('click', function () {
      var totalCrops = crops.carrot + crops.corn + crops.melon + crops.egg + crops.milk;
      if (!isPlaying || totalCrops <= 0) {
        toast(DATA.MSG.noSell, 'warn');
        return;
      }

      var totalValue = crops.carrot * cropPrices.carrot +
                       crops.corn * cropPrices.corn +
                       crops.melon * cropPrices.melon +
                       crops.egg * cropPrices.egg +
                       crops.milk * cropPrices.milk;

      var difficulty = 'easy';
      if (crops.melon > 0 || crops.milk > 0) difficulty = 'hard';
      else if (crops.corn > 0 || crops.egg > 0) difficulty = 'medium';

      var quizOverlay = document.getElementById('quizModal');
      var quizQuestionEl = document.getElementById('quizQuestion');
      var quizChoicesEl = document.getElementById('quizChoices');
      var quizTimerEl = document.getElementById('quizTimer');
      if (!quizOverlay || !quizQuestionEl || !quizChoicesEl) return;

      var quiz = generateQuizQuestion(difficulty);
      quizQuestionEl.textContent = quiz.question;
      quizChoicesEl.innerHTML = '';

      var quizTimeLeft = 15;
      if (quizTimerEl) quizTimerEl.textContent = '⏱️ เวลาคิดเลข: ' + quizTimeLeft + ' วินาที';

      if (quizIntervalId) clearInterval(quizIntervalId);
      quizIntervalId = setInterval(function () {
        quizTimeLeft--;
        if (quizTimerEl) quizTimerEl.textContent = '⏱️ เวลาคิดเลข: ' + quizTimeLeft + ' วินาที';
        if (quizTimeLeft <= 0) {
          handleAnswer(false);
        }
      }, 1000);

      function handleAnswer(isCorrect, choiceText) {
        if (quizIntervalId) {
          clearInterval(quizIntervalId);
          quizIntervalId = null;
        }
        quizOverlay.style.display = 'none';

        var finalPayout = 0;
        var bonus = 0;
        var soldCropList = [];
        if (crops.carrot > 0) soldCropList.push(crops.carrot + ' แครอท');
        if (crops.corn > 0) soldCropList.push(crops.corn + ' ข้าวโพด');
        if (crops.melon > 0) soldCropList.push(crops.melon + ' แตงโม');
        if (crops.egg > 0) soldCropList.push(crops.egg + ' ไข่ไก่');
        if (crops.milk > 0) soldCropList.push(crops.milk + ' นมสด');
        var soldDesc = 'ขาย ' + soldCropList.join(', ');

        if (isCorrect) {
          bonus = Math.round(totalValue * 0.1);
          finalPayout = totalValue + bonus;
          money += finalPayout;
          totalEarned += finalPayout;
          
          toast(DATA.MSG.quizCorrect.replace('{n}', totalValue).replace('{bonus}', bonus), 'good');
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.correct) {
            try { KAMPAI.sound.correct(); } catch (e) { /* */ }
          }
          addLedgerEntry(soldDesc, 'revenue', finalPayout);
        } else {
          finalPayout = Math.round(totalValue * 0.7);
          money += finalPayout;
          totalEarned += finalPayout;

          toast(DATA.MSG.quizIncorrect.replace('{n}', finalPayout), 'warn');
          if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.wrong) {
            try { KAMPAI.sound.wrong(); } catch (e) { /* */ }
          }
          addLedgerEntry(soldDesc + ' (โดนกดราคา 30%)', 'revenue', finalPayout);
        }

        crops = { carrot: 0, corn: 0, melon: 0, egg: 0, milk: 0 };
        refreshHud();

        if (vs && isVersus) {
          vs.report(totalEarned, { correct: isCorrect });
        }
      }

      var choices = getQuizChoices(quiz.answer, difficulty);
      choices.forEach(function (choice) {
        var btn = document.createElement('button');
        btn.className = 'quiz-choice-btn';
        btn.textContent = choice;
        btn.addEventListener('click', function () {
          handleAnswer(choice === quiz.answer, choice);
        });
        quizChoicesEl.appendChild(btn);
      });

      quizOverlay.style.display = 'flex';
    });
  }

  /* ========== Versus Button ========== */
  if (versusBtn && vs) {
    versusBtn.addEventListener('click', function () {
      vs.openMenu();
    });
  }

  /* ========== Start / End Game ========== */
  function startGame(versusMode, rng) {
    isPlaying = true;
    isVersus = !!versusMode;
    activeRng = rng;
    money = CFG.START_MONEY;
    crops = { carrot: 0, corn: 0, melon: 0, egg: 0, milk: 0 };
    totalEarned = 0;
    shownMoney = money;
    wormSpawnTimer = 25.0;

    bankBalance = 0;
    shownBankBalance = 0;
    cropPrices = {
      carrot: CFG.CROP_TYPES.carrot.sellPrice,
      corn: CFG.CROP_TYPES.corn.sellPrice,
      melon: CFG.CROP_TYPES.melon.sellPrice,
      egg: 25,
      milk: 65
    };
    marketTimer = 30.0;
    bankInterestTimer = 30.0;
    weatherState = 'sunny';
    weatherTimer = 45.0;
    
    // Apply sunny weather visually
    scene.fog.color.setHex(0xffd9a8);
    if (sun) sun.intensity = 2.4;
    if (rainPoints) rainPoints.visible = false;
    
    upgrades = {
      sprinkler: false,
      scarecrow: false,
      fertilizer: 0,
      coop: false,
      barn: false,
      chickenFeed: 0,
      cowFeed: 0
    };
    
    if (scarecrowMesh) {
      islandGroup.remove(scarecrowMesh);
      scarecrowMesh = null;
    }
    if (coopMesh) {
      islandGroup.remove(coopMesh);
      coopMesh = null;
    }
    if (barnMesh) {
      islandGroup.remove(barnMesh);
      barnMesh = null;
    }

    chickensList.forEach(function (c) {
      islandGroup.remove(c.mesh);
    });
    cowsList.forEach(function (c) {
      islandGroup.remove(c.mesh);
    });
    chickensList = [];
    cowsList = [];

    plots.forEach(function (g) {
      var d = g.userData;
      d.state = 'empty';
      for (var key in d.plants) {
        d.plants[key].visible = false;
        d.plants[key].scale.setScalar(0.001);
      }
      d.activePlant = null;
      d.plantedCropId = null;
      
      if (d.wormObj) {
        g.remove(d.wormObj);
        d.wormObj = null;
      }
      
      d.isWatered = false;
      d.wateredAt = 0;
      d.bar.visible = false;
      d.ring.material.opacity = 0;
      d.soilMat.emissive.setHex(0x000000);
      d.hover = 0;
      d.plantedAt = 0;
    });

    ledgerTransactions = [];
    updateLedgerUI();

    refreshHud();

    if (blockerEl) blockerEl.style.display = 'none';
    if (hudEl) hudEl.style.display = '';
    
    var cropSelectorEl = document.getElementById('cropSelector');
    if (cropSelectorEl) cropSelectorEl.style.display = 'flex';
    
    cropOptions.forEach(function (o) { o.classList.remove('active'); });
    var carrotOpt = document.querySelector('.crop-option[data-crop="carrot"]');
    if (carrotOpt) {
      carrotOpt.classList.add('active');
      selectedCropId = 'carrot';
    }

    if (hintEl) hintEl.style.display = '';
    if (gameOverEl) gameOverEl.classList.remove('show');

    if (isVersus) {
      versusTimeLeft = CFG.VERSUS_DURATION;
      if (timerHudEl) timerHudEl.style.display = '';
      if (timerValueEl) timerValueEl.textContent = versusTimeLeft;
      if (versusTimerId) clearInterval(versusTimerId);
      versusTimerId = setInterval(function () {
        versusTimeLeft--;
        if (timerValueEl) {
          timerValueEl.textContent = Math.max(0, versusTimeLeft);
          if (versusTimeLeft <= 10) timerValueEl.classList.add('urgent');
          else timerValueEl.classList.remove('urgent');
        }
        if (versusTimeLeft <= 0) {
          clearInterval(versusTimerId);
          versusTimerId = null;
        }
      }, 1000);
    } else {
      if (timerHudEl) timerHudEl.style.display = 'none';
    }

    if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.unlock) {
      try { KAMPAI.sound.unlock(); } catch (e) { /* */ }
    }
    if (window.KAMPAI && window.KAMPAI.sound && window.KAMPAI.sound.bgmStart) {
      try { window.KAMPAI.sound.bgmStart(); } catch (e) { /* */ }
    }
  }

  function endGame() {
    isPlaying = false;

    if (versusTimerId) { clearInterval(versusTimerId); versusTimerId = null; }
    if (timerHudEl) timerHudEl.style.display = 'none';

    if (quizIntervalId) { clearInterval(quizIntervalId); quizIntervalId = null; }
    var quizOverlay = document.getElementById('quizModal');
    if (quizOverlay) quizOverlay.style.display = 'none';
    
    var ledgerModal = document.getElementById('ledgerModal');
    if (ledgerModal) ledgerModal.style.display = 'none';
    
    var shopModal = document.getElementById('shopModal');
    if (shopModal) shopModal.style.display = 'none';

    var marketModal = document.getElementById('marketModal');
    if (marketModal) marketModal.style.display = 'none';

    var bankModal = document.getElementById('bankModal');
    if (bankModal) bankModal.style.display = 'none';

    var cropSelectorEl = document.getElementById('cropSelector');
    if (cropSelectorEl) cropSelectorEl.style.display = 'none';

    var totalCrops = crops.carrot + crops.corn + crops.melon + crops.egg + crops.milk;
    if (totalCrops > 0) {
      var income = crops.carrot * cropPrices.carrot +
                   crops.corn * cropPrices.corn +
                   crops.melon * cropPrices.melon +
                   crops.egg * cropPrices.egg +
                   crops.milk * cropPrices.milk;
      money += income;
      totalEarned += income;
      
      var soldCropList = [];
      if (crops.carrot > 0) soldCropList.push(crops.carrot + ' แครอท');
      if (crops.corn > 0) soldCropList.push(crops.corn + ' ข้าวโพด');
      if (crops.melon > 0) soldCropList.push(crops.melon + ' แตงโม');
      if (crops.egg > 0) soldCropList.push(crops.egg + ' ไข่ไก่');
      if (crops.milk > 0) soldCropList.push(crops.milk + ' นมสด');
      var soldDesc = 'ขายออโต้ตอนหมดเวลา: ' + soldCropList.join(', ');
      
      addLedgerEntry(soldDesc, 'revenue', income);
      crops = { carrot: 0, corn: 0, melon: 0, egg: 0, milk: 0 };
      refreshHud();
    }

    plots.forEach(function (g) {
      var d = g.userData;
      if (d.wormObj) {
        g.remove(d.wormObj);
        d.wormObj = null;
      }
      d.isWatered = false;
      d.wateredAt = 0;
      d.soilMat.emissive.setHex(0x000000);
    });

    if (finalScoreEl) finalScoreEl.textContent = totalEarned;
    if (gameOverEl) gameOverEl.classList.add('show');

    if (vs && isVersus) {
      vs.finish(totalEarned, { correct: true });
    } else {
      if (window.KAMPAI && KAMPAI.submitScore) {
        KAMPAI.submitScore(totalEarned, {
          mode: 'normal',
          totalEarned: totalEarned,
          finalMoney: money
        });
      }
    }

    if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.bgmStop) {
      try { KAMPAI.sound.bgmStop(); } catch (e) { /* */ }
    }
  }

  /* ========== Start Button ========== */
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      startGame(false);
    });
  }

  /* ========== Play Again ========== */
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function () {
      if (gameOverEl) gameOverEl.classList.remove('show');
      // Show blocker again
      if (blockerEl) blockerEl.style.display = 'flex';
      if (hudEl) hudEl.style.display = 'none';
    });
  }

  /* ========== Resize ========== */
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ========== Main Loop ========== */
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var tmp = new THREE.Vector3();
  var startColor = new THREE.Color(DATA.CROP_START_COLOR);
  var endColor = new THREE.Color(DATA.CROP_END_COLOR);

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    // Water waves
    if (!REDUCED) {
      var pos = waterGeo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var bx = waterBase[i * 3], by = waterBase[i * 3 + 1];
        pos.setZ(i, Math.sin(bx * 0.35 + t * 1.1) * 0.22 + Math.cos(by * 0.4 + t * 0.9) * 0.2);
      }
      pos.needsUpdate = true;
      waterGeo.computeVertexNormals();
    }

    // Tree sway
    swayers.forEach(function (s) { s.obj.rotation.z = Math.sin(t * 1.2 + s.phase) * s.amp; });

    // Chimney smoke
    smokeTimer -= dt;
    if (!REDUCED && smokeTimer <= 0) { smoke(); smokeTimer = CFG.SMOKE_INTERVAL; }

    // Worm spawning, Market, and Bank Interest timers
    if (isPlaying) {
      // Worm spawning
      wormSpawnTimer -= dt;
      if (wormSpawnTimer <= 0) {
        var intervalMin = upgrades.scarecrow ? 60 : 30;
        var intervalMax = upgrades.scarecrow ? 90 : 45;
        wormSpawnTimer = intervalMin + getRandom() * (intervalMax - intervalMin);
        spawnWorm();
      }

      // Market Prices
      marketTimer -= dt;
      if (marketTimer <= 0) {
        marketTimer = 30.0;
        updateMarketPrices();
      }

      // Bank Interest
      bankInterestTimer -= dt;
      if (bankInterestTimer <= 0) {
        bankInterestTimer = 30.0;
        if (bankBalance > 0) {
          var interest = Math.max(1, Math.round(bankBalance * 0.05));
          bankBalance += interest;
          toast("🏦 ได้รับดอกเบี้ยเงินฝากสะสม +" + interest + " เหรียญ 🪙", "good");
          addLedgerEntry("ดอกเบี้ยสะสมร้อยละ 5", "revenue", interest);
          
          var bankBalanceValEl = document.getElementById('bankBalanceVal');
          if (bankBalanceValEl) bankBalanceValEl.textContent = bankBalance;
        }
      }

      // Chickens and Cows update loop
      chickensList.concat(cowsList).forEach(function (animal) {
        animal.wanderTimer -= dt;
        if (animal.wanderTimer <= 0) {
          animal.wanderTimer = 3.0 + getRandom() * 4.0;
          var wanderDist = animal.type === 'chicken' ? 0.6 : 0.8;
          animal.targetPos.set(
            animal.basePos.x + (getRandom() - 0.5) * wanderDist,
            GROUND_Y,
            animal.basePos.z + (getRandom() - 0.5) * wanderDist
          );
        }
        
        var dir = new THREE.Vector3().subVectors(animal.targetPos, animal.mesh.position);
        var dist = dir.length();
        if (dist > 0.05) {
          dir.normalize();
          var speed = animal.type === 'chicken' ? 0.25 : 0.15;
          animal.mesh.position.addScaledVector(dir, speed * dt);
          
          var angle = Math.atan2(dir.x, dir.z);
          animal.mesh.rotation.y = angle;
          
          var bounceSpeed = animal.type === 'chicken' ? 12 : 8;
          animal.mesh.position.y = GROUND_Y + Math.abs(Math.sin(t * bounceSpeed)) * 0.04;
        } else {
          animal.mesh.position.y = GROUND_Y;
        }
        
        if (animal.balloon) animal.balloon.quaternion.copy(camera.quaternion);

        updateAnimalState(animal, dt);
      });
    }

    // Plots
    plots.forEach(function (g) {
      var d = g.userData;
      var target = (isPlaying && hovered === g) ? 1 : 0;
      d.hover += (target - d.hover) * Math.min(1, dt * 12);
      g.position.y = d.baseY + d.hover * 0.14;
      if (d.state === 'empty') d.soilMat.emissive.setRGB(d.hover * 0.12, d.hover * 0.1, 0);

      // Rotate worm if any
      if (d.wormObj) {
        d.wormObj.rotation.y += dt * 2;
        d.wormObj.position.y = 0.12 + Math.sin(t * 5) * 0.03;
      }

      // Freeze growth if worm exists on this plot
      if (d.state === 'growing' && d.wormObj) {
        d.plantedAt += dt;
      }

      // Sสภาพอากาศแปรปรวน (Weather System) modifications
      if (d.state === 'growing') {
        if (weatherState === 'drought') {
          if (d.isWatered) {
            d.soilMat.emissive.setRGB(0, 0.05, 0.12);
            if (t - d.wateredAt > 10.0) {
              d.isWatered = false;
              toast("🍂 ดินแห้งแล้ว! แปลงพืชต้องการน้ำอีกครั้ง", "warn");
            }
          } else {
            d.plantedAt += dt;
            var pulseRed = (Math.sin(t * 8) + 1) * 0.5;
            d.soilMat.emissive.setRGB(0.18 + pulseRed * 0.08, 0, 0);
          }
        } else if (weatherState === 'rainy') {
          d.plantedAt -= dt * 0.5;
          d.soilMat.emissive.setRGB(0, 0.04, 0.08);
        } else {
          d.soilMat.emissive.setHex(0x000000);
        }

        var cropConfig = CFG.CROP_TYPES[d.plantedCropId];
        var totalGrowTime = cropConfig.growTime * (upgrades.sprinkler ? 0.75 : 1.0);
        
        if (d.soilType === 'sandy') {
          if (d.plantedCropId === 'melon') totalGrowTime *= 0.7;
          else totalGrowTime *= 1.3;
        } else if (d.soilType === 'loamy') {
          if (d.plantedCropId !== 'melon') totalGrowTime *= 0.7;
          else totalGrowTime *= 1.3;
        }

        var prog = Math.min(1, (t - d.plantedAt) / totalGrowTime);
        var s = 0.15 + easeOut(prog) * 0.95;
        
        if (d.activePlant) {
          d.activePlant.scale.setScalar(s);
          d.activePlant.position.y = 0.12 + Math.sin(t * 2 + g.position.x) * 0.015;
        }

        // Progress bar
        d.barFill.scale.x = prog;
        d.barFill.position.x = -0.33 * (1 - prog);
        d.barFillMat.color.setHSL(0.1 + prog * 0.18, 0.75, 0.55);
        if (prog >= 1) {
          d.state = 'ready';
          d.bar.visible = false;
          g.getWorldPosition(tmp);
          tmp.y += 0.7;
          burst(tmp, DATA.READY_BURST, 8, { up: 2, spread: 1.4, life: 0.8 });
        }
      }

      if (d.state === 'ready') {
        var pulse = (Math.sin(t * 4) + 1) * 0.5;
        d.ring.material.opacity = 0.35 + pulse * 0.4;
        d.ring.scale.setScalar(1 + pulse * 0.08);
        if (d.activePlant) {
          d.activePlant.position.y = 0.12 + Math.sin(t * 3) * 0.03;
          d.activePlant.rotation.y = Math.sin(t * 1.5) * 0.1;
        }
        d.soilMat.emissive.setRGB(0.15, 0.12, 0);
      }

      // Billboard progress bar
      if (d.bar.visible) d.bar.quaternion.copy(camera.quaternion);
    });

    updateParticles(dt);

    // Rain droplets animation
    if (rainPoints && weatherState === 'rainy') {
      var positions = rainGeo.attributes.position.array;
      for (var i = 0; i < positions.length; i += 3) {
        positions[i+1] -= dt * 6.0; // fall speed
        if (positions[i+1] < GROUND_Y) {
          positions[i+1] = GROUND_Y + 6.0; // loop back up
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    // Money and bank count-up animation
    shownMoney += (money - shownMoney) * Math.min(1, dt * 6);
    shownBankBalance += (bankBalance - shownBankBalance) * Math.min(1, dt * 6);
    refreshHud();

    controls.update();
    renderer.render(scene, camera);
  }

  refreshHud();
  animate();

  // Hide loader
  setTimeout(function () {
    if (loadingEl) loadingEl.classList.add('hide');
  }, 500);

})();
