// test-challenger-math-games.mjs
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

let passCount = 0;
let failCount = 0;

function ok(cond, msg) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

class MockScheduler {
  constructor() {
    this.timerIdSeq = 1;
    this.intervals = new Map();
    this.timeouts = new Map();
    this.rafs = new Map();
    this.rafSeq = 1;
  }

  setInterval(cb, ms) {
    const id = this.timerIdSeq++;
    this.intervals.set(id, { cb, ms, nextRun: ms });
    return id;
  }

  clearInterval(id) {
    this.intervals.delete(id);
  }

  setTimeout(cb, ms) {
    const id = this.timerIdSeq++;
    this.timeouts.set(id, { cb, ms });
    return id;
  }

  clearTimeout(id) {
    this.timeouts.delete(id);
  }

  requestAnimationFrame(cb) {
    const id = this.rafSeq++;
    this.rafs.set(id, cb);
    return id;
  }

  cancelAnimationFrame(id) {
    this.rafs.delete(id);
  }

  tickTimers(ms) {
    // Process timeouts first
    for (const [id, t] of Array.from(this.timeouts.entries())) {
      t.ms -= ms;
      if (t.ms <= 0) {
        this.timeouts.delete(id);
        t.cb();
      }
    }
    // Process intervals
    for (const [id, t] of Array.from(this.intervals.entries())) {
      let remainingMs = ms;
      // Handle potential multiple triggers within the tick time
      while (remainingMs >= t.nextRun) {
        remainingMs -= t.nextRun;
        t.nextRun = t.ms;
        // Make sure it wasn't cleared in a previous iteration/callback
        if (this.intervals.has(id)) {
          t.cb();
        }
      }
      if (this.intervals.has(id)) {
        t.nextRun -= remainingMs;
      }
    }
  }

  tickRAF() {
    const currentRafs = Array.from(this.rafs.entries());
    this.rafs.clear();
    for (const [id, cb] of currentRafs) {
      cb(Date.now());
    }
  }

  hasActiveTimers() {
    return this.intervals.size > 0 || this.timeouts.size > 0;
  }

