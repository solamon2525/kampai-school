import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gamePath = 'd:/School คำไผ่/kampai-school/public/games/thai/thai-sara-run.html';
let html = readFileSync(gamePath, 'utf8');

// Strip out remote script tags to prevent JSDOM network load attempts
html = html.replace(/<script src="\/games\/kampai-sdk.js"><\/script>/, '');
html = html.replace(/<script src="\/games\/kampai-match.js"><\/script>/, '');
html = html.replace(/<script src="\/games\/kampai-versus.js"><\/script>/, '');

// Load JSDOM
const { JSDOM, VirtualConsole } = await import('jsdom');

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => {
  console.error('JSDOM Error:', err.message, err.stack);
});
virtualConsole.on('error', (err) => {
  console.error('Console Error:', err);
});
virtualConsole.on('log', (msg) => {
  console.log('Console Log:', msg);
});

const dom = new JSDOM(html, {
  url: 'http://localhost/games/thai/thai-sara-run.html',
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole,
  beforeParse(window) {
    // Stub canvas Context2D using a Proxy BEFORE parsing
    const noop = () => {};
    const dummyProxy = new Proxy({}, {
      get(target, prop) {
        if (prop === 'measureText') return () => ({ width: 100 });
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
          return () => ({ addColorStop: noop });
        }
        return noop;
      }
    });

    window.HTMLCanvasElement.prototype.getContext = function() {
      return dummyProxy;
    };
    window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ width: 1280, height: 720 });
    
    // Stub requestAnimationFrame
    window.requestAnimationFrame = noop;

    // Mock LocalStorage
    const storageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: storageMock });

    // Stub Audio
    window.AudioContext = function() {
      return {
        createOscillator: () => ({ connect: noop, frequency: { setValueAtTime: noop, exponentialRampToValueAtTime: noop }, start: noop, stop: noop }),
        createGain: () => ({ connect: noop, gain: { setValueAtTime: noop, exponentialRampToValueAtTime: noop } }),
        destination: {}
      };
    };

    // Stub KAMPAI SDK
    window.KAMPAI = {
      onReady: (cb) => {
        setTimeout(() => cb({ student: { name: 'Student' }, stats: {}, leaderboard: [] }), 10);
      },
      sound: {
        unlock: noop,
        defaultBgm: noop,
        bgmStart: noop,
        bgmStop: noop,
        correct: noop,
        wrong: noop,
        gameOver: noop,
        speak: noop,
      },
      submitScore: noop,
      goHome: noop,
      setSlug: noop,
    };

    // Stub KampaiVersus and KampaiMatch
    window.KampaiVersus = {
      create: () => ({
        openMenu: noop,
        finish: () => false,
        report: noop
      })
    };
    window.KampaiMatch = {
      create: () => ({})
    };
  }
});

const { window } = dom;

// Wait for window to load
window.addEventListener('load', () => {
  console.log('Window loaded. Clicking btnLocalCoop in 50ms...');
  setTimeout(() => {
    try {
      const btn = window.document.getElementById('btnLocalCoop');
      if (!btn) {
        console.error('Could not find btnLocalCoop!');
        process.exit(1);
      }
      btn.click();
      
      console.log('Running game loop ticks...');
      window.dispatchEvent(new window.Event('resize'));
      
      if (typeof window.loop === 'function') {
        console.log('Invoking window.loop() multiple times...');
        for (let i = 0; i < 50; i++) {
          window.loop();
        }
      } else {
        console.log('window.loop is not a function');
      }
      
      console.log('Ticks complete successfully.');
    } catch (e) {
      console.error('CRITICAL RUNTIME ERROR:', e.message, e.stack);
      process.exit(1);
    }
    process.exit(0);
  }, 100);
});
