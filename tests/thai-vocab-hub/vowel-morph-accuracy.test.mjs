import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubDir = path.resolve(__dirname, '../../public/games/thai/thai-vocab-hub');

const morphJs = fs.readFileSync(path.join(hubDir, 'vowel-morph.js'), 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  runScripts: 'dangerously',
  url: 'http://localhost/',
});
const { window } = dom;

let speakCalls = [];
let cancelCount = 0;
window.speechSynthesis = {
  speak: (utt) => speakCalls.push(utt.text),
  cancel: () => { cancelCount++; },
};
window.SpeechSynthesisUtterance = function (text) {
  this.text = text;
  this.lang = '';
  this.rate = 1;
};

window.eval(morphJs);

// Open modal
window.ThaiVowelMorph.open();
const modal = window.document.getElementById('tvh-morph-modal');
assert.ok(modal, 'Morph modal must be created');

// 1. Check no JSX comments leaked into DOM
const modalText = modal.textContent || '';
assert.ok(!modalText.includes('{/*') && !modalText.includes('*/}'), 'Modal must not contain literal JSX comment markers');

// 2. Verify all 8 presets and all 200 words render accurately on Step 3
const presets = window.ThaiVowelMorph.getPresets();
assert.equal(presets.length, 8, 'Must have 8 presets');

let totalWords = 0;
for (let pIdx = 0; pIdx < presets.length; pIdx++) {
  const preset = presets[pIdx];
  window.ThaiVowelMorph.selectPreset(pIdx);
  const seen = new Set();

  for (let eIdx = 0; eIdx < preset.examples.length; eIdx++) {
    const ex = preset.examples[eIdx];
    totalWords++;
    assert.ok(!seen.has(ex.word), `Duplicate word "${ex.word}" in preset ${preset.id}`);
    seen.add(ex.word);

    window.ThaiVowelMorph.selectExample(eIdx);
    window.ThaiVowelMorph.nextStep(); // Step 2
    window.ThaiVowelMorph.nextStep(); // Step 3

    const stage = window.document.getElementById('morph-stage-screen');
    // Extract visible characters in Thai logical Unicode order (base consonant before upper mark)
    const clone = stage.cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
    clone.querySelectorAll('.char-initial-slot').forEach(slot => {
      const mark = slot.querySelector('.char-morphed-top, .char-upper-base');
      const base = slot.querySelector('.char-initial');
      if (mark && base) slot.insertBefore(base, mark);
    });
    const renderedWord = (clone.textContent || '').replace(/\s+/g, '');

    assert.equal(
      renderedWord,
      ex.word,
      `Preset ${preset.id} [${eIdx}] "${ex.word}" rendered "${renderedWord}" on stage`
    );

    if (preset.id === 'ae_to_taikhu') {
      assert.ok(ex.word.includes('แ') && ex.word.includes('็'), `ae_to_taikhu word "${ex.word}" must contain แ and ็`);
      assert.ok(!/[\u0e48\u0e49\u0e4a\u0e4b]/.test(ex.word), `ae_to_taikhu word "${ex.word}" must not have tone marks`);
    }
  }
}
assert.equal(totalWords, 200, `Total words must be 200, got ${totalWords}`);

// 3. Verify equation and speech format
window.ThaiVowelMorph.open('แกร็น');
const eqText = window.document.getElementById('eq-spelling').textContent;
assert.equal(eqText, 'กอ - รอ - แอะ - นอ = แกร็น');

speakCalls = [];
window.ThaiVowelMorph.speakCurrent();
assert.equal(speakCalls.length, 1);
assert.ok(!speakCalls[0].includes('=') && !speakCalls[0].includes('-'), 'Speech text must not contain raw = or - symbols');
assert.ok(speakCalls[0].includes('อ่านว่า แกร็น'), 'Speech text must include อ่านว่า แกร็น');

// 4. Verify mute button blocks speech and cancels active speech
const audioBtn = window.document.getElementById('btn-morph-audio-toggle');
const prevCancel = cancelCount;
audioBtn.click(); // Mute
assert.ok(cancelCount > prevCancel, 'Muting must cancel active speech');
assert.equal(audioBtn.textContent, '🔇 ปิดเสียง');

speakCalls = [];
window.ThaiVowelMorph.speakCurrent();
assert.equal(speakCalls.length, 0, 'Muted state must block speakCurrent');

window.ThaiVowelMorph.nextStep(); // Step 2
window.ThaiVowelMorph.nextStep(); // Step 3
assert.equal(speakCalls.length, 0, 'Muted state must block Step 3 auto-speak');

console.log(`✅ Vowel Morph accuracy test passed: 8 presets, ${totalWords}/200 words matched stage 100%, 0 comment leaks, mute guard verified!`);