  hasActiveRAFs() {
    return this.rafs.size > 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1: catch-numbers
// ─────────────────────────────────────────────────────────────────────────────
async function runCatchNumbersTests() {
  console.log('\n--- Running catch-numbers tests ---');
  
  const htmlPath = resolve(REPO_ROOT, 'public/games/math/catch-numbers/index.html');
  const configPath = resolve(REPO_ROOT, 'public/games/math/catch-numbers/config.js');
  const dataPath = resolve(REPO_ROOT, 'public/games/math/catch-numbers/data.js');
  const gamePath = resolve(REPO_ROOT, 'public/games/math/catch-numbers/game.js');

  const html = readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://verify.local/?embed=1',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  
  const { window: w } = dom;
  const scheduler = new MockScheduler();

  // Setup DOM dimensions
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'offsetWidth', { value: 800 });
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'offsetHeight', { value: 600 });
  w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    left: 100, top: 50, width: 800, height: 600, right: 900, bottom: 650
  });

  // Mocks for canvas context
  const mockCtx = {
    clearRect: () => {}, save: () => {}, restore: () => {},
    beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
    moveTo: () => {}, lineTo: () => {}, closePath: () => {},
    fillText: () => {}, drawImage: () => {}
  };
  w.HTMLCanvasElement.prototype.getContext = () => mockCtx;

  // Bind custom scheduler to window
  w.setInterval = (cb, ms) => scheduler.setInterval(cb, ms);
  w.clearInterval = (id) => scheduler.clearInterval(id);
  w.setTimeout = (cb, ms) => scheduler.setTimeout(cb, ms);
  w.clearTimeout = (id) => scheduler.clearTimeout(id);
  w.requestAnimationFrame = (cb) => scheduler.requestAnimationFrame(cb);
  w.cancelAnimationFrame = (id) => scheduler.cancelAnimationFrame(id);

  // Mocks for SDK
  let submittedScores = [];
  w.KAMPAI = {
    isEmbed: true,
    ready: true,
    student: { id: 'std-123', displayName: 'Student Test', photoUrl: '' },
    stats: { personalBest: 500, playsCount: 10 },
    leaderboard: [],
    onReady: (cb) => cb(w.KAMPAI),
    setSlug: () => {},
    submitScore: (score, meta) => {
      submittedScores.push({ score, meta });
    },
    goHome: () => {},
    sound: {
      unlock: () => {},
      correct: () => {},
      wrong: () => {},
      timeUp: () => {},
      gameOver: () => {},
      speak: () => {},
      fxFlash: () => {},
      mountToggles: () => {},
      defaultBgm: () => {},
      bgmStart: () => {},
      bgmStop: () => {}
    }
  };

  let vsPlayCallback = null;
  let vsReportedScores = [];
  let vsFinished = false;
  let vsLeft = false;
  let versusActive = false;

  w.KampaiVersus = {
    create: (opts) => {
      vsPlayCallback = (args) => {
        versusActive = true;
        return opts.onPlay(args);
      };
      return {
        available: true,
        openMenu: () => {},
        report: (score, data) => { vsReportedScores.push({ score, data }); },
        finish: (score, data) => {
          if (!versusActive) return false;
          vsFinished = true;
          return true; // Game shouldn't handle gameover itself
        },
        leave: () => { vsLeft = true; },
        mode: 'local'
      };
    }
  };

  w.KampaiAR = {
    create: (opts) => {
      return {
        start: () => Promise.resolve(true),
        stop: () => {},
        mode: 'tap',
        x: 0.5, y: 0.5
      };
    }
  };

  // Evaluate config and data scripts
  w.eval(readFileSync(configPath, 'utf8'));
  w.eval(readFileSync(dataPath, 'utf8'));

  // Mock Math.random to make spawning predictable
  let mockRandomValues = [];
  let mockRandomIdx = 0;
  w.Math.random = () => {
    if (mockRandomIdx < mockRandomValues.length) {
      return mockRandomValues[mockRandomIdx++];
    }
    return 0.5;
  };

  // Evaluate game script
  w.eval(readFileSync(gamePath, 'utf8'));

  // 1. Verify Game Initialization
  ok(w.document.getElementById('player-chip').innerHTML.includes('Student Test'), 'Player chip rendered correct student name');
  
  // 2. Play standard game
  const startBtn = w.document.getElementById('startBtn');
  startBtn.click(); // Should start game
  await new Promise(r => setTimeout(r, 50));
  
  console.log('DEBUG: scheduler.timeouts.size =', scheduler.timeouts.size);
  console.log('DEBUG: scheduler.intervals.size =', scheduler.intervals.size);
  console.log('DEBUG: scheduler.hasActiveRAFs() =', scheduler.hasActiveRAFs());
  console.log('DEBUG: ST.roundActive =', w.__ST ? w.__ST.roundActive : 'no ST');
  
  // Rule card timer (setTimeout for 2200ms) and spawn interval (setInterval 1500ms) should be registered
  ok(scheduler.timeouts.size === 1, 'Rule card timeout registered');
  ok(scheduler.intervals.size === 2, 'Spawn and round timers registered');
  ok(scheduler.hasActiveRAFs(), 'rAF loop running');

  // Let's force some mock random values to control spawning:
  // First item spawned:
  // Math.floor(random * numbers.length) -> index of DATA.numbers
  // numbers has 52 items. Let's make index 1 (which is 2 - an Even Number).
  // DATA.numbers[1] = 2. Even is check = true for round 1 (Even numbers).
  // Position x: 0.08 + random * 0.84 -> random = 0.5 -> x = 0.5.
  mockRandomValues = [
    1 / 52, // Math.floor(1/52 * 52) = 1 (item 2, even)
    0.5     // x = 0.5
  ];
  mockRandomIdx = 0;

  // Tick the spawn timer (1500ms) to trigger a spawn
  scheduler.tickTimers(1500);
  
  // Frame update
  scheduler.tickRAF();

  // Verify item is spawned. We can inspect the game state indirectly.
  // Wait! In catch-numbers, we can move the basket using mousemove.
  // Basket is initially at x = 0.5.
  // Let's make the item fall down by ticking frames
  // it.y += it.speed. Speed is FALL_SPEED = 0.0014
  // Let's tick RAF many times or adjust speed to make it fall faster.
  // Wait, let's look at CFG.FALL_SPEED. It is 0.0014 per frame.
  // To fall from y = -0.05 to y = 0.88, it takes:
  // (0.88 - (-0.05)) / 0.0014 = 664 frames!
  // Running 664 ticks of RAF in JSDOM:
  for (let i = 0; i < 670; i++) {
    scheduler.tickRAF();
  }

  // After 670 frames, the basket (at 0.5) should catch the item (at 0.5) because it's at the same x and falls down.
  // Since item is 2 (Even), it matches round 1 rule (Even Numbers).
  // So correctCount should be 1, score should be 100.
  // Let's check HUD score and correct count
  ok(w.document.getElementById('hud-score').textContent.includes('100'), 'Score updated to 100 on correct catch');
  ok(w.document.getElementById('hud-lives').textContent.includes('❤️❤️❤️'), 'Lives remain at 3');

  // Let's test catching a wrong item.
  // Math.floor(random * 52) = 2 -> DATA.numbers[2] = 3 (Odd).
  // Round 1 rule: Even. So 3 is WRONG.
  mockRandomValues = [
    2 / 52, // index 2 -> number 3 (wrong)
    0.5     // x = 0.5
  ];
  mockRandomIdx = 0;

  scheduler.tickTimers(1500); // spawn
  for (let i = 0; i < 670; i++) {
    scheduler.tickRAF();
  }

  // Should have caught it. Since it's wrong, lives should decrease to 2.
  ok(w.document.getElementById('hud-lives').textContent.includes('❤️❤️🖤'), 'Lives decreased to 2 on wrong catch');
  ok(w.document.getElementById('hud-score').textContent.includes('100'), 'Score remained 100');

  // Let's test missing a correct item (it falls off screen).
  // Math.floor(random * 52) = 1 -> number 2 (correct).
  // Position x = 0.1 (far left). We'll keep basket at 0.5 so it misses.
  mockRandomValues = [
    1 / 52, // number 2 (correct)
    0.02    // x = 0.02
  ];
  mockRandomIdx = 0;

  scheduler.tickTimers(1500); // spawn
  for (let i = 0; i < 800; i++) {
    scheduler.tickRAF();
  }

  // Correct item fell below screen. Lives should decrease to 1.
  ok(w.document.getElementById('hud-lives').textContent.includes('❤️🖤🖤'), 'Lives decreased to 1 on missing correct number');

  // Let's test missing a wrong item (it falls off screen).
  // Number 3 (wrong). Position x = 0.1. Basket at 0.5.
  mockRandomValues = [
    2 / 52, // number 3 (wrong)
    0.02    // x = 0.02
  ];
  mockRandomIdx = 0;

  scheduler.tickTimers(1500); // spawn
  for (let i = 0; i < 800; i++) {
    scheduler.tickRAF();
  }

  // Wrong item fell below screen. Lives should remain at 1 (no penalty).
  ok(w.document.getElementById('hud-lives').textContent.includes('❤️🖤🖤'), 'Lives remained at 1 on missing wrong number');

  // 3. Test Timer tick down to 0 (Round ends with timeup)
  // CFG.ROUND_SEC is 30. Let's tick the timer 30 times (30000ms)
  scheduler.tickTimers(30000);
  scheduler.tickTimers(1800); // Wait for transition timeout to round 2

  // TimeUp count should be 1.
  // Wait, let's verify if the next round starts or gameover screen is shown.
  // In endRound: if round < rounds (5), next round is scheduled after 1800ms.
  ok(w.document.getElementById('hud-round').textContent.includes('รอบ 2/5'), 'Progressed to round 2/5');

  w.__ST.round = 4; // Force ST.round = 4 so that ending this round ends the game

  // Let's test lives reaching 0 (Game Over in round 2).
  // We are in round 2 (Odd numbers check). Let's spawn 3 Even numbers (e.g. 2, index 1) and catch them to lose all lives.
  // Lives is reset to 3 at start of round 2. So we need 3 wrong catches to lose.
  mockRandomValues = [
    1 / 52, // 1st wrong item (2, even)
    0.5,
    1 / 52, // 2nd wrong item (2, even)
    0.5,
    1 / 52, // 3rd wrong item (2, even)
    0.5
  ];
  mockRandomIdx = 0;

  // 1st wrong catch
  scheduler.tickTimers(1500);
  for (let i = 0; i < 670; i++) {
    scheduler.tickRAF();
  }

  // 2nd wrong catch
  scheduler.tickTimers(1500);
  for (let i = 0; i < 670; i++) {
    scheduler.tickRAF();
  }

  // 3rd wrong catch -> triggers Game Over
  scheduler.tickTimers(1500);
  for (let i = 0; i < 670; i++) {
    scheduler.tickRAF();
  }
  
  console.log('DEBUG Round 2: ST.lives =', w.__ST ? w.__ST.lives : 'no ST');
  console.log('DEBUG Round 2: ST.items =', w.__ST ? JSON.stringify(w.__ST.items) : 'no ST');
  console.log('DEBUG Round 2: resultScreen classes =', w.document.getElementById('resultScreen').className);
  console.log('DEBUG Round 2: submittedScores length =', submittedScores.length);

  // Lives should be 0. Game should end and show resultScreen.
  ok(w.document.getElementById('resultScreen').classList.contains('active'), 'Game ended and result screen active on 0 lives');
  ok(submittedScores.length === 1, 'submitScore was called');
  ok(submittedScores[0].score === 100, 'Correct final score submitted');
  ok(submittedScores[0].meta.correct === 1, 'Submitted correct count is 1');
  ok(submittedScores[0].meta.wrong === 5, 'Submitted wrong count is 5 (3 wrong catches + 1 wrong catch + 1 missed correct)');
  ok(submittedScores[0].meta.timeUp === 1, 'Submitted timeup count is 1');

  // Verify that all game loops are stopped
  ok(!scheduler.hasActiveRAFs(), 'RAF loop stopped on game finish');
  ok(!scheduler.hasActiveTimers(), 'All timers cleared on game finish');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2: math-hand-raising
