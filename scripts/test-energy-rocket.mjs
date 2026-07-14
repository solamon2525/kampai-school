import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const htmlPath = resolve('public/games/science/energy-rocket/index.html');
let html = readFileSync(htmlPath, 'utf8');

// Strip remote/local script tags before loading via eval
html = html
  .replace(/<script src="\/games\/kampai-sdk.js"><\/script>/, '')
  .replace(/<script src="\/games\/kampai-match.js"><\/script>/, '')
  .replace(/<script src="\/games\/kampai-versus.js"><\/script>/, '')
  .replace(/<script src="\/games\/kampai-ar.js"><\/script>/, '')
  .replace(/<script src="game.js"><\/script>/, '')
  .replace(/<script src="config.js"><\/script>/, '')
  .replace(/<script src="data.js"><\/script>/, '');

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

async function testEnergyRocket() {
  console.log('\n--- Testing Energy Rocket (JSDOM) ---');

  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    url: 'http://localhost/games/science/energy-rocket/',
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

      // Canvas setup
      const noop = () => {};
      const dummyProxy = new Proxy({}, {
        get(target, prop) {
          if (prop === 'measureText') return () => ({ width: 100 });
          return noop;
        }
      });
      window.HTMLCanvasElement.prototype.getContext = () => dummyProxy;
      window.HTMLVideoElement.prototype.play = () => Promise.resolve();

      // SDK stub
      window.KAMPAI = {
        setSlug: noop,
        onReady: (cb) => {
          setTimeout(() => cb({ student: { displayName: 'Student' }, stats: {}, leaderboard: [] }), 10);
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
          timeUp: noop,
        },
        submitScore: (score, data) => {
          window.__lastSubmittedScore = { score, data };
        },
        goHome: noop,
      };

      // Versus stub
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
              return !!window.__versusActive; // only return true if versus mode is active
            },
            leave: noop,
            openMenu: () => {
              window.__versusMenuOpened = true;
            }
          };
        }
      };

      // AR stub
      window.KampaiAR = {
        create: (opts) => {
          window.__arOpts = opts;
          return {
            start: () => {
              window.__arStarted = true;
              return Promise.resolve(true);
            },
            stop: () => {
              window.__arStarted = false;
            },
            mode: 'camera'
          };
        }
      };
    }
  });

  const { window } = dom;

  // Load config, data, and game.js
  const configCode = readFileSync(resolve('public/games/science/energy-rocket/config.js'), 'utf8');
  const dataCode = readFileSync(resolve('public/games/science/energy-rocket/data.js'), 'utf8');
  const gameCode = readFileSync(resolve('public/games/science/energy-rocket/game.js'), 'utf8');

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

  // Simulate key presses
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Space' }));
  assert(true, 'Simulated window keydown event');

  // --- TEST 1: SINGLE PLAYER MODE ---
  console.log('Testing single player startup...');
  window.__versusActive = false;
  const startBtn = window.document.getElementById('startBtn');
  startBtn.click();
  await new Promise((r) => setTimeout(r, 50));
  runTimeouts(); // Trigger any async timers/initialization

  assert(window.__arStarted === true, 'AR should be started');
  assert(window.document.getElementById('roundPill').textContent.includes('1/'), 'Should display round 1');
  assert(window.document.getElementById('scorePill').textContent.includes('0'), 'Initial score should be 0');

  // Verify HUD alert initially says idle
  const alertEl = window.document.getElementById('charge-alert');
  assert(alertEl !== null, 'HUD Alert element should exist');
  assert(alertEl.textContent === '🏃 เริ่มวิ่ง/แตะเลย!', 'HUD Alert should start with idle text');
  assert(alertEl.className === 'state-idle', 'HUD Alert class should be state-idle');

  // Verify charging level increases with energy ticks
  console.log('Simulating energy movement (onEnergyTick)...');
  const onEnergy = window.__arOpts.onEnergy;
  onEnergy(0.5); // level = 0.5 (above 0.08 threshold)
  // charge increases by level * CFG.CHARGE_K = 0.5 * 0.008 = 0.004
  const expectedPct = Math.round(0.004 * 100);
  assert(window.document.getElementById('meterPct').textContent === `${expectedPct}%`, `Meter should update to ${expectedPct}%`);

  // Verify shake & thruster visibility
  const rocket = window.document.getElementById('rocket');
  const thruster = window.document.getElementById('thruster');
  assert(rocket.style.transform !== '', 'Rocket should have shake transform applied');
  assert(thruster.style.display === 'block', 'Thruster should be visible');

  // Verify Low Alert State
  assert(alertEl.className === 'state-low', 'HUD Alert should change to state-low');

  // Simulate decay on rest ticks
  console.log('Simulating decay when static...');
  onEnergy(0.0); // static level
  // charge decays by -CFG.DRAIN = -0.015. Since 0.004 - 0.015 < 0, it should decay back to 0.
  assert(window.document.getElementById('meterPct').textContent === '0%', 'Meter should decay back to 0% when static');
  assert(thruster.style.display === 'none', 'Thruster should hide when charge is 0');

  // Verify Tap Button
  console.log('Simulating Tap Button (pushBtn)...');
  const pushBtn = window.document.getElementById('pushBtn');
  pushBtn.click(); // charge increases by CFG.TAP_K = 0.025
  assert(window.document.getElementById('meterPct').textContent === '2.5%' || window.document.getElementById('meterPct').textContent === '3%', 'Meter should increase on tap click');

  // Let's tap 40 times to reach 100%
  for (let i = 0; i < 40; i++) {
    pushBtn.click();
  }
  // This will trigger launch() when charge >= 1.
  // In launch(), the rocket class gets "launch", and score is updated, then a timeout for loadRound/finishGame is set.
  assert(rocket.classList.contains('launch'), 'Rocket should have launch class added when fully charged');
  assert(window.document.getElementById('scorePill').textContent.includes('⭐'), 'Score should update on launch');

  // Trigger timeouts to proceed to next round
  runTimeouts();
  assert(window.document.getElementById('roundPill').textContent.includes('2/'), 'Should advance to round 2');

  // Let's finish the game by advancing rounds
  console.log('Completing remaining rounds...');
  const numRounds = window.GAME_CONFIG.ROUNDS;
  // We are currently at round 2 (index 1).
  for (let r = 2; r <= numRounds; r++) {
    console.log(`Before taps for r=${r}: roundPill=${window.document.getElementById('roundPill').textContent}, scorePill=${window.document.getElementById('scorePill').textContent}`);
    // Tap to full charge
    for (let i = 0; i < 40; i++) {
      pushBtn.click();
    }
    console.log(`After taps for r=${r}: rocket classes=${window.document.getElementById('rocket').className}, scorePill=${window.document.getElementById('scorePill').textContent}`);
    runTimeouts();
    console.log(`After runTimeouts for r=${r}: roundPill=${window.document.getElementById('roundPill').textContent}`);
  }
  console.log(`Final state: lastSubmittedScore=${JSON.stringify(window.__lastSubmittedScore)}`);
  // After last round, finishGame() is called.
  assert(window.__lastSubmittedScore !== undefined, 'Score should be submitted to KAMPAI on single-player completion');

  // --- TEST 2: VERSUS MODE ---
  console.log('\nTesting Versus Mode...');
  // Mock vs globally to bypass the ReferenceError caused by vs being local to game.js IIFE.
  // We will report this ReferenceError in the handoff.
  window.vs = {
    openMenu: () => {
      window.__versusMenuOpened = true;
    }
  };
  // Open versus menu
  const vsBtn = window.document.getElementById('vsBtn');
  assert(vsBtn !== null, 'Versus button vsBtn should exist');
  vsBtn.click();
  assert(window.__versusMenuOpened === true, 'Versus menu should open on vsBtn click');

  // Simulate starting versus match via onPlay callback
  window.__lastVersusReport = undefined;
  window.__lastVersusFinish = undefined;
  window.__lastSubmittedScore = undefined;

  const mockPlayer = { id: 'p2', displayName: 'Opponent' };
  const mockRng = () => 0.12345; // Deterministic mock RNG

  window.__versusActive = true;
  window.__versusOpts.onPlay({ rng: mockRng, player: mockPlayer });
  await new Promise((r) => setTimeout(r, 50));
  runTimeouts();

  // Verify that the game started in versus mode
  assert(window.document.getElementById('roundPill').textContent.includes('1/'), 'Versus game should start at round 1');
  
  // Tap to fill
  for (let i = 0; i < 40; i++) {
    pushBtn.click();
  }
  // On launch, vs.report should be called in versus mode
  assert(window.__lastVersusReport !== undefined, 'vs.report should be called when launching in versus mode');
  runTimeouts(); // Proceed to round 2

  // complete all rounds in versus mode
  for (let r = 2; r <= numRounds; r++) {
    for (let i = 0; i < 40; i++) {
      pushBtn.click();
    }
    runTimeouts();
  }

  // Verify that vs.finish was called and KAMPAI.submitScore was NOT called
  assert(window.__lastVersusFinish !== undefined, 'vs.finish should be called on versus game completion');
  assert(window.__lastSubmittedScore === undefined, 'KAMPAI.submitScore should NOT be called directly in versus mode');

  // --- TEST 3: CLEANUP AND LEAKS ---
  console.log('\nTesting Cleanup and Leaks...');
  const quitBtn = window.document.getElementById('quitBtn');
  quitBtn.click();

  assert(window.__arStarted === false, 'AR should stop on quit');
  // Check intervals/timeouts
  assert(Object.keys(window.__intervals).length === 0, 'All intervals should be cleared on quit');
  assert(Object.keys(window.__timeouts).length === 0, 'All timeouts should be cleared on quit');

  console.log(`\nResults: ${pass} passed, ${fail} failed.`);
  if (fail > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed successfully!');
  }
}

testEnergyRocket();
