import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const mediaRuntimeCode = fs.readFileSync(path.join(repoRoot, 'public/games/media-lab-runtime.js'), 'utf8');
const classroomToolsCode = fs.readFileSync(path.join(repoRoot, 'public/games/shared-classroom-tools.js'), 'utf8');

function createDom({
  html = '<!doctype html><html lang="th"><head></head><body></body></html>',
  reducedMotion = false,
  withSpeechSynthesis = true,
  withKampai = true,
} = {}) {
  const dom = new JSDOM(html, {
    url: 'http://localhost/games/test-media.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;

  const storage = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear(),
    },
  });

  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  const calls = {
    kampaiSpeak: [],
    kampaiStopSpeak: 0,
    synthSpeak: [],
    synthCancel: 0,
    confirm: 0,
    alert: 0,
  };

  window.confirm = () => {
    calls.confirm += 1;
    return true;
  };
  window.alert = () => {
    calls.alert += 1;
  };

  // Stub canvas 2d context for JSDOM wheel & confetti tests
  window.HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      arc: () => {},
      lineTo: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillText: () => {},
      fillRect: () => {},
    };
  };

  if (withSpeechSynthesis) {
    window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
      this.lang = 'th-TH';
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    };
    window.speechSynthesis = {
      speaking: false,
      pending: false,
      speak(utterance) {
        this.speaking = true;
        calls.synthSpeak.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
      },
      cancel() {
        this.speaking = false;
        this.pending = false;
        calls.synthCancel += 1;
      },
      getVoices: () => [],
    };
  } else {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  }

  if (withKampai) {
    window.KAMPAI = {
      _slug: null,
      setSlug(s) { this._slug = s; },
      goHome() {},
      sound: {
        available: true,
        speak(text, lang, interrupt) {
          calls.kampaiSpeak.push({ text, lang, interrupt });
        },
        stopSpeak() {
          calls.kampaiStopSpeak += 1;
        },
        mountToggles() {},
        correct() {},
        wrong() {},
      },
    };
  }

  return { dom, window, calls };
}

test('KampaiMediaLab.speakSafe uses KAMPAI.sound.speak or speechSynthesis, cancels on visibilitychange/pagehide/stopAllSpeech, and returns { ok, reason } cleanly when unavailable', () => {
  // 1. With KAMPAI.sound.speak
  {
    const { window, calls } = createDom({ withKampai: true, withSpeechSynthesis: true });
    window.eval(mediaRuntimeCode);

    assert.ok(window.KampaiMediaLab, 'window.KampaiMediaLab must be defined even without MEDIA_CONFIG');
    assert.equal(typeof window.KampaiMediaLab.speakSafe, 'function');
    assert.equal(typeof window.KampaiMediaLab.stopAllSpeech, 'function');

    const res = window.KampaiMediaLab.speakSafe('สวัสดีนักเรียน', { lang: 'th-TH', rate: 0.9 });
    assert.equal(res.ok, true);
    assert.equal(calls.kampaiSpeak.length, 1);
    assert.equal(calls.kampaiSpeak[0].text, 'สวัสดีนักเรียน');
    assert.equal(window.KampaiMediaLab.getState().speaking, true);

    // visibilitychange when document.hidden === true must cancel speech
    Object.defineProperty(window.document, 'hidden', { configurable: true, value: true });
    window.document.dispatchEvent(new window.Event('visibilitychange'));
    assert.ok(calls.kampaiStopSpeak >= 1);
    assert.ok(calls.synthCancel >= 1);
    assert.equal(window.KampaiMediaLab.getState().speaking, false);

    // pagehide must also cancel speech
    Object.defineProperty(window.document, 'hidden', { configurable: true, value: false });
    window.KampaiMediaLab.speakSafe('ทดสอบหน้าออก');
    const prevStop = calls.kampaiStopSpeak;
    window.dispatchEvent(new window.Event('pagehide'));
    assert.ok(calls.kampaiStopSpeak > prevStop);
    assert.equal(window.KampaiMediaLab.getState().speaking, false);

    // stopAllSpeech() cancels speech
    window.KampaiMediaLab.speakSafe('ทดสอบหยุด');
    const prevStop2 = calls.kampaiStopSpeak;
    window.KampaiMediaLab.stopAllSpeech();
    assert.ok(calls.kampaiStopSpeak > prevStop2);
    assert.equal(window.KampaiMediaLab.getState().speaking, false);
  }

  // 2. Fallback to speechSynthesis when KAMPAI is absent
  {
    const { window, calls } = createDom({ withKampai: false, withSpeechSynthesis: true });
    window.eval(mediaRuntimeCode);
    const res = window.KampaiMediaLab.speakSafe('Hello world', { lang: 'en-US', rate: 0.95 });
    assert.equal(res.ok, true);
    assert.equal(calls.synthSpeak.length, 1);
    assert.equal(calls.synthSpeak[0].lang, 'en-US');
    assert.equal(calls.synthSpeak[0].rate, 0.95);
  }

  // 3. Clean failure without throwing when TTS is unavailable
  {
    const { window } = createDom({ withKampai: false, withSpeechSynthesis: false });
    window.eval(mediaRuntimeCode);
    const res = window.KampaiMediaLab.speakSafe('ไม่มีเสียง');
    assert.equal(res.ok, false);
    assert.equal(typeof res.reason, 'string');
    assert.ok(res.reason.length > 0);
    assert.equal(window.KampaiMediaLab.getState().speaking, false);
  }

  // 4. Empty text returns { ok: false, reason }
  {
    const { window } = createDom({ withKampai: true, withSpeechSynthesis: true });
    window.eval(mediaRuntimeCode);
    const res = window.KampaiMediaLab.speakSafe('   ');
    assert.equal(res.ok, false);
    assert.equal(typeof res.reason, 'string');
  }
});