// ─────────────────────────────────────────────────────────────────────────────
async function runMathHandRaisingTests() {
  console.log('\n--- Running math-hand-raising tests ---');
  
  const htmlPath = resolve(REPO_ROOT, 'public/games/math/math-hand-raising/index.html');
  const configPath = resolve(REPO_ROOT, 'public/games/math/math-hand-raising/config.js');
  const dataPath = resolve(REPO_ROOT, 'public/games/math/math-hand-raising/data.js');
  const gamePath = resolve(REPO_ROOT, 'public/games/math/math-hand-raising/game.js');

  const html = readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://verify.local/?embed=1',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  
  const { window: w } = dom;
  const scheduler = new MockScheduler();

  // Setup DOM dimensions
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'offsetWidth', { value: 640 });
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'offsetHeight', { value: 480 });

  // Mocks for canvas context
  const mockCtx = {
    clearRect: () => {}, save: () => {}, restore: () => {},
    beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
    drawImage: () => {}
  };
  w.HTMLCanvasElement.prototype.getContext = () => mockCtx;

  // Bind custom scheduler
  w.setInterval = (cb, ms) => scheduler.setInterval(cb, ms);
  w.clearInterval = (id) => scheduler.clearInterval(id);
  w.setTimeout = (cb, ms) => scheduler.setTimeout(cb, ms);
  w.clearTimeout = (id) => scheduler.clearTimeout(id);
  w.requestAnimationFrame = (cb) => scheduler.requestAnimationFrame(cb);
  w.cancelAnimationFrame = (id) => scheduler.cancelAnimationFrame(id);

  // Mocks for SDK
  let submittedScores = [];
  w.KAMPAI = {
    isEmbed: true,
    ready: true,
    student: { id: 'std-123', displayName: 'Student Test', photoUrl: '' },
    stats: { personalBest: 80, playsCount: 5 },
    leaderboard: [],
    onReady: (cb) => cb(w.KAMPAI),
    setSlug: () => {},
    submitScore: (score, meta) => {
      submittedScores.push({ score, meta });
    },
    goHome: () => {},
    sound: {
      unlock: () => {},
      correct: () => {},
      wrong: () => {},
      timeUp: () => {},
      gameOver: () => {},
      speak: () => {},
      fxFlash: () => {},
      mountToggles: () => {},
      defaultBgm: () => {},
      bgmStart: () => {},
      bgmStop: () => {}
    }
  };

  let vsPlayCallback = null;
  let versusActive = false;
  w.KampaiVersus = {
    create: (opts) => {
      vsPlayCallback = (args) => {
        versusActive = true;
        return opts.onPlay(args);
      };
      return {
        available: true,
        openMenu: () => {},
        report: () => {},
        finish: () => {
          if (!versusActive) return false;
          return true;
        },
        leave: () => {},
        mode: 'local'
      };
    }
  };

  // Evaluate config and data
  w.eval(readFileSync(configPath, 'utf8'));
  w.eval(readFileSync(dataPath, 'utf8'));

  // Stub MediaPipe Hands
  w.Hands = function() {
    return {
      initialize: () => Promise.resolve(true),
      setOptions: () => {},
      onResults: () => {},
      send: () => Promise.resolve(true)
    };
  };

  // Evaluate game script
  w.eval(readFileSync(gamePath, 'utf8'));

  // 1. Initial State
  ok(w.document.getElementById('player-chip').innerHTML.includes('Student Test'), 'Player chip rendered');

  // 2. Select Category & Grade
  // Let's click category addition
  const additionBtn = w.document.querySelector('.cat-card[data-category="addition"]');
  additionBtn.click();
  
  const catNextBtn = w.document.getElementById('btn-cat-next');
  catNextBtn.click();

  // Select Grade 4
  const grade4Btn = w.document.querySelector('.grade-card[data-grade="4"]');
  grade4Btn.click();

  const gradeNextBtn = w.document.getElementById('btn-grade-next');
  gradeNextBtn.click();

  // Start with touch mode
  const touchStartBtn = w.document.getElementById('btn-start-touch');
  
  // Set up mock random values to make QuestionEngine deterministic
  // Inside QuestionEngine.generate:
  // Addition:
  // num1 = _rand(1, 100) -> 1 + random * 100
  // num2 = _rand(1, 100) -> 1 + random * 100
  // isCorrect = random > 0.5
  // If isCorrect is true, shownAnswer = num1 + num2
  let mockRandomValues = [
    0.295, // num1 = 30
    0.495, // num2 = 50
    0.9    // isCorrect = true (random > 0.5)
  ];
  let mockRandomIdx = 0;
  w.Math.random = () => {
    if (mockRandomIdx < mockRandomValues.length) {
      return mockRandomValues[mockRandomIdx++];
    }
    return 0.5;
  };

  touchStartBtn.click();

  console.log("DEBUG: roundDisplay text =", w.document.getElementById('roundDisplay').textContent);
  console.log("DEBUG: questionDisplay text =", w.document.getElementById('questionDisplay').textContent);

  // Gameplay should be active. Verify round is 1/10
  ok(w.document.getElementById('roundDisplay').textContent === '1/10', 'Round started at 1/10');
  ok(w.document.getElementById('questionDisplay').textContent.includes('30 + 50 = 80'), 'Question text is correct');

  // Cooldown is 1000ms. We should tick timers by 1000ms to enter AWAITING_ANSWER state.
  scheduler.tickTimers(1000);

  // Timer should be running now.
  ok(scheduler.intervals.size === 1, 'TimerEngine running');

  // We are in AWAITING_ANSWER.
  // Correct answer is True because 30 + 50 = 80 is Correct.
  // Let's test submitting correct answer immediately (should get fast bonus).
  // Click True zone
  const zoneTrue = w.document.getElementById('zoneTrue');
  zoneTrue.click();

  // Score should be 10 (base) + 5 (fast bonus) = 15.
  ok(w.document.getElementById('scoreDisplay').textContent === '15', 'Score updated to 15 (with fast bonus)');

  // FeedBack displays for 2500ms. Let's tick timers 2500ms to trigger nextQuestion.
  // Next question generation randoms:
  mockRandomValues = [
    0.195, // num1 = 20
    0.395, // num2 = 40
    0.1    // isCorrect = false
  ];
  mockRandomIdx = 0;

  scheduler.tickTimers(2500);

  // Round should be 2/10
  ok(w.document.getElementById('roundDisplay').textContent === '2/10', 'Progressed to round 2/10');
  // 20 + 40 = 60. Since isCorrect is false, shownAnswer will be randomized.
  // Let's verify shownAnswer is not 60.
  ok(!w.document.getElementById('questionDisplay').textContent.includes(' = 60'), 'Shown answer is incorrect as expected');

  // Let's tick cooldown timer 1000ms
  scheduler.tickTimers(1000);

  // Let's test slow answer (no fast bonus).
  // Timer for Grade 4 is 15s.
  // Elapsed percent limit for fast bonus is 0.5 (7.5 seconds).
  // Let's tick timers 8 seconds (8000ms).
  scheduler.tickTimers(8000);

  // Now submit wrong answer. The question is false (e.g. 20 + 40 = 62).
  // If we click False, it is Correct!
  const zoneFalse = w.document.getElementById('zoneFalse');
  zoneFalse.click();

  // Score should be 15 + 10 = 25 (no bonus because 8s is > 7.5s limit).
  ok(w.document.getElementById('scoreDisplay').textContent === '25', 'Score is 25 (correct answer, no fast bonus)');

  // Tick 2500ms feedback
  mockRandomValues = [
    0.095, // num1 = 10
    0.195, // num2 = 20
    0.9    // isCorrect = true
  ];
  mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown

  // Question 3: 10 + 20 = 30. Correct.
  // Let's test answering Wrong: Click False.
  zoneFalse.click();
  // Score should remain 25.
  ok(w.document.getElementById('scoreDisplay').textContent === '25', 'Score remained 25 on wrong answer');

  // Tick 2500ms feedback
  mockRandomValues = [
    0.095, // num1 = 10
    0.195, // num2 = 20
    0.9    // isCorrect = true
  ];
  mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown

  // Question 4. Let's test TimeUp.
  // Tick timers 15 seconds (15000ms)
  scheduler.tickTimers(15000);

  // Should have triggered timeUp. Score remains 25.
  ok(w.document.getElementById('scoreDisplay').textContent === '25', 'Score remained 25 on timeup');

  // Let's fast forward through the remaining questions (5 to 10) to finish the game.
  // Question 5
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 25 + 15 = 40

  // Question 6
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 40 + 15 = 55

  // Question 7
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 55 + 15 = 70

  // Question 8
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 70 + 15 = 85

  // Question 9
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 85 + 15 = 100

  // Question 10
  mockRandomValues = [0.105, 0.105, 0.9]; mockRandomIdx = 0;
  scheduler.tickTimers(2500); // nextQuestion
  scheduler.tickTimers(1000); // cooldown
  zoneTrue.click(); // Correct -> 100 + 15 = 115

  // End of question 10. Tick feedback timer 2500ms to trigger endGame.
  scheduler.tickTimers(2500);

  // Verify game over screen is shown and submitScore values.
  ok(w.document.getElementById('gameover-screen').classList.contains('hidden') === false, 'GameOver screen displayed');
  ok(submittedScores.length === 1, 'submitScore was called');
  ok(submittedScores[0].score === 115, 'Submitted score is 115');
  ok(submittedScores[0].meta.correct === 8, 'Submitted correct count is 8 (8 correct answers)');
  ok(submittedScores[0].meta.wrong === 1, 'Submitted wrong count is 1');
  ok(submittedScores[0].meta.timeUp === 1, 'Submitted timeup count is 1');
  ok(submittedScores[0].meta.bonusCount === 7, 'Submitted bonusCount is 7');

  // Verify no leaks
  ok(!scheduler.hasActiveRAFs(), 'No active RAF loops');
  ok(!scheduler.hasActiveTimers(), 'No active timers / intervals');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 3: Deterministic RNG (Mulberry32)
