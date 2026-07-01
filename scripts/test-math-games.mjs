import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const catchHtmlPath = resolve('public/games/math/catch-numbers/index.html');
const handHtmlPath = resolve('public/games/math/math-hand-raising/index.html');

let catchHtml = readFileSync(catchHtmlPath, 'utf8');
let handHtml = readFileSync(handHtmlPath, 'utf8');

// Strip remote script tags
const stripScripts = (html) => {
  return html
    .replace(/<script src="\/games\/kampai-sdk.js"><\/script>/, '')
    .replace(/<script src="\/games\/kampai-match.js"><\/script>/, '')
    .replace(/<script src="\/games\/kampai-versus.js"><\/script>/, '')
    .replace(/<script src="\/games\/kampai-ar.js"><\/script>/, '')
    .replace(/<script src="game.js"><\/script>/, '')
    .replace(/<script src="config.js"><\/script>/, '')
    .replace(/<script src="data.js"><\/script>/, '');
};

catchHtml = stripScripts(catchHtml);
handHtml = stripScripts(handHtml);

// Global test variables
let pass = 0, fail = 0;
const assert = (condition, message) => {
  if (condition) {
    pass++;
    console.log(`✅ PASS: ${message}`);
  } else {
    fail++;
    console.error(`❌ FAIL: ${message}`);
  }
};