test('KampaiMediaLab.getState() returns read-only JSON-serializable snapshot & supports reducedMotion, fontScale, projectorMode, and mode-change cancel', () => {
  const { window, calls } = createDom({
    html: '<!doctype html><html lang="th"><head></head><body><div id="media-root"></div></body></html>',
    reducedMotion: true,
    withKampai: true,
    withSpeechSynthesis: true,
  });

  window.MEDIA_CONFIG = {
    slug: 'sample-media',
    stateKey: 'SampleMedia',
    icon: '🧪',
    title: 'ตัวอย่าง',
    grade: 'ป.4',
    subject: 'วิทยาศาสตร์',
    kicker: 'ทดสอบ',
    objective: 'เข้าใจสถานะ',
    image: '/games/media-lab-assets/learning-scene.svg',
    scenes: [
      { icon: '1️⃣', label: 'ขั้น 1', title: 'ฉาก 1', body: 'เนื้อหา 1', tip: 'เคล็ดลับ 1', speak: 'เสียง 1' },
      { icon: '2️⃣', label: 'ขั้น 2', title: 'ฉาก 2', body: 'เนื้อหา 2', tip: 'เคล็ดลับ 2', speak: 'เสียง 2' },
    ],
    practice: {
      title: 'ฝึก',
      question: 'ข้อใดถูก',
      options: [{ label: 'ถูก', correct: true, explain: 'ดีมาก' }],
    },
  };

  window.eval(mediaRuntimeCode);

  assert.equal(window.document.body.classList.contains('reduced-motion'), true);

  // Legacy stateKey contract still works
  assert.ok(window.SampleMedia);
  assert.equal(window.SampleMedia.getState().mode, 'learn');

  // KampaiMediaLab.getState() snapshot
  const snap = window.KampaiMediaLab.getState();
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(snap.mode, 'learn');
  assert.equal(snap.fontScale, 1);
  assert.equal(snap.projectorMode, false);
  assert.equal(snap.reducedMotion, true);
  assert.equal(snap.speaking, false);
  assert.doesNotThrow(() => JSON.stringify(snap));

  // Mutating read-only snapshot must throw in strict mode
  assert.throws(() => {
    snap.mode = 'hacked';
  });

  // Font scale helper persists to localStorage
  window.KampaiMediaLab.setFontScale(1.2);
  assert.equal(window.KampaiMediaLab.getState().fontScale, 1.2);
  assert.equal(window.localStorage.getItem('kampai_media_font_scale'), '1.2');

  // Switching mode cancels active speech
  window.KampaiMediaLab.speakSafe('กำลังอ่าน');
  const stopBefore = calls.kampaiStopSpeak;
  const visualBtn = window.document.querySelector('[data-mode="visual"]');
  assert.ok(visualBtn);
  visualBtn.click();
  assert.ok(calls.kampaiStopSpeak > stopBefore);
  assert.equal(window.KampaiMediaLab.getState().mode, 'visual');
  assert.equal(window.KampaiMediaLab.getState().speaking, false);

  // Reduced motion toggle updates body class
  window.KampaiMediaLab.setReducedMotion(false);
  assert.equal(window.document.body.classList.contains('reduced-motion'), false);
  assert.equal(window.KampaiMediaLab.getState().reducedMotion, false);
});