// ─────────────────────────────────────────────────────────────────────────────
function runRNGTests() {
  console.log('\n--- Running RNG and Mulberry32 per-round seeding tests ---');
  
  // Mulberry32 function under test (extracted from game logic)
  function createMulberry32(seed) {
    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // KampaiVersus Mulberry32 function (from kampai-versus.js)
  function mulberry32Versus(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 1. Test basic determinism of createMulberry32
  const rng1 = createMulberry32(12345);
  const rng2 = createMulberry32(12345);
  let match = true;
  for (let i = 0; i < 100; i++) {
    if (rng1() !== rng2()) match = false;
  }
  ok(match, 'createMulberry32 is deterministic for identical seeds');

  // 2. Test createMulberry32 vs mulberry32Versus
  // Let's verify if they generate the exact same sequences
  const rngVs = mulberry32Versus(12345);
  const rngGame = createMulberry32(12345);
  let matchVs = true;
  for (let i = 0; i < 50; i++) {
    const valVs = rngVs();
    const valGame = rngGame();
    if (valVs !== valGame) {
      matchVs = false;
    }
  }
  ok(matchVs, 'createMulberry32 outputs match KampaiVersus mulberry32 output exactly');
}

// ─────────────────────────────────────────────────────────────────────────────
// Run All Tests
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await runCatchNumbersTests();
    await runMathHandRaisingTests();
    runRNGTests();

    console.log(`\n========================================`);
    if (failCount === 0) {
      console.log(`✅ ALL TESTS PASSED (${passCount} assertions)`);
      process.exit(0);
    } else {
      console.log(`❌ SOME TESTS FAILED (${passCount} passed, ${failCount} failed)`);
      process.exit(1);
    }
  } catch (e) {
    console.error('Fatal error running tests:', e);
    process.exit(1);
  }
}

main();