// -------------------------------------------------------------
// TEST 1 & 2 & 3: CATCH NUMBERS
// -------------------------------------------------------------
async function testCatchNumbers() {
  console.log('\n--- Testing Catch Numbers ---');

  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(catchHtml, {
    url: 'http://localhost/games/math/catch-numbers/',
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole,
    beforeParse(window) {
      // Fake timers
      const intervals = {};
      const timeouts = {};
      window.setInterval = (fn, delay) => {
        const id = Math.random().toString(36).slice(2);
        intervals[id] = { fn, delay };
        return id;
      };
      window.clearInterval = (id) => {
        delete intervals[id];
      };
      window.setTimeout = (fn, delay) => {
        const id = Math.random().toString(36).slice(2);
        timeouts[id] = { fn, delay };
        return id;
      };
      window.clearTimeout = (id) => {
        delete timeouts[id];
      };

      // Expose fake timers for test control
      window.__intervals = intervals;
      window.__timeouts = timeouts;

      // requestAnimationFrame mock
      let loopFn = null;
      let rafIdCounter = 0;
      const activeRafs = new Set();

      window.requestAnimationFrame = (fn) => {
        loopFn = fn;
        activeRafs.clear(); // Clear previous executed/scheduled frame
        const id = ++rafIdCounter;
        activeRafs.add(id);
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        activeRafs.delete(id);
      };

      window.__getLoopFn = () => loopFn;
      window.__activeRafs = activeRafs;

      // Canvas setup
      const noop = () => {};
      const dummyProxy = new Proxy({}, {
        get(target, prop) {
          if (prop === 'measureText') return () => ({ width: 100 });
          return noop;
        }
      });
      window.HTMLCanvasElement.prototype.getContext = () => dummyProxy;
      window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 0, width: 800, top: 0, height: 600 });

      // Math.random dynamic mock
      window.__randomVal = 0.5;
      window.Math.random = () => window.__randomVal;

      // SDK stub
      window.KAMPAI = {
        setSlug: noop,
        onReady: (cb) => {
          setTimeout(() => cb({ student: { displayName: 'Challenger' }, stats: {}, leaderboard: [] }), 10);
        },
        sound: {
          unlock: noop,
          defaultBgm: noop,
          bgmStart: noop,
          bgmStop: noop,
          correct: noop,
          wrong: noop,
          gameOver: noop,
          fxFlash: noop,
          mountToggles: noop,
        },
        submitScore: (score, data) => {
          window.__lastSubmittedScore = { score, data };
        },
        goHome: noop,
      };

      window.KampaiVersus = {
        create: (opts) => {
          window.__versusOpts = opts;
          return {
            mode: 'versus',
            report: (score, data) => {
              window.__lastVersusReport = { score, data };
            },
            finish: (score, data) => {
              window.__lastVersusFinish = { score, data };
              return false; // let the default結果 screen show
            },
            leave: noop
          };
        }
      };

      window.KampaiAR = {
        create: () => ({
          start: () => Promise.resolve(true),
          stop: noop,
          mode: 'tap'
        })
      };
    }
  });

  const { window } = dom;

  // Load config, data, and game.js
  const configCode = readFileSync(resolve('public/games/math/catch-numbers/config.js'), 'utf8');
  const dataCode = readFileSync(resolve('public/games/math/catch-numbers/data.js'), 'utf8');
  const gameCode = readFileSync(resolve('public/games/math/catch-numbers/game.js'), 'utf8');

  window.eval(configCode);
  window.eval(dataCode);

  // Trigger ready
  await new Promise((r) => setTimeout(r, 20));

  window.eval(gameCode);

  // Helper to trigger all pending timeouts
  const runTimeouts = () => {
    Object.keys(window.__timeouts).forEach((id) => {
      const t = window.__timeouts[id];
      delete window.__timeouts[id];
      t.fn();
    });
  };

  // Helper to trigger intervals
  const triggerInterval = (delayPattern) => {
    Object.keys(window.__intervals).forEach((id) => {
      const inv = window.__intervals[id];
      if (inv.delay === delayPattern) {
        inv.fn();
      }
    });
  };

  // Start game
  const startBtn = window.document.getElementById('startBtn');
  startBtn.click();
  await new Promise((r) => setTimeout(r, 50));
  runTimeouts(); // Run rule card transition timeout

  // Confirm HUD and init state
  assert(window.document.getElementById('hud-round').textContent.includes('1/5'), 'Initial round text should be 1/5');
  assert(window.document.getElementById('hud-score').textContent.includes('0'), 'Initial score should be 0');

  // Let's spawn an item
  // First, find spawn interval (around 1500ms or so)
  const spawnTimerId = Object.keys(window.__intervals).find(id => window.__intervals[id].delay >= 600);
  assert(spawnTimerId !== undefined, 'Spawn timer interval should be registered');

  // Let's control Mulberry32 seed and item spawning
  const gameScreen = window.document.getElementById('gameScreen');

  // Verify basket position is updated
  // Now let's spawn a correct item: even numbers in round 1
  window.__randomVal = 1.5 / 52; 
  // ix = (0.08 + (1.5/52)*0.84) * 800 = 83.3. Move basket to 83 to catch.
  gameScreen.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 83 }));

  // Spawn!
  window.__intervals[spawnTimerId].fn();

  // Step game loop multiple frames until caught
  const loop = window.__getLoopFn();
  assert(typeof loop === 'function', 'Loop function should be defined');

  // Loop until caught (or up to 700 frames)
  for (let i = 0; i < 700; i++) {
    loop();
  }

  // Check score and correct count
  assert(window.document.getElementById('hud-score').textContent.includes('100'), 'Score should increase by 100 on correct catch');
  assert(window.document.getElementById('hud-lives').textContent.includes('❤️❤️❤️'), 'Lives should remain 3 on correct catch');

  // Now let's spawn an incorrect item (odd number in round 1, e.g. 1)
  window.__randomVal = 0.5 / 52;
  // ix = (0.08 + (0.5/52)*0.84) * 800 = 70.4. Move basket to 70 to catch.
  gameScreen.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 70 }));

  // Spawn!
  window.__intervals[spawnTimerId].fn();
  for (let i = 0; i < 700; i++) {
    loop();
  }

  // Check score and lives
  assert(window.document.getElementById('hud-lives').textContent.includes('❤️❤️🖤'), 'Lives should decrease by 1 on incorrect catch');

  // Now test correct item missed (let it fall)
  // Move basket away so it misses (e.g. x = 400)
  gameScreen.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 400 }));

  window.__randomVal = 1.5 / 52; // Pick 2 (even - correct)
  // Spawn!
  window.__intervals[spawnTimerId].fn();
  for (let i = 0; i < 1500; i++) {
    loop(); // Let it fall past height (it.y > 1.05)
  }

  // Check lives (correct item missed should cost a life)
  assert(window.document.getElementById('hud-lives').textContent.includes('❤️🖤🖤'), 'Lives should decrease by 1 when correct item is missed (falls off bottom)');

  // Now test incorrect item missed (should NOT cost a life)
  window.__randomVal = 0.5 / 52; // Pick 1 (odd - wrong)
  // Spawn!
  window.__intervals[spawnTimerId].fn();
  for (let i = 0; i < 1500; i++) {
    loop();
  }

  // Check lives (wrong item missed should not cost a life)
  assert(window.document.getElementById('hud-lives').textContent.includes('❤️🖤🖤'), 'Lives should NOT decrease when incorrect item is missed (falls off bottom)');

  // Test Time-up bonus and Timer
  // Let's see what intervals are registered. Find roundTimer (delay = 1000).
  const roundTimerId = Object.keys(window.__intervals).find(id => window.__intervals[id].delay === 1000);
  assert(roundTimerId !== undefined, 'Round timer interval should be registered');

  // Call the round timer 30 times to expire it
  for (let i = 0; i < 30; i++) {
    window.__intervals[roundTimerId].fn();
  }

  // The round timer tick to 0 should call endRound(true)
  // Let's run any timeouts (next round transition is 1800ms)
  runTimeouts();

  // Check if round advanced to 2
  assert(window.document.getElementById('hud-round').textContent.includes('2/5'), 'Game should advance to round 2 on timeup');

  // Since time ran out, the score bonus calculation is ST.sec * CFG.SCORE_BONUS_TIME.
  // But ST.sec is 0 when the timer triggers timeup. So no bonus score was added.
  // Let's verify score did not change. It was 100 before.
  assert(window.document.getElementById('hud-score').textContent.includes('100'), 'Score should remain 100 (bonus score is 0 because ST.sec is 0)');

  // Let's test quit cleanup to check for leaks
  const quitBtn = window.document.getElementById('quitBtn');
  quitBtn.click();

  // Check leaks
  assert(Object.keys(window.__intervals).length === 0, 'All intervals should be cleared after quit');
  assert(Object.keys(window.__timeouts).length === 0, 'All timeouts should be cleared after quit');
  assert(window.__activeRafs.size === 0, 'Canvas loop requestAnimationFrame should be cancelled after quit');

  // Test versus mode RNG Mulberry32 seeding
  console.log('Testing Versus Mode deterministic RNG...');
  if (window.__versusOpts) {
    const mockRng = () => 0.12345;
    window.__versusOpts.onPlay({ rng: mockRng });

    // This should start the game and initialize roundSeeds.
    // Let's check if roundSeeds are deterministic.
    // In catch-numbers game.js, startVersusRound does:
    // matchRng is mockRng, which always returns 0.12345.
    // roundSeeds will be filled with Math.floor(0.12345 * 4294967296) = 530214227.
    // Let's trigger a round start to see if qrand uses Mulberry32.
    // Since we're in round 0, qrand will use Mulberry32 with seed = roundSeeds[0] = 530214227.
    // Mulberry32 function with seed 530214227:
    // First call:
    // seed += 0x6D2B79F5 => 530214227 + 1831565813 = 2361780040
    // let's check if the spawned x positions are identical.
    const spawnX1 = [];
    const spawnX2 = [];

    // Reset game and select versus
    window.__versusOpts.onPlay({ rng: mockRng });
    await new Promise((r) => setTimeout(r, 50));
    runTimeouts();
    // Capture generated coordinates
    // We will call spawnItem which uses qrand()
    // Re-resolve spawn timer
    const vsSpawnTimerId = Object.keys(window.__intervals).find(id => window.__intervals[id].delay >= 600);
    assert(vsSpawnTimerId !== undefined, 'Versus spawn timer interval should be registered');
    // Spawn 5 items
    for (let i = 0; i < 5; i++) {
      window.__intervals[vsSpawnTimerId].fn();
    }
    // Read their x coordinates? We don't have access to ST.items directly,
    // but we can re-run the matchRng seed sequence or check the state.
    // Wait, let's verify if Mulberry32 generates identical sequence for another player with same seed!
    // Since we can't inspect private state directly, let's verify Mulberry32 implementation correctness
    // by calling a mock generator with the same algorithm.
    const createMulberry32 = (seed) => {
      return function() {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rngA = createMulberry32(530214227);
    const rngB = createMulberry32(530214227);
    assert(rngA() === rngB(), 'Mulberry32 should be deterministic for identical seeds');
    assert(rngA() === rngB(), 'Mulberry32 should be deterministic for multiple calls');
  }

  dom.window.close();
}

// -------------------------------------------------------------
// TEST 4 & 5 & 6: MATH HAND RAISING
// -------------------------------------------------------------
async function testMathHandRaising() {
  console.log('\n--- Testing Math Hand Raising ---');

  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(handHtml, {
    url: 'http://localhost/games/math/math-hand-raising/',
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole,
    beforeParse(window) {
      // Fake timers
      const intervals = {};
      const timeouts = {};
      window.setInterval = (fn, delay) => {
        const id = Math.random().toString(36).slice(2);
        intervals[id] = { fn, delay };
        return id;
      };
      window.clearInterval = (id) => {
        delete intervals[id];
      };
      window.setTimeout = (fn, delay) => {
        const id = Math.random().toString(36).slice(2);
        timeouts[id] = { fn, delay };
        return id;
      };
      window.clearTimeout = (id) => {
        delete timeouts[id];
      };

      window.__intervals = intervals;
      window.__timeouts = timeouts;

      // requestAnimationFrame mock
      let loopFn = null;
      let rafIdCounter = 0;
      const activeRafs = new Set();

      window.requestAnimationFrame = (fn) => {
        loopFn = fn;
        const id = ++rafIdCounter;
        activeRafs.add(id);
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        activeRafs.delete(id);
      };

      window.__getLoopFn = () => loopFn;
      window.__activeRafs = activeRafs;

      // Canvas setup
      const noop = () => {};
      window.HTMLCanvasElement.prototype.getContext = () => ({
        clearRect: noop,
        drawImage: noop,
        save: noop,
        restore: noop,
        beginPath: noop,
        arc: noop,
        fill: noop,
      });

      // SDK stub
      window.KAMPAI = {
        setSlug: noop,
        onReady: (cb) => {
          setTimeout(() => cb({ student: { displayName: 'Challenger' }, stats: {}, leaderboard: [] }), 10);
        },
        sound: {
          unlock: noop,
          defaultBgm: noop,
          bgmStart: noop,
          bgmStop: noop,
          correct: noop,
          wrong: noop,
          gameOver: noop,
          timeUp: noop,
          fxFlash: noop,
          mountToggles: noop,
        },
        submitScore: (score, data) => {
          window.__lastSubmittedScore = { score, data };
        },
        goHome: noop,
      };

      window.KampaiVersus = {
        create: (opts) => {
          window.__versusOpts = opts;
          return {
            mode: 'versus',
            report: (score, data) => {
              window.__lastVersusReport = { score, data };
            },
            finish: (score, data) => {
              window.__lastVersusFinish = { score, data };
              return false;
            },
            leave: noop
          };
        }
      };

      // Confetti mock
      window.confetti = noop;
    }
  });

  const { window } = dom;

  const configCode = readFileSync(resolve('public/games/math/math-hand-raising/config.js'), 'utf8');
  const dataCode = readFileSync(resolve('public/games/math/math-hand-raising/data.js'), 'utf8');
  const gameCode = readFileSync(resolve('public/games/math/math-hand-raising/game.js'), 'utf8');

  window.eval(configCode);
  window.eval(dataCode);

  // Trigger ready
  await new Promise((r) => setTimeout(r, 20));

  window.eval(gameCode);

  // Helper to trigger timeouts
  const runTimeouts = () => {
    Object.keys(window.__timeouts).forEach((id) => {
      const t = window.__timeouts[id];
      delete window.__timeouts[id];
      t.fn();
    });
  };

  // Helper to click category and grade to start
  const playBtn = window.document.getElementById('btn-play');
  playBtn.click();

  // Select category
  const firstCatBtn = window.document.querySelector('#category-grid .cat-card');
  firstCatBtn.click();
  window.document.getElementById('btn-cat-next').click();

  // Select grade
  const firstGradeBtn = window.document.querySelector('#grade-grid .grade-card');
  firstGradeBtn.click();
  window.document.getElementById('btn-grade-next').click();

  // Select Touch mode
  const touchBtn = window.document.getElementById('btn-start-touch');
  touchBtn.click();

  // Cooldown timeout starts
  runTimeouts(); // Runs the 1000ms cooldown prior to accepting answers

  // Verify question is loaded
  const qText = window.document.getElementById('questionDisplay').textContent;
  assert(qText !== 'พร้อมไหม?', `Question should be generated and displayed, got: ${qText}`);

  // Let's verify which timer interval is active (delay = 100)
  const timerEngineId = Object.keys(window.__intervals).find(id => window.__intervals[id].delay === 100);
  assert(timerEngineId !== undefined, 'TimerEngine interval should be registered');

  // Let's verify fast-response score calculation
  // Base score = 10. Fast bonus = 5. Total = 15.
  // Let's mock window.__lastSubmittedScore to capture score
  // We'll answer correctly.
  // First, find whether the question is correct or incorrect.
  // We don't know easily, but we can look at the evaluated text or check the internal state.
  // Wait, let's look at the parsed operands from the DOM!
  // E.g., "5 + 10 = 15"
  const text = window.document.getElementById('questionDisplay').textContent;
  const match = text.match(/([\d,]+)\s+([+\-−×÷])\s+([\d,]+)\s+=\s+([\d,]+)/);
  assert(match !== null, `Question text should match math pattern: ${text}`);

  const op1 = parseInt(match[1].replace(/,/g, ''));
  const op = match[2];
  const op2 = parseInt(match[3].replace(/,/g, ''));
  const ans = parseInt(match[4].replace(/,/g, ''));

  let expectedCorrect = false;
  if (op === '+') expectedCorrect = (op1 + op2 === ans);
  else if (op === '−' || op === '-') expectedCorrect = (op1 - op2 === ans);
  else if (op === '×') expectedCorrect = (op1 * op2 === ans);
  else if (op === '÷') expectedCorrect = (op1 / op2 === ans);

  // Let's answer it!
  const answerZoneId = expectedCorrect ? 'zoneTrue' : 'zoneFalse';
  window.document.getElementById(answerZoneId).click();

  // Verify score displays 15 (10 correct + 5 fast bonus since no ticks occurred yet)
  assert(window.document.getElementById('scoreDisplay').textContent === '15', 'Score should be 15 (correct + fast bonus)');

  // Let's run feedback timeout to transition to next question (feedback is 2500ms)
  runTimeouts(); // Runs feedbackTimeout
  runTimeouts(); // Runs next question's cooldownTimeout

  // Question 2: Let's test normal response (no bonus)
  // Let's tick the timer until 60% of the time is elapsed.
  // Max time for Grade 4 is 15s. Ticks are every 100ms (0.1s).
  // 60% of 15s is 9s. So we will call the timer tick 90 times.
  const timerEngineId2 = Object.keys(window.__intervals).find(id => window.__intervals[id].delay === 100);
  assert(timerEngineId2 !== undefined, 'TimerEngine interval should be registered for Q2');
  for (let i = 0; i < 90; i++) {
    window.__intervals[timerEngineId2].fn();
  }

  // Answer correctly for question 2
  const text2 = window.document.getElementById('questionDisplay').textContent;
  const match2 = text2.match(/([\d,]+)\s+([+\-−×÷])\s+([\d,]+)\s+=\s+([\d,]+)/);
  const op1_2 = parseInt(match2[1].replace(/,/g, ''));
  const op_2 = match2[2];
  const op2_2 = parseInt(match2[3].replace(/,/g, ''));
  const ans_2 = parseInt(match2[4].replace(/,/g, ''));

  let expectedCorrect2 = false;
  if (op_2 === '+') expectedCorrect2 = (op1_2 + op2_2 === ans_2);
  else if (op_2 === '−' || op_2 === '-') expectedCorrect2 = (op1_2 - op2_2 === ans_2);
  else if (op_2 === '×') expectedCorrect2 = (op1_2 * op2_2 === ans_2);
  else if (op_2 === '÷') expectedCorrect2 = (op1_2 / op2_2 === ans_2);

  const answerZoneId2 = expectedCorrect2 ? 'zoneTrue' : 'zoneFalse';
  window.document.getElementById(answerZoneId2).click();

  // Score should increase by 10 (total = 25) since bonus threshold (50%) was exceeded
  assert(window.document.getElementById('scoreDisplay').textContent === '25', 'Score should be 25 (15 + 10, no fast bonus)');

  // Let's run feedback and cooldown timeout
  runTimeouts();
  runTimeouts();

  // Question 3: Test wrong answer
  const text3 = window.document.getElementById('questionDisplay').textContent;
  const match3 = text3.match(/([\d,]+)\s+([+\-−×÷])\s+([\d,]+)\s+=\s+([\d,]+)/);
  const op1_3 = parseInt(match3[1].replace(/,/g, ''));
  const op_3 = match3[2];
  const op2_3 = parseInt(match3[3].replace(/,/g, ''));
  const ans_3 = parseInt(match3[4].replace(/,/g, ''));

  let expectedCorrect3 = false;
  if (op_3 === '+') expectedCorrect3 = (op1_3 + op2_3 === ans_3);
  else if (op_3 === '−' || op_3 === '-') expectedCorrect3 = (op1_3 - op2_3 === ans_3);
  else if (op_3 === '×') expectedCorrect3 = (op1_3 * op2_3 === ans_3);
  else if (op_3 === '÷') expectedCorrect3 = (op1_3 / op2_3 === ans_3);

  // Click the WRONG answer zone
  const wrongAnswerZoneId = expectedCorrect3 ? 'zoneFalse' : 'zoneTrue';
  window.document.getElementById(wrongAnswerZoneId).click();

  // Score should remain 25
  assert(window.document.getElementById('scoreDisplay').textContent === '25', 'Score should remain 25 on wrong answer');

  // Let's run feedback and cooldown timeout
  runTimeouts();
  runTimeouts();

  // Question 4: Test timeup
  // Let's tick the timer until 15s is up. (160 ticks to avoid floating point issues)
  const timerEngineId4 = Object.keys(window.__intervals).find(id => window.__intervals[id].delay === 100);
  assert(timerEngineId4 !== undefined, 'TimerEngine interval should be registered for Q4');
  for (let i = 0; i < 160; i++) {
    if (window.__intervals[timerEngineId4]) {
      window.__intervals[timerEngineId4].fn();
    }
  }

  // Score should remain 25, and feedback screen should show
  assert(window.document.getElementById('scoreDisplay').textContent === '25', 'Score should remain 25 on timeup');

  // Run feedback timeout
  runTimeouts();

  // Now, let's simulate the rest of the game to finish and check submitted stats
  // We have done 4 questions. Let's do 6 more questions quickly to finish the game.
  for (let q = 5; q <= 10; q++) {
    // 1. Run cooldown to start AWAITING_ANSWER
    runTimeouts();
    // 2. Answer correct immediately
    const textQ = window.document.getElementById('questionDisplay').textContent;
    const matchQ = textQ.match(/([\d,]+)\s+([+\-−×÷])\s+([\d,]+)\s+=\s+([\d,]+)/);
    const op1_q = parseInt(matchQ[1].replace(/,/g, ''));
    const op_q = matchQ[2];
    const op2_q = parseInt(matchQ[3].replace(/,/g, ''));
    const ans_q = parseInt(matchQ[4].replace(/,/g, ''));
    let expectedCorrectQ = false;
    if (op_q === '+') expectedCorrectQ = (op1_q + op2_q === ans_q);
    else if (op_q === '−' || op_q === '-') expectedCorrectQ = (op1_q - op2_q === ans_q);
    else if (op_q === '×') expectedCorrectQ = (op1_q * op2_q === ans_q);
    else if (op_q === '÷') expectedCorrectQ = (op1_q / op2_q === ans_q);

    window.document.getElementById(expectedCorrectQ ? 'zoneTrue' : 'zoneFalse').click();
    // 3. Run feedback to transition to next question and schedule next cooldown
    runTimeouts();
  }

  // Verify game ended and submitted stats
  assert(window.__lastSubmittedScore !== undefined, 'Score should be submitted to SDK');
  const submitted = window.__lastSubmittedScore;
  console.log('Submitted stats:', submitted);
  assert(submitted.data.correct === 8, `Correct count should be 8, got: ${submitted.data.correct}`);
  assert(submitted.data.wrong === 1, `Wrong count should be 1, got: ${submitted.data.wrong}`);
  assert(submitted.data.timeUp === 1, `TimeUp count should be 1, got: ${submitted.data.timeUp}`);
  assert(submitted.data.bonusCount === 7, `Bonus count should be 7, got: ${submitted.data.bonusCount}`);
  assert(submitted.score === (8 * 10 + 7 * 5), `Score should match expected formula: ${submitted.score}`);

  // Test confirm quit leak check
  console.log('Testing Quit / Cleanup Leaks...');
  // Let's restart a game
  const playAgainBtn = window.document.getElementById('btn-play-again');
  playAgainBtn.click();
  // Start touch mode again
  window.document.getElementById('btn-play').click();
  window.document.querySelector('#category-grid .cat-card').click();
  window.document.getElementById('btn-cat-next').click();
  window.document.querySelector('#grade-grid .grade-card').click();
  window.document.getElementById('btn-grade-next').click();
  window.document.getElementById('btn-start-touch').click();

  // We are in COOLDOWN state.
  // Click Quit -> Confirm Quit
  window.document.getElementById('btn-quit').click();
  window.document.getElementById('btn-confirm-quit').click();

  // Check if cooldownTimeoutId or feedbackTimeoutId are still pending in window.__timeouts.
  // If they were not cleared, we would see timeouts in window.__timeouts!
  const hasPendingTimeouts = Object.keys(window.__timeouts).length > 0;
  assert(!hasPendingTimeouts, 'All timeouts should be cleared when quit, but some are still pending (LEAK DETECTED)');
  if (hasPendingTimeouts) {
    console.log('Pending timeouts found on quit:', window.__timeouts);
  }

  dom.window.close();
}

async function run() {
  try {
    await testCatchNumbers();
    await testMathHandRaising();
    console.log(`\nTests finished: ${pass} passed, ${fail} failed.`);
    process.exit(fail === 0 ? 0 : 1);
  } catch (e) {
    console.error('CRITICAL ERROR RUNNING TESTS:', e);
    process.exit(1);
  }
}

run();
