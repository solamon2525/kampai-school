import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubDir = path.resolve(__dirname, '../../public/games/thai/thai-vocab-hub');

// Load data.js and vowel-morph.js in JSDOM
const dataJs = fs.readFileSync(path.join(hubDir, 'data.js'), 'utf8');
const morphJs = fs.readFileSync(path.join(hubDir, 'vowel-morph.js'), 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: 'dangerously' });
dom.window.eval(dataJs);
dom.window.eval(morphJs);

const presets = dom.window.ThaiVowelMorph?.getPresets?.() || [];
assert.ok(presets.length === 8, `Must have 8 presets, got ${presets.length}`);

let totalWords = 0;
for (const p of presets) {
  assert.ok(p.examples.length >= 10, `Preset ${p.id} must have >= 10 words, got ${p.examples.length}`);
  totalWords += p.examples.length;
}

assert.equal(totalWords, 200, `Total words across all 8 presets must be 200, got ${totalWords}`);

// Test selecting a word
dom.window.ThaiVowelMorph.open('เพลิน');
assert.equal(dom.window.ThaiVowelMorph.getCurrentWord(), 'เพลิน', 'Must set current word to เพลิน');

console.log(`✅ Task 3 Studio Expansion test passed: ${presets.length} presets with ${totalWords} total words!`);