test('KampaiClassroomTools supports Buzzer Team Battle (buzzTeam, A/L shortcuts, auto-pass, separated winner card, zero confirm) and rerollWheel()', () => {
  const { window, calls } = createDom({ withKampai: true, withSpeechSynthesis: true });
  window.eval(classroomToolsCode);

  assert.ok(window.KampaiClassroomTools, 'window.KampaiClassroomTools must be exposed');
  assert.ok(window.KampaiClassroom, 'window.KampaiClassroom legacy alias must be preserved');
  assert.equal(typeof window.KampaiClassroomTools.buzzTeam, 'function');
  assert.equal(typeof window.KampaiClassroomTools.rerollWheel, 'function');

  // 1. Spinner wheel & rerollWheel
  const items = Array.from({ length: 15 }, (_, i) => `คำที่ ${i + 1}`);
  window.KampaiClassroomTools.openWheel(items);
  assert.ok(window.document.getElementById('kampai-wheel-modal'));
  assert.doesNotThrow(() => window.KampaiClassroomTools.rerollWheel());
  window.KampaiClassroomTools.closeWheel();

  // 2. Buzzer Team Battle with questions & zero window.confirm
  const questions = [
    { prompt: '2 + 2 = ?', choices: ['3', '4', '5', '6'], correctIndex: 1 },
    { prompt: '3 + 3 = ?', choices: ['5', '6', '7', '8'], correctIndex: 1 },
  ];
  window.KampaiClassroomTools.openTeamBattle('ศึกคณิตศาสตร์', null, { questions, winScore: 20 });

  const modal = window.document.getElementById('kampai-battle-modal');
  assert.ok(modal);
  assert.ok(window.document.getElementById('battle-qa'));
  assert.ok(window.document.getElementById('battle-winner-card'));
  assert.notEqual(
    window.document.getElementById('battle-winner-card').parentElement,
    window.document.getElementById('battle-qa'),
    '#battle-winner-card must be separate from #battle-qa so reset never crashes',
  );

  // Buzz via API
  window.KampaiClassroomTools.buzzTeam('red');
  assert.equal(window.document.getElementById('buzzer-red-btn').classList.contains('is-buzzed'), true);

  // Buzz via keyboard L -> switches to blue
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'L', bubbles: true }));
  assert.equal(window.document.getElementById('buzzer-blue-btn').classList.contains('is-buzzed'), true);

  // Buzz via keyboard A -> switches to red
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
  assert.equal(window.document.getElementById('buzzer-red-btn').classList.contains('is-buzzed'), true);

  // Wrong answer auto-passes buzzer to the other team ('blue')
  const wrongBtn = Array.from(window.document.querySelectorAll('#battle-choices button'))
    .find((b) => b.dataset.correct === 'false');
  assert.ok(wrongBtn, 'wrong choice button should exist');
  wrongBtn.click();
  assert.equal(window.document.getElementById('buzzer-blue-btn').classList.contains('is-buzzed'), true);

  // Correct answer awards points to active team (blue)
  const rightBtn = Array.from(window.document.querySelectorAll('#battle-choices button'))
    .find((b) => b.dataset.correct === 'true');
  assert.ok(rightBtn, 'correct choice button should exist');
  rightBtn.click();
  assert.equal(Number(window.document.getElementById('kampai-score-blue').textContent), 10);

  // Reset works cleanly without window.confirm and restores #battle-qa
  assert.doesNotThrow(() => window.KampaiClassroomTools.resetTeamBattle());
  assert.equal(Number(window.document.getElementById('kampai-score-red').textContent), 0);
  assert.equal(Number(window.document.getElementById('kampai-score-blue').textContent), 0);
  assert.equal(window.document.getElementById('battle-winner-card').style.display, 'none');
  assert.equal(calls.confirm, 0, 'must never call window.confirm');
});
