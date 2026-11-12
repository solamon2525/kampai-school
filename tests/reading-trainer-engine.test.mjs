import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

test('reading-trainer.js static checks: supports 6 sub-categories, thai numerals, and in-modal search', () => {
  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  // Verify filter names supported
  assert.ok(code.includes('mispronounced'), 'Missing mispronounced filter');
  assert.ok(code.includes('complex-spelling'), 'Missing complex-spelling filter');
  assert.ok(code.includes('pseudo-clusters'), 'Missing pseudo-clusters filter');
  assert.ok(code.includes('irregular-spelling'), 'Missing irregular-spelling filter');

  // Verify Thai numeral conversion helper
  assert.ok(code.includes('toThaiNumeral') || code.includes('๑๒๓๔๕๖๗๘๙๐'), 'Missing Thai numeral conversion');

  // Verify searchWord functionality
  assert.ok(code.includes('searchWord'), 'Missing in-modal searchWord method');
});

test('reading-trainer.js functional: Thai numerals, 6-category filtering, and in-modal search', () => {
  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  // Mock DOM environment
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
  });

  const { window } = dom;

  // Mock GAME_DATA with sample words for each category
  const mockDataset = [
    { word: 'ขะมักเขม้น', reading: 'ขะ-มัก-ขะ-เหม้น', meaning: 'ตั้งใจทำอย่างรีบเร่ง', sub_category: 'mispronounced', grade: 'ป.5' },
    { word: 'สัปดาห์', reading: 'สับ-ดา', meaning: 'ระยะเวลา 7 วัน', sub_category: 'mispronounced', grade: 'ป.4' },
    { word: 'ภาพยนตร์', reading: 'พาบ-พะ-ยน', meaning: 'หนัง', sub_category: 'complex-spelling', grade: 'ป.5' },
    { word: 'ทราย', reading: 'ซาย', meaning: 'เศษหินละเอียด', sub_category: 'pseudo-clusters', grade: 'ป.4' },
    { word: 'มลพิษ', reading: 'มน-ละ-พิด', meaning: 'พิษที่เกิดจากสิ่งแวดล้อม', sub_category: 'irregular-spelling', grade: 'ป.6' },
    { word: 'กรรไกร', reading: 'กัน-ไกร', meaning: 'เครื่องมือสำหรับตัด', sub_category: 'difficult', grade: 'ป.4' },
    { word: 'พระเนตร', reading: 'พระ-เนด', meaning: 'ดวงตา', sub_category: 'royal', grade: 'ป.5' },
  ];

  window.GAME_DATA = {
    words: {
      'reading-studio': mockDataset,
    },
  };

  // Mock AudioContext and SpeechSynthesis
  window.AudioContext = function () {
    return {
      state: 'running',
      currentTime: 0,
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      }),
      destination: {},
    };
  };

  window.speechSynthesis = {
    cancel: () => {},
    speak: () => {},
  };
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };

  // Execute reading-trainer.js
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = code;
  window.document.body.appendChild(scriptEl);

  const trainer = window.ThaiReadingTrainer;
  assert.ok(trainer, 'ThaiReadingTrainer should be mounted on window');

  // 1. Thai numeral testing
  assert.equal(typeof trainer.toThaiNumeral, 'function', 'trainer.toThaiNumeral must be exposed');
  assert.equal(trainer.toThaiNumeral(0), '๐');
  assert.equal(trainer.toThaiNumeral(520), '๕๒๐');
  assert.equal(trainer.toThaiNumeral(100), '๑๐๐');
  assert.equal(trainer.toThaiNumeral(60), '๖๐');

  // 2. Open modal and check structure
  trainer.open();

  const modal = window.document.getElementById('tvh-reading-modal');
  assert.ok(modal, 'Modal #tvh-reading-modal should exist in DOM');

  const searchInput = window.document.getElementById('reading-theater-search');
  assert.ok(searchInput, 'Search input #reading-theater-search should exist');

  const tabs = window.document.querySelectorAll('.reading-filter-tab');
  assert.equal(tabs.length, 7, 'Expected 7 filter tabs (all + 6 subcategories)');

  // 3. Test filtering by sub_category
  trainer.setFilter('mispronounced');
  const chipsWrapper = window.document.getElementById('reading-words-chips');
  const chipButtons = chipsWrapper.querySelectorAll('.reading-chip');
  assert.equal(chipButtons.length, 2, 'Should filter to 2 mispronounced words');
  assert.equal(chipButtons[0].textContent.trim(), 'ขะมักเขม้น');

  // 4. Test in-modal search
  assert.equal(typeof trainer.searchWord, 'function', 'trainer.searchWord must be a function');

  // Search by word
  trainer.setFilter('all');
  trainer.searchWord('ทราย');
  const searchedChips = chipsWrapper.querySelectorAll('.reading-chip');
  assert.equal(searchedChips.length, 1);
  assert.equal(searchedChips[0].textContent.trim(), 'ทราย');

  // Search by reading
  trainer.searchWord('พิด');
  const readingChips = chipsWrapper.querySelectorAll('.reading-chip');
  assert.equal(readingChips.length, 1);
  assert.equal(readingChips[0].textContent.trim(), 'มลพิษ');

  // Search non-matching query triggers empty state
  trainer.searchWord('คำที่ไม่มีในระบบxyz');
  const emptyChips = chipsWrapper.querySelectorAll('.reading-chip');
  assert.equal(emptyChips.length, 0, 'No chips should match non-existent query');
  const emptyStateEl = window.document.querySelector('.reading-empty-state');
  assert.ok(emptyStateEl, 'Empty state element should be rendered');
  assert.ok(emptyStateEl.textContent.includes('ไม่พบคำศัพท์ที่ตรงกับการค้นหา'), 'Empty state text rendered');

  // Verify nextStep/prevStep on empty search do not throw
  assert.doesNotThrow(() => trainer.nextStep(), 'nextStep should be a no-op on empty playlist');
  assert.doesNotThrow(() => trainer.prevStep(), 'prevStep should be a no-op on empty playlist');

  // Clear search restores all
  trainer.searchWord('');
  const allChips = chipsWrapper.querySelectorAll('.reading-chip');
  assert.equal(allChips.length, 7);

  trainer.close();
});
