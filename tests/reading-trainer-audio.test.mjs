import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

test('reading-trainer.js audio mute guard and autoplay elimination', () => {
  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  // Verify code doesn't autoplay in Step 2 or Step 3
  assert.ok(!code.includes('// Speak the whole word upon entering step 2\n      speakThai('), 'Step 2 must not autoplay speech');
  assert.ok(!code.includes('// Speak the whole word with meaning\n      speakThai('), 'Step 3 must not autoplay speech');

  // Verify speakThai checks audio.enabled
  assert.ok(code.includes('if (!audio.enabled) return;'), 'speakThai must check audio.enabled');

  // Verify cancelSpeech or cancel on mute toggle
  assert.ok(code.includes('cancelSpeech') || code.includes('speechSynthesis.cancel()'), 'Must cancel speech on mute');
});

test('reading-trainer.js runtime mute behavior and on-demand speech', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });

  const { window } = dom;

  // Mock localStorage
  const store = {};
  const storageMock = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
  Object.defineProperty(window, 'localStorage', { value: storageMock, configurable: true });

  // Mock SpeechSynthesis
  let speakCalls = [];
  let cancelCalled = 0;
  window.speechSynthesis = {
    speak: (utt) => { speakCalls.push(utt.text); },
    cancel: () => { cancelCalled++; }
  };
  window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
  };

  // Mock dataset
  window.GAME_DATA = {
    words: {
      'reading-studio': [
        {
          id: 'rs_001',
          word: 'ขะมักเขม้น',
          reading: 'ขะ-มัก-ขะ-เม่น',
          meaning: 'ตั้งใจทำอย่างรีบเร่งไม่ยอมให้เสียเวลา',
          sub_category: 'mispronounced',
          warning_hint: 'ระวัง: มักอ่านผิดเป็น ขะ-มัก-เข-เม่น'
        }
      ]
    }
  };

  // Execute reading-trainer code in DOM window context
  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');
  window.eval(code);

  const trainer = window.ThaiReadingTrainer;
  assert.ok(trainer, 'ThaiReadingTrainer must be exposed');

  // 1. Open modal
  trainer.open('ขะมักเขม้น', 'all');
  speakCalls = [];

  // 2. Step 1 -> Step 2: must NOT autoplay speech
  trainer.nextStep(); // Goes to Step 2
  assert.equal(speakCalls.length, 0, 'Entering Step 2 must not autoplay TTS');

  // 3. Step 2 -> Step 3: must NOT autoplay speech
  trainer.nextStep(); // Goes to Step 3
  assert.equal(speakCalls.length, 0, 'Entering Step 3 must not autoplay TTS');

  // 4. On-demand speech when audio is enabled
  trainer.speakCurrent();
  assert.ok(speakCalls.length >= 1, 'Manual speakCurrent() should speak when audio is enabled');
  assert.ok(speakCalls[0].includes('ขะมักเขม้น'), 'Spoken text should include word');
  speakCalls = [];

  // 5. Test mute toggle button
  const audioBtn = window.document.getElementById('btn-reading-audio-toggle');
  assert.ok(audioBtn, 'Audio button must exist');

  // Click mute
  audioBtn.click(); // Should become 🔇 ปิดเสียง
  assert.ok(audioBtn.textContent.includes('ปิดเสียง'), 'Button text should be 🔇 ปิดเสียง');
  assert.ok(cancelCalled > 0, 'Clicking mute must cancel active speech');

  // While muted: manual speech should be blocked
  speakCalls = [];
  trainer.speakCurrent();
  trainer.speakSyllable('ขะ');
  assert.equal(speakCalls.length, 0, 'Speech must be completely blocked while muted');

  // Step transitions while muted must also not speak
  trainer.resetStep();
  trainer.nextStep();
  trainer.nextStep();
  assert.equal(speakCalls.length, 0, 'No speech while muted');

  // Click un-mute
  audioBtn.click(); // Should become 🔊 เสียง
  assert.ok(audioBtn.textContent.includes('เสียง'), 'Button text should be 🔊 เสียง');

  // While unmuted: manual speech works again
  speakCalls = [];
  trainer.speakCurrent();
  assert.equal(speakCalls.length, 1, 'Manual speech should work after unmuting');
});
