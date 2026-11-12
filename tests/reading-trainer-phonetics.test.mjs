import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

function setupEnvironment() {
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
  const speakCalls = [];
  let cancelCalled = 0;
  window.speechSynthesis = {
    speak: (utt) => { speakCalls.push(utt); },
    cancel: () => { cancelCalled++; }
  };
  window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
  };

  // Mock sample dataset with test items
  window.GAME_DATA = {
    words: {
      'reading-studio': [
        {
          id: 'rs_409',
          word: 'ฉะเชิงเทรา',
          reading: 'ฉะ-เชิง-เซา',
          meaning: 'ชื่อจังหวัดหนึ่งในภาคตะวันออกของประเทศไทย',
          sub_category: 'pseudo-clusters',
          warning_hint: 'ระวัง: ทร ใน เทรา ออกเสียง ซ อ่านว่า ฉะ-เชิง-เซา',
          tts_reading: 'ฉะเชิงเซา'
        },
        {
          id: 'rs_test_phinthu',
          word: 'พฤศจิกายน',
          reading: 'พฺรึด-สะ-จิ-กา-ยน',
          meaning: 'ชื่อเดือนที่ ๑๑ ตามสุริยคติ',
          sub_category: 'difficult'
        },
        {
          id: 'rs_test_garan',
          word: 'จันทร์',
          reading: 'จัน-ทร์',
          meaning: 'ดวงจันทร์ หรือวันจันทร์',
          sub_category: 'complex-spelling'
        }
      ]
    }
  };

  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');
  window.eval(code);

  return { window, trainer: window.ThaiReadingTrainer, speakCalls };
}

test('1. buildTtsReading produces natural G2P pronunciation without broken syllable spaces', () => {
  const { trainer } = setupEnvironment();
  assert.ok(typeof trainer.buildTtsReading === 'function', 'buildTtsReading must be exposed on ThaiReadingTrainer');

  // Item with tts_reading override
  const itemWithTts = {
    word: 'ฉะเชิงเทรา',
    reading: 'ฉะ-เชิง-เซา',
    tts_reading: 'ฉะเชิงเซา'
  };
  assert.equal(trainer.buildTtsReading(itemWithTts), 'ฉะเชิงเซา');

  // Item with standard reading hyphenated syllables (without tts_reading override)
  const itemNoTts = {
    word: 'ฉะเชิงเทรา',
    reading: 'ฉะ-เชิง-เซา'
  };
  // Must produce "ฉะเชิงเซา" without spaces that turn "เซา" into "เซาะ"
  assert.equal(trainer.buildTtsReading(itemNoTts), 'ฉะเชิงเซา');
  assert.ok(!trainer.buildTtsReading(itemNoTts).includes(' '), 'buildTtsReading must not contain spaces separating syllables');
});

test('2. cleanSyllableForSpeech for isolated syllables avoids glottal cutoff /sawʔ/ (เซาะ)', () => {
  const { trainer } = setupEnvironment();
  assert.ok(typeof trainer.cleanSyllableForSpeech === 'function', 'cleanSyllableForSpeech must be exposed on ThaiReadingTrainer');

  // "เซา" in isolation is mapped to avoid TTS glottal cutoff
  const sylSpeech = trainer.cleanSyllableForSpeech('เซา');
  assert.equal(sylSpeech, 'ซาว', "cleanSyllableForSpeech('เซา') should map to 'ซาว'");

  // "เคา" in isolation is mapped to avoid TTS glottal cutoff
  assert.equal(trainer.cleanSyllableForSpeech('เคา'), 'คาว', "cleanSyllableForSpeech('เคา') should map to 'คาว'");

  // Normal syllables remain intact
  assert.equal(trainer.cleanSyllableForSpeech('ฉะ'), 'ฉะ');
  assert.equal(trainer.cleanSyllableForSpeech('เชิง'), 'เชิง');
});

test('3. buildTtsReading and cleanSyllableForSpeech strip phinthu (\u0e3a) and garan (\u0e4c)', () => {
  const { trainer } = setupEnvironment();

  // Test phinthu stripping
  const itemPhinthu = {
    word: 'พฤศจิกายน',
    reading: 'พฺรึด-สะ-จิ-กา-ยน'
  };
  const phinthuReading = trainer.buildTtsReading(itemPhinthu);
  assert.ok(!phinthuReading.includes('\u0e3a'), 'Phinthu \\u0e3a must be stripped from reading string');
  assert.equal(phinthuReading, 'พรึดสะจิกายน');

  // Test garan stripping
  const itemGaran = {
    word: 'จันทร์',
    reading: 'จัน-ทร์'
  };
  const garanReading = trainer.buildTtsReading(itemGaran);
  assert.ok(!garanReading.includes('\u0e4c'), 'Garan \\u0e4c must be stripped from reading string');
  assert.equal(garanReading, 'จันทร');

  // Syllable direct cleanup
  assert.equal(trainer.cleanSyllableForSpeech('พฺรึด'), 'พรึด');
  assert.equal(trainer.cleanSyllableForSpeech('ทร์'), 'ทร');
});

test('4. speakCurrent utters "${item.word} อ่านว่า ${ttsReading}" without broken spaces', () => {
  const { trainer, speakCalls } = setupEnvironment();

  trainer.open('ฉะเชิงเทรา', 'pseudo-clusters');
  speakCalls.length = 0;

  trainer.speakCurrent();

  assert.equal(speakCalls.length, 1, 'speakCurrent must trigger exactly one speech utterance');
  const utterance = speakCalls[0];
  assert.equal(utterance.text, 'ฉะเชิงเทรา อ่านว่า ฉะเชิงเซา');
  assert.ok(!utterance.text.includes('ฉะ เชิง เซา'), 'Speech text must not contain broken spaces between syllables');
});

test('5. speakSyllable utters cleaned syllable to avoid glottal cutoff', () => {
  const { trainer, speakCalls } = setupEnvironment();

  trainer.open('ฉะเชิงเทรา', 'pseudo-clusters');
  speakCalls.length = 0;

  trainer.speakSyllable('เซา');

  assert.equal(speakCalls.length, 1, 'speakSyllable must trigger speech utterance');
  const utterance = speakCalls[0];
  assert.equal(utterance.text, 'ซาว', "speakSyllable('เซา') should speak 'ซาว' to avoid glottal cutoff");
  assert.equal(utterance.rate, 0.8, 'speakSyllable rate should be 0.8');
});
